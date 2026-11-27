import { SmartPosCustomer, SmartPosSale } from '../api/clientAdapter'
import { daysBetweenIso } from '../domain/periodRanges'
import { bestContact, buildClientPurchaseBehavior, formatBirthday, MonthBucket } from './clientPurchaseBehavior'
import { customerKeyOf } from './customerKey'

export interface ClientInactivityRow {
  customerKey: string
  clienteName: string
  contato: string | null
  aniversario: string | null
  ultimaCompra: string | null
  daysSinceLastPurchase: number | null
  statusLabel: string
}

const NO_PURCHASE_IN_WINDOW_LABEL = 'sem compra há mais de 13 meses'

/**
 * Finds clients whose last purchase inside `months` is more than `thresholdDays` old, plus
 * registered clients with zero purchases anywhere in that window — the exact complement of
 * `buildClientPurchaseBehavior`, which intentionally drops zero-activity clients. Reuses that
 * function's aggregation (rather than re-walking `sales`) so both views agree on `ultimaCompra`.
 */
export function buildClientInactivity(
  customers: SmartPosCustomer[],
  sales: SmartPosSale[],
  months: MonthBucket[],
  referenceDateIso: string = new Date().toISOString().slice(0, 10),
  thresholdDays = 60
): ClientInactivityRow[] {
  const activeRows = buildClientPurchaseBehavior(customers, sales, months)
  const activeByKey = new Map(activeRows.map((row) => [row.customerKey, row]))

  const registry = new Map<string, SmartPosCustomer>()
  for (const customer of customers) {
    if (customer.type !== 'CLIENTE') continue
    registry.set(customerKeyOf(customer), customer)
  }

  const rows: ClientInactivityRow[] = []

  registry.forEach((customer, key) => {
    const active = activeByKey.get(key)

    if (!active) {
      rows.push({
        customerKey: key,
        clienteName: customer.fantasyName || customer.companyName || 'Cliente sem nome',
        contato: bestContact(customer),
        aniversario: formatBirthday(customer.birthday),
        ultimaCompra: null,
        daysSinceLastPurchase: null,
        statusLabel: NO_PURCHASE_IN_WINDOW_LABEL,
      })
      return
    }

    if (!active.ultimaCompra) return
    const days = daysBetweenIso(active.ultimaCompra, referenceDateIso)
    if (days <= thresholdDays) return

    rows.push({
      customerKey: key,
      clienteName: active.clienteName,
      contato: active.contato,
      aniversario: active.aniversario,
      ultimaCompra: active.ultimaCompra,
      daysSinceLastPurchase: days,
      statusLabel: `${days} dias sem comprar`,
    })
  })

  return rows.sort((a, b) => {
    if (a.daysSinceLastPurchase === null && b.daysSinceLastPurchase === null) {
      return a.clienteName.localeCompare(b.clienteName)
    }
    if (a.daysSinceLastPurchase === null) return -1
    if (b.daysSinceLastPurchase === null) return 1
    if (b.daysSinceLastPurchase !== a.daysSinceLastPurchase) return b.daysSinceLastPurchase - a.daysSinceLastPurchase
    return a.clienteName.localeCompare(b.clienteName)
  })
}
