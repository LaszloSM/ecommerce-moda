'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { generateSlug } from '@/lib/utils/slug'

// ── MÉTRICAS DASHBOARD ────────────────────────────────────────

export async function getAdminDashboardMetrics() {
  const supabase = await createClient()
  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

  const [ordersAll, ordersMonth, ordersToday, productsAll, usersAll, lowStock, pending] =
    await Promise.all([
      supabase.from('orders').select('total, status').neq('status', 'cancelled'),
      supabase.from('orders').select('total').neq('status', 'cancelled').gte('created_at', firstOfMonth),
      supabase.from('orders').select('total').neq('status', 'cancelled').gte('created_at', today),
      supabase.from('products').select('id', { count: 'exact' }).eq('is_active', true),
      supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'buyer'),
      supabase.from('products').select('id', { count: 'exact' }).eq('is_active', true).lte('stock', 5),
      supabase.from('orders').select('id', { count: 'exact' }).eq('status', 'pending'),
    ])

  const totalRevenue = (ordersAll.data ?? []).reduce((s: number, o: any) => s + (o.total ?? 0), 0)
  const monthlyRevenue = (ordersMonth.data ?? []).reduce((s: number, o: any) => s + (o.total ?? 0), 0)
  const todayRevenue = (ordersToday.data ?? []).reduce((s: number, o: any) => s + (o.total ?? 0), 0)

  return {
    totalRevenue,
    monthlyRevenue,
    todayRevenue,
    totalOrders: ordersAll.data?.length ?? 0,
    totalProducts: productsAll.count ?? 0,
    totalBuyers: usersAll.count ?? 0,
    lowStockCount: lowStock.count ?? 0,
    pendingOrders: pending.count ?? 0,
  }
}

export async function getSalesChartData() {
  const supabase = await createClient()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data } = await supabase
    .from('orders')
    .select('total, created_at')
    .neq('status', 'cancelled')
    .gte('created_at', thirtyDaysAgo)
    .order('created_at')

  const days: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    days[d.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })] = 0
  }
  for (const o of (data ?? []) as Array<{ total: number; created_at: string }>) {
    const day = new Date(o.created_at).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })
    if (day in days) days[day] += o.total ?? 0
  }
  return Object.entries(days).map(([date, revenue]) => ({ date, revenue }))
}

export async function getMonthlyRevenueData() {
  const supabase = await createClient()
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const { data } = await supabase
    .from('orders')
    .select('total, created_at')
    .neq('status', 'cancelled')
    .gte('created_at', sixMonthsAgo.toISOString())
    .order('created_at')

  const months: Record<string, number> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    months[d.toLocaleDateString('es-CO', { month: 'short', year: 'numeric' })] = 0
  }
  for (const o of (data ?? []) as Array<{ total: number; created_at: string }>) {
    const month = new Date(o.created_at).toLocaleDateString('es-CO', { month: 'short', year: 'numeric' })
    if (month in months) months[month] += o.total ?? 0
  }
  return Object.entries(months).map(([date, revenue]) => ({ date, revenue }))
}

export async function getTopProducts() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('order_items')
    .select('product_id, product_name, subtotal, quantity')
    .limit(500)

  const map: Record<string, { name: string; revenue: number; units: number }> = {}
  for (const item of (data ?? []) as Array<{ product_id: string | null; product_name: string; subtotal: number; quantity: number }>) {
    const key = item.product_id ?? item.product_name
    if (!map[key]) map[key] = { name: item.product_name, revenue: 0, units: 0 }
    map[key].revenue += item.subtotal ?? 0
    map[key].units += item.quantity ?? 0
  }
  return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5)
}

// ── PRODUCTOS ────────────────────────────────────────────────

