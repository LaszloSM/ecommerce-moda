import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  pending:   { label: 'Pendiente',   className: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  confirmed: { label: 'Confirmado',  className: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  shipped:   { label: 'Enviado',     className: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  delivered: { label: 'Entregado',   className: 'bg-green-500/20 text-green-300 border-green-500/30' },
  cancelled: { label: 'Cancelado',   className: 'bg-red-500/20 text-red-300 border-red-500/30' },
  refunded:  { label: 'Reembolsado', className: 'bg-gray-500/20 text-gray-300 border-gray-500/30' },
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status]
  return (
    <Badge variant="outline" className={cn('font-medium', config.className)}>
      {config.label}
    </Badge>
  )
}
