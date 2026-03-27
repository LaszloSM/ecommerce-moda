'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { LoginInput, RegisterInput, ResetPasswordInput } from './validators'

export async function signIn(data: LoginInput) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  })
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signUp(data: RegisterInput) {
  const supabase = await createClient()
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: { full_name: data.full_name },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })
  if (error) return { error: error.message }

  if (authData.user) {
    const admin = createAdminClient()

    // Auto-confirm email so users can login immediately (no SMTP required)
    await admin.auth.admin.updateUserById(authData.user.id, {
      email_confirm: true,
    })

    // Upsert profile bypassing RLS
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from('profiles') as any).upsert({
      id: authData.user.id,
      email: authData.user.email ?? data.email,
      full_name: data.full_name,
    }, { onConflict: 'id' })
  }

  return { success: '¡Cuenta creada! Ya puedes iniciar sesión.' }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function resetPassword(data: ResetPasswordInput) {
  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/cuenta/nueva-contrasena`,
  })
  if (error) return { error: error.message }
  return { success: 'Revisa tu email para restablecer tu contraseña.' }
}

export async function signInWithGoogle() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })
  if (error) return { error: error.message }
  if (data.url) redirect(data.url)
}
