'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { CartItem } from '@/features/cart/store'
import { sendOrderConfirmedEmail } from '@/lib/email/send'

interface CreateOrderInput {
  items: CartItem[]
  shippingAddress: {
    fullName: string
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    postalCode?: string
    phone: string
    country: string
  }
  couponId?: string
  discountAmount?: number
  shippingCost?: number
  notes?: string
}

export async function createOrder(input: CreateOrderInput) {
  const supabaseClient = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = supabaseClient as any

  const { data: { user } } = await supabaseClient.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  if (!input.items.length) {
    return { error: 'El carrito está vacío' }
  }

  const storeId = input.items[0].storeId
  const subtotal = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discountAmount = input.discountAmount ?? 0
  const shippingCost = input.shippingCost ?? 0
  const total = subtotal - discountAmount + shippingCost

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      buyer_id: user.id,
      store_id: storeId,
      status: 'confirmed',
      subtotal,
      discount_amount: discountAmount,
      shipping_cost: shippingCost,
      total,
      coupon_id: input.couponId ?? null,
      shipping_address: input.shippingAddress,
      notes: input.notes ?? null,
    })
    .select('id')
    .single()

  if (orderError || !order) {
    return { error: 'Error al crear el pedido. Intenta de nuevo.' }
  }

  // Create order items
  const orderItems = input.items.map((item) => ({
    order_id: order.id,
    product_id: item.productId,
    variant_id: item.variantId ?? null,
    product_name: item.name,
    product_image: item.image,
    price: item.price,
    quantity: item.quantity,
    subtotal: item.price * item.quantity,
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)

  if (itemsError) {
    // Rollback — delete the order
    await supabase.from('orders').delete().eq('id', order.id)
    return { error: 'Error al guardar los productos del pedido.' }
  }

  // Decrement stock for each item (call the DB function)
  for (const item of input.items) {
    const { error: stockError } = await supabase.rpc('decrement_stock', {
      p_product_id: item.productId,
      p_variant_id: item.variantId ?? null,
      p_quantity: item.quantity,
    })
    if (stockError) {
      // Don't fail the order, but log it — stock sync can be done manually
      console.error('Stock decrement failed for product', item.productId, stockError.message)
    }
  }

  // Send confirmation email (non-blocking — don't fail order if email fails)
  try {
    const { data: { user: fullUser } } = await supabase.auth.getUser()
    if (fullUser?.email) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
      await sendOrderConfirmedEmail({
        to: fullUser.email,
        buyerName: input.shippingAddress.fullName,
        orderId: order.id,
        orderItems: input.items.map(item => ({
          product_name: item.name,
          product_image: item.image,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity,
        })),
        subtotal,
        discountAmount,
        shippingCost,
        total,
        shippingAddress: input.shippingAddress,
        storeName: input.items[0].storeName,
        orderUrl: `${siteUrl}/cuenta/pedidos/${order.id}`,
      })
    }
  } catch (emailError) {
    console.error('Order confirmation email failed:', emailError)
  }

  revalidatePath('/cuenta/pedidos')
  return { orderId: order.id }
}

export async function validateCoupon(code: string, storeId: string, orderAmount: number) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any

  const { data: coupon } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('store_id', storeId)
    .eq('is_active', true)
    .single()

  if (!coupon) return { valid: false, message: 'Cupón no válido' }

  const now = new Date()
  if (coupon.expires_at && new Date(coupon.expires_at) < now) {
    return { valid: false, message: 'Este cupón ha expirado' }
  }

  if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
    return { valid: false, message: 'Este cupón ya alcanzó su límite de usos' }
  }

  if (orderAmount < (coupon.min_order_amount ?? 0)) {
    return { valid: false, message: `Monto mínimo: $${coupon.min_order_amount?.toLocaleString('es-CO')}` }
  }

  const discount = coupon.type === 'percentage'
    ? (orderAmount * coupon.value) / 100
    : coupon.value

  return {
    valid: true,
    discount: Math.round(discount),
    couponId: coupon.id,
    message: coupon.type === 'percentage' ? `-${coupon.value}%` : `-$${coupon.value.toLocaleString('es-CO')}`,
  }
}
