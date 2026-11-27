'use client'

import React, { useCallback, useEffect, useState } from 'react'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  LabelList,
} from 'recharts'
import { Info, Package, Target, TrendingUp, UserX, Users } from 'lucide-react'
import { formatCurrency, formatCompactCurrency, formatNumber } from '@/lib/utils'
import { currentMonthRange } from '@/lib/domain/periodRanges'
import { DocInfoTrigger } from '@/components/ui/DocInfoTrigger'
import { KpiCard } from '@/components/ui/KpiCard'
import { Sparkline } from '@/components/ui/Sparkline'
import { PeriodFilter, PeriodFilterValue } from '@/components/dashboard/PeriodFilter'
import { ClientPurchaseBehaviorRow, MonthBucket } from '@/lib/metrics/clientPurchaseBehavior'
import {
  ClientInactivityResponse,
  ClientPurchaseBehaviorResponse,
  CommercialKpisResponse,
  MonthlyRevenueResponse,
  SalesAbcResponse,
  SalesGoal,
  StockProjectionResponse,
} from '@/types/commercial'

const MONTH_LABELS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function formatPct2(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${value.toFixed(2).replace('.', ',')}%`
}

function formatDeltaPct(value: number | null): string {
  if (value === null) return 'sem base de comparação'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1).replace('.', ',')}% vs período anterior`
}

function monthYearLabel(year: number, month: number): string {
  return `${MONTH_LABELS_PT[month - 1]}/${String(year).slice(-2)}`
}

function formatIsoDatePt(iso: string | null): string {
  if (!iso) return '—'
  const [year, month, day] = iso.split('-')
  return `${day}/${month}/${year.slice(-2)}`
}

function sparklineTitle(row: ClientPurchaseBehaviorRow, months: MonthBucket[]): string {
  return months
    .map((m, idx) => `${monthYearLabel(m.year, m.month)}: ${formatCurrency(row.monthlyAmounts[idx] ?? 0)}`)
    .join('\n')
}

