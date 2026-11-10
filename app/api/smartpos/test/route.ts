import { NextRequest, NextResponse } from 'next/server'
import { SmartPosClient } from '@/lib/api/clientAdapter'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const keyId = body.keyId || process.env.SMARTPOS_KEY_ID || '2735d1d6-b987-4a3f-853d-dfb4a58bc2a5'
    const keySecret = body.keySecret || process.env.SMARTPOS_KEY_SECRET || ''
    const baseUrl = body.baseUrl || process.env.SMARTPOS_BASE_URL || 'https://api.smartpos.app/v1'

    const client = new SmartPosClient({
      baseUrl,
      keyId,
      keySecret,
    })

    const result = await client.testConnection()

    return NextResponse.json(result, {
      status: 200, // Retorna 200 para a camada de UI poder exibir o diagnóstico amigável
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        statusCode: 500,
        latencyMs: 0,
        message: error.message || 'Erro interno ao testar conexão',
      },
      { status: 500 }
    )
  }
}
