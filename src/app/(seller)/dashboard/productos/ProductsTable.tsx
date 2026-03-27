'use client'

import * as React from 'react'
import Image from 'next/image'
import { Eye, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable, type ColumnDef } from '@/features/dashboard/components/DataTable'
import { updateProductStatus, deleteProduct } from '@/features/dashboard/product-actions'
import { formatCOP } from '@/lib/utils/currency'
import { cn } from '@/lib/utils'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  stock: number
  is_active: boolean
  images: string[]
  created_at: string
  categories: { name: string } | null
}

interface Props {
  products: Product[]
}

export function ProductsTable({ products }: Props) {
  const [data, setData] = React.useState<Product[]>(products)
  const [loading, setLoading] = React.useState<string | null>(null)

  const handleToggleStatus = async (product: Product) => {
    setLoading(product.id)
    const result = await updateProductStatus(product.id, !product.is_active)
    if (!result.error) {
      setData(prev =>
        prev.map(p => (p.id === product.id ? { ...p, is_active: !p.is_active } : p)),
      )
    }
    setLoading(null)
  }

  const handleDelete = async (product: Product) => {
    if (!confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`)) return
    setLoading(product.id)
    const result = await deleteProduct(product.id)
    if (!result.error) {
      setData(prev => prev.filter(p => p.id !== product.id))
    }
    setLoading(null)
  }

  const columns: ColumnDef<Product>[] = [
    {
      key: 'images',
      header: 'Imagen',
      render: (_, row) => (
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/10 border border-white/10 shrink-0">
          {row.images?.[0] ? (
            <Image
              src={row.images[0]}
              alt={row.name}
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">?</div>
          )}
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Nombre',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-white/90">{String(value)}</span>
      ),
    },
    {
      key: 'categories',
      header: 'Categoría',
      render: (value) => {
        const cat = value as { name: string } | null
        return (
          <span className="text-white/60">{cat?.name ?? '—'}</span>
        )
      },
    },
    {
      key: 'price',
      header: 'Precio',
      sortable: true,
      render: (value) => (
        <span className="text-white/80">{formatCOP(value as number)}</span>
      ),
    },
    {
      key: 'stock',
      header: 'Stock',
      sortable: true,
      render: (value) => {
        const n = value as number
        return (
          <span className={cn('font-medium', n <= 5 ? 'text-red-400' : 'text-white/80')}>
            {n}
          </span>
        )
      },
    },
    {
      key: 'is_active',
      header: 'Estado',
      render: (value) =>
        value ? (
          <Badge variant="outline" className="bg-green-500/15 text-green-300 border-green-500/25">
            Activo
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-gray-500/15 text-gray-400 border-gray-500/25">
            Inactivo
          </Badge>
        ),
    },
    {
      key: 'id',
      header: 'Acciones',
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          <Link href={`/producto/${row.slug}`} target="_blank">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/50 hover:text-white hover:bg-white/10"
              title="Ver producto"
            >
              <Eye className="w-3.5 h-3.5" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white/50 hover:text-white hover:bg-white/10"
            title={row.is_active ? 'Desactivar' : 'Activar'}
            onClick={() => handleToggleStatus(row)}
            disabled={loading === row.id}
          >
            {row.is_active ? (
              <ToggleRight className="w-3.5 h-3.5 text-green-400" />
            ) : (
              <ToggleLeft className="w-3.5 h-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-red-400/60 hover:text-red-400 hover:bg-red-400/10"
            title="Eliminar"
            onClick={() => handleDelete(row)}
            disabled={loading === row.id}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  return <DataTable columns={columns as any} data={data as any} pageSize={10} />
}
