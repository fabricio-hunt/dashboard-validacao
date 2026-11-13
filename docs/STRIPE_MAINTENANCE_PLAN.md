# Planejamento: Pagamentos & Assinatura Recorrente via Stripe no MedStock BI

> **Status:** Planejamento salvo / Aguardando retorno do cliente para definição de valores, periodicidade e prazos.

---

## 1. Visão Geral do Objetivo
Implementar um sistema de faturamento e pagamentos integrado diretamente ao **MedStock BI** utilizando o **Stripe** (infraestrutura líder global para SaaS).
O objetivo é viabilizar cobranças para a **manutenção contínua do dashboard, hospedagem na Vercel, suporte técnico e sincronização automática 2x ao dia com a API do SmartPOS**, com:
1. **Assinatura Recorrente Mensal/Anual** (Modelo SaaS com débito automático em cartão ou lembretes via Pix/Boleto).
2. **Pagamento Pontual/Setup/Evolução** (Pix instantâneo e Cartão de Crédito).
3. **Portal do Cliente Stripe (Customer Portal)** para o cliente gerenciar assinaturas, alterar cartão e baixar comprovantes fiscais/recibos.

---

## 2. O que precisamos para implementar (Checklist Técnico)

### 2.1. Conta Stripe Brasil
1. Conta na [Stripe Brasil](https://stripe.com/br) ativa com CNPJ ou CPF e conta bancária vinculada para repasses em BRL.
2. Ativação dos métodos de pagamento para o Brasil:
   - **Cartão de Crédito** (Visa, Mastercard, Elo, Hipercard, Amex).
   - **PIX** (QR Code e Copia-e-Cola automáticos no Stripe Checkout).
   - **Boleto Bancário** (opcional).

### 2.2. Variáveis de Ambiente Necessárias (`.env.local` e Vercel)
- `STRIPE_SECRET_KEY`: Chave privada do backend (`sk_test_...` ou `sk_live_...`).
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Chave pública do frontend (`pk_test_...` ou `pk_live_...`).
- `STRIPE_WEBHOOK_SECRET`: Chave para validar autenticidade dos webhooks de pagamento (`whsec_...`).
- `STRIPE_PRICE_ID_MAINTENANCE`: ID do plano criado na Stripe (`price_...`).

*(Modelo já documentado e versionado no repositório em `.env.example`).*

### 2.3. Dependências de Software
- Instalação dos pacotes oficiais no Next.js:
  ```bash
  npm install stripe @stripe/stripe-js
  ```

---

## 3. Arquitetura da Solução no Dashboard (Next.js App Router)

```
[ Cliente no Dashboard ]
         │
         ▼
[ Aba / Botão "Plano & Manutenção" ]
         │
         ├─► Clica em "Assinar Manutenção" / "Pagar Mensalidade"
         │
         ▼
[ API Route: /api/stripe/checkout ]
         │ (Cria sessão segura no Stripe Checkout)
         ▼
[ Checkout Seguro Oficial da Stripe ]
         │ (Cartão de Crédito ou PIX)
         ├─► Pagamento Aprovado
         │
         ▼
[ Webhook da Stripe: /api/stripe/webhook ]
         │ (Recebe confirmação em tempo real)
         ▼
[ Atualiza Status de Manutenção / Notifica no Painel ]
```

### Por que utilizar o Stripe Checkout?
- **PCI Compliance Total:** O dashboard nunca armazena dados confidenciais de cartão; toda a transação ocorre em ambiente criptografado da Stripe.
- **Suporte Nativo a PIX:** A Stripe gera o QR Code e valida a compensação instantaneamente.
- **Portal de Autoatendimento:** O cliente pode atualizar dados de cobrança e emitir recibos sem sobrecarregar você.

---

## 4. Estrutura de Arquivos a Ser Criada

```
lib/
└── stripe/
    ├── stripeServer.ts          # Inicialização segura do SDK Stripe no Node.js
    └── subscriptionPlan.ts      # Configuração dos planos e benefícios
app/
└── api/
    └── stripe/
        ├── checkout/route.ts    # Inicia a sessão de pagamento
        ├── portal/route.ts      # Redireciona para o Portal do Cliente
        └── webhook/route.ts     # Recebe confirmação de pagamento
components/
└── dashboard/
    ├── SubscriptionModal.tsx    # Modal com os planos e botão de checkout
    └── MaintenanceBadge.tsx     # Indicador visual no Header (Manutenção Ativa)
```

---

## 5. Próximos Passos (Aguardando Definição do Cliente)

- [ ] **Definição de Valores:** Alinhar com o cliente o valor da mensalidade de manutenção (ex.: R$ 199, R$ 290 ou R$ 450).
- [ ] **Periodicidade:** Mensal, trimestral ou anual com desconto.
- [ ] **Data de Vencimento:** Dia fixo no mês para a cobrança automática.
- [ ] **Criação do Produto na Stripe:** Configurar o plano com o valor acordado e obter o `PRICE_ID`.
- [ ] **Implementação no Código:** Criar as rotas e a interface assim que os valores forem aprovados.
