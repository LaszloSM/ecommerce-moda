import { getProductReviews } from '../actions'
import { RatingStars } from '@/components/ui/rating-stars'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  productId: string
}

export async function ReviewList({ productId }: Props) {
  const reviews = await getProductReviews(productId)

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-white/50">
        <p>Aún no hay reseñas para este producto.</p>
      </div>
    )
  }

  // Rating distribution
  const distribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter((r: any) => r.rating === star).length,
    pct: (reviews.filter((r: any) => r.rating === star).length / reviews.length) * 100,
  }))
  const avgRating = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex gap-8 items-start glass-card p-6 rounded-xl">
        <div className="text-center">
          <div className="text-5xl font-bold text-white">{avgRating.toFixed(1)}</div>
          <RatingStars value={Math.round(avgRating)} readonly size="sm" />
          <div className="text-white/50 text-sm mt-1">{reviews.length} reseñas</div>
        </div>
        <div className="flex-1 space-y-2">
          {distribution.map(({ star, count, pct }) => (
            <div key={star} className="flex items-center gap-2 text-sm">
              <span className="text-white/60 w-4">{star}</span>
              <div className="flex-1 bg-white/10 rounded-full h-2">
                <div
                  className="bg-[#7c3aed] h-2 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-white/60 w-6 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Individual reviews */}
      <div className="space-y-4">
        {reviews.map((review: any) => (
          <div key={review.id} className="glass-card p-5 rounded-xl">
            <div className="flex items-start gap-3">
              <Avatar className="w-9 h-9">
                <AvatarImage src={review.profiles?.avatar_url} />
                <AvatarFallback className="bg-[#7c3aed] text-white text-xs">
                  {review.profiles?.full_name?.[0]?.toUpperCase() ?? 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium text-sm">{review.profiles?.full_name ?? 'Usuario'}</span>
                  <span className="text-white/40 text-xs">
                    {formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: es })}
                  </span>
                </div>
                <div className="mt-1">
                  <RatingStars value={review.rating} readonly size="sm" />
                </div>
                {review.title && <p className="text-white font-semibold mt-2 text-sm">{review.title}</p>}
                <p className="text-white/70 text-sm mt-1">{review.body}</p>
                {review.vendor_reply && (
                  <div className="mt-3 bg-white/5 rounded-lg p-3 border-l-2 border-[#7c3aed]">
                    <p className="text-[#e879f9] text-xs font-semibold mb-1">Respuesta de la tienda</p>
                    <p className="text-white/70 text-sm">{review.vendor_reply}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
