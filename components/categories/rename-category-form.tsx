'use client'

import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { renameCategoryAction } from '@/app/actions/categories'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { GiftCategory } from '@/lib/types'

export function RenameCategoryForm({
  category,
  onSuccess,
}: {
  category: GiftCategory
  onSuccess: () => void
}) {
  const [state, formAction, pending] = useActionState(renameCategoryAction, undefined)

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success)
      onSuccess()
    }
  }, [state, onSuccess])

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="category_id" value={category.id} />
      <input type="hidden" name="list_id" value={category.list_id} />

      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor={`rename-${category.id}`}>Nome da categoria</Label>
        <Input
          id={`rename-${category.id}`}
          name="name"
          defaultValue={category.name}
          maxLength={60}
          required
        />
      </div>

      <Button type="submit" disabled={pending} size="sm">
        {pending ? 'Salvando…' : 'Salvar'}
      </Button>
    </form>
  )
}
