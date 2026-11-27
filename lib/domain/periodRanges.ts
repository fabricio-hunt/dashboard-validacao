import { PeriodRange } from '../../types/commercial'

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function toIso(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`
}

/** From the 1st of the current month up to (and including) `now`'s own day. */
export function currentMonthRange(now: Date = new Date()): PeriodRange {
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  return { startDate: toIso(year, month, 1), endDate: toIso(year, month, now.getDate()) }
}

/** Full calendar month, 1st to last day (28-31, leap years included). `month` is 1-12. */
export function specificMonthRange(year: number, month: number): PeriodRange {
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month: ${month}`)
  }
  const lastDay = new Date(year, month, 0).getDate()
  return { startDate: toIso(year, month, 1), endDate: toIso(year, month, lastDay) }
}

/** Full calendar year, Jan 1st to Dec 31st. */
export function yearRange(year: number): PeriodRange {
  return { startDate: toIso(year, 1, 1), endDate: toIso(year, 12, 31) }
}

const DAY_MS = 24 * 60 * 60 * 1000

function parseIsoDate(iso: string): { year: number; month: number; day: number } {
  const [year, month, day] = iso.split('-').map(Number)
  return { year, month, day }
}

function toUtcTimestamp({ year, month, day }: { year: number; month: number; day: number }): number {
  return Date.UTC(year, month - 1, day)
}

function fromUtcTimestamp(ts: number): string {
  const d = new Date(ts)
  return toIso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate())
}

/**
 * The period of equal duration immediately preceding [startDate, endDate] — used for the
 * "comparação com período anterior" KPI cards. This is a generic equal-duration lookback, not
 * necessarily the previous calendar month (a custom/year range simply looks back by its own
 * length), by design per the "quando fizer sentido" requirement.
 */
export function previousEquivalentRange(startDate: string, endDate: string): PeriodRange {
  const startTs = toUtcTimestamp(parseIsoDate(startDate))
  const endTs = toUtcTimestamp(parseIsoDate(endDate))
  const durationDays = Math.round((endTs - startTs) / DAY_MS) + 1

  const previousEndTs = startTs - DAY_MS
  const previousStartTs = previousEndTs - (durationDays - 1) * DAY_MS

  return { startDate: fromUtcTimestamp(previousStartTs), endDate: fromUtcTimestamp(previousEndTs) }
}

/** Real calendar-day difference between two ISO dates (`toDate` − `fromDate`), UTC-based. */
export function daysBetweenIso(fromDate: string, toDate: string): number {
  return Math.round((toUtcTimestamp(parseIsoDate(toDate)) - toUtcTimestamp(parseIsoDate(fromDate))) / DAY_MS)
}

/** `iso` minus `days` calendar days, UTC-based. */
export function subtractDaysIso(iso: string, days: number): string {
  return fromUtcTimestamp(toUtcTimestamp(parseIsoDate(iso)) - days * DAY_MS)
}
