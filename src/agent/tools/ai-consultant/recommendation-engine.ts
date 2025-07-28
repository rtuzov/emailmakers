/**
 * Phase 13.1: Recommendation Engine
 * 
 * Converts quality analysis results into specific, actionable recommendations
 * with automated agent command generation for intelligent email improvement
 */

import { OpenAI } from 'openai';
import { ENV_CONFIG } from '../../../config/env';
import { 
  QualityAnalysisResult,
  QualityRecommendation,
  // AgentCommand,
  AIConsultantRequest,
  AIConsultantConfig,
  AIConsultantError
} from './types';
import { BRAND_COLORS } from '../../../config/constants';

export class RecommendationEngine {
  private _openai: OpenAI; // Reserved for future AI-powered recommendation enhancement
  private config: AIConsultantConfig;

  constructor(config: AIConsultantConfig) {
    this.config = config;
    this._openai = new OpenAI({
      apiKey: ENV_CONFIG.OPENAI_API_KEY,
    });
    
    // _openai will be used for future AI-powered recommendation enhancement
    void this._openai; // Suppress unused variable warning
  }

  /**
   * Generate actionable recommendations based on quality analysis
   */
  async generateRecommendations(
    analysis: QualityAnalysisResult,
    request: AIConsultantRequest
  ): Promise<QualityRecommendation[]> {
    try {
      console.log(`🎯 Generating recommendations for score: ${analysis.overall_score}/100`);

      const recommendations: QualityRecommendation[] = [];

      // Generate recommendations for each dimension
      const [
        contentRecs,
        visualRecs,
        technicalRecs,
        emotionalRecs,
        brandRecs
      ] = await Promise.all([
        this.generateContentRecommendations(analysis, request),
        this.generateVisualRecommendations(analysis, request),
        this.generateTechnicalRecommendations(analysis, request),
        this.generateEmotionalRecommendations(analysis, request),
        this.generateBrandRecommendations(analysis, request)
      ]);

      // Combine and prioritize recommendations
      recommendations.push(...contentRecs, ...visualRecs, ...technicalRecs, ...emotionalRecs, ...brandRecs);

      // Sort by priority and impact
      const prioritizedRecommendations = this.prioritizeRecommendations(recommendations);

      // Limit to max recommendations
      const finalRecommendations = prioritizedRecommendations.slice(0, this.config.max_recommendations);

      console.log(`✅ Generated ${finalRecommendations.length} recommendations`);
      return finalRecommendations;

    } catch (error) {
      console.error('❌ Recommendation generation failed:', 
        { error: error instanceof Error ? error.message : String(error), score: analysis.overall_score }
      );
      throw new AIConsultantError(
        'Failed to generate recommendations',
        'RECOMMENDATION_GENERATION_FAILED',
        { error: error instanceof Error ? error.message : String(error), score: analysis.overall_score }
      );
    }
  }

