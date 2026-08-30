export function PoweredBy() {
  return (
    <>
      Powered by{' '}
      <a
        href="https://www.linkedin.com/in/kluivert-queiroz"
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-primary underline decoration-primary/40 underline-offset-4 transition-colors hover:text-script-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        Kluivert Queiroz
      </a>
    </>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t border-decor-line bg-muted/50 px-4 py-5 text-center text-xs text-muted-foreground">
      <p><PoweredBy /></p>
    </footer>
  )
}
