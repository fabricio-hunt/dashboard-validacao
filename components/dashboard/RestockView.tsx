'use client'

import React, { useState } from 'react'
import {
  ShoppingCart,
  AlertTriangle,
  AlertOctagon,
  DollarSign,
  Download,
  Filter,
  CheckCircle,
  PackagePlus,
  SendHorizontal,
} from 'lucide-react'
import { RestockItem, ProductItem } from '@/types/inventory'
import { formatCurrency, formatNumber } from '@/lib/utils'

interface RestockViewProps {
  items: RestockItem[]
  onSelectProductById: (code: string) => void
  onNavigateTab: (tab: string) => void
}

export function RestockView({
  items,
  onSelectProductById,
  onNavigateTab,
}: RestockViewProps) {
  const [filterPriority, setFilterPriority] = useState<string>('ALL')

  const filteredItems = items.filter((item) => {
    if (filterPriority === 'ALL') return true
    return item.prioridade === filterPriority
  })

  const totalInvestimento = items.reduce(
    (acc, item) => acc + item.investimento_necessario,
    0
  )
  const totalUnidadesFalta = items.reduce(
    (acc, item) => acc + item.sugestao_compra_qtd,
    0
  )
  const totalUrgentes = items.filter((i) => i.prioridade === 'URGENTE').length
  const totalAltas = items.filter((i) => i.prioridade === 'ALTA').length

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

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `ordem-reposicao-sugerida-${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Banner de Compras & KPIs de Reposição */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Investimento Total */}
        <div className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Investimento para Nivelamento
            </span>
            <span className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <DollarSign className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {formatCurrency(totalInvestimento)}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Custo total para suprir todo o déficit em relação ao estoque mínimo.
          </p>
        </div>

        {/* Card 2: Unidades em Falta */}
        <div className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Déficit Físico de Compras
            </span>
            <span className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <PackagePlus className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {formatNumber(totalUnidadesFalta)}{' '}
            <span className="text-sm font-medium text-slate-500">un.</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Quantidade total a faturar junto a fornecedores e distribuidores.
          </p>
        </div>

        {/* Card 3: SKUs em Ruptura Imediata */}
        <div className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-300">
              Urgência Máxima (Estoque &lt;= 0)
            </span>
            <span className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <AlertOctagon className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400">
            {totalUrgentes}{' '}
            <span className="text-sm font-medium text-rose-500/80">SKUs</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Itens com estoque zerado ou negativo que possuem parâmetro mínimo.
          </p>
        </div>

        {/* Card 4: SKUs em Alerta */}
        <div className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              Alta Prioridade (&lt; 50% Mín.)
            </span>
            <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">
            {totalAltas}{' '}
            <span className="text-sm font-medium text-amber-500/80">SKUs</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Itens que esgotarão nos próximos dias se não emitido pedido.
          </p>
        </div>
      </div>

      {/* Caixa de Sugestão de Reposição & Tabela */}
      <div className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Grade de Reposição & Ordem de Compra Sugerida
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Calculada dinamicamente: <code>Déficit = Estoque Mínimo - Saldo Atual</code>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filtro por prioridade */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <button
                onClick={() => setFilterPriority('ALL')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  filterPriority === 'ALL'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Todos ({items.length})
              </button>
              <button
                onClick={() => setFilterPriority('URGENTE')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  filterPriority === 'URGENTE'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-slate-500 hover:text-rose-500'
                }`}
              >
                Urgentes ({totalUrgentes})
              </button>
              <button
                onClick={() => setFilterPriority('ALTA')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  filterPriority === 'ALTA'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-500 hover:text-amber-500'
                }`}
              >
                Alta ({totalAltas})
              </button>
            </div>

            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Exportar Pedido</span>
            </button>
          </div>
        </div>

        {/* Notificação de API para o Cliente */}
        <div className="my-4 p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-start gap-3">
          <SendHorizontal className="h-4 w-4 text-teal-600 dark:text-teal-400 mt-0.5 shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-teal-700 dark:text-teal-300">
              Integração Automática com ERP (Fase 2 - API):
            </span>{' '}
            <span className="text-slate-600 dark:text-slate-300">
              Ao conectar com a API do cliente, o botão de compra pode disparar diretamente o endpoint{' '}
              <code className="px-1 py-0.5 rounded bg-teal-500/20 text-teal-800 dark:text-teal-200 font-mono font-semibold">
                POST /pedidos-compra/sugestoes
              </code>{' '}
              no ERP hospitalar, eliminando digitação manual do almoxarife.
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3">Prioridade</th>
                <th className="py-2.5 px-3">Código</th>
                <th className="py-2.5 px-3">Produto</th>
                <th className="py-2.5 px-3">Categoria / Marca</th>
                <th className="py-2.5 px-3 text-right">Saldo Atual</th>
                <th className="py-2.5 px-3 text-right">Estoque Mínimo</th>
                <th className="py-2.5 px-3 text-right">Qtd Sugerida</th>
                <th className="py-2.5 px-3 text-right">Custo Unitário</th>
                <th className="py-2.5 px-3 text-right">Investimento Estimado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredItems.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onSelectProductById(item.codigo)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-3">
                    {item.prioridade === 'URGENTE' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                        <AlertOctagon className="h-3 w-3" /> URGENTE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        <AlertTriangle className="h-3 w-3" /> ALTA
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-teal-600 dark:text-teal-400">
                    {item.codigo}
                  </td>
                  <td className="py-3 px-3 max-w-sm truncate font-medium text-slate-900 dark:text-slate-100">
                    {item.produto}
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                    {item.categoria} <span className="text-[10px] text-slate-400 font-mono">({item.fabricante})</span>
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-rose-600 dark:text-rose-400">
                    {item.estoque} un
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">
                    {item.estoque_minimo} un
                  </td>
                  <td className="py-3 px-3 text-right font-black text-teal-600 dark:text-teal-400 text-sm">
                    +{formatNumber(item.sugestao_compra_qtd)}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400">
                    {formatCurrency(item.custo_unitario)}
                  </td>
                  <td className="py-3 px-3 text-right font-extrabold text-slate-900 dark:text-white">
                    {formatCurrency(item.investimento_necessario)}
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
