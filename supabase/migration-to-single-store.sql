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
