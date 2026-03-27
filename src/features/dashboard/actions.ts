import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/lib/types/database'

// Get seller's store
export async function getSellerStore(): Promise<Tables<'stores'> | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('stores')
    .select('*')
    .eq('owner_id', user.id)
    .single()
  return data as Tables<'stores'> | null
}

// Dashboard overview metrics
export async function getDashboardMetrics(storeId: string) {
  const supabase = await createClient()
  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [ordersRes, productsRes, reviewsRes] = await Promise.all([
    supabase.from('orders').select('total, created_at, status').eq('store_id', storeId),
    supabase.from('products').select('id, stock').eq('store_id', storeId).eq('is_active', true),
    supabase
      .from('reviews')
      .select('rating, products!inner(store_id)')
      .eq('products.store_id', storeId),
  ])

  const orders = (ordersRes.data ?? []) as Array<{ total: number; created_at: string; status: string }>
  const products = (productsRes.data ?? []) as Array<{ id: string; stock: number }>
  const reviews = (reviewsRes.data ?? []) as Array<{ rating: number }>

  const totalRevenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (o.total ?? 0), 0)
  const monthlyRevenue = orders
    .filter(o => o.status !== 'cancelled' && o.created_at >= firstOfMonth)
    .reduce((sum, o) => sum + (o.total ?? 0), 0)
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

  return {
    totalRevenue,
    monthlyRevenue,
    totalOrders: orders.length,
    totalProducts: products.length,
    lowStockCount: products.filter(p => (p.stock ?? 0) <= 5).length,
    avgRating: Math.round(avgRating * 10) / 10,
    reviewCount: reviews.length,
  }
}

// Sales chart data (last 7 days)
export async function getSalesChartData(storeId: string) {
  const supabase = await createClient()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data } = await supabase
    .from('orders')
    .select('total, created_at')
    .eq('store_id', storeId)
    .neq('status', 'cancelled')
    .gte('created_at', sevenDaysAgo)
    .order('created_at')

  // Group by day
  const days: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    days[d.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })] = 0
  }

  for (const order of (data ?? []) as Array<{ total: number; created_at: string }>) {
    const day = new Date(order.created_at).toLocaleDateString('es-CO', {
      month: 'short',
      day: 'numeric',
    })
    if (day in days) days[day] += order.total ?? 0
  }

  return Object.entries(days).map(([date, revenue]) => ({ date, revenue }))
}

// Get seller orders
export async function getSellerOrders(storeId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('orders')
    .select('id, status, total, created_at, shipping_address, profiles(full_name, email)')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .limit(50)
  return (data ?? []) as any[]
}

// Get seller products
export async function getSellerProducts(storeId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('id, name, slug, price, stock, is_active, images, created_at, categories(name)')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
  return (data ?? []) as any[]
}

// Get analytics: monthly revenue for last 6 months
export async function getMonthlyRevenueData(storeId: string) {
  const supabase = await createClient()
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const { data } = await supabase
    .from('orders')
    .select('total, created_at')
    .eq('store_id', storeId)
    .neq('status', 'cancelled')
    .gte('created_at', sixMonthsAgo.toISOString())
    .order('created_at')

  const months: Record<string, number> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    months[d.toLocaleDateString('es-CO', { month: 'short', year: 'numeric' })] = 0
  }

  for (const order of (data ?? []) as Array<{ total: number; created_at: string }>) {
    const month = new Date(order.created_at).toLocaleDateString('es-CO', {
      month: 'short',
      year: 'numeric',
    })
    if (month in months) months[month] += order.total ?? 0
  }

  return Object.entries(months).map(([date, revenue]) => ({ date, revenue }))
}

// Get top products by revenue
export async function getTopProducts(storeId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('order_items')
    .select('product_id, product_name, subtotal, orders!inner(store_id, status)')
    .eq('orders.store_id', storeId)
    .neq('orders.status', 'cancelled')
    .limit(200)

  const productMap: Record<string, { name: string; revenue: number }> = {}
  for (const item of (data ?? []) as Array<{ product_id: string | null; product_name: string; subtotal: number }>) {
    const pid = item.product_id ?? item.product_name
    if (!productMap[pid]) {
      productMap[pid] = { name: item.product_name, revenue: 0 }
    }
    productMap[pid].revenue += item.subtotal ?? 0
  }

  return Object.values(productMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map(p => ({ date: p.name, revenue: p.revenue }))
}
