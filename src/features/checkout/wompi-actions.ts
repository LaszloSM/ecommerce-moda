'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createWompiTransaction, getWompiAcceptanceToken } from '@/lib/wompi/client'

interface PayWithWompiInput {
  orderId: string
  amountCOP: number
  customerEmail: string
  cardToken: string
  installments: number
  acceptanceToken: string
}

export async function payWithWompi(input: PayWithWompiInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Reference must be unique per transaction
  const reference = `MODAVIDA-${input.orderId.slice(0, 8).toUpperCase()}-${Date.now()}`

  const { data: transaction, error } = await createWompiTransaction({
    amountInCents: Math.round(input.amountCOP * 100),
    currency: 'COP',
    customerEmail: input.customerEmail,
    reference,
    paymentMethod: {
      type: 'CARD',
      token: input.cardToken,
      installments: input.installments,
    },
  })

  if (error || !transaction) {
    return { error: error ?? 'Error procesando el pago' }
  }

  // Update order with transaction ID
  await (supabase as any)
    .from('orders')
    .update({
      wompi_transaction_id: transaction.id,
      status: transaction.status === 'APPROVED' ? 'confirmed' : 'pending',
    })
    .eq('id', input.orderId)

  revalidatePath('/cuenta/pedidos')
  return {
    transactionId: transaction.id,
    status: transaction.status,
    approved: transaction.status === 'APPROVED',
  }
}

export async function getAcceptanceToken() {
  return getWompiAcceptanceToken()
}
