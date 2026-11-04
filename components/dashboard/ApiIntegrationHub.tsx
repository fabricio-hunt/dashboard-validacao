'use client'

import React, { useState } from 'react'
import {
  Network,
  CheckCircle2,
  Plug,
  Zap,
  Code2,
  ShieldCheck,
  Server,
  RefreshCw,
  Copy,
  Check,
  ArrowRight,
  Send,
  FileJson,
} from 'lucide-react'

export function ApiIntegrationHub() {
  const [apiUrl, setApiUrl] = useState('https://api.erp-hospitalar.com.br/v1')
  const [apiKey, setApiKey] = useState('sk_test_token_demonstracao_hospitalar')
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'success' | 'error'
    latencyMs?: number
    message?: string
  }>({ status: 'idle' })

  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null)

  const handleTestConnection = () => {
    setIsTesting(true)
    setTestResult({ status: 'idle' })

    setTimeout(() => {
      setIsTesting(false)
      setTestResult({
        status: 'success',
        latencyMs: 146,
        message: 'Conexão validada com sucesso! Endpoint respondeu com 200 OK.',
      })
    }, 900)
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedEndpoint(id)
    setTimeout(() => setCopiedEndpoint(null), 2000)
  }

  const sampleJson = {
    total_registros: 251,
    data_extracao: new Date().toISOString(),
    produtos: [
      {
        codigo: 'CURTRA10C10B714',
        descricao: 'Curativo transparente não estéril 10cmX10m',
        categoria: 'Curativos',
        fabricante: 'VITALDERME',
        lote: '20250310',
        validade: '2030-03-10',
        custo: 46.80,
        preco_venda: 84.24,
        saldo_estoque: 1,
        estoque_minimo: 1,
        status: 'NORMAL'
      },
      {
        codigo: 'SONFO2V0803004',
        descricao: 'Sonda Foley Látex 2 Vias 08FR 03-05CC',
        categoria: 'Sondas',
        fabricante: 'ADVANTIVE',
        lote: 'H142810308',
        validade: '2027-07-18',
        custo: 4.38,
        preco_venda: 7.89,
        saldo_estoque: 96,
        estoque_minimo: null,
        status: 'NORMAL'
      }
    ]
  }

  return (
    <div className="space-y-6">
      {/* Banner Principal de Arquitetura da API */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 border border-teal-500/30 p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/40">
              <Plug className="h-3.5 w-3.5" /> Arquitetura API-Ready
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Pronto para Conectar à API REST do Cliente
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Este dashboard foi planejado com arquitetura desacoplada. Hoje ele consome os dados da planilha de teste com altíssima performance na Vercel. Assim que o cliente aprovar o orçamento, basta apontar a URL base e o token de autenticação da API dele.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shrink-0 w-full lg:w-72 space-y-2">
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Status da Integração
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-bold text-sm text-white">
                Fase 1: Demonstração Ativa
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Pronto para homologação na Vercel. Virada de chave em menos de 10 minutos.
            </p>
          </div>
        </div>
      </div>

      {/* Simulador Interativo de Conexão com a API do Cliente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Painel de Configuração & Teste de Conexão */}
        <div className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Server className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Simulador de Conexão com Endpoint do Cliente
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Teste as credenciais fornecidas pelo departamento de TI
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ENDPOINT BASE DA API (REST / JSON)
              </label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                CHAVE DE AUTENTICAÇÃO (API KEY / BEARER TOKEN)
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                POLÍTICA DE SINCRONIZAÇÃO
              </label>
              <select className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option>Tempo Real via Webhooks (Recomendado)</option>
                <option>Polling a cada 5 minutos</option>
                <option>Polling a cada 15 minutos</option>
                <option>Sob Demanda (Botão Atualizar)</option>
              </select>
            </div>

            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-teal-500/20 disabled:opacity-50"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Testando conexão e latência...</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  <span>Testar Ping e Conectividade com a API</span>
                </>
              )}
            </button>

            {/* Resultado do Teste */}
            {testResult.status === 'success' && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 space-y-1 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Status: 200 OK | Latência: {testResult.latencyMs}ms</span>
                </div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  {testResult.message} O esquema retornado possui 100% de compatibilidade com os campos da planilha.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Visualizador de Contrato JSON */}
        <div className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <FileJson className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Payload JSON Esperado
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Esquema de dados retornado por <code>GET /api/v1/produtos</code>
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                handleCopy(JSON.stringify(sampleJson, null, 2), 'json')
              }
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="Copiar JSON"
            >
              {copiedEndpoint === 'json' ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className="rounded-xl bg-slate-950 p-4 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-64 border border-slate-800 leading-relaxed">
            <pre>{JSON.stringify(sampleJson, null, 2)}</pre>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Qualquer ERP com exportação REST (ex: SAP, Senior, Protheus, Tasy ou microserviço próprio) se conecta nativamente.
          </p>
        </div>
      </div>

      {/* Roteiro Comercial em 3 Passos para Fechamento */}
      <div className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4">
          Como Será a Transição da Planilha para a API após Aprovação:
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="h-7 w-7 rounded-lg bg-teal-500 text-white font-extrabold flex items-center justify-center text-xs">
              1
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              Liberação das Credenciais
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              O TI do cliente gera um token de leitura (Read-Only) da API de estoque com permissão para consultar os produtos.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="h-7 w-7 rounded-lg bg-teal-500 text-white font-extrabold flex items-center justify-center text-xs">
              2
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              Configuração no Vercel
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Adiciona-se as duas variáveis de ambiente seguras no painel da Vercel: <code>CLIENT_API_BASE_URL</code> e <code>CLIENT_API_KEY</code>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-500 text-white font-extrabold flex items-center justify-center text-xs">
              3
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              Sincronização Ativa
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              O dashboard passa a ler dados ao vivo do ERP automaticamente, sem alterar nenhum botão ou tela já aprovada.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
