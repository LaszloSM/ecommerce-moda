import {
  Body, Button, Container, Head, Heading, Hr, Html,
  Preview, Section, Text
} from '@react-email/components'
import * as React from 'react'

interface OrderShippedEmailProps {
  buyerName: string
  orderId: string
  trackingNumber?: string
  trackingUrl?: string
  orderUrl: string
  storeName: string
  estimatedDays?: string
}

export function OrderShippedEmail({
  buyerName,
  orderId,
  trackingNumber,
  trackingUrl,
  orderUrl,
  storeName,
  estimatedDays = '3-5 días hábiles',
}: OrderShippedEmailProps) {
  const ctaUrl = trackingUrl ?? orderUrl

  return (
    <Html>
      <Head />
      <Preview>Tu pedido #{orderId.slice(0, 8)} ha sido enviado 🚚</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={logo}>MODAVIDA</Heading>
          </Section>

          {/* Main content */}
          <Section style={content}>
            {/* Ship status badge */}
            <Text style={statusBadge}>🚚 En camino</Text>

            <Heading style={h1}>¡Tu pedido está en camino!</Heading>
            <Text style={text}>
              Hola {buyerName}, tu pedido de <strong>{storeName}</strong> ha sido enviado y pronto llegará a tu puerta.
            </Text>

            <Text style={orderIdText}>Pedido #{orderId.slice(0, 8).toUpperCase()}</Text>

            <Hr style={hr} />

            {/* Tracking info */}
            {trackingNumber && (
              <Section style={infoBox}>
                <Text style={infoLabel}>Número de seguimiento</Text>
                <Text style={infoValue}>{trackingNumber}</Text>
              </Section>
            )}

            <Section style={infoBox}>
              <Text style={infoLabel}>Entrega estimada</Text>
              <Text style={infoValue}>{estimatedDays}</Text>
            </Section>

            <Hr style={hr} />

            <Button style={button} href={ctaUrl}>
              {trackingUrl ? 'Rastrear mi pedido' : 'Ver mi pedido'}
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
const statusBadge = { display: 'inline-block', backgroundColor: 'rgba(34,197,94,0.15)', color: '#22c55e', fontSize: '13px', fontWeight: '700', padding: '6px 14px', borderRadius: '99px', margin: '0 0 16px', letterSpacing: '0.05em' }
const h1 = { color: '#ffffff', fontSize: '24px', marginBottom: '16px' }
const text = { color: 'rgba(255,255,255,0.8)', fontSize: '15px', lineHeight: '1.6' }
const orderIdText = { color: '#e879f9', fontSize: '13px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase' as const }
const hr = { borderColor: 'rgba(255,255,255,0.1)', margin: '16px 0' }
const infoBox = { marginBottom: '12px' }
const infoLabel = { color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase' as const, margin: '0 0 4px' }
const infoValue = { color: '#22c55e', fontSize: '16px', fontWeight: '700', margin: '0' }
const button = { backgroundColor: '#22c55e', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', fontSize: '15px', fontWeight: '600', textDecoration: 'none', display: 'inline-block', marginTop: '16px' }
const footer = { backgroundColor: 'rgba(0,0,0,0.3)', padding: '20px', textAlign: 'center' as const }
const footerText = { color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '0' }

export default OrderShippedEmail
