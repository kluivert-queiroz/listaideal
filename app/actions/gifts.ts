'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { ActionState } from '@/lib/types'

const giftSchema = z.object({
  name: z.string().min(1, 'O nome do presente é obrigatório.').max(300),
  description: z.string().max(1000).optional(),
  image_url: z.string().url('A imagem deve ser uma URL válida.').or(z.literal('')).optional(),
  store_url: z.string().url('O link da loja deve ser uma URL válida.').or(z.literal('')).optional(),
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
    max_count: formData.get('max_count'),
  })

  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { supabase } = await getAuthenticatedUser()

  // Assign display_order as the next slot in this list
  const { count } = await supabase
    .from('gifts')
    .select('*', { count: 'exact', head: true })
    .eq('list_id', listId)

  const { error } = await supabase.from('gifts').insert({
    ...parsed.data,
    image_url: parsed.data.image_url || null,
    store_url: parsed.data.store_url || null,
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
    max_count: formData.get('max_count'),
  })

  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { supabase } = await getAuthenticatedUser()

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

  const { error } = await supabase
    .from('gifts')
    .update({
      ...parsed.data,
      image_url: parsed.data.image_url || null,
      store_url: parsed.data.store_url || null,
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
    .select('id, display_order')
    .eq('list_id', listId)
    .order('display_order', { ascending: true })

  if (!gifts) return

  const idx = gifts.findIndex((g) => g.id === giftId)
  const swapIdx = direction === 'up' ? idx - 1 : idx + 1

  if (swapIdx < 0 || swapIdx >= gifts.length) return

  const a = gifts[idx]
  const b = gifts[swapIdx]

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
