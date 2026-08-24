import { Card, CardContent } from '@/components/ui/card'
import { truncateMessage } from '@/lib/messages'
import type { PublicMessage } from '@/lib/types'

type Props = {
  message: PublicMessage
  /** 'carousel' truncates to a fixed height; 'list' shows the full text. */
  variant?: 'carousel' | 'list'
}

/**
 * Presentational only — no role="button"/tabIndex/aria-pressed, unlike the gift
 * cards in selection-form.tsx. A message card must not look clickable; "Ver
 * todas" is the only affordance. No date shown (name + message only, by design).
 */
export function MessageCard({ message, variant = 'carousel' }: Props) {
  const isCarousel = variant === 'carousel'
  const body = isCarousel ? truncateMessage(message.message).text : message.message

  return (
    <Card className="h-full rounded-3xl border-2 border-white bg-white/80 p-0 shadow-[0_16px_30px_-16px_rgba(79,88,59,0.22)]">
      <CardContent className="space-y-3 p-5">
        <span aria-hidden="true" className="font-script block text-4xl leading-none text-decor">
          &ldquo;
        </span>
        <p
          className={
            isCarousel
              ? 'line-clamp-5 text-sm leading-relaxed break-words text-foreground/80'
              : 'whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/80'
          }
        >
          {body}
        </p>
        <p className="font-script text-2xl leading-none text-primary">{message.guest_name}</p>
      </CardContent>
    </Card>
  )
}
