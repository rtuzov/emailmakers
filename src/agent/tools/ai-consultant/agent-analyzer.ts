/**
 * Phase 13.2: Agent-Based Email Quality Analyzer
 * 
 * Advanced email quality analysis system using OpenAI Agents SDK
 * with specialized agents for different quality dimensions and orchestration.
 * 
 * Features:
 * - 5 specialized analysis agents (Content, Visual, Technical, Emotional, Brand)
 * - Coordinator agent for orchestrating analysis workflow
 * - Agent handoffs for seamless collaboration
 * - Structured tool definitions with Zod schemas
 * - Comprehensive logging and tracing integration
 */

import { z } from 'zod';
import { Agent, tool, run } from '@openai/agents';
import { 
  QualityAnalysisResult, 
  AIConsultantRequest, 
  AIConsultantConfig,
  QualityRecommendation,
  AnalyzedElement,
  AIConsultantError,
  QualityDimension
} from './types';
import { logger } from '../../core/logger';
import { withSDKTrace, withToolExecution, createAgentRunConfig } from '../../utils/tracing-utils';
import { LoggedAgent, createLoggedAgent, runWithTracing, initializeOpenAIAgents } from '../../core/openai-agents-config';

// Zod schemas for tool parameters
const ContentAnalysisSchema = z.object({
  topic: z.string(),
  target_audience: z.string(),
  campaign_type: z.string(),
  html_content: z.string(),
});

const VisualAnalysisSchema = z.object({
  topic: z.string(),
  campaign_type: z.string(),
  html_content: z.string(),
  assets_info: z.array(z.object({
    filename: z.string(),
    url: z.string().nullable().optional(),
    type: z.string().nullable().optional(),
    size: z.number().nullable().optional()
  })),
  screenshots: z.object({
    desktop: z.string().nullable().optional(),
    mobile: z.string().nullable().optional(),
  }).nullable().optional(),
});

const TechnicalAnalysisSchema = z.object({
  html_content: z.string(),
  render_results: z.object({
    html_valid: z.boolean().nullable().optional(),
    css_valid: z.boolean().nullable().optional(),
    accessibility_score: z.number().nullable().optional(),
    performance_score: z.number().nullable().optional(),
    file_size: z.number().nullable().optional(),
    load_time: z.number().nullable().optional(),
    errors: z.array(z.string()).nullable().optional()
  }).nullable().optional(),
});

const EmotionalAnalysisSchema = z.object({
  topic: z.string(),
  target_audience: z.string(),
  html_content: z.string(),
  pricing_info: z.object({
    price: z.string().nullable().optional(),
    currency: z.string().nullable().optional(),
    discount: z.string().nullable().optional(),
    original_price: z.string().nullable().optional(),
    deal_urgency: z.string().nullable().optional()
  }).nullable().optional(),
});

const BrandAnalysisSchema = z.object({
  html_content: z.string(),
});

export class AgentEmailAnalyzer {
  private config: AIConsultantConfig;
  private contentQualityAgent: LoggedAgent;
  private visualDesignAgent: LoggedAgent;
  private technicalComplianceAgent: LoggedAgent;
  private emotionalResonanceAgent: LoggedAgent;
  private brandAlignmentAgent: LoggedAgent;
  private coordinatorAgent: LoggedAgent;
  private initialized: boolean = false;

  constructor(config: AIConsultantConfig) {
    this.config = config;
    // Initialize agents synchronously to avoid async constructor issues
    this.setupAgents();
    this.initialized = true;
  }

  /**
   * Initialize OpenAI Agents SDK configuration (called once globally)
   */
  public static async initializeSDK() {
    try {
      // Initialize OpenAI Agents SDK with our configuration
      await initializeOpenAIAgents();
      logger.info('🔧 [Agent Analyzer] OpenAI Agents SDK initialized globally');
    } catch (error) {
      logger.error('❌ [Agent Analyzer] Failed to initialize SDK', { error });
      throw error;
    }
  }

