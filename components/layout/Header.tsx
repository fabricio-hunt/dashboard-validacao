'use client'

import React from 'react'
import { Activity, FileSpreadsheet, Network, Download } from 'lucide-react'

interface HeaderProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  onExportCsv: () => void
  totalSkus: number
  salesSourceLabel?: string
}

export function Header({
  activeTab,
  setActiveTab,
  onExportCsv,
  totalSkus,
  salesSourceLabel,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full h-[60px] bg-sap-chrome border-b border-sap-hairline">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-sap bg-sap-primary flex items-center justify-center text-sap-on-primary shrink-0">
            <Activity className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg tracking-tight text-sap-ink truncate">
                MedStock BI
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-[4px] text-[11px] font-medium bg-sap-band-blue text-sap-primary-deep border border-sap-primary/20">
                SmartPOS + Estoque
              </span>
            </div>
            <p className="text-[11px] text-sap-ink-meta truncate">
              BI Executivo | Estoque, Margem, Vendas e Capital
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-sap bg-sap-canvas border border-sap-hairline text-xs text-sap-ink-list">
            <FileSpreadsheet className="h-3.5 w-3.5 text-sap-primary shrink-0" />
            <span className="tabular-nums font-medium text-sap-ink-body">
              {totalSkus} SKUs
            </span>
            {salesSourceLabel && (
              <>
                <span className="text-sap-hairline">|</span>
                <span className="text-sap-ink-meta">{salesSourceLabel}</span>
              </>
            )}
          </div>

          <button
            onClick={() => setActiveTab('api-integration')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-sap text-xs font-medium transition-colors border ${activeTab === 'api-integration'
                ? 'bg-sap-primary text-sap-on-primary border-sap-primary'
                : 'bg-sap-canvas text-sap-primary-deep border-sap-hairline-strong hover:bg-sap-band-blue'
              }`}
          >
            <Network className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">SmartPOS API</span>
          </button>

          <button
            onClick={onExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-sap text-xs font-medium bg-sap-primary hover:bg-sap-primary-deep text-sap-on-primary transition-colors"
            title="Baixar dataset completo em CSV"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Exportar CSV</span>
          </button>
        </div>
      </div>
    </header>
  )
}
