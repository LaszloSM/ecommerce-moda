import type { Metadata } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'ModaStore — Moda y Accesorios Premium',
    template: '%s | ModaStore',
  },
  description: 'Descubre las últimas tendencias en moda y accesorios. Compra online con las mejores marcas colombianas.',
  keywords: ['moda', 'ropa', 'accesorios', 'colombia', 'online'],
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    siteName: 'ModaStore',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${playfair.variable} ${inter.variable}`} suppressHydrationWarning>
      <body>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
