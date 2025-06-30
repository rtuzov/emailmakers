import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navigation } from '@/ui/components/layout/navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'EmailMakers - AI-Powered Email Template Generation',
  description: 'Create professional email templates with AI-powered content generation.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-kupibilet-background`}>
        <Navigation />
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}
