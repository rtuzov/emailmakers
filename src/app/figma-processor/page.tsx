'use client';

import { useState, useEffect } from 'react';
import { GlassButton } from '@/ui/components/glass/glass-button';
import { GlassCard } from '@/ui/components/glass/glass-card';

interface ProcessingJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startTime: string;
  endTime?: string;
  metadata: {
    figmaUrl: string;
    totalAssets?: number;
    processedAssets?: number;
  };
  error?: string;
  result?: {
    summary: any;
    outputDirectory: string;
    reportPath: string;
    assetCount: number;
  };
  estimatedTimeRemaining?: number;
}

export default function FigmaProcessorPage() {
  const [figmaUrl, setFigmaUrl] = useState('https://www.figma.com/design/GBnGxSQlfM1XhjSkLHogk6/%F0%9F%8C%88-%D0%91%D0%B8%D0%B1%D0%BB%D0%B8%D0%BE%D1%82%D0%B5%D0%BA%D0%B0-%D0%BC%D0%B0%D1%80%D0%BA%D0%B5%D1%82%D0%B8%D0%BD%D0%B3%D0%B0--Copy-?t=z7QX9Qp6s7y2dhFi-0');
  const [campaignType, setCampaignType] = useState('newsletter');
  const [contentTheme, setContentTheme] = useState('новости авиакомпаний и путешествий');
  const [targetAudience, setTargetAudience] = useState('пользователи сервиса бронирования билетов');
  const [brandGuidelines, setBrandGuidelines] = useState('дружелюбный тон, позитивная коммуникация, информативность');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  // Загружаем список задач при монтировании
  useEffect(() => {
    loadJobs();
    const interval = setInterval(loadJobs, 2000); // Обновляем каждые 2 секунды
    return () => clearInterval(interval);
  }, []);

  // Отслеживаем текущую задачу
  useEffect(() => {
    if (currentJobId) {
      const interval = setInterval(() => checkJobStatus(currentJobId), 1000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [currentJobId]);

  const loadJobs = async () => {
    try {
      const response = await fetch('/api/figma/process-news-rabbits');
      const data = await response.json();
      if (data.success) {
        setJobs(data.jobs);
      }
    } catch (error) {
      console.error('Ошибка загрузки задач:', error);
    }
  };

  const checkJobStatus = async (jobId: string) => {
    try {
      const response = await fetch(`/api/figma/process-news-rabbits/${jobId}`);
      const data = await response.json();
      if (data.success) {
        setJobs(prev => prev.map(job => 
          job.id === jobId ? { ...job, ...data.job } : job
        ));
        
        // Если задача завершена, останавливаем отслеживание
        if (data.job.status === 'completed' || data.job.status === 'failed') {
          setCurrentJobId(null);
        }
      }
    } catch (error) {
      console.error('Ошибка проверки статуса:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/figma/process-news-rabbits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          figmaUrl,
          context: {
            campaign_type: campaignType,
            content_theme: contentTheme,
            target_audience: targetAudience,
            brand_guidelines: brandGuidelines.split(',').map(g => g.trim()),
          },
          options: {
            includeVariants: true,
            generateReport: true,
            aiAnalysis: true,
            maxAssets: 20,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCurrentJobId(data.jobId);
        await loadJobs(); // Обновляем список задач
      } else {
        alert(`Ошибка: ${data.error}`);
      }
    } catch (error) {
      console.error('Ошибка отправки:', error);
      alert('Ошибка отправки запроса');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/figma/process-news-rabbits/${jobId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await loadJobs();
      }
    } catch (error) {
      console.error('Ошибка удаления задачи:', error);
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'processing':
        return '🔄';
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      default:
        return '❓';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Ожидает',
      processing: 'Обрабатывается',
      completed: 'Завершено',
      failed: 'Ошибка',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-400';
      case 'processing':
        return 'text-blue-400';
      case 'completed':
        return 'text-green-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU');
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const duration = Math.round((end.getTime() - start.getTime()) / 1000);
    
    if (duration < 60) return `${duration}с`;
    if (duration < 3600) return `${Math.round(duration / 60)}м`;
    return `${Math.round(duration / 3600)}ч`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="container mx-auto py-8 max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-4 text-white">🐰 Обработка Figma компонентов &quot;Зайцы Новости&quot;</h1>
          <p className="text-white/80 text-lg">
            Автоматическая обработка компонентов зайцев с генерацией тегов через GPT-4
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Форма запуска обработки */}
          <GlassCard variant="primary" glow hover>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-2">Новая обработка</h2>
              <p className="text-white/70 mb-6">
                Настройте параметры и запустите обработку компонентов
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Figma URL</label>
                  <input
                    type="url"
                    value={figmaUrl}
                    onChange={(e) => setFigmaUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="https://www.figma.com/design/..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Тип кампании</label>
                  <select
                    value={campaignType}
                    onChange={(e) => setCampaignType(e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="newsletter">Newsletter</option>
                    <option value="promotional">Promotional</option>
                    <option value="informational">Informational</option>
                    <option value="seasonal">Seasonal</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Тема контента</label>
                  <input
                    type="text"
                    value={contentTheme}
                    onChange={(e) => setContentTheme(e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="новости авиакомпаний и путешествий"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Целевая аудитория</label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="пользователи сервиса бронирования билетов"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Брендинг (через запятую)</label>
                  <textarea
                    value={brandGuidelines}
                    onChange={(e) => setBrandGuidelines(e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="дружелюбный тон, позитивная коммуникация, информативность"
                    rows={3}
                  />
                </div>

                <GlassButton 
                  type="submit" 
                  disabled={isSubmitting} 
                  variant="accent"
                  size="lg"
                  className="w-full"
                  loading={isSubmitting}
                >
                  {isSubmitting ? 'Запуск обработки...' : 'Запустить обработку'}
                </GlassButton>
              </form>
            </div>
          </GlassCard>

          {/* Список задач */}
          <GlassCard variant="secondary" glow>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-2">История обработки</h2>
              <p className="text-white/70 mb-6">
                Статус и результаты выполненных задач
              </p>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {jobs.length === 0 ? (
                  <p className="text-white/60 text-center py-8">
                    Задач пока нет
                  </p>
                ) : (
                  jobs.map((job) => (
                    <div key={job.id} className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className={`text-lg ${getStatusColor(job.status)}`}>
                            {getStatusEmoji(job.status)}
                          </span>
                          <span className={`text-sm font-medium ${getStatusColor(job.status)}`}>
                            {getStatusLabel(job.status)}
                          </span>
                          <span className="text-xs text-white/50">
                            {formatTime(job.startTime)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-white/50">
                            {formatDuration(job.startTime, job.endTime)}
                          </span>
                          <GlassButton
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteJob(job.id)}
                          >
                            🗑️
                          </GlassButton>
                        </div>
                      </div>

                      {/* Прогресс для активных задач */}
                      {job.status === 'processing' && (
                        <div>
                          <div className="flex justify-between text-sm mb-2 text-white">
                            <span>Прогресс</span>
                            <span>{job.progress}%</span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-2">
                            <div 
                              className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                          {job.estimatedTimeRemaining && (
                            <p className="text-xs text-white/50 mt-1">
                              Осталось ~{job.estimatedTimeRemaining}с
                            </p>
                          )}
                        </div>
                      )}

                      {/* Результаты для завершенных задач */}
                      {job.status === 'completed' && job.result && (
                        <div className="text-sm space-y-1 text-white/80">
                          <p>✅ Обработано: {job.result.assetCount} ассетов</p>
                          <p>📁 Папка: {job.result.outputDirectory}</p>
                          {job.result.summary?.uniqueTags && (
                            <p>🏷️ Тегов: {job.result.summary.uniqueTags.length}</p>
                          )}
                        </div>
                      )}

                      {/* Ошибки */}
                      {job.status === 'failed' && job.error && (
                        <div className="text-sm text-red-300 bg-red-900/20 p-2 rounded border border-red-500/30">
                          {job.error}
                        </div>
                      )}

                      {/* Метаданные */}
                      <div className="text-xs text-white/40 space-y-1">
                        <p>ID: {job.id}</p>
                        {job.metadata.totalAssets && (
                          <p>Ассетов найдено: {job.metadata.totalAssets}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
} 