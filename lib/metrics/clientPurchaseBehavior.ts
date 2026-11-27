import { SmartPosCustomer, SmartPosSale } from '../api/clientAdapter'
import { customerKeyOf, decodeBirthday } from './customerKey'
import { round2 } from './round'

// Same approach as monthlyRevenue.ts: read the calendar year/month straight off creationDate's
// own date prefix rather than re-deriving it through Date/UTC math, to sidestep any
// timezone-shift risk at month boundaries.
const DATE_PREFIX_PATTERN = /^(\d{4})-(\d{2})-\d{2}/

export interface MonthBucket {
  year: number
  month: number // 1-12
}

export interface ClientPurchaseBehaviorRow {
  customerKey: string
  clienteName: string
  contato: string | null
  aniversario: string | null
  desde: string | null
  ultimaCompra: string | null
  monthlyAmounts: number[]
  total: number
}

function monthLabelKey(bucket: MonthBucket): string {
  return `${bucket.year}-${String(bucket.month).padStart(2, '0')}`
}

/**
 * Walks backward `count - 1` months from (and including) the anchor month, oldest-first, using
 * plain integer month/year arithmetic — not Date objects — consistent with this project's
 * avoidance of Date/UTC math for calendar bucketing.
 */
export function buildRollingMonthWindow(anchorYear: number, anchorMonth: number, count = 13): MonthBucket[] {
  const buckets: MonthBucket[] = []
  let year = anchorYear
  let month = anchorMonth

  for (let i = 0; i < count; i++) {
    buckets.push({ year, month })
    month -= 1
    if (month < 1) {
      month = 12
      year -= 1
    }
  }

  return buckets.reverse()
}

export function bestContact(customer: SmartPosCustomer): string | null {
  const candidates = [customer.cellphone, customer.phone, customer.email]
  for (const candidate of candidates) {
    const trimmed = candidate?.trim()
    if (trimmed) return trimmed
  }
  return null
}

export function formatBirthday(raw: number | undefined): string | null {
  const decoded = decodeBirthday(raw)
  if (!decoded) return null
  return `${String(decoded.day).padStart(2, '0')}/${String(decoded.month).padStart(2, '0')}`
}

interface Aggregate {
  customer: SmartPosCustomer
  monthlyAmounts: number[]
  desde: string | null
  ultimaCompra: string | null
}

/**
 * Builds one row per client that has at least one sale within `months` — clients with zero
 * in-window activity are omitted entirely rather than shown as all-zero rows, since the full
 * registry (hundreds of records, many inactive/suppliers) would otherwise drown out the
 * clients that actually matter for this view.
 */
export function buildClientPurchaseBehavior(
  customers: SmartPosCustomer[],
  sales: SmartPosSale[],
  months: MonthBucket[]
): ClientPurchaseBehaviorRow[] {
  const registry = new Map<string, SmartPosCustomer>()
  for (const customer of customers) {
    if (customer.type !== 'CLIENTE') continue
    registry.set(customerKeyOf(customer), customer)
  }

  const monthIndexByKey = new Map<string, number>()
  months.forEach((bucket, idx) => monthIndexByKey.set(monthLabelKey(bucket), idx))

  const aggregates = new Map<string, Aggregate>()

  for (const sale of sales) {
    const saleCustomer = sale.customer
    if (!saleCustomer || saleCustomer.type !== 'CLIENTE') continue

    const match = DATE_PREFIX_PATTERN.exec(sale.creationDate || '')
    if (!match) continue
    const saleDate = match[0]
    const saleMonthKey = `${match[1]}-${match[2]}`
    const monthIndex = monthIndexByKey.get(saleMonthKey)
    if (monthIndex === undefined) continue

    const key = customerKeyOf(saleCustomer)
    const displayCustomer = registry.get(key) || saleCustomer

    let aggregate = aggregates.get(key)
    if (!aggregate) {
      aggregate = {
        customer: displayCustomer,
        monthlyAmounts: Array.from({ length: months.length }, () => 0),
        desde: null,
        ultimaCompra: null,
      }
      aggregates.set(key, aggregate)
    }

    aggregate.monthlyAmounts[monthIndex] += Number(sale.netAmount) || 0
    if (!aggregate.desde || saleDate < aggregate.desde) aggregate.desde = saleDate
    if (!aggregate.ultimaCompra || saleDate > aggregate.ultimaCompra) aggregate.ultimaCompra = saleDate
  }

  const rows: ClientPurchaseBehaviorRow[] = Array.from(aggregates.entries()).map(([key, aggregate]) => {
    const monthlyAmounts = aggregate.monthlyAmounts.map(round2)
    return {
      customerKey: key,
      clienteName: aggregate.customer.fantasyName || aggregate.customer.companyName || 'Cliente sem nome',
      contato: bestContact(aggregate.customer),
      aniversario: formatBirthday(aggregate.customer.birthday),
      desde: aggregate.desde,
      ultimaCompra: aggregate.ultimaCompra,
      monthlyAmounts,
      total: round2(monthlyAmounts.reduce((acc, v) => acc + v, 0)),
    }
  })

  return rows.sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total
    return a.clienteName.localeCompare(b.clienteName)
  })
}
