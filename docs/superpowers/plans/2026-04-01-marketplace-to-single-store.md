# Marketplace → Tienda Única (MODAVIDA) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar la app de marketplace multi-vendedor en una tienda única corporativa con 2 roles (admin + buyer), panel admin completo con datos reales de Supabase, y frontend público de marca única.

**Architecture:** Fusión Total — eliminar tabla `stores`, roles `seller` → `admin`, unificar panel en `/panel/**`. Reutilizar checkout/carrito/auth/Wompi existentes. Reescribir todas las acciones que dependían de `store_id`.

**Tech Stack:** Next.js 16 (App Router, proxy.ts), Supabase SSR, TypeScript, Tailwind CSS v4, shadcn/ui, Zustand, Recharts, React Hook Form + Zod, Wompi

---

## Chunk 1: Database Migration

### Task 1: Nuevo schema SQL — tienda única

**Files:**
- Modify: `supabase/schema.sql`
- Create: `supabase/migration-to-single-store.sql`

- [ ] **Step 1: Escribir script de migración para DB existente**

Crear `supabase/migration-to-single-store.sql` con exactamente este contenido:

```sql
-- ============================================================
-- MIGRATION: Marketplace → Single Store (MODAVIDA)
-- Run this in Supabase SQL Editor ONCE
-- ============================================================

-- 1. Crear tabla company_config (fila única)
CREATE TABLE IF NOT EXISTS public.company_config (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL DEFAULT 'MODAVIDA',
  tagline       text DEFAULT 'Moda y Accesorios',
  logo_url      text,
  banner_urls   text[] DEFAULT '{}',
  email         text,
  phone         text,
  address       text,
  city          text DEFAULT 'Colombia',
  nit           text,
  social_links  jsonb DEFAULT '{}',
  shipping_methods jsonb DEFAULT '[{"name":"Estándar","price":8000,"days":"3-5"},{"name":"Express","price":18000,"days":"1-2"}]',
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Insertar fila única si no existe
INSERT INTO public.company_config (name, tagline, city)
VALUES ('MODAVIDA', 'Moda y Accesorios en Colombia', 'Colombia')
ON CONFLICT DO NOTHING;

-- 2. Migrar sellers a admin
UPDATE public.profiles
SET role = 'admin'
WHERE role = 'seller';

-- 3. Agregar columna brand a products si no existe
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS brand text;

-- 4. Agregar image_url a categories si no existe
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS image_url text;

-- 5. Quitar store_id de products (hacer nullable primero, luego migrar)
ALTER TABLE public.products
DROP CONSTRAINT IF EXISTS products_store_id_fkey;
ALTER TABLE public.products
ALTER COLUMN store_id DROP NOT NULL;

-- 6. Quitar store_id de orders
ALTER TABLE public.orders
DROP CONSTRAINT IF EXISTS orders_store_id_fkey;
ALTER TABLE public.orders
ALTER COLUMN store_id DROP NOT NULL;

-- 7. Quitar store_id de coupons
ALTER TABLE public.coupons
DROP CONSTRAINT IF EXISTS coupons_store_id_fkey;
ALTER TABLE public.coupons
ALTER COLUMN store_id DROP NOT NULL;

-- 8. RLS para company_config
ALTER TABLE public.company_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_config_select_all"
  ON public.company_config FOR SELECT USING (true);

CREATE POLICY "company_config_update_admin"
  ON public.company_config FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 9. Trigger updated_at para company_config
CREATE TRIGGER set_company_config_updated_at
  BEFORE UPDATE ON public.company_config
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 10. Actualizar políticas RLS products (admin puede hacer todo)
DROP POLICY IF EXISTS "products_insert_seller" ON public.products;
DROP POLICY IF EXISTS "products_update_seller" ON public.products;
DROP POLICY IF EXISTS "products_delete_seller" ON public.products;

CREATE POLICY "products_admin_all"
  ON public.products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 11. Actualizar políticas RLS orders (admin ve todos)
DROP POLICY IF EXISTS "orders_select_seller" ON public.orders;
DROP POLICY IF EXISTS "orders_update_seller" ON public.orders;

CREATE POLICY "orders_admin_all"
  ON public.orders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 12. Actualizar políticas RLS coupons
DROP POLICY IF EXISTS "coupons_select_seller" ON public.coupons;
DROP POLICY IF EXISTS "coupons_insert_seller" ON public.coupons;
DROP POLICY IF EXISTS "coupons_update_seller" ON public.coupons;
DROP POLICY IF EXISTS "coupons_delete_seller" ON public.coupons;

CREATE POLICY "coupons_admin_all"
  ON public.coupons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 13. Actualizar políticas RLS categories (admin puede crear/editar)
DROP POLICY IF EXISTS "categories_insert_seller" ON public.categories;
DROP POLICY IF EXISTS "categories_update_seller" ON public.categories;

CREATE POLICY "categories_admin_all"
  ON public.categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

SELECT 'Migration complete ✓' as status;
```

- [ ] **Step 2: Ejecutar en Supabase → SQL Editor**

Pegar el contenido de `supabase/migration-to-single-store.sql` en el SQL Editor de Supabase y ejecutar. Verificar que termina con `Migration complete ✓`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migration-to-single-store.sql
git commit -m "feat(db): migration script marketplace to single-store"
```

---

## Chunk 2: TypeScript Types + Auth + Middleware

### Task 2: Actualizar tipos de base de datos

**Files:**
- Modify: `src/lib/types/database.ts`

- [ ] **Step 1: Regenerar tipos desde Supabase**

Si tienes Supabase CLI:
```bash
npx supabase gen types typescript --project-id <YOUR_PROJECT_ID> > src/lib/types/database.ts
```

Si no, editar manualmente `src/lib/types/database.ts`:

Buscar la definición del enum `user_role` y cambiar:
```typescript
// ANTES
role: 'buyer' | 'seller' | 'admin'

// DESPUÉS
role: 'buyer' | 'admin'
```

Agregar el tipo `company_config` en la sección `Tables`:
```typescript
company_config: {
  Row: {
    id: string
    name: string
    tagline: string | null
    logo_url: string | null
    banner_urls: string[]
    email: string | null
    phone: string | null
    address: string | null
    city: string | null
    nit: string | null
    social_links: Record<string, string>
    shipping_methods: Array<{ name: string; price: number; days: string }>
    created_at: string
    updated_at: string
  }
  Insert: Omit<...Row, 'id' | 'created_at' | 'updated_at'>
  Update: Partial<Insert>
}
```

- [ ] **Step 2: Verificar build no rompe**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

### Task 3: Actualizar proxy.ts y middleware

**Files:**
- Modify: `src/lib/supabase/middleware.ts`

- [ ] **Step 1: Actualizar rutas protegidas**

Reemplazar el bloque de rutas protegidas en `src/lib/supabase/middleware.ts`:

```typescript
// ANTES
const isProtectedRoute =
  url.pathname.startsWith('/dashboard') ||
  url.pathname.startsWith('/admin') ||
  url.pathname.startsWith('/cuenta') ||
  url.pathname.startsWith('/checkout')

