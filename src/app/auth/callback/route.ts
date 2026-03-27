import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const next = searchParams.get('next') ?? '/'

  // Supabase OAuth error (e.g. Database error saving new user)
  if (error) {
    const msg = errorDescription ? encodeURIComponent(errorDescription) : 'auth_error'
    return NextResponse.redirect(`${origin}/login?error=${msg}`)
  }

  if (code) {
    const supabase = await createClient()
    const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (!exchangeError && sessionData.user) {
      // Ensure profile exists (covers Google OAuth and email confirmation)
      const admin = createAdminClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin.from('profiles') as any).upsert({
        id: sessionData.user.id,
        email: sessionData.user.email ?? '',
        full_name: sessionData.user.user_metadata?.full_name ?? sessionData.user.email ?? '',
        avatar_url: sessionData.user.user_metadata?.avatar_url ?? null,
      }, { onConflict: 'id' })

      // Set role in JWT claims if not already set (e.g. new Google OAuth users)
      if (!sessionData.user.app_metadata?.role) {
        await admin.auth.admin.updateUserById(sessionData.user.id, {
          app_metadata: { role: 'buyer' },
        })
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
