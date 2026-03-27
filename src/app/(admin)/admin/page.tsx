import { getAdminMetrics, getAllStores, getAllUsers } from '@/features/admin/actions'
import { Users, Store, DollarSign, Package } from 'lucide-react'

function MetricCard({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-white/50 text-sm">{title}</p>
        <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
      </div>
    </div>
  )
}

export default async function AdminPage() {
  const [metrics, stores, users] = await Promise.all([
    getAdminMetrics(),
    getAllStores(),
    getAllUsers(5),
  ])

  const recentStores = stores.slice(0, 5)

  return (
    <div className="space-y-8">
      <div>
        <h1
          className="text-3xl font-bold text-white"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Panel de Administración
        </h1>
        <p className="text-white/50 mt-1">Resumen general de la plataforma</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Total usuarios"
          value={metrics.totalUsers}
          icon={<Users className="w-5 h-5" />}
        />
        <MetricCard
          title="Tiendas activas"
          value={metrics.activeStores}
          icon={<Store className="w-5 h-5" />}
        />
        <MetricCard
          title="Ingresos totales"
          value={`$${metrics.totalRevenue.toLocaleString('es-CO')}`}
          icon={<DollarSign className="w-5 h-5" />}
        />
        <MetricCard
          title="Productos activos"
          value={metrics.activeProducts}
          icon={<Package className="w-5 h-5" />}
        />
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent stores */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/8">
            <h2 className="text-base font-semibold text-white/80">Tiendas recientes</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/8 bg-white/3">
                <th className="px-4 py-3 text-left text-xs font-semibold text-violet-200/60 uppercase tracking-wide">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-violet-200/60 uppercase tracking-wide">Estado</th>
              </tr>
            </thead>
            <tbody>
              {recentStores.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-sm text-white/40">Sin tiendas</td>
                </tr>
              ) : (
                recentStores.map((store: any) => (
                  <tr key={store.id} className="border-b border-white/6 hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white text-sm font-medium">{store.name}</p>
                      <p className="text-white/40 text-xs">{(store.profiles as any)?.full_name ?? 'Sin dueño'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${store.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {store.is_active ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Recent users */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/8">
            <h2 className="text-base font-semibold text-white/80">Usuarios recientes</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/8 bg-white/3">
                <th className="px-4 py-3 text-left text-xs font-semibold text-violet-200/60 uppercase tracking-wide">Usuario</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-violet-200/60 uppercase tracking-wide">Rol</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-sm text-white/40">Sin usuarios</td>
                </tr>
              ) : (
                users.map((user: any) => (
                  <tr key={user.id} className="border-b border-white/6 hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white text-sm font-medium">{user.full_name ?? 'Sin nombre'}</p>
                      <p className="text-white/40 text-xs">{user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-medium capitalize">
                        {user.role ?? 'buyer'}
                      </span>
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
