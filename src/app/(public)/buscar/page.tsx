import type { Metadata } from 'next'
import { Search, PackageSearch } from 'lucide-react'
import { searchProducts } from '@/features/catalog/actions'
import { ProductCard } from '@/features/catalog/components/ProductCard'

interface PageProps {
  searchParams: Promise<{ q?: string }>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { q } = await searchParams
  if (!q) return { title: 'Buscar — Modavida' }
  return {
    title: `"${q}" — Modavida`,
    description: `Resultados de búsqueda para "${q}" en Modavida.`,
  }
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams
  const query = q?.trim() ?? ''

  const products = query ? await searchProducts(query) : []

  return (
    <div className="min-h-screen py-10 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Search bar */}
        <form method="GET" action="/buscar" className="mb-10">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 pointer-events-none" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Buscar productos, marcas, categorías..."
              autoFocus={!query}
              className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white/8 backdrop-blur-xl border border-white/15 text-white placeholder:text-white/30 text-lg focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
            />
          </div>
        </form>

        {/* No query state */}
        {!query && (
          <div className="flex flex-col items-center justify-center py-32 text-white/40">
            <Search className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-xl font-medium mb-2">¿Qué estás buscando?</p>
            <p className="text-sm text-white/30">
              Ingresa un término de búsqueda para encontrar productos.
            </p>
          </div>
        )}

        {/* Results */}
        {query && (
          <>
            <div className="mb-8">
              <h1 className="font-playfair text-2xl md:text-3xl font-bold text-white">
                {products.length > 0
                  ? `${products.length} resultado${products.length !== 1 ? 's' : ''} para "${query}"`
                  : `Sin resultados para "${query}"`}
              </h1>
            </div>

            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
                {products.map((product) => {
                  const store = product.stores as { name: string; slug: string } | null
                  return (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      slug={product.slug}
                      price={product.price}
                      comparePrice={product.compare_price ?? undefined}
                      images={product.images ?? []}
                      storeName={store?.name}
                      storeSlug={store?.slug}
                    />
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-white/40">
                <PackageSearch className="w-16 h-16 mb-4 opacity-40" />
                <p className="text-lg font-medium mb-2">No encontramos resultados</p>
                <p className="text-sm text-white/30 text-center max-w-sm">
                  Intenta con palabras clave diferentes o explora nuestras categorías.
                </p>
                <div className="mt-8 flex gap-3 flex-wrap justify-center">
                  {['mujer', 'hombre', 'accesorios', 'calzado'].map((cat) => (
                    <a
                      key={cat}
                      href={`/categoria/${cat}`}
                      className="px-4 py-2 rounded-full bg-white/8 border border-white/15 text-sm text-white/60 hover:text-white hover:border-violet-400/50 transition-all capitalize"
                    >
                      {cat}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
