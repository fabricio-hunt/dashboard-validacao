import rawData from '@/lib/data/salesGoals.json'
import { SalesGoalsDataset } from '@/types/commercial'

/** Mirrors InventoryService's static-import persistence pattern for the goals dataset. */
export class SalesGoalsService {
  private static data = rawData as SalesGoalsDataset

  public static getRawData(): SalesGoalsDataset {
    return this.data
  }

  public static updateData(newData: SalesGoalsDataset) {
    this.data = newData
  }
}
