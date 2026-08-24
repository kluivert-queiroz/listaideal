// C0 controls except \t \n \r (0x09, 0x0A, 0x0D -- handled separately below), the
// DEL character, and the C1 control range. Written as \u escapes rather than
// literal control characters, which are invisible and unreviewable in a diff.
const CONTROL_CHARS_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g

// Unicode bidi control/override characters -- can visually reorder or garble
// surrounding text: ALM (U+061C), LRM/RLM (U+200E/F), LRE/RLE/PDF/LRO/RLO
// (U+202A-E), LRI/RLI/FSI/PDI (U+2066-9).
const BIDI_CONTROL_CHARS_REGEX = /[\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/g

/**
 * Normalizes user-supplied text (guest or owner) before it is persisted and
 * rendered on a public page. This is a display-integrity measure, not an XSS
 * defense -- React already escapes rendered text.
 */
export function sanitizeUserText(raw: string): string {
  return raw
    .replace(CONTROL_CHARS_REGEX, "")
    .replace(BIDI_CONTROL_CHARS_REGEX, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}
