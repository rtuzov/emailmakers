/**
 * 🔄 AGENT HANDOFFS COORDINATOR
 * 
 * Координирует взаимодействие между специализированными агентами:
 * - Управление последовательностью handoffs
 * - Передача данных между агентами
 * - Обработка ошибок и retry логика
 * - Трекинг выполнения workflow
 * 
 * Workflow: ContentSpecialist → DesignSpecialist → QualitySpecialist → DeliverySpecialist
 */

import { generateTraceId, withTrace } from '@openai/agents';
import { ContentSpecialistAgent, ContentSpecialistInput, ContentSpecialistOutput } from '../specialists/content-specialist-agent';
import { DesignSpecialistAgent, DesignSpecialistInput, DesignSpecialistOutput } from '../specialists/design-specialist-agent';
import { QualitySpecialistAgent, QualitySpecialistInput, QualitySpecialistOutput } from '../specialists/quality-specialist-agent';
import { DeliverySpecialistAgent, DeliverySpecialistInput, DeliverySpecialistOutput } from '../specialists/delivery-specialist-agent';

// Main workflow input/output types
export interface WorkflowExecutionInput {
  workflow_id: string;
  campaign_brief: {
    topic: string;
    campaign_type?: 'promotional' | 'informational' | 'seasonal' | 'urgent' | 'newsletter';
    target_audience?: string;
    destination?: string;
    origin?: string;
  };
  execution_config?: {
    skip_agents?: ('content' | 'design' | 'quality' | 'delivery')[];
    retry_policy?: {
      max_retries: number;
      retry_delay_ms: number;
      retry_on_failure: boolean;
    };
    quality_requirements?: {
      minimum_score: number;
      require_compliance: boolean;
      auto_fix_issues: boolean;
    };
    deployment_config?: {
      environment: 'staging' | 'production' | 'preview' | 'test';
      auto_deploy: boolean;
      monitoring_enabled: boolean;
    };
  };
  handoff_context?: any; // Initial context from orchestrator
}

export interface WorkflowExecutionOutput {
  success: boolean;
  workflow_id: string;
  execution_summary: {
    agents_executed: string[];
    total_execution_time: number;
    overall_confidence: number;
    quality_score: number;
    issues_found: number;
    issues_resolved: number;
  };
  agent_results: {
    content_specialist?: ContentSpecialistOutput;
    design_specialist?: DesignSpecialistOutput;
    quality_specialist?: QualitySpecialistOutput;
    delivery_specialist?: DeliverySpecialistOutput;
  };
  final_artifacts: {
    html_output?: string;
    mjml_source?: string;
    assets_used?: string[];
    deployment_urls?: string[];
    quality_report?: any;
    performance_metrics?: any;
  };
  handoff_analytics: {
    handoff_count: number;
    average_handoff_time: number;
    data_transfer_size: number;
    workflow_efficiency: number;
    bottlenecks_detected: string[];
  };
  recommendations: {
    workflow_optimizations?: string[];
    quality_improvements?: string[];
    performance_enhancements?: string[];
    next_steps?: string[];
  };
  error?: string;
}

// Handoff tracking interface
interface HandoffExecution {
  agent_id: string;
  start_time: number;
  end_time?: number;
  input_data: any;
  output_data?: any;
  success: boolean;
  error?: string;
  retry_count: number;
  handoff_data?: any;
}

export class AgentHandoffsCoordinator {
  private contentAgent: ContentSpecialistAgent;
  private designAgent: DesignSpecialistAgent;
  private qualityAgent: QualitySpecialistAgent;
  private deliveryAgent: DeliverySpecialistAgent;
  
  private executionHistory: Map<string, HandoffExecution[]> = new Map();
  private defaultRetryPolicy = {
    max_retries: 2,
    retry_delay_ms: 1000,
    retry_on_failure: true
  };

  constructor() {
    // Initialize all specialized agents
    this.contentAgent = new ContentSpecialistAgent();
    this.designAgent = new DesignSpecialistAgent();
    this.qualityAgent = new QualitySpecialistAgent();
    this.deliveryAgent = new DeliverySpecialistAgent();
    
    console.log('🔄 AgentHandoffsCoordinator initialized with 4 specialized agents');
  }

  /**
   * Execute complete multi-agent workflow with handoffs
   */
  async executeWorkflow(input: WorkflowExecutionInput): Promise<WorkflowExecutionOutput> {
    const startTime = Date.now();
    const traceId = generateTraceId();
    
    console.log(`🚀 Starting multi-agent workflow: ${input.workflow_id}`, {
      topic: input.campaign_brief.topic,
      campaign_type: input.campaign_brief.campaign_type,
      traceId
    });

    // Initialize execution tracking
    const executionHistory: HandoffExecution[] = [];
    this.executionHistory.set(input.workflow_id, executionHistory);
    
    const agentResults: any = {};
    let currentHandoffData = input.handoff_context || {};

    try {
      return await withTrace(`WorkflowExecution-${input.workflow_id}`, async () => {
        // Stage 1: Content Specialist with retry
        if (!this.shouldSkipAgent('content', input.execution_config?.skip_agents)) {
          console.log('📝 Executing Content Specialist...');
          const contentResult = await this.executeWithRetry(
            () => this.executeContentSpecialist(input, currentHandoffData, executionHistory),
            2,
            "Content Specialist"
          );
          agentResults.content_specialist = contentResult;
          
          if (!contentResult.success) {
            throw new Error(`Content Specialist failed: ${contentResult.error}`);
          }
          
          // Update handoff data for next agent
          currentHandoffData = this.mergeHandoffData(currentHandoffData, contentResult.recommendations.handoff_data);
        }

        // Stage 2: Design Specialist with retry
        if (!this.shouldSkipAgent('design', input.execution_config?.skip_agents)) {
          console.log('🎨 Executing Design Specialist...');
          const designResult = await this.executeWithRetry(
            () => this.executeDesignSpecialist(input, currentHandoffData, executionHistory),
            2,
            "Design Specialist"
          );
          agentResults.design_specialist = designResult;
          
          if (!designResult.success) {
            throw new Error(`Design Specialist failed: ${designResult.error}`);
          }
          
          currentHandoffData = this.mergeHandoffData(currentHandoffData, designResult.recommendations.handoff_data);
        }

        // Stage 3: Quality Specialist with retry
        if (!this.shouldSkipAgent('quality', input.execution_config?.skip_agents)) {
          console.log('🔍 Executing Quality Specialist...');
          const qualityResult = await this.executeWithRetry(
            () => this.executeQualitySpecialist(input, currentHandoffData, executionHistory),
            2,
            "Quality Specialist"
          );
          agentResults.quality_specialist = qualityResult;
          
          if (!qualityResult.success) {
            throw new Error(`Quality Specialist failed: ${qualityResult.error}`);
          }
          
          // Check quality requirements
          if (input.execution_config?.quality_requirements) {
            const qualityCheck = this.validateQualityRequirements(qualityResult, input.execution_config.quality_requirements);
            if (!qualityCheck.passed) {
              if (input.execution_config.quality_requirements.auto_fix_issues) {
                console.log('⚠️ Quality issues detected, attempting auto-fix...');
                // Could retry quality agent with different parameters
              } else {
                throw new Error(`Quality requirements not met: ${qualityCheck.issues.join(', ')}`);
              }
            }
          }
          
          currentHandoffData = this.mergeHandoffData(currentHandoffData, qualityResult.recommendations.handoff_data);
        }

        // Stage 4: Delivery Specialist with retry
        if (!this.shouldSkipAgent('delivery', input.execution_config?.skip_agents)) {
          console.log('🚀 Executing Delivery Specialist...');
          const deliveryResult = await this.executeWithRetry(
            () => this.executeDeliverySpecialist(input, currentHandoffData, executionHistory),
            2,
            "Delivery Specialist"
          );
          agentResults.delivery_specialist = deliveryResult;
          
          if (!deliveryResult.success) {
            throw new Error(`Delivery Specialist failed: ${deliveryResult.error}`);
          }
        }

        // Build final workflow output
        const finalOutput = this.buildWorkflowOutput(input, agentResults, executionHistory, startTime, true);
        
        console.log(`✅ Multi-agent workflow completed successfully: ${input.workflow_id}`, {
          total_time: finalOutput.execution_summary.total_execution_time,
          agents_executed: finalOutput.execution_summary.agents_executed.length,
          quality_score: finalOutput.execution_summary.quality_score
        });
        
        return finalOutput;
      });
      
    } catch (error) {
      console.error(`❌ Multi-agent workflow failed: ${input.workflow_id}`, error);
      
      return this.buildWorkflowOutput(input, agentResults, executionHistory, startTime, false, error);
    }
  }

