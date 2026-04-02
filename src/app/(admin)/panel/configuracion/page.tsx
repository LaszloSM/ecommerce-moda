import { getCompanyConfig, updateCompanyConfig } from '@/features/admin/actions'
import { revalidatePath } from 'next/cache'

export const metadata = { title: 'Configuración — Panel Admin' }

const FIELDS = [
  { name: 'name', label: 'Nombre de la tienda', placeholder: 'MODAVIDA' },
  { name: 'tagline', label: 'Eslogan', placeholder: 'Moda y Accesorios en Colombia' },
  { name: 'email', label: 'Email de contacto', placeholder: 'hola@modavida.co' },
  { name: 'phone', label: 'Teléfono', placeholder: '+57 300 000 0000' },
  { name: 'address', label: 'Dirección', placeholder: 'Calle 123 #45-67' },
  { name: 'city', label: 'Ciudad / País', placeholder: 'Bogotá, Colombia' },
  { name: 'nit', label: 'NIT', placeholder: '900.000.000-0' },
  { name: 'logo_url', label: 'URL del logo', placeholder: 'https://...' },
]

export default async function ConfiguracionPage() {
  const config = await getCompanyConfig()
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Configuración</h1>
        <p className="text-white/40 text-sm mt-0.5">Datos de la empresa visibles para los clientes</p>
      </div>
      <form
        action={async (formData: FormData) => {
          'use server'
          await updateCompanyConfig(formData)
          revalidatePath('/panel/configuracion')
        }}
        className="rounded-xl p-6 border border-white/10 space-y-4"
        style={{ background: 'rgba(255,255,255,0.03)' }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FIELDS.map(({ name, label, placeholder }) => (
            <div key={name} className="space-y-1.5">
              <label className="text-xs text-white/50 uppercase tracking-wide">{label}</label>
              <input
                name={name}
                defaultValue={config?.[name] ?? ''}
                placeholder={placeholder}
                className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm placeholder:text-white/20 focus:border-violet-500 focus:outline-none"
              />
            </div>
          ))}
        </div>
        <div className="pt-2">
          <button type="submit" className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-semibold transition-colors">
            Guardar cambios
          </button>
        </div>
      </form>

      <div className="rounded-xl p-4 border border-amber-500/20 text-sm text-amber-300/70"
        style={{ background: 'rgba(251,191,36,0.05)' }}>
        <p className="font-medium text-amber-300/90 mb-1">Métodos de envío</p>
        <p>Los métodos de envío se configuran directamente en la base de datos. Por defecto: Estándar ($8.000) y Express ($18.000).</p>
      </div>
    </div>
  )
}
