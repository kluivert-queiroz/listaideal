'use client'

import { useActionState, useState } from 'react'
import Image from 'next/image'
import {
  submitSelectionsAction,
  type SubmitSelectionsResult,
} from '@/app/actions/selections'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import type { GiftWithSlots } from '@/lib/types'

type Step = 'select' | 'details'

type Props = {
  gifts: GiftWithSlots[]
  listToken: string
}

export function SelectionForm({ gifts, listToken }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [step, setStep] = useState<Step>('select')
  const [result, action, pending] = useActionState<
    SubmitSelectionsResult | null,
    FormData
  >(
    submitSelectionsAction as (
      prev: SubmitSelectionsResult | null,
      formData: FormData
    ) => Promise<SubmitSelectionsResult>,
    null
  )

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectedGifts = gifts.filter((g) => selectedIds.has(g.id))

  // ── Confirmation screen ─────────────────────────────────────────────────
  if (result !== null && 'reserved' in result) {
    return (
      <div className="space-y-6 text-center py-10">
        <div className="text-5xl">💝</div>
        <div className="space-y-1">
          <h2 className="font-script text-5xl text-primary leading-none">
            Obrigado, {result.guest_name}!
          </h2>
          <p className="text-muted-foreground">Sua escolha foi registrada com carinho.</p>
        </div>

        {result.reserved.length > 0 && (
          <div className="mx-auto max-w-sm text-left">
            <p className="mb-2 text-sm font-medium">Você reservou:</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {result.reserved.map((name) => (
                <li key={name} className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> {name}
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.unavailable.length > 0 && (
          <div className="mx-auto max-w-sm text-left">
            <p className="mb-2 text-sm font-medium text-amber-700">
              Já reservados quando você enviou:
            </p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {result.unavailable.map((name) => (
                <li key={name} className="flex items-center gap-2">
                  <span className="text-amber-600">✗</span> {name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  return (
    <form action={action}>
      <input type="hidden" name="list_token" value={listToken} />
      {Array.from(selectedIds).map((id) => (
        <input key={id} type="hidden" name="gift_ids" value={id} />
      ))}

      {/* ── Step 1: choose gifts ─────────────────────────────────────────── */}
      {step === 'select' && (
        <div className="space-y-6 pb-28">
          <div className="text-center">
            <h2 className="font-script text-4xl text-primary leading-none">
              Escolha com carinho
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Selecione um ou mais presentes para o casal 💕
            </p>
          </div>

          {gifts.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-10">
              Nenhum presente disponível no momento.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {gifts.map((gift) => {
                const selected = selectedIds.has(gift.id)
                return (
                  <Card
                    key={gift.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selected}
                    onClick={() => toggle(gift.id)}
                    onKeyDown={(e) =>
                      (e.key === ' ' || e.key === 'Enter') &&
                      (e.preventDefault(), toggle(gift.id))
                    }
                    className={`group relative cursor-pointer select-none overflow-hidden rounded-3xl border-2 p-0 outline-none transition-all duration-300 shadow-[0_16px_30px_-16px_rgba(193,110,114,0.45)] hover:-translate-y-1 hover:-rotate-[0.4deg] hover:shadow-[0_24px_40px_-16px_rgba(193,110,114,0.55)] focus-visible:ring-2 focus-visible:ring-ring ${
                      selected ? 'border-[#d98e8e]' : 'border-white'
                    }`}
                  >
                    {/* Wax-seal heart */}
                    <span
                      className={`absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full text-base text-white shadow-[0_4px_10px_-2px_rgba(193,110,114,0.6)] transition-all duration-300 ${
                        selected ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
                      }`}
                      style={{
                        background:
                          'radial-gradient(circle at 35% 30%, #e59a9e, #c16e72)',
                      }}
                    >
                      ♥
                    </span>

                    {gift.image_url ? (
                      <div className="relative h-44 w-full bg-white">
                        <Image
                          src={gift.image_url}
                          alt={gift.name}
                          fill
                          objectFit="contain"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(min-width: 640px) 50vw, 100vw"
                        />
                      </div>
                    ) : (
                      <div className="flex h-44 w-full items-center justify-center bg-muted text-4xl">
                        🎁
                      </div>
                    )}

                    <CardContent className="space-y-1 p-4">
                      <p className="font-medium leading-snug">{gift.name}</p>
                      {gift.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {gift.description}
                        </p>
                      )}
                      {gift.store_url && (
                        <a
                          href={gift.store_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-block pt-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
                        >
                          Ver item →
                        </a>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Sticky action bar */}
          {gifts.length > 0 && (
            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-secondary bg-background/90 backdrop-blur">
              <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-3">
                <span className="text-sm font-medium text-muted-foreground">
                  {selectedIds.size === 0
                    ? 'Nenhum presente selecionado'
                    : `${selectedIds.size} ${
                        selectedIds.size === 1
                          ? 'presente selecionado'
                          : 'presentes selecionados'
                      } 💝`}
                </span>
                <Button
                  type="button"
                  size="lg"
                  className="btn-romantic rounded-full px-8"
                  disabled={selectedIds.size === 0}
                  onClick={() => setStep('details')}
                >
                  Continuar
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: name + message ───────────────────────────────────────── */}
      {step === 'details' && (
        <div className="mx-auto max-w-md space-y-6">
          <div className="text-center">
            <h2 className="font-script text-4xl text-primary leading-none">Quase lá!</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Deixe seu nome e uma mensagem para o casal.
            </p>
          </div>

          {result !== null && 'error' in result && (
            <Alert variant="destructive">
              <AlertDescription>{result.error}</AlertDescription>
            </Alert>
          )}

          {/* Selected gifts summary */}
          <Card className="bg-secondary/40 border-secondary rounded-3xl">
            <CardContent className="space-y-2 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Seus presentes
              </p>
              <ul className="space-y-1.5">
                {selectedGifts.map((g) => (
                  <li
                    key={g.id}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span>{g.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        toggle(g.id)
                        if (selectedIds.size <= 1) setStep('select')
                      }}
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      Remover
                    </button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="guest_name">Seu nome *</Label>
              <Input
                id="guest_name"
                name="guest_name"
                placeholder="Maria Silva"
                autoFocus
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Mensagem (opcional)</Label>
              <Textarea
                id="message"
                name="message"
                placeholder="Parabéns! Desejo a vocês uma vida cheia de amor e felicidade…"
                rows={3}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep('select')}
              disabled={pending}
            >
              Voltar
            </Button>
            <Button
              type="submit"
              size="lg"
              className="btn-romantic flex-1 rounded-full"
              disabled={pending}
            >
              {pending ? 'Enviando…' : 'Confirmar escolha'}
            </Button>
          </div>
        </div>
      )}
    </form>
  )
}
