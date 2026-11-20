import { NextRequest, NextResponse } from 'next/server'
import { SmartPosClient } from '@/lib/api/clientAdapter'
import { InventoryService } from '@/lib/api/inventoryService'
import { runSmartPosSync } from '@/lib/domain/syncSmartPos'
import { commitFileToRepo, triggerVercelRedeploy } from '@/lib/integrations/githubContent'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
}

let lastManualSyncTime = 0
const COOLDOWN_MS = 15 * 1000

export async function POST(req: NextRequest) {
  const now = Date.now()
  if (now - lastManualSyncTime < COOLDOWN_MS) {
    const waitSec = Math.ceil((COOLDOWN_MS - (now - lastManualSyncTime)) / 1000)
    return NextResponse.json(
      {
        success: false,
        message: `Sincronização executada recentemente. Aguarde ${waitSec}s para atualizar novamente.`,
      },
      { status: 429, headers: NO_STORE_HEADERS }
    )
  }

  const keyId = process.env.SMARTPOS_KEY_ID || ''
  const keySecret = process.env.SMARTPOS_KEY_SECRET || ''
  const baseUrl = process.env.SMARTPOS_BASE_URL || 'https://api.smartpos.app/v1'

  if (!keyId || !keySecret) {
    return NextResponse.json(
      {
        success: false,
        message: 'Credenciais SMARTPOS_KEY_ID e SMARTPOS_KEY_SECRET não configuradas no servidor.',
      },
      { status: 500, headers: NO_STORE_HEADERS }
    )
  }

  try {
    const client = new SmartPosClient({ baseUrl, keyId, keySecret })
    const currentData = InventoryService.getRawData()
    const nowUtc = new Date()
    const { dataset: recomputed, produtosApi } = await runSmartPosSync(client, currentData, nowUtc.toISOString())

    const brtHours = (nowUtc.getUTCHours() - 3 + 24) % 24
    const pad = (n: number) => String(n).padStart(2, '0')
    const lastSyncBrt = `${pad(nowUtc.getUTCDate())}/${pad(
      nowUtc.getUTCMonth() + 1
    )}/${nowUtc.getUTCFullYear()} às ${pad(brtHours)}:${pad(nowUtc.getUTCMinutes())} (BRT)`

    const updatedSummary = {
      ...recomputed.summary,
      last_sync_at: nowUtc.toISOString(),
      last_sync_brt: lastSyncBrt,
      sync_metadata: {
        last_sync_at: nowUtc.toISOString(),
        last_sync_brt: lastSyncBrt,
        sync_status: 'SUCCESS' as const,
        produtos_api: produtosApi,
        skus_conciliados: recomputed.products.length,
        origem: 'SmartPOS API Oficial v1',
      },
      origem: `SmartPOS API Sync (${recomputed.products.length} SKUs 100% integrados via API)`,
    }

    const newDataset = { summary: updatedSummary, products: recomputed.products }

    InventoryService.updateData(newDataset)
    lastManualSyncTime = now

    let persisted = false
    let persistError: string | null = null
    try {
      await commitFileToRepo({
        path: 'lib/data/inventoryData.json',
        content: JSON.stringify(newDataset, null, 2),
        message: 'chore(sync): manual SmartPOS catalog + sales-decrement sync via dashboard',
      })
      await triggerVercelRedeploy()
      persisted = true
    } catch (err: unknown) {
      persistError = err instanceof Error ? err.message : 'Erro desconhecido ao persistir a sincronização.'
    }

    return NextResponse.json(
      {
        success: true,
        persisted,
        persistError,
        message: persisted
          ? `Sincronização concluída! ${recomputed.products.length} SKUs atualizados. Publicação definitiva em ~1-2 minutos.`
          : `Sincronização aplicada nesta sessão, mas a persistência durável falhou: ${persistError}`,
        last_sync_brt: lastSyncBrt,
        summary: updatedSummary,
        products: recomputed.products,
      },
      { headers: NO_STORE_HEADERS }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao sincronizar com SmartPOS'
    return NextResponse.json({ success: false, message }, { status: 500, headers: NO_STORE_HEADERS })
  }
}
