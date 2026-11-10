'use client'

import React, { useState } from 'react'
import {
  ShoppingCart,
  AlertTriangle,
  AlertOctagon,
  DollarSign,
  Download,
  PackagePlus,
  Layers,
} from 'lucide-react'
import { ExcessItem, RestockItem } from '@/types/inventory'
import { formatCurrency, formatNumber } from '@/lib/utils'

interface RestockViewProps {
  items: RestockItem[]
  excessItems: ExcessItem[]
  excessMultiplier: number
  onSelectProductById: (code: string) => void
}

export function RestockView({
  items,
  excessItems,
  excessMultiplier,
  onSelectProductById,
}: RestockViewProps) {
  const [sectionMode, setSectionMode] = useState<'REPOSICAO' | 'EXCESSO'>('REPOSICAO')
  const [filterPriority, setFilterPriority] = useState<string>('ALL')

  const filteredItems = items.filter((item) => {
    if (filterPriority === 'ALL') return true
    return item.prioridade === filterPriority
  })

  const totalInvestimento = items.reduce((acc, item) => acc + item.investimento_necessario, 0)
  const totalUnidadesFalta = items.reduce((acc, item) => acc + item.sugestao_compra_qtd, 0)
  const totalUrgentes = items.filter((i) => i.prioridade === 'URGENTE').length
  const totalAltas = items.filter((i) => i.prioridade === 'ALTA').length
  const totalCapitalExcesso = excessItems.reduce(
    (acc, item) => acc + item.capital_excedente_custo,
    0
  )

  const handleExportCsv = () => {
    const headers = [
      'Prioridade',
      'Código',
      'Produto',
      'Categoria',
      'Fabricante',
      'Estoque Atual',
      'Estoque Mínimo',
      'Qtd Sugerida',
      'Custo Unitário',
      'Investimento Necessário',
    ]

    const rows = filteredItems.map((item) => [
      item.prioridade,
      `"${item.codigo}"`,
      `"${item.produto.replace(/"/g, '""')}"`,
      `"${item.categoria}"`,
      `"${item.fabricante}"`,
      item.estoque,
      item.estoque_minimo,
      item.sugestao_compra_qtd,
      item.custo_unitario.toFixed(2),
      item.investimento_necessario.toFixed(2),
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n')

    const link = document.createElement('a')
    link.setAttribute('href', encodeURI(csvContent))
    link.setAttribute(
      'download',
      `plano-acao-reposicao-${new Date().toISOString().slice(0, 10)}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-sap bg-sap-canvas border border-sap-hairline border-t-2 border-t-sap-primary p-4">
          <div className="flex items-center justify-between text-sap-ink-meta">
            <span className="text-xs font-medium uppercase">Investimento Nivelamento</span>
            <DollarSign className="h-4 w-4 text-sap-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold text-sap-ink tabular-nums">
            {formatCurrency(totalInvestimento)}
          </div>
          <p className="mt-1 text-xs text-sap-ink-meta">
            Custo para cobrir o déficit em relação ao mínimo.
          </p>
        </div>

        <div className="rounded-sap bg-sap-canvas border border-sap-hairline border-t-2 border-t-sap-primary-deep p-4">
          <div className="flex items-center justify-between text-sap-ink-meta">
            <span className="text-xs font-medium uppercase">Déficit Físico</span>
            <PackagePlus className="h-4 w-4 text-sap-primary-deep" />
          </div>
          <div className="mt-2 text-2xl font-bold text-sap-ink tabular-nums">
            {formatNumber(totalUnidadesFalta)}{' '}
            <span className="text-sm font-normal text-sap-ink-meta">un.</span>
          </div>
          <p className="mt-1 text-xs text-sap-ink-meta">
            {totalUrgentes} urgentes (zerados) e {totalAltas} prioridade alta.
          </p>
        </div>

        <div className="rounded-sap bg-sap-canvas border border-sap-hairline border-t-2 border-t-rose-700 p-4">
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-xs font-medium uppercase">Ruptura Imediata</span>
            <AlertOctagon className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-700 tabular-nums">
            {totalUrgentes}{' '}
            <span className="text-sm font-normal text-sap-ink-meta">SKUs</span>
          </div>
          <p className="mt-1 text-xs text-sap-ink-meta">
            Itens com saldo &le; 0 que possuem mínimo definido.
          </p>
        </div>

        <div className="rounded-sap bg-sap-canvas border border-sap-hairline border-t-2 border-t-sap-navy p-4">
          <div className="flex items-center justify-between text-sap-primary-deep">
            <span className="text-xs font-medium uppercase">Capital em Excesso</span>
            <Layers className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-bold text-sap-primary-deep tabular-nums">
            {formatCurrency(totalCapitalExcesso)}
          </div>
          <p className="mt-1 text-xs text-sap-ink-meta">
            {excessItems.length} SKUs acima de {excessMultiplier}x o estoque mínimo.
          </p>
        </div>
      </div>

      <div className="rounded-sap-lg bg-sap-canvas border border-sap-hairline overflow-hidden">
        <div className="px-5 py-4 bg-sap-chrome border-b border-sap-hairline flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-sap-primary" />
            <div>
              <h3 className="font-semibold text-sm text-sap-ink">
                Plano de Ação — Reposição &amp; Desmobilização de Excesso
              </h3>
              <p className="text-xs text-sap-ink-meta">
                Alternância entre compras urgentes e itens com cobertura excedente
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center p-0.5 rounded-sap bg-sap-canvas border border-sap-hairline text-xs">
              <button
                onClick={() => setSectionMode('REPOSICAO')}
                className={`px-3 py-1.5 rounded-[6px] font-medium transition-colors ${
                  sectionMode === 'REPOSICAO'
                    ? 'bg-sap-primary text-sap-on-primary'
                    : 'text-sap-ink-nav hover:bg-sap-chrome'
                }`}
              >
                Ordem de Reposição ({items.length})
              </button>
              <button
                onClick={() => setSectionMode('EXCESSO')}
                className={`px-3 py-1.5 rounded-[6px] font-medium transition-colors ${
                  sectionMode === 'EXCESSO'
                    ? 'bg-sap-primary text-sap-on-primary'
                    : 'text-sap-ink-nav hover:bg-sap-chrome'
                }`}
              >
                Estoque em Excesso ({excessItems.length})
              </button>
            </div>

            {sectionMode === 'REPOSICAO' && (
              <>
                <div className="flex items-center gap-1 p-0.5 rounded-sap bg-sap-canvas border border-sap-hairline text-xs">
                  {(['ALL', 'URGENTE', 'ALTA'] as const).map((prio) => (
                    <button
                      key={prio}
                      onClick={() => setFilterPriority(prio)}
                      className={`px-2.5 py-1 rounded-[6px] font-medium transition-colors ${
                        filterPriority === prio
                          ? 'bg-sap-band-blue text-sap-primary-deep'
                          : 'text-sap-ink-nav hover:bg-sap-chrome'
                      }`}
                    >
                      {prio === 'ALL'
                        ? `Todos (${items.length})`
                        : prio === 'URGENTE'
                        ? `Urgentes (${totalUrgentes})`
                        : `Alta (${totalAltas})`}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleExportCsv}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-sap bg-sap-primary hover:bg-sap-primary-deep text-sap-on-primary text-xs font-medium transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Exportar Pedido</span>
                </button>
              </>
            )}
          </div>
        </div>

        {sectionMode === 'REPOSICAO' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-sap-hairline-strong text-sap-ink-meta font-semibold uppercase tracking-wider bg-sap-canvas">
                  <th className="py-2.5 px-3">Prioridade</th>
                  <th className="py-2.5 px-3">Código</th>
                  <th className="py-2.5 px-3">Produto</th>
                  <th className="py-2.5 px-3">Categoria / Marca</th>
                  <th className="py-2.5 px-3 text-right">Saldo</th>
                  <th className="py-2.5 px-3 text-right">Mínimo</th>
                  <th className="py-2.5 px-3 text-right">Repor</th>
                  <th className="py-2.5 px-3 text-right">Custo Un.</th>
                  <th className="py-2.5 px-3 text-right">Investimento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sap-hairline">
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => onSelectProductById(item.codigo)}
                    className="hover:bg-sap-band-blue/50 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3">
                      {item.prioridade === 'URGENTE' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                          <AlertOctagon className="h-3 w-3" /> URGENTE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          <AlertTriangle className="h-3 w-3" /> ALTA
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-sap-primary tabular-nums">
                      {item.codigo}
                    </td>
                    <td className="py-2.5 px-3 max-w-sm truncate font-medium text-sap-ink-body">
                      {item.produto}
                    </td>
                    <td className="py-2.5 px-3 text-sap-ink-list">
                      {item.categoria}{' '}
                      <span className="text-[10px] text-sap-ink-meta">({item.fabricante})</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold tabular-nums text-rose-700">
                      {item.estoque} un
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-sap-ink-list">
                      {item.estoque_minimo} un
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold tabular-nums text-sap-primary">
                      +{formatNumber(item.sugestao_compra_qtd)}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-sap-ink-list">
                      {formatCurrency(item.custo_unitario)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold tabular-nums text-sap-ink">
                      {formatCurrency(item.investimento_necessario)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-sap-hairline-strong text-sap-ink-meta font-semibold uppercase tracking-wider bg-sap-canvas">
                  <th className="py-2.5 px-3">Código</th>
                  <th className="py-2.5 px-3">Produto</th>
                  <th className="py-2.5 px-3">Categoria</th>
                  <th className="py-2.5 px-3 text-right">Saldo Atual</th>
                  <th className="py-2.5 px-3 text-right">Mínimo</th>
                  <th className="py-2.5 px-3 text-right">Cobertura</th>
                  <th className="py-2.5 px-3 text-right">Excedente (&gt;{excessMultiplier}x)</th>
                  <th className="py-2.5 px-3 text-right">Capital Excedente (Custo)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sap-hairline">
                {excessItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-sap-ink-meta">
                      Nenhum item excede {excessMultiplier}x do estoque mínimo definido.
                    </td>
                  </tr>
                ) : (
                  excessItems.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => onSelectProductById(item.codigo)}
                      className="hover:bg-sap-band-blue/50 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3 font-semibold text-sap-primary tabular-nums">
                        {item.codigo}
                      </td>
                      <td className="py-2.5 px-3 max-w-sm truncate font-medium text-sap-ink-body">
                        {item.produto}
                      </td>
                      <td className="py-2.5 px-3 text-sap-ink-list">{item.categoria}</td>
                      <td className="py-2.5 px-3 text-right font-bold tabular-nums text-sap-ink">
                        {formatNumber(item.estoque)} un
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-sap-ink-meta">
                        {formatNumber(item.estoque_minimo)} un
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold tabular-nums text-sap-primary-deep">
                        {item.fator_cobertura}x
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold tabular-nums text-amber-700">
                        +{formatNumber(item.excedente)} un
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold tabular-nums text-sap-ink">
                        {formatCurrency(item.capital_excedente_custo)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
