import { getSellerStore, getSellerOrders } from '@/features/dashboard/actions'
import { OrdersTable } from './OrdersTable'

export default async function PedidosPage() {
  const store = await getSellerStore()

  if (!store) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-white/50">No tienes una tienda activa.</p>
      </div>
    )
  }

  const orders = await getSellerOrders(store.id)

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-3xl font-bold text-white"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Pedidos
        </h1>
        <p className="text-white/50 mt-1">
          {orders.length} pedido{orders.length !== 1 ? 's' : ''} en total
        </p>
      </div>

      <OrdersTable orders={orders} />
    </div>
  )
}
