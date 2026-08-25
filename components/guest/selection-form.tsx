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
import { BeeSeal } from '@/components/decor/bee-seal'
import { groupGiftsIntoSections } from '@/lib/gift-sections'
import {
  CONFIRMATION_SUBTITLE,
  DETAILS_SUBTITLE,
  DETAILS_TITLE,
  GIFTS_TITLE,
  GUEST_MESSAGE_PLACEHOLDER,
  giftsSubtitle,
  selectedCount,
} from '@/lib/copy'
import type { GiftCategory, GiftWithSlots } from '@/lib/types'

type Step = 'select' | 'details'

type Props = {
  gifts: GiftWithSlots[]
  categories: GiftCategory[]
  listToken: string
  honoreeNames?: string | null
}

export function SelectionForm({ gifts, categories, listToken, honoreeNames = null }: Props) {
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
        <div className="text-5xl">🍯</div>
        <div className="space-y-1">
          <h2 className="font-heading text-5xl text-primary leading-none">
            Obrigado, {result.guest_name}!
          </h2>
          <p className="text-muted-foreground">{CONFIRMATION_SUBTITLE}</p>
        </div>

        {result.reserved.length > 0 && (
          <div className="mx-auto max-w-sm text-left">
            <p className="mb-2 text-sm font-medium">Você reservou:</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {result.reserved.map((gift) => (
                <li key={gift.id} className="flex items-start gap-2">
                  <span className="text-success mt-0.5">✓</span>
                  <span>
                    <span className="block text-foreground">{gift.name}</span>
                    {gift.description && (
                      <span className="block text-xs">{gift.description}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.unavailable.length > 0 && (
          <div className="mx-auto max-w-sm text-left">
            <p className="mb-2 text-sm font-medium text-warning">
              Já reservados quando você enviou:
            </p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {result.unavailable.map((name) => (
                <li key={name} className="flex items-center gap-2">
                  <span className="text-warning">✗</span> {name}
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.reserved.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Guardamos isso neste aparelho — se preferir, tire um print desta tela.
          </p>
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
            <h2 className="font-heading text-[2.9rem] text-script-ink leading-none">
              {GIFTS_TITLE}
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              {giftsSubtitle(honoreeNames)}
            </p>
          </div>

          {gifts.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-10">
              Nenhum presente disponível no momento.
            </p>
          ) : (
            (() => {
              const sections = groupGiftsIntoSections(gifts, categories)
              const showHeadings = !(sections.length === 1 && sections[0].id === null)

              return sections.map((section) => (
                <div key={section.id ?? 'uncategorized'} className="space-y-7 mt-14">
                  {showHeadings && (
                    <h3 className="font-heading text-[2.5rem] text-primary leading-none text-center">
                      {section.label}
                    </h3>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    {section.gifts.map((gift) => {
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
                          className={`group relative cursor-pointer select-none overflow-hidden rounded-3xl border-2 p-0 outline-none transition-all duration-300 shadow-[0_16px_30px_-16px_rgba(79,88,59,0.22)] hover:-translate-y-1 hover:-rotate-[0.4deg] hover:shadow-[0_24px_40px_-16px_rgba(79,88,59,0.3)] focus-visible:ring-2 focus-visible:ring-ring ${
                            selected ? 'border-primary' : 'border-white'
                          }`}
                        >
                          {/* Wax-seal bee */}
                          <span
                            className={`absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full shadow-[0_4px_10px_-2px_rgba(79,88,59,0.35)] transition-all duration-300 ${
                              selected ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
                            }`}
                            style={{
                              background:
                                'radial-gradient(circle at 35% 30%, #f4b840, #d9a450)',
                            }}
                          >
                            <BeeSeal className="h-[22px] w-[30px]" />
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
                            {gift.price != null && (
                              <p className="text-sm font-medium text-foreground">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(gift.price)}
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
                </div>
              ))
            })()
          )}

          {/* Sticky action bar */}
          {gifts.length > 0 && (
            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-secondary bg-background/90 backdrop-blur">
              <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-3">
                <span className="text-sm font-medium text-muted-foreground">
                  {selectedCount(selectedIds.size)}
                </span>
                <Button
                  type="button"
                  size="lg"
                  className="btn-harvest rounded-full px-8"
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
            <h2 className="font-heading text-4xl text-primary leading-none">{DETAILS_TITLE}</h2>
            <p className="text-sm text-muted-foreground mt-2">{DETAILS_SUBTITLE}</p>
          </div>

          {result !== null && 'error' in result && (
            <Alert variant="destructive">
              <AlertDescription>{result.error}</AlertDescription>
            </Alert>
          )}

          {/* Selected gifts summary */}
          <Card className="bg-secondary/40 border-secondary rounded-3xl pb-12">
            <CardContent className="space-y-2 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Seus presentes
              </p>
              <ul className="space-y-1.5">
                {selectedGifts.map((g) => (
                  <li
                    key={g.id}
                    className="flex items-start justify-between gap-2 text-sm"
                  >
                    <span>
                      <span className="block">{g.name}</span>
                      {g.description && (
                        <span className="block text-xs text-muted-foreground">
                          {g.description}
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        toggle(g.id)
                        if (selectedIds.size <= 1) setStep('select')
                      }}
                      className="shrink-0 text-xs text-muted-foreground hover:text-destructive"
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
                placeholder={GUEST_MESSAGE_PLACEHOLDER}
                rows={3}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pb-36">
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
              className="btn-harvest flex-1 rounded-full"
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
