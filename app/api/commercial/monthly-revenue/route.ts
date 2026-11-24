import { NextRequest, NextResponse } from 'next/server'
import { SalesDataService, SalesDataUnavailableError } from '@/lib/api/salesDataService'
import { yearRange } from '@/lib/domain/periodRanges'
import { validateYearParam } from '@/lib/domain/periodValidation'
import { buildMonthlyRevenueSeries, compareYearOverYear } from '@/lib/metrics/monthlyRevenue'
import { MonthlyRevenueResponse } from '@/types/commercial'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const rawYear = searchParams.get('year') ?? String(new Date().getFullYear())
  const compareYear = searchParams.get('compareYear') !== 'false'

  const validation = validateYearParam(rawYear)
  if (!validation.valid) {
    return NextResponse.json(
      { success: false, message: validation.message },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  const { year } = validation
  const currentRange = yearRange(year)
  const previousYear = year - 1
  const previousRange = yearRange(previousYear)

  try {
    const currentData = await SalesDataService.getSalesItemsForPeriod(currentRange.startDate, currentRange.endDate)
    const rows = buildMonthlyRevenueSeries(currentData.sales, year)

    let previousRows: MonthlyRevenueResponse['previousRows']
    let yoy: MonthlyRevenueResponse['yoy']
    if (compareYear) {
      const previousData = await SalesDataService.getSalesItemsForPeriod(previousRange.startDate, previousRange.endDate)
      previousRows = buildMonthlyRevenueSeries(previousData.sales, previousYear)
      yoy = compareYearOverYear(rows, previousRows)
    }

    const response: MonthlyRevenueResponse = {
      year,
      rows,
      previousYear: compareYear ? previousYear : undefined,
      previousRows,
      yoy,
      origem: 'smartpos_api',
    }

    return NextResponse.json(response, { headers: NO_STORE_HEADERS })
  } catch (error: unknown) {
    const notice =
      error instanceof SalesDataUnavailableError && error.reason === 'missing_credentials'
        ? 'Configure SMARTPOS_KEY_ID e SMARTPOS_KEY_SECRET para consultar o faturamento mensal ao vivo.'
        : error instanceof Error
          ? `Falha temporária na SmartPOS (${error.message}).`
          : 'Falha desconhecida ao consultar a API SmartPOS.'

    const response: MonthlyRevenueResponse = {
      year,
      rows: buildMonthlyRevenueSeries([], year),
      origem: 'unavailable',
      notice,
    }

    return NextResponse.json(response, { headers: NO_STORE_HEADERS })
  }
}
