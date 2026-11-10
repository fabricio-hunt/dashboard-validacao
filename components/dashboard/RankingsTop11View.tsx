'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Calendar, RefreshCw, TrendingUp, Package, Wallet, Info } from 'lucide-react'
import { SalesRankingReport, StockFamilyReport } from '@/types/inventory'
import { formatCurrency } from '@/lib/utils'

interface RankingsTop11ViewProps {
  stockTop11: StockFamilyReport
  contasAReceber: number
  onSalesSourceChange?: (label: string) => void
}

function formatPct2(value: number): string {
  return `${value.toFixed(2).replace('.', ',')}%`
}

function formatDateBr(isoDate: string): string {
  const [y, m, d] = isoDate.split('-')
  if (!y || !m || !d) return isoDate
  return `${d}.${m}.${y}`
}

export function RankingsTop11View({
  stockTop11,
  contasAReceber,
  onSalesSourceChange,
}: RankingsTop11ViewProps) {
  const [startDate, setStartDate] = useState('2026-08-01')
  const [endDate, setEndDate] = useState('2026-09-12')
  const [salesReport, setSalesReport] = useState<SalesRankingReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const loadSalesRanking = useCallback(async (start: string, end: string) => {
    setIsLoading(true)
    setErrorMsg(null)
    try {
      const res = await fetch(
        `/api/sales-ranking?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
      )
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const data = (await res.json()) as SalesRankingReport
      setSalesReport(data)
      if (onSalesSourceChange) {
        onSalesSourceChange(
          data.origem === 'smartpos_api'
            ? `SmartPOS Ao Vivo (${data.totalSalesCount} vendas)`
            : 'Snapshot Vendas'
        )
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao carregar vendas')
    } finally {
      setIsLoading(false)
    }
  }, [onSalesSourceChange])

  useEffect(() => {
    loadSalesRanking(startDate, endDate)
  }, []) // Carrega o período padrão na abertura da aba

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    loadSalesRanking(startDate, endDate)
  }

  return (
    <div className="space-y-6">
      {/* Faixa de Período e Controles */}
      <section className="bg-sap-band-blue border border-sap-primary/15 px-5 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-medium text-sap-ink tracking-tight">
            Rankings Estratégicos Top 11 — Vendas &amp; Estoque
          </h2>
          <p className="text-xs text-sap-ink-body mt-0.5">
            Concentração de faturamento, lucro bruto e capital imobilizado por família de produtos
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-sap-canvas border border-sap-hairline rounded-sap px-3 py-1.5 text-xs">
            <Calendar className="h-3.5 w-3.5 text-sap-primary" />
            <label className="text-sap-ink-meta font-medium">De:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-sap-ink-body bg-transparent focus:outline-none tabular-nums"
            />
            <label className="text-sap-ink-meta font-medium ml-1">Até:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-sap-ink-body bg-transparent focus:outline-none tabular-nums"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-sap bg-sap-primary hover:bg-sap-primary-deep text-sap-on-primary text-xs font-medium transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Consultando SmartPOS...' : 'Atualizar Período'}
          </button>
        </form>
      </section>

      {salesReport?.notice && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-sap bg-sap-chrome border border-sap-hairline text-xs text-sap-ink-body">
          <Info className="h-4 w-4 text-sap-primary shrink-0" />
          <span>{salesReport.notice}</span>
        </div>
      )}

      {errorMsg && (
        <div className="px-4 py-3 rounded-sap bg-rose-50 border border-rose-300 text-xs text-rose-800">
          {errorMsg}
        </div>
      )}

      {/* TABELA 1: VENDAS TOP 11 + LUCRO BRUTO */}
      <section className="rounded-sap-lg bg-sap-canvas border border-sap-hairline overflow-hidden">
        <div className="px-5 py-3.5 bg-sap-chrome border-b border-sap-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-sap-primary" />
            <h3 className="text-sm font-semibold text-sap-ink uppercase tracking-wide">
              VENDAS ({formatDateBr(salesReport?.startDate || startDate)} A{' '}
              {formatDateBr(salesReport?.endDate || endDate)})
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span
              className={`px-2 py-0.5 rounded-[4px] font-medium border ${
                salesReport?.origem === 'smartpos_api'
                  ? 'bg-sap-band-blue text-sap-primary-deep border-sap-primary/25'
                  : 'bg-sap-canvas text-sap-ink-meta border-sap-hairline'
              }`}
            >
              {salesReport?.origem === 'smartpos_api'
                ? `SmartPOS API Ao Vivo (${salesReport.totalSalesCount} vendas)`
                : 'Base Snapshot'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12">
          {/* Painel Lateral Pareto Vendas */}
          <div className="xl:col-span-2 bg-sap-band-blue/50 border-b xl:border-b-0 xl:border-r border-sap-hairline p-4 flex xl:flex-col justify-around items-center text-center gap-3">
            <div>
              <div className="text-[11px] font-medium text-sap-ink-meta uppercase">
                Top 11 Vendas
              </div>
              <div className="text-2xl font-bold text-sap-primary tabular-nums">
                {salesReport ? `${salesReport.top11ShareVendasPct}%` : '—'}
              </div>
            </div>
            <div className="h-px w-full bg-sap-hairline hidden xl:block" />
            <div>
              <div className="text-[11px] font-medium text-sap-ink-meta uppercase">
                Demais Vendas
              </div>
              <div className="text-lg font-semibold text-sap-ink-list tabular-nums">
                {salesReport ? `${100 - salesReport.top11ShareVendasPct}%` : '—'}
              </div>
            </div>
          </div>

          <div className="xl:col-span-8 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-sap-canvas border-b border-sap-hairline-strong text-sap-ink-meta">
                <tr>
                  <th className="py-2.5 px-3 font-semibold text-center w-16">RANK</th>
                  <th className="py-2.5 px-3 font-semibold">PRODUTOS</th>
                  <th className="py-2.5 px-3 text-right font-semibold">PARTIC.</th>
                  <th className="py-2.5 px-3 text-right font-semibold">VENDAS</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Vend x Luc</th>
                  <th className="py-2.5 px-3 text-right font-semibold">LUCRO BRUTO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sap-hairline">
                {isLoading && !salesReport ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sap-ink-meta">
                      Consultando vendas e itens na API SmartPOS...
                    </td>
                  </tr>
                ) : (
                  salesReport?.top11.map((row) => (
                    <tr key={row.produto} className="hover:bg-sap-band-blue/50 transition-colors">
                      <td className="py-2 px-3 text-center font-semibold text-sap-primary tabular-nums">
                        {row.rank}º
                      </td>
                      <td className="py-2 px-3 font-medium text-sap-ink-body">
                        {row.produto}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums text-sap-ink-list">
                        {formatPct2(row.participacaoPct)}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums font-medium text-sap-ink">
                        {formatCurrency(row.vendas)}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums text-sap-ink-list">
                        {formatPct2(row.vendLucPct)}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums font-medium text-emerald-700">
                        {formatCurrency(row.lucroBruto)}
                      </td>
                    </tr>
                  ))
                )}
                {salesReport && (
                  <>
                    <tr className="bg-sap-chrome/70 font-medium">
                      <td className="py-2 px-3 text-center text-sap-ink-meta">—</td>
                      <td className="py-2 px-3 text-sap-ink-body">{salesReport.demais.produto}</td>
                      <td className="py-2 px-3 text-right tabular-nums text-sap-ink-body">
                        {formatPct2(salesReport.demais.participacaoPct)}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums text-sap-ink">
                        {formatCurrency(salesReport.demais.vendas)}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums text-sap-ink-body">
                        {formatPct2(salesReport.demais.vendLucPct)}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums text-sap-ink">
                        {formatCurrency(salesReport.demais.lucroBruto)}
                      </td>
                    </tr>
                    <tr className="bg-sap-band border-t-2 border-t-sap-hairline-strong font-bold text-sap-ink">
                      <td className="py-2.5 px-3 text-center">100%</td>
                      <td className="py-2.5 px-3">{salesReport.total.produto}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums">
                        {formatPct2(salesReport.total.participacaoPct)}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums">
                        {formatCurrency(salesReport.total.vendas)}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums">
                        {formatPct2(salesReport.total.vendLucPct)}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-emerald-800">
                        {formatCurrency(salesReport.total.lucroBruto)}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Painel Lateral Pareto Lucro Bruto */}
          <div className="xl:col-span-2 bg-sap-band-blue/50 border-t xl:border-t-0 xl:border-l border-sap-hairline p-4 flex xl:flex-col justify-around items-center text-center gap-3">
            <div>
              <div className="text-[11px] font-medium text-sap-ink-meta uppercase">
                Top 11 Lucro
              </div>
              <div className="text-2xl font-bold text-emerald-700 tabular-nums">
                {salesReport ? `${salesReport.top11ShareLucroPct}%` : '—'}
              </div>
            </div>
            <div className="h-px w-full bg-sap-hairline hidden xl:block" />
            <div>
              <div className="text-[11px] font-medium text-sap-ink-meta uppercase">
                Demais Lucro
              </div>
              <div className="text-lg font-semibold text-sap-ink-list tabular-nums">
                {salesReport ? `${100 - salesReport.top11ShareLucroPct}%` : '—'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TABELA 2: ESTOQUE TOP 11 + CONTAS A RECEBER */}
      <section className="rounded-sap-lg bg-sap-canvas border border-sap-hairline overflow-hidden">
        <div className="px-5 py-3.5 bg-sap-chrome border-b border-sap-hairline flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-sap-primary" />
            <h3 className="text-sm font-semibold text-sap-ink uppercase tracking-wide">
              ESTOQUE (POSIÇÃO POR FAMÍLIA DE PRODUTOS)
            </h3>
          </div>
          <span className="text-xs text-sap-ink-meta tabular-nums">
            {stockTop11.total.skus} SKUs consolidados
          </span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12">
          <div className="xl:col-span-2 bg-sap-chrome/70 border-b xl:border-b-0 xl:border-r border-sap-hairline p-4 flex xl:flex-col justify-around items-center text-center gap-3">
            <div>
              <div className="text-[11px] font-medium text-sap-ink-meta uppercase">
                Top 11 Custo
              </div>
              <div className="text-2xl font-bold text-sap-primary tabular-nums">
                {stockTop11.top11ShareCustoPct}%
              </div>
            </div>
            <div className="h-px w-full bg-sap-hairline hidden xl:block" />
            <div>
              <div className="text-[11px] font-medium text-sap-ink-meta uppercase">
                Demais Custo
              </div>
              <div className="text-lg font-semibold text-sap-ink-list tabular-nums">
                {100 - stockTop11.top11ShareCustoPct}%
              </div>
            </div>
          </div>

          <div className="xl:col-span-8 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-sap-canvas border-b border-sap-hairline-strong text-sap-ink-meta">
                <tr>
                  <th className="py-2.5 px-3 font-semibold text-center w-16">RANK</th>
                  <th className="py-2.5 px-3 font-semibold">PRODUTOS</th>
                  <th className="py-2.5 px-3 text-right font-semibold">% CUSTO</th>
                  <th className="py-2.5 px-3 text-right font-semibold">PREÇO CUSTO</th>
                  <th className="py-2.5 px-3 text-right font-semibold">% VENDA</th>
                  <th className="py-2.5 px-3 text-right font-semibold">PREÇO VENDA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sap-hairline">
                {stockTop11.top11.map((row) => (
                  <tr key={row.produto} className="hover:bg-sap-band-blue/50 transition-colors">
                    <td className="py-2 px-3 text-center font-semibold text-sap-primary tabular-nums">
                      {row.rank}º
                    </td>
                    <td className="py-2 px-3 font-medium text-sap-ink-body">
                      {row.produto}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums text-sap-ink-list">
                      {formatPct2(row.pctCusto)}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums font-medium text-sap-ink">
                      {formatCurrency(row.precoCusto)}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums text-sap-ink-list">
                      {formatPct2(row.pctVenda)}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums font-medium text-sap-ink-body">
                      {formatCurrency(row.precoVenda)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-sap-chrome/70 font-medium">
                  <td className="py-2 px-3 text-center text-sap-ink-meta">—</td>
                  <td className="py-2 px-3 text-sap-ink-body">{stockTop11.demais.produto}</td>
                  <td className="py-2 px-3 text-right tabular-nums text-sap-ink-body">
                    {formatPct2(stockTop11.demais.pctCusto)}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-sap-ink">
                    {formatCurrency(stockTop11.demais.precoCusto)}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-sap-ink-body">
                    {formatPct2(stockTop11.demais.pctVenda)}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-sap-ink">
                    {formatCurrency(stockTop11.demais.precoVenda)}
                  </td>
                </tr>
                <tr className="bg-sap-band border-t-2 border-t-sap-hairline-strong font-bold text-sap-ink">
                  <td className="py-2.5 px-3 text-center">100%</td>
                  <td className="py-2.5 px-3">{stockTop11.total.produto}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">
                    {formatPct2(stockTop11.total.pctCusto)}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums">
                    {formatCurrency(stockTop11.total.precoCusto)}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums">
                    {formatPct2(stockTop11.total.pctVenda)}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums">
                    {formatCurrency(stockTop11.total.precoVenda)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="xl:col-span-2 bg-sap-chrome/70 border-t xl:border-t-0 xl:border-l border-sap-hairline p-4 flex xl:flex-col justify-around items-center text-center gap-3">
            <div>
              <div className="text-[11px] font-medium text-sap-ink-meta uppercase">
                Top 11 Venda
              </div>
              <div className="text-2xl font-bold text-sap-primary-deep tabular-nums">
                {stockTop11.top11ShareVendaPct}%
              </div>
            </div>
            <div className="h-px w-full bg-sap-hairline hidden xl:block" />
            <div>
              <div className="text-[11px] font-medium text-sap-ink-meta uppercase">
                Demais Venda
              </div>
              <div className="text-lg font-semibold text-sap-ink-list tabular-nums">
                {100 - stockTop11.top11ShareVendaPct}%
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTAS A RECEBER */}
      <section className="rounded-sap bg-sap-band-lavender border border-sap-hairline p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-sap bg-sap-canvas border border-sap-hairline text-sap-primary">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-sap-ink uppercase tracking-wide">
              CONTAS A RECEBER
            </h3>
            <p className="text-xs text-sap-ink-meta">
              Valor configurável via parâmetro financeiro local / variável de ambiente
            </p>
          </div>
        </div>
        <div className="text-2xl font-bold text-sap-ink tabular-nums">
          {formatCurrency(contasAReceber)}
        </div>
      </section>
    </div>
  )
}

