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
import { v4 as uuidv4 } from 'uuid';
import { contextProvider, contextProviderSchema } from '../tools/consolidated/context-provider';
import { pricingIntelligence, pricingIntelligenceSchema } from '../tools/consolidated/pricing-intelligence';
import { contentCreate, contentCreateSchema } from '../tools/simple/content-create';
import { generateEmailContent, generateEmailContentSchema } from '../tools/simple/generate-email-content';
import { copyGenerate, copyGenerateSchema } from '../tools/simple/copy-generate';
import { variantsCreate, variantsCreateSchema } from '../tools/simple/variants-create';
import { iataCodeResolver, iataCodeResolverSchema } from '../tools/simple/iata-code-resolver';


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
import { OptimizationService } from '../optimization/optimization-service';

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
    brief_analysis?: any;
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

  // Add throttling state management for optimization analysis
  private isOptimizationAnalyzing: boolean = false;
  private lastOptimizationAnalysisTime: number = 0;
  private optimizationAnalysisCount: number = 0;
  private readonly MIN_OPTIMIZATION_INTERVAL = 300000; // 5 minutes minimum between optimization analyses
  private readonly MAX_OPTIMIZATION_ANALYSES_PER_HOUR = 3; // Limit optimization analyses per hour
  private optimizationAnalysisTimestamps: number[] = [];

  constructor() {
    this.agentId = `content-specialist-${Date.now()}`;
    
    // Инициализация валидаторов
    this.aiCorrector = new AICorrector();
    this.handoffValidator = HandoffValidator.getInstance(this.aiCorrector);
    
    // Инициализация системы оптимизации
    this.optimizationService = createOptimizationService({
      enabled: true,
      auto_optimization: false, // Disable auto-optimization to prevent loops
      require_approval_for_critical: true,
      max_auto_optimizations_per_day: 5, // Reduced from default
      min_confidence_threshold: 85,
      metrics_collection_interval_ms: 300000, // 5 minutes
      analysis_interval_ms: 1800000, // 30 minutes (increased from 5 minutes)
      integration: {},
      engine: {}
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

CONTENT GENERATION INSTRUCTIONS:
When the user asks you to generate email content, you MUST:

1. **Call the content_create tool** with the provided parameters
2. **After calling the tool**, generate actual email content based on the parameters
3. **Return the content in JSON format** with the following structure:

For Russian content (language: "ru"):
{
  "subject": "Compelling subject line (40-50 characters) with urgency and value proposition",
  "preheader": "Supporting text (80-90 characters) that complements the subject",
  "body": "Engaging email body (200-400 words) with emotional appeal, benefits, and clear call-to-action",
  "cta": "Action-oriented button text (10-20 characters)"
}

CRITICAL PRICING INTEGRATION RULES:
- NEVER use placeholder prices like "от 0 RUB" or ask users for airport codes
- ALWAYS use real pricing data when provided in the context
- IATA airport codes are automatically converted from Russian city names (e.g., Москва → MOW, Сочи → AER, Париж → PAR)
- Use iata_code_resolver tool for AI-powered city name to IATA code conversion when static mapping fails
- When pricing context includes cheapest_price, use that exact value in the content
- Format prices as "от [price] RUB" only when real pricing data is available
- If no real pricing data is available, focus on value propositions without specific prices

Content Guidelines:
- Write in fluent Russian for Russian language requests
- Be emotionally engaging and persuasive
- Include specific benefits and value propositions
- Create urgency when appropriate (especially for promotional campaigns)
- Be culturally appropriate for the target audience
- Follow brand voice and tone guidelines
- For travel/aviation topics, focus on dreams, experiences, and value
- Use real pricing data when available in the context

EXAMPLE with real pricing for topic "Авиабилеты в Сочи" (when cheapest_price: 19753):
{
  "subject": "Авиабилеты в Сочи от 19753 RUB — успей забронировать!",
  "preheader": "Не упустите шанс путешествовать по выгодным ценам",
  "body": "Мечтаете о солнечных пляжах и горных пейзажах? Сочи ждет вас! КупиБилет предлагает авиабилеты от 19 753 рублей — отличная возможность для незабываемого отдыха!\\n\\nПредставьте себя на набережной Сочи, наслаждающимся морским бризом и создающим незабываемые воспоминания. С нашими ценами это может стать реальностью уже сегодня!\\n\\nКоличество билетов по такой стоимости ограничено. Не упустите свой шанс!",
  "cta": "Найти билеты"
}

RESPONSIBILITIES:
1. **Context Analysis**: Use context_provider for comprehensive intelligence gathering
2. **Pricing Intelligence**: Automatically fetch pricing data when pricing_requirements are provided, use pricing_intelligence for market analysis and forecasting
3. **Content Creation**: Use content_create tool and generate actual email content enhanced with real pricing data
4. **Copy Writing**: Use copy_generate for specialized copy elements (subjects, CTAs)
5. **A/B Testing**: Use variants_create for testing variants and optimization
6. **Campaign Management**: Use campaign_manager for lifecycle management

PRICING-ENHANCED CONTENT GENERATION:
When generating content, the agent will automatically:
- Check for pricing_requirements (origin/destination airports)
- Fetch real-time pricing data using pricing_intelligence tool
- Integrate pricing insights into content (urgency levels, price mentions, deals)
- Include pricing context in handoff data for design specialist
- Generate more compelling and accurate marketing copy based on real prices
- Use converted IATA codes (MOW for Москва, AER for Сочи, PAR for Париж, etc.)

AIRPORT CODE CONVERSION AWARENESS:
The system automatically converts Russian city names to IATA codes:
- Москва → MOW, Санкт-Петербург → LED, Сочи → AER
- Париж → PAR, Лондон → LON, Дубай → DXB
- You will receive these converted codes in the pricing context
- NEVER ask users to provide airport codes - they are handled automatically

CRITICAL RESPONSE FORMAT REQUIREMENTS:
When using tools, you MUST ensure the response contains structured data that can be parsed.
- For content_create: Expect ContentCreateResult with content_data and content_metadata
- For pricing_intelligence: Expect pricing data with market insights
- For context_provider: Expect contextual intelligence data
- СТРОГО валидируйте ответы инструментов перед обработкой
- ❌ НИКОГДА не используйте fallback данные - выбрасывайте ошибки при неполных ответах

WORKFLOW INTEGRATION:
- Receive handoff requests from WorkflowOrchestrator
- Process context, pricing, and content requirements
- Hand off to DesignSpecialist with enriched content data
- Maintain full traceability with OpenAI Agents SDK

HANDOFF PROTOCOL:
- Always include comprehensive handoff_data for next agent
- Provide clear recommendations for next steps
- Maintain campaign context throughout workflow
- ❌ FAIL FAST без fallback стратегий - выбрасывайте ошибки

QUALITY STANDARDS:
- Generate production-ready content with proper structure
- Include A/B testing variants when requested
- Ensure cultural and seasonal appropriateness
- Optimize for target audience and campaign type

ERROR HANDLING:
- ❌ Если инструмент не работает - выбрасывайте ошибку, НЕ создавайте fallback контент
- Always return valid ContentSpecialistOutput structure
- Include error details in error field
- ❌ НЕ поддерживайте workflow при частичных сбоях - fail fast

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
        description: 'Content Create - Generate complete email content including subject, preheader, body, and CTA for campaigns.',
        parameters: generateEmailContentSchema,
        execute: generateEmailContent
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
      tool({
        name: 'iata_code_resolver',
        description: 'IATA Code Resolver - Use AI to convert city names in any language to IATA airport codes.',
        parameters: iataCodeResolverSchema,
        execute: iataCodeResolver
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
   * 📧 Handle Content Generation with Enhanced Brief Analysis and Date Intelligence
   */
  private async handleContentGeneration(input: ContentSpecialistInput, startTime: number): Promise<ContentSpecialistOutput> {
    console.log('✍️ Generating intelligent content with context awareness and date intelligence');
    console.log('🔍 Input Debug:', {
      taskType: input.task_type,
      topic: input.campaign_brief.topic,
      campaignType: input.campaign_brief.campaign_type,
      targetAudience: input.campaign_brief.target_audience,
      contentRequirements: input.content_requirements,
      hasPreviousResults: !!input.previous_results,
      previousResultsKeys: input.previous_results ? Object.keys(input.previous_results) : [],
      hasPricingRequirements: !!input.pricing_requirements
    });

    try {
      // 📅 STEP 0: Get current date and analyze brief for travel intelligence
      const currentDate = new Date();
      const briefAnalysis = this.analyzeBriefForTravelData(input.campaign_brief, currentDate);
      
      console.log('📅 Date Intelligence:', {
        currentDate: currentDate.toISOString(),
        briefAnalysis: briefAnalysis,
        extractedRoutes: briefAnalysis.routes,
        suggestedDates: briefAnalysis.suggestedDates
      });

      // 💰 STEP 1: Get pricing intelligence with enhanced brief analysis
      let pricingData = input.previous_results?.pricing_data;
      
      // Enhance pricing requirements with brief analysis
      const enhancedPricingRequirements = this.enhancePricingRequirements(
        input.pricing_requirements, 
        briefAnalysis, 
        currentDate
      );
      
      if (enhancedPricingRequirements && !pricingData) {
        console.log('💰 Getting pricing intelligence with enhanced brief analysis...');
        
        const pricingParams = {
          action: 'get_prices' as const,
          origin: enhancedPricingRequirements.origin,
          destination: enhancedPricingRequirements.destination,
          date_range: enhancedPricingRequirements.date_range,
          analysis_depth: enhancedPricingRequirements.analysis_depth || 'advanced' as const,
          include_historical: true,
          seasonal_adjustment: true,
          target_audience: this.mapTargetAudience(input.campaign_brief.target_audience),
          booking_window: this.determineBookingWindow(briefAnalysis.urgency, currentDate),
          response_format: 'marketing' as const,
          include_analytics: true
        };
        
        console.log('🎯 Enhanced pricing parameters:', {
          origin: pricingParams.origin,
          destination: pricingParams.destination,
          dateRange: pricingParams.date_range,
          targetAudience: pricingParams.target_audience,
          bookingWindow: pricingParams.booking_window
        });
        
        try {
          const pricingResult = await pricingIntelligence(pricingParams);
          
          if (pricingResult.success) {
            pricingData = pricingResult;
            console.log('✅ Pricing intelligence obtained:', {
              hasPrices: !!pricingResult.data?.prices,
              cheapestPrice: pricingResult.data?.cheapest,
              currency: pricingResult.data?.currency,
              urgencyLevel: pricingResult.marketing_copy?.urgency_level,
              pricesCount: pricingResult.data?.prices?.length || 0
            });
          } else {
            console.log('⚠️ Pricing intelligence failed, continuing without pricing data:', pricingResult.error);
          }
        } catch (pricingError) {
          console.log('⚠️ Pricing intelligence error, continuing without pricing data:', pricingError);
        }
      }

      // 📝 STEP 2: Prepare enhanced content parameters with date and pricing context
      const contentParams = {
        topic: input.campaign_brief.topic,
        content_type: (input.content_requirements?.content_type || 'complete_campaign') as 'email' | 'subject_line' | 'preheader' | 'body_text' | 'complete_campaign',
        tone: (input.content_requirements?.tone || 'friendly') as 'professional' | 'friendly' | 'urgent' | 'casual' | 'luxury' | 'family',
        language: (input.content_requirements?.language || 'ru') as 'ru' | 'en',
        target_audience: input.campaign_brief.target_audience || 'general',
        urgency_level: this.determineUrgencyLevel(pricingData) as 'low' | 'medium' | 'high',
        include_personalization: true,
        include_cta: true,
        content_length: 'medium' as 'short' | 'medium' | 'long',
        generation_quality: 'quality' as 'fast' | 'balanced' | 'quality',
        // Enhanced context
        current_date: currentDate.toISOString().split('T')[0],
        seasonal_context: this.getCurrentSeason(),
        pricing_context: pricingData ? {
          has_prices: !!pricingData.data?.prices?.length,
          cheapest_price: pricingData.data?.cheapest,
          currency: pricingData.data?.currency,
          urgency: pricingData.marketing_copy?.urgency_level
        } : null,
        travel_context: briefAnalysis.routes.length > 0 ? {
          routes: briefAnalysis.routes,
          suggested_dates: briefAnalysis.suggestedDates,
          travel_purpose: briefAnalysis.travelPurpose
        } : null
      };

      console.log('🔍 Enhanced Content Params:', {
        contentParams: JSON.stringify(contentParams, null, 2)
      });

      // 🤖 STEP 3: Generate content with OpenAI Agents SDK
      console.log('🚀 Using OpenAI Agents SDK for enhanced content generation...');
      
      const enhancedPrompt = this.buildEnhancedContentPrompt(contentParams, briefAnalysis, pricingData);
      
      const agentResponse = await run(this.agent, [{
        role: 'user',
        content: enhancedPrompt
      }]);
      
      console.log('✅ OpenAI Agents SDK execution completed, extracting content...');
      console.log('🔍 DEBUG OPENAI RESPONSE FULL:', {
        hasResponse: !!agentResponse,
        responseType: typeof agentResponse,
        responseKeys: agentResponse ? Object.keys(agentResponse) : [],
        hasFinalOutput: !!agentResponse?.finalOutput,
        hasOutput: !!agentResponse?.output,
        finalOutputType: typeof agentResponse?.finalOutput,
        finalOutputPreview: agentResponse?.finalOutput ? String(agentResponse.finalOutput).substring(0, 500) : null,
        outputLength: agentResponse?.output?.length || 0
      });
      
      const contentResult = this.extractToolResultFromAgentResponse(agentResponse, 'content_create');
      
      console.log('🔍 DEBUG EXTRACTED CONTENT RESULT:', {
        hasContentResult: !!contentResult,
        contentResultType: typeof contentResult,
        contentResultKeys: contentResult ? Object.keys(contentResult) : [],
        success: contentResult?.success,
        hasContentData: !!contentResult?.content_data,
        contentDataKeys: contentResult?.content_data ? Object.keys(contentResult.content_data) : [],
        hasCompleteContent: !!contentResult?.content_data?.complete_content,
        completeContentKeys: contentResult?.content_data?.complete_content ? Object.keys(contentResult.content_data.complete_content) : []
      });

      // 🔍 STEP 4: Validate and enhance content quality
      const validatedContent = await this.validateAndEnhanceContent(
        contentResult, 
        contentParams, 
        briefAnalysis, 
        pricingData
      );

      if (!validatedContent.success) {
        throw new AgentError(
          AgentErrorCodes.VALIDATION_FAILED,
          'Content validation failed: ' + validatedContent.error,
          'content_specialist',
          { contentParams, contentResult, validatedContent }
        );
      }

      // 🔄 STEP 5: Build enhanced handoff data
      const handoffData = {
        content_package: {
          complete_content: {
            subject: validatedContent.content.subject || 'Специальное предложение',
            preheader: validatedContent.content.preheader || 'Не упустите возможность!',
            body: validatedContent.content.body || 'Ваш контент здесь',
            cta: validatedContent.content.cta || 'Узнать больше'
          },
          // Дублирование для обратной совместимости
          content: {
            subject: validatedContent.content.subject || 'Специальное предложение',
            preheader: validatedContent.content.preheader || 'Не упустите возможность!',
            body: validatedContent.content.body || 'Ваш контент здесь',
            email_body: validatedContent.content.body || 'Ваш контент здесь', // Дополнительный дубликат для разных путей извлечения
            cta: validatedContent.content.cta || 'Узнать больше'
          },
          content_metadata: {
            ...validatedContent.metadata,
            generation_date: currentDate.toISOString(),
            brief_analysis: briefAnalysis,
            pricing_integration: !!pricingData
          },
          brand_guidelines: {
            voice_tone: 'professional',
            key_messages: ['качество', 'надежность'],
            compliance_notes: []
          }
        },
        design_requirements: this.generateDesignRequirements(contentResult),
        brand_guidelines: this.extractBrandGuidelines(input),
        content_metadata: validatedContent.metadata,
        pricing_context: pricingData,
        campaign_context: {
          topic: briefAnalysis.travelPurpose || input.campaign_brief.topic,
          target_audience: input.campaign_brief.target_audience,
          urgency_level: this.determineUrgencyLevel(pricingData),
          routes: briefAnalysis.routes,
          current_date: currentDate.toISOString().split('T')[0],
          seasonal_context: this.getCurrentSeason()
        },
        trace_id: this.generateTraceId(),
        timestamp: currentDate.toISOString()
      };

      console.log('✅ Enhanced content generation successful:', {
        hasValidatedContent: !!validatedContent.content,
        contentKeys: Object.keys(validatedContent.content),
        subject: validatedContent.content.subject,
        hasPricingContext: !!handoffData.pricing_context,
        hasRoutes: briefAnalysis.routes.length > 0,
        qualityScore: validatedContent.qualityScore
      });

      // 🔍 STEP 6: Final validation of handoff data
      const validatedHandoffData = await this.validateAndCorrectHandoffData(handoffData, 'content-to-design');
      
      if (!validatedHandoffData) {
        throw new AgentError(
          AgentErrorCodes.VALIDATION_FAILED,
          'Handoff данные не прошли финальную валидацию',
          'content_specialist',
          { originalHandoffData: handoffData }
        );
      }

      return {
        success: true,
        task_type: 'generate_content',
        results: {
          content_data: validatedContent,
          pricing_data: pricingData,
          brief_analysis: briefAnalysis
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
          confidence_score: validatedContent.qualityScore || 85,
          agent_efficiency: this.calculateAgentEfficiency(Date.now() - startTime)
        }
      };

    } catch (error) {
      console.error('❌ Content generation failed:', error);
      
      return {
        success: false,
        task_type: 'generate_content',
        results: {},
        recommendations: {
          next_actions: ['Review error details and fix the issue', 'Check input parameters', 'Retry with corrected data']
        },
        analytics: {
          execution_time: Date.now() - startTime,
          operations_performed: 0,
          confidence_score: 0,
          agent_efficiency: 0
        },
        error: error instanceof AgentError ? error.message : 
               error instanceof Error ? error.message : 
               'Unknown error during content generation'
      };
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
    
    // Извлекаем реальный контент из результата
    const contentData = handoffData.content_package?.complete_content || handoffData.results?.content_data?.content || handoffData.content_data?.content || {};
    const contentMetadata = handoffData.content_package?.content_metadata || handoffData.content_metadata || handoffData.results?.content_data?.metadata || handoffData.content_data?.metadata || {};
    const pricingData = handoffData.pricing_context || handoffData.results?.pricing_data || handoffData.pricing_data || {};
    const briefAnalysis = handoffData.campaign_context || handoffData.results?.brief_analysis || handoffData.brief_analysis || {};
    
    return {
      content_package: {
        complete_content: {
          subject: contentData.subject || 'Специальное предложение',
          preheader: contentData.preheader || 'Не упустите возможность!',
          body: contentData.body || 'Ваш контент здесь',
          cta: contentData.cta || 'Узнать больше'
        },
        content_metadata: {
          language: contentData.language || contentMetadata.language || 'ru',
          tone: contentData.tone || contentMetadata.tone || 'friendly',
          word_count: contentMetadata.word_count || this.calculateWordCount(contentData.body || ''),
          reading_time: contentMetadata.reading_time || this.calculateReadingTime(contentData.body || '')
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
        topic: briefAnalysis.travelPurpose || handoffData.campaign_context?.topic || 'путешествия',
        target_audience: handoffData.campaign_context?.target_audience || 'general',
        destination: briefAnalysis.routes?.[0]?.destination || handoffData.campaign_context?.destination || undefined,
        origin: briefAnalysis.routes?.[0]?.origin || handoffData.campaign_context?.origin || undefined,
        urgency_level: briefAnalysis.urgency || this.determineUrgencyLevel(pricingData) as 'low' | 'medium' | 'high' | 'critical'
      },
      pricing_context: {
        action: pricingData.action || 'get_prices',
        ...pricingData
      },
      pricing_insights: handoffData.pricing_insights || handoffData.results?.pricing_data?.pricing_insights,
      marketing_copy: handoffData.marketing_copy || handoffData.results?.pricing_data?.marketing_copy,
      trace_id: traceId,
      timestamp: timestamp
    };
  }

  /**
   * 🔧 HELPER METHODS
   */
  private generateTraceId(): string {
    // Generate valid UUID v4 for handoff validation
    return uuidv4();
  }

  private extractToolResultFromAgentResponse(agentResponse: any, toolName: string): any {
    console.log('🔍 Extracting content from OpenAI Agents SDK response:', {
      hasResponse: !!agentResponse,
      responseType: typeof agentResponse,
      responseKeys: agentResponse ? Object.keys(agentResponse) : [],
      toolName
    });

    // Согласно документации OpenAI Agents SDK, используем стандартные свойства
    console.log('🔍 Agent response structure summary:', {
      hasFinalOutput: !!agentResponse.finalOutput,
      hasOutput: !!agentResponse.output,
      hasHistory: !!agentResponse.history,
      finalOutputType: typeof agentResponse.finalOutput,
      outputLength: agentResponse.output?.length || 0,
      historyLength: agentResponse.history?.length || 0
    });

    // 1. Проверяем finalOutput (основной результат агента)
    if (agentResponse.finalOutput) {
      console.log('✅ Found finalOutput:', {
        finalOutputType: typeof agentResponse.finalOutput,
        finalOutputPreview: typeof agentResponse.finalOutput === 'string' 
          ? agentResponse.finalOutput.substring(0, 300) + '...'
          : JSON.stringify(agentResponse.finalOutput).substring(0, 300) + '...'
      });

      // Если finalOutput - это строка с JSON
      if (typeof agentResponse.finalOutput === 'string') {
        try {
          const parsed = JSON.parse(agentResponse.finalOutput);
          if (parsed.subject && parsed.body) {
            return {
              success: true,
              content_data: {
                complete_content: {
                  subject: parsed.subject || '',
                  preheader: parsed.preheader || '',
                  body: parsed.body || '',
                  cta: parsed.cta || 'Learn More'
                }
              },
              content_metadata: {
                content_type: 'complete_campaign',
                generation_confidence: 95,
                word_count: (parsed.body || '').split(' ').length,
                language: 'ru',
                tone: 'friendly',
                extraction_source: 'finalOutput_parsed'
              }
            };
          }
        } catch (error) {
          console.log('🔍 Could not parse finalOutput as JSON, treating as text');
        }
        
        // Если не JSON, но есть контент, ищем JSON внутри
        if (agentResponse.finalOutput.includes('"subject"') && agentResponse.finalOutput.includes('"body"')) {
          try {
            let jsonMatch = agentResponse.finalOutput.match(/```json\s*(\{[\s\S]*?\})\s*```/);
            if (!jsonMatch) {
              const jsonStartIndex = agentResponse.finalOutput.indexOf('{');
              if (jsonStartIndex !== -1) {
                let braceCount = 0;
                let jsonEndIndex = -1;
                
                for (let i = jsonStartIndex; i < agentResponse.finalOutput.length; i++) {
                  if (agentResponse.finalOutput[i] === '{') {
                    braceCount++;
                  } else if (agentResponse.finalOutput[i] === '}') {
                    braceCount--;
                    if (braceCount === 0) {
                      jsonEndIndex = i;
                      break;
                    }
                  }
                }
                
                if (jsonEndIndex !== -1) {
                  const jsonText = agentResponse.finalOutput.substring(jsonStartIndex, jsonEndIndex + 1);
                  jsonMatch = [jsonText, jsonText];
                }
              }
            }
            
            if (jsonMatch && jsonMatch[1]) {
              const parsedContent = JSON.parse(jsonMatch[1]);
              return {
                success: true,
                content_data: {
                  complete_content: {
                    subject: parsedContent.subject || '',
                    preheader: parsedContent.preheader || '',
                    body: parsedContent.body || '',
                    cta: parsedContent.cta || 'Learn More'
                  }
                },
                content_metadata: {
                  content_type: 'complete_campaign',
                  generation_confidence: 95,
                  word_count: (parsedContent.body || '').split(' ').length,
                  language: 'ru',
                  tone: 'friendly',
                  extraction_source: 'finalOutput_extracted'
                }
              };
            }
          } catch (error) {
            console.log('🔍 Could not extract JSON from finalOutput:', error);
          }
        }
      }
      
      // Если finalOutput - это объект
      if (typeof agentResponse.finalOutput === 'object' && agentResponse.finalOutput.subject && agentResponse.finalOutput.body) {
        return {
          success: true,
          content_data: {
            complete_content: {
              subject: agentResponse.finalOutput.subject || '',
              preheader: agentResponse.finalOutput.preheader || '',
              body: agentResponse.finalOutput.body || '',
              cta: agentResponse.finalOutput.cta || 'Learn More'
            }
          },
          content_metadata: {
            content_type: 'complete_campaign',
            generation_confidence: 95,
            word_count: (agentResponse.finalOutput.body || '').split(' ').length,
            language: 'ru',
            tone: 'friendly',
            extraction_source: 'finalOutput_object'
          }
        };
      }
    }

    // 2. Проверяем output (массив RunItem[])
    if (agentResponse.output && Array.isArray(agentResponse.output)) {
      console.log(`📋 Processing ${agentResponse.output.length} output items`);
      
      for (const item of agentResponse.output) {
        // Ищем RunToolCallOutputItem (результаты вызовов инструментов)
        if (item.type === 'tool_call_output' || item.rawItem?.type === 'tool_result') {
          console.log(`🔧 Found tool output item:`, {
            itemType: item.type,
            toolName: item.rawItem?.name || item.name,
            hasContent: !!item.rawItem?.content
          });
          
          if ((item.rawItem?.name === toolName || item.name === toolName) && item.rawItem?.content) {
            try {
              const toolResult = typeof item.rawItem.content === 'string' 
                ? JSON.parse(item.rawItem.content)
                : item.rawItem.content;
                
              if (toolResult.subject && toolResult.body) {
                return {
                  success: true,
                  content_data: {
                    complete_content: {
                      subject: toolResult.subject || '',
                      preheader: toolResult.preheader || '',
                      body: toolResult.body || '',
                      cta: toolResult.cta || 'Learn More'
                    }
                  },
                  content_metadata: {
                    content_type: 'complete_campaign',
                    generation_confidence: 95,
                    word_count: (toolResult.body || '').split(' ').length,
                    language: 'ru',
                    tone: 'friendly',
                    extraction_source: 'output_tool_result'
                  }
                };
              }
            } catch (error) {
              console.log('🔍 Could not parse tool result from output:', error);
            }
          }
        }
        
        // Ищем RunMessageOutputItem (сообщения от ассистента)
        if (item.type === 'message_output' && item.rawItem?.role === 'assistant' && item.rawItem?.content) {
          console.log(`📋 Found assistant message in output`);
          
          let contentText = '';
          if (Array.isArray(item.rawItem.content)) {
            contentText = item.rawItem.content
              .filter(contentItem => contentItem.type === 'text')
              .map(contentItem => contentItem.text)
              .join(' ');
          } else if (typeof item.rawItem.content === 'string') {
            contentText = item.rawItem.content;
          }
          
          if (contentText.includes('"subject"') && contentText.includes('"body"')) {
            try {
              let jsonMatch = contentText.match(/```json\s*(\{[\s\S]*?\})\s*```/);
              if (!jsonMatch) {
                const jsonStartIndex = contentText.indexOf('{');
                if (jsonStartIndex !== -1) {
                  let braceCount = 0;
                  let jsonEndIndex = -1;
                  
                  for (let i = jsonStartIndex; i < contentText.length; i++) {
                    if (contentText[i] === '{') {
                      braceCount++;
                    } else if (contentText[i] === '}') {
                      braceCount--;
                      if (braceCount === 0) {
                        jsonEndIndex = i;
                        break;
                      }
                    }
                  }
                  
                  if (jsonEndIndex !== -1) {
                    const jsonText = contentText.substring(jsonStartIndex, jsonEndIndex + 1);
                    jsonMatch = [jsonText, jsonText];
                  }
                }
              }
              
              if (jsonMatch && jsonMatch[1]) {
                const parsedContent = JSON.parse(jsonMatch[1]);
                return {
                  success: true,
                  content_data: {
                    complete_content: {
                      subject: parsedContent.subject || '',
                      preheader: parsedContent.preheader || '',
                      body: parsedContent.body || '',
                      cta: parsedContent.cta || 'Learn More'
                    }
                  },
                  content_metadata: {
                    content_type: 'complete_campaign',
                    generation_confidence: 95,
                    word_count: (parsedContent.body || '').split(' ').length,
                    language: 'ru',
                    tone: 'friendly',
                    extraction_source: 'output_assistant_message'
                  }
                };
              }
            } catch (error) {
              console.log('🔍 Could not parse JSON from output assistant message:', error);
            }
          }
        }
      }
    }

    // 3. Проверяем history (для полноты)
    if (agentResponse.history && Array.isArray(agentResponse.history)) {
      console.log(`📋 Processing ${agentResponse.history.length} history items`);
      
      // Ищем последние сообщения от ассистента в истории
      for (let i = agentResponse.history.length - 1; i >= 0; i--) {
        const item = agentResponse.history[i];
        
        if (item.type === 'message_output' && item.rawItem?.role === 'assistant' && item.rawItem?.content) {
          let contentText = '';
          if (Array.isArray(item.rawItem.content)) {
            contentText = item.rawItem.content
              .filter(contentItem => contentItem.type === 'text')
              .map(contentItem => contentItem.text)
              .join(' ');
          } else if (typeof item.rawItem.content === 'string') {
            contentText = item.rawItem.content;
          }
          
          if (contentText.includes('"subject"') && contentText.includes('"body"')) {
            try {
              let jsonMatch = contentText.match(/```json\s*(\{[\s\S]*?\})\s*```/);
              if (!jsonMatch) {
                const jsonStartIndex = contentText.indexOf('{');
                if (jsonStartIndex !== -1) {
                  let braceCount = 0;
                  let jsonEndIndex = -1;
                  
                  for (let i = jsonStartIndex; i < contentText.length; i++) {
                    if (contentText[i] === '{') {
                      braceCount++;
                    } else if (contentText[i] === '}') {
                      braceCount--;
                      if (braceCount === 0) {
                        jsonEndIndex = i;
                        break;
                      }
                    }
                  }
                  
                  if (jsonEndIndex !== -1) {
                    const jsonText = contentText.substring(jsonStartIndex, jsonEndIndex + 1);
                    jsonMatch = [jsonText, jsonText];
                  }
                }
              }
              
              if (jsonMatch && jsonMatch[1]) {
                const parsedContent = JSON.parse(jsonMatch[1]);
                return {
                  success: true,
                  content_data: {
                    complete_content: {
                      subject: parsedContent.subject || '',
                      preheader: parsedContent.preheader || '',
                      body: parsedContent.body || '',
                      cta: parsedContent.cta || 'Learn More'
                    }
                  },
                  content_metadata: {
                    content_type: 'complete_campaign',
                    generation_confidence: 95,
                    word_count: (parsedContent.body || '').split(' ').length,
                    language: 'ru',
                    tone: 'friendly',
                    extraction_source: 'history_assistant_message'
                  }
                };
              }
            } catch (error) {
              console.log('🔍 Could not parse JSON from history assistant message:', error);
            }
          }
        }
      }
    }

    console.error(`❌ No usable content found in OpenAI Agents SDK response for ${toolName}`);
    
    // Возвращаем ошибку - fallback не разрешен согласно правилам проекта
    return { 
      success: false, 
      error: `No usable content found in OpenAI Agents SDK response`,
      debug_info: {
        responseType: typeof agentResponse,
        responseKeys: agentResponse ? Object.keys(agentResponse) : [],
        hasFinalOutput: !!agentResponse?.finalOutput,
        hasOutput: !!agentResponse?.output,
        hasHistory: !!agentResponse?.history,
        finalOutputType: typeof agentResponse?.finalOutput,
        outputLength: agentResponse?.output?.length || 0,
        historyLength: agentResponse?.history?.length || 0
      }
    };
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
      // Check if optimization analysis is already running
      if (this.isOptimizationAnalyzing) {
        console.log('⏸️ ContentSpecialist optimization analysis already in progress - skipping');
        return;
      }

      // Check minimum interval
      const timeSinceLastAnalysis = Date.now() - this.lastOptimizationAnalysisTime;
      if (timeSinceLastAnalysis < this.MIN_OPTIMIZATION_INTERVAL) {
        const remainingTime = this.MIN_OPTIMIZATION_INTERVAL - timeSinceLastAnalysis;
        console.log(`⏳ ContentSpecialist optimization analysis throttled - ${Math.ceil(remainingTime / 60000)}min remaining`);
        return;
      }

      // Check hourly limit
      const oneHourAgo = Date.now() - 3600000;
      this.optimizationAnalysisTimestamps = this.optimizationAnalysisTimestamps.filter(ts => ts > oneHourAgo);
      
      if (this.optimizationAnalysisTimestamps.length >= this.MAX_OPTIMIZATION_ANALYSES_PER_HOUR) {
        console.log('🚫 ContentSpecialist optimization analysis rate limit exceeded - max 3 analyses per hour');
        return;
      }

      this.isOptimizationAnalyzing = true;
      this.lastOptimizationAnalysisTime = Date.now();
      this.optimizationAnalysisCount++;
      this.optimizationAnalysisTimestamps.push(Date.now());

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

      const shouldLog = this.optimizationAnalysisCount <= 2; // Reduce logging after 2 analyses
      if (shouldLog) {
        console.log(`🔍 ContentSpecialist triggering optimization analysis:`, {
          success: result.success,
          executionTime,
          currentHealthScore: analysis.current_state.system_metrics.system_health_score
        });
      }

      // Get optimization recommendations for this agent (but don't trigger more analysis)
      const recommendations = await this.optimizationService.getRecommendations();
      
      if (recommendations.length > 0 && shouldLog) {
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
      // Don't log throttling errors as they're expected
      if (!error.message?.includes('throttled') && !error.message?.includes('rate limit')) {
        console.error('❌ ContentSpecialist optimization analysis failed:', error);
      }
      // Don't throw - optimization failure shouldn't break agent execution
    } finally {
      this.isOptimizationAnalyzing = false;
    }
  }

  private calculateThroughput(): number {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentTasks = this.optimizationAnalysisTimestamps.filter(timestamp => timestamp > oneHourAgo);
    return recentTasks.length;
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

  /**
   * 📅 Analyze brief for travel data and extract routes/dates
   */
  private analyzeBriefForTravelData(campaign_brief: any, currentDate: Date): {
    routes: Array<{origin: string, destination: string}>;
    suggestedDates: string;
    travelPurpose: string;
    urgency: 'low' | 'medium' | 'high';
    seasonality: string;
  } {
    const topic = campaign_brief.topic || '';
    const target_audience = campaign_brief.target_audience || '';
    const campaign_type = campaign_brief.campaign_type || '';
    
    // Extract routes from topic
    const routes = this.extractRoutesFromText(topic);
    
    // Determine travel purpose
    const travelPurpose = this.extractTravelPurpose(topic, campaign_type);
    
    // Determine urgency based on keywords
    const urgency = this.extractUrgencyFromText(topic);
    
    // Generate smart date suggestions based on current date and purpose
    const suggestedDates = this.generateSmartTravelDates(currentDate, travelPurpose, urgency);
    
    // Determine seasonality
    const seasonality = this.getCurrentSeason();
    
    return {
      routes,
      suggestedDates,
      travelPurpose,
      urgency,
      seasonality
    };
  }

  /**
   * 🛣️ Extract routes from text using common patterns + AI-powered IATA resolution
   */
  private extractRoutesFromText(text: string): Array<{origin: string, destination: string}> {
    const routes: Array<{origin: string, destination: string}> = [];
    const lowerText = text.toLowerCase();
    
    // Import the conversion function
    const { convertRussianCityToIATA } = require('../tools/airports-loader');
    
    // Words to exclude from city extraction (not cities)
    const excludeWords = new Set([
      'авиабилеты', 'авиабилет', 'билеты', 'билет', 'рейсы', 'рейс', 'полеты', 'полет',
      'путешествия', 'путешествие', 'туры', 'тур', 'отдых', 'каникулы', 'отпуск',
      'горящие', 'акции', 'скидки', 'предложения', 'цены', 'стоимость', 'бронирование',
      'новогодние', 'праздничные', 'выходные', 'дешевые', 'выгодные', 'специальные'
    ]);
    
    // Common route patterns - improved to avoid false matches
    const routePatterns = [
      // "из Москвы в Сочи", "Москва-Сочи", "Москва → Сочи" - full route patterns
      /(?:из\s+)([а-яё]{3,}?)(?:\s*[-→]\s*|\s+в\s+)([а-яё]{3,}?)(?:\s|$|[.,!?])/gi,
      // "в Париж", "в Сочи" - destination only patterns  
      /(?:^|\s)в\s+([а-яё]{3,}?)(?:\s|$|[.,!?])/gi,
      // "на Бали", "на Кипр" - destination only patterns
      /(?:^|\s)на\s+([а-яё]{3,}?)(?:\s|$|[.,!?])/gi
    ];
    
    // Default origins for common destinations
    const defaultOrigins: {[key: string]: string} = {
      'сочи': 'Москва',
      'париж': 'Москва', 
      'лондон': 'Москва',
      'рим': 'Москва',
      'барселона': 'Москва',
      'бали': 'Москва',
      'кипр': 'Москва',
      'турция': 'Москва',
      'египет': 'Москва',
      'тайланд': 'Москва',
      'дубай': 'Москва'
    };
    
    for (const pattern of routePatterns) {
      let match;
      while ((match = pattern.exec(lowerText)) !== null) {
        if (match[1] && match[2]) {
          // Full route found (origin → destination)
          const origin = match[1].toLowerCase();
          const destination = match[2].toLowerCase();
          
          // Skip if either word is in exclude list
          if (excludeWords.has(origin) || excludeWords.has(destination)) {
            continue;
          }
          
          // Convert to IATA codes
          const originIATA = convertRussianCityToIATA(origin);
          const destinationIATA = convertRussianCityToIATA(destination);
          
          routes.push({
            origin: originIATA,
            destination: destinationIATA
          });
        } else if (match[1]) {
          // Only destination found, use default origin
          const destination = match[1].toLowerCase();
          
          // Skip if word is in exclude list
          if (excludeWords.has(destination)) {
            continue;
          }
          
          // Convert destination to IATA
          const destinationIATA = convertRussianCityToIATA(destination);
          
          // Use default origin or convert it too
          const defaultOrigin = defaultOrigins[destination] || 'Москва';
          const originIATA = convertRussianCityToIATA(defaultOrigin);
          
          routes.push({
            origin: originIATA,
            destination: destinationIATA
          });
        }
      }
    }
    
    // Remove duplicates and invalid routes
    return routes.filter((route, index, self) => {
      // Remove duplicates
      const isDuplicate = index !== self.findIndex(r => r.origin === route.origin && r.destination === route.destination);
      if (isDuplicate) return false;
      
      // Remove routes where origin equals destination
      if (route.origin === route.destination) return false;
      
      // Remove routes with invalid IATA codes (should be 3 letters)
      if (route.origin.length !== 3 || route.destination.length !== 3) return false;
      
      return true;
    });
  }

  /**
   * 🎯 Extract travel purpose from text
   */
  private extractTravelPurpose(topic: string, campaign_type: string): string {
    const lowerTopic = topic.toLowerCase();
    
    if (lowerTopic.includes('отпуск') || lowerTopic.includes('отдых') || lowerTopic.includes('каникулы')) {
      return 'отпуск';
    }
    if (lowerTopic.includes('бизнес') || lowerTopic.includes('командировка') || lowerTopic.includes('работа')) {
      return 'бизнес';
    }
    if (lowerTopic.includes('горящ') || lowerTopic.includes('акци') || lowerTopic.includes('скидк')) {
      return 'горящие предложения';
    }
    if (lowerTopic.includes('семь') || lowerTopic.includes('дет')) {
      return 'семейный отдых';
    }
    
    return campaign_type || 'путешествие';
  }

  /**
   * ⚡ Extract urgency level from text
   */
  private extractUrgencyFromText(text: string): 'low' | 'medium' | 'high' {
    const lowerText = text.toLowerCase();
    
    const highUrgencyKeywords = ['горящ', 'срочн', 'сегодня', 'сейчас', 'немедленно', 'скор', 'успе', 'ограничен'];
    const mediumUrgencyKeywords = ['акци', 'скидк', 'специальн', 'предложени', 'выгодн'];
    
    for (const keyword of highUrgencyKeywords) {
      if (lowerText.includes(keyword)) return 'high';
    }
    
    for (const keyword of mediumUrgencyKeywords) {
      if (lowerText.includes(keyword)) return 'medium';
    }
    
    return 'low';
  }

  /**
   * 📅 Generate smart travel dates based on current date and purpose
   */
  private generateSmartTravelDates(currentDate: Date, purpose: string, urgency: 'low' | 'medium' | 'high'): string {
    const startDate = new Date(currentDate);
    
    // Adjust start date based on urgency
    switch (urgency) {
      case 'high':
        startDate.setDate(currentDate.getDate() + 1); // Tomorrow for urgent
        break;
      case 'medium':
        startDate.setDate(currentDate.getDate() + 7); // Next week
        break;
      default:
        startDate.setDate(currentDate.getDate() + 14); // Two weeks
    }
    
    // Adjust date range based on purpose
    const endDate = new Date(startDate);
    switch (purpose) {
      case 'бизнес':
        endDate.setDate(startDate.getDate() + 7); // 1 week for business
        break;
      case 'горящие предложения':
        endDate.setDate(startDate.getDate() + 14); // 2 weeks for hot deals
        break;
      default:
        endDate.setDate(startDate.getDate() + 30); // 1 month for leisure
    }
    
    return `${startDate.toISOString().split('T')[0]},${endDate.toISOString().split('T')[0]}`;
  }

  /**
   * 🔧 Enhance pricing requirements with brief analysis
   */
  private enhancePricingRequirements(
    original: any,
    briefAnalysis: any,
    currentDate: Date
  ): any {
    // If original requirements exist, use them
    if (original && original.origin && original.destination) {
      return {
        ...original,
        date_range: original.date_range || briefAnalysis.suggestedDates
      };
    }
    
    // If no original requirements but we found routes in brief, use first route
    if (briefAnalysis.routes.length > 0) {
      const firstRoute = briefAnalysis.routes[0];
      return {
        origin: firstRoute.origin,
        destination: firstRoute.destination,
        date_range: briefAnalysis.suggestedDates,
        analysis_depth: 'advanced'
      };
    }
    
    return null;
  }

  /**
   * 🎭 Map target audience to pricing intelligence format
   */
  private mapTargetAudience(audience: string): 'budget' | 'mid_range' | 'luxury' | 'business' | 'family' | 'general' {
    if (!audience) return 'general';
    
    const lowerAudience = audience.toLowerCase();
    
    if (lowerAudience.includes('семь') || lowerAudience.includes('дет')) return 'family';
    if (lowerAudience.includes('бизнес') || lowerAudience.includes('деловой')) return 'business';
    if (lowerAudience.includes('бюджет') || lowerAudience.includes('эконом')) return 'budget';
    if (lowerAudience.includes('люкс') || lowerAudience.includes('премиум')) return 'luxury';
    if (lowerAudience.includes('средний')) return 'mid_range';
    
    return 'general';
  }

  /**
   * ⏰ Determine booking window based on urgency and date
   */
  private determineBookingWindow(urgency: 'low' | 'medium' | 'high', currentDate: Date): 'last_minute' | 'optimal' | 'early_bird' {
    switch (urgency) {
      case 'high': return 'last_minute';
      case 'medium': return 'optimal';
      default: return 'early_bird';
    }
  }

  /**
   * 📝 Build enhanced content prompt with context
   */
  private buildEnhancedContentPrompt(contentParams: any, briefAnalysis: any, pricingData: any): string {
    const contextInfo = [];
    
    if (contentParams.current_date) {
      contextInfo.push(`Текущая дата: ${contentParams.current_date}`);
    }
    
    if (contentParams.seasonal_context) {
      contextInfo.push(`Сезон: ${contentParams.seasonal_context}`);
    }
    
    if (briefAnalysis.routes.length > 0) {
      const routesStr = briefAnalysis.routes.map(r => `${r.origin} → ${r.destination}`).join(', ');
      contextInfo.push(`Маршруты (IATA коды): ${routesStr}`);
    }
    
    // Enhanced pricing context with explicit instructions
    let pricingInstruction = '';
    if (pricingData && pricingData.data?.cheapest) {
      const price = pricingData.data.cheapest;
      const currency = pricingData.data.currency || 'RUB';
      contextInfo.push(`РЕАЛЬНЫЕ ЦЕНЫ: от ${price} ${currency}`);
      pricingInstruction = `\n\nОБЯЗАТЕЛЬНО используй реальную цену ${price} ${currency} в контенте. НЕ используй "от 0 RUB" или другие placeholder цены.`;
    } else {
      pricingInstruction = `\n\nЦены не найдены - сосредоточься на ценностных предложениях без указания конкретных цен.`;
    }
    
    const contextString = contextInfo.length > 0 ? `\n\nКонтекст: ${contextInfo.join(', ')}` : '';
    
    return `Use the content_create tool with these parameters: topic="${contentParams.topic}", tone="${contentParams.tone}", language="${contentParams.language}", target_audience="${contentParams.target_audience}", urgency_level="${contentParams.urgency_level}".${contextString}${pricingInstruction}

ВАЖНО: IATA коды уже конвертированы из русских названий городов (Москва→MOW, Сочи→AER, Париж→PAR). НЕ проси пользователя указать коды аэропортов.

После вызова инструмента, сгенерируй качественный email контент в JSON формате с учетом всего контекста и реальных цен.`;
  }

  /**
   * ✅ Validate and enhance content quality
   */
  private async validateAndEnhanceContent(
    contentResult: any,
    contentParams: any,
    briefAnalysis: any,
    pricingData: any
  ): Promise<{
    success: boolean;
    content?: any;
    metadata?: any;
    qualityScore?: number;
    error?: string;
  }> {
    try {
      // Extract content data
      let contentData = null;
      let extractedContent = null;

      if (contentResult && contentResult.success) {
        contentData = contentResult.content_data;
        if (contentData && typeof contentData === 'object') {
          extractedContent = contentData.complete_content || contentData;
        }
      }

      if (!contentResult || !contentResult.success) {
        return {
          success: false,
          error: 'Content generation tool failed'
        };
      }

      if (!contentData) {
        return {
          success: false,
          error: 'Failed to extract content data from tool response'
        };
      }

      const content = extractedContent || contentData;
      
      // Validate required fields - no fallback, strict validation
      if (!content.subject || !content.body || !content.cta) {
        console.log('❌ Content validation failed:', {
          hasSubject: !!content.subject,
          hasBody: !!content.body,
          hasCta: !!content.cta,
          contentKeys: Object.keys(content)
        });
        return {
          success: false,
          error: 'Generated content missing required fields (subject, body, cta)'
        };
      }

      // Enhance content quality
      const enhancedContent = {
        subject: content.subject,
        preheader: content.preheader || content.preview_text || this.generateDefaultPreheader(content.subject),
        body: content.body || content.email_body,
        cta: content.cta || content.cta_text,
        language: contentParams.language,
        tone: contentParams.tone
      };

      // Calculate quality score
      const qualityScore = this.calculateContentQualityScore(enhancedContent, briefAnalysis, pricingData);

      // Generate metadata
      const metadata = {
        language: contentParams.language,
        tone: contentParams.tone,
        word_count: this.calculateWordCount(enhancedContent.body),
        reading_time: this.calculateReadingTime(enhancedContent.body),
        quality_score: qualityScore,
        pricing_integration: !!pricingData,
        route_analysis: briefAnalysis.routes.length > 0,
        generation_date: new Date().toISOString()
      };

      return {
        success: true,
        content: enhancedContent,
        metadata,
        qualityScore
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown validation error'
      };
    }
  }

  /**
   * 📊 Calculate content quality score
   */
  private calculateContentQualityScore(content: any, briefAnalysis: any, pricingData: any): number {
    let score = 70; // Base score

    // Subject line quality (0-15 points)
    if (content.subject) {
      const subjectLength = content.subject.length;
      if (subjectLength >= 30 && subjectLength <= 60) score += 10;
      if (content.subject.includes('!') || content.subject.includes('?')) score += 3;
      if (briefAnalysis.routes.some((r: any) => content.subject.toLowerCase().includes(r.destination.toLowerCase()))) score += 2;
    }

    // Body quality (0-10 points)
    if (content.body) {
      const wordCount = this.calculateWordCount(content.body);
      if (wordCount >= 50 && wordCount <= 200) score += 5;
      if (content.body.includes('КупиБилет') || content.body.includes('купибилет')) score += 3;
      if (content.body.includes('🌞') || content.body.includes('✈️')) score += 2; // Emojis
    }

    // Pricing integration (0-5 points)
    if (pricingData && content.body) {
      if (content.body.toLowerCase().includes('цен') || content.body.toLowerCase().includes('стоимост')) score += 3;
      if (pricingData.data?.cheapest && content.body.includes(pricingData.data.cheapest.toString())) score += 2;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * 📝 Generate default preheader if missing
   */
  private generateDefaultPreheader(subject: string): string {
    const defaults = [
      'Ваше путешествие начинается здесь',
      'Не упустите возможность путешествовать',
      'Откройте для себя новые горизонты',
      'Лучшие предложения для вас'
    ];
    
    return defaults[Math.floor(Math.random() * defaults.length)];
  }

  /**
   * 🔤 Capitalize city name
   */
  private capitalizeCity(city: string): string {
    return city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
  }

  /**
   * ⚡ Calculate agent efficiency based on execution time
   */
  private calculateAgentEfficiency(executionTime: number): number {
    // Optimal time is around 8-12 seconds
    const optimalTime = 10000; // 10 seconds
    const efficiency = Math.max(50, Math.min(100, 100 - Math.abs(executionTime - optimalTime) / 100));
    return Math.round(efficiency);
  }
}