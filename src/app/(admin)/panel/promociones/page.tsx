import { getAdminCoupons, createCoupon, toggleCouponActive, deleteCoupon } from '@/features/admin/actions'
import { formatCOP } from '@/lib/utils/currency'
import { revalidatePath } from 'next/cache'

export const metadata = { title: 'Promociones — Panel Admin' }

export default async function PromocionesPage() {
  const coupons = await getAdminCoupons()
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Promociones y Cupones</h1>
        <p className="text-white/40 text-sm mt-0.5">{coupons.length} cupones creados</p>
      </div>

      <div className="rounded-xl p-4 border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <h2 className="text-sm font-semibold text-white/60 mb-3">Nuevo cupón</h2>
        <form action={async (formData: FormData) => {
          'use server'
          await createCoupon(formData)
          revalidatePath('/panel/promociones')
        }} className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <input name="code" required placeholder="VERANO20" className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm placeholder:text-white/30 uppercase focus:border-violet-500 focus:outline-none" />
          <select name="type" className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:border-violet-500 focus:outline-none">
            <option value="percentage" style={{ background: '#1a1a2e' }}>Porcentaje (%)</option>
            <option value="fixed" style={{ background: '#1a1a2e' }}>Valor fijo (COP)</option>
          </select>
          <input name="value" type="number" min="0" required placeholder="20" className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm placeholder:text-white/30 focus:border-violet-500 focus:outline-none" />
          <input name="min_order_amount" type="number" min="0" placeholder="Monto mín. COP" className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm placeholder:text-white/30 focus:border-violet-500 focus:outline-none" />
          <input name="max_uses" type="number" min="0" placeholder="Máx. usos" className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm placeholder:text-white/30 focus:border-violet-500 focus:outline-none" />
          <input name="expires_at" type="date" className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:border-violet-500 focus:outline-none" />
          <button type="submit" className="md:col-span-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors">
            Crear cupón
          </button>
        </form>
      </div>

      <div className="rounded-xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Código</th>
                <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Descuento</th>
                <th className="px-4 py-3 text-left text-xs text-white/50 font-medium hidden md:table-cell">Usos</th>
                <th className="px-4 py-3 text-left text-xs text-white/50 font-medium hidden md:table-cell">Vence</th>
                <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Estado</th>
                <th className="px-4 py-3 text-right text-xs text-white/50 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c: any) => (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-mono font-bold text-violet-300">{c.code}</td>
                  <td className="px-4 py-3 text-white/80">
                    {c.type === 'percentage' ? `${c.value}%` : formatCOP(c.value)}
                    {c.min_order_amount ? <span className="text-white/30 text-xs ml-1">(mín {formatCOP(c.min_order_amount)})</span> : null}
                  </td>
                  <td className="px-4 py-3 text-white/50 hidden md:table-cell">{c.used_count ?? 0}{c.max_uses ? ` / ${c.max_uses}` : ''}</td>
                  <td className="px-4 py-3 text-white/40 text-xs hidden md:table-cell">{c.expires_at ? new Date(c.expires_at).toLocaleDateString('es-CO') : '—'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ background: c.is_active ? 'rgba(74,222,128,0.15)' : 'rgba(239,68,68,0.15)', color: c.is_active ? '#4ade80' : '#ef4444' }}>
                      {c.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <form action={async () => {
                        'use server'
                        await toggleCouponActive(c.id, !c.is_active)
                        revalidatePath('/panel/promociones')
                      }}>
                        <button type="submit" className="text-xs text-violet-400 hover:text-violet-300">{c.is_active ? 'Desactivar' : 'Activar'}</button>
                      </form>
                      <form action={async () => {
                        'use server'
                        await deleteCoupon(c.id)
                        revalidatePath('/panel/promociones')
                      }}>
                        <button type="submit" className="text-xs text-red-400/50 hover:text-red-400">Eliminar</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {coupons.length === 0 && (
            <div className="py-12 text-center text-white/30 text-sm">Sin cupones creados</div>
          )}
        </div>
      </div>
    </div>
  )
}
