'use client'

import * as React from 'react'
import { OrderStatusBadge } from '@/components/ui/order-status-badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable, type ColumnDef } from '@/features/dashboard/components/DataTable'
import { updateOrderStatus } from '@/features/dashboard/product-actions'
import { formatCOP } from '@/lib/utils/currency'
import { toast } from 'sonner'

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'

interface Order {
  id: string
  status: OrderStatus
  total: number
  created_at: string
  profiles: { full_name: string | null; email: string | null } | null
}

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'shipped', label: 'Enviado' },
  { value: 'delivered', label: 'Entregado' },
  { value: 'cancelled', label: 'Cancelado' },
]

interface Props {
  orders: Order[]
}

export function OrdersTable({ orders: initialOrders }: Props) {
  const [orders, setOrders] = React.useState<Order[]>(initialOrders)

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const result = await updateOrderStatus(orderId, newStatus)
    if (result.error) {
      toast.error('Error al actualizar el estado')
      return
    }
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, status: newStatus as OrderStatus } : o)),
    )
    toast.success('Estado actualizado')
  }

  const columns: ColumnDef<Order>[] = [
    {
      key: 'id',
      header: '# Pedido',
      render: (value) => (
        <span className="font-mono text-white/70 text-xs">#{String(value).slice(0, 8).toUpperCase()}</span>
      ),
    },
    {
      key: 'profiles',
      header: 'Cliente',
      render: (value) => {
        const p = value as Order['profiles']
        return (
          <span className="text-white/80">{p?.full_name ?? p?.email ?? 'Cliente'}</span>
        )
      },
    },
    {
      key: 'total',
      header: 'Total',
      sortable: true,
      render: (value) => (
        <span className="text-white/80">{formatCOP(value as number)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (value) => <OrderStatusBadge status={value as OrderStatus} />,
    },
    {
      key: 'created_at',
      header: 'Fecha',
      sortable: true,
      render: (value) => (
        <span className="text-white/50 text-xs">
          {new Date(value as string).toLocaleDateString('es-CO', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'id',
      header: 'Cambiar estado',
      render: (value, row) => (
        <Select
          defaultValue={row.status}
          onValueChange={(v) => v && handleStatusChange(row.id, v)}
        >
          <SelectTrigger className="h-7 text-xs bg-white/5 border-white/15 text-white w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#0f0c29] border-white/15">
            {STATUS_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value} className="text-white text-xs hover:bg-white/10">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
  ]

  return <DataTable columns={columns as any} data={orders as any} pageSize={10} />
}
