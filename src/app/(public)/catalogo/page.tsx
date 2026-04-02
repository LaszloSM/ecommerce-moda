import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/features/catalog/components/ProductCard'
import { ShoppingBag } from 'lucide-react'
import type { Tables } from '@/lib/types/database'

export const metadata = { title: 'Catálogo — MODAVIDA' }

type CatalogoProduct = Pick<Tables<'products'>, 'id' | 'name' | 'slug' | 'price' | 'compare_price' | 'images'>

export default async function CatalogoPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('id, name, slug, price, compare_price, images')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const products = (data ?? []) as CatalogoProduct[]

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="font-playfair text-3xl font-bold text-white">Catálogo completo</h1>
        <p className="text-white/50 text-sm mt-1">{products.length} productos disponibles</p>
      </div>
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              id={p.id}
              name={p.name}
              slug={p.slug}
              price={p.price}
              comparePrice={p.compare_price ?? undefined}
              images={(p.images as string[]) ?? []}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-white/40">
          <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p>Próximamente productos disponibles</p>
        </div>
      )}
    </div>
  )
}
