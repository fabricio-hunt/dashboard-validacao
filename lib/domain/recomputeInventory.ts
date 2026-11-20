import { AbcClass, CategorySummary, DashboardSummary, ProductItem, StockStatus } from '@/types/inventory'
import { InventoryService } from '@/lib/api/inventoryService'

const LEGACY_TRANSITION_CATEGORY = 'Estoque em Transição'

export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export interface DerivedProductFields {
  lucro_unitario: number
  margem_percentual: number
  markup_percentual: number
  valor_total_custo: number
  valor_total_venda: number
  lucro_potencial: number
  status_estoque: StockStatus
  sugestao_compra_qtd: number
  sugestao_compra_custo: number
}

/**
 * Recomputes every field that is a pure function of (custo, venda, estoque, estoque_minimo).
 * Shared by the manual sync route and the manual stock-adjustment route so both apply
 * the exact same business rules.
 */
export function computeDerivedProductFields(
  custo: number,
  venda: number,
  estoque: number,
  minimo: number | null
): DerivedProductFields {
  const lucroUnit = round2(venda - custo)
  const margemPerc = venda > 0 ? round2((lucroUnit / venda) * 100) : 0
  const markupPerc = custo > 0 ? round2((lucroUnit / custo) * 100) : 0
  const valorTotalCusto = round2(custo * estoque)
  const valorTotalVenda = round2(venda * estoque)
  const lucroPotencial = round2(valorTotalVenda - valorTotalCusto)

  let statusEstoque: StockStatus = 'NORMAL'
  if (estoque < 0) statusEstoque = 'NEGATIVO'
  else if (estoque === 0) statusEstoque = 'ZERADO'
  else if (minimo !== null && estoque < minimo) statusEstoque = 'CRITICO'
  else if (minimo !== null && estoque <= minimo * 1.2) statusEstoque = 'ALERTA'

  const sugestaoQtd = minimo !== null && estoque < minimo ? Math.max(0, Math.floor(minimo - estoque)) : 0
  const sugestaoCusto = round2(sugestaoQtd * custo)

  return {
    lucro_unitario: lucroUnit,
    margem_percentual: margemPerc,
    markup_percentual: markupPerc,
    valor_total_custo: valorTotalCusto,
    valor_total_venda: valorTotalVenda,
    lucro_potencial: lucroPotencial,
    status_estoque: statusEstoque,
    sugestao_compra_qtd: sugestaoQtd,
    sugestao_compra_custo: sugestaoCusto,
  }
}

/**
 * Assigns `curva_abc` / `curva_abc_acumulada_pct` based on descending `valor_total_venda` rank,
 * without changing the input array's order (ranking is computed on a sorted copy, then mapped
 * back by `id` so an unrelated recompute never silently reshuffles the stored product list).
 */
export function applyCurvaAbc(products: ProductItem[]): ProductItem[] {
  const sorted = [...products].sort((a, b) => b.valor_total_venda - a.valor_total_venda)
  const totalVenda = sorted.reduce((acc, p) => acc + Math.max(0, p.valor_total_venda), 0)

  const classById = new Map<string, { curva_abc: AbcClass; curva_abc_acumulada_pct: number }>()
  let acc = 0
  for (const p of sorted) {
    acc += Math.max(0, p.valor_total_venda)
    const pct = totalVenda > 0 ? round2((acc / totalVenda) * 100) : 100
    const curva_abc: AbcClass = pct <= 80 ? 'A' : pct <= 95 ? 'B' : 'C'
    classById.set(p.id, { curva_abc, curva_abc_acumulada_pct: pct })
  }

  return products.map((p) => ({ ...p, ...classById.get(p.id)! }))
}

