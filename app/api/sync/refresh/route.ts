import { NextRequest, NextResponse } from 'next/server'
import { SmartPosClient, SmartPosProduct } from '@/lib/api/clientAdapter'
import { InventoryService } from '@/lib/api/inventoryService'
import { extractExpirationFromText, computeExpirationMetrics } from '@/lib/domain/expirationDate'
import { ProductItem, DashboardSummary, CategorySummary, AbcClass } from '@/types/inventory'

// Memória de cooldown simples por instância serverless (mínimo 30 segundos)
let lastManualSyncTime = 0
const COOLDOWN_MS = 30 * 1000

export async function POST(req: NextRequest) {
  const now = Date.now()
  if (now - lastManualSyncTime < COOLDOWN_MS) {
    const waitSec = Math.ceil((COOLDOWN_MS - (now - lastManualSyncTime)) / 1000)
    return NextResponse.json(
      {
        success: false,
        message: `Sincronização executada recentemente. Aguarde ${waitSec} segundos para atualizar novamente.`,
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

    // Mapa por ID ou por código ou por nome limpo
    const apiById = new Map<number, SmartPosProduct>()
    const apiByName = new Map<string, SmartPosProduct>()

    apiProducts.forEach((p) => {
      if (p.id) apiById.set(p.id, p)
      if (p.name) apiByName.set(p.name.trim().toLowerCase(), p)
    })

    const refDate = new Date()
    let updatedCount = 0

    const rebuiltProducts: ProductItem[] = currentProducts.map((prod) => {
      // Tentar match por código no alphaCode ou pelo nome do produto
      const match =
        apiProducts.find((ap) => ap.alphaCode && ap.alphaCode.trim() === prod.codigo.trim()) ||
        apiByName.get(prod.produto.trim().toLowerCase()) ||
        apiProducts.find((ap) => ap.name && ap.name.toLowerCase().includes(prod.codigo.toLowerCase()))

      let produtoNome = prod.produto
      let custo = prod.custo
      let venda = prod.valor_venda
      let categoria = prod.categoria
      let fabricante = prod.fabricante

      if (match) {
        updatedCount++
        produtoNome = match.name || produtoNome
        if (match.costValue && match.costValue > 0) custo = round2(match.costValue)
        if (match.sellValue && match.sellValue > 0) venda = round2(match.sellValue)
        if (match.category?.description) categoria = match.category.description.trim()
        if (match.supplier?.companyName) fabricante = match.supplier.companyName.trim().toUpperCase()
      }

      // Extrai metadados do nome
      const expParsed = extractExpirationFromText(produtoNome)
      const validadeIso = expParsed.valid ? expParsed.iso : prod.validade_iso
      const validadeDisplay = expParsed.valid ? expParsed.formatted : prod.validade

      // Lote
      const ltMatch = /(?:LT|LOTE)\.?:?\s*([A-Za-z0-9\.\/-]+)/i.exec(produtoNome)
      const lote = ltMatch ? ltMatch[1].replace(/[ .:-]/g, '') : prod.lote

      const estoque = prod.estoque
      const minimo = prod.estoque_minimo

      const lucroUnit = round2(venda - custo)
      const margemPerc = venda > 0 ? round2((lucroUnit / venda) * 100) : 0
      const markupPerc = custo > 0 ? round2((lucroUnit / custo) * 100) : 0
      const valorTotalCusto = round2(custo * estoque)
      const valorTotalVenda = round2(venda * estoque)
      const lucroPotencial = round2(valorTotalVenda - valorTotalCusto)

      const metrics = computeExpirationMetrics(validadeIso, refDate)

      return {
        ...prod,
        produto: produtoNome,
        fabricante,
        lote,
        validade_iso: validadeIso,
        validade: validadeDisplay,
        dias_para_vencer: metrics.dias_para_vencer,
        status_validade: metrics.status_validade,
        categoria,
        custo,
        valor_venda: venda,
        lucro_unitario: lucroUnit,
        margem_percentual: margemPerc,
        markup_percentual: markupPerc,
        valor_total_custo: valorTotalCusto,
        valor_total_venda: valorTotalVenda,
        lucro_potencial: lucroPotencial,
      }
    })

    // Recalcula totais gerais
    const totalSkus = rebuiltProducts.length
    const totalUnidades = rebuiltProducts.reduce((acc, p) => acc + (p.estoque || 0), 0)
    const valorTotalCusto = round2(rebuiltProducts.reduce((acc, p) => acc + p.valor_total_custo, 0))
    const valorTotalVenda = round2(rebuiltProducts.reduce((acc, p) => acc + p.valor_total_venda, 0))
    const lucroPotencialTotal = round2(valorTotalVenda - valorTotalCusto)
    const margemMedia = valorTotalVenda > 0 ? round2((lucroPotencialTotal / valorTotalVenda) * 100) : 0
    const markupMedio = valorTotalCusto > 0 ? round2((lucroPotencialTotal / valorTotalCusto) * 100) : 0

    // Curva ABC
    rebuiltProducts.sort((a, b) => b.valor_total_venda - a.valor_total_venda)
    let accVal = 0
    for (const p of rebuiltProducts) {
      accVal += p.valor_total_venda
      const pct = valorTotalVenda > 0 ? round2((accVal / valorTotalVenda) * 100) : 0
      p.curva_abc_acumulada_pct = pct
      p.curva_abc = pct <= 80 ? 'A' : pct <= 95 ? 'B' : 'C'
    }

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
      skus_conciliados: updatedCount,
      origem: 'SmartPOS API (Manual)',
    }

    const updatedSummary: DashboardSummary = {
      ...currentData.summary,
      total_skus: totalSkus,
      total_unidades: totalUnidades,
      valor_total_custo: valorTotalCusto,
      valor_total_venda: valorTotalVenda,
      lucro_potencial_total: lucroPotencialTotal,
      margem_media: margemMedia,
      markup_medio: markupMedio,
      total_zerados: rebuiltProducts.filter((p) => p.status_estoque === 'ZERADO').length,
      total_criticos: rebuiltProducts.filter((p) => p.status_estoque === 'CRITICO').length,
      total_negativos: rebuiltProducts.filter((p) => p.status_estoque === 'NEGATIVO').length,
      total_alertas: rebuiltProducts.filter((p) => ['ZERADO', 'CRITICO', 'NEGATIVO'].includes(p.status_estoque)).length,
      total_vencidos: rebuiltProducts.filter((p) => p.status_validade === 'VENCIDO').length,
      total_vence_90d: rebuiltProducts.filter((p) => p.status_validade === 'CRITICO_90D').length,
      total_vence_180d: rebuiltProducts.filter((p) => p.status_validade === 'ATENCAO_180D').length,
      last_sync_at: nowUtc.toISOString(),
      last_sync_brt: lastSyncBrt,
      sync_metadata: syncMetadata,
      origem: `SmartPOS API Sync Direto (${apiProducts.length} catálogo / ${updatedCount} conciliados)`,
    }

    const newDataset = {
      summary: updatedSummary,
      products: rebuiltProducts,
    }

    // Atualiza cache em memória do servidor
    InventoryService.updateData(newDataset)
    lastManualSyncTime = now

    return NextResponse.json({
      success: true,
      message: `Sincronização concluída com sucesso! ${updatedCount} SKUs atualizados em tempo real.`,
      last_sync_brt: lastSyncBrt,
      summary: updatedSummary,
      products: rebuiltProducts,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao sincronizar com SmartPOS'
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
