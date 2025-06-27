import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/ui/components/navigation/Header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'EmailMakers - AI-Powered Email Template Generation',
  description: 'Create professional email templates with AI-powered content generation and premium glass UI design. Cross-client compatibility and intelligent design automation.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          <Header />
          {children}
        </div>
      </body>
    </html>
  )
}
