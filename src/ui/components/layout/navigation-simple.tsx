'use client';

import Link from 'next/link';

export function NavigationSimple() {
  const navItems = [
    { href: '/', label: 'Главная', icon: '🏠' },
    { href: '/create', label: 'Создать', icon: '✨' },
    { href: '/templates', label: 'Шаблоны', icon: '📧' },
    { href: '/optimization-dashboard', label: 'Оптимизация', icon: '⚙️' },
    { href: '/agent-debug', label: 'Отладка', icon: '🔧' },
    { href: '/agent-logs', label: 'Логи', icon: '📊' }
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-lg border-b border-white/10 bg-slate-900/80">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 text-white hover:text-primary transition-colors">
            <span className="text-2xl font-bold">
              Email<span className="text-primary">Makers</span>
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-white/70 hover:text-white hover:bg-white/10"
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Mobile menu button */}
          <button className="md:hidden p-2 text-white/70 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
} 