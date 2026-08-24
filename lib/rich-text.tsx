import type { ReactNode } from 'react'

/**
 * Subconjunto deliberadamente mínimo: só **negrito**. O texto nunca vira HTML —
 * cada pedaço sai como texto escapado pelo React, então não há vetor de XSS.
 */
export function renderInlineMarkup(text: string): ReactNode {
  return text.split('**').map((chunk, i) => (i % 2 === 1 ? <strong key={i}>{chunk}</strong> : chunk))
}
