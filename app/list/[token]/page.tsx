import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { SelectionForm } from '@/components/guest/selection-form'
import { MessagesSection } from '@/components/guest/messages-section'
import { SleepingBee } from '@/components/decor/sleeping-bee'
import { BeeDivider } from '@/components/decor/bee-divider'
import { MESSAGES_FETCH_LIMIT } from '@/lib/messages'
import { HERO_HEADLINE_DEFAULT, HERO_KICKER_DEFAULT } from '@/lib/copy'
import { renderInlineMarkup } from '@/lib/rich-text'
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
    <div className="relative overflow-hidden bg-background min-h-screen">
      <div className="decor-arch" aria-hidden="true" />
      <div className="decor-hem" aria-hidden="true" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 pb-72">
        {/* Hero */}
        <header className="text-center pt-[150px] sm:pt-[210px] px-[6%] sm:px-[8%] pb-10 space-y-3">
          <p className="font-bold text-base sm:text-[1.05rem]">
            {list.headline ?? HERO_HEADLINE_DEFAULT}
          </p>
          <p className="font-smallcaps [font-variant:small-caps] text-[1.45rem] tracking-[0.06em] text-script-ink">
            {list.kicker ?? HERO_KICKER_DEFAULT}
          </p>
          {list.honoree_names && (
            <h1 className="font-script text-[clamp(4rem,13vw,6.5rem)] leading-[0.95] text-script-ink [text-shadow:0_2px_0_#fff]">
              {list.honoree_names}
            </h1>
          )}
          <p
            className={
              list.honoree_names
                ? 'text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground'
                : 'font-script text-[clamp(4rem,13vw,6.5rem)] leading-[0.95] text-script-ink [text-shadow:0_2px_0_#fff]'
            }
          >
            {list.title}
          </p>

          {list.intro_message && (
            <p className="max-w-[30rem] mx-auto text-[1.06rem] leading-[1.7] whitespace-pre-wrap pt-3">
              {renderInlineMarkup(list.intro_message)}
            </p>
          )}

          <SleepingBee className="w-[210px] mx-auto mt-6 mb-2" />

          {list.event_date && (
            <p className="text-[1.35rem] mt-3.5">
              {new Date(list.event_date).toLocaleDateString('pt-BR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          )}
          {list.event_time && (
            <p className="text-[1.1rem] text-muted-foreground">{list.event_time.slice(0, 5)}</p>
          )}
          {list.venue_name && <p className="font-bold text-[1.05rem]">{list.venue_name}</p>}
          {list.venue_address && (
            <p className="font-semibold text-[0.95rem]">{list.venue_address}</p>
          )}
          {list.venue_city && (
            <p className="text-[0.85rem] text-muted-foreground">{list.venue_city}</p>
          )}
        </header>

        <BeeDivider />

        {/* Mensagens de carinho — placed before the closed/SelectionForm block so
            it stays above SelectionForm's fixed bottom-0 sticky bar, and remains
            visible on a closed list (FR-2.5 stops new selections, not memories). */}
        {messages.length > 0 && (
          <>
            <MessagesSection messages={messages} total={messagesTotal ?? messages.length} />
            <BeeDivider />
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
          <SelectionForm
            gifts={availableGifts}
            categories={categories ?? []}
            listToken={token}
            honoreeNames={list.honoree_names}
          />
        )}
      </div>
    </div>
  )
}
