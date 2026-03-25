import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Store, PackageSearch } from 'lucide-react'
import { getStoreBySlug, getProductsByStore } from '@/features/catalog/actions'
import { ProductCard } from '@/features/catalog/components/ProductCard'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const store = await getStoreBySlug(slug)
  if (!store) return { title: 'Tienda no encontrada' }
  return {
    title: `${store.name} — Modavida`,
    description: store.description ?? `Explora los productos de ${store.name} en Modavida.`,
  }
}

export default async function StorePage({ params }: PageProps) {
  const { slug } = await params
  const store = await getStoreBySlug(slug)

  if (!store) notFound()

  const products = await getProductsByStore(store.id)

  return (
    <div className="min-h-screen">
      {/* Banner */}
      <div className="relative h-56 md:h-72 overflow-hidden">
        {store.banner_url ? (
          <Image
            src={store.banner_url}
            alt={`Banner de ${store.name}`}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-violet-900/80 via-[#302b63] to-[#0f0c29]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0c29] via-[#0f0c29]/40 to-transparent" />
      </div>

      {/* Store info card */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="relative -mt-20 mb-12">
          <div className="bg-white/5 backdrop-blur-xl border border-white/15 rounded-2xl p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Logo */}
            <div className="relative flex-shrink-0">
              {store.logo_url ? (
                <Image
                  src={store.logo_url}
                  alt={`Logo de ${store.name}`}
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-white/20 shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-violet-600/20 border-2 border-violet-400/30 flex items-center justify-center">
                  <Store className="w-12 h-12 text-violet-400" />
                </div>
              )}
            </div>

            {/* Name + description */}
            <div className="flex-1 min-w-0">
              <h1 className="font-playfair text-3xl md:text-4xl font-bold text-white mb-2">
                {store.name}
              </h1>
              {store.description && (
                <p className="text-white/60 text-base leading-relaxed max-w-2xl">
                  {store.description}
                </p>
              )}
              <p className="text-white/40 text-sm mt-3">
                {products.length} {products.length === 1 ? 'producto' : 'productos'} disponibles
              </p>
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="pb-16">
          <h2 className="font-playfair text-2xl font-bold text-white mb-8">Productos de la tienda</h2>

          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
              {products.map((product) => {
                const productStore = product.stores as { name: string; slug: string } | null
                return (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    slug={product.slug}
                    price={product.price}
                    comparePrice={product.compare_price ?? undefined}
                    images={product.images ?? []}
                    storeName={productStore?.name ?? store.name}
                    storeSlug={slug}
                  />
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-white/40">
              <PackageSearch className="w-16 h-16 mb-4 opacity-40" />
              <p className="text-lg font-medium mb-2">Sin productos disponibles</p>
              <p className="text-sm text-white/30">Esta tienda aún no ha publicado productos.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
