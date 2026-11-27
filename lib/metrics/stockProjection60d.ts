import { ProductItem } from '../../types/inventory'
import { round2 } from './round'

const PROJECTION_WINDOW_DAYS = 60
const URGENT_DAYS_THRESHOLD = 15
const HIGH_DAYS_THRESHOLD = 30

export type StockProjectionPriority = 'URGENTE' | 'ALTA' | 'MEDIA'

export interface StockProjectionRow {
  codigo: string
  produto: string
  categoria: string
  fabricante: string
  estoqueAtual: number
  estoqueMinimo: number | null
  unitsSoldLast60Days: number
  dailyVelocity: number
  daysToStockout: number | null
  deficitEstoqueMinimo: number
  projectedDemand60: number
  sugestaoCompraQtd: number
  custoUnitario: number
  investimentoNecessario: number
  prioridade: StockProjectionPriority
}

export interface SoldQuantityRecord {
  codigo: string
  quantity: number
}

/**
 * Combines live SmartPOS sales velocity (trailing 60 days) with the static estoque_minimo
 * deficit rule to project stockouts and suggest a purchase quantity that covers whichever is
 * larger: today's static deficit, or the next-60-days demand (flat projection — assumes the
 * trailing 60-day pace repeats). Only includes products already critical by the static rule or
 * projected to run out within `PROJECTION_WINDOW_DAYS` at current velocity.
 */
export function buildStockProjection60d(products: ProductItem[], soldRecords: SoldQuantityRecord[]): StockProjectionRow[] {
  const soldByCode = new Map<string, number>()
  for (const record of soldRecords) {
    soldByCode.set(record.codigo, (soldByCode.get(record.codigo) || 0) + record.quantity)
  }

  const rows: StockProjectionRow[] = []

  for (const p of products) {
    const unitsSoldLast60Days = soldByCode.get(p.codigo) || 0
    const dailyVelocity = unitsSoldLast60Days / PROJECTION_WINDOW_DAYS
    const daysToStockout = dailyVelocity > 0 ? p.estoque / dailyVelocity : null

    const staticallyLow = p.estoque_minimo !== null && p.estoque < p.estoque_minimo
    const atRiskByVelocity = daysToStockout !== null && daysToStockout <= PROJECTION_WINDOW_DAYS
    if (!staticallyLow && !atRiskByVelocity && p.estoque > 0) continue

    const deficitEstoqueMinimo = p.estoque_minimo !== null ? Math.max(0, p.estoque_minimo - p.estoque) : 0
    const projectedDemand60 = unitsSoldLast60Days
    const sugestaoCompraQtd = Math.max(0, Math.max(deficitEstoqueMinimo, projectedDemand60 - p.estoque))

    const prioridade: StockProjectionPriority =
      p.estoque <= 0 || (daysToStockout !== null && daysToStockout <= URGENT_DAYS_THRESHOLD)
        ? 'URGENTE'
        : daysToStockout !== null && daysToStockout <= HIGH_DAYS_THRESHOLD
          ? 'ALTA'
          : 'MEDIA'

    rows.push({
      codigo: p.codigo,
      produto: p.produto,
      categoria: p.categoria,
      fabricante: p.fabricante,
      estoqueAtual: p.estoque,
      estoqueMinimo: p.estoque_minimo,
      unitsSoldLast60Days,
      dailyVelocity: round2(dailyVelocity),
      daysToStockout: daysToStockout !== null ? Math.ceil(daysToStockout) : null,
      deficitEstoqueMinimo,
      projectedDemand60,
      sugestaoCompraQtd,
      custoUnitario: p.custo,
      investimentoNecessario: round2(sugestaoCompraQtd * p.custo),
      prioridade,
    })
  }

  const priorityRank: Record<StockProjectionPriority, number> = { URGENTE: 0, ALTA: 1, MEDIA: 2 }
  return rows.sort((a, b) => {
    if (priorityRank[a.prioridade] !== priorityRank[b.prioridade]) {
      return priorityRank[a.prioridade] - priorityRank[b.prioridade]
    }
    return b.investimentoNecessario - a.investimentoNecessario
  })
}
