/**
 * 📊 VALIDATION MONITORING SYSTEM
 * 
 * Zero tolerance мониторинг системы валидации агентов
 * Отслеживает все метрики, ошибки и производительность в реальном времени
 */

import { EventEmitter } from 'events';
import { AGENT_CONSTANTS } from '../types/base-agent-types';

export interface ValidationMetrics {
  // Основные метрики валидации
  totalValidations: number;
  successfulValidations: number;
  failedValidations: number;
  successRate: number;
  
  // AI коррекция метрики
  totalCorrections: number;
  successfulCorrections: number;
  failedCorrections: number;
  correctionSuccessRate: number;
  averageCorrectionsPerValidation: number;
  
  // Производительность
  averageValidationTime: number;
  maxValidationTime: number;
  minValidationTime: number;
  validationsPerSecond: number;
  
  // Агент-специфические метрики
  agentMetrics: {
    [agentId: string]: AgentValidationMetrics;
  };
  
  // Временные метрики
  metricsWindow: TimeWindowMetrics[];
  
  // Критические события
  criticalEvents: CriticalEvent[];
  
  // System health
  systemHealth: SystemHealthStatus;
}

export interface AgentValidationMetrics {
  agentId: string;
  agentType: 'content' | 'design' | 'quality' | 'delivery';
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  validationSuccessRate: number;
  correctionAttempts: number;
  lastExecutionTime: number;
  toolUsageStats: Record<string, number>;
  errorTypes: Record<string, number>;
}

export interface TimeWindowMetrics {
  timestamp: number;
  windowDuration: number; // in ms
  validations: number;
  successes: number;
  failures: number;
  averageTime: number;
  criticalErrors: number;
}

export interface CriticalEvent {
  id: string;
  timestamp: number;
  type: 'validation_failure' | 'correction_failure' | 'timeout' | 'system_error' | 'security_breach';
  severity: 'critical' | 'high' | 'medium' | 'low';
  agentId?: string;
  message: string;
  details: any;
  resolved: boolean;
  resolvedAt?: number;
  resolutionDetails?: string;
}

export interface SystemHealthStatus {
  status: 'healthy' | 'warning' | 'critical' | 'degraded';
  lastCheck: number;
  healthScore: number; // 0-100
  uptime: number;
  issues: HealthIssue[];
  recommendations: string[];
}

export interface HealthIssue {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  impact: string;
  suggestedAction: string;
}

export interface AlertThresholds {
  maxFailureRate: number; // %
  maxValidationTime: number; // ms
  maxCorrectionAttempts: number;
  minSuccessRate: number; // %
  maxCriticalEvents: number;
}

export class ValidationMonitor extends EventEmitter {
  private static instance: ValidationMonitor;
  private metrics: ValidationMetrics;
  private alertThresholds: AlertThresholds;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private metricsUpdateInterval: NodeJS.Timeout | null = null;
  private isMonitoring: boolean = false;

  private constructor() {
    super();
    
    this.alertThresholds = {
      maxFailureRate: 5, // 5% максимальный процент ошибок
      maxValidationTime: AGENT_CONSTANTS.HANDOFF_VALIDATION.MAX_VALIDATION_TIME_MS,
      maxCorrectionAttempts: AGENT_CONSTANTS.HANDOFF_VALIDATION.MAX_AI_CORRECTION_ATTEMPTS,
      minSuccessRate: 95, // Минимум 95% успешных валидаций
      maxCriticalEvents: 3 // Максимум 3 критических события в окне
    };

    this.metrics = this.initializeMetrics();
    
    console.log('📊 ValidationMonitor initialized with zero tolerance settings');
  }

  public static getInstance(): ValidationMonitor {
    if (!ValidationMonitor.instance) {
      ValidationMonitor.instance = new ValidationMonitor();
    }
    return ValidationMonitor.instance;
  }