// DESPUÉS
const isProtectedRoute =
  url.pathname.startsWith('/panel') ||
  url.pathname.startsWith('/cuenta') ||
  url.pathname.startsWith('/checkout')

if (isProtectedRoute && !user) {
  url.pathname = '/login'
  return NextResponse.redirect(url)
}

// Proteger /panel solo para admin
if (url.pathname.startsWith('/panel')) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    url.pathname = '/'
    return NextResponse.redirect(url)
  }
}
```

- [ ] **Step 2: Verificar build**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase/middleware.ts src/lib/types/database.ts
git commit -m "feat(auth): protect /panel for admin role only"
```

---

## Chunk 3: Limpiar Rutas de Marketplace

### Task 4: Eliminar rutas de seller y tienda

**Files:**
- Delete: `src/app/(seller)/` (directorio completo)
- Delete: `src/app/(public)/tienda/` (directorio completo)
- Delete: `src/app/(admin)/admin/tiendas/` (directorio completo)
- Modify: `src/app/(admin)/layout.tsx`

- [ ] **Step 1: Eliminar rutas de seller**

```bash
rm -rf "src/app/(seller)"
rm -rf "src/app/(public)/tienda"
rm -rf "src/app/(admin)/admin/tiendas"
```

- [ ] **Step 2: Verificar qué imports se rompen**

```bash
npm run build 2>&1 | grep "error" | head -30
```

- [ ] **Step 3: Eliminar features/dashboard (seller)**

Estos archivos serán reemplazados por features/admin:
```bash
# NO borrar todavía — los necesitamos como referencia para las nuevas acciones
# Solo renombrar para que no se importen accidentalmente
mv src/features/dashboard/actions.ts src/features/dashboard/actions.ts.old
mv src/features/dashboard/product-actions.ts src/features/dashboard/product-actions.ts.old
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: remove marketplace seller routes and tienda/[slug]"
```

---

## Chunk 4: Panel Admin — Layout + Dashboard

### Task 5: Layout del panel admin con sidebar real

**Files:**
- Create: `src/app/(admin)/panel/layout.tsx`
- Modify: `src/components/layout/AdminSidebar.tsx`

- [ ] **Step 1: Crear layout del panel**

Crear `src/app/(admin)/panel/layout.tsx`:

```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/layout/AdminSidebar'

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, email')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') redirect('/')

  return (
    <div className="flex min-h-screen">
      <AdminSidebar user={{ name: profile.full_name ?? profile.email ?? 'Admin', email: profile.email ?? '' }} />
      <main className="flex-1 ml-0 md:ml-64 p-6 min-h-screen"
        style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Reescribir AdminSidebar con navegación de /panel**

Reemplazar `src/components/layout/AdminSidebar.tsx` completo:

```typescript
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, Tag, ShoppingCart, Users,
  AlertTriangle, Ticket, Settings, LogOut, Menu, X
} from 'lucide-react'
import { useState } from 'react'
import { signOut } from '@/features/auth/actions'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/panel', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/panel/productos', label: 'Productos', icon: Package },
  { href: '/panel/categorias', label: 'Categorías', icon: Tag },
  { href: '/panel/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { href: '/panel/clientes', label: 'Clientes', icon: Users },
  { href: '/panel/inventario', label: 'Inventario', icon: AlertTriangle },
  { href: '/panel/promociones', label: 'Promociones', icon: Ticket },
  { href: '/panel/configuracion', label: 'Configuración', icon: Settings },
]

export default function AdminSidebar({ user }: { user: { name: string; email: string } }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-violet-700 text-white"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Overlay mobile */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full w-64 z-40 flex flex-col transition-transform duration-200',
          'border-r border-white/10',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
        style={{ background: 'rgba(15,12,41,0.98)', backdropFilter: 'blur(20px)' }}
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10">
          <Link href="/panel" className="font-bold text-xl tracking-widest text-violet-400"
            style={{ fontFamily: 'var(--font-playfair, serif)' }}>
            MODAVIDA
          </Link>
          <p className="text-xs text-white/40 mt-0.5">Panel Administrador</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive(href, exact)
                  ? 'bg-violet-600/30 text-violet-300 border border-violet-500/30'
                  : 'text-white/60 hover:text-white hover:bg-white/5',
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        {/* User + logout */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-semibold text-white/80 truncate">{user.name}</p>
            <p className="text-xs text-white/40 truncate">{user.email}</p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </button>
          </form>
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors mt-0.5"
          >
            ← Ver tienda
          </Link>
        </div>
      </aside>
    </>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(admin\)/panel/layout.tsx src/components/layout/AdminSidebar.tsx
git commit -m "feat(panel): admin layout with responsive sidebar"
```

### Task 6: Dashboard con métricas reales

**Files:**
- Create: `src/features/admin/actions.ts`
- Create: `src/app/(admin)/panel/page.tsx`

- [ ] **Step 1: Crear features/admin/actions.ts con todas las acciones**

Crear `src/features/admin/actions.ts`:

```typescript
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

  const totalRevenue = (ordersAll.data ?? []).reduce((s, o) => s + (o.total ?? 0), 0)
  const monthlyRevenue = (ordersMonth.data ?? []).reduce((s, o) => s + (o.total ?? 0), 0)
  const todayRevenue = (ordersToday.data ?? []).reduce((s, o) => s + (o.total ?? 0), 0)

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
  let query = supabase
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
  let query = supabase
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
  const { data } = await supabase
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
  let query = supabase
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
  const { data } = await supabase
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

  const { error } = await (supabase as any).from('company_config').update(updates).eq('id', (await (supabase as any).from('company_config').select('id').single()).data?.id)
  if (error) return { error: error.message }
  revalidatePath('/panel/configuracion')
  revalidatePath('/')
  return { success: true }
}
```

- [ ] **Step 2: Crear página Dashboard /panel/page.tsx con datos reales**

Crear `src/app/(admin)/panel/page.tsx`:

```typescript
import { Suspense } from 'react'
import {
  getAdminDashboardMetrics,
  getMonthlyRevenueData,
  getTopProducts,
  getLowStockProducts,
  getAdminOrders,
} from '@/features/admin/actions'
import { SalesChart } from '@/components/charts/SalesChart'
import { formatCOP } from '@/lib/utils/currency'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp, ShoppingCart, Users, Package,
  AlertTriangle, DollarSign, Clock, CheckCircle
} from 'lucide-react'

export const metadata = { title: 'Panel Admin — MODAVIDA' }

