'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { ActionState } from '@/lib/types'

const listSchema = z.object({
  title: z.string().min(1, 'O título é obrigatório.').max(200),
  couple_names: z.string().max(200).optional(),
  intro_message: z.string().max(2000).optional(),
  event_date: z.string().optional(),
})

async function getAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return { supabase, user }
}

export async function createListAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = listSchema.safeParse({
    title: formData.get('title'),
    couple_names: formData.get('couple_names') || undefined,
    intro_message: formData.get('intro_message') || undefined,
    event_date: formData.get('event_date') || undefined,
  })

  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { supabase, user } = await getAuthenticatedUser()

  const { data, error } = await supabase
    .from('lists')
    .insert({ ...parsed.data, owner_id: user.id })
    .select('id')
    .single()

  if (error) return { error: error.message }

  redirect(`/lists/${data.id}`)
}

export async function updateListAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const listId = formData.get('list_id') as string
  if (!listId) return { error: 'ID da lista ausente.' }

  const parsed = listSchema.safeParse({
    title: formData.get('title'),
    couple_names: formData.get('couple_names') || undefined,
    intro_message: formData.get('intro_message') || undefined,
    event_date: formData.get('event_date') || undefined,
  })

  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { supabase } = await getAuthenticatedUser()

  const { error } = await supabase
    .from('lists')
    .update(parsed.data)
    .eq('id', listId)

  if (error) return { error: error.message }

  revalidatePath(`/lists/${listId}`)
  redirect(`/lists/${listId}`)
}

export async function toggleListStatusAction(formData: FormData) {
  const listId = formData.get('list_id') as string
  const newStatus = formData.get('status') as 'open' | 'closed'

  const { supabase } = await getAuthenticatedUser()
  await supabase.from('lists').update({ status: newStatus }).eq('id', listId)

  revalidatePath(`/lists/${listId}`)
}

export async function deleteListAction(formData: FormData) {
  const listId = formData.get('list_id') as string
  const { supabase } = await getAuthenticatedUser()
  await supabase.from('lists').delete().eq('id', listId)
  revalidatePath('/dashboard')
  redirect('/dashboard')
}
