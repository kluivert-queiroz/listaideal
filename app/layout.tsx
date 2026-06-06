import type { Metadata } from 'next'
import { Quicksand, Geist_Mono, Dancing_Script } from 'next/font/google'
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

const dancing = Dancing_Script({
  variable: '--font-dancing',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
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
      className={`${quicksand.variable} ${geistMono.variable} ${dancing.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
