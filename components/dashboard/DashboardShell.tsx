'use client'

import React, { useState, useCallback } from 'react'
import {
  BarChart3,
  TrendingUp,
  Table as TableIcon,
  ShoppingCart,
  Clock,
  Network,
} from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { QuickAlertsBar } from '@/components/dashboard/QuickAlertsBar'
import { ExecutiveView } from '@/components/dashboard/ExecutiveView'
import { RankingsTop11View } from '@/components/dashboard/RankingsTop11View'
import { DataGridPro } from '@/components/dashboard/DataGridPro'
import { RestockView } from '@/components/dashboard/RestockView'
import { ExpirationsView } from '@/components/dashboard/ExpirationsView'
import { ApiIntegrationHub } from '@/components/dashboard/ApiIntegrationHub'
import {
  DashboardSummary,
  ExcessItem,
  ProductItem,
  RestockItem,
} from '@/types/inventory'

interface DashboardShellProps {
  initialSummary: DashboardSummary
  initialProducts: ProductItem[]
  categories: string[]
  manufacturers: string[]
  initialRestockItems: RestockItem[]
  initialExcessItems: ExcessItem[]
}

export function DashboardShell({
  initialSummary,
  initialProducts,
  categories,
  manufacturers,
  initialRestockItems,
  initialExcessItems,
}: DashboardShellProps) {
  const [activeTab, setActiveTab] = useState<string>('executive')
  const [summary, setSummary] = useState<DashboardSummary>(initialSummary)
  const [products, setProducts] = useState<ProductItem[]>(initialProducts)
  const [restockItems] = useState<RestockItem[]>(initialRestockItems)
  const [excessItems, setExcessItems] = useState<ExcessItem[]>(initialExcessItems)
  const [excessMultiplier, setExcessMultiplier] = useState<number>(
    initialSummary.excess_multiplier
  )
  const [contasAReceber, setContasAReceber] = useState<number>(
    initialSummary.contas_a_receber
  )
  const [salesSourceLabel, setSalesSourceLabel] = useState<string>('SmartPOS API')

  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null)
  const [gridInitialFilter, setGridInitialFilter] = useState<string>('ALL')
  const [gridInitialCategory, setGridInitialCategory] = useState<string>('ALL')

  const topProducts = [...products]
    .sort((a, b) => b.valor_total_venda - a.valor_total_venda)
    .slice(0, 10)

  const handleChangeExcessMultiplier = useCallback(
    async (mult: number) => {
      setExcessMultiplier(mult)
      try {
        const [metricsRes, invRes, restockRes] = await Promise.all([
          fetch(`/api/metrics?excessMultiplier=${mult}&contasAReceber=${contasAReceber}`),
          fetch(`/api/inventory?excessMultiplier=${mult}`),
          fetch(`/api/restock?excessMultiplier=${mult}`),
        ])
        if (metricsRes.ok) setSummary(await metricsRes.json())
        if (invRes.ok) {
          const invJson = await invRes.json()
          if (Array.isArray(invJson.items)) setProducts(invJson.items)
        }
        if (restockRes.ok) {
          const rJson = await restockRes.json()
          if (Array.isArray(rJson.excess)) setExcessItems(rJson.excess)
        }
      } catch {
        // Mantém estado local atual caso ocorra falha transitória de rede
      }
    },
    [contasAReceber]
  )

  const handleExportFullCsv = () => {
    const headers = [
      'Código',
      'Produto',
      'Categoria',
      'Fabricante',
      'Lote',
      'Validade',
      'Status Validade',
      'Estoque Físico',
      'Estoque Mínimo',
      'Status Estoque',
      'Excesso',
      'Custo Unitário (R$)',
      'Preço Venda (R$)',
      'Margem (%)',
      'Markup (%)',
      'Valor Total Custo (R$)',
      'Valor Total Venda (R$)',
      'Lucro Potencial (R$)',
      'Curva ABC',
      'Sugestão Reposição (Qtd)',
      'Investimento Reposição (R$)',
    ]

    const rows = products.map((p) => [
      `"${p.codigo}"`,
      `"${p.produto.replace(/"/g, '""')}"`,
      `"${p.categoria}"`,
      `"${p.fabricante}"`,
      `"${p.lote}"`,
      `"${p.validade}"`,
      p.status_validade,
      p.estoque,
      p.estoque_minimo !== null ? p.estoque_minimo : '',
      p.status_estoque,
      p.em_excesso ? 'SIM' : 'NAO',
      p.custo.toFixed(2),
      p.valor_venda.toFixed(2),
      p.margem_percentual.toFixed(1),
      p.markup_percentual.toFixed(1),
      p.valor_total_custo.toFixed(2),
      p.valor_total_venda.toFixed(2),
      p.lucro_potencial.toFixed(2),
      p.curva_abc,
      p.sugestao_compra_qtd,
      p.sugestao_compra_custo.toFixed(2),
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n')

    const link = document.createElement('a')
    link.setAttribute('href', encodeURI(csvContent))
    link.setAttribute(
      'download',
      `medstock-bi-${new Date().toISOString().slice(0, 10)}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleSelectQuickFilter = (
    type: 'ZERADO' | 'CRITICO' | 'EXCESSO' | 'RISCO_VALIDADE'
  ) => {
    if (type === 'CRITICO') {
      setActiveTab('restock')
    } else if (type === 'RISCO_VALIDADE') {
      setActiveTab('expirations')
    } else {
      setGridInitialCategory('ALL')
      setGridInitialFilter(type)
      setActiveTab('datagrid')
    }
  }

  const handleFilterCategory = (categoria: string) => {
    setGridInitialFilter('ALL')
    setGridInitialCategory(categoria)
    setActiveTab('datagrid')
  }

  const handleSelectProductById = (codigo: string) => {
    const prod = products.find((p) => p.codigo === codigo)
    if (prod) {
      setSelectedProduct(prod)
      setActiveTab('datagrid')
    }
  }

  const tabs = [
    { id: 'executive', label: 'BI Executivo', icon: BarChart3 },
    { id: 'rankings', label: 'Vendas & Rankings Top 11', icon: TrendingUp },
    {
      id: 'datagrid',
      label: 'Catálogo & Estoque',
      icon: TableIcon,
      count: summary.total_skus,
    },
    {
      id: 'restock',
      label: 'Plano de Ação',
      icon: ShoppingCart,
      count: summary.total_criticos + summary.total_excesso,
    },
    {
      id: 'expirations',
      label: 'Validades ANVISA',
      icon: Clock,
      count: summary.total_vencidos + summary.total_vence_90d,
    },
    { id: 'api-integration', label: 'Integração SmartPOS', icon: Network },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-sap-canvas text-sap-ink-body">
      {/* Andar 1 do Chrome SAP */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onExportCsv={handleExportFullCsv}
        totalSkus={summary.total_skus}
        salesSourceLabel={salesSourceLabel}
      />

      {/* Andar 2 do Chrome SAP: Trilho de Abas */}
      <div className="bg-sap-canvas border-b border-sap-hairline">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-2 sm:space-x-5 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === 'datagrid') {
                      setGridInitialFilter('ALL')
                      setGridInitialCategory('ALL')
                    }
                    setActiveTab(tab.id)
                  }}
                  className={`flex items-center gap-2 h-11 px-1 border-b-2 text-xs sm:text-sm whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-sap-primary text-sap-primary font-medium'
                      : 'border-transparent text-sap-ink-nav font-normal hover:text-sap-ink'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`px-1.5 py-0.5 rounded-[4px] text-[10px] font-semibold tabular-nums ${
                        isActive
                          ? 'bg-sap-band-blue text-sap-primary-deep'
                          : 'bg-sap-chrome text-sap-ink-meta'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <QuickAlertsBar summary={summary} onSelectFilter={handleSelectQuickFilter} />

        {activeTab === 'executive' && (
          <ExecutiveView
            summary={summary}
            topProducts={topProducts}
            excessMultiplier={excessMultiplier}
            onChangeExcessMultiplier={handleChangeExcessMultiplier}
            contasAReceber={contasAReceber}
            onChangeContasAReceber={setContasAReceber}
            onSelectProduct={(p) => {
              setSelectedProduct(p)
              setActiveTab('datagrid')
            }}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onFilterCategory={handleFilterCategory}
          />
        )}

        {activeTab === 'rankings' && (
          <RankingsTop11View
            stockTop11={summary.estoque_top11}
            contasAReceber={contasAReceber}
            onSalesSourceChange={setSalesSourceLabel}
          />
        )}

        {activeTab === 'datagrid' && (
          <DataGridPro
            products={products}
            categories={categories}
            manufacturers={manufacturers}
            initialFilter={gridInitialFilter}
            initialCategory={gridInitialCategory}
            selectedProduct={selectedProduct}
            setSelectedProduct={setSelectedProduct}
          />
        )}

        {activeTab === 'restock' && (
          <RestockView
            items={restockItems}
            excessItems={excessItems}
            excessMultiplier={excessMultiplier}
            onSelectProductById={handleSelectProductById}
          />
        )}

        {activeTab === 'expirations' && (
          <ExpirationsView
            products={products}
            onSelectProduct={(p) => {
              setSelectedProduct(p)
              setActiveTab('datagrid')
            }}
          />
        )}

        {activeTab === 'api-integration' && <ApiIntegrationHub />}
      </main>

      <footer className="mt-auto bg-sap-band border-t border-sap-hairline py-5 text-xs text-sap-ink-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sap-ink">MedStock BI</span>
            <span>&bull;</span>
            <span>Gestão Executiva de Estoque, Margem, Vendas e Capital</span>
          </div>
          <div>Integração SmartPOS API v1 &bull; Enterprise Light Canvas</div>
        </div>
      </footer>
    </div>
  )
}

