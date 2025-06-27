'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Home, FileText, Plus, Settings } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Templates', href: '/templates', icon: FileText },
    { name: 'Create', href: '/create', icon: Plus },
    { name: 'Agent Logs', href: '/agent-logs', icon: Activity },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-lg border-b border-glass-border bg-background/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-3xl font-bold text-white hover:text-accent transition-colors">
            Email<span className="text-primary">Makers</span>
          </Link>
          
          <nav className="hidden md:flex space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
                    ${active 
                      ? 'text-primary bg-primary/10 border border-primary/20' 
                      : 'text-white/80 hover:text-accent hover:bg-white/5'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                  {item.name === 'Agent Logs' && (
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="text-white hover:text-accent transition-colors p-2"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
} 