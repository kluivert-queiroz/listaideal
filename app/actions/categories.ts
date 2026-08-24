'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { CATEGORY_NAME_REGEX, normalizeCategoryName } from '@/lib/gift-sections'
import type { ActionState } from '@/lib/types'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'O nome da categoria é obrigatório.')
    .max(60, 'A categoria deve ter no máximo 60 caracteres.')
    .regex(CATEGORY_NAME_REGEX, 'A categoria contém caracteres inválidos.'),
})

const UNIQUE_VIOLATION = '23505'

async function getAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return { supabase, user }
}

async function assertListOwnership(
  supabase: SupabaseServerClient,
  listId: string,
  userId: string
) {
  const { data: list } = await supabase
    .from('lists')
    .select('id')
    .eq('id', listId)
    .eq('owner_id', userId)
    .single()
  return !!list
}

export async function createCategoryAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const listId = formData.get('list_id') as string
  if (!listId) return { error: 'ID da lista ausente.' }

  const parsed = categorySchema.safeParse({ name: formData.get('name') })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { supabase, user } = await getAuthenticatedUser()

  if (!(await assertListOwnership(supabase, listId, user.id))) {
    return { error: 'Lista não encontrada.' }
  }

  const { count } = await supabase
    .from('gift_categories')
    .select('*', { count: 'exact', head: true })
    .eq('list_id', listId)

  const { error } = await supabase.from('gift_categories').insert({
    list_id: listId,
    name: parsed.data.name,
    display_order: (count ?? 0) + 1,
  })

  if (error) {
    if (error.code === UNIQUE_VIOLATION) return { error: 'Essa categoria já existe.' }
    return { error: error.message }
  }

  revalidatePath(`/lists/${listId}`)
  return { success: 'Categoria criada.' }
}

export async function renameCategoryAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const categoryId = formData.get('category_id') as string
  const listId = formData.get('list_id') as string
  if (!categoryId || !listId) return { error: 'IDs ausentes.' }

  const parsed = categorySchema.safeParse({ name: formData.get('name') })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { supabase, user } = await getAuthenticatedUser()

  if (!(await assertListOwnership(supabase, listId, user.id))) {
    return { error: 'Lista não encontrada.' }
  }

  const { error } = await supabase
    .from('gift_categories')
    .update({ name: parsed.data.name })
    .eq('id', categoryId)
    .eq('list_id', listId)

  if (error) {
    if (error.code === UNIQUE_VIOLATION) return { error: 'Essa categoria já existe.' }
    return { error: error.message }
  }

  revalidatePath(`/lists/${listId}`)
  return { success: 'Categoria atualizada.' }
}

export async function deleteCategoryAction(formData: FormData) {
  const categoryId = formData.get('category_id') as string
  const listId = formData.get('list_id') as string

  const { supabase, user } = await getAuthenticatedUser()

  if (!(await assertListOwnership(supabase, listId, user.id))) return

  await supabase.from('gift_categories').delete().eq('id', categoryId).eq('list_id', listId)

  revalidatePath(`/lists/${listId}`)
}

export async function reorderCategoryAction(formData: FormData) {
  const categoryId = formData.get('category_id') as string
  const listId = formData.get('list_id') as string
  const direction = formData.get('direction') as 'up' | 'down'

  const { supabase, user } = await getAuthenticatedUser()

  if (!(await assertListOwnership(supabase, listId, user.id))) return

  const { data: categories } = await supabase
    .from('gift_categories')
    .select('id, display_order')
    .eq('list_id', listId)
    .order('display_order', { ascending: true })

  if (!categories) return

  const idx = categories.findIndex((c) => c.id === categoryId)
  const swapIdx = direction === 'up' ? idx - 1 : idx + 1

  if (idx < 0 || swapIdx < 0 || swapIdx >= categories.length) return

  const a = categories[idx]
  const b = categories[swapIdx]

  await supabase
    .from('gift_categories')
    .update({ display_order: b.display_order })
    .eq('id', a.id)

  await supabase
    .from('gift_categories')
    .update({ display_order: a.display_order })
    .eq('id', b.id)

  revalidatePath(`/lists/${listId}`)
}

/**
 * Resolves a raw category name (from the gift form combobox) to a category id,
 * scoped to the given list. Matches existing names case-insensitively in JS —
 * never via `.ilike()`, which would let `%`/`_` in the input act as wildcards.
 * Creates a new category row if no match exists. Returns null for an empty name.
 */
export async function resolveCategoryId(
  supabase: SupabaseServerClient,
  listId: string,
  rawName: string | null | undefined
): Promise<string | null> {
  const name = normalizeCategoryName(rawName)
  if (!name) return null

  const { data: categories } = await supabase
    .from('gift_categories')
    .select('id, name, display_order')
    .eq('list_id', listId)

  const existing = (categories ?? []).find(
    (c) => c.name.toLocaleLowerCase() === name.toLocaleLowerCase()
  )
  if (existing) return existing.id

  const nextOrder = (categories ?? []).length + 1

  const { data: created, error } = await supabase
    .from('gift_categories')
    .insert({ list_id: listId, name, display_order: nextOrder })
    .select('id')
    .single()

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      // Concurrent insert of the same name — re-select and match in JS
      // (never `.ilike()`: it treats `%`/`_` in user input as wildcards).
      const { data: retry } = await supabase
        .from('gift_categories')
        .select('id, name')
        .eq('list_id', listId)
      const winner = (retry ?? []).find(
        (c) => c.name.toLocaleLowerCase() === name.toLocaleLowerCase()
      )
      return winner?.id ?? null
    }
    throw error
  }

  return created.id
}
