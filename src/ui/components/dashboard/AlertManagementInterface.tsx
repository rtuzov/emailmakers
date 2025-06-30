'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, AlertTriangle, CheckCircle, Clock, Settings, Filter, X, Plus } from 'lucide-react';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  source: 'content-specialist' | 'design-specialist' | 'quality-specialist' | 'delivery-specialist' | 'system';
  timestamp: string;
  status: 'active' | 'acknowledged' | 'resolved';
  priority: 'high' | 'medium' | 'low';
  actions_available: string[];
  metadata?: {
    error_count?: number;
    affected_users?: number;
    response_time?: number;
    validation_score?: number;
  };
}

interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  enabled: boolean;
  notification_channels: string[];
  cooldown_minutes: number;
}

interface AlertManagementInterfaceProps {
  className?: string;
}

export default function AlertManagementInterface({ className = '' }: AlertManagementInterfaceProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'acknowledged' | 'resolved'>('all');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    const generateMockAlerts = (): Alert[] => {
      const sources = ['content-specialist', 'design-specialist', 'quality-specialist', 'delivery-specialist', 'system'] as const;
      const types = ['critical', 'warning', 'info'] as const;
      const statuses = ['active', 'acknowledged', 'resolved'] as const;
      const priorities = ['high', 'medium', 'low'] as const;

      return Array.from({ length: 12 }, (_, i) => {
        const type = types[Math.floor(Math.random() * types.length)];
        const source = sources[Math.floor(Math.random() * sources.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        return {
          id: `alert-${Date.now()}-${i}`,
          type,
          title: generateAlertTitle(type, source),
          description: generateAlertDescription(type, source),
          source,
          timestamp: new Date(Date.now() - Math.random() * 3600000 * 24).toISOString(),
          status,
          priority: priorities[Math.floor(Math.random() * priorities.length)],
          actions_available: ['acknowledge', 'resolve', 'escalate'],
          metadata: {
            error_count: Math.floor(Math.random() * 10) + 1,
            affected_users: Math.floor(Math.random() * 100),
            response_time: Math.floor(Math.random() * 2000) + 500,
            validation_score: Math.floor(Math.random() * 30) + 70
          }
        };
      }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    };

    const generateMockAlertRules = (): AlertRule[] => {
      return [
        {
          id: 'rule-1',
          name: 'High Error Rate',
          condition: 'error_rate > threshold',
          threshold: 5,
          enabled: true,
          notification_channels: ['email', 'slack'],
          cooldown_minutes: 15
        },
        {
          id: 'rule-2',
          name: 'Slow Response Time',
          condition: 'response_time > threshold',
          threshold: 2000,
          enabled: true,
          notification_channels: ['email'],
          cooldown_minutes: 30
        },
        {
          id: 'rule-3',
          name: 'Low Validation Score',
          condition: 'validation_score < threshold',
          threshold: 70,
          enabled: false,
          notification_channels: ['slack'],
          cooldown_minutes: 60
        }
      ];
    };

    setTimeout(() => {
      setAlerts(generateMockAlerts());
      setAlertRules(generateMockAlertRules());
      setLoading(false);
    }, 800);

    const interval = setInterval(() => {
      setAlerts(generateMockAlerts());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const generateAlertTitle = (type: string, source: string) => {
    const titles = {
      critical: [
        'Критическая ошибка системы',
        'Сбой валидации данных',
        'Недоступность сервиса'
      ],
      warning: [
        'Превышение времени отклика',
        'Низкий балл качества',
        'Проблемы совместимости'
      ],
      info: [
        'Обновление конфигурации',
        'Плановое обслуживание',
        'Успешное развертывание'
      ]
    };
    
    const typeTitle = titles[type as keyof typeof titles][Math.floor(Math.random() * 3)];
    const sourceNames = {
      'content-specialist': 'Content Specialist',
      'design-specialist': 'Design Specialist', 
      'quality-specialist': 'Quality Specialist',
      'delivery-specialist': 'Delivery Specialist',
      'system': 'System'
    };
    
    return `${typeTitle} - ${sourceNames[source as keyof typeof sourceNames]}`;
  };

  const generateAlertDescription = (type: string, source: string) => {
    const descriptions = {
      critical: 'Требует немедленного вмешательства. Система может работать нестабильно.',
      warning: 'Рекомендуется проверить настройки и производительность.',
      info: 'Информационное сообщение. Действий не требуется.'
    };
    
    return descriptions[type as keyof typeof descriptions];
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'info':
        return <CheckCircle className="w-5 h-5 text-kupibilet-primary" />;
      default:
        return <Bell className="w-5 h-5 text-white/60" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'border-red-400/30 bg-red-400/10';
      case 'warning':
        return 'border-yellow-400/30 bg-yellow-400/10';
      case 'info':
        return 'border-kupibilet-primary/30 bg-kupibilet-primary/10';
      default:
        return 'border-white/20 bg-white/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'acknowledged':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-kupibilet-primary" />;
      default:
        return <Bell className="w-4 h-4 text-white/60" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'acknowledged':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'resolved':
        return 'text-kupibilet-primary bg-kupibilet-primary/10 border-kupibilet-primary/20';
      default:
        return 'text-white/60 bg-white/10 border-white/20';
    }
  };

  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts.filter(alert => alert.status === filter);

  const alertStats = {
    total: alerts.length,
    active: alerts.filter(a => a.status === 'active').length,
    acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
    critical: alerts.filter(a => a.type === 'critical').length
  };

  if (loading) {
    return (
      <div className={`bg-glass-surface rounded-2xl border border-white/20 p-6 ${className}`}>
        <div className="flex items-center space-x-2 mb-6">
          <Bell className="w-5 h-5 text-kupibilet-primary" />
          <h3 className="text-lg font-semibold text-white">Alert Management</h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-white/10 rounded-xl"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-glass-surface rounded-2xl border border-white/20 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-kupibilet-primary" />
          <h3 className="text-lg font-semibold text-white">Alert Management</h3>
          {alertStats.active > 0 && (
            <div className="flex items-center space-x-1 px-2 py-1 bg-red-400/20 rounded-full">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-red-400">{alertStats.active} активных</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            className={`p-2 rounded-lg transition-all duration-200 ${
              notificationsEnabled 
                ? 'bg-kupibilet-primary/20 text-kupibilet-primary' 
                : 'bg-white/10 text-white/60'
            }`}
          >
            {notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </button>
          
          <button
            onClick={() => setShowRules(!showRules)}
            className="p-2 bg-glass-primary rounded-lg text-white hover:bg-glass-surface transition-all duration-200"
          >
            <Settings className="w-4 h-4" />
          </button>
          
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="bg-glass-primary border border-white/20 text-white text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-kupibilet-primary/50 focus:border-kupibilet-primary/50"
          >
            <option value="all">Все уведомления</option>
            <option value="active">Активные</option>
            <option value="acknowledged">Подтвержденные</option>
            <option value="resolved">Решенные</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-glass-primary rounded-xl border border-white/10 p-3 text-center">
          <div className="text-lg font-bold text-white mb-1">{alertStats.total}</div>
          <div className="text-xs text-white/60">Всего</div>
        </div>
        
        <div className="bg-glass-primary rounded-xl border border-white/10 p-3 text-center">
          <div className="text-lg font-bold text-red-400 mb-1">{alertStats.active}</div>
          <div className="text-xs text-white/60">Активные</div>
        </div>
        
        <div className="bg-glass-primary rounded-xl border border-white/10 p-3 text-center">
          <div className="text-lg font-bold text-yellow-400 mb-1">{alertStats.acknowledged}</div>
          <div className="text-xs text-white/60">Подтверждены</div>
        </div>
        
        <div className="bg-glass-primary rounded-xl border border-white/10 p-3 text-center">
          <div className="text-lg font-bold text-kupibilet-primary mb-1">{alertStats.resolved}</div>
          <div className="text-xs text-white/60">Решены</div>
        </div>
        
        <div className="bg-glass-primary rounded-xl border border-white/10 p-3 text-center">
          <div className="text-lg font-bold text-red-400 mb-1">{alertStats.critical}</div>
          <div className="text-xs text-white/60">Критические</div>
        </div>
      </div>

      {/* Rules Panel */}
      {showRules && (
        <div className="mb-6 p-4 bg-glass-primary rounded-xl border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-white">Правила уведомлений</h4>
            <button
              onClick={() => setShowRules(false)}
              className="p-1 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            {alertRules.map(rule => (
              <div key={rule.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{rule.name}</div>
                  <div className="text-xs text-white/60">{rule.condition.replace('threshold', rule.threshold.toString())}</div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-white/60">{rule.cooldown_minutes}м</span>
                  <button
                    className={`w-8 h-4 rounded-full transition-all duration-200 ${
                      rule.enabled ? 'bg-kupibilet-primary' : 'bg-white/20'
                    }`}
                  >
                    <div className={`w-3 h-3 bg-white rounded-full transition-transform duration-200 ${
                      rule.enabled ? 'translate-x-4' : 'translate-x-0.5'
                    }`}></div>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alerts List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredAlerts.map((alert) => (
          <div 
            key={alert.id}
            className={`p-4 rounded-xl border cursor-pointer hover:border-white/30 transition-all duration-200 ${getAlertColor(alert.type)}`}
            onClick={() => setSelectedAlert(alert)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start space-x-3">
                {getAlertIcon(alert.type)}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-white">{alert.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(alert.status)}`}>
                      {alert.status === 'active' ? 'Активное' :
                       alert.status === 'acknowledged' ? 'Подтверждено' : 'Решено'}
                    </span>
                  </div>
                  <p className="text-xs text-white/70">{alert.description}</p>
                </div>
              </div>
              
              <div className="text-xs text-white/50">
                {new Date(alert.timestamp).toLocaleString()}
              </div>
            </div>

            {alert.metadata && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-xs text-white/60">
                  {alert.metadata.error_count && (
                    <span>Ошибок: {alert.metadata.error_count}</span>
                  )}
                  {alert.metadata.response_time && (
                    <span>Время: {alert.metadata.response_time}ms</span>
                  )}
                  {alert.metadata.validation_score && (
                    <span>Балл: {alert.metadata.validation_score}%</span>
                  )}
                </div>
                
                <div className="flex items-center space-x-1">
                  {getStatusIcon(alert.status)}
                  <span className="text-xs text-white/60 capitalize">{alert.priority}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredAlerts.length === 0 && (
        <div className="text-center py-8 text-white/60">
          <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <div>Нет уведомлений для отображения</div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between text-xs text-white/60">
          <span>Уведомления {notificationsEnabled ? 'включены' : 'выключены'}</span>
          <span>Последнее обновление: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}