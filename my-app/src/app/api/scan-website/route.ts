// src/app/api/admin/scan-website/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { scanWebsiteForAssistantContext } from '@/lib/website-context-scanner'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const url = body?.url

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing website URL' },
        { status: 400 }
      )
    }

    const result = await scanWebsiteForAssistantContext(url, {
      maxPages: 12,
      maxCharactersPerPage: 6000,
      timeoutMs: 10000,
    })

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error) {
    console.error('Website scan failed:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Website scan failed',
      },
      { status: 500 }
    )
  }
}