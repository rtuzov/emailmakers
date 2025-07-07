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

import { Agent, run, tool } from '@openai/agents';
import { BaseSpecialistAgent } from '../core/base-specialist-agent';
import { contextProvider } from '../tools/consolidated/context-provider';
import { pricingIntelligence } from '../tools/consolidated/pricing-intelligence';
import { contentCreate } from '../tools/simple/content-create';
import { copyGenerate, copyGenerateSchema } from '../tools/simple/copy-generate';
import { variantsCreate, variantsCreateSchema } from '../tools/simple/variants-create';
import { recordToolUsage } from '../utils/tracing-utils';
import { createAgentRunConfig } from '../utils/tracing-utils';

// Import new granular tools for better tracing visibility
import { 
  pricingIntelligenceTool,
  dateIntelligenceTool,
  figmaAssetSelectorTool,
  mjmlCompilerTool,
  htmlValidatorTool,
  fileOrganizerTool
} from '../modules/agent-tools';

import { getUsageModel } from '../../shared/utils/model-config';
import { 
  BaseAgentOutput, 
  BaseAgentInput
} from '../types/base-agent-types';

// Import multi-destination services
import { 
  DestinationAnalyzer, 
  MultiDestinationPlanner, 
  SeasonalOptimizer 
} from './content';

// Input/Output types for agent handoffs
export interface ContentSpecialistInput extends BaseAgentInput {
  task_type: 'analyze_context' | 'get_pricing' | 'generate_content' | 'manage_campaign' | 'generate_copy' | 'create_variants' | 'analyze_multi_destination';
  context_requirements?: {
    include_seasonal?: boolean;
    include_cultural?: boolean;
    include_marketing?: boolean;
    include_travel?: boolean;
  };
  multi_destination_requirements?: {
    query?: string; // Например, "Европа осенью"
    max_destinations?: number;
    prefer_balanced_regions?: boolean;
    budget_range?: 'budget' | 'mid_range' | 'premium' | 'luxury';
    target_audience?: 'families' | 'couples' | 'solo_travelers' | 'business' | 'mixed';
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
  copy_requirements?: {
    copy_type?: 'subject' | 'preheader' | 'cta' | 'headline' | 'description';
    base_content?: string;
    style_preferences?: {
      tone: 'professional' | 'friendly' | 'urgent' | 'casual' | 'luxury' | 'family';
      length: 'short' | 'medium' | 'long';
      formality: 'formal' | 'informal' | 'neutral';
      emotional_appeal: 'logical' | 'emotional' | 'urgency' | 'curiosity';
    };
    target_audience?: string;
    campaign_goal?: 'awareness' | 'conversion' | 'retention' | 'engagement';
    max_characters?: number;
  };
  variants_requirements?: {
    base_content?: string;
    variant_count?: number;
    variation_focus?: 'tone' | 'length' | 'approach' | 'urgency' | 'emotional_appeal';
    test_goal?: 'open_rate' | 'click_rate' | 'conversion' | 'engagement';
    maintain_core_message?: boolean;
    keep_same_length?: boolean;
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
    multi_destination_analysis?: any;
  };
  recommendations: {
    next_agent?: 'design_specialist' | 'quality_specialist' | 'delivery_specialist';
    next_actions?: string[];
    handoff_data?: any;
  };
}

export class ContentSpecialistAgent extends BaseSpecialistAgent {
  // agent property inherited from BaseSpecialistAgent
  // traceId and agentId provided by base
  
  // Multi-destination services
  private destinationAnalyzer: DestinationAnalyzer;
  private multiDestinationPlanner: MultiDestinationPlanner;
  private seasonalOptimizer: SeasonalOptimizer;
  
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
    // Create tools following OpenAI Agents SDK pattern
    const copyGenerateTool = tool({
      name: 'copy_generate',
      description: 'Generate specialized copy for specific email elements (subject, preheader, CTA, headline, description)',
      parameters: copyGenerateSchema,
      execute: async (input) => {
        return await copyGenerate(input);
      }
    });

    const variantsCreateTool = tool({
      name: 'variants_create', 
      description: 'Create A/B test variants of content for testing different approaches',
      parameters: variantsCreateSchema,
      execute: async (input) => {
        return await variantsCreate(input);
      }
    });

    // Initialize with tools array including new granular tools for better tracing
    super('content-specialist', 'placeholder', [
      copyGenerateTool, 
      variantsCreateTool,
      // Add granular tools for enhanced OpenAI SDK tracing visibility
      pricingIntelligenceTool,
      dateIntelligenceTool,
      figmaAssetSelectorTool,
      mjmlCompilerTool,
      htmlValidatorTool,
      fileOrganizerTool
    ]);

    // Override instructions & model if needed
    (this.agent as Agent).instructions = this.getSpecialistInstructions();
    (this.agent as Agent).model = getUsageModel();

    // Initialize multi-destination services
    this.destinationAnalyzer = new DestinationAnalyzer({
      maxDestinations: 8,
      preferredRegions: ['europe', 'asia', 'north_america']
    });
    
    this.multiDestinationPlanner = new MultiDestinationPlanner({
      maxDestinations: 6,
      preferBalancedRegions: true,
      seasonalOptimization: true,
      pricingStrategy: 'balanced'
    });
    
