/**
 * 🔍 MONITORING INTEGRATION TESTS
 * 
 * Тестирование интеграции системы мониторинга с валидаторами
 * Zero tolerance к ошибкам мониторинга
 */

// @ts-nocheck

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { ValidationMonitor } from '../monitoring/validation-monitor';
import { HandoffValidator } from '../validators/agent-handoff-validator';
import { AICorrector } from '../validators/ai-corrector';
import { createValidContentToDesignData } from './setup';

describe('🔍 Monitoring Integration', () => {
  let monitor: ValidationMonitor;
  let validator: HandoffValidator;
  let mockAICorrector: AICorrector;

  beforeEach(() => {
    // Получаем свежий экземпляр мониторинга
    monitor = ValidationMonitor.getInstance();
    
    // Останавливаем мониторинг если он был запущен
    monitor.stopMonitoring();
    
    // Очищаем старые данные
    monitor.cleanup();
    
    // Мок AI корректора
    mockAICorrector = {
      correctData: jest.fn().mockResolvedValue({
        ...createValidContentToDesignData(),
        corrected: true
      })
    } as any;
    
    validator = HandoffValidator.getInstance(mockAICorrector);
  });

  describe('📊 Метрики валидации', () => {
    test('записывает успешную валидацию', async () => {
      const validData = createValidContentToDesignData();
      
      const result = await validator.validateContentToDesign(validData, false);
      
      expect(result.isValid).toBe(true);
      
      const metrics = monitor.getMetrics();
      expect(metrics.totalValidations).toBe(1);
      expect(metrics.successfulValidations).toBe(1);
      expect(metrics.failedValidations).toBe(0);
      expect(metrics.successRate).toBe(100);
    });

    test('записывает неудачную валидацию', async () => {
      const invalidData = {
        invalid: 'data structure'
      };
      
      const result = await validator.validateContentToDesign(invalidData, false);
      
      expect(result.isValid).toBe(false);
      
      const metrics = monitor.getMetrics();
      expect(metrics.totalValidations).toBe(1);
      expect(metrics.successfulValidations).toBe(0);
      expect(metrics.failedValidations).toBe(1);
      expect(metrics.successRate).toBe(0);
    });

    test('записывает успешную AI коррекцию', async () => {
      const invalidData = {
        content_package: {
          complete_content: {
            subject: '', // Невалидный subject
            preheader: 'Test',
            body: 'Test',
            cta: 'Test'
          }
        }
      };
      
      const result = await validator.validateContentToDesign(invalidData, true);
      
      // AI коррекция должна сработать
      expect(mockAICorrector.correctData).toHaveBeenCalled();
      
      const metrics = monitor.getMetrics();
      expect(metrics.totalCorrections).toBe(1);
      expect(metrics.successfulCorrections).toBe(1);
      expect(metrics.correctionSuccessRate).toBe(100);
    });
  });

  describe('🚨 Критические события', () => {
    test('записывает критическое событие при превышении времени валидации', async () => {
      // Мокаем медленную валидацию
      const slowValidation = jest.fn().mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve(createValidContentToDesignData()), 1500); // 1.5 секунды
        });
      });
      
      // Записываем событие валидации с превышением времени
      monitor.recordValidation({
        agentId: 'test-agent',
        agentType: 'content',
        success: true,
        duration: 1500, // Превышает лимит в 1000мс
        validationType: 'test-validation'
      });
      
      const metrics = monitor.getMetrics();
      const criticalEvents = metrics.criticalEvents.filter(e => e.type === 'timeout');
      
      expect(criticalEvents.length).toBeGreaterThan(0);
      expect(criticalEvents[0].severity).toBe('critical');
      expect(criticalEvents[0].message).toContain('Validation timeout');
    });

    test('записывает критическое событие при провале AI коррекции', async () => {
      // Мокаем провал AI коррекции
      const failingCorrector = {
        correctData: jest.fn().mockRejectedValue(new Error('AI correction failed'))
      } as any;
      
      const validatorWithFailingCorrector = HandoffValidator.getInstance(failingCorrector);
      
      const invalidData = { invalid: 'structure' };
      
      const result = await validatorWithFailingCorrector.validateContentToDesign(invalidData, true);
      
      expect(result.isValid).toBe(false);
      
      const metrics = monitor.getMetrics();
      const correctionFailures = metrics.criticalEvents.filter(e => e.type === 'correction_failure');
      
      expect(correctionFailures.length).toBeGreaterThan(0);
    });
  });

  describe('📈 Производительность агентов', () => {
    test('отслеживает метрики отдельного агента', async () => {
      const validData = createValidContentToDesignData();
      
      // Выполняем несколько валидаций
      await validator.validateContentToDesign(validData, false);
      await validator.validateContentToDesign(validData, false);
      await validator.validateContentToDesign(validData, false);
      
      const agentMetrics = monitor.getAgentMetrics('content-specialist');
      
      expect(agentMetrics).toBeDefined();
      expect(agentMetrics!.totalExecutions).toBe(3);
      expect(agentMetrics!.successfulExecutions).toBe(3);
      expect(agentMetrics!.validationSuccessRate).toBe(100);
      expect(agentMetrics!.agentType).toBe('content');
    });

    test('вычисляет среднее время выполнения агента', async () => {
      const validData = createValidContentToDesignData();
      
      // Мокаем разные времена выполнения
      monitor.recordValidation({
        agentId: 'test-agent',
        agentType: 'content',
        success: true,
        duration: 100,
        validationType: 'test'
      });
      
      monitor.recordValidation({
        agentId: 'test-agent',
        agentType: 'content',
        success: true,
        duration: 200,
        validationType: 'test'
      });
      
      const agentMetrics = monitor.getAgentMetrics('test-agent');
      
      expect(agentMetrics!.averageExecutionTime).toBe(150); // (100 + 200) / 2
    });
  });

  describe('⚡ Real-time мониторинг', () => {
    test('запускает и останавливает мониторинг', () => {
      expect(() => {
        monitor.startMonitoring({
          metricsInterval: 1000,
          healthCheckInterval: 2000
        });
      }).not.toThrow();
      
      expect(() => {
        monitor.stopMonitoring();
      }).not.toThrow();
    });

    test('обновляет alert thresholds', () => {
      const newThresholds = {
        maxFailureRate: 10,
        minSuccessRate: 90
      };
      
      expect(() => {
        monitor.updateAlertThresholds(newThresholds);
      }).not.toThrow();
    });

    test('генерирует системные тренды', () => {
      // Добавляем несколько валидаций для анализа трендов
      monitor.recordValidation({
        agentId: 'trend-test',
        agentType: 'content',
        success: true,
        duration: 500,
        validationType: 'trend-analysis'
      });
      
      monitor.recordValidation({
        agentId: 'trend-test',
        agentType: 'content',
        success: false,
        duration: 800,
        validationType: 'trend-analysis'
      });
      
      const trends = monitor.getSystemTrends(5);
      
      expect(trends).toBeDefined();
      expect(trends.recommendation).toBeDefined();
      expect(typeof trends.recommendation).toBe('string');
    });
  });

  describe('🎯 Zero Tolerance алерты', () => {
    test('генерирует критический алерт при низком success rate', () => {
      // Имитируем множественные провалы валидации
      for (let i = 0; i < 20; i++) {
        monitor.recordValidation({
          agentId: `failing-agent-${i}`,
          agentType: 'content',
          success: false,
          duration: 500,
          validationType: 'failure-test',
          errorDetails: [{ message: 'Test failure' }]
        });
      }
      
      const metrics = monitor.getMetrics();
      expect(metrics.successRate).toBeLessThan(95); // Ниже порога
      
      // Проверяем, что система записала критические события
      const systemErrors = metrics.criticalEvents.filter(e => e.type === 'system_error');
      expect(systemErrors.length).toBeGreaterThan(0);
    });

    test('разрешает критические события', () => {
      // Создаем критическое событие
      monitor.recordCriticalEvent({
        type: 'validation_failure',
        severity: 'critical',
        message: 'Test critical event',
        details: { test: true }
      });
      
      const metrics = monitor.getMetrics();
      const unresolvedEvents = metrics.criticalEvents.filter(e => !e.resolved);
      expect(unresolvedEvents.length).toBe(1);
      
      const eventId = unresolvedEvents[0].id;
      
      // Разрешаем событие
      monitor.resolveCriticalEvent(eventId, 'Manually resolved for testing');
      
      const updatedMetrics = monitor.getMetrics();
      const resolvedEvent = updatedMetrics.criticalEvents.find(e => e.id === eventId);
      
      expect(resolvedEvent!.resolved).toBe(true);
      expect(resolvedEvent!.resolutionDetails).toBe('Manually resolved for testing');
    });
  });

  describe('🔍 System Health', () => {
    test('выполняет проверку здоровья системы', () => {
      // Запускаем мониторинг для активации health checks
      monitor.startMonitoring({
        metricsInterval: 100,
        healthCheckInterval: 200
      });
      
      // Ждем выполнения health check
      return new Promise<void>((resolve) => {
        monitor.once('health_check_completed', (healthStatus) => {
          expect(healthStatus).toBeDefined();
          expect(healthStatus.status).toBeDefined();
          expect(healthStatus.healthScore).toBeGreaterThanOrEqual(0);
          expect(healthStatus.healthScore).toBeLessThanOrEqual(100);
          
          monitor.stopMonitoring();
          resolve();
        });
      });
    });

    test('генерирует рекомендации по улучшению', () => {
      // Создаем проблемы в системе
      monitor.recordValidation({
        agentId: 'slow-agent',
        agentType: 'content',
        success: false,
        duration: 2000, // Медленная валидация
        validationType: 'slow-test',
        errorDetails: [{ message: 'Slow validation' }]
      });
      
      const trends = monitor.getSystemTrends(1);
      expect(trends.recommendation).toBeDefined();
      expect(trends.recommendation.length).toBeGreaterThan(0);
    });
  });

  describe('🧹 Очистка данных', () => {
    test('очищает старые метрики', () => {
      // Добавляем тестовые данные
      monitor.recordValidation({
        agentId: 'cleanup-test',
        agentType: 'content',
        success: true,
        duration: 500,
        validationType: 'cleanup-test'
      });
      
      expect(() => {
        monitor.cleanup();
      }).not.toThrow();
    });
  });
});