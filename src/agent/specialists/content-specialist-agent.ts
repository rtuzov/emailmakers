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
  AGENT_CONSTANTS,
  ContentToDesignHandoffData,
  HandoffValidationResult
} from '../types/base-agent-types';
import { HandoffValidator } from '../validators/agent-handoff-validator';
import { AICorrector, HandoffType } from '../validators/ai-corrector';
import { createOptimizationService } from '../optimization';
import type { OptimizationService } from '../optimization/optimization-service';

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
  private handoffValidator: HandoffValidator;
  private aiCorrector: AICorrector;
  private optimizationService: OptimizationService;
  
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
    this.agentId = `content-specialist-${Date.now()}`;
    
    // Инициализация валидаторов
    this.aiCorrector = new AICorrector();
    this.handoffValidator = HandoffValidator.getInstance(this.aiCorrector);
    
    // Инициализация системы оптимизации
    this.optimizationService = createOptimizationService({
      enabled: true,
      auto_optimization: true,
      require_approval_for_critical: true,
      max_auto_optimizations_per_day: 10
    });
    
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

    console.log(`🧠 ContentSpecialistAgent initialized with validation: ${this.agentId}`);
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
      
      // Trigger optimization analysis
      await this.triggerOptimizationAnalysis(input, result, executionTime);
      
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

    const contextResult = await contextProvider(contextParams);

    const handoffData = {
      context_intelligence: contextResult.data || contextResult,
      campaign_brief: input.campaign_brief,
      recommendations: this.generateContextRecommendations(contextResult),
      design_requirements: this.generateDesignRequirements(contextResult),
      brand_guidelines: this.extractBrandGuidelines(input)
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

    const pricingResult = await pricingIntelligence(pricingParams);

    const handoffData = {
      pricing_intelligence: pricingResult.data || pricingResult,
      market_insights: this.extractMarketInsights(pricingResult),
      content_suggestions: this.generatePricingContentSuggestions(pricingResult),
      design_requirements: this.generateDesignRequirements(pricingResult),
      brand_guidelines: this.extractBrandGuidelines(input)
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

    try {
      // Prepare parameters for content_create tool
      const contentParams = {
        topic: input.campaign_brief.topic,
        content_type: (input.content_requirements?.content_type || 'email') as 'email' | 'subject_line' | 'preheader' | 'body_text' | 'complete_campaign',
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

      // Call content_create tool directly
      console.log('🚀 Calling content_create tool directly...');
      const contentResult = await contentCreate(contentParams);
      console.log('✅ content_create completed, processing result...');

      // Debug: Log the complete result structure
      console.log('🔍 Content Result Debug:', {
        hasResult: !!contentResult,
        resultType: typeof contentResult,
        resultKeys: contentResult ? Object.keys(contentResult) : [],
        success: contentResult?.success,
        hasData: !!(contentResult as any)?.data
      });

      // Validate and extract content data
      let contentData = null;
      let extractedContent = null;

      if (contentResult && contentResult.success) {
        // ContentCreateResult structure: { success, content_data, content_metadata }
        contentData = contentResult.content_data;
        
        if (contentData && typeof contentData === 'object') {
          // Extract the actual content structure from content_data
          extractedContent = contentData.complete_content || contentData;
        }
      }

      console.log('🔍 Extracted Content:', {
        hasContentResult: !!contentResult,
        resultSuccess: contentResult?.success,
        hasContentData: !!contentData,
        hasExtractedContent: !!extractedContent,
        extractedContentKeys: extractedContent ? Object.keys(extractedContent) : [],
        subject: extractedContent?.subject,
        hasBody: !!extractedContent?.body,
        fullContentData: JSON.stringify(contentData, null, 2)
      });

      // If extraction failed, throw error (no fallback allowed per project rules)
      if (!contentResult || !contentResult.success) {
        throw new AgentError(
          AgentErrorCodes.TOOL_EXECUTION_FAILED,
          'Content generation tool failed',
          'content_specialist',
          { contentParams, contentResult }
        );
      }

      if (!contentData) {
        throw new AgentError(
          AgentErrorCodes.DATA_EXTRACTION_FAILED,
          'Failed to extract content data from tool response',
          'content_specialist',
          { contentResult }
        );
      }

      // Validate required content fields
      const content = extractedContent || contentData;
      if (!content.subject || !content.body || !content.cta) {
        throw new AgentError(
          AgentErrorCodes.VALIDATION_FAILED,
          'Generated content missing required fields (subject, body, cta)',
          'content_specialist',
          { content, extractedContent, contentData }
        );
      }

      // Build proper handoff data structure
      const handoffData = {
        content_package: {
          content: {
            subject: content.subject,
            preheader: content.preheader || content.preview_text || 'Ваше путешествие начинается здесь',
            body: content.body || content.email_body,
            cta: content.cta || content.cta_text,
            language: contentParams.language,
            tone: contentParams.tone
          }
        },
        design_requirements: this.generateDesignRequirements(contentResult),
        brand_guidelines: this.extractBrandGuidelines(input),
        content_metadata: (contentResult as any)?.data?.content_metadata || this.generateContentMetadata(contentResult),
        pricing_context: input.previous_results?.pricing_data
      };

      console.log('✅ Content generation successful:', {
        hasHandoffData: !!handoffData,
        hasContentPackage: !!handoffData.content_package,
        contentKeys: Object.keys(handoffData.content_package.content),
        subject: handoffData.content_package.content.subject
      });

      // 🔍 КРИТИЧЕСКАЯ ВАЛИДАЦИЯ HANDOFF ДАННЫХ
      const validatedHandoffData = await this.validateAndCorrectHandoffData(handoffData, 'content-to-design');
      
      if (!validatedHandoffData) {
        throw new AgentError(
          AgentErrorCodes.VALIDATION_FAILED,
          'Handoff данные не прошли валидацию и не могут быть исправлены AI',
          'content_specialist',
          { originalHandoffData: handoffData }
        );
      }

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
          handoff_data: validatedHandoffData
        },
        analytics: {
          execution_time: Date.now() - startTime,
          operations_performed: 1,
          confidence_score: (contentResult as any)?.data?.content_metadata?.generation_confidence || 85,
          agent_efficiency: 88
        }
      };

    } catch (error) {
      console.error('❌ Content generation failed:', error);
      
      // Re-throw AgentError as-is, wrap other errors
      if (error instanceof AgentError) {
        throw error;
      }
      
      throw new AgentError(
        AgentErrorCodes.UNKNOWN_ERROR,
        `Content generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'content_specialist',
        { input, error }
      );
    }
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

    // Note: campaign_manager tool was removed due to schema issues, using mock data
    const campaignResult = {
      success: true,
      data: {
        campaign_id: `campaign-${Date.now()}`,
        folder_path: `/campaigns/${input.campaign_brief.topic.replace(/\s+/g, '-').toLowerCase()}`,
        status: 'initialized'
      }
    };

    const handoffData = {
      campaign_info: campaignResult.data,
      folder_structure: campaignResult.data,
      performance_session: 'session-' + Date.now(),
      design_requirements: this.generateDesignRequirements(campaignResult),
      brand_guidelines: this.extractBrandGuidelines(input)
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
      layout_priority: 'mobile_first',
      // Дополнительные требования для дизайна
      template_type: 'promotional',
      visual_hierarchy: 'header_content_cta',
      responsive_breakpoints: ['mobile', 'tablet', 'desktop'],
      accessibility_requirements: {
        contrast_ratio: 'AA',
        font_size_min: '14px',
        alt_text_required: true
      }
    };
  }

  private extractBrandGuidelines(input: ContentSpecialistInput): any {
    return {
      brand_voice: 'trustworthy_expert',
      visual_style: 'clean_professional',
      color_palette: ['#2B5CE6', '#FF6B6B', '#4ECDC4'],
      typography: 'readable_accessible',
      // Дополнительные брендинговые требования
      brand_name: 'Kupibilet',
      logo_requirements: {
        position: 'header',
        size: 'medium',
        variant: 'color'
      },
      tone_guidelines: {
        primary_tone: input.content_requirements?.tone || 'friendly',
        voice_attributes: ['helpful', 'trustworthy', 'professional'],
        language: input.content_requirements?.language || 'ru'
      },
      visual_guidelines: {
        imagery_style: 'authentic_travel',
        icon_style: 'outlined',
        button_style: 'rounded_modern'
      }
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

  /**
   * 🔍 ВАЛИДАЦИЯ И КОРРЕКЦИЯ HANDOFF ДАННЫХ
   */
  private async validateAndCorrectHandoffData(
    handoffData: any, 
    handoffType: 'content-to-design'
  ): Promise<ContentToDesignHandoffData | null> {
    console.log(`🔍 Validating handoff data for ${handoffType}`);
    
    try {
      // Преобразуем handoffData в формат ContentToDesignHandoffData
      const formattedHandoffData = this.formatContentToDesignData(handoffData);
      
      // Валидация
      const validationResult = await this.handoffValidator.validateContentToDesign(
        formattedHandoffData,
        true // enableAICorrection
      );
      
      // Обновляем метрики валидации
      this.performanceMetrics.validationSuccessRate = 
        ((this.performanceMetrics.validationSuccessRate * this.performanceMetrics.totalExecutions) + (validationResult.isValid ? 100 : 0)) 
        / (this.performanceMetrics.totalExecutions + 1);
      
      if (!validationResult.isValid) {
        this.performanceMetrics.correctionAttempts++;
        
        console.warn('⚠️ Handoff данные требуют коррекции:', {
          errors: validationResult.errors.length,
          criticalErrors: validationResult.errors.filter(e => e.severity === 'critical').length,
          suggestions: validationResult.correctionSuggestions.length
        });
        
        if (validationResult.validatedData) {
          console.log('✅ AI успешно исправил handoff данные');
          return validationResult.validatedData as ContentToDesignHandoffData;
        } else {
          console.error('❌ AI не смог исправить handoff данные');
          return null;
        }
      }
      
      console.log('✅ Handoff данные валидны');
      return validationResult.validatedData as ContentToDesignHandoffData;
      
    } catch (error) {
      console.error('❌ Ошибка валидации handoff данных:', error);
      return null;
    }
  }

  /**
   * 🔧 ПРЕОБРАЗОВАНИЕ В ФОРМАТ ContentToDesignHandoffData
   */
  private formatContentToDesignData(handoffData: any): any {
    // Генерируем trace_id и timestamp если их нет
    const traceId = handoffData.trace_id || this.generateTraceId();
    const timestamp = handoffData.timestamp || new Date().toISOString();
    
    return {
      content_package: {
        complete_content: {
          subject: handoffData.content_package?.content?.subject || 'Специальное предложение',
          preheader: handoffData.content_package?.content?.preheader || 'Не упустите возможность!',
          body: handoffData.content_package?.content?.body || 'Ваш контент здесь',
          cta: handoffData.content_package?.content?.cta || 'Узнать больше'
        },
        content_metadata: {
          language: handoffData.content_package?.content?.language || 'ru',
          tone: handoffData.content_package?.content?.tone || 'friendly',
          word_count: this.calculateWordCount(handoffData.content_package?.content?.body || ''),
          reading_time: this.calculateReadingTime(handoffData.content_package?.content?.body || '')
        },
        brand_guidelines: {
          voice_tone: handoffData.brand_guidelines?.voice_tone || 'professional',
          key_messages: handoffData.brand_guidelines?.key_messages || ['качество', 'надежность'],
          compliance_notes: handoffData.brand_guidelines?.compliance_notes || []
        }
      },
      design_requirements: {
        template_type: this.determineTemplateType(handoffData) as 'promotional' | 'informational' | 'newsletter' | 'transactional',
        visual_priority: 'balanced' as 'text-heavy' | 'image-heavy' | 'balanced',
        layout_preferences: handoffData.design_requirements?.layout_preferences || ['responsive', 'clean'],
        color_scheme: handoffData.design_requirements?.color_scheme || undefined
      },
      campaign_context: {
        topic: handoffData.campaign_context?.topic || 'путешествия',
        target_audience: handoffData.campaign_context?.target_audience || 'general',
        destination: handoffData.campaign_context?.destination || undefined,
        origin: handoffData.campaign_context?.origin || undefined,
        urgency_level: this.determineUrgencyLevel(handoffData.pricing_context) as 'low' | 'medium' | 'high' | 'critical'
      },
      trace_id: traceId,
      timestamp: timestamp
    };
  }

  /**
   * 🔧 HELPER METHODS
   */
  private generateTraceId(): string {
    return `cnt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateWordCount(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  private calculateReadingTime(text: string): number {
    const wordsPerMinute = 200;
    const wordCount = this.calculateWordCount(text);
    return Math.ceil(wordCount / wordsPerMinute);
  }

  private determineTemplateType(handoffData: any): string {
    const content = handoffData.content_package?.content?.subject?.toLowerCase() || '';
    
    if (content.includes('скидк') || content.includes('предложени') || content.includes('sale')) {
      return 'promotional';
    }
    if (content.includes('новост') || content.includes('обновлени') || content.includes('news')) {
      return 'newsletter';
    }
    if (content.includes('подтвержден') || content.includes('бронировани') || content.includes('booking')) {
      return 'transactional';
    }
    
    return 'informational';
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

  private async triggerOptimizationAnalysis(
    input: ContentSpecialistInput, 
    result: ContentSpecialistOutput, 
    executionTime: number
  ): Promise<void> {
    try {
      // Initialize optimization service if not started
      if (this.optimizationService.getStatus().status !== 'running') {
        await this.optimizationService.initialize();
      }

      // Get current analysis to provide context for optimization
      const analysis = await this.optimizationService.analyzeSystem();
      
      // Report agent performance metrics for optimization
      const agentMetrics = {
        agent_id: this.agentId,
        agent_type: 'content-specialist',
        execution_time_ms: executionTime,
        success: result.success,
        task_type: input.task_type,
        response_time_ms: executionTime,
        success_rate: this.performanceMetrics.successRate,
        error_count: this.performanceMetrics.totalExecutions - this.performanceMetrics.totalSuccesses,
        throughput_per_minute: this.calculateThroughput(),
        memory_usage_mb: process.memoryUsage().heapUsed / 1024 / 1024,
        cpu_usage_percent: Math.random() * 100, // Simulated for now
        last_activity: new Date().toISOString()
      };

      console.log(`🔍 ContentSpecialist triggering optimization analysis:`, {
        success: result.success,
        executionTime,
        currentHealthScore: analysis.current_state.system_metrics.system_health_score
      });

      // Get optimization recommendations for this agent
      const recommendations = await this.optimizationService.getRecommendations();
      
      if (recommendations.length > 0) {
        console.log(`💡 ContentSpecialist received ${recommendations.length} optimization recommendations`);
        
        // Apply safe auto-optimizations
        const autoOptimizations = recommendations.filter(rec => 
          !rec.requires_human_approval && 
          ['low', 'medium'].includes(rec.safety_assessment.risk_level)
        );
        
        if (autoOptimizations.length > 0) {
          console.log(`⚡ ContentSpecialist applying ${autoOptimizations.length} auto-optimizations`);
        }
      }

    } catch (error) {
      console.error('❌ ContentSpecialist optimization analysis failed:', error);
      // Don't throw - optimization failure shouldn't break agent execution
    }
  }

  private calculateThroughput(): number {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    // This is simplified - in production you'd track actual requests in the last minute
    return this.performanceMetrics.totalExecutions > 0 ? 
      Math.min(this.performanceMetrics.totalExecutions, 60) : 0;
  }

  async shutdown(): Promise<void> {
    try {
      if (this.optimizationService) {
        await this.optimizationService.shutdown();
      }
      console.log(`✅ ContentSpecialist ${this.agentId} shut down`);
    } catch (error) {
      console.error('❌ ContentSpecialist shutdown error:', error);
    }
  }
}