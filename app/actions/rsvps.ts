'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { sanitizeUserText } from '@/lib/text'
import { RSVP_MAX_GUEST_COUNT, RSVP_MIN_GUEST_COUNT } from '@/lib/rsvp'

const rsvpSchema = z.object({
  guest_name: z.string().trim().min(1, 'Seu nome é obrigatório.').max(200),
  list_token: z.string().min(1),
  is_attending: z.enum(['yes', 'no']),
  guest_count: z.coerce
    .number()
    .int()
    .min(RSVP_MIN_GUEST_COUNT)
    .max(RSVP_MAX_GUEST_COUNT)
    .optional(),
})

export type SubmitRsvpResult =
  | { error: string }
  | {
      guest_name: string
      is_attending: boolean
      guest_count: number
    }

export async function submitRsvpAction(
  _prev: unknown,
  formData: FormData
): Promise<SubmitRsvpResult> {
  const parsed = rsvpSchema.safeParse({
    guest_name: formData.get('guest_name'),
    list_token: formData.get('list_token'),
    is_attending: formData.get('is_attending'),
    guest_count: formData.get('guest_count') || undefined,
  })

  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const is_attending = parsed.data.is_attending === 'yes'
  if (is_attending && parsed.data.guest_count == null) {
    return { error: 'Informe quantas pessoas vêm com você.' }
  }

  const guest_name = sanitizeUserText(parsed.data.guest_name)
  const guest_count = is_attending ? parsed.data.guest_count! : 0
  const supabase = createServiceClient()

  // list_id is resolved server-side from share_token — never trusted from the
  // client — same as selections.ts/messages.ts. RSVP intentionally ignores
  // list.status: it's event-logistics, not gift-inventory, so it stays open
  // the same way "Mensagens de carinho" does on a closed list (FR-5.10).
  const { data: list } = await supabase
    .from('lists')
    .select('id, share_token')
    .eq('share_token', parsed.data.list_token)
    .single()

  if (!list) return { error: 'Lista não encontrada.' }

  // Atomic upsert-by-name (case-insensitive) via the DB function — a single
  // INSERT ... ON CONFLICT ... DO UPDATE, so there's no client-visible race
  // window between checking for an existing RSVP and writing one.
  const { data, error } = await supabase.rpc('upsert_rsvp', {
    p_list_id: list.id,
    p_guest_name: guest_name,
    p_is_attending: is_attending,
    p_guest_count: guest_count,
  })

  if (error || !data) {
    return { error: 'Não foi possível confirmar sua presença. Tente novamente.' }
  }

  revalidatePath(`/list/${list.share_token}`)

  return {
    guest_name: data.guest_name,
    is_attending: data.is_attending,
    guest_count: data.guest_count,
  }
}
