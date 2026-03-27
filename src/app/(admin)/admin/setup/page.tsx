import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { changeUserRole } from '@/features/admin/actions'

async function claimSeller() {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Only allow if no sellers exist yet
  const { count } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'seller')
  if ((count ?? 0) > 0) redirect('/')

  await changeUserRole(user.id, 'seller')
  redirect('/admin')
}

export default async function SetupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // If sellers already exist, no need for setup
  const { count } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'seller')

  if ((count ?? 0) > 0) redirect('/')

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}
    >
      <div className="text-center space-y-6 max-w-md px-6">
        <div className="p-5 rounded-full bg-violet-500/15 border border-violet-400/20 w-20 h-20 flex items-center justify-center mx-auto">
          <span className="text-3xl">🛡️</span>
        </div>
        <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
          Configuración inicial
        </h1>
        <p className="text-white/60">
          No hay vendedores registrados aún. Haz clic para asignarte el rol de vendedor y obtener acceso completo a la plataforma.
        </p>
        <p className="text-white/40 text-sm">
          Conectado como: <span className="text-white/60">{user.email}</span>
        </p>
        <form action={claimSeller}>
          <button
            type="submit"
            className="w-full px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors"
          >
            Hacerme vendedor / administrador
          </button>
        </form>
      </div>
    </div>
  )
}
