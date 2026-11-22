import assert from 'node:assert/strict'
import test from 'node:test'
import { SalesGoal } from '../../types/commercial'
import { monthsTouchedByRange, resolveGoalForPeriod } from './salesGoalsResolution'

test('resolveGoalForPeriod returns totalGoal 0 and every month missing when no goals are registered', () => {
  const resolution = resolveGoalForPeriod([], '2026-11-01', '2026-11-30')
  assert.equal(resolution.totalGoal, 0)
  assert.deepEqual(resolution.monthsInRange, ['2026-11'])
  assert.deepEqual(resolution.monthsMissingGoal, ['2026-11'])
})

test('monthsTouchedByRange crosses a year boundary correctly', () => {
  assert.deepEqual(monthsTouchedByRange('2026-12-15', '2027-01-10'), ['2026-12', '2027-01'])
})

test('resolveGoalForPeriod counts the full monthly goal even when the period only covers part of the month (no pro-rating)', () => {
  const goals: SalesGoal[] = [{ yearMonth: '2026-11', amount: 50000 }]
  const resolution = resolveGoalForPeriod(goals, '2026-11-05', '2026-11-05')
  assert.equal(resolution.totalGoal, 50000)
  assert.deepEqual(resolution.monthsMissingGoal, [])
})

test('resolveGoalForPeriod sums only the months that have a registered goal, flagging the rest as missing', () => {
  const goals: SalesGoal[] = [{ yearMonth: '2026-12', amount: 1000 }]
  const resolution = resolveGoalForPeriod(goals, '2026-12-01', '2027-01-31')
  assert.equal(resolution.totalGoal, 1000)
  assert.deepEqual(resolution.monthsMissingGoal, ['2027-01'])
})

test('resolveGoalForPeriod uses the last occurrence when a yearMonth is duplicated in the dataset', () => {
  const goals: SalesGoal[] = [
    { yearMonth: '2026-11', amount: 100 },
    { yearMonth: '2026-11', amount: 999 },
  ]
  const resolution = resolveGoalForPeriod(goals, '2026-11-01', '2026-11-30')
  assert.equal(resolution.totalGoal, 999)
})
