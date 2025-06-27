/**
 * Smart Quality Controller - Умное управление качественными проверками
 * Обеспечивает обязательный вызов ai_quality_consultant и управляет workflow качества
 */

import { 
  QualityGate, 
  QualityControlResult, 
  QualityIssue, 
  QualityControlConfig,
  ToolStep,
  ToolSequence 
} from './types';
import { SecureLogger } from './secure-logger';
import { TIME_CONSTANTS, LIMITS, QUALITY_CONSTANTS } from './constants';

export class SmartQualityController {
  private config: QualityControlConfig;
  private qualityGates: QualityGate[];
  private executionHistory: Map<string, QualityControlResult & { timestamp: number }> = new Map();
  
  // Memory management settings
  private readonly MAX_HISTORY_SIZE = LIMITS.MAX_QUALITY_HISTORY_SIZE;
  private readonly HISTORY_TTL_MS = TIME_CONSTANTS.QUALITY_HISTORY_TTL_MS;

  constructor(config?: Partial<QualityControlConfig>) {
    this.config = {
      enforceAiConsultant: true,
      minimumScore: QUALITY_CONSTANTS.DEFAULT_MINIMUM_SCORE,
      criticalIssueThreshold: QUALITY_CONSTANTS.DEFAULT_CRITICAL_ISSUE_THRESHOLD,
      autoRetryCount: QUALITY_CONSTANTS.DEFAULT_AUTO_RETRY_COUNT,
      requireManualReview: false,
      ...config
    };

    // Определяем качественные ворота
    this.qualityGates = [
      {
        stage: 'post-render',
        required: true,
        tool: 'ai_quality_consultant',
        timeout: 30000,
        retries: 2
      },
      {
        stage: 'pre-upload',
        required: this.config.enforceAiConsultant,
        tool: 'ai_quality_consultant',
        timeout: 15000,
        retries: 1
      }
    ];

    console.log('🛡️ SmartQualityController initialized', {
      enforceConsultant: this.config.enforceAiConsultant,
      minimumScore: this.config.minimumScore,
      qualityGates: this.qualityGates.length
    });
  }

  /**
   * Проверяет, нужно ли вставить качественную проверку в workflow
   */
  shouldInjectQualityCheck(currentSequence: ToolStep[], lastExecutedTool: string): boolean {
    // Проверяем, если только что выполнен render_mjml
    if (lastExecutedTool === 'render_mjml') {
      // Проверяем, есть ли уже ai_quality_consultant в последовательности
      const hasQualityCheck = currentSequence.some(step => step.tool === 'ai_quality_consultant');
      
      if (!hasQualityCheck) {
        console.log('🚨 SmartQualityController: Detected render_mjml without quality check - injection required');
        return true;
      }
    }

    // Проверяем, если выполняется upload_s3 без предварительной качественной проверки
    if (lastExecutedTool === 'upload_s3') {
      const lastQualityCheck = this.executionHistory.get('ai_quality_consultant');
      if (!lastQualityCheck || !lastQualityCheck.passed) {
        console.log('🚨 SmartQualityController: Upload attempted without successful quality check');
        return true;
      }
    }

    return false;
  }

  /**
   * Вставляет обязательную качественную проверку в workflow
   */
  injectQualityCheck(sequence: ToolSequence, insertAfter: string = 'render_mjml'): ToolSequence {
    const steps = [...sequence.steps];
    const insertIndex = steps.findIndex(step => step.tool === insertAfter);

    if (insertIndex === -1) {
      console.warn('🔍 SmartQualityController: Tool not found for injection, appending quality check');
      steps.push({
        tool: 'ai_quality_consultant',
        priority: 9,
        parallel: false,
        condition: 'mandatory_quality_gate'
      });
    } else {
      // Вставляем ai_quality_consultant сразу после render_mjml
      steps.splice(insertIndex + 1, 0, {
        tool: 'ai_quality_consultant',
        priority: 9,
        parallel: false,
        condition: 'mandatory_quality_gate'
      });
    }

    console.log('✅ SmartQualityController: Quality check injected into workflow', {
      totalSteps: steps.length,
      insertedAfter: insertAfter,
      qualityCheckPosition: steps.findIndex(s => s.tool === 'ai_quality_consultant') + 1
    });

    return {
      ...sequence,
      steps,
      estimatedDuration: sequence.estimatedDuration + 25000 // +25 секунд на качественную проверку
    };
  }

  /**
   * Создает принудительную последовательность с качественными проверками
   */
  createEnforcedSequence(baseSequence: ToolSequence): ToolSequence {
    let enforcedSequence = { ...baseSequence };

    // Проверяем и добавляем ai_quality_consultant если его нет
    const hasQualityCheck = enforcedSequence.steps.some(step => step.tool === 'ai_quality_consultant');
    
    if (!hasQualityCheck) {
      enforcedSequence = this.injectQualityCheck(enforcedSequence);
    }

    // Убеждаемся, что upload_s3 идет после ai_quality_consultant
    const qualityIndex = enforcedSequence.steps.findIndex(s => s.tool === 'ai_quality_consultant');
    const uploadIndex = enforcedSequence.steps.findIndex(s => s.tool === 'upload_s3');

    if (uploadIndex !== -1 && uploadIndex < qualityIndex) {
      console.log('🔄 SmartQualityController: Reordering workflow - moving upload after quality check');
      
      // Удаляем upload_s3 из текущей позиции
      const uploadStep = enforcedSequence.steps.splice(uploadIndex, 1)[0];
      
      // Добавляем его после ai_quality_consultant
      const newQualityIndex = enforcedSequence.steps.findIndex(s => s.tool === 'ai_quality_consultant');
      enforcedSequence.steps.splice(newQualityIndex + 1, 0, uploadStep);
    }

    SecureLogger.qualityControl('sequence_enforced', true, enforcedSequence.steps.length);

    return enforcedSequence;
  }

