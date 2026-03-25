'use client'

import * as React from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RatingStarsProps {
  value: number
  onChange?: (v: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap: Record<NonNullable<RatingStarsProps['size']>, string> = {
  sm: 'w-3.5 h-3.5',
  md: 'w-5 h-5',
  lg: 'w-7 h-7',
}

export function RatingStars({
  value,
  onChange,
  readonly = false,
  size = 'md',
}: RatingStarsProps) {
  const [hovered, setHovered] = React.useState(0)

  const display = hovered || value
  const iconClass = sizeMap[size]
  const isInteractive = !readonly && !!onChange

  const handleKeyDown = (e: React.KeyboardEvent, star: number) => {
    if (!isInteractive) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onChange?.(star)
    } else if (e.key === 'ArrowRight' && star < 5) {
      ;(document.querySelector(`[data-star="${star + 1}"]`) as HTMLElement)?.focus()
    } else if (e.key === 'ArrowLeft' && star > 1) {
      ;(document.querySelector(`[data-star="${star - 1}"]`) as HTMLElement)?.focus()
    }
  }

  return (
    <div
      role={isInteractive ? 'radiogroup' : undefined}
      aria-label={`Calificación: ${value} de 5 estrellas`}
      className="flex items-center gap-0.5"
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= display
        return (
          <button
            key={star}
            type="button"
            data-star={star}
            role={isInteractive ? 'radio' : undefined}
            aria-checked={isInteractive ? star === value : undefined}
            aria-label={`${star} estrella${star !== 1 ? 's' : ''}`}
            disabled={!isInteractive}
            tabIndex={
              isInteractive
                ? value === 0 && star === 1
                  ? 0
                  : star === value
                  ? 0
                  : -1
                : -1
            }
            onClick={() => isInteractive && onChange?.(star)}
            onMouseEnter={() => isInteractive && setHovered(star)}
            onMouseLeave={() => isInteractive && setHovered(0)}
            onKeyDown={(e) => handleKeyDown(e, star)}
            className={cn(
              'transition-transform duration-100',
              isInteractive && 'cursor-pointer hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 rounded-sm',
              !isInteractive && 'cursor-default',
            )}
          >
            <Star
              className={cn(
                iconClass,
                'transition-colors duration-100',
                filled ? 'fill-[#f59e0b] text-[#f59e0b]' : 'fill-transparent text-white/20',
              )}
            />
          </button>
        )
      })}
    </div>
  )
}

export default RatingStars
