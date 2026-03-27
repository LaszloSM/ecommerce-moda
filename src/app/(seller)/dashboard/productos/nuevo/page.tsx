'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ImageUploader } from '@/features/dashboard/components/ImageUploader'
import { createProduct } from '@/features/dashboard/product-actions'
import type { Tables } from '@/lib/types/database'

const schema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  category_id: z.string().optional(),
  price: z.number().positive('El precio debe ser positivo'),
  compare_price: z.number().positive('El precio anterior debe ser positivo').optional().or(z.literal('')),
  stock: z.number().int().min(0, 'El stock no puede ser negativo'),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export default function NuevoProductoPage() {
  const router = useRouter()
  const [images, setImages] = React.useState<string[]>([])
  const [categories, setCategories] = React.useState<Tables<'categories'>[]>([])
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then((data: Tables<'categories'>[]) => setCategories(data))
      .catch(() => setCategories([]))
  }, [])

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { stock: 0 },
  })

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('name', values.name)
      fd.append('price', String(values.price))
      fd.append('stock', String(values.stock))
      if (values.description) fd.append('description', values.description)
      if (values.category_id) fd.append('category_id', values.category_id)
      if (values.compare_price) fd.append('compare_price', String(values.compare_price))
      fd.append('images', JSON.stringify(images))

      const result = await createProduct(fd)

      if ('error' in result && result.error) {
        toast.error(result.error)
        return
      }

      toast.success('Producto creado correctamente')
      router.push('/dashboard/productos')
    } catch {
      toast.error('Error inesperado al crear el producto')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/productos">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-white/60 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1
            className="text-2xl font-bold text-white"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Nuevo producto
          </h1>
          <p className="text-white/50 text-sm mt-0.5">Completa los datos del producto</p>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 space-y-5"
      >
        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-white/70">
            Nombre <span className="text-red-400">*</span>
          </Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Ej. Vestido floral verano"
            className="bg-white/5 border-white/15 text-white placeholder:text-white/30 focus-visible:border-violet-500/60"
          />
          {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <Label className="text-white/70">Categoría</Label>
          <Select onValueChange={(v) => { if (v) setValue('category_id', String(v)) }}>
            <SelectTrigger className="bg-white/5 border-white/15 text-white focus:border-violet-500/60">
              <SelectValue placeholder="Selecciona una categoría" />
            </SelectTrigger>
            <SelectContent className="bg-[#0f0c29] border-white/15">
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id} className="text-white hover:bg-white/10">
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Price + Compare price */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="price" className="text-white/70">
              Precio (COP) <span className="text-red-400">*</span>
            </Label>
            <Input
              id="price"
              type="number"
              step="100"
              {...register('price', { valueAsNumber: true })}
              placeholder="150000"
              className="bg-white/5 border-white/15 text-white placeholder:text-white/30 focus-visible:border-violet-500/60"
            />
            {errors.price && <p className="text-xs text-red-400">{errors.price.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="compare_price" className="text-white/70">
              Precio anterior (opcional)
            </Label>
            <Input
              id="compare_price"
              type="number"
              step="100"
              {...register('compare_price', { valueAsNumber: true })}
              placeholder="200000"
              className="bg-white/5 border-white/15 text-white placeholder:text-white/30 focus-visible:border-violet-500/60"
            />
          </div>
        </div>

        {/* Stock */}
        <div className="space-y-1.5">
          <Label htmlFor="stock" className="text-white/70">
            Stock <span className="text-red-400">*</span>
          </Label>
          <Input
            id="stock"
            type="number"
            {...register('stock', { valueAsNumber: true })}
            placeholder="10"
            className="bg-white/5 border-white/15 text-white placeholder:text-white/30 focus-visible:border-violet-500/60"
          />
          {errors.stock && <p className="text-xs text-red-400">{errors.stock.message}</p>}
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
            placeholder="Describe tu producto..."
            className="bg-white/5 border-white/15 text-white placeholder:text-white/30 focus-visible:border-violet-500/60 resize-none"
          />
        </div>

        {/* Images */}
        <div className="space-y-1.5">
          <Label className="text-white/70">Imágenes</Label>
          <ImageUploader
            value={images}
            onChange={setImages}
            maxFiles={6}
            bucket="products"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <Link href="/dashboard/productos" className="flex-1">
            <Button
              type="button"
              variant="ghost"
              className="w-full border border-white/15 text-white/60 hover:text-white hover:bg-white/10"
            >
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-violet-600 hover:bg-violet-500 text-white shadow-[0_4px_14px_0_rgba(124,58,237,0.4)]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              'Crear producto'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
