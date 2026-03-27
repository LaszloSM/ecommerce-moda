'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createReview(data: {
  productId: string
  orderId: string
  rating: number
  title: string
  body: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Debes iniciar sesión para dejar una reseña' }

  // Check user has a delivered order with this product
  const { data: orderItem } = await supabase
    .from('order_items')
    .select('id, orders!inner(id, status, buyer_id)')
    .eq('product_id', data.productId)
    .eq('orders.buyer_id', user.id)
    .eq('orders.status', 'delivered')
    .limit(1)
    .single()

  if (!orderItem) {
    return { error: 'Solo puedes reseñar productos que hayas recibido' }
  }

  const { error } = await supabase
    .from('reviews')
    .insert({
      product_id: data.productId,
      buyer_id: user.id,
      order_id: data.orderId,
      rating: data.rating,
      title: data.title,
      body: data.body,
    } as any)

  if (error) {
    if (error.code === '23505') return { error: 'Ya dejaste una reseña para este producto' }
    return { error: error.message }
  }

  revalidatePath(`/producto/${data.productId}`)
  return { success: true }
}

export async function addVendorReply(reviewId: string, reply: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('reviews')
    .update({ vendor_reply: reply, vendor_reply_at: new Date().toISOString() })
    .eq('id', reviewId)

  if (error) return { error: (error as any).message }
  revalidatePath('/dashboard/reseñas')
  return { success: true }
}

export async function getProductReviews(productId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('reviews')
    .select('*, profiles(full_name, avatar_url)')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
  return (data ?? []) as any[]
}

export async function getStoreReviews(storeId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('reviews')
    .select('*, profiles(full_name, avatar_url), products!inner(store_id, name, slug)')
    .eq('products.store_id', storeId)
    .order('created_at', { ascending: false })
  return (data ?? []) as any[]
}
