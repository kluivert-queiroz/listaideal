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
  return { text: `${cut}…`, truncated: true }
}