  /**
   * Generate content quality recommendations
   */
  private async generateContentRecommendations(
    analysis: QualityAnalysisResult,
    request: AIConsultantRequest
  ): Promise<QualityRecommendation[]> {
    if (analysis.dimension_scores.content_quality >= 80) {
      return []; // Content is already good
    }

    const recommendations: QualityRecommendation[] = [];

    // Subject line improvement
    if (request.content_metadata?.subject && request.content_metadata.subject.length > 50) {
      recommendations.push({
        id: `content_subject_${Date.now()}`,
        type: 'content',
        priority: 'high',
        category: 'manual_approval',
        title: 'Optimize Subject Line Length',
        description: 'Subject line is too long and may get cut off in email clients',
        reasoning: 'Email clients typically display 30-50 characters. Current subject has ' + request.content_metadata.subject.length + ' characters.',
        problem_details: `Current subject: "${request.content_metadata.subject}"`,
        agent_command: {
          tool: 'generate_copy',
          parameters: {
            focus: 'subject_line',
            max_length: 45,
            tone: request.content_metadata?.tone || 'engaging',
            current_subject: request.content_metadata.subject
          },
          expected_result: 'Shorter, more impactful subject line under 45 characters',
          success_criteria: ['Length under 45 characters', 'Maintains key message', 'Engaging tone'],
          max_retries: 2,
          timeout: 30
        },
        auto_execute: false,
        requires_approval: true,
        estimated_improvement: 8,
        confidence: 0.9,
        execution_complexity: 'simple',
        estimated_time: 25
      });
    }

    // CTA improvement
    if (analysis.dimension_scores.content_quality < 70) {
      recommendations.push({
        id: `content_cta_${Date.now()}`,
        type: 'content',
        priority: 'medium',
        category: 'manual_approval',
        title: 'Strengthen Call-to-Action',
        description: 'Call-to-action could be more compelling and action-oriented',
        reasoning: 'Strong CTAs can improve click-through rates by 20-30%',
        problem_details: 'Current CTA lacks urgency and emotional appeal',
        agent_command: {
          tool: 'generate_copy',
          parameters: {
            focus: 'call_to_action',
            tone: 'urgent',
            emotion: 'excitement',
            topic: request.topic
          },
          expected_result: 'More compelling call-to-action text',
          success_criteria: ['Action-oriented language', 'Creates urgency', 'Emotionally engaging'],
          max_retries: 2,
          timeout: 30
        },
        auto_execute: false,
        requires_approval: true,
        estimated_improvement: 12,
        confidence: 0.8,
        execution_complexity: 'simple',
        estimated_time: 30
      });
    }

    return recommendations;
  }

  /**
   * Generate visual improvement recommendations
   */
  private async generateVisualRecommendations(
    analysis: QualityAnalysisResult,
    request: AIConsultantRequest
  ): Promise<QualityRecommendation[]> {
    if (analysis.dimension_scores.visual_appeal >= 80) {
      return [];
    }

    const recommendations: QualityRecommendation[] = [];

    // Image emotion improvement
    if (request.assets_used?.original_assets?.length > 0) {
      const currentAsset = request.assets_used.original_assets[0];
      
      // Determine if we need happier/more positive images
      const needsHappierImage = await this.shouldImproveImageEmotion(request, currentAsset);
      
      if (needsHappierImage) {
        recommendations.push({
          id: `visual_emotion_${Date.now()}`,
          type: 'visual',
          priority: 'high',
          category: 'auto_execute',
          title: 'Replace with More Positive Image',
          description: 'Current image emotion doesn\'t match promotional campaign tone',
          reasoning: 'Travel promotions perform better with happy, excited imagery',
          problem_details: `Current asset: ${currentAsset} may appear neutral or sad`,
          agent_command: {
            tool: 'get_figma_assets',
            parameters: {
              tags: ['заяц', 'счастливый', 'радостный', 'путешествие'],
              emotion: 'happy',
              exclude: [currentAsset]
            },
            expected_result: 'Happier rabbit image that matches promotional tone',
            success_criteria: ['Positive emotion', 'Travel-related', 'High quality'],
            max_retries: 2,
            timeout: 45
          },
          auto_execute: true,
          requires_approval: false,
          estimated_improvement: 15,
          confidence: 0.85,
          execution_complexity: 'simple',
          estimated_time: 40
        });
      }
    }

    // Color scheme improvement
    if (analysis.dimension_scores.visual_appeal < 70) {
      recommendations.push({
        id: `visual_colors_${Date.now()}`,
        type: 'visual',
        priority: 'medium',
        category: 'auto_execute',
        title: 'Optimize Brand Color Usage',
        description: 'Improve color contrast and brand consistency',
        reasoning: 'Better color usage improves readability and brand recognition',
        problem_details: 'Colors may not follow Kupibilet brand guidelines optimally',
        agent_command: {
          tool: 'patch_html',
          parameters: {
            target: 'color_scheme',
            primary_color: BRAND_COLORS.PRIMARY,
            secondary_color: BRAND_COLORS.SECONDARY,
            accent_color: '#FF6240',
            background_color: BRAND_COLORS.TERTIARY
          },
          expected_result: 'Improved color scheme following brand guidelines',
          success_criteria: ['Brand colors used', 'Good contrast ratio', 'Consistent application'],
          max_retries: 1,
          timeout: 20
        },
        auto_execute: true,
        requires_approval: false,
        estimated_improvement: 8,
        confidence: 0.9,
        execution_complexity: 'simple',
        estimated_time: 20
      });
    }

    return recommendations;
  }

