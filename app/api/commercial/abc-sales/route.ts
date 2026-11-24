import { NextRequest, NextResponse } from 'next/server'
import { SalesDataService, SalesDataUnavailableError } from '@/lib/api/salesDataService'
import { currentMonthRange } from '@/lib/domain/periodRanges'
import { validatePeriodRange } from '@/lib/domain/periodValidation'
import { ABC_SALES_CUTOFFS, buildSalesAbcCurve } from '@/lib/metrics/abcSales'
import { SalesAbcResponse } from '@/types/commercial'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const defaultRange = currentMonthRange()

  const rawStart = searchParams.get('start') ?? defaultRange.startDate
  const rawEnd = searchParams.get('end') ?? defaultRange.endDate

  const validation = validatePeriodRange(rawStart, rawEnd)
  if (!validation.valid) {
    return NextResponse.json(
      { success: false, message: validation.message },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  const { startDate, endDate } = validation

  try {
    const { items } = await SalesDataService.getSalesItemsForPeriod(startDate, endDate)
    const rows = buildSalesAbcCurve(items)
    const totalNetRevenue = rows.reduce((acc, row) => acc + Math.max(0, row.netRevenue), 0)
    const totalProfit = rows.reduce((acc, row) => acc + row.profit, 0)

    const response: SalesAbcResponse = {
      startDate,
      endDate,
      rows,
      totalNetRevenue: Math.round(totalNetRevenue * 100) / 100,
      totalProfit: Math.round(totalProfit * 100) / 100,
      cutoffs: ABC_SALES_CUTOFFS,
      origem: 'smartpos_api',
    }

    return NextResponse.json(response, { headers: NO_STORE_HEADERS })
  } catch (error: unknown) {
    const notice =
      error instanceof SalesDataUnavailableError && error.reason === 'missing_credentials'
        ? 'Configure SMARTPOS_KEY_ID e SMARTPOS_KEY_SECRET para consultar a Curva ABC de Vendas ao vivo.'
        : error instanceof Error
          ? `Falha temporária na SmartPOS (${error.message}).`
          : 'Falha desconhecida ao consultar a API SmartPOS.'

    const response: SalesAbcResponse = {
      startDate,
      endDate,
      rows: [],
      totalNetRevenue: 0,
      totalProfit: 0,
      cutoffs: ABC_SALES_CUTOFFS,
      origem: 'unavailable',
      notice,
    }

    return NextResponse.json(response, { headers: NO_STORE_HEADERS })
  }
}
