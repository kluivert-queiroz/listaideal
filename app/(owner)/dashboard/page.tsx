import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: lists } = await supabase
    .from('lists')
    .select('*')
    .eq('owner_id', user!.id)
    .order('created_at', { ascending: false })

  // Fetch gift and selection counts for each list
  const listIds = lists?.map((l) => l.id) ?? []

  const { data: giftCounts } = await supabase
    .from('gifts')
    .select('list_id')
    .in('list_id', listIds)

  const { data: selectionCounts } = await supabase
    .from('selections')
    .select('gift_id, gifts!inner(list_id)')
    .in('gifts.list_id', listIds)

  const giftsByList = (giftCounts ?? []).reduce(
    (acc, g) => ({ ...acc, [g.list_id]: (acc[g.list_id] ?? 0) + 1 }),
    {} as Record<string, number>
  )

  type SelectionRow = { gifts: { list_id: string } | null }
  const selectionsByList = ((selectionCounts as unknown as SelectionRow[]) ?? []).reduce(
    (acc, s) => {
      const lid = s.gifts?.list_id
      if (!lid) return acc
      return { ...acc, [lid]: (acc[lid] ?? 0) + 1 }
    },
    {} as Record<string, number>
  )

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-5xl text-primary leading-none">Minhas Listas</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Gerencie suas listas de presentes
          </p>
        </div>
        <Button asChild>
          <Link href="/lists/new">Nova lista</Link>
        </Button>
      </div>

      {!lists?.length ? (
        <Card className="text-center py-16 border-dashed">
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">Você ainda não tem listas.</p>
            <Button asChild>
              <Link href="/lists/new">Criar sua primeira lista</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <Card
              key={list.id}
              className="flex flex-col transition-shadow hover:shadow-md"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-snug font-semibold">
                    {list.title}
                  </CardTitle>
                  <Badge variant={list.status === 'open' ? 'default' : 'secondary'}>
                    {list.status === 'open' ? 'aberta' : 'fechada'}
                  </Badge>
                </div>
                {list.honoree_names && (
                  <CardDescription>{list.honoree_names}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground flex-1">
                <span>{giftsByList[list.id] ?? 0} presentes</span>
                <span className="mx-2">·</span>
                <span>{selectionsByList[list.id] ?? 0} escolhas</span>
                {list.event_date && (
                  <>
                    <span className="mx-2">·</span>
                    <span>
                      {new Date(list.event_date).toLocaleDateString('pt-BR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </>
                )}
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href={`/lists/${list.id}`}>Gerenciar</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
