'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getSiteUrl } from '@/lib/utils'
import type { ActionState } from '@/lib/types'

const USERNAME_REGEX = /^[a-zA-Z0-9_.]{3,20}$/

const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Usuário ou senha incorretos.').max(254),
  password: z.string().min(1, 'A senha é obrigatória.'),
})

const registerSchema = z.object({
  email: z.string().email('Digite um e-mail válido.'),
  username: z
    .string()
    .trim()
    .regex(
      USERNAME_REGEX,
      'O usuário deve ter 3-20 caracteres (letras, números, "_" ou ".").'
    ),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.'),
})

// Same message regardless of which part of the lookup failed -- distinguishing
// "usuário não existe" from "senha errada" (or "email" from "username") would
// turn this into an account enumeration oracle.
const INVALID_LOGIN_ERROR = { error: 'Usuário ou senha incorretos.' } as const

type ServiceClient = ReturnType<typeof createServiceClient>

/**
 * The login field accepts either identifier. An email always contains '@'
 * (usernames never do, per USERNAME_REGEX), so that alone disambiguates
 * which lookup path to take -- no need for the user to pick.
 */
async function resolveLoginEmail(
  identifier: string,
  serviceClient: ServiceClient
): Promise<string | null> {
  if (identifier.includes('@')) return identifier

  if (!USERNAME_REGEX.test(identifier)) return null

  // Runs before any session exists, so it must go through the service-role
  // client -- the profiles RLS policy only lets a user read their own row,
  // which is useless for resolving someone else's username at login time.
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('id')
    .ilike('username', identifier)
    .maybeSingle()

  if (!profile) return null

  const { data: userData, error } = await serviceClient.auth.admin.getUserById(profile.id)
  if (error || !userData.user?.email) return null

  return userData.user.email
}

export async function loginAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    identifier: formData.get('identifier'),
    password: formData.get('password'),
  })

  if (!parsed.success) return INVALID_LOGIN_ERROR

  const serviceClient = createServiceClient()
  const email = await resolveLoginEmail(parsed.data.identifier, serviceClient)

  if (!email) return INVALID_LOGIN_ERROR

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  })

  if (error) return INVALID_LOGIN_ERROR

  redirect('/dashboard')
}

export async function registerAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    email: formData.get('email'),
    username: formData.get('username'),
    password: formData.get('password'),
  })

  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { email, username, password } = parsed.data

  // Checked proactively so a taken username fails before an auth user is
  // created -- revealing "this username is taken" here is normal signup UX,
  // unlike at login where the same disclosure would aid enumeration.
  const serviceClient = createServiceClient()
  const { data: existing } = await serviceClient
    .from('profiles')
    .select('id')
    .ilike('username', username)
    .maybeSingle()

  if (existing) return { error: 'Este nome de usuário já está em uso.' }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) return { error: error.message }
  if (!data.user) return { error: 'Não foi possível criar a conta.' }

  const { error: profileError } = await supabase
    .from('profiles')
    .insert({ id: data.user.id, username })

  // The auth user now exists without a profile (email confirmation is off in
  // this project, so signUp already produced a session) -- surface a message
  // that at least stops the user from repeating the same failing username on
  // a fresh, orphaned account. Manual cleanup is out of scope for the POC.
  if (profileError) {
    return {
      error: 'Conta criada, mas o nome de usuário não pôde ser salvo. Tente outro nome.',
    }
  }

  redirect('/dashboard')
}

export async function forgotPasswordAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = (formData.get('email') as string | null)?.trim()
  if (!email) return { error: 'O e-mail é obrigatório.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getSiteUrl()}/update-password`,
  })

  if (error) return { error: error.message }

  return { success: 'Verifique seu e-mail para o link de redefinição de senha.' }
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
