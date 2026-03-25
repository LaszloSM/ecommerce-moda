import type { Metadata } from 'next'
import { getProductsByCategory } from '@/features/catalog/actions'
import { ProductCard } from '@/features/catalog/components/ProductCard'
import { SlidersHorizontal, PackageSearch } from 'lucide-react'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ sortBy?: string; minPrice?: string; maxPrice?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const categoryName = slug.charAt(0).toUpperCase() + slug.slice(1)
  return {
    title: `${categoryName} — Modavida`,
    description: `Explora nuestra colección de ${categoryName.toLowerCase()}. Las mejores marcas colombianas.`,
  }
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const sp = await searchParams

  const sortBy = (sp.sortBy as 'price_asc' | 'price_desc' | 'newest' | undefined) ?? 'newest'
  const minPrice = sp.minPrice ? Number(sp.minPrice) : undefined
  const maxPrice = sp.maxPrice ? Number(sp.maxPrice) : undefined

  const products = await getProductsByCategory(slug, { sortBy, minPrice, maxPrice })
  const categoryName = slug.charAt(0).toUpperCase() + slug.slice(1)

  return (
    <div className="min-h-screen py-10 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <nav className="text-sm text-white/40 mb-3">
            <a href="/" className="hover:text-white/70 transition-colors">
              Inicio
            </a>
            <span className="mx-2">/</span>
            <span className="text-white/70">{categoryName}</span>
          </nav>
          <h1 className="font-playfair text-4xl md:text-5xl font-bold text-white">{categoryName}</h1>
          <p className="text-white/50 mt-2">
            {products.length} {products.length === 1 ? 'producto' : 'productos'} encontrados
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar filters */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <form className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-2 text-white font-semibold">
                <SlidersHorizontal className="w-4 h-4 text-violet-400" />
                Filtros
              </div>

              {/* Sort */}
              <div className="space-y-2">
                <label className="text-xs text-white/50 font-medium uppercase tracking-wider">
                  Ordenar por
                </label>
                <select
                  name="sortBy"
                  defaultValue={sortBy}
                  className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"
                >
                  <option value="newest" className="bg-[#1a1530]">
                    Más recientes
                  </option>
                  <option value="price_asc" className="bg-[#1a1530]">
                    Precio: menor a mayor
                  </option>
                  <option value="price_desc" className="bg-[#1a1530]">
                    Precio: mayor a menor
                  </option>
                </select>
              </div>

              {/* Price range */}
              <div className="space-y-2">
                <label className="text-xs text-white/50 font-medium uppercase tracking-wider">
                  Precio mínimo
                </label>
                <input
                  type="number"
                  name="minPrice"
                  defaultValue={minPrice}
                  placeholder="Ej: 50000"
                  min={0}
                  className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-white/50 font-medium uppercase tracking-wider">
                  Precio máximo
                </label>
                <input
                  type="number"
                  name="maxPrice"
                  defaultValue={maxPrice}
                  placeholder="Ej: 500000"
                  min={0}
                  className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
              >
                Aplicar filtros
              </button>

              {(sortBy !== 'newest' || minPrice || maxPrice) && (
                <a
                  href={`/categoria/${slug}`}
                  className="block text-center text-xs text-violet-400 hover:text-violet-300 transition-colors"
                >
                  Limpiar filtros
                </a>
              )}
            </form>
          </aside>

          {/* Product grid */}
          <div className="flex-1">
            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 justify-items-center">
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
              <div className="flex flex-col items-center justify-center py-32 text-white/40">
                <PackageSearch className="w-16 h-16 mb-4 opacity-40" />
                <p className="text-xl font-medium mb-2">Sin resultados</p>
                <p className="text-sm text-white/30">
                  No hay productos en esta categoría con los filtros seleccionados.
                </p>
                <a
                  href={`/categoria/${slug}`}
                  className="mt-6 text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors"
                >
                  Limpiar filtros
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
