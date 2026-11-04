'use client'

import React from 'react'
import {
  Activity,
  FileSpreadsheet,
  Network,
  Download,
  Moon,
  Sun,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

interface HeaderProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  onExportCsv: () => void
  isDark: boolean
  toggleTheme: () => void
}

export function Header({
  activeTab,
  setActiveTab,
  onExportCsv,
  isDark,
  toggleTheme,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-[#0b1120]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20 text-white">
              <Activity className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-teal-200 bg-clip-text text-transparent">
                  MedStock Analytics
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="h-3 w-3" /> Enterprise
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Inteligência e Gestão de Suprimentos Médico-Hospitalares
              </p>
            </div>
          </div>

          {/* Center / Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Status da Fonte de Dados */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs">
              <FileSpreadsheet className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                Fonte Atual:
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                Planilha Ativa (251 SKUs)
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
            </div>

            {/* Botão de Conexão com API */}
            <button
              onClick={() => setActiveTab('api-integration')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                activeTab === 'api-integration'
                  ? 'bg-teal-600 text-white shadow-teal-500/25 ring-2 ring-teal-500/50'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-teal-500/10 hover:text-teal-600 dark:hover:text-teal-300 border border-slate-200 dark:border-slate-700'
              }`}
              title="Ver especificação e simulador de integração com a API do cliente"
            >
              <Network className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Conectar</span> API do Cliente
            </button>

            {/* Exportar CSV */}
            <button
              onClick={onExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
              title="Baixar planilha enriquecida em formato CSV"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Exportar</span> CSV
            </button>

            {/* Dark/Light mode */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              aria-label="Alternar tema escuro/claro"
            >
              {isDark ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-slate-600" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
