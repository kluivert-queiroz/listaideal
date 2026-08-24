import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-harvest min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <Link
        href="/"
        className="font-script text-5xl mb-8 text-primary"
      >
        ListaIdeal
      </Link>
      <div className="w-full max-w-sm">{children}</div>
      <p className="mt-8 text-xs text-muted-foreground">
        Sua lista de presentes de casamento, com todo o carinho.
      </p>
    </div>
  )
}
