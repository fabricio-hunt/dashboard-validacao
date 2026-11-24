import React from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Activity,
  BookOpen,
  Compass,
  Layers,
  Calculator,
  CheckCircle2,
  AlertTriangle,
  PenLine,
} from 'lucide-react'
import { CONTEXTUAL_DOCS, DocSection } from '@/lib/docs/contextualDocs'
import { API_LIMITATIONS, MANUAL_UPDATE_ITEMS } from '@/lib/docs/apiLimitations'

export const dynamic = 'force-dynamic'

const SECTION_GROUPS: Array<{ groupTitle: string; docIds: string[] }> = [
  { groupTitle: 'Alertas Gerais', docIds: ['quick_alerts'] },
  { groupTitle: 'BI Executivo', docIds: ['executive_overview', 'curva_abc_estoque'] },
  { groupTitle: 'Vendas & Rankings Top 11', docIds: ['sales_rankings'] },
  { groupTitle: 'Indicadores Comerciais', docIds: ['commercial_metrics'] },
  { groupTitle: 'Catálogo & Estoque', docIds: ['datagrid_catalog'] },
  { groupTitle: 'Plano de Ação', docIds: ['restock_plan'] },
  { groupTitle: 'Validades ANVISA', docIds: ['expirations_anvisa'] },
  { groupTitle: 'Integração SmartPOS', docIds: ['api_integration'] },
]

