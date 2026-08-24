'use client'

import { useState } from 'react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { MessageCard } from './message-card'
import {
  MESSAGES_CAROUSEL_LIMIT,
  MESSAGES_FETCH_LIMIT,
  MESSAGES_SEE_ALL,
  MESSAGES_TITLE,
  truncateMessage,
} from '@/lib/messages'
import type { PublicMessage } from '@/lib/types'

type Props = {
  messages: PublicMessage[]
  total: number
}

export function MessagesSection({ messages, total }: Props) {
  const [open, setOpen] = useState(false)
  const slides = messages.slice(0, MESSAGES_CAROUSEL_LIMIT)
  const anyTruncated = slides.some((m) => truncateMessage(m.message).truncated)
  const showSeeAll = total > slides.length || anyTruncated
  const showControls = slides.length > 1

  return (
    <section aria-labelledby="mensagens-de-carinho" className="space-y-6">
      <h2
        id="mensagens-de-carinho"
        className="font-script text-[2.9rem] leading-none text-script-ink text-center"
      >
        {MESSAGES_TITLE}
      </h2>

      <Carousel
        className="w-full rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Carrossel de mensagens dos convidados"
        tabIndex={0}
        opts={{ align: 'start', loop: false }}
      >
        <CarouselContent className="py-2">
          {slides.map((m, i) => (
            <CarouselItem
              key={m.id}
              aria-label={`Mensagem ${i + 1} de ${slides.length}`}
              className="basis-full sm:basis-1/2"
            >
              <MessageCard message={m} variant="carousel" />
            </CarouselItem>
          ))}
        </CarouselContent>

        <div className="mt-4 flex items-center justify-center gap-2">
          {showControls && (
            <>
              <CarouselPrevious className="static inset-auto my-0 translate-x-0 translate-y-0" />
              <CarouselNext className="static inset-auto my-0 translate-x-0 translate-y-0" />
            </>
          )}
          {showSeeAll && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full">
                  {MESSAGES_SEE_ALL} ({total})
                </Button>
              </DialogTrigger>
              <DialogContent className="grid-rows-[auto_minmax(0,1fr)] sm:max-w-lg max-h-[85dvh]">
                <DialogHeader>
                  <DialogTitle>{MESSAGES_TITLE}</DialogTitle>
                  <DialogDescription>
                    {total === 1
                      ? '1 mensagem dos seus convidados'
                      : `${total} mensagens dos seus convidados`}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 overflow-y-auto pr-1">
                  {messages.map((m) => (
                    <MessageCard key={m.id} message={m} variant="list" />
                  ))}
                  {total > messages.length && (
                    <p className="pt-2 text-center text-xs text-muted-foreground">
                      Mostrando as {MESSAGES_FETCH_LIMIT} mensagens mais recentes.
                    </p>
                  )}
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Fechar</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </Carousel>
    </section>
  )
}
