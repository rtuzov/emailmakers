import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

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
        <div className="min-h-screen bg-kupibilet-hero">
          <header className="w-full bg-kupibilet-dark text-white p-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <Link href="/" className="text-xl font-bold">
                EmailMakers
              </Link>
              
              <nav className="flex space-x-4">
                <Link href="/" className="hover:underline">Главная</Link>
                <Link href="/create" className="hover:underline">Создать</Link>
                <Link href="/templates" className="hover:underline">Шаблоны</Link>
                <Link href="/optimization-dashboard" className="hover:underline">Оптимизация</Link>
                <Link href="/agent-debug" className="hover:underline">Отладка</Link>
                <Link href="/agent-logs" className="hover:underline">Логи</Link>
              </nav>
            </div>
          </header>
          <main>
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
