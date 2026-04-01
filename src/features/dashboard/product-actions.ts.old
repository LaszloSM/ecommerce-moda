'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { generateSlug } from '@/lib/utils/slug'

export async function createProduct(formData: FormData) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseClient = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = supabaseClient as any

  const {
    data: { user },
  } = await supabaseClient.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  // Get store
  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!store) return { error: 'No tienes una tienda activa' }

  const name = formData.get('name') as string
  const price = parseFloat(formData.get('price') as string)
  const stock = parseInt(formData.get('stock') as string)
  const description = formData.get('description') as string
  const categoryId = formData.get('category_id') as string
  const comparePrice = formData.get('compare_price')
    ? parseFloat(formData.get('compare_price') as string)
    : null
  const imagesRaw = formData.get('images') as string
  const images = imagesRaw ? (JSON.parse(imagesRaw) as string[]) : []

  const slug = generateSlug(name)

  const { data, error } = await supabase
    .from('products')
    .insert({
      name,
      slug,
      price,
      compare_price: comparePrice,
      stock,
      description,
      category_id: categoryId || null,
      store_id: store.id,
      images,
      is_active: true,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard/productos')
  return { productId: data.id }
}

export async function updateProductStatus(productId: string, isActive: boolean) {
  const supabaseClient = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = supabaseClient as any
  const { error } = await supabase
    .from('products')
    .update({ is_active: isActive })
    .eq('id', productId)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/productos')
  return { success: true }
}

export async function deleteProduct(productId: string) {
  const supabaseClient = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = supabaseClient as any
  const { error } = await supabase.from('products').delete().eq('id', productId)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/productos')
  return { success: true }
}

export async function updateOrderStatus(orderId: string, status: string) {
  const supabaseClient = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = supabaseClient as any
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/pedidos')
  return { success: true }
}

export async function updateStore(
  storeId: string,
  data: {
    name?: string
    description?: string | null
    logo_url?: string | null
    banner_url?: string | null
  },
) {
  const supabaseClient = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = supabaseClient as any
  const { error } = await supabase.from('stores').update(data).eq('id', storeId)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/tienda')
  return { success: true }
}
