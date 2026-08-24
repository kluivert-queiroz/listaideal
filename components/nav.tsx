'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { logoutAction } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'

export function Nav({ email }: { email: string }) {
  const [pending, startTransition] = useTransition()

  function handleLogout() {
    startTransition(async () => {
      await logoutAction()
    })
  }

  return (
    <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="font-script text-4xl leading-none text-primary">
          ListaIdeal
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden sm:block">{email}</span>
          <Button variant="outline" size="sm" onClick={handleLogout} disabled={pending}>
            {pending ? 'Saindo…' : 'Sair'}
          </Button>
        </div>
      </div>
    </header>
  )
}