export default async function PanelPage() {
  const [metrics, chartData, topProducts, lowStock, recentOrders] = await Promise.all([
    getAdminDashboardMetrics(),
    getMonthlyRevenueData(),
    getTopProducts(),
    getLowStockProducts(10),
    getAdminOrders(1, 5),
  ])

  const METRICS = [
    { label: 'Ventas totales', value: formatCOP(metrics.totalRevenue), icon: DollarSign, color: '#a78bfa', bg: 'rgba(124,58,237,0.15)' },
    { label: 'Este mes', value: formatCOP(metrics.monthlyRevenue), icon: TrendingUp, color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
    { label: 'Pedidos totales', value: metrics.totalOrders.toString(), icon: ShoppingCart, color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
    { label: 'Clientes', value: metrics.totalBuyers.toString(), icon: Users, color: '#f9a8d4', bg: 'rgba(249,168,212,0.15)' },
    { label: 'Productos activos', value: metrics.totalProducts.toString(), icon: Package, color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
    { label: 'Pedidos pendientes', value: metrics.pendingOrders.toString(), icon: Clock, color: '#fb923c', bg: 'rgba(251,146,60,0.15)' },
    { label: 'Hoy', value: formatCOP(metrics.todayRevenue), icon: CheckCircle, color: '#4ade80', bg: 'rgba(74,222,128,0.15)' },
    { label: 'Stock bajo', value: metrics.lowStockCount.toString(), icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  ]

  const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pendiente', color: '#fbbf24' },
    confirmed: { label: 'Confirmado', color: '#60a5fa' },
    processing: { label: 'Procesando', color: '#a78bfa' },
    shipped: { label: 'Enviado', color: '#34d399' },
    delivered: { label: 'Entregado', color: '#4ade80' },
    cancelled: { label: 'Cancelado', color: '#ef4444' },
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-white/40 text-sm mt-0.5">Resumen del negocio en tiempo real</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {METRICS.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-xl p-4 border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg" style={{ background: bg }}>
                <Icon className="h-4 w-4" style={{ color }} />
              </div>
              <span className="text-xs text-white/50">{label}</span>
            </div>
            <p className="text-xl font-bold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Chart + Top productos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl p-4 border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <h2 className="text-sm font-semibold text-white/70 mb-4">Ingresos últimos 6 meses (COP)</h2>
          <Suspense fallback={<div className="h-48 flex items-center justify-center text-white/30">Cargando...</div>}>
            <SalesChart data={chartData} />
          </Suspense>
        </div>
        <div className="rounded-xl p-4 border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <h2 className="text-sm font-semibold text-white/70 mb-3">Top 5 productos</h2>
          <div className="space-y-2">
            {topProducts.length === 0 && <p className="text-white/30 text-xs">Sin ventas aún</p>}
            {topProducts.map((p, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-white/30 w-4">{i + 1}.</span>
                  <span className="text-xs text-white/80 truncate">{p.name}</span>
                </div>
                <span className="text-xs font-semibold text-violet-300 flex-shrink-0">{formatCOP(p.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pedidos recientes + Stock bajo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-4 border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white/70">Pedidos recientes</h2>
            <a href="/panel/pedidos" className="text-xs text-violet-400 hover:text-violet-300">Ver todos →</a>
          </div>
          <div className="space-y-2">
            {recentOrders.orders.length === 0 && <p className="text-white/30 text-xs">Sin pedidos aún</p>}
            {recentOrders.orders.map((order: any) => (
              <div key={order.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-white/5">
                <div className="min-w-0">
                  <p className="text-xs text-white/80 truncate">{order.profiles?.full_name ?? order.profiles?.email ?? 'Cliente'}</p>
                  <p className="text-xs text-white/30">{new Date(order.created_at).toLocaleDateString('es-CO')}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-semibold text-violet-300">{formatCOP(order.total)}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: `${STATUS_LABELS[order.status]?.color}20`, color: STATUS_LABELS[order.status]?.color }}>
                    {STATUS_LABELS[order.status]?.label ?? order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl p-4 border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white/70">Stock bajo (≤10 unidades)</h2>
            <a href="/panel/inventario" className="text-xs text-violet-400 hover:text-violet-300">Ver todo →</a>
          </div>
          <div className="space-y-2">
            {lowStock.length === 0 && <p className="text-white/30 text-xs">Todo el stock está bien ✓</p>}
            {lowStock.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-white/5">
                <div className="min-w-0">
                  <p className="text-xs text-white/80 truncate">{p.name}</p>
                  <p className="text-xs text-white/30">{p.categories?.name}</p>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: p.stock === 0 ? 'rgba(239,68,68,0.2)' : 'rgba(251,191,36,0.2)', color: p.stock === 0 ? '#ef4444' : '#fbbf24' }}>
                  {p.stock === 0 ? 'AGOTADO' : `${p.stock} uds`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verificar build**

```bash
npm run build 2>&1 | tail -10
```

- [ ] **Step 4: Commit**

```bash
git add src/features/admin/actions.ts src/app/\(admin\)/panel/page.tsx
git commit -m "feat(panel): dashboard with real Supabase metrics and charts"
```

---

## Chunk 5: Panel Admin — Gestión de Productos

### Task 7: /panel/productos con CRUD real

**Files:**
- Create: `src/app/(admin)/panel/productos/page.tsx`
- Create: `src/app/(admin)/panel/productos/nuevo/page.tsx`
- Create: `src/app/(admin)/panel/productos/[id]/page.tsx`
- Create: `src/app/(admin)/panel/productos/ProductsTable.tsx`
- Create: `src/app/(admin)/panel/productos/ProductForm.tsx`

- [ ] **Step 1: Crear ProductsTable.tsx**

Crear `src/app/(admin)/panel/productos/ProductsTable.tsx`:

```typescript
'use client'
import { useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { updateProductStatus, deleteProduct } from '@/features/admin/actions'
import { formatCOP } from '@/lib/utils/currency'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit2, Trash2, Eye, EyeOff, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface Product {
  id: string; name: string; price: number; stock: number
  is_active: boolean; is_featured: boolean; images: string[]
  categories: { name: string } | null; created_at: string
}

export function ProductsTable({ products }: { products: Product[] }) {
  const [list, setList] = useState(products)
  const [pending, startTransition] = useTransition()

  const handleToggle = (id: string, current: boolean) => {
    startTransition(async () => {
      const res = await updateProductStatus(id, !current)
      if (res.error) { toast.error(res.error); return }
      setList(l => l.map(p => p.id === id ? { ...p, is_active: !current } : p))
      toast.success(!current ? 'Producto activado' : 'Producto desactivado')
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return
    startTransition(async () => {
      const res = await deleteProduct(id)
      if (res.error) { toast.error(res.error); return }
      setList(l => l.filter(p => p.id !== id))
      toast.success('Producto eliminado')
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-white/50 text-sm">{list.length} productos</p>
        <Link href="/panel/productos/nuevo">
          <Button size="sm" className="gap-2 bg-violet-600 hover:bg-violet-500 text-white">
            <Plus className="h-4 w-4" /> Nuevo producto
          </Button>
        </Link>
      </div>
      <div className="rounded-xl overflow-hidden border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Producto</th>
              <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Categoría</th>
              <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Precio</th>
              <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Stock</th>
              <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Estado</th>
              <th className="px-4 py-3 text-right text-xs text-white/50 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {list.map((product) => (
              <tr key={product.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {product.images?.[0] ? (
                      <Image src={product.images[0]} alt={product.name} width={40} height={40}
                        className="rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                        <span className="text-white/20 text-xs">IMG</span>
                      </div>
                    )}
                    <span className="text-white/80 font-medium truncate max-w-[180px]">{product.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-white/50">{product.categories?.name ?? '—'}</td>
                <td className="px-4 py-3 text-violet-300 font-semibold">{formatCOP(product.price)}</td>
                <td className="px-4 py-3">
                  <span className={product.stock === 0 ? 'text-red-400' : product.stock <= 5 ? 'text-yellow-400' : 'text-white/70'}>
                    {product.stock} uds
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{ background: product.is_active ? 'rgba(74,222,128,0.15)' : 'rgba(239,68,68,0.15)', color: product.is_active ? '#4ade80' : '#ef4444' }}>
                    {product.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/panel/productos/${product.id}`}>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-white/40 hover:text-white hover:bg-white/10">
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon"
                      className="h-7 w-7 text-white/40 hover:text-white hover:bg-white/10"
                      onClick={() => handleToggle(product.id, product.is_active)} disabled={pending}>
                      {product.is_active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon"
                      className="h-7 w-7 text-red-400/60 hover:text-red-400 hover:bg-red-400/10"
                      onClick={() => handleDelete(product.id)} disabled={pending}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && (
          <div className="py-12 text-center text-white/30">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>Sin productos. Crea el primero.</p>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Crear /panel/productos/page.tsx**

```typescript
import { getAdminProducts } from '@/features/admin/actions'
import { ProductsTable } from './ProductsTable'

export const metadata = { title: 'Productos — Panel Admin' }

export default async function ProductosPage() {
  const { products } = await getAdminProducts(1, 100)
  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Productos</h1>
        <p className="text-white/40 text-sm mt-0.5">Gestiona tu catálogo de productos</p>
      </div>
      <ProductsTable products={products} />
    </div>
  )
}
```

- [ ] **Step 3: Crear ProductForm.tsx (usado para nuevo y editar)**

Crear `src/app/(admin)/panel/productos/ProductForm.tsx`:

```typescript
'use client'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { createProduct, updateProduct } from '@/features/admin/actions'
import { ImageUploader } from '@/features/dashboard/components/ImageUploader'
import { useState } from 'react'

interface Category { id: string; name: string }
interface ProductData {
  id?: string; name?: string; price?: number; stock?: number
  description?: string; category_id?: string; compare_price?: number | null
  brand?: string | null; sku?: string | null; images?: string[]
  is_featured?: boolean; is_active?: boolean
}

export function ProductForm({ categories, product }: { categories: Category[]; product?: ProductData }) {
  const [images, setImages] = useState<string[]>(product?.images ?? [])
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const isEdit = !!product?.id

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('images', JSON.stringify(images))

    startTransition(async () => {
      const res = isEdit
        ? await updateProduct(product!.id!, formData)
        : await createProduct(formData)

      if ('error' in res && res.error) { toast.error(res.error); return }
      toast.success(isEdit ? 'Producto actualizado' : 'Producto creado')
      router.push('/panel/productos')
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2 space-y-1.5">
          <Label className="text-white/70">Nombre del producto *</Label>
          <Input name="name" defaultValue={product?.name} required
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
            placeholder="Ej: Camiseta Premium Algodón" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-white/70">Precio (COP) *</Label>
          <Input name="price" type="number" step="100" min="0" defaultValue={product?.price} required
            className="bg-white/5 border-white/10 text-white" placeholder="85000" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-white/70">Precio anterior (COP)</Label>
          <Input name="compare_price" type="number" step="100" min="0" defaultValue={product?.compare_price ?? ''}
            className="bg-white/5 border-white/10 text-white" placeholder="120000" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-white/70">Stock *</Label>
          <Input name="stock" type="number" min="0" defaultValue={product?.stock ?? 0} required
            className="bg-white/5 border-white/10 text-white" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-white/70">Categoría</Label>
          <Select name="category_id" defaultValue={product?.category_id ?? ''}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Seleccionar categoría" />
            </SelectTrigger>
            <SelectContent style={{ background: 'rgba(15,12,41,0.98)', borderColor: 'rgba(255,255,255,0.1)' }}>
              {categories.map(c => (
                <SelectItem key={c.id} value={c.id} className="text-white hover:bg-white/10">{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-white/70">Marca</Label>
          <Input name="brand" defaultValue={product?.brand ?? ''}
            className="bg-white/5 border-white/10 text-white" placeholder="MODAVIDA" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-white/70">SKU</Label>
          <Input name="sku" defaultValue={product?.sku ?? ''}
            className="bg-white/5 border-white/10 text-white" placeholder="MOD-001" />
        </div>
        <div className="md:col-span-2 space-y-1.5">
          <Label className="text-white/70">Descripción</Label>
          <Textarea name="description" defaultValue={product?.description ?? ''} rows={4}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
            placeholder="Descripción detallada del producto..." />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-white/70">Imágenes del producto</Label>
        <ImageUploader images={images} onImagesChange={setImages} />
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" name="is_featured" value="true"
            defaultChecked={product?.is_featured}
            className="w-4 h-4 accent-violet-600" />
          <span className="text-sm text-white/70">Producto destacado</span>
        </label>
        {isEdit && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="is_active" value="true"
              defaultChecked={product?.is_active !== false}
              className="w-4 h-4 accent-violet-600" />
            <span className="text-sm text-white/70">Activo</span>
          </label>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending}
          className="bg-violet-600 hover:bg-violet-500 text-white font-semibold">
          {isPending ? 'Guardando...' : isEdit ? 'Actualizar producto' : 'Crear producto'}
        </Button>
        <Button type="button" variant="ghost" className="text-white/50 hover:text-white"
          onClick={() => router.push('/panel/productos')}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 4: Crear páginas nuevo y editar**

`src/app/(admin)/panel/productos/nuevo/page.tsx`:
```typescript
import { getCategories } from '@/features/admin/actions'
import { ProductForm } from '../ProductForm'

export const metadata = { title: 'Nuevo Producto — Panel Admin' }

export default async function NuevoProductoPage() {
  const categories = await getCategories()
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Nuevo Producto</h1>
        <p className="text-white/40 text-sm mt-0.5">Agrega un nuevo producto al catálogo</p>
      </div>
      <div className="rounded-xl p-6 border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <ProductForm categories={categories} />
      </div>
    </div>
  )
}
```

`src/app/(admin)/panel/productos/[id]/page.tsx`:
```typescript
import { createClient } from '@/lib/supabase/server'
import { getCategories } from '@/features/admin/actions'
import { ProductForm } from '../ProductForm'
import { notFound } from 'next/navigation'

export default async function EditarProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()
  if (!product) notFound()
  const categories = await getCategories()

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Editar Producto</h1>
        <p className="text-white/40 text-sm mt-0.5">{product.name}</p>
      </div>
      <div className="rounded-xl p-6 border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <ProductForm categories={categories} product={product as any} />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/\(admin\)/panel/productos/
git commit -m "feat(panel): products CRUD with real Supabase data"
```

---

## Chunk 6: Panel Admin — Pedidos, Clientes, Inventario, Promociones, Configuración

### Task 8: /panel/pedidos

**Files:**
- Create: `src/app/(admin)/panel/pedidos/page.tsx`
- Create: `src/app/(admin)/panel/pedidos/[id]/page.tsx`

- [ ] **Step 1: Crear /panel/pedidos/page.tsx**

```typescript
import Link from 'next/link'
import { getAdminOrders } from '@/features/admin/actions'
import { formatCOP } from '@/lib/utils/currency'

export const metadata = { title: 'Pedidos — Panel Admin' }

const STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: '#fbbf24' },
  confirmed: { label: 'Confirmado', color: '#60a5fa' },
  processing: { label: 'Procesando', color: '#a78bfa' },
  shipped: { label: 'Enviado', color: '#34d399' },
  delivered: { label: 'Entregado', color: '#4ade80' },
  cancelled: { label: 'Cancelado', color: '#ef4444' },
  refunded: { label: 'Reembolsado', color: '#f9a8d4' },
}

export default async function PedidosPage() {
  const { orders, total } = await getAdminOrders(1, 50)
  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Pedidos</h1>
        <p className="text-white/40 text-sm mt-0.5">{total} pedidos en total</p>
      </div>
      <div className="rounded-xl overflow-hidden border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">ID</th>
              <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Cliente</th>
              <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Total</th>
              <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Estado</th>
              <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Fecha</th>
              <th className="px-4 py-3 text-right text-xs text-white/50 font-medium">Acción</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o: any) => (
              <tr key={o.id} className="border-b border-white/5 hover:bg-white/2">
                <td className="px-4 py-3 font-mono text-xs text-white/40">{o.id.slice(0, 8)}...</td>
                <td className="px-4 py-3 text-white/80">{o.profiles?.full_name ?? o.profiles?.email ?? '—'}</td>
                <td className="px-4 py-3 text-violet-300 font-semibold">{formatCOP(o.total)}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: `${STATUS[o.status]?.color}20`, color: STATUS[o.status]?.color }}>
                    {STATUS[o.status]?.label ?? o.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-white/40 text-xs">{new Date(o.created_at).toLocaleDateString('es-CO')}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/panel/pedidos/${o.id}`} className="text-xs text-violet-400 hover:text-violet-300">Ver detalle →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <div className="py-12 text-center text-white/30 text-sm">Sin pedidos aún</div>}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Crear /panel/pedidos/[id]/page.tsx con cambio de estado**

```typescript
import { getOrderDetail, updateOrderStatus, updateOrderTracking } from '@/features/admin/actions'
import { formatCOP } from '@/lib/utils/currency'
import { notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export default async function PedidoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await getOrderDetail(id)
  if (!order) notFound()

  const STATUS_OPTIONS = ['pending','confirmed','processing','shipped','delivered','cancelled','refunded']

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-4">
        <a href="/panel/pedidos" className="text-violet-400 hover:text-violet-300 text-sm">← Volver</a>
        <h1 className="text-xl font-bold text-white">Pedido #{order.id.slice(0,8)}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cliente */}
        <div className="rounded-xl p-4 border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <h3 className="text-sm font-semibold text-white/70 mb-3">Cliente</h3>
          <p className="text-white/80">{order.profiles?.full_name ?? '—'}</p>
          <p className="text-white/50 text-sm">{order.profiles?.email}</p>
          <p className="text-white/50 text-sm">{order.profiles?.phone}</p>
        </div>

        {/* Dirección */}
        <div className="rounded-xl p-4 border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <h3 className="text-sm font-semibold text-white/70 mb-3">Envío</h3>
          {order.shipping_address && (
            <div className="text-white/70 text-sm space-y-0.5">
              <p>{order.shipping_address.full_name}</p>
              <p>{order.shipping_address.address_line1}</p>
              <p>{order.shipping_address.city}, {order.shipping_address.state}</p>
              <p>{order.shipping_address.phone}</p>
            </div>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="rounded-xl p-4 border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <h3 className="text-sm font-semibold text-white/70 mb-3">Productos</h3>
        <div className="space-y-2">
          {order.order_items?.map((item: any) => (
            <div key={item.id} className="flex items-center justify-between py-2 border-b border-white/5">
              <div>
                <p className="text-white/80 text-sm">{item.product_name}</p>
                <p className="text-white/40 text-xs">x{item.quantity} × {formatCOP(item.price)}</p>
              </div>
              <span className="text-violet-300 font-semibold text-sm">{formatCOP(item.subtotal)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2">
            <span className="text-white/70 font-semibold">Total</span>
            <span className="text-violet-300 font-bold text-lg">{formatCOP(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="rounded-xl p-4 border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <h3 className="text-sm font-semibold text-white/70 mb-3">Actualizar estado</h3>
        <form action={async (formData: FormData) => {
          'use server'
          const status = formData.get('status') as string
          await updateOrderStatus(id, status)
          revalidatePath(`/panel/pedidos/${id}`)
        }} className="flex gap-3">
          <select name="status" defaultValue={order.status}
            className="flex-1 bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm">
            {STATUS_OPTIONS.map(s => <option key={s} value={s} style={{ background: '#1a1a2e' }}>{s}</option>)}
          </select>
          <button type="submit" className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors">
            Actualizar
          </button>
        </form>

        <h3 className="text-sm font-semibold text-white/70 mb-3 mt-4">Número de tracking</h3>
        <form action={async (formData: FormData) => {
          'use server'
          const tracking = formData.get('tracking') as string
          await updateOrderTracking(id, tracking)
          revalidatePath(`/panel/pedidos/${id}`)
        }} className="flex gap-3">
          <input name="tracking" defaultValue={order.tracking_number ?? ''} placeholder="TRK-123456789"
            className="flex-1 bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm placeholder:text-white/30" />
          <button type="submit" className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors">
            Guardar
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(admin\)/panel/pedidos/
git commit -m "feat(panel): orders management with status update and tracking"
```

### Task 9: /panel/clientes, /panel/inventario, /panel/promociones, /panel/categorias, /panel/configuracion

**Files:**
- Create: `src/app/(admin)/panel/clientes/page.tsx`
- Create: `src/app/(admin)/panel/inventario/page.tsx`
- Create: `src/app/(admin)/panel/promociones/page.tsx`
- Create: `src/app/(admin)/panel/categorias/page.tsx`
- Create: `src/app/(admin)/panel/configuracion/page.tsx`

- [ ] **Step 1: /panel/clientes/page.tsx**

```typescript
import { getAdminClients, toggleClientActive } from '@/features/admin/actions'
import { revalidatePath } from 'next/cache'

export const metadata = { title: 'Clientes — Panel Admin' }

export default async function ClientesPage() {
  const { clients, total } = await getAdminClients(1, 100)
  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Clientes</h1>
        <p className="text-white/40 text-sm mt-0.5">{total} compradores registrados</p>
      </div>
      <div className="rounded-xl overflow-hidden border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Nombre</th>
              <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Email</th>
              <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Teléfono</th>
              <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Registro</th>
              <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Estado</th>
              <th className="px-4 py-3 text-right text-xs text-white/50 font-medium">Acción</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c: any) => (
              <tr key={c.id} className="border-b border-white/5 hover:bg-white/2">
                <td className="px-4 py-3 text-white/80">{c.full_name ?? '—'}</td>
                <td className="px-4 py-3 text-white/60 text-xs">{c.email}</td>
                <td className="px-4 py-3 text-white/50 text-xs">{c.phone ?? '—'}</td>
                <td className="px-4 py-3 text-white/40 text-xs">{new Date(c.created_at).toLocaleDateString('es-CO')}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs"
                    style={{ background: c.is_active !== false ? 'rgba(74,222,128,0.15)' : 'rgba(239,68,68,0.15)', color: c.is_active !== false ? '#4ade80' : '#ef4444' }}>
                    {c.is_active !== false ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <form action={async () => {
                    'use server'
                    await toggleClientActive(c.id, c.is_active === false)
                    revalidatePath('/panel/clientes')
                  }}>
                    <button type="submit" className="text-xs text-violet-400 hover:text-violet-300">
                      {c.is_active !== false ? 'Desactivar' : 'Activar'}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {clients.length === 0 && <div className="py-12 text-center text-white/30 text-sm">Sin clientes aún</div>}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: /panel/inventario/page.tsx**

```typescript
import { getLowStockProducts, updateProductStock } from '@/features/admin/actions'
import { revalidatePath } from 'next/cache'

export const metadata = { title: 'Inventario — Panel Admin' }

export default async function InventarioPage() {
  const products = await getLowStockProducts(20)
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Inventario</h1>
        <p className="text-white/40 text-sm mt-0.5">Productos con stock bajo (≤20 unidades)</p>
      </div>
      <div className="rounded-xl overflow-hidden border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Producto</th>
              <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Categoría</th>
              <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Stock actual</th>
              <th className="px-4 py-3 text-right text-xs text-white/50 font-medium">Actualizar stock</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p: any) => (
              <tr key={p.id} className="border-b border-white/5 hover:bg-white/2">
                <td className="px-4 py-3 text-white/80">{p.name}</td>
                <td className="px-4 py-3 text-white/50 text-xs">{p.categories?.name ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className="font-bold" style={{ color: p.stock === 0 ? '#ef4444' : p.stock <= 5 ? '#fbbf24' : '#fbbf24' }}>
                    {p.stock === 0 ? 'AGOTADO' : `${p.stock} uds`}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <form action={async (formData: FormData) => {
                    'use server'
                    const newStock = parseInt(formData.get('stock') as string)
                    if (!isNaN(newStock) && newStock >= 0) await updateProductStock(p.id, newStock)
                    revalidatePath('/panel/inventario')
                  }} className="flex items-center justify-end gap-2">
                    <input name="stock" type="number" min="0" defaultValue={p.stock}
                      className="w-20 bg-white/5 border border-white/10 text-white rounded-lg px-2 py-1 text-xs text-center" />
                    <button type="submit" className="px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-medium">
                      Guardar
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="py-12 text-center text-white/30 text-sm">
            ✓ Todo el inventario está bien abastecido (más de 20 unidades)
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: /panel/categorias/page.tsx**

```typescript
import { getCategories, createCategory, deleteCategory } from '@/features/admin/actions'
import { revalidatePath } from 'next/cache'
import { Trash2 } from 'lucide-react'

export const metadata = { title: 'Categorías — Panel Admin' }

export default async function CategoriasPage() {
  const categories = await getCategories()
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Categorías</h1>
        <p className="text-white/40 text-sm mt-0.5">{categories.length} categorías activas</p>
      </div>

      {/* Formulario crear */}
      <div className="rounded-xl p-4 border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <h2 className="text-sm font-semibold text-white/70 mb-3">Nueva categoría</h2>
        <form action={async (formData: FormData) => {
          'use server'
          await createCategory(formData)
          revalidatePath('/panel/categorias')
        }} className="flex gap-3">
          <input name="name" required placeholder="Ej: Mujer, Hombre, Accesorios..."
            className="flex-1 bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm placeholder:text-white/30" />
          <input name="icon" placeholder="Emoji (ej: 👗)"
            className="w-24 bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm placeholder:text-white/30" />
          <button type="submit" className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors">
            Crear
          </button>
        </form>
      </div>

      {/* Lista */}
      <div className="rounded-xl overflow-hidden border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Nombre</th>
              <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Slug</th>
              <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Icono</th>
              <th className="px-4 py-3 text-right text-xs text-white/50 font-medium">Acción</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c: any) => (
              <tr key={c.id} className="border-b border-white/5 hover:bg-white/2">
                <td className="px-4 py-3 text-white/80 font-medium">{c.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-white/40">{c.slug}</td>
                <td className="px-4 py-3 text-lg">{c.icon ?? '—'}</td>
                <td className="px-4 py-3 text-right">
                  <form action={async () => {
                    'use server'
                    await deleteCategory(c.id)
                    revalidatePath('/panel/categorias')
                  }}>
                    <button type="submit" className="text-red-400/60 hover:text-red-400 transition-colors p-1">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: /panel/promociones/page.tsx**

```typescript
import { getAdminCoupons, createCoupon, toggleCouponActive, deleteCoupon } from '@/features/admin/actions'
import { formatCOP } from '@/lib/utils/currency'
import { revalidatePath } from 'next/cache'

export const metadata = { title: 'Promociones — Panel Admin' }

export default async function PromocionesPage() {
  const coupons = await getAdminCoupons()
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Promociones y Cupones</h1>
        <p className="text-white/40 text-sm mt-0.5">{coupons.length} cupones creados</p>
      </div>

      {/* Crear cupón */}
      <div className="rounded-xl p-4 border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <h2 className="text-sm font-semibold text-white/70 mb-3">Nuevo cupón</h2>
        <form action={async (formData: FormData) => {
          'use server'
          await createCoupon(formData)
          revalidatePath('/panel/promociones')
        }} className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <input name="code" required placeholder="VERANO20" className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm placeholder:text-white/30 uppercase" />
          <select name="type" className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm">
            <option value="percentage" style={{ background: '#1a1a2e' }}>Porcentaje (%)</option>
            <option value="fixed" style={{ background: '#1a1a2e' }}>Valor fijo (COP)</option>
          </select>
          <input name="value" type="number" min="0" required placeholder="20" className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm placeholder:text-white/30" />
          <input name="expires_at" type="date" className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm" />
          <input name="min_order_amount" type="number" min="0" placeholder="Monto mínimo (COP)" className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm placeholder:text-white/30" />
          <input name="max_uses" type="number" min="0" placeholder="Máx. usos" className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm placeholder:text-white/30" />
          <button type="submit" className="md:col-span-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors">
            Crear cupón
          </button>
        </form>
      </div>

      {/* Lista */}
      <div className="rounded-xl overflow-hidden border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Código</th>
              <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Tipo</th>
              <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Valor</th>
              <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Usos</th>
              <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Vence</th>
              <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Estado</th>
              <th className="px-4 py-3 text-right text-xs text-white/50 font-medium">Acción</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c: any) => (
              <tr key={c.id} className="border-b border-white/5 hover:bg-white/2">
                <td className="px-4 py-3 font-mono font-bold text-violet-300">{c.code}</td>
                <td className="px-4 py-3 text-white/60">{c.type === 'percentage' ? 'Porcentaje' : 'Fijo'}</td>
                <td className="px-4 py-3 text-white/80">{c.type === 'percentage' ? `${c.value}%` : formatCOP(c.value)}</td>
                <td className="px-4 py-3 text-white/50">{c.used_count ?? 0}{c.max_uses ? ` / ${c.max_uses}` : ''}</td>
                <td className="px-4 py-3 text-white/40 text-xs">{c.expires_at ? new Date(c.expires_at).toLocaleDateString('es-CO') : '—'}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs"
                    style={{ background: c.is_active ? 'rgba(74,222,128,0.15)' : 'rgba(239,68,68,0.15)', color: c.is_active ? '#4ade80' : '#ef4444' }}>
                    {c.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <form action={async () => {
                      'use server'
                      await toggleCouponActive(c.id, !c.is_active)
                      revalidatePath('/panel/promociones')
                    }}>
                      <button type="submit" className="text-xs text-violet-400 hover:text-violet-300">{c.is_active ? 'Desactivar' : 'Activar'}</button>
                    </form>
                    <form action={async () => {
                      'use server'
                      await deleteCoupon(c.id)
                      revalidatePath('/panel/promociones')
                    }}>
                      <button type="submit" className="text-xs text-red-400/60 hover:text-red-400">Eliminar</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: /panel/configuracion/page.tsx**

```typescript
import { getCompanyConfig, updateCompanyConfig } from '@/features/admin/actions'
import { revalidatePath } from 'next/cache'

export const metadata = { title: 'Configuración — Panel Admin' }

export default async function ConfiguracionPage() {
  const config = await getCompanyConfig()
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Configuración de la empresa</h1>
        <p className="text-white/40 text-sm mt-0.5">Datos de la tienda visibles para los clientes</p>
      </div>
      <form action={async (formData: FormData) => {
        'use server'
        await updateCompanyConfig(formData)
        revalidatePath('/panel/configuracion')
      }} className="rounded-xl p-6 border border-white/10 space-y-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <div className="grid grid-cols-2 gap-4">
          {[
            { name: 'name', label: 'Nombre de la tienda', placeholder: 'MODAVIDA' },
            { name: 'tagline', label: 'Eslogan', placeholder: 'Moda y Accesorios en Colombia' },
            { name: 'email', label: 'Email de contacto', placeholder: 'hola@modavida.co' },
            { name: 'phone', label: 'Teléfono', placeholder: '+57 300 000 0000' },
            { name: 'address', label: 'Dirección', placeholder: 'Calle 123 #45-67' },
            { name: 'city', label: 'Ciudad', placeholder: 'Bogotá, Colombia' },
            { name: 'nit', label: 'NIT', placeholder: '900.000.000-0' },
            { name: 'logo_url', label: 'URL del logo', placeholder: 'https://...' },
          ].map(({ name, label, placeholder }) => (
            <div key={name} className="space-y-1.5">
              <label className="text-xs text-white/50 uppercase tracking-wide">{label}</label>
              <input name={name} defaultValue={config?.[name] ?? ''} placeholder={placeholder}
                className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm placeholder:text-white/20" />
            </div>
          ))}
        </div>
        <button type="submit" className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-semibold transition-colors">
          Guardar cambios
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 6: Commit todo el panel**

```bash
git add src/app/\(admin\)/panel/
git commit -m "feat(panel): complete admin panel - orders, clients, inventory, promotions, config"
```

---

## Chunk 7: Frontend Público — Limpiar Marketplace

### Task 10: Home sin marketplace + Navbar con link a /panel

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/layout/Navbar.tsx`
- Modify: `src/features/catalog/actions.ts`
- Create: `src/app/(public)/catalogo/page.tsx`

- [ ] **Step 1: Limpiar home (eliminar CTAs de marketplace)**

En `src/app/page.tsx`:
1. Eliminar el botón "Crear tienda" del hero (líneas 88-95)
2. Eliminar la sección "¿Tienes una tienda?" completa (líneas 179-208)
3. Cambiar el link "Ver todos" de `/categoria/mujer` a `/catalogo`
4. Eliminar `{ Store }` del import de lucide-react
5. En `ProductCard`, eliminar las props `storeName` y `storeSlug` (ya que no hay tiendas)

- [ ] **Step 2: Actualizar Navbar — agregar link a /panel para admin**

En `src/components/layout/Navbar.tsx`, en el DropdownMenu de usuario autenticado, agregar después de "Mis Pedidos":

```typescript
// Agregar hook para detectar si es admin
const [isAdmin, setIsAdmin] = React.useState(false)

// En el useEffect, después de getUser:
if (data.user) {
  supabase.from('profiles').select('role').eq('id', data.user.id).single()
    .then(({ data: profile }) => setIsAdmin(profile?.role === 'admin'))
}

// En el onAuthStateChange, agregar:
if (session?.user) {
  supabase.from('profiles').select('role').eq('id', session.user.id).single()
    .then(({ data: profile }) => setIsAdmin(profile?.role === 'admin'))
}
```

Y agregar en el dropdown:
```typescript
{isAdmin && (
  <>
    <DropdownMenuSeparator />
    <DropdownMenuItem>
      <Link href="/panel" className="flex items-center gap-2 w-full text-violet-400 hover:text-violet-300">
        <Settings className="h-4 w-4" />
        Panel Admin
      </Link>
    </DropdownMenuItem>
  </>
)}
```

- [ ] **Step 3: Crear /catalogo page**

Crear `src/app/(public)/catalogo/page.tsx`:
```typescript
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/features/catalog/components/ProductCard'
import { ShoppingBag } from 'lucide-react'

export const metadata = { title: 'Catálogo — MODAVIDA' }

export default async function CatalogoPage() {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from('products')
    .select('id, name, slug, price, compare_price, images, categories(name)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="font-playfair text-3xl font-bold text-white">Catálogo completo</h1>
        <p className="text-white/50 text-sm mt-1">{products?.length ?? 0} productos disponibles</p>
      </div>
      {products && products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((p: any) => (
            <ProductCard key={p.id} id={p.id} name={p.name} slug={p.slug}
              price={p.price} comparePrice={p.compare_price ?? undefined} images={p.images ?? []} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-white/40">
          <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p>Próximamente productos disponibles</p>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Actualizar catalog actions (quitar store_id)**

En `src/features/catalog/actions.ts`, buscar todas las queries que incluyan `store_id` en `select` o `filter` y eliminarlas. La función `getFeaturedProducts` no debe unirse a `stores`.

- [ ] **Step 5: Actualizar ProductCard (quitar storeName/storeSlug)**

En `src/features/catalog/components/ProductCard.tsx`, eliminar las props `storeName` y `storeSlug` y su render.

- [ ] **Step 6: Verificar build completo**

```bash
npm run build 2>&1 | tail -15
```

Resolver cualquier error TypeScript antes de continuar.

- [ ] **Step 7: Commit**

```bash
git add src/app/page.tsx src/components/layout/Navbar.tsx src/features/catalog/ src/app/\(public\)/catalogo/
git commit -m "feat: clean public frontend, remove marketplace UI, add /catalogo"
```

---

## Chunk 8: CLAUDE.md + Deploy

### Task 11: Actualizar CLAUDE.md con contexto completo del proyecto

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Reescribir CLAUDE.md con contexto real del proyecto**

```markdown
@AGENTS.md

# MODAVIDA — Tienda Única E-commerce

## Qué es este proyecto
Tienda e-commerce de moda y accesorios para Colombia. **NO es un marketplace.**
- 2 roles: `admin` (dueño del negocio) y `buyer` (comprador)
- Moneda: COP (pesos colombianos)
- Pagos: Wompi (pasarela colombiana)
- Auth: Supabase con Google OAuth + Email/Password

## Stack técnico
- Next.js 16 (usa `proxy.ts` NO `middleware.ts`)
- Tailwind CSS v4 (CSS-first config en globals.css, NO tailwind.config.js)
- Supabase SSR (`@supabase/ssr`) — server/client/admin clients
- Zustand para carrito (client-side, persist)
- shadcn/ui para componentes
- Recharts para gráficas
- Resend para emails

## Estructura de rutas
- `/` `/catalogo` `/categoria/[slug]` `/producto/[slug]` `/buscar` — Público
- `/login` `/registro` `/recuperar` — Auth (route group `(auth)`)
- `/carrito` `/checkout` `/cuenta/**` — Buyer (requiere login)
- `/panel/**` — Admin (requiere rol `admin`)
- `/auth/callback` — OAuth callback

## Base de datos (Supabase)
Tablas principales: `profiles`, `products`, `categories`, `orders`, `order_items`,
`cart_items`, `addresses`, `reviews`, `coupons`, `product_variants`, `wishlists`,
`notifications`, `company_config`
- NO hay tabla `stores`
- Roles en enum: `buyer | admin` (NO hay `seller`)
- RLS activo en todas las tablas

## Archivos clave
- `src/proxy.ts` — Middleware de Next.js 16 (protege rutas)
- `src/lib/supabase/middleware.ts` — Lógica de sesión y roles
- `src/lib/supabase/admin.ts` — Cliente con service role key (bypasa RLS)
- `src/features/admin/actions.ts` — TODAS las acciones del panel admin
- `src/features/auth/actions.ts` — signIn, signUp, signOut, Google OAuth
- `src/features/cart/store.ts` — Zustand store del carrito
- `src/features/checkout/wompi-actions.ts` — Integración Wompi

## Variables de entorno requeridas
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_WOMPI_PUBLIC_KEY=
WOMPI_PRIVATE_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=
```

## Convenciones importantes
- Server Actions: `'use server'` al inicio, importar desde `@/features/*/actions`
- Siempre usar `(supabase as any)` para queries sin tipos exactos
- `revalidatePath()` después de cada mutación
- Imágenes: subir a Supabase Storage bucket `products`
- El admin accede en `/panel`, NO en `/dashboard` ni `/admin`
- Nunca crear archivos `middleware.ts` — usar solo `proxy.ts`
- Tailwind v4: usar `@theme inline` en globals.css, NO tailwind.config.js

## Vercel / Deploy
- Variables de entorno en Vercel Dashboard → Settings → Environment Variables
- Verificar que `SUPABASE_SERVICE_ROLE_KEY` esté como variable de servidor (no NEXT_PUBLIC_)
- Desactivar Deployment Protection en Vercel si hay 401 en preview URLs
```

- [ ] **Step 2: Verificar build final**

```bash
npm run build 2>&1 | tail -20
```

Expected output: `✓ Compiled successfully` sin errores TypeScript.

- [ ] **Step 3: Commit y push**

```bash
git add -A
git commit -m "feat: complete marketplace-to-single-store transformation"
git push
```

---

## Verificación Final

- [ ] `/panel` muestra métricas reales de Supabase (ventas, pedidos, clientes, stock)
- [ ] `/panel/productos` lista, activa/desactiva y elimina productos
- [ ] `/panel/productos/nuevo` crea productos con imágenes
- [ ] `/panel/pedidos` lista pedidos y permite cambiar estado
- [ ] `/panel/pedidos/[id]` muestra detalle completo con tracking
- [ ] `/panel/clientes` lista compradores
- [ ] `/panel/inventario` muestra stock bajo con actualización rápida
- [ ] `/panel/promociones` CRUD de cupones
- [ ] `/panel/categorias` CRUD de categorías
- [ ] `/panel/configuracion` edita datos de empresa
- [ ] `/` no tiene botones "Crear tienda" ni "Vendedores"
- [ ] `/catalogo` muestra todos los productos
- [ ] Navbar admin tiene link a `/panel`
- [ ] Usuario sin rol admin es redirigido de `/panel` a `/`
- [ ] Build sin errores TypeScript
