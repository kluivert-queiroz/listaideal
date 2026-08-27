'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { HERO_HEADLINE_DEFAULT, HERO_KICKER_DEFAULT } from '@/lib/copy'
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
    <form action={formAction} className="space-y-8">
      {listId && <input type="hidden" name="list_id" value={listId} />}

      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* ── Identidade ───────────────────────────────────────────────────── */}
      <div className="space-y-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Identidade
        </h3>

        <div className="space-y-2">
          <Label htmlFor="title">Título da lista *</Label>
          <Input
            id="title"
            name="title"
            defaultValue={defaultValues?.title ?? ''}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="honoree_names">Nome da homenageada</Label>
          <Input
            id="honoree_names"
            name="honoree_names"
            defaultValue={defaultValues?.honoree_names ?? ''}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="headline">Chamada</Label>
          <Input
            id="headline"
            name="headline"
            placeholder={HERO_HEADLINE_DEFAULT}
            defaultValue={defaultValues?.headline ?? ''}
          />
          <p className="text-xs text-muted-foreground">
            Deixe vazio para usar o texto padrão do tema.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="kicker">Versalete</Label>
          <Input
            id="kicker"
            name="kicker"
            placeholder={HERO_KICKER_DEFAULT}
            defaultValue={defaultValues?.kicker ?? ''}
          />
          <p className="text-xs text-muted-foreground">
            Deixe vazio para usar o texto padrão do tema.
          </p>
        </div>
      </div>

      {/* ── Quando e onde ────────────────────────────────────────────────── */}
      <div className="space-y-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Quando e onde
        </h3>

        <div className="grid gap-5 sm:grid-cols-2">
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
            <Label htmlFor="event_time">Hora do evento</Label>
            <Input
              id="event_time"
              name="event_time"
              type="time"
              defaultValue={defaultValues?.event_time?.slice(0, 5) ?? ''}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="venue_name">Local</Label>
          <Input
            id="venue_name"
            name="venue_name"
            defaultValue={defaultValues?.venue_name ?? ''}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="venue_address">Endereço</Label>
          <Input
            id="venue_address"
            name="venue_address"
            defaultValue={defaultValues?.venue_address ?? ''}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="venue_city">Bairro / Cidade</Label>
          <Input
            id="venue_city"
            name="venue_city"
            defaultValue={defaultValues?.venue_city ?? ''}
          />
        </div>
      </div>

      {/* ── Mensagem ─────────────────────────────────────────────────────── */}
      <div className="space-y-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Mensagem
        </h3>

        <div className="space-y-2">
          <Label htmlFor="intro_message">Mensagem de boas-vindas</Label>
          <Textarea
            id="intro_message"
            name="intro_message"
            placeholder="Para adoçar ainda mais esse momento, pedimos gentilmente fraldas ou presentes para a bebê"
            rows={4}
            defaultValue={defaultValues?.intro_message ?? ''}
          />
          <p className="text-xs text-muted-foreground">
            Use **negrito** para destacar palavras.
          </p>
        </div>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? 'Salvando…' : submitLabel}
      </Button>
    </form>
  )
}
