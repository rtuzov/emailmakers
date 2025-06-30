'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header className="w-full bg-kupibilet-dark text-white p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          EmailMakers
        </Link>
        
        <nav className="flex space-x-4">
          <Link href="/" className="hover:underline">Главная</Link>
          <Link href="/create" className="hover:underline">Создать</Link>
          <Link href="/templates" className="hover:underline">Шаблоны</Link>
          <Link href="/agent-debug" className="hover:underline">Отладка</Link>
          <Link href="/agent-logs" className="hover:underline">Логи</Link>
        </nav>
      </div>
    </header>
  );
} 