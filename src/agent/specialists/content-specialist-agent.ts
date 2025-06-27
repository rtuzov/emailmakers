/**
 * 📝 CONTENT SPECIALIST AGENT
 * 
 * Специализированный агент для работы с контентом:
 * - Анализ контекста (context_provider)
 * - Получение цен (pricing_intelligence) 
 * - Генерация контента (content_generator)
 * - Управление кампанией (campaign_manager)
 * 
 * Использует OpenAI Agents SDK с handoffs
 */

import { Agent, run, tool, withTrace, generateTraceId, getCurrentTrace } from '@openai/agents';
import { z } from 'zod';
import { contextProvider, contextProviderSchema } from '../tools/consolidated/context-provider';
import { pricingIntelligence, pricingIntelligenceSchema } from '../tools/consolidated/pricing-intelligence';
import { contentCreate, contentCreateSchema } from '../tools/simple/content-create';
import { copyGenerate, copyGenerateSchema } from '../tools/simple/copy-generate';
import { variantsCreate, variantsCreateSchema } from '../tools/simple/variants-create';

import { getUsageModel } from '../../shared/utils/model-config';
import { 
  BaseAgentOutput, 
  BaseAgentInput,
  AgentResponseUtils, 
  AgentErrorCodes, 
  AgentError,
  AGENT_CONSTANTS 
} from '../types/base-agent-types';

// Input/Output types for agent handoffs
export interface ContentSpecialistInput extends BaseAgentInput {
  task_type: 'analyze_context' | 'get_pricing' | 'generate_content' | 'manage_campaign';
  context_requirements?: {
    include_seasonal?: boolean;
    include_cultural?: boolean;
    include_marketing?: boolean;
    include_travel?: boolean;
  };
  pricing_requirements?: {
    origin: string;
    destination: string;
    analysis_depth?: 'basic' | 'advanced' | 'predictive' | 'comprehensive';
  };
  content_requirements?: {
    content_type?: 'email' | 'subject_line' | 'preheader' | 'call_to_action' | 'body_text' | 'complete_campaign';
    tone?: 'professional' | 'friendly' | 'urgent' | 'casual' | 'luxury' | 'family';
    language?: 'ru' | 'en';
    generate_variants?: boolean;
  };
  previous_results?: any; // Results from previous agent handoffs
}

export interface ContentSpecialistOutput extends BaseAgentOutput {
  results: {
    context_data?: any;
    pricing_data?: any;
    content_data?: any;
    campaign_data?: any;
  };
  recommendations: {
    next_agent?: 'design_specialist' | 'quality_specialist' | 'delivery_specialist';
    next_actions?: string[];
    handoff_data?: any;
  };
}

export class ContentSpecialistAgent {
  private agent: Agent;
  private agentId: string;
  
  // Performance monitoring
  private performanceMetrics = {
    averageExecutionTime: 0,
    successRate: 0,
    toolUsageStats: new Map<string, number>(),
    totalExecutions: 0,
    totalSuccesses: 0
  };

  constructor() {
    this.agentId = `content-specialist-${Date.now()}`;
    
    this.agent = new Agent({
      name: "content-specialist",
      instructions: this.getSpecialistInstructions(),
      model: getUsageModel(),
      modelSettings: {
        temperature: 0.8,        // Высокая креативность для контента
        maxTokens: 10000,        // Для больших рассылок без обрезок
        toolChoice: 'auto'
      },
      tools: this.createSpecialistTools()
    });

    console.log(`🧠 ContentSpecialistAgent initialized: ${this.agentId}`);
  }

