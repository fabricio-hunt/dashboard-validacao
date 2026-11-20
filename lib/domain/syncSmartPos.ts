import { SmartPosClient } from '@/lib/api/clientAdapter'
import { ProductItem } from '@/types/inventory'
import { extractExpirationFromText, computeExpirationMetrics } from '@/lib/domain/expirationDate'
import {
  computeDerivedProductFields,
  dedupeLegacyTransitionRows,
  recomputeDataset,
  applySalesDecrement,
  round2,
  InventoryDataset,
} from '@/lib/domain/recomputeInventory'
import { ensureBaseline } from '@/lib/domain/stockFidelity'

export interface SyncResult {
  dataset: InventoryDataset
  produtosApi: number
}

/**
 * Rebuilds the catalog from SmartPOS (source of truth for identity/price/category) and
 * recomputes physical stock by decrementing each product's own baseline by units actually
 * sold since that baseline — the only automatic signal available, since SmartPOS exposes no
 * endpoint for incoming stock/purchases. Shared by the manual "Sincronizar Agora" route and
 * the scheduled cron route so both apply the exact same logic.
 */
export async function runSmartPosSync(
  client: SmartPosClient,
  currentData: InventoryDataset,
  nowIso: string = new Date().toISOString()
): Promise<SyncResult> {
  const apiProducts = await client.getAllProducts()
  if (!Array.isArray(apiProducts) || apiProducts.length === 0) {
    throw new Error('Nenhum produto retornado pela API da SmartPOS.')
  }

  const currentByCode = new Map<string, ProductItem>()
  currentData.products.forEach((p) => {
    if (p.codigo) currentByCode.set(p.codigo.trim(), p)
  })

  const refDate = new Date(nowIso)

  const rebuiltCatalog: ProductItem[] = apiProducts.map((ap) => {
    const code = String(ap.alphaCode || ap.id || '').trim()
    const existingProd = currentByCode.get(code)

    const produtoNome = (ap.name || existingProd?.produto || '').trim()
    const custo = ap.costValue && ap.costValue > 0 ? round2(ap.costValue) : existingProd?.custo || 0
    const venda = ap.sellValue && ap.sellValue > 0 ? round2(ap.sellValue) : existingProd?.valor_venda || 0
    const categoria = ap.category?.description ? ap.category.description.trim() : existingProd?.categoria || 'Outros'
    const fabricante = ap.supplier?.companyName
      ? ap.supplier.companyName.trim().toUpperCase()
      : existingProd?.fabricante || 'NÃO ESPECIFICADO'

    const minimo =
      ap.minimumStock !== undefined && ap.minimumStock !== null
        ? Number(ap.minimumStock)
        : existingProd?.estoque_minimo ?? null

    // Saldo físico: SmartPOS só confirma "zerado" (noStock) ou nada. Fora desse sinal, o saldo
    // vem do decremento por vendas (aplicado depois, em applySalesDecrement) a partir do baseline.
    let estoque: number
    let baselineEstoque: number
    let baselineAt: string
    if (ap.noStock === true) {
      estoque = 0
      baselineEstoque = 0
      baselineAt = nowIso
    } else if (existingProd) {
      estoque = existingProd.estoque ?? 0
      baselineEstoque = existingProd.baseline_estoque ?? existingProd.estoque ?? 0
      baselineAt = existingProd.baseline_at || nowIso
    } else {
      estoque = 0
      baselineEstoque = 0
      baselineAt = nowIso
    }

    const expParsed = extractExpirationFromText(produtoNome)
    const validadeIso = expParsed.valid ? expParsed.iso : existingProd?.validade_iso ?? null
    const validadeDisplay = expParsed.valid ? expParsed.formatted : existingProd?.validade ?? 'N/I'

    const ltMatch = /(?:LT|LOTE)\.?:?\s*([A-Za-z0-9\.\/-]+)/i.exec(produtoNome)
    const lote = ltMatch ? ltMatch[1].replace(/[ .:-]/g, '') : existingProd?.lote ?? 'N/I'

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
      baseline_estoque: baselineEstoque,
      baseline_at: baselineAt,
      ...derived,
      curva_abc: 'C',
      curva_abc_acumulada_pct: 100,
    }
  })

  const deduped = dedupeLegacyTransitionRows(rebuiltCatalog).map((p) => ensureBaseline(p, nowIso))

  const baselineTimestamps = deduped
    .map((p) => new Date(p.baseline_at).getTime())
    .filter((ms) => Number.isFinite(ms))

  let dataset: InventoryDataset
  if (baselineTimestamps.length > 0 && client.hasCredentials()) {
    const earliestBaseline = new Date(Math.min(...baselineTimestamps))
    const startDate = earliestBaseline.toISOString().slice(0, 10)
    const soldRecords = await client.getSoldQuantitiesSince(startDate)
    dataset = applySalesDecrement({ summary: currentData.summary, products: deduped }, soldRecords)
  } else {
    dataset = recomputeDataset(currentData.summary, deduped)
  }

  return { dataset, produtosApi: apiProducts.length }
}