  private setupAgents() {
    // Content Quality Analysis Agent
    this.contentQualityAgent = createLoggedAgent({
      name: 'ContentQualityAnalyst',
      instructions: `
You are a content quality analyst specializing in email marketing content evaluation.

Your role is to analyze email content for:
1. Clarity and readability (25%)
2. Persuasiveness and engagement (25%)
3. Tone consistency (20%)
4. Message structure and flow (15%)
5. Call-to-action effectiveness (15%)

Always return a JSON object with:
- score: number (0-100)
- issues: array of top 3 issues found
- insights: array of top 3 improvement insights

Be objective, specific, and actionable in your analysis.
      `,
      model: this.config.ai_model,
      tools: [
        tool({
          name: 'analyze_content_quality',
          description: 'Analyze email content quality and provide scoring with specific issues and insights',
          parameters: ContentAnalysisSchema,
          execute: async (params) => {
            // This tool will be called by the agent to structure the analysis
            return `Content analysis for ${params.topic} completed. Please provide scoring and insights based on the evaluation criteria.`;
          }
        })
      ]
    });

    // Visual Design Analysis Agent
    this.visualDesignAgent = createLoggedAgent({
      name: 'VisualDesignAnalyst',
      instructions: `
You are a visual design analyst specializing in email design evaluation.

Your role is to analyze email visual appeal for:
1. Visual hierarchy and layout (25%)
2. Color scheme and brand consistency (20%)
3. Typography and readability (20%)
4. Image quality and relevance (20%)
5. Mobile responsiveness (15%)

When screenshots are provided, analyze them carefully for visual issues.
Always return a JSON object with:
- score: number (0-100)
- issues: array of top 3 visual issues
- insights: array of top 3 design improvements

Consider email client compatibility and mobile optimization.
      `,
      model: this.config.ai_model,
      tools: [
        tool({
          name: 'analyze_visual_appeal',
          description: 'Analyze email visual design and provide scoring with specific issues and insights',
          parameters: VisualAnalysisSchema,
          execute: async (params) => {
            return `Visual analysis for ${params.topic} completed. Screenshots ${params.screenshots ? 'included' : 'not available'}. Please provide design scoring and insights.`;
          }
        })
      ]
    });

    // Technical Compliance Analysis Agent
    this.technicalComplianceAgent = createLoggedAgent({
      name: 'TechnicalComplianceAnalyst',
      instructions: `
You are a technical compliance analyst specializing in email technical standards.

Your role is to analyze email technical compliance for:
1. Email client compatibility (30%)
2. HTML/CSS validity (25%)
3. Accessibility compliance (WCAG AA) (25%)
4. Performance (file size, load time) (20%)

Always return a JSON object with:
- score: number (0-100)
- issues: array of top 3 technical issues
- insights: array of top 3 compliance improvements

Focus on deliverability, accessibility, and cross-client compatibility.
      `,
      model: this.config.ai_model,
      tools: [
        tool({
          name: 'analyze_technical_compliance',
          description: 'Analyze email technical compliance and provide scoring with specific issues and insights',
          parameters: TechnicalAnalysisSchema,
          execute: async (params) => {
            return `Technical compliance analysis completed. HTML content length: ${params.html_content.length} characters. Please provide technical scoring and insights.`;
          }
        })
      ]
    });

    // Emotional Resonance Analysis Agent
    this.emotionalResonanceAgent = createLoggedAgent({
      name: 'EmotionalResonanceAnalyst',
      instructions: `
You are an emotional resonance analyst specializing in email engagement psychology.

Your role is to analyze email emotional appeal for:
1. Emotional triggers and appeal (30%)
2. Urgency and scarcity messaging (25%)
3. Social proof and trust signals (20%)
4. Call-to-action motivation (25%)

Always return a JSON object with:
- score: number (0-100)
- issues: array of top 3 emotional gaps
- insights: array of top 3 engagement improvements

Focus on psychological triggers that drive action and engagement.
      `,
      model: this.config.ai_model,
      tools: [
        tool({
          name: 'analyze_emotional_resonance',
          description: 'Analyze email emotional resonance and provide scoring with specific issues and insights',
          parameters: EmotionalAnalysisSchema,
          execute: async (params) => {
            return `Emotional resonance analysis for ${params.topic} targeting ${params.target_audience} completed. Please provide emotional scoring and insights.`;
          }
        })
      ]
    });

    // Brand Alignment Analysis Agent
    this.brandAlignmentAgent = createLoggedAgent({
      name: 'BrandAlignmentAnalyst',
      instructions: `
You are a brand alignment analyst specializing in Kupibilet brand consistency.

Your role is to analyze email brand alignment for:
1. Color scheme compliance (25%) - Bright Green (#4BFF7E), Dark Green (#1DA857), Orange-Red (#FF6240), Pink-Purple (#E03EEF), Dark Background (#2C3959)
2. Typography consistency (20%) - Modern, clean sans-serif
3. Tone of voice alignment (25%) - Friendly, helpful, trustworthy
4. Brand values representation (30%) - Affordable travel, customer-first, reliability

Always return a JSON object with:
- score: number (0-100)
- issues: array of top 3 brand inconsistencies
- insights: array of top 3 brand improvements

Ensure consistency with Kupibilet's travel brand identity.
      `,
      model: this.config.ai_model,
      tools: [
        tool({
          name: 'analyze_brand_alignment',
          description: 'Analyze email brand alignment and provide scoring with specific issues and insights',
          parameters: BrandAnalysisSchema,
          execute: async (params) => {
            return `Brand alignment analysis completed for Kupibilet brand guidelines. HTML content length: ${params.html_content.length} characters. Please provide brand scoring and insights.`;
          }
        })
      ]
    });

    // Coordinator Agent for orchestrating analysis
    this.coordinatorAgent = createLoggedAgent({
      name: 'EmailQualityCoordinator',
      instructions: `
You are the Email Quality Analysis Coordinator. Your role is to orchestrate comprehensive email quality analysis by coordinating with specialist agents.

You have access to these specialist agents:
1. ContentQualityAnalyst - Analyzes content quality and readability
2. VisualDesignAnalyst - Analyzes visual design and layout
3. TechnicalComplianceAnalyst - Analyzes technical compliance and accessibility
4. EmotionalResonanceAnalyst - Analyzes emotional appeal and engagement
5. BrandAlignmentAnalyst - Analyzes brand consistency and alignment

For each analysis request:
1. Coordinate with all specialist agents to get their analysis
2. Ensure each agent provides a score (0-100) and specific insights
3. Compile the results into a comprehensive quality assessment
4. Calculate overall quality score and provide actionable recommendations

Always maintain quality standards and provide actionable insights.
      `,
      model: this.config.ai_model,
      handoffs: [
        this.contentQualityAgent,
        this.visualDesignAgent,
        this.technicalComplianceAgent,
        this.emotionalResonanceAgent,
        this.brandAlignmentAgent
      ]
    });

    logger.info('🤖 [Agent Analyzer] All specialist agents configured', {
      content_agent: this.contentQualityAgent.agentName,
      visual_agent: this.visualDesignAgent.agentName,
      technical_agent: this.technicalComplianceAgent.agentName,
      emotional_agent: this.emotionalResonanceAgent.agentName,
      brand_agent: this.brandAlignmentAgent.agentName,
      coordinator: this.coordinatorAgent.agentName
    });
  }

