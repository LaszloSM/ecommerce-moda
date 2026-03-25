import type { Metadata } from 'next'
import Link from 'next/link'
import { Shirt, User, Watch, ShoppingBag, Dumbbell, ArrowRight, Store } from 'lucide-react'
import { getFeaturedProducts } from '@/features/catalog/actions'
import { ProductCard } from '@/features/catalog/components/ProductCard'

export const metadata: Metadata = {
  title: 'Modavida — Moda y Accesorios',
  description: 'Descubre las últimas tendencias en moda, accesorios, calzado y más.',
}

const CATEGORIES = [
  {
    label: 'Mujer',
    slug: 'mujer',
    icon: User,
    gradient: 'from-pink-600/60 to-rose-800/60',
    border: 'border-pink-500/30',
  },
  {
    label: 'Hombre',
    slug: 'hombre',
    icon: Shirt,
    gradient: 'from-blue-600/60 to-indigo-800/60',
    border: 'border-blue-500/30',
  },
  {
    label: 'Accesorios',
    slug: 'accesorios',
    icon: Watch,
    gradient: 'from-amber-600/60 to-orange-800/60',
    border: 'border-amber-500/30',
  },
  {
    label: 'Calzado',
    slug: 'calzado',
    icon: ShoppingBag,
    gradient: 'from-emerald-600/60 to-teal-800/60',
    border: 'border-emerald-500/30',
  },
  {
    label: 'Deportivo',
    slug: 'deportivo',
    icon: Dumbbell,
    gradient: 'from-violet-600/60 to-purple-800/60',
    border: 'border-violet-500/30',
  },
]

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts(8)

  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        {/* Background gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(124,58,237,0.35)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(232,121,249,0.2)_0%,transparent_60%)]" />

        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-fuchsia-600/15 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />

        <div className="relative z-10 max-w-4xl mx-auto text-center px-6">
          <p className="text-violet-300/80 text-sm font-medium tracking-widest uppercase mb-4">
            Colección 2026
          </p>
          <h1 className="font-playfair text-6xl md:text-8xl font-bold text-white leading-tight mb-6">
            Nueva
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Colección
            </span>
          </h1>
          <p className="text-white/60 text-lg md:text-xl max-w-xl mx-auto mb-10 leading-relaxed">
            Descubre las últimas tendencias en moda, accesorios y calzado. Estilo que habla por ti.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/categoria/mujer"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold text-base hover:from-violet-500 hover:to-fuchsia-500 transition-all duration-200 shadow-lg shadow-violet-900/40"
            >
              Ver colección
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold text-base hover:bg-white/15 transition-all duration-200"
            >
              <Store className="w-4 h-4" />
              Crear tienda
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30">
          <div className="w-px h-12 bg-gradient-to-b from-transparent to-white/30" />
        </div>
      </section>

      {/* ── Categorías ── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10 text-center">
            <h2 className="font-playfair text-3xl md:text-4xl font-bold text-white mb-3">
              Explorar Categorías
            </h2>
            <p className="text-white/50 text-base">Encuentra exactamente lo que buscas</p>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-violet-800/50 scrollbar-track-transparent">
            {CATEGORIES.map(({ label, slug, icon: Icon, gradient, border }) => (
              <Link
                key={slug}
                href={`/categoria/${slug}`}
                className={`flex-shrink-0 relative flex flex-col items-center justify-center gap-3 w-40 h-44 rounded-2xl bg-gradient-to-br ${gradient} backdrop-blur-xl border ${border} hover:-translate-y-1 hover:scale-[1.03] transition-transform duration-200 group`}
              >
                <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <span className="text-white font-semibold text-sm tracking-wide">{label}</span>
                <div className="absolute inset-0 rounded-2xl bg-white/0 group-hover:bg-white/5 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Productos Destacados ── */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="font-playfair text-3xl md:text-4xl font-bold text-white mb-2">
                Productos Destacados
              </h2>
              <p className="text-white/50 text-base">Selección especial de lo mejor</p>
            </div>
            <Link
              href="/categoria/mujer"
              className="hidden sm:inline-flex items-center gap-1.5 text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors"
            >
              Ver todos
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
              {featuredProducts.map((product) => {
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
            <div className="text-center py-20 text-white/40">
              <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p className="text-lg">Próximamente productos destacados</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Banner CTA ── */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-white/5 backdrop-blur-xl border border-white/15 p-12 text-center shadow-[0_8px_48px_0_rgba(124,58,237,0.25)]">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-fuchsia-600/10 pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-violet-400/60 to-transparent" />

            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-violet-600/20 border border-violet-400/30 mb-6">
                <Store className="w-8 h-8 text-violet-300" />
              </div>
              <h2 className="font-playfair text-3xl md:text-4xl font-bold text-white mb-4">
                ¿Tienes una tienda?
              </h2>
              <p className="text-white/60 text-lg max-w-md mx-auto mb-8 leading-relaxed">
                Únete a Modavida y lleva tu negocio al siguiente nivel. Vende a miles de clientes
                apasionados por la moda.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-10 py-4 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold text-base hover:from-violet-500 hover:to-fuchsia-500 transition-all duration-200 shadow-lg shadow-violet-900/50"
              >
                Empezar ahora
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
