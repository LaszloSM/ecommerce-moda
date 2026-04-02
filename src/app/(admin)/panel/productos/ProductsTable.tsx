'use client'
import { useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { updateProductStatus, deleteProduct } from '@/features/admin/actions'
import { formatCOP } from '@/lib/utils/currency'
import { Button } from '@/components/ui/button'
import { Edit2, Trash2, Eye, EyeOff, Plus, Package } from 'lucide-react'
import { toast } from 'sonner'

interface Product {
  id: string; name: string; price: number; stock: number
  is_active: boolean; is_featured: boolean; images: string[]
  categories: { name: string } | null; created_at: string
}

export function ProductsTable({ products }: { products: Product[] }) {
  const [list, setList] = useState(products)
  const [pending, startTransition] = useTransition()

  const handleToggle = (id: string, current: boolean) => {
    startTransition(async () => {
      const res = await updateProductStatus(id, !current)
      if (res.error) { toast.error(res.error); return }
      setList(l => l.map(p => p.id === id ? { ...p, is_active: !current } : p))
      toast.success(!current ? 'Producto activado' : 'Producto desactivado')
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) return
    startTransition(async () => {
      const res = await deleteProduct(id)
      if (res.error) { toast.error(res.error); return }
      setList(l => l.filter(p => p.id !== id))
      toast.success('Producto eliminado')
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-white/50 text-sm">{list.length} productos</p>
        <Link href="/panel/productos/nuevo">
          <Button size="sm" className="gap-2 bg-violet-600 hover:bg-violet-500 text-white border-0">
            <Plus className="h-4 w-4" /> Nuevo producto
          </Button>
        </Link>
      </div>
      <div className="rounded-xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Producto</th>
                <th className="px-4 py-3 text-left text-xs text-white/50 font-medium hidden md:table-cell">Categoría</th>
                <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Precio</th>
                <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Stock</th>
                <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Estado</th>
                <th className="px-4 py-3 text-right text-xs text-white/50 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list.map((product) => (
                <tr key={product.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.images?.[0] ? (
                        <Image src={product.images[0]} alt={product.name} width={40} height={40}
                          className="rounded-lg object-cover flex-shrink-0 w-10 h-10" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                          <Package className="w-4 h-4 text-white/20" />
                        </div>
                      )}
                      <span className="text-white/80 font-medium truncate max-w-[160px]">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white/50 hidden md:table-cell">{product.categories?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-violet-300 font-semibold">{formatCOP(product.price)}</td>
                  <td className="px-4 py-3">
                    <span className={product.stock === 0 ? 'text-red-400 font-semibold' : product.stock <= 5 ? 'text-yellow-400' : 'text-white/70'}>
                      {product.stock === 0 ? 'Agotado' : `${product.stock} uds`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{ background: product.is_active ? 'rgba(74,222,128,0.15)' : 'rgba(239,68,68,0.15)', color: product.is_active ? '#4ade80' : '#ef4444' }}>
                      {product.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/panel/productos/${product.id}`}>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-white/40 hover:text-white hover:bg-white/10">
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon"
                        className="h-7 w-7 text-white/40 hover:text-white hover:bg-white/10"
                        onClick={() => handleToggle(product.id, product.is_active)} disabled={pending}>
                        {product.is_active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                      <Button variant="ghost" size="icon"
                        className="h-7 w-7 text-red-400/60 hover:text-red-400 hover:bg-red-400/10"
                        onClick={() => handleDelete(product.id)} disabled={pending}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && (
            <div className="py-16 text-center text-white/30">
              <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Sin productos. Crea el primero.</p>
              <Link href="/panel/productos/nuevo" className="mt-3 inline-block text-xs text-violet-400 hover:text-violet-300">
                + Crear producto
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
