'use client'

import { Button } from '@/components/ui/button'
import { useCartStore } from '@/features/cart/store'
import { ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'

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

  const handleAdd = () => {
    const result = addItem({
      productId,
      variantId,
      name,
      price,
      image,
      storeId,
      storeName,
      quantity: 1,
    })
    if (result?.replaced) {
      toast.info('Carrito actualizado', {
        description: 'Se reemplazó el carrito con productos de la nueva tienda.',
      })
    } else {
      toast.success('Producto agregado', {
        description: name,
      })
    }
  }

  return (
    <Button
      type="button"
      size="lg"
      className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white"
      disabled={disabled}
      onClick={handleAdd}
    >
      <ShoppingBag className="w-4 h-4 mr-2" />
      Añadir al carrito
    </Button>
  )
}
