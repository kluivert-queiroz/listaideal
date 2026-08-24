'use client'

import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { updateListSlugAction } from '@/app/actions/lists'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function EditSlugForm({
  listId,
  slug,
  sitePrefix,
}: {
  listId: string
  slug: string
  sitePrefix: string
}) {
  const [editing, setEditing] = useState(false)
  const [state, formAction, pending] = useActionState(updateListSlugAction, undefined)

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success)
      setEditing(false)
    }
  }, [state])

  if (!editing) {
    return (
      <Button
        variant="link"
        size="sm"
        className="h-auto p-0 text-xs"
        onClick={() => setEditing(true)}
      >
        Alterar link
      </Button>
    )
  }

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="list_id" value={listId} />
      <input type="hidden" name="current_slug" value={slug} />

      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-2">
        <span className="text-sm font-mono text-muted-foreground">{sitePrefix}</span>
        <Input
          name="slug"
          defaultValue={slug}
          maxLength={30}
          required
          className="font-mono text-sm"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? 'Salvando…' : 'Salvar'}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
