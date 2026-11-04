import { NextResponse } from 'next/server'
import { InventoryService } from '@/lib/api/inventoryService'

export async function GET() {
  const restockItems = InventoryService.getRestockRecommendations()
  return NextResponse.json(restockItems)
}
