const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const YEAR_PATTERN = /^\d{4}$/

export interface PeriodValidationResult {
  valid: boolean
  startDate: string
  endDate: string
  message: string
}

/** Sanitizes/validates `start`/`end` query params shared by the commercial-metrics routes. */
export function validatePeriodRange(start: unknown, end: unknown): PeriodValidationResult {
  const startDate = typeof start === 'string' ? start : ''
  const endDate = typeof end === 'string' ? end : ''

  if (!ISO_DATE_PATTERN.test(startDate) || !ISO_DATE_PATTERN.test(endDate)) {
    return { valid: false, startDate, endDate, message: 'Parâmetros "start" e "end" devem estar no formato YYYY-MM-DD.' }
  }
  if (Number.isNaN(new Date(startDate).getTime()) || Number.isNaN(new Date(endDate).getTime())) {
    return { valid: false, startDate, endDate, message: 'Datas inválidas em "start"/"end".' }
  }
  if (startDate > endDate) {
    return { valid: false, startDate, endDate, message: 'O parâmetro "start" deve ser menor ou igual a "end".' }
  }
  return { valid: true, startDate, endDate, message: '' }
}

export interface YearValidationResult {
  valid: boolean
  year: number
  message: string
}

/** Sanitizes/validates the `year` query param used by the monthly-revenue route. */
export function validateYearParam(year: unknown, currentYear: number = new Date().getFullYear()): YearValidationResult {
  const raw = typeof year === 'string' ? year : ''
  if (!YEAR_PATTERN.test(raw)) {
    return { valid: false, year: NaN, message: 'Parâmetro "year" deve ser um ano de 4 dígitos (YYYY).' }
  }

  const parsed = Number(raw)
  const minYear = 2015
  const maxYear = currentYear + 1
  if (parsed < minYear || parsed > maxYear) {
    return { valid: false, year: parsed, message: `Ano fora do intervalo permitido (${minYear}-${maxYear}).` }
  }

  return { valid: true, year: parsed, message: '' }
}
