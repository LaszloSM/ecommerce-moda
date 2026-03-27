'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { resetPassword } from '@/features/auth/actions'
import { resetPasswordSchema, type ResetPasswordInput } from '@/features/auth/validators'

export default function RecuperarForm() {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  })

  function onSubmit(data: ResetPasswordInput) {
    setMessage(null)
    startTransition(async () => {
      const result = await resetPassword(data)
      if (result?.error) setMessage({ type: 'error', text: result.error })
      if (result?.success) setMessage({ type: 'success', text: result.success })
    })
  }

  return (
    <Card className="backdrop-blur-lg bg-white/8 border border-white/18 text-white">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Recuperar contraseña</CardTitle>
        <CardDescription className="text-white/60 text-center">
          Te enviaremos un enlace para restablecer tu contraseña
        </CardDescription>
      </CardHeader>
      <CardContent>
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
          {message && (
            <p className={`text-sm text-center ${message.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
              {message.text}
            </p>
          )}
          <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700" disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Enviar enlace
          </Button>
        </form>
        <div className="mt-4 text-center">
          <Link href="/login" className="inline-flex items-center text-sm text-violet-400 hover:text-violet-300">
            <ArrowLeft className="mr-1 h-3 w-3" />
            Volver al login
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
