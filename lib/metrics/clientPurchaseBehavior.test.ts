import assert from 'node:assert/strict'
import test from 'node:test'
import { SmartPosCustomer, SmartPosSale } from '../api/clientAdapter'
import { decodeBirthday } from './customerKey'
import { buildClientPurchaseBehavior, buildRollingMonthWindow, MonthBucket } from './clientPurchaseBehavior'

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

test('buildRollingMonthWindow returns 13 ordered buckets oldest-first with correct year rollover', () => {
  const window = buildRollingMonthWindow(2026, 11, 13)
  assert.equal(window.length, 13)
  assert.deepEqual(window[0], { year: 2025, month: 11 })
  assert.deepEqual(window[window.length - 1], { year: 2026, month: 11 })
  // Dec(2025) -> Jan(2026) must roll over correctly in the middle of the window
  const dec2025 = window.findIndex((b) => b.year === 2025 && b.month === 12)
  const jan2026 = window.findIndex((b) => b.year === 2026 && b.month === 1)
  assert.equal(jan2026, dec2025 + 1)
})

test('buildRollingMonthWindow dips into the prior year when the anchor month is January', () => {
  const window = buildRollingMonthWindow(2026, 1, 13)
  assert.deepEqual(window[0], { year: 2025, month: 1 })
  assert.deepEqual(window[window.length - 1], { year: 2026, month: 1 })
})

test('buildClientPurchaseBehavior returns [] for empty sales and empty customers', () => {
  assert.deepEqual(buildClientPurchaseBehavior([], [], WINDOW), [])
})

test('buildClientPurchaseBehavior returns [] when no sale falls inside the window', () => {
  const rows = buildClientPurchaseBehavior([customer()], [sale({ creationDate: '2020-01-01T00:00:00-04:00' })], WINDOW)
  assert.deepEqual(rows, [])
})

test('a sale outside the window, alone, excludes the client entirely', () => {
  const rows = buildClientPurchaseBehavior(
    [customer({ id: 2 })],
    [sale({ customer: customer({ id: 2 }), creationDate: '2020-06-01T00:00:00-04:00' })],
    WINDOW
  )
  assert.equal(rows.length, 0)
})

test('a sale outside the window keeps that month zero when other sales are in-window', () => {
  const rows = buildClientPurchaseBehavior(
    [customer({ id: 3 })],
    [
      sale({ customer: customer({ id: 3 }), creationDate: '2020-06-01T00:00:00-04:00', netAmount: 999 }),
      sale({ customer: customer({ id: 3 }), creationDate: '2026-11-01T00:00:00-04:00', netAmount: 50 }),
    ],
    WINDOW
  )
  assert.equal(rows.length, 1)
  assert.equal(rows[0].total, 50)
})

test('FORNECEDOR-typed sale customer is excluded even if the registry has a CLIENTE record with the same id', () => {
  const rows = buildClientPurchaseBehavior(
    [customer({ id: 4, type: 'CLIENTE' })],
    [sale({ customer: customer({ id: 4, type: 'FORNECEDOR' }) })],
    WINDOW
  )
  assert.deepEqual(rows, [])
})

test('sale with null/undefined customer is skipped without throwing', () => {
  assert.doesNotThrow(() => buildClientPurchaseBehavior([], [sale({ customer: undefined })], WINDOW))
  assert.deepEqual(buildClientPurchaseBehavior([], [sale({ customer: undefined })], WINDOW), [])
})

test('two sales for the same customer in the same month are summed', () => {
  const rows = buildClientPurchaseBehavior(
    [customer({ id: 5 })],
    [
      sale({ customer: customer({ id: 5 }), creationDate: '2026-11-05T00:00:00-04:00', netAmount: 30 }),
      sale({ customer: customer({ id: 5 }), creationDate: '2026-11-20T00:00:00-04:00', netAmount: 20 }),
    ],
    WINDOW
  )
  assert.equal(rows.length, 1)
  const novemberIndex = WINDOW.findIndex((b) => b.year === 2026 && b.month === 11)
  assert.equal(rows[0].monthlyAmounts[novemberIndex], 50)
  assert.equal(rows[0].total, 50)
})

test('a Dec->Jan window boundary buckets sales into adjacent months correctly', () => {
  const rows = buildClientPurchaseBehavior(
    [customer({ id: 6 })],
    [
      sale({ customer: customer({ id: 6 }), creationDate: '2025-12-31T23:59:59-04:00', netAmount: 10 }),
      sale({ customer: customer({ id: 6 }), creationDate: '2026-01-01T00:00:01-04:00', netAmount: 20 }),
    ],
    WINDOW
  )
  const decIndex = WINDOW.findIndex((b) => b.year === 2025 && b.month === 12)
  const janIndex = WINDOW.findIndex((b) => b.year === 2026 && b.month === 1)
  assert.equal(rows[0].monthlyAmounts[decIndex], 10)
  assert.equal(rows[0].monthlyAmounts[janIndex], 20)
})

test('desde equals ultimaCompra when only one in-window sale exists', () => {
  const rows = buildClientPurchaseBehavior(
    [customer({ id: 7 })],
    [sale({ customer: customer({ id: 7 }), creationDate: '2026-03-10T00:00:00-04:00' })],
    WINDOW
  )
  assert.equal(rows[0].desde, '2026-03-10')
  assert.equal(rows[0].ultimaCompra, '2026-03-10')
})

test('customerKeyOf fallback merges sales sharing a cpfCnpj when id is missing/zero', () => {
  const rows = buildClientPurchaseBehavior(
    [],
    [
      sale({ customer: customer({ id: 0, cpfCnpj: '123', companyName: 'A' }), creationDate: '2026-01-05T00:00:00-04:00', netAmount: 10 }),
      sale({ customer: customer({ id: 0, cpfCnpj: '123', companyName: 'A' }), creationDate: '2026-02-05T00:00:00-04:00', netAmount: 15 }),
    ],
    WINDOW
  )
  assert.equal(rows.length, 1)
  assert.equal(rows[0].total, 25)
})

test('monthly amounts and total are rounded to 2 decimals', () => {
  const rows = buildClientPurchaseBehavior(
    [customer({ id: 8 })],
    [
      sale({ customer: customer({ id: 8 }), creationDate: '2026-11-01T00:00:00-04:00', netAmount: 10.111 }),
      sale({ customer: customer({ id: 8 }), creationDate: '2026-11-02T00:00:00-04:00', netAmount: 10.112 }),
    ],
    WINDOW
  )
  assert.equal(rows[0].total, 20.22)
})

test('decodeBirthday handles unset, valid and invalid encodings', () => {
  assert.equal(decodeBirthday(0), null)
  assert.equal(decodeBirthday(undefined), null)
  assert.deepEqual(decodeBirthday(1123), { month: 11, day: 23 })
  assert.deepEqual(decodeBirthday(609), { month: 6, day: 9 })
  assert.deepEqual(decodeBirthday(101), { month: 1, day: 1 })
  assert.equal(decodeBirthday(1332), null) // day 32 is invalid
})
