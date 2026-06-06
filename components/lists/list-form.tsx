'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { ActionState, List } from '@/lib/types'

type Props = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>
  defaultValues?: Partial<List>
  listId?: string
  submitLabel: string
}

export function ListForm({ action, defaultValues, listId, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined)

  return (
    <form action={formAction} className="space-y-5">
      {listId && <input type="hidden" name="list_id" value={listId} />}

      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Título da lista *</Label>
        <Input
          id="title"
          name="title"
          placeholder="Nossa Lista de Presentes"
          defaultValue={defaultValues?.title ?? ''}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="couple_names">Nomes do casal</Label>
        <Input
          id="couple_names"
          name="couple_names"
          placeholder="Ana & Bruno"
          defaultValue={defaultValues?.couple_names ?? ''}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="event_date">Data do evento</Label>
        <Input
          id="event_date"
          name="event_date"
          type="date"
          defaultValue={defaultValues?.event_date ?? ''}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="intro_message">Mensagem de boas-vindas</Label>
        <Textarea
          id="intro_message"
          name="intro_message"
          placeholder="Estamos muito felizes por você fazer parte deste momento! Veja como nos ajudar a tornar o nosso dia especial…"
          rows={4}
          defaultValue={defaultValues?.intro_message ?? ''}
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? 'Salvando…' : submitLabel}
      </Button>
    </form>
  )
}
