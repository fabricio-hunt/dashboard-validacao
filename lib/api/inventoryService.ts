import rawData from '@/lib/data/inventoryData.json'
import {
  DashboardSummary,
  ProductItem,
  InventoryFilterOptions,
  RestockItem,
} from '@/types/inventory'

export class InventoryService {
  private static data = rawData as {
    summary: DashboardSummary
    products: ProductItem[]
  }

  public static getSummary(): DashboardSummary {
    return this.data.summary
  }

  public static getAllProducts(): ProductItem[] {
    return this.data.products
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

    this.data.products.forEach((p) => {
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
          investimento_necessario: Math.round(deficit * p.custo * 100) / 100,
          valor_venda_unitario: p.valor_venda,
          prioridade,
        })
      }
    })

    return items.sort(
      (a, b) => b.investimento_necessario - a.investimento_necessario
    )
  }

  public static filterProducts(options: InventoryFilterOptions = {}): {
    items: ProductItem[]
    total: number
  } {
    let filtered = [...this.data.products]

    // Search query
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

    // Category
    if (options.categoria && options.categoria !== 'ALL') {
      filtered = filtered.filter((p) => p.categoria === options.categoria)
    }

    // Status Estoque
    if (options.statusEstoque && options.statusEstoque !== 'ALL') {
      if (options.statusEstoque === 'RUPTURA_CRITICO') {
        filtered = filtered.filter(
          (p) =>
            p.status_estoque === 'ZERADO' ||
            p.status_estoque === 'CRITICO' ||
            p.status_estoque === 'NEGATIVO'
        )
      } else {
        filtered = filtered.filter(
          (p) => p.status_estoque === options.statusEstoque
        )
      }
    }

    // Status Validade
    if (options.statusValidade && options.statusValidade !== 'ALL') {
      if (options.statusValidade === 'RISCO_VALIDADE') {
        filtered = filtered.filter(
          (p) =>
            p.status_validade === 'VENCIDO' ||
            p.status_validade === 'CRITICO_90D' ||
            p.status_validade === 'ATENCAO_180D'
        )
      } else {
        filtered = filtered.filter(
          (p) => p.status_validade === options.statusValidade
        )
      }
    }

    // Curva ABC
    if (options.curvaAbc && options.curvaAbc !== 'ALL') {
      filtered = filtered.filter((p) => p.curva_abc === options.curvaAbc)
    }

    // Fabricante
    if (options.fabricante && options.fabricante !== 'ALL') {
      filtered = filtered.filter((p) => p.fabricante === options.fabricante)
    }

    // Sorting
    const sortBy = options.sortBy || 'valor_total_venda'
    const sortDir = options.sortDirection || 'desc'

    filtered.sort((a, b) => {
      let valA = a[sortBy] as any
      let valB = b[sortBy] as any

      if (typeof valA === 'string') {
        return sortDir === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA)
      }

      valA = valA || 0
      valB = valB || 0
      return sortDir === 'asc' ? valA - valB : valB - valA
    })

    return {
      items: filtered,
      total: filtered.length,
    }
  }
}
