'use client';

import React, { useState } from 'react';

interface GenerationResult {
  status: 'success' | 'error';
  data?: {
    template_id: string;
    html_content: string;
    mjml_content: string;
    text_content: string;
    subject_line: string;
    preview_text: string;
    design_tokens: any;
    quality_scores: {
      content_quality: number;
      design_quality: number;
      deliverability_score: number;
      overall_quality: number;
    };
    file_urls?: {
      html_file: string;
      mjml_file: string;
      text_file: string;
      preview_image: string;
    };
  };
  error_message?: string;
  metadata?: {
    generation_time: number;
    mode: string;
    apis_used: string[];
    template_size: number;
    agent_confidence_scores: Record<string, number>;
  };
}

interface AgentProgress {
  agent: 'content_specialist' | 'design_specialist' | 'quality_specialist' | 'delivery_specialist';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress_percentage: number;
  current_operation?: string;
  confidence_score?: number;
  error?: string;
}

interface PipelineProgress {
  trace_id: string;
  overall_progress: number;
  current_agent: string;
  agents: AgentProgress[];
  status: 'initializing' | 'running' | 'completed' | 'failed';
  start_time: number;
  estimated_completion?: number;
  error?: string;
}

interface FormData {
  briefText: string;
  destination: string;
  origin: string;
  tone: string;
  language: string;
}