  /**
   * Generate technical compliance recommendations
   */
  private async generateTechnicalRecommendations(
    analysis: QualityAnalysisResult,
    request: AIConsultantRequest
  ): Promise<QualityRecommendation[]> {
    if (analysis.dimension_scores.technical_compliance >= 85) {
      return [];
    }

    const recommendations: QualityRecommendation[] = [];

    // Accessibility improvements
    recommendations.push({
      id: `tech_accessibility_${Date.now()}`,
      type: 'accessibility',
      priority: 'medium',
      category: 'auto_execute',
      title: 'Improve Image Accessibility',
      description: 'Add or improve alt text for all images',
      reasoning: 'Proper alt text improves accessibility and email client compatibility',
      problem_details: 'Some images may be missing descriptive alt text',
      agent_command: {
        tool: 'patch_html',
        parameters: {
          target: 'image_alt_text',
          improve_accessibility: true,
          topic: request.topic
        },
        expected_result: 'All images have descriptive alt text',
        success_criteria: ['All images have alt text', 'Alt text is descriptive', 'Relevant to content'],
        max_retries: 1,
        timeout: 15
      },
      auto_execute: true,
      requires_approval: false,
      estimated_improvement: 5,
      confidence: 0.95,
      execution_complexity: 'simple',
      estimated_time: 15
    });

    // Email client compatibility
    if (request.render_test_results && request.render_test_results.overall_score < 80) {
      recommendations.push({
        id: `tech_compatibility_${Date.now()}`,
        type: 'technical',
        priority: 'high',
        category: 'auto_execute',
        title: 'Fix Email Client Compatibility',
        description: 'Resolve rendering issues in major email clients',
        reasoning: 'Better compatibility ensures consistent experience across all clients',
        problem_details: `Render test score: ${request.render_test_results.overall_score}/100`,
        agent_command: {
          tool: 'patch_html',
          parameters: {
            target: 'email_compatibility',
            fix_outlook: true,
            fix_gmail: true,
            ensure_table_layout: true
          },
          expected_result: 'Improved email client compatibility',
          success_criteria: ['Works in Outlook', 'Works in Gmail', 'Table-based layout'],
          max_retries: 2,
          timeout: 30
        },
        auto_execute: true,
        requires_approval: false,
        estimated_improvement: 10,
        confidence: 0.8,
        execution_complexity: 'moderate',
        estimated_time: 35
      });
    }

    return recommendations;
  }

  /**
   * Generate emotional resonance recommendations
   */
  private async generateEmotionalRecommendations(
    analysis: QualityAnalysisResult,
    request: AIConsultantRequest
  ): Promise<QualityRecommendation[]> {
    if (analysis.dimension_scores.emotional_resonance >= 75) {
      return [];
    }

    const recommendations: QualityRecommendation[] = [];

    // Add urgency elements
    if (request.prices) {
      recommendations.push({
        id: `emotion_urgency_${Date.now()}`,
        type: 'emotional',
        priority: 'high',
        category: 'manual_approval',
        title: 'Add Urgency and Scarcity Elements',
        description: 'Include time-limited offers to create urgency',
        reasoning: 'Urgency increases conversion rates by creating fear of missing out',
        problem_details: 'Email lacks urgency triggers and scarcity messaging',
        agent_command: {
          tool: 'generate_copy',
          parameters: {
            focus: 'urgency_scarcity',
            price: request.prices.cheapest_price,
            currency: request.prices.currency,
            route: `${request.prices.origin} → ${request.prices.destination}`,
            add_countdown: true
          },
          expected_result: 'Content with urgency and scarcity elements',
          success_criteria: ['Creates urgency', 'Includes time limit', 'Motivates action'],
          max_retries: 2,
          timeout: 35
        },
        auto_execute: false,
        requires_approval: true,
        estimated_improvement: 18,
        confidence: 0.85,
        execution_complexity: 'moderate',
        estimated_time: 40
      });
    }

    return recommendations;
  }

  /**
   * Generate brand alignment recommendations
   */
  private async generateBrandRecommendations(
    analysis: QualityAnalysisResult,
    _request: AIConsultantRequest
  ): Promise<QualityRecommendation[]> {
    if (analysis.dimension_scores.brand_alignment >= 80) {
      return [];
    }

    const recommendations: QualityRecommendation[] = [];

    // Brand tone adjustment
    recommendations.push({
      id: `brand_tone_${Date.now()}`,
      type: 'content',
      priority: 'medium',
      category: 'manual_approval',
      title: 'Adjust Tone to Match Kupibilet Brand',
      description: 'Ensure content tone is friendly, helpful, and trustworthy',
      reasoning: 'Consistent brand tone builds trust and recognition',
      problem_details: 'Current tone may not fully align with Kupibilet\'s friendly approach',
      agent_command: {
        tool: 'generate_copy',
        parameters: {
          focus: 'brand_tone',
          brand: 'kupibilet',
          tone: 'friendly_helpful',
          values: ['affordable_travel', 'customer_first', 'reliability']
        },
        expected_result: 'Content with proper Kupibilet brand tone',
        success_criteria: ['Friendly tone', 'Helpful approach', 'Trustworthy language'],
        max_retries: 2,
        timeout: 30
      },
      auto_execute: false,
      requires_approval: true,
      estimated_improvement: 10,
      confidence: 0.8,
      execution_complexity: 'moderate',
      estimated_time: 35
    });

    return recommendations;
  }

  /**
   * Prioritize recommendations by impact and complexity
   */
  private prioritizeRecommendations(recommendations: QualityRecommendation[]): QualityRecommendation[] {
    return recommendations.sort((a, b) => {
      // Priority order: critical > high > medium > low
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by estimated improvement (higher first)
      const impactDiff = b.estimated_improvement - a.estimated_improvement;
      if (impactDiff !== 0) return impactDiff;
      
      // Then by confidence (higher first)
      const confidenceDiff = b.confidence - a.confidence;
      if (confidenceDiff !== 0) return confidenceDiff;
      
      // Finally by execution complexity (simpler first)
      const complexityOrder = { simple: 3, moderate: 2, complex: 1 };
      return complexityOrder[b.execution_complexity] - complexityOrder[a.execution_complexity];
    });
  }

  /**
   * Determine if image emotion should be improved using AI analysis
   */
  private async shouldImproveImageEmotion(request: AIConsultantRequest, asset: string): Promise<boolean> {
    // For promotional campaigns, we generally want happy/positive imagery
    if (request.campaign_type === 'promotional') {
      // Check if asset name suggests neutral/sad emotion
      const neutralSadIndicators = ['нейтрал', 'грустн', 'печал', 'скучн', 'обычн'];
      const assetLower = asset.toLowerCase();
      
      return neutralSadIndicators.some(indicator => assetLower.includes(indicator));
    }
    
    return false;
  }

  /**
   * Calculate recommendation impact score
   */
  /*
  private calculateImpactScore(recommendation: QualityRecommendation): number {
    const priorityWeight = { critical: 1.0, high: 0.8, medium: 0.6, low: 0.4 };
    const complexityWeight = { simple: 1.0, moderate: 0.8, complex: 0.6 };
    
    return recommendation.estimated_improvement * 
           priorityWeight[recommendation.priority] * 
           complexityWeight[recommendation.execution_complexity] * 
           recommendation.confidence;
  }
  */
} 