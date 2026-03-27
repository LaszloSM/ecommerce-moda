import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getWompiTransaction } from '@/lib/wompi/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const event = body.event
    const data = body.data

    if (event !== 'transaction.updated') {
      return NextResponse.json({ received: true })
    }

    const transaction = data?.transaction
    if (!transaction?.id) {
      return NextResponse.json({ received: true })
    }

    // Verify transaction with Wompi API (don't trust webhook data alone)
    const verified = await getWompiTransaction(transaction.id)
    if (!verified) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })

    const supabase = await createClient()

    // Find order by wompi_transaction_id
    const { data: order } = await (supabase as any)
      .from('orders')
      .select('id, buyer_id, total, store_id, stores(name)')
      .eq('wompi_transaction_id', verified.id)
      .single()

    if (!order) return NextResponse.json({ received: true })

    // Map Wompi status to order status
    const statusMap: Record<string, string> = {
      APPROVED: 'confirmed',
      DECLINED: 'cancelled',
      VOIDED: 'cancelled',
      ERROR: 'cancelled',
    }

    const newStatus = statusMap[verified.status] ?? 'pending'
    await (supabase as any)
      .from('orders')
      .update({ status: newStatus })
      .eq('id', order.id)

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[Wompi Webhook] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
