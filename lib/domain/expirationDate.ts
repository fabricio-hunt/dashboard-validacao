import type { ExpirationStatus } from '../../types/inventory'

export type ExpirationDateKind = 'full' | 'month_year'

export interface ParsedExpirationDateValid {
  valid: true
  kind: ExpirationDateKind
  /** ISO 8601 date (`YYYY-MM-DD`) for full dates or (`YYYY-MM`) for month/year-only dates. */
  iso: string
  /** Brazilian display format (`DD/MM/YYYY` or `MM/YYYY`). */
  formatted: string
  year: number
  month: number
  day: number | null
}

export interface ParsedExpirationDateInvalid {
  valid: false
  error: string
}

export type ParsedExpirationDate = ParsedExpirationDateValid | ParsedExpirationDateInvalid

const FULL_BR_DATE_RE = /^(\d{2})[./](\d{2})[./](\d{2}|\d{4})$/
const MONTH_YEAR_BR_RE = /^(\d{2})[./](\d{4})$/
const ISO_FULL_RE = /^(\d{4})-(\d{2})-(\d{2})$/
const ISO_MONTH_YEAR_RE = /^(\d{4})-(\d{2})$/

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function getDaysInMonth(year: number, month: number): number {
  if (month < 1 || month > 12 || !Number.isInteger(year) || !Number.isInteger(month)) {
    return 0
  }
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

export function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false
  }
  if (year < 1900 || year > 2199) return false
  if (month < 1 || month > 12) return false
  const maxDay = getDaysInMonth(year, month)
  return day >= 1 && day <= maxDay
}

export function expandTwoDigitYear(yearStr: string): number {
  const num = Number.parseInt(yearStr, 10)
  if (yearStr.length === 2) {
    return 2000 + num
  }
  return num
}

/**
 * Parses and strictly validates Brazilian product expiration dates:
 * - Full dates: `DD/MM/YYYY`, `DD.MM.YYYY`, `DD/MM/YY`, `DD.MM.YY` -> `YYYY-MM-DD` / `DD/MM/YYYY`
 * - Month/year-only dates: `MM/YYYY`, `MM.YYYY` -> `YYYY-MM` / `MM/YYYY`
 * - ISO 8601 inputs (`YYYY-MM-DD` or `YYYY-MM`) are also accepted for round-trip compatibility.
 *
 * Invalid calendar dates (e.g., `31/02/2030`, `15/13/2030`) are rejected without silent modification.
 */
export function parseBrazilianExpirationDate(rawInput: string | null | undefined): ParsedExpirationDate {
  const raw = (rawInput ?? '').trim()
  if (!raw || raw.toUpperCase() === 'N/I') {
    return { valid: false, error: 'Data de validade vazia ou não informada.' }
  }

  const fullMatch = FULL_BR_DATE_RE.exec(raw)
  if (fullMatch) {
    const day = Number.parseInt(fullMatch[1], 10)
    const month = Number.parseInt(fullMatch[2], 10)
    const year = expandTwoDigitYear(fullMatch[3])

    if (month < 1 || month > 12) {
      return { valid: false, error: `Mês inválido (${fullMatch[2]}) em "${raw}".` }
    }
    if (!isValidCalendarDate(year, month, day)) {
      return { valid: false, error: `Data de calendário inválida: "${raw}".` }
    }

    return {
      valid: true,
      kind: 'full',
      iso: `${year}-${pad2(month)}-${pad2(day)}`,
      formatted: `${pad2(day)}/${pad2(month)}/${year}`,
      year,
      month,
      day,
    }
  }

  const monthYearMatch = MONTH_YEAR_BR_RE.exec(raw)
  if (monthYearMatch) {
    const month = Number.parseInt(monthYearMatch[1], 10)
    const year = Number.parseInt(monthYearMatch[2], 10)

    if (month < 1 || month > 12) {
      return { valid: false, error: `Mês inválido (${monthYearMatch[1]}) em "${raw}".` }
    }
    if (year < 1900 || year > 2199) {
      return { valid: false, error: `Ano inválido (${monthYearMatch[2]}) em "${raw}".` }
    }

    return {
      valid: true,
      kind: 'month_year',
      iso: `${year}-${pad2(month)}`,
      formatted: `${pad2(month)}/${year}`,
      year,
      month,
      day: null,
    }
  }

  const isoFullMatch = ISO_FULL_RE.exec(raw)
  if (isoFullMatch) {
    const year = Number.parseInt(isoFullMatch[1], 10)
    const month = Number.parseInt(isoFullMatch[2], 10)
    const day = Number.parseInt(isoFullMatch[3], 10)

    if (!isValidCalendarDate(year, month, day)) {
      return { valid: false, error: `Data ISO inválida: "${raw}".` }
    }

    return {
      valid: true,
      kind: 'full',
      iso: `${year}-${pad2(month)}-${pad2(day)}`,
      formatted: `${pad2(day)}/${pad2(month)}/${year}`,
      year,
      month,
      day,
    }
  }

  const isoMonthMatch = ISO_MONTH_YEAR_RE.exec(raw)
  if (isoMonthMatch) {
    const year = Number.parseInt(isoMonthMatch[1], 10)
    const month = Number.parseInt(isoMonthMatch[2], 10)

    if (month < 1 || month > 12 || year < 1900 || year > 2199) {
      return { valid: false, error: `Data mês/ano ISO inválida: "${raw}".` }
    }

    return {
      valid: true,
      kind: 'month_year',
      iso: `${year}-${pad2(month)}`,
      formatted: `${pad2(month)}/${year}`,
      year,
      month,
      day: null,
    }
  }

  return {
    valid: false,
    error: `Formato de validade não reconhecido: "${raw}". Use DD/MM/AAAA, DD.MM.AA ou MM/AAAA.`,
  }
}

/**
 * Formats an ISO (`YYYY-MM-DD` / `YYYY-MM`) or Brazilian expiration string into `DD/MM/YYYY` or `MM/YYYY`
 * without timezone conversion or UTC day shifts. Returns `'N/I'` for missing/invalid values.
 */
export function formatExpirationDateBr(value: string | null | undefined): string {
  const parsed = parseBrazilianExpirationDate(value)
  return parsed.valid ? parsed.formatted : 'N/I'
}

/**
 * Computes `dias_para_vencer` and `status_validade` using pure UTC calendar-day arithmetic
 * so local timezones never shift the expiration date by +/- 1 day.
 * Month/year-only dates (`YYYY-MM`) are evaluated against the last day of that month.
 */
export function computeExpirationMetrics(
  isoOrRaw: string | null | undefined,
  referenceDate: Date = new Date()
): { dias_para_vencer: number | null; status_validade: ExpirationStatus } {
  const parsed = parseBrazilianExpirationDate(isoOrRaw)
  if (!parsed.valid) {
    return { dias_para_vencer: null, status_validade: 'SEM_DATA' }
  }

  const targetDay = parsed.day ?? getDaysInMonth(parsed.year, parsed.month)
  const targetUtc = Date.UTC(parsed.year, parsed.month - 1, targetDay)
  const refUtc = Date.UTC(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  )
  const dias = Math.round((targetUtc - refUtc) / 86_400_000)

  let status: ExpirationStatus = 'REGULAR'
  if (dias < 0) status = 'VENCIDO'
  else if (dias <= 90) status = 'CRITICO_90D'
  else if (dias <= 180) status = 'ATENCAO_180D'

  return { dias_para_vencer: dias, status_validade: status }
}

