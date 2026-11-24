import { AbcClass } from '../../types/inventory'
import { SmartPosSaleItem } from '../api/clientAdapter'
import { productKeyOf } from './productKey'
import { round2 } from './round'

/**
 * Cutoffs for the sales-based ABC curve — intentionally separate from the inline 80/95 cutoffs
 * used by the stock-based ABC curve in lib/domain/recomputeInventory.ts (different indicator,
 * different data source). Kept as a single configurable constant per the Phase 2 requirement.
 */
export const ABC_SALES_CUTOFFS = { A: 80, B: 95 } as const

export interface ProductSalesAggregate {
  productKey: string
  productName: string
  categoria: string | null
  quantity: number
  netRevenue: number
  profit: number
}

export function aggregateSalesByProduct(items: SmartPosSaleItem[]): ProductSalesAggregate[] {
  const map = new Map<string, ProductSalesAggregate>()

  for (const item of items) {
    const key = productKeyOf(item)
    const entry =
      map.get(key) ||
      ({
        productKey: key,
        productName: item.product?.name || key,
        categoria: item.product?.category?.description || null,
        quantity: 0,
        netRevenue: 0,
        profit: 0,
      } as ProductSalesAggregate)

    entry.quantity += Number(item.quantity) || 0
    entry.netRevenue += Number(item.netItem) || 0
    entry.profit += Number(item.profit) || 0
    map.set(key, entry)
  }

  return Array.from(map.values()).map((entry) => ({
    ...entry,
    netRevenue: round2(entry.netRevenue),
    profit: round2(entry.profit),
  }))
}

export interface SalesAbcRow extends ProductSalesAggregate {
  rank: number
  participationPct: number
  cumulativePct: number
  marginPct: number | null
  curvaAbcVendas: AbcClass
}

/**
 * Builds the sales-based ABC curve: products ranked by net revenue, with cumulative share and
 * class. Negative net revenue (a product whose discounts exceeded its sales in the period) is
 * kept as-is on its own row, but only clamped to 0 for the cumulative-percentage denominator and
 * running total — mirroring the same clamping rule already used by the stock-based ABC curve in
 * lib/domain/recomputeInventory.ts, so neither curve ever divides by a negative total.
 */
export function buildSalesAbcCurve(
  items: SmartPosSaleItem[],
  cutoffs: { A: number; B: number } = ABC_SALES_CUTOFFS
): SalesAbcRow[] {
  const sorted = aggregateSalesByProduct(items).sort((a, b) => {
    if (b.netRevenue !== a.netRevenue) return b.netRevenue - a.netRevenue
    return a.productKey.localeCompare(b.productKey)
  })

  const totalNetRevenue = sorted.reduce((acc, p) => acc + Math.max(0, p.netRevenue), 0)

  let acc = 0
  return sorted.map((entry, idx) => {
    acc += Math.max(0, entry.netRevenue)
    const cumulativePct = totalNetRevenue > 0 ? round2((acc / totalNetRevenue) * 100) : 100
    const participationPct = totalNetRevenue > 0 ? round2((Math.max(0, entry.netRevenue) / totalNetRevenue) * 100) : 0
    const curvaAbcVendas: AbcClass = cumulativePct <= cutoffs.A ? 'A' : cumulativePct <= cutoffs.B ? 'B' : 'C'
    const marginPct = entry.netRevenue !== 0 ? round2((entry.profit / entry.netRevenue) * 100) : null

    return {
      ...entry,
      rank: idx + 1,
      participationPct,
      cumulativePct,
      marginPct,
      curvaAbcVendas,
    }
  })
}
