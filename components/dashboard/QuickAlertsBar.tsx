'use client'

import React from 'react'
import {
  AlertOctagon,
  AlertTriangle,
  Clock,
  Layers,
  ArrowRight,
} from 'lucide-react'
import { DashboardSummary } from '@/types/inventory'
import { formatNumber } from '@/lib/utils'

interface QuickAlertsBarProps {
  summary: DashboardSummary
  onSelectFilter: (type: 'ZERADO' | 'CRITICO' | 'EXCESSO' | 'RISCO_VALIDADE') => void
}

export function QuickAlertsBar({ summary, onSelectFilter }: QuickAlertsBarProps) {
  const alerts = [
    {
      key: 'ZERADO' as const,
      title: 'Sem Estoque (Ruptura)',
      value: summary.total_zerados,
      unit: 'SKUs zerados',
      subtitle: 'Demanda imediata sem saldo físico disponível.',
      icon: AlertOctagon,
      accentClass: 'text-rose-700',
      borderAccent: 'border-l-4 border-l-rose-600',
    },
    {
      key: 'CRITICO' as const,
      title: 'Abaixo do Mínimo',
      value: summary.total_criticos,
      unit: 'SKUs p/ repor',
      subtitle: `Déficit total de ${formatNumber(summary.total_sugestao_compra_qtd)} un.`,
      icon: AlertTriangle,
      accentClass: 'text-amber-700',
      borderAccent: 'border-l-4 border-l-amber-600',
    },
    {
      key: 'EXCESSO' as const,
      title: 'Estoque em Excesso',
      value: summary.total_excesso,
      unit: `SKUs (> ${summary.excess_multiplier}x mín.)`,
      subtitle: 'Capital imobilizado acima da cobertura alvo.',
      icon: Layers,
      accentClass: 'text-sap-primary',
      borderAccent: 'border-l-4 border-l-sap-primary',
    },
    {
      key: 'RISCO_VALIDADE' as const,
      title: 'Validade ANVISA',
      value: summary.total_vencidos + summary.total_vence_90d,
      unit: 'em risco imediato',
      subtitle: `${summary.total_vencidos} vencidos e ${summary.total_vence_90d} em até 90 dias.`,
      icon: Clock,
      accentClass: 'text-sap-primary-deep',
      borderAccent: 'border-l-4 border-l-sap-navy',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {alerts.map((item) => {
        const Icon = item.icon
        return (
          <button
            key={item.key}
            onClick={() => onSelectFilter(item.key)}
            className={`group rounded-sap bg-sap-canvas border border-sap-hairline ${item.borderAccent} p-4 text-left transition-colors hover:bg-sap-band-blue/60`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${item.accentClass}`} />
                <span className="text-xs font-medium text-sap-ink-meta">
                  {item.title}
                </span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-sap-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl font-bold tabular-nums ${item.accentClass}`}>
                {formatNumber(item.value)}
              </span>
              <span className="text-xs text-sap-ink-list">{item.unit}</span>
            </div>
            <p className="mt-1 text-[11px] text-sap-ink-meta leading-snug">
              {item.subtitle}
            </p>
          </button>
        )
      })}
    </div>
  )
}
