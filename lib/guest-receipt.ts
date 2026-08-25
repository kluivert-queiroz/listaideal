import { cookies } from 'next/headers'
import { z } from 'zod'

/**
 * Device-local "you already reserved this" receipt. Purely a display hint for
 * a returning guest on the same device/browser — never used for any
 * authorization decision. The guest fully controls this value, so it is
 * validated on every read and silently discarded if malformed.
 */
export const RECEIPT_COOKIE_NAME = 'guest_receipt'

const receiptSchema = z.object({
  giftIds: z.array(z.string().uuid()).max(200),
  guestName: z.string().max(200),
  ts: z.number(),
})

type GuestReceipt = z.infer<typeof receiptSchema>

export async function readGuestReceipt(): Promise<GuestReceipt | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(RECEIPT_COOKIE_NAME)?.value
  if (!raw) return null

  try {
    const parsed = receiptSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export async function writeGuestReceipt(
  listToken: string,
  guestName: string,
  newGiftIds: string[]
): Promise<void> {
  const existing = await readGuestReceipt()
  const giftIds = Array.from(new Set([...(existing?.giftIds ?? []), ...newGiftIds]))

  const payload: GuestReceipt = { giftIds, guestName, ts: Date.now() }

  const cookieStore = await cookies()
  cookieStore.set(RECEIPT_COOKIE_NAME, JSON.stringify(payload), {
    path: `/list/${listToken}`,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 180, // 180 days
  })
}
