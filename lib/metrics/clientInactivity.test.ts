import assert from 'node:assert/strict'
import test from 'node:test'
import { SmartPosCustomer, SmartPosSale } from '../api/clientAdapter'
import { buildClientInactivity } from './clientInactivity'
import { buildRollingMonthWindow, MonthBucket } from './clientPurchaseBehavior'

function customer(overrides: Partial<SmartPosCustomer> = {}): SmartPosCustomer {
  return {
    id: 1,
    type: 'CLIENTE',
    companyName: 'Cliente Teste',
    ...overrides,
  }
}

function sale(overrides: Partial<SmartPosSale> = {}): SmartPosSale {
  return {
    id: '1',
    uniqueIdentifier: 'u1',
    creationDate: '2026-11-15T10:00:00-04:00',
    isBudget: false,
    isCanceled: false,
    totalAmount: 100,
    discountAmount: 0,
    netAmount: 100,
    profit: 40,
    customer: customer(),
    ...overrides,
  }
}

const WINDOW: MonthBucket[] = buildRollingMonthWindow(2026, 11, 13)
const REFERENCE_DATE = '2026-11-27'

test('a customer with no sale in the window shows up with the "sem compra" status and null days', () => {
  const rows = buildClientInactivity([customer({ id: 2 })], [], WINDOW, REFERENCE_DATE)
  assert.equal(rows.length, 1)
  assert.equal(rows[0].ultimaCompra, null)
  assert.equal(rows[0].daysSinceLastPurchase, null)
  assert.equal(rows[0].statusLabel, 'sem compra há mais de 13 meses')
})

test('a customer whose last purchase is within the 60-day threshold is excluded', () => {
  const rows = buildClientInactivity(
    [customer({ id: 3 })],
    [sale({ customer: customer({ id: 3 }), creationDate: '2026-11-01T00:00:00-04:00' })],
    WINDOW,
    REFERENCE_DATE
  )
  assert.equal(rows.length, 0)
})

test('a customer whose last purchase is more than 60 days before the reference date is included', () => {
  const rows = buildClientInactivity(
    [customer({ id: 4 })],
    [sale({ customer: customer({ id: 4 }), creationDate: '2026-08-01T00:00:00-04:00' })],
    WINDOW,
    REFERENCE_DATE
  )
  assert.equal(rows.length, 1)
  assert.equal(rows[0].ultimaCompra, '2026-08-01')
  assert.equal(rows[0].daysSinceLastPurchase, 118)
  assert.equal(rows[0].statusLabel, '118 dias sem comprar')
})

test('a custom threshold is respected', () => {
  const rows = buildClientInactivity(
    [customer({ id: 5 })],
    [sale({ customer: customer({ id: 5 }), creationDate: '2026-10-20T00:00:00-04:00' })],
    WINDOW,
    REFERENCE_DATE,
    30
  )
  assert.equal(rows.length, 1)
  assert.equal(rows[0].daysSinceLastPurchase, 38)
})

test('FORNECEDOR-typed registry entries are never included', () => {
  const rows = buildClientInactivity([customer({ id: 6, type: 'FORNECEDOR' })], [], WINDOW, REFERENCE_DATE)
  assert.deepEqual(rows, [])
})

test('customers with no in-window purchase sort before customers with an exact day count', () => {
  const rows = buildClientInactivity(
    [customer({ id: 7 }), customer({ id: 8 })],
    [sale({ customer: customer({ id: 8 }), creationDate: '2026-08-01T00:00:00-04:00' })],
    WINDOW,
    REFERENCE_DATE
  )
  assert.equal(rows.length, 2)
  assert.equal(rows[0].daysSinceLastPurchase, null)
  assert.equal(rows[1].daysSinceLastPurchase, 118)
})

test('empty customers and sales return an empty list', () => {
  assert.deepEqual(buildClientInactivity([], [], WINDOW, REFERENCE_DATE), [])
})
