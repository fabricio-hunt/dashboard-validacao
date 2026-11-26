import { SmartPosClient, SmartPosCustomer, SmartPosSale, SmartPosSaleItem } from '@/lib/api/clientAdapter'

export type SalesDataUnavailableReason = 'missing_credentials' | 'api_error'

export class SalesDataUnavailableError extends Error {
  constructor(public readonly reason: SalesDataUnavailableReason, message: string) {
    super(message)
  }
}

interface CachedPeriodEntry {
  expiresAt: number
  sales: SmartPosSale[]
  items: SmartPosSaleItem[]
}

interface CachedSalesOnlyEntry {
  expiresAt: number
  sales: SmartPosSale[]
}

interface CachedCustomersEntry {
  expiresAt: number
  customers: SmartPosCustomer[]
}

const CACHE_TTL_MS = 5 * 60 * 1000
const CUSTOMERS_CACHE_TTL_MS = 30 * 60 * 1000
const periodCache = new Map<string, CachedPeriodEntry>()
const salesOnlyCache = new Map<string, CachedSalesOnlyEntry>()
let customersCache: CachedCustomersEntry | null = null

/**
 * Centralizes SmartPOS sales+items fetching (with the same 5-min cache TTL pattern used by
 * DashboardService) so the commercial-metrics, abc-sales and monthly-revenue routes don't each
 * issue duplicate SmartPOS calls for an overlapping period. Never fabricates data on failure —
 * callers decide the zeros+notice fallback.
 */
export class SalesDataService {
  public static hasCredentials(): boolean {
    return new SmartPosClient().hasCredentials()
  }

  public static async getSalesItemsForPeriod(
    startDate: string,
    endDate: string
  ): Promise<{ sales: SmartPosSale[]; items: SmartPosSaleItem[] }> {
    const cacheKey = `${startDate}__${endDate}`
    const cached = periodCache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) {
      return { sales: cached.sales, items: cached.items }
    }

    const client = new SmartPosClient()
    if (!client.hasCredentials()) {
      throw new SalesDataUnavailableError(
        'missing_credentials',
        'Credenciais SmartPOS não configuradas (SMARTPOS_KEY_ID/SMARTPOS_KEY_SECRET).'
      )
    }

    try {
      const { sales, items } = await client.getSalesItemsForPeriod(startDate, endDate)
      periodCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, sales, items })
      return { sales, items }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido na API SmartPOS'
      throw new SalesDataUnavailableError('api_error', message)
    }
  }

  /**
   * Sales-only fetch (no per-sale item lookup) for features that only need sale-level totals
   * and the embedded customer — avoids the N extra `/sales/{id}/items` calls that
   * `getSalesItemsForPeriod` makes, which would be wasteful over a wide multi-month window.
   */
  public static async getSalesForPeriod(startDate: string, endDate: string): Promise<SmartPosSale[]> {
    const cacheKey = `${startDate}__${endDate}`
    const cached = salesOnlyCache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) {
      return cached.sales
    }

    const client = new SmartPosClient()
    if (!client.hasCredentials()) {
      throw new SalesDataUnavailableError(
        'missing_credentials',
        'Credenciais SmartPOS não configuradas (SMARTPOS_KEY_ID/SMARTPOS_KEY_SECRET).'
      )
    }

    try {
      const sales = await client.getSales(startDate, endDate)
      salesOnlyCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, sales })
      return sales
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido na API SmartPOS'
      throw new SalesDataUnavailableError('api_error', message)
    }
  }

  /** Full customer/supplier registry, cached longer than sales since it changes far less often. */
  public static async getAllCustomers(): Promise<SmartPosCustomer[]> {
    if (customersCache && customersCache.expiresAt > Date.now()) {
      return customersCache.customers
    }

    const client = new SmartPosClient()
    if (!client.hasCredentials()) {
      throw new SalesDataUnavailableError(
        'missing_credentials',
        'Credenciais SmartPOS não configuradas (SMARTPOS_KEY_ID/SMARTPOS_KEY_SECRET).'
      )
    }

    try {
      const customers = await client.getAllCustomers()
      customersCache = { expiresAt: Date.now() + CUSTOMERS_CACHE_TTL_MS, customers }
      return customers
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido na API SmartPOS'
      throw new SalesDataUnavailableError('api_error', message)
    }
  }
}
