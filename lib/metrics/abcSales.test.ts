import assert from 'node:assert/strict'
import test from 'node:test'
import { SmartPosSaleItem } from '../api/clientAdapter'
import { aggregateSalesByProduct, buildSalesAbcCurve } from './abcSales'

function item(overrides: Partial<SmartPosSaleItem> = {}): SmartPosSaleItem {
  return {
    quantity: 1,
    costPrice: 5,
    listPrice: 20,
    usedPrice: 18,
    netItem: 100,
    profit: 40,
    product: { id: 1, name: 'PRODUTO A' },
    ...overrides,
  }
}

test('buildSalesAbcCurve returns an empty list for no items', () => {
  assert.deepEqual(buildSalesAbcCurve([]), [])
})

test('buildSalesAbcCurve falls back cumulativePct to 100 when total net revenue is zero (all discounted to zero/negative)', () => {
  const items = [
    item({ product: { id: 1, name: 'A' }, netItem: 0, profit: 0 }),
    item({ product: { id: 2, name: 'B' }, netItem: -10, profit: -10 }),
  ]
  const rows = buildSalesAbcCurve(items)
  assert.equal(rows.length, 2)
  for (const row of rows) {
    assert.equal(row.cumulativePct, 100)
    assert.equal(row.participationPct, 0)
  }
})

test('buildSalesAbcCurve keeps the real (negative) netRevenue on its row while clamping only the accumulator', () => {
  const items = [
    item({ product: { id: 1, name: 'POSITIVO' }, netItem: 1000, profit: 400 }),
    item({ product: { id: 2, name: 'NEGATIVO' }, netItem: -50, profit: -50 }),
  ]
  const rows = buildSalesAbcCurve(items)
  const negative = rows.find((r) => r.productName === 'NEGATIVO')!
  assert.equal(negative.netRevenue, -50)
  assert.equal(negative.participationPct, 0)
  assert.equal(negative.marginPct, round2Pct(-50, -50))
})

function round2Pct(a: number, b: number) {
  return Math.round((a / b) * 100 * 100) / 100
}

test('buildSalesAbcCurve classifies A/B/C per the configured cutoffs', () => {
  const items = [
    item({ product: { id: 1, name: 'A1' }, netItem: 80, profit: 0 }),
    item({ product: { id: 2, name: 'B1' }, netItem: 15, profit: 0 }),
    item({ product: { id: 3, name: 'C1' }, netItem: 5, profit: 0 }),
  ]
  const rows = buildSalesAbcCurve(items)
  assert.equal(rows.find((r) => r.productName === 'A1')!.curvaAbcVendas, 'A')
  assert.equal(rows.find((r) => r.productName === 'B1')!.curvaAbcVendas, 'B')
  assert.equal(rows.find((r) => r.productName === 'C1')!.curvaAbcVendas, 'C')
})

test('buildSalesAbcCurve does not produce NaN margin for a product with no registered cost/profit', () => {
  const items = [item({ costPrice: undefined as unknown as number, profit: undefined as unknown as number, netItem: 100 })]
  const rows = buildSalesAbcCurve(items)
  assert.equal(rows[0].marginPct, 0)
  assert.ok(Number.isFinite(rows[0].marginPct as number))
})

test('buildSalesAbcCurve breaks ties on equal netRevenue by a stable productKey order', () => {
  const items = [
    item({ product: { id: 2, name: 'B' }, netItem: 50 }),
    item({ product: { id: 1, name: 'A' }, netItem: 50 }),
  ]
  const rows = buildSalesAbcCurve(items)
  assert.deepEqual(rows.map((r) => r.productName), ['A', 'B'])
})

test('aggregateSalesByProduct falls back to product name when id/alphaCode are missing', () => {
  const items = [item({ product: { id: 0, name: 'SEM CODIGO' } })]
  const rows = aggregateSalesByProduct(items)
  assert.equal(rows.length, 1)
  assert.equal(rows[0].productName, 'SEM CODIGO')
})

test('aggregateSalesByProduct merges quantities and revenue of the same product across multiple items', () => {
  const items = [
    item({ product: { id: 1, name: 'MESMO' }, quantity: 2, netItem: 20, profit: 8 }),
    item({ product: { id: 1, name: 'MESMO' }, quantity: 3, netItem: 30, profit: 12 }),
  ]
  const rows = aggregateSalesByProduct(items)
  assert.equal(rows.length, 1)
  assert.equal(rows[0].quantity, 5)
  assert.equal(rows[0].netRevenue, 50)
  assert.equal(rows[0].profit, 20)
})
