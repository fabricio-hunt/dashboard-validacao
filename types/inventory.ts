export type StockStatus = 'NORMAL' | 'ALERTA' | 'CRITICO' | 'ZERADO' | 'NEGATIVO'

export type ExpirationStatus = 'VENCIDO' | 'CRITICO_90D' | 'ATENCAO_180D' | 'REGULAR' | 'SEM_DATA'

export type AbcClass = 'A' | 'B' | 'C'

export interface ProductItem {
  id: string
  codigo: string
  produto: string
  nome_resumido: string
  fabricante: string
  lote: string
  validade_iso: string | null
  validade: string
  dias_para_vencer: number | null
  status_validade: ExpirationStatus
  categoria: string
  custo: number
  valor_venda: number
  lucro_unitario: number
  margem_percentual: number
  markup_percentual: number
  estoque: number
  estoque_minimo: number | null
  status_estoque: StockStatus
  sugestao_compra_qtd: number
  sugestao_compra_custo: number
  valor_total_custo: number
  valor_total_venda: number
  lucro_potencial: number
  curva_abc_acumulada_pct: number
  curva_abc: AbcClass
}

export interface CategorySummary {
  categoria: string
  skus: number
  unidades: number
  valor_custo: number
  valor_venda: number
  lucro_potencial: number
  itens_zerados: number
  itens_criticos: number
  participacao_venda_pct: number
}

export interface AbcClassSummary {
  classe: AbcClass
  skus: number
  valor_venda: number
  descricao: string
}

export interface DashboardSummary {
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
  total_sugestao_compra_qtd: number
  total_sugestao_compra_custo: number
  curva_abc: {
    A: AbcClassSummary
    B: AbcClassSummary
    C: AbcClassSummary
  }
  categorias: CategorySummary[]
  data_base: string
  origem: string
}

export interface InventoryFilterOptions {
  searchQuery?: string
  categoria?: string
  statusEstoque?: StockStatus | 'ALL' | 'RUPTURA_CRITICO'
  statusValidade?: ExpirationStatus | 'ALL' | 'RISCO_VALIDADE'
  curvaAbc?: AbcClass | 'ALL'
  fabricante?: string
  sortBy?: 'valor_total_venda' | 'estoque' | 'margem_percentual' | 'produto' | 'sugestao_compra_custo'
  sortDirection?: 'asc' | 'desc'
}

export interface RestockItem {
  id: string
  codigo: string
  produto: string
  categoria: string
  fabricante: string
  estoque: number
  estoque_minimo: number
  deficit: number
  sugestao_compra_qtd: number
  custo_unitario: number
  investimento_necessario: number
  valor_venda_unitario: number
  prioridade: 'URGENTE' | 'ALTA' | 'MEDIA'
}

export interface ApiEndpointSpec {
  method: 'GET' | 'POST' | 'PUT'
  path: string
  description: string
  responseSample: any
}