  /**
   * Валидирует результат качественной проверки
   */
  validateQualityResult(toolResult: any): QualityControlResult {
    if (!toolResult || !toolResult.success) {
      return {
        passed: false,
        issues: [{
          type: 'technical',
          severity: 'critical',
          description: 'AI Quality Consultant failed to execute',
          autoFixable: false
        }],
        recommendations: ['Retry quality analysis', 'Check tool configuration'],
        shouldProceed: false,
        requiresRegeneration: true
      };
    }

    const data = toolResult.data;
    const score = data?.quality_score || data?.score || 0;
    const issues: QualityIssue[] = [];
    const recommendations: string[] = [];

    // Анализируем результат
    if (score < this.config.minimumScore) {
      issues.push({
        type: 'content',
        severity: 'major',
        description: `Quality score ${score} below minimum threshold ${this.config.minimumScore}`,
        autoFixable: true
      });
      recommendations.push('Consider content regeneration');
    }

    // Проверяем критические проблемы
    const criticalIssues = data?.issues?.filter((issue: any) => 
      issue.severity === 'critical' || issue.priority === 'critical'
    ) || [];

    const hasCriticalIssues = criticalIssues.length > this.config.criticalIssueThreshold;

    const result: QualityControlResult = {
      passed: score >= this.config.minimumScore && !hasCriticalIssues,
      score,
      issues,
      recommendations: [...recommendations, ...(data?.recommendations || [])],
      shouldProceed: score >= this.config.minimumScore && !hasCriticalIssues,
      requiresRegeneration: hasCriticalIssues || score < 50
    };

    // Сохраняем результат с timestamp
    this.executionHistory.set('ai_quality_consultant', {
      ...result,
      timestamp: Date.now()
    });

    // Auto-cleanup to prevent memory leaks
    this.cleanupOldHistory();

    SecureLogger.qualityControl('validation_completed', result.passed, score);

    return result;
  }

  /**
   * Принимает решение о продолжении workflow
   */
  shouldContinueWorkflow(stage: string): boolean {
    const lastResult = this.executionHistory.get('ai_quality_consultant');
    
    if (!lastResult) {
      SecureLogger.warn('No quality check found', { component: 'quality_controller', stage });
      return false;
    }

    const decision = lastResult.shouldProceed && lastResult.passed;
    
    SecureLogger.qualityControl('workflow_decision', decision, lastResult.score);

    return decision;
  }

  /**
   * Создает команду для принудительного вызова ai_quality_consultant
   */
  createMandatoryQualityCommand(htmlContent: string, mjmlSource?: string, assets?: any): any {
    return {
      tool: 'ai_quality_consultant',
      params: {
        html_content: htmlContent,
        mjml_source: mjmlSource || null,
        topic: 'Quality Control Check',
        campaign_type: 'promotional',
        assets_used: assets || {
          original_assets: [],
          processed_assets: [],
          sprite_metadata: null
        }
      },
      mandatory: true,
      timeout: this.qualityGates.find(g => g.tool === 'ai_quality_consultant')?.timeout || 30000
    };
  }

  /**
   * Получить статистику качественных проверок
   */
  getQualityStats() {
    return {
      totalChecks: this.executionHistory.size,
      passedChecks: Array.from(this.executionHistory.values()).filter(r => r.passed).length,
      averageScore: Array.from(this.executionHistory.values())
        .filter(r => r.score !== undefined)
        .reduce((acc, r) => acc + (r.score || 0), 0) / 
        Array.from(this.executionHistory.values()).filter(r => r.score !== undefined).length || 0,
      config: this.config
    };
  }

  /**
   * Clean up old execution history to prevent memory leaks
   */
  private cleanupOldHistory(): void {
    const now = Date.now();
    
    // Remove entries older than TTL
    for (const [key, value] of this.executionHistory.entries()) {
      if ((now - value.timestamp) > this.HISTORY_TTL_MS) {
        this.executionHistory.delete(key);
      }
    }
    
    // Limit total size to prevent excessive memory usage
    if (this.executionHistory.size > this.MAX_HISTORY_SIZE) {
      const entries = Array.from(this.executionHistory.entries());
      // Keep only the most recent entries
      const recentEntries = entries
        .sort((a, b) => b[1].timestamp - a[1].timestamp)
        .slice(0, this.MAX_HISTORY_SIZE);
      
      this.executionHistory.clear();
      recentEntries.forEach(([key, value]) => {
        this.executionHistory.set(key, value);
      });
    }
  }

  /**
   * Clear all execution history (for testing/cleanup)
   */
  clearExecutionHistory(): void {
    this.executionHistory.clear();
  }

  /**
   * Set maximum history size
   */
  setMaxHistorySize(size: number): void {
    if (size > 0) {
      (this as any).MAX_HISTORY_SIZE = size;
      this.cleanupOldHistory();
    }
  }

  /**
   * Сброс истории для нового workflow
   */
  resetForNewWorkflow() {
    this.executionHistory.clear();
    console.log('🔄 SmartQualityController: Reset for new workflow');
  }
}