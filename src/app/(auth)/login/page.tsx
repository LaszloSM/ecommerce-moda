import { Metadata } from 'next'
import LoginForm from './login-form'

export const metadata: Metadata = {
  title: 'Iniciar sesión | E-Commerce Moda',
  description: 'Inicia sesión en tu cuenta',
}

export default function LoginPage() {
  return <LoginForm />
}
