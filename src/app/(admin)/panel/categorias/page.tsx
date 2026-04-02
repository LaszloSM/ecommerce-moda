import { getCategories, createCategory, deleteCategory } from '@/features/admin/actions'
import { revalidatePath } from 'next/cache'
import { Trash2, Tag } from 'lucide-react'

export const metadata = { title: 'Categorías — Panel Admin' }

export default async function CategoriasPage() {
  const categories = await getCategories()
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Categorías</h1>
        <p className="text-white/40 text-sm mt-0.5">{categories.length} categorías</p>
      </div>

      <div className="rounded-xl p-4 border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <h2 className="text-sm font-semibold text-white/60 mb-3">Nueva categoría</h2>
        <form action={async (formData: FormData) => {
          'use server'
          await createCategory(formData)
          revalidatePath('/panel/categorias')
        }} className="flex gap-3 flex-wrap">
          <input name="name" required placeholder="Ej: Mujer, Hombre, Accesorios..."
            className="flex-1 min-w-[140px] bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm placeholder:text-white/30 focus:border-violet-500 focus:outline-none" />
          <input name="icon" placeholder="Emoji (ej: 👗)"
            className="w-32 bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm placeholder:text-white/30 focus:border-violet-500 focus:outline-none" />
          <button type="submit" className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors">
            Crear
          </button>
        </form>
      </div>

      <div className="rounded-xl overflow-hidden border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Nombre</th>
              <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Slug</th>
              <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Icono</th>
              <th className="px-4 py-3 text-right text-xs text-white/50 font-medium">Acción</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c: any) => (
              <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-white/80 font-medium">{c.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-white/40">{c.slug}</td>
                <td className="px-4 py-3 text-lg">{c.icon ?? '—'}</td>
                <td className="px-4 py-3 text-right">
                  <form action={async () => {
                    'use server'
                    await deleteCategory(c.id)
                    revalidatePath('/panel/categorias')
                  }}>
                    <button type="submit" className="p-1.5 text-red-400/50 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {categories.length === 0 && (
          <div className="py-12 text-center">
            <Tag className="h-8 w-8 mx-auto mb-2 text-white/20" />
            <p className="text-white/30 text-sm">Sin categorías. Crea la primera.</p>
          </div>
        )}
      </div>
    </div>
  )
}
