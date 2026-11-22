import { SmartPosSale, SmartPosSaleItem } from '../api/clientAdapter'
import { round2 } from './round'
import { productKeyOf } from './productKey'

export interface CommercialKpis {
  grossRevenue: number
  discounts: number
  netRevenue: number
  ordersCount: number
  itemsSoldCount: number
  averageTicket: number
  averageItemPrice: number
  grossProfit: number
  grossMarginPct: number | null
}

/**
 * `sales`/`items` are expected to already be pre-filtered by the caller (SmartPosClient.getSales
 * excludes isCanceled/isBudget at the source). This function never fetches or re-filters data.
 */
export function computeCommercialKpis(sales: SmartPosSale[], items: SmartPosSaleItem[]): CommercialKpis {
  let grossRevenue = 0
  let discounts = 0
  let netRevenue = 0
  for (const sale of sales) {
    grossRevenue += Number(sale.totalAmount) || 0
    discounts += Number(sale.discountAmount) || 0
    netRevenue += Number(sale.netAmount) || 0
  }

  let itemsSoldCount = 0
  let itemsNetRevenue = 0
  let grossProfit = 0
  for (const item of items) {
    itemsSoldCount += Number(item.quantity) || 0
    itemsNetRevenue += Number(item.netItem) || 0
    grossProfit += Number(item.profit) || 0
  }

  const ordersCount = sales.length
  const averageTicket = ordersCount > 0 ? round2(netRevenue / ordersCount) : 0
  const averageItemPrice = itemsSoldCount > 0 ? round2(itemsNetRevenue / itemsSoldCount) : 0
  const grossMarginPct = netRevenue !== 0 ? round2((grossProfit / netRevenue) * 100) : null

  return {
    grossRevenue: round2(grossRevenue),
    discounts: round2(discounts),
    netRevenue: round2(netRevenue),
    ordersCount,
    itemsSoldCount,
    averageTicket,
    averageItemPrice,
    grossProfit: round2(grossProfit),
    grossMarginPct,
  }
}

export interface GrowthComparison {
  currentValue: number
  previousValue: number
  deltaAbsolute: number
  /** null when previousValue is 0 — growth is undefined, not 0% nor Infinity. */
  deltaPct: number | null
}

export function computeGrowth(currentValue: number, previousValue: number): GrowthComparison {
  const deltaAbsolute = round2(currentValue - previousValue)
  const deltaPct = previousValue !== 0 ? round2((deltaAbsolute / previousValue) * 100) : null
  return {
    currentValue: round2(currentValue),
    previousValue: round2(previousValue),
    deltaAbsolute,
    deltaPct,
  }
}

export interface GoalProgress {
  actual: number
  goal: number | null
  /** null when there is no goal registered (goal === null) or it is zero. */
  progressPct: number | null
}

export function computeGoalProgress(actual: number, goal: number | null): GoalProgress {
  const progressPct = goal !== null && goal !== 0 ? round2((actual / goal) * 100) : null
  return { actual: round2(actual), goal, progressPct }
}

export interface AveragePriceByProductRow {
  productKey: string
  productName: string
  quantity: number
  averagePrice: number
}

export function computeAveragePricePerProduct(items: SmartPosSaleItem[]): AveragePriceByProductRow[] {
  const map = new Map<string, { productName: string; quantity: number; netRevenue: number }>()

  for (const item of items) {
    const key = productKeyOf(item)
    const entry = map.get(key) || { productName: item.product?.name || key, quantity: 0, netRevenue: 0 }
    entry.quantity += Number(item.quantity) || 0
    entry.netRevenue += Number(item.netItem) || 0
    map.set(key, entry)
  }

  return Array.from(map.entries()).map(([productKey, entry]) => ({
    productKey,
    productName: entry.productName,
    quantity: entry.quantity,
    averagePrice: entry.quantity > 0 ? round2(entry.netRevenue / entry.quantity) : 0,
  }))
}
