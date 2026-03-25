'use client'

import * as React from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, ZoomIn, X } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ProductGalleryProps {
  images: string[]
  productName: string
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [current, setCurrent] = React.useState(0)
  const [lightboxOpen, setLightboxOpen] = React.useState(false)
  const [isZoomed, setIsZoomed] = React.useState(false)
  const [mousePos, setMousePos] = React.useState({ x: 50, y: 50 })
  const mainRef = React.useRef<HTMLDivElement>(null)

  const total = images.length

  const prev = React.useCallback(
    () => setCurrent((c) => (c === 0 ? total - 1 : c - 1)),
    [total],
  )
  const next = React.useCallback(
    () => setCurrent((c) => (c === total - 1 ? 0 : c + 1)),
    [total],
  )

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'Escape') setLightboxOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [prev, next])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mainRef.current) return
    const rect = mainRef.current.getBoundingClientRect()
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }

  if (total === 0) return null

  const thumbnails = images.slice(0, 6)

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div
        ref={mainRef}
        className="relative aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/10 group cursor-zoom-in"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
        onClick={() => setLightboxOpen(true)}
      >
        <Image
          src={images[current]}
          alt={`${productName} — imagen ${current + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, 600px"
          className="object-cover transition-transform duration-200"
          style={{
            transform: isZoomed ? 'scale(2)' : 'scale(1)',
            transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
          }}
          priority
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

        {/* Zoom hint */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-black/50 backdrop-blur-sm p-1.5 rounded-full">
            <ZoomIn className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Prev / Next */}
        {total > 1 && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); prev() }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); next() }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </>
        )}

        {/* Counter */}
        {total > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-xs text-white/80">
            {current + 1} / {total}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {total > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {thumbnails.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              className={cn(
                'relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-150',
                i === current
                  ? 'border-violet-500 ring-2 ring-violet-500/30'
                  : 'border-white/10 hover:border-violet-400/50',
              )}
            >
              <Image
                src={src}
                alt={`${productName} — miniatura ${i + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
              {i === current && (
                <div className="absolute inset-0 bg-violet-500/15" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-5xl w-full p-0 bg-black/95 border-white/10 overflow-hidden">
          <div className="relative w-full h-[80vh] flex items-center justify-center">
            <Image
              src={images[current]}
              alt={`${productName} — imagen ${current + 1}`}
              fill
              sizes="(max-width: 1280px) 100vw, 1024px"
              className="object-contain"
            />

            {total > 1 && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={prev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 text-white"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={next}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 text-white"
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>

                {/* Dot nav */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCurrent(i)}
                      className={cn(
                        'rounded-full transition-all',
                        i === current
                          ? 'w-6 h-2 bg-white'
                          : 'w-2 h-2 bg-white/40 hover:bg-white/60',
                      )}
                    />
                  ))}
                </div>
              </>
            )}

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setLightboxOpen(false)}
              className="absolute top-3 right-3 w-9 h-9 bg-white/10 hover:bg-white/20 text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ProductGallery
