import { NextRequest, NextResponse } from 'next/server'
import { SalesGoalsService } from '@/lib/api/salesGoalsService'
import { upsertSalesGoal } from '@/lib/domain/salesGoalsDataset'
import { commitFileToRepo, triggerVercelRedeploy } from '@/lib/integrations/githubContent'
import { SalesGoalsGetResponse, SalesGoalUpsertResponse } from '@/types/commercial'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
}

const YEAR_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/

export async function GET() {
  const { goals } = SalesGoalsService.getRawData()
  const response: SalesGoalsGetResponse = { goals }
  return NextResponse.json(response, { headers: NO_STORE_HEADERS })
}

export async function POST(req: NextRequest) {
  const editToken = process.env.SALES_GOALS_EDIT_TOKEN
  if (!editToken) {
    return NextResponse.json(
      { success: false, message: 'SALES_GOALS_EDIT_TOKEN não configurado no servidor.' },
      { status: 500, headers: NO_STORE_HEADERS }
    )
  }

  const providedToken = req.headers.get('x-sales-goals-edit-token')
  if (providedToken !== editToken) {
    return NextResponse.json(
      { success: false, message: 'Token de edição de metas inválido ou ausente.' },
      { status: 401, headers: NO_STORE_HEADERS }
    )
  }

  let body: { yearMonth?: unknown; amount?: unknown; motivo?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { success: false, message: 'Corpo da requisição inválido (JSON esperado).' },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  const yearMonth = typeof body.yearMonth === 'string' ? body.yearMonth.trim() : ''
  const amount = Number(body.amount)
  const motivo = typeof body.motivo === 'string' ? body.motivo.trim() : ''

  if (!YEAR_MONTH_PATTERN.test(yearMonth)) {
    return NextResponse.json(
      { success: false, message: 'Informe "yearMonth" no formato YYYY-MM.' },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }
  if (!Number.isFinite(amount) || amount < 0) {
    return NextResponse.json(
      { success: false, message: 'O valor da meta deve ser um número maior ou igual a zero.' },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  const currentDataset = SalesGoalsService.getRawData()
  const updatedDataset = upsertSalesGoal(currentDataset, yearMonth, amount)

  // Reflete a meta imediatamente nesta instância, sem esperar o commit/redeploy.
  SalesGoalsService.updateData(updatedDataset)

  let persisted = false
  let persistError: string | null = null
  try {
    const commitMessage = `chore(sales-goals): set goal for ${yearMonth} to ${amount}${motivo ? ` (${motivo})` : ''}`
    await commitFileToRepo({
      path: 'lib/data/salesGoals.json',
      content: JSON.stringify(updatedDataset, null, 2),
      message: commitMessage,
    })
    await triggerVercelRedeploy()
    persisted = true
  } catch (err: unknown) {
    persistError = err instanceof Error ? err.message : 'Erro desconhecido ao persistir a meta.'
  }

  const response: SalesGoalUpsertResponse = {
    success: true,
    persisted,
    persistError,
    message: persisted
      ? `Meta de ${yearMonth} definida em ${amount}. A publicação definitiva leva ~1-2 minutos.`
      : `Meta de ${yearMonth} definida em ${amount} nesta sessão, mas a persistência durável falhou: ${persistError}`,
    goals: updatedDataset.goals,
  }

  return NextResponse.json(response, { headers: NO_STORE_HEADERS })
}
