'use client'

import React from 'react'
import {
  AlertOctagon,
  AlertTriangle,
  Clock,
  HelpCircle,
  ArrowRight,
  TrendingDown,
} from 'lucide-react'
import { DashboardSummary } from '@/types/inventory'

interface QuickAlertsBarProps {
  summary: DashboardSummary
  onSelectFilter: (type: 'ZERADO' | 'CRITICO' | 'RISCO_VALIDADE' | 'NEGATIVO') => void
}

export function QuickAlertsBar({ summary, onSelectFilter }: QuickAlertsBarProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Alerta 1: Ruptura Total (Estoque 0) */}
      <button
        onClick={() => onSelectFilter('ZERADO')}
        className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent dark:from-rose-950/40 dark:via-rose-900/10 dark:to-transparent border border-rose-200 dark:border-rose-900/50 p-3.5 text-left transition-all hover:scale-[1.01] hover:border-rose-400 dark:hover:border-rose-700 hover:shadow-lg hover:shadow-rose-500/10"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400">
              <AlertOctagon className="h-4 w-4" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-300">
              Ruptura Total
            </span>
          </div>
          <ArrowRight className="h-4 w-4 text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {summary.total_zerados}
          </span>
          <span className="text-xs text-rose-700/80 dark:text-rose-300/80 font-medium">
            SKUs sem estoque
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
          Perda imediata de vendas hospitalares. Clique para isolar.
        </p>
      </button>

      {/* Alerta 2: Abaixo do Mínimo */}
      <button
        onClick={() => onSelectFilter('CRITICO')}
        className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/40 dark:via-amber-900/10 dark:to-transparent border border-amber-200 dark:border-amber-900/50 p-3.5 text-left transition-all hover:scale-[1.01] hover:border-amber-400 dark:hover:border-amber-700 hover:shadow-lg hover:shadow-amber-500/10"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              Estoque Crítico
            </span>
          </div>
          <ArrowRight className="h-4 w-4 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {summary.total_criticos}
          </span>
          <span className="text-xs text-amber-700/80 dark:text-amber-300/80 font-medium">
            SKUs &lt; Mínimo
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
          Necessitam reposição urgente. Déficit de {summary.total_sugestao_compra_qtd.toLocaleString('pt-BR')} un.
        </p>
      </button>

      {/* Alerta 3: Validades ANVISA */}
      <button
        onClick={() => onSelectFilter('RISCO_VALIDADE')}
        className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent dark:from-orange-950/40 dark:via-orange-900/10 dark:to-transparent border border-orange-200 dark:border-orange-900/50 p-3.5 text-left transition-all hover:scale-[1.01] hover:border-orange-400 dark:hover:border-orange-700 hover:shadow-lg hover:shadow-orange-500/10"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-orange-500/15 text-orange-600 dark:text-orange-400">
              <Clock className="h-4 w-4" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-orange-700 dark:text-orange-300">
              Validade ANVISA
            </span>
          </div>
          <ArrowRight className="h-4 w-4 text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-2xl font-black text-orange-600 dark:text-orange-400">
            {summary.total_vencidos + summary.total_vence_90d}
          </span>
          <span className="text-xs text-orange-700/80 dark:text-orange-300/80 font-medium">
            em risco sanitário
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
          {summary.total_vencidos} vencidos e {summary.total_vence_90d} vencendo em até 90 dias.
        </p>
      </button>

      {/* Alerta 4: Inconsistência de Estoque Negativo */}
      <button
        onClick={() => onSelectFilter('NEGATIVO')}
        className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent dark:from-indigo-950/40 dark:via-indigo-900/10 dark:to-transparent border border-indigo-200 dark:border-indigo-900/50 p-3.5 text-left transition-all hover:scale-[1.01] hover:border-indigo-400 dark:hover:border-indigo-700 hover:shadow-lg hover:shadow-indigo-500/10"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
              <HelpCircle className="h-4 w-4" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
              Auditoria de Saldo
            </span>
          </div>
          <ArrowRight className="h-4 w-4 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {summary.total_negativos}
          </span>
          <span className="text-xs text-indigo-700/80 dark:text-indigo-300/80 font-medium">
            com saldo negativo
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
          Venda sem entrada fiscal (ex: scalp -35 un). Falha operacional.
        </p>
      </button>
    </div>
  )
}
