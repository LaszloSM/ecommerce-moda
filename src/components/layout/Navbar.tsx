'use client'

import * as React from 'react'
import Link from 'next/link'
import { Search, ShoppingBag, Menu, User, LogOut, Package, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { useCartStore } from '@/features/cart/store'
import { CartDrawer } from '@/features/cart/components/CartDrawer'
import { signOut } from '@/features/auth/actions'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { label: 'Mujer', href: '/categoria/mujer' },
  { label: 'Hombre', href: '/categoria/hombre' },
  { label: 'Accesorios', href: '/categoria/accesorios' },
  { label: 'Calzado', href: '/categoria/calzado' },
  { label: 'Deportivo', href: '/categoria/deportivo' },
]

export default function Navbar() {
  const { items } = useCartStore()
  const cartCount = items.reduce((sum, item) => sum + (item.quantity ?? 1), 0)

  const [user, setUser] = React.useState<{ email?: string; id?: string } | null>(null)
  const [cartOpen, setCartOpen] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)

  React.useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const userInitial = user?.email ? user.email[0].toUpperCase() : 'U'

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50',
          'backdrop-blur-lg bg-white/5 border-b border-white/10',
        )}
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.37)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              href="/"
              className="font-heading text-xl font-bold tracking-widest"
              style={{ color: '#7c3aed', fontFamily: 'var(--font-playfair, serif)' }}
            >
              MODAVIDA
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2 text-sm font-medium rounded-md transition-colors"
                  style={{ color: 'rgba(255,255,255,0.80)' }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-1">
              {/* Search */}
              <Link href="/buscar">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white/70 hover:text-white hover:bg-white/10"
                  aria-label="Buscar"
                >
                  <Search className="h-5 w-5" />
                </Button>
              </Link>

              {/* Cart */}
              <Button
                variant="ghost"
                size="icon"
                className="relative text-white/70 hover:text-white hover:bg-white/10"
                aria-label="Carrito"
                onClick={() => setCartOpen(true)}
              >
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <Badge
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold border-0"
                    style={{ backgroundColor: '#7c3aed', color: 'white' }}
                  >
                    {cartCount > 99 ? '99+' : cartCount}
                  </Badge>
                )}
              </Button>

              {/* Auth */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="ghost"
                        className="flex items-center gap-2 px-2 text-white/70 hover:text-white hover:bg-white/10"
                        aria-label="Mi cuenta"
                      />
                    }
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarFallback
                        className="text-xs font-semibold"
                        style={{ backgroundColor: '#7c3aed', color: 'white' }}
                      >
                        {userInitial}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-3.5 w-3.5 hidden sm:block" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48 border border-white/10"
                    style={{
                      backgroundColor: 'rgba(15,12,41,0.95)',
                      backdropFilter: 'blur(16px)',
                    }}
                  >
                    <DropdownMenuItem>
                      <Link
                        href="/cuenta"
                        className="flex items-center gap-2 w-full text-white/80 hover:text-white"
                      >
                        <User className="h-4 w-4" />
                        Mi Cuenta
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link
                        href="/cuenta/pedidos"
                        className="flex items-center gap-2 w-full text-white/80 hover:text-white"
                      >
                        <Package className="h-4 w-4" />
                        Mis Pedidos
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <form action={signOut} className="w-full">
                        <button
                          type="submit"
                          className="flex w-full items-center gap-2 text-red-400 hover:text-red-300"
                        >
                          <LogOut className="h-4 w-4" />
                          Cerrar Sesión
                        </button>
                      </form>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/login">
                  <Button
                    variant="outline"
                    size="sm"
                    className="hidden sm:flex border-white/20 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white text-xs"
                  >
                    Iniciar sesión
                  </Button>
                </Link>
              )}

              {/* Mobile hamburger */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden text-white/70 hover:text-white hover:bg-white/10"
                      aria-label="Menú"
                    />
                  }
                >
                  <Menu className="h-5 w-5" />
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="w-72 p-0 border-r border-white/10"
                  style={{
                    backgroundColor: 'rgba(15,12,41,0.97)',
                    backdropFilter: 'blur(20px)',
                  }}
                >
                  <SheetHeader className="px-6 py-5 border-b border-white/10">
                    <SheetTitle
                      className="text-left text-xl font-bold tracking-widest"
                      style={{
                        color: '#7c3aed',
                        fontFamily: 'var(--font-playfair, serif)',
                      }}
                    >
                      MODAVIDA
                    </SheetTitle>
                  </SheetHeader>

                  <nav className="flex flex-col px-4 py-4 gap-1">
                    {NAV_LINKS.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className="px-4 py-3 rounded-lg text-sm font-medium transition-colors"
                        style={{ color: 'rgba(255,255,255,0.80)' }}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </nav>

                  <Separator className="bg-white/10 mx-4" />

                  <div className="px-4 py-4">
                    {user ? (
                      <div className="space-y-1">
                        <Link
                          href="/cuenta"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <User className="h-4 w-4" />
                          Mi Cuenta
                        </Link>
                        <Link
                          href="/cuenta/pedidos"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <Package className="h-4 w-4" />
                          Mis Pedidos
                        </Link>
                        <form action={signOut}>
                          <button
                            type="submit"
                            className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors"
                          >
                            <LogOut className="h-4 w-4" />
                            Cerrar Sesión
                          </button>
                        </form>
                      </div>
                    ) : (
                      <Link href="/login" onClick={() => setMobileOpen(false)}>
                        <Button
                          className="w-full text-white font-semibold"
                          style={{ backgroundColor: '#7c3aed' }}
                        >
                          Iniciar sesión
                        </Button>
                      </Link>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Cart Drawer */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
