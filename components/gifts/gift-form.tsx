'use client'

import { useActionState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { ActionState, Gift } from '@/lib/types'

type Props = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>
  listId: string
  gift?: Gift
  onSuccess?: () => void
}

export function GiftForm({ action, listId, gift, onSuccess }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success)
      if (!gift) formRef.current?.reset()
      onSuccess?.()
    }
  }, [state, gift, onSuccess])

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <input type="hidden" name="list_id" value={listId} />
      {gift && <input type="hidden" name="gift_id" value={gift.id} />}

      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-2">
          <Label htmlFor="name">Nome do presente *</Label>
          <Input
            id="name"
            name="name"
            placeholder="Batedeira KitchenAid"
            defaultValue={gift?.name ?? ''}
            required
          />
        </div>

        <div className="col-span-2 space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Detalhes opcionais para os convidados…"
            rows={2}
            defaultValue={gift?.description ?? ''}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="max_count">Máx. de escolhas</Label>
          <Input
            id="max_count"
            name="max_count"
            type="number"
            min={1}
            defaultValue={gift?.max_count ?? 1}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Preço (opcional)</Label>
          <Input
            id="price"
            name="price"
            type="number"
            min={0.01}
            step={0.01}
            placeholder="0,00"
            defaultValue={gift?.price ?? ''}
          />
        </div>

        <div className="col-span-2 space-y-2">
          <Label htmlFor="image_url">URL da imagem</Label>
          <Input
            id="image_url"
            name="image_url"
            type="url"
            placeholder="https://…"
            defaultValue={gift?.image_url ?? ''}
          />
        </div>

        <div className="col-span-2 space-y-2">
          <Label htmlFor="store_url">Link da loja</Label>
          <Input
            id="store_url"
            name="store_url"
            type="url"
            placeholder="https://loja.com/item"
            defaultValue={gift?.store_url ?? ''}
          />
        </div>
      </div>

      <Button type="submit" disabled={pending} size="sm">
        {pending ? 'Salvando…' : gift ? 'Salvar alterações' : 'Adicionar presente'}
      </Button>
    </form>
  )
}
