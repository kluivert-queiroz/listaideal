/** Selo de cera com abelhinha — substitui o ♥ do selo de seleção de presente.
 *  Copiado de mockups/list-page-cha-de-bebe.html:200-207 (defs > #beeGlyph). */
export function BeeSeal({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 44 32" aria-hidden="true" className={className}>
      <ellipse cx="15" cy="11" rx="10" ry="6.5" fill="#fffdf3" opacity=".95" transform="rotate(-22 15 11)" />
      <ellipse cx="29" cy="11" rx="10" ry="6.5" fill="#fffdf3" opacity=".95" transform="rotate(22 29 11)" />
      <ellipse cx="22" cy="21" rx="11" ry="8.5" fill="#2f3623" />
      <path d="M17 15c1 7 2 10 3 13" stroke="#f4b840" strokeWidth="2.6" fill="none" />
      <path d="M25 15c1 7 2 10 3 12" stroke="#f4b840" strokeWidth="2.6" fill="none" />
      <path d="M17 5c-2-3-4-4-7-5M27 5c2-3 4-4 7-5" stroke="#2f3623" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  )
}
