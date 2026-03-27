-- ============================================================
-- MODAVIDA E-COMMERCE — Schema completo
-- Ejecutar en Supabase → SQL Editor → Run
-- ============================================================

-- EXTENSIONES
CREATE EXTENSION IF NOT EXISTS moddatetime;

-- ============================================================
-- TABLAS
-- ============================================================

-- PERFILES (extiende auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  avatar_url text,
  role text DEFAULT 'buyer' CHECK (role IN ('buyer', 'seller', 'admin')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- CATEGORÍAS
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  icon text,
  parent_id uuid REFERENCES public.categories(id),
  created_at timestamptz DEFAULT now()
);

-- TIENDAS
CREATE TABLE IF NOT EXISTS public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES public.profiles(id),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  logo_url text,
  banner_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- PRODUCTOS
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  compare_price numeric(10,2),
  stock integer DEFAULT 0,
  sku text,
  weight_kg numeric(6,3),
  images text[],
  tags text[],
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- VARIANTES DE PRODUCTOS
CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  name text,
  attributes jsonb,
  price_modifier numeric(10,2) DEFAULT 0,
  stock integer DEFAULT 0,
  sku text
);

-- CUPONES
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value numeric(10,2) NOT NULL,
  min_order_amount numeric(10,2) DEFAULT 0,
  max_uses integer,
  used_count integer DEFAULT 0,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- CARRITO (sincronización en BD)
CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.product_variants(id),
  quantity integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id, variant_id)
);

-- DIRECCIONES
CREATE TABLE IF NOT EXISTS public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text DEFAULT 'CO',
  phone text,
  is_default boolean DEFAULT false
);

-- ÓRDENES
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid REFERENCES public.profiles(id),
  store_id uuid REFERENCES public.stores(id),
  status text DEFAULT 'pending' CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled','refunded')),
  subtotal numeric(10,2),
  discount_amount numeric(10,2) DEFAULT 0,
  shipping_cost numeric(10,2) DEFAULT 0,
  total numeric(10,2),
  coupon_id uuid REFERENCES public.coupons(id),
  shipping_address jsonb,
  notes text,
  tracking_number text,
  payment_intent_id text,
  wompi_transaction_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ITEMS DE ORDEN
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id),
  variant_id uuid REFERENCES public.product_variants(id),
  product_name text,
  product_image text,
  price numeric(10,2),
  quantity integer,
  subtotal numeric(10,2)
);

-- RESEÑAS
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  buyer_id uuid REFERENCES public.profiles(id),
  order_id uuid REFERENCES public.orders(id),
  rating integer CHECK (rating BETWEEN 1 AND 5),
  title text,
  body text,
  images text[],
  is_verified boolean DEFAULT false,
  helpful_count integer DEFAULT 0,
  vendor_reply text,
  vendor_reply_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, buyer_id, order_id)
);

-- WISHLIST
CREATE TABLE IF NOT EXISTS public.wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- NOTIFICACIONES
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text CHECK (type IN ('order_update', 'review', 'low_stock', 'new_order')),
  title text,
  body text,
  is_read boolean DEFAULT false,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- CATEGORÍAS INICIALES
-- ============================================================
INSERT INTO public.categories (name, slug, icon) VALUES
  ('Mujer', 'mujer', 'shirt'),
  ('Hombre', 'hombre', 'shirt'),
  ('Accesorios', 'accesorios', 'watch'),
  ('Calzado', 'calzado', 'footprints'),
  ('Deportivo', 'deportivo', 'dumbbell')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- FUNCIÓN: decrement_stock (concurrencia segura con FOR UPDATE)
-- ============================================================
CREATE OR REPLACE FUNCTION public.decrement_stock(
  p_product_id uuid,
  p_variant_id uuid,
  p_quantity integer
) RETURNS void AS $$
BEGIN
  IF p_variant_id IS NOT NULL THEN
    UPDATE public.product_variants
    SET stock = stock - p_quantity
    WHERE id = p_variant_id AND stock >= p_quantity;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Stock insuficiente para variante %', p_variant_id;
    END IF;
  ELSE
    UPDATE public.products
    SET stock = stock - p_quantity
    WHERE id = p_product_id AND stock >= p_quantity;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Stock insuficiente para producto %', p_product_id;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- TRIGGER: updated_at en orders
-- ============================================================
DROP TRIGGER IF EXISTS handle_orders_updated_at ON public.orders;
CREATE TRIGGER handle_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- ============================================================
-- TRIGGER: crear profile al registrarse
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- RLS — Habilitar Row Level Security
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLÍTICAS RLS — DROP primero para evitar conflictos
-- ============================================================

-- PROFILES
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT
  USING (id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- STORES
DROP POLICY IF EXISTS "stores_select_public" ON public.stores;
DROP POLICY IF EXISTS "stores_insert_owner" ON public.stores;
DROP POLICY IF EXISTS "stores_update_owner" ON public.stores;
CREATE POLICY "stores_select_public" ON public.stores FOR SELECT USING (true);
CREATE POLICY "stores_insert_owner" ON public.stores FOR INSERT
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "stores_update_owner" ON public.stores FOR UPDATE
  USING (owner_id = auth.uid());

-- PRODUCTS
DROP POLICY IF EXISTS "products_select_public" ON public.products;
DROP POLICY IF EXISTS "products_insert_owner" ON public.products;
DROP POLICY IF EXISTS "products_update_owner" ON public.products;
DROP POLICY IF EXISTS "products_delete_owner" ON public.products;
CREATE POLICY "products_select_public" ON public.products FOR SELECT
  USING (is_active = true OR store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()));
