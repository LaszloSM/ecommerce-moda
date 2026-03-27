import { NextResponse } from 'next/server'
import { getCategories } from '@/features/catalog/actions'

export async function GET() {
  const categories = await getCategories()
  return NextResponse.json(categories)
}
