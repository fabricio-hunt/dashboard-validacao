export interface DocSection {
  id: string
  title: string
  shortSummary: string
  purpose: string
  indicators: Array<{
    name: string
    description: string
    unit: string
  }>
  calculationMemory: Array<{
    title: string
    formula: string
    rules: string[]
    example?: string
  }>
  guidelines: string[]
}

export const CONTEXTUAL_DOCS: Record<string, DocSection> = {
  quick_alerts: {
    id: 'quick_alerts',
    title: 'Faixa de Alertas Críticos de Estoque e Validade',
    shortSummary: 'Painel superior de monitoramento de risco imediato para rupturas, déficit de compras, excesso de capital e lotes em risco ANVISA.',
    purpose: 'Chamar a atenção imediata da gestão para os 4 maiores riscos da operação: falta de mercadoria na prateleira (ruptura), necessidade urgente de recompra, dinheiro estagnado acima do estoque alvo e produtos próximos do vencimento sanitário.',
    indicators: [
      {
        name: 'Sem Estoque (Ruptura)',
        description: 'Produtos cadastrados ativos com saldo físico menor ou igual a zero.',
        unit: 'SKUs',
      },
      {
        name: 'Abaixo do Mínimo',
        description: 'Produtos cujo estoque atual está estritamente abaixo do estoque mínimo estabelecido.',
        unit: 'SKUs',
      },
      {
        name: 'Estoque em Excesso',
        description: 'Produtos cujo saldo ultrapassa o teto de cobertura (Estoque Mínimo × Multiplicador de Excesso configurado).',
        unit: 'SKUs',
      },
      {
        name: 'Risco Validade (< 180 dias)',
        description: 'Produtos com lotes já vencidos ou com validade prevista para os próximos 180 dias.',
        unit: 'SKUs',
      },
    ],
    calculationMemory: [
      {
        title: 'Critério de Ruptura',
        formula: 'Estoque Físico <= 0',
        rules: ['Classificado como ZERADO se estoque == 0', 'Classificado como NEGATIVO se estoque < 0'],
      },
      {
        title: 'Critério de Reposição',
        formula: 'Estoque Físico < Estoque Mínimo (quando o mínimo for informado)',
        rules: ['Produtos sem estoque mínimo cadastrado não entram neste cálculo'],
      },
      {
        title: 'Critério de Excesso',
        formula: 'Estoque Físico > (Estoque Mínimo × Multiplicador)',
        rules: [
          'O multiplicador padrão é 3x o estoque mínimo (ajustável na aba Executiva de 1.5x a 5.0x).',
          'Excedente em unidades = Estoque - (Estoque Mínimo × Multiplicador)',
        ],
      },
      {
        title: 'Critério de Risco Sanitário',
        formula: 'Dias para Vencer <= 180 dias ou Dias < 0 (Vencido)',
        rules: [
          'Calculado com base na data calendário UTC sem distorção por fuso horário.',
          'Validades apenas com mês/ano (ex: 04/2027) são avaliadas pelo último dia do respectivo mês.',
        ],
      },
    ],
    guidelines: [
      'Clicar em qualquer cartão direciona automaticamente para a aba correspondente com o filtro aplicado.',
      'Itens sem estoque mínimo definido não são contabilizados como Críticos ou em Excesso, pois necessitam de parametrização cadastral.',
    ],
  },

  curva_abc_estoque: {
    id: 'curva_abc_estoque',
    title: 'Curva ABC de Capital Imobilizado (Estoque)',
    shortSummary: 'Classificação de relevância financeira baseada no valor total que a empresa tem parado em mercadorias.',
    purpose: 'Permitir que a diretoria e os gestores de compras priorizem sua atenção e auditoria nos itens que concentram a maior parte do patrimônio financeiro da empresa, prevenindo perdas financeiras massivas e desvios.',
    indicators: [
      {
        name: 'Classe A',
        description: 'Itens de altíssima relevância financeira que representam os primeiros 80% do valor total do estoque da empresa.',
        unit: 'Primeiros 80% do Valor Total',
      },
      {
        name: 'Classe B',
        description: 'Itens de média relevância financeira que representam os 15% subsequentes do valor total em estoque.',
        unit: 'Do 80% ao 95% acumulado',
      },
      {
        name: 'Classe C',
        description: 'Cauda longa do estoque que representa os últimos 5% do valor financeiro imobilizado.',
        unit: 'Do 95% ao 100% acumulado',
      },
    ],
    calculationMemory: [
      {
        title: 'Valor Total por Produto',
        formula: 'Valor Total = Saldo Físico × Preço de Venda Unitário',
        rules: [
          'Calculado multiplicando o saldo em estoque pelo preço de venda cadastrado no SmartPOS.',
          'Se o saldo for zero ou negativo, o valor considerado na curva é R$ 0,00.',
        ],
        example: '1.088 aventais × R$ 17,82 = R$ 19.388,16 imobilizados.',
      },
      {
        title: 'Ordenação e Acúmulo Percentual',
        formula: '% Acumulado = (Soma Acumulada do Valor de Venda / Valor Total Geral de Venda) × 100',
        rules: [
          'Todos os produtos do catálogo são ordenados de forma decrescente pelo seu Valor Total de Venda.',
          'Classe A: produtos cuja soma acumulada vai de 0% até 80.0%.',
          'Classe B: produtos cuja soma acumulada vai de 80.01% até 95.0%.',
          'Classe C: produtos cuja soma acumulada vai de 95.01% até 100%.',
        ],
      },
    ],
    guidelines: [
      'Atenção Crítica: Um produto ser Classe A NÃO significa que ele é o que mais vende na ponta!',
      'Significa que ele é o produto onde o DINHEIRO DA EMPRESA está concentrado. Se um item Classe A tiver poucas vendas recentes, ele é um caso urgente de super-excesso ou estoque estagnado.',
      'Para analisar a Curva ABC por volume vendido na ponta, utilize a aba "Vendas & Rankings Top 11".',
    ],
  },

  executive_overview: {
    id: 'executive_overview',
    title: 'Visão Geral Executiva (BI Executivo)',
    shortSummary: 'Consolidação de patrimônio em mercadorias, margem bruta média, potencial de lucro e capital de giro.',
    purpose: 'Apresentar aos sócios e gestores a saúde financeira consolidada do estoque da operação, destacando capital total imobilizado, expectativa de faturamento e lucro bruto projetado.',
    indicators: [
      {
        name: 'Valor Total em Custo',
        description: 'Soma do valor de compra de todas as mercadorias físicas em estoque.',
        unit: 'R$ (Reais)',
      },
      {
        name: 'Valor Total em Venda',
        description: 'Projeção do faturamento bruto caso 100% do estoque atual seja vendido ao preço de tabela.',
        unit: 'R$ (Reais)',
      },
      {
        name: 'Lucro Potencial Total',
        description: 'Expectativa de lucro bruto total do estoque (Valor Venda Total - Valor Custo Total).',
        unit: 'R$ (Reais)',
      },
      {
        name: 'Margem Bruta Média',
        description: 'Percentual médio de lucro sobre o faturamento do catálogo.',
        unit: '%',
      },
      {
        name: 'Markup Médio',
        description: 'Percentual médio de acréscimo sobre o custo de aquisição das mercadorias.',
        unit: '%',
      },
    ],
    calculationMemory: [
      {
        title: 'Margem Percentual Unitária',
        formula: 'Margem (%) = ((Preço Venda - Custo) / Preço Venda) × 100',
        rules: ['Calculada para cada produto com preço de venda maior que zero.'],
      },
      {
        title: 'Markup Percentual Unitário',
        formula: 'Markup (%) = ((Preço Venda - Custo) / Custo) × 100',
        rules: ['Calculado para cada produto com custo de aquisição maior que zero.'],
      },
      {
        title: 'Margem Média do Catálogo',
        formula: 'Média aritmética simples da margem percentual de todos os SKUs cadastrados.',
        rules: ['Reflete a política média de precificação da empresa.'],
      },
    ],
    guidelines: [
      'Os valores consideram o saldo físico atual de cada produto multiplicado pelo seu preço unitário correspondente.',
      'O simulador de multiplicador de excesso permite testar diferentes políticas de compra (ex: considerar excesso acima de 2x ou 4x o mínimo).',
    ],
  },

  sales_rankings: {
    id: 'sales_rankings',
    title: 'Vendas & Rankings Top 11 (SmartPOS Ao Vivo)',
    shortSummary: 'Classificação das famílias de produtos farmacêuticos e hospitalares por faturamento e margem realizada na ponta.',
    purpose: 'Identificar quais categorias e famílias de produtos realmente sustentam a receita e o lucro operacional da empresa, confrontando vendas realizadas com a concentração do estoque.',
    indicators: [
      {
        name: 'Participação nas Vendas (%)',
        description: 'Percentual do faturamento total que a família de produto representou no período selecionado.',
        unit: '%',
      },
      {
        name: 'Margem Realizada (%)',
        description: 'Lucro bruto obtido sobre as vendas efetivas daquela família de produtos.',
        unit: '%',
      },
      {
        name: 'Concentração Top 11',
        description: 'Percentual somado das 11 maiores famílias sobre a receita total da empresa.',
        unit: '%',
      },
    ],
    calculationMemory: [
      {
        title: 'Vendas Realizadas por Família',
        formula: 'Soma de (Quantidade Vendida × Preço Praticado) de todas as vendas no período',
        rules: [
          'Consulta diretamente os endpoints /v1/sales e /v1/sales/{id}/items da SmartPOS.',
          'Exclui automaticamente vendas canceladas ou orçamentos não efetivados.',
          'Classifica cada item em famílias farmacêuticas através do motor inteligente de famílias (ex: Agulhas, Fios, Luvas, Seringas, Sondas, etc.).',
        ],
      },
      {
        title: 'Lucro Bruto Realizado',
        formula: 'Lucro = Venda Líquida Realizada - Custo da Mercadoria Vendida (CMV)',
        rules: ['Baseia-se no custo histórico registrado no momento da emissão da venda pelo PDV.'],
      },
    ],
    guidelines: [
      'Você pode alterar o período de análise (data inicial e final) para visualizar o desempenho de um mês ou intervalo específico.',
      'Permite comparar se o que a empresa tem muito em estoque bate com o que realmente mais vende.',
    ],
  },

  commercial_metrics: {
    id: 'commercial_metrics',
    title: 'Indicadores Comerciais (Faturamento, Margem, Meta e Curva ABC de Vendas)',
    shortSummary: 'KPIs comerciais do período, Curva ABC por faturamento realizado e evolução mensal/anual de vendas.',
    purpose: 'Dar visibilidade executiva sobre o desempenho comercial realizado — faturamento, ticket médio, margem e meta —, além de identificar quais produtos concentram o faturamento e como a receita evolui mês a mês e ano a ano.',
    indicators: [
      {
        name: 'Faturamento Líquido',
        description: 'Faturamento bruto do período menos os descontos concedidos.',
        unit: 'R$',
      },
      {
        name: 'Margem Bruta (%)',
        description: 'Lucro bruto (já líquido do custo histórico da mercadoria vendida) sobre o faturamento líquido do período.',
        unit: '%',
      },
      {
        name: 'Meta x Realizado',
        description: 'Faturamento líquido realizado comparado à meta mensal cadastrada para os meses tocados pelo período.',
        unit: '%',
      },
      {
        name: 'Curva ABC de Vendas',
        description: 'Classificação dos produtos pelo faturamento líquido realizado no período (distinta da Curva ABC de estoque do BI Executivo).',
        unit: 'Classe A/B/C',
      },
    ],
    calculationMemory: [
      {
        title: 'Faturamento Líquido',
        formula: 'Faturamento Líquido = Faturamento Bruto − Descontos',
        rules: [
          'A API SmartPOS não disponibiliza devoluções/estornos pós-venda — apenas o cancelamento no ato da venda, que já é excluído na origem.',
          'Vendas canceladas e orçamentos não efetivados nunca entram nesta conta.',
        ],
      },
      {
        title: 'Margem Bruta Realizada',
        formula: 'Margem Bruta (%) = Lucro Bruto ÷ Faturamento Líquido × 100',
        rules: ['Lucro Bruto já vem calculado pela SmartPOS com base no custo histórico registrado no momento da venda.'],
      },
      {
        title: 'Meta Comercial',
        formula: 'Meta do Período = soma das metas mensais cadastradas para cada mês tocado pelo período selecionado',
        rules: [
          'Não há rateio por dia: um período parcial dentro de um mês ainda considera a meta mensal cheia daquele mês.',
          'Meses sem meta cadastrada são sinalizados e não entram na soma.',
        ],
      },
      {
        title: 'Curva ABC de Vendas',
        formula: 'Classe A até 80% do faturamento acumulado, B até 95%, C no restante',
        rules: ['Cortes configuráveis em lib/metrics/abcSales.ts (ABC_SALES_CUTOFFS).'],
      },
    ],
    guidelines: [
      'Sem credenciais SmartPOS configuradas, os indicadores desta aba aparecem zerados com um aviso explícito — nunca com números fictícios.',
      'Cadastre as metas mensais na própria aba para habilitar a comparação de Meta x Realizado.',
    ],
  },

  restock_plan: {
    id: 'restock_plan',
    title: 'Plano de Ação (Sugestão de Reposição e Gestão de Excesso)',
    shortSummary: 'Algoritmo de recomendação de compras para recompor itens críticos e liberar capital travado em excessos.',
    purpose: 'Orientar o setor de compras com exatidão sobre quanto comprar de cada produto para cobrir a ruptura sem imobilizar capital excessivo.',
    indicators: [
      {
        name: 'Déficit de Estoque',
        description: 'Quantidade de unidades em falta para atingir o estoque mínimo cadastrado.',
        unit: 'Unidades',
      },
      {
        name: 'Investimento Necessário',
        description: 'Valor financeiro total a ser gasto na compra do lote de reposição ao custo atual.',
        unit: 'R$',
      },
      {
        name: 'Capital Excedente',
        description: 'Valor financeiro imobilizado acima do teto de cobertura máxima tolerada.',
        unit: 'R$',
      },
      {
        name: 'Prioridade de Compra',
        description: 'Classificação de urgência: URGENTE (zerado), ALTA (abaixo de 50% do mínimo) e MEDIA (acima de 50%).',
        unit: 'Grau de Prioridade',
      },
    ],
    calculationMemory: [
      {
        title: 'Sugestão de Compra (Qtd)',
        formula: 'Sugestão = max(0, Estoque Mínimo - Estoque Físico Atual)',
        rules: ['Aplicado apenas quando o saldo físico estiver estritamente abaixo do mínimo.'],
        example: 'Mínimo de 100 un e estoque atual de 20 un -> Sugestão = 80 un.',
      },
      {
        title: 'Investimento de Reposição (R$)',
        formula: 'Investimento = Sugestão de Compra (Qtd) × Custo Unitário',
        rules: ['Multiplica as unidades necessárias pelo custo de aquisição atual do produto.'],
      },
      {
        title: 'Capital Excedente em Risco',
        formula: 'Capital Excedente = (Estoque Atual - (Estoque Mínimo × Multiplicador)) × Custo Unitário',
        rules: ['Calculado sobre as unidades que excedem a cobertura de segurança.'],
      },
    ],
    guidelines: [
      'Exportar o plano em CSV permite enviar a ordem de compra formatada diretamente para fornecedores ou distribuidores.',
      'Itens com status URGENTE devem ser priorizados em compras imediatas para estancar perda de vendas no balcão.',
    ],
  },

  expirations_anvisa: {
    id: 'expirations_anvisa',
    title: 'Auditoria de Lotes e Validades ANVISA',
    shortSummary: 'Rastreabilidade sanitária por lote, dias para vencimento e cálculo de valor em risco sanitário.',
    purpose: 'Evitar perdas financeiras por descarte de medicamentos e materiais esterilizados vencidos, e garantir conformidade com as exigências sanitárias da ANVISA.',
    indicators: [
      {
        name: 'Vencido',
        description: 'Produtos cuja validade expirou antes da data de hoje.',
        unit: 'Dias < 0',
      },
      {
        name: 'Crítico (< 90 dias)',
        description: 'Lotes que vencerão em até 90 dias calendário a partir de hoje.',
        unit: '0 a 90 dias',
      },
      {
        name: 'Atenção (< 180 dias)',
        description: 'Lotes com vencimento entre 91 e 180 dias.',
        unit: '91 a 180 dias',
      },
      {
        name: 'Valor em Risco',
        description: 'Impacto financeiro a preço de custo caso as unidades não sejam consumidas/vendidas a tempo.',
        unit: 'R$',
      },
    ],
    calculationMemory: [
      {
        title: 'Cálculo de Dias para Vencer',
        formula: 'Dias = (Data de Validade em UTC - Data de Hoje em UTC)',
        rules: [
          'Utiliza aritmética pura de calendário UTC para impedir que fusos horários locais variem a data em +/- 1 dia.',
          'Aceita separadores por ponto (.) e barra (/), anos em 2 dígitos (YY -> 20YY) e 4 dígitos.',
          'Validades apenas com mês/ano (MM/AAAA) são avaliadas pelo último dia do mês (ex: 04/2027 vence em 30/04/2027).',
        ],
      },
      {
        title: 'Valor em Risco Sanitário',
        formula: 'Valor em Risco = Saldo em Estoque × Custo Unitário',
        rules: [
          'Se o saldo físico for 0 unidades, o valor em risco é R$ 0,00 (não há perda financeira física).',
        ],
      },
    ],
    guidelines: [
      'Lotes com menos de 90 dias devem ser colocados em campanhas promocionais de saída rápida ou devolvidos ao distribuidor se houver acordo comercial.',
      'Itens sem lote ou validade identificados na descrição do produto são listados como "N/I" (Não Informado).',
    ],
  },

  datagrid_catalog: {
    id: 'datagrid_catalog',
    title: 'Catálogo Mestre e Posição Geral de Estoque',
    shortSummary: 'Tabela operacional analítica completa com busca, ordenação multicritério, drawer de SKU e exportação.',
    purpose: 'Servir como ponto central de consulta rápida de qualquer item cadastrado no sistema, permitindo filtrar por fabricante, categoria, classe ABC e status operacional.',
    indicators: [
      {
        name: 'Status de Estoque',
        description: 'Classificação operacional: NORMAL, ALERTA, CRÍTICO, ZERADO, NEGATIVO ou EXCESSO.',
        unit: 'Tag Operacional',
      },
      {
        name: 'Lucro Unitário',
        description: 'Diferença entre o preço de venda e o custo de compra cadastrado.',
        unit: 'R$',
      },
      {
        name: 'Valor Total',
        description: 'Posição patrimonial total do SKU (Saldo × Preço de Venda).',
        unit: 'R$',
      },
    ],
    calculationMemory: [
      {
        title: 'Margem Percentual (%)',
        formula: 'Margem = ((Venda - Custo) / Venda) × 100',
        rules: ['Calculada sobre o valor de venda praticado.'],
      },
      {
        title: 'Markup Percentual (%)',
        formula: 'Markup = ((Venda - Custo) / Custo) × 100',
        rules: ['Calculado sobre o custo de reposição.'],
      },
    ],
    guidelines: [
      'Clicar sobre qualquer linha abre o Drawer Lateral de SKU com o raio-x cadastral completo do produto.',
      'O botão Exportar gera uma planilha compatível com Excel contendo todos os 251 SKUs e suas métricas.',
    ],
  },

  api_integration: {
    id: 'api_integration',
    title: 'Hub de Conexão com a API SmartPOS',
    shortSummary: 'Módulo de conectividade, monitoramento e diagnóstico direto com o gateway oficial da SmartPOS.',
    purpose: 'Garantir a integridade da comunicação entre o dashboard e o ERP SmartPOS, permitindo testar credenciais, checar latência de rede e auditar os endpoints consumidos.',
    indicators: [
      {
        name: 'Status de Conexão',
        description: 'Estado da autenticação: Ativo (200 OK), Rejeitado (401/403) ou Falha de Rede.',
        unit: 'Status HTTP',
      },
      {
        name: 'Latência de Rede',
        description: 'Tempo de resposta da chamada de teste em milissegundos.',
        unit: 'ms',
      },
    ],
    calculationMemory: [
      {
        title: 'Autenticação Oficial SmartPOS',
        formula: 'Headers: X-Api-Key-Id + X-Api-Key-Secret transmitidos via HTTPS seguro',
        rules: [
          'Chaves mantidas estritamente em variáveis de ambiente seguras no servidor.',
          'Nenhuma credencial trafega para o navegador público do cliente.',
        ],
      },
    ],
    guidelines: [
      'Você pode testar credenciais temporárias para validar conexões adicionais diretamente pelo formulário de teste.',
      'O agendamento automático roda 2x ao dia (às 06:00 e às 14:00 BRT), mantendo os dados sempre frescos.',
    ],
  },
}
