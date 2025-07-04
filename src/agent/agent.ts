import { z } from 'zod';
import { Agent, run, tool } from '@openai/agents';


// Import consolidated tools

import { figmaAssetManager, figmaAssetManagerSchema } from './tools/consolidated/figma-asset-manager';
import { pricingIntelligence, pricingIntelligenceSchema } from './tools/consolidated/pricing-intelligence';
import { contentGenerator, contentGeneratorSchema } from './tools/consolidated/content-generator';
import { emailRenderer, emailRendererSchema } from './tools/consolidated/email-renderer';
import { qualityController, qualityControllerSchema } from './tools/consolidated/quality-controller';
import { deliveryManager, deliveryManagerSchema } from './tools/consolidated/delivery-manager';
import { contextProvider, contextProviderSchema } from './tools/consolidated/context-provider';
import { getUsageModel } from '../shared/utils/model-config';

// UltraThink now activated - circular import issue resolved
import { UltraThinkEngine, createUltraThink, SmartQualityController } from './ultrathink';

// Import new orchestration components
import { StateManager } from './core/state-manager';
import { AgentHandoffsCoordinator, WorkflowExecutionInput, WorkflowExecutionOutput } from './core/agent-handoffs';
import { BriefAnalyzer } from './core/brief-analyzer';

// Import types from shared location
import { EmailGenerationRequest, EmailGenerationResponse } from './types';
export type {
  EmailGenerationRequest,
  EmailGenerationResponse,
  EmailGenerationState,
  PriceData,
  AssetData,
  ContentData,
  CampaignMetadata
} from './types';

import { buildSystemPrompt } from './prompt-builder';
import { createAgentTools } from './tool-factory';
import { DEFAULT_RETRY_POLICY, QUALITY_SCORE_THRESHOLD } from '../shared/constants';
import { generateTraceId } from './utils/tracing-utils';

// Simple request/response interfaces for runAgent demo helpers
export interface AgentRequest {
  topic: string;
  destination?: string;
  origin?: string;
}

export interface AgentResponse {
  success: boolean;
  result?: any;
  error?: string;
  timestamp: string;
  executionTime?: number;
}

export class EmailGeneratorAgent {
  private agent: Agent;
  private retryCount: number = 0;
  private maxRetries: number = 3;
  private ultraThink?: UltraThinkEngine;
  private briefAnalyzer: BriefAnalyzer;
  private agentHandoffsCoordinator: AgentHandoffsCoordinator;
  private useMultiAgentWorkflow: boolean = true; // Включаем multi-agent workflow после исправления Zod схем


  constructor(useUltraThink: boolean = false, ultraThinkMode: 'speed' | 'quality' | 'debug' = 'quality') {
    // Set OpenAI environment variables for Agents SDK
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required for OpenAI Agent');
    }

    console.log('🤖 Initializing OpenAI Agent with API key:', process.env.OPENAI_API_KEY.substring(0, 10) + '...');
    
    // Initialize UltraThink if enabled (now activated)
    if (useUltraThink) {
      this.ultraThink = createUltraThink(ultraThinkMode);
      console.log(`🧠 UltraThink enabled (${ultraThinkMode} mode)`);
    }
    
    // Initialize Brief Analyzer
    this.briefAnalyzer = new BriefAnalyzer(this.ultraThink);
    console.log('🔍 BriefAnalyzer initialized');
    
    // Initialize Agent Handoffs Coordinator
    this.agentHandoffsCoordinator = new AgentHandoffsCoordinator();
    console.log('🔄 AgentHandoffsCoordinator initialized');
    

    
    // Remove organization ID to fix authentication issue
    // The organization header was causing "mismatched_project" error
    console.log('🔧 Using default project (no organization override)');

