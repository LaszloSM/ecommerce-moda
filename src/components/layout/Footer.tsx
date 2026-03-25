import Link from 'next/link'
import { Globe, Share2, Link2 } from 'lucide-react'

const COLUMNS = [
  {
    title: 'Empresa',
    links: [
      { label: 'Sobre nosotros', href: '/sobre-nosotros' },
      { label: 'Blog', href: '/blog' },
      { label: 'Trabaja con nosotros', href: '/trabaja-con-nosotros' },
    ],
  },
  {
    title: 'Ayuda',
    links: [
      { label: 'Centro de ayuda', href: '/ayuda' },
      { label: 'Devoluciones', href: '/devoluciones' },
      { label: 'Envíos', href: '/envios' },
      { label: 'Contacto', href: '/contacto' },
    ],
  },
  {
    title: 'Vendedores',
    links: [
      { label: 'Crear tienda', href: '/dashboard' },
      { label: 'Cómo funciona', href: '/como-funciona' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Términos', href: '/terminos' },
      { label: 'Privacidad', href: '/privacidad' },
      { label: 'Cookies', href: '/cookies' },
    ],
  },
]

export default function Footer() {
  return (
    <footer
      className="border-t border-white/10"
      style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Logo */}
        <div className="mb-10">
          <Link
            href="/"
            className="text-2xl font-bold tracking-widest"
            style={{
              color: '#7c3aed',
              fontFamily: 'var(--font-playfair, serif)',
            }}
          >
            MODAVIDA
          </Link>
          <p
            className="mt-2 text-sm max-w-xs"
            style={{ color: 'rgba(255,255,255,0.50)' }}
          >
            Descubre las últimas tendencias en moda y accesorios premium de Colombia.
          </p>
        </div>

        {/* Columns grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3
                className="text-sm font-semibold mb-4 uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.90)' }}
              >
                {col.title}
              </h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors hover:underline"
                      style={{ color: 'rgba(255,255,255,0.55)' }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p
            className="text-xs text-center sm:text-left"
            style={{ color: 'rgba(255,255,255,0.40)' }}
          >
            © 2025 Modavida. Todos los derechos reservados.
          </p>

          {/* Social icons */}
          <div className="flex items-center gap-4">
            <a
              href="#"
              aria-label="Instagram"
              className="transition-colors hover:opacity-80"
              style={{ color: 'rgba(255,255,255,0.40)' }}
            >
              <Share2 className="h-4 w-4" />
            </a>
            <a
              href="#"
              aria-label="Twitter / X"
              className="transition-colors hover:opacity-80"
              style={{ color: 'rgba(255,255,255,0.40)' }}
            >
              <Link2 className="h-4 w-4" />
            </a>
            <a
              href="#"
              aria-label="Facebook"
              className="transition-colors hover:opacity-80"
              style={{ color: 'rgba(255,255,255,0.40)' }}
            >
              <Globe className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
