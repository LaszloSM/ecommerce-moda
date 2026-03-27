import { Store } from 'lucide-react'
import { getSellerStore } from '@/features/dashboard/actions'
import { StoreForm } from './StoreForm'

export default async function TiendaPage() {
  const store = await getSellerStore()

  if (!store) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Store className="w-12 h-12 text-violet-400/50 mx-auto" />
          <p className="text-white/50">No tienes una tienda activa todavía.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1
          className="text-3xl font-bold text-white"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Mi Tienda
        </h1>
        <p className="text-white/50 mt-1">Configura la información de tu tienda</p>
      </div>

      <StoreForm
        storeId={store.id}
        initialName={store.name}
        initialDescription={store.description ?? ''}
        initialLogoUrl={store.logo_url ?? null}
        initialBannerUrl={store.banner_url ?? null}
      />
    </div>
  )
}