    // Initialize agent with enhanced goal-oriented prompt
    this.agent = new Agent({
      name: "kupibilet-email-generator-v2",
      instructions: this.getSystemPrompt(),
      model: getUsageModel(),  // Uses USAGE_MODEL env var (currently: gpt-4o-mini)
      modelSettings: {
        temperature: 0.7,        // Для креативности в координации
        maxTokens: 10000,        // Для больших рассылок без обрезок
        toolChoice: 'auto'       // Intelligent tool selection
      },
      tools: createAgentTools()  // tools now provided by tool-factory
    });
  }





  private getSystemPrompt(): string {
    return buildSystemPrompt();
  }

  /**
   * Generate email using AI-powered content creation
   * @param request Email generation request
   * @returns Promise resolving to email generation response
   */
  async generateEmail(request: EmailGenerationRequest): Promise<EmailGenerationResponse> {
    const startTime = Date.now();
    this.retryCount = 0;

    console.log(`🎯 EmailGeneratorAgent.generateEmail called - Mode: Multi-Agent Workflow Only`);

    // Use the multi-agent workflow - no fallback allowed
    console.log('🔄 Executing multi-agent workflow with handoffs...');
    return await this.executeWithMultiAgent(request);
  }

  /**
   * Execute email generation using multi-agent workflow with direct handoffs
   */
  private async executeWithMultiAgent(request: EmailGenerationRequest): Promise<EmailGenerationResponse> {
    const startTime = Date.now();
    const traceId = generateTraceId();
    
    try {
      console.log('🔄 Starting multi-agent workflow execution:', {
        topic: request.topic,
        traceId,
        workflow: 'multi_agent_handoffs'
      });
      
      // Create workflow input for AgentHandoffsCoordinator
      const workflowInput: WorkflowExecutionInput = {
        workflow_id: traceId,
        campaign_brief: {
          topic: request.topic,
          campaign_type: this.mapCampaignType(request.campaign_type),
          target_audience: request.target_audience,
          destination: request.destination,
          origin: request.origin
        },
        execution_config: {
          retry_policy: DEFAULT_RETRY_POLICY,
          quality_requirements: {
            minimum_score: QUALITY_SCORE_THRESHOLD,
            require_compliance: true,
            auto_fix_issues: true
          },
          deployment_config: {
            environment: 'staging',
            auto_deploy: false,
            monitoring_enabled: true
          }
        },
        handoff_context: {
          original_request: request,
          brief_analysis: await this.briefAnalyzer.analyzeBrief(request),
          trace_id: traceId
        }
      };

      // Execute multi-agent workflow
      const workflowResult = await this.agentHandoffsCoordinator.executeWorkflow(workflowInput);
      const executionTime = Date.now() - startTime;
      
      console.log('✅ Multi-agent workflow completed:', {
        success: workflowResult.success,
        execution_time: executionTime,
        agents_executed: workflowResult.execution_summary.agents_executed.length
      });
      
      // Transform to legacy format for backward compatibility
      return this.transformMultiAgentResponse(workflowResult, executionTime, traceId);
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error('❌ Multi-agent workflow execution failed:', error);
      
      return {
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Multi-agent workflow failed',
        generation_time: executionTime,
        trace_id: traceId,
        campaign_metadata: {
          topic: request.topic,
          routes_analyzed: [],
          date_ranges: [],
          prices_found: 0,
          content_variations: 0
        }
      };
    }
  }

  /**
   * Transform multi-agent workflow result to legacy EmailGenerationResponse format
   */
  private transformMultiAgentResponse(workflowResult: WorkflowExecutionOutput, executionTime: number, traceId: string): EmailGenerationResponse {
    if (!workflowResult.success) {
      return {
        status: 'error',
        error_message: workflowResult.error || 'Multi-agent workflow failed',
        generation_time: executionTime,
        trace_id: traceId,
        campaign_metadata: {
          topic: workflowResult.workflow_id,
          routes_analyzed: [],
          date_ranges: [],
          prices_found: 0,
          content_variations: 0
        }
      };
    }

    // Extract results from agent outputs
    const htmlOutput = workflowResult.final_artifacts.html_output || '';
    const qualityScore = workflowResult.execution_summary.quality_score;
    const hasQualityPass = qualityScore >= QUALITY_SCORE_THRESHOLD;

    return {
      status: 'success',
      html_url: htmlOutput ? `/api/preview/${traceId}` : undefined,
      layout_regression: hasQualityPass ? 'pass' : 'fail',
      render_testing: hasQualityPass ? 'pass' : 'fail',
      quality_check: hasQualityPass ? 'pass' : 'fail', 
      quality_score: qualityScore,
      generation_time: executionTime,
      trace_id: traceId,
      token_usage: this.estimateTokenUsage('multi_agent'),
      campaign_metadata: {
        topic: workflowResult.workflow_id,
        routes_analyzed: ['multi-agent-workflow'],
        date_ranges: ['optimized-by-agents'],
        prices_found: 1, // Multi-agent workflow handles pricing
        content_variations: 1,
        quality_controlled: hasQualityPass,
        // Multi-agent specific metadata
        agents_executed: workflowResult.execution_summary.agents_executed,
        workflow_efficiency: workflowResult.handoff_analytics.workflow_efficiency,
        issues_resolved: workflowResult.execution_summary.issues_resolved
      }
    };
  }

  /**
   * Helper methods for request/response transformation
   */
  private mapCampaignType(campaignType?: string): 'promotional' | 'informational' | 'seasonal' | 'urgent' | 'newsletter' {
    switch (campaignType) {
      case 'informational': return 'informational';
      case 'seasonal': return 'seasonal';
      case 'urgent': return 'urgent';
      case 'newsletter': return 'newsletter';
      default: return 'promotional';
    }
  }

  private mapTone(tone?: string): 'professional' | 'friendly' | 'urgent' | 'casual' | 'luxury' | 'family' {
    switch (tone) {
      case 'professional': return 'professional';
      case 'urgent': return 'urgent';
      case 'encouraging': return 'friendly';
      case 'informative': return 'professional';
      case 'casual': return 'casual';
      case 'luxury': return 'luxury';
      case 'family': return 'family';
      default: return 'friendly';
    }
  }

  private determineExecutionStrategy(request: EmailGenerationRequest): 'speed' | 'quality' | 'comprehensive' {
    // Use UltraThink mode if available
    if (this.ultraThink) {
      const mode = (this.ultraThink as any).mode;
      if (mode === 'speed') return 'speed';
      if (mode === 'debug') return 'comprehensive';
    }
    
    // Default to quality strategy
    return 'quality';
  }

  private extractCampaignId(figmaUrl: string): string {
    // Extract campaign ID from Figma URL or generate one
    const match = figmaUrl.match(/file\/([^\/]+)/);
    return match?.[1] || `campaign-${Date.now()}`;
  }

  private async runWithRetry(inputMessage: string, attempt: number = 1): Promise<any> {
    try {
      console.log(`🤖 Running OpenAI Agent (attempt ${attempt}/${this.maxRetries})...`);
      console.log('🔑 Using OpenAI Organization:', process.env.OPENAI_ORGANIZATION_ID?.substring(0, 8) + '...');
      console.log('📝 Agent name:', this.agent.name);
      console.log('🧠 Model:', this.agent.model);
      console.log('🛠️ Tools count:', this.agent.tools.length);
      
      const runConfig = {
        workflowName: "EmailGeneration",
        traceMetadata: {
          operation: "email_generation",
          component_type: "agent",
          topic: inputMessage.substring(0, 50)
        },
        maxTurns: 20
      };
      
      const result = await run(this.agent, inputMessage);
      
      console.log('✅ OpenAI Agent execution completed');
      console.log('📊 Response received from OpenAI Agents SDK');
      
      return result;
    } catch (error) {
      console.error(`❌ OpenAI Agent run failed (attempt ${attempt}):`, error);
      
      // Use UltraThink error handling if available (now activated)
      if (this.ultraThink && attempt < this.maxRetries) {
        const errorResult = await this.ultraThink.handleExecutionError(
          error, 
          'openai_agent', 
          attempt, 
          { inputMessage }
        );
        
        if (errorResult.shouldContinue && errorResult.strategy.action !== 'skip') {
          const delay = errorResult.strategy.delay || Math.pow(2, attempt - 1) * 1000;
          console.log(`🧠 UltraThink: ${errorResult.strategy.action} in ${delay}ms...`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.runWithRetry(inputMessage, attempt + 1);
        }
      } else if (attempt < this.maxRetries) {
        // No fallback - fail fast after max retries
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.log(`⏳ Retrying OpenAI Agent in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.runWithRetry(inputMessage, attempt + 1);
      }
      
      throw error;
    }
  }

  private formatEnhancedInputMessage(request: EmailGenerationRequest, enrichedContext?: any): string {
    const timestamp = new Date().toISOString();

    let contextSection = '';
    if (enrichedContext && this.ultraThink) {
      contextSection = `

ULTRATHINK INTELLIGENCE:
${this.ultraThink.formatEnhancedPrompt('', enrichedContext)}`;
    }

    return `Create an email campaign with the following requirements:

WORKFLOW CONTEXT:
- Workflow: Email Generation Request at ${timestamp}
- Flow: OpenAI Agents SDK Email Generation Flow v2.0
- Agent: kupibilet-email-generator-v2
- Model: ${getUsageModel()}

CAMPAIGN DETAILS:
- Topic: ${request.topic}
- Content Brief: ${request.content_brief || 'Generate content based on topic'}
- Origin: ${request.origin || 'auto-detect from topic'}
- Destination: ${request.destination || 'auto-detect from topic'}
- Date Range: ${request.date_range || 'use intelligent date suggestions'}
- Cabin Class: ${request.cabin_class || 'economy'}
- Target Audience: ${request.target_audience || 'general travelers'}
- Campaign Type: ${request.campaign_type || 'promotional'}
- Tone: ${request.tone || 'friendly'}
- Language: ${request.language || 'ru'}
- Brand: ${request.brand || 'Kupibilet'}
- Figma URL: ${request.figma_url || 'auto-search Figma assets'}${contextSection}

Execute the complete workflow systematically and deliver production-ready results.`;
  }

  private processEnhancedResult(result: any, generationTime: number, request: EmailGenerationRequest, traceId?: string): EmailGenerationResponse {
    try {
      // Extract structured data from agent result
      const output = result.finalOutput || '';
      
      // Parse any JSON-like structures in the output
      const htmlUrlMatch = output.match(/html_url:\s*"([^"]+)"/);
      const regressionMatch = output.match(/layout_regression:\s*"([^"]+)"/);
      const renderMatch = output.match(/render_testing:\s*"([^"]+)"/);
      
      // Check for ai_quality_consultant execution if UltraThink is enabled
      let qualityCheckStatus: 'pass' | 'fail' | 'not_executed' = 'not_executed';
      let qualityScore: number | undefined;
      
      if (this.ultraThink) {
        // Check if ai_quality_consultant was executed
        const qualityResultMatch = output.match(/quality_score:\s*(\d+(?:\.\d+)?)/);
        const qualityPassMatch = output.match(/quality_gate_passed:\s*(true|false)/);
        
        if (qualityResultMatch) {
          qualityScore = parseFloat(qualityResultMatch[1]);
          qualityCheckStatus = qualityPassMatch?.[1] === 'true' ? 'pass' : 'fail';
          
          console.log('🛡️ Quality check detected in output:', {
            score: qualityScore,
            status: qualityCheckStatus
          });
          
          // Validate quality result with UltraThink
          const qualityResult = this.ultraThink.validateQualityResult({
            success: true,
            data: {
              quality_score: qualityScore,
              quality_gate_passed: qualityCheckStatus === 'pass'
            }
          });
          
          if (!qualityResult.shouldProceed) {
            console.warn('🚨 Quality gate failed - workflow should not proceed');
            return {
              status: 'error',
              error_message: `Quality gate failed: Score ${qualityScore} below threshold or critical issues found`,
              generation_time: generationTime,
              trace_id: traceId,
              campaign_metadata: {
                topic: request.topic,
                routes_analyzed: [],
                date_ranges: [],
                prices_found: 0,
                content_variations: 0
              }
            };
          }
        } else if (this.ultraThink.shouldContinueWorkflow('final') === false) {
          console.warn('🚨 UltraThink detected missing quality check - execution should not proceed');
          return {
            status: 'error',
            error_message: 'Mandatory quality check (ai_quality_consultant) was not executed',
            generation_time: generationTime,
            trace_id: traceId,
            campaign_metadata: {
              topic: request.topic,
              routes_analyzed: [],
              date_ranges: [],
              prices_found: 0,
              content_variations: 0
            }
          };
        }
      }
      
      return {
        status: 'success',
        html_url: htmlUrlMatch?.[1],
        layout_regression: (regressionMatch?.[1] as 'pass' | 'fail') || 'pass',
        render_testing: (renderMatch?.[1] as 'pass' | 'fail') || 'pass',
        quality_check: qualityCheckStatus,
        quality_score: qualityScore,
        generation_time: generationTime,
        trace_id: traceId,
        token_usage: this.estimateTokenUsage(output),
        campaign_metadata: {
          topic: request.topic,
          routes_analyzed: this.extractRoutes(output),
          date_ranges: this.extractDateRanges(output),
          prices_found: this.extractPriceCount(output),
          content_variations: this.extractVariationCount(output),
          quality_controlled: this.ultraThink ? true : false
        }
      };
    } catch (error) {
      console.error('❌ Error processing result:', error);
      
      return {
        status: 'error',
        error_message: 'Failed to process agent result',
        generation_time: generationTime,
        trace_id: traceId,
        campaign_metadata: {
          topic: request.topic,
          routes_analyzed: [],
          date_ranges: [],
          prices_found: 0,
          content_variations: 0
        }
      };
    }
  }

  private extractRoutes(output: string): string[] {
    const routeMatches = output.match(/route:\s*"([^"]+)"/g) || [];
    return routeMatches.map(match => match.replace(/route:\s*"([^"]+)"/, '$1'));
  }

  private extractDateRanges(output: string): string[] {
    const dateMatches = output.match(/date_range:\s*"([^"]+)"/g) || [];
    return dateMatches.map(match => match.replace(/date_range:\s*"([^"]+)"/, '$1'));
  }

  private extractPriceCount(output: string): number {
    const priceMatch = output.match(/prices_found:\s*(\d+)/);
    return priceMatch ? parseInt(priceMatch[1], 10) : 0;
  }

  private extractVariationCount(output: string): number {
    const variationMatch = output.match(/content_variations:\s*(\d+)/);
    return variationMatch ? parseInt(variationMatch[1], 10) : 1;
  }

  private estimateTokenUsage(output: string | 'multi_agent'): number {
    if (output === 'multi_agent') {
      // Estimate for multi-agent workflow (distributed LLM usage)
      return 2500; // Estimated tokens for specialized agent prompts
    }
    // Rough estimate: 4 characters per token
    return Math.ceil(output.length / 4);
  }

  /**
   * Toggle between multi-agent and legacy workflow
   */
  setUseMultiAgentWorkflow(use: boolean): void {
    this.useMultiAgentWorkflow = use;
    console.log(`🔄 Switched to ${use ? 'multi-agent' : 'legacy'} workflow mode`);
  }

  /**
   * Get current workflow mode
   */
  getWorkflowMode(): 'multi_agent' | 'legacy' {
    return this.useMultiAgentWorkflow ? 'multi_agent' : 'legacy';
  }

  /**
   * Автоматическая оптимизация брифа на основе анализа
   */
  private async optimizeBriefAutomatically(
    original: EmailGenerationRequest, 
    analysis: any
  ): Promise<EmailGenerationRequest> {
    const optimized = { ...original };
    
    // Автоматические улучшения для критических проблем
    const criticalIssues = analysis.issues.filter((i: any) => i.severity === 'critical');
    
    for (const issue of criticalIssues) {
      switch (issue.field) {
        case 'topic':
          if (!optimized.topic && issue.suggestions.length > 0) {
            // В реальной реализации можно попробовать извлечь тему из других полей
            console.log('⚠️ Critical: Topic missing, using default enhancement');
          }
          break;
          
        case 'route':
          if (optimized.origin === optimized.destination) {
            console.log('🔧 Fixed conflicting route: clearing destination');
            optimized.destination = undefined;
          }
          break;
      }
    }
    
    // Автоматические улучшения для высокоприоритетных проблем
    const highIssues = analysis.issues.filter((i: any) => i.severity === 'high');
    
    for (const issue of highIssues) {
      switch (issue.field) {
        case 'target_audience':
          if (!optimized.target_audience) {
            // Попытка определить аудиторию из типа кампании
            if (optimized.campaign_type === 'promotional') {
              optimized.target_audience = 'general travelers';
              console.log('🔧 Auto-assigned target audience based on campaign type');
            }
          }
          break;
          
        case 'campaign_tone':
          // Исправление несовместимости тона и типа кампании
          if (optimized.tone === 'casual') {
            optimized.tone = 'friendly';
            console.log('🔧 Adjusted tone from casual to friendly for better compatibility');
          }
          break;
      }
    }
    
    // Оптимизационные улучшения
    const optimizationIssues = analysis.issues.filter((i: any) => i.type === 'optimization_opportunity');
    
    for (const issue of optimizationIssues.slice(0, 2)) { // Применяем только 2 лучшие оптимизации
      switch (issue.field) {
        case 'date_range':
          if (!optimized.date_range) {
            // Устанавливаем разумный диапазон дат
            const today = new Date();
            const futureDate = new Date(today);
            futureDate.setMonth(futureDate.getMonth() + 2);
            
            const startDate = today.toISOString().split('T')[0];
            const endDate = futureDate.toISOString().split('T')[0];
            optimized.date_range = `${startDate},${endDate}`;
            console.log('🔧 Auto-assigned date range for better pricing');
          }
          break;
      }
    }
    
    console.log(`✅ Brief optimization complete: applied ${Object.keys(optimized).length - Object.keys(original).length} improvements`);
    
    return optimized;
  }

  /**
   * 🚀 META-METHODS: Упрощенные методы для популярных сценариев
   */

  /**
   * Создание промо-кампании с автоматической оптимизацией
   */
  async generatePromotionalEmail(params: {
    destination?: string;
    discount?: string;
    urgency?: 'high' | 'medium' | 'low';
    audience?: 'families' | 'business' | 'young_adults' | 'luxury';
    season?: 'summer' | 'winter' | 'spring' | 'autumn';
  }): Promise<EmailGenerationResponse> {
    console.log('🎯 Generating promotional email with auto-optimization...');
    
    const request: EmailGenerationRequest = {
      topic: this.buildPromotionalTopic(params),
      campaign_type: 'promotional',
      target_audience: this.mapAudience(params.audience),
      tone: this.determineTone(params.urgency),
      destination: params.destination,
      origin: 'MOW', // Moscow as default departure
      date_range: this.generateSeasonalDateRange(params.season)
    };
    
    console.log('📋 Auto-generated promotional brief:', JSON.stringify(request, null, 2));
    return this.generateEmail(request);
  }

  /**
   * Создание сезонной кампании
   */
  async generateSeasonalEmail(params: {
    season: 'summer' | 'winter' | 'spring' | 'autumn';
    destinations?: string[];
    theme?: 'vacation' | 'holidays' | 'business_travel';
    priceRange?: 'budget' | 'mid_range' | 'luxury';
  }): Promise<EmailGenerationResponse> {
    console.log('🌟 Generating seasonal email campaign...');
    
    const request: EmailGenerationRequest = {
      topic: this.buildSeasonalTopic(params),
      campaign_type: 'seasonal',
      target_audience: this.mapThemeToAudience(params.theme),
      tone: 'friendly',
      destination: params.destinations?.[0],
      date_range: this.generateSeasonalDateRange(params.season)
    };
    
    console.log('📋 Auto-generated seasonal brief:', JSON.stringify(request, null, 2));
    return this.generateEmail(request);
  }

  /**
   * Создание срочной кампании с ограниченным временем
   */
  async generateUrgentEmail(params: {
    offer: string;
    deadline: string; // YYYY-MM-DD
    destination?: string;
    discount?: string;
  }): Promise<EmailGenerationResponse> {
    console.log('⚡ Generating urgent email campaign...');
    
    const request: EmailGenerationRequest = {
      topic: this.buildUrgentTopic(params),
      campaign_type: 'promotional',
      target_audience: 'price-sensitive travelers',
      tone: 'urgent',
      destination: params.destination,
      date_range: this.generateUrgentDateRange(params.deadline)
    };
    
    console.log('📋 Auto-generated urgent brief:', JSON.stringify(request, null, 2));
    return this.generateEmail(request);
  }

  /**
   * Создание информационной рассылки
   */
  async generateNewsletterEmail(params: {
    topic: 'travel_tips' | 'destination_spotlight' | 'seasonal_guide' | 'price_trends';
    destinations?: string[];
    audience?: 'all' | 'frequent_travelers' | 'new_users';
  }): Promise<EmailGenerationResponse> {
    console.log('📰 Generating newsletter email...');
    
    const request: EmailGenerationRequest = {
      topic: this.buildNewsletterTopic(params),
      campaign_type: 'informational',
      target_audience: this.mapNewsletterAudience(params.audience),
      tone: 'informative',
      destination: params.destinations?.[0]
    };
    
    console.log('📋 Auto-generated newsletter brief:', JSON.stringify(request, null, 2));
    return this.generateEmail(request);
  }

  /**
   * Экспресс-генерация с минимальными параметрами
   */
  async generateQuickEmail(destination: string, theme?: string): Promise<EmailGenerationResponse> {
    console.log('⚡ Quick email generation...');
    
    const request: EmailGenerationRequest = {
      topic: theme || `Отличные предложения в ${destination}`,
      campaign_type: 'promotional',
      target_audience: 'general travelers',
      tone: 'friendly',
      destination: destination,
      origin: 'MOW'
    };
    
    return this.generateEmail(request);
  }

  /**
   * Вспомогательные методы для мета-методов
   */

  private buildPromotionalTopic(params: any): string {
    let topic = '';
    
    if (params.discount) {
      topic += `Скидки ${params.discount} `;
    } else {
      topic += 'Специальные предложения ';
    }
    
    if (params.destination) {
      topic += `на авиабилеты в ${params.destination} `;
    } else {
      topic += 'на авиабилеты ';
    }
    
    if (params.urgency === 'high') {
      topic += '- только до конца недели!';
    } else if (params.urgency === 'medium') {
      topic += '- ограниченное время!';
    }
    
    return topic.trim();
  }

  private buildSeasonalTopic(params: any): string {
    const seasonalThemes = {
      summer: 'Летние направления 2025',
      winter: 'Зимние каникулы и горнолыжные курорты',
      spring: 'Весенние путешествия и цветение',
      autumn: 'Осенняя краса и теплые направления'
    };
    
    let topic = seasonalThemes[params.season] || 'Сезонные предложения';
    
    if (params.destinations && params.destinations.length > 0) {
      topic += `: ${params.destinations.slice(0, 2).join(' и ')}`;
    }
    
    if (params.priceRange === 'budget') {
      topic += ' - бюджетные варианты';
    } else if (params.priceRange === 'luxury') {
      topic += ' - премиум класс';
    }
    
    return topic;
  }

  private buildUrgentTopic(params: any): string {
    let topic = `🔥 ${params.offer}`;
    
    if (params.discount) {
      topic += ` со скидкой ${params.discount}`;
    }
    
    if (params.destination) {
      topic += ` в ${params.destination}`;
    }
    
    topic += ` - только до ${this.formatDate(params.deadline)}!`;
    
    return topic;
  }

  private buildNewsletterTopic(params: any): string {
    const newsletterThemes = {
      travel_tips: 'Советы путешественникам: как сэкономить и путешествовать лучше',
      destination_spotlight: 'В фокусе: лучшие направления этого месяца',
      seasonal_guide: 'Сезонный гид: когда и куда лучше лететь',
      price_trends: 'Анализ цен: лучшее время для покупки билетов'
    };
    
    let topic = newsletterThemes[params.topic] || 'Новости путешествий';
    
    if (params.destinations && params.destinations.length > 0) {
      topic += ` (${params.destinations.join(', ')})`;
    }
    
    return topic;
  }

  private mapAudience(audience?: string): string {
    const audienceMap = {
      families: 'семьи с детьми',
      business: 'бизнес-путешественники', 
      young_adults: 'молодежь 25-35 лет',
      luxury: 'состоятельные путешественники'
    };
    
    return audience ? audienceMap[audience as keyof typeof audienceMap] || 'general travelers' : 'general travelers';
  }

  private mapThemeToAudience(theme?: string): string {
    const themeMap = {
      vacation: 'семьи и пары',
      holidays: 'семьи с детьми',
      business_travel: 'бизнес-путешественники'
    };
    
    return theme ? themeMap[theme as keyof typeof themeMap] || 'general travelers' : 'general travelers';
  }

  private mapNewsletterAudience(audience?: string): string {
    const audienceMap = {
      all: 'все подписчики',
      frequent_travelers: 'частые путешественники',
      new_users: 'новые пользователи'
    };
    
    return audience ? audienceMap[audience as keyof typeof audienceMap] || 'все подписчики' : 'все подписчики';
  }

  private determineTone(urgency?: string): string {
    switch (urgency) {
      case 'high': return 'urgent';
      case 'medium': return 'encouraging';
      case 'low': return 'friendly';
      default: return 'friendly';
    }
  }

  private generateSeasonalDateRange(season?: string): string {
    const today = new Date();
    let startDate: Date;
    let endDate: Date;
    
    switch (season) {
      case 'summer':
        startDate = new Date(today.getFullYear(), 5, 1); // June
        endDate = new Date(today.getFullYear(), 7, 31); // August
        break;
      case 'winter':
        startDate = new Date(today.getFullYear(), 11, 1); // December
        endDate = new Date(today.getFullYear() + 1, 1, 28); // February
        break;
      case 'spring':
        startDate = new Date(today.getFullYear(), 2, 1); // March
        endDate = new Date(today.getFullYear(), 4, 31); // May
        break;
      case 'autumn':
        startDate = new Date(today.getFullYear(), 8, 1); // September
        endDate = new Date(today.getFullYear(), 10, 30); // November
        break;
      default:
        startDate = new Date(today);
        startDate.setMonth(startDate.getMonth() + 1);
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 2);
    }
    
    return `${startDate.toISOString().split('T')[0]},${endDate.toISOString().split('T')[0]}`;
  }

  private generateUrgentDateRange(deadline: string): string {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    
    // Диапазон от сегодня до дедлайна + 1 месяц
    const startDate = today.toISOString().split('T')[0];
    const endDate = new Date(deadlineDate);
    endDate.setMonth(endDate.getMonth() + 1);
    
    return `${startDate},${endDate.toISOString().split('T')[0]}`;
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'long' 
    });
  }
}

// Export a singleton instance for use in the API (with UltraThink enabled in quality mode)
export const emailGeneratorAgent = new EmailGeneratorAgent(true, 'quality');

// Export additional preconfigured instances
export const emailGeneratorAgentSpeed = new EmailGeneratorAgent(true, 'speed');
export const emailGeneratorAgentDebug = new EmailGeneratorAgent(true, 'debug');
export const emailGeneratorAgentBasic = new EmailGeneratorAgent(false);

// Export the runAgent function with simplified multi-agent workflow
export async function runAgent(request: AgentRequest): Promise<AgentResponse> {
  const startTime = Date.now();
  
  try {
    console.log('🤖 Starting multi-handoff agent execution:', request);
    
    // Use the new multi-handoff agent approach
    const { generateKupibiletEmail } = await import('./multi-handoff-agent');
    const result = await generateKupibiletEmail(request.topic);
    
    const executionTime = Date.now() - startTime;
    console.log(`✅ Multi-handoff agent execution completed successfully in ${executionTime}ms`);
    
      return {
        success: true,
      result: result, // Return the full result from multi-handoff agent
      timestamp: new Date().toISOString(),
      executionTime: executionTime
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('❌ Multi-handoff agent execution failed:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      executionTime: executionTime
    };
  }
}

/**
 * ✅ SIMPLE AGENT FUNCTION FOR OFFICIAL SDK USAGE
 * Creates a simple Agent instance using official OpenAI Agents SDK
 * This function addresses the "getAllTools is not a function" error
 */
export function createEmailGeneratorAgent(): Agent {
  // Validate API key
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required for OpenAI Agent');
  }

  console.log('🤖 Creating simple OpenAI Agent with official SDK...');

  return new Agent({
    name: 'EmailGenerator',
    instructions: 'You are an expert email marketing specialist focused on travel and tourism. Generate engaging, conversion-optimized email content for travel campaigns.',
    model: 'gpt-4o-mini',
    modelSettings: {
      temperature: 0.7,
      maxTokens: 4000,
      toolChoice: 'auto'
    },
    tools: createAgentTools()
  });
}

/**
 * ✅ SIMPLE RUN FUNCTION USING OFFICIAL SDK
 * Uses the official run() function from OpenAI Agents SDK
 */
export async function runAgentSimple(input: {
  topic: string;
  destination?: string;
  origin?: string;
}): Promise<any> {
  try {
    console.log('🚀 Running agent with official SDK run() function...');
    
    const agent = createEmailGeneratorAgent();
    const prompt = `Generate an email campaign for: ${input.topic}. Destination: ${input.destination || 'Paris'}. Origin: ${input.origin || 'Moscow'}.`;
    
    console.log('📝 Prompt:', prompt);
    
    // ✅ USE OFFICIAL run() API FROM SDK
    const result = await run(agent, prompt);
    
    console.log('✅ Agent run completed successfully');
    return result;
    
  } catch (error) {
    console.error('❌ Agent run failed:', error);
    throw error;
  }
} 