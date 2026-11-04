'use client'

import React from 'react'
import {
  DollarSign,
  TrendingUp,
  Package,
  Layers,
  PieChart as PieIcon,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Info,
} from 'lucide-react'
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
} from 'recharts'
import { DashboardSummary, ProductItem } from '@/types/inventory'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils'

interface ExecutiveViewProps {
  summary: DashboardSummary
  topProducts: ProductItem[]
  onSelectProduct: (p: ProductItem) => void
  onNavigateTab: (tab: string) => void
}

const ABC_COLORS = {
  A: '#10b981', // emerald-500
  B: '#3b82f6', // blue-500
  C: '#8b5cf6', // purple-500
}

const CATEGORY_COLORS = [
  '#0d9488',
  '#0284c7',
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#64748b',
]

export function ExecutiveView({
  summary,
  topProducts,
  onSelectProduct,
  onNavigateTab,
}: ExecutiveViewProps) {
  // Prepara dados para Curva ABC Chart
  const abcData = [
    {
      classe: 'Classe A',
      skus: summary.curva_abc.A.skus,
      valor: summary.curva_abc.A.valor_venda,
      percentual: 80,
      descricao: '80% do Faturamento',
      color: ABC_COLORS.A,
    },
    {
      classe: 'Classe B',
      skus: summary.curva_abc.B.skus,
      valor: summary.curva_abc.B.valor_venda,
      percentual: 15,
      descricao: '15% do Faturamento',
      color: ABC_COLORS.B,
    },
    {
      classe: 'Classe C',
      skus: summary.curva_abc.C.skus,
      valor: summary.curva_abc.C.valor_venda,
      percentual: 5,
      descricao: '5% do Faturamento',
      color: ABC_COLORS.C,
    },
  ]

  // Top 8 Categorias
  const topCategories = summary.categorias.slice(0, 8).map((c, i) => ({
    name: c.categoria.length > 18 ? c.categoria.substring(0, 16) + '...' : c.categoria,
    fullName: c.categoria,
    valor_venda: c.valor_venda,
    valor_custo: c.valor_custo,
    skus: c.skus,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }))

  return (
    <div className="space-y-6">
      {/* 4 KPI Cards de Impacto */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Valor de Venda do Estoque */}
        <div className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-full -mr-8 -mt-8 pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Patrimônio em Estoque
            </span>
            <span className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {formatCurrency(summary.valor_total_venda)}
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Lucro Bruto: {formatCurrency(summary.lucro_potencial_total)}</span>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2">
            Valor bruto se 100% dos lotes forem comercializados a preço de tabela.
          </p>
        </div>

        {/* Card 2: Custo Total Investido */}
        <div className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-blue-500/5 rounded-full -mr-8 -mt-8 pointer-events-none group-hover:bg-blue-500/10 transition-colors" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Capital Imobilizado (Custo)
            </span>
            <span className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Layers className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {formatCurrency(summary.valor_total_custo)}
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
              <span>Investimento líquido realizado nas compras</span>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2">
            Representa o capital de giro atualmente comprometido no almoxarifado.
          </p>
        </div>

        {/* Card 3: Margem Média & Markup */}
        <div className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-purple-500/5 rounded-full -mr-8 -mt-8 pointer-events-none group-hover:bg-purple-500/10 transition-colors" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Rentabilidade Média
            </span>
            <span className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <TrendingUp className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {formatPercent(summary.margem_media)}
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-xs font-semibold text-purple-600 dark:text-purple-400">
              <span>Markup Médio: {formatPercent(summary.markup_medio)}</span>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2">
            Excelente indicador de precificação para negociação com convênios e hospitais.
          </p>
        </div>

        {/* Card 4: Volume e SKUs */}
        <div className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-teal-500/5 rounded-full -mr-8 -mt-8 pointer-events-none group-hover:bg-teal-500/10 transition-colors" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Volume Físico Total
            </span>
            <span className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Package className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {formatNumber(summary.total_unidades)}{' '}
              <span className="text-sm font-medium text-slate-500">un.</span>
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
              <span>{summary.total_skus} produtos cadastrados em 23 categorias</span>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2">
            Estoque distribuído em sondas, descartáveis, agulhas, soros e coletores.
          </p>
        </div>
      </div>

      {/* Seção 2: Curva ABC de Pareto + Faturamento por Categoria */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Curva ABC de Pareto */}
        <div className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Curva ABC de Estoque (Princípio de Pareto)
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Concentração de capital: onde 80% do valor imobilizado está alocado
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('datagrid')}
              className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
            >
              Ver itens <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={abcData}
                margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="classe" stroke="#94a3b8" fontSize={12} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value)), 'Valor Total']}
                  labelFormatter={(label) => `Categoria ${label}`}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="valor" radius={[8, 8, 0, 0]}>
                  {abcData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Cards explicativos ABC */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Classe A
              </span>
              <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                {summary.curva_abc.A.skus} <span className="text-xs font-normal text-slate-500">SKUs</span>
              </p>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium mt-0.5">
                {formatCurrency(summary.curva_abc.A.valor_venda)} (80%)
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                Classe B
              </span>
              <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                {summary.curva_abc.B.skus} <span className="text-xs font-normal text-slate-500">SKUs</span>
              </p>
              <p className="text-[10px] text-blue-700 dark:text-blue-300 font-medium mt-0.5">
                {formatCurrency(summary.curva_abc.B.valor_venda)} (15%)
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                Classe C
              </span>
              <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                {summary.curva_abc.C.skus} <span className="text-xs font-normal text-slate-500">SKUs</span>
              </p>
              <p className="text-[10px] text-purple-700 dark:text-purple-300 font-medium mt-0.5">
                {formatCurrency(summary.curva_abc.C.valor_venda)} (5%)
              </p>
            </div>
          </div>
        </div>

        {/* Gráfico 2: Top Categorias por Valor de Venda */}
        <div className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <PieIcon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Top Categorias por Valor Imobilizado
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Comparativo entre Valor de Venda Potencial e Custo de Aquisição
              </p>
            </div>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
              Top 8 de 23
            </span>
          </div>

          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={topCategories}
                margin={{ top: 5, right: 30, left: 35, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis
                  type="number"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: any, name: string) => [
                    formatCurrency(Number(value)),
                    name === 'valor_venda' ? 'Valor Venda' : 'Custo',
                  ]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  dataKey="valor_venda"
                  name="valor_venda"
                  fill="#0d9488"
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 font-semibold text-teal-600 dark:text-teal-400">
              <span className="h-2 w-2 rounded-full bg-teal-600" />
              Paramentação e Limpeza lideram com mais de R$ 116.000 em estoque.
            </span>
          </div>
        </div>
      </div>

      {/* Seção 3: Top 5 Produtos com Maior Valor Financeiro em Estoque */}
      <div className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Itens Estratégicos de Maior Capital Imobilizado (Classe A)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Estes produtos concentram a maior parte do patrimônio financeiro da empresa
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('datagrid')}
            className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
          >
            Ver todos os 251 SKUs <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3">Código</th>
                <th className="py-2.5 px-3">Produto / Descrição</th>
                <th className="py-2.5 px-3">Categoria</th>
                <th className="py-2.5 px-3 text-right">Saldo Físico</th>
                <th className="py-2.5 px-3 text-right">Preço Venda</th>
                <th className="py-2.5 px-3 text-right">Margem</th>
                <th className="py-2.5 px-3 text-right">Total em Estoque</th>
                <th className="py-2.5 px-3 text-center">Curva ABC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {topProducts.slice(0, 5).map((prod) => (
                <tr
                  key={prod.id}
                  onClick={() => onSelectProduct(prod)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-3 font-mono font-bold text-teal-600 dark:text-teal-400">
                    {prod.codigo}
                  </td>
                  <td className="py-3 px-3 max-w-xs sm:max-w-md truncate font-medium text-slate-900 dark:text-slate-100">
                    {prod.produto}
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                    {prod.categoria}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                    {formatNumber(prod.estoque)} un
                  </td>
                  <td className="py-3 px-3 text-right text-slate-700 dark:text-slate-300">
                    {formatCurrency(prod.valor_venda)}
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatPercent(prod.margem_percentual)}
                  </td>
                  <td className="py-3 px-3 text-right font-extrabold text-slate-900 dark:text-white">
                    {formatCurrency(prod.valor_total_venda)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      Classe {prod.curva_abc}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
