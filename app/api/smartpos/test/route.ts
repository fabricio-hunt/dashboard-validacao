import { NextRequest, NextResponse } from 'next/server'
import { SmartPosClient } from '@/lib/api/clientAdapter'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const keyId = body.keyId || process.env.SMARTPOS_KEY_ID || ''
    const keySecret = body.keySecret || process.env.SMARTPOS_KEY_SECRET || ''
    const baseUrl = body.baseUrl || process.env.SMARTPOS_BASE_URL || 'https://api.smartpos.app/v1'

    const client = new SmartPosClient({
      baseUrl,
      keyId,
      keySecret,
    })

    const result = await client.testConnection()
    return NextResponse.json(result, { status: 200 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno ao testar conexão'
    return NextResponse.json(
      {
        success: false,
        statusCode: 500,
        latencyMs: 0,
        message,
      },
      { status: 500 }
    )
  }
}
