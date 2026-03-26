import { resend } from './resend'
import { render } from '@react-email/render'
import { OrderConfirmedEmail } from '@/emails/order-confirmed'
import { OrderShippedEmail } from '@/emails/order-shipped'
import * as React from 'react'

const FROM = process.env.EMAIL_FROM ?? 'noreply@modavida.co'

interface OrderConfirmedData {
  to: string
  buyerName: string
  orderId: string
  orderItems: Array<{
    product_name: string
    product_image: string
    price: number
    quantity: number
    subtotal: number
  }>
  subtotal: number
  discountAmount: number
  shippingCost: number
  total: number
  shippingAddress: {
    fullName: string
    addressLine1: string
    city: string
    state: string
  }
  storeName: string
  orderUrl: string
}

export async function sendOrderConfirmedEmail(data: OrderConfirmedData) {
  const html = await render(
    React.createElement(OrderConfirmedEmail, {
      buyerName: data.buyerName,
      orderId: data.orderId,
      orderItems: data.orderItems,
      subtotal: data.subtotal,
      discountAmount: data.discountAmount,
      shippingCost: data.shippingCost,
      total: data.total,
      shippingAddress: data.shippingAddress,
      storeName: data.storeName,
      orderUrl: data.orderUrl,
    })
  )
  return resend.emails.send({
    from: FROM,
    to: data.to,
    subject: `Pedido #${data.orderId.slice(0, 8).toUpperCase()} confirmado — Modavida`,
    html,
  })
}

export async function sendOrderShippedEmail(data: {
  to: string
  buyerName: string
  orderId: string
  trackingNumber?: string
  trackingUrl?: string
  orderUrl: string
  storeName: string
  estimatedDays?: string
}) {
  const html = await render(
    React.createElement(OrderShippedEmail, {
      buyerName: data.buyerName,
      orderId: data.orderId,
      trackingNumber: data.trackingNumber,
      trackingUrl: data.trackingUrl,
      orderUrl: data.orderUrl,
      storeName: data.storeName,
      estimatedDays: data.estimatedDays,
    })
  )
  return resend.emails.send({
    from: FROM,
    to: data.to,
    subject: `Tu pedido #${data.orderId.slice(0, 8).toUpperCase()} está en camino 🚚`,
    html,
  })
}
