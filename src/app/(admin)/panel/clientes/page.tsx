import { getAdminClients } from '@/features/admin/actions'
import { toggleClientActive } from '@/features/admin/actions'
import { revalidatePath } from 'next/cache'

export const metadata = { title: 'Clientes — Panel Admin' }

export default async function ClientesPage() {
  const { clients, total } = await getAdminClients(1, 100)
  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Clientes</h1>
        <p className="text-white/40 text-sm mt-0.5">{total} compradores registrados</p>
      </div>
      <div className="rounded-xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Nombre</th>
                <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Email</th>
                <th className="px-4 py-3 text-left text-xs text-white/50 font-medium hidden md:table-cell">Teléfono</th>
                <th className="px-4 py-3 text-left text-xs text-white/50 font-medium hidden md:table-cell">Registro</th>
                <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Estado</th>
                <th className="px-4 py-3 text-right text-xs text-white/50 font-medium">Acción</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c: any) => (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-white/80 font-medium">{c.full_name ?? '—'}</td>
                  <td className="px-4 py-3 text-white/60 text-xs">{c.email}</td>
                  <td className="px-4 py-3 text-white/50 text-xs hidden md:table-cell">{c.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-white/40 text-xs hidden md:table-cell">
                    {new Date(c.created_at).toLocaleDateString('es-CO')}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ background: c.is_active !== false ? 'rgba(74,222,128,0.15)' : 'rgba(239,68,68,0.15)', color: c.is_active !== false ? '#4ade80' : '#ef4444' }}>
                      {c.is_active !== false ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={async () => {
                      'use server'
                      await toggleClientActive(c.id, c.is_active === false)
                      revalidatePath('/panel/clientes')
                    }}>
                      <button type="submit" className="text-xs text-violet-400 hover:text-violet-300">
                        {c.is_active !== false ? 'Desactivar' : 'Activar'}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {clients.length === 0 && (
            <div className="py-12 text-center text-white/30 text-sm">Sin clientes registrados aún</div>
          )}
        </div>
      </div>
    </div>
  )
}
