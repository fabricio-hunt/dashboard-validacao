import assert from 'node:assert/strict'
import test from 'node:test'
import { SmartPosSale, SmartPosSaleItem } from '../api/clientAdapter'
import {
  computeAveragePricePerProduct,
  computeCommercialKpis,
  computeGoalProgress,
  computeGrowth,
} from './salesKpis'

function sale(overrides: Partial<SmartPosSale> = {}): SmartPosSale {
  return {
    id: '1',
    uniqueIdentifier: 'u1',
    creationDate: '2026-11-01T10:00:00-04:00',
    isBudget: false,
    isCanceled: false,
    totalAmount: 100,
    discountAmount: 10,
    netAmount: 90,
    profit: 30,
    ...overrides,
  }
}

function item(overrides: Partial<SmartPosSaleItem> = {}): SmartPosSaleItem {
  return {
    quantity: 2,
    costPrice: 10,
    listPrice: 50,
    usedPrice: 45,
    netItem: 90,
    profit: 30,
    product: { id: 1, name: 'PRODUTO TESTE' },
    ...overrides,
  }
}

test('computeCommercialKpis returns all zeros for a period with no sales', () => {
  const kpis = computeCommercialKpis([], [])
  assert.deepEqual(kpis, {
    grossRevenue: 0,
    discounts: 0,
    netRevenue: 0,
    ordersCount: 0,
    itemsSoldCount: 0,
    averageTicket: 0,
    averageItemPrice: 0,
    grossProfit: 0,
    grossMarginPct: null,
  })
})

test('computeCommercialKpis aggregates sales and items correctly', () => {
  const sales = [sale(), sale({ id: '2', totalAmount: 200, discountAmount: 20, netAmount: 180, profit: 60 })]
  const items = [item(), item({ quantity: 4, netItem: 180, profit: 60, product: { id: 1, name: 'PRODUTO TESTE' } })]

  const kpis = computeCommercialKpis(sales, items)
  assert.equal(kpis.grossRevenue, 300)
  assert.equal(kpis.discounts, 30)
  assert.equal(kpis.netRevenue, 270)
  assert.equal(kpis.ordersCount, 2)
  assert.equal(kpis.itemsSoldCount, 6)
  assert.equal(kpis.averageTicket, 135)
  assert.equal(kpis.averageItemPrice, 45)
  assert.equal(kpis.grossProfit, 90)
  assert.equal(kpis.grossMarginPct, round2Pct(90, 270))
})

function round2Pct(a: number, b: number) {
  return Math.round((a / b) * 100 * 100) / 100
}

test('computeCommercialKpis handles a discount larger than the gross sale (negative net) without crashing', () => {
  const sales = [sale({ totalAmount: 50, discountAmount: 80, netAmount: -30, profit: -40 })]
  const items = [item({ netItem: -30, profit: -40 })]

  const kpis = computeCommercialKpis(sales, items)
  assert.equal(kpis.netRevenue, -30)
  assert.equal(kpis.grossProfit, -40)
  assert.ok(Number.isFinite(kpis.grossMarginPct as number))
  assert.equal(kpis.grossMarginPct, round2Pct(-40, -30))
})

test('computeCommercialKpis treats a missing/zero cost item (profit still comes from the API) without throwing', () => {
  const sales = [sale()]
  const items = [item({ costPrice: 0, profit: 90 })]

  assert.doesNotThrow(() => computeCommercialKpis(sales, items))
  const kpis = computeCommercialKpis(sales, items)
  assert.equal(kpis.grossProfit, 90)
})

test('computeGrowth returns null deltaPct when the previous period is zero (undefined growth, not 0% or Infinity)', () => {
  const grown = computeGrowth(100, 0)
  assert.equal(grown.deltaPct, null)
  assert.equal(grown.deltaAbsolute, 100)

  const flat = computeGrowth(0, 0)
  assert.equal(flat.deltaPct, null)
  assert.equal(flat.deltaAbsolute, 0)
})

test('computeGrowth computes a normal percentage change', () => {
  const g = computeGrowth(150, 100)
  assert.equal(g.deltaAbsolute, 50)
  assert.equal(g.deltaPct, 50)
})

test('computeGoalProgress returns null progressPct when there is no goal or the goal is zero', () => {
  assert.equal(computeGoalProgress(100, null).progressPct, null)
  assert.equal(computeGoalProgress(100, 0).progressPct, null)
})

test('computeGoalProgress computes percentage reached towards a registered goal', () => {
  const p = computeGoalProgress(50, 200)
  assert.equal(p.progressPct, 25)
})

test('computeAveragePricePerProduct aggregates items of the same product across different sales into one row', () => {
  const items = [
    item({ product: { id: 1, name: 'SERINGA' }, quantity: 2, netItem: 20 }),
    item({ product: { id: 1, name: 'SERINGA' }, quantity: 3, netItem: 30 }),
    item({ product: { id: 2, name: 'SORO' }, quantity: 1, netItem: 15 }),
  ]

  const rows = computeAveragePricePerProduct(items)
  assert.equal(rows.length, 2)

  const seringa = rows.find((r) => r.productName === 'SERINGA')!
  assert.equal(seringa.quantity, 5)
  assert.equal(seringa.averagePrice, 10)

  const soro = rows.find((r) => r.productName === 'SORO')!
  assert.equal(soro.quantity, 1)
  assert.equal(soro.averagePrice, 15)
})

test('computeAveragePricePerProduct returns an empty list for no items', () => {
  assert.deepEqual(computeAveragePricePerProduct([]), [])
})
