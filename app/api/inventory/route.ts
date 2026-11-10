import { NextResponse } from 'next/server'
import { InventoryService } from '@/lib/api/inventoryService'
import { InventoryFilterOptions } from '@/types/inventory'
import { normalizeExcessMultiplier } from '@/lib/domain/familyClassifier'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const filters: InventoryFilterOptions = {
    searchQuery: searchParams.get('q') || undefined,
    categoria: searchParams.get('categoria') || undefined,
    statusEstoque: (searchParams.get('status') as InventoryFilterOptions['statusEstoque']) || undefined,
    statusValidade: (searchParams.get('validade') as InventoryFilterOptions['statusValidade']) || undefined,
    curvaAbc: (searchParams.get('abc') as InventoryFilterOptions['curvaAbc']) || undefined,
    fabricante: searchParams.get('fabricante') || undefined,
    excessMultiplier: normalizeExcessMultiplier(
      searchParams.get('excessMultiplier') || process.env.STOCK_EXCESS_MULTIPLIER
    ),
    sortBy: (searchParams.get('sortBy') as InventoryFilterOptions['sortBy']) || undefined,
    sortDirection: (searchParams.get('sortDirection') as InventoryFilterOptions['sortDirection']) || undefined,
  }

  const result = InventoryService.filterProducts(filters)
  return NextResponse.json({
    ...result,
    categories: InventoryService.getCategories(),
    manufacturers: InventoryService.getManufacturers(),
  })
}
