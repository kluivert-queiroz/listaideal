import type { GiftCategory, GiftWithSlots } from '@/lib/types'

export const UNCATEGORIZED_LABEL = 'Outros presentes'

// Allowlist: Unicode letters/numbers, spaces, and a few common punctuation marks.
// Validate-and-reject (not sanitize) per input-validation rules.
export const CATEGORY_NAME_REGEX = /^[\p{L}\p{N} '&·\-–]+$/u

export type GiftSection = {
  id: string | null
  label: string
  gifts: GiftWithSlots[]
}

/**
 * Groups gifts by category, following each category's display_order.
 * Gifts with no category (or whose category was deleted) land in a section
 * appended last. Categories with no gifts in the given list are dropped —
 * relevant on the guest page, where gifts are pre-filtered to available ones.
 */
export function groupGiftsIntoSections(
  gifts: GiftWithSlots[],
  categories: GiftCategory[]
): GiftSection[] {
  const byCategory = new Map<string, GiftWithSlots[]>()
  const uncategorized: GiftWithSlots[] = []

  for (const gift of gifts) {
    if (gift.category_id) {
      const list = byCategory.get(gift.category_id) ?? []
      list.push(gift)
      byCategory.set(gift.category_id, list)
    } else {
      uncategorized.push(gift)
    }
  }

  const sections: GiftSection[] = []

  for (const category of [...categories].sort((a, b) => a.display_order - b.display_order)) {
    const categoryGifts = byCategory.get(category.id)
    if (categoryGifts?.length) {
      sections.push({ id: category.id, label: category.name, gifts: categoryGifts })
    }
  }

  if (uncategorized.length) {
    sections.push({ id: null, label: UNCATEGORIZED_LABEL, gifts: uncategorized })
  }

  return sections
}

/** Trims and collapses internal whitespace; empty string normalizes to null. */
export function normalizeCategoryName(raw: string | null | undefined): string | null {
  const trimmed = (raw ?? '').trim().replace(/\s+/g, ' ')
  return trimmed === '' ? null : trimmed
}
