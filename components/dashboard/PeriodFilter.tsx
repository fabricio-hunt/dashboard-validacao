'use client'

import React from 'react'
import { Calendar, RefreshCw } from 'lucide-react'
import { currentMonthRange, specificMonthRange, yearRange } from '@/lib/domain/periodRanges'

export type PeriodFilterMode = 'current_month' | 'specific_month' | 'year' | 'custom_range'

export interface PeriodFilterValue {
  mode: PeriodFilterMode
  startDate: string
  endDate: string
}

interface PeriodFilterProps {
  value: PeriodFilterValue
  onChange: (value: PeriodFilterValue) => void
  onSubmit: () => void
  isLoading?: boolean
  modes?: PeriodFilterMode[]
}

const ALL_MODES: PeriodFilterMode[] = ['current_month', 'specific_month', 'year', 'custom_range']

const MODE_LABELS: Record<PeriodFilterMode, string> = {
  current_month: 'Mês atual',
  specific_month: 'Mês específico',
  year: 'Ano',
  custom_range: 'Intervalo customizado',
}

function monthInputValue(iso: string): string {
  return iso.slice(0, 7)
}

export function PeriodFilter({ value, onChange, onSubmit, isLoading, modes = ALL_MODES }: PeriodFilterProps) {
  const handleModeChange = (mode: PeriodFilterMode) => {
    if (mode === 'current_month') {
      onChange({ mode, ...currentMonthRange() })
    } else if (mode === 'specific_month') {
      const now = new Date()
      onChange({ mode, ...specificMonthRange(now.getFullYear(), now.getMonth() + 1) })
    } else if (mode === 'year') {
      onChange({ mode, ...yearRange(new Date().getFullYear()) })
    } else {
      onChange({ mode, startDate: value.startDate, endDate: value.endDate })
    }
  }

  const handleMonthInputChange = (monthValue: string) => {
    const [year, month] = monthValue.split('-').map(Number)
    if (!year || !month) return
    onChange({ mode: 'specific_month', ...specificMonthRange(year, month) })
  }

  const handleYearInputChange = (yearValue: string) => {
    const year = Number(yearValue)
    if (!year) return
    onChange({ mode: 'year', ...yearRange(year) })
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
      className="flex flex-wrap items-center gap-2.5"
    >
      <div className="flex items-center gap-1 p-0.5 rounded-sap bg-sap-canvas border border-sap-hairline text-xs">
        {modes.map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => handleModeChange(mode)}
            className={`px-2.5 py-1 rounded-[6px] font-medium transition-colors ${
              value.mode === mode ? 'bg-sap-primary text-sap-on-primary' : 'text-sap-ink-nav hover:bg-sap-chrome'
            }`}
          >
            {MODE_LABELS[mode]}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 bg-sap-canvas border border-sap-hairline rounded-sap px-3 py-1.5 text-xs">
        <Calendar className="h-3.5 w-3.5 text-sap-primary" />
        {value.mode === 'specific_month' && (
          <input
            type="month"
            value={monthInputValue(value.startDate)}
            onChange={(e) => handleMonthInputChange(e.target.value)}
            className="text-sap-ink-body bg-transparent focus:outline-none tabular-nums"
          />
        )}
        {value.mode === 'year' && (
          <input
            type="number"
            value={value.startDate.slice(0, 4)}
            onChange={(e) => handleYearInputChange(e.target.value)}
            className="w-20 text-sap-ink-body bg-transparent focus:outline-none tabular-nums"
          />
        )}
        {(value.mode === 'custom_range' || value.mode === 'current_month') && (
          <>
            <label className="text-sap-ink-meta font-medium">De:</label>
            <input
              type="date"
              value={value.startDate}
              disabled={value.mode === 'current_month'}
              onChange={(e) => onChange({ ...value, mode: 'custom_range', startDate: e.target.value })}
              className="text-sap-ink-body bg-transparent focus:outline-none tabular-nums disabled:opacity-60"
            />
            <label className="text-sap-ink-meta font-medium ml-1">Até:</label>
            <input
              type="date"
              value={value.endDate}
              disabled={value.mode === 'current_month'}
              onChange={(e) => onChange({ ...value, mode: 'custom_range', endDate: e.target.value })}
              className="text-sap-ink-body bg-transparent focus:outline-none tabular-nums disabled:opacity-60"
            />
          </>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-sap bg-sap-primary hover:bg-sap-primary-deep text-sap-on-primary text-xs font-medium transition-colors disabled:opacity-60"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        {isLoading ? 'Consultando SmartPOS...' : 'Aplicar Período'}
      </button>
    </form>
  )
}
