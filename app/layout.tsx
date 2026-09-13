import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Arova | DeFi Intelligence Platform',
  description: 'Real-time DeFi protocol intelligence powered by The Graph subgraphs and Gemini AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
