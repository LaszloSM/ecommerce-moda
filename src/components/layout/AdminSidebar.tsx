'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Store,
  Tag,
  LogOut,
  Menu,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { signOut } from '@/features/auth/actions'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
  { icon: Users, label: 'Usuarios', href: '/admin/usuarios' },
  { icon: Store, label: 'Tiendas', href: '/admin/tiendas' },
  { icon: Tag, label: 'Categorías', href: '/admin/categorias' },
]

function SidebarContent({ onNav }: { onNav?: () => void }) {
  const pathname = usePathname()
  const [user, setUser] = React.useState<{ email?: string } | null>(null)

  React.useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  const userInitial = user?.email ? user.email[0].toUpperCase() : 'A'

  return (
    <div className="flex flex-col h-full">
      {/* Logo + subtitle */}
      <div className="px-6 py-5 border-b border-white/10">
        <Link
          href="/admin"
          onClick={onNav}
          className="text-xl font-bold tracking-widest"
          style={{ color: '#e879f9', fontFamily: 'var(--font-playfair, serif)' }}
        >
          MODAVIDA
        </Link>
        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Panel Admin
        </p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
          const isActive = pathname === href || (href !== '/admin' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              onClick={onNav}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5',
              )}
              style={
                isActive
                  ? { backgroundColor: 'rgba(232,121,249,0.20)', color: '#f0abfc' }
                  : {}
              }
            >
              <Icon className="shrink-0" size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      <Separator className="bg-white/10 mx-3" />

      {/* User + sign out */}
      <div className="px-3 py-4">
        <div className="flex items-center gap-3 px-4 py-2 mb-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback
              className="text-xs font-bold"
              style={{ backgroundColor: '#e879f9', color: 'white' }}
            >
              {userInitial}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p
              className="text-xs font-medium truncate"
              style={{ color: 'rgba(255,255,255,0.85)' }}
            >
              {user?.email ?? 'Admin'}
            </p>
          </div>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Salir
          </button>
        </form>
      </div>
    </div>
  )
}

export default function AdminSidebar() {
  const [mobileOpen, setMobileOpen] = React.useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 border-r border-white/10 z-40"
        style={{
          backgroundColor: 'rgba(15,12,41,0.97)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile trigger + Sheet */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="text-white/70 hover:text-white hover:bg-white/10 border border-white/10"
                style={{ backgroundColor: 'rgba(15,12,41,0.80)' }}
                aria-label="Abrir menú"
              />
            }
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-64 p-0 border-r border-white/10"
            style={{
              backgroundColor: 'rgba(15,12,41,0.97)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Menú de administración</SheetTitle>
            </SheetHeader>
            <SidebarContent onNav={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
