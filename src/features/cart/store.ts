// Placeholder cart store — replace with Zustand implementation when ready

export interface CartItem {
  id: string
  productId: string
  name: string
  slug: string
  image: string
  price: number
  quantity: number
  variant?: string
  storeName?: string
  storeSlug?: string
}

export interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
}

export const useCartStore = (): CartStore => ({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
})
