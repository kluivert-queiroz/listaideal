'use client'

import { useState } from 'react'
import { deleteRsvpAction } from '@/app/actions/rsvps'
import { RsvpEditForm } from './rsvp-edit-form'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { RSVP_DELETE_LABEL, RSVP_EDIT_TITLE, rsvpDeleteConfirm } from '@/lib/rsvp'
import type { Rsvp } from '@/lib/types'

export function RsvpRow({ rsvp, listId }: { rsvp: Rsvp; listId: string }) {
  const [editOpen, setEditOpen] = useState(false)

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{rsvp.guest_name}</span>
        <Badge variant={rsvp.is_attending ? 'default' : 'secondary'}>
          {rsvp.is_attending ? 'Sim' : 'Não'}
        </Badge>
        {rsvp.is_attending && (
          <span className="text-muted-foreground">
            {rsvp.guest_count} {rsvp.guest_count === 1 ? 'pessoa' : 'pessoas'}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-muted-foreground">
          {new Date(rsvp.updated_at).toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
              Editar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{RSVP_EDIT_TITLE}</DialogTitle>
            </DialogHeader>
            <RsvpEditForm listId={listId} rsvp={rsvp} onSuccess={() => setEditOpen(false)} />
          </DialogContent>
        </Dialog>

        <form
          action={deleteRsvpAction}
          onSubmit={(e) => {
            if (!window.confirm(rsvpDeleteConfirm(rsvp.guest_name))) e.preventDefault()
          }}
        >
          <input type="hidden" name="rsvp_id" value={rsvp.id} />
          <input type="hidden" name="list_id" value={listId} />
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-destructive hover:text-destructive"
          >
            {RSVP_DELETE_LABEL}
          </Button>
        </form>
      </div>
    </div>
  )
}
