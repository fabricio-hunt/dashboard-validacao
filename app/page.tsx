'use client'

import React, { useState, useEffect } from 'react'
import {
  BarChart3,
  Table as TableIcon,
  ShoppingCart,
  Clock,
  Network,
  Activity,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { QuickAlertsBar } from '@/components/dashboard/QuickAlertsBar'
import { ExecutiveView } from '@/components/dashboard/ExecutiveView'
import { DataGridPro } from '@/components/dashboard/DataGridPro'
import { RestockView } from '@/components/dashboard/RestockView'
import { ExpirationsView } from '@/components/dashboard/ExpirationsView'
import { ApiIntegrationHub } from '@/components/dashboard/ApiIntegrationHub'
import { InventoryService } from '@/lib/api/inventoryService'
import { ProductItem } from '@/types/inventory'

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<string>('executive')
  const [isDark, setIsDark] = useState<boolean>(true)
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null)
  const [gridInitialFilter, setGridInitialFilter] = useState<string>('ALL')

  const summary = InventoryService.getSummary()
  const allProducts = InventoryService.getAllProducts()
  const categories = InventoryService.getCategories()
  const manufacturers = InventoryService.getManufacturers()
  const restockItems = InventoryService.getRestockRecommendations()

  // Top products for executive view
  const topProducts = [...allProducts]
    .sort((a, b) => b.valor_total_venda - a.valor_total_venda)
    .slice(0, 10)

  // Gerencia classe Dark Mode no documento HTML
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  const toggleTheme = () => {
    setIsDark(!isDark)
  }

  // Exportar todo o dataset para CSV
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

    const rows = allProducts.map((p) => [
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

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `medstock-relatorio-geral-${new Date().toISOString().slice(0, 10)}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Ao clicar em um dos alertas rápidos
  const handleSelectQuickFilter = (
    type: 'ZERADO' | 'CRITICO' | 'RISCO_VALIDADE' | 'NEGATIVO'
  ) => {
    if (type === 'CRITICO') {
      setActiveTab('restock')
    } else if (type === 'RISCO_VALIDADE') {
      setActiveTab('expirations')
    } else {
      setGridInitialFilter(type)
      setActiveTab('datagrid')
    }
  }

  const handleSelectProductById = (codigo: string) => {
    const prod = allProducts.find((p) => p.codigo === codigo)
    if (prod) {
      setSelectedProduct(prod)
      setActiveTab('datagrid')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Header Fixo */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onExportCsv={handleExportFullCsv}
        isDark={isDark}
        toggleTheme={toggleTheme}
      />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner de Demonstração / Homologação */}
        <div className="rounded-2xl bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-transparent border border-teal-500/20 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-400 shrink-0">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <span className="font-bold text-teal-800 dark:text-teal-300">
                Protótipo Comercial de Validação (Deploy Vercel):
              </span>{' '}
              <span className="text-slate-600 dark:text-slate-400">
                Alimentado pela planilha com 251 SKUs médicos. Conector de API REST já estruturado para a virada de chave pós-aprovação.
              </span>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('api-integration')}
            className="shrink-0 font-bold text-teal-700 dark:text-teal-300 hover:text-teal-800 dark:hover:text-teal-200 underline decoration-teal-500/40 underline-offset-4"
          >
            Ver Mapeamento da API &rarr;
          </button>
        </div>

        {/* 4 Badges de Alertas Rápidos (Sempre Visíveis para Ação Imediata) */}
        <QuickAlertsBar
          summary={summary}
          onSelectFilter={handleSelectQuickFilter}
        />

        {/* Navegação por Tabs Modernas */}
        <div className="border-b border-slate-200 dark:border-slate-800">
          <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setActiveTab('executive')}
              className={`flex items-center gap-2 py-3 px-3.5 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
                activeTab === 'executive'
                  ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Visão Executiva & Financeira</span>
            </button>

            <button
              onClick={() => {
                setGridInitialFilter('ALL')
                setActiveTab('datagrid')
              }}
              className={`flex items-center gap-2 py-3 px-3.5 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
                activeTab === 'datagrid'
                  ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <TableIcon className="h-4 w-4" />
              <span>Catálogo & Data Grid Pro</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-400">
                251
              </span>
            </button>

            <button
              onClick={() => setActiveTab('restock')}
              className={`flex items-center gap-2 py-3 px-3.5 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
                activeTab === 'restock'
                  ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Ruptura & Compras</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold">
                {summary.total_criticos}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('expirations')}
              className={`flex items-center gap-2 py-3 px-3.5 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
                activeTab === 'expirations'
                  ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>Validades ANVISA & Lotes</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold">
                {summary.total_vencidos + summary.total_vence_90d}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('api-integration')}
              className={`flex items-center gap-2 py-3 px-3.5 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
                activeTab === 'api-integration'
                  ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <Network className="h-4 w-4" />
              <span>Integração com API do Cliente</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
                API Ready
              </span>
            </button>
          </nav>
        </div>

        {/* Renderização da Tab Ativa */}
        <div>
          {activeTab === 'executive' && (
            <ExecutiveView
              summary={summary}
              topProducts={topProducts}
              onSelectProduct={(p) => {
                setSelectedProduct(p)
                setActiveTab('datagrid')
              }}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'datagrid' && (
            <DataGridPro
              products={allProducts}
              categories={categories}
              manufacturers={manufacturers}
              initialFilter={gridInitialFilter}
              selectedProduct={selectedProduct}
              setSelectedProduct={setSelectedProduct}
            />
          )}

          {activeTab === 'restock' && (
            <RestockView
              items={restockItems}
              onSelectProductById={handleSelectProductById}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'expirations' && (
            <ExpirationsView
              products={allProducts}
              onSelectProduct={(p) => {
                setSelectedProduct(p)
                setActiveTab('datagrid')
              }}
            />
          )}

          {activeTab === 'api-integration' && <ApiIntegrationHub />}
        </div>
      </main>

      {/* Footer Profissional */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              MedStock Analytics
            </span>
            <span>&bull;</span>
            <span>Demonstração de Homologação Comercial</span>
          </div>
          <div>
            Pronto para deploy na Vercel com suporte nativo a API REST
          </div>
        </div>
      </footer>
    </div>
  )
}