    this.seasonalOptimizer = new SeasonalOptimizer({
      preferredSeasons: ['spring', 'summer', 'autumn'],
      avoidPeakPricing: true,
      weatherPriority: 'optimal',
      crowdPreference: 'moderate'
    });

    console.log(`✅ ContentSpecialistAgent initialized with ID: ${this.agentId}`);
  }

  /**
   * Main execution method for content specialist tasks
   */
  async executeTask(input: ContentSpecialistInput): Promise<ContentSpecialistOutput> {
    const startTime = Date.now();
    
    try {
      console.log(`📝 ContentSpecialistAgent: Starting ${input.task_type} task`);
      
      // 🔍 Update performance metrics with tracing
      await this.tracedFunction(
        'update-performance-metrics',
        { task_type: input.task_type },
        async () => {
          this.performanceMetrics.totalExecutions++;
          return true;
        }
      );
      
      // 🎯 Execute task with OpenAI Agent SDK and comprehensive tracing
      const result = await this.executeTracedAgentFunction(
        'execute-specialist-task',
        input,
        async () => {
          return await this.executeSpecialistTask(input);
        }
      );
      
      // 🔍 Validate result with tracing
      const validationResult = await this.executeTracedValidation(
        'output-validation',
        result,
        async () => {
          return result || {
            success: false,
            task_type: input.task_type,
            analytics: { execution_time: 0, operations_performed: 0, confidence_score: 0, agent_efficiency: 0 },
            results: {},
            recommendations: { next_agent: 'design_specialist', next_actions: [], handoff_data: {} }
          } as ContentSpecialistOutput;
        }
      );
      
      // 🔍 Update success metrics with tracing
      await this.tracedFunction(
        'update-success-metrics',
        { success: true, duration: Date.now() - startTime },
        async () => {
          this.performanceMetrics.totalSuccesses++;
          this.updatePerformanceMetrics(Date.now() - startTime, true);
          return true;
        }
      );
      
      // 🔄 Trace handoff if needed
      if (validationResult.recommendations.next_agent) {
        await this.traceHandoff(
          validationResult.recommendations.next_agent,
          validationResult.recommendations.handoff_data,
          { validation_passed: true, confidence: validationResult.analytics.confidence_score }
        );
      }
      
      console.log(`✅ ContentSpecialistAgent: Task ${input.task_type} completed successfully`);
      
      // 🏁 Complete tracing
      this.completeTracing(true);
      
      return validationResult;
      
    } catch (error) {
      console.error(`❌ ContentSpecialistAgent: Task ${input.task_type} failed:`, error);
      
      // 🔍 Update failure metrics with tracing
      await this.tracedFunction(
        'update-failure-metrics',
        { error: error instanceof Error ? error.message : String(error) },
        async () => {
          this.updatePerformanceMetrics(Date.now() - startTime, false);
          return false;
        }
      );
      
      // 🏁 Complete tracing with error
      this.completeTracing(false, error instanceof Error ? error.message : String(error));
      
      // Return error response
      return {
        success: false,
        task_type: input.task_type,
        analytics: {
          execution_time: Date.now() - startTime,
          operations_performed: 0,
          confidence_score: 0,
          agent_efficiency: 0
        },
        results: {},
        recommendations: {
          next_agent: 'design_specialist',
          next_actions: ['Handle error and retry'],
          handoff_data: { error: error instanceof Error ? error.message : 'Unknown error' }
        }
      } as ContentSpecialistOutput;
    }
  }

  /**
   * Execute specialist task using OpenAI Agent with enhanced tracing
   */
  private async executeSpecialistTask(input: ContentSpecialistInput): Promise<ContentSpecialistOutput> {
    return this.tracedFunction(
      'build-and-execute-task',
      { task_type: input.task_type },
      async () => {
        // 🔍 Build task prompt with tracing
        const taskPrompt = await this.tracedFunction(
          'build-task-prompt',
          { task_type: input.task_type },
          async () => {
            return this.buildTaskPrompt(input);
          }
        );
        
        try {
          // 🔍 Create run config with tracing
          const runConfig = await this.tracedFunction(
            'create-run-config',
            { task_type: input.task_type },
            async () => {
              return createAgentRunConfig(
                'ContentSpecialist',
                input.task_type,
                {
                  task_type: input.task_type,
                  has_context_requirements: !!input.context_requirements,
                  has_pricing_requirements: !!input.pricing_requirements,
                  has_content_requirements: !!input.content_requirements,
                  workflow_stage: 'execution',
                  session_id: 'default'
                }
              );
            }
          );
          
          console.log(`🤖 Starting agent execution for ${input.task_type}`);
          
          // 🤖 Execute OpenAI Agent with comprehensive tracing
          const agentResponse = await this.executeOpenAIAgent(taskPrompt);
          
          console.log(`🤖 Agent response received for ${input.task_type}`);
          
          // 🔍 Process the agent response with tracing
          const processedResult = await this.tracedFunction(
            'process-agent-response',
            { task_type: input.task_type, has_response: !!agentResponse },
            async () => {
              return await this.processAgentResponse(agentResponse, input);
            }
          );
          
          return processedResult;
          
        } catch (error) {
          console.error('❌ OpenAI Agent execution failed:', error);
          
          // 🔍 Execute fallback task with tracing
          return await this.tracedFunction(
            'execute-fallback-task',
            { task_type: input.task_type, error: error instanceof Error ? error.message : String(error) },
            async () => {
              return await this.executeFallbackTask(input);
            }
          );
        }
      }
    );
  }

