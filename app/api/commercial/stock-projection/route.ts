import { NextResponse } from 'next/server'
import { InventoryService } from '@/lib/api/inventoryService'
import { SalesDataService, SalesDataUnavailableError } from '@/lib/api/salesDataService'
import { subtractDaysIso } from '@/lib/domain/periodRanges'
import { buildStockProjection60d } from '@/lib/metrics/stockProjection60d'
import { StockProjectionResponse } from '@/types/commercial'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
}

const WINDOW_DAYS = 60

export async function GET() {
  const referenceDate = new Date().toISOString().slice(0, 10)
  const startDate = subtractDaysIso(referenceDate, WINDOW_DAYS)

  try {
    const soldRecords = await SalesDataService.getSoldQuantitiesSince(startDate, referenceDate)
    const products = InventoryService.getAllProducts()
    const rows = buildStockProjection60d(products, soldRecords)

    const response: StockProjectionResponse = {
      referenceDate,
      windowDays: WINDOW_DAYS,
      rows,
      origem: 'smartpos_api',
    }

    return NextResponse.json(response, { headers: NO_STORE_HEADERS })
  } catch (error: unknown) {
    const notice =
      error instanceof SalesDataUnavailableError && error.reason === 'missing_credentials'
        ? 'Configure SMARTPOS_KEY_ID e SMARTPOS_KEY_SECRET para calcular a projeção de reposição de estoque.'
        : error instanceof Error
          ? `Falha temporária na SmartPOS (${error.message}).`
          : 'Falha desconhecida ao consultar a API SmartPOS.'

    const response: StockProjectionResponse = {
      referenceDate,
      windowDays: WINDOW_DAYS,
      rows: [],
      origem: 'unavailable',
      notice,
    }

    return NextResponse.json(response, { headers: NO_STORE_HEADERS })
  }
}
