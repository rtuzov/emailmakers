/**
 * ⚖️ AUTO-SCALING MANAGER - Phase 3: Intelligent Auto-Scaling System
 * 
 * Интеллектуальная система автоматического масштабирования агентов и ресурсов
 * на основе машинного обучения с безопасными механизмами и human oversight.
 */

import { EventEmitter } from 'events';
import { MachineLearningEngine, AutoScalingDecision, MLConfig } from './machine-learning-engine';
import { HumanOversightDashboard } from '../phase2/human-oversight-dashboard';
import { OptimizationAnalyzer } from '../optimization-analyzer';
import { MetricsSnapshot } from '../optimization-types';

export interface AutoScalingConfig {
  enabled: boolean;
  
  // Scaling parameters
  min_agents: number;
  max_agents: number;
  target_cpu_utilization: number; // 0-100
  target_memory_utilization: number; // 0-100
  target_response_time_ms: number;
  
  // Safety and timing
  scale_up_threshold_percent: number; // Когда начинать масштабирование вверх
  scale_down_threshold_percent: number; // Когда начинать масштабирование вниз
  cooldown_period_minutes: number; // Минимальное время между операциями масштабирования
  warm_up_time_minutes: number; // Время прогрева новых агентов
  
  // Human oversight
  require_approval_for_major_scaling: boolean; // Требовать подтверждения для больших изменений
  major_scaling_threshold_percent: number; // Порог "больших" изменений
  emergency_scaling_enabled: boolean; // Экстренное масштабирование без подтверждения
  
  // ML integration
  ml_predictions_weight: number; // 0-1, вес ML предсказаний в решениях
  prediction_confidence_threshold: number; // Минимальная уверенность ML для автодействий
  learning_feedback_enabled: boolean; // Включить обратную связь для обучения
}

export interface ScalingOperation {
  operation_id: string;
  timestamp: string;
  operation_type: 'scale_up' | 'scale_down' | 'emergency_scale';
  
  // Agent information
  current_agents: number;
  target_agents: number;
  agents_changed: number;
  
  // Decision context
  trigger_reason: string;
  ml_prediction?: AutoScalingDecision;
  metrics_snapshot: MetricsSnapshot;
  
  // Execution details
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'rolled_back';
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  
  // Safety and approval
  requires_approval: boolean;
  approved_by?: string;
  safety_checks_passed: boolean;
  rollback_plan?: RollbackPlan;
  
  // Results
  success_metrics?: {
    new_response_time_ms: number;
    new_cpu_utilization: number;
    new_memory_utilization: number;
    performance_improvement_percent: number;
  };
  error_details?: string;
}

export interface RollbackPlan {
  rollback_to_agents: number;
  rollback_conditions: string[];
  automatic_rollback_enabled: boolean;
  rollback_timeout_minutes: number;
  monitoring_metrics: string[];
}

export interface AgentPool {
  pool_id: string;
  agent_type: string; // 'content-specialist', 'design-specialist', etc.
  current_instances: number;
  min_instances: number;
  max_instances: number;
  target_utilization: number;
  scaling_enabled: boolean;
  last_scaled: string;
  health_status: 'healthy' | 'degraded' | 'failed';
}

export interface ScalingMetrics {
  total_operations: number;
  successful_operations: number;
  failed_operations: number;
  avg_operation_duration_ms: number;
  
  current_total_agents: number;
  peak_agents_today: number;
  min_agents_today: number;
  
  scaling_efficiency: number; // % улучшения производительности после масштабирования
  cost_optimization: number; // % экономии ресурсов
  
  ml_prediction_accuracy: number;
  human_intervention_rate: number;
}

export class AutoScalingManager extends EventEmitter {
  private config: AutoScalingConfig;
  private mlEngine: MachineLearningEngine;
  private oversightDashboard: HumanOversightDashboard;
  private analyzer: OptimizationAnalyzer;
  
  private agentPools: Map<string, AgentPool> = new Map();
  private scalingOperations: ScalingOperation[] = [];
  private lastScalingTime: Date = new Date(0);
  private isRunning: boolean = false;

