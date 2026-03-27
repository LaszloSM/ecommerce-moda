'use client'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface Props {
  data: Array<{ date: string; revenue: number }>
}

export function SalesChart({ data }: Props) {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="date"
            stroke="rgba(255,255,255,0.4)"
            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
          />
          <YAxis
            stroke="rgba(255,255,255,0.4)"
            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
            tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15, 12, 41, 0.95)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px',
              color: '#fff',
            }}
            formatter={(value) => [
              `$${Number(value ?? 0).toLocaleString('es-CO')}`,
              'Ingresos',
            ]}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#7c3aed"
            strokeWidth={2}
            fill="url(#revenueGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
