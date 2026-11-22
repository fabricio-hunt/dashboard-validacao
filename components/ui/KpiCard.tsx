import React from 'react'

interface KpiCardProps {
  label: string
  value: string
  detail?: string
  valueClassName?: string
}

export function KpiCard({ label, value, detail, valueClassName = 'text-sap-ink' }: KpiCardProps) {
  return (
    <div className="rounded-sap bg-sap-canvas border border-sap-hairline p-4">
      <div className="text-xs font-medium text-sap-ink-meta uppercase tracking-wide">{label}</div>
      <div className={`mt-2 text-2xl sm:text-[26px] font-bold tracking-tight tabular-nums ${valueClassName}`}>
        {value}
      </div>
      {detail && <div className="mt-1.5 text-xs text-sap-ink-list tabular-nums">{detail}</div>}
    </div>
  )
}
