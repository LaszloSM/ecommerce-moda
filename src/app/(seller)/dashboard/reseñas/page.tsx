import { getSellerStore } from '@/features/dashboard/actions'
import { getStoreReviews } from '@/features/reviews/actions'
import { VendorReplyForm } from '@/features/reviews/components/VendorReplyForm'
import { RatingStars } from '@/components/ui/rating-stars'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { redirect } from 'next/navigation'

export default async function ReseñasPage() {
  const store = await getSellerStore()
  if (!store) redirect('/dashboard')

  const reviews = await getStoreReviews(store.id)

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-3xl font-bold text-white"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Reseñas
        </h1>
        <p className="text-white/50 mt-1">{reviews.length} reseña{reviews.length !== 1 ? 's' : ''} recibida{reviews.length !== 1 ? 's' : ''}</p>
      </div>

      {reviews.length === 0 ? (
        <div className="glass-card p-10 rounded-2xl text-center">
          <p className="text-white/50">Aún no tienes reseñas.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review: any) => (
            <div key={review.id} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
              <div className="flex items-start gap-3">
                <Avatar className="w-9 h-9 shrink-0">
                  <AvatarImage src={review.profiles?.avatar_url} />
                  <AvatarFallback className="bg-[#7c3aed] text-white text-xs">
                    {review.profiles?.full_name?.[0]?.toUpperCase() ?? 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-white font-medium text-sm">
                      {review.profiles?.full_name ?? 'Usuario'}
                    </span>
                    <span className="text-white/40 text-xs">
                      {new Date(review.created_at).toLocaleDateString('es-CO', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Product name */}
                  {review.products?.name && (
                    <p className="text-violet-400 text-xs mt-0.5">
                      Producto: {review.products.name}
                    </p>
                  )}

                  <div className="mt-1">
                    <RatingStars value={review.rating} readonly size="sm" />
                  </div>

                  {review.title && (
                    <p className="text-white font-semibold mt-2 text-sm">{review.title}</p>
                  )}
                  <p className="text-white/70 text-sm mt-1">{review.body}</p>

                  {/* Vendor reply preview */}
                  {review.vendor_reply ? (
                    <div className="mt-3 bg-white/5 rounded-lg p-3 border-l-2 border-[#7c3aed]">
                      <p className="text-[#e879f9] text-xs font-semibold mb-1">Tu respuesta</p>
                      <p className="text-white/70 text-sm">{review.vendor_reply}</p>
                    </div>
                  ) : (
                    <VendorReplyForm reviewId={review.id} />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
