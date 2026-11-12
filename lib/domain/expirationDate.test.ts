import assert from 'node:assert/strict'
import test from 'node:test'
import {
  computeExpirationMetrics,
  formatExpirationDateBr,
  parseBrazilianExpirationDate,
} from './expirationDate'

test('parses required valid Brazilian expiration date formats', () => {
  const cases: Array<[string, string, string, 'full' | 'month_year']> = [
    ['01.12.30', '01/12/2030', '2030-12-01', 'full'],
    ['01/12/30', '01/12/2030', '2030-12-01', 'full'],
    ['01/12/2030', '01/12/2030', '2030-12-01', 'full'],
    ['12/2030', '12/2030', '2030-12', 'month_year'],
    ['02.05.2027', '02/05/2027', '2027-05-02', 'full'],
  ]

  for (const [input, expectedBr, expectedIso, expectedKind] of cases) {
    const res = parseBrazilianExpirationDate(input)
    assert.equal(res.valid, true, `Expected "${input}" to be valid`)
    if (res.valid) {
      assert.equal(res.formatted, expectedBr)
      assert.equal(res.iso, expectedIso)
      assert.equal(res.kind, expectedKind)
    }
  }
})

test('rejects invalid calendar dates without silent mutation', () => {
  const invalidCases = ['31/02/2030', '15/13/2030', '32/13/2030', '13/2030', '00/12/2030']
  for (const input of invalidCases) {
    const res = parseBrazilianExpirationDate(input)
    assert.equal(res.valid, false, `Expected "${input}" to be invalid`)
    assert.equal(formatExpirationDateBr(input), 'N/I')
  }
})

test('preserves full vs month/year distinction across ISO round-trip without timezone shift', () => {
  const full = parseBrazilianExpirationDate('01.12.30')
  assert.equal(full.valid, true)
  if (full.valid) {
    assert.equal(formatExpirationDateBr(full.iso), '01/12/2030')
    const roundTrip = parseBrazilianExpirationDate(full.iso)
    assert.equal(roundTrip.valid, true)
    if (roundTrip.valid) {
      assert.equal(roundTrip.kind, 'full')
      assert.equal(roundTrip.formatted, '01/12/2030')
    }
  }

  const monthOnly = parseBrazilianExpirationDate('12/2030')
  assert.equal(monthOnly.valid, true)
  if (monthOnly.valid) {
    assert.equal(formatExpirationDateBr(monthOnly.iso), '12/2030')
    const roundTrip = parseBrazilianExpirationDate(monthOnly.iso)
    assert.equal(roundTrip.valid, true)
    if (roundTrip.valid) {
      assert.equal(roundTrip.kind, 'month_year')
      assert.equal(roundTrip.formatted, '12/2030')
    }
  }
})

test('computes expiration metrics without UTC day shift and uses month-end for MM/YYYY', () => {
  const ref = new Date(2030, 11, 1) // 2030-12-01 local
  const fullMetrics = computeExpirationMetrics('2030-12-01', ref)
  assert.equal(fullMetrics.dias_para_vencer, 0)
  assert.equal(fullMetrics.status_validade, 'CRITICO_90D')

  const monthOnlyMetrics = computeExpirationMetrics('2030-12', ref)
  assert.equal(monthOnlyMetrics.dias_para_vencer, 30)
  assert.equal(monthOnlyMetrics.status_validade, 'CRITICO_90D')
})

