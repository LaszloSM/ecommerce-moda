'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag, Plus, Minus, Trash2 } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useCartStore } from '@/features/cart/store'
import { cn } from '@/lib/utils'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, removeItem, updateQuantity } = useCartStore()

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const storeName = items[0]?.storeName

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent
        side="right"
        className={cn(
          'w-full sm:max-w-md p-0 flex flex-col',
          'bg-[#0f0c29]/95 backdrop-blur-2xl border-l border-white/10',
        )}
      >
        {/* Header */}
        <SheetHeader className="px-5 py-4 border-b border-white/8 shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-white text-lg font-semibold">
              Mi carrito
              {items.length > 0 && (
                <span className="ml-2 text-sm font-normal text-violet-300/60">
                  ({items.length} {items.length === 1 ? 'artículo' : 'artículos'})
                </span>
              )}
            </SheetTitle>
          </div>
          {storeName && (
            <p className="text-xs text-violet-300/50 mt-0.5">
              Vendedor: {storeName}
            </p>
          )}
        </SheetHeader>

        {items.length === 0 ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="relative">
              <div className="absolute inset-0 bg-violet-500/20 blur-2xl rounded-full" />
              <div className="relative p-6 rounded-full bg-violet-500/10 border border-violet-400/20">
                <ShoppingBag className="w-12 h-12 text-violet-400/60" />
              </div>
            </div>
            <div>
              <p className="text-white font-medium">Tu carrito está vacío</p>
              <p className="text-sm text-white/40 mt-1">Agrega artículos para comenzar</p>
            </div>
            <Button
              variant="outline"
              onClick={onClose}
              className="border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20"
            >
              Seguir comprando
            </Button>
          </div>
        ) : (
          <>
            {/* Items list */}
            <ScrollArea className="flex-1 px-5 py-3">
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 p-3 rounded-xl bg-white/5 border border-white/8"
                  >
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-white/5">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-violet-500/20" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/producto/${item.slug}`}
                        onClick={onClose}
                        className="text-sm font-medium text-white hover:text-violet-300 transition-colors line-clamp-2"
                      >
                        {item.name}
                      </Link>
                      {item.variant && (
                        <p className="text-xs text-white/40 mt-0.5">{item.variant}</p>
                      )}

                      <div className="flex items-center justify-between mt-2">
                        {/* Quantity controls */}
                        <div className="flex items-center gap-1 bg-white/5 rounded-lg border border-white/10">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            disabled={item.quantity <= 1}
                            className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-xs font-medium text-white w-6 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-violet-300">
                            ${(item.price * item.quantity).toLocaleString('es-CO')}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                            className="h-7 w-7 text-white/30 hover:text-red-400 hover:bg-red-400/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Footer summary */}
            <div className="shrink-0 px-5 py-4 border-t border-white/8 space-y-3 bg-white/3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/50">Subtotal</span>
                <span className="font-medium text-white">
                  ${subtotal.toLocaleString('es-CO')}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-white/30">
                <span>Envío</span>
                <span>Calculado al finalizar</span>
              </div>
              <Separator className="bg-white/8" />
              <div className="flex items-center justify-between font-semibold text-white">
                <span>Total</span>
                <span className="text-lg" style={{ color: '#7c3aed' }}>
                  ${subtotal.toLocaleString('es-CO')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link href="/carrito" onClick={onClose}>
                  <Button
                    variant="outline"
                    className="w-full border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20"
                  >
                    Ver carrito
                  </Button>
                </Link>
                <Link href="/checkout" onClick={onClose}>
                  <Button className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold">
                    Checkout
                  </Button>
                </Link>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default CartDrawer
