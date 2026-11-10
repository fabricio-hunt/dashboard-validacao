import { NextRequest, NextResponse } from 'next/server'
import { InventoryService } from '@/lib/api/inventoryService'
import { normalizeExcessMultiplier } from '@/lib/domain/familyClassifier'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const excessMultiplier = normalizeExcessMultiplier(
    searchParams.get('excessMultiplier') || process.env.STOCK_EXCESS_MULTIPLIER
  )

  return NextResponse.json({
    restock: InventoryService.getRestockRecommendations(),
    excess: InventoryService.getExcessRecommendations(excessMultiplier),
  })
}
