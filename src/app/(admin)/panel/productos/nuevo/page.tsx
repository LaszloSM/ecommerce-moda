import { getCategories } from '@/features/admin/actions'
import { ProductForm } from '../ProductForm'

export const metadata = { title: 'Nuevo Producto — Panel Admin' }

export default async function NuevoProductoPage() {
  const categories = await getCategories()
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <a href="/panel/productos" className="text-violet-400 hover:text-violet-300 text-sm">← Volver</a>
        <div>
          <h1 className="text-2xl font-bold text-white">Nuevo Producto</h1>
          <p className="text-white/40 text-sm mt-0.5">Agrega un producto al catálogo</p>
        </div>
      </div>
      <div className="rounded-xl p-6 border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <ProductForm categories={categories} />
      </div>
    </div>
  )
}
