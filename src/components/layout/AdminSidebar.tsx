'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, Tag, ShoppingCart, Users,
  AlertTriangle, Ticket, Settings, LogOut, Menu, X
} from 'lucide-react'
import { useState } from 'react'
import { signOut } from '@/features/auth/actions'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/panel', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/panel/productos', label: 'Productos', icon: Package },
  { href: '/panel/categorias', label: 'Categorías', icon: Tag },
  { href: '/panel/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { href: '/panel/clientes', label: 'Clientes', icon: Users },
  { href: '/panel/inventario', label: 'Inventario', icon: AlertTriangle },
  { href: '/panel/promociones', label: 'Promociones', icon: Ticket },
  { href: '/panel/configuracion', label: 'Configuración', icon: Settings },
]

export default function AdminSidebar({ user }: { user: { name: string; email: string } }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-violet-700 text-white"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Overlay mobile */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full w-64 z-40 flex flex-col transition-transform duration-200',
          'border-r border-white/10',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
        style={{ background: 'rgba(15,12,41,0.98)', backdropFilter: 'blur(20px)' }}
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10">
          <Link href="/panel" className="font-bold text-xl tracking-widest text-violet-400"
            style={{ fontFamily: 'var(--font-playfair, serif)' }}>
            MODAVIDA
          </Link>
          <p className="text-xs text-white/40 mt-0.5">Panel Administrador</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive(href, exact)
                  ? 'bg-violet-600/30 text-violet-300 border border-violet-500/30'
                  : 'text-white/60 hover:text-white hover:bg-white/5',
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        {/* User + logout */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-semibold text-white/80 truncate">{user.name}</p>
            <p className="text-xs text-white/40 truncate">{user.email}</p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </button>
          </form>
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors mt-0.5"
          >
            ← Ver tienda
          </Link>
        </div>
      </aside>
    </>
  )
}
