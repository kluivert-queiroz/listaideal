'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { loginAction } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined)

  return (
    <Card className="shadow-lg border-border/60">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl">Bem-vindo de volta</CardTitle>
        <CardDescription>Entre para gerenciar suas listas de presentes</CardDescription>
      </CardHeader>
      <form action={action}>
        <CardContent className="space-y-4">
          {state?.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="identifier">Usuário ou e-mail</Label>
            <Input
              id="identifier"
              name="identifier"
              type="text"
              placeholder="seu_usuario ou voce@exemplo.com"
              autoComplete="username"
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <Link
                href="/forgot-password"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Entrando…' : 'Entrar'}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            Não tem uma conta?{' '}
            <Link href="/register" className="text-foreground hover:underline">
              Criar conta
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
