export type StockStatus = 'NORMAL' | 'ALERTA' | 'CRITICO' | 'ZERADO' | 'NEGATIVO' | 'EXCESSO'

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
  em_excesso?: boolean
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
  itens_excesso: number
  participacao_venda_pct: number
}

export interface AbcClassSummary {
  classe: AbcClass
  skus: number
  valor_venda: number
  descricao: string
}

export interface StockFamilyRow {
  rank: number | null
  produto: string
  pctCusto: number
  precoCusto: number
  pctVenda: number
  precoVenda: number
  skus: number
}

export interface StockFamilyReport {
  top11: StockFamilyRow[]
  demais: StockFamilyRow
  total: StockFamilyRow
  top11ShareCustoPct: number
  top11ShareVendaPct: number
}

export interface SalesFamilyRow {
  rank: number | null
  produto: string
  participacaoPct: number
  vendas: number
  vendLucPct: number
  lucroBruto: number
}

export interface SalesRankingReport {
  startDate: string
  endDate: string
  totalSalesCount: number
  top11: SalesFamilyRow[]
  demais: SalesFamilyRow
  total: SalesFamilyRow
  top11ShareVendasPct: number
  top11ShareLucroPct: number
  origem: 'smartpos_api' | 'snapshot'
  notice?: string
}

export interface SyncMetadata {
  last_sync_at: string
  last_sync_brt: string
  sync_status: 'SUCCESS' | 'WARNING' | 'ERROR'
  produtos_api: number
  skus_conciliados: number
  origem: string
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
  total_excesso: number
  excess_multiplier: number
  total_vencidos: number
  total_vence_90d: number
  total_vence_180d: number
  total_sugestao_compra_qtd: number
  total_sugestao_compra_custo: number
  contas_a_receber: number
  curva_abc: {
    A: AbcClassSummary
    B: AbcClassSummary
    C: AbcClassSummary
  }
  categorias: CategorySummary[]
  estoque_top11: StockFamilyReport
  data_base: string
  origem: string
  last_sync_at?: string
  last_sync_brt?: string
  sync_metadata?: SyncMetadata
}

export interface InventoryFilterOptions {
  searchQuery?: string
  categoria?: string
  statusEstoque?: StockStatus | 'ALL' | 'RUPTURA_CRITICO' | 'EXCESSO'
  statusValidade?: ExpirationStatus | 'ALL' | 'RISCO_VALIDADE'
  curvaAbc?: AbcClass | 'ALL'
  fabricante?: string
  excessMultiplier?: number
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

export interface ExcessItem {
  id: string
  codigo: string
  produto: string
  categoria: string
  fabricante: string
  estoque: number
  estoque_minimo: number
  excedente: number
  fator_cobertura: number
  capital_excedente_custo: number
  valor_venda_excedente: number
}
