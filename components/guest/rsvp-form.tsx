'use client'

import { useActionState, useState } from 'react'
import { submitRsvpAction, type SubmitRsvpResult } from '@/app/actions/rsvps'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  RSVP_ATTENDING_NO_LABEL,
  RSVP_ATTENDING_YES_LABEL,
  RSVP_GUEST_COUNT_LABEL,
  RSVP_MAX_GUEST_COUNT,
  RSVP_MIN_GUEST_COUNT,
  RSVP_NAME_LABEL,
  RSVP_SUBMIT_LABEL,
  RSVP_SUBMIT_PENDING_LABEL,
  RSVP_SUBTITLE,
  RSVP_TITLE,
  rsvpConfirmationMessage,
} from '@/lib/rsvp'

type Attendance = 'yes' | 'no'

export function RsvpForm({ listToken }: { listToken: string }) {
  const [open, setOpen] = useState(false)
  const [attendance, setAttendance] = useState<Attendance>('yes')
  const [result, action, pending] = useActionState<SubmitRsvpResult | null, FormData>(
    submitRsvpAction as (
      prev: SubmitRsvpResult | null,
      formData: FormData
    ) => Promise<SubmitRsvpResult>,
    null
  )

  const confirmed = result !== null && 'is_attending' in result

  return (
    <section className="text-center py-6">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="lg" className="btn-harvest rounded-full">
            {RSVP_TITLE}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          {confirmed ? (
            <div className="space-y-2 text-center py-2">
              <DialogTitle className="font-heading text-3xl text-primary leading-none">
                {RSVP_TITLE}
              </DialogTitle>
              <p className="text-muted-foreground">
                {rsvpConfirmationMessage(result.guest_name, result.is_attending)}
              </p>
            </div>
          ) : (
            <>
              <div className="text-center">
                <DialogTitle className="font-heading text-3xl text-primary leading-none">
                  {RSVP_TITLE}
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-2">{RSVP_SUBTITLE}</p>
              </div>

              <form action={action} className="space-y-4">
                <input type="hidden" name="list_token" value={listToken} />
                <input type="hidden" name="is_attending" value={attendance} />

                {result !== null && 'error' in result && (
                  <Alert variant="destructive">
                    <AlertDescription>{result.error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="rsvp_guest_name">{RSVP_NAME_LABEL}</Label>
                  <Input id="rsvp_guest_name" name="guest_name" placeholder="Maria Silva" required />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={attendance === 'yes' ? 'default' : 'outline'}
                    aria-pressed={attendance === 'yes'}
                    className="flex-1 rounded-full"
                    onClick={() => setAttendance('yes')}
                  >
                    {RSVP_ATTENDING_YES_LABEL}
                  </Button>
                  <Button
                    type="button"
                    variant={attendance === 'no' ? 'default' : 'outline'}
                    aria-pressed={attendance === 'no'}
                    className="flex-1 rounded-full"
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
                      defaultValue={1}
                      required
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="btn-harvest w-full rounded-full"
                  disabled={pending}
                >
                  {pending ? RSVP_SUBMIT_PENDING_LABEL : RSVP_SUBMIT_LABEL}
                </Button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
