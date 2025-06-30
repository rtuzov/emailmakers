import Link from 'next/link';
// import { Mail, Zap, Shield, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/>
          <rect x="2" y="4" width="20" height="16" rx="2"/>
        </svg>
      ),
      title: 'AI-генерация контента',
      description: 'Создание персонализированного контента с помощью GPT-4 и Claude',
      color: 'text-kupibilet-primary'
    },
    {
      icon: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>
        </svg>
      ),
      title: 'Мгновенная обработка',
      description: 'Быстрая генерация шаблонов за секунды',
      color: 'text-kupibilet-secondary'
    },
    {
      icon: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
        </svg>
      ),
      title: 'Кроссплатформенность',
      description: 'Совместимость с Gmail, Outlook, Apple Mail и другими клиентами',
      color: 'text-kupibilet-accent'
    },
    {
      icon: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
          <path d="M20 3v4"/>
          <path d="M22 5h-4"/>
          <path d="M4 17v2"/>
          <path d="M5 18H3"/>
        </svg>
      ),
      title: 'Премиум дизайн',
      description: 'Профессиональные шаблоны с современным дизайном',
      color: 'text-kupibilet-primary'
    }
  ];

  const stats = [
    { value: '10,000+', label: 'Созданных шаблонов' },
    { value: '99.9%', label: 'Совместимость' },
    { value: '<30сек', label: 'Время генерации' },
    { value: '24/7', label: 'Доступность' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative px-6 py-20 sm:py-32 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent"></div>
        
        <div className="relative mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-8">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-glass-primary rounded-full text-sm font-medium text-kupibilet-primary border border-kupibilet-primary/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
                <path d="M20 3v4"/>
                <path d="M22 5h-4"/>
                <path d="M4 17v2"/>
                <path d="M5 18H3"/>
              </svg>
              <span>Powered by Kupibilet AI</span>
            </div>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl sm:text-7xl font-bold text-white mb-6">
            Email<span className="text-kupibilet-primary">Makers</span>
          </h1>

          {/* Description */}
          <p className="text-xl sm:text-2xl text-white/80 mb-8 max-w-2xl mx-auto leading-relaxed">
            Создавайте профессиональные email-шаблоны с помощью ИИ. Быстро, красиво, с гарантией совместимости.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link 
              href="/create"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-kupibilet-primary hover:bg-kupibilet-primary/90 text-white font-semibold rounded-xl transition-all duration-200 shadow-glow-green group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/>
                <rect x="2" y="4" width="20" height="16" rx="2"/>
              </svg>
              <span>Создать шаблон</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 group-hover:translate-x-1 transition-transform">
                <path d="M5 12h14"/>
                <path d="m12 5 7 7-7 7"/>
              </svg>
            </Link>
            <Link 
              href="/templates"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-glass-surface hover:bg-glass-primary text-white font-semibold rounded-xl transition-all duration-200 border border-white/20"
            >
              <span>Посмотреть примеры</span>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-kupibilet-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-white/60">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Возможности платформы
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Все инструменты для создания профессиональных email-кампаний в одном месте
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group p-8 bg-glass-surface hover:bg-glass-primary rounded-2xl transition-all duration-300 border border-white/10 hover:border-white/20"
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 bg-white/10 rounded-xl ${feature.color} group-hover:scale-110 transition-transform`}>
                    <feature.icon />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-white/70">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="p-12 bg-glass-surface rounded-3xl border border-white/20">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Готовы начать?
            </h2>
            <p className="text-lg text-white/70 mb-8 max-w-2xl mx-auto">
              Создайте свой первый профессиональный email-шаблон прямо сейчас
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/create"
                className="inline-flex items-center space-x-2 px-8 py-4 bg-kupibilet-primary hover:bg-kupibilet-primary/90 text-white font-semibold rounded-xl transition-all duration-200 shadow-glow-green"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/>
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                </svg>
                <span>Создать сейчас</span>
              </Link>
              <Link 
                href="/agent-debug"
                className="inline-flex items-center space-x-2 px-8 py-4 bg-kupibilet-secondary hover:bg-kupibilet-secondary/90 text-white font-semibold rounded-xl transition-all duration-200 shadow-glow-blue"
              >
                <span>Отладка агентов</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
