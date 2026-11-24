import { SmartPosClient, SmartPosSale, SmartPosSaleItem } from '@/lib/api/clientAdapter'

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

const CACHE_TTL_MS = 5 * 60 * 1000
const periodCache = new Map<string, CachedPeriodEntry>()

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
}