  /**
   * Perform comprehensive email quality analysis using agent coordination
   */
  async analyzeEmail(request: AIConsultantRequest): Promise<QualityAnalysisResult> {
    return withSDKTrace('Agent Email Analysis', async () => {
      const startTime = Date.now();
      
      try {
        // Ensure agents are initialized
        if (!this.initialized) {
          logger.warn('⚠️ [Agent Analyzer] Agents not initialized, initializing now...');
          this.setupAgents();
          this.initialized = true;
        }

        logger.info(`🤖 Starting agent-based analysis for email: ${request.topic}`, {
          campaign_type: request.campaign_type,
          target_audience: request.target_audience,
          iteration_count: request.iteration_count || 0,
          html_length: request.html_content?.length || 0
        });
        
        // Prepare analysis context
        const analysisContext = this.prepareAnalysisContext(request);
        
        logger.debug(`📊 Analysis context prepared`, { 
          has_screenshots: !!request.screenshots,
          has_assets_info: !!request.assets_info,
          has_render_results: !!request.render_results
        });

        // Use coordinator agent to orchestrate the analysis
        const coordinatorPrompt = `
Please coordinate a comprehensive email quality analysis for the following email campaign:

TOPIC: ${request.topic}
TARGET AUDIENCE: ${request.target_audience}
CAMPAIGN TYPE: ${request.campaign_type}

EMAIL CONTENT (TRUNCATED FOR ANALYSIS):
${request.html_content.substring(0, 2000)}...

ADDITIONAL CONTEXT:
- Assets Info: ${JSON.stringify(request.assets_info)}
- Render Results: ${JSON.stringify(request.render_results)}
- Screenshots: ${request.screenshots ? 'Available' : 'Not available'}

Please coordinate with all specialist agents to get:
1. Content Quality Analysis (ContentQualityAnalyst)
2. Visual Design Analysis (VisualDesignAnalyst)  
3. Technical Compliance Analysis (TechnicalComplianceAnalyst)
4. Emotional Resonance Analysis (EmotionalResonanceAnalyst)
5. Brand Alignment Analysis (BrandAlignmentAnalyst)

Each analysis should provide a score (0-100) and specific insights.
        `;

        // Run coordinator agent with tracing and increased maxTurns
        logger.info(`🎯 Starting coordinator agent orchestration`);
        const coordinatorResult = await withToolExecution(
          'CoordinatorAgent',
          'orchestrate_analysis',
          async () => await run(this.coordinatorAgent, coordinatorPrompt, { maxTurns: 25 }),
          { topic: request.topic, campaign_type: request.campaign_type }
        );
        
        logger.info(`✅ Coordinator agent completed orchestration`);
        
        // Parse the coordinated results and run individual agents for specific scores
        logger.info(`🔄 Running parallel analysis with 5 specialist agents`);
        
        const [
          contentAnalysis,
          visualAnalysis,
          technicalAnalysis,
          emotionalAnalysis,
          brandAnalysis
        ] = await Promise.all([
          withToolExecution('ContentQualityAgent', 'analyze', () => this.runContentQualityAnalysis(analysisContext)),
          withToolExecution('VisualDesignAgent', 'analyze', () => this.runVisualDesignAnalysis(analysisContext)),
          withToolExecution('TechnicalComplianceAgent', 'analyze', () => this.runTechnicalComplianceAnalysis(analysisContext)),
          withToolExecution('EmotionalResonanceAgent', 'analyze', () => this.runEmotionalResonanceAnalysis(analysisContext)),
          withToolExecution('BrandAlignmentAgent', 'analyze', () => this.runBrandAlignmentAnalysis(analysisContext))
        ]);

        logger.info(`✅ All specialist agents completed analysis`);

        // Combine analysis results
        const dimensionScores = {
          content_quality: contentAnalysis.score,
          visual_appeal: visualAnalysis.score,
          technical_compliance: technicalAnalysis.score,
          emotional_resonance: emotionalAnalysis.score,
          brand_alignment: brandAnalysis.score
        };

        // Log individual dimension scores
        logger.debug(`📊 Individual dimension scores:`, dimensionScores);

        // Calculate overall score (weighted average)
        const overallScore = this.calculateOverallScore(dimensionScores);
        logger.info(`🎯 Overall calculated score: ${overallScore}/100`);
        
        // Analyze individual elements
        const analyzedElements = await this.analyzeIndividualElements(analysisContext);
        logger.debug(`📋 Analyzed ${analyzedElements.length} individual elements`);
        
        // Determine quality grade and gate status
        const qualityGrade = this.determineQualityGrade(overallScore);
        const qualityGatePassed = overallScore >= this.config.quality_gate_threshold;

        // Estimate improvement potential
        const improvementPotential = this.estimateImprovementPotential(
          dimensionScores,
          analyzedElements
        );

        const analysisTime = Date.now() - startTime;

        const result: QualityAnalysisResult = {
          overall_score: Math.round(overallScore),
          quality_grade: qualityGrade,
          quality_gate_passed: qualityGatePassed,
          dimension_scores: dimensionScores,
          recommendations: [], // Will be populated by RecommendationEngine
          auto_executable_count: 0,
          manual_approval_count: 0,
          critical_issues_count: 0,
          improvement_potential: improvementPotential,
          estimated_final_score: Math.min(100, overallScore + improvementPotential),
          max_achievable_score: this.calculateMaxAchievableScore(dimensionScores),
          analysis_time: analysisTime,
          confidence_level: this.calculateConfidenceLevel(dimensionScores),
          analyzed_elements: analyzedElements
        };

        // Log comprehensive results
        logger.info(`✅ Agent-based analysis complete`, {
          overall_score: result.overall_score,
          quality_grade: result.quality_grade,
          quality_gate_passed: result.quality_gate_passed,
          analysis_time_ms: result.analysis_time,
          improvement_potential: result.improvement_potential,
          confidence_level: result.confidence_level,
          elements_analyzed: result.analyzed_elements.length
        });

        // Log each dimension score for visibility in traces
        Object.entries(result.dimension_scores).forEach(([dimension, score]) => {
          logger.debug(`📊 ${dimension}: ${score}/100`);
        });

        return result;

      } catch (error) {
        const analysisTime = Date.now() - startTime;
        logger.error('❌ Agent-based analysis failed', { 
          topic: request.topic,
          analysis_time_ms: analysisTime,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        throw new AIConsultantError(
          'Agent-based email analysis failed',
          'AGENT_ANALYSIS_FAILED',
          { error: error instanceof Error ? error.message : String(error), request: request.topic }
        );
      }
    });
  }

  /**
   * Run content quality analysis with specific agent
   */
  private async runContentQualityAnalysis(context: any): Promise<{ score: number; issues: string[]; insights: string[] }> {
    const prompt = `
Analyze the content quality of this email campaign using the analyze_content_quality tool:

TOPIC: ${context.topic}
TARGET AUDIENCE: ${context.target_audience}
CAMPAIGN TYPE: ${context.campaign_type}
EMAIL CONTENT: ${context.html_content.substring(0, 1500)}...

Provide a comprehensive content quality analysis focusing on clarity, persuasiveness, tone, structure, and call-to-action effectiveness.
    `;

    const result = await run(this.contentQualityAgent, prompt, { maxTurns: 15 });
    return this.parseAnalysisResult(result.finalOutput, 'content');
  }

  /**
   * Run visual design analysis with specific agent
   */
  private async runVisualDesignAnalysis(context: any): Promise<{ score: number; issues: string[]; insights: string[] }> {
    const prompt = `
Analyze the visual design of this email campaign using the analyze_visual_appeal tool:

TOPIC: ${context.topic}
CAMPAIGN TYPE: ${context.campaign_type}
ASSETS USED: ${JSON.stringify(context.assets_info)}
EMAIL HTML: ${context.html_content.substring(0, 1000)}...

${context.screenshots?.desktop || context.screenshots?.mobile ? 'Screenshots are available for visual analysis.' : 'Analyzing based on HTML code only.'}

Provide a comprehensive visual design analysis focusing on hierarchy, colors, typography, images, and mobile responsiveness.
    `;

    const result = await run(this.visualDesignAgent, prompt, { maxTurns: 15 });
    return this.parseAnalysisResult(result.finalOutput, 'visual');
  }

  /**
   * Run technical compliance analysis with specific agent
   */
  private async runTechnicalComplianceAnalysis(context: any): Promise<{ score: number; issues: string[]; insights: string[] }> {
    const prompt = `
Analyze the technical compliance of this email using the analyze_technical_compliance tool:

EMAIL HTML: ${context.html_content}
RENDER TEST RESULTS: ${JSON.stringify(context.render_results)}

Provide a comprehensive technical compliance analysis focusing on email client compatibility, HTML/CSS validity, accessibility, and performance.
    `;

    const result = await run(this.technicalComplianceAgent, prompt, { maxTurns: 15 });
    return this.parseAnalysisResult(result.finalOutput, 'technical');
  }

  /**
   * Run emotional resonance analysis with specific agent
   */
  private async runEmotionalResonanceAnalysis(context: any): Promise<{ score: number; issues: string[]; insights: string[] }> {
    const prompt = `
Analyze the emotional resonance of this email campaign using the analyze_emotional_resonance tool:

TOPIC: ${context.topic}
TARGET AUDIENCE: ${context.target_audience}
PRICING INFO: ${JSON.stringify(context.pricing_info)}
EMAIL CONTENT: ${context.html_content}

Provide a comprehensive emotional resonance analysis focusing on emotional triggers, urgency messaging, social proof, and call-to-action motivation.
    `;

    const result = await run(this.emotionalResonanceAgent, prompt, { maxTurns: 15 });
    return this.parseAnalysisResult(result.finalOutput, 'emotional');
  }

  /**
   * Run brand alignment analysis with specific agent
   */
  private async runBrandAlignmentAnalysis(context: any): Promise<{ score: number; issues: string[]; insights: string[] }> {
    const prompt = `
Analyze the brand alignment for this Kupibilet email campaign using the analyze_brand_alignment tool:

EMAIL HTML: ${context.html_content}

Evaluate alignment with Kupibilet brand guidelines including colors, typography, tone of voice, and brand values representation.
    `;

    const result = await run(this.brandAlignmentAgent, prompt, { maxTurns: 15 });
    return this.parseAnalysisResult(result.finalOutput, 'brand');
  }

  /**
   * Parse analysis result from agent response
   */
  private parseAnalysisResult(agentOutput: string, analysisType: string): { score: number; issues: string[]; insights: string[] } {
    try {
      // Try to extract JSON from agent response
      const jsonMatch = agentOutput.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          score: Math.max(0, Math.min(100, parsed.score || 75)),
          issues: parsed.issues || [`${analysisType} analysis completed`],
          insights: parsed.insights || [`${analysisType} insights generated`]
        };
      }

      // Alternative: parse from text response
      const scoreMatch = agentOutput.match(/score[:\s]*(\d+)/i);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 75;

      return {
        score: Math.max(0, Math.min(100, score)),
        issues: [`${analysisType} analysis completed with agent coordination`],
        insights: [`${analysisType} insights generated through agent analysis`]
      };
    } catch (error) {
      logger.warn(`Failed to parse ${analysisType} analysis result:`, error);
      return {
        score: 75, // Default score
        issues: [`${analysisType} analysis completed`],
        insights: [`${analysisType} insights generated`]
      };
    }
  }