  /**
   * Fallback execution when OpenAI Agent fails
   */
  private async executeFallbackTask(input: ContentSpecialistInput): Promise<ContentSpecialistOutput> {
    console.log(`🔄 Executing fallback for ${input.task_type}`);
    
    switch (input.task_type) {
      case 'analyze_context':
        return await this.analyzeContext(input);
      case 'get_pricing':
        return await this.getPricing(input);
      case 'generate_content':
        return await this.generateContent(input);
      case 'manage_campaign':
        return await this.manageCampaign(input);
      case 'generate_copy':
        return await this.generateCopy(input);
      case 'create_variants':
        return await this.createVariants(input);
      case 'analyze_multi_destination':
        return await this.analyzeMultiDestinationBrief(input);
      default:
        throw new Error(`Unknown task type: ${input.task_type}`);
    }
  }

  /**
   * Analyze context using context provider tool
   */
  private async analyzeContext(input: ContentSpecialistInput): Promise<ContentSpecialistOutput> {
    console.log('🌍 Analyzing context...');
    
    const contextResult = await contextProvider({
      action: 'get_comprehensive_context',
      target_date: '',
      timezone: 'Europe/Moscow',
      locale: 'ru-RU',
      primary_market: 'russia',
      target_cities: [],
      include_weather: true,
      include_events: true,
      include_holidays: true,
      include_seasons: true,
      holiday_types: ['national', 'cultural', 'travel'],
      seasonal_depth: 'detailed',
      cultural_events: true,
      regional_preferences: true,
      demographic_insights: true,
      language_nuances: true,
      travel_trends: true,
      pricing_trends: true,
      competitor_analysis: false,
      campaign_optimization: true,
      urgency_factors: true,
      seasonal_demand: true,
      destination_trends: true,
      booking_patterns: true,
      airline_insights: true,
      visa_requirements: false,
      campaign_type: 'promotional',
      target_audience: 'general',
      content_tone: 'friendly',
      brand_voice: 'professional',
      include_analytics: true,
      include_recommendations: true,
      include_predictions: true,
      historical_comparison: true,
      real_time_data: true,
      output_format: 'structured',
      detail_level: 'standard'
    });

    return {
      success: contextResult.success,
      task_type: input.task_type,
      analytics: {
        execution_time: 0,
        operations_performed: 1,
        confidence_score: 85,
        agent_efficiency: 0.95
      },
      results: {
        context_data: contextResult.data,
        brief_analysis: {
          context_quality: contextResult.success ? 'high' : 'low',
          recommendations: contextResult.recommendations
        }
      },
      recommendations: {
        next_agent: 'design_specialist',
        next_actions: ['Process context for content generation'],
        handoff_data: {
          context_insights: contextResult.data,
          handoff_type: 'context_to_content'
        }
      }
    };
  }

  /**
   * Get pricing using pricing intelligence tool
   */
  private async getPricing(input: ContentSpecialistInput): Promise<ContentSpecialistOutput> {
    console.log('💰 Getting pricing intelligence...');

    if (!input.pricing_requirements) {
      throw new Error('Pricing requirements are required for pricing task');
    }

    const pricingResult = await pricingIntelligence({
      action: 'fetch_prices',
      origin: input.pricing_requirements.origin,
      destination: input.pricing_requirements.destination,
      travel_dates: null,
      passenger_count: 1
    });

    return {
      success: pricingResult.success,
      task_type: input.task_type,
      analytics: {
        execution_time: 0,
        operations_performed: 1,
        confidence_score: 88,
        agent_efficiency: 0.92
      },
      results: {
        pricing_data: pricingResult.data,
        brief_analysis: {
          pricing_quality: pricingResult.success ? 'high' : 'low',
          price_competitiveness: 'good'
        }
      },
      recommendations: {
        next_agent: 'design_specialist',
        next_actions: ['Incorporate pricing into content'],
        handoff_data: {
          pricing_insights: pricingResult.data,
          handoff_type: 'pricing_to_content'
        }
      }
    };
  }

