import { NextResponse } from 'next/server'
import { getWompiAcceptanceToken } from '@/lib/wompi/client'

export async function GET() {
  const acceptanceToken = await getWompiAcceptanceToken()
  return NextResponse.json({ acceptanceToken })
}
