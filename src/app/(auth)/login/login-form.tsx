'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { signIn, signInWithGoogle } from '@/features/auth/actions'
import { loginSchema, type LoginInput } from '@/features/auth/validators'

export default function LoginForm() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  function onSubmit(data: LoginInput) {
    setError(null)
    startTransition(async () => {
      const result = await signIn(data)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <Card className="backdrop-blur-lg bg-white/8 border border-white/18 text-white">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Bienvenido</CardTitle>
        <CardDescription className="text-white/60 text-center">
          Inicia sesión en tu cuenta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          variant="outline"
          className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
          onClick={() => startTransition(async () => { await signInWithGoogle() })}
          disabled={isPending}
        >
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Continuar con Google
        </Button>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/20" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-transparent px-2 text-white/40">O continúa con</span>
          </div>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/80">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              {...register('email')}
            />
            {errors.email && <p className="text-red-400 text-sm">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white/80">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              {...register('password')}
            />
            {errors.password && <p className="text-red-400 text-sm">{errors.password.message}</p>}
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700" disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Iniciar sesión
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2 text-center">
        <Link href="/auth/recuperar" className="text-sm text-violet-400 hover:text-violet-300">
          ¿Olvidaste tu contraseña?
        </Link>
        <p className="text-sm text-white/60">
          ¿No tienes cuenta?{' '}
          <Link href="/auth/registro" className="text-violet-400 hover:text-violet-300 font-medium">
            Regístrate
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
