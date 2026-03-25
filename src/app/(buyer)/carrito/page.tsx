'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ShoppingBag, Plus, Minus, Trash2, ArrowLeft, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/features/cart/store'
import { cn } from '@/lib/utils'

export default function CartPage() {
  const router = useRouter()
  const { items, storeName, removeItem, updateQuantity, getTotal } = useCartStore()
  const subtotal = getTotal()

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#0f0c29] flex flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="relative">
          <div className="absolute inset-0 bg-violet-500/20 blur-3xl rounded-full" />
          <div className="relative p-8 rounded-full bg-violet-500/10 border border-violet-400/20">
            <ShoppingBag className="w-16 h-16 text-violet-400/60" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-white">Tu carrito está vacío</h1>
          <p className="text-white/40 mt-2">Explora nuestras tiendas y agrega productos</p>
        </div>
        <Link href="/">
          <Button className="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-8">
            Seguir comprando
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f0c29]">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Mi carrito</h1>
            <p className="text-sm text-white/40 mt-0.5">
              {items.reduce((s, i) => s + i.quantity, 0)} {items.reduce((s, i) => s + i.quantity, 0) === 1 ? 'artículo' : 'artículos'}
            </p>
          </div>
          {storeName && (
            <Badge
              variant="secondary"
              className="ml-auto flex items-center gap-1.5 bg-violet-500/15 text-violet-300 border border-violet-500/25"
            >
              <Store className="w-3 h-3" />
              {storeName}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart items */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => {
              const key = `${item.productId}-${item.variantId ?? ''}`
              return (
                <div
                  key={key}
                  className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/8 backdrop-blur-sm"
                >
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-white/5">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-violet-500/20" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white line-clamp-2">{item.name}</p>
                    {item.variantId && (
                      <p className="text-xs text-white/40 mt-0.5">Variante: {item.variantId}</p>
                    )}
                    <p className="text-sm text-violet-300 font-semibold mt-1">
                      ${item.price.toLocaleString('es-CO')} c/u
                    </p>

                    <div className="flex items-center justify-between mt-3">
                      {/* Quantity controls */}
                      <div className="flex items-center gap-1 bg-white/5 rounded-lg border border-white/10">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </Button>
                        <span className="text-sm font-medium text-white w-7 text-center">
                          {item.quantity}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                          className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-bold text-white">
                          ${(item.price * item.quantity).toLocaleString('es-CO')}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.productId, item.variantId)}
                          className="h-8 w-8 text-white/30 hover:text-red-400 hover:bg-red-400/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div
              className={cn(
                'rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 space-y-4',
                'shadow-[0_4px_32px_0_rgba(124,58,237,0.15)]',
                'sticky top-6',
              )}
            >
              <h2 className="font-semibold text-white text-lg">Resumen del pedido</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-white/60">
                  <span>Subtotal</span>
                  <span className="text-white font-medium">${subtotal.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between text-white/40">
                  <span>Envío</span>
                  <span>Calculado al hacer checkout</span>
                </div>
              </div>

              <Separator className="bg-white/8" />

              <div className="flex justify-between font-bold text-white">
                <span>Total</span>
                <span className="text-xl text-violet-400">${subtotal.toLocaleString('es-CO')}</span>
              </div>

              <Link href="/checkout" className="block">
                <Button className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold h-12 text-base">
                  Proceder al checkout
                </Button>
              </Link>

              <Link href="/" className="block">
                <Button
                  variant="outline"
                  className="w-full border-white/15 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
                >
                  Seguir comprando
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
