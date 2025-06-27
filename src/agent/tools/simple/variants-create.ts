/**
 * 🔄 VARIANTS CREATE - Simple Tool
 * 
 * Простое создание A/B вариантов контента для тестирования
 * Заменяет часть функциональности content-generator
 */

import { z } from 'zod';
import { generateCopy } from '../copy';

export const variantsCreateSchema = z.object({
  base_content: z.string().describe('Base content to create variants from'),
  variant_count: z.number().min(1).max(5).default(2).describe('Number of variants to create'),
  variation_focus: z.enum(['tone', 'length', 'approach', 'urgency', 'emotional_appeal']).default('tone').describe('Primary focus for variation'),
  content_elements: z.object({
    subject: z.string().optional().nullable(),
    preheader: z.string().optional().nullable(),
    body: z.string().optional().nullable(),
    cta: z.string().optional().nullable()
  }).optional().nullable().describe('Specific content elements to vary'),
  testing_hypothesis: z.object({
    test_goal: z.enum(['open_rate', 'click_rate', 'conversion', 'engagement']).default('click_rate'),
    target_audience_segments: z.array(z.string()).optional().nullable(),
    expected_winner: z.enum(['variant_a', 'variant_b', 'uncertain']).optional().nullable()
  }).optional().nullable().describe('A/B testing configuration'),
  variation_constraints: z.object({
    maintain_core_message: z.boolean().default(true),
    keep_same_length: z.boolean().default(false),
    preserve_keywords: z.array(z.string()).optional().nullable()
  }).optional().nullable().describe('Constraints for variant generation')
});

export type VariantsCreateParams = z.infer<typeof variantsCreateSchema>;

export interface VariantsCreateResult {
  success: boolean;
  variants: Array<{
    variant_id: string;
    variant_name: string;
    content: {
      subject?: string;
      preheader?: string;
      body?: string;
      cta?: string;
    };
    variation_strategy: {
      focus_area: string;
      changes_made: string[];
      expected_impact: string;
    };
    testing_metadata: {
      recommended_split: number;
      expected_performance: 'higher' | 'lower' | 'similar';
      confidence_level: number;
    };
  }>;
  testing_setup: {
    test_duration_days: number;
    minimum_sample_size: number;
    success_metrics: string[];
    analysis_recommendations: string[];
  };
  error?: string;
}

export async function variantsCreate(params: VariantsCreateParams): Promise<VariantsCreateResult> {
  try {
    console.log('🔄 Creating content variants:', {
      variant_count: params.variant_count,
      variation_focus: params.variation_focus,
      base_content_length: params.base_content.length
    });

    const variants: any[] = [];
    
    // Generate each variant with different strategies
    for (let i = 0; i < params.variant_count; i++) {
      const variantStrategy = getVariationStrategy(params.variation_focus, i);
      const variant = await generateSingleVariant(params, variantStrategy, i);
      
      if (variant) {
        variants.push(variant);
      }
    }

    if (variants.length === 0) {
      return {
        success: false,
        variants: [],
        testing_setup: {
          test_duration_days: 0,
          minimum_sample_size: 0,
          success_metrics: [],
          analysis_recommendations: ['Check variant generation parameters']
        },
        error: 'No variants could be generated'
      };
    }

    // Generate testing setup recommendations
    const testingSetup = generateTestingSetup(params, variants);

    return {
      success: true,
      variants,
      testing_setup: testingSetup
    };

  } catch (error) {
    console.error('❌ Variants creation failed:', error);

    return {
      success: false,
      variants: [],
      testing_setup: {
        test_duration_days: 0,
        minimum_sample_size: 0,
        success_metrics: [],
        analysis_recommendations: ['Check error logs', 'Verify generation settings']
      },
      error: error instanceof Error ? error.message : 'Unknown variants creation error'
    };
  }
}

async function generateSingleVariant(
  params: VariantsCreateParams, 
  strategy: any, 
  variantIndex: number
): Promise<any | null> {
  try {
    // Build generation parameters based on strategy
    const copyParams = {
      topic: params.base_content,
      content_type: 'complete_campaign' as const,
      tone: strategy.tone,
      language: 'ru' as const,
      target_audience: 'travelers',
      campaign_context: {
        campaign_type: 'promotional' as const,
        urgency_level: strategy.urgency_level
      },
      style_preferences: {
        length: strategy.length,
        emotional_appeal: strategy.emotional_appeal
      }
    };

    const result = await generateCopy(copyParams);
    
    if (!result.success || !result.data) {
      return null;
    }

    const content = extractVariantContent(result.data, params.content_elements);
    const changesMade = analyzeChanges(content, params, strategy);

    return {
      variant_id: `variant_${String.fromCharCode(65 + variantIndex)}`, // A, B, C, etc.
      variant_name: strategy.name,
      content,
      variation_strategy: {
        focus_area: params.variation_focus,
        changes_made: changesMade,
        expected_impact: strategy.expected_impact
      },
      testing_metadata: {
        recommended_split: Math.round(100 / params.variant_count),
        expected_performance: strategy.expected_performance,
        confidence_level: strategy.confidence_level
      }
    };

  } catch (error) {
    console.warn(`Failed to generate variant ${variantIndex}:`, error);
    return null;
  }
}

