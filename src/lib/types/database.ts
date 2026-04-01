export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          role: 'buyer' | 'admin'
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          role?: 'buyer' | 'admin'
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          role?: 'buyer' | 'admin'
          created_at?: string
        }
      }
      stores: {
        Row: {
          id: string
          owner_id: string
          name: string
          slug: string
          description: string | null
          logo_url: string | null
          banner_url: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          slug: string
          description?: string | null
          logo_url?: string | null
          banner_url?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          slug?: string
          description?: string | null
          logo_url?: string | null
          banner_url?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
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
        Insert: {
          id?: string
          name?: string
          tagline?: string | null
          logo_url?: string | null
          banner_urls?: string[]
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          nit?: string | null
          social_links?: Record<string, string>
          shipping_methods?: Array<{ name: string; price: number; days: string }>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          tagline?: string | null
          logo_url?: string | null
          banner_urls?: string[]
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          nit?: string | null
          social_links?: Record<string, string>
          shipping_methods?: Array<{ name: string; price: number; days: string }>
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          icon: string | null
          parent_id: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          icon?: string | null
          parent_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          icon?: string | null
          parent_id?: string | null
        }
      }
      products: {
        Row: {
          id: string
          store_id: string
          category_id: string | null
          name: string
          slug: string
          description: string | null
          price: number
          compare_price: number | null
          stock: number
          sku: string | null
          weight_kg: number | null
          images: string[]
          tags: string[]
          is_active: boolean
          is_featured: boolean
          created_at: string
        }
        Insert: {
          id?: string
          store_id: string
          category_id?: string | null
          name: string
          slug: string
          description?: string | null
          price: number
          compare_price?: number | null
          stock?: number
          sku?: string | null
          weight_kg?: number | null
          images?: string[]
          tags?: string[]
          is_active?: boolean
          is_featured?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          category_id?: string | null
          name?: string
          slug?: string
          description?: string | null
          price?: number
          compare_price?: number | null
          stock?: number
          sku?: string | null
          weight_kg?: number | null
          images?: string[]
          tags?: string[]
          is_active?: boolean
          is_featured?: boolean
          created_at?: string
        }
      }
      product_variants: {
        Row: {
          id: string
          product_id: string
          name: string | null
          attributes: Json
          price_modifier: number
          stock: number
          sku: string | null
        }
        Insert: {
          id?: string
          product_id: string
          name?: string | null
          attributes?: Json
          price_modifier?: number
          stock?: number
          sku?: string | null
        }
        Update: {
          id?: string
          product_id?: string
          name?: string | null
          attributes?: Json
          price_modifier?: number
          stock?: number
          sku?: string | null
        }
      }
      coupons: {
        Row: {
          id: string
          store_id: string
          code: string
          type: 'percentage' | 'fixed'
          value: number
          min_order_amount: number
          max_uses: number | null
          used_count: number
          expires_at: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          store_id: string
          code: string
          type: 'percentage' | 'fixed'
          value: number
          min_order_amount?: number
          max_uses?: number | null
          used_count?: number
          expires_at?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          code?: string
          type?: 'percentage' | 'fixed'
          value?: number
          min_order_amount?: number
          max_uses?: number | null
          used_count?: number
          expires_at?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      cart_items: {
        Row: {
          id: string
          user_id: string
          product_id: string
          variant_id: string | null
          quantity: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          variant_id?: string | null
          quantity?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          variant_id?: string | null
          quantity?: number
          created_at?: string
        }
      }
      addresses: {
        Row: {
          id: string
          user_id: string
          full_name: string
          address_line1: string
          address_line2: string | null
          city: string
          state: string
          postal_code: string | null
          country: string
          phone: string | null
          is_default: boolean
        }
        Insert: {
          id?: string
          user_id: string
          full_name: string
          address_line1: string
          address_line2?: string | null
          city: string
          state: string
          postal_code?: string | null
          country?: string
          phone?: string | null
          is_default?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string
          address_line1?: string
          address_line2?: string | null
          city?: string
          state?: string
          postal_code?: string | null
          country?: string
          phone?: string | null
          is_default?: boolean
        }
      }
      orders: {
        Row: {
          id: string
          buyer_id: string | null
          store_id: string
          status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
          subtotal: number
          discount_amount: number
          shipping_cost: number
          total: number
          coupon_id: string | null
          shipping_address: Json | null
          notes: string | null
          tracking_number: string | null
          payment_intent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          buyer_id?: string | null
          store_id: string
          status?: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
          subtotal: number
          discount_amount?: number
          shipping_cost?: number
          total: number
          coupon_id?: string | null
          shipping_address?: Json | null
          notes?: string | null
          tracking_number?: string | null
          payment_intent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          buyer_id?: string | null
          store_id?: string
          status?: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
          subtotal?: number
          discount_amount?: number
          shipping_cost?: number
          total?: number
          coupon_id?: string | null
          shipping_address?: Json | null
          notes?: string | null
          tracking_number?: string | null
          payment_intent_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          variant_id: string | null
          product_name: string
          product_image: string | null
          price: number
          quantity: number
          subtotal: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          variant_id?: string | null
          product_name: string
          product_image?: string | null
          price: number
          quantity: number
          subtotal: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          variant_id?: string | null
          product_name?: string
          product_image?: string | null
          price?: number
          quantity?: number
          subtotal?: number
        }
      }
      reviews: {
        Row: {
          id: string
          product_id: string
          buyer_id: string
          order_id: string | null
          rating: number
          title: string | null
          body: string | null
          images: string[]
          is_verified: boolean
          helpful_count: number
          vendor_reply: string | null
          vendor_reply_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          buyer_id: string
          order_id?: string | null
          rating: number
          title?: string | null
          body?: string | null
          images?: string[]
          is_verified?: boolean
          helpful_count?: number
          vendor_reply?: string | null
          vendor_reply_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          buyer_id?: string
          order_id?: string | null
          rating?: number
          title?: string | null
          body?: string | null
          images?: string[]
          is_verified?: boolean
          helpful_count?: number
          vendor_reply?: string | null
          vendor_reply_at?: string | null
          created_at?: string
        }
      }
      wishlists: {
        Row: {
          id: string
          user_id: string
          product_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'order_update' | 'review' | 'low_stock' | 'general'
          title: string
          body: string | null
          is_read: boolean
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'order_update' | 'review' | 'low_stock' | 'general'
          title: string
          body?: string | null
          is_read?: boolean
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'order_update' | 'review' | 'low_stock' | 'general'
          title?: string
          body?: string | null
          is_read?: boolean
          metadata?: Json
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: {
      decrement_stock: {
        Args: { p_product_id: string; p_variant_id: string | null; p_quantity: number }
        Returns: void
      }
    }
    Enums: Record<string, never>
  }
}

// Convenience types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

export type Profile = Tables<'profiles'>
export type CompanyConfig = Tables<'company_config'>
export type Store = Tables<'stores'>
export type Category = Tables<'categories'>
export type Product = Tables<'products'>
export type ProductVariant = Tables<'product_variants'>
export type Coupon = Tables<'coupons'>
export type CartItem = Tables<'cart_items'>
export type Address = Tables<'addresses'>
export type Order = Tables<'orders'>
export type OrderItem = Tables<'order_items'>
export type Review = Tables<'reviews'>
export type Wishlist = Tables<'wishlists'>
export type Notification = Tables<'notifications'>

export type OrderStatus = Order['status']
export type UserRole = Profile['role']
export type CouponType = Coupon['type']
export type NotificationType = Notification['type']
