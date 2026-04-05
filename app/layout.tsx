import type { Metadata } from 'next'
import { Nunito } from 'next/font/google'
import './globals.css'

const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito' })

export const metadata: Metadata = {
  title: 'Utomopia',
  description: 'Find your people, let your twin do the groundwork.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={nunito.variable} style={{ fontFamily: 'var(--font-nunito), sans-serif' }}>{children}</body>
    </html>
  )
}
