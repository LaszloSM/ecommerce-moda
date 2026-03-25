import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle2, Package, ShoppingBag } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface OrderItem {
  id: string
  product_name: string
  product_image: string | null
  price: number
  quantity: number
  subtotal: number
}

interface Order {
  id: string
  total: number | null
  order_items: OrderItem[]
}

interface Props {
  params: Promise<{ orderId: string }>
}

export default async function OrderSuccessPage({ params }: Props) {
  const { orderId } = await params
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: order } = await (supabase as any)
    .from('orders')
    .select('id, total, order_items(id, product_name, product_image, price, quantity, subtotal)')
    .eq('id', orderId)
    .single() as { data: Order | null }

  return (
    <div className="min-h-screen bg-[#0f0c29] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        {/* Success icon */}
        <div className="flex flex-col items-center text-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full" />
            <div className="relative p-6 rounded-full bg-green-500/10 border border-green-400/25">
              <CheckCircle2 className="w-14 h-14 text-green-400" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">¡Pedido confirmado!</h1>
            <p className="text-white/50 mt-2">Tu pedido fue recibido con éxito.</p>
          </div>
          {order && (
            <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-white/40">Número de pedido</p>
              <p className="text-sm font-mono font-medium text-violet-300 mt-0.5">
                #{order.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
          )}
        </div>

        {/* Order items */}
        {order?.order_items && order.order_items.length > 0 && (
          <div
            className={cn(
              'rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6',
              'shadow-[0_4px_32px_0_rgba(124,58,237,0.12)]',
            )}
          >
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-violet-400" />
              <h2 className="font-semibold text-white">Productos pedidos</h2>
            </div>

            <div className="space-y-3">
              {order.order_items.map((item: OrderItem) => (
                  <div
                    key={item.id}
                    className="flex gap-3 py-3 border-b border-white/6 last:border-0"
                  >
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-white/5">
                      {item.product_image ? (
                        <Image
                          src={item.product_image}
                          alt={item.product_name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-violet-500/20" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white line-clamp-1">
                        {item.product_name}
                      </p>
                      <p className="text-xs text-white/40 mt-0.5">
                        x{item.quantity} · ${item.price.toLocaleString('es-CO')} c/u
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-violet-300 shrink-0">
                      ${item.subtotal.toLocaleString('es-CO')}
                    </span>
                  </div>
                )
              )}
            </div>

            {order.total && (
              <>
                <Separator className="bg-white/8 mt-2" />
                <div className="flex justify-between font-bold text-white pt-3">
                  <span>Total pagado</span>
                  <span className="text-violet-400">
                    ${Number(order.total).toLocaleString('es-CO')}
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* CTA buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/cuenta/pedidos"
            className={buttonVariants({
              variant: 'outline',
              className: 'h-12 border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 font-medium',
            })}
          >
            Ver mis pedidos
          </Link>
          <Link
            href="/"
            className={buttonVariants({
              className: 'h-12 bg-violet-600 hover:bg-violet-500 text-white font-semibold',
            })}
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Seguir comprando
          </Link>
        </div>
      </div>
    </div>
  )
}
