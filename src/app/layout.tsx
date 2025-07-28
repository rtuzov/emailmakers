import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import './env-init' // ✅ Load environment first

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
    <html lang="en" suppressHydrationWarning>
      <body 
        className={`${inter.className} min-h-screen bg-gradient-to-br from-blue-900 to-slate-800`}
        suppressHydrationWarning
      >
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}