function DocSectionBlock({ doc }: { doc: DocSection }) {
  return (
    <article id={doc.id} className="scroll-mt-24 rounded-sap-lg bg-sap-canvas border border-sap-hairline overflow-hidden">
      <div className="px-5 py-4 bg-sap-chrome border-b border-sap-hairline">
        <h3 className="text-base font-bold text-sap-ink">{doc.title}</h3>
        <p className="text-xs text-sap-ink-meta mt-0.5">{doc.shortSummary}</p>
      </div>

      <div className="p-5 space-y-5 text-sm">
        <section className="space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-sap-ink text-xs uppercase tracking-wide">
            <Compass className="h-3.5 w-3.5 text-sap-primary" />
            <span>Finalidade e Objetivo de Negócio</span>
          </div>
          <p className="text-sap-ink-body text-xs sm:text-sm leading-relaxed bg-sap-band-blue/30 p-3 rounded-sap border border-sap-primary/10">
            {doc.purpose}
          </p>
        </section>

        {doc.indicators.length > 0 && (
          <section className="space-y-2.5">
            <div className="flex items-center gap-1.5 font-bold text-sap-ink text-xs uppercase tracking-wide">
              <Layers className="h-3.5 w-3.5 text-sap-primary" />
              <span>Indicadores e Métricas</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {doc.indicators.map((ind, idx) => (
                <div key={idx} className="p-2.5 rounded-sap bg-sap-chrome/80 border border-sap-hairline text-xs space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sap-ink">{ind.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-sap-canvas text-sap-ink-meta border border-sap-hairline font-mono font-medium">
                      {ind.unit}
                    </span>
                  </div>
                  <p className="text-[11px] text-sap-ink-meta leading-snug">{ind.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {doc.calculationMemory.length > 0 && (
          <section className="space-y-2.5">
            <div className="flex items-center gap-1.5 font-bold text-sap-ink text-xs uppercase tracking-wide">
              <Calculator className="h-3.5 w-3.5 text-sap-primary" />
              <span>Memória de Cálculo e Regras Matemáticas</span>
            </div>
            <div className="space-y-2.5">
              {doc.calculationMemory.map((calc, idx) => (
                <div key={idx} className="p-3 rounded-sap bg-sap-chrome/50 border border-sap-hairline space-y-2">
                  <div className="font-semibold text-xs text-sap-ink">{calc.title}</div>
                  <div className="font-mono text-[11px] sm:text-xs bg-sap-canvas px-2.5 py-1.5 rounded border border-sap-hairline text-sap-primary-deep font-bold">
                    {calc.formula}
                  </div>
                  {calc.rules.length > 0 && (
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-sap-ink-meta">
                      {calc.rules.map((rule, rIdx) => (
                        <li key={rIdx}>{rule}</li>
                      ))}
                    </ul>
                  )}
                  {calc.example && (
                    <div className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                      <strong>Exemplo Prático:</strong> {calc.example}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {doc.guidelines.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-sap-ink text-xs uppercase tracking-wide">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Orientações de Uso</span>
            </div>
            <ul className="space-y-1.5 text-xs text-sap-ink-body">
              {doc.guidelines.map((guide, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-sap-chrome/50 p-2 rounded">
                  <span className="text-sap-primary font-bold">•</span>
                  <span>{guide}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </article>
  )
}

export default function DocumentacaoPage() {
  return (
    <div className="min-h-screen flex flex-col bg-sap-canvas text-sap-ink-body">
      <header className="sticky top-0 z-40 w-full h-[60px] bg-sap-chrome border-b border-sap-hairline">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-sap bg-sap-primary flex items-center justify-center text-sap-on-primary shrink-0">
              <Activity className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-base sm:text-lg tracking-tight text-sap-ink truncate">
                MedStock BI
              </span>
              <p className="text-[11px] text-sap-ink-meta truncate">Documentação Completa do Sistema</p>
            </div>
          </div>

          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-2 rounded-sap text-xs font-medium border border-sap-hairline-strong bg-sap-canvas hover:bg-sap-band-blue text-sap-ink-body transition-colors shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-sap-primary" />
            <span className="hidden sm:inline">Voltar ao Dashboard</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="rounded-sap-lg bg-sap-band-blue/40 border border-sap-primary/15 p-5 mb-6 flex items-start gap-3">
          <BookOpen className="h-5 w-5 text-sap-primary shrink-0 mt-0.5" />
          <div>
            <h1 className="text-lg font-bold text-sap-ink">Documentação Completa do Sistema</h1>
            <p className="text-xs sm:text-sm text-sap-ink-body mt-1 leading-relaxed">
              O que cada indicador mostra, como é calculado, as limitações conhecidas da API SmartPOS
              e quais valores dependem de atualização manual. Esta página reúne, em um só lugar, a
              documentação que também aparece nos ícones <span className="font-semibold">(ⓘ)</span> espalhados
              pelo dashboard.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 items-start">
          <nav className="hidden lg:block sticky top-[84px] rounded-sap-lg bg-sap-canvas border border-sap-hairline p-4 text-xs space-y-4">
            <div>
              <div className="font-bold text-sap-ink-meta uppercase tracking-wide text-[10px] mb-2">
                Seções do Sistema
              </div>
              <ul className="space-y-1">
                {SECTION_GROUPS.flatMap((group) => group.docIds)
                  .map((id) => CONTEXTUAL_DOCS[id])
                  .filter(Boolean)
                  .map((doc) => (
                    <li key={doc.id}>
                      <a
                        href={`#${doc.id}`}
                        className="block px-2 py-1.5 rounded hover:bg-sap-band-blue/60 text-sap-ink-body hover:text-sap-primary-deep transition-colors"
                      >
                        {doc.title}
                      </a>
                    </li>
                  ))}
              </ul>
            </div>
            <div className="pt-3 border-t border-sap-hairline">
              <ul className="space-y-1">
                <li>
                  <a
                    href="#limitacoes-api"
                    className="block px-2 py-1.5 rounded hover:bg-sap-band-blue/60 text-sap-ink-body hover:text-sap-primary-deep transition-colors font-medium"
                  >
                    Limitações da API SmartPOS
                  </a>
                </li>
                <li>
                  <a
                    href="#atualizacao-manual"
                    className="block px-2 py-1.5 rounded hover:bg-sap-band-blue/60 text-sap-ink-body hover:text-sap-primary-deep transition-colors font-medium"
                  >
                    O que atualizar manualmente
                  </a>
                </li>
              </ul>
            </div>
          </nav>

          <div className="space-y-10 min-w-0">
            {SECTION_GROUPS.map((group) => {
              const docs = group.docIds.map((id) => CONTEXTUAL_DOCS[id]).filter(Boolean)
              if (docs.length === 0) return null
              return (
                <section key={group.groupTitle} className="space-y-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-sap-primary border-b border-sap-primary/20 pb-1.5">
                    {group.groupTitle}
                  </h2>
                  <div className="space-y-4">
                    {docs.map((doc) => (
                      <DocSectionBlock key={doc.id} doc={doc} />
                    ))}
                  </div>
                </section>
              )
            })}

            <section id="limitacoes-api" className="scroll-mt-24 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-sap-primary border-b border-sap-primary/20 pb-1.5">
                Limitações Conhecidas da API SmartPOS
              </h2>
              <div className="rounded-sap-lg bg-sap-canvas border border-sap-hairline overflow-hidden">
                <div className="px-5 py-4 bg-sap-chrome border-b border-sap-hairline flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-sap-ink-body leading-relaxed">
                    A SmartPOS não disponibiliza, hoje, os dados abaixo via API. O dashboard nunca
                    inventa ou estima esses números — eles simplesmente não entram no cálculo, ou
                    dependem de um parâmetro manual conforme indicado.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-sap-chrome/60 text-left text-sap-ink-meta uppercase text-[10px]">
                        <th className="py-2.5 px-4 font-semibold">Dado que pode ser pedido</th>
                        <th className="py-2.5 px-4 font-semibold">Por que não é possível</th>
                        <th className="py-2.5 px-4 font-semibold">Situação atual no dashboard</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sap-hairline">
                      {API_LIMITATIONS.map((item) => (
                        <tr key={item.topic}>
                          <td className="py-3 px-4 font-semibold text-sap-ink align-top whitespace-nowrap">
                            {item.topic}
                          </td>
                          <td className="py-3 px-4 text-sap-ink-body align-top">{item.reason}</td>
                          <td className="py-3 px-4 text-sap-ink-meta align-top">{item.currentBehavior}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section id="atualizacao-manual" className="scroll-mt-24 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-sap-primary border-b border-sap-primary/20 pb-1.5">
                O Que Você Precisa Atualizar Manualmente
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {MANUAL_UPDATE_ITEMS.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-sap-lg bg-sap-canvas border border-sap-hairline p-4 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <PenLine className="h-4 w-4 text-sap-primary shrink-0" />
                      <h3 className="font-semibold text-sm text-sap-ink">{item.title}</h3>
                    </div>
                    <p className="text-xs text-sap-ink-body leading-relaxed">{item.description}</p>
                    <div className="text-[11px] text-sap-primary-deep bg-sap-band-blue/40 border border-sap-primary/15 rounded px-2.5 py-1.5">
                      <strong>Onde:</strong> {item.where}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      <footer className="mt-auto bg-sap-band border-t border-sap-hairline py-5 text-xs text-sap-ink-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sap-ink">MedStock BI</span>
            <span>&bull;</span>
            <span>Documentação Completa do Sistema</span>
          </div>
          <div>Integração SmartPOS API v1 &bull; Enterprise Light Canvas</div>
        </div>
      </footer>
    </div>
  )
}
