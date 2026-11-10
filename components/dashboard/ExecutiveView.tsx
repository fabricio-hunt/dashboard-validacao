'use client'

import React from 'react'
import {
  ArrowUpRight,
  BarChart3,
  DollarSign,
  SlidersHorizontal,
  Wallet,
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
import { DashboardSummary, ProductItem } from '@/types/inventory'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils'

interface ExecutiveViewProps {
  summary: DashboardSummary
  topProducts: ProductItem[]
  excessMultiplier: number
  onChangeExcessMultiplier: (value: number) => void
  contasAReceber: number
  onChangeContasAReceber: (value: number) => void
  onSelectProduct: (p: ProductItem) => void
  onNavigateTab: (tab: string) => void
  onFilterCategory: (categoria: string) => void
}

const ABC_COLORS = {
  A: '#0057d2',
  B: '#0040b0',
  C: '#475e75',
}

export function ExecutiveView({
  summary,
  topProducts,
  excessMultiplier,
  onChangeExcessMultiplier,
  contasAReceber,
  onChangeContasAReceber,
  onSelectProduct,
  onNavigateTab,
  onFilterCategory,
}: ExecutiveViewProps) {
  const kpiRows = [
    {
      label: 'SKUs',
      value: formatNumber(summary.total_skus),
      detail: `${summary.categorias.length} categorias ativas`,
      bandClass: 'border-t-2 border-t-sap-navy',
    },
    {
      label: 'Unidades em estoque',
      value: formatNumber(summary.total_unidades),
      detail: 'Saldo físico consolidado',
      bandClass: 'border-t-2 border-t-sap-primary',
    },
    {
      label: 'Estoque a custo',
      value: formatCurrency(summary.valor_total_custo),
      detail: 'Capital imobilizado de compra',
      bandClass: 'border-t-2 border-t-emerald-700',
    },
    {
      label: 'Potencial de venda',
      value: formatCurrency(summary.valor_total_venda),
      detail: `Lucro bruto proj.: ${formatCurrency(summary.lucro_potencial_total)}`,
      bandClass: 'border-t-2 border-t-sap-primary-deep',
    },
    {
      label: 'Margem média',
      value: formatPercent(summary.margem_media),
      detail: `Markup médio: ${formatPercent(summary.markup_medio)}`,
      bandClass: 'border-t-2 border-t-sap-ink-meta',
    },
    {
      label: 'Sem estoque',
      value: formatNumber(summary.total_zerados),
      detail: `${summary.total_negativos} com saldo negativo`,
      bandClass: 'border-t-2 border-t-rose-700',
      valueClass: 'text-rose-700',
    },
    {
      label: 'Abaixo do mínimo',
      value: formatNumber(summary.total_criticos),
      detail: `Repor ${formatNumber(summary.total_sugestao_compra_qtd)} un.`,
      bandClass: 'border-t-2 border-t-amber-600',
      valueClass: 'text-amber-700',
    },
    {
      label: 'Estoque em excesso',
      value: formatNumber(summary.total_excesso),
      detail: `Acima de ${excessMultiplier}x estoque mínimo`,
      bandClass: 'border-t-2 border-t-sap-primary',
      valueClass: 'text-sap-primary-deep',
    },
  ]

  const categoryChartData = summary.categorias.slice(0, 12).map((c) => ({
    name: c.categoria.length > 16 ? `${c.categoria.slice(0, 15)}…` : c.categoria,
    fullName: c.categoria,
    valor_custo: c.valor_custo,
    valor_venda: c.valor_venda,
  }))

  const abcData = [
    {
      classe: 'Classe A',
      skus: summary.curva_abc.A.skus,
      valor: summary.curva_abc.A.valor_venda,
      descricao: '80% do Faturamento',
      color: ABC_COLORS.A,
    },
    {
      classe: 'Classe B',
      skus: summary.curva_abc.B.skus,
      valor: summary.curva_abc.B.valor_venda,
      descricao: '15% do Faturamento',
      color: ABC_COLORS.B,
    },
    {
      classe: 'Classe C',
      skus: summary.curva_abc.C.skus,
      valor: summary.curva_abc.C.valor_venda,
      descricao: '5% do Faturamento',
      color: ABC_COLORS.C,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Faixa Executiva SAP */}
      <section className="bg-sap-band-blue border border-sap-primary/15 px-5 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-medium text-sap-ink tracking-tight">
            BI Executivo | Estoque, Margem e Capital
          </h2>
          <p className="text-sm text-sap-ink-body mt-0.5">
            Visão gerencial para reposição, excesso, rentabilidade e priorização de capital
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-sap-canvas border border-sap-hairline rounded-sap px-3 py-1.5 text-xs">
            <SlidersHorizontal className="h-3.5 w-3.5 text-sap-primary" />
            <span className="text-sap-ink-meta font-medium">Limiar de excesso:</span>
            {[2, 3, 4].map((mult) => (
              <button
                key={mult}
                onClick={() => onChangeExcessMultiplier(mult)}
                className={`px-2 py-0.5 rounded-[4px] font-medium tabular-nums transition-colors ${
                  excessMultiplier === mult
                    ? 'bg-sap-primary text-sap-on-primary'
                    : 'text-sap-ink-nav hover:bg-sap-chrome'
                }`}
              >
                {mult}x mín.
              </button>
            ))}
          </div>

          <button
            onClick={() => onNavigateTab('rankings')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-sap bg-sap-primary hover:bg-sap-primary-deep text-sap-on-primary text-xs font-medium transition-colors"
          >
            Rankings Top 11 & Vendas <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>

      {/* Grade 2x4 dos 8 KPIs Executivos */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {kpiRows.map((kpi) => (
          <div
            key={kpi.label}
            className={`rounded-sap bg-sap-canvas border border-sap-hairline ${kpi.bandClass} p-4`}
          >
            <div className="text-xs font-medium text-sap-ink-meta uppercase tracking-wide">
              {kpi.label}
            </div>
            <div
              className={`mt-2 text-2xl sm:text-[26px] font-bold tracking-tight tabular-nums ${
                kpi.valueClass || 'text-sap-ink'
              }`}
            >
              {kpi.value}
            </div>
            <div className="mt-1.5 text-xs text-sap-ink-list tabular-nums">
              {kpi.detail}
            </div>
          </div>
        ))}
      </section>

      {/* Faixa Financeira Secundária: Contas a Receber + Pareto Top 11 */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-sap bg-sap-band-lavender border border-sap-hairline p-4 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-sap-ink-meta uppercase">
              <Wallet className="h-3.5 w-3.5 text-sap-primary" />
              <span>Contas a Receber</span>
            </div>
            <div className="text-2xl font-bold text-sap-ink tabular-nums">
              {formatCurrency(contasAReceber)}
            </div>
            <p className="text-[11px] text-sap-ink-meta">
              Parâmetro financeiro ERP/manual (sem endpoint de títulos na SmartPOS).
            </p>
          </div>
          <div className="shrink-0">
            <label className="block text-[10px] font-medium text-sap-ink-meta mb-1">
              Ajustar (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={contasAReceber}
              onChange={(e) => onChangeContasAReceber(Number(e.target.value) || 0)}
              className="w-28 px-2 py-1 text-xs rounded-[4px] border border-sap-hairline bg-sap-canvas text-sap-ink-body tabular-nums focus:outline-none focus:border-sap-primary"
            />
          </div>
        </div>

        <div className="md:col-span-2 rounded-sap bg-sap-chrome border border-sap-hairline p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-medium text-sap-ink-meta uppercase">
              Concentração de Capital no Estoque (Top 11 Famílias)
            </span>
            <div className="flex flex-wrap items-baseline gap-4 pt-1">
              <div>
                <span className="text-xl font-bold text-sap-primary tabular-nums">
                  {summary.estoque_top11.top11ShareCustoPct}%
                </span>{' '}
                <span className="text-xs text-sap-ink-body">do Custo Total</span>
              </div>
              <div>
                <span className="text-xl font-bold text-sap-primary-deep tabular-nums">
                  {summary.estoque_top11.top11ShareVendaPct}%
                </span>{' '}
                <span className="text-xs text-sap-ink-body">do Potencial de Venda</span>
              </div>
            </div>
            <p className="text-xs text-sap-ink-meta">
              Demais itens compõem {100 - summary.estoque_top11.top11ShareCustoPct}% do custo imobilizado.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('rankings')}
            className="shrink-0 px-3.5 py-2 rounded-sap border border-sap-hairline-strong bg-sap-canvas text-sap-primary-deep text-xs font-medium hover:bg-sap-band-blue transition-colors"
          >
            Abrir Tabela Completa
          </button>
        </div>
      </section>

      {/* Tabela Analítica por Categoria + Gráfico Valor de Estoque por Categoria */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-7 rounded-sap-lg bg-sap-canvas border border-sap-hairline overflow-hidden">
          <div className="px-5 py-3.5 bg-sap-chrome border-b border-sap-hairline flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-sap-ink">
                Consolidado por Categoria
              </h3>
              <p className="text-xs text-sap-ink-meta">
                Ordenado por Estoque a Custo — clique na categoria para filtrar o catálogo
              </p>
            </div>
            <span className="text-xs font-medium text-sap-ink-meta tabular-nums">
              {summary.categorias.length} categorias
            </span>
          </div>

          <div className="overflow-x-auto max-h-[420px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-sap-canvas border-b border-sap-hairline-strong text-sap-ink-meta">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Categoria</th>
                  <th className="py-2.5 px-2.5 text-right font-semibold">SKUs</th>
                  <th className="py-2.5 px-2.5 text-right font-semibold">Unidades</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Estoque a Custo</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Potencial Venda</th>
                  <th className="py-2.5 px-2 text-right font-semibold">Sem Est.</th>
                  <th className="py-2.5 px-2 text-right font-semibold">Repor</th>
                  <th className="py-2.5 px-2.5 text-right font-semibold">Excesso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sap-hairline">
                {summary.categorias.map((cat) => (
                  <tr
                    key={cat.categoria}
                    onClick={() => onFilterCategory(cat.categoria)}
                    className="hover:bg-sap-band-blue/60 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3 font-medium text-sap-ink-body">
                      {cat.categoria}
                    </td>
                    <td className="py-2.5 px-2.5 text-right tabular-nums text-sap-ink-list">
                      {formatNumber(cat.skus)}
                    </td>
                    <td className="py-2.5 px-2.5 text-right tabular-nums text-sap-ink-list">
                      {formatNumber(cat.unidades)}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-medium text-sap-ink">
                      {formatCurrency(cat.valor_custo)}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-sap-ink-body">
                      {formatCurrency(cat.valor_venda)}
                    </td>
                    <td className="py-2.5 px-2 text-right tabular-nums text-rose-700 font-medium">
                      {cat.itens_zerados}
                    </td>
                    <td className="py-2.5 px-2 text-right tabular-nums text-amber-700 font-medium">
                      {cat.itens_criticos}
                    </td>
                    <td className="py-2.5 px-2.5 text-right tabular-nums text-sap-primary-deep font-semibold">
                      {cat.itens_excesso}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="xl:col-span-5 rounded-sap-lg bg-sap-canvas border border-sap-hairline p-5 flex flex-col">
          <div className="pb-3 border-b border-sap-hairline flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-sap-ink">
                Valor de Estoque por Categoria
              </h3>
              <p className="text-xs text-sap-ink-meta mt-0.5">
                Top 12 categorias por Estoque a Custo (R$)
              </p>
            </div>
            <BarChart3 className="h-4 w-4 text-sap-primary" />
          </div>

          <div className="h-[340px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryChartData}
                margin={{ top: 10, right: 12, left: 0, bottom: 52 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eaecee" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#475e75"
                  fontSize={10}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                  height={65}
                />
                <YAxis
                  stroke="#475e75"
                  fontSize={11}
                  tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: unknown, name): [string, string] => [
                    formatCurrency(Number(value)),
                    name === 'valor_custo' ? 'Estoque a Custo' : 'Potencial Venda',
                  ]}
                  labelFormatter={(label, payload) =>
                    String(payload?.[0]?.payload?.fullName ?? label ?? '')
                  }
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#475e75',
                    borderRadius: '8px',
                    color: '#223548',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="valor_custo" fill="#0057d2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Curva ABC + Itens Classe A */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 rounded-sap-lg bg-sap-canvas border border-sap-hairline p-5">
          <div className="pb-3 border-b border-sap-hairline flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-sap-ink">
                Curva ABC de Estoque (Pareto)
              </h3>
              <p className="text-xs text-sap-ink-meta mt-0.5">
                Distribuição do valor de venda potencial por classe
              </p>
            </div>
            <DollarSign className="h-4 w-4 text-sap-primary" />
          </div>

          <div className="h-52 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={abcData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eaecee" vertical={false} />
                <XAxis dataKey="classe" stroke="#475e75" fontSize={12} />
                <YAxis
                  stroke="#475e75"
                  fontSize={11}
                  tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: unknown) => [formatCurrency(Number(value)), 'Potencial Venda']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#475e75',
                    borderRadius: '8px',
                    color: '#223548',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                  {abcData.map((entry, index) => (
                    <Cell key={`abc-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-sap-hairline text-center">
            {abcData.map((c) => (
              <div key={c.classe} className="p-2.5 rounded-sap bg-sap-chrome border border-sap-hairline">
                <div className="text-xs font-semibold text-sap-ink-body">{c.classe}</div>
                <div className="text-base font-bold text-sap-ink tabular-nums mt-0.5">
                  {c.skus} SKUs
                </div>
                <div className="text-[11px] text-sap-ink-meta tabular-nums">
                  {formatCurrency(c.valor)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7 rounded-sap-lg bg-sap-canvas border border-sap-hairline overflow-hidden">
          <div className="px-5 py-3.5 bg-sap-chrome border-b border-sap-hairline flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-sap-ink">
                Itens Estratégicos de Maior Capital (Classe A)
              </h3>
              <p className="text-xs text-sap-ink-meta">
                Produtos com maior valor total de venda imobilizado
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('datagrid')}
              className="text-xs font-medium text-sap-primary hover:underline flex items-center gap-1"
            >
              Ver {summary.total_skus} SKUs <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="border-b border-sap-hairline text-sap-ink-meta">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Código</th>
                  <th className="py-2.5 px-3 font-semibold">Produto</th>
                  <th className="py-2.5 px-3 font-semibold">Categoria</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Saldo</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Margem</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Total Venda</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sap-hairline">
                {topProducts.slice(0, 6).map((prod) => (
                  <tr
                    key={prod.id}
                    onClick={() => onSelectProduct(prod)}
                    className="hover:bg-sap-band-blue/60 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3 font-semibold text-sap-primary tabular-nums">
                      {prod.codigo}
                    </td>
                    <td className="py-2.5 px-3 max-w-[240px] truncate text-sap-ink-body font-medium">
                      {prod.produto}
                    </td>
                    <td className="py-2.5 px-3 text-sap-ink-list">{prod.categoria}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-sap-ink font-medium">
                      {formatNumber(prod.estoque)} un
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-emerald-700 font-semibold">
                      {formatPercent(prod.margem_percentual)}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-sap-ink font-bold">
                      {formatCurrency(prod.valor_total_venda)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