  constructor(
    mlEngine: MachineLearningEngine,
    oversightDashboard: HumanOversightDashboard,
    analyzer: OptimizationAnalyzer,
    config: Partial<AutoScalingConfig> = {}
  ) {
    super();
    
    this.mlEngine = mlEngine;
    this.oversightDashboard = oversightDashboard;
    this.analyzer = analyzer;
    this.config = this.mergeDefaultConfig(config);
    
    this.initializeAgentPools();
    this.setupEventHandlers();
    
    console.log('⚖️ AutoScalingManager initialized with config:', this.config);
  }

  /**
   * Запуск системы автоматического масштабирования
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('⚠️ AutoScalingManager already running');
      return;
    }

    console.log('🚀 Starting AutoScalingManager...');
    this.isRunning = true;

    // Запускаем мониторинг и принятие решений
    this.startScalingMonitor();

    this.emit('started');
    console.log('✅ AutoScalingManager started successfully');
  }

  /**
   * Остановка системы
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) return;

    console.log('🛑 Stopping AutoScalingManager...');
    this.isRunning = false;

    this.emit('stopped');
    console.log('✅ AutoScalingManager stopped');
  }

  /**
   * Выполнение решения о масштабировании
   */
  public async executeScalingDecision(decision: AutoScalingDecision, forceExecution: boolean = false): Promise<ScalingOperation> {
    console.log(`⚖️ Executing scaling decision: ${decision.action} to ${decision.target_agents} agents`);

    // Проверяем cooldown период
    if (!forceExecution && !this.canExecuteScaling()) {
      throw new Error(`Scaling cooldown active. Next scaling available in ${this.getCooldownRemainingMinutes()} minutes`);
    }

    // Симулируем анализ системы
    const currentAnalysis = {
      current_state: {
        timestamp: new Date().toISOString(),
        system_metrics: {
          active_agents: 4,
          system_health_score: 85,
          average_response_time: 1200,
          overall_success_rate: 92,
          total_requests: 1000,
          critical_events: 2
        },
        agent_metrics: {
          'content-specialist': {
            agent_id: 'content-specialist',
            response_time_ms: 1100,
            success_rate: 94,
            error_count: 15,
            throughput_per_minute: 25,
            memory_usage_mb: 256,
            cpu_usage_percent: 45,
            last_activity: new Date().toISOString()
          },
          'design-specialist': {
            agent_id: 'design-specialist',
            response_time_ms: 1300,
            success_rate: 96,
            error_count: 8,
            throughput_per_minute: 20,
            memory_usage_mb: 312,
            cpu_usage_percent: 38,
            last_activity: new Date().toISOString()
          },
          'quality-specialist': {
            agent_id: 'quality-specialist',
            response_time_ms: 1400,
            success_rate: 91,
            error_count: 27,
            throughput_per_minute: 30,
            memory_usage_mb: 428,
            cpu_usage_percent: 62,
            last_activity: new Date().toISOString()
          },
          'delivery-specialist': {
            agent_id: 'delivery-specialist',
            response_time_ms: 1000,
            success_rate: 89,
            error_count: 27,
            throughput_per_minute: 25,
            memory_usage_mb: 234,
            cpu_usage_percent: 41,
            last_activity: new Date().toISOString()
          }
        },
        validation_metrics: {
          total_validations: 1000,
          validation_success_rate: 95,
          average_validation_time: 200,
          failed_validations: 50,
          quality_score_average: 87,
          compatibility_score_average: 92
        }
      },
      trends: await this.analyzer.analyzePerformanceTrends(24),
      bottlenecks: await this.analyzer.identifyBottlenecks(),
      error_patterns: await this.analyzer.analyzeErrorPatterns(),
      predicted_issues: await this.analyzer.predictPerformanceIssues(),
      optimization_opportunities: ['Optimize agent memory usage', 'Improve response time consistency'],
      overall_health_assessment: 'System is performing well with minor optimization opportunities'
    };
    const currentAgents = currentAnalysis.current_state.system_metrics.active_agents;

    const operation: ScalingOperation = {
      operation_id: `scaling-op-${Date.now()}`,
      timestamp: new Date().toISOString(),
      operation_type: decision.action === 'scale_up' ? 'scale_up' : 'scale_down',
      current_agents: currentAgents,
      target_agents: decision.target_agents,
      agents_changed: Math.abs(decision.target_agents - currentAgents),
      trigger_reason: decision.reasoning,
      ml_prediction: decision,
      metrics_snapshot: currentAnalysis.current_state as any,
      status: 'pending',
      started_at: new Date().toISOString(),
      requires_approval: this.requiresHumanApproval(decision),
      safety_checks_passed: decision.safety_checks_passed,
      rollback_plan: this.generateRollbackPlan(decision)
    };

    try {
      // Проверяем требование подтверждения
      if (operation.requires_approval && !forceExecution) {
        const approvalResult = await this.requestHumanApproval(operation);
        if (!approvalResult.approved) {
          operation.status = 'failed';
          operation.error_details = 'Human approval denied';
          this.scalingOperations.push(operation);
          throw new Error('Scaling operation denied by human oversight');
        }
        operation.approved_by = approvalResult.approver;
      }

      // Выполняем масштабирование
      operation.status = 'in_progress';
      this.scalingOperations.push(operation);
      this.emit('scaling_started', operation);

      const executionResult = await this.performScaling(operation);
      
      operation.status = 'completed';
      operation.completed_at = new Date().toISOString();
      operation.duration_ms = Date.now() - new Date(operation.started_at).getTime();
      operation.success_metrics = executionResult;

      this.lastScalingTime = new Date();

      console.log(`✅ Scaling operation completed: ${operation.operation_id}`);
      this.emit('scaling_completed', operation);

      // Запускаем мониторинг результатов
      this.startPostScalingMonitoring(operation);

      return operation;

    } catch (error) {
      operation.status = 'failed';
      operation.completed_at = new Date().toISOString();
      operation.duration_ms = Date.now() - new Date(operation.started_at).getTime();
      operation.error_details = error instanceof Error ? error.message : 'Unknown error';

      console.error(`❌ Scaling operation failed: ${operation.operation_id}`, error);
      this.emit('scaling_failed', operation);

      throw error;
    }
  }

