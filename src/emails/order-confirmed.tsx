import {
  Body, Button, Container, Head, Heading, Hr, Html,
  Img, Preview, Section, Text, Row, Column
} from '@react-email/components'
import * as React from 'react'

interface OrderItem {
  product_name: string
  product_image: string
  price: number
  quantity: number
  subtotal: number
}

interface OrderConfirmedEmailProps {
  buyerName: string
  orderId: string
  orderItems: OrderItem[]
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

export function OrderConfirmedEmail({
  buyerName,
  orderId,
  orderItems,
  subtotal,
  discountAmount,
  shippingCost,
  total,
  shippingAddress,
  storeName,
  orderUrl,
}: OrderConfirmedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Tu pedido #{orderId.slice(0, 8)} fue confirmado 🎉</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={logo}>MODAVIDA</Heading>
          </Section>

          {/* Main content */}
          <Section style={content}>
            <Heading style={h1}>¡Pedido confirmado!</Heading>
            <Text style={text}>
              Hola {buyerName}, tu pedido de <strong>{storeName}</strong> fue recibido y está siendo procesado.
            </Text>

            <Text style={orderIdText}>Pedido #{orderId.slice(0, 8).toUpperCase()}</Text>

            {/* Items */}
            {orderItems.map((item, i) => (
              <Row key={i} style={itemRow}>
                <Column style={itemImageCol}>
                  <Img src={item.product_image} width="64" height="64" style={itemImage} alt={item.product_name} />
                </Column>
                <Column style={itemInfoCol}>
                  <Text style={itemName}>{item.product_name}</Text>
                  <Text style={itemQty}>Cantidad: {item.quantity}</Text>
                </Column>
                <Column style={itemPriceCol}>
                  <Text style={itemPrice}>${item.subtotal.toLocaleString('es-CO')}</Text>
                </Column>
              </Row>
            ))}

            <Hr style={hr} />

            {/* Totals */}
            <Row style={totalRow}>
              <Column><Text style={totalLabel}>Subtotal</Text></Column>
              <Column><Text style={totalValue}>${subtotal.toLocaleString('es-CO')}</Text></Column>
            </Row>
            {discountAmount > 0 && (
              <Row style={totalRow}>
                <Column><Text style={totalLabel}>Descuento</Text></Column>
                <Column><Text style={{ ...totalValue, color: '#22c55e' }}>-${discountAmount.toLocaleString('es-CO')}</Text></Column>
              </Row>
            )}
            <Row style={totalRow}>
              <Column><Text style={totalLabel}>Envío</Text></Column>
              <Column><Text style={totalValue}>{shippingCost === 0 ? 'Gratis' : `$${shippingCost.toLocaleString('es-CO')}`}</Text></Column>
            </Row>
            <Hr style={hr} />
            <Row style={totalRow}>
              <Column><Text style={{ ...totalLabel, fontWeight: '700', fontSize: '16px' }}>Total</Text></Column>
              <Column><Text style={{ ...totalValue, fontWeight: '700', fontSize: '16px', color: '#7c3aed' }}>${total.toLocaleString('es-CO')}</Text></Column>
            </Row>

            <Hr style={hr} />

            {/* Shipping address */}
            <Text style={sectionTitle}>Dirección de envío</Text>
            <Text style={addressText}>
              {shippingAddress.fullName}<br />
              {shippingAddress.addressLine1}<br />
              {shippingAddress.city}, {shippingAddress.state}
            </Text>

            <Button style={button} href={orderUrl}>
              Ver mi pedido
            </Button>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>© 2025 Modavida. Todos los derechos reservados.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = { backgroundColor: '#0f0c29', fontFamily: 'Inter, sans-serif' }
const container = { maxWidth: '600px', margin: '0 auto', backgroundColor: '#1a1040', borderRadius: '12px', overflow: 'hidden' }
const header = { backgroundColor: '#7c3aed', padding: '24px', textAlign: 'center' as const }
const logo = { color: '#ffffff', fontSize: '28px', fontFamily: 'Georgia, serif', margin: '0' }
const content = { padding: '32px' }
const h1 = { color: '#ffffff', fontSize: '24px', marginBottom: '16px' }
const text = { color: 'rgba(255,255,255,0.8)', fontSize: '15px', lineHeight: '1.6' }
const orderIdText = { color: '#e879f9', fontSize: '13px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase' as const }
const itemRow = { marginBottom: '16px' }
const itemImageCol = { width: '80px' }
const itemImage = { borderRadius: '8px', objectFit: 'cover' as const }
const itemInfoCol = { paddingLeft: '12px' }
const itemPriceCol = { width: '100px', textAlign: 'right' as const }
const itemName = { color: '#ffffff', fontSize: '14px', margin: '0', fontWeight: '600' }
const itemQty = { color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: '4px 0 0' }
const itemPrice = { color: '#ffffff', fontSize: '14px', fontWeight: '600', margin: '0' }
const hr = { borderColor: 'rgba(255,255,255,0.1)', margin: '16px 0' }
const totalRow = { marginBottom: '8px' }
const totalLabel = { color: 'rgba(255,255,255,0.7)', fontSize: '14px', margin: '0' }
const totalValue = { color: '#ffffff', fontSize: '14px', margin: '0', textAlign: 'right' as const }
const sectionTitle = { color: '#e879f9', fontSize: '13px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase' as const }
const addressText = { color: 'rgba(255,255,255,0.8)', fontSize: '14px', lineHeight: '1.6' }
const button = { backgroundColor: '#7c3aed', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', fontSize: '15px', fontWeight: '600', textDecoration: 'none', display: 'inline-block', marginTop: '16px' }
const footer = { backgroundColor: 'rgba(0,0,0,0.3)', padding: '20px', textAlign: 'center' as const }
const footerText = { color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '0' }

export default OrderConfirmedEmail
