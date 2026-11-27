import { AveragePriceByProductRow, CommercialKpis, GoalProgress, GrowthComparison } from '@/lib/metrics/salesKpis'
import { MonthlyRevenueRow, MonthlyYoYRow } from '@/lib/metrics/monthlyRevenue'
import { SalesAbcRow } from '@/lib/metrics/abcSales'
import { GoalResolution } from '@/lib/metrics/salesGoalsResolution'
import { ClientPurchaseBehaviorRow, MonthBucket } from '@/lib/metrics/clientPurchaseBehavior'
import { ClientInactivityRow } from '@/lib/metrics/clientInactivity'
import { StockProjectionRow } from '@/lib/metrics/stockProjection60d'

export interface PeriodRange {
  startDate: string
  endDate: string
}

export type CommercialDataOrigin = 'smartpos_api' | 'unavailable'

export interface CommercialKpisResponse {
  startDate: string
  endDate: string
  previousStartDate: string
  previousEndDate: string
  kpis: CommercialKpis
  averagePriceByProduct: AveragePriceByProductRow[]
  revenueGrowth: GrowthComparison
  goal: GoalResolution | null
  goalProgress: GoalProgress | null
  origem: CommercialDataOrigin
  notice?: string
}

export interface SalesAbcResponse {
  startDate: string
  endDate: string
  rows: SalesAbcRow[]
  totalNetRevenue: number
  totalProfit: number
  cutoffs: { A: number; B: number }
  origem: CommercialDataOrigin
  notice?: string
}

export interface MonthlyRevenueResponse {
  year: number
  rows: MonthlyRevenueRow[]
  previousYear?: number
  previousRows?: MonthlyRevenueRow[]
  yoy?: MonthlyYoYRow[]
  origem: CommercialDataOrigin
  notice?: string
}

export interface ClientPurchaseBehaviorResponse {
  months: MonthBucket[]
  rows: ClientPurchaseBehaviorRow[]
  origem: CommercialDataOrigin
  notice?: string
}

export interface ClientInactivityResponse {
  referenceDate: string
  thresholdDays: number
  rows: ClientInactivityRow[]
  origem: CommercialDataOrigin
  notice?: string
}

export interface StockProjectionResponse {
  referenceDate: string
  windowDays: number
  rows: StockProjectionRow[]
  origem: CommercialDataOrigin
  notice?: string
}

export interface SalesGoal {
  yearMonth: string
  amount: number
}

export interface SalesGoalsDataset {
  goals: SalesGoal[]
}

export interface SalesGoalsGetResponse {
  goals: SalesGoal[]
}

export interface SalesGoalUpsertRequest {
  yearMonth: string
  amount: number
  motivo?: string
}

export interface SalesGoalUpsertResponse {
  success: boolean
  persisted: boolean
  persistError: string | null
  message: string
  goals: SalesGoal[]
}
