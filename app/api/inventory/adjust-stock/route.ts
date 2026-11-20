import { NextRequest, NextResponse } from 'next/server'
import { InventoryService } from '@/lib/api/inventoryService'
import { applyStockAdjustment } from '@/lib/domain/recomputeInventory'
import { commitFileToRepo, triggerVercelRedeploy } from '@/lib/integrations/githubContent'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
}

export async function POST(req: NextRequest) {
  const adjustToken = process.env.INVENTORY_ADJUST_TOKEN
  if (!adjustToken) {
    return NextResponse.json(
      { success: false, message: 'INVENTORY_ADJUST_TOKEN não configurado no servidor.' },
      { status: 500, headers: NO_STORE_HEADERS }
    )
  }

  const providedToken = req.headers.get('x-inventory-adjust-token')
  if (providedToken !== adjustToken) {
    return NextResponse.json(
      { success: false, message: 'Token de ajuste inválido ou ausente.' },
      { status: 401, headers: NO_STORE_HEADERS }
    )
  }

  let body: { codigo?: unknown; novoEstoque?: unknown; motivo?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { success: false, message: 'Corpo da requisição inválido (JSON esperado).' },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  const codigo = typeof body.codigo === 'string' ? body.codigo.trim() : ''
  const novoEstoque = Number(body.novoEstoque)
  const motivo = typeof body.motivo === 'string' ? body.motivo.trim() : ''

  if (!codigo) {
    return NextResponse.json(
      { success: false, message: 'Informe o código do SKU a ajustar.' },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }
  if (!Number.isFinite(novoEstoque) || !Number.isInteger(novoEstoque)) {
    return NextResponse.json(
      { success: false, message: 'O novo saldo de estoque deve ser um número inteiro.' },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  const currentData = InventoryService.getRawData()
  const product = currentData.products.find((p) => p.codigo === codigo)
  if (!product) {
    return NextResponse.json(
      { success: false, message: `SKU "${codigo}" não encontrado no catálogo.` },
      { status: 404, headers: NO_STORE_HEADERS }
    )
  }

  const updatedDataset = applyStockAdjustment(currentData, codigo, novoEstoque)

  // Reflete a correção imediatamente nesta instância, sem esperar o commit/redeploy.
  InventoryService.updateData(updatedDataset)

  let persisted = false
  let persistError: string | null = null
  try {
    const commitMessage = `fix(inventory): adjust stock for ${codigo} to ${novoEstoque} units via dashboard${
      motivo ? ` (${motivo})` : ''
    }`
    await commitFileToRepo({
      path: 'lib/data/inventoryData.json',
      content: JSON.stringify(updatedDataset, null, 2),
      message: commitMessage,
    })
    await triggerVercelRedeploy()
    persisted = true
  } catch (err: unknown) {
    persistError = err instanceof Error ? err.message : 'Erro desconhecido ao persistir o ajuste.'
  }

  return NextResponse.json(
    {
      success: true,
      persisted,
      persistError,
      message: persisted
        ? `Estoque de "${codigo}" ajustado para ${novoEstoque} unidades. A publicação definitiva leva ~1-2 minutos.`
        : `Estoque de "${codigo}" ajustado para ${novoEstoque} unidades nesta sessão, mas a persistência durável falhou: ${persistError}`,
      product: updatedDataset.products.find((p) => p.codigo === codigo),
      summary: updatedDataset.summary,
    },
    { headers: NO_STORE_HEADERS }
  )
}