export async function getAdminProducts(page = 1, limit = 20, search?: string) {
  const supabase = await createClient()
  let query = (supabase as any)
    .from('products')
    .select('id, name, slug, price, stock, is_active, is_featured, images, created_at, categories(name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (search) query = query.ilike('name', `%${search}%`)

  const { data, count } = await query
  return { products: (data ?? []) as any[], total: count ?? 0 }
}

export async function createProduct(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const name = formData.get('name') as string
  const price = parseFloat(formData.get('price') as string)
  const stock = parseInt(formData.get('stock') as string)
  const description = formData.get('description') as string
  const categoryId = formData.get('category_id') as string || null
  const comparePrice = formData.get('compare_price') ? parseFloat(formData.get('compare_price') as string) : null
  const brand = formData.get('brand') as string || null
  const sku = formData.get('sku') as string || null
  const imagesRaw = formData.get('images') as string
  const images = imagesRaw ? JSON.parse(imagesRaw) as string[] : []
  const isFeatured = formData.get('is_featured') === 'true'

  if (!name || isNaN(price) || isNaN(stock)) return { error: 'Datos inválidos' }

  const slug = generateSlug(name)

  const { data, error } = await (supabase as any)
    .from('products')
    .insert({ name, slug, price, compare_price: comparePrice, stock, description, category_id: categoryId, images, is_active: true, is_featured: isFeatured, brand, sku })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/panel/productos')
  revalidatePath('/')
  return { productId: data.id }
}

export async function updateProduct(productId: string, formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const price = parseFloat(formData.get('price') as string)
  const stock = parseInt(formData.get('stock') as string)
  const description = formData.get('description') as string
  const categoryId = formData.get('category_id') as string || null
  const comparePrice = formData.get('compare_price') ? parseFloat(formData.get('compare_price') as string) : null
  const brand = formData.get('brand') as string || null
  const sku = formData.get('sku') as string || null
  const imagesRaw = formData.get('images') as string
  const images = imagesRaw ? JSON.parse(imagesRaw) as string[] : undefined
  const isFeatured = formData.get('is_featured') === 'true'
  const isActive = formData.get('is_active') !== 'false'

  const updateData: any = { name, price, stock, description, category_id: categoryId, compare_price: comparePrice, brand, sku, is_featured: isFeatured, is_active: isActive }
  if (images !== undefined) updateData.images = images

  const { error } = await (supabase as any).from('products').update(updateData).eq('id', productId)
  if (error) return { error: error.message }
  revalidatePath('/panel/productos')
  revalidatePath('/')
  return { success: true }
}

export async function updateProductStatus(productId: string, isActive: boolean) {
  const supabase = await createClient()
  const { error } = await (supabase as any).from('products').update({ is_active: isActive }).eq('id', productId)
  if (error) return { error: error.message }
  revalidatePath('/panel/productos')
  return { success: true }
}

export async function updateProductStock(productId: string, stock: number) {
  const supabase = await createClient()
  const { error } = await (supabase as any).from('products').update({ stock }).eq('id', productId)
  if (error) return { error: error.message }
  revalidatePath('/panel/inventario')
  revalidatePath('/panel/productos')
  return { success: true }
}

export async function deleteProduct(productId: string) {
  const supabase = await createClient()
  const { error } = await (supabase as any).from('products').delete().eq('id', productId)
  if (error) return { error: error.message }
  revalidatePath('/panel/productos')
  return { success: true }
}

// ── CATEGORÍAS ───────────────────────────────────────────────

export async function getCategories() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('categories')
    .select('id, name, slug, icon, image_url, parent_id')
    .order('name')
  return (data ?? []) as any[]
}

export async function createCategory(formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const icon = formData.get('icon') as string || null
  const imageUrl = formData.get('image_url') as string || null
  const parentId = formData.get('parent_id') as string || null
  if (!name) return { error: 'Nombre requerido' }

  const slug = generateSlug(name)
  const { error } = await (supabase as any).from('categories').insert({ name, slug, icon, image_url: imageUrl, parent_id: parentId })
  if (error) return { error: error.message }
  revalidatePath('/panel/categorias')
  return { success: true }
}

export async function updateCategory(categoryId: string, formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const icon = formData.get('icon') as string || null
  const imageUrl = formData.get('image_url') as string || null
  const { error } = await (supabase as any).from('categories').update({ name, icon, image_url: imageUrl }).eq('id', categoryId)
  if (error) return { error: error.message }
  revalidatePath('/panel/categorias')
  return { success: true }
}

export async function deleteCategory(categoryId: string) {
  const supabase = await createClient()
  const { error } = await (supabase as any).from('categories').delete().eq('id', categoryId)
  if (error) return { error: error.message }
  revalidatePath('/panel/categorias')
  return { success: true }
}

// ── PEDIDOS ──────────────────────────────────────────────────

export async function getAdminOrders(page = 1, limit = 20, status?: string) {
  const supabase = await createClient()
  let query = (supabase as any)
    .from('orders')
    .select(
      'id, status, total, payment_status, created_at, shipping_address, tracking_number, profiles(full_name, email)',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (status) query = query.eq('status', status)

  const { data, count } = await query
  return { orders: (data ?? []) as any[], total: count ?? 0 }
}

export async function getOrderDetail(orderId: string) {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('orders')
    .select(`
      *,
      profiles(full_name, email, phone),
      order_items(*, products(name, images))
    `)
    .eq('id', orderId)
    .single()
  return data as any
}

export async function updateOrderStatus(orderId: string, status: string) {
  const supabase = await createClient()
  const { error } = await (supabase as any).from('orders').update({ status }).eq('id', orderId)
  if (error) return { error: error.message }
  revalidatePath('/panel/pedidos')
  return { success: true }
}

export async function updateOrderTracking(orderId: string, trackingNumber: string) {
  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('orders')
    .update({ tracking_number: trackingNumber, status: 'shipped' })
    .eq('id', orderId)
  if (error) return { error: error.message }
  revalidatePath('/panel/pedidos')
  return { success: true }
}

// ── CLIENTES ─────────────────────────────────────────────────

export async function getAdminClients(page = 1, limit = 20, search?: string) {
  const supabase = await createClient()
  let query = (supabase as any)
    .from('profiles')
    .select('id, full_name, email, phone, is_active, created_at', { count: 'exact' })
    .eq('role', 'buyer')
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)

  const { data, count } = await query
  return { clients: (data ?? []) as any[], total: count ?? 0 }
}

