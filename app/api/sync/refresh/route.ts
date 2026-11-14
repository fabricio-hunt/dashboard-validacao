import { NextRequest, NextResponse } from 'next/server'
import { SmartPosClient, SmartPosProduct } from '@/lib/api/clientAdapter'
import { InventoryService } from '@/lib/api/inventoryService'
import { extractExpirationFromText, computeExpirationMetrics } from '@/lib/domain/expirationDate'
import { ProductItem, DashboardSummary, CategorySummary, AbcClass } from '@/types/inventory'

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

    const apiByName = new Map<string, SmartPosProduct>()
    apiProducts.forEach((p) => {
      if (p.name) apiByName.set(p.name.trim().toLowerCase(), p)
    })

    const refDate = new Date()
    let updatedCount = 0

    const rebuiltProducts: ProductItem[] = currentProducts.map((prod) => {
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

      const expParsed = extractExpirationFromText(produtoNome)
      const validadeIso = expParsed.valid ? expParsed.iso : prod.validade_iso
      const validadeDisplay = expParsed.valid ? expParsed.formatted : prod.validade

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

    const totalSkus = rebuiltProducts.length
    const totalUnidades = rebuiltProducts.reduce((acc, p) => acc + (p.estoque || 0), 0)
    const valorTotalCusto = round2(rebuiltProducts.reduce((acc, p) => acc + p.valor_total_custo, 0))
    const valorTotalVenda = round2(rebuiltProducts.reduce((acc, p) => acc + p.valor_total_venda, 0))
    const lucroPotencialTotal = round2(valorTotalVenda - valorTotalCusto)
    const margemMedia = totalSkus > 0 ? round2(rebuiltProducts.reduce((acc, p) => acc + p.margem_percentual, 0) / totalSkus) : 0
    const markupMedio = totalSkus > 0 ? round2(rebuiltProducts.reduce((acc, p) => acc + p.markup_percentual, 0) / totalSkus) : 0

    // Curva ABC
    rebuiltProducts.sort((a, b) => b.valor_total_venda - a.valor_total_venda)
    let accVal = 0
    for (const p of rebuiltProducts) {
      accVal += Math.max(0, p.valor_total_venda)
      const pct = valorTotalVenda > 0 ? round2((accVal / valorTotalVenda) * 100) : 100
      p.curva_abc_acumulada_pct = pct
      p.curva_abc = pct <= 80 ? 'A' : pct <= 95 ? 'B' : 'C'
    }

    const abcSummary = {
      A: {
        classe: 'A' as AbcClass,
        skus: rebuiltProducts.filter((p) => p.curva_abc === 'A').length,
        valor_venda: round2(rebuiltProducts.filter((p) => p.curva_abc === 'A').reduce((acc, p) => acc + p.valor_total_venda, 0)),
        descricao: '80% do valor imobilizado (Alta Prioridade de Gestão)',
      },
      B: {
        classe: 'B' as AbcClass,
        skus: rebuiltProducts.filter((p) => p.curva_abc === 'B').length,
        valor_venda: round2(rebuiltProducts.filter((p) => p.curva_abc === 'B').reduce((acc, p) => acc + p.valor_total_venda, 0)),
        descricao: '15% do valor imobilizado (Média Prioridade)',
      },
      C: {
        classe: 'C' as AbcClass,
        skus: rebuiltProducts.filter((p) => p.curva_abc === 'C').length,
        valor_venda: round2(rebuiltProducts.filter((p) => p.curva_abc === 'C').reduce((acc, p) => acc + p.valor_total_venda, 0)),
        descricao: '5% do valor imobilizado (Cauda Longa / Giro Pontual)',
      },
    }

    // Categorias
    const catMap = new Map<string, CategorySummary>()
    for (const p of rebuiltProducts) {
      const c = p.categoria || 'Outros'
      let entry = catMap.get(c)
      if (!entry) {
        entry = {
          categoria: c,
          skus: 0,
          unidades: 0,
          valor_custo: 0,
          valor_venda: 0,
          lucro_potencial: 0,
          itens_zerados: 0,
          itens_criticos: 0,
          itens_excesso: 0,
          participacao_venda_pct: 0,
        }
        catMap.set(c, entry)
      }
      entry.skus += 1
      entry.unidades += p.estoque
      entry.valor_custo += p.valor_total_custo
      entry.valor_venda += p.valor_total_venda
      entry.lucro_potencial += p.lucro_potencial
      if (p.status_estoque === 'ZERADO') entry.itens_zerados += 1
      else if (p.status_estoque === 'CRITICO') entry.itens_criticos += 1
    }

    const categoriesList = Array.from(catMap.values())
      .map((cat) => ({
        ...cat,
        valor_custo: round2(cat.valor_custo),
        valor_venda: round2(cat.valor_venda),
        lucro_potencial: round2(cat.lucro_potencial),
        participacao_venda_pct: valorTotalVenda > 0 ? round2((cat.valor_venda / valorTotalVenda) * 100) : 0,
      }))
      .sort((a, b) => b.valor_venda - a.valor_venda)

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
      origem: 'SmartPOS API',
    }

    // Calcula Top11 de estoque
    const estoqueTop11 = InventoryService.getStockTop11Report(rebuiltProducts)

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
      curva_abc: abcSummary,
      categorias: categoriesList,
      estoque_top11: estoqueTop11,
      last_sync_at: nowUtc.toISOString(),
      last_sync_brt: lastSyncBrt,
      sync_metadata: syncMetadata,
      origem: `SmartPOS API Sync (${apiProducts.length} catálogo / ${updatedCount} conciliados)`,
    }

    const newDataset = {
      summary: updatedSummary,
      products: rebuiltProducts,
    }

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