  /**
   * Экстренное масштабирование в критических ситуациях
   */
  public async emergencyScaling(targetAgents: number, reason: string): Promise<ScalingOperation> {
    console.log(`🚨 Emergency scaling triggered: ${reason}`);

    if (!this.config.emergency_scaling_enabled) {
      throw new Error('Emergency scaling is disabled');
    }

    // Симулируем анализ системы
    const currentAnalysis = {
      current_state: {
        timestamp: new Date().toISOString(),
        system_metrics: {
          active_agents: 4,
          system_health_score: 85,
          average_response_time: 1200,
          overall_success_rate: 92,
          total_requests: 1000,
          critical_events: 2
        },
        agent_metrics: {
          'content-specialist': {
            agent_id: 'content-specialist',
            response_time_ms: 1100,
            success_rate: 94,
            error_count: 15,
            throughput_per_minute: 25,
            memory_usage_mb: 256,
            cpu_usage_percent: 45,
            last_activity: new Date().toISOString()
          },
          'design-specialist': {
            agent_id: 'design-specialist',
            response_time_ms: 1300,
            success_rate: 96,
            error_count: 8,
            throughput_per_minute: 20,
            memory_usage_mb: 312,
            cpu_usage_percent: 38,
            last_activity: new Date().toISOString()
          },
          'quality-specialist': {
            agent_id: 'quality-specialist',
            response_time_ms: 1400,
            success_rate: 91,
            error_count: 27,
            throughput_per_minute: 30,
            memory_usage_mb: 428,
            cpu_usage_percent: 62,
            last_activity: new Date().toISOString()
          },
          'delivery-specialist': {
            agent_id: 'delivery-specialist',
            response_time_ms: 1000,
            success_rate: 89,
            error_count: 27,
            throughput_per_minute: 25,
            memory_usage_mb: 234,
            cpu_usage_percent: 41,
            last_activity: new Date().toISOString()
          }
        },
        validation_metrics: {
          total_validations: 1000,
          validation_success_rate: 95,
          average_validation_time: 200,
          failed_validations: 50,
          quality_score_average: 87,
          compatibility_score_average: 92
        }
      },
      trends: await this.analyzer.analyzePerformanceTrends(24),
      bottlenecks: await this.analyzer.identifyBottlenecks(),
      error_patterns: await this.analyzer.analyzeErrorPatterns(),
      predicted_issues: await this.analyzer.predictPerformanceIssues(),
      optimization_opportunities: ['Optimize agent memory usage', 'Improve response time consistency'],
      overall_health_assessment: 'System is performing well with minor optimization opportunities'
    };
    const currentAgents = currentAnalysis.current_state.system_metrics.active_agents;

    const emergencyDecision: AutoScalingDecision = {
      decision_id: `emergency-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: targetAgents > currentAgents ? 'scale_up' : 'scale_down',
      current_agents: currentAgents,
      target_agents: targetAgents,
      confidence: 100,
      reasoning: `EMERGENCY: ${reason}`,
      predicted_load: 100,
      current_load: 100,
      safety_checks_passed: true
    };

    return await this.executeScalingDecision(emergencyDecision, true);
  }

  /**
   * Откат последней операции масштабирования
   */
  public async rollbackLastScaling(): Promise<ScalingOperation> {
    const lastOperation = this.scalingOperations
      .filter(op => op.status === 'completed')
      .sort((a, b) => new Date(b.completed_at || '').getTime() - new Date(a.completed_at || '').getTime())[0];

    if (!lastOperation || !lastOperation.rollback_plan) {
      throw new Error('No recent scaling operation found to rollback');
    }

    console.log(`🔙 Rolling back scaling operation: ${lastOperation.operation_id}`);

    const rollbackDecision: AutoScalingDecision = {
      decision_id: `rollback-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: lastOperation.rollback_plan.rollback_to_agents > lastOperation.current_agents ? 'scale_up' : 'scale_down',
      current_agents: lastOperation.target_agents,
      target_agents: lastOperation.rollback_plan.rollback_to_agents,
      confidence: 100,
      reasoning: `Rollback of operation ${lastOperation.operation_id}`,
      predicted_load: 50,
      current_load: 50,
      safety_checks_passed: true
    };

    const rollbackOperation = await this.executeScalingDecision(rollbackDecision, true);
    
    // Отмечаем исходную операцию как откаченную
    lastOperation.status = 'rolled_back';
    
    this.emit('scaling_rolled_back', { original: lastOperation, rollback: rollbackOperation });
    return rollbackOperation;
  }

