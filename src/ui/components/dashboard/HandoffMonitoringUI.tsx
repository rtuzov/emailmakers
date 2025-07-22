'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw, Zap, Users } from 'lucide-react';

interface HandoffEvent {
  id: string;
  from_agent: string;
  to_agent: string;
  timestamp: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  data_type: 'content' | 'design' | 'quality' | 'delivery';
  duration_ms?: number;
  validation_score?: number;
  issues_count: number;
  payload_size_kb: number;
  error_message?: string;
}

interface HandoffMonitoringUIProps {
  className?: string;
}

export default function HandoffMonitoringUI({ className = '' }: HandoffMonitoringUIProps) {
  const [handoffEvents, setHandoffEvents] = useState<HandoffEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [_selectedEvent, _setSelectedEvent] = useState<HandoffEvent | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'failed'>('all');

  useEffect(() => {
    const generateMockHandoffEvents = (): HandoffEvent[] => {
      const agents = ['content-specialist', 'design-specialist', 'quality-specialist', 'delivery-specialist'];
      const dataTypes = ['content', 'design', 'quality', 'delivery'] as const;
      const statuses = ['pending', 'in_progress', 'completed', 'failed'] as const;
      
      return Array.from({ length: 8 }, (_, i) => {
        const fromIndex = Math.floor(Math.random() * agents.length);
        const toIndex = (fromIndex + 1) % agents.length;
        const status = statuses[Math.floor(Math.random() * statuses.length)] as HandoffEvent['status'];
        
        const event: HandoffEvent = {
          id: `handoff-${Date.now()}-${i}`,
          from_agent: agents[fromIndex] as string,
          to_agent: agents[toIndex] as string,
          timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
          status,
          data_type: dataTypes[Math.floor(Math.random() * dataTypes.length)] as HandoffEvent['data_type'],
          issues_count: Math.floor(Math.random() * 5),
          payload_size_kb: Math.floor(Math.random() * 50) + 10,
        };
        
        // Add error_message only if status is failed
        if (status === 'failed') {
          event.error_message = 'Validation failed: Invalid data format';
        }
        
        // Add optional properties conditionally
        if (status === 'completed') {
          event.duration_ms = Math.floor(Math.random() * 5000) + 500;
          event.validation_score = Math.floor(Math.random() * 20) + 80;
        }
        
        return event;
      }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    };

    setTimeout(() => {
      setHandoffEvents(generateMockHandoffEvents());
      setLoading(false);
    }, 600);

    const interval = setInterval(() => {
      setHandoffEvents(generateMockHandoffEvents());
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const getAgentDisplayName = (agent: string) => {
    const names: Record<string, string> = {
      'content-specialist': 'Content',
      'design-specialist': 'Design',
      'quality-specialist': 'Quality',
      'delivery-specialist': 'Delivery'
    };
    return names[agent] || agent;
  };

  const getAgentColor = (agent: string) => {
    const colors: Record<string, string> = {
      'content-specialist': 'text-kupibilet-primary',
      'design-specialist': 'text-kupibilet-secondary',
      'quality-specialist': 'text-kupibilet-accent',
      'delivery-specialist': 'text-purple-400'
    };
    return colors[agent] || 'text-white';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-kupibilet-primary" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'in_progress':
        return <RefreshCw className="w-4 h-4 text-kupibilet-secondary animate-spin" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-white/60" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-kupibilet-primary bg-kupibilet-primary/10 border-kupibilet-primary/20';
      case 'failed':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'in_progress':
        return 'text-kupibilet-secondary bg-kupibilet-secondary/10 border-kupibilet-secondary/20';
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      default:
        return 'text-white/60 bg-white/10 border-white/20';
    }
  };

  const getDataTypeIcon = (dataType: string) => {
    switch (dataType) {
      case 'content':
        return '📝';
      case 'design':
        return '🎨';
      case 'quality':
        return '🔍';
      case 'delivery':
        return '📤';
      default:
        return '📄';
    }
  };

  const filteredEvents = filter === 'all' 
    ? handoffEvents 
    : handoffEvents.filter(event => event.status === filter);

  const stats = {
    total: handoffEvents.length,
    completed: handoffEvents.filter(e => e.status === 'completed').length,
    pending: handoffEvents.filter(e => e.status === 'pending').length,
    failed: handoffEvents.filter(e => e.status === 'failed').length,
    in_progress: handoffEvents.filter(e => e.status === 'in_progress').length,
    avg_duration: handoffEvents
      .filter(e => e.duration_ms)
      .reduce((acc, e) => acc + (e.duration_ms || 0), 0) / 
      Math.max(handoffEvents.filter(e => e.duration_ms).length, 1)
  };

  if (loading) {
    return (
      <div className={`bg-glass-surface rounded-2xl border border-white/20 p-6 ${className}`}>
        <div className="flex items-center space-x-2 mb-6">
          <Users className="w-5 h-5 text-kupibilet-primary" />
          <h3 className="text-lg font-semibold text-white">Handoff Monitoring</h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-white/10 rounded-xl"></div>
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
          <Users className="w-5 h-5 text-kupibilet-primary" />
          <h3 className="text-lg font-semibold text-white">Handoff Monitoring</h3>
          <div className="flex items-center space-x-1 px-2 py-1 bg-kupibilet-primary/20 rounded-full">
            <div className="w-2 h-2 bg-kupibilet-primary rounded-full animate-pulse"></div>
            <span className="text-xs text-kupibilet-primary">Live</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'pending' | 'completed' | 'failed')}
            className="bg-glass-primary border border-white/20 text-white text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-kupibilet-primary/50 focus:border-kupibilet-primary/50"
          >
            <option value="all">Все события</option>
            <option value="pending">Ожидание</option>
            <option value="in_progress">В процессе</option>
            <option value="completed">Завершено</option>
            <option value="failed">Ошибка</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-glass-primary rounded-xl border border-white/10 p-3 text-center">
          <div className="text-lg font-bold text-white mb-1">{stats.total}</div>
          <div className="text-xs text-white/60">Всего</div>
        </div>
        
        <div className="bg-glass-primary rounded-xl border border-white/10 p-3 text-center">
          <div className="text-lg font-bold text-kupibilet-primary mb-1">{stats.completed}</div>
          <div className="text-xs text-white/60">Завершено</div>
        </div>
        
        <div className="bg-glass-primary rounded-xl border border-white/10 p-3 text-center">
          <div className="text-lg font-bold text-yellow-400 mb-1">{stats.pending}</div>
          <div className="text-xs text-white/60">Ожидание</div>
        </div>
        
        <div className="bg-glass-primary rounded-xl border border-white/10 p-3 text-center">
          <div className="text-lg font-bold text-red-400 mb-1">{stats.failed}</div>
          <div className="text-xs text-white/60">Ошибки</div>
        </div>
        
        <div className="bg-glass-primary rounded-xl border border-white/10 p-3 text-center">
          <div className="text-lg font-bold text-kupibilet-secondary mb-1">
            {Math.round(stats.avg_duration)}ms
          </div>
          <div className="text-xs text-white/60">Среднее время</div>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredEvents.map((event) => (
          <div 
            key={event.id}
            className="bg-glass-primary rounded-xl border border-white/10 p-4 hover:bg-glass-surface transition-all duration-200 cursor-pointer"
            onClick={() => _setSelectedEvent(event)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${getAgentColor(event.from_agent)}`}>
                    {getAgentDisplayName(event.from_agent)}
                  </span>
                  <ArrowRight className="w-4 h-4 text-white/60" />
                  <span className={`text-sm font-medium ${getAgentColor(event.to_agent)}`}>
                    {getAgentDisplayName(event.to_agent)}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getDataTypeIcon(event.data_type)}</span>
                  <span className="text-xs text-white/60">{event.data_type}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {getStatusIcon(event.status)}
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(event.status)}`}>
                  {event.status === 'completed' ? 'Завершено' :
                   event.status === 'failed' ? 'Ошибка' :
                   event.status === 'in_progress' ? 'В процессе' : 'Ожидание'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-xs text-white/60">
                <span>Размер: {event.payload_size_kb}KB</span>
                {event.duration_ms && (
                  <span>Время: {event.duration_ms}ms</span>
                )}
                {event.validation_score && (
                  <span className="text-kupibilet-primary">Балл: {event.validation_score}%</span>
                )}
                {event.issues_count > 0 && (
                  <span className="text-yellow-400">Проблемы: {event.issues_count}</span>
                )}
              </div>
              
              <span className="text-xs text-white/40">
                {new Date(event.timestamp).toLocaleTimeString()}
              </span>
            </div>

            {event.error_message && (
              <div className="mt-2 p-2 bg-red-400/10 border border-red-400/20 rounded-lg">
                <div className="text-xs text-red-400">{event.error_message}</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-8 text-white/60">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <div>Нет событий для отображения</div>
        </div>
      )}

      {/* Flow Diagram */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Zap className="w-4 h-4 text-kupibilet-primary" />
          <span className="text-sm font-medium text-white">Схема передачи данных</span>
        </div>
        
        <div className="flex items-center justify-center space-x-4 p-4 bg-glass-primary rounded-xl border border-white/10">
          {['Content', 'Design', 'Quality', 'Delivery'].map((agent, index) => (
            <div key={agent} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  agent === 'Content' ? 'bg-kupibilet-primary/20 text-kupibilet-primary' :
                  agent === 'Design' ? 'bg-kupibilet-secondary/20 text-kupibilet-secondary' :
                  agent === 'Quality' ? 'bg-kupibilet-accent/20 text-kupibilet-accent' :
                  'bg-purple-400/20 text-purple-400'
                }`}>
                  {agent[0]}
                </div>
                <span className="text-xs text-white/60 mt-1">{agent}</span>
              </div>
              {index < 3 && (
                <ArrowRight className="w-4 h-4 text-white/40 mx-2" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}