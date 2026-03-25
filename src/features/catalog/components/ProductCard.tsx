'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart } from 'lucide-react'
import { RatingStars } from '@/components/ui/rating-stars'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  id: string
  name: string
  slug: string
  price: number
  comparePrice?: number
  images: string[]
  rating?: number
  reviewCount?: number
  storeName?: string
  storeSlug?: string
  isNew?: boolean
  onAddToCart?: () => void
}

export function ProductCard({
  id: _id,
  name,
  slug,
  price,
  comparePrice,
  images,
  rating = 0,
  reviewCount = 0,
  storeName,
  storeSlug,
  isNew,
  onAddToCart,
}: ProductCardProps) {
  const discount =
    comparePrice && comparePrice > price
      ? Math.round(((comparePrice - price) / comparePrice) * 100)
      : 0

  const imageUrl = images[0] ?? ''

  return (
    <div
      className={cn(
        'relative w-72 rounded-2xl overflow-hidden cursor-pointer group',
        'bg-white/8 backdrop-blur-xl border border-white/18',
        'shadow-[0_8px_32px_0_rgba(124,58,237,0.18)]',
        'transition-transform duration-250 ease-out hover:-translate-y-1 hover:scale-[1.02]',
      )}
    >
      <Link href={`/producto/${slug}`} className="block">
        {/* Image area */}
        <div className="relative h-60 overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              sizes="(max-width: 768px) 100vw, 288px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-violet-950/40" />
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0c29]/60 via-transparent to-transparent pointer-events-none" />

          {/* Discount badge top-left */}
          {discount > 0 && (
            <span className="absolute top-3 left-3 bg-rose-600/90 text-white text-xs font-bold px-2 py-0.5 rounded-full border border-rose-400/40">
              -{discount}%
            </span>
          )}

          {/* NUEVO badge top-right */}
          {isNew && (
            <span className="absolute top-3 right-3 bg-violet-600/90 text-white text-xs font-bold px-2 py-0.5 rounded-full border border-violet-400/40">
              NUEVO
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-2">
          {/* Stars */}
          {rating > 0 && (
            <div className="flex items-center gap-1.5">
              <RatingStars value={rating} readonly size="sm" />
              {reviewCount > 0 && (
                <span className="text-xs text-white/50">({reviewCount})</span>
              )}
            </div>
          )}

          {/* Name */}
          <h3 className="text-sm font-semibold text-white leading-snug group-hover:text-violet-300 transition-colors line-clamp-2">
            {name}
          </h3>

          {/* Store */}
          {storeName && (
            <p className="text-xs text-white/40">
              {storeSlug ? (
                <Link href={`/tienda/${storeSlug}`} className="hover:text-violet-300 transition-colors">
                  {storeName}
                </Link>
              ) : (
                storeName
              )}
            </p>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-lg font-bold" style={{ color: '#7c3aed' }}>
              ${price.toLocaleString('es-CO')}
            </span>
            {comparePrice && comparePrice > price && (
              <span className="text-sm text-white/40 line-through">
                ${comparePrice.toLocaleString('es-CO')}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Add to cart overlay slides up on hover */}
      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 p-3',
          'translate-y-full group-hover:translate-y-0 opacity-0 group-hover:opacity-100',
          'transition-all duration-250 ease-out',
        )}
      >
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onAddToCart?.()
          }}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl',
            'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500',
            'text-white text-sm font-semibold',
            'border border-violet-400/30',
            'transition-colors duration-150',
          )}
        >
          <ShoppingCart className="w-4 h-4" />
          Añadir al carrito
        </button>
      </div>
    </div>
  )
}

export default ProductCard
