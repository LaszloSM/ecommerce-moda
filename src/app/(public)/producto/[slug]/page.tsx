import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Store,
  Package,
  ChevronRight,
  Truck,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react'
import { getProductBySlug, getProductRating } from '@/features/catalog/actions'
import { ProductGallery } from '@/features/catalog/components/ProductGallery'
import { AddToCartButton } from '@/features/catalog/components/AddToCartButton'
import { RatingStars } from '@/components/ui/rating-stars'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ReviewList } from '@/features/reviews/components/ReviewList'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return { title: 'Producto no encontrado' }
  return {
    title: product.name,
    description: product.description ?? `Compra ${product.name} en Modavida`,
    openGraph: {
      images: product.images?.[0] ? [product.images[0]] : [],
    },
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params

  const [product, productRating] = await Promise.all([
    getProductBySlug(slug),
    getProductRating(slug).catch(() => ({ average: 0, count: 0 })),
  ])

  if (!product) notFound()

  const store = product.stores
  const category = product.categories
  const variants = product.product_variants ?? []

  const stockStatus =
    product.stock === 0
      ? { label: 'Sin stock', color: 'text-rose-400' }
      : product.stock <= 5
        ? { label: `¡Solo quedan ${product.stock}!`, color: 'text-amber-400' }
        : { label: 'En stock', color: 'text-emerald-400' }

  const firstImage = product.images?.[0] ?? ''

  return (
    <div className="min-h-screen py-10 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-white/40 mb-8">
          <Link href="/" className="hover:text-white/70 transition-colors">
            Inicio
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          {category && (
            <>
              <Link
                href={`/categoria/${category.slug}`}
                className="hover:text-white/70 transition-colors"
              >
                {category.name}
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
            </>
          )}
          <span className="text-white/60 line-clamp-1">{product.name}</span>
        </nav>

        {/* Product layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Gallery */}
          <div>
            <ProductGallery images={product.images ?? []} productName={product.name} />
          </div>

          {/* Info */}
          <div className="space-y-6">
            {/* Store link */}
            {store && (
              <Link
                href={`/tienda/${store.slug}`}
                className="inline-flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors"
              >
                {store.logo_url ? (
                  <Image
                    src={store.logo_url}
                    alt={store.name}
                    width={20}
                    height={20}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <Store className="w-4 h-4" />
                )}
                {store.name}
              </Link>
            )}

            {/* Name */}
            <h1 className="font-playfair text-3xl md:text-4xl font-bold text-white leading-tight">
              {product.name}
            </h1>

            {/* Rating */}
            {productRating.count > 0 && (
              <div className="flex items-center gap-2">
                <RatingStars value={productRating.average} readonly size="md" />
                <span className="text-sm text-white/50">
                  {productRating.average} ({productRating.count} reseñas)
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-violet-400">
                ${product.price.toLocaleString('es-CO')}
              </span>
              {product.compare_price && product.compare_price > product.price && (
                <span className="text-xl text-white/35 line-through">
                  ${product.compare_price.toLocaleString('es-CO')}
                </span>
              )}
              {product.compare_price && product.compare_price > product.price && (
                <Badge className="bg-rose-600/80 text-white border-rose-400/30 text-xs font-bold">
                  -
                  {Math.round(
                    ((product.compare_price - product.price) / product.compare_price) * 100,
                  )}
                  %
                </Badge>
              )}
            </div>

            {/* Stock */}
            <div className={`flex items-center gap-2 text-sm font-medium ${stockStatus.color}`}>
              <Package className="w-4 h-4" />
              {stockStatus.label}
            </div>

            {/* Variants */}
            {variants.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm text-white/60 font-medium">Variantes disponibles</p>
                <div className="flex flex-wrap gap-2">
                  {variants.map((variant) => (
                    <label key={variant.id} className="cursor-pointer">
                      <input type="radio" name="variant" value={variant.id} className="sr-only peer" />
                      <span className="inline-flex items-center px-4 py-2 rounded-xl border border-white/15 bg-white/5 text-sm text-white/70 peer-checked:border-violet-500 peer-checked:bg-violet-600/20 peer-checked:text-white hover:border-white/30 transition-all">
                        {variant.name ?? `Variante ${variant.id.slice(0, 4)}`}
                        {variant.price_modifier !== 0 && (
                          <span className="ml-1.5 text-xs text-white/40">
                            {variant.price_modifier > 0 ? '+' : ''}$
                            {variant.price_modifier.toLocaleString('es-CO')}
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Add to cart */}
            <div className="pt-2">
              <AddToCartButton
                productId={product.id}
                name={product.name}
                price={product.price}
                image={firstImage}
                storeId={product.store_id}
                storeName={store?.name ?? ''}
                disabled={product.stock === 0}
              />
            </div>

            {/* Shipping info */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { icon: Truck, label: 'Envío gratis' },
                { icon: RotateCcw, label: 'Devoluciones' },
                { icon: ShieldCheck, label: 'Compra segura' },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/5 border border-white/8 text-center"
                >
                  <Icon className="w-5 h-5 text-violet-400" />
                  <span className="text-xs text-white/50">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="descripcion" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10 h-auto p-1 rounded-2xl gap-1">
            <TabsTrigger
              value="descripcion"
              className="text-white/60 data-active:text-white data-active:bg-violet-600/30 rounded-xl px-6 py-2.5 text-sm font-medium"
            >
              Descripción
            </TabsTrigger>
            <TabsTrigger
              value="resenas"
              className="text-white/60 data-active:text-white data-active:bg-violet-600/30 rounded-xl px-6 py-2.5 text-sm font-medium"
            >
              Reseñas
            </TabsTrigger>
            <TabsTrigger
              value="envio"
              className="text-active:text-white data-active:bg-violet-600/30 rounded-xl px-6 py-2.5 text-sm font-medium text-white/60"
            >
              Envío
            </TabsTrigger>
          </TabsList>

          <TabsContent value="descripcion">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
              {product.description ? (
                <div className="prose prose-invert max-w-none text-white/70 leading-relaxed">
                  <p className="whitespace-pre-wrap">{product.description}</p>
                </div>
              ) : (
                <p className="text-white/40 italic">Sin descripción disponible.</p>
              )}
              {product.tags && product.tags.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full bg-violet-600/15 border border-violet-400/20 text-xs text-violet-300"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="resenas">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-6">
              <ReviewList productId={product.id} />
              <div className="border-t border-white/10 pt-4 text-center">
                <p className="text-white/50 text-sm">
                  ¿Compraste este producto?{' '}
                  <Link href="/cuenta/pedidos" className="text-violet-400 hover:text-violet-300 underline">
                    Deja tu reseña desde Mis Pedidos
                  </Link>
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="envio">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-4">
              {[
                {
                  icon: Truck,
                  title: 'Envío estándar',
                  desc: 'Entrega en 3-5 días hábiles. Gratis en pedidos superiores a $150.000.',
                },
                {
                  icon: Package,
                  title: 'Envío express',
                  desc: 'Entrega en 1-2 días hábiles. Disponible para Bogotá, Medellín y Cali.',
                },
                {
                  icon: RotateCcw,
                  title: 'Devoluciones',
                  desc: 'Tienes 30 días para devolver el producto sin preguntas.',
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="flex gap-4 items-start p-4 rounded-xl bg-white/3 border border-white/8"
                >
                  <div className="w-10 h-10 rounded-full bg-violet-600/15 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium mb-1">{title}</p>
                    <p className="text-white/50 text-sm">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
