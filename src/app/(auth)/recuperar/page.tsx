import { Metadata } from 'next'
import RecuperarForm from './recuperar-form'

export const metadata: Metadata = {
  title: 'Recuperar contraseña | E-Commerce Moda',
}

export default function RecuperarPage() {
  return <RecuperarForm />
}
