import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MedStock Analytics | Inteligência e Gestão de Estoque Hospitalar',
  description:
    'Dashboard analítico executivo para gestão de materiais médico-hospitalares, controle de rupturas, curva ABC, validades ANVISA e reposição de estoque.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-['Plus_Jakarta_Sans',sans-serif] antialiased selection:bg-teal-500/20 selection:text-teal-300 min-h-screen">
        {children}
      </body>
    </html>
  )
}
