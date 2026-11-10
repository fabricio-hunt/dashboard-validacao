import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MedStock BI | Gestão Executiva de Estoque, Vendas e Capital',
  description:
    'Dashboard analítico corporativo integrado ao SmartPOS para gestão de estoque médico-hospitalar, rentabilidade, ruptura, excesso e validades ANVISA.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-['Inter',system-ui,-apple-system,sans-serif] bg-sap-canvas text-sap-ink-body antialiased selection:bg-sap-band-blue selection:text-sap-primary-deep min-h-screen">
        {children}
      </body>
    </html>
  )
}
