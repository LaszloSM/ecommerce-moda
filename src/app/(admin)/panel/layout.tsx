import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/layout/AdminSidebar'

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role, full_name, email')
    .eq('id', user.id)
    .single() as { data: { role: string; full_name: string | null; email: string | null } | null }

  if (!profile || profile.role !== 'admin') redirect('/')

  return (
    <div className="flex min-h-screen">
      <AdminSidebar user={{ name: (profile as any).full_name ?? (profile as any).email ?? 'Admin', email: (profile as any).email ?? '' }} />
      <main className="flex-1 ml-0 md:ml-64 p-6 min-h-screen"
        style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>
        {children}
      </main>
    </div>
  )
}
