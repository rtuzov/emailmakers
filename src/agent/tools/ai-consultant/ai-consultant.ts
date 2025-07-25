/**
 * Phase 13.1: AI Quality Consultant
 * 
 * Main orchestrator for intelligent email quality improvement system.
 * Coordinates analysis, recommendations, and iterative improvement workflow.
 * 
 * Updated to use OpenAI Agents SDK for enhanced AI analysis
 */

import { AgentEmailAnalyzer } from './agent-analyzer';
import { RecommendationEngine } from './recommendation-engine';
import { CommandGenerator } from './command-generator';
import { ActionExecutor, ExecutionContext } from './action-executor';
import { 
  AIConsultantRequest,
  AIConsultantResponse,
  AIConsultantConfig,
  QualityAnalysisResult,
  QualityRecommendation,
  ExecutionPlan,
  NextAction,
  ImprovementIteration,
  AIConsultantError,
  ExecutionResult
} from './types';
import { logger } from '../../core/logger';
import { getValidatedUsageModel } from '../../../shared/utils/model-config';
import { /* createAgentRunConfig, */ withSDKTrace } from '../../utils/tracing-utils';

export class AIQualityConsultant {
  private analyzer: AgentEmailAnalyzer;
  private recommendationEngine: RecommendationEngine;
  private commandGenerator: CommandGenerator;
  private actionExecutor: ActionExecutor;
  private config: AIConsultantConfig;

  constructor(config?: Partial<AIConsultantConfig>) {
    this.config = this.createDefaultConfig(config);
    this.analyzer = new AgentEmailAnalyzer(this.config);
    this.recommendationEngine = new RecommendationEngine(this.config);
    this.commandGenerator = new CommandGenerator();
    this.actionExecutor = new ActionExecutor(this.config);
  }

  /**
   * Main entry point for AI quality consultation
   */
  async consultOnQuality(request: AIConsultantRequest): Promise<AIConsultantResponse> {
    return withSDKTrace('AI Quality Consultation', async () => {
      try {
        logger.info(`🤖 AI Consultant starting analysis for: ${request.topic}`);
        logger.info(`📊 Iteration ${(request.iteration_count || 0) + 1}/${this.config.max_iterations}`);

        // Check iteration limits
        if ((request.iteration_count || 0) >= this.config.max_iterations) {
          return this.createCompletionResponse(
            'Maximum iterations reached',
            request.previous_analysis || this.createBasicAnalysis()
          );
        }

        // Perform comprehensive quality analysis using OpenAI Agents
        const analysis = await this.analyzer.analyzeEmail(request);

        // Check if quality gate is already passed
        if (analysis.quality_gate_passed) {
          logger.info(`✅ Quality gate passed with score: ${analysis.overall_score}/100`);
          return this.createCompletionResponse(
            'Quality gate passed - no improvements needed',
            analysis
          );
        }

        // Generate actionable recommendations
        const recommendations = await this.recommendationEngine.generateRecommendations(analysis, request);
        
        // Update analysis with recommendations
        analysis.recommendations = recommendations;
        analysis.auto_executable_count = recommendations.filter(r => r.category === 'auto_execute').length;
        analysis.manual_approval_count = recommendations.filter(r => r.category === 'manual_approval').length;
        analysis.critical_issues_count = recommendations.filter(r => r.priority === 'critical').length;

        // Generate optimized agent commands
        const commands = this.commandGenerator.generateCommands(recommendations, request);

        // Execute commands if auto-execution is enabled
        let executionResults: ExecutionResult[] = [];
        if (this.config.enable_auto_execution) {
          const executionContext: ExecutionContext = {
            session_id: request.session_id || `session_${Date.now()}`,
            iteration_number: (request.iteration_count || 0) + 1,
            ...(request.user_id && { user_id: request.user_id }),
            ...(request.approval_callback && { approval_callback: request.approval_callback }),
            ...(request.progress_callback && { progress_callback: request.progress_callback })
          };

          executionResults = await this.actionExecutor.executeCommands(
            commands,
            recommendations,
            executionContext
          );

          // Update analysis with execution results
          const scoreImpact = executionResults.reduce((sum, result) => sum + (result.score_impact || 0), 0);
          const finalScore = Math.min(100, analysis.overall_score + scoreImpact);
          analysis.score_impact = scoreImpact;
          analysis.overall_score = finalScore;
          analysis.quality_gate_passed = finalScore >= this.config.quality_gate_threshold;
        }

        // Create execution plan
        const executionPlan = this.createExecutionPlan(recommendations);

        // Determine next actions
        const nextActions = this.determineNextActions(analysis, executionPlan);

        // Should we continue improving?
        const shouldContinue = this.shouldContinueImprovement(analysis, request);

        const response: AIConsultantResponse = {
          analysis,
          execution_plan: executionPlan,
          next_actions: nextActions,
          should_continue: shouldContinue,
          completion_reason: shouldContinue ? 'continuing_improvement' : this.getCompletionReason(analysis),
          execution_results: executionResults
        };

        logger.info(`🎯 Generated ${recommendations.length} recommendations (${analysis.auto_executable_count} auto, ${analysis.manual_approval_count} manual)`);
        
        return response;

      } catch (error) {
        logger.error('❌ AI Consultant failed', { error });
        throw new AIConsultantError(
          'AI consultation failed',
          'ANALYSIS_FAILED',
          { error: error instanceof Error ? error.message : String(error), topic: request.topic }
        );
      }
    });
  }