  /**
   * Получение текущих метрик масштабирования
   */
  public getScalingMetrics(): ScalingMetrics {
    const operations = this.scalingOperations;
    const successful = operations.filter(op => op.status === 'completed');
    const failed = operations.filter(op => op.status === 'failed');

    const currentTotalAgents = Array.from(this.agentPools.values())
      .reduce((sum, pool) => sum + pool.current_instances, 0);

    const today = new Date().toDateString();
    const todayOperations = operations.filter(op => 
      new Date(op.timestamp).toDateString() === today
    );

    return {
      total_operations: operations.length,
      successful_operations: successful.length,
      failed_operations: failed.length,
      avg_operation_duration_ms: successful.length > 0 ? 
        successful.reduce((sum, op) => sum + (op.duration_ms || 0), 0) / successful.length : 0,
      
      current_total_agents: currentTotalAgents,
      peak_agents_today: Math.max(...todayOperations.map(op => op.target_agents), currentTotalAgents),
      min_agents_today: Math.min(...todayOperations.map(op => op.target_agents), currentTotalAgents),
      
      scaling_efficiency: this.calculateScalingEfficiency(successful),
      cost_optimization: this.calculateCostOptimization(),
      
      ml_prediction_accuracy: this.calculateMLAccuracy(),
      human_intervention_rate: operations.filter(op => op.requires_approval).length / Math.max(operations.length, 1) * 100
    };
  }

