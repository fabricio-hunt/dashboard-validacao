import assert from 'node:assert/strict'
import test from 'node:test'
import { validatePeriodRange, validateYearParam } from './periodValidation'

test('validatePeriodRange accepts a well-formed, ordered range', () => {
  const result = validatePeriodRange('2026-11-01', '2026-11-30')
  assert.equal(result.valid, true)
})

test('validatePeriodRange rejects missing or malformed params', () => {
  assert.equal(validatePeriodRange(undefined, '2026-11-30').valid, false)
  assert.equal(validatePeriodRange('2026/11/01', '2026-11-30').valid, false)
  assert.equal(validatePeriodRange('not-a-date', '2026-11-30').valid, false)
})

test('validatePeriodRange rejects start after end', () => {
  assert.equal(validatePeriodRange('2026-12-01', '2026-11-01').valid, false)
})

test('validatePeriodRange rejects a calendar-invalid date like day 32', () => {
  assert.equal(validatePeriodRange('2026-11-32', '2026-11-30').valid, false)
})

test('validateYearParam accepts a 4-digit year inside the allowed range', () => {
  assert.equal(validateYearParam('2026', 2026).valid, true)
})

test('validateYearParam rejects non-4-digit input and out-of-range years', () => {
  assert.equal(validateYearParam('26', 2026).valid, false)
  assert.equal(validateYearParam('2010', 2026).valid, false)
  assert.equal(validateYearParam('2099', 2026).valid, false)
})
