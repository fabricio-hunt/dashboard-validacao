import assert from 'node:assert/strict'
import test from 'node:test'
import { SmartPosSale } from '../api/clientAdapter'
import { buildMonthlyRevenueSeries, compareYearOverYear } from './monthlyRevenue'

function sale(overrides: Partial<SmartPosSale> = {}): SmartPosSale {
  return {
    id: '1',
    uniqueIdentifier: 'u1',
    creationDate: '2026-11-01T10:00:00-04:00',
    isBudget: false,
    isCanceled: false,
    totalAmount: 100,
    discountAmount: 0,
    netAmount: 100,
    profit: 40,
    ...overrides,
  }
}

test('buildMonthlyRevenueSeries returns 12 zero-filled rows for an empty period', () => {
  const rows = buildMonthlyRevenueSeries([], 2026)
  assert.equal(rows.length, 12)
  assert.ok(rows.every((r) => r.grossRevenue === 0 && r.netRevenue === 0 && r.ordersCount === 0 && r.profit === 0))
  assert.deepEqual(rows.map((r) => r.month), Array.from({ length: 12 }, (_, i) => i + 1))
})

test('buildMonthlyRevenueSeries buckets strictly by the date prefix, with no month-boundary shift', () => {
  const sales = [
    sale({ creationDate: '2026-01-31T23:59:59-04:00', totalAmount: 10, netAmount: 10 }),
    sale({ creationDate: '2025-12-31T23:59:59-04:00', totalAmount: 999, netAmount: 999 }), // wrong year, must be excluded
    sale({ creationDate: '2026-02-01T00:00:01-04:00', totalAmount: 20, netAmount: 20 }),
  ]
  const rows = buildMonthlyRevenueSeries(sales, 2026)
  assert.equal(rows[0].grossRevenue, 10) // January
  assert.equal(rows[1].grossRevenue, 20) // February
  assert.ok(rows.slice(2).every((r) => r.grossRevenue === 0))
})

test('buildMonthlyRevenueSeries skips sales with an invalid/missing creationDate instead of throwing', () => {
  const sales = [sale({ creationDate: '' }), sale({ creationDate: 'not-a-date' })]
  assert.doesNotThrow(() => buildMonthlyRevenueSeries(sales, 2026))
  const rows = buildMonthlyRevenueSeries(sales, 2026)
  assert.ok(rows.every((r) => r.ordersCount === 0))
})

test('compareYearOverYear returns null growth for every month when the previous year is all zero', () => {
  const current = buildMonthlyRevenueSeries([sale()], 2026)
  const previous = buildMonthlyRevenueSeries([], 2025)
  const yoy = compareYearOverYear(current, previous)
  assert.equal(yoy.length, 12)
  for (const row of yoy) {
    if (row.previous.netRevenue === 0) assert.equal(row.netRevenueGrowthPct, null)
  }
  const november = yoy.find((r) => r.month === 11)!
  assert.equal(november.netRevenueGrowthPct, null)
})

test('compareYearOverYear computes growth for a month present in both years', () => {
  const current = buildMonthlyRevenueSeries([sale({ netAmount: 150 })], 2026)
  const previous = buildMonthlyRevenueSeries([sale({ creationDate: '2025-11-01T10:00:00-04:00', netAmount: 100 })], 2025)
  const yoy = compareYearOverYear(current, previous)
  const november = yoy.find((r) => r.month === 11)!
  assert.equal(november.netRevenueGrowthPct, 50)
})

test('compareYearOverYear throws if either series does not have exactly 12 rows (contract violation)', () => {
  assert.throws(() => compareYearOverYear([], buildMonthlyRevenueSeries([], 2025)))
})
