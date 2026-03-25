'use client'

import * as React from 'react'
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export interface ColumnDef<T> {
  key: keyof T
  header: string
  render?: (value: T[keyof T], row: T) => React.ReactNode
  sortable?: boolean
}

interface DataTableProps<T extends Record<string, unknown>> {
  columns: ColumnDef<T>[]
  data: T[]
  searchable?: boolean
  pageSize?: number
  loading?: boolean
}

type SortDir = 'asc' | 'desc' | null

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  searchable = true,
  pageSize = 10,
  loading = false,
}: DataTableProps<T>) {
  const [query, setQuery] = React.useState('')
  const [sortKey, setSortKey] = React.useState<keyof T | null>(null)
  const [sortDir, setSortDir] = React.useState<SortDir>(null)
  const [page, setPage] = React.useState(1)

  const filtered = React.useMemo(() => {
    if (!query) return data
    const q = query.toLowerCase()
    return data.filter((row) =>
      Object.values(row).some((v) => String(v).toLowerCase().includes(q)),
    )
  }, [data, query])

  const sorted = React.useMemo(() => {
    if (!sortKey || !sortDir) return filtered
    return [...filtered].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (av === bv) return 0
      const cmp = av < bv ? -1 : 1
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const start = (page - 1) * pageSize
  const paged = sorted.slice(start, start + pageSize)

  const handleSort = (col: ColumnDef<T>) => {
    if (!col.sortable) return
    setSortDir((prev) => {
      if (sortKey !== col.key) { setSortKey(col.key); return 'asc' }
      if (prev === 'asc') return 'desc'
      setSortKey(null)
      return null
    })
    if (sortKey !== col.key) setSortKey(col.key)
  }

  const SortIcon = ({ col }: { col: ColumnDef<T> }) => {
    if (!col.sortable) return null
    if (sortKey !== col.key) return <ChevronsUpDown className="w-3.5 h-3.5 opacity-40" />
    if (sortDir === 'asc') return <ChevronUp className="w-3.5 h-3.5 text-violet-300" />
    return <ChevronDown className="w-3.5 h-3.5 text-violet-300" />
  }

  const pages = React.useMemo(() => {
    const arr: (number | '...')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) arr.push(i)
    } else {
      arr.push(1)
      if (page > 3) arr.push('...')
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) arr.push(i)
      if (page < totalPages - 2) arr.push('...')
      arr.push(totalPages)
    }
    return arr
  }, [totalPages, page])

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
        {searchable && (
          <div className="p-4 border-b border-white/8">
            <Skeleton className="h-9 w-64 bg-white/10" />
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/8 bg-white/5">
                {columns.map((col) => (
                  <th key={String(col.key)} className="px-4 py-3 text-left">
                    <Skeleton className="h-4 w-20 bg-white/10" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: pageSize }).map((_, i) => (
                <tr key={i} className="border-b border-white/6">
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-4 py-3">
                      <Skeleton className="h-4 w-28 bg-white/8" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden shadow-[0_8px_32px_0_rgba(124,58,237,0.12)]">
      {searchable && (
        <div className="p-4 border-b border-white/8 bg-white/3">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1) }}
              placeholder="Buscar…"
              className="pl-9 h-9 bg-white/5 border-white/15 text-white placeholder:text-white/30 focus-visible:border-violet-500/50"
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  onClick={() => handleSort(col)}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-semibold text-violet-200/70 uppercase tracking-wide',
                    col.sortable && 'cursor-pointer select-none hover:text-white transition-colors',
                  )}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    <SortIcon col={col} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-white/40">
                  Sin datos
                </td>
              </tr>
            ) : (
              paged.map((row, ri) => (
                <tr key={ri} className="border-b border-white/6 hover:bg-white/5 transition-colors">
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-4 py-3 text-sm text-white/80">
                      {col.render
                        ? col.render(row[col.key], row)
                        : String(row[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/8 bg-white/3">
          <span className="text-xs text-white/40">
            Mostrando {start + 1}–{Math.min(start + pageSize, sorted.length)} de {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {pages.map((p, i) =>
              p === '...' ? (
                <span key={`e${i}`} className="px-1 text-white/30 text-sm">…</span>
              ) : (
                <Button
                  key={p}
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage(p)}
                  className={cn(
                    'h-7 min-w-7 text-sm',
                    page === p
                      ? 'bg-violet-600 text-white hover:bg-violet-500'
                      : 'text-white/60 hover:text-white hover:bg-white/10',
                  )}
                >
                  {p}
                </Button>
              ),
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataTable
