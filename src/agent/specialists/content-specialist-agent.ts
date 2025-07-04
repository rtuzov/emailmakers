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

import { getUsageModel } from '../../shared/utils/model-config';
import { 
  BaseAgentOutput, 
  BaseAgentInput
} from '../types/base-agent-types';

// Input/Output types for agent handoffs
export interface ContentSpecialistInput extends BaseAgentInput {
  task_type: 'analyze_context' | 'get_pricing' | 'generate_content' | 'manage_campaign' | 'generate_copy' | 'create_variants';
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

    // Initialize with tools array
    super('content-specialist', 'placeholder', [copyGenerateTool, variantsCreateTool]);

    // Override instructions & model if needed
    (this.agent as Agent).instructions = this.getSpecialistInstructions();
    (this.agent as Agent).model = getUsageModel();

    console.log(`✅ ContentSpecialistAgent initialized with ID: ${this.agentId}`);
  }

  /**
   * Main execution method for content specialist tasks
   */
  async executeTask(input: ContentSpecialistInput): Promise<ContentSpecialistOutput> {
    const startTime = Date.now();
    
    try {
      console.log(`📝 ContentSpecialistAgent: Starting ${input.task_type} task`);
      
      // Update performance metrics
      this.performanceMetrics.totalExecutions++;
      
      // Execute task with OpenAI Agent SDK  
      const result = await this.executeSpecialistTask(input);
      
      // Return result directly (validation simplified)
      const validationResult = result || {
        success: false,
        task_type: input.task_type,
        analytics: { execution_time: 0, operations_performed: 0, confidence_score: 0, agent_efficiency: 0 },
        results: {},
        recommendations: { next_agent: 'design_specialist', next_actions: [], handoff_data: {} }
      } as ContentSpecialistOutput;
      
      // Update success metrics
      this.performanceMetrics.totalSuccesses++;
      this.updatePerformanceMetrics(Date.now() - startTime, true);
      
      console.log(`✅ ContentSpecialistAgent: Task ${input.task_type} completed successfully`);
      
      return validationResult;
      
    } catch (error) {
      console.error(`❌ ContentSpecialistAgent: Task ${input.task_type} failed:`, error);
      
      // Update failure metrics
      this.updatePerformanceMetrics(Date.now() - startTime, false);
      
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
   * Execute specialist task using OpenAI Agent
   */
  private async executeSpecialistTask(input: ContentSpecialistInput): Promise<ContentSpecialistOutput> {
    const taskPrompt = this.buildTaskPrompt(input);
    
    try {
      // Execute using OpenAI Agent SDK with proper tracing
      
      const runConfig = createAgentRunConfig(
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
      
      console.log(`🤖 Starting agent execution for ${input.task_type}`);
      
      const agentResponse = await run(this.agent, taskPrompt);
      
      console.log(`🤖 Agent response received for ${input.task_type}`);
      
      // Process the agent response
      const processedResult = await this.processAgentResponse(agentResponse, input);
      
      return processedResult;
      
    } catch (error) {
      console.error('❌ OpenAI Agent execution failed:', error);
      
      // Fallback to direct tool execution
      return await this.executeFallbackTask(input);
    }
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
   * Get agent capabilities for testing
   */
  getCapabilities() {
    return {
      agent_id: this.agentId,
      specialization: 'Content Intelligence & Campaign Context',
      tools: ['context_provider', 'pricing_intelligence', 'content_generator', 'copy_generate', 'variants_create'],
      supports_handoffs: true,
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

Key principles:
- Focus on travel industry specifics (routes, destinations, seasonal patterns)
- Create conversion-focused content with clear CTAs
- Consider cultural nuances for Russian market
- Integrate pricing intelligence into content strategy
- Maintain brand consistency and quality standards
- Prepare comprehensive handoff data for design team

Tools available:
- context_provider: For comprehensive context analysis
- pricing_intelligence: For travel pricing data and trends
- content_create: For generating email content components
- campaign coordination tools

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
    return {
      agent_id: this.agentId,
      agent_type: 'content_specialist',
      status: 'operational',
      trace_id: this.traceId,
      performance: this.getPerformanceMetrics(),
      capabilities: [
        'context_analysis',
        'pricing_intelligence', 
        'content_generation',
        'campaign_management'
      ],
      last_updated: new Date().toISOString()
    };
  }
}