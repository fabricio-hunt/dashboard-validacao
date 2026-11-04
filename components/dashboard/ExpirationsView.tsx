'use client'

import React, { useState } from 'react'
import {
  Clock,
  AlertTriangle,
  AlertOctagon,
  Calendar,
  ShieldAlert,
  Search,
  Filter,
  Package,
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

export function ExpirationsView({
  products,
  onSelectProduct,
}: ExpirationsViewProps) {
  const [filterStatus, setFilterStatus] = useState<string>('RISCO')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Agrupamento por ano de validade
  const yearCounts: { [year: string]: { year: string; count: number; valor: number } } = {}
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

  const yearChartData = Object.values(yearCounts).sort((a, b) =>
    a.year.localeCompare(b.year)
  )

  // Filtragem dos produtos
  const filteredProducts = products.filter((p) => {
    // Busca
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const match =
        p.codigo.toLowerCase().includes(q) ||
        p.produto.toLowerCase().includes(q) ||
        p.lote.toLowerCase().includes(q) ||
        p.fabricante.toLowerCase().includes(q)
      if (!match) return false
    }

    // Status
    if (filterStatus === 'RISCO') {
      return (
        p.status_validade === 'VENCIDO' ||
        p.status_validade === 'CRITICO_90D' ||
        p.status_validade === 'ATENCAO_180D'
      )
    }
    if (filterStatus === 'VENCIDO') return p.status_validade === 'VENCIDO'
    if (filterStatus === 'CRITICO_90D') return p.status_validade === 'CRITICO_90D'
    if (filterStatus === 'ATENCAO_180D') return p.status_validade === 'ATENCAO_180D'
    if (filterStatus === 'COM_DATA') return p.validade_iso !== null
    return true
  })

  // KPIs
  const totalComData = products.filter((p) => p.validade_iso !== null).length
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
      {/* Banner de Risco Sanitário e Alerta ANVISA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Capital em Risco */}
        <div className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-300">
              Valor em Risco Sanitário
            </span>
            <span className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400">
            {formatCurrency(capitalRisco)}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Mercadoria com prazo crítico ou vencida sujeita a descarte compulsório.
          </p>
        </div>

        {/* Card 2: Vencidos / Imediatos */}
        <div className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              Vencendo em até 90 dias
            </span>
            <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">
            {total90d} <span className="text-sm font-medium">SKUs</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Campanha prioritária de giro rápido ou troca junto ao fornecedor.
          </p>
        </div>

        {/* Card 3: Janela de 180 dias */}
        <div className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">
              Janela de 91 a 180 dias
            </span>
            <span className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Calendar className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400">
            {total180d} <span className="text-sm font-medium">SKUs</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Atenção para não estocar novos lotes antes de desovar o lote atual.
          </p>
        </div>

        {/* Card 4: Cobertura de Rastreabilidade */}
        <div className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between text-teal-600 dark:text-teal-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-300">
              Cobertura de Rastreabilidade
            </span>
            <span className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Layers className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {totalComData}{' '}
            <span className="text-sm font-medium text-slate-500">
              / {products.length} SKUs
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            72,5% do catálogo possui Lote e Validade estritos na descrição.
          </p>
        </div>
      </div>

      {/* Gráfico de Validades por Ano */}
      <div className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Cronograma Temporal de Vencimentos de Lotes
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Distribuição do número de produtos e lotes por ano de expiração
          </p>
        </div>

        <div className="h-56 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={yearChartData}
              margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="year" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip
                formatter={(val: any, name: string) => [
                  `${val} SKUs`,
                  'Quantidade de Lotes',
                ]}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  color: '#f8fafc',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="count" fill="#14b8a6" radius={[6, 6, 0, 0]}>
                {yearChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.year <= '2026'
                        ? '#f43f5e'
                        : entry.year === '2027'
                        ? '#f59e0b'
                        : '#0d9488'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabela de Rastreabilidade de Lotes */}
      <div className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Tabela de Rastreabilidade e Auditoria de Lotes
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Monitore lotes para atendimento às RDC ANVISA e recolhimento sanitário
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrar por lote, fabricante ou produto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <button
                onClick={() => setFilterStatus('RISCO')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  filterStatus === 'RISCO'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Em Risco ({totalVencidos + total90d + total180d})
              </button>
              <button
                onClick={() => setFilterStatus('COM_DATA')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  filterStatus === 'COM_DATA'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Todos com Data ({totalComData})
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3">Status Validade</th>
                <th className="py-2.5 px-3">Código</th>
                <th className="py-2.5 px-3">Produto</th>
                <th className="py-2.5 px-3">Lote</th>
                <th className="py-2.5 px-3">Validade</th>
                <th className="py-2.5 px-3">Fabricante</th>
                <th className="py-2.5 px-3 text-right">Saldo em Estoque</th>
                <th className="py-2.5 px-3 text-right">Valor em Risco</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredProducts.map((p) => {
                let badge = (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    Regular
                  </span>
                )
                if (p.status_validade === 'VENCIDO') {
                  badge = (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                      <AlertOctagon className="h-3 w-3" /> VENCIDO
                    </span>
                  )
                } else if (p.status_validade === 'CRITICO_90D') {
                  badge = (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      <AlertTriangle className="h-3 w-3" /> &lt; 90 DIAS
                    </span>
                  )
                } else if (p.status_validade === 'ATENCAO_180D') {
                  badge = (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                      <Clock className="h-3 w-3" /> &lt; 180 DIAS
                    </span>
                  )
                }

                return (
                  <tr
                    key={p.id}
                    onClick={() => onSelectProduct(p)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3">{badge}</td>
                    <td className="py-3 px-3 font-mono font-bold text-teal-600 dark:text-teal-400">
                      {p.codigo}
                    </td>
                    <td className="py-3 px-3 max-w-sm truncate font-medium text-slate-900 dark:text-slate-100">
                      {p.produto}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300 font-semibold">
                      {p.lote}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                      {p.validade}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                      {p.fabricante}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                      {formatNumber(p.estoque)} un
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-slate-900 dark:text-white">
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
