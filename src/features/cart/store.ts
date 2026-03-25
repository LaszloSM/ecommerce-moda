import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface CartItem {
  productId: string
  variantId?: string
  name: string
  price: number
  image: string
  storeId: string
  storeName: string
  quantity: number
}

interface CartState {
  items: CartItem[]
  storeId: string | null
  storeName: string | null
  addItem: (item: CartItem) => { replaced: boolean }
  removeItem: (productId: string, variantId?: string) => void
  updateQuantity: (productId: string, variantId: string | undefined, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      storeId: null,
      storeName: null,

      addItem: (item: CartItem) => {
        const state = get()
        // Single-vendor restriction
        if (state.storeId && state.storeId !== item.storeId) {
          // Replace cart with new store
          set({
            items: [{ ...item, quantity: item.quantity }],
            storeId: item.storeId,
            storeName: item.storeName,
          })
          return { replaced: true }
        }

        // Check if same item already in cart
        const existing = state.items.find(
          (i) => i.productId === item.productId && i.variantId === item.variantId
        )
        if (existing) {
          set({
            items: state.items.map((i) =>
              i.productId === item.productId && i.variantId === item.variantId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          })
        } else {
          set({
            items: [...state.items, item],
            storeId: item.storeId,
            storeName: item.storeName,
          })
        }
        return { replaced: false }
      },

      removeItem: (productId, variantId) => {
        set((state) => {
          const items = state.items.filter(
            (i) => !(i.productId === productId && i.variantId === variantId)
          )
          return {
            items,
            storeId: items.length === 0 ? null : state.storeId,
            storeName: items.length === 0 ? null : state.storeName,
          }
        })
      },

      updateQuantity: (productId, variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId)
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId && i.variantId === variantId
              ? { ...i, quantity }
              : i
          ),
        }))
      },

      clearCart: () => set({ items: [], storeId: null, storeName: null }),

      getTotal: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },
    }),
    {
      name: 'modavida-cart',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
