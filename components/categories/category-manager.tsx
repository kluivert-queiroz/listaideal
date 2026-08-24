'use client'

import { useActionState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { createCategoryAction } from '@/app/actions/categories'
import { CategoryRow } from './category-row'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { GiftCategory } from '@/lib/types'

export function CategoryManager({
  listId,
  categories,
  giftCountByCategory,
}: {
  listId: string
  categories: GiftCategory[]
  giftCountByCategory: Record<string, number>
}) {
  const [state, formAction, pending] = useActionState(createCategoryAction, undefined)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success)
      formRef.current?.reset()
    }
  }, [state])

  const sorted = [...categories].sort((a, b) => a.display_order - b.display_order)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Categorias</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form ref={formRef} action={formAction} className="flex gap-2">
          <input type="hidden" name="list_id" value={listId} />
          <Input
            name="name"
            placeholder="Nova categoria… (ex: Cozinha)"
            maxLength={60}
            required
          />
          <Button type="submit" disabled={pending} size="sm">
            {pending ? 'Adicionando…' : 'Adicionar'}
          </Button>
        </form>

        {state?.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        {sorted.length > 0 && (
          <div className="divide-y">
            {sorted.map((category, i) => (
              <CategoryRow
                key={category.id}
                category={category}
                giftCount={giftCountByCategory[category.id] ?? 0}
                isFirst={i === 0}
                isLast={i === sorted.length - 1}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
