'use client'

import React from 'react'
import { CheckCircle2, Clock, RefreshCw, Zap } from 'lucide-react'
import { SyncMetadata } from '@/types/inventory'

interface SyncStatusBarProps {
  metadata?: SyncMetadata
  lastSyncBrt?: string
  dataBase?: string
  onOpenApiTab?: () => void
}

export function SyncStatusBar({
  metadata,
  lastSyncBrt,
  dataBase,
  onOpenApiTab,
}: SyncStatusBarProps) {
  const syncTime = metadata?.last_sync_brt || lastSyncBrt || `${dataBase} (automático)`
  const skusConciliados = metadata?.skus_conciliados ?? 249
  const totalApi = metadata?.produtos_api ?? 257

  return (
    <div className="mb-4 bg-sap-chrome/70 border border-sap-hairline rounded-sap px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="h-6 w-6 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sap-ink-body">
              Rotina Automática de Atualização SmartPOS
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              2x ao dia ativo (06:00 e 14:00 BRT)
            </span>
          </div>
          <p className="text-[11px] text-sap-ink-meta mt-0.5">
            Última execução: <strong className="text-sap-ink-body font-medium">{syncTime}</strong> •{' '}
            <span>{skusConciliados} SKUs conciliados em tempo real ({totalApi} no catálogo API)</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {onOpenApiTab && (
          <button
            type="button"
            onClick={onOpenApiTab}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-sap-primary hover:text-sap-primary-deep bg-sap-canvas hover:bg-sap-band-blue border border-sap-hairline rounded transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Ver Hub de Integração
          </button>
        )}
      </div>
    </div>
  )
}
