'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ImageUploader } from '@/features/dashboard/components/ImageUploader'
import { updateStore } from '@/features/dashboard/product-actions'

const schema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  storeId: string
  initialName: string
  initialDescription: string
  initialLogoUrl: string | null
  initialBannerUrl: string | null
}

export function StoreForm({
  storeId,
  initialName,
  initialDescription,
  initialLogoUrl,
  initialBannerUrl,
}: Props) {
  const [logo, setLogo] = React.useState<string[]>(initialLogoUrl ? [initialLogoUrl] : [])
  const [banner, setBanner] = React.useState<string[]>(
    initialBannerUrl ? [initialBannerUrl] : [],
  )
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: initialName, description: initialDescription },
  })

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    try {
      const result = await updateStore(storeId, {
        name: values.name,
        description: values.description ?? null,
        logo_url: logo[0] ?? null,
        banner_url: banner[0] ?? null,
      })
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success('Tienda actualizada correctamente')
    } catch {
      toast.error('Error inesperado al guardar')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 space-y-5"
    >
      {/* Store name */}
      <div className="space-y-1.5">
        <Label htmlFor="name" className="text-white/70">
          Nombre de la tienda <span className="text-red-400">*</span>
        </Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="Mi tienda de moda"
          className="bg-white/5 border-white/15 text-white placeholder:text-white/30 focus-visible:border-violet-500/60"
        />
        {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description" className="text-white/70">
          Descripción
        </Label>
        <Textarea
          id="description"
          {...register('description')}
          rows={4}
          placeholder="Describe tu tienda..."
          className="bg-white/5 border-white/15 text-white placeholder:text-white/30 focus-visible:border-violet-500/60 resize-none"
        />
      </div>

      {/* Logo */}
      <div className="space-y-1.5">
        <Label className="text-white/70">Logo</Label>
        <ImageUploader value={logo} onChange={setLogo} maxFiles={1} bucket="stores" />
      </div>

      {/* Banner */}
      <div className="space-y-1.5">
        <Label className="text-white/70">Banner</Label>
        <ImageUploader value={banner} onChange={setBanner} maxFiles={1} bucket="stores" />
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-violet-600 hover:bg-violet-500 text-white shadow-[0_4px_14px_0_rgba(124,58,237,0.4)]"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Guardando...
          </>
        ) : (
          'Guardar cambios'
        )}
      </Button>
    </form>
  )
}