export async function toggleClientActive(clientId: string, isActive: boolean) {
  const supabase = await createClient()
  const { error } = await (supabase as any).from('profiles').update({ is_active: isActive }).eq('id', clientId)
  if (error) return { error: error.message }
  revalidatePath('/panel/clientes')
  return { success: true }
}

// ── INVENTARIO ───────────────────────────────────────────────

export async function getLowStockProducts(threshold = 10) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('id, name, slug, stock, images, categories(name)')
    .eq('is_active', true)
    .lte('stock', threshold)
    .order('stock', { ascending: true })
  return (data ?? []) as any[]
}

// ── PROMOCIONES (CUPONES) ────────────────────────────────────

export async function getAdminCoupons() {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false })
  return (data ?? []) as any[]
}

export async function createCoupon(formData: FormData) {
  const supabase = await createClient()
  const code = (formData.get('code') as string).toUpperCase().trim()
  const type = formData.get('type') as 'percentage' | 'fixed'
  const value = parseFloat(formData.get('value') as string)
  const minOrder = formData.get('min_order_amount') ? parseFloat(formData.get('min_order_amount') as string) : null
  const maxUses = formData.get('max_uses') ? parseInt(formData.get('max_uses') as string) : null
  const expiresAt = formData.get('expires_at') as string || null

  const { error } = await (supabase as any).from('coupons').insert({ code, type, value, min_order_amount: minOrder, max_uses: maxUses, expires_at: expiresAt, is_active: true })
  if (error) return { error: error.message }
  revalidatePath('/panel/promociones')
  return { success: true }
}

export async function toggleCouponActive(couponId: string, isActive: boolean) {
  const supabase = await createClient()
  const { error } = await (supabase as any).from('coupons').update({ is_active: isActive }).eq('id', couponId)
  if (error) return { error: error.message }
  revalidatePath('/panel/promociones')
  return { success: true }
}

export async function deleteCoupon(couponId: string) {
  const supabase = await createClient()
  const { error } = await (supabase as any).from('coupons').delete().eq('id', couponId)
  if (error) return { error: error.message }
  revalidatePath('/panel/promociones')
  return { success: true }
}

// ── CONFIGURACIÓN EMPRESA ────────────────────────────────────

export async function getCompanyConfig() {
  const supabase = await createClient()
  const { data } = await (supabase as any).from('company_config').select('*').single()
  return data as any
}

export async function updateCompanyConfig(formData: FormData) {
  const supabase = await createClient()
  const updates: any = {}
  const fields = ['name', 'tagline', 'logo_url', 'email', 'phone', 'address', 'city', 'nit']
  for (const field of fields) {
    const val = formData.get(field)
    if (val !== null) updates[field] = val as string
  }
  const bannersRaw = formData.get('banner_urls')
  if (bannersRaw) updates.banner_urls = JSON.parse(bannersRaw as string)
  const socialRaw = formData.get('social_links')
  if (socialRaw) updates.social_links = JSON.parse(socialRaw as string)
  const shippingRaw = formData.get('shipping_methods')
  if (shippingRaw) updates.shipping_methods = JSON.parse(shippingRaw as string)

  const { data: configRow } = await (supabase as any).from('company_config').select('id').single()
  if (!configRow?.id) return { error: 'No se encontró la configuración' }

  const { error } = await (supabase as any).from('company_config').update(updates).eq('id', configRow.id)
  if (error) return { error: error.message }
  revalidatePath('/panel/configuracion')
  revalidatePath('/')
  return { success: true }
}

// ── LEGACY (kept for backward compatibility) ─────────────────

export async function getAllUsers(limit = 50) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, created_at, is_active')
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data ?? []) as any[]
}

export async function getAllStores() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('stores')
    .select('id, name, slug, is_active, created_at, profiles!owner_id(full_name, email)')
    .order('created_at', { ascending: false })
  return (data ?? []) as any[]
}

export async function getAdminMetrics() {
  const supabase = await createClient()
  const [usersRes, storesRes, ordersRes, productsRes] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact' }),
    supabase.from('stores').select('id', { count: 'exact' }).eq('is_active', true),
    supabase.from('orders').select('total').neq('status', 'cancelled'),
    supabase.from('products').select('id', { count: 'exact' }).eq('is_active', true),
  ])
  const totalRevenue = (ordersRes.data ?? []).reduce((sum: number, o: any) => sum + (o.total ?? 0), 0)
  return {
    totalUsers: usersRes.count ?? 0,
    activeStores: storesRes.count ?? 0,
    totalRevenue,
    activeProducts: productsRes.count ?? 0,
  }
}

export async function toggleUserActive(userId: string, isActive: boolean) {
  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', userId)
  return error ? { error: (error as any).message } : { success: true }
}

export async function toggleStoreActive(storeId: string, isActive: boolean) {
  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('stores')
    .update({ is_active: isActive })
    .eq('id', storeId)
  return error ? { error: (error as any).message } : { success: true }
}
