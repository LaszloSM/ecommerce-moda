'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { signUp } from '@/features/auth/actions'
import { registerSchema, type RegisterInput } from '@/features/auth/validators'

export default function RegisterForm() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  function onSubmit(data: RegisterInput) {
    setError(null)
    startTransition(async () => {
      const result = await signUp(data)
      if (result?.error) setError(result.error)
      if (result?.success) setSuccess(result.success)
    })
  }

  if (success) {
    return (
      <Card className="backdrop-blur-lg bg-white/8 border border-white/18 text-white">
        <CardContent className="pt-6 text-center space-y-4">
          <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
          <p className="text-white/80">{success}</p>
          <Link href="/login" className="text-violet-400 hover:underline text-sm">
            Volver al login
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="backdrop-blur-lg bg-white/8 border border-white/18 text-white">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Crear cuenta</CardTitle>
        <CardDescription className="text-white/60 text-center">
          Únete a nuestra plataforma de moda
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name" className="text-white/80">Nombre completo</Label>
            <Input
              id="full_name"
              placeholder="Juan García"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              {...register('full_name')}
            />
            {errors.full_name && <p className="text-red-400 text-sm">{errors.full_name.message}</p>}
          </div>
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
          <div className="space-y-2">
            <Label htmlFor="confirm_password" className="text-white/80">Confirmar contraseña</Label>
            <Input
              id="confirm_password"
              type="password"
              placeholder="••••••••"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              {...register('confirm_password')}
            />
            {errors.confirm_password && <p className="text-red-400 text-sm">{errors.confirm_password.message}</p>}
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700" disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Crear cuenta
          </Button>
        </form>
      </CardContent>
      <CardFooter className="text-center">
        <p className="text-sm text-white/60 w-full">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium">
            Inicia sesión
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
