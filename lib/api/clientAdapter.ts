/**
 * SmartPOS Official API Adapter
 * 
 * Base URL: https://api.smartpos.app/v1
 * Autenticação oficial:
 *   Header 'X-Api-Key-Id': Identificador UUID da chave gerada no SmartPOS WEB
 *   Header 'X-Api-Key-Secret': Chave secreta de uso único gerada no SmartPOS WEB
 */

import { DashboardSummary, ProductItem } from '@/types/inventory'

export interface SmartPosConfig {
  baseUrl: string
  keyId: string
  keySecret: string
  timeoutMs?: number
}

export interface SmartPosTestResult {
  success: boolean
  statusCode: number
  latencyMs: number
  message: string
  details?: any
}

export class SmartPosClient {
  private baseUrl: string
  private keyId: string
  private keySecret: string
  private timeoutMs: number

  constructor(config?: Partial<SmartPosConfig>) {
    this.baseUrl = config?.baseUrl || process.env.SMARTPOS_BASE_URL || 'https://api.smartpos.app/v1'
    this.keyId = config?.keyId || process.env.SMARTPOS_KEY_ID || ''
    this.keySecret = config?.keySecret || process.env.SMARTPOS_KEY_SECRET || ''
    this.timeoutMs = config?.timeoutMs || 10000
  }

  private getHeaders(): HeadersInit {
    return {
      'X-Api-Key-Id': this.keyId,
      'X-Api-Key-Secret': this.keySecret,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'SmartPOS-Dashboard-Client/1.0',
    }
  }

  /**
   * Testa a conectividade e autenticação com a API oficial SmartPOS
   */
  async testConnection(overrideConfig?: Partial<SmartPosConfig>): Promise<SmartPosTestResult> {
    const keyId = overrideConfig?.keyId ?? this.keyId
    const keySecret = overrideConfig?.keySecret ?? this.keySecret
    const baseUrl = overrideConfig?.baseUrl ?? this.baseUrl

    const start = Date.now()

    if (!keyId || !keySecret) {
      return {
        success: false,
        statusCode: 400,
        latencyMs: 0,
        message: 'Credenciais incompletas: informe tanto o Identificador (X-Api-Key-Id) quanto o Segredo (X-Api-Key-Secret).',
      }
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs)

      const response = await fetch(`${baseUrl}/products?size=1`, {
        method: 'GET',
        headers: {
          'X-Api-Key-Id': keyId,
          'X-Api-Key-Secret': keySecret,
          'Accept': 'application/json',
          'User-Agent': 'SmartPOS-Dashboard-Client/1.0',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      const latencyMs = Date.now() - start
      let data: any = null
      try {
        data = await response.json()
      } catch {
        // Ignora erro de parse de JSON se corpo for vazio
      }

      if (response.ok) {
        return {
          success: true,
          statusCode: response.status,
          latencyMs,
          message: 'Autenticação validada com sucesso! Acesso aos produtos liberado na API SmartPOS.',
          details: data,
        }
      }

      if (response.status === 401) {
        return {
          success: false,
          statusCode: 401,
          latencyMs,
          message: 'HTTP 401 Unauthorized: Os headers X-Api-Key-Id e X-Api-Key-Secret foram reconhecidos, mas as credenciais não foram validadas no SmartPOS. Verifique se a chave possui permissões ativas no painel WEB.',
          details: data,
        }
      }

      if (response.status === 403) {
        return {
          success: false,
          statusCode: 403,
          latencyMs,
          message: 'HTTP 403 Forbidden: Acesso negado pelo firewall ou restrição de IP/namespace.',
          details: data,
        }
      }

      return {
        success: false,
        statusCode: response.status,
        latencyMs,
        message: `Servidor retornou status HTTP ${response.status}`,
        details: data,
      }
    } catch (err: any) {
      const latencyMs = Date.now() - start
      return {
        success: false,
        statusCode: 0,
        latencyMs,
        message: err.name === 'AbortError' ? 'Timeout ao tentar conectar na API SmartPOS.' : err.message,
      }
    }
  }

  /**
   * Retorna os endpoints documentados da SmartPOS
   */
  static getDocumentationEndpoints() {
    return [
      {
        method: 'GET',
        path: '/products',
        description: 'Lista os produtos cadastrados com paginação, código alfa, nome, preço e status.',
        params: ['page', 'size', 'name', 'alpha-code', 'archived'],
      },
      {
        method: 'GET',
        path: '/products/{id}',
        description: 'Recupera o cadastro completo de um produto específico por ID, incluindo fornecedor e estoque.',
        params: ['id'],
      },
      {
        method: 'GET',
        path: '/sales',
        description: 'Lista o histórico de vendas realizadas por período e terminal.',
        params: ['start', 'end', 'status-nf', 'terminal-type'],
      },
      {
        method: 'GET',
        path: '/sales/{uniqueIdentifier}/items',
        description: 'Lista os itens e composição tributária de uma venda específica.',
        params: ['uniqueIdentifier'],
      },
      {
        method: 'GET',
        path: '/categories',
        description: 'Lista todas as categorias de mercadorias da loja/empresa.',
        params: ['page', 'size', 'name', 'archived'],
      },
      {
        method: 'PUT',
        path: '/products/stock/{id}',
        description: 'Altera o saldo de estoque físico do produto (operações ADD, REMOVE, SET).',
        params: ['productId', 'productVariantId', 'quantity', 'stockOperation'],
      },
    ]
  }
}
