import type { Metadata } from 'next'
import { Quicksand, Geist_Mono, Great_Vibes, Cormorant_Garamond } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const quicksand = Quicksand({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const greatVibes = Great_Vibes({
  variable: '--font-script',
  subsets: ['latin'],
  weight: ['400'],
})

const cormorant = Cormorant_Garamond({
  variable: '--font-smallcaps',
  subsets: ['latin'],
  weight: ['500', '600'],
})

export const metadata: Metadata = {
  title: 'ListaIdeal — Lista de Presentes de Casamento',
  description: 'Crie e compartilhe sua lista de presentes de casamento.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${quicksand.variable} ${geistMono.variable} ${greatVibes.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
