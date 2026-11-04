'use client'

import React, { useState, useMemo } from 'react'
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  AlertOctagon,
  AlertTriangle,
  HelpCircle,
  Clock,
  Layers,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  Tag,
  DollarSign,
  TrendingUp,
} from 'lucide-react'
import { ProductItem, StockStatus, AbcClass } from '@/types/inventory'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils'

interface DataGridProProps {
  products: ProductItem[]
  categories: string[]
  manufacturers: string[]
  initialFilter?: string
  selectedProduct: ProductItem | null
  setSelectedProduct: (p: ProductItem | null) => void
}

export function DataGridPro({
  products,
  categories,
  manufacturers,
  initialFilter,
  selectedProduct,
  setSelectedProduct,
}: DataGridProProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [selectedStatus, setSelectedStatus] = useState<string>(initialFilter || 'ALL')
  const [selectedAbc, setSelectedAbc] = useState<string>('ALL')
  const [selectedManufacturer, setSelectedManufacturer] = useState('ALL')
  const [sortBy, setSortBy] = useState<'valor_total_venda' | 'estoque' | 'margem_percentual' | 'produto'>('valor_total_venda')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 15

  // Sincroniza se initialFilter mudar
  React.useEffect(() => {
    if (initialFilter) {
      setSelectedStatus(initialFilter)
      setCurrentPage(1)
    }
  }, [initialFilter])

  // Filtragem e ordenação
  const filteredProducts = useMemo(() => {
    let result = [...products]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (p) =>
          p.codigo.toLowerCase().includes(q) ||
          p.produto.toLowerCase().includes(q) ||
          p.categoria.toLowerCase().includes(q) ||
          p.fabricante.toLowerCase().includes(q) ||
          p.lote.toLowerCase().includes(q)
      )
    }

    if (selectedCategory !== 'ALL') {
      result = result.filter((p) => p.categoria === selectedCategory)
    }

    if (selectedStatus !== 'ALL') {
      if (selectedStatus === 'RISCO_VALIDADE') {
        result = result.filter(
          (p) =>
            p.status_validade === 'VENCIDO' ||
            p.status_validade === 'CRITICO_90D' ||
            p.status_validade === 'ATENCAO_180D'
        )
      } else {
        result = result.filter((p) => p.status_estoque === selectedStatus)
      }
    }

    if (selectedAbc !== 'ALL') {
      result = result.filter((p) => p.curva_abc === selectedAbc)
    }

    if (selectedManufacturer !== 'ALL') {
      result = result.filter((p) => p.fabricante === selectedManufacturer)
    }

    // Ordenação
    result.sort((a, b) => {
      let valA = a[sortBy] as any
      let valB = b[sortBy] as any

      if (typeof valA === 'string') {
        return sortDirection === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA)
      }

      valA = valA || 0
      valB = valB || 0
      return sortDirection === 'asc' ? valA - valB : valB - valA
    })

    return result
  }, [
    products,
    searchQuery,
    selectedCategory,
    selectedStatus,
    selectedAbc,
    selectedManufacturer,
    sortBy,
    sortDirection,
  ])

  // Paginação
  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredProducts.slice(start, start + pageSize)
  }, [filteredProducts, currentPage, pageSize])

  const handleSortToggle = (col: typeof sortBy) => {
    if (sortBy === col) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(col)
      setSortDirection('desc')
    }
  }

  const handleExportFilteredCsv = () => {
    const headers = [
      'Código',
      'Produto',
      'Categoria',
      'Fabricante',
      'Lote',
      'Validade',
      'Estoque',
      'Mínimo',
      'Status Estoque',
      'Custo Unitário',
      'Preço Venda',
      'Margem %',
      'Markup %',
      'Total Custo',
      'Total Venda',
      'Lucro Potencial',
      'Curva ABC',
    ]

    const rows = filteredProducts.map((p) => [
      `"${p.codigo}"`,
      `"${p.produto.replace(/"/g, '""')}"`,
      `"${p.categoria}"`,
      `"${p.fabricante}"`,
      `"${p.lote}"`,
      `"${p.validade}"`,
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
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `medstock-catalogo-filtrado-${new Date().toISOString().slice(0, 10)}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-4">
      {/* Barra de Filtros e Busca Pro */}
      <div className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Campo de Busca Livre */}
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por código, produto, lote, fabricante ou categoria..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Exportar e Reset */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportFilteredCsv}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
              title="Exportar itens visíveis para CSV"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Exportar ({filteredProducts.length})</span>
            </button>

            {(searchQuery ||
              selectedCategory !== 'ALL' ||
              selectedStatus !== 'ALL' ||
              selectedAbc !== 'ALL' ||
              selectedManufacturer !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('ALL')
                  setSelectedStatus('ALL')
                  setSelectedAbc('ALL')
                  setSelectedManufacturer('ALL')
                  setCurrentPage(1)
                }}
                className="text-xs text-rose-500 hover:underline font-semibold px-2 py-1"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        </div>

        {/* Dropdowns de Filtro */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60">
          {/* Categoria */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-1">
              CATEGORIA
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full py-1.5 px-2.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">Todas as Categorias (23)</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Status de Estoque */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-1">
              STATUS DE ESTOQUE
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full py-1.5 px-2.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">Todos os Status</option>
              <option value="ZERADO">🚨 Ruptura (Zerado - 47)</option>
              <option value="CRITICO">⚠️ Crítico (&lt; Mínimo - 21)</option>
              <option value="NEGATIVO">🔍 Saldo Negativo (4)</option>
              <option value="NORMAL">✅ Regular</option>
              <option value="RISCO_VALIDADE">⏳ Risco Validade ANVISA</option>
            </select>
          </div>

          {/* Curva ABC */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-1">
              CURVA ABC (PARETO)
            </label>
            <select
              value={selectedAbc}
              onChange={(e) => {
                setSelectedAbc(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full py-1.5 px-2.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">Todas as Classes</option>
              <option value="A">Classe A (80% do valor)</option>
              <option value="B">Classe B (15% do valor)</option>
              <option value="C">Classe C (5% do valor)</option>
            </select>
          </div>

          {/* Fabricante */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-1">
              FABRICANTE / MARCA
            </label>
            <select
              value={selectedManufacturer}
              onChange={(e) => {
                setSelectedManufacturer(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full py-1.5 px-2.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">Todos os Fabricantes</option>
              {manufacturers.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabela de Produtos */}
      <div className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-3">Status</th>
                <th
                  onClick={() => handleSortToggle('produto')}
                  className="py-3 px-3 cursor-pointer hover:text-teal-600 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Código & Produto</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3 px-3">Categoria</th>
                <th className="py-3 px-3">Lote / Validade</th>
                <th
                  onClick={() => handleSortToggle('estoque')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-teal-600 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Saldo</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3 px-3 text-right">Mínimo</th>
                <th className="py-3 px-3 text-right">Custo Un.</th>
                <th className="py-3 px-3 text-right">Venda Un.</th>
                <th
                  onClick={() => handleSortToggle('margem_percentual')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-teal-600 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Margem</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSortToggle('valor_total_venda')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-teal-600 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Valor Total</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center">ABC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400 text-xs">
                    Nenhum produto encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
                  let statusBadge = (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      Normal
                    </span>
                  )
                  if (p.status_estoque === 'ZERADO') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                        <AlertOctagon className="h-3 w-3" /> Zerado
                      </span>
                    )
                  } else if (p.status_estoque === 'CRITICO') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        <AlertTriangle className="h-3 w-3" /> Crítico
                      </span>
                    )
                  } else if (p.status_estoque === 'NEGATIVO') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                        <HelpCircle className="h-3 w-3" /> Negativo
                      </span>
                    )
                  }

                  const isSelected = selectedProduct?.id === p.id

                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedProduct(p)}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors ${
                        isSelected ? 'bg-teal-500/10 dark:bg-teal-900/20' : ''
                      }`}
                    >
                      <td className="py-3 px-3">{statusBadge}</td>
                      <td className="py-3 px-3 max-w-xs">
                        <div className="font-mono font-bold text-teal-600 dark:text-teal-400 text-xs">
                          {p.codigo}
                        </div>
                        <div className="font-medium text-slate-900 dark:text-slate-100 truncate text-[11px] mt-0.5">
                          {p.produto}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 text-[11px]">
                        {p.categoria}
                      </td>
                      <td className="py-3 px-3 text-[11px]">
                        <div className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                          LT: {p.lote}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 text-[10px]">
                          VAL: {p.validade}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-slate-900 dark:text-white">
                        {p.estoque < 0 ? (
                          <span className="text-rose-500">{p.estoque} un</span>
                        ) : p.estoque === 0 ? (
                          <span className="text-rose-600 dark:text-rose-400">0 un</span>
                        ) : (
                          `${formatNumber(p.estoque)} un`
                        )}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-500">
                        {p.estoque_minimo !== null ? `${p.estoque_minimo} un` : '-'}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400">
                        {formatCurrency(p.custo)}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-slate-800 dark:text-slate-200">
                        {formatCurrency(p.valor_venda)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {formatPercent(p.margem_percentual)}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-slate-900 dark:text-white">
                        {formatCurrency(p.valor_total_venda)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            p.curva_abc === 'A'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                              : p.curva_abc === 'B'
                              ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
                              : 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30'
                          }`}
                        >
                          {p.curva_abc}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé e Paginação */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Exibindo{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {filteredProducts.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
            </span>{' '}
            a{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {Math.min(currentPage * pageSize, filteredProducts.length)}
            </span>{' '}
            de{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {filteredProducts.length}
            </span>{' '}
            produtos ({products.length} no catálogo)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Drawer Lateral / Modal com Ficha 360° do SKU */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl p-6 overflow-y-auto border-l border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <Tag className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Ficha Técnica do SKU
                  </h3>
                  <span className="font-mono text-xs text-teal-600 dark:text-teal-400 font-bold">
                    {selectedProduct.codigo}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Descrição e Categoria */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                {selectedProduct.produto}
              </h4>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="px-2 py-0.5 rounded-md text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                  {selectedProduct.categoria}
                </span>
                <span className="px-2 py-0.5 rounded-md text-xs bg-teal-500/10 text-teal-600 dark:text-teal-400 font-semibold">
                  Marca: {selectedProduct.fabricante}
                </span>
                <span className="px-2 py-0.5 rounded-md text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400 font-extrabold">
                  Curva ABC: Classe {selectedProduct.curva_abc}
                </span>
              </div>
            </div>

            {/* Saldo de Estoque & Status */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Posição Fisiológica de Estoque
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-500">Saldo Atual</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {formatNumber(selectedProduct.estoque)} un
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Estoque Mínimo</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {selectedProduct.estoque_minimo !== null
                      ? `${selectedProduct.estoque_minimo} un`
                      : 'Não definido'}
                  </div>
                </div>
              </div>
              {selectedProduct.sugestao_compra_qtd > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" />
                  Necessidade de Reposição: +{selectedProduct.sugestao_compra_qtd} unidades ({formatCurrency(selectedProduct.sugestao_compra_custo)})
                </div>
              )}
            </div>

            {/* Rentabilidade & Precificação */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Análise Financeira & Margens
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500">Custo de Aquisição:</span>
                  <div className="text-base font-bold text-slate-900 dark:text-white">
                    {formatCurrency(selectedProduct.custo)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Preço de Venda:</span>
                  <div className="text-base font-bold text-slate-900 dark:text-white">
                    {formatCurrency(selectedProduct.valor_venda)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Lucro Unitário:</span>
                  <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(selectedProduct.lucro_unitario)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Margem Bruta:</span>
                  <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                    {formatPercent(selectedProduct.margem_percentual)} (Markup: {formatPercent(selectedProduct.markup_percentual)})
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex justify-between text-xs font-semibold">
                <span className="text-slate-500">Patrimônio Total em Estoque:</span>
                <span className="text-slate-900 dark:text-white font-extrabold text-sm">
                  {formatCurrency(selectedProduct.valor_total_venda)}
                </span>
              </div>
            </div>

            {/* Rastreabilidade ANVISA */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Rastreabilidade de Lote e ANVISA
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500">Número de Lote:</span>
                  <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {selectedProduct.lote}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Data de Validade:</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedProduct.validade}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedProduct(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition-opacity"
            >
              Fechar Ficha
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
