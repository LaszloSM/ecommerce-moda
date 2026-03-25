import { z } from 'zod'

export const addressSchema = z.object({
  fullName: z.string().min(3, 'Nombre completo requerido'),
  addressLine1: z.string().min(5, 'Dirección requerida'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'Ciudad requerida'),
  state: z.string().min(2, 'Departamento requerido'),
  postalCode: z.string().optional(),
  phone: z.string().min(7, 'Teléfono requerido'),
  country: z.string().min(2, 'País requerido'),
})

export type AddressFormValues = z.infer<typeof addressSchema>
