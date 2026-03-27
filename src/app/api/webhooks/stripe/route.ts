import { NextRequest, NextResponse } from 'next/server'

// Stripe webhook handler — scaffolded for future implementation
// To activate: set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in .env.local
export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  // TODO: Implement Stripe signature verification when STRIPE_SECRET_KEY is set
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  // const event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET!)

  if (!process.env.STRIPE_SECRET_KEY) {
    console.log('[Stripe Webhook] Stripe not configured yet — skipping')
    return NextResponse.json({ received: true })
  }

  console.log('[Stripe Webhook] Received event — implement handler here')
  return NextResponse.json({ received: true })
}
