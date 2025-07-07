/**
 * 🚀 DELIVERY SPECIALIST AGENT V2
 * 
 * Модульный специализированный агент для доставки и развертывания
 * Использует новую архитектуру с выделенными сервисами:
 * - UploadService: загрузка активов
 * - ScreenshotService: генерация скриншотов 
 * - DeploymentService: развертывание и жизненный цикл
 * 
 * Совместимость с OpenAI Agents SDK v2
 */

import { z } from 'zod';
import { Agent, run } from '@openai/agents';

// Import new modular services
import {
  UploadService,
  ScreenshotService,
  DeploymentService,
  DeliverySpecialistInput,
  DeliverySpecialistOutput,
  DeliveryUtils
} from './delivery/services';

// Import validation and utilities
import { HandoffValidator } from '../validators/agent-handoff-validator';
import { DeliverySpecialistValidator } from '../validators/delivery-specialist-validator';
import { AICorrector, HandoffType } from '../validators/ai-corrector';
import { runWithTimeout } from '../utils/run-with-timeout';
import { BaseSpecialistAgent } from '../core/base-specialist-agent';
import { createAgentRunConfig } from '../utils/tracing-utils';
import { getUsageModel } from '../../shared/utils/model-config';

// Import consolidated tools for better tracing
import { 
  deliveryManagerTool,
  fileOrganizerTool,
  htmlValidatorTool
} from '../modules/agent-tools';

import {
  QualityToDeliveryHandoffData,
  HandoffValidationResult,
  AGENT_CONSTANTS
} from '../types/base-agent-types';

export class DeliverySpecialistAgentV2 extends BaseSpecialistAgent {
  private handoffValidator: HandoffValidator;
  private deliveryValidator: DeliverySpecialistValidator;
  private aiCorrector: AICorrector;
  
  // Service instances
  private uploadService: UploadService;
  private screenshotService: ScreenshotService;
  private deploymentService: DeploymentService;
  
  // Performance monitoring
  private performanceMetrics = {
    averageExecutionTime: 0,
    successRate: 0,
    toolUsageStats: new Map<string, number>(),
    totalExecutions: 0,
    totalSuccesses: 0,
    validationSuccessRate: 0,
    correctionAttempts: 0
  };

  constructor() {
    // Initialize with consolidated tools for enhanced tracing
    super('delivery-specialist-v2', 'placeholder', [
      deliveryManagerTool,
      fileOrganizerTool,
      htmlValidatorTool
    ]);
    
    // Initialize services
    this.uploadService = new UploadService();
    this.screenshotService = new ScreenshotService();
    this.deploymentService = new DeploymentService();
    
    // Initialize validators
    this.aiCorrector = new AICorrector();
    this.handoffValidator = HandoffValidator.getInstance(this.aiCorrector);
    this.deliveryValidator = DeliverySpecialistValidator.getInstance();
    
    // Configure agent
    (this.agent as Agent).instructions = this.getSpecialistInstructions();
    (this.agent as Agent).model = getUsageModel();
    (this.agent as Agent).modelSettings = {
      temperature: 0.4,
      maxTokens: 12000,
      toolChoice: 'auto',
    } as any;

    console.log(`🚀 DeliverySpecialistAgentV2 initialized with modular services: ${this.agentId}`);
  }

  /**
   * Главный метод обработки задач доставки
   */
  async processDeliveryTask(input: DeliverySpecialistInput): Promise<DeliverySpecialistOutput> {
    const startTime = Date.now();
    
    try {
      console.log(`📦 Processing delivery task: ${input.task_type}`);
      
      // Валидация входных данных
      const validation = DeliveryUtils.validateTaskInput(input);
      if (!validation.valid) {
        throw new Error(`Input validation failed: ${validation.errors.join(', ')}`);
      }

      // Валидация и коррекция handoff данных
      if (input.handoff_data) {
        input.handoff_data = await this.validateAndCorrectHandoffData(
          input.handoff_data, 
          'quality_to_delivery'
        );
      }

      let taskResult: any;
      let artifacts: any = {};

      // Роутинг по типу задачи к соответствующему сервису
      switch (input.task_type) {
        case 'upload_assets':
          taskResult = await this.uploadService.handleAssetUpload(input);
          artifacts = DeliveryUtils.buildArtifacts('upload_assets', taskResult);
          break;

        case 'generate_screenshots':
          taskResult = await this.screenshotService.handleScreenshotGeneration(input);
          artifacts = DeliveryUtils.buildArtifacts('generate_screenshots', taskResult);
          break;

        case 'deploy_campaign':
          taskResult = await this.deploymentService.handleCampaignDeployment(input);
          artifacts = DeliveryUtils.buildArtifacts('deploy_campaign', taskResult);
          break;

        case 'visual_testing':
          taskResult = await this.deploymentService.handleVisualTesting(input);
          artifacts = DeliveryUtils.buildArtifacts('visual_testing', taskResult);
          break;

        case 'monitor_performance':
          taskResult = await this.deploymentService.handlePerformanceMonitoring(input);
          artifacts = DeliveryUtils.buildArtifacts('monitor_performance', taskResult);
          break;

        case 'finalize_delivery':
          taskResult = await this.deploymentService.handleDeliveryFinalization(input);
          artifacts = DeliveryUtils.buildArtifacts('finalize_delivery', taskResult);
          break;

        default:
          throw new Error(`Unknown task type: ${input.task_type}`);
      }

      // Обновление метрик производительности
      this.updatePerformanceMetrics(startTime, true);

      // Построение результата
      const result = this.buildDeliveryOutput(
        input,
        taskResult,
        artifacts,
        startTime
      );

      console.log(`✅ Delivery task completed: ${input.task_type} in ${Date.now() - startTime}ms`);
      return result;

    } catch (error) {
      console.error(`❌ Delivery task failed: ${input.task_type}`, error);
      
      this.updatePerformanceMetrics(startTime, false);
      
      return this.buildErrorOutput(input, error as Error, startTime);
    }
  }