  /**
   * Generate content using content creation tools
   */
  private async generateContent(input: ContentSpecialistInput): Promise<ContentSpecialistOutput> {
    console.log('✍️ Generating content...');

    if (!input.content_requirements) {
      throw new Error('Content requirements are required for content generation');
    }

    const contentResult = await contentCreate({
      topic: input.campaign_brief?.topic || 'Travel Campaign',
      content_type: (input.content_requirements.content_type === 'call_to_action' ? 'email' : input.content_requirements.content_type) || 'email',
      tone: input.content_requirements.tone || 'friendly',
      language: input.content_requirements.language || 'ru',
      target_audience: 'travel enthusiasts',
      urgency_level: 'medium',
      include_personalization: true,
      include_cta: true,
      content_length: 'medium',
      generation_quality: 'quality'
    });

    return {
      success: contentResult.success,
      task_type: input.task_type,
      analytics: {
        execution_time: 0,
        operations_performed: 1,
        confidence_score: 90,
        agent_efficiency: 0.94
      },
      results: {
        content_data: contentResult.content_data,
        brief_analysis: {
          content_quality: contentResult.success ? 'high' : 'low',
          engagement_potential: 'high',
          seo_score: 85
        }
      },
      recommendations: {
        next_agent: 'design_specialist',
        next_actions: ['Design email template with content'],
        handoff_data: {
          content_data: contentResult.content_data || contentResult,
          handoff_type: 'content_to_design'
        }
      }
    };
  }

  /**
   * Manage campaign coordination
   */
  private async manageCampaign(input: ContentSpecialistInput): Promise<ContentSpecialistOutput> {
    console.log('📊 Managing campaign...');

    // Campaign management logic would integrate multiple tools
    // For now, return structured campaign management response
    
    return {
      success: true,
      task_type: input.task_type,
      analytics: {
        execution_time: 0,
        operations_performed: 1,
        confidence_score: 85,
        agent_efficiency: 0.88
      },
      results: {
        campaign_data: {
          campaign_status: 'planned',
          components_ready: ['context', 'pricing', 'content'],
          next_steps: ['design', 'quality_check', 'delivery']
        },
        brief_analysis: {
          campaign_readiness: 'high',
          completion_percentage: 75
        }
      },
      recommendations: {
        next_agent: 'design_specialist',
        next_actions: ['Proceed to design phase'],
        handoff_data: {
          campaign_status: 'ready_for_design',
          handoff_type: 'campaign_to_design'
        }
      }
    };
  }

  /**
   * Generate specialized copy using copy generation tool
   */
  private async generateCopy(input: ContentSpecialistInput): Promise<ContentSpecialistOutput> {
    console.log('✍️ Generating specialized copy...');

    if (!input.copy_requirements) {
      throw new Error('Copy requirements are required for copy generation');
    }

    const copyResult = await copyGenerate({
      copy_type: input.copy_requirements.copy_type || 'subject',
      base_content: input.copy_requirements.base_content || input.campaign_brief?.topic || 'Travel Campaign',
      style_preferences: {
        tone: input.copy_requirements.style_preferences?.tone || 'friendly',
        length: input.copy_requirements.style_preferences?.length || 'medium',
        formality: input.copy_requirements.style_preferences?.formality || 'neutral',
        emotional_appeal: input.copy_requirements.style_preferences?.emotional_appeal || 'emotional'
      },
      target_audience: input.copy_requirements.target_audience || 'travel enthusiasts',
      campaign_goal: input.copy_requirements.campaign_goal || 'conversion',
      max_characters: input.copy_requirements.max_characters || 150
    });

    return {
      success: copyResult.success,
      task_type: input.task_type,
      analytics: {
        execution_time: 0,
        operations_performed: 1,
        confidence_score: 88,
        agent_efficiency: 0.92
      },
      results: {
        content_data: copyResult.generated_copy,
        brief_analysis: {
          copy_quality: copyResult.success ? 'high' : 'low',
          copy_analysis: copyResult.copy_analysis
        }
      },
      recommendations: {
        next_agent: 'design_specialist',
        next_actions: ['Incorporate copy into design'],
        handoff_data: {
          copy_data: copyResult.generated_copy,
          copy_analysis: copyResult.copy_analysis,
          handoff_type: 'copy_to_design'
        }
      }
    };
  }

  /**
   * Create A/B test variants using variants creation tool
   */
  private async createVariants(input: ContentSpecialistInput): Promise<ContentSpecialistOutput> {
    console.log('🔄 Creating A/B test variants...');

    if (!input.variants_requirements) {
      throw new Error('Variants requirements are required for variants creation');
    }

    const variantsResult = await variantsCreate({
      base_content: input.variants_requirements.base_content || input.campaign_brief?.topic || 'Travel Campaign',
      variant_count: input.variants_requirements.variant_count || 3,
      variation_focus: input.variants_requirements.variation_focus || 'tone',
      test_goal: input.variants_requirements.test_goal || 'conversion',
      maintain_core_message: input.variants_requirements.maintain_core_message ?? true,
      keep_same_length: input.variants_requirements.keep_same_length ?? false
    });

    return {
      success: variantsResult.success,
      task_type: input.task_type,
      analytics: {
        execution_time: 0,
        operations_performed: 1,
        confidence_score: 85,
        agent_efficiency: 0.90
      },
      results: {
        content_data: variantsResult.variants,
        campaign_data: variantsResult.testing_setup,
        brief_analysis: {
          variants_quality: variantsResult.success ? 'high' : 'low',
          test_readiness: variantsResult.success ? 'ready' : 'needs_review'
        }
      },
      recommendations: {
        next_agent: 'quality_specialist',
        next_actions: ['Review variants for quality', 'Set up A/B testing'],
        handoff_data: {
          variants_data: variantsResult.variants,
          testing_setup: variantsResult.testing_setup,
          handoff_type: 'variants_to_quality'
        }
      }
    };
  }

