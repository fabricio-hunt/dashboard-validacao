'use client'

import React, { useState } from 'react'
import {
  Clock,
  AlertTriangle,
  AlertOctagon,
  Calendar,
  ShieldAlert,
  Search,
  Layers,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts'
import { ProductItem } from '@/types/inventory'
import { formatCurrency, formatNumber } from '@/lib/utils'

interface ExpirationsViewProps {
  products: ProductItem[]
  onSelectProduct: (p: ProductItem) => void
}

export function ExpirationsView({ products, onSelectProduct }: ExpirationsViewProps) {
  const [filterStatus, setFilterStatus] = useState<string>('RISCO')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const yearCounts: Record<string, { year: string; count: number; valor: number }> = {}
  products.forEach((p) => {
    if (p.validade_iso) {
      const year = p.validade_iso.slice(0, 4)
      if (!yearCounts[year]) {
        yearCounts[year] = { year, count: 0, valor: 0 }
      }
      yearCounts[year].count += 1
      yearCounts[year].valor += Math.max(0, p.valor_total_venda)
    }
  })

  const yearChartData = Object.values(yearCounts).sort((a, b) => a.year.localeCompare(b.year))

  const filteredProducts = products.filter((p) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const match =
        p.codigo.toLowerCase().includes(q) ||
        p.produto.toLowerCase().includes(q) ||
        p.lote.toLowerCase().includes(q) ||
        p.fabricante.toLowerCase().includes(q)
      if (!match) return false
    }

    if (filterStatus === 'RISCO') {
      return (
        p.status_validade === 'VENCIDO' ||
        p.status_validade === 'CRITICO_90D' ||
        p.status_validade === 'ATENCAO_180D'
      )
    }
    if (filterStatus === 'COM_DATA') return p.validade_iso !== null
    return true
  })

  const totalComData = products.filter((p) => p.validade_iso !== null).length
  const pctComData = products.length > 0 ? ((totalComData / products.length) * 100).toFixed(1) : '0.0'
  const totalVencidos = products.filter((p) => p.status_validade === 'VENCIDO').length
  const total90d = products.filter((p) => p.status_validade === 'CRITICO_90D').length
  const total180d = products.filter((p) => p.status_validade === 'ATENCAO_180D').length

  const capitalRisco = products
    .filter(
      (p) =>
        p.status_validade === 'VENCIDO' ||
        p.status_validade === 'CRITICO_90D' ||
        p.status_validade === 'ATENCAO_180D'
    )
    .reduce((acc, p) => acc + Math.max(0, p.valor_total_venda), 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-sap bg-sap-canvas border border-sap-hairline border-t-2 border-t-rose-700 p-4">
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-xs font-medium uppercase">Valor em Risco Sanitário</span>
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-700 tabular-nums">
            {formatCurrency(capitalRisco)}
          </div>
          <p className="mt-1 text-xs text-sap-ink-meta">
            Mercadoria vencida ou com prazo crítico.
          </p>
        </div>

        <div className="rounded-sap bg-sap-canvas border border-sap-hairline border-t-2 border-t-amber-600 p-4">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-xs font-medium uppercase">Vencendo em até 90 dias</span>
            <Clock className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-700 tabular-nums">
            {total90d} <span className="text-sm font-normal text-sap-ink-meta">SKUs</span>
          </div>
          <p className="mt-1 text-xs text-sap-ink-meta">
            Prioridade para giro rápido ou negociação de troca.
          </p>
        </div>

        <div className="rounded-sap bg-sap-canvas border border-sap-hairline border-t-2 border-t-sap-primary p-4">
          <div className="flex items-center justify-between text-sap-primary">
            <span className="text-xs font-medium uppercase">Janela de 91 a 180 dias</span>
            <Calendar className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-bold text-sap-primary tabular-nums">
            {total180d} <span className="text-sm font-normal text-sap-ink-meta">SKUs</span>
          </div>
          <p className="mt-1 text-xs text-sap-ink-meta">
            Evitar recompra antes de escoar lote atual.
          </p>
        </div>

        <div className="rounded-sap bg-sap-canvas border border-sap-hairline border-t-2 border-t-sap-navy p-4">
          <div className="flex items-center justify-between text-sap-primary-deep">
            <span className="text-xs font-medium uppercase">Rastreabilidade de Lote</span>
            <Layers className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-bold text-sap-ink tabular-nums">
            {totalComData}{' '}
            <span className="text-sm font-normal text-sap-ink-meta">/ {products.length} SKUs</span>
          </div>
          <p className="mt-1 text-xs text-sap-ink-meta">
            {pctComData.replace('.', ',')}% do catálogo possui validade identificada.
          </p>
        </div>
      </div>

      <div className="rounded-sap-lg bg-sap-canvas border border-sap-hairline p-5">
        <div className="pb-3 border-b border-sap-hairline">
          <h3 className="font-semibold text-sm text-sap-ink">
            Cronograma de Vencimentos por Ano
          </h3>
          <p className="text-xs text-sap-ink-meta mt-0.5">
            Distribuição dos lotes rastreados por ano de expiração
          </p>
        </div>

        <div className="h-52 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearChartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eaecee" vertical={false} />
              <XAxis dataKey="year" stroke="#475e75" fontSize={12} />
              <YAxis stroke="#475e75" fontSize={11} />
              <Tooltip
                formatter={(val: unknown) => [`${val} SKUs`, 'Quantidade de Lotes']}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#475e75',
                  borderRadius: '8px',
                  color: '#223548',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {yearChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.year <= '2026'
                        ? '#b91c1c'
                        : entry.year === '2027'
                        ? '#d97706'
                        : '#0057d2'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-sap-lg bg-sap-canvas border border-sap-hairline overflow-hidden">
        <div className="px-5 py-4 bg-sap-chrome border-b border-sap-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-sm text-sap-ink">
              Auditoria de Lotes e Validade ANVISA
            </h3>
            <p className="text-xs text-sap-ink-meta mt-0.5">
              Controle sanitário e rastreabilidade por lote
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-sap-ink-meta" />
              <input
                type="text"
                placeholder="Filtrar lote, fabricante ou produto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-sap text-xs bg-sap-canvas border border-sap-hairline text-sap-ink-body focus:outline-none focus:border-sap-primary"
              />
            </div>

            <div className="flex items-center gap-1 p-0.5 rounded-sap bg-sap-canvas border border-sap-hairline text-xs">
              <button
                onClick={() => setFilterStatus('RISCO')}
                className={`px-2.5 py-1 rounded-[6px] font-medium transition-colors ${
                  filterStatus === 'RISCO'
                    ? 'bg-sap-primary text-sap-on-primary'
                    : 'text-sap-ink-nav hover:bg-sap-chrome'
                }`}
              >
                Em Risco ({totalVencidos + total90d + total180d})
              </button>
              <button
                onClick={() => setFilterStatus('COM_DATA')}
                className={`px-2.5 py-1 rounded-[6px] font-medium transition-colors ${
                  filterStatus === 'COM_DATA'
                    ? 'bg-sap-primary text-sap-on-primary'
                    : 'text-sap-ink-nav hover:bg-sap-chrome'
                }`}
              >
                Todos com Data ({totalComData})
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-sap-hairline-strong text-sap-ink-meta font-semibold uppercase tracking-wider bg-sap-canvas">
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Código</th>
                <th className="py-2.5 px-3">Produto</th>
                <th className="py-2.5 px-3">Lote</th>
                <th className="py-2.5 px-3">Validade</th>
                <th className="py-2.5 px-3">Fabricante</th>
                <th className="py-2.5 px-3 text-right">Saldo</th>
                <th className="py-2.5 px-3 text-right">Valor em Risco</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sap-hairline">
              {filteredProducts.map((p) => {
                let badge = (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-medium bg-sap-chrome text-sap-ink-list border border-sap-hairline">
                    Regular
                  </span>
                )
                if (p.status_validade === 'VENCIDO') {
                  badge = (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                      <AlertOctagon className="h-3 w-3" /> VENCIDO
                    </span>
                  )
                } else if (p.status_validade === 'CRITICO_90D') {
                  badge = (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                      <AlertTriangle className="h-3 w-3" /> &lt; 90 DIAS
                    </span>
                  )
                } else if (p.status_validade === 'ATENCAO_180D') {
                  badge = (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-semibold bg-sap-band-blue text-sap-primary-deep border border-sap-primary/25">
                      <Clock className="h-3 w-3" /> &lt; 180 DIAS
                    </span>
                  )
                }

                return (
                  <tr
                    key={p.id}
                    onClick={() => onSelectProduct(p)}
                    className="hover:bg-sap-band-blue/50 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3">{badge}</td>
                    <td className="py-2.5 px-3 font-semibold text-sap-primary tabular-nums">
                      {p.codigo}
                    </td>
                    <td className="py-2.5 px-3 max-w-sm truncate font-medium text-sap-ink-body">
                      {p.produto}
                    </td>
                    <td className="py-2.5 px-3 text-sap-ink-body font-medium tabular-nums">
                      {p.lote}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-sap-ink tabular-nums">
                      {p.validade}
                    </td>
                    <td className="py-2.5 px-3 text-sap-ink-list">{p.fabricante}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-sap-ink tabular-nums">
                      {formatNumber(p.estoque)} un
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-sap-ink tabular-nums">
                      {formatCurrency(p.valor_total_venda)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
