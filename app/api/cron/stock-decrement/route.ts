import { NextRequest, NextResponse } from 'next/server'
import { SmartPosClient } from '@/lib/api/clientAdapter'
import { InventoryService } from '@/lib/api/inventoryService'
import { runSmartPosSync } from '@/lib/domain/syncSmartPos'
import { commitFileToRepo, triggerVercelRedeploy } from '@/lib/integrations/githubContent'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
}

/**
 * Runs the same catalog + sales-decrement sync as the manual "Sincronizar Agora" button, but
 * triggered automatically by Vercel Cron (see vercel.json) so stock stays close to real without
 * requiring anyone to open the dashboard and click a button. Vercel signs cron requests with
 * `Authorization: Bearer $CRON_SECRET` — reject anything else so this isn't a public endpoint.
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, message: 'Não autorizado.' }, { status: 401, headers: NO_STORE_HEADERS })
    }
  }

  const keyId = process.env.SMARTPOS_KEY_ID || ''
  const keySecret = process.env.SMARTPOS_KEY_SECRET || ''
  const baseUrl = process.env.SMARTPOS_BASE_URL || 'https://api.smartpos.app/v1'

  if (!keyId || !keySecret) {
    return NextResponse.json(
      { success: false, message: 'Credenciais SMARTPOS_KEY_ID e SMARTPOS_KEY_SECRET não configuradas.' },
      { status: 500, headers: NO_STORE_HEADERS }
    )
  }

  try {
    const client = new SmartPosClient({ baseUrl, keyId, keySecret })
    const currentData = InventoryService.getRawData()
    const nowUtc = new Date()
    const { dataset: recomputed, produtosApi } = await runSmartPosSync(client, currentData, nowUtc.toISOString())

    const pad = (n: number) => String(n).padStart(2, '0')
    const brtHours = (nowUtc.getUTCHours() - 3 + 24) % 24
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
        origem: 'SmartPOS API Oficial v1 (cron)',
      },
      origem: `SmartPOS API Sync (${recomputed.products.length} SKUs 100% integrados via API)`,
    }

    const newDataset = { summary: updatedSummary, products: recomputed.products }
    InventoryService.updateData(newDataset)

    await commitFileToRepo({
      path: 'lib/data/inventoryData.json',
      content: JSON.stringify(newDataset, null, 2),
      message: 'chore(sync): automatic sales-decrement stock sync (cron)',
    })
    await triggerVercelRedeploy()

    return NextResponse.json(
      { success: true, message: `Cron de decremento concluído: ${recomputed.products.length} SKUs.` },
      { headers: NO_STORE_HEADERS }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro no cron de decremento de estoque.'
    return NextResponse.json({ success: false, message }, { status: 500, headers: NO_STORE_HEADERS })
  }
}
