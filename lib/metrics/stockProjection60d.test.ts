import assert from 'node:assert/strict'
import test from 'node:test'
import { ProductItem } from '../../types/inventory'
import { buildStockProjection60d } from './stockProjection60d'

function product(overrides: Partial<ProductItem> = {}): ProductItem {
  return {
    id: '1',
    codigo: 'P1',
    produto: 'Produto Teste',
    nome_resumido: 'Produto Teste',
    fabricante: 'Fabricante Teste',
    lote: 'L1',
    validade_iso: null,
    validade: 'N/I',
    dias_para_vencer: null,
    status_validade: 'SEM_DATA',
    categoria: 'Categoria Teste',
    custo: 10,
    valor_venda: 20,
    lucro_unitario: 10,
    margem_percentual: 50,
    markup_percentual: 100,
    estoque: 100,
    estoque_minimo: 20,
    status_estoque: 'NORMAL',
    sugestao_compra_qtd: 0,
    sugestao_compra_custo: 0,
    valor_total_custo: 1000,
    valor_total_venda: 2000,
    lucro_potencial: 1000,
    curva_abc_acumulada_pct: 0,
    curva_abc: 'A',
    baseline_estoque: 100,
    baseline_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

test('a product with ample stock and no recent sales velocity is excluded', () => {
  const rows = buildStockProjection60d([product()], [])
  assert.deepEqual(rows, [])
})

test('a product below estoque_minimo with zero recent velocity is included as MEDIA with no days-to-stockout', () => {
  const rows = buildStockProjection60d([product({ codigo: 'P2', estoque: 10, estoque_minimo: 20 })], [])
  assert.equal(rows.length, 1)
  assert.equal(rows[0].daysToStockout, null)
  assert.equal(rows[0].deficitEstoqueMinimo, 10)
  assert.equal(rows[0].sugestaoCompraQtd, 10)
  assert.equal(rows[0].prioridade, 'MEDIA') // estoque > 0 and no velocity data, so not forced to URGENTE
})

test('a product at zero stock is always URGENTE regardless of velocity', () => {
  const rows = buildStockProjection60d([product({ codigo: 'P3', estoque: 0, estoque_minimo: 20 })], [])
  assert.equal(rows[0].prioridade, 'URGENTE')
  assert.equal(rows[0].daysToStockout, null)
})

test('a product projected to run out within 60 days at current velocity is included', () => {
  // 120 units sold in 60 days => velocity 2/day; estoque 100 => 50 days to stockout
  const rows = buildStockProjection60d(
    [product({ codigo: 'P4', estoque: 100, estoque_minimo: 20 })],
    [{ codigo: 'P4', quantity: 120 }]
  )
  assert.equal(rows.length, 1)
  assert.equal(rows[0].dailyVelocity, 2)
  assert.equal(rows[0].daysToStockout, 50)
  assert.equal(rows[0].prioridade, 'MEDIA') // 30 < 50 <= 60, so MEDIA rather than ALTA
})

test('a product projected to run out beyond 60 days and above the minimum is excluded', () => {
  // velocity 1/day, estoque 100 => 100 days to stockout, above minimo
  const rows = buildStockProjection60d(
    [product({ codigo: 'P5', estoque: 100, estoque_minimo: 20 })],
    [{ codigo: 'P5', quantity: 60 }]
  )
  assert.deepEqual(rows, [])
})

test('sugestaoCompraQtd covers projected 60-day demand minus current stock when that exceeds the static deficit', () => {
  // velocity 5/day => projectedDemand60 = 300; estoque 10 => demand-based need = 290, static deficit = 10
  const rows = buildStockProjection60d(
    [product({ codigo: 'P6', estoque: 10, estoque_minimo: 20 })],
    [{ codigo: 'P6', quantity: 300 }]
  )
  assert.equal(rows[0].sugestaoCompraQtd, 290)
  assert.equal(rows[0].prioridade, 'URGENTE') // daysToStockout = 10/5 = 2 days
})

test('sold quantities for an unrelated codigo do not affect a product', () => {
  const rows = buildStockProjection60d(
    [product({ codigo: 'P7', estoque: 5, estoque_minimo: 20 })],
    [{ codigo: 'OTHER', quantity: 999 }]
  )
  assert.equal(rows.length, 1)
  assert.equal(rows[0].unitsSoldLast60Days, 0)
  assert.equal(rows[0].dailyVelocity, 0)
})

test('rows are sorted by priority then by investimentoNecessario descending', () => {
  const rows = buildStockProjection60d(
    [
      product({ codigo: 'LOW', estoque: 15, estoque_minimo: 20, custo: 1 }), // MEDIA, small deficit
      product({ codigo: 'HIGH', estoque: 0, estoque_minimo: 20, custo: 50 }), // URGENTE
    ],
    []
  )
  assert.equal(rows[0].codigo, 'HIGH')
  assert.equal(rows[0].prioridade, 'URGENTE')
  assert.equal(rows[1].codigo, 'LOW')
})
