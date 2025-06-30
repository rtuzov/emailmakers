export default function Home() {
  return (
    <div className="container mx-auto px-6 py-16">
      <div className="text-center max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="mb-16">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Email<span className="text-kupibilet-primary">Makers</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/80 mb-8 leading-relaxed">
            AI-Powered Email Template Generation
          </p>
          <p className="text-lg text-white/70 mb-12 max-w-2xl mx-auto">
            Создавайте профессиональные email-шаблоны с помощью искусственного интеллекта. 
            Идеальная совместимость, современный дизайн, быстрая генерация.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a 
              href='/create' 
              className="glass-button px-8 py-4 bg-kupibilet-primary hover:bg-kupibilet-primary/80 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              🚀 Начать создание
            </a>
            <a 
              href='/templates' 
              className="glass-button px-8 py-4 text-white hover:bg-white/10 font-semibold rounded-xl transition-all duration-300"
            >
              📧 Посмотреть шаблоны
            </a>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="glass-card p-6 text-center">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-lg font-semibold text-white mb-2">AI-генерация</h3>
            <p className="text-white/70 text-sm">Умный контент на основе вашего брифа</p>
          </div>
          
          <div className="glass-card p-6 text-center">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-lg font-semibold text-white mb-2">Figma интеграция</h3>
            <p className="text-white/70 text-sm">Автоматическое извлечение дизайн-токенов</p>
          </div>
          
          <div className="glass-card p-6 text-center">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-lg font-semibold text-white mb-2">Совместимость</h3>
            <p className="text-white/70 text-sm">Gmail, Outlook, Apple Mail и другие</p>
          </div>
          
          <div className="glass-card p-6 text-center">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-lg font-semibold text-white mb-2">Быстро</h3>
            <p className="text-white/70 text-sm">От идеи до шаблона за минуты</p>
          </div>
        </div>

        {/* Stats */}
        <div className="glass-card p-8 mb-16">
          <h2 className="text-2xl font-bold text-white mb-8">Статистика системы</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-kupibilet-primary mb-2">127</div>
              <div className="text-white/70">Созданных шаблонов</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-kupibilet-secondary mb-2">94%</div>
              <div className="text-white/70">Успешных генераций</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-kupibilet-accent mb-2">4</div>
              <div className="text-white/70">Активных агентов</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}