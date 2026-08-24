'use server'

import { revalidatePath } from 'next/cache'
import { getAuthenticatedUser } from '@/lib/auth-guards'

/**
 * Hides/unhides one guest message on the public page (FR-4.4). A separate file
 * from selections.ts: that one is the anonymous public write path, this one is
 * authenticated — keeping them apart keeps the auth boundary obvious.
 */
export async function toggleMessageVisibilityAction(formData: FormData) {
  const messageId = formData.get('message_id') as string
  const listId = formData.get('list_id') as string
  // Target state is submitted by the form, not toggled from a read, so two fast
  // clicks can't race into the wrong state.
  const isHidden = formData.get('is_hidden') === 'true'
  if (!messageId || !listId) return

  const { supabase, user } = await getAuthenticatedUser()

  // Ownership from the DB, identity from the session. Also gets share_token so
  // the public page can be revalidated without a second query.
  const { data: list } = await supabase
    .from('lists')
    .select('id, share_token')
    .eq('id', listId)
    .eq('owner_id', user.id)
    .single()
  if (!list) return

  await supabase
    .from('list_messages')
    .update({ is_hidden: isHidden })
    .eq('id', messageId)
    .eq('list_id', listId) // belt-and-braces on top of RLS

  revalidatePath(`/lists/${listId}`)
  revalidatePath(`/list/${list.share_token}`) // the one that makes a hide take effect
}
