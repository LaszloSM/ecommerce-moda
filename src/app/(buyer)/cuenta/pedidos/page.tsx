import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export default async function MisPedidosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, total, created_at, stores(name)')
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
        Mis Pedidos
      </h1>
      {(!orders || orders.length === 0) ? (
        <div className="glass-card p-8 rounded-xl text-center">
          <p className="text-white/60 mb-4">No tienes pedidos aún</p>
          <Link href="/" className="text-[#7c3aed] hover:underline">Ir a comprar</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <div key={order.id} className="glass-card p-5 rounded-xl flex justify-between items-center">
              <div>
                <p className="text-white font-medium">Pedido #{order.id.slice(0, 8).toUpperCase()}</p>
                <p className="text-white/50 text-sm">{(order.stores as any)?.name}</p>
                <p className="text-white/40 text-xs">{new Date(order.created_at).toLocaleDateString('es-CO')}</p>
              </div>
              <div className="text-right">
                <p className="text-white font-semibold">${order.total?.toLocaleString('es-CO')}</p>
                <Badge className="mt-1">{order.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
