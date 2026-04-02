import { Suspense } from 'react'
import {
  getAdminDashboardMetrics,
  getMonthlyRevenueData,
  getTopProducts,
  getLowStockProducts,
  getAdminOrders,
} from '@/features/admin/actions'
import { SalesChart } from '@/components/charts/SalesChart'
import { formatCOP } from '@/lib/utils/currency'
import {
  TrendingUp, ShoppingCart, Users, Package,
  AlertTriangle, DollarSign, Clock, CheckCircle
} from 'lucide-react'

export const metadata = { title: 'Panel Admin — MODAVIDA' }

export default async function PanelPage() {
  const [metrics, chartData, topProducts, lowStock, recentOrders] = await Promise.all([
    getAdminDashboardMetrics(),
    getMonthlyRevenueData(),
    getTopProducts(),
    getLowStockProducts(10),
    getAdminOrders(1, 5),
  ])

  const METRICS = [
    { label: 'Ventas totales', value: formatCOP(metrics.totalRevenue), icon: DollarSign, color: '#a78bfa', bg: 'rgba(124,58,237,0.15)' },
    { label: 'Este mes', value: formatCOP(metrics.monthlyRevenue), icon: TrendingUp, color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
    { label: 'Pedidos totales', value: metrics.totalOrders.toString(), icon: ShoppingCart, color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
    { label: 'Clientes', value: metrics.totalBuyers.toString(), icon: Users, color: '#f9a8d4', bg: 'rgba(249,168,212,0.15)' },
    { label: 'Productos activos', value: metrics.totalProducts.toString(), icon: Package, color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
    { label: 'Pedidos pendientes', value: metrics.pendingOrders.toString(), icon: Clock, color: '#fb923c', bg: 'rgba(251,146,60,0.15)' },
    { label: 'Hoy', value: formatCOP(metrics.todayRevenue), icon: CheckCircle, color: '#4ade80', bg: 'rgba(74,222,128,0.15)' },
    { label: 'Stock bajo', value: metrics.lowStockCount.toString(), icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  ]

  const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pendiente', color: '#fbbf24' },
    confirmed: { label: 'Confirmado', color: '#60a5fa' },
    processing: { label: 'Procesando', color: '#a78bfa' },
    shipped: { label: 'Enviado', color: '#34d399' },
    delivered: { label: 'Entregado', color: '#4ade80' },
    cancelled: { label: 'Cancelado', color: '#ef4444' },
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-white/40 text-sm mt-0.5">Resumen del negocio en tiempo real</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {METRICS.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-xl p-4 border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg" style={{ background: bg }}>
                <Icon className="h-4 w-4" style={{ color }} />
              </div>
              <span className="text-xs text-white/50">{label}</span>
            </div>
            <p className="text-xl font-bold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Chart + Top productos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl p-4 border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <h2 className="text-sm font-semibold text-white/70 mb-4">Ingresos últimos 6 meses (COP)</h2>
          <Suspense fallback={<div className="h-48 flex items-center justify-center text-white/30">Cargando...</div>}>
            <SalesChart data={chartData} />
          </Suspense>
        </div>
        <div className="rounded-xl p-4 border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <h2 className="text-sm font-semibold text-white/70 mb-3">Top 5 productos</h2>
          <div className="space-y-2">
            {topProducts.length === 0 && <p className="text-white/30 text-xs">Sin ventas aún</p>}
            {topProducts.map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-white/30 w-4">{i + 1}.</span>
                  <span className="text-xs text-white/80 truncate">{p.name}</span>
                </div>
                <span className="text-xs font-semibold text-violet-300 flex-shrink-0">{formatCOP(p.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pedidos recientes + Stock bajo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-4 border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white/70">Pedidos recientes</h2>
            <a href="/panel/pedidos" className="text-xs text-violet-400 hover:text-violet-300">Ver todos →</a>
          </div>
          <div className="space-y-2">
            {recentOrders.orders.length === 0 && <p className="text-white/30 text-xs">Sin pedidos aún</p>}
            {recentOrders.orders.map((order: any) => (
              <div key={order.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-white/5">
                <div className="min-w-0">
                  <p className="text-xs text-white/80 truncate">{order.profiles?.full_name ?? order.profiles?.email ?? 'Cliente'}</p>
                  <p className="text-xs text-white/30">{new Date(order.created_at).toLocaleDateString('es-CO')}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-semibold text-violet-300">{formatCOP(order.total)}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: `${STATUS_LABELS[order.status]?.color ?? '#9ca3af'}20`, color: STATUS_LABELS[order.status]?.color ?? '#9ca3af' }}>
                    {STATUS_LABELS[order.status]?.label ?? order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl p-4 border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white/70">Stock bajo (≤10 unidades)</h2>
            <a href="/panel/inventario" className="text-xs text-violet-400 hover:text-violet-300">Ver todo →</a>
          </div>
          <div className="space-y-2">
            {lowStock.length === 0 && <p className="text-white/30 text-xs">Todo el stock está bien ✓</p>}
            {lowStock.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-white/5">
                <div className="min-w-0">
                  <p className="text-xs text-white/80 truncate">{p.name}</p>
                  <p className="text-xs text-white/30">{(p.categories as any)?.name}</p>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: p.stock === 0 ? 'rgba(239,68,68,0.2)' : 'rgba(251,191,36,0.2)', color: p.stock === 0 ? '#ef4444' : '#fbbf24' }}>
                  {p.stock === 0 ? 'AGOTADO' : `${p.stock} uds`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
