import { SmartPosClient } from '@/lib/api/clientAdapter'
import { classifyProductFamily, TOP_PRODUCT_FAMILIES } from '@/lib/domain/familyClassifier'
import { SalesFamilyRow, SalesRankingReport } from '@/types/inventory'

interface CachedSalesEntry {
  expiresAt: number
  report: SalesRankingReport
}

const CACHE_TTL_MS = 5 * 60 * 1000
const salesCache = new Map<string, CachedSalesEntry>()

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function getFallbackSalesSnapshot(startDate: string, endDate: string, notice?: string): SalesRankingReport {
  const top11: SalesFamilyRow[] = [
    { rank: 1, produto: 'SERINGAS', participacaoPct: 18.64, vendas: 8530.0, vendLucPct: 14.73, lucroBruto: 2689.0 },
    { rank: 2, produto: 'SORO', participacaoPct: 10.61, vendas: 4855.0, vendLucPct: 10.53, lucroBruto: 1923.0 },
    { rank: 3, produto: 'CATETER', participacaoPct: 9.46, vendas: 4330.0, vendLucPct: 10.9, lucroBruto: 1990.0 },
    { rank: 4, produto: 'TUBOS COLETA', participacaoPct: 7.25, vendas: 3315.78, vendLucPct: 9.19, lucroBruto: 1678.01 },
    { rank: 5, produto: 'LUVAS', participacaoPct: 6.41, vendas: 2931.31, vendLucPct: 6.33, lucroBruto: 1155.11 },
    { rank: 6, produto: 'COMPRESSA GAZE', participacaoPct: 4.83, vendas: 2208.63, vendLucPct: 5.71, lucroBruto: 1043.31 },
    { rank: 7, produto: 'ESPARADRAPO', participacaoPct: 3.57, vendas: 1634.38, vendLucPct: 4.34, lucroBruto: 791.98 },
    { rank: 8, produto: 'SONDA TOM CAT', participacaoPct: 3.04, vendas: 1392.7, vendLucPct: 3.71, lucroBruto: 677.5 },
    { rank: 9, produto: 'FIO NYLON', participacaoPct: 3.0, vendas: 1373.81, vendLucPct: 3.53, lucroBruto: 645.1 },
    { rank: 10, produto: 'EQUIPO TRANSFUSÃO', participacaoPct: 2.85, vendas: 1302.0, vendLucPct: 3.17, lucroBruto: 579.0 },
    { rank: 11, produto: 'POLIGLACTINA', participacaoPct: 2.65, vendas: 1214.52, vendLucPct: 2.93, lucroBruto: 535.4 },
  ]

  const demais: SalesFamilyRow = {
    rank: null,
    produto: 'DEMAIS',
    participacaoPct: 28.0,
    vendas: 12675.46,
    vendLucPct: 24.93,
    lucroBruto: 4551.51,
  }

  const total: SalesFamilyRow = {
    rank: null,
    produto: 'TOTAL',
    participacaoPct: 100.0,
    vendas: 45763.59,
    vendLucPct: 100.0,
    lucroBruto: 18258.92,
  }

  return {
    startDate,
    endDate,
    totalSalesCount: 110,
    top11,
    demais,
    total,
    top11ShareVendasPct: 72,
    top11ShareLucroPct: 75,
    origem: 'snapshot',
    notice,
  }
}

export class DashboardService {
  public static async getSalesRanking(startDate: string, endDate: string): Promise<SalesRankingReport> {
    const cacheKey = `${startDate}__${endDate}`
    const cached = salesCache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) {
      return cached.report
    }

    const client = new SmartPosClient()
    if (!client.hasCredentials()) {
      return getFallbackSalesSnapshot(
        startDate,
        endDate,
        'Exibindo snapshot de referência (configure SMARTPOS_KEY_ID e SMARTPOS_KEY_SECRET para consulta ao vivo).'
      )
    }

    try {
      const { sales, items } = await client.getSalesItemsForPeriod(startDate, endDate)

      const buckets = new Map<string, { vendas: number; lucro: number }>()
      TOP_PRODUCT_FAMILIES.forEach((fam) => buckets.set(fam, { vendas: 0, lucro: 0 }))
      buckets.set('DEMAIS', { vendas: 0, lucro: 0 })

      let totalVendas = 0
      let totalLucro = 0

      for (const item of items) {
        const fam = classifyProductFamily(item.product?.name || '')
        const entry = buckets.get(fam) || buckets.get('DEMAIS')!
        const net = Number(item.netItem || 0)
        const profit = Number(item.profit || 0)
        entry.vendas += net
        entry.lucro += profit
        totalVendas += net
        totalLucro += profit
      }

      const top11Raw = TOP_PRODUCT_FAMILIES.map((fam) => {
        const val = buckets.get(fam)!
        return {
          produto: fam,
          vendas: round2(val.vendas),
          lucroBruto: round2(val.lucro),
          participacaoPct: totalVendas > 0 ? round2((val.vendas / totalVendas) * 100) : 0,
          vendLucPct: totalLucro > 0 ? round2((val.lucro / totalLucro) * 100) : 0,
        }
      }).sort((a, b) => b.vendas - a.vendas)

      const top11: SalesFamilyRow[] = top11Raw.map((row, idx) => ({
        rank: idx + 1,
        ...row,
      }))

      const demaisVal = buckets.get('DEMAIS')!
      const demais: SalesFamilyRow = {
        rank: null,
        produto: 'DEMAIS',
        vendas: round2(demaisVal.vendas),
        lucroBruto: round2(demaisVal.lucro),
        participacaoPct: totalVendas > 0 ? round2((demaisVal.vendas / totalVendas) * 100) : 0,
        vendLucPct: totalLucro > 0 ? round2((demaisVal.lucro / totalLucro) * 100) : 0,
      }

      const total: SalesFamilyRow = {
        rank: null,
        produto: 'TOTAL',
        vendas: round2(totalVendas),
        lucroBruto: round2(totalLucro),
        participacaoPct: 100,
        vendLucPct: 100,
      }

      const top11Vendas = top11.reduce((acc, r) => acc + r.vendas, 0)
      const top11Lucro = top11.reduce((acc, r) => acc + r.lucroBruto, 0)

      const report: SalesRankingReport = {
        startDate,
        endDate,
        totalSalesCount: sales.length,
        top11,
        demais,
        total,
        top11ShareVendasPct: totalVendas > 0 ? Math.round((top11Vendas / totalVendas) * 100) : 0,
        top11ShareLucroPct: totalLucro > 0 ? Math.round((top11Lucro / totalLucro) * 100) : 0,
        origem: 'smartpos_api',
      }

      salesCache.set(cacheKey, {
        expiresAt: Date.now() + CACHE_TTL_MS,
        report,
      })

      return report
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido na API SmartPOS'
      return getFallbackSalesSnapshot(
        startDate,
        endDate,
        `Falha temporária na SmartPOS (${msg}). Exibindo snapshot de referência.`
      )
    }
  }
}

