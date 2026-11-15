'use client'

import React, { useState, useEffect } from 'react'
import { Info, X, BookOpen, Calculator, Compass, Layers, CheckCircle2 } from 'lucide-react'
import { CONTEXTUAL_DOCS, DocSection } from '@/lib/docs/contextualDocs'

interface DocInfoTriggerProps {
  docId: keyof typeof CONTEXTUAL_DOCS | string
  titleOverride?: string
  size?: 'sm' | 'md'
  variant?: 'default' | 'inverted'
  className?: string
}

export function DocInfoTrigger({
  docId,
  titleOverride,
  size = 'sm',
  variant = 'default',
  className = '',
}: DocInfoTriggerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const doc: DocSection | undefined = CONTEXTUAL_DOCS[docId]

  // Fecha com a tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!doc) return null

  const iconSizeClass = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
  const buttonStyle =
    variant === 'inverted'
      ? 'text-white/80 hover:text-white hover:bg-white/20 focus:ring-white/40'
      : 'text-sap-ink-meta hover:text-sap-primary hover:bg-sap-band-blue/80 focus:ring-sap-primary/30'

  return (
    <>
      <div className={`relative inline-flex items-center align-middle ${className}`}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setIsOpen(true)
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onFocus={() => setIsHovered(true)}
          onBlur={() => setIsHovered(false)}
          aria-label={`Informações sobre ${titleOverride || doc.title}`}
          title="Clique para ver a documentação e memória de cálculo completa"
          className={`p-1 rounded-full transition-colors focus:outline-none focus:ring-2 ${buttonStyle}`}
        >
          <Info className={iconSizeClass} />
        </button>

        {/* Tooltip rápido no Hover (Desktop) */}
        {isHovered && !isOpen && (
          <div
            role="tooltip"
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 rounded-sap bg-sap-ink text-white text-[11px] leading-relaxed shadow-lg pointer-events-none transition-opacity duration-150 animate-in fade-in zoom-in-95"
          >
            <div className="font-semibold text-white mb-0.5">{titleOverride || doc.title}</div>
            <p className="text-white/85 line-clamp-3">{doc.shortSummary}</p>
            <div className="mt-1.5 text-[9px] text-sap-sky font-medium">Clique para ver regras e fórmulas (ⓘ)</div>
            {/* Seta do tooltip */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-sap-ink" />
          </div>
        )}
      </div>

      {/* Modal / Popover completo ao Clicar */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm animate-in fade-in"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] bg-sap-canvas rounded-sap-lg shadow-2xl border border-sap-hairline flex flex-col overflow-hidden text-sap-ink-body animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`doc-title-${doc.id}`}
          >
            {/* Header do Modal */}
            <div className="p-4 sm:p-5 bg-sap-chrome border-b border-sap-hairline flex items-start justify-between gap-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-sap-band-blue text-sap-primary flex items-center justify-center shrink-0 border border-sap-primary/20">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sap-primary">
                    Minidocumentação do Indicador
                  </span>
                  <h3 id={`doc-title-${doc.id}`} className="text-base sm:text-lg font-bold text-sap-ink leading-tight">
                    {titleOverride || doc.title}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-sap-hairline/60 text-sap-ink-meta hover:text-sap-ink transition-colors"
                aria-label="Fechar documentação"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Conteúdo com Scroll */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs sm:text-sm">
              {/* 1. Finalidade da Tela / Seção */}
              <section className="space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-sap-ink text-xs uppercase tracking-wide">
                  <Compass className="h-3.5 w-3.5 text-sap-primary" />
                  <span>Finalidade e Objetivo de Negócio</span>
                </div>
                <p className="text-sap-ink-body text-xs sm:text-sm leading-relaxed bg-sap-band-blue/30 p-3 rounded-sap border border-sap-primary/10">
                  {doc.purpose}
                </p>
              </section>

              {/* 2. Descrição dos Indicadores */}
              {doc.indicators && doc.indicators.length > 0 && (
                <section className="space-y-2.5">
                  <div className="flex items-center gap-1.5 font-bold text-sap-ink text-xs uppercase tracking-wide">
                    <Layers className="h-3.5 w-3.5 text-sap-primary" />
                    <span>Indicadores e Métricas</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {doc.indicators.map((ind, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-sap bg-sap-chrome/80 border border-sap-hairline text-xs space-y-1"
                      >
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

              {/* 3. Memória de Cálculo e Fórmulas */}
              {doc.calculationMemory && doc.calculationMemory.length > 0 && (
                <section className="space-y-2.5">
                  <div className="flex items-center gap-1.5 font-bold text-sap-ink text-xs uppercase tracking-wide">
                    <Calculator className="h-3.5 w-3.5 text-sap-primary" />
                    <span>Memória de Cálculo e Regras Matemáticas</span>
                  </div>
                  <div className="space-y-2.5">
                    {doc.calculationMemory.map((calc, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-sap bg-sap-canvas border border-sap-hairline space-y-2"
                      >
                        <div className="font-semibold text-xs text-sap-ink">{calc.title}</div>
                        <div className="font-mono text-[11px] sm:text-xs bg-sap-chrome px-2.5 py-1.5 rounded border border-sap-hairline text-sap-primary-deep font-bold">
                          {calc.formula}
                        </div>
                        {calc.rules && calc.rules.length > 0 && (
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

              {/* 4. Orientações de Uso */}
              {doc.guidelines && doc.guidelines.length > 0 && (
                <section className="space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-sap-ink text-xs uppercase tracking-wide">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Orientações de Uso & Limitações</span>
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

            {/* Footer com Ação de Fechar */}
            <div className="p-3 bg-sap-chrome border-t border-sap-hairline flex items-center justify-between shrink-0">
              <span className="text-[11px] text-sap-ink-meta">
                Pressione <kbd className="px-1.5 py-0.5 rounded bg-sap-canvas border text-[10px] font-mono">Esc</kbd> para fechar
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 rounded-sap bg-sap-primary text-sap-on-primary text-xs font-medium hover:bg-sap-primary-deep transition-colors"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
