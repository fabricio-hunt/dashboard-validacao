# MedStock Analytics - Dashboard Analítico de Estoque Hospitalar

> **Protótipo Executivo de Demonstração & Arquitetura API-Ready**  
> Desenvolvido para apresentação comercial e homologação de cliente, com deploy instantâneo na **Vercel**.

---

## 🏥 Sobre o Projeto

Este dashboard analítico transforma uma planilha bruta de suprimentos hospitalares (`251 produtos`, `61.993 unidades físicas` e `R$ 294.265,73` em patrimônio estocado) em uma solução web de nível enterprise para tomadores de decisão em saúde, distribuidores e redes hospitalares.

### Destaque Estratégico para Venda do Projeto:
O dashboard foi construído com a **arquitetura de Provedor Desacoplado**:
1. **Fase 1 (Atual - Teste/Homologação)**: Lê os dados tratados da planilha (`lib/data/inventoryData.json`), rodando 100% autônomo, ultrarrápido e sem custos de banco de dados na Vercel.
2. **Fase 2 (Pós-Aprovação - API do Cliente)**: Já possui a camada de serviço (`lib/api/clientAdapter.ts`) e o simulador interativo na tela. Para integrar a API oficial do cliente, basta definir duas variáveis de ambiente (`CLIENT_API_BASE_URL` e `CLIENT_API_KEY`) sem alterar uma única linha de design ou componentes.

---

## 📊 Principais Métricas & Insights Encontrados na Planilha

| Métrica | Valor Encontrado | Impacto para Apresentação |
|---|---|---|
| **Patrimônio Total em Estoque (Venda)** | **R$ 294.265,73** | Valor bruto total de comercialização dos lotes |
| **Capital Imobilizado (Custo)** | **R$ 160.646,99** | Capital de giro alocado no almoxarifado |
| **Lucro Bruto Projetado** | **R$ 133.618,74** | Margem média de **45,61%** (Markup de 87,56%) |
| **Volume Físico Total** | **61.993 unidades** | Distribuído em 23 categorias médicas |
| **Ruptura de Estoque (Estoque Zero)** | **47 SKUs** | Oportunidade perdida imediata de faturamento |
| **Estoque Crítico (< Mínimo)** | **21 SKUs** | Déficit de **5.890 unidades** necessitando compra urgente |
| **Auditoria de Estoque Negativo** | **4 SKUs** | Detecta faturamento sem entrada de NF (ex: *Scalp 23G: -35 un*) |
| **Rastreabilidade Sanitária ANVISA** | **182 Validades / 185 Lotes** | Identifica 14 lotes críticos com risco sanitário de descarte |

---

## 🚀 Como Rodar Localmente

### 1. Pré-requisitos
- Node.js 18+ (recomendado Node 20 ou 22)
- npm ou yarn

### 2. Instalação e Execução
```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## ☁️ Como Fazer o Deploy na Vercel

O projeto foi validado com `npm run build` e é **100% compatível com a Vercel** (Next.js App Router).

### Opção 1: Via Vercel CLI (Mais Rápido)
```bash
# Instale a CLI da Vercel (se não tiver)
npm i -g vercel

# Faça o deploy
vercel
```

### Opção 2: Via GitHub / GitLab / Bitbucket
1. Suba o repositório para o seu GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: dashboard hospitalar medstock analytics"
   git remote add origin https://github.com/SEU_USUARIO/dashboard-hospitalar.git
   git push -u origin main
   ```
2. Acesse [vercel.com/new](https://vercel.com/new) e importe o repositório.
3. O Next.js será detectado automaticamente. Clique em **Deploy**.
4. Em menos de 2 minutos você terá a URL oficial (ex: `https://medstock-analytics.vercel.app`) para enviar no WhatsApp do cliente!

---

## 🔌 Virada de Chave para a API Oficial do Cliente (Fase 2)

Na Vercel, nas configurações do projeto (**Settings > Environment Variables**), basta cadastrar:

```env
NEXT_PUBLIC_DATA_SOURCE="api"
CLIENT_API_BASE_URL="https://api.erp-cliente.com.br/v1"
CLIENT_API_KEY="token_fornecido_pelo_cliente"
```

A aba **"Integração com API do Cliente"** no dashboard inclui:
- Especificação de Swagger dos endpoints (`GET /produtos/estoque`, `GET /metricas`, `POST /pedidos-compra/sugestoes`).
- Teste interativo de conectividade e ping.
- Visualizador do payload JSON compatível.

---

## 🛠️ Tecnologias Utilizadas

- **Framework**: Next.js 14+ (App Router, Server & Client Components)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS (Dark/Light mode nativo, glassmorphism)
- **Gráficos**: Recharts (Curva ABC de Pareto, Top Categorias, Linha Temporal de Validades)
- **Ícones**: Lucide React
- **Tratamento de Dados**: Python (Pandas, OpenPyXL, Regex para Lotes e Validades)
