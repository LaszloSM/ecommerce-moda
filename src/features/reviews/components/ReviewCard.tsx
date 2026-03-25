'use client'

import * as React from 'react'
import { ThumbsUp, CheckCircle, Store } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RatingStars } from '@/components/ui/rating-stars'
import { cn } from '@/lib/utils'

interface VendorReply {
  message: string
  vendorName?: string
  repliedAt?: string
}

interface ReviewData {
  id: string
  rating: number
  title?: string
  body: string
  images?: string[]
  buyerName: string
  createdAt: string
  isVerified: boolean
  helpfulCount: number
  vendorReply?: VendorReply
}

interface ReviewCardProps {
  review: ReviewData
}

export function ReviewCard({ review }: ReviewCardProps) {
  const [helpful, setHelpful] = React.useState(review.helpfulCount)
  const [voted, setVoted] = React.useState(false)

  const initials = review.buyerName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(iso))

  return (
    <div
      className={cn(
        'relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 space-y-4',
        'shadow-[0_4px_24px_0_rgba(124,58,237,0.10)]',
      )}
    >
      {/* Sheen */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/4 via-transparent to-transparent pointer-events-none rounded-2xl" />

      {/* Header */}
      <div className="relative flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-white">{initials}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-white">{review.buyerName}</span>
            {review.isVerified && (
              <Badge
                variant="outline"
                className="text-xs bg-green-500/15 text-green-300 border-green-500/25 gap-1"
              >
                <CheckCircle className="w-3 h-3" />
                Compra Verificada
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <RatingStars value={review.rating} readonly size="sm" />
            <span className="text-xs text-white/40">{formatDate(review.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Title + Body */}
      <div className="relative space-y-1.5">
        {review.title && (
          <h4 className="text-sm font-semibold text-white">{review.title}</h4>
        )}
        <p className="text-sm text-white/70 leading-relaxed">{review.body}</p>
      </div>

      {/* Images */}
      {review.images && review.images.length > 0 && (
        <div className="relative flex flex-wrap gap-2">
          {review.images.map((src, i) => (
            <div
              key={i}
              className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10 bg-white/5 shrink-0 group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`Imagen de reseña ${i + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            </div>
          ))}
        </div>
      )}

      {/* Helpful */}
      <div className="relative flex items-center gap-2">
        <span className="text-xs text-white/40">¿Fue útil?</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={voted}
          onClick={() => { setHelpful((h) => h + 1); setVoted(true) }}
          className={cn(
            'h-7 text-xs border-white/15 bg-white/5',
            voted
              ? 'text-violet-300 border-violet-500/30 bg-violet-500/10'
              : 'text-white/60 hover:text-white hover:bg-white/10',
          )}
        >
          <ThumbsUp className={cn('w-3.5 h-3.5 mr-1', voted && 'fill-violet-400')} />
          Sí ({helpful})
        </Button>
      </div>

      {/* Vendor reply */}
      {review.vendorReply && (
        <div className="relative ml-4 pl-4 border-l-2 border-violet-500/25">
          <div className="rounded-xl bg-violet-500/8 border border-violet-500/15 p-3 space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center">
                <Store className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <span className="text-xs font-semibold text-violet-300">
                {review.vendorReply.vendorName ?? 'Vendedor'}
              </span>
              {review.vendorReply.repliedAt && (
                <span className="text-xs text-white/30">
                  {formatDate(review.vendorReply.repliedAt)}
                </span>
              )}
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              {review.vendorReply.message}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReviewCard
