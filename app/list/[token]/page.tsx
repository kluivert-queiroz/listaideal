import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { SelectionForm } from '@/components/guest/selection-form'
import { MessagesSection } from '@/components/guest/messages-section'
import { MESSAGES_FETCH_LIMIT } from '@/lib/messages'
import type { GiftWithSlots, PublicMessage } from '@/lib/types'

export default async function GuestListPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = createServiceClient()

  const { data: list } = await supabase
    .from('lists')
    .select('*')
    .eq('share_token', token)
    .single()

  if (!list) notFound()

  const { data: gifts } = await supabase
    .from('gifts')
    .select('*')
    .eq('list_id', list.id)
    .order('display_order', { ascending: true })

  const giftIds = (gifts ?? []).map((g) => g.id)

  const { data: categories } = await supabase
    .from('gift_categories')
    .select('*')
    .eq('list_id', list.id)
    .order('display_order', { ascending: true })

  const { data: selectionRows } = await supabase
    .from('selections')
    .select('gift_id')
    .in('gift_id', giftIds)

  const countMap = (selectionRows ?? []).reduce(
    (acc, s) => ({ ...acc, [s.gift_id]: (acc[s.gift_id] ?? 0) + 1 }),
    {} as Record<string, number>
  )

  const giftsWithSlots: GiftWithSlots[] = (gifts ?? []).map((g) => ({
    ...g,
    slots_used: countMap[g.id] ?? 0,
  }))

  // Only expose available gifts to guests (BR-2)
  const availableGifts = giftsWithSlots.filter((g) => g.slots_used < g.max_count)

  // Two invariants enforced here, because the service-role client bypasses RLS:
  //   BR-8   — hidden messages are never returned.
  //   FR-5.8 — explicit column list; list_messages has no gift_id, so a guest can
  //            never be tied to a gift. Never select('*') here.
  const { data: messageRows, count: messagesTotal } = await supabase
    .from('list_messages')
    .select('id, guest_name, message, created_at', { count: 'exact' })
    .eq('list_id', list.id)
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })
    .limit(MESSAGES_FETCH_LIMIT)

  const messages: PublicMessage[] = messageRows ?? []

  return (
    <div className="bg-romantic min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-14 sm:py-20">
        {/* List header */}
        <header className="text-center space-y-3">
          {list.event_date && (
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              {new Date(list.event_date).toLocaleDateString('pt-BR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          )}
          {list.couple_names && (
            <h1 className="font-script text-6xl sm:text-7xl text-primary leading-none [text-shadow:0_2px_0_#fff]">
              {list.couple_names}
            </h1>
          )}
          <p
            className={
              list.couple_names
                ? 'text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground'
                : 'font-script text-6xl sm:text-7xl text-primary leading-none [text-shadow:0_2px_0_#fff]'
            }
          >
            {list.title}
          </p>
        </header>

        {/* Heart divider */}
        <div className="my-10 flex items-center justify-center" aria-hidden="true">
          <span className="h-px w-16 bg-[#ebc4c4]" />
          <svg viewBox="0 0 24 24" className="mx-3 h-5 w-5 fill-[#d98e8e]">
            <path d="M12 18s-8-5.2-8-10.2A4 4 0 0112 5a4 4 0 018 2.8C20 12.8 12 18 12 18z" />
          </svg>
          <span className="h-px w-16 bg-[#ebc4c4]" />
        </div>
        <div>
          {list.intro_message && (
            <>
              <p className="max-w-prose mx-auto text-foreground/80 italic leading-relaxed whitespace-pre-wrap pt-3">
                {list.intro_message}
              </p>
              <div className="my-10 flex items-center justify-center" aria-hidden="true">
                <span className="h-px w-16 bg-[#ebc4c4]" />
                <svg viewBox="0 0 24 24" className="mx-3 h-5 w-5 fill-[#d98e8e]">
                  <path d="M12 18s-8-5.2-8-10.2A4 4 0 0112 5a4 4 0 018 2.8C20 12.8 12 18 12 18z" />
                </svg>
                <span className="h-px w-16 bg-[#ebc4c4]" />
              </div>
            </>
          )}
        </div>

        {/* Mensagens de carinho — placed before the closed/SelectionForm block so
            it stays above SelectionForm's fixed bottom-0 sticky bar, and remains
            visible on a closed list (FR-2.5 stops new selections, not memories). */}
        {messages.length > 0 && (
          <>
            <div className="my-10 flex items-center justify-center" aria-hidden="true">
              <span className="h-px w-16 bg-[#ebc4c4]" />
              <svg viewBox="0 0 24 24" className="mx-3 h-5 w-5 fill-[#d98e8e]">
                <path d="M12 18s-8-5.2-8-10.2A4 4 0 0112 5a4 4 0 018 2.8C20 12.8 12 18 12 18z" />
              </svg>
              <span className="h-px w-16 bg-[#ebc4c4]" />
            </div>
            <MessagesSection messages={messages} total={messagesTotal ?? messages.length} />
          </>
        )}


        {/* Closed state */}
        {list.status === 'closed' ? (
          <div className="text-center py-12 space-y-2">
            <p className="text-lg font-medium">
              Esta lista não está mais aceitando escolhas.
            </p>
            <p className="text-muted-foreground text-sm">
              Obrigado pelo seu interesse!
            </p>
          </div>
        ) : (
          <SelectionForm gifts={availableGifts} categories={categories ?? []} listToken={token} />
        )}
      </div>
    </div>
  )
}
