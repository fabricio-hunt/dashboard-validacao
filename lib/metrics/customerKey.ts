import { SmartPosCustomer } from '../api/clientAdapter'

/**
 * Stable grouping key for a customer. Falls back through id -> cpfCnpj -> companyName/
 * fantasyName because the SmartPOS API does not guarantee every sale's embedded customer
 * carries a non-zero numeric id on malformed payloads.
 */
export function customerKeyOf(customer: SmartPosCustomer | null | undefined): string {
  const id = customer?.id
  if (id !== undefined && id !== null && id !== 0) return `id:${id}`

  const doc = customer?.cpfCnpj?.trim()
  if (doc) return `doc:${doc}`

  const name = (customer?.companyName || customer?.fantasyName)?.trim().toUpperCase()
  return `name:${name || 'DESCONHECIDO'}`
}

/**
 * SmartPOS encodes a customer's birthday as month*100+day with no year (e.g. 1123 -> Nov 23,
 * 609 -> Jun 9). 0/undefined means the field was never set. Out-of-range values are treated as
 * unset rather than guessed at, since a malformed value is not a usable date.
 */
export function decodeBirthday(raw: number | undefined): { month: number; day: number } | null {
  if (!raw) return null

  const month = Math.floor(raw / 100)
  const day = raw % 100
  if (month < 1 || month > 12 || day < 1 || day > 31) return null

  return { month, day }
}
