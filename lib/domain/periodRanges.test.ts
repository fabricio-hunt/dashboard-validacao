import assert from 'node:assert/strict'
import test from 'node:test'
import { currentMonthRange, previousEquivalentRange, specificMonthRange, yearRange } from './periodRanges'

test('currentMonthRange spans from day 1 of the month to the injected "now" day', () => {
  const range = currentMonthRange(new Date(2026, 10, 21)) // Nov 21, 2026 (month is 0-indexed in JS Date)
  assert.deepEqual(range, { startDate: '2026-11-01', endDate: '2026-11-21' })
})

test('specificMonthRange resolves the correct last day for a 31-day month', () => {
  assert.deepEqual(specificMonthRange(2026, 1), { startDate: '2026-01-01', endDate: '2026-01-31' })
})

test('specificMonthRange resolves the correct last day for a 30-day month', () => {
  assert.deepEqual(specificMonthRange(2026, 4), { startDate: '2026-04-01', endDate: '2026-04-30' })
})

test('specificMonthRange resolves February correctly on a non-leap year (28 days)', () => {
  assert.deepEqual(specificMonthRange(2026, 2), { startDate: '2026-02-01', endDate: '2026-02-28' })
})

test('specificMonthRange resolves February correctly on a leap year (29 days)', () => {
  assert.deepEqual(specificMonthRange(2028, 2), { startDate: '2028-02-01', endDate: '2028-02-29' })
})

test('specificMonthRange rejects an out-of-range month', () => {
  assert.throws(() => specificMonthRange(2026, 13))
  assert.throws(() => specificMonthRange(2026, 0))
})

test('yearRange spans the full calendar year', () => {
  assert.deepEqual(yearRange(2026), { startDate: '2026-01-01', endDate: '2026-12-31' })
})

test('previousEquivalentRange looks back by the same duration for a single-day period', () => {
  assert.deepEqual(previousEquivalentRange('2026-11-21', '2026-11-21'), {
    startDate: '2026-11-20',
    endDate: '2026-11-20',
  })
})

test('previousEquivalentRange looks back by the same duration for a full 30-day month', () => {
  assert.deepEqual(previousEquivalentRange('2026-11-01', '2026-11-30'), {
    startDate: '2026-10-02',
    endDate: '2026-10-31',
  })
})

test('previousEquivalentRange crosses a year boundary correctly', () => {
  assert.deepEqual(previousEquivalentRange('2026-01-01', '2026-01-05'), {
    startDate: '2025-12-27',
    endDate: '2025-12-31',
  })
})