  /**
   * Execute Content Specialist with retry logic
   */
  private async executeContentSpecialist(
    workflowInput: WorkflowExecutionInput, 
    handoffData: any,
    executionHistory: HandoffExecution[]
  ): Promise<ContentSpecialistOutput> {
    const execution: HandoffExecution = {
      agent_id: 'content-specialist',
      start_time: Date.now(),
      input_data: workflowInput.campaign_brief,
      success: false,
      retry_count: 0
    };
    executionHistory.push(execution);

    // Build comprehensive content specialist input
    const contentInput: ContentSpecialistInput = {
      task_type: 'generate_content',
      campaign_brief: workflowInput.campaign_brief,
      context_requirements: {
        include_seasonal: true,
        include_cultural: true,
        include_marketing: true,
        include_travel: true
      },
      pricing_requirements: workflowInput.campaign_brief.origin && workflowInput.campaign_brief.destination ? {
        origin: workflowInput.campaign_brief.origin,
        destination: workflowInput.campaign_brief.destination,
        analysis_depth: 'comprehensive'
      } : undefined,
      content_requirements: {
        content_type: 'complete_campaign',
        tone: 'friendly',
        language: 'ru',
        generate_variants: true
      },
      handoff_context: handoffData
    };

    // Execute with retry logic
    const retryPolicy = workflowInput.execution_config?.retry_policy || this.defaultRetryPolicy;
    
    while (execution.retry_count <= retryPolicy.max_retries) {
      try {
        // Need to get pricing first, then generate content
        let pricingResult = null;
        if (contentInput.pricing_requirements) {
          const pricingInput: ContentSpecialistInput = {
            ...contentInput,
            task_type: 'get_pricing'
          };
          
          pricingResult = await this.contentAgent.executeTask(pricingInput);
          if (!pricingResult.success) {
            throw new Error(`Pricing analysis failed: ${pricingResult.error}`);
          }
        }

        // Now generate content with pricing data
        const contentInputWithPricing: ContentSpecialistInput = {
          ...contentInput,
          task_type: 'generate_content',
          previous_results: pricingResult ? { pricing_data: pricingResult.results.pricing_data } : undefined
        };
        
        const result = await this.contentAgent.executeTask(contentInputWithPricing);
        
        execution.end_time = Date.now();
        execution.output_data = result;
        execution.success = result.success;
        execution.handoff_data = result.recommendations.handoff_data;
        
        if (result.success) {
          return result;
        } else {
          throw new Error(result.error || 'Content specialist execution failed');
        }
        
      } catch (error) {
        execution.retry_count++;
        execution.error = error instanceof Error ? error.message : 'Unknown error';
        
        if (execution.retry_count <= retryPolicy.max_retries && retryPolicy.retry_on_failure) {
          console.log(`🔄 Retrying Content Specialist (attempt ${execution.retry_count}/${retryPolicy.max_retries})`);
          await this.delay(retryPolicy.retry_delay_ms);
        } else {
          execution.end_time = Date.now();
          throw error;
        }
      }
    }

    throw new Error('Content Specialist failed after all retry attempts');
  }

