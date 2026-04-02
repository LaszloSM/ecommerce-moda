import { getOrderDetail } from '@/features/admin/actions'
import { formatCOP } from '@/lib/utils/currency'
import { notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { updateOrderStatus, updateOrderTracking } from '@/features/admin/actions'

export default async function PedidoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await getOrderDetail(id)
  if (!order) notFound()

  const STATUS_OPTIONS = ['pending','confirmed','processing','shipped','delivered','cancelled','refunded']
  const STATUS_LABELS: Record<string, string> = {
    pending: 'Pendiente', confirmed: 'Confirmado', processing: 'Procesando',
    shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado', refunded: 'Reembolsado'
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <a href="/panel/pedidos" className="text-violet-400 hover:text-violet-300 text-sm">← Pedidos</a>
        <h1 className="text-xl font-bold text-white">Pedido #{order.id.slice(0,8)}</h1>
        <span className="text-xs text-white/40">{new Date(order.created_at).toLocaleDateString('es-CO')}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl p-4 border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-3">Cliente</h3>
          <p className="text-white/80 font-medium">{order.profiles?.full_name ?? '—'}</p>
          <p className="text-white/50 text-sm">{order.profiles?.email}</p>
          {order.profiles?.phone && <p className="text-white/50 text-sm">{order.profiles.phone}</p>}
        </div>
        <div className="rounded-xl p-4 border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-3">Dirección de envío</h3>
          {order.shipping_address ? (
            <div className="text-white/70 text-sm space-y-0.5">
              <p className="font-medium">{order.shipping_address.full_name}</p>
              <p>{order.shipping_address.address_line1}</p>
              {order.shipping_address.address_line2 && <p>{order.shipping_address.address_line2}</p>}
              <p>{order.shipping_address.city}, {order.shipping_address.state}</p>
              {order.shipping_address.phone && <p>{order.shipping_address.phone}</p>}
            </div>
          ) : <p className="text-white/30 text-sm">Sin dirección registrada</p>}
        </div>
      </div>

      <div className="rounded-xl p-4 border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-3">Productos</h3>
        <div className="space-y-2">
          {(order.order_items ?? []).map((item: any) => (
            <div key={item.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <div>
                <p className="text-white/80 text-sm font-medium">{item.product_name}</p>
                <p className="text-white/40 text-xs">x{item.quantity} × {formatCOP(item.price)}</p>
              </div>
              <span className="text-violet-300 font-semibold text-sm">{formatCOP(item.subtotal)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 border-t border-white/10">
            <span className="text-white/70 font-semibold">Total</span>
            <span className="text-violet-300 font-bold text-lg">{formatCOP(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl p-4 border border-white/10 space-y-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <div>
          <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-2">Actualizar estado</h3>
          <form action={async (formData: FormData) => {
            'use server'
            const status = formData.get('status') as string
            await updateOrderStatus(id, status)
            revalidatePath(`/panel/pedidos/${id}`)
          }} className="flex gap-3">
            <select name="status" defaultValue={order.status}
              className="flex-1 bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:border-violet-500 focus:outline-none">
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s} style={{ background: '#1a1a2e' }}>{STATUS_LABELS[s] ?? s}</option>
              ))}
            </select>
            <button type="submit" className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors">
              Actualizar
            </button>
          </form>
        </div>
        <div>
          <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-2">Número de tracking</h3>
          <form action={async (formData: FormData) => {
            'use server'
            const tracking = formData.get('tracking') as string
            if (tracking.trim()) await updateOrderTracking(id, tracking.trim())
            revalidatePath(`/panel/pedidos/${id}`)
          }} className="flex gap-3">
            <input name="tracking" defaultValue={order.tracking_number ?? ''} placeholder="TRK-123456789"
              className="flex-1 bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm placeholder:text-white/30 focus:border-violet-500 focus:outline-none" />
            <button type="submit" className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors">
              Guardar
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