  /**
   * Строит успешный результат доставки
   */
  private buildDeliveryOutput(
    input: DeliverySpecialistInput,
    taskResult: any,
    artifacts: any,
    startTime: number
  ): DeliverySpecialistOutput {
    const executionTime = Date.now() - startTime;
    
    return {
      success: true,
      task_type: input.task_type,
      results: this.mapTaskResults(input.task_type, taskResult),
      delivery_artifacts: artifacts,
      deployment_status: {
        environment: input.deployment_config?.environment || 'staging',
        status: this.determineDeploymentStatus(taskResult),
        deployment_id: taskResult.deployment_data?.deployment_id || DeliveryUtils.generateId(),
        rollback_available: input.deployment_config?.environment === 'production',
        monitoring_active: input.deployment_config?.auto_monitoring || false
      },
      performance_metrics: {
        deployment_time: taskResult.performance_metrics?.task_duration_ms || executionTime,
        asset_upload_time: taskResult.performance_metrics?.processing_time_breakdown?.upload_ms || 0,
        total_file_size: this.calculateTotalFileSize(input),
        cdn_propagation_time: this.estimateCdnPropagation(input),
        success_rate: taskResult.success ? 100 : 0,
        task_duration_ms: executionTime,
        processing_time_breakdown: taskResult.performance_metrics?.processing_time_breakdown || {
          validation_ms: executionTime * 0.1,
          deployment_ms: executionTime * 0.8,
          monitoring_ms: executionTime * 0.1
        },
        resource_usage: taskResult.performance_metrics?.resource_usage || {
          memory_peak_mb: process.memoryUsage().heapUsed / 1024 / 1024,
          cpu_usage_percent: 0,
          network_bandwidth_mb: 0
        },
        quality_indicators: taskResult.performance_metrics?.quality_indicators || {
          error_count: 0,
          warning_count: 0,
          success_rate_percent: 100
        }
      },
      recommendations: {
        next_actions: this.generateNextActions(input, taskResult),
        monitoring_suggestions: this.generateMonitoringSuggestions(input),
        optimization_opportunities: this.generateOptimizationSuggestions(taskResult),
        handoff_complete: true
      },
      analytics: {
        execution_time: executionTime,
        operations_performed: 1,
        data_transferred: this.calculateDataTransferred(input),
        success_rate: 100,
        agent_efficiency: this.calculateEfficiency(executionTime, taskResult),
        estimated_cost: this.estimateCost(input, executionTime)
      },
      metadata: {
        agent_version: 'v2.0',
        processing_timestamp: new Date().toISOString(),
        tools_used: ['delivery-manager', 'file-organizer'],
        handoff_type: input.task_type,
        original_request_size_kb: DeliveryUtils.calculateSizeKB(JSON.stringify(input))
      }
    };
  }