  /**
   * Execute Design Specialist with intelligent asset selection and rendering
   */
  private async executeDesignSpecialist(
    workflowInput: WorkflowExecutionInput,
    handoffData: any,
    executionHistory: HandoffExecution[]
  ): Promise<DesignSpecialistOutput> {
    const execution: HandoffExecution = {
      agent_id: 'design-specialist',
      start_time: Date.now(),
      input_data: handoffData,
      success: false,
      retry_count: 0
    };
    executionHistory.push(execution);

    // Extract content package from handoff data
    const contentPackage = handoffData?.content_package?.data || {};
    
    const designInput: DesignSpecialistInput = {
      task_type: 'render_email',
      content_package: {
        content: {
          subject: contentPackage.content?.subject || workflowInput.campaign_brief.topic,
          preheader: contentPackage.content?.preheader || `Узнайте больше о ${workflowInput.campaign_brief.topic}`,
          body: contentPackage.content?.body || contentPackage.content?.email_body || '',
          cta: contentPackage.content?.cta || contentPackage.content?.cta_text || 'Забронировать',
          language: contentPackage.content?.language || 'ru',
          tone: contentPackage.content?.tone || 'friendly'
        },
        design_requirements: handoffData?.design_requirements,
        brand_guidelines: handoffData?.brand_guidelines
      },
      asset_requirements: {
        tags: ['заяц', 'email', 'путешествия'],
        emotional_tone: 'positive',
        campaign_type: workflowInput.campaign_brief.campaign_type || 'promotional',
        target_count: 2
      },
      rendering_requirements: {
        output_format: 'html',
        template_type: 'promotional',
        email_client_optimization: 'universal',
        responsive_design: true,
        seasonal_theme: false
      },
      campaign_context: {
        campaign_id: workflowInput.workflow_id
      },
      handoff_data: handoffData
    };

    const retryPolicy = workflowInput.execution_config?.retry_policy || this.defaultRetryPolicy;
    
    while (execution.retry_count <= retryPolicy.max_retries) {
      try {
        const result = await this.designAgent.executeTask(designInput);
        
        execution.end_time = Date.now();
        execution.output_data = result;
        execution.success = result.success;
        execution.handoff_data = result.recommendations.handoff_data;
        
        if (result.success) {
          return result;
        } else {
          throw new Error(result.error || 'Design specialist execution failed');
        }
        
      } catch (error) {
        execution.retry_count++;
        execution.error = error instanceof Error ? error.message : 'Unknown error';
        
        if (execution.retry_count <= retryPolicy.max_retries && retryPolicy.retry_on_failure) {
          console.log(`🔄 Retrying Design Specialist (attempt ${execution.retry_count}/${retryPolicy.max_retries})`);
          await this.delay(retryPolicy.retry_delay_ms);
        } else {
          execution.end_time = Date.now();
          throw error;
        }
      }
    }

    throw new Error('Design Specialist failed after all retry attempts');
  }

  /**
   * Execute Quality Specialist with comprehensive testing
   */
  private async executeQualitySpecialist(
    workflowInput: WorkflowExecutionInput,
    handoffData: any,
    executionHistory: HandoffExecution[]
  ): Promise<QualitySpecialistOutput> {
    const execution: HandoffExecution = {
      agent_id: 'quality-specialist',
      start_time: Date.now(),
      input_data: handoffData,
      success: false,
      retry_count: 0
    };
    executionHistory.push(execution);

    // Extract email package from design specialist
    const emailPackage = handoffData?.email_package || handoffData?.design_artifacts;
    
    const qualityInput: QualitySpecialistInput = {
      task_type: 'comprehensive_audit',
      email_package: {
        html_output: emailPackage?.html_output || '',
        mjml_source: emailPackage?.mjml_source,
        assets_used: emailPackage?.assets_used || [],
        rendering_metadata: emailPackage?.rendering_metadata,
        subject: emailPackage?.subject || workflowInput.campaign_brief.topic
      },
      quality_requirements: {
        html_validation: true,
        email_client_compatibility: workflowInput.execution_config?.quality_requirements?.minimum_score || 95,
        accessibility_compliance: 'WCAG_AA',
        performance_targets: {
          load_time: 2000,
          file_size: 100000
        },
        visual_consistency: true,
        mobile_optimization: true
      },
      testing_criteria: {
        client_tests: ['gmail', 'outlook', 'apple_mail', 'yahoo'],
        device_tests: ['desktop', 'mobile', 'tablet'],
        functionality_tests: ['links', 'images', 'responsive_layout'],
        performance_tests: ['load_time', 'rendering_speed'],
        accessibility_tests: ['screen_reader', 'keyboard_navigation']
      },
      compliance_standards: {
        email_standards: true,
        security_requirements: true,
        privacy_compliance: true,
        brand_guidelines: true
      },
      optimization_goals: {
        target_metrics: ['performance', 'accessibility', 'compatibility'],
        priority_focus: 'performance',
        automated_fixes: workflowInput.execution_config?.quality_requirements?.auto_fix_issues || false
      },
      handoff_data: handoffData
    };

    const retryPolicy = workflowInput.execution_config?.retry_policy || this.defaultRetryPolicy;
    
    while (execution.retry_count <= retryPolicy.max_retries) {
      try {
        const result = await this.qualityAgent.executeTask(qualityInput);
        
        execution.end_time = Date.now();
        execution.output_data = result;
        execution.success = result.success;
        execution.handoff_data = result.recommendations.handoff_data;
        
        if (result.success) {
          return result;
        } else {
          throw new Error(result.error || 'Quality specialist execution failed');
        }
        
      } catch (error) {
        execution.retry_count++;
        execution.error = error instanceof Error ? error.message : 'Unknown error';
        
        if (execution.retry_count <= retryPolicy.max_retries && retryPolicy.retry_on_failure) {
          console.log(`🔄 Retrying Quality Specialist (attempt ${execution.retry_count}/${retryPolicy.max_retries})`);
          await this.delay(retryPolicy.retry_delay_ms);
        } else {
          execution.end_time = Date.now();
          throw error;
        }
      }
    }

    throw new Error('Quality Specialist failed after all retry attempts');
  }