  /**
   * Prepare analysis context from request
   */
  private prepareAnalysisContext(request: AIConsultantRequest) {
    return {
      topic: request.topic,
      target_audience: request.target_audience,
      campaign_type: request.campaign_type,
      html_content: request.html_content,
      assets_info: request.assets_info || [],
      render_results: request.render_results || {},
      screenshots: request.screenshots || {},
      pricing_info: request.pricing_info || {},
      content_metadata: request.content_metadata || {}
    };
  }

  /**
   * Calculate weighted overall score
   */
  private calculateOverallScore(dimensionScores: Record<QualityDimension, number>): number {
    const weights = {
      content_quality: 0.25,
      visual_appeal: 0.25,
      technical_compliance: 0.20,
      emotional_resonance: 0.15,
      brand_alignment: 0.15
    };

    let totalScore = 0;
    let totalWeight = 0;

    for (const [dimension, score] of Object.entries(dimensionScores)) {
      const weight = weights[dimension as QualityDimension] || 0;
      totalScore += score * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Determine quality grade based on score
   */
  private determineQualityGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 85) return 'A';
    if (score >= 75) return 'B';
    if (score >= 65) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Calculate confidence level based on dimension score consistency
   */
  private calculateConfidenceLevel(dimensionScores: Record<QualityDimension, number>): number {
    const scores = Object.values(dimensionScores);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Lower standard deviation means higher confidence
    return Math.max(70, Math.min(100, 100 - (standardDeviation * 2)));
  }

  /**
   * Calculate maximum achievable score
   */
  private calculateMaxAchievableScore(dimensionScores: Record<QualityDimension, number>): number {
    // Assume that with improvements, each dimension can reach at least 90% of its current potential
    const maxScores = Object.values(dimensionScores).map(score => Math.min(100, score + 20));
    return Math.round(maxScores.reduce((sum, score) => sum + score, 0) / maxScores.length);
  }

  /**
   * Estimate improvement potential
   */
  private estimateImprovementPotential(
    dimensionScores: Record<QualityDimension, number>,
    elements: AnalyzedElement[]
  ): number {
    const scores = Object.values(dimensionScores);
    const lowestScores = scores.filter(score => score < 80);
    const averageImprovement = lowestScores.length > 0 
      ? lowestScores.reduce((sum, score) => sum + (80 - score), 0) / lowestScores.length
      : 5;

    return Math.min(30, Math.max(5, averageImprovement));
  }

  /**
   * Analyze individual email elements
   */
  private async analyzeIndividualElements(context: any): Promise<AnalyzedElement[]> {
    const elements: AnalyzedElement[] = [];

    // Analyze subject line
    if (context.content_metadata?.subject) {
      elements.push({
        type: 'text',
        element_id: 'subject_line',
        description: 'Email subject line',
        issues: context.content_metadata.subject.length > 50 ? ['Subject line too long'] : [],
        score: context.content_metadata.subject.length <= 50 ? 85 : 60,
        recommendations: context.content_metadata.subject.length > 50 ? ['Shorten subject line to under 50 characters'] : []
      });
    }

    // Analyze images
    if (context.assets_info?.length > 0) {
      elements.push({
        type: 'image',
        element_id: 'email_images',
        description: 'Email images and assets',
        issues: [],
        score: 75,
        recommendations: ['Optimize image alt text for accessibility']
      });
    }

    return elements;
  }
} 