export function buildCategoriesSummary(products: ProductItem[]): CategorySummary[] {
  const catMap = new Map<string, CategorySummary>()
  for (const p of products) {
    const c = p.categoria || 'Outros'
    let entry = catMap.get(c)
    if (!entry) {
      entry = {
        categoria: c,
        skus: 0,
        unidades: 0,
        valor_custo: 0,
        valor_venda: 0,
        lucro_potencial: 0,
        itens_zerados: 0,
        itens_criticos: 0,
        itens_excesso: 0,
        participacao_venda_pct: 0,
      }
      catMap.set(c, entry)
    }
    entry.skus += 1
    entry.unidades += p.estoque
    entry.valor_custo += p.valor_total_custo
    entry.valor_venda += p.valor_total_venda
    entry.lucro_potencial += p.lucro_potencial
    if (p.status_estoque === 'ZERADO') entry.itens_zerados += 1
    else if (p.status_estoque === 'CRITICO') entry.itens_criticos += 1
  }

  const valorTotalVenda = products.reduce((acc, p) => acc + p.valor_total_venda, 0)

  return Array.from(catMap.values())
    .map((cat) => ({
      ...cat,
      valor_custo: round2(cat.valor_custo),
      valor_venda: round2(cat.valor_venda),
      lucro_potencial: round2(cat.lucro_potencial),
      participacao_venda_pct: valorTotalVenda > 0 ? round2((cat.valor_venda / valorTotalVenda) * 100) : 0,
    }))
    .sort((a, b) => b.valor_venda - a.valor_venda)
}

export function buildAbcSummary(products: ProductItem[]): DashboardSummary['curva_abc'] {
  const byClass = (cls: AbcClass) => products.filter((p) => p.curva_abc === cls)
  const descricoes: Record<AbcClass, string> = {
    A: '80% do valor imobilizado (Alta Prioridade de Gestão)',
    B: '15% do valor imobilizado (Média Prioridade)',
    C: '5% do valor imobilizado (Cauda Longa / Giro Pontual)',
  }
  const classes: AbcClass[] = ['A', 'B', 'C']
  return classes.reduce((acc, cls) => {
    const items = byClass(cls)
    acc[cls] = {
      classe: cls,
      skus: items.length,
      valor_venda: round2(items.reduce((a, p) => a + p.valor_total_venda, 0)),
      descricao: descricoes[cls],
    }
    return acc
  }, {} as DashboardSummary['curva_abc'])
}

export interface SummaryTotals {
  total_skus: number
  total_unidades: number
  valor_total_custo: number
  valor_total_venda: number
  lucro_potencial_total: number
  margem_media: number
  markup_medio: number
  total_zerados: number
  total_criticos: number
  total_negativos: number
  total_alertas: number
  total_vencidos: number
  total_vence_90d: number
  total_vence_180d: number
}

export function buildSummaryTotals(products: ProductItem[]): SummaryTotals {
  const totalSkus = products.length
  const valorTotalCusto = round2(products.reduce((acc, p) => acc + p.valor_total_custo, 0))
  const valorTotalVenda = round2(products.reduce((acc, p) => acc + p.valor_total_venda, 0))

  return {
    total_skus: totalSkus,
    total_unidades: products.reduce((acc, p) => acc + (p.estoque || 0), 0),
    valor_total_custo: valorTotalCusto,
    valor_total_venda: valorTotalVenda,
    lucro_potencial_total: round2(valorTotalVenda - valorTotalCusto),
    margem_media: totalSkus > 0 ? round2(products.reduce((acc, p) => acc + p.margem_percentual, 0) / totalSkus) : 0,
    markup_medio: totalSkus > 0 ? round2(products.reduce((acc, p) => acc + p.markup_percentual, 0) / totalSkus) : 0,
    total_zerados: products.filter((p) => p.status_estoque === 'ZERADO').length,
    total_criticos: products.filter((p) => p.status_estoque === 'CRITICO').length,
    total_negativos: products.filter((p) => p.status_estoque === 'NEGATIVO').length,
    total_alertas: products.filter((p) => ['ZERADO', 'CRITICO', 'NEGATIVO'].includes(p.status_estoque)).length,
    total_vencidos: products.filter((p) => p.status_validade === 'VENCIDO').length,
    total_vence_90d: products.filter((p) => p.status_validade === 'CRITICO_90D').length,
    total_vence_180d: products.filter((p) => p.status_validade === 'ATENCAO_180D').length,
  }
}

