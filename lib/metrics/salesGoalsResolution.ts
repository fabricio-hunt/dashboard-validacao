import { SalesGoal } from '../../types/commercial'
import { round2 } from './round'

function parseYearMonth(iso: string): { year: number; month: number } {
  const [y, m] = iso.split('-')
  return { year: Number(y), month: Number(m) }
}

function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

/** All 'YYYY-MM' calendar months touched by [startDate, endDate], inclusive, in chronological order. */
export function monthsTouchedByRange(startDate: string, endDate: string): string[] {
  const start = parseYearMonth(startDate)
  const end = parseYearMonth(endDate)

  const months: string[] = []
  let year = start.year
  let month = start.month
  while (year < end.year || (year === end.year && month <= end.month)) {
    months.push(monthKey(year, month))
    month += 1
    if (month > 12) {
      month = 1
      year += 1
    }
  }
  return months
}

export interface GoalResolution {
  /** Sum of registered monthly goals for the months touched by the period. */
  totalGoal: number
  monthsInRange: string[]
  /** Subset of monthsInRange with no goal registered — surfaced so the UI can warn about gaps. */
  monthsMissingGoal: string[]
}

/**
 * Resolves the commercial goal for an arbitrary period by summing the FULL monthly goal of every
 * calendar month the period touches — deliberately no pro-rating by day, even when the period
 * only covers part of a month. Callers should treat `monthsMissingGoal` as a signal to warn the
 * user the goal comparison is incomplete, not silently ignore it.
 */
export function resolveGoalForPeriod(goals: SalesGoal[], startDate: string, endDate: string): GoalResolution {
  const monthsInRange = monthsTouchedByRange(startDate, endDate)

  // Last occurrence wins on a duplicate yearMonth (defensive against a dataset that was
  // hand-edited or upserted before this module existed).
  const goalByMonth = new Map<string, number>()
  for (const goal of goals) {
    goalByMonth.set(goal.yearMonth, Number(goal.amount) || 0)
  }

  let totalGoal = 0
  const monthsMissingGoal: string[] = []
  for (const month of monthsInRange) {
    if (goalByMonth.has(month)) {
      totalGoal += goalByMonth.get(month)!
    } else {
      monthsMissingGoal.push(month)
    }
  }

  return { totalGoal: round2(totalGoal), monthsInRange, monthsMissingGoal }
}
