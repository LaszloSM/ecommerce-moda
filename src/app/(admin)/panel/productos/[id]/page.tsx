import { createClient } from '@/lib/supabase/server'
import { getCategories } from '@/features/admin/actions'
import { ProductForm } from '../ProductForm'
import { notFound } from 'next/navigation'

export default async function EditarProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: product } = await (supabase as any)
    .from('products')
    .select('*')
    .eq('id', id)
    .single()
  if (!product) notFound()
  const categories = await getCategories()

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <a href="/panel/productos" className="text-violet-400 hover:text-violet-300 text-sm">← Volver</a>
        <div>
          <h1 className="text-2xl font-bold text-white">Editar Producto</h1>
          <p className="text-white/40 text-sm mt-0.5">{product.name}</p>
        </div>
      </div>
      <div className="rounded-xl p-6 border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <ProductForm categories={categories} product={product} />
      </div>
    </div>
  )
}
