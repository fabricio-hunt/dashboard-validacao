import { SmartPosSale } from '../api/clientAdapter'
import { round2 } from './round'

export interface MonthlyRevenueRow {
  year: number
  month: number // 1-12
  grossRevenue: number
  netRevenue: number
  ordersCount: number
  profit: number
}

// Buckets by the calendar year/month exactly as reported in creationDate's own date prefix
// (e.g. "2026-11-01T10:00:00-04:00" -> 2026-11), rather than re-deriving it through Date/UTC
// math — this sidesteps any timezone-shift risk at month boundaries entirely, since we never
// convert the instant to a different offset before reading its calendar date.
const DATE_PREFIX_PATTERN = /^(\d{4})-(\d{2})-\d{2}/

/** Always returns exactly 12 rows (Jan-Dec), zero-filled for months with no sales. */
export function buildMonthlyRevenueSeries(sales: SmartPosSale[], year: number): MonthlyRevenueRow[] {
  const rows: MonthlyRevenueRow[] = Array.from({ length: 12 }, (_, idx) => ({
    year,
    month: idx + 1,
    grossRevenue: 0,
    netRevenue: 0,
    ordersCount: 0,
    profit: 0,
  }))

  for (const sale of sales) {
    const match = DATE_PREFIX_PATTERN.exec(sale.creationDate || '')
    if (!match) continue // invalid/missing creationDate: skip rather than miscategorize or throw

    const saleYear = Number(match[1])
    const saleMonth = Number(match[2])
    if (saleYear !== year || saleMonth < 1 || saleMonth > 12) continue

    const row = rows[saleMonth - 1]
    row.grossRevenue += Number(sale.totalAmount) || 0
    row.netRevenue += Number(sale.netAmount) || 0
    row.profit += Number(sale.profit) || 0
    row.ordersCount += 1
  }

  return rows.map((row) => ({
    ...row,
    grossRevenue: round2(row.grossRevenue),
    netRevenue: round2(row.netRevenue),
    profit: round2(row.profit),
  }))
}

export interface MonthlyYoYRow {
  month: number
  current: MonthlyRevenueRow
  previous: MonthlyRevenueRow
  netRevenueGrowthPct: number | null
}

export function compareYearOverYear(
  currentYearRows: MonthlyRevenueRow[],
  previousYearRows: MonthlyRevenueRow[]
): MonthlyYoYRow[] {
  if (currentYearRows.length !== 12 || previousYearRows.length !== 12) {
    throw new Error('compareYearOverYear expects both series to have exactly 12 monthly rows.')
  }

  return currentYearRows.map((current, idx) => {
    const previous = previousYearRows[idx]
    const netRevenueGrowthPct =
      previous.netRevenue !== 0 ? round2(((current.netRevenue - previous.netRevenue) / previous.netRevenue) * 100) : null
    return { month: current.month, current, previous, netRevenueGrowthPct }
  })
}
