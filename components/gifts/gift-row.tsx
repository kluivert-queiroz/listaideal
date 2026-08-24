'use client'

import { useState } from 'react'
import Image from 'next/image'
import { deleteGiftAction, reorderGiftAction, updateGiftAction } from '@/app/actions/gifts'
import { GiftForm } from './gift-form'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { GiftCategory, GiftWithSlots } from '@/lib/types'

export function GiftRow({
  gift,
  categories,
  isFirst,
  isLast,
}: {
  gift: GiftWithSlots
  categories: GiftCategory[]
  isFirst: boolean
  isLast: boolean
}) {
  const [editOpen, setEditOpen] = useState(false)
  const full = gift.slots_used >= gift.max_count
  const categoryName = categories.find((c) => c.id === gift.category_id)?.name

  return (
    <div className="flex gap-3 items-start py-3 border-b last:border-0">
      {gift.image_url && (
        <div className="relative w-14 h-14 shrink-0 rounded overflow-hidden bg-muted">
          <Image
            src={gift.image_url}
            alt={gift.name}
            fill
            className="object-cover"
            sizes="56px"
          />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{gift.name}</span>
          {categoryName && (
            <Badge variant="outline" className="text-xs">
              {categoryName}
            </Badge>
          )}
          {full && (
            <Badge variant="secondary" className="text-xs">
              Esgotado
            </Badge>
          )}
        </div>
        {gift.description && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {gift.description}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {gift.slots_used} / {gift.max_count} escolhidos
          {gift.price != null && (
            <> · {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(gift.price)}</>
          )}
          {gift.store_url && (
            <>
              {' · '}
              <a
                href={gift.store_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                Ver item
              </a>
            </>
          )}
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {/* Reorder */}
        <form action={reorderGiftAction}>
          <input type="hidden" name="gift_id" value={gift.id} />
          <input type="hidden" name="list_id" value={gift.list_id} />
          <input type="hidden" name="direction" value="up" />
          <Button type="submit" variant="ghost" size="icon" disabled={isFirst} className="h-7 w-7">
            ↑
          </Button>
        </form>
        <form action={reorderGiftAction}>
          <input type="hidden" name="gift_id" value={gift.id} />
          <input type="hidden" name="list_id" value={gift.list_id} />
          <input type="hidden" name="direction" value="down" />
          <Button type="submit" variant="ghost" size="icon" disabled={isLast} className="h-7 w-7">
            ↓
          </Button>
        </form>

        {/* Edit */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
              Editar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar presente</DialogTitle>
            </DialogHeader>
            <GiftForm
              action={updateGiftAction}
              listId={gift.list_id}
              gift={gift}
              categories={categories}
              onSuccess={() => setEditOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Delete */}
        <form action={deleteGiftAction}>
          <input type="hidden" name="gift_id" value={gift.id} />
          <input type="hidden" name="list_id" value={gift.list_id} />
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-destructive hover:text-destructive"
          >
            Excluir
          </Button>
        </form>
      </div>
    </div>
  )
}
