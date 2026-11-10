/**
 * SmartPOS Official API Adapter
 * Base URL: https://api.smartpos.app/v1
 * Autenticação: X-Api-Key-Id + X-Api-Key-Secret
 */

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
  details?: unknown
}

export interface SmartPosProduct {
  id: number
  alphaCode?: string
  name: string
  sellValue: number
  costValue: number
  eanCode?: string
  noStock?: boolean
  isArchived?: boolean
  updatedAt?: string
  category?: {
    description?: string
  }
  supplier?: {
    companyName?: string
  }
}

export interface SmartPosSale {
  id: string
  uniqueIdentifier: string
  creationDate: string
  isBudget: boolean
  isCanceled: boolean
  totalAmount: number
  discountAmount: number
  netAmount: number
  profit: number
}

export interface SmartPosSaleItem {
  quantity: number
  costPrice: number
  listPrice: number
  usedPrice: number
  netItem: number
  profit: number
  product: {
    id: number
    alphaCode?: string
    name: string
    category?: {
      description?: string
    }
  }
}

const MAX_SMARTPOS_RANGE_DAYS = 115
const SALE_ITEMS_CONCURRENCY = 8

export class SmartPosClient {
  private baseUrl: string
  private keyId: string
  private keySecret: string
  private timeoutMs: number

  constructor(config?: Partial<SmartPosConfig>) {
    this.baseUrl = (config?.baseUrl || process.env.SMARTPOS_BASE_URL || 'https://api.smartpos.app/v1').replace(/\/+$/, '')
    this.keyId = config?.keyId || process.env.SMARTPOS_KEY_ID || ''
    this.keySecret = config?.keySecret || process.env.SMARTPOS_KEY_SECRET || ''
    this.timeoutMs = config?.timeoutMs || 12000
  }

  hasCredentials(): boolean {
    return Boolean(this.keyId && this.keySecret)
  }