  /**
   * Строит результат ошибки
   */
  private buildErrorOutput(
    input: DeliverySpecialistInput,
    error: Error,
    startTime: number
  ): DeliverySpecialistOutput {
    const executionTime = Date.now() - startTime;
    
    return {
      success: false,
      task_type: input.task_type,
      results: {},
      delivery_artifacts: {},
      deployment_status: {
        environment: input.deployment_config?.environment || 'staging',
        status: 'failed',
        deployment_id: DeliveryUtils.generateId('failed'),
        rollback_available: false,
        monitoring_active: false
      },
      performance_metrics: {
        deployment_time: executionTime,
        asset_upload_time: 0,
        total_file_size: 0,
        success_rate: 0,
        task_duration_ms: executionTime,
        processing_time_breakdown: {
          validation_ms: 0,
          deployment_ms: 0,
          monitoring_ms: 0
        },
        resource_usage: {
          memory_peak_mb: process.memoryUsage().heapUsed / 1024 / 1024,
          cpu_usage_percent: 0,
          network_bandwidth_mb: 0
        },
        quality_indicators: {
          error_count: 1,
          warning_count: 0,
          success_rate_percent: 0
        }
      },
      recommendations: {
        next_actions: ['Review error logs', 'Retry with corrected input'],
        monitoring_suggestions: [],
        optimization_opportunities: [],
        handoff_complete: false
      },
      analytics: {
        execution_time: executionTime,
        operations_performed: 0,
        data_transferred: 0,
        success_rate: 0,
        agent_efficiency: 0,
        estimated_cost: 0
      },
      metadata: {
        agent_version: 'v2.0',
        processing_timestamp: new Date().toISOString(),
        tools_used: [],
        handoff_type: input.task_type,
        original_request_size_kb: DeliveryUtils.calculateSizeKB(JSON.stringify(input))
      },
      error: error.message
    };
  }

  /**
   * Мапит результаты задач в унифицированный формат
   */
  private mapTaskResults(taskType: string, taskResult: any): any {
    const results: any = {};
    
    switch (taskType) {
      case 'upload_assets':
        results.upload_data = taskResult;
        break;
      case 'generate_screenshots':
        results.screenshot_data = taskResult;
        break;
      case 'deploy_campaign':
        results.deployment_data = taskResult;
        break;
      case 'visual_testing':
        results.testing_data = taskResult;
        break;
      case 'monitor_performance':
        results.monitoring_data = taskResult;
        break;
      case 'finalize_delivery':
        results.finalization_data = taskResult;
        break;
    }
    
    return results;
  }

  /**
   * Определяет статус развертывания
   */
  private determineDeploymentStatus(taskResult: any): 'pending' | 'deploying' | 'deployed' | 'failed' | 'rollback' {
    if (!taskResult.success) {
      return 'failed';
    }
    
    if (taskResult.deployment_data?.rollout_status === 'in_progress') {
      return 'deploying';
    }
    
    return 'deployed';
  }

  /**
   * Генерирует следующие действия
   */
  private generateNextActions(input: DeliverySpecialistInput, taskResult: any): string[] {
    const actions: string[] = [];
    
    switch (input.task_type) {
      case 'upload_assets':
        actions.push('Generate screenshots for visual verification');
        actions.push('Deploy to staging environment for testing');
        break;
      case 'generate_screenshots':
        actions.push('Review screenshots for quality assurance');
        actions.push('Proceed with deployment if screenshots are satisfactory');
        break;
      case 'deploy_campaign':
        actions.push('Monitor deployment health and performance');
        actions.push('Set up analytics and tracking');
        break;
      case 'visual_testing':
        actions.push('Review test results and address any failures');
        actions.push('Proceed with production deployment if tests pass');
        break;
      case 'monitor_performance':
        actions.push('Review performance metrics and baselines');
        actions.push('Configure alerting thresholds');
        break;
      case 'finalize_delivery':
        actions.push('Campaign delivery complete');
        actions.push('Archive all assets for future reference');
        break;
    }
    
    return actions;
  }

  /**
   * Генерирует предложения по мониторингу
   */
  private generateMonitoringSuggestions(input: DeliverySpecialistInput): string[] {
    const suggestions: string[] = [];
    
    if (input.deployment_config?.environment === 'production') {
      suggestions.push('Set up real-time performance monitoring');
      suggestions.push('Configure alerting for critical metrics');
      suggestions.push('Enable user experience tracking');
    }
    
    if (input.testing_requirements?.performance_benchmarks) {
      suggestions.push('Monitor load times and rendering performance');
      suggestions.push('Track cross-client compatibility metrics');
    }
    
    return suggestions;
  }

  /**
   * Генерирует возможности оптимизации
   */
  private generateOptimizationSuggestions(taskResult: any): string[] {
    const suggestions: string[] = [];
    
    if (taskResult.performance_metrics?.task_duration_ms > 30000) {
      suggestions.push('Consider optimizing deployment process for faster execution');
    }
    
    if (taskResult.upload_data?.total_size_mb > 10) {
      suggestions.push('Enable compression to reduce file sizes');
      suggestions.push('Consider CDN optimization for faster asset delivery');
    }
    
    return suggestions;
  }

  // ============ UTILITY METHODS ============

