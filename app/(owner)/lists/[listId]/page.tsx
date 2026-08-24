import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  toggleListStatusAction,
  deleteListAction,
} from '@/app/actions/lists'
import { createGiftAction } from '@/app/actions/gifts'
import { GiftRow } from '@/components/gifts/gift-row'
import { GiftForm } from '@/components/gifts/gift-form'
import { CategoryManager } from '@/components/categories/category-manager'
import { CopyLink } from '@/components/lists/copy-link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { groupGiftsIntoSections } from '@/lib/gift-sections'
import type { GiftWithSlots, SelectionWithGift } from '@/lib/types'

export default async function ListPage({
  params,
}: {
  params: Promise<{ listId: string }>
}) {
  const { listId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: list } = await supabase
    .from('lists')
    .select('*')
    .eq('id', listId)
    .eq('owner_id', user.id)
    .single()

  if (!list) notFound()

  const { data: giftsRaw } = await supabase
    .from('gifts')
    .select('*')
    .eq('list_id', listId)
    .order('display_order', { ascending: true })

  const gifts = giftsRaw ?? []
  const giftIds = gifts.map((g) => g.id)

  const { data: categoriesRaw } = await supabase
    .from('gift_categories')
    .select('*')
    .eq('list_id', listId)
    .order('display_order', { ascending: true })

  const categories = categoriesRaw ?? []

  const giftCountByCategory = gifts.reduce(
    (acc, g) => {
      if (g.category_id) acc[g.category_id] = (acc[g.category_id] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const { data: selectionRows } = await supabase
    .from('selections')
    .select('gift_id')
    .in('gift_id', giftIds)

  const countMap = (selectionRows ?? []).reduce(
    (acc, s) => ({ ...acc, [s.gift_id]: (acc[s.gift_id] ?? 0) + 1 }),
    {} as Record<string, number>
  )

  const giftsWithSlots: GiftWithSlots[] = gifts.map((g) => ({
    ...g,
    slots_used: countMap[g.id] ?? 0,
  }))

  const { data: selections } = await supabase
    .from('selections')
    .select('*, gifts!inner(name)')
    .in('gift_id', giftIds)
    .order('created_at', { ascending: false })

  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/list/${list.share_token}`

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="-ml-2">
              <Link href="/dashboard">← Painel</Link>
            </Button>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-script text-4xl text-primary leading-none">{list.title}</h1>
            <Badge variant={list.status === 'open' ? 'default' : 'secondary'}>
              {list.status === 'open' ? 'aberta' : 'fechada'}
            </Badge>
          </div>
          {list.couple_names && (
            <p className="text-muted-foreground">{list.couple_names}</p>
          )}
          {list.event_date && (
            <p className="text-sm text-muted-foreground">
              {new Date(list.event_date).toLocaleDateString('pt-BR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button asChild variant="outline" size="sm">
            <Link href={`/lists/${listId}/edit`}>Editar</Link>
          </Button>
          <form action={toggleListStatusAction}>
            <input type="hidden" name="list_id" value={listId} />
            <input
              type="hidden"
              name="status"
              value={list.status === 'open' ? 'closed' : 'open'}
            />
            <Button type="submit" variant="outline" size="sm">
              {list.status === 'open' ? 'Fechar lista' : 'Reabrir lista'}
            </Button>
          </form>
          <form action={deleteListAction}>
            <input type="hidden" name="list_id" value={listId} />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
            >
              Excluir lista
            </Button>
          </form>
        </div>
      </div>

      {/* Share link */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Link de compartilhamento</p>
        <CopyLink url={shareUrl} />
        <p className="text-xs text-muted-foreground">
          Envie este <Link className='text-blue-500' href={shareUrl} target='_blank' rel='noopener noreferrer'>link</Link> aos seus convidados — eles não precisam de conta.
        </p>
      </div>

      <Separator />

      {/* Categories */}
      {(categories.length > 0 || gifts.length > 0) && (
        <CategoryManager
          listId={listId}
          categories={categories}
          giftCountByCategory={giftCountByCategory}
        />
      )}

      {/* Gifts */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Presentes ({gifts.length})</h2>

        {(() => {
          const sections = groupGiftsIntoSections(giftsWithSlots, categories)
          const showHeadings = !(sections.length === 1 && sections[0].id === null)

          return sections.map((section) => (
            <div key={section.id ?? 'uncategorized'} className="space-y-2">
              {showHeadings && (
                <h3 className="text-sm font-medium text-muted-foreground">{section.label}</h3>
              )}
              <Card>
                <CardContent className="p-0 divide-y">
                  {section.gifts.map((gift, i) => (
                    <div key={gift.id} className="px-4">
                      <GiftRow
                        gift={gift}
                        categories={categories}
                        isFirst={i === 0}
                        isLast={i === section.gifts.length - 1}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ))
        })()}

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Adicionar presente</CardTitle>
          </CardHeader>
          <CardContent>
            <GiftForm action={createGiftAction} listId={listId} categories={categories} />
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Selections */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">
          Escolhas ({(selections ?? []).length})
        </h2>
        {!selections?.length ? (
          <p className="text-muted-foreground text-sm">Nenhuma escolha ainda.</p>
        ) : (
          <Card>
            <CardContent className="divide-y p-0">
              {(selections as unknown as SelectionWithGift[]).map((s) => (
                <div key={s.id} className="px-4 py-3 text-sm">
                  <span className="font-medium">{s.guest_name}</span>
                  {' escolheu '}
                  <span className="font-medium">{s.gifts?.name}</span>
                  {s.message && (
                    <span className="text-muted-foreground"> — &ldquo;{s.message}&rdquo;</span>
                  )}
                  <span className="text-xs text-muted-foreground ml-2">
                    {new Date(s.created_at).toLocaleDateString('pt-BR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
