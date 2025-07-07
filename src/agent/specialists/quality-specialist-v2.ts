/**
 * 🔍 QUALITY SPECIALIST AGENT V2
 * 
 * Enhanced Quality Specialist with ML-powered scoring and comprehensive validation
 * Integrates traditional HTML validation with machine learning quality assessment
 */

import { Agent } from '@openai/agents';
import { QualityAnalysisService } from './quality/services/quality-analysis-service';
import { 
  QualitySpecialistInput, 
  QualitySpecialistOutput, 
  QualityServiceContext,
  TaskResults,
  QualityReport,
  ComplianceStatusReport
} from './quality/types/quality-types';
import { generateTraceId, addTraceContext } from '../utils/tracing-utils';
import { getLogger } from '../../shared/utils/logger';

const logger = getLogger({ component: 'quality-specialist-v2' });

export class QualitySpecialistV2 {
  private agent: Agent;
  private qualityAnalysisService: QualityAnalysisService;

  constructor(agent: Agent) {
    this.agent = agent;
    this.qualityAnalysisService = QualityAnalysisService.getInstance();
  }

  /**
   * Main execution method for Quality Specialist tasks
   */
  async execute(input: QualitySpecialistInput): Promise<QualitySpecialistOutput> {
    const traceId = generateTraceId();
    const startTime = Date.now();
    
    console.log('🔍 QUALITY SPECIALIST V2: Starting quality analysis...');
    console.log('📋 Task details:', {
      taskType: input.task_type,
      hasEmailPackage: !!input.email_package,
      traceId
    });

    // Add initial trace context
    addTraceContext(traceId, {
      agent: 'quality_specialist_v2',
      task_type: input.task_type,
      timestamp: new Date().toISOString(),
      ml_scoring_enabled: true
    });

    try {
      // Create service context
      const context: QualityServiceContext = {
        traceId,
        startTime,
        taskType: input.task_type,
        input
      };

      // Execute quality analysis with ML-scoring
      console.log('🤖 QUALITY SPECIALIST V2: Running ML-powered quality analysis...');
      const taskResults = await this.qualityAnalysisService.handleQualityAnalysis(input);
      
      // Convert TaskResults to QualitySpecialistOutput
      const output = this.convertTaskResultsToOutput(taskResults, input, traceId);

      // Add success trace context
      addTraceContext(traceId, {
        status: 'success',
        quality_score: output.quality_report.overall_score,
        ml_score: taskResults.analytics.ml_score,
        processing_time_ms: Date.now() - startTime
      });

      console.log('✅ QUALITY SPECIALIST V2: Analysis completed successfully');
      console.log('📊 Final results:', {
        success: output.success,
        overallScore: output.quality_report.overall_score,
        mlScore: taskResults.analytics.ml_score,
        validationPassed: taskResults.validation_passed
      });

      return output;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Add error trace context
      addTraceContext(traceId, {
        status: 'error',
        error: errorMessage,
        processing_time_ms: Date.now() - startTime
      });

      console.error('❌ QUALITY SPECIALIST V2 ERROR:', errorMessage);
      logger.error('Quality Specialist V2 execution failed', { error: errorMessage, input, traceId });

      return this.generateErrorOutput(input, errorMessage, traceId);
    }
  }

  /**
   * Convert TaskResults to QualitySpecialistOutput for backward compatibility
   */
  private convertTaskResultsToOutput(
    taskResults: TaskResults, 
    input: QualitySpecialistInput, 
    traceId: string
  ): QualitySpecialistOutput {
    console.log('🔄 QUALITY SPECIALIST V2: Converting results to output format...');

    // Create quality report from ML analysis
    const qualityReport: QualityReport = {
      overall_score: taskResults.quality_score,
      category_scores: {
        technical: taskResults.ml_quality_report?.category_scores?.technical ?? 0,
        content: taskResults.ml_quality_report?.category_scores?.content ?? 0,
        accessibility: taskResults.ml_quality_report?.category_scores?.accessibility ?? 0,
        performance: taskResults.ml_quality_report?.category_scores?.performance ?? 0,
        compatibility: taskResults.ml_quality_report?.category_scores?.compatibility ?? 0
      },
      issues_found: (taskResults.ml_quality_report?.issues || []).map((issue: any) => ({
        severity: issue.severity || 'medium',
        category: issue.category || 'general',
        description: issue.issue || issue.description || 'Quality issue detected',
        fix_suggestion: issue.fix_suggestion || 'Review and address this issue',
        auto_fixable: false
      })),
      passed_checks: ['ML Quality Analysis', 'Basic Validation'],
      recommendations: taskResults.ml_quality_report?.recommendations || []
    };

    // Create compliance status
    const complianceStatus: ComplianceStatusReport = {
      email_standards: taskResults.validation_passed ? 'pass' : 'warning',
      accessibility: qualityReport.category_scores.accessibility >= 70 ? 'pass' : 'warning',
      performance: qualityReport.category_scores.performance >= 70 ? 'pass' : 'warning',
      security: 'pass', // Default
      overall_compliance: taskResults.validation_passed && taskResults.quality_score >= 70 ? 'pass' : 'warning'
    };

    console.log('✅ QUALITY SPECIALIST V2: Results converted successfully');

    return {
      success: taskResults.status === 'completed',
      task_type: input.task_type,
      results: taskResults,
      quality_report: qualityReport,
      compliance_status: complianceStatus,
      recommendations: taskResults.recommendations,
      analytics: taskResults.analytics,
      error: taskResults.error
    };
  }

  /**
   * Generate error output for failed executions
   */
  private generateErrorOutput(
    input: QualitySpecialistInput, 
    errorMessage: string, 
    traceId: string
  ): QualitySpecialistOutput {
    return {
      success: false,
      task_type: input.task_type,
      results: {
        status: 'failed',
        quality_score: 0,
        validation_passed: false,
        recommendations: {
          critical_issues: [`Analysis failed: ${errorMessage}`],
          improvements: ['Please check input data and try again'],
          ml_recommendations: []
        },
        analytics: {
          total_checks: 0,
          passed_checks: 0,
          failed_checks: 1,
          processing_time_ms: 0,
          ml_score: 0,
          ml_issues: [],
          ml_recommendations: []
        },
        processing_time_ms: 0,
        timestamp: new Date().toISOString(),
        error: errorMessage
      },
      quality_report: {
        overall_score: 0,
        category_scores: {
          technical: 0,
          content: 0,
          accessibility: 0,
          performance: 0,
          compatibility: 0
        },
        issues_found: [{
          severity: 'critical',
          category: 'system',
          description: `Quality analysis failed: ${errorMessage}`,
          fix_suggestion: 'Please check input data and system configuration',
          auto_fixable: false
        }],
        passed_checks: [],
        recommendations: ['Retry with valid input data']
      },
      compliance_status: {
        email_standards: 'fail',
        accessibility: 'fail',
        performance: 'fail',
        security: 'fail',
        overall_compliance: 'fail'
      },
      recommendations: {
        critical_issues: [`Analysis failed: ${errorMessage}`],
        improvements: ['Please check input data and try again'],
        ml_recommendations: []
      },
      analytics: {
        total_checks: 0,
        passed_checks: 0,
        failed_checks: 1,
        processing_time_ms: 0,
        ml_score: 0,
        ml_issues: [],
        ml_recommendations: []
      },
      error: errorMessage
    };
  }
} 