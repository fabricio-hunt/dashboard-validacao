import { SmartPosSaleItem } from '../api/clientAdapter'

/**
 * Stable grouping key for a sale item's product. Falls back through id -> alphaCode -> name
 * because the SmartPOS API does not guarantee alphaCode is set, and defensively covers the
 * case where even the numeric id is missing/zero on malformed payloads.
 */
export function productKeyOf(item: SmartPosSaleItem): string {
  const id = item.product?.id
  if (id !== undefined && id !== null && id !== 0) return `id:${id}`

  const alpha = item.product?.alphaCode?.trim()
  if (alpha) return `alpha:${alpha}`

  const name = item.product?.name?.trim().toUpperCase()
  return `name:${name || 'DESCONHECIDO'}`
}