function getVariationStrategy(focus: string, variantIndex: number): any {
  const strategies = {
    tone: [
      {
        name: 'Professional Approach',
        tone: 'professional',
        urgency_level: 'medium',
        length: 'medium',
        emotional_appeal: 'logical',
        expected_impact: 'Higher trust, potentially lower engagement',
        expected_performance: 'similar',
        confidence_level: 75
      },
      {
        name: 'Friendly & Enthusiastic',
        tone: 'friendly',
        urgency_level: 'medium',
        length: 'medium',
        emotional_appeal: 'emotional',
        expected_impact: 'Higher engagement, broader appeal',
        expected_performance: 'higher',
        confidence_level: 80
      }
    ],
    urgency: [
      {
        name: 'High Urgency',
        tone: 'urgent',
        urgency_level: 'high',
        length: 'medium',
        emotional_appeal: 'urgency',
        expected_impact: 'Higher immediate action, risk of pressure',
        expected_performance: 'higher',
        confidence_level: 70
      },
      {
        name: 'Low Pressure',
        tone: 'friendly',
        urgency_level: 'low',
        length: 'medium',
        emotional_appeal: 'curiosity',
        expected_impact: 'Better user experience, slower conversion',
        expected_performance: 'lower',
        confidence_level: 75
      }
    ],
    length: [
      {
        name: 'Concise Version',
        tone: 'friendly',
        urgency_level: 'medium',
        length: 'short',
        emotional_appeal: 'urgency',
        expected_impact: 'Faster reading, less detail',
        expected_performance: 'higher',
        confidence_level: 85
      },
      {
        name: 'Detailed Version',
        tone: 'professional',
        urgency_level: 'medium',
        length: 'long',
        emotional_appeal: 'logical',
        expected_impact: 'More information, longer engagement',
        expected_performance: 'similar',
        confidence_level: 70
      }
    ],
    emotional_appeal: [
      {
        name: 'Logical Appeal',
        tone: 'professional',
        urgency_level: 'medium',
        length: 'medium',
        emotional_appeal: 'logical',
        expected_impact: 'Fact-based decision making',
        expected_performance: 'similar',
        confidence_level: 80
      },
      {
        name: 'Emotional Appeal',
        tone: 'friendly',
        urgency_level: 'medium',
        length: 'medium',
        emotional_appeal: 'emotional',
        expected_impact: 'Emotional connection and inspiration',
        expected_performance: 'higher',
        confidence_level: 75
      }
    ]
  };

  const focusStrategies = strategies[focus as keyof typeof strategies] || strategies.tone;
  return focusStrategies[variantIndex % focusStrategies.length];
}

function extractVariantContent(data: any, contentElements?: any): any {
  const content: any = {};
  
  if (!contentElements || contentElements.subject) {
    content.subject = data.subject || data.content?.subject || 'Новое предложение';
  }
  
  if (!contentElements || contentElements.preheader) {
    content.preheader = data.preheader || data.content?.preheader || 'Узнайте больше';
  }
  
  if (!contentElements || contentElements.body) {
    content.body = data.body || data.email_body || data.content?.body || 'Содержание письма';
  }
  
  if (!contentElements || contentElements.cta) {
    content.cta = data.cta || data.cta_text || data.content?.cta || 'Действие';
  }

  return content;
}

function analyzeChanges(content: any, params: VariantsCreateParams, strategy: any): string[] {
  const changes: string[] = [];
  
  if (strategy.tone !== 'friendly') {
    changes.push(`Tone adjusted to ${strategy.tone}`);
  }
  
  if (strategy.urgency_level === 'high') {
    changes.push('Increased urgency indicators');
  } else if (strategy.urgency_level === 'low') {
    changes.push('Reduced pressure language');
  }
  
  if (strategy.length === 'short') {
    changes.push('Condensed content length');
  } else if (strategy.length === 'long') {
    changes.push('Expanded with additional details');
  }
  
  if (strategy.emotional_appeal === 'logical') {
    changes.push('Emphasized facts and logic');
  } else if (strategy.emotional_appeal === 'emotional') {
    changes.push('Enhanced emotional language');
  }

  return changes.length > 0 ? changes : ['Variant generated with alternative approach'];
}

function generateTestingSetup(params: VariantsCreateParams, variants: any[]): any {
  const testGoal = params.testing_hypothesis?.test_goal || 'click_rate';
  
  // Calculate recommended test duration
  const testDurationDays = variants.length <= 2 ? 7 : 14;
  
  // Estimate minimum sample size (simplified)
  const baselineRate = testGoal === 'open_rate' ? 0.25 : 0.03;
  const minimumSampleSize = Math.ceil(1000 / baselineRate) * variants.length;
  
  // Define success metrics based on test goal
  const successMetrics = {
    open_rate: ['Email opens', 'Open rate %', 'Time to open'],
    click_rate: ['Click-through rate', 'Unique clicks', 'Click-to-open ratio'],
    conversion: ['Conversion rate', 'Revenue per email', 'Goal completions'],
    engagement: ['Time spent reading', 'Forward rate', 'Reply rate']
  };

  const analysisRecommendations = [
    'Monitor results daily but avoid early conclusions',
    'Ensure statistical significance before declaring a winner',
    'Consider segment-specific performance differences',
    'Document insights for future campaign optimization'
  ];

  if (variants.length > 2) {
    analysisRecommendations.push('Use sequential testing to avoid multiple comparison issues');
  }

  return {
    test_duration_days: testDurationDays,
    minimum_sample_size: minimumSampleSize,
    success_metrics: successMetrics[testGoal] || successMetrics.click_rate,
    analysis_recommendations: analysisRecommendations
  };
}