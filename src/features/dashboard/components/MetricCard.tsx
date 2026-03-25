import * as React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: React.ReactNode
  sparklineData?: number[]
}

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (data.length < 2) return null
  const w = 120
  const h = 40
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w
      const y = h - ((v - min) / range) * h
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className={positive ? 'text-emerald-400/70' : 'text-red-400/70'}
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function MetricCard({
  title,
  value,
  change,
  changeLabel = 'vs mes anterior',
  icon,
  sparklineData = [],
}: MetricCardProps) {
  const isPositive = (change ?? 0) >= 0

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-violet-500/20 p-6',
        'bg-white/5 backdrop-blur-xl',
        'shadow-[0_8px_32px_0_rgba(124,58,237,0.12)]',
      )}
    >
      {/* Glassmorphism sheen */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none rounded-2xl" />

      <div className="relative flex items-start justify-between mb-4">
        <p className="text-sm font-medium text-violet-200/70">{title}</p>
        {icon && (
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-500/20 border border-violet-400/25 text-violet-300">
            {icon}
          </div>
        )}
      </div>

      <div className="relative mb-3">
        <p className="text-4xl font-bold text-white tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
          {value}
        </p>
      </div>

      {change !== undefined && (
        <div className="relative flex items-center gap-2 mb-4">
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border',
              isPositive
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25'
                : 'bg-red-500/15 text-red-300 border-red-500/25',
            )}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {Math.abs(change)}%
          </span>
          <span className="text-xs text-violet-300/50">{changeLabel}</span>
        </div>
      )}

      {sparklineData.length >= 2 && (
        <div className="relative flex justify-end">
          <Sparkline data={sparklineData} positive={isPositive} />
        </div>
      )}
    </div>
  )
}

export default MetricCard
