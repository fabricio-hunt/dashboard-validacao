import React from 'react'
import { InventoryService } from '@/lib/api/inventoryService'
import { normalizeExcessMultiplier } from '@/lib/domain/familyClassifier'
import { DashboardShell } from '@/components/dashboard/DashboardShell'

export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  const excessMultiplier = normalizeExcessMultiplier(process.env.STOCK_EXCESS_MULTIPLIER)
  const summary = InventoryService.getSummary(excessMultiplier)
  const products = InventoryService.getAllProducts(excessMultiplier)
  const categories = InventoryService.getCategories()
  const manufacturers = InventoryService.getManufacturers()
  const restockItems = InventoryService.getRestockRecommendations()
  const excessItems = InventoryService.getExcessRecommendations(excessMultiplier)

  return (
    <DashboardShell
      initialSummary={summary}
      initialProducts={products}
      categories={categories}
      manufacturers={manufacturers}
      initialRestockItems={restockItems}
      initialExcessItems={excessItems}
    />
  )
}
