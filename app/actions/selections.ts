'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { sanitizeUserText } from '@/lib/text'

const submitSchema = z.object({
  guest_name: z.string().trim().min(1, 'Seu nome é obrigatório.').max(200),
  message: z.string().trim().max(1000).optional(),
  list_token: z.string().min(1),
  gift_ids: z.array(z.string().uuid()).min(1, 'Selecione pelo menos um presente.'),
})

export type SubmitSelectionsResult =
  | { error: string }
  | {
      guest_name: string
      reserved: string[]
      unavailable: string[]
    }

export async function submitSelectionsAction(
  _prev: unknown,
  formData: FormData
): Promise<SubmitSelectionsResult> {
  const rawGiftIds = formData.getAll('gift_ids') as string[]

  const parsed = submitSchema.safeParse({
    guest_name: formData.get('guest_name'),
    message: formData.get('message') || undefined,
    list_token: formData.get('list_token'),
    gift_ids: rawGiftIds,
  })

  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const guest_name = sanitizeUserText(parsed.data.guest_name)
  const message = parsed.data.message ? sanitizeUserText(parsed.data.message) : undefined
  const { list_token, gift_ids } = parsed.data
  const supabase = createServiceClient()

  // Verify the list exists, is open, and all gift_ids belong to it.
  // share_token is read back from the DB (never from raw form input) because it
  // is used below to build the revalidatePath call.
  const { data: list } = await supabase
    .from('lists')
    .select('id, status, share_token')
    .eq('share_token', list_token)
    .single()

  if (!list) return { error: 'Lista não encontrada.' }
  if (list.status === 'closed')
    return { error: 'Esta lista não está mais aceitando escolhas.' }

  const { data: gifts } = await supabase
    .from('gifts')
    .select('id, name')
    .eq('list_id', list.id)
    .in('id', gift_ids)

  if (!gifts || gifts.length !== gift_ids.length) {
    return { error: 'Um ou mais presentes selecionados são inválidos.' }
  }

  const giftNameById = Object.fromEntries(gifts.map((g) => [g.id, g.name]))
  const reserved: string[] = []
  const unavailable: string[] = []

  // Claim slots one by one — each call is atomic via FOR UPDATE inside the function
  for (const giftId of gift_ids) {
    const { data, error } = await supabase.rpc('claim_gift_slot', {
      p_gift_id: giftId,
      p_guest_name: guest_name,
    })

    if (error || !data?.success) {
      unavailable.push(giftNameById[giftId])
    } else {
      reserved.push(giftNameById[giftId])
    }
  }

  // BR-7: a message exists only if the guest supplied text AND reserved at least
  // one gift. Blocks empty cards, and blocks using the public form as a
  // message-only spam channel.
  if (reserved.length > 0) {
    if (message) {
      const { error: messageError } = await supabase
        .from('list_messages')
        .insert({ list_id: list.id, guest_name, message })
      // A failed message insert must never undo a successful reservation.
      if (messageError) console.error('list_messages insert failed', messageError)
    }

    // Refreshes the current guest's own view (see selection-form.tsx for why this
    // matters even though the route has no prerender entry): the RSC tree behind
    // the form's step state re-renders with the new message, so the guest who
    // just submitted sees it appear. Literal path, so `type` is omitted.
    revalidatePath(`/list/${list.share_token}`)
  }

  return { guest_name, reserved, unavailable }
}
