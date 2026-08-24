/** Divisor com abelhinha — substitui os divisores de coração. Copiado de
 *  mockups/list-page-cha-de-bebe.html:272-283. */
export function BeeDivider() {
  return (
    <div className="my-10 flex items-center justify-center" aria-hidden="true">
      <span className="h-px w-16 bg-decor-line" />
      <svg viewBox="0 0 40 28" className="mx-3 h-5 w-7">
        <g fill="none">
          <ellipse cx="14" cy="10" rx="9" ry="6" fill="#f3ead6" opacity=".9" transform="rotate(-20 14 10)" />
          <ellipse cx="26" cy="10" rx="9" ry="6" fill="#f3ead6" opacity=".9" transform="rotate(20 26 10)" />
          <ellipse cx="20" cy="18" rx="10" ry="8" fill="#d9a450" />
          <path d="M15 12c1 7 2 10 4 13M22 11c1 8 2 11 3 13" stroke="#5b4028" strokeWidth="2.4" />
          <path d="M16 6c-2-3-4-4-6-5M24 6c2-3 4-4 6-5" stroke="#5b4028" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      </svg>
      <span className="h-px w-16 bg-decor-line" />
    </div>
  )
}