export default function Create() {
  const [formData, setFormData] = useState<FormData>({
    briefText: '',
    destination: 'Париж',
    origin: 'Москва',
    tone: 'professional',
    language: 'ru'
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [agentProgress, setAgentProgress] = useState<PipelineProgress | null>(null);
  const [progressInterval, setProgressInterval] = useState<NodeJS.Timeout | null>(null);
  const [loadingStage, setLoadingStage] = useState<'idle' | 'initializing' | 'connecting' | 'processing' | 'finalizing'>('idle');
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);
  const [errorDetails, setErrorDetails] = useState<{
    type: 'network' | 'timeout' | 'validation' | 'server' | 'agent' | null;
    message: string;
    details?: string;
    retryable?: boolean;
  } | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [maxRetries] = useState(3);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{
    isDownloading: boolean;
    fileName: string;
    progress: number;
  } | null>(null);
  const [agentLogs, setAgentLogs] = useState<any[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [logFilter, setLogFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all');
  const [logsInterval, setLogsInterval] = useState<NodeJS.Timeout | null>(null);

  // Cleanup intervals on unmount
  React.useEffect(() => {
    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      if (logsInterval) {
        clearInterval(logsInterval);
      }
    };
  }, [progressInterval, logsInterval]);

  // Auto-start logs monitoring when generation starts
  React.useEffect(() => {
    if (isGenerating && !logsInterval) {
      startLogsMonitoring();
    } else if (!isGenerating && logsInterval) {
      stopLogsMonitoring();
    }
  }, [isGenerating]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Enhanced error handling function
  const handleError = (error: any, context: string) => {
    console.error(`Error in ${context}:`, error);
    
    let errorType: 'network' | 'timeout' | 'validation' | 'server' | 'agent' = 'server';
    let message = 'Произошла неизвестная ошибка';
    let details = '';
    let retryable = false;
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      errorType = 'network';
      message = 'Ошибка подключения к серверу';
      details = 'Проверьте подключение к интернету и попробуйте снова';
      retryable = true;
    } else if (error.name === 'AbortError') {
      errorType = 'timeout';
      message = 'Время ожидания истекло';
      details = 'Операция заняла слишком много времени. Попробуйте снова';
      retryable = true;
    } else if (error.status === 400) {
      errorType = 'validation';
      message = 'Ошибка валидации данных';
      details = error.message || 'Проверьте правильность заполнения формы';
      retryable = false;
    } else if (error.status === 500) {
      errorType = 'server';
      message = 'Внутренняя ошибка сервера';
      details = 'Попробуйте позже или обратитесь в службу поддержки';
      retryable = true;
    } else if (error.message?.includes('agent')) {
      errorType = 'agent';
      message = 'Ошибка в агентной системе';
      details = error.message || 'Один из агентов столкнулся с проблемой';
      retryable = true;
    }
    
    setErrorDetails({ type: errorType, message, details, retryable });
  };

  // Start real-time progress tracking with enhanced error handling
  const startProgressTracking = (traceId: string) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for each request
    
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/agent/progress?traceId=${traceId}`, {
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.progress) {
          setAgentProgress(data.progress);
          setProgress(data.progress.overall_progress);
          setErrorDetails(null); // Clear any previous errors
          
          // Update loading stage based on progress
          if (data.progress.overall_progress === 0) {
            setLoadingStage('initializing');
          } else if (data.progress.overall_progress < 25) {
            setLoadingStage('connecting');
          } else if (data.progress.overall_progress < 90) {
            setLoadingStage('processing');
          } else {
            setLoadingStage('finalizing');
          }
          
          // Calculate estimated time remaining
          if (data.progress.estimated_completion) {
            const remaining = Math.max(0, Math.round((data.progress.estimated_completion - Date.now()) / 1000));
            setEstimatedTimeRemaining(remaining);
          }
          
          // Handle agent failures
          if (data.progress.status === 'failed') {
            clearInterval(interval);
            setProgressInterval(null);
            setLoadingStage('idle');
            setEstimatedTimeRemaining(null);
            setIsGenerating(false);
            
            handleError({
              type: 'agent',
              message: data.progress.error || 'Ошибка в агентной системе',
              status: 500
            }, 'agent pipeline');
            return;
          }
          
          // Stop tracking when completed
          if (data.progress.status === 'completed') {
            clearInterval(interval);
            setProgressInterval(null);
            setLoadingStage('idle');
            setEstimatedTimeRemaining(null);
          }
        } else if (data.error) {
          throw new Error(data.error);
        }
        
      } catch (error) {
        clearTimeout(timeoutId);
        handleError(error, 'progress tracking');
        
        // Don't stop tracking immediately on network errors - retry a few times
        if (retryCount < maxRetries && error.name !== 'AbortError') {
          setRetryCount(prev => prev + 1);
          return;
        }
        
        // Stop tracking after max retries
        clearInterval(interval);
        setProgressInterval(null);
        setLoadingStage('idle');
        setEstimatedTimeRemaining(null);
        setIsGenerating(false);
      }
    }, 1000); // Poll every second
    
    setProgressInterval(interval);
  };

  // Stop progress tracking
  const stopProgressTracking = () => {
    if (progressInterval) {
      clearInterval(progressInterval);
      setProgressInterval(null);
    }
  };

  // Start real-time logs monitoring
  const startLogsMonitoring = (traceId?: string) => {
    const interval = setInterval(async () => {
      try {
        const params = new URLSearchParams({
          level: logFilter === 'all' ? 'debug' : logFilter,
          limit: '100',
          since: new Date(Date.now() - 5 * 60 * 1000).toISOString() // Last 5 minutes
        });

        if (traceId) {
          params.append('tool', traceId);
        }

        const response = await fetch(`/api/agent/logs?${params}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.logs) {
            setAgentLogs(data.data.logs);
          }
        }
      } catch (error) {
        console.warn('Failed to fetch agent logs:', error);
      }
    }, 2000); // Poll every 2 seconds

    setLogsInterval(interval);
  };

  // Stop logs monitoring
  const stopLogsMonitoring = () => {
    if (logsInterval) {
      clearInterval(logsInterval);
      setLogsInterval(null);
    }
  };

  // Toggle logs visibility
  const toggleLogs = () => {
    const newShowLogs = !showLogs;
    setShowLogs(newShowLogs);
    
    if (newShowLogs && !logsInterval) {
      startLogsMonitoring();
    } else if (!newShowLogs && logsInterval) {
      stopLogsMonitoring();
    }
  };

  // Get agent display name
  const getAgentDisplayName = (agent: string) => {
    switch (agent) {
      case 'content_specialist': return 'Контент-специалист';
      case 'design_specialist': return 'Дизайн-специалист';
      case 'quality_specialist': return 'Контроль качества';
      case 'delivery_specialist': return 'Специалист доставки';
      default: return agent;
    }
  };

  // Get agent emoji
  const getAgentEmoji = (agent: string) => {
    switch (agent) {
      case 'content_specialist': return '✍️';
      case 'design_specialist': return '🎨';
      case 'quality_specialist': return '✅';
      case 'delivery_specialist': return '🚀';
      default: return '🤖';
    }
  };

  // Get loading stage message
  const getLoadingStageMessage = (stage: string) => {
    switch (stage) {
      case 'initializing': return 'Инициализация агентной системы...';
      case 'connecting': return 'Подключение к AI сервисам...';
      case 'processing': return 'Обработка специализированными агентами...';
      case 'finalizing': return 'Финальная обработка и проверка...';
      default: return 'Подготовка...';
    }
  };

  // Format time remaining
  const formatTimeRemaining = (seconds: number | null) => {
    if (!seconds || seconds <= 0) return null;
    
    if (seconds < 60) {
      return `${seconds} сек`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Validation function
  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!formData.briefText.trim()) {
      errors.push('Бриф не может быть пустым');
    } else if (formData.briefText.length < 10) {
      errors.push('Бриф должен содержать минимум 10 символов');
    } else if (formData.briefText.length > 5000) {
      errors.push('Бриф не может превышать 5000 символов');
    }
    
    if (!formData.destination.trim()) {
      errors.push('Направление не может быть пустым');
    }
    
    if (!formData.origin.trim()) {
      errors.push('Место отправления не может быть пустым');
    }
    
    return { isValid: errors.length === 0, errors };
  };

  // Retry function
  const retryGeneration = () => {
    setErrorDetails(null);
    setRetryCount(0);
    handleSubmit(new Event('submit') as any);
  };

  // Log helper functions
  const getLogLevelIcon = (level: string) => {
    switch (level) {
      case 'debug': return '🐛';
      case 'info': return 'ℹ️';
      case 'warn': return '⚠️';
      case 'error': return '❌';
      default: return '📝';
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'debug': return 'text-gray-400';
      case 'info': return 'text-blue-400';
      case 'warn': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-white';
    }
  };

  const formatLogTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getToolDisplayName = (tool: string) => {
    switch (tool) {
      case 'content-specialist': return 'Контент-специалист';
      case 'design-specialist': return 'Дизайн-специалист';
      case 'quality-specialist': return 'Контроль качества';
      case 'delivery-specialist': return 'Специалист доставки';
      case 'system': return 'Система';
      default: return tool || 'Неизвестно';
    }
  };

  const clearLogs = () => {
    setAgentLogs([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrorDetails(null);
    
    // Validate form
    const validation = validateForm();
    if (!validation.isValid) {
      setErrorDetails({
        type: 'validation',
        message: 'Ошибка валидации формы',
        details: validation.errors.join('. '),
        retryable: false
      });
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setGenerationResult(null);
    setAgentProgress(null);
    setLoadingStage('initializing');
    setEstimatedTimeRemaining(30); // Initial estimate: 30 seconds
    setRetryCount(0);

    // Generate trace ID for progress tracking
    const traceId = `create_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Start real-time progress tracking
    startProgressTracking(traceId);

    try {
      // Set timeout for the main request (2 minutes)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);
      
      const response = await fetch('/api/agent/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          briefText: formData.briefText,
          destination: formData.destination,
          origin: formData.origin,
          tone: formData.tone,
          language: formData.language,
          traceId: traceId // Pass trace ID for progress tracking
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown server error' }));
        throw {
          status: response.status,
          message: errorData.error || errorData.message || `HTTP ${response.status}`,
          details: errorData.details
        };
      }

      const result = await response.json();
      
      if (result.status === 'error') {
        throw {
          status: 400,
          message: result.error_message || 'Ошибка генерации',
          details: result.details
        };
      }
      
      setProgress(100);
      setGenerationResult(result);
      
      // Trigger success animation for successful results
      if (result.status === 'success') {
        triggerSuccessAnimation();
      }

    } catch (error) {
      handleError(error, 'template generation');
      
      // Set a fallback error result for UI
      setGenerationResult({
        status: 'error',
        error_message: errorDetails?.message || 'Произошла ошибка при создании шаблона. Попробуйте еще раз.'
      });
    } finally {
      stopProgressTracking();
      setIsGenerating(false);
    }
  };

  // Success animation trigger
  const triggerSuccessAnimation = () => {
    setShowSuccessAnimation(true);
    setTimeout(() => setShowSuccessAnimation(false), 3000);
  };

  // Download functionality
  const downloadFile = async (content: string, filename: string, mimeType: string = 'text/html') => {
    setDownloadProgress({ isDownloading: true, fileName: filename, progress: 0 });
    
    try {
      // Simulate download progress for UX
      for (let i = 0; i <= 100; i += 20) {
        setDownloadProgress(prev => prev ? { ...prev, progress: i } : null);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Show success notification
      setTimeout(() => {
        setDownloadProgress(null);
      }, 500);
      
    } catch (error) {
      console.error('Download error:', error);
      setDownloadProgress(null);
      setErrorDetails({
        type: 'server',
        message: 'Ошибка загрузки файла',
        details: 'Не удалось загрузить файл. Попробуйте еще раз.',
        retryable: true
      });
    }
  };

  // Download all files as ZIP
  const downloadAllFiles = async () => {
    if (!generationResult?.data) return;
    
    setDownloadProgress({ isDownloading: true, fileName: 'email-template-complete.zip', progress: 0 });
    
    try {
      // This would typically call an API to generate a ZIP file
      // For now, we'll download individual files
      const { data } = generationResult;
      
      await downloadFile(data.html_content, 'email-template.html', 'text/html');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (data.mjml_content) {
        await downloadFile(data.mjml_content, 'email-template.mjml', 'text/plain');
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      if (data.text_content) {
        await downloadFile(data.text_content, 'email-template.txt', 'text/plain');
      }
      
    } catch (error) {
      console.error('Bulk download error:', error);
      setErrorDetails({
        type: 'server',
        message: 'Ошибка массовой загрузки',
        details: 'Не удалось загрузить все файлы. Попробуйте загрузить их по отдельности.',
        retryable: true
      });
    } finally {
      setDownloadProgress(null);
    }
  };

  // Copy to clipboard functionality
  const copyToClipboard = async (content: string, type: string) => {
    try {
      await navigator.clipboard.writeText(content);
      
      // Show temporary success notification
      setErrorDetails({
        type: 'validation',
        message: `${type} скопирован в буфер обмена`,
        details: 'Содержимое успешно скопировано',
        retryable: false
      });
      
      setTimeout(() => setErrorDetails(null), 2000);
    } catch (error) {
      setErrorDetails({
        type: 'server',
        message: 'Ошибка копирования',
        details: 'Не удалось скопировать в буфер обмена',
        retryable: false
      });
    }
  };

  const resetForm = () => {
    setFormData({
      briefText: '',
      destination: 'Париж',
      origin: 'Москва',
      tone: 'professional',
      language: 'ru'
    });
    setGenerationResult(null);
    setProgress(0);
    setAgentProgress(null);
    setLoadingStage('idle');
    setEstimatedTimeRemaining(null);
    setErrorDetails(null);
    setRetryCount(0);
    setShowSuccessAnimation(false);
    setDownloadProgress(null);
    stopProgressTracking();
  };

  return (
    <div className="container mx-auto px-6 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-6">
            Создать Email-шаблон
          </h1>
          <p className="text-lg text-white/80 mb-8">
            Используйте силу ИИ и 4-агентную систему для создания профессиональных email-шаблонов
          </p>
        </div>

        {/* Feature Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <div className="glass-card p-4 text-center">
            <div className="text-2xl mb-2">✍️</div>
            <h3 className="text-sm font-semibold text-white mb-1">Контент</h3>
            <p className="text-xs text-white/70">AI-генерация текста</p>
          </div>
          
          <div className="glass-card p-4 text-center">
            <div className="text-2xl mb-2">🎨</div>
            <h3 className="text-sm font-semibold text-white mb-1">Дизайн</h3>
            <p className="text-xs text-white/70">Figma интеграция</p>
          </div>

          <div className="glass-card p-4 text-center">
            <div className="text-2xl mb-2">✅</div>
            <h3 className="text-sm font-semibold text-white mb-1">Качество</h3>
            <p className="text-xs text-white/70">Автопроверка</p>
          </div>

          <div className="glass-card p-4 text-center">
            <div className="text-2xl mb-2">🚀</div>
            <h3 className="text-sm font-semibold text-white mb-1">Доставка</h3>
            <p className="text-xs text-white/70">Оптимизация</p>
          </div>
        </div>

        {/* Main Form */}
        <div className="glass-card p-8">
          {!generationResult ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Brief Text */}
              <div>
                <label htmlFor="briefText" className="block text-white font-semibold mb-2">
                  Бриф для создания шаблона *
                </label>
                <textarea
                  id="briefText"
                  name="briefText"
                  value={formData.briefText}
                  onChange={handleInputChange}
                  placeholder="Опишите цель письма, целевую аудиторию, ключевые сообщения..."
                  className="w-full p-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-kupibilet-primary h-32 resize-none"
                  required
                />
              </div>

              {/* Destination & Origin */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="destination" className="block text-white font-semibold mb-2">
                    Направление
                  </label>
                  <input
                    type="text"
                    id="destination"
                    name="destination"
                    value={formData.destination}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-kupibilet-primary"
                  />
                </div>

                <div>
                  <label htmlFor="origin" className="block text-white font-semibold mb-2">
                    Откуда
                  </label>
                  <input
                    type="text"
                    id="origin"
                    name="origin"
                    value={formData.origin}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-kupibilet-primary"
                  />
                </div>
              </div>

              {/* Tone & Language */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="tone" className="block text-white font-semibold mb-2">
                    Тон общения
                  </label>
                  <select
                    id="tone"
                    name="tone"
                    value={formData.tone}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-kupibilet-primary"
                  >
                    <option value="professional">Профессиональный</option>
                    <option value="friendly">Дружелюбный</option>
                    <option value="formal">Официальный</option>
                    <option value="casual">Неформальный</option>
                    <option value="urgent">Срочный</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="language" className="block text-white font-semibold mb-2">
                    Язык
                  </label>
                  <select
                    id="language"
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-kupibilet-primary"
                  >
                    <option value="ru">Русский</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>


              {/* 4-Agent Pipeline Progress (when generating) */}
              {isGenerating && (
                <div className="space-y-6">
                  {/* Overall Progress with Enhanced Loading States */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-white/80 text-sm">
                      <div className="flex items-center gap-2">
                        <span>Генерация шаблона 4-агентной системой</span>
                        {loadingStage !== 'idle' && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-kupibilet-primary rounded-full animate-pulse"></div>
                            <span className="text-xs text-white/60">{getLoadingStageMessage(loadingStage)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{Math.round(progress)}%</span>
                        {estimatedTimeRemaining && (
                          <span className="text-xs text-white/60">
                            ({formatTimeRemaining(estimatedTimeRemaining)})
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Enhanced Progress Bar */}
                    <div className="relative">
                      <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-kupibilet-primary to-kupibilet-primary/80 h-3 rounded-full transition-all duration-500 relative"
                          style={{ width: `${progress}%` }}
                        >
                          {/* Animated progress shine effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                        </div>
                      </div>
                      
                      {/* Progress markers */}
                      <div className="flex justify-between mt-1 text-xs text-white/40">
                        <span className={progress >= 25 ? 'text-white/70' : ''}>25%</span>
                        <span className={progress >= 50 ? 'text-white/70' : ''}>50%</span>
                        <span className={progress >= 75 ? 'text-white/70' : ''}>75%</span>
                        <span className={progress >= 100 ? 'text-white/70' : ''}>100%</span>
                      </div>
                    </div>
                    
                    {/* Current Status */}
                    {agentProgress && (
                      <div className="flex items-center justify-center gap-2 p-3 bg-white/5 rounded-lg">
                        <div className={`w-2 h-2 rounded-full ${
                          agentProgress.status === 'completed' ? 'bg-green-500' :
                          agentProgress.status === 'running' ? 'bg-kupibilet-primary animate-pulse' :
                          agentProgress.status === 'failed' ? 'bg-red-500' :
                          'bg-white/50'
                        }`}></div>
                        <p className="text-white/80 text-sm text-center">
                          {agentProgress.status === 'initializing' ? 'Инициализация системы...' :
                           agentProgress.status === 'running' ? `Активен: ${getAgentDisplayName(agentProgress.current_agent)}` :
                           agentProgress.status === 'completed' ? 'Завершено успешно!' :
                           'Ошибка выполнения'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Individual Agent Progress */}
                  {agentProgress && agentProgress.agents && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {agentProgress.agents.map((agent) => (
                        <div 
                          key={agent.agent}
                          className={`glass-card p-4 border-l-4 transition-all duration-300 ${
                            agent.status === 'completed' ? 'border-green-500 bg-green-500/10' :
                            agent.status === 'in_progress' ? 'border-kupibilet-primary bg-kupibilet-primary/10' :
                            agent.status === 'failed' ? 'border-red-500 bg-red-500/10' :
                            'border-white/20'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{getAgentEmoji(agent.agent)}</span>
                              <span className="text-white font-medium text-sm">{getAgentDisplayName(agent.agent)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {agent.status === 'completed' && <span className="text-green-400 text-xs">✓</span>}
                              {agent.status === 'failed' && <span className="text-red-400 text-xs">✗</span>}
                              {agent.status === 'in_progress' && (
                                <div className="w-3 h-3 border-2 border-kupibilet-primary border-t-transparent rounded-full animate-spin"></div>
                              )}
                              <span className="text-white/70 text-xs">{agent.progress_percentage}%</span>
                            </div>
                          </div>
                          
                          <div className="w-full bg-white/20 rounded-full h-1.5 mb-2">
                            <div 
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                agent.status === 'completed' ? 'bg-green-500' :
                                agent.status === 'in_progress' ? 'bg-kupibilet-primary' :
                                agent.status === 'failed' ? 'bg-red-500' :
                                'bg-white/30'
                              }`}
                              style={{ width: `${agent.progress_percentage}%` }}
                            ></div>
                          </div>
                          
                          {agent.current_operation && (
                            <p className="text-white/60 text-xs leading-tight">
                              {agent.current_operation}
                            </p>
                          )}
                          
                          {agent.confidence_score && agent.status === 'completed' && (
                            <p className="text-green-400 text-xs mt-1">
                              Качество: {Math.round(agent.confidence_score)}%
                            </p>
                          )}
                          
                          {agent.error && agent.status === 'failed' && (
                            <p className="text-red-400 text-xs mt-1">
                              {agent.error}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Estimated Time Remaining */}
                  {agentProgress && agentProgress.estimated_completion && agentProgress.status === 'running' && (
                    <div className="text-center">
                      <p className="text-white/50 text-xs">
                        Осталось примерно: {Math.max(0, Math.round((agentProgress.estimated_completion - Date.now()) / 1000))} сек
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Real-time Agent Logs Section */}
              {(isGenerating || agentLogs.length > 0) && (
                <div className="space-y-4">
                  {/* Logs Header */}
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📋</span>
                      <div>
                        <h3 className="text-white font-semibold">Логи агентов</h3>
                        <p className="text-white/60 text-sm">Мониторинг работы системы в режиме реального времени</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Log Filter Dropdown */}
                      <select
                        value={logFilter}
                        onChange={(e) => setLogFilter(e.target.value as any)}
                        className="px-3 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:border-kupibilet-primary"
                      >
                        <option value="all">Все логи</option>
                        <option value="info">Информация</option>
                        <option value="warn">Предупреждения</option>
                        <option value="error">Ошибки</option>
                      </select>
                      <button
                        onClick={toggleLogs}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          showLogs 
                            ? 'bg-kupibilet-primary text-white' 
                            : 'bg-white/20 text-white hover:bg-white/30'
                        }`}
                      >
                        {showLogs ? 'Скрыть' : 'Показать'}
                      </button>
                      {agentLogs.length > 0 && (
                        <button
                          onClick={clearLogs}
                          className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-sm hover:bg-red-500/30 transition-colors"
                        >
                          Очистить
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Logs Display */}
                  {showLogs && (
                    <div className="bg-black/50 rounded-lg border border-white/10 max-h-80 overflow-y-auto">
                      {agentLogs.length === 0 ? (
                        <div className="p-4 text-center text-white/60">
                          <div className="text-2xl mb-2">📝</div>
                          <p>Логи пока отсутствуют</p>
                          <p className="text-xs mt-1">Начните генерацию для отображения логов</p>
                        </div>
                      ) : (
                        <div className="p-4 space-y-2">
                          {agentLogs.map((log, index) => (
                            <div
                              key={`${log.timestamp}-${index}`}
                              className={`flex items-start gap-3 p-2 rounded text-sm border-l-2 ${
                                log.level === 'error' ? 'border-red-500 bg-red-500/10' :
                                log.level === 'warn' ? 'border-yellow-500 bg-yellow-500/10' :
                                log.level === 'info' ? 'border-blue-500 bg-blue-500/10' :
                                'border-gray-500 bg-gray-500/10'
                              }`}
                            >
                              <span className="text-lg flex-shrink-0">
                                {getLogLevelIcon(log.level)}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <p className={`${getLogLevelColor(log.level)} font-medium`}>
                                      {log.msg}
                                    </p>
                                    {log.tool && (
                                      <p className="text-white/60 text-xs mt-1">
                                        🤖 {getToolDisplayName(log.tool)}
                                      </p>
                                    )}
                                    {log.duration && (
                                      <p className="text-white/50 text-xs mt-1">
                                        ⏱️ {log.duration}мс
                                      </p>
                                    )}
                                    {log.error && (
                                      <p className="text-red-400 text-xs mt-1 font-mono bg-red-500/10 p-1 rounded">
                                        {log.error}
                                      </p>
                                    )}
                                  </div>
                                  <span className="text-white/40 text-xs flex-shrink-0">
                                    {formatLogTimestamp(log.timestamp)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Logs Footer */}
                      {agentLogs.length > 0 && (
                        <div className="p-3 border-t border-white/10 bg-white/5 text-center">
                          <p className="text-white/50 text-xs">
                            Отображено {agentLogs.length} записей • Обновляется каждые 2 секунды
                          </p>
                          {showLogs && logsInterval && (
                            <div className="flex items-center justify-center gap-1 mt-1">
                              <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-green-400 text-xs">В режиме реального времени</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Error Display */}
              {errorDetails && (
                <div className={`p-4 rounded-lg border-l-4 ${
                  errorDetails.type === 'validation' ? 'bg-yellow-500/10 border-yellow-500' :
                  errorDetails.type === 'network' ? 'bg-blue-500/10 border-blue-500' :
                  errorDetails.type === 'timeout' ? 'bg-orange-500/10 border-orange-500' :
                  'bg-red-500/10 border-red-500'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`text-xl ${
                      errorDetails.type === 'validation' ? 'text-yellow-400' :
                      errorDetails.type === 'network' ? 'text-blue-400' :
                      errorDetails.type === 'timeout' ? 'text-orange-400' :
                      'text-red-400'
                    }`}>
                      {errorDetails.type === 'validation' ? '⚠️' :
                       errorDetails.type === 'network' ? '🌐' :
                       errorDetails.type === 'timeout' ? '⏰' :
                       errorDetails.type === 'agent' ? '🤖' :
                       '❌'}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold mb-1">{errorDetails.message}</h4>
                      {errorDetails.details && (
                        <p className="text-white/70 text-sm mb-2">{errorDetails.details}</p>
                      )}
                      {errorDetails.retryable && retryCount < maxRetries && (
                        <div className="flex items-center gap-2 text-xs text-white/60">
                          <span>Попытка {retryCount + 1} из {maxRetries + 1}</span>
                          <button
                            onClick={retryGeneration}
                            className="px-3 py-1 bg-white/20 text-white rounded hover:bg-white/30 transition-colors"
                          >
                            Повторить
                          </button>
                        </div>
                      )}
                      {!errorDetails.retryable && (
                        <p className="text-xs text-white/60">Исправьте ошибку и попробуйте снова</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-4 justify-center pt-4">
                <button
                  type="submit"
                  disabled={isGenerating}
                  className={`px-8 py-3 font-semibold rounded-lg transition-all ${
                    isGenerating 
                      ? 'bg-white/20 text-white/50 cursor-not-allowed' 
                      : 'glass-button bg-kupibilet-primary text-white hover:bg-kupibilet-primary/80'
                  }`}
                >
                  {isGenerating ? 'Создание...' : 'Создать шаблон'}
                </button>
              </div>
            </form>
          ) : (
            /* Enhanced Results Display */
            <div className="space-y-6">
              {generationResult.status === 'success' ? (
                <div className="space-y-8">
                  {/* Success Header with Animation */}
                  <div className="text-center">
                    <div className={`text-6xl mb-4 transition-all duration-1000 ${
                      showSuccessAnimation ? 'animate-bounce' : ''
                    }`}>
                      🎉
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-4">
                      Шаблон успешно создан!
                    </h2>
                    <div className="flex flex-wrap justify-center gap-4 text-sm text-white/80 mb-6">
                      <span>⏱️ {generationResult.metadata?.generation_time || 0}мс</span>
                      {generationResult.metadata?.template_size && (
                        <span>📏 {Math.round(generationResult.metadata.template_size / 1024)}KB</span>
                      )}
                      <span>🤖 {generationResult.metadata?.apis_used?.length || 1} ИИ сервисов</span>
                    </div>
                  </div>

                  {/* Quality Scores */}
                  {generationResult.data?.quality_scores && (
                    <div className="bg-white/5 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <span>📊</span> Оценки качества
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-400 mb-1">
                            {Math.round(generationResult.data.quality_scores.content_quality)}%
                          </div>
                          <div className="text-xs text-white/60">Контент</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-400 mb-1">
                            {Math.round(generationResult.data.quality_scores.design_quality)}%
                          </div>
                          <div className="text-xs text-white/60">Дизайн</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-400 mb-1">
                            {Math.round(generationResult.data.quality_scores.deliverability_score)}%
                          </div>
                          <div className="text-xs text-white/60">Доставляемость</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-400 mb-1">
                            {Math.round(generationResult.data.quality_scores.overall_quality)}%
                          </div>
                          <div className="text-xs text-white/60">Общая оценка</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Template Preview */}
                  {generationResult.data && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <span>👀</span> Предварительный просмотр
                      </h3>
                      
                      {/* Subject Line */}
                      <div className="bg-white/5 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-white/80">Тема письма:</span>
                          <button
                            onClick={() => copyToClipboard(generationResult.data!.subject_line, 'Тема письма')}
                            className="text-xs px-2 py-1 bg-white/10 text-white rounded hover:bg-white/20 transition-colors"
                          >
                            📋 Копировать
                          </button>
                        </div>
                        <p className="text-white font-medium">{generationResult.data.subject_line}</p>
                      </div>

                      {/* Preview Text */}
                      {generationResult.data.preview_text && (
                        <div className="bg-white/5 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-white/80">Текст предпросмотра:</span>
                            <button
                              onClick={() => copyToClipboard(generationResult.data!.preview_text, 'Текст предпросмотра')}
                              className="text-xs px-2 py-1 bg-white/10 text-white rounded hover:bg-white/20 transition-colors"
                            >
                              📋 Копировать
                            </button>
                          </div>
                          <p className="text-white/90">{generationResult.data.preview_text}</p>
                        </div>
                      )}

                      {/* HTML Preview */}
                      <div className="bg-white/5 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-sm font-medium text-white/80">HTML Код:</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => copyToClipboard(generationResult.data!.html_content, 'HTML код')}
                              className="text-xs px-2 py-1 bg-white/10 text-white rounded hover:bg-white/20 transition-colors"
                            >
                              📋 Копировать
                            </button>
                            <button
                              onClick={() => downloadFile(generationResult.data!.html_content, 'email-template.html', 'text/html')}
                              className="text-xs px-2 py-1 bg-kupibilet-primary text-white rounded hover:bg-kupibilet-primary/80 transition-colors"
                            >
                              💾 Скачать HTML
                            </button>
                          </div>
                        </div>
                        <div className="bg-black/30 rounded p-3 overflow-x-auto">
                          <pre className="text-xs text-green-400 max-h-40 overflow-y-auto">
                            {generationResult.data.html_content?.substring(0, 500)}...
                          </pre>
                        </div>
                      </div>

                      {/* MJML Code (if available) */}
                      {generationResult.data.mjml_content && (
                        <div className="bg-white/5 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-sm font-medium text-white/80">MJML Код:</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => copyToClipboard(generationResult.data!.mjml_content, 'MJML код')}
                                className="text-xs px-2 py-1 bg-white/10 text-white rounded hover:bg-white/20 transition-colors"
                              >
                                📋 Копировать
                              </button>
                              <button
                                onClick={() => downloadFile(generationResult.data!.mjml_content, 'email-template.mjml', 'text/plain')}
                                className="text-xs px-2 py-1 bg-kupibilet-primary text-white rounded hover:bg-kupibilet-primary/80 transition-colors"
                              >
                                💾 Скачать MJML
                              </button>
                            </div>
                          </div>
                          <div className="bg-black/30 rounded p-3 overflow-x-auto">
                            <pre className="text-xs text-blue-400 max-h-40 overflow-y-auto">
                              {generationResult.data.mjml_content?.substring(0, 500)}...
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Download Progress */}
                  {downloadProgress && (
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="animate-spin w-4 h-4 border-2 border-kupibilet-primary border-t-transparent rounded-full"></div>
                        <span className="text-white/80">Загружается: {downloadProgress.fileName}</span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-2">
                        <div 
                          className="bg-kupibilet-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${downloadProgress.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-4 justify-center">
                    <button
                      onClick={downloadAllFiles}
                      disabled={downloadProgress?.isDownloading}
                      className="glass-button px-6 py-3 bg-kupibilet-primary text-white font-semibold rounded-lg hover:bg-kupibilet-primary/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <span>📦</span> Скачать все файлы
                    </button>
                    
                    {generationResult.data?.file_urls?.preview_image && (
                      <a
                        href={generationResult.data.file_urls.preview_image}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="glass-button px-6 py-3 bg-white/20 text-white font-semibold rounded-lg hover:bg-white/30 flex items-center gap-2"
                      >
                        <span>🖼️</span> Открыть превью
                      </a>
                    )}
                    
                    <button
                      onClick={resetForm}
                      className="glass-button px-6 py-3 bg-white/20 text-white font-semibold rounded-lg hover:bg-white/30 flex items-center gap-2"
                    >
                      <span>➕</span> Создать еще
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-4xl mb-4">❌</div>
                  <h2 className="text-2xl font-bold text-white mb-4">Ошибка создания</h2>
                  <p className="text-red-400 mb-4">
                    {generationResult.error_message || 'Неизвестная ошибка'}
                  </p>
                  
                  {/* Detailed error information */}
                  {errorDetails && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 text-left">
                      <h3 className="text-white font-semibold mb-2">Детали ошибки:</h3>
                      <p className="text-red-400 text-sm mb-2">Тип: {errorDetails.type}</p>
                      {errorDetails.details && (
                        <p className="text-white/70 text-sm">{errorDetails.details}</p>
                      )}
                      {retryCount > 0 && (
                        <p className="text-white/60 text-xs mt-2">
                          Попыток выполнено: {retryCount}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-4 justify-center">
                    {errorDetails?.retryable && (
                      <button
                        onClick={retryGeneration}
                        className="glass-button px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600"
                      >
                        Повторить попытку
                      </button>
                    )}
                    <button
                      onClick={resetForm}
                      className="glass-button px-6 py-3 bg-kupibilet-primary text-white font-semibold rounded-lg"
                    >
                      Начать сначала
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
