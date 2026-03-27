import { getAllUsers } from '@/features/admin/actions'
import { ToggleUserButton } from '@/features/admin/components/ToggleUserButton'
import { ChangeRoleButton } from '@/features/admin/components/ChangeRoleButton'

export default async function UsuariosPage() {
  const users = await getAllUsers()

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-3xl font-bold text-white"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Usuarios
        </h1>
        <p className="text-white/50 mt-1">{users.length} usuario{users.length !== 1 ? 's' : ''} registrado{users.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/8 bg-white/3">
                {['Nombre', 'Email', 'Rol', 'Estado', 'Fecha', 'Acciones'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-violet-200/60 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-white/40">
                    No hay usuarios
                  </td>
                </tr>
              ) : (
                users.map((user: any) => (
                  <tr key={user.id} className="border-b border-white/6 hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3 text-sm text-white font-medium">
                      {user.full_name ?? 'Sin nombre'}
                    </td>
                    <td className="px-4 py-3 text-sm text-white/70">
                      {user.email ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-medium capitalize">
                        {user.role ?? 'buyer'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        user.is_active !== false
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {user.is_active !== false ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white/50">
                      {new Date(user.created_at).toLocaleDateString('es-CO', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ChangeRoleButton userId={user.id} currentRole={user.role ?? 'buyer'} />
                        <ToggleUserButton userId={user.id} isActive={user.is_active !== false} />
                      </div>
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