  private async requestJson<T>(path: string, override?: Partial<SmartPosConfig>): Promise<{ status: number; data: T | null }> {
    const keyId = override?.keyId ?? this.keyId
    const keySecret = override?.keySecret ?? this.keySecret
    const baseUrl = (override?.baseUrl ?? this.baseUrl).replace(/\/+$/, '')

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs)

    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method: 'GET',
        headers: {
          'X-Api-Key-Id': keyId,
          'X-Api-Key-Secret': keySecret,
          Accept: 'application/json',
          'User-Agent': 'SmartPOS-Dashboard-Client/1.0',
        },
        cache: 'no-store',
        signal: controller.signal,
      })

      let data: T | null = null
      try {
        data = (await response.json()) as T
      } catch {
        data = null
      }

      return { status: response.status, data }
    } finally {
      clearTimeout(timeoutId)
    }
  }

  async testConnection(overrideConfig?: Partial<SmartPosConfig>): Promise<SmartPosTestResult> {
    const keyId = overrideConfig?.keyId ?? this.keyId
    const keySecret = overrideConfig?.keySecret ?? this.keySecret
    const start = Date.now()

    if (!keyId || !keySecret) {
      return {
        success: false,
        statusCode: 400,
        latencyMs: 0,
        message: 'Credenciais incompletas: informe Identificador (X-Api-Key-Id) e Segredo (X-Api-Key-Secret).',
      }
    }

    try {
      const { status, data } = await this.requestJson<unknown>('/products?page=1&size=1', overrideConfig)
      const latencyMs = Date.now() - start

      if (status >= 200 && status < 300) {
        return {
          success: true,
          statusCode: status,
          latencyMs,
          message: 'Autenticação validada com sucesso na API SmartPOS.',
          details: data,
        }
      }

      if (status === 401) {
        return {
          success: false,
          statusCode: 401,
          latencyMs,
          message: 'HTTP 401 Unauthorized: headers reconhecidos, mas X-Api-Key-Id ou X-Api-Key-Secret rejeitados.',
          details: data,
        }
      }

      if (status === 403) {
        return {
          success: false,
          statusCode: 403,
          latencyMs,
          message: 'HTTP 403 Forbidden: acesso negado pelo gateway.',
          details: data,
        }
      }

      return {
        success: false,
        statusCode: status,
        latencyMs,
        message: `Servidor retornou HTTP ${status}`,
        details: data,
      }
    } catch (err: unknown) {
      const latencyMs = Date.now() - start
      const message = err instanceof Error && err.name === 'AbortError'
        ? 'Timeout ao conectar na API SmartPOS.'
        : err instanceof Error
          ? err.message
          : 'Erro de conexão com SmartPOS.'
      return { success: false, statusCode: 0, latencyMs, message }
    }
  }

  async getProductsPage(page = 1, size = 100): Promise<{ totalRecords: number; items: SmartPosProduct[] }> {
    const { status, data } = await this.requestJson<{ totalRecords: number; items: SmartPosProduct[] }>(
      `/products?page=${page}&size=${size}`
    )
    if (status < 200 || status >= 300 || !data) {
      throw new Error(`Falha ao consultar produtos SmartPOS (HTTP ${status})`)
    }
    return data
  }

  async getSales(startDate: string, endDate: string): Promise<SmartPosSale[]> {
    const start = new Date(`${startDate}T00:00:00-04:00`)
    const end = new Date(`${endDate}T23:59:59-04:00`)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
      throw new Error('Intervalo de datas inválido para consulta SmartPOS.')
    }

    // SmartPOS limita cada requisição de /sales a 120 dias (erro MO-7)
    const chunks: Array<{ from: string; to: string }> = []
    let cursor = new Date(start)
    while (cursor <= end) {
      const next = new Date(cursor)
      next.setUTCDate(next.getUTCDate() + MAX_SMARTPOS_RANGE_DAYS)
      const chunkEnd = next < end ? next : end
      chunks.push({ from: cursor.toISOString(), to: chunkEnd.toISOString() })
      cursor = new Date(chunkEnd.getTime() + 1000)
    }

    const allSales: SmartPosSale[] = []
    for (const chunk of chunks) {
      const query = `/sales?start=${encodeURIComponent(chunk.from)}&end=${encodeURIComponent(chunk.to)}`
      const { status, data } = await this.requestJson<SmartPosSale[]>(query)
      if (status < 200 || status >= 300 || !Array.isArray(data)) {
        throw new Error(`Falha ao consultar vendas SmartPOS (HTTP ${status})`)
      }
      allSales.push(...data)
    }

    return allSales.filter((sale) => !sale.isCanceled && !sale.isBudget)
  }

  async getSaleItems(uniqueIdentifier: string): Promise<SmartPosSaleItem[]> {
    const { status, data } = await this.requestJson<SmartPosSaleItem[]>(
      `/sales/${encodeURIComponent(uniqueIdentifier)}/items`
    )
    if (status < 200 || status >= 300 || !Array.isArray(data)) {
      return []
    }
    return data
  }

  async getSalesItemsForPeriod(startDate: string, endDate: string): Promise<{
    sales: SmartPosSale[]
    items: SmartPosSaleItem[]
  }> {
    const sales = await this.getSales(startDate, endDate)
    const items: SmartPosSaleItem[] = []

    for (let i = 0; i < sales.length; i += SALE_ITEMS_CONCURRENCY) {
      const batch = sales.slice(i, i + SALE_ITEMS_CONCURRENCY)
      const batchResults = await Promise.all(
        batch.map((sale) => this.getSaleItems(sale.uniqueIdentifier))
      )
      batchResults.forEach((saleItems) => items.push(...saleItems))
    }

    return { sales, items }
  }

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
        description: 'Recupera o cadastro completo de um produto específico por ID, incluindo fornecedor e NCM.',
        params: ['id'],
      },
      {
        method: 'GET',
        path: '/sales',
        description: 'Lista o histórico de vendas realizadas por período (máx. 120 dias por chamada) e terminal.',
        params: ['start', 'end', 'status-nf', 'terminal-type'],
      },
      {
        method: 'GET',
        path: '/sales/{uniqueIdentifier}/items',
        description: 'Lista os itens, custos, valores líquidos e lucro bruto de uma venda específica.',
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
