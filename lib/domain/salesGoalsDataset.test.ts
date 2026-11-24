import assert from 'node:assert/strict'
import test from 'node:test'
import { upsertSalesGoal } from './salesGoalsDataset'

test('upsertSalesGoal adds a new month goal', () => {
  const result = upsertSalesGoal({ goals: [] }, '2026-11', 50000)
  assert.deepEqual(result.goals, [{ yearMonth: '2026-11', amount: 50000 }])
})

test('upsertSalesGoal replaces an existing month instead of duplicating it', () => {
  const dataset = { goals: [{ yearMonth: '2026-11', amount: 100 }] }
  const result = upsertSalesGoal(dataset, '2026-11', 200)
  assert.deepEqual(result.goals, [{ yearMonth: '2026-11', amount: 200 }])
})

test('upsertSalesGoal keeps the dataset sorted by yearMonth', () => {
  const dataset = { goals: [{ yearMonth: '2026-12', amount: 1 }] }
  const result = upsertSalesGoal(dataset, '2026-01', 2)
  assert.deepEqual(result.goals.map((g) => g.yearMonth), ['2026-01', '2026-12'])
})
