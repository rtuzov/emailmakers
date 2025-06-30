import { Brain, Palette, Shield, Truck, Zap, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export default function AgentDebugPage() {
  const agents = [
    {
      id: 'content-specialist',
      name: 'Content Specialist',
      icon: Brain,
      status: 'active',
      description: 'Генерация и оптимизация контента для email-кампаний',
      capabilities: [
        'AI-генерация текста',
        'Оптимизация заголовков',
        'Персонализация контента',
        'Анализ тональности'
      ],
      lastActivity: '2 минуты назад',
      color: 'text-kupibilet-primary'
    },
    {
      id: 'design-specialist',
      name: 'Design Specialist', 
      icon: Palette,
      status: 'active',
      description: 'Создание и адаптация дизайна email-шаблонов',
      capabilities: [
        'Обработка Figma файлов',
        'Генерация MJML',
        'Адаптивный дизайн',
        'Брендинг и стилизация'
      ],
      lastActivity: '5 минут назад',
      color: 'text-kupibilet-secondary'
    },
    {
      id: 'quality-specialist',
      name: 'Quality Specialist',
      icon: Shield,
      status: 'active', 
      description: 'Контроль качества и тестирование email-шаблонов',
      capabilities: [
        'Кроссплатформенное тестирование',
        'Валидация HTML/CSS',
        'Проверка доступности',
        'Анализ производительности'
      ],
      lastActivity: '1 минуту назад',
      color: 'text-kupibilet-accent'
    },
    {
      id: 'delivery-specialist',
      name: 'Delivery Specialist',
      icon: Truck,
      status: 'standby',
      description: 'Доставка и оптимизация email-кампаний',
      capabilities: [
        'Оптимизация доставляемости',
        'A/B тестирование',
        'Аналитика кампаний',
        'Управление рассылками'
      ],
      lastActivity: '15 минут назад',
      color: 'text-kupibilet-primary'
    }
  ];

  const systemStatus = {
    totalAgents: 4,
    activeAgents: 3,
    completedTasks: 127,
    avgResponseTime: '1.2s'
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-kupibilet-primary" />;
      case 'standby':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-kupibilet-primary bg-kupibilet-primary/10 border-kupibilet-primary/20';
      case 'standby':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'error':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-glass-primary rounded-full text-sm font-medium text-kupibilet-primary border border-kupibilet-primary/20 mb-6">
            <Zap className="w-4 h-4" />
            <span>AI Agent System</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Отладка <span className="text-kupibilet-primary">Агентов</span>
          </h1>
          
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Мониторинг и тестирование AI-агентов системы EmailMakers
          </p>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-glass-surface rounded-xl border border-white/20 p-6 text-center">
            <div className="text-2xl font-bold text-kupibilet-primary mb-1">
              {systemStatus.totalAgents}
            </div>
            <div className="text-sm text-white/60">Всего агентов</div>
          </div>
          
          <div className="bg-glass-surface rounded-xl border border-white/20 p-6 text-center">
            <div className="text-2xl font-bold text-kupibilet-secondary mb-1">
              {systemStatus.activeAgents}
            </div>
            <div className="text-sm text-white/60">Активных</div>
          </div>
          
          <div className="bg-glass-surface rounded-xl border border-white/20 p-6 text-center">
            <div className="text-2xl font-bold text-kupibilet-accent mb-1">
              {systemStatus.completedTasks}
            </div>
            <div className="text-sm text-white/60">Выполнено задач</div>
          </div>
          
          <div className="bg-glass-surface rounded-xl border border-white/20 p-6 text-center">
            <div className="text-2xl font-bold text-kupibilet-primary mb-1">
              {systemStatus.avgResponseTime}
            </div>
            <div className="text-sm text-white/60">Среднее время</div>
          </div>
        </div>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {agents.map((agent) => {
            const Icon = agent.icon;
            return (
              <div
                key={agent.id}
                className="group bg-glass-surface hover:bg-glass-primary rounded-2xl border border-white/20 hover:border-white/30 p-8 transition-all duration-300"
              >
                {/* Agent Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 bg-white/10 rounded-xl ${agent.color} group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-1">
                        {agent.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(agent.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(agent.status)}`}>
                          {agent.status === 'active' ? 'Активен' : 
                           agent.status === 'standby' ? 'Ожидание' : 'Ошибка'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Agent Description */}
                <p className="text-white/70 mb-6">
                  {agent.description}
                </p>

                {/* Capabilities */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-white mb-3">Возможности:</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {agent.capabilities.map((capability, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-kupibilet-primary rounded-full"></div>
                        <span className="text-sm text-white/70">{capability}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Last Activity */}
                <div className="flex items-center justify-between pt-6 border-t border-white/10">
                  <span className="text-sm text-white/50">
                    Последняя активность: {agent.lastActivity}
                  </span>
                  <button className="px-4 py-2 bg-kupibilet-primary hover:bg-kupibilet-primary/90 text-white text-sm font-medium rounded-lg transition-all duration-200">
                    Тестировать
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center">
          <div className="bg-glass-surface rounded-2xl border border-white/20 p-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              Система готова к работе
            </h2>
            <p className="text-white/70 mb-6">
              Все агенты функционируют в штатном режиме. Система готова к обработке запросов.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="px-6 py-3 bg-kupibilet-primary hover:bg-kupibilet-primary/90 text-white font-semibold rounded-xl transition-all duration-200 shadow-glow-green">
                Запустить полный тест
              </button>
              <button className="px-6 py-3 bg-glass-primary hover:bg-glass-surface text-white font-semibold rounded-xl transition-all duration-200 border border-white/20">
                Просмотреть логи
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 