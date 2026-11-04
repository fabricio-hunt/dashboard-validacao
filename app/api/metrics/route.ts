import { NextResponse } from 'next/server'
import { InventoryService } from '@/lib/api/inventoryService'

export async function GET() {
  const summary = InventoryService.getSummary()
  return NextResponse.json(summary)
}
