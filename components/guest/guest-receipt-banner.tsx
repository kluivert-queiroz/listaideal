import { Alert, AlertDescription } from '@/components/ui/alert'

type Props = {
  guestName: string
  gifts: { id: string; name: string; description: string | null }[]
}

export function GuestReceiptBanner({ guestName, gifts }: Props) {
  return (
    <Alert className="mb-6 bg-secondary/40 border-secondary rounded-2xl">
      <AlertDescription>
        <p className="mb-2 text-foreground">Oi, {guestName}! Você já reservou:</p>
        <ul className="space-y-2 text-sm">
          {gifts.map((gift) => (
            <li key={gift.id} className="flex items-start gap-2">
              <span className="text-success mt-0.5">✓</span>
              <span>
                <span className="block text-foreground">{gift.name}</span>
                {gift.description && <span className="block text-xs">{gift.description}</span>}
              </span>
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}