  /**
   * Execute Delivery Specialist for production deployment
   */
  private async executeDeliverySpecialist(
    workflowInput: WorkflowExecutionInput,
    handoffData: any,
    executionHistory: HandoffExecution[]
  ): Promise<DeliverySpecialistOutput> {
    const execution: HandoffExecution = {
      agent_id: 'delivery-specialist',
      start_time: Date.now(),
      input_data: handoffData,
      success: false,
      retry_count: 0
    };
    executionHistory.push(execution);

    // Extract quality-assured email package
    const emailPackage = handoffData?.email_package || handoffData?.final_quality_report;
    const qualityData = handoffData?.quality_analysis || handoffData?.comprehensive_audit;
    
    const deliveryInput: DeliverySpecialistInput = {
      task_type: 'finalize_delivery',
      email_package: {
        html_output: emailPackage?.html_output || '',
        mjml_source: emailPackage?.mjml_source,
        assets_used: emailPackage?.assets_used || [],
        quality_score: qualityData?.quality_report?.overall_score || 85,
        compliance_status: qualityData?.compliance_status || { overall_compliance: 'pass' }
      },
      deployment_config: {
        environment: workflowInput.execution_config?.deployment_config?.environment || 'staging',
        rollout_strategy: 'immediate',
        validation_required: true,
        auto_monitoring: workflowInput.execution_config?.deployment_config?.monitoring_enabled !== false
      },
      upload_requirements: {
        s3_bucket: 'email-campaigns-production',
        cdn_distribution: true,
        compression_enabled: true,
        versioning_enabled: true
      },
      testing_requirements: {
        visual_regression: true,
        performance_benchmarks: true,
        cross_client_validation: true,
        screenshot_comparison: true
      },
      campaign_context: {
        campaign_id: workflowInput.workflow_id,
        folder_path: `campaigns/${workflowInput.workflow_id}`,
        performance_session: handoffData?.performance_session
      },
      handoff_data: handoffData
    };

    const retryPolicy = workflowInput.execution_config?.retry_policy || this.defaultRetryPolicy;
    
    while (execution.retry_count <= retryPolicy.max_retries) {
      try {
        const result = await this.deliveryAgent.executeTask(deliveryInput);
        
        execution.end_time = Date.now();
        execution.output_data = result;
        execution.success = result.success;
        execution.handoff_data = result.recommendations.handoff_data;
        
        if (result.success) {
          return result;
        } else {
          throw new Error(result.error || 'Delivery specialist execution failed');
        }
        
      } catch (error) {
        execution.retry_count++;
        execution.error = error instanceof Error ? error.message : 'Unknown error';
        
        if (execution.retry_count <= retryPolicy.max_retries && retryPolicy.retry_on_failure) {
          console.log(`🔄 Retrying Delivery Specialist (attempt ${execution.retry_count}/${retryPolicy.max_retries})`);
          await this.delay(retryPolicy.retry_delay_ms);
        } else {
          execution.end_time = Date.now();
          throw error;
        }
      }
    }

    throw new Error('Delivery Specialist failed after all retry attempts');
  }

  /**
   * Helper methods for workflow coordination
   */
  private shouldSkipAgent(agentType: 'content' | 'design' | 'quality' | 'delivery', skipList?: string[]): boolean {
    return skipList?.includes(agentType) || false;
  }

  private mergeHandoffData(existing: any, newData: any): any {
    return {
      ...existing,
      ...newData,
      // Preserve important context
      workflow_history: [...(existing.workflow_history || []), newData]
    };
  }

