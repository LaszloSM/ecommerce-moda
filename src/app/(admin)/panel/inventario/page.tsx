import { getLowStockProducts, updateProductStock } from '@/features/admin/actions'
import { revalidatePath } from 'next/cache'
import { AlertTriangle, CheckCircle } from 'lucide-react'

export const metadata = { title: 'Inventario — Panel Admin' }

export default async function InventarioPage() {
  const products = await getLowStockProducts(20)
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Inventario</h1>
        <p className="text-white/40 text-sm mt-0.5">Productos con stock igual o menor a 20 unidades</p>
      </div>
      <div className="rounded-xl overflow-hidden border border-white/10">
        {products.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Producto</th>
                <th className="px-4 py-3 text-left text-xs text-white/50 font-medium hidden md:table-cell">Categoría</th>
                <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Stock actual</th>
                <th className="px-4 py-3 text-right text-xs text-white/50 font-medium">Actualizar</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p: any) => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-white/80 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-white/50 text-xs hidden md:table-cell">{p.categories?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" style={{ color: p.stock === 0 ? '#ef4444' : '#fbbf24' }} />
                      <span className="font-bold text-sm" style={{ color: p.stock === 0 ? '#ef4444' : p.stock <= 5 ? '#ef4444' : '#fbbf24' }}>
                        {p.stock === 0 ? 'AGOTADO' : `${p.stock} uds`}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={async (formData: FormData) => {
                      'use server'
                      const newStock = parseInt(formData.get('stock') as string)
                      if (!isNaN(newStock) && newStock >= 0) await updateProductStock(p.id, newStock)
                      revalidatePath('/panel/inventario')
                    }} className="flex items-center justify-end gap-2">
                      <input name="stock" type="number" min="0" defaultValue={p.stock}
                        className="w-20 bg-white/5 border border-white/10 text-white rounded-lg px-2 py-1.5 text-xs text-center focus:border-violet-500 focus:outline-none" />
                      <button type="submit" className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-medium transition-colors">
                        Guardar
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-16 text-center">
            <CheckCircle className="h-10 w-10 mx-auto mb-3 text-green-400 opacity-60" />
            <p className="text-white/50 text-sm">Todo el inventario está bien abastecido</p>
            <p className="text-white/30 text-xs mt-1">Todos los productos tienen más de 20 unidades</p>
          </div>
        )}
      </div>
    </div>
  )
}
