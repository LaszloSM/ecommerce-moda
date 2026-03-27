import { getSellerStore, getMonthlyRevenueData, getTopProducts } from '@/features/dashboard/actions'
import { SalesChart } from '@/components/charts/SalesChart'
import { formatCOP } from '@/lib/utils/currency'

export default async function AnalyticsPage() {
  const store = await getSellerStore()

  if (!store) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-white/50">No tienes una tienda activa.</p>
      </div>
    )
  }

  const [monthlyData, topProducts] = await Promise.all([
    getMonthlyRevenueData(store.id),
    getTopProducts(store.id),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1
          className="text-3xl font-bold text-white"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Analytics
        </h1>
        <p className="text-white/50 mt-1">Rendimiento de {store.name}</p>
      </div>

      {/* Two charts side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Monthly revenue */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-[0_8px_32px_0_rgba(124,58,237,0.12)]">
          <h2 className="text-base font-semibold text-white/80 mb-4">
            Ingresos mensuales (últimos 6 meses)
          </h2>
          <SalesChart data={monthlyData} />
        </div>

        {/* Top 5 products by revenue */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-[0_8px_32px_0_rgba(124,58,237,0.12)]">
          <h2 className="text-base font-semibold text-white/80 mb-4">
            Top 5 productos por ingresos
          </h2>
          {topProducts.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-white/30 text-sm">
              Sin datos disponibles
            </div>
          ) : (
            <SalesChart data={topProducts} />
          )}
        </div>
      </div>

      {/* Top products table */}
      {topProducts.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden shadow-[0_8px_32px_0_rgba(124,58,237,0.12)]">
          <div className="px-6 py-4 border-b border-white/8">
            <h2 className="text-base font-semibold text-white/80">
              Detalle — Top productos
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8 bg-white/3">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-violet-200/60 uppercase tracking-wide">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-violet-200/60 uppercase tracking-wide">
                    Producto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-violet-200/60 uppercase tracking-wide">
                    Ingresos
                  </th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, idx) => (
                  <tr key={idx} className="border-b border-white/6 hover:bg-white/4 transition-colors">
                    <td className="px-4 py-3 text-sm text-white/40">{idx + 1}</td>
                    <td className="px-4 py-3 text-sm text-white/80 font-medium">{p.date}</td>
                    <td className="px-4 py-3 text-sm text-violet-300 font-semibold">
                      {formatCOP(p.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
