import Link from 'next/link'
import { getAdminOrders } from '@/features/admin/actions'
import { formatCOP } from '@/lib/utils/currency'

export const metadata = { title: 'Pedidos — Panel Admin' }

const STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: '#fbbf24' },
  confirmed: { label: 'Confirmado', color: '#60a5fa' },
  processing: { label: 'Procesando', color: '#a78bfa' },
  shipped: { label: 'Enviado', color: '#34d399' },
  delivered: { label: 'Entregado', color: '#4ade80' },
  cancelled: { label: 'Cancelado', color: '#ef4444' },
  refunded: { label: 'Reembolsado', color: '#f9a8d4' },
}

export default async function PedidosPage() {
  const { orders, total } = await getAdminOrders(1, 50)
  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Pedidos</h1>
        <p className="text-white/40 text-sm mt-0.5">{total} pedidos en total</p>
      </div>
      <div className="rounded-xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">ID</th>
                <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Cliente</th>
                <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Total</th>
                <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Estado</th>
                <th className="px-4 py-3 text-left text-xs text-white/50 font-medium hidden md:table-cell">Fecha</th>
                <th className="px-4 py-3 text-right text-xs text-white/50 font-medium">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o: any) => (
                <tr key={o.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-mono text-xs text-white/40">#{o.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-white/80">{o.profiles?.full_name ?? o.profiles?.email ?? '—'}</td>
                  <td className="px-4 py-3 text-violet-300 font-semibold">{formatCOP(o.total)}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ background: `${STATUS[o.status]?.color ?? '#9ca3af'}20`, color: STATUS[o.status]?.color ?? '#9ca3af' }}>
                      {STATUS[o.status]?.label ?? o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/40 text-xs hidden md:table-cell">
                    {new Date(o.created_at).toLocaleDateString('es-CO')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/panel/pedidos/${o.id}`} className="text-xs text-violet-400 hover:text-violet-300">Ver →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && (
            <div className="py-12 text-center text-white/30 text-sm">Sin pedidos aún</div>
          )}
        </div>
      </div>
    </div>
  )
}
