import rawData from '@/lib/data/inventoryData.json'
import {
  CategorySummary,
  DashboardSummary,
  ExcessItem,
  InventoryFilterOptions,
  ProductItem,
  RestockItem,
  StockFamilyReport,
  StockFamilyRow,
} from '@/types/inventory'
import {
  classifyProductFamily,
  isExcessStock,
  normalizeExcessMultiplier,
  TOP_PRODUCT_FAMILIES,
} from '@/lib/domain/familyClassifier'

const DEFAULT_CONTAS_A_RECEBER = 51489.41

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export class InventoryService {
  private static data = rawData as {
    summary: DashboardSummary
    products: ProductItem[]
  }

  public static getAllProducts(excessMultiplier = 3): ProductItem[] {
    const mult = normalizeExcessMultiplier(excessMultiplier)
    return this.data.products.map((p) => ({
      ...p,
      em_excesso: isExcessStock(p, mult),
    }))
  }

  public static getStockTop11Report(products: ProductItem[]): StockFamilyReport {
    const buckets = new Map<string, { custo: number; venda: number; skus: number }>()
    TOP_PRODUCT_FAMILIES.forEach((fam) => buckets.set(fam, { custo: 0, venda: 0, skus: 0 }))
    buckets.set('DEMAIS', { custo: 0, venda: 0, skus: 0 })

    let totalCusto = 0
    let totalVenda = 0

    for (const p of products) {
      const fam = classifyProductFamily(p.produto)
      const entry = buckets.get(fam) || buckets.get('DEMAIS')!
      const c = Math.max(0, p.valor_total_custo)
      const v = Math.max(0, p.valor_total_venda)
      entry.custo += c
      entry.venda += v
      entry.skus += 1
      totalCusto += c
      totalVenda += v
    }

    const top11Raw = TOP_PRODUCT_FAMILIES.map((fam) => {
      const val = buckets.get(fam)!
      return {
        produto: fam,
        precoCusto: round2(val.custo),
        precoVenda: round2(val.venda),
        pctCusto: totalCusto > 0 ? round2((val.custo / totalCusto) * 100) : 0,
        pctVenda: totalVenda > 0 ? round2((val.venda / totalVenda) * 100) : 0,
        skus: val.skus,
      }
    }).sort((a, b) => b.precoCusto - a.precoCusto)

    const top11: StockFamilyRow[] = top11Raw.map((row, idx) => ({
      rank: idx + 1,
      ...row,
    }))

    const demaisVal = buckets.get('DEMAIS')!
    const demais: StockFamilyRow = {
      rank: null,
      produto: 'DEMAIS',
      precoCusto: round2(demaisVal.custo),
      precoVenda: round2(demaisVal.venda),
      pctCusto: totalCusto > 0 ? round2((demaisVal.custo / totalCusto) * 100) : 0,
      pctVenda: totalVenda > 0 ? round2((demaisVal.venda / totalVenda) * 100) : 0,
      skus: demaisVal.skus,
    }

    const total: StockFamilyRow = {
      rank: null,
      produto: 'TOTAL',
      precoCusto: round2(totalCusto),
      precoVenda: round2(totalVenda),
      pctCusto: 100,
      pctVenda: 100,
      skus: products.length,
    }

    const top11Custo = top11.reduce((acc, r) => acc + r.precoCusto, 0)
    const top11Venda = top11.reduce((acc, r) => acc + r.precoVenda, 0)

    return {
      top11,
      demais,
      total,
      top11ShareCustoPct: totalCusto > 0 ? Math.round((top11Custo / totalCusto) * 100) : 0,
      top11ShareVendaPct: totalVenda > 0 ? Math.round((top11Venda / totalVenda) * 100) : 0,
    }
  }

  public static getSummary(excessMultiplier = 3, contasAReceber?: number): DashboardSummary {
    const mult = normalizeExcessMultiplier(excessMultiplier)
    const products = this.getAllProducts(mult)

    const excessByCategory = new Map<string, number>()
    let totalExcesso = 0
    for (const p of products) {
      if (p.em_excesso) {
        totalExcesso += 1
        excessByCategory.set(p.categoria, (excessByCategory.get(p.categoria) || 0) + 1)
      }
    }

    const categorias: CategorySummary[] = this.data.summary.categorias
      .map((cat) => ({
        ...cat,
        itens_excesso: excessByCategory.get(cat.categoria) || 0,
      }))
      .sort((a, b) => b.valor_custo - a.valor_custo)

    const rawReceber =
      contasAReceber !== undefined
        ? contasAReceber
        : Number(process.env.CONTAS_A_RECEBER_VALOR ?? DEFAULT_CONTAS_A_RECEBER)

    return {
      ...this.data.summary,
      total_excesso: totalExcesso,
      excess_multiplier: mult,
      contas_a_receber: Number.isFinite(rawReceber) ? round2(rawReceber) : DEFAULT_CONTAS_A_RECEBER,
      categorias,
      estoque_top11: this.getStockTop11Report(products),
    }
  }

  public static getCategories(): string[] {
    const set = new Set<string>()
    this.data.products.forEach((p) => {
      if (p.categoria) set.add(p.categoria)
    })
    return Array.from(set).sort()
  }

  public static getManufacturers(): string[] {
    const set = new Set<string>()
    this.data.products.forEach((p) => {
      if (p.fabricante && p.fabricante !== 'NÃO ESPECIFICADO') {
        set.add(p.fabricante)
      }
    })
    return Array.from(set).sort()
  }

  public static getRestockRecommendations(): RestockItem[] {
    const items: RestockItem[] = []

    for (const p of this.data.products) {
      if (p.estoque_minimo !== null && p.estoque < p.estoque_minimo) {
        const deficit = p.estoque_minimo - p.estoque
        let prioridade: 'URGENTE' | 'ALTA' | 'MEDIA' = 'MEDIA'
        if (p.estoque <= 0) {
          prioridade = 'URGENTE'
        } else if (p.estoque < p.estoque_minimo * 0.5) {
          prioridade = 'ALTA'
        }

        items.push({
          id: p.id,
          codigo: p.codigo,
          produto: p.produto,
          categoria: p.categoria,
          fabricante: p.fabricante,
          estoque: p.estoque,
          estoque_minimo: p.estoque_minimo,
          deficit,
          sugestao_compra_qtd: deficit,
          custo_unitario: p.custo,
          investimento_necessario: round2(deficit * p.custo),
          valor_venda_unitario: p.valor_venda,
          prioridade,
        })
      }
    }

    return items.sort((a, b) => b.investimento_necessario - a.investimento_necessario)
  }

  public static getExcessRecommendations(excessMultiplier = 3): ExcessItem[] {
    const mult = normalizeExcessMultiplier(excessMultiplier)
    const items: ExcessItem[] = []

    for (const p of this.data.products) {
      if (isExcessStock(p, mult) && p.estoque_minimo !== null) {
        const teto = Math.ceil(p.estoque_minimo * mult)
        const excedente = Math.max(0, p.estoque - teto)
        items.push({
          id: p.id,
          codigo: p.codigo,
          produto: p.produto,
          categoria: p.categoria,
          fabricante: p.fabricante,
          estoque: p.estoque,
          estoque_minimo: p.estoque_minimo,
          excedente,
          fator_cobertura: round2(p.estoque / p.estoque_minimo),
          capital_excedente_custo: round2(excedente * p.custo),
          valor_venda_excedente: round2(excedente * p.valor_venda),
        })
      }
    }

    return items.sort((a, b) => b.capital_excedente_custo - a.capital_excedente_custo)
  }

  public static filterProducts(options: InventoryFilterOptions = {}): {
    items: ProductItem[]
    total: number
  } {
    const mult = normalizeExcessMultiplier(options.excessMultiplier)
    let filtered = this.getAllProducts(mult)

    if (options.searchQuery && options.searchQuery.trim() !== '') {
      const q = options.searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (p) =>
          p.codigo.toLowerCase().includes(q) ||
          p.produto.toLowerCase().includes(q) ||
          p.categoria.toLowerCase().includes(q) ||
          p.fabricante.toLowerCase().includes(q) ||
          p.lote.toLowerCase().includes(q)
      )
    }

    if (options.categoria && options.categoria !== 'ALL') {
      filtered = filtered.filter((p) => p.categoria === options.categoria)
    }

    if (options.statusEstoque && options.statusEstoque !== 'ALL') {
      if (options.statusEstoque === 'RUPTURA_CRITICO') {
        filtered = filtered.filter(
          (p) =>
            p.status_estoque === 'ZERADO' ||
            p.status_estoque === 'CRITICO' ||
            p.status_estoque === 'NEGATIVO'
        )
      } else if (options.statusEstoque === 'EXCESSO') {
        filtered = filtered.filter((p) => Boolean(p.em_excesso))
      } else {
        filtered = filtered.filter((p) => p.status_estoque === options.statusEstoque)
      }
    }

    if (options.statusValidade && options.statusValidade !== 'ALL') {
      if (options.statusValidade === 'RISCO_VALIDADE') {
        filtered = filtered.filter(
          (p) =>
            p.status_validade === 'VENCIDO' ||
            p.status_validade === 'CRITICO_90D' ||
            p.status_validade === 'ATENCAO_180D'
        )
      } else {
        filtered = filtered.filter((p) => p.status_validade === options.statusValidade)
      }
    }

    if (options.curvaAbc && options.curvaAbc !== 'ALL') {
      filtered = filtered.filter((p) => p.curva_abc === options.curvaAbc)
    }

    if (options.fabricante && options.fabricante !== 'ALL') {
      filtered = filtered.filter((p) => p.fabricante === options.fabricante)
    }

    const sortBy = options.sortBy || 'valor_total_venda'
    const sortDir = options.sortDirection || 'desc'

    filtered.sort((a, b) => {
      const valA = a[sortBy]
      const valB = b[sortBy]

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
      }

      const numA = Number(valA || 0)
      const numB = Number(valB || 0)
      return sortDir === 'asc' ? numA - numB : numB - numA
    })

    return {
      items: filtered,
      total: filtered.length,
    }
  }
}
