export interface ApiLimitation {
  topic: string
  reason: string
  currentBehavior: string
}

/**
 * What the SmartPOS API does not expose, compiled during the Fase 2 session
 * (see docs/FASE2_INDICADORES_COMERCIAIS_LOG.md) so it can be shown to the
 * client directly inside the product instead of only in an internal doc.
 */
export const API_LIMITATIONS: ApiLimitation[] = [
  {
    topic: 'Devoluções/estornos pós-venda',
    reason:
      'A API só expõe o campo "isCanceled" no momento da venda (cancelamento no ato, já excluído dos relatórios). Não existe um status de "devolvido" para uma venda já concluída.',
    currentBehavior: '"Faturamento Líquido" = bruto − descontos, sem contemplar devoluções posteriores.',
  },
  {
    topic: 'Desconto por item',
    reason: 'O campo "discountAmount" só existe no cabeçalho do pedido (nível da venda), não em cada item vendido.',
    currentBehavior: 'Não é possível saber qual produto específico recebeu desconto dentro de uma venda com múltiplos itens.',
  },
  {
    topic: 'Forma de pagamento',
    reason: 'Não existe campo de forma de pagamento (dinheiro, cartão, PIX) nos tipos de venda retornados pela API.',
    currentBehavior: 'Nenhuma quebra de faturamento por meio de pagamento está disponível no dashboard.',
  },
  {
    topic: 'Meta comercial / meta de vendas',
    reason: 'Meta de vendas não é um conceito existente na API da SmartPOS.',
    currentBehavior: 'Cadastro de metas é uma funcionalidade própria deste dashboard (página "Indicadores Comerciais"), não vem do PDV.',
  },
  {
    topic: 'Entrada de mercadoria / compras',
    reason: 'A API não expõe nenhum endpoint de recebimento de estoque (compras de fornecedores).',
    currentBehavior: 'Reposição de estoque só é refletida corretamente após uma recontagem física manual.',
  },
  {
    topic: 'Contas a Receber',
    reason: 'Não existe endpoint de títulos/recebíveis na SmartPOS.',
    currentBehavior: 'O valor de "Contas a Receber" é um parâmetro manual digitado no dashboard, não um dado ao vivo da API.',
  },
  {
    topic: 'Sincronização de ajuste de estoque de volta para o SmartPOS',
    reason: 'A rota "PUT /products/stock/{id}" existe na documentação da SmartPOS, mas foi uma decisão deste projeto não utilizá-la.',
    currentBehavior: 'Correções de estoque feitas no dashboard são de via única: não refletem de volta no SmartPOS/ERP.',
  },
  {
    topic: 'Margem recalculada retroativamente',
    reason: '"costValue" (no cadastro do produto) é o custo atual; "costPrice" (no item vendido) é o custo histórico registrado no momento da venda — os dois podem divergir com o tempo.',
    currentBehavior: 'A margem de vendas antigas não muda se o custo do produto for atualizado hoje. Isso é intencional, não um dado desatualizado.',
  },
]

export interface ManualUpdateItem {
  title: string
  description: string
  where: string
}

/** Values the dashboard cannot pull automatically — the user must keep them current. */
export const MANUAL_UPDATE_ITEMS: ManualUpdateItem[] = [
  {
    title: 'Contas a Receber',
    description:
      'Não existe endpoint de recebíveis na SmartPOS, então este valor não é atualizado sozinho. Ajuste sempre que o saldo de títulos a receber mudar.',
    where: 'Aba "BI Executivo" → cartão "Contas a Receber" → campo "Ajustar (R$)".',
  },
  {
    title: 'Metas Comerciais Mensais',
    description:
      'Metas de faturamento não existem na SmartPOS. Cadastre o valor de cada mês para habilitar a comparação "Meta x Realizado".',
    where: 'Página "Indicadores Comerciais" (/comercial) → seção "Metas Comerciais Mensais" (exige o token de edição configurado em SALES_GOALS_EDIT_TOKEN).',
  },
  {
    title: 'Multiplicador de Excesso de Estoque',
    description:
      'Define a partir de quantas vezes o estoque mínimo um produto passa a ser considerado "em excesso". O padrão é 3x, mas pode ser simulado em 2x ou 4x.',
    where: 'Aba "BI Executivo" → seletor "Limiar de excesso" (2x min. / 3x min. / 4x min.).',
  },
  {
    title: 'Correção Manual de Estoque',
    description:
      'Quando a contagem física diverge do saldo calculado, o ajuste feito aqui vale só para o dashboard — não é enviado de volta para o SmartPOS.',
    where: 'Aba "Catálogo & Estoque" → abrir o produto → ajuste de saldo (exige o token configurado em INVENTORY_ADJUST_TOKEN).',
  },
  {
    title: 'Estoque Mínimo por Produto',
    description:
      'Este valor vem do campo "minimumStock" cadastrado no próprio SmartPOS/ERP — não é editado aqui. Para corrigir o mínimo de um produto, atualize-o direto no SmartPOS; a próxima sincronização traz o valor novo automaticamente.',
    where: 'Cadastro de produto no SmartPOS (ERP) — refletido aqui apenas por sincronização.',
  },
]
