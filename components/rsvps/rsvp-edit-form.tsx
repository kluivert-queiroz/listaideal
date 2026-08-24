'use client'

import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { updateRsvpAction } from '@/app/actions/rsvps'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  RSVP_ATTENDING_NO_LABEL,
  RSVP_ATTENDING_YES_LABEL,
  RSVP_EDIT_SAVE_LABEL,
  RSVP_EDIT_SAVE_PENDING_LABEL,
  RSVP_GUEST_COUNT_LABEL,
  RSVP_MAX_GUEST_COUNT,
  RSVP_MIN_GUEST_COUNT,
  RSVP_NAME_LABEL,
} from '@/lib/rsvp'
import type { Rsvp } from '@/lib/types'

type Attendance = 'yes' | 'no'

export function RsvpEditForm({
  listId,
  rsvp,
  onSuccess,
}: {
  listId: string
  rsvp: Rsvp
  onSuccess?: () => void
}) {
  const [attendance, setAttendance] = useState<Attendance>(rsvp.is_attending ? 'yes' : 'no')
  const [state, formAction, pending] = useActionState(updateRsvpAction, undefined)

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success)
      onSuccess?.()
    }
  }, [state, onSuccess])

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="list_id" value={listId} />
      <input type="hidden" name="rsvp_id" value={rsvp.id} />
      <input type="hidden" name="is_attending" value={attendance} />

      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="guest_name">{RSVP_NAME_LABEL}</Label>
        <Input id="guest_name" name="guest_name" defaultValue={rsvp.guest_name} required maxLength={200} />
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant={attendance === 'yes' ? 'default' : 'outline'}
          aria-pressed={attendance === 'yes'}
          className="flex-1"
          onClick={() => setAttendance('yes')}
        >
          {RSVP_ATTENDING_YES_LABEL}
        </Button>
        <Button
          type="button"
          variant={attendance === 'no' ? 'default' : 'outline'}
          aria-pressed={attendance === 'no'}
          className="flex-1"
          onClick={() => setAttendance('no')}
        >
          {RSVP_ATTENDING_NO_LABEL}
        </Button>
      </div>

      {attendance === 'yes' && (
        <div className="space-y-2">
          <Label htmlFor="guest_count">{RSVP_GUEST_COUNT_LABEL}</Label>
          <Input
            id="guest_count"
            name="guest_count"
            type="number"
            min={RSVP_MIN_GUEST_COUNT}
            max={RSVP_MAX_GUEST_COUNT}
            defaultValue={rsvp.guest_count || 1}
            required
          />
        </div>
      )}

      <Button type="submit" disabled={pending} size="sm">
        {pending ? RSVP_EDIT_SAVE_PENDING_LABEL : RSVP_EDIT_SAVE_LABEL}
      </Button>
    </form>
  )
}
