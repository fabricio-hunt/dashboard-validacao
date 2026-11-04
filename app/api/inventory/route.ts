import { NextResponse } from 'next/server'
import { InventoryService } from '@/lib/api/inventoryService'
import { InventoryFilterOptions } from '@/types/inventory'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const searchQuery = searchParams.get('q') || undefined
  const categoria = searchParams.get('categoria') || undefined
  const statusEstoque = (searchParams.get('status') as any) || undefined
  const statusValidade = (searchParams.get('validade') as any) || undefined
  const curvaAbc = (searchParams.get('abc') as any) || undefined
  const sortBy = (searchParams.get('sortBy') as any) || undefined
  const sortDirection = (searchParams.get('sortDirection') as any) || undefined

  const filters: InventoryFilterOptions = {
    searchQuery,
    categoria,
    statusEstoque,
    statusValidade,
    curvaAbc,
    sortBy,
    sortDirection,
  }

  const result = InventoryService.filterProducts(filters)
  return NextResponse.json(result)
}
