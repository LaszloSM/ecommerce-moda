'use client'

import * as React from 'react'
import { Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface CouponResult {
  valid: boolean
  discount?: number
  message?: string
}

interface CouponInputProps {
  onApply: (code: string) => Promise<CouponResult>
  appliedCode?: string
  onRemove?: () => void
}

export function CouponInput({ onApply, appliedCode, onRemove }: CouponInputProps) {
  const [code, setCode] = React.useState(appliedCode ?? '')
  const [isLoading, setIsLoading] = React.useState(false)
  const [result, setResult] = React.useState<CouponResult | null>(
    appliedCode ? { valid: true } : null,
  )
  const isApplied = !!appliedCode || (result?.valid === true)

  const handleApply = async () => {
    if (!code.trim()) return
    setIsLoading(true)
    setResult(null)
    try {
      const res = await onApply(code.trim())
      setResult(res)
    } catch {
      setResult({ valid: false, message: 'Error al validar el cupón.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = () => {
    setCode('')
    setResult(null)
    onRemove?.()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isApplied) handleApply()
  }

  return (
    <div
      className={cn(
        'relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 space-y-3',
        'shadow-[0_4px_24px_0_rgba(124,58,237,0.12)]',
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-fuchsia-500/5 rounded-2xl pointer-events-none" />

      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            value={code}
            onChange={(e) => !isApplied && setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Código de cupón"
            disabled={isApplied || isLoading}
            className={cn(
              'h-11 bg-white/5 border-white/15 text-white placeholder:text-white/30 pr-10',
              'focus-visible:border-violet-500/50 focus-visible:ring-violet-500/20',
              result?.valid === true && 'border-green-500/40',
              result?.valid === false && 'border-red-500/40',
            )}
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-violet-400" />
          )}
          {!isLoading && result?.valid === true && (
            <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400" />
          )}
          {!isLoading && result?.valid === false && (
            <X className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
          )}
        </div>

        {isApplied ? (
          <Button
            type="button"
            variant="outline"
            onClick={handleRemove}
            className="h-11 border-white/15 bg-white/5 hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-400 text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleApply}
            disabled={isLoading || !code.trim()}
            className="h-11 bg-violet-600 hover:bg-violet-500 text-white border-violet-400/30 font-semibold"
          >
            {isLoading ? 'Validando…' : 'Aplicar'}
          </Button>
        )}
      </div>

      {/* Feedback message */}
      {result && result.message && (
        <div
          className={cn(
            'relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm border',
            result.valid
              ? 'bg-green-500/10 border-green-500/25 text-green-300'
              : 'bg-red-500/10 border-red-500/25 text-red-300',
          )}
        >
          {result.valid ? (
            <Check className="w-4 h-4 flex-shrink-0" />
          ) : (
            <X className="w-4 h-4 flex-shrink-0" />
          )}
          <span className="flex-1">{result.message}</span>
          {result.valid && result.discount && (
            <span className="font-bold text-lg">-{result.discount}%</span>
          )}
        </div>
      )}

      {/* Applied state summary */}
      {isApplied && result?.valid && result.discount && (
        <div className="relative flex items-center justify-between px-3 py-2.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-violet-400" />
            <div>
              <p className="text-xs text-white font-medium">Cupón aplicado</p>
              <p className="text-xs text-white/40 font-mono">{code.toUpperCase()}</p>
            </div>
          </div>
          <span className="text-xl font-bold text-violet-400">-{result.discount}%</span>
        </div>
      )}
    </div>
  )
}

export default CouponInput