  /**
   * Process improvement iteration results and plan next steps
   */
  async processImprovementResults(
    originalRequest: AIConsultantRequest,
    iterationResults: ImprovementIteration
  ): Promise<AIConsultantResponse> {
    try {
      logger.info(`🔄 Processing iteration ${iterationResults.iteration_number} results`);

      // Create updated request with iteration history
      const updatedRequest = {
        ...originalRequest,
        iteration_count: iterationResults.iteration_number,
        improvement_history: [...(originalRequest.improvement_history || []), iterationResults]
        // previous_analysis will be set during new analysis
      } as AIConsultantRequest;

      // Analyze the improved email
      return await this.consultOnQuality(updatedRequest);

    } catch (error) {
      logger.error('❌ Failed to process improvement results', { error });
      throw new AIConsultantError(
        'Failed to process improvement iteration',
        'ANALYSIS_FAILED',
        { error: error instanceof Error ? error.message : String(error), iteration: iterationResults.iteration_number }
      );
    }
  }

  /**
   * Create execution plan from recommendations
   */
  private createExecutionPlan(recommendations: QualityRecommendation[]): ExecutionPlan {
    const autoExecuteActions = recommendations
      .filter(r => r.category === 'auto_execute')
      .slice(0, this.config.max_auto_execute_per_iteration)
      .map(r => r.agent_command);

    const manualApprovalActions = recommendations
      .filter(r => r.category === 'manual_approval')
      .map(r => r.agent_command);

    const criticalReviewActions = recommendations
      .filter(r => r.category === 'critical_review')
      .map(r => r.agent_command);

    // Calculate execution order (auto first, then manual by priority)
    const executionOrder = [
      ...recommendations.filter(r => r.category === 'auto_execute').map(r => r.id),
      ...recommendations.filter(r => r.category === 'manual_approval').map(r => r.id),
      ...recommendations.filter(r => r.category === 'critical_review').map(r => r.id)
    ];

    const totalTime = recommendations.reduce((sum, r) => sum + r.estimated_time, 0);

    return {
      total_recommendations: recommendations.length,
      auto_execute_actions: autoExecuteActions,
      manual_approval_actions: manualApprovalActions,
      critical_review_actions: criticalReviewActions,
      estimated_total_time: Math.min(totalTime, this.config.max_total_execution_time),
      execution_order: executionOrder
    };
  }

