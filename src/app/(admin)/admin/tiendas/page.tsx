import { getAllStores } from '@/features/admin/actions'
import { ToggleStoreButton } from '@/features/admin/components/ToggleStoreButton'

export default async function TiendasPage() {
  const stores = await getAllStores()

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-3xl font-bold text-white"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Tiendas
        </h1>
        <p className="text-white/50 mt-1">{stores.length} tienda{stores.length !== 1 ? 's' : ''} registrada{stores.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/8 bg-white/3">
                {['Nombre', 'Dueño', 'Estado', 'Fecha', 'Acciones'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-violet-200/60 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stores.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-white/40">
                    No hay tiendas
                  </td>
                </tr>
              ) : (
                stores.map((store: any) => (
                  <tr key={store.id} className="border-b border-white/6 hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm text-white font-medium">{store.name}</p>
                      <p className="text-xs text-white/40">{store.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-white/70">
                      {(store.profiles as any)?.full_name ?? (store.profiles as any)?.email ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        store.is_active
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {store.is_active ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white/50">
                      {new Date(store.created_at).toLocaleDateString('es-CO', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <ToggleStoreButton storeId={store.id} isActive={store.is_active} />
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