  /**
   * 🚀 ЗАПУСК МОНИТОРИНГА
   */
  public startMonitoring(options?: {
    metricsInterval?: number;
    healthCheckInterval?: number;
    windowSize?: number;
  }): void {
    if (this.isMonitoring) {
      console.warn('⚠️ Monitoring already started');
      return;
    }

    const metricsInterval = options?.metricsInterval || 10000; // 10 секунд
    const healthCheckInterval = options?.healthCheckInterval || 30000; // 30 секунд

    this.isMonitoring = true;

    // Основной мониторинг метрик
    this.metricsUpdateInterval = setInterval(() => {
      this.updateTimeWindowMetrics();
      this.checkAlerts();
      this.cleanupOldMetrics();
    }, metricsInterval);

    // Проверка здоровья системы
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
      this.analyzeSystemTrends();
      this.generateRecommendations();
    }, healthCheckInterval);

    console.log(`📊 Monitoring started - metrics every ${metricsInterval}ms, health checks every ${healthCheckInterval}ms`);
    this.emit('monitoring_started', { timestamp: Date.now() });
  }

  /**
   * 🛑 ОСТАНОВКА МОНИТОРИНГА
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) return;

    if (this.metricsUpdateInterval) {
      clearInterval(this.metricsUpdateInterval);
      this.metricsUpdateInterval = null;
    }

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.isMonitoring = false;
    console.log('🛑 Monitoring stopped');
    this.emit('monitoring_stopped', { timestamp: Date.now() });
  }

  /**
   * 📈 ЗАПИСЬ СОБЫТИЯ ВАЛИДАЦИИ
   */
  public recordValidation(event: {
    agentId: string;
    agentType: 'content' | 'design' | 'quality' | 'delivery';
    success: boolean;
    duration: number;
    validationType: string;
    errorDetails?: any;
    correctionAttempts?: number;
    toolsUsed?: string[];
  }): void {
    const timestamp = Date.now();

    // Обновляем общие метрики
    this.metrics.totalValidations++;
    
    if (event.success) {
      this.metrics.successfulValidations++;
    } else {
      this.metrics.failedValidations++;
      
      // Записываем критическое событие для неуспешной валидации
      this.recordCriticalEvent({
        type: 'validation_failure',
        severity: 'high',
        agentId: event.agentId,
        message: `Validation failed for ${event.agentType} agent`,
        details: {
          validationType: event.validationType,
          duration: event.duration,
          errorDetails: event.errorDetails
        }
      });
    }

    // Обновляем метрики производительности
    this.updatePerformanceMetrics(event.duration);
    
    // Обновляем метрики агента
    this.updateAgentMetrics(event);
    
    // Вычисляем новый success rate
    this.metrics.successRate = (this.metrics.successfulValidations / this.metrics.totalValidations) * 100;

    // Проверяем превышение времени валидации
    if (event.duration > this.alertThresholds.maxValidationTime) {
      this.recordCriticalEvent({
        type: 'timeout',
        severity: 'critical',
        agentId: event.agentId,
        message: `Validation timeout: ${event.duration}ms > ${this.alertThresholds.maxValidationTime}ms`,
        details: { duration: event.duration, threshold: this.alertThresholds.maxValidationTime }
      });
    }

    this.emit('validation_recorded', { ...event, timestamp });
  }

  /**
   * 🤖 ЗАПИСЬ СОБЫТИЯ AI КОРРЕКЦИИ
   */
  public recordCorrection(event: {
    agentId: string;
    success: boolean;
    attempts: number;
    correctionType: string;
    originalErrors: any[];
    correctedData?: any;
  }): void {
    const timestamp = Date.now();

    this.metrics.totalCorrections++;
    
    if (event.success) {
      this.metrics.successfulCorrections++;
    } else {
      this.metrics.failedCorrections++;
      
      // Критическое событие для неуспешной коррекции
      this.recordCriticalEvent({
        type: 'correction_failure',
        severity: 'critical',
        agentId: event.agentId,
        message: `AI correction failed after ${event.attempts} attempts`,
        details: {
          correctionType: event.correctionType,
          attempts: event.attempts,
          originalErrors: event.originalErrors
        }
      });
    }

    // Обновляем метрики коррекции
    this.metrics.correctionSuccessRate = (this.metrics.successfulCorrections / this.metrics.totalCorrections) * 100;
    this.metrics.averageCorrectionsPerValidation = this.metrics.totalCorrections / this.metrics.totalValidations;

    // Проверяем превышение попыток коррекции
    if (event.attempts > this.alertThresholds.maxCorrectionAttempts) {
      this.recordCriticalEvent({
        type: 'correction_failure',
        severity: 'high',
        agentId: event.agentId,
        message: `Excessive correction attempts: ${event.attempts}`,
        details: { attempts: event.attempts, threshold: this.alertThresholds.maxCorrectionAttempts }
      });
    }

    this.emit('correction_recorded', { ...event, timestamp });
  }

  /**
   * 🚨 ЗАПИСЬ КРИТИЧЕСКОГО СОБЫТИЯ
   */
  public recordCriticalEvent(event: Omit<CriticalEvent, 'id' | 'timestamp' | 'resolved'>): void {
    const criticalEvent: CriticalEvent = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      resolved: false,
      ...event
    };

    this.metrics.criticalEvents.push(criticalEvent);
    
    // Ограничиваем количество хранимых событий
    if (this.metrics.criticalEvents.length > 1000) {
      this.metrics.criticalEvents = this.metrics.criticalEvents.slice(-500);
    }

    console.error(`🚨 Critical event: ${event.type} - ${event.message}`, event.details);
    this.emit('critical_event', criticalEvent);

    // Немедленная проверка если событие критическое
    if (event.severity === 'critical') {
      this.checkCriticalAlerts();
    }
  }

  /**
   * ✅ РАЗРЕШЕНИЕ КРИТИЧЕСКОГО СОБЫТИЯ
   */
  public resolveCriticalEvent(eventId: string, resolutionDetails: string): void {
    const event = this.metrics.criticalEvents.find(e => e.id === eventId);
    if (event) {
      event.resolved = true;
      event.resolvedAt = Date.now();
      event.resolutionDetails = resolutionDetails;
      
      console.log(`✅ Critical event resolved: ${eventId}`);
      this.emit('critical_event_resolved', event);
    }
  }

  /**
   * 📊 ПОЛУЧЕНИЕ ТЕКУЩИХ МЕТРИК
   */
  public getMetrics(): ValidationMetrics {
    return { ...this.metrics };
  }

  /**
   * 🎯 ПОЛУЧЕНИЕ МЕТРИК АГЕНТА
   */
  public getAgentMetrics(agentId: string): AgentValidationMetrics | null {
    return this.metrics.agentMetrics[agentId] || null;
  }

  /**
   * 🔍 АНАЛИЗ ТРЕНДОВ
   */
  public getSystemTrends(windowCount: number = 10): {
    successRateTrend: number[];
    performanceTrend: number[];
    errorRateTrend: number[];
    recommendation: string;
  } {
    const recentWindows = this.metrics.metricsWindow.slice(-windowCount);
    
    const successRateTrend = recentWindows.map(w => (w.successes / w.validations) * 100);
    const performanceTrend = recentWindows.map(w => w.averageTime);
    const errorRateTrend = recentWindows.map(w => (w.failures / w.validations) * 100);

    const recommendation = this.generateTrendRecommendation(successRateTrend, performanceTrend, errorRateTrend);

    return {
      successRateTrend,
      performanceTrend,
      errorRateTrend,
      recommendation
    };
  }

  /**
   * 🔧 ОБНОВЛЕНИЕ НАСТРОЕК АЛЕРТОВ
   */
  public updateAlertThresholds(newThresholds: Partial<AlertThresholds>): void {
    this.alertThresholds = { ...this.alertThresholds, ...newThresholds };
    console.log('🔧 Alert thresholds updated:', this.alertThresholds);
    this.emit('thresholds_updated', this.alertThresholds);
  }

  /**
   * 🧹 ОЧИСТКА СТАРЫХ ДАННЫХ
   */
  public cleanup(): void {
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 дней

    // Очищаем старые события
    this.metrics.criticalEvents = this.metrics.criticalEvents.filter(
      event => (now - event.timestamp) < maxAge
    );

    // Очищаем старые временные окна
    this.metrics.metricsWindow = this.metrics.metricsWindow.filter(
      window => (now - window.timestamp) < maxAge
    );

    console.log('🧹 Old monitoring data cleaned up');
  }

  /**
   * PRIVATE METHODS
   */

  private initializeMetrics(): ValidationMetrics {
    return {
      totalValidations: 0,
      successfulValidations: 0,
      failedValidations: 0,
      successRate: 100,
      totalCorrections: 0,
      successfulCorrections: 0,
      failedCorrections: 0,
      correctionSuccessRate: 100,
      averageCorrectionsPerValidation: 0,
      averageValidationTime: 0,
      maxValidationTime: 0,
      minValidationTime: Infinity,
      validationsPerSecond: 0,
      agentMetrics: {},
      metricsWindow: [],
      criticalEvents: [],
      systemHealth: {
        status: 'healthy',
        lastCheck: Date.now(),
        healthScore: 100,
        uptime: 0,
        issues: [],
        recommendations: []
      }
    };
  }

  private updatePerformanceMetrics(duration: number): void {
    this.metrics.maxValidationTime = Math.max(this.metrics.maxValidationTime, duration);
    this.metrics.minValidationTime = Math.min(this.metrics.minValidationTime, duration);
    
    // Обновляем среднее время
    const totalTime = this.metrics.averageValidationTime * (this.metrics.totalValidations - 1) + duration;
    this.metrics.averageValidationTime = totalTime / this.metrics.totalValidations;
  }

  private updateAgentMetrics(event: any): void {
    if (!this.metrics.agentMetrics[event.agentId]) {
      this.metrics.agentMetrics[event.agentId] = {
        agentId: event.agentId,
        agentType: event.agentType,
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        averageExecutionTime: 0,
        validationSuccessRate: 100,
        correctionAttempts: 0,
        lastExecutionTime: 0,
        toolUsageStats: {},
        errorTypes: {}
      };
    }

    const agentMetrics = this.metrics.agentMetrics[event.agentId];
    agentMetrics.totalExecutions++;
    agentMetrics.lastExecutionTime = Date.now();

    if (event.success) {
      agentMetrics.successfulExecutions++;
    } else {
      agentMetrics.failedExecutions++;
    }

    agentMetrics.validationSuccessRate = (agentMetrics.successfulExecutions / agentMetrics.totalExecutions) * 100;
    
    // Обновляем среднее время выполнения агента
    const totalTime = agentMetrics.averageExecutionTime * (agentMetrics.totalExecutions - 1) + event.duration;
    agentMetrics.averageExecutionTime = totalTime / agentMetrics.totalExecutions;

    // Обновляем статистику использования инструментов
    if (event.toolsUsed) {
      event.toolsUsed.forEach((tool: string) => {
        agentMetrics.toolUsageStats[tool] = (agentMetrics.toolUsageStats[tool] || 0) + 1;
      });
    }

    if (event.correctionAttempts) {
      agentMetrics.correctionAttempts += event.correctionAttempts;
    }
  }

  private updateTimeWindowMetrics(): void {
    const now = Date.now();
    const windowDuration = 60000; // 1 минута
    const windowStart = now - windowDuration;

    // Получаем валидации за последнюю минуту
    const recentValidations = this.getRecentValidationsInWindow(windowStart, now);
    
    const windowMetrics: TimeWindowMetrics = {
      timestamp: now,
      windowDuration,
      validations: recentValidations.total,
      successes: recentValidations.successes,
      failures: recentValidations.failures,
      averageTime: recentValidations.averageTime,
      criticalErrors: recentValidations.criticalErrors
    };

    this.metrics.metricsWindow.push(windowMetrics);
    
    // Обновляем validations per second
    this.metrics.validationsPerSecond = recentValidations.total / (windowDuration / 1000);
  }

  private getRecentValidationsInWindow(start: number, end: number) {
    // Это упрощенная реализация - в реальности нужно отслеживать временные метки всех валидаций
    return {
      total: 0,
      successes: 0,
      failures: 0,
      averageTime: 0,
      criticalErrors: 0
    };
  }

  private checkAlerts(): void {
    // Проверка success rate
    if (this.metrics.successRate < this.alertThresholds.minSuccessRate) {
      this.recordCriticalEvent({
        type: 'system_error',
        severity: 'critical',
        message: `Success rate below threshold: ${this.metrics.successRate.toFixed(2)}%`,
        details: { currentRate: this.metrics.successRate, threshold: this.alertThresholds.minSuccessRate }
      });
    }

    // Проверка среднего времени валидации
    if (this.metrics.averageValidationTime > this.alertThresholds.maxValidationTime) {
      this.recordCriticalEvent({
        type: 'timeout',
        severity: 'high',
        message: `Average validation time exceeded: ${this.metrics.averageValidationTime.toFixed(2)}ms`,
        details: { currentTime: this.metrics.averageValidationTime, threshold: this.alertThresholds.maxValidationTime }
      });
    }
  }

  private checkCriticalAlerts(): void {
    const recentCriticalEvents = this.metrics.criticalEvents.filter(
      event => !event.resolved && (Date.now() - event.timestamp) < 300000 // последние 5 минут
    );

    if (recentCriticalEvents.length > this.alertThresholds.maxCriticalEvents) {
      console.error(`🚨 CRITICAL ALERT: ${recentCriticalEvents.length} unresolved critical events!`);
      this.emit('critical_alert', {
        type: 'multiple_critical_events',
        count: recentCriticalEvents.length,
        events: recentCriticalEvents
      });
    }
  }

  private performHealthCheck(): void {
    const now = Date.now();
    const issues: HealthIssue[] = [];
    let healthScore = 100;

    // Проверка success rate
    if (this.metrics.successRate < 95) {
      issues.push({
        type: 'low_success_rate',
        severity: 'high',
        message: `Success rate is ${this.metrics.successRate.toFixed(2)}%`,
        impact: 'Increased validation failures may affect system reliability',
        suggestedAction: 'Investigate root cause of validation failures'
      });
      healthScore -= 20;
    }

    // Проверка производительности
    if (this.metrics.averageValidationTime > this.alertThresholds.maxValidationTime * 0.8) {
      issues.push({
        type: 'slow_performance',
        severity: 'medium',
        message: `Average validation time is ${this.metrics.averageValidationTime.toFixed(2)}ms`,
        impact: 'Slower validations may impact user experience',
        suggestedAction: 'Optimize validation logic or increase resources'
      });
      healthScore -= 10;
    }

    // Проверка критических событий
    const unresolvedCritical = this.metrics.criticalEvents.filter(e => !e.resolved).length;
    if (unresolvedCritical > 0) {
      issues.push({
        type: 'unresolved_critical_events',
        severity: 'critical',
        message: `${unresolvedCritical} unresolved critical events`,
        impact: 'Critical events may indicate serious system problems',
        suggestedAction: 'Investigate and resolve critical events immediately'
      });
      healthScore -= 30;
    }

    // Определяем статус системы
    let status: SystemHealthStatus['status'] = 'healthy';
    if (healthScore < 50) status = 'critical';
    else if (healthScore < 70) status = 'degraded';
    else if (healthScore < 90) status = 'warning';

    this.metrics.systemHealth = {
      status,
      lastCheck: now,
      healthScore: Math.max(0, healthScore),
      uptime: now - (this.metrics.systemHealth.uptime || now),
      issues,
      recommendations: this.generateHealthRecommendations(issues)
    };

    this.emit('health_check_completed', this.metrics.systemHealth);
  }

  private generateHealthRecommendations(issues: HealthIssue[]): string[] {
    const recommendations: string[] = [];

    if (issues.some(i => i.type === 'low_success_rate')) {
      recommendations.push('Проанализировать логи ошибок валидации');
      recommendations.push('Проверить качество входных данных');
    }

    if (issues.some(i => i.type === 'slow_performance')) {
      recommendations.push('Оптимизировать алгоритмы валидации');
      recommendations.push('Рассмотреть кэширование результатов');
    }

    if (issues.some(i => i.type === 'unresolved_critical_events')) {
      recommendations.push('Немедленно разрешить критические события');
      recommendations.push('Улучшить процедуры обработки ошибок');
    }

    if (recommendations.length === 0) {
      recommendations.push('Система работает стабильно');
      recommendations.push('Продолжить мониторинг');
    }

    return recommendations;
  }

  private analyzeSystemTrends(): void {
    const trends = this.getSystemTrends(20);
    
    // Анализ трендов и выдача рекомендаций
    this.emit('trends_analyzed', trends);
  }

  private generateRecommendations(): void {
    const recommendations = this.metrics.systemHealth.recommendations;
    if (recommendations.length > 0) {
      this.emit('recommendations_generated', recommendations);
    }
  }

  private generateTrendRecommendation(successRate: number[], performance: number[], errorRate: number[]): string {
    if (successRate.length < 2) return 'Недостаточно данных для анализа трендов';

    const successTrend = this.calculateTrend(successRate);
    const perfTrend = this.calculateTrend(performance);
    const errorTrend = this.calculateTrend(errorRate);

    if (successTrend < -2) return 'КРИТИЧНО: Успешность валидаций снижается';
    if (perfTrend > 100) return 'ВНИМАНИЕ: Производительность ухудшается';
    if (errorTrend > 1) return 'ПРЕДУПРЕЖДЕНИЕ: Количество ошибок растет';

    return 'Система работает стабильно';
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const first = values[0];
    const last = values[values.length - 1];
    return last - first;
  }

  private cleanupOldMetrics(): void {
    const maxAge = 24 * 60 * 60 * 1000; // 24 часа
    const cutoff = Date.now() - maxAge;

    this.metrics.metricsWindow = this.metrics.metricsWindow.filter(
      window => window.timestamp > cutoff
    );
  }
}