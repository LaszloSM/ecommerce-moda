import Link from 'next/link'
import { DollarSign, ShoppingBag, Package, Star, AlertTriangle } from 'lucide-react'
import { getSellerStore, getDashboardMetrics, getSalesChartData, getSellerOrders } from '@/features/dashboard/actions'
import { MetricCard } from '@/features/dashboard/components/MetricCard'
import { SalesChart } from '@/components/charts/SalesChart'
import { OrderStatusBadge } from '@/components/ui/order-status-badge'
import { formatCOP } from '@/lib/utils/currency'

export default async function DashboardPage() {
  const store = await getSellerStore()

  if (!store) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 max-w-md">
          <div className="p-5 rounded-full bg-violet-500/15 border border-violet-400/20 w-20 h-20 flex items-center justify-center mx-auto">
            <Package className="w-10 h-10 text-violet-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Crea tu tienda</h2>
          <p className="text-white/60">
            Todavía no tienes una tienda activa. Crea una para empezar a vender.
          </p>
          <Link
            href="/dashboard/tienda"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
          >
            Crear tienda
          </Link>
        </div>
      </div>
    )
  }

  const [metrics, chartData, allOrders] = await Promise.all([
    getDashboardMetrics(store.id),
    getSalesChartData(store.id),
    getSellerOrders(store.id),
  ])

  const recentOrders = allOrders.slice(0, 5)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1
          className="text-3xl font-bold text-white"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Dashboard
        </h1>
        <p className="text-white/50 mt-1">Bienvenido a {store.name}</p>
      </div>

      {/* Low stock warning */}
      {metrics.lowStockCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/25 text-yellow-300 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            {metrics.lowStockCount} producto{metrics.lowStockCount !== 1 ? 's' : ''} con stock bajo (≤5 unidades).{' '}
            <Link href="/dashboard/productos" className="underline hover:text-yellow-200">
              Ver productos
            </Link>
          </span>
        </div>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Ingresos del mes"
          value={formatCOP(metrics.monthlyRevenue)}
          icon={<DollarSign className="w-5 h-5" />}
        />
        <MetricCard
          title="Total pedidos"
          value={metrics.totalOrders}
          icon={<ShoppingBag className="w-5 h-5" />}
        />
        <MetricCard
          title="Productos activos"
          value={metrics.totalProducts}
          icon={<Package className="w-5 h-5" />}
        />
        <MetricCard
          title="Calificación promedio"
          value={metrics.avgRating > 0 ? `${metrics.avgRating} / 5` : 'Sin reseñas'}
          icon={<Star className="w-5 h-5" />}
        />
      </div>

      {/* Sales chart */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-[0_8px_32px_0_rgba(124,58,237,0.12)]">
        <h2 className="text-base font-semibold text-white/80 mb-4">Ventas — últimos 7 días</h2>
        <SalesChart data={chartData} />
      </div>

      {/* Recent orders */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden shadow-[0_8px_32px_0_rgba(124,58,237,0.12)]">
        <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white/80">Pedidos recientes</h2>
          <Link
            href="/dashboard/pedidos"
            className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            Ver todos
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/8 bg-white/3">
                {['# Pedido', 'Cliente', 'Total', 'Estado', 'Fecha'].map(h => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-violet-200/60 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-white/40">
                    Sin pedidos aún
                  </td>
                </tr>
              ) : (
                recentOrders.map((order: any) => (
                  <tr key={order.id} className="border-b border-white/6 hover:bg-white/4 transition-colors">
                    <td className="px-4 py-3 text-sm text-white/70 font-mono">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 text-sm text-white/80">
                      {order.profiles?.full_name ?? order.profiles?.email ?? 'Cliente'}
                    </td>
                    <td className="px-4 py-3 text-sm text-white/80">
                      {formatCOP(order.total ?? 0)}
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-white/50">
                      {new Date(order.created_at).toLocaleDateString('es-CO', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
