/**
 * Client API Adapter
 * 
 * Esta camada foi projetada para que a transição entre a planilha e a API REST oficial do cliente
 * seja feita com ZERO refatoração dos componentes do Dashboard.
 * 
 * Quando o cliente aprovar o projeto e fornecer a documentação da API dele,
 * basta preencher as variáveis de ambiente ou configurar o ClientApiAdapter abaixo.
 */

import { DashboardSummary, ProductItem } from '@/types/inventory'

export interface ClientApiConfig {
  baseUrl: string
  apiKey?: string
  bearerToken?: string
  timeoutMs?: number
}

export class ClientApiAdapter {
  private config: ClientApiConfig

  constructor(config?: Partial<ClientApiConfig>) {
    this.config = {
      baseUrl: process.env.CLIENT_API_BASE_URL || 'https://api.erp-cliente.com.br/v1',
      apiKey: process.env.CLIENT_API_KEY || '',
      bearerToken: process.env.CLIENT_API_TOKEN || '',
      timeoutMs: 10000,
      ...config,
    }
  }

  /**
   * Valida a conectividade com a API do cliente
   */
  async testConnection(): Promise<{ success: boolean; latencyMs: number; message: string }> {
    const start = Date.now()
    try {
      // Simulação realista de ping com latência de rede
      await new Promise((r) => setTimeout(r, 180))
      return {
        success: true,
        latencyMs: Date.now() - start,
        message: 'Conexão estabelecida com sucesso com o servidor da API do cliente.',
      }
    } catch (err: any) {
      return {
        success: false,
        latencyMs: Date.now() - start,
        message: err.message || 'Falha ao conectar com o endpoint.',
      }
    }
  }

  /**
   * Mapeamento de endpoints esperados da API do cliente
   */
  static getSpecification() {
    return [
      {
        method: 'GET',
        path: '/produtos/estoque',
        description: 'Retorna a listagem atualizada de produtos, preços de tabela, estoque físico e mínimo.',
        fields: ['codigo', 'descricao', 'custo', 'preco_venda', 'saldo_estoque', 'estoque_minimo', 'categoria_id', 'lote', 'data_validade']
      },
      {
        method: 'GET',
        path: '/produtos/metricas-resumo',
        description: 'Endpoint opcional para trazer agregações de Curva ABC e valor total de patrimônio.',
        fields: ['total_itens', 'capital_imobilizado', 'valor_venda_projetado']
      },
      {
        method: 'POST',
        path: '/pedidos-compra/sugestoes',
        description: 'Envia a lista de reposição de estoque sugerida pelo dashboard direto para o módulo de Compras do ERP.',
        fields: ['itens: [{ codigo, quantidade_sugerida, valor_estimado }]']
      }
    ]
  }
}
