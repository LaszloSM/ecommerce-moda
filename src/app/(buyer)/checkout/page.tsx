'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Loader2, MapPin, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useCartStore } from '@/features/cart/store'
import { CouponInput } from '@/features/checkout/components/CouponInput'
import { addressSchema, type AddressFormValues } from '@/features/checkout/validators'
import { createOrder, validateCoupon } from '@/features/checkout/actions'
import { cn } from '@/lib/utils'

type Step = 1 | 2

export default function CheckoutPage() {
  const router = useRouter()
  const { items, storeId, storeName, clearCart, getTotal } = useCartStore()
  const [step, setStep] = React.useState<Step>(1)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [orderError, setOrderError] = React.useState<string | null>(null)
  const [couponId, setCouponId] = React.useState<string | undefined>()
  const [discountAmount, setDiscountAmount] = React.useState(0)
  const [couponCode, setCouponCode] = React.useState<string | undefined>()

  const subtotal = getTotal()
  const shippingCost = 0
  const total = subtotal - discountAmount + shippingCost

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      fullName: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      phone: '',
      country: 'CO',
    },
  })

  // Redirect to cart if empty
  React.useEffect(() => {
    if (items.length === 0) {
      router.replace('/carrito')
    }
  }, [items.length, router])

  const handleAddressSubmit = form.handleSubmit(() => {
    setStep(2)
  })

  const handleCouponApply = React.useCallback(
    async (code: string) => {
      if (!storeId) return { valid: false, message: 'Error de tienda' }
      const result = await validateCoupon(code, storeId, subtotal)
      if (result.valid && result.discount !== undefined) {
        setDiscountAmount(result.discount)
        setCouponId(result.couponId)
        setCouponCode(code)
      }
      return { valid: result.valid, discount: result.discount, message: result.message }
    },
    [storeId, subtotal]
  )

  const handleCouponRemove = () => {
    setDiscountAmount(0)
    setCouponId(undefined)
    setCouponCode(undefined)
  }

  const handleConfirmOrder = async () => {
    const address = form.getValues()
    setIsSubmitting(true)
    setOrderError(null)
    try {
      const result = await createOrder({
        items,
        shippingAddress: address,
        couponId,
        discountAmount,
        shippingCost,
      })
      if ('error' in result && result.error) {
        setOrderError(result.error)
        return
      }
      if ('orderId' in result && result.orderId) {
        clearCart()
        router.push(`/checkout/exito/${result.orderId}`)
      }
    } catch {
      setOrderError('Ocurrió un error inesperado. Intenta de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (items.length === 0) return null

  return (
    <div className="min-h-screen bg-[#0f0c29]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          {step === 2 ? (
            <button
              onClick={() => setStep(1)}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <Link
              href="/carrito"
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          )}
          <h1 className="text-2xl font-bold text-white">Checkout</h1>
          {storeName && (
            <span className="ml-auto text-sm text-violet-300/60">{storeName}</span>
          )}
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-3 mb-8">
          {([1, 2] as Step[]).map((s, idx) => {
            const labels = ['Dirección', 'Pedido']
            const isActive = step === s
            const isDone = step > s
            return (
              <React.Fragment key={s}>
                {idx > 0 && (
                  <div
                    className={cn(
                      'flex-1 h-px transition-colors',
                      isDone ? 'bg-violet-500' : 'bg-white/10',
                    )}
                  />
                )}
                <div className="flex items-center gap-2 shrink-0">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all',
                      isActive
                        ? 'border-violet-500 bg-violet-600 text-white shadow-[0_0_12px_rgba(124,58,237,0.5)]'
                        : isDone
                          ? 'border-violet-400 bg-violet-500/20 text-violet-300'
                          : 'border-white/15 bg-white/5 text-white/40',
                    )}
                  >
                    {s}
                  </div>
                  <span
                    className={cn(
                      'text-sm font-medium transition-colors',
                      isActive ? 'text-white' : isDone ? 'text-violet-300' : 'text-white/40',
                    )}
                  >
                    {labels[idx]}
                  </span>
                </div>
              </React.Fragment>
            )
          })}
        </div>

        {/* Step 1: Address form */}
        {step === 1 && (
          <div
            className={cn(
              'rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6',
              'shadow-[0_4px_32px_0_rgba(124,58,237,0.12)]',
            )}
          >
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="w-5 h-5 text-violet-400" />
              <h2 className="text-lg font-semibold text-white">Dirección de envío</h2>
            </div>

            <form onSubmit={handleAddressSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-white/70 text-sm">Nombre completo *</Label>
                <Input
                  {...form.register('fullName')}
                  placeholder="Ej: María García López"
                  className="h-11 bg-white/5 border-white/15 text-white placeholder:text-white/30 focus-visible:border-violet-500/50 focus-visible:ring-violet-500/20"
                />
                {form.formState.errors.fullName && (
                  <p className="text-xs text-red-400">{form.formState.errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-white/70 text-sm">Dirección *</Label>
                <Input
                  {...form.register('addressLine1')}
                  placeholder="Calle, carrera, avenida..."
                  className="h-11 bg-white/5 border-white/15 text-white placeholder:text-white/30 focus-visible:border-violet-500/50 focus-visible:ring-violet-500/20"
                />
                {form.formState.errors.addressLine1 && (
                  <p className="text-xs text-red-400">{form.formState.errors.addressLine1.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-white/70 text-sm">Apto / Casa / Barrio (opcional)</Label>
                <Input
                  {...form.register('addressLine2')}
                  placeholder="Apto 301, Barrio Centro..."
                  className="h-11 bg-white/5 border-white/15 text-white placeholder:text-white/30 focus-visible:border-violet-500/50 focus-visible:ring-violet-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-white/70 text-sm">Ciudad *</Label>
                  <Input
                    {...form.register('city')}
                    placeholder="Bogotá"
                    className="h-11 bg-white/5 border-white/15 text-white placeholder:text-white/30 focus-visible:border-violet-500/50 focus-visible:ring-violet-500/20"
                  />
                  {form.formState.errors.city && (
                    <p className="text-xs text-red-400">{form.formState.errors.city.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-white/70 text-sm">Departamento *</Label>
                  <Input
                    {...form.register('state')}
                    placeholder="Cundinamarca"
                    className="h-11 bg-white/5 border-white/15 text-white placeholder:text-white/30 focus-visible:border-violet-500/50 focus-visible:ring-violet-500/20"
                  />
                  {form.formState.errors.state && (
                    <p className="text-xs text-red-400">{form.formState.errors.state.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-white/70 text-sm">Código postal (opcional)</Label>
                  <Input
                    {...form.register('postalCode')}
                    placeholder="110111"
                    className="h-11 bg-white/5 border-white/15 text-white placeholder:text-white/30 focus-visible:border-violet-500/50 focus-visible:ring-violet-500/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-white/70 text-sm">Teléfono *</Label>
                  <Input
                    {...form.register('phone')}
                    placeholder="3001234567"
                    type="tel"
                    className="h-11 bg-white/5 border-white/15 text-white placeholder:text-white/30 focus-visible:border-violet-500/50 focus-visible:ring-violet-500/20"
                  />
                  {form.formState.errors.phone && (
                    <p className="text-xs text-red-400">{form.formState.errors.phone.message}</p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-base mt-2"
              >
                Continuar
              </Button>
            </form>
          </div>
        )}

        {/* Step 2: Order summary */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Items list */}
            <div
              className={cn(
                'rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6',
                'shadow-[0_4px_32px_0_rgba(124,58,237,0.12)]',
              )}
            >
              <div className="flex items-center gap-2 mb-4">
                <ShoppingBag className="w-5 h-5 text-violet-400" />
                <h2 className="text-lg font-semibold text-white">Productos</h2>
              </div>

              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.variantId ?? ''}`}
                    className="flex gap-3 py-3 border-b border-white/6 last:border-0"
                  >
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-white/5">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-violet-500/20" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white line-clamp-1">{item.name}</p>
                      {item.variantId && (
                        <p className="text-xs text-white/40 mt-0.5">Variante: {item.variantId}</p>
                      )}
                      <p className="text-xs text-white/50 mt-0.5">x{item.quantity}</p>
                    </div>
                    <span className="text-sm font-semibold text-violet-300 shrink-0">
                      ${(item.price * item.quantity).toLocaleString('es-CO')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Coupon */}
            {storeId && (
              <CouponInput
                onApply={handleCouponApply}
                appliedCode={couponCode}
                onRemove={handleCouponRemove}
              />
            )}

            {/* Price breakdown */}
            <div
              className={cn(
                'rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 space-y-3',
                'shadow-[0_4px_32px_0_rgba(124,58,237,0.12)]',
              )}
            >
              <div className="flex justify-between text-sm text-white/60">
                <span>Subtotal</span>
                <span className="text-white">${subtotal.toLocaleString('es-CO')}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-400">Descuento (cupón)</span>
                  <span className="text-green-400 font-medium">-${discountAmount.toLocaleString('es-CO')}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-white/40">
                <span>Envío</span>
                <span>{shippingCost > 0 ? `$${shippingCost.toLocaleString('es-CO')}` : 'Por confirmar'}</span>
              </div>
              <Separator className="bg-white/8" />
              <div className="flex justify-between font-bold text-white">
                <span>Total</span>
                <span className="text-xl text-violet-400">${total.toLocaleString('es-CO')}</span>
              </div>
            </div>

            {/* Error */}
            {orderError && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/25 px-4 py-3 text-sm text-red-300">
                {orderError}
              </div>
            )}

            {/* Actions */}
            <Button
              onClick={handleConfirmOrder}
              disabled={isSubmitting}
              className="w-full h-12 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-base"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Confirmando pedido…
                </>
              ) : (
                'Confirmar pedido'
              )}
            </Button>

            <button
              onClick={() => setStep(1)}
              className="w-full text-sm text-white/40 hover:text-white/70 transition-colors py-2"
            >
              Volver a dirección de envío
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