  /**
   * Determine next actions based on analysis and execution plan
   */
  private determineNextActions(_analysis: QualityAnalysisResult, plan: ExecutionPlan): NextAction[] {
    const actions: NextAction[] = [];

    // Auto-execute actions
    if (plan.auto_execute_actions.length > 0 && this.config.enable_auto_execution) {
      const firstCommand = plan.auto_execute_actions[0];
      if (firstCommand) {
        actions.push({
          type: 'auto_execute',
          description: `Automatically execute ${plan.auto_execute_actions.length} safe improvements`,
          command: firstCommand,
          approval_required: false
        });
      }
    }

    // Manual approval actions
    if (plan.manual_approval_actions.length > 0) {
      const firstCommand = plan.manual_approval_actions[0];
      if (firstCommand) {
        actions.push({
          type: 'request_approval',
          description: `Request approval for ${plan.manual_approval_actions.length} content changes`,
          command: firstCommand,
          approval_required: true
        });
      }
    }

    // Critical review actions
    if (plan.critical_review_actions.length > 0) {
      actions.push({
        type: 'escalate',
        description: `Escalate ${plan.critical_review_actions.length} critical issues for review`,
        escalation_reason: 'Critical quality issues require human review'
      });
    }

    // If no improvements needed
    if (actions.length === 0) {
      actions.push({
        type: 'complete',
        description: 'Email quality is acceptable - ready for upload'
      });
    }

    return actions;
  }

  /**
   * Determine if improvement process should continue
   */
  private shouldContinueImprovement(analysis: QualityAnalysisResult, request: AIConsultantRequest): boolean {
    // If quality gate passed, we're done
    if (analysis.quality_gate_passed) {
      console.log(`✅ Quality gate passed with score ${analysis.overall_score}/100 - stopping improvement`);
      return false;
    }

    // Stop if max iterations reached
    const currentIteration = request.iteration_count || 0;
    if (currentIteration >= this.config.max_iterations - 1) {
      console.log(`🛑 Max iterations reached: ${currentIteration + 1}/${this.config.max_iterations} - stopping improvement`);
      return false;
    }

    // Stop if no meaningful improvements possible
    if (analysis.improvement_potential < 5) {
      console.log(`🛑 Low improvement potential: ${analysis.improvement_potential}% - stopping improvement`);
      return false;
    }

    // Stop if score is very low and we have critical issues (escalate instead)
    if (analysis.overall_score < this.config.critical_issue_threshold && analysis.critical_issues_count > 0) {
      console.log(`🛑 Critical issues with low score: ${analysis.overall_score} (${analysis.critical_issues_count} critical issues) - stopping improvement`);
      return false;
    }

    // 🔧 FIXED LOGIC: More strict conditions to prevent cycling
    const hasAutoFixes = analysis.auto_executable_count > 0;
    const scoreAcceptable = analysis.overall_score >= 60; // Minimum 60 points
    const hasMinorIssuesOnly = analysis.critical_issues_count === 0;
    
    // Check progress: if previous analysis exists, quality should improve
    if (request.previous_analysis && analysis.overall_score <= request.previous_analysis.overall_score) {
      console.log(`🛑 No quality improvement: ${request.previous_analysis.overall_score} → ${analysis.overall_score} - stopping improvement`);
      return false;
    }

    // Additional safety check: if score is below quality gate for multiple iterations, stop
    if (analysis.overall_score < this.config.quality_gate_threshold && currentIteration >= 1) {
      console.log(`🛑 Quality gate failed for multiple iterations (${currentIteration + 1}) with score ${analysis.overall_score} - stopping improvement`);
      return false;
    }

    // Only continue if we have auto-fixes, acceptable score, and minor issues only
    const shouldContinue = hasAutoFixes && scoreAcceptable && hasMinorIssuesOnly && currentIteration < 2;
    
    console.log(`🔄 Continue improvement decision: ${shouldContinue}`);
    console.log(`   Score: ${analysis.overall_score}, Auto-fixes: ${analysis.auto_executable_count}, Critical: ${analysis.critical_issues_count}, Iteration: ${currentIteration + 1}`);
    
    return shouldContinue;
  }