export function CommercialMetricsView() {
  const [period, setPeriod] = useState<PeriodFilterValue>(() => ({ mode: 'current_month', ...currentMonthRange() }))
  const [kpisData, setKpisData] = useState<CommercialKpisResponse | null>(null)
  const [abcData, setAbcData] = useState<SalesAbcResponse | null>(null)
  const [isLoadingPeriod, setIsLoadingPeriod] = useState(true)
  const [periodError, setPeriodError] = useState<string | null>(null)

  const [year, setYear] = useState(() => new Date().getFullYear())
  const [monthlyData, setMonthlyData] = useState<MonthlyRevenueResponse | null>(null)
  const [isLoadingMonthly, setIsLoadingMonthly] = useState(true)

  const [clientBehaviorData, setClientBehaviorData] = useState<ClientPurchaseBehaviorResponse | null>(null)
  const [isLoadingClientBehavior, setIsLoadingClientBehavior] = useState(true)
  const [clientFilter, setClientFilter] = useState('')

  const [inactivityData, setInactivityData] = useState<ClientInactivityResponse | null>(null)
  const [isLoadingInactivity, setIsLoadingInactivity] = useState(true)
  const [inactivityFilter, setInactivityFilter] = useState('')

  const [stockProjectionData, setStockProjectionData] = useState<StockProjectionResponse | null>(null)
  const [isLoadingStockProjection, setIsLoadingStockProjection] = useState(true)

  const [goals, setGoals] = useState<SalesGoal[]>([])
  const [goalForm, setGoalForm] = useState({ yearMonth: '', amount: '', token: '' })
  const [goalFeedback, setGoalFeedback] = useState<string | null>(null)
  const [isSavingGoal, setIsSavingGoal] = useState(false)

  const loadPeriodData = useCallback(async (startDate: string, endDate: string) => {
    setIsLoadingPeriod(true)
    setPeriodError(null)
    try {
      const [kpisRes, abcRes] = await Promise.all([
        fetch(`/api/commercial/kpis?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`, {
          cache: 'no-store',
        }),
        fetch(`/api/commercial/abc-sales?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`, {
          cache: 'no-store',
        }),
      ])
      if (!kpisRes.ok || !abcRes.ok) throw new Error(`HTTP ${kpisRes.status}/${abcRes.status}`)
      setKpisData(await kpisRes.json())
      setAbcData(await abcRes.json())
    } catch (err: unknown) {
      setPeriodError(err instanceof Error ? err.message : 'Erro ao carregar indicadores comerciais')
    } finally {
      setIsLoadingPeriod(false)
    }
  }, [])

  const loadMonthlyData = useCallback(async (selectedYear: number) => {
    setIsLoadingMonthly(true)
    try {
      const res = await fetch(`/api/commercial/monthly-revenue?year=${selectedYear}`, { cache: 'no-store' })
      if (res.ok) setMonthlyData(await res.json())
    } catch {
      // Mantém o estado anterior em caso de falha transitória
    } finally {
      setIsLoadingMonthly(false)
    }
  }, [])

  const loadClientBehaviorData = useCallback(async () => {
    setIsLoadingClientBehavior(true)
    try {
      const res = await fetch('/api/commercial/client-purchase-behavior', { cache: 'no-store' })
      if (res.ok) setClientBehaviorData(await res.json())
    } catch {
      // Dado secundário; falha transitória não bloqueia o restante da aba
    } finally {
      setIsLoadingClientBehavior(false)
    }
  }, [])

  const loadInactivityData = useCallback(async () => {
    setIsLoadingInactivity(true)
    try {
      const res = await fetch('/api/commercial/client-inactivity', { cache: 'no-store' })
      if (res.ok) setInactivityData(await res.json())
    } catch {
      // Dado secundário; falha transitória não bloqueia o restante da aba
    } finally {
      setIsLoadingInactivity(false)
    }
  }, [])

  const loadStockProjectionData = useCallback(async () => {
    setIsLoadingStockProjection(true)
    try {
      const res = await fetch('/api/commercial/stock-projection', { cache: 'no-store' })
      if (res.ok) setStockProjectionData(await res.json())
    } catch {
      // Dado secundário; falha transitória não bloqueia o restante da aba
    } finally {
      setIsLoadingStockProjection(false)
    }
  }, [])

  const loadGoals = useCallback(async () => {
    try {
      const res = await fetch('/api/commercial/goals', { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json()
        setGoals(Array.isArray(json.goals) ? json.goals : [])
      }
    } catch {
      // Lista de metas é secundária; falha silenciosa não bloqueia o restante da aba
    }
  }, [])

  useEffect(() => {
    loadPeriodData(period.startDate, period.endDate)
    loadMonthlyData(year)
    loadClientBehaviorData()
    loadInactivityData()
    loadStockProjectionData()
    loadGoals()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleApplyPeriod = () => loadPeriodData(period.startDate, period.endDate)

  const handleYearChange = (newYear: number) => {
    setYear(newYear)
    loadMonthlyData(newYear)
  }

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingGoal(true)
    setGoalFeedback(null)
    try {
      const res = await fetch('/api/commercial/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-sales-goals-edit-token': goalForm.token },
        body: JSON.stringify({ yearMonth: goalForm.yearMonth, amount: Number(goalForm.amount) }),
      })
      const json = await res.json()
      setGoalFeedback(json.message || (res.ok ? 'Meta salva.' : 'Falha ao salvar meta.'))
      if (res.ok) {
        setGoals(json.goals || [])
        loadPeriodData(period.startDate, period.endDate)
      }
    } catch (err: unknown) {
      setGoalFeedback(err instanceof Error ? err.message : 'Erro de conexão ao salvar a meta.')
    } finally {
      setIsSavingGoal(false)
    }
  }

  const unavailableNotice = kpisData?.origem === 'unavailable' ? kpisData.notice : abcData?.origem === 'unavailable' ? abcData.notice : null

  const monthlyChartData = (monthlyData?.rows || []).map((row) => ({
    mes: MONTH_LABELS_PT[row.month - 1],
    bruto: row.grossRevenue,
    liquido: row.netRevenue,
  }))

  const clientBehaviorMonths = clientBehaviorData?.months || []
  const clientBehaviorRows = clientBehaviorData?.rows || []
  const filteredClientRows = clientBehaviorRows.filter((row) =>
    row.clienteName.toLowerCase().includes(clientFilter.trim().toLowerCase())
  )
  // Rows already arrive sorted by total desc (see buildClientPurchaseBehavior); the top 10 is
  // just the head of that list, independent of the name-search filter above.
  const top10ClientRows = clientBehaviorRows.slice(0, 10)

  const inactivityRows = inactivityData?.rows || []
  const filteredInactivityRows = inactivityRows.filter((row) =>
    row.clienteName.toLowerCase().includes(inactivityFilter.trim().toLowerCase())
  )

  const stockProjectionRows = stockProjectionData?.rows || []

  return (
    <div className="space-y-6">
      <section className="bg-sap-band-blue border border-sap-primary/15 px-5 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-medium text-sap-ink tracking-tight">Indicadores Comerciais</h2>
            <DocInfoTrigger docId="commercial_metrics" />
          </div>
          <p className="text-xs text-sap-ink-body mt-0.5">
            Faturamento, ticket médio, margem, meta e Curva ABC de Vendas — por período selecionado
          </p>
        </div>
        <PeriodFilter value={period} onChange={setPeriod} onSubmit={handleApplyPeriod} isLoading={isLoadingPeriod} />
      </section>

      {unavailableNotice && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-sap bg-sap-chrome border border-sap-hairline text-xs text-sap-ink-body">
          <Info className="h-4 w-4 text-sap-primary shrink-0" />
          <span>{unavailableNotice}</span>
        </div>
      )}

      {periodError && (
        <div className="px-4 py-3 rounded-sap bg-rose-50 border border-rose-300 text-xs text-rose-800">{periodError}</div>
      )}

      {/* Grid de KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KpiCard
          label="Faturamento Bruto"
          value={formatCurrency(kpisData?.kpis.grossRevenue ?? 0)}
          detail={`Descontos: ${formatCurrency(kpisData?.kpis.discounts ?? 0)}`}
        />
        <KpiCard
          label="Faturamento Líquido"
          value={formatCurrency(kpisData?.kpis.netRevenue ?? 0)}
          detail={formatDeltaPct(kpisData?.revenueGrowth.deltaPct ?? null)}
        />
        <KpiCard
          label="Pedidos"
          value={formatNumber(kpisData?.kpis.ordersCount ?? 0)}
          detail={`${formatNumber(kpisData?.kpis.itemsSoldCount ?? 0)} itens vendidos`}
        />
        <KpiCard
          label="Ticket Médio"
          value={formatCurrency(kpisData?.kpis.averageTicket ?? 0)}
          detail={`Preço médio/item: ${formatCurrency(kpisData?.kpis.averageItemPrice ?? 0)}`}
        />
        <KpiCard
          label="Margem Bruta"
          value={formatPct2(kpisData?.kpis.grossMarginPct ?? null)}
          detail={`Lucro bruto: ${formatCurrency(kpisData?.kpis.grossProfit ?? 0)}`}
          valueClassName="text-emerald-700"
        />
        <KpiCard
          label="Meta do Período"
          value={kpisData?.goalProgress?.goal != null ? formatCurrency(kpisData.goalProgress.goal) : 'Sem meta'}
          detail={
            kpisData?.goal && kpisData.goal.monthsMissingGoal.length > 0
              ? `Meta incompleta — faltam ${kpisData.goal.monthsMissingGoal.join(', ')}`
              : 'Cadastrada abaixo'
          }
        />
        <KpiCard
          label="Realizado vs. Meta"
          value={kpisData?.goalProgress?.progressPct != null ? formatPct2(kpisData.goalProgress.progressPct) : '—'}
          detail="% do faturamento líquido sobre a meta"
          valueClassName="text-sap-primary-deep"
        />
        <KpiCard
          label="Crescimento (Líquido)"
          value={formatPct2(kpisData?.revenueGrowth.deltaPct ?? null)}
          detail={`Período anterior: ${formatCurrency(kpisData?.revenueGrowth.previousValue ?? 0)}`}
        />
      </section>

      <div className="px-4 py-2.5 rounded-sap bg-sap-chrome border border-sap-hairline text-xs text-sap-ink-meta">
        Faturamento líquido = bruto − descontos. A API SmartPOS não disponibiliza devoluções/estornos pós-venda além
        do cancelamento no ato da venda (já excluído desta conta).
      </div>

      {/* Curva ABC de Vendas */}
      <section className="rounded-sap-lg bg-sap-canvas border border-sap-hairline overflow-hidden">
        <div className="px-5 py-3.5 bg-sap-chrome border-b border-sap-hairline flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-sap-primary" />
          <h3 className="text-sm font-semibold text-sap-ink uppercase tracking-wide">Curva ABC de Vendas</h3>
          <span className="text-xs text-sap-ink-meta ml-auto">
            Cortes: A ≤ {abcData?.cutoffs.A ?? 80}% · B ≤ {abcData?.cutoffs.B ?? 95}%
          </span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-0">
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-sap-canvas border-b border-sap-hairline-strong text-sap-ink-meta sticky top-0">
                <tr>
                  <th className="py-2.5 px-3 font-semibold text-center w-14">RANK</th>
                  <th className="py-2.5 px-3 font-semibold">PRODUTO</th>
                  <th className="py-2.5 px-3 text-right font-semibold">FATURAMENTO</th>
                  <th className="py-2.5 px-3 text-right font-semibold">% IND.</th>
                  <th className="py-2.5 px-3 text-right font-semibold">% ACUM.</th>
                  <th className="py-2.5 px-3 text-center font-semibold">CLASSE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sap-hairline">
                {(abcData?.rows || []).map((row) => (
                  <tr key={row.productKey} className="hover:bg-sap-band-blue/50 transition-colors">
                    <td className="py-2 px-3 text-center font-semibold text-sap-primary tabular-nums">{row.rank}º</td>
                    <td className="py-2 px-3 font-medium text-sap-ink-body">{row.productName}</td>
                    <td className="py-2 px-3 text-right tabular-nums font-medium text-sap-ink">
                      {formatCurrency(row.netRevenue)}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums text-sap-ink-list">{formatPct2(row.participationPct)}</td>
                    <td className="py-2 px-3 text-right tabular-nums text-sap-ink-list">{formatPct2(row.cumulativePct)}</td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-[4px] text-[10px] font-semibold ${
                          row.curvaAbcVendas === 'A'
                            ? 'bg-sap-band-blue text-sap-primary-deep'
                            : row.curvaAbcVendas === 'B'
                              ? 'bg-sap-chrome text-sap-ink-body'
                              : 'bg-sap-canvas text-sap-ink-meta'
                        }`}
                      >
                        {row.curvaAbcVendas}
                      </span>
                    </td>
                  </tr>
                ))}
                {!isLoadingPeriod && (abcData?.rows || []).length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sap-ink-meta">
                      Nenhuma venda no período selecionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t xl:border-t-0 xl:border-l border-sap-hairline h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={abcData?.rows || []} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e9ef" />
                <XAxis dataKey="rank" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Bar yAxisId="left" dataKey="netRevenue" name="Faturamento" fill="#0057d2" />
                <Line yAxisId="right" dataKey="cumulativePct" name="% Acumulado" stroke="#d97706" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Faturamento Mensal/Anual */}
      <section className="rounded-sap-lg bg-sap-canvas border border-sap-hairline overflow-hidden">
        <div className="px-5 py-3.5 bg-sap-chrome border-b border-sap-hairline flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-sap-ink uppercase tracking-wide">Faturamento Mensal e Anual</h3>
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => handleYearChange(year - 1)}
              className="px-2 py-1 rounded-sap bg-sap-canvas border border-sap-hairline hover:bg-sap-band-blue/50"
            >
              ◀
            </button>
            <span className="font-semibold tabular-nums">{year}</span>
            <button
              onClick={() => handleYearChange(year + 1)}
              className="px-2 py-1 rounded-sap bg-sap-canvas border border-sap-hairline hover:bg-sap-band-blue/50"
            >
              ▶
            </button>
          </div>
        </div>

        <div className="p-4 h-80">
          {isLoadingMonthly ? (
            <div className="h-full flex items-center justify-center text-xs text-sap-ink-meta">Carregando...</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData} margin={{ top: 24, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e9ef" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="bruto" name="Bruto" fill="#475e75">
                  <LabelList
                    dataKey="bruto"
                    position="top"
                    formatter={(v: number) => (v > 0 ? formatCompactCurrency(v) : '')}
                    style={{ fontSize: 9, fontWeight: 600, fill: '#475e75' }}
                  />
                </Bar>
                <Bar dataKey="liquido" name="Líquido" fill="#0057d2">
                  <LabelList
                    dataKey="liquido"
                    position="top"
                    formatter={(v: number) => (v > 0 ? formatCompactCurrency(v) : '')}
                    style={{ fontSize: 9, fontWeight: 600, fill: '#0057d2' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="px-5 py-3 border-t border-sap-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <span className="text-sap-ink-meta">
            Total {year}: {formatCurrency((monthlyData?.rows || []).reduce((acc, r) => acc + r.netRevenue, 0))}
          </span>
          {monthlyData?.previousYear && (
            <span className="text-sap-ink-meta">
              {monthlyData.previousYear}: {formatCurrency((monthlyData.previousRows || []).reduce((acc, r) => acc + r.netRevenue, 0))}
            </span>
          )}
        </div>
      </section>

      {/* Projeção de Reposição de Estoque (60 Dias) */}
      <section className="rounded-sap-lg bg-sap-canvas border border-sap-hairline overflow-hidden">
        <div className="px-5 py-3.5 bg-sap-chrome border-b border-sap-hairline flex items-center gap-2">
          <Package className="h-4 w-4 text-sap-primary" />
          <h3 className="text-sm font-semibold text-sap-ink uppercase tracking-wide">
            Projeção de Reposição de Estoque (60 Dias)
          </h3>
          <DocInfoTrigger docId="stock_projection_60d" />
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-sap-canvas border-b border-sap-hairline-strong text-sap-ink-meta sticky top-0">
              <tr>
                <th className="py-2.5 px-3 font-semibold">PRODUTO</th>
                <th className="py-2.5 px-3 font-semibold">CATEGORIA</th>
                <th className="py-2.5 px-3 text-right font-semibold">ESTOQUE ATUAL</th>
                <th className="py-2.5 px-3 text-right font-semibold">VENDIDO (60D)</th>
                <th className="py-2.5 px-3 text-right font-semibold">VELOCIDADE/DIA</th>
                <th className="py-2.5 px-3 text-right font-semibold">DIAS P/ RUPTURA</th>
                <th className="py-2.5 px-3 text-right font-semibold">SUGESTÃO DE COMPRA</th>
                <th className="py-2.5 px-3 text-right font-semibold">INVESTIMENTO</th>
                <th className="py-2.5 px-3 text-center font-semibold">PRIORIDADE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sap-hairline">
              {stockProjectionRows.map((row) => (
                <tr key={row.codigo} className="hover:bg-sap-band-blue/50 transition-colors">
                  <td className="py-2 px-3 font-medium text-sap-ink-body">{row.produto}</td>
                  <td className="py-2 px-3 text-sap-ink-list">{row.categoria}</td>
                  <td className="py-2 px-3 text-right tabular-nums text-sap-ink-list">{formatNumber(row.estoqueAtual)}</td>
                  <td className="py-2 px-3 text-right tabular-nums text-sap-ink-list">
                    {formatNumber(row.unitsSoldLast60Days)}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-sap-ink-list">
                    {row.dailyVelocity.toFixed(2).replace('.', ',')}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-sap-ink-list">
                    {row.daysToStockout ?? '—'}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums font-medium text-sap-ink">
                    {formatNumber(row.sugestaoCompraQtd)}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-sap-ink-list">
                    {formatCurrency(row.investimentoNecessario)}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-[4px] text-[10px] font-semibold ${
                        row.prioridade === 'URGENTE'
                          ? 'bg-rose-100 text-rose-800'
                          : row.prioridade === 'ALTA'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-sap-chrome text-sap-ink-body'
                      }`}
                    >
                      {row.prioridade}
                    </span>
                  </td>
                </tr>
              ))}
              {!isLoadingStockProjection && stockProjectionRows.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-sap-ink-meta">
                    Nenhum produto em risco de ruptura nos próximos 60 dias.
                  </td>
                </tr>
              )}
              {isLoadingStockProjection && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-sap-ink-meta">
                    Carregando...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-sap-hairline text-xs text-sap-ink-meta">
          Estoque atual é reconstruído a partir da última contagem física menos vendas registradas na SmartPOS (não é
          uma leitura de estoque em tempo real); velocidade de venda usa os últimos 60 dias reais da SmartPOS.
        </div>
      </section>

      {/* Comportamento de Compras por Cliente */}
      <section className="rounded-sap-lg bg-sap-canvas border border-sap-hairline overflow-hidden">
        <div className="px-5 py-3.5 bg-sap-chrome border-b border-sap-hairline flex flex-col lg:flex-row lg:items-center gap-2.5">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-sap-primary" />
            <h3 className="text-sm font-semibold text-sap-ink uppercase tracking-wide">
              Comportamento de Compras por Cliente
            </h3>
            <DocInfoTrigger docId="client_purchase_behavior" />
          </div>
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="lg:ml-auto px-2.5 py-1.5 rounded-sap bg-sap-canvas border border-sap-hairline text-xs w-full lg:w-56"
          />
        </div>

        {top10ClientRows.length > 0 && (
          <div className="px-5 py-4 border-b border-sap-hairline">
            <h4 className="text-xs font-semibold text-sap-ink-meta uppercase tracking-wide mb-3">
              Top 10 Clientes — Tendência nos 13 Meses
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {top10ClientRows.map((row, idx) => (
                <div key={row.customerKey} className="rounded-sap bg-sap-chrome border border-sap-hairline p-2.5">
                  <div className="flex items-center gap-1.5 text-[11px] text-sap-ink-meta">
                    <span className="font-semibold text-sap-primary">{idx + 1}º</span>
                    <span className="truncate" title={row.clienteName}>
                      {row.clienteName}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-center">
                    <Sparkline
                      values={row.monthlyAmounts}
                      width={120}
                      height={40}
                      endDotRadius={3}
                      title={sparklineTitle(row, clientBehaviorMonths)}
                    />
                  </div>
                  <div className="mt-1 text-xs font-semibold text-sap-ink text-right tabular-nums">
                    {formatCurrency(row.total)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="overflow-x-auto max-h-[32rem]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-sap-canvas border-b border-sap-hairline-strong text-sap-ink-meta sticky top-0 z-20">
              <tr>
                <th className="py-2.5 px-3 font-semibold sticky left-0 bg-sap-canvas z-10 min-w-[180px]">CLIENTE</th>
                <th className="py-2.5 px-3 font-semibold text-center min-w-[90px]">TENDÊNCIA</th>
                <th className="py-2.5 px-3 font-semibold min-w-[120px]">CONTATO</th>
                <th className="py-2.5 px-3 font-semibold text-center">DESDE</th>
                <th className="py-2.5 px-3 font-semibold text-center">ÚLTIMA COMPRA</th>
                <th className="py-2.5 px-3 font-semibold text-center">ANIV.</th>
                {clientBehaviorMonths.map((m) => (
                  <th key={`${m.year}-${m.month}`} className="py-2.5 px-3 font-semibold text-right min-w-[90px]">
                    {monthYearLabel(m.year, m.month)}
                  </th>
                ))}
                <th className="py-2.5 px-3 font-semibold text-right bg-sap-band-blue/40">TOTAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sap-hairline">
              {filteredClientRows.map((row) => (
                <tr key={row.customerKey} className="hover:bg-sap-band-blue/50 transition-colors">
                  <td className="py-2 px-3 font-medium text-sap-ink-body sticky left-0 bg-sap-canvas z-10">
                    {row.clienteName}
                  </td>
                  <td className="py-1 px-3 text-center">
                    <Sparkline
                      values={row.monthlyAmounts}
                      title={sparklineTitle(row, clientBehaviorMonths)}
                    />
                  </td>
                  <td className="py-2 px-3 text-sap-ink-list">{row.contato || '—'}</td>
                  <td className="py-2 px-3 text-center tabular-nums text-sap-ink-list">{formatIsoDatePt(row.desde)}</td>
                  <td className="py-2 px-3 text-center tabular-nums text-sap-ink-list">
                    {formatIsoDatePt(row.ultimaCompra)}
                  </td>
                  <td className="py-2 px-3 text-center tabular-nums text-sap-ink-list">{row.aniversario || '—'}</td>
                  {row.monthlyAmounts.map((amount, idx) => (
                    <td key={idx} className="py-2 px-3 text-right tabular-nums text-sap-ink-list">
                      {amount > 0 ? formatCurrency(amount) : '—'}
                    </td>
                  ))}
                  <td className="py-2 px-3 text-right tabular-nums font-semibold text-sap-ink bg-sap-band-blue/20">
                    {formatCurrency(row.total)}
                  </td>
                </tr>
              ))}
              {!isLoadingClientBehavior && filteredClientRows.length === 0 && (
                <tr>
                  <td colSpan={7 + clientBehaviorMonths.length} className="py-8 text-center text-sap-ink-meta">
                    {clientBehaviorRows.length === 0
                      ? 'Nenhum cliente com compras no período de 13 meses exibido.'
                      : 'Nenhum cliente encontrado para esta busca.'}
                  </td>
                </tr>
              )}
              {isLoadingClientBehavior && (
                <tr>
                  <td colSpan={7 + clientBehaviorMonths.length} className="py-8 text-center text-sap-ink-meta">
                    Carregando...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-sap-hairline text-xs text-sap-ink-meta">
          Exibindo {filteredClientRows.length} de {clientBehaviorRows.length} clientes com compras no período · Desde
          e Última Compra são aproximados pela primeira/última venda dentro dos 13 meses exibidos.
        </div>
      </section>

      {/* Clientes com Mais de 60 Dias Sem Comprar */}
      <section className="rounded-sap-lg bg-sap-canvas border border-sap-hairline overflow-hidden">
        <div className="px-5 py-3.5 bg-sap-chrome border-b border-sap-hairline flex flex-col lg:flex-row lg:items-center gap-2.5">
          <div className="flex items-center gap-2">
            <UserX className="h-4 w-4 text-sap-primary" />
            <h3 className="text-sm font-semibold text-sap-ink uppercase tracking-wide">
              Clientes com Mais de 60 Dias Sem Comprar
            </h3>
            <DocInfoTrigger docId="client_inactivity" />
          </div>
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={inactivityFilter}
            onChange={(e) => setInactivityFilter(e.target.value)}
            className="lg:ml-auto px-2.5 py-1.5 rounded-sap bg-sap-canvas border border-sap-hairline text-xs w-full lg:w-56"
          />
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-sap-canvas border-b border-sap-hairline-strong text-sap-ink-meta sticky top-0">
              <tr>
                <th className="py-2.5 px-3 font-semibold">CLIENTE</th>
                <th className="py-2.5 px-3 font-semibold">CONTATO</th>
                <th className="py-2.5 px-3 text-center font-semibold">ÚLTIMA COMPRA</th>
                <th className="py-2.5 px-3 text-center font-semibold">DIAS SEM COMPRAR</th>
                <th className="py-2.5 px-3 text-center font-semibold">ANIV.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sap-hairline">
              {filteredInactivityRows.map((row) => (
                <tr key={row.customerKey} className="hover:bg-sap-band-blue/50 transition-colors">
                  <td className="py-2 px-3 font-medium text-sap-ink-body">{row.clienteName}</td>
                  <td className="py-2 px-3 text-sap-ink-list">{row.contato || '—'}</td>
                  <td className="py-2 px-3 text-center tabular-nums text-sap-ink-list">
                    {formatIsoDatePt(row.ultimaCompra)}
                  </td>
                  <td className="py-2 px-3 text-center tabular-nums font-medium text-sap-ink">{row.statusLabel}</td>
                  <td className="py-2 px-3 text-center tabular-nums text-sap-ink-list">{row.aniversario || '—'}</td>
                </tr>
              ))}
              {!isLoadingInactivity && filteredInactivityRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sap-ink-meta">
                    {inactivityRows.length === 0
                      ? 'Nenhum cliente com mais de 60 dias sem comprar.'
                      : 'Nenhum cliente encontrado para esta busca.'}
                  </td>
                </tr>
              )}
              {isLoadingInactivity && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sap-ink-meta">
                    Carregando...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-sap-hairline text-xs text-sap-ink-meta">
          Exibindo {filteredInactivityRows.length} de {inactivityRows.length} clientes com mais de 60 dias sem
          comprar · "Sem compra há mais de 13 meses" indica que o cliente não teve nenhuma venda dentro da janela de
          13 meses analisada — um piso, não um número exato de dias.
        </div>
      </section>

      {/* Metas Comerciais */}
      <section className="rounded-sap bg-sap-band-lavender border border-sap-hairline p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-sap-primary" />
          <h3 className="text-sm font-semibold text-sap-ink uppercase tracking-wide">Metas Comerciais Mensais</h3>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          {goals.length === 0 && <span className="text-sap-ink-meta">Nenhuma meta cadastrada ainda.</span>}
          {goals.map((g) => (
            <span
              key={g.yearMonth}
              className="px-2.5 py-1 rounded-sap bg-sap-canvas border border-sap-hairline tabular-nums"
            >
              {g.yearMonth}: {formatCurrency(g.amount)}
            </span>
          ))}
        </div>

        <form onSubmit={handleSaveGoal} className="flex flex-wrap items-end gap-2.5 text-xs">
          <div className="flex flex-col gap-1">
            <label className="text-sap-ink-meta font-medium">Mês (YYYY-MM)</label>
            <input
              type="month"
              required
              value={goalForm.yearMonth}
              onChange={(e) => setGoalForm((f) => ({ ...f, yearMonth: e.target.value }))}
              className="px-2.5 py-1.5 rounded-sap bg-sap-canvas border border-sap-hairline"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sap-ink-meta font-medium">Meta (R$)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              required
              value={goalForm.amount}
              onChange={(e) => setGoalForm((f) => ({ ...f, amount: e.target.value }))}
              className="px-2.5 py-1.5 rounded-sap bg-sap-canvas border border-sap-hairline w-32"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sap-ink-meta font-medium">Token de edição</label>
            <input
              type="password"
              required
              value={goalForm.token}
              onChange={(e) => setGoalForm((f) => ({ ...f, token: e.target.value }))}
              className="px-2.5 py-1.5 rounded-sap bg-sap-canvas border border-sap-hairline w-36"
            />
          </div>
          <button
            type="submit"
            disabled={isSavingGoal}
            className="px-4 py-1.5 rounded-sap bg-sap-primary hover:bg-sap-primary-deep text-sap-on-primary font-medium transition-colors disabled:opacity-60"
          >
            {isSavingGoal ? 'Salvando...' : 'Salvar Meta'}
          </button>
        </form>

        {goalFeedback && <p className="text-xs text-sap-ink-body">{goalFeedback}</p>}
      </section>
    </div>
  )
}
