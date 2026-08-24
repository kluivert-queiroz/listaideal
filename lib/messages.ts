export const MESSAGES_TITLE = "Mensagens de carinho"
export const MESSAGES_SEE_ALL = "Ver todas"
export const MESSAGES_EMPTY_OWNER = "Nenhuma mensagem ainda."

/** Keeps every carousel card the same height. */
export const MESSAGE_CARD_MAX_CHARS = 180
/** Newest N messages rendered as carousel slides. */
export const MESSAGES_CAROUSEL_LIMIT = 12
/** Ceiling on rows shipped to the "Ver todas" modal. */
export const MESSAGES_FETCH_LIMIT = 200

export type TruncatedMessage = { text: string; truncated: boolean }

/**
 * Collapses all whitespace (a 40-newline message must not blow up card height) and
 * cuts at the last word boundary before `max`, unless that boundary lands absurdly
 * early -- one very long token then gets a hard cut.
 */
export function truncateMessage(raw: string, max: number = MESSAGE_CARD_MAX_CHARS): TruncatedMessage {
  const collapsed = raw.replace(/\s+/g, " ").trim()
  if (collapsed.length <= max) return { text: collapsed, truncated: false }

  const slice = collapsed.slice(0, max)
  const lastSpace = slice.lastIndexOf(" ")
  const cut = lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice
  return { text: `${cut}\u2026`, truncated: true }
}

// C0 controls except \t \n \r (0x09, 0x0A, 0x0D -- handled separately below), the
// DEL character, and the C1 control range. Written as \u escapes rather than
// literal control characters, which are invisible and unreviewable in a diff.
const CONTROL_CHARS_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g

// Unicode bidi control/override characters -- can visually reorder or garble
// surrounding text: ALM (U+061C), LRM/RLM (U+200E/F), LRE/RLE/PDF/LRO/RLO
// (U+202A-E), LRI/RLI/FSI/PDI (U+2066-9).
const BIDI_CONTROL_CHARS_REGEX = /[\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/g

/**
 * Normalizes guest-supplied text before it is persisted and rendered on a public
 * page. This is a display-integrity measure, not an XSS defense -- React already
 * escapes rendered text.
 */
export function sanitizeGuestText(raw: string): string {
  return raw
    .replace(CONTROL_CHARS_REGEX, "")
    .replace(BIDI_CONTROL_CHARS_REGEX, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}