  /**
   * Получение истории операций масштабирования
   */
  public getScalingHistory(limit: number = 50): ScalingOperation[] {
    return this.scalingOperations
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Получение информации о пулах агентов
   */
  public getAgentPools(): AgentPool[] {
    return Array.from(this.agentPools.values());
  }

  // ===== PRIVATE METHODS =====

  private mergeDefaultConfig(config: Partial<AutoScalingConfig>): AutoScalingConfig {
    return {
      enabled: true,
      min_agents: 2,
      max_agents: 10,
      target_cpu_utilization: 70,
      target_memory_utilization: 75,
      target_response_time_ms: 1500,
      scale_up_threshold_percent: 80,
      scale_down_threshold_percent: 30,
      cooldown_period_minutes: 10,
      warm_up_time_minutes: 5,
      require_approval_for_major_scaling: true,
      major_scaling_threshold_percent: 50,
      emergency_scaling_enabled: true,
      ml_predictions_weight: 0.7,
      prediction_confidence_threshold: 75,
      learning_feedback_enabled: true,
      ...config
    };
  }

  private initializeAgentPools(): void {
    const agentTypes = [
      'content-specialist',
      'design-specialist',
      'quality-specialist',
      'delivery-specialist'
    ];

    agentTypes.forEach(agentType => {
      const pool: AgentPool = {
        pool_id: `pool-${agentType}`,
        agent_type: agentType,
        current_instances: 2,
        min_instances: 1,
        max_instances: Math.floor(this.config.max_agents / agentTypes.length),
        target_utilization: this.config.target_cpu_utilization,
        scaling_enabled: true,
        last_scaled: new Date().toISOString(),
        health_status: 'healthy'
      };
      
      this.agentPools.set(agentType, pool);
    });

    console.log(`🏊 Initialized ${this.agentPools.size} agent pools`);
  }

  private setupEventHandlers(): void {
    this.mlEngine.on('scaling_decision_made', async (decision: AutoScalingDecision) => {
      if (decision.confidence >= this.config.prediction_confidence_threshold) {
        try {
          await this.executeScalingDecision(decision);
        } catch (error) {
          console.error('❌ Failed to execute ML scaling decision:', error);
        }
      }
    });

    this.oversightDashboard.on('decision_submitted', (data) => {
      console.log(`👤 Human decision received for scaling: ${data.decision.decision}`);
    });
  }

  private canExecuteScaling(): boolean {
    const cooldownMs = this.config.cooldown_period_minutes * 60 * 1000;
    return Date.now() - this.lastScalingTime.getTime() >= cooldownMs;
  }

  private getCooldownRemainingMinutes(): number {
    const cooldownMs = this.config.cooldown_period_minutes * 60 * 1000;
    const remainingMs = cooldownMs - (Date.now() - this.lastScalingTime.getTime());
    return Math.max(0, Math.ceil(remainingMs / (60 * 1000)));
  }

  private requiresHumanApproval(decision: AutoScalingDecision): boolean {
    if (!this.config.require_approval_for_major_scaling) return false;
    
    const changePercent = Math.abs(decision.target_agents - decision.current_agents) / decision.current_agents * 100;
    return changePercent >= this.config.major_scaling_threshold_percent;
  }

  private generateRollbackPlan(decision: AutoScalingDecision): RollbackPlan {
    return {
      rollback_to_agents: decision.current_agents,
      rollback_conditions: [
        'Response time increases by >50%',
        'Error rate increases by >25%',
        'System health score drops below 60'
      ],
      automatic_rollback_enabled: true,
      rollback_timeout_minutes: 30,
      monitoring_metrics: ['response_time', 'error_rate', 'system_health']
    };
  }

  private async requestHumanApproval(operation: ScalingOperation): Promise<{approved: boolean, approver?: string}> {
    console.log(`👤 Requesting human approval for scaling operation: ${operation.operation_id}`);

    const decisionRequest = await this.oversightDashboard.createDecisionRequest(
      'optimization_approval',
      {
        operation_id: operation.operation_id,
        scaling_details: operation,
        recommendation: {
          title: `Scaling ${operation.operation_type.replace('_', ' ')} to ${operation.target_agents} agents`,
          description: operation.trigger_reason,
          safety_assessment: { risk_level: operation.requires_approval ? 'medium' : 'low' }
        }
      },
      'high'
    );

    // Симуляция ожидания решения (в реальности это будет через events)
    return new Promise((resolve) => {
      setTimeout(() => {
        // Симулируем одобрение
        resolve({ approved: true, approver: 'System Administrator' });
      }, 1000);
    });
  }

  private async performScaling(operation: ScalingOperation): Promise<ScalingOperation['success_metrics']> {
    console.log(`🔧 Performing scaling operation: ${operation.operation_id}`);

    // Симуляция выполнения масштабирования
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Обновляем пулы агентов
    const agentChange = operation.target_agents - operation.current_agents;
    const agentPools = Array.from(this.agentPools.values());
    const changePerPool = Math.ceil(Math.abs(agentChange) / agentPools.length);

    agentPools.forEach(pool => {
      if (agentChange > 0) {
        pool.current_instances = Math.min(
          pool.current_instances + changePerPool,
          pool.max_instances
        );
      } else if (agentChange < 0) {
        pool.current_instances = Math.max(
          pool.current_instances - changePerPool,
          pool.min_instances
        );
      }
      pool.last_scaled = new Date().toISOString();
    });

    // Симуляция улучшенных метрик
    return {
      new_response_time_ms: Math.max(500, 1500 - (agentChange * 100)),
      new_cpu_utilization: Math.max(30, 70 - (agentChange * 5)),
      new_memory_utilization: Math.max(35, 75 - (agentChange * 4)),
      performance_improvement_percent: Math.max(0, agentChange * 3)
    };
  }

  private startScalingMonitor(): void {
    const intervalMs = 5 * 60 * 1000; // 5 minutes

    setInterval(async () => {
      if (this.isRunning && this.config.enabled) {
        try {
          await this.evaluateScalingNeed();
        } catch (error) {
          console.error('❌ Scaling evaluation failed:', error);
        }
      }
    }, intervalMs);

    console.log(`📊 Scaling monitor started (interval: ${intervalMs}ms)`);
  }

  private async evaluateScalingNeed(): Promise<void> {
    if (!this.canExecuteScaling()) return;

    // Симулируем анализ системы
    const currentAnalysis = {
      current_state: {
        timestamp: new Date().toISOString(),
        system_metrics: {
          active_agents: 4,
          system_health_score: 85,
          average_response_time: 1200,
          overall_success_rate: 92,
          total_requests: 1000,
          critical_events: 2
        },
        agent_metrics: {
          'content-specialist': {
            agent_id: 'content-specialist',
            response_time_ms: 1100,
            success_rate: 94,
            error_count: 15,
            throughput_per_minute: 25,
            memory_usage_mb: 256,
            cpu_usage_percent: 45,
            last_activity: new Date().toISOString()
          },
          'design-specialist': {
            agent_id: 'design-specialist',
            response_time_ms: 1300,
            success_rate: 96,
            error_count: 8,
            throughput_per_minute: 20,
            memory_usage_mb: 312,
            cpu_usage_percent: 38,
            last_activity: new Date().toISOString()
          },
          'quality-specialist': {
            agent_id: 'quality-specialist',
            response_time_ms: 1400,
            success_rate: 91,
            error_count: 27,
            throughput_per_minute: 30,
            memory_usage_mb: 428,
            cpu_usage_percent: 62,
            last_activity: new Date().toISOString()
          },
          'delivery-specialist': {
            agent_id: 'delivery-specialist',
            response_time_ms: 1000,
            success_rate: 89,
            error_count: 27,
            throughput_per_minute: 25,
            memory_usage_mb: 234,
            cpu_usage_percent: 41,
            last_activity: new Date().toISOString()
          }
        },
        validation_metrics: {
          total_validations: 1000,
          validation_success_rate: 95,
          average_validation_time: 200,
          failed_validations: 50,
          quality_score_average: 87,
          compatibility_score_average: 92
        }
      },
      trends: await this.analyzer.analyzePerformanceTrends(24),
      bottlenecks: await this.analyzer.identifyBottlenecks(),
      error_patterns: await this.analyzer.analyzeErrorPatterns(),
      predicted_issues: await this.analyzer.predictPerformanceIssues(),
      optimization_opportunities: ['Optimize agent memory usage', 'Improve response time consistency'],
      overall_health_assessment: 'System is performing well with minor optimization opportunities'
    };
    const healthScore = currentAnalysis.current_state.system_metrics.system_health_score;
    const responseTime = currentAnalysis.current_state.system_metrics.average_response_time;

    // Простые правила для демонстрации
    if (healthScore < 60 || responseTime > this.config.target_response_time_ms * 1.5) {
      console.log('⚖️ Performance degradation detected, considering scale-up');
      // ML engine will handle this through its own monitoring
    } else if (healthScore > 90 && responseTime < this.config.target_response_time_ms * 0.5) {
      console.log('⚖️ Over-provisioning detected, considering scale-down');
      // ML engine will handle this through its own monitoring
    }
  }

  private startPostScalingMonitoring(operation: ScalingOperation): void {
    const monitoringDuration = this.config.warm_up_time_minutes * 60 * 1000;
    
    setTimeout(async () => {
      try {
        // Симулируем анализ после масштабирования
      const postScalingAnalysis = {
        current_state: {
          system_metrics: {
            active_agents: operation.target_agents,
            system_health_score: 90,
            average_response_time: 1000,
            overall_success_rate: 95
          }
        }
      };
        
        // Генерируем обратную связь для ML
        if (this.config.learning_feedback_enabled && operation.ml_prediction) {
          const feedback = {
            feedback_id: `feedback-${Date.now()}`,
            prediction_id: operation.ml_prediction.decision_id,
            actual_outcome: postScalingAnalysis.current_state.system_metrics.system_health_score,
            predicted_outcome: operation.ml_prediction.predicted_load,
            accuracy_score: this.calculatePredictionAccuracy(operation, postScalingAnalysis),
            timestamp: new Date().toISOString(),
            context: { operation_id: operation.operation_id }
          };

          await this.mlEngine.trainModelWithFeedback([feedback]);
        }

        console.log(`📊 Post-scaling monitoring completed for operation: ${operation.operation_id}`);
        this.emit('post_scaling_analysis', { operation, analysis: postScalingAnalysis });

      } catch (error) {
        console.error('❌ Post-scaling monitoring failed:', error);
      }
    }, monitoringDuration);
  }

  private calculatePredictionAccuracy(operation: ScalingOperation, analysis: any): number {
    if (!operation.ml_prediction) return 0;
    
    const predicted = operation.ml_prediction.predicted_load;
    const actual = analysis.current_state.system_metrics.system_health_score;
    
    return Math.max(0, 100 - Math.abs(predicted - actual));
  }

  private calculateScalingEfficiency(successfulOperations: ScalingOperation[]): number {
    if (successfulOperations.length === 0) return 0;

    const avgImprovement = successfulOperations
      .filter(op => op.success_metrics)
      .reduce((sum, op) => sum + (op.success_metrics?.performance_improvement_percent || 0), 0) / successfulOperations.length;

    return Math.round(avgImprovement);
  }

  private calculateCostOptimization(): number {
    // Простая формула оптимизации затрат
    const currentAgents = Array.from(this.agentPools.values())
      .reduce((sum, pool) => sum + pool.current_instances, 0);
    
    const maxPossibleAgents = Array.from(this.agentPools.values())
      .reduce((sum, pool) => sum + pool.max_instances, 0);

    return Math.round((1 - currentAgents / maxPossibleAgents) * 100);
  }

  private calculateMLAccuracy(): number {
    const mlMetrics = this.mlEngine.getModelMetrics();
    return mlMetrics.recent_accuracy || 0;
  }
}