/**
 * Drops leftover rows from the pre-SmartPOS spreadsheet import (category "Estoque em Transição")
 * that are a zero-stock ghost of a product already reconciled from the live SmartPOS catalog
 * under a different `codigo` formatting (e.g. leading-zero variant) with the same `lote`.
 * Rows whose `lote` does not match any other product are left untouched — those are presumed
 * to be distinct, still-unreconciled lots rather than duplicates.
 */
export function dedupeLegacyTransitionRows(products: ProductItem[]): ProductItem[] {
  const liveLotes = new Set(
    products
      .filter((p) => p.categoria !== LEGACY_TRANSITION_CATEGORY && p.lote && p.lote !== 'N/I')
      .map((p) => p.lote.toUpperCase())
  )

  return products.filter((p) => {
    if (p.categoria !== LEGACY_TRANSITION_CATEGORY) return true
    if (p.estoque !== 0) return true
    return !liveLotes.has(p.lote.toUpperCase())
  })
}

export interface InventoryDataset {
  summary: DashboardSummary
  products: ProductItem[]
}

/**
 * Rebuilds `products` (with `curva_abc` assigned) and `summary` (totals, categorias, estoque_top11)
 * from a product list, preserving every other summary field untouched.
 */
export function recomputeDataset(currentSummary: DashboardSummary, products: ProductItem[]): InventoryDataset {
  const withCurvaAbc = applyCurvaAbc(products)
  const totals = buildSummaryTotals(withCurvaAbc)

  return {
    products: withCurvaAbc,
    summary: {
      ...currentSummary,
      ...totals,
      curva_abc: buildAbcSummary(withCurvaAbc),
      categorias: buildCategoriesSummary(withCurvaAbc),
      estoque_top11: InventoryService.getStockTop11Report(withCurvaAbc),
    },
  }
}

/**
 * Applies a manual physical-stock correction to a single product and recomputes every
 * derived field for that product plus every dataset-level aggregate that depends on it.
 * The corrected count becomes the new baseline for the sales-based auto-decrement.
 */
export function applyStockAdjustment(
  dataset: InventoryDataset,
  codigo: string,
  novoEstoque: number,
  nowIso: string = new Date().toISOString()
): InventoryDataset {
  const products = dataset.products.map((p) => {
    if (p.codigo !== codigo) return p

    const derived = computeDerivedProductFields(p.custo, p.valor_venda, novoEstoque, p.estoque_minimo)
    return {
      ...p,
      estoque: novoEstoque,
      baseline_estoque: novoEstoque,
      baseline_at: nowIso,
      ...derived,
    }
  })

  return recomputeDataset(dataset.summary, products)
}

export interface SoldSinceBaseline {
  codigo: string
  quantity: number
  saleDate: string
}

/**
 * Recomputes `estoque` for every product as `baseline_estoque` minus units actually sold
 * (per SmartPOS `/sales`) since that product's own `baseline_at` — the only automatic signal
 * available, since SmartPOS exposes no endpoint for incoming stock/purchases. A product with
 * no sales records in `soldRecords` keeps its current `estoque` unchanged (nothing sold yet).
 */
export function applySalesDecrement(dataset: InventoryDataset, soldRecords: SoldSinceBaseline[]): InventoryDataset {
  const productByCode = new Map(dataset.products.map((p) => [p.codigo, p]))
  const soldByCode = new Map<string, number>()
  for (const rec of soldRecords) {
    const product = productByCode.get(rec.codigo)
    if (!product || !product.baseline_at) continue
    if (new Date(rec.saleDate).getTime() < new Date(product.baseline_at).getTime()) continue
    soldByCode.set(rec.codigo, (soldByCode.get(rec.codigo) || 0) + rec.quantity)
  }

  const products = dataset.products.map((p) => {
    const sold = soldByCode.get(p.codigo)
    if (!sold) return p

    const novoEstoque = p.baseline_estoque - sold
    const derived = computeDerivedProductFields(p.custo, p.valor_venda, novoEstoque, p.estoque_minimo)
    return { ...p, estoque: novoEstoque, ...derived }
  })

  return recomputeDataset(dataset.summary, products)
}
