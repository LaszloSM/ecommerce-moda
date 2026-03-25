import { Metadata } from 'next'
import RegisterForm from './register-form'

export const metadata: Metadata = {
  title: 'Crear cuenta | E-Commerce Moda',
}

export default function RegistroPage() {
  return <RegisterForm />
}
