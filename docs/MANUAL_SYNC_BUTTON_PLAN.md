# Planejamento: Botão "Sincronizar Agora" para o Cliente no Dashboard

> **Status:** Plano de Viabilidade e Arquitetura Concluído.
> **Viabilidade Técnica:** 100% Possível e Recomendado.

---

## 1. Resumo da Proposta
Implementar um botão no dashboard do **MedStock BI** que permite ao próprio cliente disparar a sincronização dos dados da SmartPOS sob demanda, a qualquer momento do dia, sem depender exclusivamente dos agendamentos automáticos das 06:00 e 14:00.

---

## 2. Como Funciona a Solução (Arquitetura Next.js)

```
[ Cliente no Dashboard ]
         │
         ▼
[ Botão "Sincronizar Agora" no Header / Barra de Status ]
         │
         ▼
[ API Route Serverless: /api/sync/refresh ]
         │
         ├─► Valida Rate Limit / Cooldown (evita cliques repetidos por 3 minutos)
         ├─► Consulta SmartPosClient.fetchAllProducts() em tempo real
         ├─► Recalcula lotes, validades no padrão pt-BR, estoques e margens
         │
         ▼
[ Resposta JSON Instantânea (3 a 5 segundos) ]
         │
         ▼
[ Dashboard atualiza os dados na tela do cliente sem precisar de F5 ]
         │
         ▼
[ Tag visual de "Atualizado hoje às HH:MM" é atualizada para o minuto exato ]
```

---

## 3. Benefícios para o Cliente e para a Operação
1. **Autonomia Total:** Se o cliente cadastrar um novo lote de produto ou alterar um preço no SmartPOS às 10h da manhã, ele não precisa esperar até as 14h; basta clicar e ver a alteração em 5 segundos.
2. **Segurança de Credenciais:** As chaves de API continuam protegidas nas variáveis de ambiente da Vercel; nenhuma chave trafega no navegador do cliente.
3. **Proteção contra Sobrecarga:** Implementação de um temporizador de segurança (*cooldown de 3 minutos*) para proteger a cota da API da SmartPOS contra cliques sucessivos involuntários.

---

## 4. Componentes e Arquivos Mapeados
- **Novo Endpoint:** `app/api/sync/refresh/route.ts`
- **Componente Atualizado:** `components/dashboard/SyncStatusBar.tsx` (Botão interativo com spinner de loading)
- **Componente Atualizado:** `components/layout/Header.tsx` (Badge com botão de refresh rápido)
- **Estado Global:** `components/dashboard/DashboardShell.tsx` (Função `handleManualSync` conectada ao endpoint)

O planejamento técnico completo está registrado no projeto em `docs/` e no artefato:
- [manual_sync_button_plan.md](file:///C:/Users/PC/.gemini/antigravity/brain/dd61e183-a8f8-4f10-842c-950f4c920237/manual_sync_button_plan.md)
