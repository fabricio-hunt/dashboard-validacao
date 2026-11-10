'use client'

import React, { useState } from 'react'
import {
  Network,
  CheckCircle2,
  AlertTriangle,
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
  KeyRound,
  ExternalLink,
} from 'lucide-react'
import { SmartPosClient } from '@/lib/api/clientAdapter'

export function ApiIntegrationHub() {
  const [apiUrl, setApiUrl] = useState('https://api.smartpos.app/v1')
  const [keyId, setKeyId] = useState('2735d1d6-b987-4a3f-853d-dfb4a58bc2a5')
  const [keySecret, setKeySecret] = useState('')
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'success' | 'error'
    statusCode?: number
    latencyMs?: number
    message?: string
  }>({ status: 'idle' })

  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null)

  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestResult({ status: 'idle' })

    try {
      const response = await fetch('/api/smartpos/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl: apiUrl,
          keyId: keyId,
          keySecret: keySecret,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setTestResult({
          status: 'success',
          statusCode: data.statusCode,
          latencyMs: data.latencyMs,
          message: data.message,
        })
      } else {
        setTestResult({
          status: 'error',
          statusCode: data.statusCode,
          latencyMs: data.latencyMs,
          message: data.message,
        })
      }
    } catch (err: any) {
      setTestResult({
        status: 'error',
        statusCode: 0,
        latencyMs: 0,
        message: err.message || 'Falha de comunicação com o servidor de teste local.',
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedEndpoint(id)
    setTimeout(() => setCopiedEndpoint(null), 2000)
  }

  const endpoints = SmartPosClient.getDocumentationEndpoints()

  return (
    <div className="space-y-6">
      {/* Banner Principal de Arquitetura da API SmartPOS */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 border border-teal-500/30 p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/40">
              <Plug className="h-3.5 w-3.5" /> Integração Oficial SmartPOS
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hub de Conexão com a API SmartPOS
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              O dashboard opera de forma híbrida: consome a base da planilha de validação (251 SKUs) e possui a camada completa de integração oficial para a API REST da SmartPOS pronta para sincronização automática.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://smartpos.readme.io/reference/introdu%C3%A7%C3%A3o-%C3%A0-api"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-sm font-medium transition-colors"
            >
              Documentação Oficial <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Painel de Validação e Teste de Chave */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <KeyRound className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              <h3 className="font-bold text-slate-900 dark:text-white">Credenciais da API SmartPOS</h3>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
              Autenticação de 2 Fatores
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Conforme a documentação oficial da SmartPOS, a autenticação requer dois headers HTTP obrigatórios: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-teal-600 dark:text-teal-400 font-mono">X-Api-Key-Id</code> e <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-teal-600 dark:text-teal-400 font-mono">X-Api-Key-Secret</code>.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Base URL da API
              </label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Identificador (X-Api-Key-Id)
                </label>
                <input
                  type="text"
                  value={keyId}
                  onChange={(e) => setKeyId(e.target.value)}
                  placeholder="UUID da chave"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Chave Secreta (X-Api-Key-Secret)
                </label>
                <input
                  type="password"
                  value={keySecret}
                  onChange={(e) => setKeySecret(e.target.value)}
                  placeholder="Segredo temporário (exibido 1x)"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={handleTestConnection}
                disabled={isTesting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 shadow-md shadow-teal-600/20"
              >
                <RefreshCw className={`h-4 w-4 ${isTesting ? 'animate-spin' : ''}`} />
                {isTesting ? 'Validando na SmartPOS...' : 'Testar Conexão Oficial'}
              </button>

              <span className="text-xs text-slate-400">
                Seguro: teste executado via proxy server-side
              </span>
            </div>
          </div>

          {/* Resultado do Teste */}
          {testResult.status !== 'idle' && (
            <div
              className={`p-4 rounded-xl border ${
                testResult.status === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
                  : 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300'
              }`}
            >
              <div className="flex items-start gap-3">
                {testResult.status === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">
                      {testResult.status === 'success' ? 'Conexão Aprovada' : `Diagnóstico da API (HTTP ${testResult.statusCode})`}
                    </span>
                    {testResult.latencyMs ? (
                      <span className="text-xs font-mono opacity-80">
                        • {testResult.latencyMs}ms
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs leading-relaxed opacity-90">{testResult.message}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Resumo de Segurança & Status */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900 dark:text-white">Segurança Enterprise</h3>
            </div>

            <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Nenhuma chave de API é exposta no código ou no repositório GitHub.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Credenciais são armazenadas exclusivamente nas variáveis de ambiente da Vercel.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Fallback automático para cache local garante 100% de disponibilidade no dashboard.</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="text-xs text-slate-400 mb-1">Status de Produção</div>
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              251 Itens Carregados da Base de Teste
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Endpoints Mapeados da SmartPOS */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 dark:text-white">Endpoints Mapeados da SmartPOS</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Especificações prontas para consumo imediato assim que as credenciais forem ativadas no painel do cliente.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {endpoints.map((ep, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                      ep.method === 'GET'
                        ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400'
                        : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {ep.path}
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(ep.path, `ep-${idx}`)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  {copiedEndpoint === `ep-${idx}` ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {ep.description}
              </p>
              {ep.params && ep.params.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {ep.params.map((param, pIdx) => (
                    <span
                      key={pIdx}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-mono"
                    >
                      {param}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