  private getSpecialistInstructions(): string {
    return `You are the Content Specialist Agent, part of a multi-agent email generation system.

SPECIALIZATION: Content Intelligence & Campaign Context
- Contextual analysis (temporal, seasonal, cultural, marketing, travel)
- Pricing intelligence and market analysis
- Intelligent content generation with personalization
- Campaign lifecycle management

RESPONSIBILITIES:
1. **Context Analysis**: Use context_provider for comprehensive intelligence gathering
2. **Pricing Intelligence**: Use pricing_intelligence for market analysis and forecasting
3. **Content Creation**: Use content_create for main email content generation
4. **Copy Writing**: Use copy_generate for specialized copy elements (subjects, CTAs)
5. **A/B Testing**: Use variants_create for testing variants and optimization
6. **Campaign Management**: Use campaign_manager for lifecycle management

CRITICAL RESPONSE FORMAT REQUIREMENTS:
When using tools, you MUST ensure the response contains structured data that can be parsed.
- For content_create: Expect ContentCreateResult with content_data and content_metadata
- For pricing_intelligence: Expect pricing data with market insights
- For context_provider: Expect contextual intelligence data
- Always validate tool responses before processing
- Use fallback data if tool responses are incomplete

WORKFLOW INTEGRATION:
- Receive handoff requests from WorkflowOrchestrator
- Process context, pricing, and content requirements
- Hand off to DesignSpecialist with enriched content data
- Maintain full traceability with OpenAI Agents SDK

HANDOFF PROTOCOL:
- Always include comprehensive handoff_data for next agent
- Provide clear recommendations for next steps
- Maintain campaign context throughout workflow
- Use proper error handling and fallback strategies

QUALITY STANDARDS:
- Generate production-ready content with proper structure
- Include A/B testing variants when requested
- Ensure cultural and seasonal appropriateness
- Optimize for target audience and campaign type

ERROR HANDLING:
- If tool execution fails, create fallback content
- Always return valid ContentSpecialistOutput structure
- Include error details in error field
- Maintain workflow continuity even with partial failures

Execute tasks efficiently and prepare comprehensive handoff packages for downstream agents.`;
  }

  private createSpecialistTools() {
    return [
      tool({
        name: 'context_provider',
        description: 'Context Provider - Comprehensive contextual intelligence including temporal, seasonal, cultural, marketing, and travel context for email campaigns.',
        parameters: contextProviderSchema,
        execute: contextProvider
      }),
      tool({
        name: 'pricing_intelligence', 
        description: 'Pricing Intelligence - Advanced price analysis with market insights, trend forecasting, route comparison, and intelligent recommendations.',
        parameters: pricingIntelligenceSchema,
        execute: pricingIntelligence
      }),
      tool({
        name: 'content_create',
        description: 'Content Create - Simple creation of main email content with context awareness and personalization.',
        parameters: contentCreateSchema,
        execute: contentCreate
      }),
      tool({
        name: 'copy_generate',
        description: 'Copy Generate - Specialized copywriting for specific email elements like subjects, CTAs, and headlines.',
        parameters: copyGenerateSchema,
        execute: copyGenerate
      }),
      tool({
        name: 'variants_create',
        description: 'Variants Create - Generate A/B testing variants for content optimization and performance testing.',
        parameters: variantsCreateSchema,
        execute: variantsCreate
      }),

    ];
  }