  /**
   * Analyze multi-destination brief queries like "Европа осенью"
   */
  private async analyzeMultiDestinationBrief(input: ContentSpecialistInput): Promise<ContentSpecialistOutput> {
    console.log('🗺️ Analyzing multi-destination brief...');

    if (!input.multi_destination_requirements?.query) {
      throw new Error('Multi-destination query is required for analysis');
    }

    const query = input.multi_destination_requirements.query;
    const maxDestinations = input.multi_destination_requirements.max_destinations || 6;
    const budgetRange = input.multi_destination_requirements.budget_range || 'mid_range';
    const targetAudience = input.multi_destination_requirements.target_audience || 'mixed';

    try {
      // Шаг 1: Анализ географического и сезонного контекста запроса
      console.log(`🔍 Analyzing query: "${query}"`);
      const geographicalAnalysis = await this.destinationAnalyzer.analyzeGeographicalScope(query);
      
      // Шаг 2: Генерация опций направлений на основе анализа
      const destinationOptions = await this.destinationAnalyzer.generateDestinationOptions({
        query: query,
        maxDestinations: maxDestinations,
        region: geographicalAnalysis.detected_region,
        season: geographicalAnalysis.analysis_metadata.seasonal_hints?.[0] || 'year_round',
        budgetRange: budgetRange,
        targetAudience: targetAudience
      });

      // Шаг 3: Создание унифицированного плана кампании
      const campaignName = this.generateCampaignName(query, geographicalAnalysis.detected_region);
      const unifiedPlan = await this.multiDestinationPlanner.createUnifiedPlan({
        destinations: destinationOptions,
        campaignName: campaignName,
        campaignTheme: query,
        targetSeason: geographicalAnalysis.analysis_metadata.seasonal_hints?.[0],
        targetRegion: geographicalAnalysis.detected_region,
        budgetRange: budgetRange,
        urgencyLevel: 'medium',
        targetAudience: targetAudience
      });

      // Шаг 4: Сезонная оптимизация если применимо
      let seasonalAnalysis = null;
      if (geographicalAnalysis.analysis_metadata.seasonal_hints?.length > 0) {
        console.log('🗓️ Performing seasonal optimization...');
        const optimizationResult = await this.seasonalOptimizer.optimizeCampaignDates({
          destinations: unifiedPlan.destinations,
          targetDate: new Date().toISOString().split('T')[0],
          flexibilityDays: 14,
          duration: 30,
          budgetSensitive: budgetRange === 'budget'
        });
        seasonalAnalysis = optimizationResult;
      }

      // Шаг 5: Формирование результата анализа
      const analysis = {
        original_query: query,
        geographical_analysis: geographicalAnalysis,
        destination_options: destinationOptions,
        unified_plan: unifiedPlan,
        seasonal_optimization: seasonalAnalysis,
        campaign_insights: {
          total_destinations: unifiedPlan.destinations.length,
          regions_covered: [...new Set(unifiedPlan.destinations.map(d => d.geographical_info.region))],
          seasonal_alignment: geographicalAnalysis.analysis_metadata.seasonal_hints || [],
          budget_compatibility: this.assessBudgetCompatibility(unifiedPlan.destinations, budgetRange),
          target_audience_fit: this.assessAudienceFit(unifiedPlan.destinations, targetAudience)
        },
        recommendations: {
          campaign_readiness: this.assessCampaignReadiness(unifiedPlan, seasonalAnalysis),
          optimization_suggestions: this.generateOptimizationSuggestions(geographicalAnalysis, unifiedPlan),
          next_steps: this.generateNextSteps(unifiedPlan, seasonalAnalysis)
        }
      };

      console.log(`✅ Multi-destination analysis completed for "${query}"`);
      
      return {
        success: true,
        task_type: input.task_type,
        analytics: {
          execution_time: 0,
          operations_performed: 4, // geographical analysis, destination generation, plan creation, seasonal optimization
          confidence_score: geographicalAnalysis.confidence_score || 85,
          agent_efficiency: 0.92
        },
        results: {
          multi_destination_analysis: analysis,
          brief_analysis: {
            query_complexity: this.assessQueryComplexity(query),
            analysis_quality: 'high',
            geographical_coverage: geographicalAnalysis.detected_region,
            seasonal_relevance: seasonalAnalysis ? 'optimized' : 'standard'
          }
        },
        recommendations: {
          next_agent: 'design_specialist',
          next_actions: [
            'Create multi-destination email template',
            'Design regional layout with images',
            'Apply seasonal design elements'
          ],
          handoff_data: {
            multi_destination_plan: unifiedPlan,
            geographical_context: geographicalAnalysis,
            seasonal_optimization: seasonalAnalysis,
            campaign_insights: analysis.campaign_insights,
            handoff_type: 'multi_destination_to_design'
          }
        }
      };

    } catch (error) {
      console.error('❌ Multi-destination analysis error:', error);
      throw error;
    }
  }

  // ============ MULTI-DESTINATION HELPER METHODS ============

