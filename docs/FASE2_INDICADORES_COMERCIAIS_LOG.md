# Fase 2 — Indicadores Comerciais: log de 21/11/2026

## Status

**Não deployado em produção.** Trabalho inteiro na branch `feature/fase-2-indicadores`
(20 commits à frente de `main`, nenhum push feito para o remoto `origin`). A branch
`main` e o preview em produção continuam exatamente como estavam antes de hoje.

Próximo passo combinado: revisar todos os cenários amanhã antes de decidir merge/deploy.

## O que foi implementado hoje

1. **Nova aba "Indicadores Comerciais"** no dashboard: KPIs de faturamento (bruto/líquido,
   pedidos, ticket médio, margem bruta, meta x realizado, crescimento vs. período anterior),
   Curva ABC de Vendas (separada da Curva ABC de estoque existente) e gráfico de faturamento
   mensal/anual com comparação ano a ano.
2. **Cadastro de metas comerciais mensais**, persistido em `lib/data/salesGoals.json` via
   GitHub Contents API (mesmo mecanismo do ajuste de estoque), protegido por um token novo
   (`SALES_GOALS_EDIT_TOKEN`).
3. **Cálculos isolados e testados** em `lib/metrics/` e `lib/domain/` (52 testes via
   `npm test`, runner `node:test` + `tsx`), cobrindo período sem vendas, divisão por zero,
   desconto maior que a venda, produto sem custo, virada de mês/ano.
4. **Limpeza visual**: removidas as bordas coloridas (`border-t-2`/`border-l-4`) dos cards
   em `KpiCard`, `QuickAlertsBar`, `ExpirationsView` e `RestockView` — ficou só a borda
   neutra `border-sap-hairline` já usada no projeto. Números e ícones de status continuam
   coloridos. Hover dos cards de alerta trocado de azul para neutro.

Commits em ordem no `git log main..feature/fase-2-indicadores`.

## Decisões tomadas hoje (para não re-perguntar amanhã)

- Uma única aba nova para A+B+C (KPIs, Curva ABC de vendas, faturamento mensal), não três
  abas separadas.
- Metas em arquivo JSON próprio + token dedicado (não reaproveitou `INVENTORY_ADJUST_TOKEN`).
- Sem credenciais SmartPOS: indicadores novos mostram zero + aviso explícito, nunca dado
  fabricado (diferente do snapshot de demonstração que já existia em `dashboardService.ts`).
- Testes com `node:test` nativo + `tsx` (sem adotar Jest/Vitest).
- `ExpirationsView.tsx` **não** foi migrado para o componente `<KpiCard>` compartilhado
  (seu card tem ícone/cor no cabeçalho, diferente do padrão simples do `KpiCard`) — só teve
  a borda colorida removida diretamente, para não arriscar regressão numa tela já em
  validação do cliente.
- Bug de gráficos em branco no `npm run dev`: confirmado que é causado pelo
  `reactStrictMode: true` do Next.js (duplo mount em dev atrapalha a medição do Recharts).
  Testado lado a lado com build de produção (`next build && next start`) — não acontece lá.
  Decisão: manter `reactStrictMode` ligado, não é um bug que chega ao cliente.

## Limitações conhecidas da API SmartPOS (para avisar o cliente)

| Dado que o cliente pode pedir | Por que não dá | Situação atual |
|---|---|---|
| Devoluções/estornos pós-venda | API só expõe `isCanceled` no momento da venda (já excluído); não há status de "devolvido" depois da venda concluída | "Faturamento líquido" = bruto − descontos, sem devoluções |
| Desconto por item | `discountAmount` só existe no cabeçalho do pedido, não por item | Não dá pra saber qual produto específico recebeu desconto |
| Forma de pagamento (dinheiro/cartão/PIX) | Campo não existe nos tipos de venda retornados pela API | Nenhuma quebra por meio de pagamento é possível hoje |
| Meta comercial / meta de vendas | Não é um conceito da API SmartPOS | Cadastro próprio criado no dashboard, não vem do PDV |
| Entrada de mercadoria / compras | API não expõe endpoint de recebimento de estoque | Reposição de estoque só entra via contagem física manual |
| Contas a receber | Sem endpoint de títulos/recebíveis na SmartPOS | Valor é parâmetro manual, não dado ao vivo |
| Sincronizar ajuste de estoque de volta pro SmartPOS | `PUT /products/stock/{id}` existe mas não é usado | Correções no dashboard não refletem no SmartPOS — via de mão única |
| Margem recalculada retroativamente | `costValue` (produto) é custo atual; `costPrice` (item vendido) é custo histórico da venda | Margem de vendas antigas não muda se o custo do produto for atualizado hoje — intencional |

## Como retomar amanhã

- `git log main..feature/fase-2-indicadores --oneline` lista os 20 commits de hoje.
- `npm test` roda os 52 testes unitários.
- `npm run dev` sobe local; `npm run build && npm run start` reproduz o comportamento de produção.
- Nenhuma variável de ambiente de produção foi alterada — `SALES_GOALS_EDIT_TOKEN` só existe
  em `.env.example` como documentação, precisa ser configurada antes de usar a tela de metas
  em qualquer ambiente real.
