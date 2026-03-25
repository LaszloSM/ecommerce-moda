'use client'

import { Button } from '@/components/ui/button'
import { useCartStore } from '@/features/cart/store'
import { ShoppingBag } from 'lucide-react'

interface Props {
  productId: string
  variantId?: string
  name: string
  price: number
  image: string
  storeId: string
  storeName: string
  disabled?: boolean
}

export function AddToCartButton({
  productId,
  variantId,
  name,
  price,
  image,
  storeId,
  storeName,
  disabled,
}: Props) {
  const { addItem } = useCartStore()
  const handleAdd = addItem ?? (() => {})

  return (
    <Button
      type="button"
      size="lg"
      className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white"
      disabled={disabled}
      onClick={() =>
        handleAdd({
          id: `${productId}${variantId ? `-${variantId}` : ''}`,
          productId,
          name,
          slug: '',
          image,
          price,
          quantity: 1,
          variant: variantId,
          storeName,
          storeSlug: storeId,
        })
      }
    >
      <ShoppingBag className="w-4 h-4 mr-2" />
      Añadir al carrito
    </Button>
  )
}
