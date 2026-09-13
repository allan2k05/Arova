import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AROVA | DeFi Intelligence Agent',
  description: 'Proactive AI agent monitoring DeFi protocols via The Graph standardized subgraphs',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <main className="container">
          {children}
        </main>
      </body>
    </html>
  )
}
