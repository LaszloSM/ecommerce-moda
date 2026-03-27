'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RatingStars } from '@/components/ui/rating-stars'
import { createReview } from '../actions'
import { toast } from 'sonner'

const reviewSchema = z.object({
  rating: z.number().min(1, 'Selecciona una calificación').max(5),
  title: z.string().min(3, 'El título es requerido').max(100),
  body: z.string().min(10, 'Escribe al menos 10 caracteres').max(1000),
})

type ReviewFormValues = z.infer<typeof reviewSchema>

interface Props {
  productId: string
  orderId: string
  onSuccess?: () => void
}

export function ReviewForm({ productId, orderId, onSuccess }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, title: '', body: '' }
  })

  const rating = watch('rating')

  const onSubmit = async (values: ReviewFormValues) => {
    setSubmitting(true)
    const result = await createReview({ productId, orderId, ...values })
    setSubmitting(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('¡Reseña publicada!')
      onSuccess?.()
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label>Calificación</Label>
        <RatingStars
          value={rating}
          onChange={(val) => setValue('rating', val)}
          size="lg"
        />
        {errors.rating && <p className="text-red-400 text-sm mt-1">{errors.rating.message}</p>}
      </div>
      <div>
        <Label htmlFor="title">Título</Label>
        <Input id="title" {...register('title')} placeholder="Resumen de tu experiencia" className="mt-1 bg-white/5 border-white/20 text-white" />
        {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>}
      </div>
      <div>
        <Label htmlFor="body">Reseña</Label>
        <Textarea id="body" {...register('body')} placeholder="Comparte tu experiencia con este producto..." rows={4} className="mt-1 bg-white/5 border-white/20 text-white" />
        {errors.body && <p className="text-red-400 text-sm mt-1">{errors.body.message}</p>}
      </div>
      <Button type="submit" disabled={submitting} className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white">
        {submitting ? 'Publicando...' : 'Publicar reseña'}
      </Button>
    </form>
  )
}
