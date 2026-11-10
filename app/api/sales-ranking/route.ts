import { NextRequest, NextResponse } from 'next/server'
import { DashboardService } from '@/lib/api/dashboardService'

export const dynamic = 'force-dynamic'

const DEFAULT_START = '2026-08-01'
const DEFAULT_END = '2026-09-12'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const start = searchParams.get('start') || DEFAULT_START
  const end = searchParams.get('end') || DEFAULT_END

  const report = await DashboardService.getSalesRanking(start, end)
  return NextResponse.json(report)
}