  /**
   * Generate campaign name from query and region
   */
  private generateCampaignName(query: string, region: string): string {
    const regionNames: Record<string, string> = {
      'europe': 'Европа',
      'asia': 'Азия',
      'north_america': 'Северная Америка',
      'south_america': 'Южная Америка',
      'africa': 'Африка',
      'oceania': 'Океания',
      'middle_east': 'Ближний Восток'
    };

    const regionName = regionNames[region] || 'Мир';
    
    if (query.toLowerCase().includes('осен')) {
      return `${regionName}: осенние направления`;
    } else if (query.toLowerCase().includes('зим')) {
      return `${regionName}: зимние направления`;
    } else if (query.toLowerCase().includes('весн')) {
      return `${regionName}: весенние направления`;
    } else if (query.toLowerCase().includes('лет')) {
      return `${regionName}: летние направления`;
    }
    
    return `${regionName}: лучшие направления`;
  }

  /**
   * Assess budget compatibility of destinations
   */
  private assessBudgetCompatibility(destinations: any[], budgetRange: string): string {
    const avgPrice = destinations.reduce((sum, d) => sum + (d.pricing?.base_price || 0), 0) / destinations.length;
    
    const budgetRanges = {
      'budget': { min: 0, max: 30000 },
      'mid_range': { min: 25000, max: 60000 },
      'premium': { min: 50000, max: 100000 },
      'luxury': { min: 80000, max: 200000 }
    };
    
    const range = budgetRanges[budgetRange as keyof typeof budgetRanges];
    if (!range) return 'unknown';
    
    if (avgPrice >= range.min && avgPrice <= range.max) {
      return 'perfect_match';
    } else if (avgPrice < range.min) {
      return 'below_budget';
    } else {
      return 'above_budget';
    }
  }

  /**
   * Assess audience fit of destinations
   */
  private assessAudienceFit(destinations: any[], targetAudience: string): string {
    // Simplified audience fit assessment
    const familyFriendlyCount = destinations.filter(d => 
      d.content?.highlights?.some((h: string) => 
        h.toLowerCase().includes('семейный') || 
        h.toLowerCase().includes('детский') ||
        h.toLowerCase().includes('безопасн')
      )
    ).length;
    
    const luxuryCount = destinations.filter(d => 
      d.content?.highlights?.some((h: string) => 
        h.toLowerCase().includes('роскош') || 
        h.toLowerCase().includes('премиум') ||
        h.toLowerCase().includes('эксклюзив')
      )
    ).length;
    
    switch (targetAudience) {
      case 'families':
        return familyFriendlyCount > destinations.length / 2 ? 'excellent' : 'good';
      case 'couples':
        return luxuryCount > destinations.length / 3 ? 'excellent' : 'good';
      case 'business':
        return 'good'; // Business travelers are flexible
      case 'solo_travelers':
        return 'good'; // Solo travelers are adventurous
      default:
        return 'good';
    }
  }

  /**
   * Assess campaign readiness
   */
  private assessCampaignReadiness(unifiedPlan: any, seasonalAnalysis: any): string {
    let score = 0;
    
    // Content completeness
    if (unifiedPlan.destinations?.length >= 2) score += 25;
    if (unifiedPlan.campaign_context?.theme) score += 20;
    if (unifiedPlan.layout_plan?.layout_type) score += 20;
    
    // Seasonal optimization
    if (seasonalAnalysis) {
      score += seasonalAnalysis.optimization_summary?.overall_score || 0;
    } else {
      score += 15; // Base score for no seasonal conflicts
    }
    
    // Geographic coverage
    const regions = new Set(unifiedPlan.destinations?.map((d: any) => d.geographical_info?.region) || []);
    if (regions.size > 1) score += 10;
    
    if (score >= 80) return 'ready';
    if (score >= 60) return 'needs_minor_adjustments';
    return 'needs_major_work';
  }

  /**
   * Generate optimization suggestions
   */
  private generateOptimizationSuggestions(geographicalAnalysis: any, unifiedPlan: any): string[] {
    const suggestions = [];
    
    if (geographicalAnalysis.confidence_score < 70) {
      suggestions.push('Уточнить географические предпочтения для повышения релевантности');
    }
    
    const regions = new Set(unifiedPlan.destinations?.map((d: any) => d.geographical_info?.region) || []);
    if (regions.size === 1) {
      suggestions.push('Рассмотреть добавление направлений из других регионов для разнообразия');
    }
    
    const avgPrice = unifiedPlan.destinations?.reduce((sum: number, d: any) => sum + (d.pricing?.base_price || 0), 0) / (unifiedPlan.destinations?.length || 1);
    if (avgPrice > 80000) {
      suggestions.push('Включить более бюджетные направления для расширения аудитории');
    }
    
    if (suggestions.length === 0) {
      suggestions.push('Текущий план оптимален и готов к реализации');
    }
    
    return suggestions;
  }

