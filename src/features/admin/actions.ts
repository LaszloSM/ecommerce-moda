'use server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', userId)
  return error ? { error: (error as any).message } : { success: true }
}

export async function changeUserRole(userId: string, role: 'buyer' | 'seller') {
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.from('profiles') as any)
    .update({ role })
    .eq('id', userId)
  if (error) return { error: (error as any).message }
  await admin.auth.admin.updateUserById(userId, { app_metadata: { role } })
  return { success: true }
}

export async function toggleStoreActive(storeId: string, isActive: boolean) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('stores')
    .update({ is_active: isActive })
    .eq('id', storeId)
  return error ? { error: (error as any).message } : { success: true }
}
