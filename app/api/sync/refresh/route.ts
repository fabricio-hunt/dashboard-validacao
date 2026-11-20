import { NextRequest, NextResponse } from 'next/server'
import { SmartPosClient } from '@/lib/api/clientAdapter'
import { InventoryService } from '@/lib/api/inventoryService'
import { extractExpirationFromText, computeExpirationMetrics } from '@/lib/domain/expirationDate'
import { ProductItem } from '@/types/inventory'
import {
  computeDerivedProductFields,
  dedupeLegacyTransitionRows,
  recomputeDataset,
  round2,
} from '@/lib/domain/recomputeInventory'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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
      { status: 429 }
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
      { status: 500 }
    )
  }

  try {
    const client = new SmartPosClient({ baseUrl, keyId, keySecret })
    const apiProducts = await client.getAllProducts()

    if (!Array.isArray(apiProducts) || apiProducts.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Nenhum produto retornado pela API da SmartPOS.' },
        { status: 502 }
      )
    }

    const currentData = InventoryService.getRawData()
    const currentProducts = currentData.products
    const currentByCode = new Map<string, ProductItem>()
    currentProducts.forEach((p) => {
      if (p.codigo) currentByCode.set(p.codigo.trim(), p)
    })

    const refDate = new Date()

    // O Catálogo mestre é derivado exclusivamente dos produtos ativos retornados pela API SmartPOS
    const apiProductsList: ProductItem[] = apiProducts.map((ap) => {
      const code = String(ap.alphaCode || ap.id || '').trim()
      const existingProd = currentByCode.get(code)

      const produtoNome = (ap.name || existingProd?.produto || '').trim()
      const custo = ap.costValue && ap.costValue > 0 ? round2(ap.costValue) : (existingProd?.custo || 0)
      const venda = ap.sellValue && ap.sellValue > 0 ? round2(ap.sellValue) : (existingProd?.valor_venda || 0)
      const categoria = ap.category?.description ? ap.category.description.trim() : (existingProd?.categoria || 'Outros')
      const fabricante = ap.supplier?.companyName ? ap.supplier.companyName.trim().toUpperCase() : (existingProd?.fabricante || 'NÃO ESPECIFICADO')

      const minimo = ap.minimumStock !== undefined && ap.minimumStock !== null ? Number(ap.minimumStock) : (existingProd?.estoque_minimo ?? null)

      // Saldo físico:
      // Se noStock for True na SmartPOS -> 0 unidades
      // Senão, se existia registro de saldo físico prévio no banco, preserva o saldo
      // Senão (novo item da API), inicia com 0
      let estoque = 0
      if (ap.noStock === true) {
        estoque = 0
      } else if (existingProd) {
        estoque = existingProd.estoque ?? 0
      } else {
        estoque = 0
      }

      const expParsed = extractExpirationFromText(produtoNome)
      const validadeIso = expParsed.valid ? expParsed.iso : (existingProd?.validade_iso ?? null)
      const validadeDisplay = expParsed.valid ? expParsed.formatted : (existingProd?.validade ?? 'N/I')

      const ltMatch = /(?:LT|LOTE)\.?:?\s*([A-Za-z0-9\.\/-]+)/i.exec(produtoNome)
      const lote = ltMatch ? ltMatch[1].replace(/[ .:-]/g, '') : (existingProd?.lote ?? 'N/I')

      const metrics = computeExpirationMetrics(validadeIso, refDate)
      const derived = computeDerivedProductFields(custo, venda, estoque, minimo)

      const parts = produtoNome.split(' - ')
      const nomeResumido = parts.length > 0 ? parts[0].trim() : produtoNome

      return {
        id: existingProd?.id || `prod-${ap.id}`,
        codigo: code,
        produto: produtoNome,
        nome_resumido: nomeResumido,
        fabricante,
        lote,
        validade_iso: validadeIso,
        validade: validadeDisplay,
        dias_para_vencer: metrics.dias_para_vencer,
        status_validade: metrics.status_validade,
        categoria,
        custo,
        valor_venda: venda,
        estoque,
        estoque_minimo: minimo,
        ...derived,
        curva_abc: 'C',
        curva_abc_acumulada_pct: 100,
      }
    })

    const rebuiltProducts = dedupeLegacyTransitionRows(apiProductsList)

    // Horário de Brasília
    const nowUtc = new Date()
    const brtHours = (nowUtc.getUTCHours() - 3 + 24) % 24
    const pad = (n: number) => String(n).padStart(2, '0')
    const lastSyncBrt = `${pad(nowUtc.getUTCDate())}/${pad(
      nowUtc.getUTCMonth() + 1
    )}/${nowUtc.getUTCFullYear()} às ${pad(brtHours)}:${pad(nowUtc.getUTCMinutes())} (BRT)`

    const syncMetadata = {
      last_sync_at: nowUtc.toISOString(),
      last_sync_brt: lastSyncBrt,
      sync_status: 'SUCCESS' as const,
      produtos_api: apiProducts.length,
      skus_conciliados: rebuiltProducts.length,
      origem: 'SmartPOS API Oficial v1',
    }

    const recomputed = recomputeDataset(currentData.summary, rebuiltProducts)

    const updatedSummary = {
      ...recomputed.summary,
      last_sync_at: nowUtc.toISOString(),
      last_sync_brt: lastSyncBrt,
      sync_metadata: syncMetadata,
      origem: `SmartPOS API Sync (${rebuiltProducts.length} SKUs 100% integrados via API)`,
    }

    const newDataset = {
      summary: updatedSummary,
      products: recomputed.products,
    }

    InventoryService.updateData(newDataset)
    lastManualSyncTime = now

    return NextResponse.json(
      {
        success: true,
        message: `Sincronização concluída com sucesso! ${rebuiltProducts.length} SKUs do catálogo SmartPOS atualizados.`,
        last_sync_brt: lastSyncBrt,
        summary: updatedSummary,
        products: recomputed.products,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao sincronizar com SmartPOS'
    return NextResponse.json(
      { success: false, message },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        },
      }
    )
  }
}