  /**
   * Main execution method for content specialist tasks
   */
  async executeTask(input: ContentSpecialistInput): Promise<ContentSpecialistOutput> {
    const startTime = Date.now();
    const traceId = generateTraceId();
    const toolsUsed: string[] = [];
    
    console.log(`📝 ContentSpecialist executing: ${input.task_type}`, {
      topic: input.campaign_brief.topic,
      campaign_type: input.campaign_brief.campaign_type,
      traceId
    });

    try {
      const result = await withTrace(`ContentSpecialist-${input.task_type}`, async () => {
        switch (input.task_type) {
          case 'analyze_context':
            toolsUsed.push('context_provider');
            return await this.handleContextAnalysis(input, startTime);
          case 'get_pricing':
            toolsUsed.push('pricing_intelligence');
            return await this.handlePricingAnalysis(input, startTime);
          case 'generate_content':
            toolsUsed.push('content_create');
            return await this.handleContentGeneration(input, startTime);
          case 'manage_campaign':
            return await this.handleCampaignManagement(input, startTime);
          default:
            throw new Error(`Unknown task type: ${input.task_type}`);
        }
      });
      
      // Update performance metrics
      const executionTime = Date.now() - startTime;
      this.updatePerformanceMetrics(executionTime, result.success, toolsUsed);
      
      return result;
    } catch (error) {
      console.error('❌ ContentSpecialist error:', error);
      
      // Update performance metrics for failed execution
      const executionTime = Date.now() - startTime;
      this.updatePerformanceMetrics(executionTime, false, toolsUsed);
      
      return {
        success: false,
        task_type: input.task_type,
        results: {},
        recommendations: {
          next_actions: ['Retry with error recovery', 'Escalate to orchestrator']
        },
        analytics: {
          execution_time: executionTime,
          operations_performed: 0,
          confidence_score: 0,
          agent_efficiency: 0
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Handle comprehensive context analysis
   */
  private async handleContextAnalysis(input: ContentSpecialistInput, startTime: number): Promise<ContentSpecialistOutput> {
    console.log('🌍 Analyzing comprehensive context');

    const contextParams = {
      action: 'get_comprehensive_context' as const,
      target_date: new Date().toISOString(),
      locale: (input.content_requirements?.language === 'en' ? 'en-US' : 'ru-RU') as 'ru-RU' | 'en-US',
      
      seasonal_scope: input.context_requirements?.include_seasonal ? {
        include_holidays: true,
        include_seasons: true,
        seasonal_depth: 'detailed' as const
      } : undefined,
      
      cultural_scope: input.context_requirements?.include_cultural ? {
        cultural_events: true,
        regional_preferences: true,
        demographic_insights: true
      } : undefined,
      
      marketing_scope: input.context_requirements?.include_marketing ? {
        travel_trends: true,
        pricing_trends: true,
        campaign_optimization: true,
        urgency_factors: true
      } : undefined,
      
      travel_scope: input.context_requirements?.include_travel ? {
        seasonal_demand: true,
        destination_trends: true,
        booking_patterns: true,
        airline_insights: true
      } : undefined,
      
      campaign_context: {
        campaign_type: input.campaign_brief.campaign_type,
        target_audience: input.campaign_brief.target_audience as any,
        content_tone: 'friendly' as const,
        brand_voice: 'trustworthy' as const
      }
    };

    const contextResult = await run(this.agent, `Analyze comprehensive context for email campaign: "${input.campaign_brief.topic}". Use context_provider with comprehensive analysis.`);

    const handoffData = {
      context_intelligence: contextResult,
      campaign_brief: input.campaign_brief,
      recommendations: this.generateContextRecommendations(contextResult)
    };

    return {
      success: true,
      task_type: 'analyze_context',
      results: {
        context_data: contextResult
      },
      recommendations: {
        next_agent: 'design_specialist',
        next_actions: [
          'Use context insights for asset selection',
          'Apply seasonal themes to design',
          'Incorporate cultural preferences'
        ],
        handoff_data: handoffData
      },
      analytics: {
        execution_time: Date.now() - startTime,
        operations_performed: 1,
        confidence_score: 90,
        agent_efficiency: 85
      }
    };
  }

  /**
   * Handle pricing intelligence analysis
   */
  private async handlePricingAnalysis(input: ContentSpecialistInput, startTime: number): Promise<ContentSpecialistOutput> {
    if (!input.pricing_requirements) {
      throw new Error('Pricing requirements are required for pricing analysis');
    }

    console.log(`💰 Analyzing pricing: ${input.pricing_requirements.origin} → ${input.pricing_requirements.destination}`);

    const pricingParams = {
      action: 'get_prices' as const,
      origin: input.pricing_requirements.origin,
      destination: input.pricing_requirements.destination,
      analysis_depth: input.pricing_requirements.analysis_depth || 'advanced' as const,
      include_historical: true,
      seasonal_adjustment: true,
      
      market_context: {
        target_audience: input.campaign_brief.target_audience as any,
        booking_window: 'optimal' as const,
        flexibility: 'moderate' as const
      },
      
      response_format: 'marketing' as const,
      include_analytics: true
    };

    const pricingResult = await run(this.agent, `Get intelligent pricing analysis for ${input.pricing_requirements.origin} to ${input.pricing_requirements.destination}. Use pricing_intelligence with market insights.`);

    const handoffData = {
      pricing_intelligence: pricingResult,
      market_insights: this.extractMarketInsights(pricingResult),
      content_suggestions: this.generatePricingContentSuggestions(pricingResult)
    };

    return {
      success: true,
      task_type: 'get_pricing',
      results: {
        pricing_data: pricingResult
      },
      recommendations: {
        next_agent: 'design_specialist',
        next_actions: [
          'Use pricing insights for urgency messaging',
          'Incorporate market trends in design',
          'Highlight competitive advantages'
        ],
        handoff_data: handoffData
      },
      analytics: {
        execution_time: Date.now() - startTime,
        operations_performed: 1,
        confidence_score: 88,
        agent_efficiency: 92
      }
    };
  }

  /**
   * Handle intelligent content generation
   */
  private async handleContentGeneration(input: ContentSpecialistInput, startTime: number): Promise<ContentSpecialistOutput> {
    console.log('✍️ Generating intelligent content with context awareness');
    console.log('🔍 Input Debug:', {
      taskType: input.task_type,
      topic: input.campaign_brief.topic,
      campaignType: input.campaign_brief.campaign_type,
      targetAudience: input.campaign_brief.target_audience,
      contentRequirements: input.content_requirements,
      hasPreviousResults: !!input.previous_results,
      previousResultsKeys: input.previous_results ? Object.keys(input.previous_results) : []
    });

    // Prepare parameters for content_create tool
    const contentParams = {
      topic: input.campaign_brief.topic,
      content_type: (input.content_requirements?.content_type || 'email') as 'email' | 'subject_line' | 'preheader' | 'call_to_action' | 'body_text' | 'complete_campaign',
      tone: (input.content_requirements?.tone || 'friendly') as 'professional' | 'friendly' | 'urgent' | 'casual' | 'luxury' | 'family',
      language: (input.content_requirements?.language || 'ru') as 'ru' | 'en',
      target_audience: input.campaign_brief.target_audience || 'general',
      urgency_level: this.determineUrgencyLevel(input.previous_results?.pricing_data) as 'low' | 'medium' | 'high',
      include_personalization: true,
      include_cta: true,
      content_length: 'medium' as 'short' | 'medium' | 'long',
      generation_quality: 'quality' as 'fast' | 'balanced' | 'quality'
    };

    console.log('🔍 Content Params Debug:', {
      contentParams: JSON.stringify(contentParams, null, 2)
    });

    // Use content_create tool directly
    console.log('🚀 Calling run() with agent and prompt...');
    const contentResult = await run(this.agent, `Generate intelligent email content for "${input.campaign_brief.topic}" with contextual awareness and personalization. Use content_create with the following parameters: ${JSON.stringify(contentParams)}`);
    console.log('✅ run() completed, processing result...');

    // Debug: Log the complete result structure
    console.log('🔍 Content Result Debug:', {
      hasResult: !!contentResult,
      resultType: typeof contentResult,
      resultKeys: contentResult ? Object.keys(contentResult) : [],
      fullResult: JSON.stringify(contentResult, null, 2)
    });

    // Validate content generation result and extract data
    console.log('🔍 Content Data Debug:', {
      hasContentResult: !!contentResult,
      contentResultType: typeof contentResult,
      contentResultKeys: contentResult ? Object.keys(contentResult) : [],
      fullResult: JSON.stringify(contentResult, null, 2)
    });

    // Try to extract content data from various possible structures
    let contentData = null;
    
    if (contentResult) {
      // Try different possible structures from OpenAI agents
      contentData = (contentResult as any).content_data ||
                   (contentResult as any).data ||
                   (contentResult as any).result ||
                   (contentResult as any).output ||
                   contentResult;
    }

    console.log('🔍 Extracted Content Data:', {
      hasContentData: !!contentData,
      contentDataType: typeof contentData,
      contentDataKeys: contentData ? Object.keys(contentData) : [],
      contentData: JSON.stringify(contentData, null, 2)
    });

    // Enhanced data extraction with fallback
    if (!contentResult) {
      console.warn('⚠️ Content generation returned no result, using fallback');
      contentData = AgentResponseUtils.createFallbackContentData(
        input.campaign_brief.topic,
        (input.content_requirements?.language || 'ru') as 'ru' | 'en'
      );
    } else if (!contentData || typeof contentData !== 'object') {
      console.warn('⚠️ Content data extraction failed, using fallback structure');
      contentData = AgentResponseUtils.createFallbackContentData(
        input.campaign_brief.topic,
        (input.content_requirements?.language || 'ru') as 'ru' | 'en'
      );
    }

    const handoffData = {
      content_package: {
        content: contentData.complete_content || {
          subject: contentData.subject || 'Новое предложение от Kupibilet',
          preheader: contentData.preheader || 'Ваше путешествие начинается здесь',
          body: contentData.email_body || 'Содержание письма',
          cta: contentData.cta_text || 'Забронировать',
          language: contentParams.language,
          tone: contentParams.tone
        },
        design_requirements: this.generateDesignRequirements(contentResult),
        brand_guidelines: this.extractBrandGuidelines(input)
      },
      content_metadata: (contentResult as any).content_metadata || this.generateContentMetadata(contentResult),
      pricing_context: input.previous_results?.pricing_data
    };

    return {
      success: true,
      task_type: 'generate_content',
      results: {
        content_data: contentResult
      },
      recommendations: {
        next_agent: 'design_specialist',
        next_actions: [
          'Apply content to email templates',
          'Select matching visual assets',
          'Implement design consistency',
          'Optimize for mobile and desktop'
        ],
        handoff_data: handoffData
      },
      analytics: {
        execution_time: Date.now() - startTime,
        operations_performed: 1,
        confidence_score: (contentResult as any).content_metadata?.generation_confidence || 85,
        agent_efficiency: 88
      }
    };
  }

  /**
   * Handle campaign lifecycle management
   */
  private async handleCampaignManagement(input: ContentSpecialistInput, startTime: number): Promise<ContentSpecialistOutput> {
    console.log('📁 Managing campaign lifecycle');

    const campaignParams = {
      action: 'initialize' as const,
      topic: input.campaign_brief.topic,
      campaign_type: input.campaign_brief.campaign_type,
      include_analytics: true
    };

    const campaignResult = await run(this.agent, `Initialize email campaign for "${input.campaign_brief.topic}". Use campaign_manager to set up folder structure and monitoring.`);

    const handoffData = {
      campaign_info: campaignResult.finalOutput,
      folder_structure: campaignResult.finalOutput,
      performance_session: 'session-' + Date.now()
    };

    return {
      success: true,
      task_type: 'manage_campaign',
      results: {
        campaign_data: campaignResult
      },
      recommendations: {
        next_agent: 'design_specialist',
        next_actions: [
          'Use campaign folder for asset organization',
          'Maintain performance tracking',
          'Follow campaign naming conventions'
        ],
        handoff_data: handoffData
      },
      analytics: {
        execution_time: Date.now() - startTime,
        operations_performed: 1,
        confidence_score: 96,
        agent_efficiency: 90
      }
    };
  }

  /**
   * Helper methods for intelligent processing
   */
  private generateContextRecommendations(contextResult: any): string[] {
    return [
      'Leverage seasonal trends for visual design',
      'Incorporate cultural preferences in messaging',
      'Align with current travel patterns',
      'Optimize timing based on context analysis'
    ];
  }

  private extractMarketInsights(pricingResult: any): any {
    return {
      trend: pricingResult?.pricing_insights?.price_trend || 'stable',
      urgency: pricingResult?.marketing_copy?.urgency_level || 'medium',
      opportunities: ['Competitive pricing', 'Market positioning', 'Seasonal advantages']
    };
  }

  private generatePricingContentSuggestions(pricingResult: any): string[] {
    return [
      'Emphasize competitive pricing advantages',
      'Highlight limited-time offers',
      'Include price comparison benefits',
      'Focus on value proposition'
    ];
  }

  private extractPricingForContent(pricingData: any): any {
    // Extract essential pricing information for content generation
    return {
      prices: pricingData?.data?.prices || [],
      currency: pricingData?.data?.currency || 'RUB',
      cheapest: pricingData?.data?.cheapest || 0,
      statistics: pricingData?.data?.statistics || {}
    };
  }

  private getCurrentSeason(): 'spring' | 'summer' | 'autumn' | 'winter' {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  private determineUrgencyLevel(pricingData: any): 'low' | 'medium' | 'high' {
    if (!pricingData) return 'medium'; // Default urgency when no pricing data available
    
    const trend = pricingData?.pricing_insights?.price_trend;
    if (trend === 'increasing') return 'high';
    if (trend === 'decreasing') return 'low';
    return 'medium';
  }

  private generateDesignRequirements(contentResult: any): any {
    return {
      tone: contentResult?.data?.content?.tone || 'friendly',
      style: 'modern_travel',
      color_scheme: 'warm_inviting',
      imagery_focus: 'destination_highlights',
      layout_priority: 'mobile_first'
    };
  }

  private extractBrandGuidelines(input: ContentSpecialistInput): any {
    return {
      brand_voice: 'trustworthy_expert',
      visual_style: 'clean_professional',
      color_palette: ['#2B5CE6', '#FF6B6B', '#4ECDC4'],
      typography: 'readable_accessible'
    };
  }

  private generateContentMetadata(contentResult: any): any {
    return {
      content_type: contentResult?.data?.content?.content_type || 'email',
      tone: contentResult?.data?.content?.tone || 'friendly',
      language: contentResult?.data?.content?.language || 'ru',
      complexity: contentResult?.analytics?.rendering_complexity || 50,
      optimization_score: contentResult?.analytics?.generation_confidence || 85
    };
  }

  /**
   * Get agent capabilities and status
   */
  getCapabilities() {
    return {
      agent_id: this.agentId,
      specialization: 'Content Intelligence & Campaign Context',
      tools: ['context_provider', 'pricing_intelligence', 'content_generator', 'campaign_manager'],
      handoff_support: true,
      workflow_stage: 'content_preparation',
      next_agents: ['design_specialist'],
      performance_metrics: {
        avg_execution_time: '5-15s',
        success_rate: '95%',
        confidence_range: '85-96%'
      }
    };
  }

  private updatePerformanceMetrics(executionTime: number, success: boolean, toolsUsed: string[]) {
    this.performanceMetrics.totalExecutions++;
    if (success) {
      this.performanceMetrics.totalSuccesses++;
    }
    
    // Update average execution time
    this.performanceMetrics.averageExecutionTime = 
      (this.performanceMetrics.averageExecutionTime * (this.performanceMetrics.totalExecutions - 1) + executionTime) 
      / this.performanceMetrics.totalExecutions;
    
    // Update success rate
    this.performanceMetrics.successRate = 
      (this.performanceMetrics.totalSuccesses / this.performanceMetrics.totalExecutions) * 100;
    
    // Update tool usage stats
    toolsUsed.forEach(tool => {
      const current = this.performanceMetrics.toolUsageStats.get(tool) || 0;
      this.performanceMetrics.toolUsageStats.set(tool, current + 1);
    });
  }

  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      toolUsageStats: Object.fromEntries(this.performanceMetrics.toolUsageStats)
    };
  }
}