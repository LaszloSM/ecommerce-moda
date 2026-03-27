import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getSellerStore, getSellerProducts } from '@/features/dashboard/actions'
import { ProductsTable } from './ProductsTable'

export default async function ProductosPage() {
  const store = await getSellerStore()

  if (!store) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-white/50">No tienes una tienda activa.</p>
      </div>
    )
  }

  const products = await getSellerProducts(store.id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-3xl font-bold text-white"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Productos
          </h1>
          <p className="text-white/50 mt-1">{products.length} producto{products.length !== 1 ? 's' : ''} en tu tienda</p>
        </div>
        <Link
          href="/dashboard/productos/nuevo"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors shadow-[0_4px_14px_0_rgba(124,58,237,0.4)]"
        >
          <Plus className="w-4 h-4" />
          Añadir producto
        </Link>
      </div>

      {/* Table */}
      <ProductsTable products={products} />
    </div>
  )
}
