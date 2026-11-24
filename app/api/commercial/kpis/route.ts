import { NextRequest, NextResponse } from 'next/server'
import { SalesDataService, SalesDataUnavailableError } from '@/lib/api/salesDataService'
import { SalesGoalsService } from '@/lib/api/salesGoalsService'
import { currentMonthRange, previousEquivalentRange } from '@/lib/domain/periodRanges'
import { validatePeriodRange } from '@/lib/domain/periodValidation'
import {
  computeAveragePricePerProduct,
  computeCommercialKpis,
  computeGoalProgress,
  computeGrowth,
} from '@/lib/metrics/salesKpis'
import { GoalResolution, resolveGoalForPeriod } from '@/lib/metrics/salesGoalsResolution'
import { CommercialKpisResponse } from '@/types/commercial'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
}

function resolveGoalProgressValue(goal: GoalResolution): number | null {
  return goal.totalGoal > 0 ? goal.totalGoal : null
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
  const { startDate: previousStartDate, endDate: previousEndDate } = previousEquivalentRange(startDate, endDate)
  const { goals } = SalesGoalsService.getRawData()
  const goal = resolveGoalForPeriod(goals, startDate, endDate)

  try {
    const [current, previous] = await Promise.all([
      SalesDataService.getSalesItemsForPeriod(startDate, endDate),
      SalesDataService.getSalesItemsForPeriod(previousStartDate, previousEndDate),
    ])

    const kpis = computeCommercialKpis(current.sales, current.items)
    const previousKpis = computeCommercialKpis(previous.sales, previous.items)

    const response: CommercialKpisResponse = {
      startDate,
      endDate,
      previousStartDate,
      previousEndDate,
      kpis,
      averagePriceByProduct: computeAveragePricePerProduct(current.items),
      revenueGrowth: computeGrowth(kpis.netRevenue, previousKpis.netRevenue),
      goal,
      goalProgress: computeGoalProgress(kpis.netRevenue, resolveGoalProgressValue(goal)),
      origem: 'smartpos_api',
    }

    return NextResponse.json(response, { headers: NO_STORE_HEADERS })
  } catch (error: unknown) {
    const notice =
      error instanceof SalesDataUnavailableError && error.reason === 'missing_credentials'
        ? 'Configure SMARTPOS_KEY_ID e SMARTPOS_KEY_SECRET para consultar indicadores comerciais ao vivo.'
        : error instanceof Error
          ? `Falha temporária na SmartPOS (${error.message}).`
          : 'Falha desconhecida ao consultar a API SmartPOS.'

    const emptyKpis = computeCommercialKpis([], [])
    const response: CommercialKpisResponse = {
      startDate,
      endDate,
      previousStartDate,
      previousEndDate,
      kpis: emptyKpis,
      averagePriceByProduct: [],
      revenueGrowth: computeGrowth(0, 0),
      goal,
      goalProgress: computeGoalProgress(0, resolveGoalProgressValue(goal)),
      origem: 'unavailable',
      notice,
    }

    return NextResponse.json(response, { headers: NO_STORE_HEADERS })
  }
}