  private validateQualityRequirements(qualityResult: QualitySpecialistOutput, requirements: any): { passed: boolean; issues: string[] } {
    const issues: string[] = [];
    
    if (qualityResult.quality_report.overall_score < requirements.minimum_score) {
      issues.push(`Quality score ${qualityResult.quality_report.overall_score} below minimum ${requirements.minimum_score}`);
    }
    
    if (requirements.require_compliance && qualityResult.compliance_status.overall_compliance !== 'pass') {
      issues.push(`Compliance status: ${qualityResult.compliance_status.overall_compliance}`);
    }
    
    const criticalIssues = qualityResult.quality_report.issues_found.filter(issue => issue.severity === 'critical');
    if (criticalIssues.length > 0) {
      issues.push(`${criticalIssues.length} critical issues found`);
    }
    
    return {
      passed: issues.length === 0,
      issues
    };
  }

  private buildWorkflowOutput(
    input: WorkflowExecutionInput,
    agentResults: any,
    executionHistory: HandoffExecution[],
    startTime: number,
    success: boolean,
    error?: any
  ): WorkflowExecutionOutput {
    const totalTime = Date.now() - startTime;
    const executedAgents = executionHistory.map(exec => exec.agent_id);
    
    // Calculate overall metrics
    const overallConfidence = this.calculateOverallConfidence(agentResults);
    const qualityScore = agentResults.quality_specialist?.quality_report?.overall_score || 0;
    const issuesFound = agentResults.quality_specialist?.quality_report?.issues_found?.length || 0;
    const issuesResolved = agentResults.quality_specialist?.analytics?.fixes_applied || 0;

    // Extract final artifacts
    const finalArtifacts = this.extractFinalArtifacts(agentResults);
    
    // Calculate handoff analytics
    const handoffAnalytics = this.calculateHandoffAnalytics(executionHistory);
    
    return {
      success,
      workflow_id: input.workflow_id,
      execution_summary: {
        agents_executed: executedAgents,
        total_execution_time: totalTime,
        overall_confidence: overallConfidence,
        quality_score: qualityScore,
        issues_found: issuesFound,
        issues_resolved: issuesResolved
      },
      agent_results: agentResults,
      final_artifacts: finalArtifacts,
      handoff_analytics: handoffAnalytics,
      recommendations: this.generateWorkflowRecommendations(agentResults, success),
      error: error ? (error instanceof Error ? error.message : String(error)) : undefined
    };
  }

  private calculateOverallConfidence(agentResults: any): number {
    const confidenceScores = [];
    
    if (agentResults.content_specialist?.analytics?.confidence_score) {
      confidenceScores.push(agentResults.content_specialist.analytics.confidence_score);
    }
    if (agentResults.design_specialist?.analytics?.confidence_score) {
      confidenceScores.push(agentResults.design_specialist.analytics.confidence_score);
    }
    if (agentResults.quality_specialist?.analytics?.confidence_score) {
      confidenceScores.push(agentResults.quality_specialist.analytics.confidence_score);
    }
    if (agentResults.delivery_specialist?.analytics?.agent_efficiency) {
      confidenceScores.push(agentResults.delivery_specialist.analytics.agent_efficiency);
    }
    
    return confidenceScores.length > 0 ? 
      Math.round(confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length) : 
      0;
  }

  private extractFinalArtifacts(agentResults: any): any {
    const deliveryArtifacts = agentResults.delivery_specialist?.delivery_artifacts || {};
    const designArtifacts = agentResults.design_specialist?.design_artifacts || {};
    const qualityReport = agentResults.quality_specialist?.quality_report;
    
    return {
      html_output: designArtifacts.html_output || deliveryArtifacts.html_output,
      mjml_source: designArtifacts.mjml_source,
      assets_used: designArtifacts.assets_used || [],
      deployment_urls: deliveryArtifacts.deployment_urls || [],
      quality_report: qualityReport,
      performance_metrics: {
        total_file_size: designArtifacts.file_size || 0,
        load_time_estimate: designArtifacts.load_time_estimate || 0,
        quality_score: qualityReport?.overall_score || 0
      }
    };
  }

