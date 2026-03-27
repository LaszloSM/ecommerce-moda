export const WOMPI_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://production.wompi.co/v1'
  : 'https://sandbox.wompi.co/v1'

export const WOMPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY ?? ''
export const WOMPI_PRIVATE_KEY = process.env.WOMPI_PRIVATE_KEY ?? ''

export interface WompiTransaction {
  id: string
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR'
  reference: string
  amount_in_cents: number
  currency: string
  payment_method_type: string
  customer_email: string
  created_at: string
}

export async function createWompiTransaction(params: {
  amountInCents: number
  currency: string
  customerEmail: string
  reference: string
  paymentMethod: {
    type: 'CARD'
    token: string
    installments: number
  }
}): Promise<{ data: WompiTransaction; error?: string }> {
  const res = await fetch(`${WOMPI_BASE_URL}/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${WOMPI_PRIVATE_KEY}`,
    },
    body: JSON.stringify({
      amount_in_cents: params.amountInCents,
      currency: params.currency,
      customer_email: params.customerEmail,
      reference: params.reference,
      payment_method: params.paymentMethod,
    }),
  })
  const json = await res.json()
  if (!res.ok) return { data: null as any, error: json.error?.messages?.join(', ') ?? 'Error de pago' }
  return { data: json.data }
}

export async function getWompiTransaction(transactionId: string): Promise<WompiTransaction | null> {
  const res = await fetch(`${WOMPI_BASE_URL}/transactions/${transactionId}`, {
    headers: { Authorization: `Bearer ${WOMPI_PRIVATE_KEY}` },
    cache: 'no-store',
  })
  if (!res.ok) return null
  const json = await res.json()
  return json.data
}

// Get acceptance token (required before creating transaction)
export async function getWompiAcceptanceToken(): Promise<string | null> {
  const res = await fetch(`${WOMPI_BASE_URL}/merchants/${WOMPI_PUBLIC_KEY}`, { cache: 'no-store' })
  if (!res.ok) return null
  const json = await res.json()
  return json.data?.presigned_acceptance?.acceptance_token ?? null
}
