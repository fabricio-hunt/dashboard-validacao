'use client'

import React, { useState } from 'react'
import {
  CheckCircle2,
  AlertTriangle,
  Plug,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
  KeyRound,
  ExternalLink,
} from 'lucide-react'
import { SmartPosClient } from '@/lib/api/clientAdapter'

export function ApiIntegrationHub() {
  const [apiUrl, setApiUrl] = useState('https://api.smartpos.app/v1')
  const [keyId, setKeyId] = useState('')
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
          keyId: keyId || undefined,
          keySecret: keySecret || undefined,
        }),
      })

      const data = await response.json()
      setTestResult({
        status: data.success ? 'success' : 'error',
        statusCode: data.statusCode,
        latencyMs: data.latencyMs,
        message: data.message,
      })
    } catch (err: unknown) {
      setTestResult({
        status: 'error',
        statusCode: 0,
        latencyMs: 0,
        message: err instanceof Error ? err.message : 'Falha de comunicação com servidor local.',
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
      <div className="bg-sap-primary-deep text-sap-on-primary p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[4px] text-xs font-medium bg-white/15">
            <Plug className="h-3.5 w-3.5" /> Integração Oficial SmartPOS
          </div>
          <h2 className="text-2xl font-medium tracking-tight">
            Hub de Conexão com a API SmartPOS
          </h2>
          <p className="text-sm text-white/90 leading-relaxed">
            O dashboard combina o inventário físico da planilha com as vendas e lucro bruto em tempo real via endpoints REST da SmartPOS (`/v1/sales`, `/v1/sales/{'{id}'}/items` e `/v1/products`).
          </p>
        </div>

        <a
          href="https://smartpos.readme.io/reference/introdu%C3%A7%C3%A3o-%C3%A0-api"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-sap bg-sap-canvas text-sap-primary-deep text-sm font-medium hover:bg-sap-band-blue transition-colors shrink-0"
        >
          Documentação Oficial <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-sap-lg bg-sap-canvas border border-sap-hairline p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-sap-primary" />
              <h3 className="font-semibold text-sap-ink">Credenciais da API SmartPOS</h3>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-[4px] bg-sap-chrome text-sap-ink-meta border border-sap-hairline font-medium">
              X-Api-Key-Id + X-Api-Key-Secret
            </span>
          </div>

          <p className="text-xs text-sap-ink-meta">
            Deixe os campos em branco para validar usando as variáveis de ambiente configuradas no servidor (`.env.local` ou Vercel).
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-sap-ink-body mb-1">
                Base URL da API
              </label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-sap border border-sap-hairline bg-sap-chrome text-sap-ink-body focus:outline-none focus:border-sap-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-sap-ink-body mb-1">
                  Identificador (X-Api-Key-Id)
                </label>
                <input
                  type="text"
                  value={keyId}
                  onChange={(e) => setKeyId(e.target.value)}
                  placeholder="Usando SMARTPOS_KEY_ID do servidor"
                  className="w-full px-3.5 py-2 text-sm rounded-sap border border-sap-hairline bg-sap-chrome text-sap-ink-body focus:outline-none focus:border-sap-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-sap-ink-body mb-1">
                  Chave Secreta (X-Api-Key-Secret)
                </label>
                <input
                  type="password"
                  value={keySecret}
                  onChange={(e) => setKeySecret(e.target.value)}
                  placeholder="Usando SMARTPOS_KEY_SECRET do servidor"
                  className="w-full px-3.5 py-2 text-sm rounded-sap border border-sap-hairline bg-sap-chrome text-sap-ink-body focus:outline-none focus:border-sap-primary"
                />
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={handleTestConnection}
                disabled={isTesting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sap bg-sap-primary hover:bg-sap-primary-deep text-sap-on-primary text-sm font-medium transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isTesting ? 'animate-spin' : ''}`} />
                {isTesting ? 'Validando na SmartPOS...' : 'Testar Conexão Oficial'}
              </button>

              <span className="text-xs text-sap-ink-meta">
                Teste executado via proxy server-side
              </span>
            </div>
          </div>

          {testResult.status !== 'idle' && (
            <div
              className={`p-4 rounded-sap border ${
                testResult.status === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}
            >
              <div className="flex items-start gap-3">
                {testResult.status === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                      {testResult.status === 'success'
                        ? 'Conexão Aprovada'
                        : `Diagnóstico da API (HTTP ${testResult.statusCode})`}
                    </span>
                    {testResult.latencyMs ? (
                      <span className="text-xs tabular-nums opacity-80">
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

        <div className="rounded-sap-lg bg-sap-chrome border border-sap-hairline p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-sap-primary" />
              <h3 className="font-semibold text-sap-ink">Segurança Corporativa</h3>
            </div>

            <ul className="space-y-3 text-xs text-sap-ink-body">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-sap-primary shrink-0 mt-0.5" />
                <span>Chaves mantidas exclusivamente em variáveis de ambiente do servidor.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-sap-primary shrink-0 mt-0.5" />
                <span>Nenhuma credencial trafega ou é salva no bundle público do cliente.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-sap-primary shrink-0 mt-0.5" />
                <span>Cache em memória + snapshot garantem continuidade mesmo sem conexão.</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-sap-hairline">
            <div className="text-xs text-sap-ink-meta">Arquitetura Híbrida</div>
            <div className="text-sm font-semibold text-sap-ink mt-0.5">
              Vendas SmartPOS + Estoque Planilha
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-sap-lg bg-sap-canvas border border-sap-hairline p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-sap-ink">Endpoints Mapeados da SmartPOS</h3>
          <p className="text-xs text-sap-ink-meta">
            Referência oficial utilizada pelo adaptador do sistema
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {endpoints.map((ep, idx) => (
            <div
              key={idx}
              className="p-4 rounded-sap border border-sap-hairline bg-sap-chrome/60 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-[4px] text-xs font-semibold ${
                      ep.method === 'GET'
                        ? 'bg-sap-band-blue text-sap-primary-deep'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="text-xs font-semibold text-sap-ink">{ep.path}</span>
                </div>
                <button
                  onClick={() => handleCopy(ep.path, `ep-${idx}`)}
                  className="text-sap-ink-meta hover:text-sap-primary p-1"
                >
                  {copiedEndpoint === `ep-${idx}` ? (
                    <Check className="h-3.5 w-3.5 text-emerald-700" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-sap-ink-list leading-relaxed">{ep.description}</p>
              {ep.params && ep.params.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {ep.params.map((param, pIdx) => (
                    <span
                      key={pIdx}
                      className="text-[10px] px-1.5 py-0.5 rounded-[4px] bg-sap-canvas border border-sap-hairline text-sap-ink-meta"
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
