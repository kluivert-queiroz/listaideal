'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { resolveCategoryId } from '@/app/actions/categories'
import { CATEGORY_NAME_REGEX } from '@/lib/gift-sections'
import type { ActionState } from '@/lib/types'

const giftSchema = z.object({
  name: z.string().min(1, 'O nome do presente é obrigatório.').max(300),
  description: z.string().max(1000).optional(),
  image_url: z.string().url('A imagem deve ser uma URL válida.').or(z.literal('')).optional(),
  store_url: z.string().url('O link da loja deve ser uma URL válida.').or(z.literal('')).optional(),
  price: z.coerce
    .number()
    .positive('O preço deve ser maior que zero.')
    .optional(),
  category: z
    .string()
    .trim()
    .max(60, 'A categoria deve ter no máximo 60 caracteres.')
    .regex(CATEGORY_NAME_REGEX, 'A categoria contém caracteres inválidos.')
    .or(z.literal(''))
    .optional(),
  max_count: z.coerce
    .number()
    .int('A quantidade máxima deve ser um número inteiro.')
    .min(1, 'A quantidade máxima deve ser pelo menos 1.'),
})

async function getAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return { supabase, user }
}

async function assertListOwnership(
  supabase: Awaited<ReturnType<typeof createClient>>,
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

export async function createGiftAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const listId = formData.get('list_id') as string
  if (!listId) return { error: 'ID da lista ausente.' }

  const parsed = giftSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    image_url: formData.get('image_url') || undefined,
    store_url: formData.get('store_url') || undefined,
    price: formData.get('price') || undefined,
    category: formData.get('category') || undefined,
    max_count: formData.get('max_count'),
  })

  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { supabase, user } = await getAuthenticatedUser()

  if (!(await assertListOwnership(supabase, listId, user.id))) {
    return { error: 'Lista não encontrada.' }
  }

  const { name, description, image_url, store_url, price, category, max_count } = parsed.data

  const categoryId = await resolveCategoryId(supabase, listId, category)

  // Assign display_order as the next slot in this list
  const { count } = await supabase
    .from('gifts')
    .select('*', { count: 'exact', head: true })
    .eq('list_id', listId)

  const { error } = await supabase.from('gifts').insert({
    name,
    description,
    max_count,
    image_url: image_url || null,
    store_url: store_url || null,
    price: price ?? null,
    category_id: categoryId,
    list_id: listId,
    display_order: (count ?? 0) + 1,
  })

  if (error) return { error: error.message }

  revalidatePath(`/lists/${listId}`)
  return { success: 'Presente adicionado.' }
}

export async function updateGiftAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const giftId = formData.get('gift_id') as string
  const listId = formData.get('list_id') as string
  if (!giftId || !listId) return { error: 'IDs ausentes.' }

  const parsed = giftSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    image_url: formData.get('image_url') || undefined,
    store_url: formData.get('store_url') || undefined,
    price: formData.get('price') || undefined,
    category: formData.get('category') || undefined,
    max_count: formData.get('max_count'),
  })

  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { supabase, user } = await getAuthenticatedUser()

  if (!(await assertListOwnership(supabase, listId, user.id))) {
    return { error: 'Lista não encontrada.' }
  }

  // Enforce BR-5: max_count cannot go below current slots_used
  const { count: slotsUsed } = await supabase
    .from('selections')
    .select('*', { count: 'exact', head: true })
    .eq('gift_id', giftId)

  if (parsed.data.max_count < (slotsUsed ?? 0)) {
    return {
      error: `A quantidade máxima não pode ser menor que as ${slotsUsed} escolhas já feitas.`,
    }
  }

  const { name, description, image_url, store_url, price, category, max_count } = parsed.data

  const categoryId = await resolveCategoryId(supabase, listId, category)

  const { error } = await supabase
    .from('gifts')
    .update({
      name,
      description,
      max_count,
      image_url: image_url || null,
      store_url: store_url || null,
      price: price ?? null,
      category_id: categoryId,
    })
    .eq('id', giftId)

  if (error) return { error: error.message }

  revalidatePath(`/lists/${listId}`)
  return { success: 'Presente atualizado.' }
}

export async function deleteGiftAction(formData: FormData) {
  const giftId = formData.get('gift_id') as string
  const listId = formData.get('list_id') as string

  const { supabase } = await getAuthenticatedUser()
  await supabase.from('gifts').delete().eq('id', giftId)

  revalidatePath(`/lists/${listId}`)
}

export async function reorderGiftAction(formData: FormData) {
  const giftId = formData.get('gift_id') as string
  const listId = formData.get('list_id') as string
  const direction = formData.get('direction') as 'up' | 'down'

  const { supabase } = await getAuthenticatedUser()

  const { data: gifts } = await supabase
    .from('gifts')
    .select('id, display_order, category_id')
    .eq('list_id', listId)
    .order('display_order', { ascending: true })

  if (!gifts) return

  const target = gifts.find((g) => g.id === giftId)
  if (!target) return

  // Reorder only within the same section (category), otherwise the swap
  // either jumps the gift into a different section or is visually a no-op.
  const siblings = gifts.filter((g) => g.category_id === target.category_id)

  const idx = siblings.findIndex((g) => g.id === giftId)
  const swapIdx = direction === 'up' ? idx - 1 : idx + 1

  if (swapIdx < 0 || swapIdx >= siblings.length) return

  const a = siblings[idx]
  const b = siblings[swapIdx]

  await supabase
    .from('gifts')
    .update({ display_order: b.display_order })
    .eq('id', a.id)

  await supabase
    .from('gifts')
    .update({ display_order: a.display_order })
    .eq('id', b.id)

  revalidatePath(`/lists/${listId}`)
}
