'use client'

import React, { useState, useMemo } from 'react'
import {
  Search,
  ArrowUpDown,
  Download,
  AlertOctagon,
  AlertTriangle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Tag,
  Layers,
} from 'lucide-react'
import { ProductItem } from '@/types/inventory'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils'

interface DataGridProProps {
  products: ProductItem[]
  categories: string[]
  manufacturers: string[]
  initialFilter?: string
  initialCategory?: string
  selectedProduct: ProductItem | null
  setSelectedProduct: (p: ProductItem | null) => void
}

export function DataGridPro({
  products,
  categories,
  manufacturers,
  initialFilter,
  initialCategory,
  selectedProduct,
  setSelectedProduct,
}: DataGridProProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'ALL')
  const [selectedStatus, setSelectedStatus] = useState<string>(initialFilter || 'ALL')
  const [selectedAbc, setSelectedAbc] = useState<string>('ALL')
  const [selectedManufacturer, setSelectedManufacturer] = useState('ALL')
  const [sortBy, setSortBy] = useState<
    'valor_total_venda' | 'estoque' | 'margem_percentual' | 'produto'
  >('valor_total_venda')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 15

  React.useEffect(() => {
    if (initialFilter) {
      setSelectedStatus(initialFilter)
      setCurrentPage(1)
    }
  }, [initialFilter])

  React.useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory)
      setCurrentPage(1)
    }
  }, [initialCategory])

  const counts = useMemo(() => {
    let zerados = 0
    let criticos = 0
    let negativos = 0
    let excesso = 0
    for (const p of products) {
      if (p.status_estoque === 'ZERADO') zerados += 1
      else if (p.status_estoque === 'CRITICO') criticos += 1
      else if (p.status_estoque === 'NEGATIVO') negativos += 1
      if (p.em_excesso) excesso += 1
    }
    return { zerados, criticos, negativos, excesso }
  }, [products])

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
      } else if (selectedStatus === 'EXCESSO') {
        result = result.filter((p) => Boolean(p.em_excesso))
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

    result.sort((a, b) => {
      const valA = a[sortBy]
      const valB = b[sortBy]

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDirection === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA)
      }

      const numA = Number(valA || 0)
      const numB = Number(valB || 0)
      return sortDirection === 'asc' ? numA - numB : numB - numA
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
      'Excesso',
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
      p.em_excesso ? 'SIM' : 'NAO',
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

    const link = document.createElement('a')
    link.setAttribute('href', encodeURI(csvContent))
    link.setAttribute(
      'download',
      `medstock-catalogo-${new Date().toISOString().slice(0, 10)}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-sap bg-sap-canvas border border-sap-hairline p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-sap-ink-meta" />
            <input
              type="text"
              placeholder="Buscar por código, produto, lote, fabricante ou categoria..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-9 pr-8 py-2 rounded-sap text-xs bg-sap-chrome border border-sap-hairline text-sap-ink-body placeholder:text-sap-ink-meta focus:outline-none focus:border-sap-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sap-ink-meta hover:text-sap-ink"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportFilteredCsv}
              className="flex items-center gap-1.5 px-3 py-2 rounded-sap bg-sap-canvas hover:bg-sap-band-blue text-sap-primary-deep text-xs font-medium border border-sap-hairline-strong transition-colors"
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
                className="text-xs text-sap-primary hover:underline font-medium px-2 py-1"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-sap-hairline">
          <div>
            <label className="block text-[10px] font-semibold text-sap-ink-meta mb-1 uppercase">
              Categoria
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full py-1.5 px-2.5 rounded-sap text-xs bg-sap-canvas border border-sap-hairline text-sap-ink-body focus:outline-none focus:border-sap-primary"
            >
              <option value="ALL">Todas ({categories.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-sap-ink-meta mb-1 uppercase">
              Status de Estoque
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full py-1.5 px-2.5 rounded-sap text-xs bg-sap-canvas border border-sap-hairline text-sap-ink-body focus:outline-none focus:border-sap-primary"
            >
              <option value="ALL">Todos os Status</option>
              <option value="ZERADO">Sem estoque ({counts.zerados})</option>
              <option value="CRITICO">Abaixo do mínimo ({counts.criticos})</option>
              <option value="EXCESSO">Em excesso ({counts.excesso})</option>
              <option value="NEGATIVO">Saldo negativo ({counts.negativos})</option>
              <option value="NORMAL">Regular</option>
              <option value="RISCO_VALIDADE">Risco Validade ANVISA</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-sap-ink-meta mb-1 uppercase">
              Curva ABC
            </label>
            <select
              value={selectedAbc}
              onChange={(e) => {
                setSelectedAbc(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full py-1.5 px-2.5 rounded-sap text-xs bg-sap-canvas border border-sap-hairline text-sap-ink-body focus:outline-none focus:border-sap-primary"
            >
              <option value="ALL">Todas as Classes</option>
              <option value="A">Classe A (80%)</option>
              <option value="B">Classe B (15%)</option>
              <option value="C">Classe C (5%)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-sap-ink-meta mb-1 uppercase">
              Fabricante
            </label>
            <select
              value={selectedManufacturer}
              onChange={(e) => {
                setSelectedManufacturer(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full py-1.5 px-2.5 rounded-sap text-xs bg-sap-canvas border border-sap-hairline text-sap-ink-body focus:outline-none focus:border-sap-primary"
            >
              <option value="ALL">Todos ({manufacturers.length})</option>
              {manufacturers.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-sap-lg bg-sap-canvas border border-sap-hairline overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-sap-chrome border-b border-sap-hairline-strong text-sap-ink-meta font-semibold uppercase tracking-wider">
                <th className="py-3 px-3">Status</th>
                <th
                  onClick={() => handleSortToggle('produto')}
                  className="py-3 px-3 cursor-pointer hover:text-sap-primary"
                >
                  <div className="flex items-center gap-1">
                    <span>Código &amp; Produto</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3 px-3">Categoria</th>
                <th className="py-3 px-3">Lote / Validade</th>
                <th
                  onClick={() => handleSortToggle('estoque')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-sap-primary"
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
                  className="py-3 px-3 text-right cursor-pointer hover:text-sap-primary"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Margem</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSortToggle('valor_total_venda')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-sap-primary"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Valor Total</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center">ABC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sap-hairline">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-sap-ink-meta text-xs">
                    Nenhum produto encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
                  let statusBadge = (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-medium bg-sap-chrome text-sap-ink-list border border-sap-hairline">
                      Regular
                    </span>
                  )
                  if (p.status_estoque === 'ZERADO') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                        <AlertOctagon className="h-3 w-3" /> Zerado
                      </span>
                    )
                  } else if (p.status_estoque === 'CRITICO') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        <AlertTriangle className="h-3 w-3" /> Repor
                      </span>
                    )
                  } else if (p.status_estoque === 'NEGATIVO') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-semibold bg-sap-band-lavender text-sap-navy border border-sap-hairline">
                        <HelpCircle className="h-3 w-3" /> Negativo
                      </span>
                    )
                  } else if (p.em_excesso) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-semibold bg-sap-band-blue text-sap-primary-deep border border-sap-primary/25">
                        <Layers className="h-3 w-3" /> Excesso
                      </span>
                    )
                  }

                  const isSelected = selectedProduct?.id === p.id

                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedProduct(p)}
                      className={`hover:bg-sap-band-blue/50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-sap-band-blue' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3">{statusBadge}</td>
                      <td className="py-2.5 px-3 max-w-xs">
                        <div className="font-semibold text-sap-primary tabular-nums text-xs">
                          {p.codigo}
                        </div>
                        <div className="font-medium text-sap-ink-body truncate text-[11px] mt-0.5">
                          {p.produto}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-sap-ink-list text-[11px]">
                        {p.categoria}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] tabular-nums">
                        <div className="text-sap-ink-body font-medium">LT: {p.lote}</div>
                        <div className="text-sap-ink-meta text-[10px]">VAL: {p.validade}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold tabular-nums text-sap-ink">
                        {p.estoque <= 0 ? (
                          <span className="text-rose-700">{p.estoque} un</span>
                        ) : (
                          `${formatNumber(p.estoque)} un`
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-sap-ink-meta">
                        {p.estoque_minimo !== null ? `${p.estoque_minimo} un` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-sap-ink-list">
                        {formatCurrency(p.custo)}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-medium text-sap-ink-body">
                        {formatCurrency(p.valor_venda)}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-emerald-700">
                        {formatPercent(p.margem_percentual)}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-bold text-sap-ink">
                        {formatCurrency(p.valor_total_venda)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-semibold bg-sap-chrome text-sap-ink-body border border-sap-hairline">
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

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-sap-chrome border-t border-sap-hairline text-xs text-sap-ink-meta">
          <div className="tabular-nums">
            Exibindo{' '}
            <span className="font-semibold text-sap-ink">
              {filteredProducts.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
            </span>{' '}
            a{' '}
            <span className="font-semibold text-sap-ink">
              {Math.min(currentPage * pageSize, filteredProducts.length)}
            </span>{' '}
            de <span className="font-semibold text-sap-ink">{filteredProducts.length}</span>{' '}
            produtos ({products.length} no catálogo)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-sap border border-sap-hairline bg-sap-canvas disabled:opacity-40 disabled:cursor-not-allowed hover:bg-sap-band-blue"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-medium text-sap-ink-body tabular-nums">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-sap border border-sap-hairline bg-sap-canvas disabled:opacity-40 disabled:cursor-not-allowed hover:bg-sap-band-blue"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/35">
          <div className="w-full max-w-lg bg-sap-canvas h-full shadow-xl p-6 overflow-y-auto border-l border-sap-hairline space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-sap-hairline">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-sap bg-sap-band-blue text-sap-primary">
                  <Tag className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-bold text-base text-sap-ink">Ficha Técnica do SKU</h3>
                  <span className="text-xs text-sap-primary font-semibold tabular-nums">
                    {selectedProduct.codigo}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-2 rounded-sap hover:bg-sap-chrome text-sap-ink-meta hover:text-sap-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-sap-ink leading-snug">
                {selectedProduct.produto}
              </h4>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="px-2 py-0.5 rounded-[4px] text-xs bg-sap-chrome border border-sap-hairline text-sap-ink-body font-medium">
                  {selectedProduct.categoria}
                </span>
                <span className="px-2 py-0.5 rounded-[4px] text-xs bg-sap-band-blue text-sap-primary-deep font-medium">
                  Marca: {selectedProduct.fabricante}
                </span>
                <span className="px-2 py-0.5 rounded-[4px] text-xs bg-sap-chrome border border-sap-hairline text-sap-ink font-semibold">
                  Curva ABC: {selectedProduct.curva_abc}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-sap bg-sap-chrome border border-sap-hairline space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-sap-ink-meta">
                Posição de Estoque
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-sap-ink-meta">Saldo Atual</div>
                  <div className="text-2xl font-bold text-sap-ink tabular-nums">
                    {formatNumber(selectedProduct.estoque)} un
                  </div>
                </div>
                <div>
                  <div className="text-xs text-sap-ink-meta">Estoque Mínimo</div>
                  <div className="text-2xl font-bold text-sap-ink tabular-nums">
                    {selectedProduct.estoque_minimo !== null
                      ? `${selectedProduct.estoque_minimo} un`
                      : 'Não definido'}
                  </div>
                </div>
              </div>
              {selectedProduct.sugestao_compra_qtd > 0 && (
                <div className="pt-2 border-t border-sap-hairline text-xs text-rose-700 font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" />
                  Necessidade de Reposição: +{selectedProduct.sugestao_compra_qtd} un (
                  {formatCurrency(selectedProduct.sugestao_compra_custo)})
                </div>
              )}
            </div>

            <div className="p-4 rounded-sap bg-sap-chrome border border-sap-hairline space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-sap-ink-meta">
                Análise Financeira
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-sap-ink-meta">Custo Unitário:</span>
                  <div className="text-base font-bold text-sap-ink tabular-nums">
                    {formatCurrency(selectedProduct.custo)}
                  </div>
                </div>
                <div>
                  <span className="text-sap-ink-meta">Preço de Venda:</span>
                  <div className="text-base font-bold text-sap-ink tabular-nums">
                    {formatCurrency(selectedProduct.valor_venda)}
                  </div>
                </div>
                <div>
                  <span className="text-sap-ink-meta">Lucro Unitário:</span>
                  <div className="text-base font-bold text-emerald-700 tabular-nums">
                    {formatCurrency(selectedProduct.lucro_unitario)}
                  </div>
                </div>
                <div>
                  <span className="text-sap-ink-meta">Margem / Markup:</span>
                  <div className="text-base font-bold text-emerald-700 tabular-nums">
                    {formatPercent(selectedProduct.margem_percentual)} /{' '}
                    {formatPercent(selectedProduct.markup_percentual)}
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-sap-hairline flex justify-between text-xs font-semibold">
                <span className="text-sap-ink-meta">Valor Total em Estoque:</span>
                <span className="text-sap-ink font-bold text-sm tabular-nums">
                  {formatCurrency(selectedProduct.valor_total_venda)}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-sap bg-sap-chrome border border-sap-hairline space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-sap-ink-meta">
                Rastreabilidade de Lote e ANVISA
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-sap-ink-meta">Lote:</span>
                  <div className="font-semibold text-sap-ink-body">{selectedProduct.lote}</div>
                </div>
                <div>
                  <span className="text-sap-ink-meta">Validade:</span>
                  <div className="font-semibold text-sap-ink-body">{selectedProduct.validade}</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedProduct(null)}
              className="w-full py-2.5 rounded-sap bg-sap-primary hover:bg-sap-primary-deep text-sap-on-primary font-medium text-xs transition-colors"
            >
              Fechar Ficha
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
