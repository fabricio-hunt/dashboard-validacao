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
    const currentByCode = new Map<string, ProductItem>()
    currentProducts.forEach((p) => {
      if (p.codigo) currentByCode.set(p.codigo.trim(), p)
    })

    const refDate = new Date()

    // O Catálogo mestre é derivado exclusivamente dos produtos ativos retornados pela API SmartPOS
    const rebuiltProducts: ProductItem[] = apiProducts.map((ap) => {
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

      const lucroUnit = round2(venda - custo)
      const margemPerc = venda > 0 ? round2((lucroUnit / venda) * 100) : 0
      const markupPerc = custo > 0 ? round2((lucroUnit / custo) * 100) : 0
      const valorTotalCusto = round2(custo * estoque)
      const valorTotalVenda = round2(venda * estoque)
      const lucroPotencial = round2(valorTotalVenda - valorTotalCusto)

      const metrics = computeExpirationMetrics(validadeIso, refDate)

      let statusEstoque: 'NEGATIVO' | 'ZERADO' | 'CRITICO' | 'ALERTA' | 'NORMAL' = 'NORMAL'
      if (estoque < 0) statusEstoque = 'NEGATIVO'
      else if (estoque === 0) statusEstoque = 'ZERADO'
      else if (minimo !== null && estoque < minimo) statusEstoque = 'CRITICO'
      else if (minimo !== null && estoque <= minimo * 1.2) statusEstoque = 'ALERTA'

      const sugestaoQtd = minimo !== null && estoque < minimo ? Math.max(0, Math.floor(minimo - estoque)) : 0
      const sugestaoCusto = round2(sugestaoQtd * custo)

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
        lucro_unitario: lucroUnit,
        margem_percentual: margemPerc,
        markup_percentual: markupPerc,
        estoque,
        estoque_minimo: minimo,
        status_estoque: statusEstoque,
        sugestao_compra_qtd: sugestaoQtd,
        sugestao_compra_custo: sugestaoCusto,
        valor_total_custo: valorTotalCusto,
        valor_total_venda: valorTotalVenda,
        lucro_potencial: lucroPotencial,
        curva_abc: 'C',
        curva_abc_acumulada_pct: 100,
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
      skus_conciliados: rebuiltProducts.length,
      origem: 'SmartPOS API Oficial v1',
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
      origem: `SmartPOS API Sync (${rebuiltProducts.length} SKUs 100% integrados via API)`,
    }

    const newDataset = {
      summary: updatedSummary,
      products: rebuiltProducts,
    }

    InventoryService.updateData(newDataset)
    lastManualSyncTime = now

    return NextResponse.json({
      success: true,
      message: `Sincronização concluída com sucesso! ${rebuiltProducts.length} SKUs do catálogo SmartPOS atualizados em tempo real.`,
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
