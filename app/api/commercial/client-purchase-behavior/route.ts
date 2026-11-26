import { NextRequest, NextResponse } from 'next/server'
import { SalesDataService, SalesDataUnavailableError } from '@/lib/api/salesDataService'
import { specificMonthRange } from '@/lib/domain/periodRanges'
import { buildClientPurchaseBehavior, buildRollingMonthWindow } from '@/lib/metrics/clientPurchaseBehavior'
import { ClientPurchaseBehaviorResponse } from '@/types/commercial'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
}

const ANCHOR_PATTERN = /^(\d{4})-(\d{2})$/
const WINDOW_SIZE = 13

/** Optional "end" query param (YYYY-MM) picks the anchor month; defaults to the current month on
 * any missing/malformed value — this param is cosmetic, so a silent fallback is friendlier than
 * a 400 here, unlike the load-bearing start/end/year params on the sibling routes. */
function resolveAnchor(raw: string | null): { year: number; month: number } {
  const match = raw ? ANCHOR_PATTERN.exec(raw) : null
  if (match) {
    return { year: Number(match[1]), month: Number(match[2]) }
  }
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const anchor = resolveAnchor(searchParams.get('end'))
  const months = buildRollingMonthWindow(anchor.year, anchor.month, WINDOW_SIZE)

  const firstBucket = months[0]
  const lastBucket = months[months.length - 1]
  const startDate = specificMonthRange(firstBucket.year, firstBucket.month).startDate
  const endDate = specificMonthRange(lastBucket.year, lastBucket.month).endDate

  try {
    const [sales, customers] = await Promise.all([
      SalesDataService.getSalesForPeriod(startDate, endDate),
      SalesDataService.getAllCustomers(),
    ])

    const rows = buildClientPurchaseBehavior(customers, sales, months)

    const response: ClientPurchaseBehaviorResponse = {
      months,
      rows,
      origem: 'smartpos_api',
    }

    return NextResponse.json(response, { headers: NO_STORE_HEADERS })
  } catch (error: unknown) {
    const notice =
      error instanceof SalesDataUnavailableError && error.reason === 'missing_credentials'
        ? 'Configure SMARTPOS_KEY_ID e SMARTPOS_KEY_SECRET para consultar o comportamento de compras por cliente ao vivo.'
        : error instanceof Error
          ? `Falha temporária na SmartPOS (${error.message}).`
          : 'Falha desconhecida ao consultar a API SmartPOS.'

    const response: ClientPurchaseBehaviorResponse = {
      months,
      rows: [],
      origem: 'unavailable',
      notice,
    }

    return NextResponse.json(response, { headers: NO_STORE_HEADERS })
  }
}
