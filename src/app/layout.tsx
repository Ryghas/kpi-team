import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import './globals.css'

export const metadata: Metadata = {
  title: 'KPI Engineering - Mobile & Frontend',
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={GeistSans.variable}>
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  )
}
