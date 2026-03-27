'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { payWithWompi } from '@/features/checkout/wompi-actions'
import { toast } from 'sonner'
import { CreditCard, Lock, Loader2 } from 'lucide-react'
import { WOMPI_BASE_URL, WOMPI_PUBLIC_KEY } from '@/lib/wompi/client'

interface Props {
  orderId: string
  amountCOP: number
  customerEmail: string
  onSuccess: (transactionId: string) => void
}

export function WompiCardForm({ orderId, amountCOP, customerEmail, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [cardHolder, setCardHolder] = useState('')
  const [installments, setInstallments] = useState('1')
  const [error, setError] = useState('')

  // Format card number with spaces
  const formatCardNumber = (v: string) =>
    v.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19)

  // Format MM/YY
  const formatExpiry = (v: string) => {
    const digits = v.replace(/\D/g, '')
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`
    return digits
  }

  const tokenizeCard = async (): Promise<string | null> => {
    const [expMonth, expYear] = expiry.split('/')
    const res = await fetch(`${WOMPI_BASE_URL}/tokens/cards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${WOMPI_PUBLIC_KEY}`,
      },
      body: JSON.stringify({
        number: cardNumber.replace(/\s/g, ''),
        exp_month: expMonth,
        exp_year: expYear,
        cvc: cvv,
        card_holder: cardHolder,
      }),
    })
    const json = await res.json()
    if (!res.ok || json.status !== 'CREATED') {
      setError('Tarjeta inválida. Verifica los datos e intenta de nuevo.')
      return null
    }
    return json.data.id
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!cardNumber || !expiry || !cvv || !cardHolder) {
      setError('Completa todos los campos de la tarjeta')
      return
    }

    setLoading(true)

    try {
      // 1. Tokenize card
      const cardToken = await tokenizeCard()
      if (!cardToken) { setLoading(false); return }

      // 2. Get acceptance token
      const acceptRes = await fetch(`/api/wompi/acceptance-token`)
      const { acceptanceToken } = await acceptRes.json()

      // 3. Process payment
      const result = await payWithWompi({
        orderId,
        amountCOP,
        customerEmail,
        cardToken,
        installments: parseInt(installments),
        acceptanceToken: acceptanceToken ?? '',
      })

      if (result.error) {
        setError(result.error)
      } else if (result.approved) {
        toast.success('¡Pago exitoso!')
        onSuccess(result.transactionId!)
      } else {
        setError('El pago no fue aprobado. Intenta con otra tarjeta.')
      }
    } catch {
      setError('Error inesperado. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 text-white/70 text-sm mb-4">
        <Lock className="w-4 h-4 text-[#7c3aed]" />
        <span>Pago seguro con cifrado SSL — Wompi</span>
      </div>

      <div>
        <Label htmlFor="cardHolder" className="text-white/80">Nombre en la tarjeta</Label>
        <Input
          id="cardHolder"
          value={cardHolder}
          onChange={e => setCardHolder(e.target.value.toUpperCase())}
          placeholder="JUAN GARCIA"
          className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30"
        />
      </div>

      <div>
        <Label htmlFor="cardNumber" className="text-white/80">Número de tarjeta</Label>
        <div className="relative mt-1">
          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            id="cardNumber"
            value={cardNumber}
            onChange={e => setCardNumber(formatCardNumber(e.target.value))}
            placeholder="1234 5678 9012 3456"
            maxLength={19}
            className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/30"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="expiry" className="text-white/80">Vencimiento</Label>
          <Input
            id="expiry"
            value={expiry}
            onChange={e => setExpiry(formatExpiry(e.target.value))}
            placeholder="MM/AA"
            maxLength={5}
            className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30"
          />
        </div>
        <div>
          <Label htmlFor="cvv" className="text-white/80">CVV</Label>
          <Input
            id="cvv"
            type="password"
            value={cvv}
            onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="•••"
            maxLength={4}
            className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30"
          />
        </div>
      </div>

      <div>
        <Label className="text-white/80">Cuotas</Label>
        <Select value={installments} onValueChange={(v) => { if (v) setInstallments(v) }}>
          <SelectTrigger className="mt-1 bg-white/5 border-white/20 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1040] border-white/20">
            {[1, 3, 6, 12, 24, 36].map(n => (
              <SelectItem key={n} value={String(n)} className="text-white hover:bg-white/10">
                {n === 1 ? '1 cuota (sin interés)' : `${n} cuotas`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="text-white/50 text-xs">
        Total a pagar: <span className="text-white font-semibold">${amountCOP.toLocaleString('es-CO')} COP</span>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold py-3"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Procesando pago...</>
        ) : (
          `Pagar $${amountCOP.toLocaleString('es-CO')} COP`
        )}
      </Button>

      <p className="text-white/30 text-xs text-center">
        Al pagar aceptas los términos y condiciones de Wompi y Modavida
      </p>
    </form>
  )
}
