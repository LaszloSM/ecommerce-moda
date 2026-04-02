'use client'
import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { createProduct, updateProduct, getCategories } from '@/features/admin/actions'
import { ImageUploader } from '@/features/dashboard/components/ImageUploader'

interface Category { id: string; name: string }
interface ProductData {
  id?: string; name?: string; price?: number; stock?: number
  description?: string; category_id?: string; compare_price?: number | null
  brand?: string | null; sku?: string | null; images?: string[]
  is_featured?: boolean; is_active?: boolean
}

export function ProductForm({ categories, product }: { categories: Category[]; product?: ProductData }) {
  const [images, setImages] = useState<string[]>(product?.images ?? [])
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const isEdit = !!product?.id

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('images', JSON.stringify(images))

    startTransition(async () => {
      const res = isEdit
        ? await updateProduct(product!.id!, formData)
        : await createProduct(formData)

      if ('error' in res && res.error) { toast.error(res.error); return }
      toast.success(isEdit ? 'Producto actualizado' : 'Producto creado')
      router.push('/panel/productos')
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2 space-y-1.5">
          <Label className="text-white/70 text-xs uppercase tracking-wide">Nombre del producto *</Label>
          <Input name="name" defaultValue={product?.name} required
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-violet-500"
            placeholder="Ej: Camiseta Premium Algodón" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-white/70 text-xs uppercase tracking-wide">Precio (COP) *</Label>
          <Input name="price" type="number" step="100" min="0" defaultValue={product?.price} required
            className="bg-white/5 border-white/10 text-white focus:border-violet-500" placeholder="85000" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-white/70 text-xs uppercase tracking-wide">Precio anterior (COP)</Label>
          <Input name="compare_price" type="number" step="100" min="0" defaultValue={product?.compare_price ?? ''}
            className="bg-white/5 border-white/10 text-white focus:border-violet-500" placeholder="120000" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-white/70 text-xs uppercase tracking-wide">Stock *</Label>
          <Input name="stock" type="number" min="0" defaultValue={product?.stock ?? 0} required
            className="bg-white/5 border-white/10 text-white focus:border-violet-500" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-white/70 text-xs uppercase tracking-wide">Categoría</Label>
          <select name="category_id" defaultValue={product?.category_id ?? ''}
            className="w-full bg-white/5 border border-white/10 text-white rounded-md px-3 py-2 text-sm focus:border-violet-500 focus:outline-none">
            <option value="" style={{ background: '#1a1a2e' }}>Sin categoría</option>
            {categories.map(c => (
              <option key={c.id} value={c.id} style={{ background: '#1a1a2e' }}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-white/70 text-xs uppercase tracking-wide">Marca</Label>
          <Input name="brand" defaultValue={product?.brand ?? ''}
            className="bg-white/5 border-white/10 text-white focus:border-violet-500" placeholder="MODAVIDA" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-white/70 text-xs uppercase tracking-wide">SKU</Label>
          <Input name="sku" defaultValue={product?.sku ?? ''}
            className="bg-white/5 border-white/10 text-white focus:border-violet-500" placeholder="MOD-001" />
        </div>
        <div className="md:col-span-2 space-y-1.5">
          <Label className="text-white/70 text-xs uppercase tracking-wide">Descripción</Label>
          <Textarea name="description" defaultValue={product?.description ?? ''} rows={4}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none focus:border-violet-500"
            placeholder="Descripción detallada del producto..." />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-white/70 text-xs uppercase tracking-wide">Imágenes del producto</Label>
        <ImageUploader value={images} onChange={setImages} bucket="products" />
      </div>

      <div className="flex items-center gap-5 pt-1">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" name="is_featured" value="true"
            defaultChecked={product?.is_featured}
            className="w-4 h-4 accent-violet-600 rounded" />
          <span className="text-sm text-white/70">Destacado en home</span>
        </label>
        {isEdit && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="is_active" value="true"
              defaultChecked={product?.is_active !== false}
              className="w-4 h-4 accent-violet-600 rounded" />
            <span className="text-sm text-white/70">Activo (visible)</span>
          </label>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending}
          className="bg-violet-600 hover:bg-violet-500 text-white font-semibold border-0">
          {isPending ? 'Guardando...' : isEdit ? 'Actualizar producto' : 'Crear producto'}
        </Button>
        <Button type="button" variant="ghost" className="text-white/50 hover:text-white"
          onClick={() => router.push('/panel/productos')}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