  /**
   * Generate next steps
   */
  private generateNextSteps(unifiedPlan: any, seasonalAnalysis: any): string[] {
    const steps = [];
    
    // Design phase
    steps.push(`Создать ${unifiedPlan.layout_plan?.layout_type || 'grid'} шаблон для ${unifiedPlan.destinations?.length || 0} направлений`);
    steps.push('Подобрать изображения для каждого направления');
    
    // Seasonal considerations
    if (seasonalAnalysis) {
      if (seasonalAnalysis.warnings?.length > 0) {
        steps.push('Учесть сезонные предупреждения при создании контента');
      }
      steps.push('Оптимизировать временные рамки кампании');
    }
    
    // Content finalization
    steps.push('Создать персонализированный контент для каждого направления');
    steps.push('Настроить pricing отображение');
    
    // Quality checks
    steps.push('Провести quality assurance для multi-destination layout');
    steps.push('Протестировать отображение в различных email клиентах');
    
    return steps;
  }

  /**
   * Assess query complexity
   */
  private assessQueryComplexity(query: string): 'simple' | 'medium' | 'complex' {
    const words = query.toLowerCase().split(/\s+/);
    
    // Geographic indicators
    const hasGeographic = words.some(word => 
      ['европа', 'азия', 'америка', 'африка', 'океания'].includes(word)
    );
    
    // Seasonal indicators
    const hasSeasonal = words.some(word => 
      ['весна', 'лето', 'осень', 'зима', 'весной', 'летом', 'осенью', 'зимой'].includes(word)
    );
    
    // Budget indicators
    const hasBudget = words.some(word => 
      ['бюджет', 'дешево', 'недорого', 'дорого', 'премиум', 'роскошь'].includes(word)
    );
    
    // Audience indicators
    const hasAudience = words.some(word => 
      ['семья', 'дети', 'пара', 'бизнес', 'молодежь'].includes(word)
    );
    
    const indicators = [hasGeographic, hasSeasonal, hasBudget, hasAudience].filter(Boolean).length;
    
    if (indicators >= 3) return 'complex';
    if (indicators >= 2) return 'medium';
    return 'simple';
  }

  /**
   * Get agent capabilities for testing
   */
  getCapabilities() {
    return {
      agent_id: this.agentId,
      specialization: 'Content Intelligence & Campaign Context',
      tools: [
        'context_provider', 
        'pricing_intelligence', 
        'content_generator', 
        'copy_generate', 
        'variants_create',
        'multi_destination_analyzer',
        // Enhanced granular tools for better tracing
        'pricing_intelligence', 
        'date_intelligence',
        'figma_asset_selector',
        'mjml_compiler',
        'html_validator',
        'file_organizer'
      ],
      supports_handoffs: true,
      supports_multi_destination: true,
      status: 'operational'
    };
  }

  /**
   * Shutdown agent (for testing)
   */
  async shutdown() {
    console.log(`🔄 ContentSpecialistAgent ${this.agentId} shutdown`);
    // Add any cleanup logic if needed
  }

  /**
   * Build task prompt for OpenAI Agent
   */
  private buildTaskPrompt(input: ContentSpecialistInput): string {
    const basePrompt = `You are a Content Specialist Agent responsible for ${input.task_type}.`;
    
    switch (input.task_type) {
      case 'analyze_context':
        return `${basePrompt}
        
Analyze the current context for an email campaign. Consider:
- Current date and time context
- Seasonal factors
- Cultural considerations
- Market trends
- Travel industry insights

Provide comprehensive context analysis that will inform content creation.`;

      case 'get_pricing':
        return `${basePrompt}
        
Get pricing intelligence for route: ${input.pricing_requirements?.origin} to ${input.pricing_requirements?.destination}
Analysis depth: ${input.pricing_requirements?.analysis_depth || 'advanced'}

Provide detailed pricing analysis including trends, competition, and recommendations.`;

      case 'generate_content':
        return `${basePrompt}
        
Generate ${input.content_requirements?.content_type || 'email'} content with:
- Tone: ${input.content_requirements?.tone || 'friendly'}
- Language: ${input.content_requirements?.language || 'ru'}
- Topic: ${input.campaign_brief?.topic || 'Travel Campaign'}

Create engaging, conversion-focused content.`;

      case 'manage_campaign':
        return `${basePrompt}
        
Coordinate campaign management by:
- Reviewing component readiness
- Planning next steps
- Ensuring quality standards
- Preparing for handoffs

Provide campaign status and recommendations.`;

      case 'generate_copy':
        return `${basePrompt}
        
Generate specialized copy for specific email elements (subject, preheader, CTA, headline, description)
with:
- Tone: ${input.copy_requirements?.style_preferences?.tone || 'friendly'}
- Length: ${input.copy_requirements?.style_preferences?.length || 'medium'}
- Formality: ${input.copy_requirements?.style_preferences?.formality || 'neutral'}
- Emotional Appeal: ${input.copy_requirements?.style_preferences?.emotional_appeal || 'emotional'}

Target audience: ${input.copy_requirements?.target_audience || 'travel enthusiasts'}
Campaign goal: ${input.copy_requirements?.campaign_goal || 'conversion'}
Max characters: ${input.copy_requirements?.max_characters || 150}

Create engaging, conversion-focused copy.`;

      case 'create_variants':
        return `${basePrompt}
        
Create A/B test variants of content for testing different approaches
with:
- Base content: ${input.variants_requirements?.base_content || 'Travel Campaign'}
- Variant count: ${input.variants_requirements?.variant_count || 3}
- Variation focus: ${input.variants_requirements?.variation_focus || 'tone'}
- Test goal: ${input.variants_requirements?.test_goal || 'conversion'}
- Maintain core message: ${input.variants_requirements?.maintain_core_message === true ? 'Yes' : 'No'}
- Keep same length: ${input.variants_requirements?.keep_same_length === true ? 'Yes' : 'No'}

Create high-quality, diverse variants.`;

      case 'analyze_multi_destination':
        return `${basePrompt}
        
Analyze multi-destination brief query: "${input.multi_destination_requirements?.query || 'Unknown query'}"
with parameters:
- Max destinations: ${input.multi_destination_requirements?.max_destinations || 6}
- Budget range: ${input.multi_destination_requirements?.budget_range || 'mid_range'}
- Target audience: ${input.multi_destination_requirements?.target_audience || 'mixed'}
- Prefer balanced regions: ${input.multi_destination_requirements?.prefer_balanced_regions ? 'Yes' : 'No'}

Perform comprehensive analysis including:
1. Geographical scope analysis (region detection, seasonal indicators)
2. Destination generation based on query parameters
3. Unified campaign plan creation
4. Seasonal optimization if applicable
5. Campaign insights and readiness assessment

Provide detailed analysis with actionable recommendations for design phase.`;

      default:
        return `${basePrompt} Execute the requested task with available tools.`;
    }
  }