  private calculateTotalFileSize(input: DeliverySpecialistInput): number {
    let totalSize = DeliveryUtils.calculateSizeKB(input.email_package.html_output);
    
    if (input.email_package.mjml_source) {
      totalSize += DeliveryUtils.calculateSizeKB(input.email_package.mjml_source);
    }
    
    return totalSize / 1024; // Convert to MB
  }

  private estimateCdnPropagation(input: DeliverySpecialistInput): number {
    return input.upload_requirements?.cdn_distribution ? 30000 : 0; // 30s for CDN
  }

  private calculateDataTransferred(input: DeliverySpecialistInput): number {
    return this.calculateTotalFileSize(input);
  }

  private calculateEfficiency(executionTime: number, taskResult: any): number {
    const baselineTime = 30000; // 30 seconds baseline
    return Math.max(0, Math.min(100, (baselineTime / executionTime) * 100));
  }

  private estimateCost(input: DeliverySpecialistInput, executionTime: number): number {
    const baseCost = 0.01; // $0.01 per task
    const timeCost = (executionTime / 1000) * 0.001; // $0.001 per second
    const sizeCost = this.calculateTotalFileSize(input) * 0.005; // $0.005 per MB
    
    return baseCost + timeCost + sizeCost;
  }

  private updatePerformanceMetrics(startTime: number, success: boolean): void {
    const executionTime = Date.now() - startTime;
    
    this.performanceMetrics.totalExecutions++;
    if (success) {
      this.performanceMetrics.totalSuccesses++;
    }
    
    this.performanceMetrics.averageExecutionTime = 
      (this.performanceMetrics.averageExecutionTime * (this.performanceMetrics.totalExecutions - 1) + executionTime) / 
      this.performanceMetrics.totalExecutions;
    
    this.performanceMetrics.successRate = 
      (this.performanceMetrics.totalSuccesses / this.performanceMetrics.totalExecutions) * 100;
  }

  /**
   * Валидация и коррекция handoff данных
   */
  private async validateAndCorrectHandoffData(handoffData: any, handoffType: string): Promise<any> {
    try {
      // Since we're dealing with quality-to-delivery handoff
      const validationResult = await this.handoffValidator.validateQualityToDelivery(
        handoffData,
        true // enable AI correction
      );

      if (!validationResult.isValid) {
        console.log(`🔧 Correcting handoff data for ${handoffType}...`);
        this.performanceMetrics.correctionAttempts++;
        
        const correctedData = await this.aiCorrector.correctData(
          handoffData,
          validationResult.correctionSuggestions,
          'quality-to-delivery'
        );
        
        return correctedData.correctedData || handoffData;
      }

      this.performanceMetrics.validationSuccessRate = 
        (this.performanceMetrics.validationSuccessRate + 100) / 2;
      
      return handoffData;
    } catch (error) {
      console.error('❌ Handoff validation/correction failed:', error);
      return handoffData; // Return original data if correction fails
    }
  }

  private getSpecialistInstructions(): string {
    return `You are the Delivery Specialist Agent V2, the final agent in the multi-agent email generation system.

SPECIALIZATION: Email Deployment & Production Delivery
- Modular service architecture with dedicated Upload, Screenshot, and Deployment services
- Asset upload and CDN distribution management
- Visual testing and cross-client screenshot generation
- Production deployment with automated monitoring
- Performance analytics and optimization recommendations
- Campaign finalization and comprehensive archiving

CORE SERVICES:
1. **UploadService**: Secure asset upload to S3 with metadata management
2. **ScreenshotService**: Multi-client visual testing and comparison
3. **DeploymentService**: Full deployment lifecycle management

OPERATIONAL WORKFLOW:
1. Validate and process handoff data from QualitySpecialist
2. Route tasks to appropriate specialized service
3. Execute task with comprehensive error handling and monitoring
4. Generate detailed performance metrics and recommendations
5. Provide actionable next steps and optimization suggestions

QUALITY STANDARDS:
- Zero-downtime deployments with rollback capabilities
- Cross-client visual compatibility verification
- Performance monitoring and alerting setup
- Comprehensive audit trails and archival
- Cost optimization and efficiency tracking

Always prioritize reliability, performance, and detailed reporting in all operations.`;
  }

  async shutdown(): Promise<void> {
    try {
      console.log(`✅ ${this.constructor.name} ${this.agentId} shut down successfully`);
      console.log(`📊 Final metrics:`, this.performanceMetrics);
    } catch (error) {
      console.error(`❌ ${this.constructor.name} shutdown error:`, error);
    }
  }
}

// Legacy compatibility export
export { DeliverySpecialistAgentV2 as DeliverySpecialistAgent };