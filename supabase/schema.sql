-- ============================================================
-- MODAVIDA E-COMMERCE — Schema v2 (robusto y corregido)
-- Ejecutar en Supabase → SQL Editor → Run
-- ============================================================

-- ============================================================
-- TABLAS (CREATE IF NOT EXISTS — seguro re-ejecutar)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text,
  email       text,
  avatar_url  text,
  phone       text,
  role        text        NOT NULL DEFAULT 'buyer' CHECK (role IN ('buyer','seller','admin')),
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.categories (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  slug        text        UNIQUE NOT NULL,
  icon        text,
  parent_id   uuid        REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.stores (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  slug        text        UNIQUE NOT NULL,
  description text,
  logo_url    text,
  banner_url  text,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id      uuid          NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  category_id   uuid          REFERENCES public.categories(id) ON DELETE SET NULL,
  name          text          NOT NULL,
  slug          text          UNIQUE NOT NULL,
  description   text,
  price         numeric(12,2) NOT NULL CHECK (price >= 0),
  compare_price numeric(12,2) CHECK (compare_price >= 0),
  stock         integer       NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sku           text,
  weight_kg     numeric(6,3)  CHECK (weight_kg >= 0),
  images        text[]        NOT NULL DEFAULT '{}',
  tags          text[]        NOT NULL DEFAULT '{}',
  is_active     boolean       NOT NULL DEFAULT true,
  is_featured   boolean       NOT NULL DEFAULT false,
  created_at    timestamptz   NOT NULL DEFAULT now(),
  updated_at    timestamptz   NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_variants (
  id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     uuid          NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name           text          NOT NULL,
  attributes     jsonb         NOT NULL DEFAULT '{}',
  price_modifier numeric(12,2) NOT NULL DEFAULT 0,
  stock          integer       NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sku            text
);

CREATE TABLE IF NOT EXISTS public.coupons (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id         uuid          NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  code             text          UNIQUE NOT NULL,
  type             text          NOT NULL CHECK (type IN ('percentage','fixed')),
  value            numeric(10,2) NOT NULL CHECK (value > 0),
  min_order_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (min_order_amount >= 0),
  max_uses         integer       CHECK (max_uses > 0),
  used_count       integer       NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  expires_at       timestamptz,
  is_active        boolean       NOT NULL DEFAULT true,
  created_at       timestamptz   NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cart_items (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id uuid        NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id uuid        REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity   integer     NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  -- UNIQUE que maneja NULL en variant_id correctamente
  UNIQUE NULLS NOT DISTINCT (user_id, product_id, variant_id)
);

CREATE TABLE IF NOT EXISTS public.addresses (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name     text        NOT NULL,
  address_line1 text        NOT NULL,
  address_line2 text,
  city          text        NOT NULL,
  state         text        NOT NULL,
  postal_code   text,
  country       text        NOT NULL DEFAULT 'CO',
  phone         text        NOT NULL,
  is_default    boolean     NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.orders (
  id                   uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id             uuid          NOT NULL REFERENCES public.profiles(id),
  store_id             uuid          NOT NULL REFERENCES public.stores(id),
  status               text          NOT NULL DEFAULT 'pending'
                                     CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled','refunded')),
  subtotal             numeric(12,2) NOT NULL CHECK (subtotal >= 0),
  discount_amount      numeric(12,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  shipping_cost        numeric(12,2) NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
  total                numeric(12,2) NOT NULL CHECK (total >= 0),
  coupon_id            uuid          REFERENCES public.coupons(id) ON DELETE SET NULL,
  shipping_address     jsonb         NOT NULL DEFAULT '{}',
  notes                text,
  tracking_number      text,
  wompi_transaction_id text,
  payment_status       text          NOT NULL DEFAULT 'pending'
                                     CHECK (payment_status IN ('pending','paid','failed','refunded')),
  created_at           timestamptz   NOT NULL DEFAULT now(),
  updated_at           timestamptz   NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      uuid          NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id    uuid          REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id    uuid          REFERENCES public.product_variants(id) ON DELETE SET NULL,
  product_name  text          NOT NULL,
  product_image text,
  price         numeric(12,2) NOT NULL CHECK (price >= 0),
  quantity      integer       NOT NULL CHECK (quantity > 0),
  subtotal      numeric(12,2) NOT NULL CHECK (subtotal >= 0)
);

CREATE TABLE IF NOT EXISTS public.reviews (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       uuid        NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  buyer_id         uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id         uuid        NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  rating           integer     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title            text,
  body             text,
  images           text[]      NOT NULL DEFAULT '{}',
  is_verified      boolean     NOT NULL DEFAULT false,
  helpful_count    integer     NOT NULL DEFAULT 0 CHECK (helpful_count >= 0),
  vendor_reply     text,
  vendor_reply_at  timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, buyer_id, order_id)
);

CREATE TABLE IF NOT EXISTS public.wishlists (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id uuid        NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       text        NOT NULL CHECK (type IN ('order_update','review','low_stock','new_order')),
  title      text        NOT NULL,
  body       text,
  is_read    boolean     NOT NULL DEFAULT false,
  metadata   jsonb       NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- ÍNDICES (rendimiento en queries frecuentes)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_store_id      ON public.products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id   ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active     ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured   ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_slug          ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id        ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id        ON public.orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status          ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id   ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id     ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id  ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read  ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id     ON public.cart_items(user_id);

-- ============================================================
-- COLUMNAS FALTANTES (para BD ya existente)
-- ============================================================
ALTER TABLE public.profiles  ADD COLUMN IF NOT EXISTS email      text;
ALTER TABLE public.profiles  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.stores    ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.products  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.orders    ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending'
  CHECK (payment_status IN ('pending','paid','failed','refunded'));

-- Renombrar payment_intent_id → wompi_transaction_id si existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='orders' AND column_name='payment_intent_id') THEN
    ALTER TABLE public.orders RENAME COLUMN payment_intent_id TO wompi_transaction_id;
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ============================================================
-- CATEGORÍAS INICIALES
-- ============================================================
INSERT INTO public.categories (name, slug, icon) VALUES
  ('Mujer',      'mujer',      'shirt'),
  ('Hombre',     'hombre',     'shirt'),
  ('Accesorios', 'accesorios', 'watch'),
  ('Calzado',    'calzado',    'footprints'),
  ('Deportivo',  'deportivo',  'dumbbell')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- FUNCIÓN: updated_at automático (reemplaza moddatetime)
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at  ON public.profiles;
DROP TRIGGER IF EXISTS trg_stores_updated_at    ON public.stores;
DROP TRIGGER IF EXISTS trg_products_updated_at  ON public.products;
DROP TRIGGER IF EXISTS trg_orders_updated_at    ON public.orders;
DROP TRIGGER IF EXISTS handle_orders_updated_at ON public.orders;

CREATE TRIGGER trg_profiles_updated_at  BEFORE UPDATE ON public.profiles  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_stores_updated_at    BEFORE UPDATE ON public.stores    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_products_updated_at  BEFORE UPDATE ON public.products  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_orders_updated_at    BEFORE UPDATE ON public.orders    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- FUNCIÓN: crear perfil al registrarse
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    new.email
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name  = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    email      = COALESCE(EXCLUDED.email, public.profiles.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- FUNCIÓN: decrement_stock (concurrencia segura)
-- ============================================================
CREATE OR REPLACE FUNCTION public.decrement_stock(
  p_product_id uuid,
  p_variant_id uuid,
  p_quantity   integer
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications    ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLÍTICAS RLS
-- ============================================================

-- PROFILES
-- FIX: política sin recursión (no hace subquery a la misma tabla)
DROP POLICY IF EXISTS "profiles_select_own"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own"   ON public.profiles;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- STORES
DROP POLICY IF EXISTS "stores_select_public"  ON public.stores;
DROP POLICY IF EXISTS "stores_insert_owner"   ON public.stores;
DROP POLICY IF EXISTS "stores_update_owner"   ON public.stores;
DROP POLICY IF EXISTS "stores_delete_owner"   ON public.stores;

CREATE POLICY "stores_select_public" ON public.stores FOR SELECT USING (true);
CREATE POLICY "stores_insert_owner"  ON public.stores FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "stores_update_owner"  ON public.stores FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "stores_delete_owner"  ON public.stores FOR DELETE USING (owner_id = auth.uid());

-- PRODUCTS
DROP POLICY IF EXISTS "products_select_public" ON public.products;
DROP POLICY IF EXISTS "products_insert_owner"  ON public.products;
DROP POLICY IF EXISTS "products_update_owner"  ON public.products;
DROP POLICY IF EXISTS "products_delete_owner"  ON public.products;

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
DROP POLICY IF EXISTS "variants_write_owner"   ON public.product_variants;

CREATE POLICY "variants_select_public" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "variants_write_owner"   ON public.product_variants FOR ALL
  USING (product_id IN (
    SELECT id FROM public.products
    WHERE store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  ));

-- CATEGORIES (lectura pública, escritura admin)
DROP POLICY IF EXISTS "categories_select_public" ON public.categories;
DROP POLICY IF EXISTS "categories_write_admin"   ON public.categories;

CREATE POLICY "categories_select_public" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories_write_admin"   ON public.categories FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- COUPONS
-- FIX: vendedor puede ver sus propios cupones (activos o no)
DROP POLICY IF EXISTS "coupons_select_public"  ON public.coupons;
DROP POLICY IF EXISTS "coupons_write_owner"    ON public.coupons;

CREATE POLICY "coupons_select_public" ON public.coupons FOR SELECT
  USING (is_active = true OR store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()));
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
-- FIX: comprador puede cancelar (UPDATE) su propio pedido
DROP POLICY IF EXISTS "orders_select"        ON public.orders;
DROP POLICY IF EXISTS "orders_insert_buyer"  ON public.orders;
DROP POLICY IF EXISTS "orders_update_seller" ON public.orders;
DROP POLICY IF EXISTS "orders_update_buyer"  ON public.orders;

CREATE POLICY "orders_select" ON public.orders FOR SELECT
  USING (buyer_id = auth.uid() OR store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()));
CREATE POLICY "orders_insert_buyer" ON public.orders FOR INSERT
  WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "orders_update_seller" ON public.orders FOR UPDATE
  USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()));
CREATE POLICY "orders_update_buyer" ON public.orders FOR UPDATE
  USING (buyer_id = auth.uid() AND status = 'pending');

-- ORDER ITEMS
DROP POLICY IF EXISTS "order_items_select" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert" ON public.order_items;

CREATE POLICY "order_items_select" ON public.order_items FOR SELECT
  USING (order_id IN (
    SELECT id FROM public.orders
    WHERE buyer_id = auth.uid()
       OR store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  ));
CREATE POLICY "order_items_insert" ON public.order_items FOR INSERT
  WITH CHECK (order_id IN (SELECT id FROM public.orders WHERE buyer_id = auth.uid()));

-- REVIEWS
DROP POLICY IF EXISTS "reviews_select_public"       ON public.reviews;
DROP POLICY IF EXISTS "reviews_insert_buyer"         ON public.reviews;
DROP POLICY IF EXISTS "reviews_update_vendor_reply"  ON public.reviews;

CREATE POLICY "reviews_select_public" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert_buyer"  ON public.reviews FOR INSERT
  WITH CHECK (
    buyer_id = auth.uid()
    AND order_id IN (SELECT id FROM public.orders WHERE buyer_id = auth.uid() AND status = 'delivered')
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
DROP POLICY IF EXISTS "notifications_own"        ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;

CREATE POLICY "notifications_own"        ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE  USING (user_id = auth.uid());

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES
  ('product-images', 'product-images', true),
  ('store-assets',   'store-assets',   true),
  ('review-images',  'review-images',  true),
  ('avatars',        'avatars',        true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "storage_product_images_read"   ON storage.objects;
DROP POLICY IF EXISTS "storage_product_images_write"  ON storage.objects;
DROP POLICY IF EXISTS "storage_product_images_update" ON storage.objects;
DROP POLICY IF EXISTS "storage_product_images_delete" ON storage.objects;
DROP POLICY IF EXISTS "storage_store_assets_read"     ON storage.objects;
DROP POLICY IF EXISTS "storage_store_assets_write"    ON storage.objects;
DROP POLICY IF EXISTS "storage_avatars_read"          ON storage.objects;
DROP POLICY IF EXISTS "storage_avatars_write"         ON storage.objects;
DROP POLICY IF EXISTS "storage_review_images_read"    ON storage.objects;
DROP POLICY IF EXISTS "storage_review_images_write"   ON storage.objects;

-- Product images
CREATE POLICY "storage_product_images_read"   ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "storage_product_images_write"  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
CREATE POLICY "storage_product_images_update" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "storage_product_images_delete" ON storage.objects FOR DELETE USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Store assets
CREATE POLICY "storage_store_assets_read"  ON storage.objects FOR SELECT USING (bucket_id = 'store-assets');
CREATE POLICY "storage_store_assets_write" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'store-assets' AND auth.role() = 'authenticated');

-- Avatars
CREATE POLICY "storage_avatars_read"  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "storage_avatars_write" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Review images
CREATE POLICY "storage_review_images_read"  ON storage.objects FOR SELECT USING (bucket_id = 'review-images');
CREATE POLICY "storage_review_images_write" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'review-images' AND auth.role() = 'authenticated');