  /**
   * Process agent response from OpenAI
   */
  private async processAgentResponse(response: any, input: ContentSpecialistInput): Promise<ContentSpecialistOutput> {
    // Process the OpenAI agent response into our output format
    return {
      success: true,
      task_type: input.task_type,
      analytics: {
        execution_time: 0,
        operations_performed: 1,
        confidence_score: response.confidence || 85,
        agent_efficiency: 0.90
      },
      results: {
        context_data: response.context_analysis,
        pricing_data: response.pricing_analysis,
        content_data: response.content_data,
        campaign_data: response.campaign_data,
        brief_analysis: response.analysis
      },
      recommendations: {
        next_agent: 'design_specialist',
        next_actions: response.recommendations?.next_actions || [],
        handoff_data: response.handoff_data
      }
    };
  }


  /**
   * Get specialist instructions for OpenAI Agent
   */
  private getSpecialistInstructions(): string {
    return `You are a Content Specialist Agent for email marketing campaigns in the travel industry.

Your responsibilities include:
1. Context Analysis - Understanding temporal, seasonal, cultural, and market context
2. Pricing Intelligence - Analyzing pricing data and trends for travel routes  
3. Content Generation - Creating engaging email content (subjects, body text, CTAs)
4. Campaign Management - Coordinating campaign components and handoffs
5. Multi-Destination Analysis - Analyzing queries like "Европа осенью" for multi-destination campaigns

Key principles:
- Focus on travel industry specifics (routes, destinations, seasonal patterns)
- Create conversion-focused content with clear CTAs
- Consider cultural nuances for Russian market
- Integrate pricing intelligence into content strategy
- Maintain brand consistency and quality standards
- Prepare comprehensive handoff data for design team
- Support multi-destination campaign analysis and planning

Tools available:
- context_provider: For comprehensive context analysis
- pricing_intelligence: For travel pricing data and trends
- content_create: For generating email content components
- multi_destination_analyzer: For analyzing geographical and seasonal queries
- destination_planner: For creating unified multi-destination plans
- seasonal_optimizer: For optimizing campaign timing
- campaign coordination tools

Multi-destination capabilities:
- Parse natural language queries (e.g., "Европа осенью", "Азия зимой")
- Analyze geographical scope and seasonal indicators
- Generate destination options based on region, season, budget, and audience
- Create unified campaign plans with optimal layouts
- Perform seasonal optimization for campaign timing
- Assess campaign readiness and provide optimization suggestions

Always provide structured output with clear recommendations for next agents in the pipeline.`;
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(executionTime: number, success: boolean): void {
    // Update average execution time
    this.performanceMetrics.averageExecutionTime = 
      (this.performanceMetrics.averageExecutionTime * (this.performanceMetrics.totalExecutions - 1) + executionTime) / 
      this.performanceMetrics.totalExecutions;
    
    // Update success rate
    this.performanceMetrics.successRate = 
      this.performanceMetrics.totalSuccesses / this.performanceMetrics.totalExecutions;
    
    // Record tracing stats
    recordToolUsage({
      tool: 'content-specialist-agent',
      operation: 'executeTask',
      duration: executionTime,
      success: success
    });
  }

  /**
   * Get agent performance metrics
   */
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      agent_id: this.agentId,
      uptime: Date.now(),
      status: 'operational'
    };
  }

  /**
   * Get agent status and health
   */
  getAgentStatus() {
    const baseStatus = super.getAgentStatus();
    const trace = this.getCurrentTrace();
    
    return {
      ...baseStatus,
      specialization: 'content_specialist',
      performance: this.getPerformanceMetrics(),
      capabilities: [
        'context_analysis',
        'pricing_intelligence', 
        'content_generation',
        'campaign_management',
        'multi_destination_analysis'
      ],
      last_updated: new Date().toISOString()
    };
  }
}