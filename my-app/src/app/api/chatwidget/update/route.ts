import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { businessId, config } = await req.json()

  // ⚠️ koble til din DB her
  console.log('Saving config', businessId, config)

  return NextResponse.json({ success: true })
}