  /**
   * Get completion reason
   */
  private getCompletionReason(analysis: QualityAnalysisResult): string {
    if (analysis.quality_gate_passed) {
      return `Quality gate passed with score ${analysis.overall_score}/100 - Ready for delivery`;
    }
    
    if (analysis.critical_issues_count > 0) {
      return `Quality gate FAILED - Critical issues detected, requires human review (Score: ${analysis.overall_score}/100)`;
    }
    
    if (analysis.auto_executable_count === 0) {
      return `Quality gate FAILED - No auto-fixable improvements available, manual intervention required (Score: ${analysis.overall_score}/100)`;
    }
    
    if (analysis.improvement_potential < 5) {
      return `Quality gate FAILED - Limited improvement potential remaining (Score: ${analysis.overall_score}/100)`;
    }
    
    return `Quality gate FAILED - Maximum iterations reached (Score: ${analysis.overall_score}/100)`;
  }

  /**
   * Create completion response
   */
  private createCompletionResponse(reason: string, analysis: QualityAnalysisResult): AIConsultantResponse {
    return {
      analysis,
      execution_plan: {
        total_recommendations: 0,
        auto_execute_actions: [],
        manual_approval_actions: [],
        critical_review_actions: [],
        estimated_total_time: 0,
        execution_order: []
      },
      next_actions: [{
        type: 'complete',
        description: reason
      }],
      should_continue: false,
      completion_reason: reason
    };
  }

  /**
   * Create basic analysis for error scenarios
   */
  private createBasicAnalysis(): QualityAnalysisResult {
    return {
      overall_score: 70,
      quality_grade: 'C',
      quality_gate_passed: true,
      dimension_scores: {
        content_quality: 70,
        visual_appeal: 70,
        technical_compliance: 70,
        emotional_resonance: 70,
        brand_alignment: 70
      },
      recommendations: [],
      auto_executable_count: 0,
      manual_approval_count: 0,
      critical_issues_count: 0,
      improvement_potential: 0,
      estimated_final_score: 70,
      max_achievable_score: 70,
      analysis_time: Date.now(),
      confidence_level: 0.5,
      analyzed_elements: []
    };
  }

  /**
   * Create default configuration
   */
  private createDefaultConfig(overrides?: Partial<AIConsultantConfig>): AIConsultantConfig {
    const defaults: AIConsultantConfig = {
      // Quality thresholds
      quality_gate_threshold: 70,
      auto_execute_threshold: 80,
      critical_issue_threshold: 30,
      
      // Execution limits
      max_iterations: 3,
      max_auto_execute_per_iteration: 5,
      max_total_execution_time: 300,
      
      // AI model configuration
      ai_model: getValidatedUsageModel(),
      analysis_temperature: 0.3,
      max_recommendations: 10,
      
      // Feature flags
      enable_auto_execution: true,
      enable_image_analysis: true,
      enable_brand_compliance: true,
      enable_accessibility_checks: true,
      
      // Logging and monitoring
      log_level: 'info',
      enable_analytics: false
    };

    return { ...defaults, ...overrides };
  }

  /**
   * Get current configuration
   */
  getConfig(): AIConsultantConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<AIConsultantConfig>): void {
    this.config = { ...this.config, ...updates };
    this.analyzer = new AgentEmailAnalyzer(this.config);
    this.recommendationEngine = new RecommendationEngine(this.config);
  }

  /**
   * Get analytics and performance metrics
   */
  getAnalytics() {
    return {
      config: this.config,
      features_enabled: {
        auto_execution: this.config.enable_auto_execution,
        image_analysis: this.config.enable_image_analysis,
        brand_compliance: this.config.enable_brand_compliance,
        accessibility_checks: this.config.enable_accessibility_checks
      },
      thresholds: {
        quality_gate: this.config.quality_gate_threshold,
        auto_execute: this.config.auto_execute_threshold,
        critical_issue: this.config.critical_issue_threshold
      }
    };
  }
} 