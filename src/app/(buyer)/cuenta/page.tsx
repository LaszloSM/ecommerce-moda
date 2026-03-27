import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ShoppingBag, User, LogOut } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default async function CuentaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, email, role, created_at')
    .eq('id', user.id)
    .single()

  const profile = profileData as any
  const displayName = profile?.full_name ?? user.email ?? 'Usuario'
  const initial = displayName[0]?.toUpperCase() ?? 'U'

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1
        className="text-2xl font-bold text-white mb-8"
        style={{ fontFamily: 'Playfair Display, serif' }}
      >
        Mi Cuenta
      </h1>

      {/* Profile card */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 mb-6 flex items-center gap-4">
        <Avatar className="w-16 h-16">
          <AvatarImage src={profile?.avatar_url ?? undefined} />
          <AvatarFallback className="bg-[#7c3aed] text-white text-xl font-bold">
            {initial}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-white text-lg font-semibold">{displayName}</p>
          <p className="text-white/50 text-sm">{profile?.email ?? user.email}</p>
          <p className="text-violet-400 text-xs mt-1 capitalize">{profile?.role ?? 'buyer'}</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="space-y-3">
        <Link
          href="/cuenta/pedidos"
          className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-violet-600/20 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <p className="text-white font-medium text-sm">Mis Pedidos</p>
            <p className="text-white/40 text-xs">Ver historial de compras</p>
          </div>
        </Link>

        <Link
          href="/perfil"
          className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-violet-600/20 flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <p className="text-white font-medium text-sm">Editar Perfil</p>
            <p className="text-white/40 text-xs">Actualiza tu información personal</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
