'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { sanitizeUserText } from '@/lib/text'
import type { ActionState } from '@/lib/types'

const listSchema = z.object({
  title: z.string().trim().min(1, 'O título é obrigatório.').max(200),
  honoree_names: z.string().max(200),
  headline: z.string().max(160),
  kicker: z.string().max(120),
  intro_message: z.string().max(2000),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.').or(z.literal('')),
  event_time: z.string().regex(/^\d{2}:\d{2}$/, 'Hora inválida.').or(z.literal('')),
  venue_name: z.string().max(160),
  venue_address: z.string().max(200),
  venue_city: z.string().max(120),
})

/** Reads a FormData field as a plain string, never null/undefined. */
function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '')
}

/**
 * '' becomes null (so an update can actually clear a column instead of the key
 * being silently dropped from the payload), everything else is sanitized text.
 */
function normalize(raw: string): string | null {
  const sanitized = sanitizeUserText(raw)
  return sanitized === '' ? null : sanitized
}

function readListInput(formData: FormData) {
  return listSchema.safeParse({
    title: str(formData, 'title'),
    honoree_names: str(formData, 'honoree_names'),
    headline: str(formData, 'headline'),
    kicker: str(formData, 'kicker'),
    intro_message: str(formData, 'intro_message'),
    event_date: str(formData, 'event_date'),
    event_time: str(formData, 'event_time'),
    venue_name: str(formData, 'venue_name'),
    venue_address: str(formData, 'venue_address'),
    venue_city: str(formData, 'venue_city'),
  })
}

function buildListPayload(data: z.infer<typeof listSchema>) {
  return {
    title: sanitizeUserText(data.title),
    honoree_names: normalize(data.honoree_names),
    headline: normalize(data.headline),
    kicker: normalize(data.kicker),
    intro_message: normalize(data.intro_message),
    event_date: data.event_date === '' ? null : data.event_date,
    event_time: data.event_time === '' ? null : data.event_time,
    venue_name: normalize(data.venue_name),
    venue_address: normalize(data.venue_address),
    venue_city: normalize(data.venue_city),
  }
}

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
  const parsed = readListInput(formData)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { supabase, user } = await getAuthenticatedUser()

  const { data, error } = await supabase
    .from('lists')
    .insert({ ...buildListPayload(parsed.data), owner_id: user.id })
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

  const parsed = readListInput(formData)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { supabase, user } = await getAuthenticatedUser()

  const { data, error } = await supabase
    .from('lists')
    .update(buildListPayload(parsed.data))
    .eq('id', listId)
    .eq('owner_id', user.id)
    .select('share_token')
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/lists/${listId}`)
  // Editing a list must be reflected immediately on the guest-facing page.
  revalidatePath(`/list/${data.share_token}`)
  redirect(`/lists/${listId}`)
}

export async function toggleListStatusAction(formData: FormData) {
  const listId = formData.get('list_id') as string
  const newStatus = formData.get('status') as 'open' | 'closed'

  const { supabase } = await getAuthenticatedUser()
  const { data } = await supabase
    .from('lists')
    .update({ status: newStatus })
    .eq('id', listId)
    .select('share_token')
    .single()

  revalidatePath(`/lists/${listId}`)
  if (data) revalidatePath(`/list/${data.share_token}`)
}

export async function deleteListAction(formData: FormData) {
  const listId = formData.get('list_id') as string
  const { supabase } = await getAuthenticatedUser()

  // share_token must be read before the row is gone, or the guest page can never
  // be revalidated after this delete.
  const { data: list } = await supabase
    .from('lists')
    .select('share_token')
    .eq('id', listId)
    .single()

  await supabase.from('lists').delete().eq('id', listId)

  revalidatePath('/dashboard')
  if (list) revalidatePath(`/list/${list.share_token}`)
  redirect('/dashboard')
}