CREATE POLICY "products_insert_owner" ON public.products FOR INSERT
  WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()));
CREATE POLICY "products_update_owner" ON public.products FOR UPDATE
  USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()));
CREATE POLICY "products_delete_owner" ON public.products FOR DELETE
  USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()));

-- PRODUCT VARIANTS
DROP POLICY IF EXISTS "variants_select_public" ON public.product_variants;
DROP POLICY IF EXISTS "variants_write_owner" ON public.product_variants;
CREATE POLICY "variants_select_public" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "variants_write_owner" ON public.product_variants FOR ALL
  USING (product_id IN (SELECT id FROM public.products WHERE store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())));

-- CATEGORIES
DROP POLICY IF EXISTS "categories_select_public" ON public.categories;
DROP POLICY IF EXISTS "categories_write_admin" ON public.categories;
CREATE POLICY "categories_select_public" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories_write_admin" ON public.categories FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- COUPONS
DROP POLICY IF EXISTS "coupons_select_public" ON public.coupons;
DROP POLICY IF EXISTS "coupons_write_owner" ON public.coupons;
CREATE POLICY "coupons_select_public" ON public.coupons FOR SELECT USING (is_active = true);
CREATE POLICY "coupons_write_owner" ON public.coupons FOR ALL
  USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()));

-- CART ITEMS
DROP POLICY IF EXISTS "cart_select_own" ON public.cart_items;
DROP POLICY IF EXISTS "cart_insert_own" ON public.cart_items;
DROP POLICY IF EXISTS "cart_update_own" ON public.cart_items;
DROP POLICY IF EXISTS "cart_delete_own" ON public.cart_items;
CREATE POLICY "cart_select_own" ON public.cart_items FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "cart_insert_own" ON public.cart_items FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "cart_update_own" ON public.cart_items FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "cart_delete_own" ON public.cart_items FOR DELETE USING (user_id = auth.uid());

-- ADDRESSES
DROP POLICY IF EXISTS "addresses_own" ON public.addresses;
CREATE POLICY "addresses_own" ON public.addresses FOR ALL USING (user_id = auth.uid());

-- ORDERS
DROP POLICY IF EXISTS "orders_select" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_buyer" ON public.orders;
DROP POLICY IF EXISTS "orders_update_seller" ON public.orders;
CREATE POLICY "orders_select" ON public.orders FOR SELECT
  USING (
    buyer_id = auth.uid()
    OR store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  );
CREATE POLICY "orders_insert_buyer" ON public.orders FOR INSERT
  WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "orders_update_seller" ON public.orders FOR UPDATE
  USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()));

-- ORDER ITEMS
DROP POLICY IF EXISTS "order_items_select" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert" ON public.order_items;
CREATE POLICY "order_items_select" ON public.order_items FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM public.orders
      WHERE buyer_id = auth.uid()
         OR store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
    )
  );
CREATE POLICY "order_items_insert" ON public.order_items FOR INSERT
  WITH CHECK (
    order_id IN (SELECT id FROM public.orders WHERE buyer_id = auth.uid())
  );

-- REVIEWS
DROP POLICY IF EXISTS "reviews_select_public" ON public.reviews;
DROP POLICY IF EXISTS "reviews_insert_buyer" ON public.reviews;
DROP POLICY IF EXISTS "reviews_update_vendor_reply" ON public.reviews;
CREATE POLICY "reviews_select_public" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert_buyer" ON public.reviews FOR INSERT
  WITH CHECK (
    buyer_id = auth.uid()
    AND order_id IN (
      SELECT id FROM public.orders WHERE buyer_id = auth.uid() AND status = 'delivered'
    )
  );
CREATE POLICY "reviews_update_vendor_reply" ON public.reviews FOR UPDATE
  USING (
    product_id IN (
      SELECT id FROM public.products
      WHERE store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
    )
  );

-- WISHLISTS
DROP POLICY IF EXISTS "wishlists_own" ON public.wishlists;
CREATE POLICY "wishlists_own" ON public.wishlists FOR ALL USING (user_id = auth.uid());

-- NOTIFICATIONS
DROP POLICY IF EXISTS "notifications_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_own" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING (user_id = auth.uid());

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES
  ('product-images', 'product-images', true),
  ('store-assets', 'store-assets', true),
  ('review-images', 'review-images', true),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "storage_product_images_read" ON storage.objects;
DROP POLICY IF EXISTS "storage_product_images_write" ON storage.objects;
DROP POLICY IF EXISTS "storage_store_assets_read" ON storage.objects;
DROP POLICY IF EXISTS "storage_store_assets_write" ON storage.objects;
DROP POLICY IF EXISTS "storage_avatars_read" ON storage.objects;
DROP POLICY IF EXISTS "storage_avatars_write" ON storage.objects;

CREATE POLICY "storage_product_images_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');
CREATE POLICY "storage_product_images_write" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "storage_store_assets_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'store-assets');
CREATE POLICY "storage_store_assets_write" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'store-assets' AND auth.role() = 'authenticated');

CREATE POLICY "storage_avatars_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
CREATE POLICY "storage_avatars_write" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
