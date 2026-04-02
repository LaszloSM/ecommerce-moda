import { getAdminProducts } from '@/features/admin/actions'
import { ProductsTable } from './ProductsTable'

export const metadata = { title: 'Productos — Panel Admin' }

export default async function ProductosPage() {
  const { products } = await getAdminProducts(1, 100)
  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Productos</h1>
        <p className="text-white/40 text-sm mt-0.5">Gestiona tu catálogo de productos</p>
      </div>
      <ProductsTable products={products} />
    </div>
  )
}
