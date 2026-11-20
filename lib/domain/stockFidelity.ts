import { ProductItem } from '@/types/inventory'

/**
 * The sales-based auto-decrement (`estoque = baseline_estoque - vendido desde baseline_at`) only
 * tracks outflow (sales reported by SmartPOS); it never learns about inflow (restocks/purchases),
 * since SmartPOS's API exposes no such endpoint. Confidence in the computed number decays the
 * longer it has been since a human last confirmed it with a physical count.
 */
export const RECONTAGEM_THRESHOLD_DAYS = 30

export function computeDiasDesdeContagem(baselineAt: string | null | undefined, referenceDate: Date): number | null {
  if (!baselineAt) return null
  const baselineMs = new Date(baselineAt).getTime()
  if (!Number.isFinite(baselineMs)) return null
  return Math.max(0, Math.floor((referenceDate.getTime() - baselineMs) / 86_400_000))
}

/** Annotates a product with `dias_desde_contagem` / `recontagem_recomendada`, computed at read time. */
export function withFidelityFlags(product: ProductItem, referenceDate: Date = new Date()): ProductItem {
  const dias = computeDiasDesdeContagem(product.baseline_at, referenceDate)
  return {
    ...product,
    dias_desde_contagem: dias ?? undefined,
    recontagem_recomendada: dias !== null && dias >= RECONTAGEM_THRESHOLD_DAYS,
  }
}

/** Ensures every product carries a baseline, defaulting new/legacy rows to "counted right now". */
export function ensureBaseline(product: ProductItem, nowIso: string): ProductItem {
  if (product.baseline_at && Number.isFinite(new Date(product.baseline_at).getTime())) {
    return product
  }
  return { ...product, baseline_estoque: product.estoque, baseline_at: nowIso }
}
