import { SalesGoalsDataset } from '../../types/commercial'

/** Pure upsert: replaces any existing goal for `yearMonth`, keeping the dataset sorted. */
export function upsertSalesGoal(dataset: SalesGoalsDataset, yearMonth: string, amount: number): SalesGoalsDataset {
  const others = dataset.goals.filter((goal) => goal.yearMonth !== yearMonth)
  const goals = [...others, { yearMonth, amount }].sort((a, b) => a.yearMonth.localeCompare(b.yearMonth))
  return { goals }
}