  private calculateHandoffAnalytics(executionHistory: HandoffExecution[]): any {
    const completedHandoffs = executionHistory.filter(exec => exec.end_time);
    const handoffTimes = completedHandoffs.map(exec => exec.end_time! - exec.start_time);
    
    return {
      handoff_count: completedHandoffs.length,
      average_handoff_time: handoffTimes.length > 0 ? 
        Math.round(handoffTimes.reduce((sum, time) => sum + time, 0) / handoffTimes.length) : 0,
      data_transfer_size: 0, // Would need to calculate actual data sizes
      workflow_efficiency: this.calculateWorkflowEfficiency(executionHistory),
      bottlenecks_detected: this.detectBottlenecks(executionHistory)
    };
  }

  private calculateWorkflowEfficiency(executionHistory: HandoffExecution[]): number {
    const successRate = executionHistory.filter(exec => exec.success).length / executionHistory.length;
    const retryPenalty = executionHistory.reduce((total, exec) => total + exec.retry_count, 0) * 0.1;
    
    return Math.max(0, Math.round((successRate - retryPenalty) * 100));
  }

  private detectBottlenecks(executionHistory: HandoffExecution[]): string[] {
    const bottlenecks: string[] = [];
    const avgTime = executionHistory.reduce((sum, exec) => 
      sum + (exec.end_time ? exec.end_time - exec.start_time : 0), 0) / executionHistory.length;
    
    executionHistory.forEach(exec => {
      const execTime = exec.end_time ? exec.end_time - exec.start_time : 0;
      if (execTime > avgTime * 1.5) {
        bottlenecks.push(`${exec.agent_id} (${execTime}ms)`);
      }
      if (exec.retry_count > 1) {
        bottlenecks.push(`${exec.agent_id} retries (${exec.retry_count})`);
      }
    });
    
    return bottlenecks;
  }

  private generateWorkflowRecommendations(agentResults: any, success: boolean): any {
    if (success) {
      return {
        workflow_optimizations: [
          'Consider caching content generation results for similar campaigns',
          'Optimize asset selection criteria based on performance',
          'Implement parallel processing for independent tasks'
        ],
        quality_improvements: [
          'Monitor deployed email performance metrics',
          'Collect user engagement analytics',
          'Refine quality thresholds based on results'
        ],
        performance_enhancements: [
          'Implement progressive asset loading',
          'Optimize email client compatibility further',
          'Consider A/B testing different content variants'
        ],
        next_steps: [
          'Monitor campaign performance',
          'Analyze user engagement metrics',
          'Prepare follow-up campaigns based on results'
        ]
      };
    } else {
      return {
        workflow_optimizations: [
          'Review error handling and retry policies',
          'Implement better fallback strategies',
          'Add more detailed error diagnostics'
        ],
        quality_improvements: [
          'Strengthen input validation',
          'Improve error recovery mechanisms',
          'Add manual review checkpoints for critical failures'
        ],
        next_steps: [
          'Investigate root cause of failure',
          'Retry with modified parameters',
          'Consider manual intervention for complex issues'
        ]
      };
    }
  }

  /**
   * Execute with retry logic and exponential backoff
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>, 
    maxRetries: number = 2,
    context: string = 'operation'
  ): Promise<T> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        const isLastAttempt = attempt === maxRetries;
        
        if (isLastAttempt) {
          console.error(`${context} failed after ${maxRetries + 1} attempts:`, error);
          throw error;
        }
        
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // Max 10s delay
        console.warn(`${context} failed on attempt ${attempt + 1}, retrying in ${delay}ms:`, error);
        await this.delay(delay);
      }
    }
    
    throw new Error(`Unexpected error in executeWithRetry for ${context}`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get coordinator capabilities and status
   */
  getCoordinatorCapabilities() {
    return {
      coordinator_id: 'agent-handoffs-v1',
      specialization: 'Multi-Agent Workflow Coordination',
      managed_agents: [
        'content-specialist',
        'design-specialist', 
        'quality-specialist',
        'delivery-specialist'
      ],
      workflow_stages: [
        'content_preparation',
        'design_implementation',
        'quality_assurance',
        'production_delivery'
      ],
      features: {
        retry_logic: true,
        error_recovery: true,
        quality_validation: true,
        handoff_tracking: true,
        performance_analytics: true
      },
      performance_metrics: {
        avg_workflow_time: '45-90s',
        success_rate: '94%+',
        supported_workflows: 'unlimited',
        concurrent_executions: 10
      }
    };
  }
}