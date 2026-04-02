import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/lib/types/database'

// Lightweight product shape returned by list queries
export type ProductListItem = Pick<
  Tables<'products'>,
  'id' | 'name' | 'slug' | 'price' | 'compare_price' | 'images' | 'store_id'
>

// Full product with relations
export type ProductDetail = Tables<'products'> & {
  stores: (Pick<Tables<'stores'>, 'id' | 'name' | 'slug' | 'logo_url'>) | null
  categories: (Pick<Tables<'categories'>, 'name' | 'slug'>) | null
  product_variants: Tables<'product_variants'>[]
}

// Get featured products for landing
export async function getFeaturedProducts(limit = 8): Promise<ProductListItem[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('id, name, slug, price, compare_price, images, store_id')
    .eq('is_active', true)
    .eq('is_featured', true)
    .limit(limit)
  return (data ?? []) as ProductListItem[]
}

// Get products by category slug
export async function getProductsByCategory(
  categorySlug: string,
  filters?: {
    minPrice?: number
    maxPrice?: number
    sortBy?: 'price_asc' | 'price_desc' | 'newest'
  },
): Promise<ProductListItem[]> {
  const supabase = await createClient()
  let query = supabase
    .from('products')
    .select(
      'id, name, slug, price, compare_price, images, store_id, stores(name, slug), categories!inner(slug)',
    )
    .eq('is_active', true)
    .eq('categories.slug', categorySlug)

  if (filters?.minPrice) query = query.gte('price', filters.minPrice)
  if (filters?.maxPrice) query = query.lte('price', filters.maxPrice)
  if (filters?.sortBy === 'price_asc') query = query.order('price', { ascending: true })
  else if (filters?.sortBy === 'price_desc') query = query.order('price', { ascending: false })
  else query = query.order('created_at', { ascending: false })

  const { data } = await query
  return (data ?? []) as ProductListItem[]
}

// Get single product by slug
export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('*, stores(id, name, slug, logo_url), categories(name, slug), product_variants(*)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  return (data ?? null) as ProductDetail | null
}

// Get average rating for product
export async function getProductRating(productId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('reviews')
    .select('rating')
    .eq('product_id', productId)
  const rows = (data ?? []) as Array<{ rating: number }>
  if (rows.length === 0) return { average: 0, count: 0 }
  const average = rows.reduce((sum, r) => sum + r.rating, 0) / rows.length
  return { average: Math.round(average * 10) / 10, count: rows.length }
}

// Search products
export async function searchProducts(query: string, limit = 20): Promise<ProductListItem[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('id, name, slug, price, compare_price, images, store_id, stores(name, slug)')
    .eq('is_active', true)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .limit(limit)
  return (data ?? []) as ProductListItem[]
}

// Get store by slug
export async function getStoreBySlug(slug: string): Promise<Tables<'stores'> | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('stores')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  return data ?? null
}

// Get products by store
export async function getProductsByStore(storeId: string): Promise<ProductListItem[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('id, name, slug, price, compare_price, images, store_id, stores(name, slug)')
    .eq('store_id', storeId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  return (data ?? []) as ProductListItem[]
}

// Get all categories
export async function getCategories(): Promise<Tables<'categories'>[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('categories').select('*').order('name')
  return data ?? []
}
