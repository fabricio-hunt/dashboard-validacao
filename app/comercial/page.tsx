import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Activity, BookOpen } from 'lucide-react'
import { CommercialMetricsView } from '@/components/dashboard/CommercialMetricsView'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default function ComercialPage() {
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
              <p className="text-[11px] text-sap-ink-meta truncate">
                Indicadores Comerciais
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/documentacao"
              className="flex items-center gap-1.5 px-3 py-2 rounded-sap text-xs font-medium border border-sap-hairline-strong bg-sap-canvas hover:bg-sap-band-blue text-sap-ink-body transition-colors"
              title="Documentação completa dos indicadores, fórmulas e limitações da API"
            >
              <BookOpen className="h-3.5 w-3.5 text-sap-primary" />
              <span className="hidden sm:inline">Documentação</span>
            </Link>

            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-2 rounded-sap text-xs font-medium border border-sap-hairline-strong bg-sap-canvas hover:bg-sap-band-blue text-sap-ink-body transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-sap-primary" />
              <span className="hidden sm:inline">Voltar ao Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <CommercialMetricsView />
      </main>

      <footer className="mt-auto bg-sap-band border-t border-sap-hairline py-5 text-xs text-sap-ink-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sap-ink">MedStock BI</span>
            <span>&bull;</span>
            <span>Indicadores Comerciais &mdash; Fase 2</span>
          </div>
          <div>Integração SmartPOS API v1 &bull; Enterprise Light Canvas</div>
        </div>
      </footer>
    </div>
  )
}
