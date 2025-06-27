/**
 * ✍️ CONTENT CREATE - Simple Tool
 * 
 * Простое создание основного email контента с учетом контекста
 * Заменяет часть функциональности content-generator
 */

import { z } from 'zod';
import { generateCopy } from '../copy';

export const contentCreateSchema = z.object({
  topic: z.string().describe('Main topic for email content'),
  content_type: z.enum(['email', 'subject_line', 'preheader', 'body_text', 'complete_campaign']).default('complete_campaign').describe('Type of content to generate'),
  tone: z.enum(['professional', 'friendly', 'urgent', 'casual', 'luxury', 'family']).default('friendly').describe('Content tone'),
  language: z.enum(['ru', 'en']).default('ru').describe('Content language'),
  target_audience: z.string().optional().nullable().describe('Target audience for personalization'),
  pricing_data: z.object({
    prices: z.array(z.any()).optional().nullable(),
    currency: z.string().default('RUB'),
    cheapest: z.number().default(0)
  }).optional().nullable().describe('Pricing information to include in content'),
  campaign_context: z.object({
    campaign_type: z.enum(['promotional', 'informational', 'seasonal', 'urgent', 'newsletter']).optional().nullable(),
    seasonality: z.enum(['spring', 'summer', 'autumn', 'winter']).optional().nullable(),
    urgency_level: z.enum(['low', 'medium', 'high']).optional().nullable()
  }).optional().nullable().describe('Campaign context for content optimization')
});

export type ContentCreateParams = z.infer<typeof contentCreateSchema>;

export interface ContentCreateResult {
  success: boolean;
  content_data: {
    subject?: string;
    preheader?: string;
    email_body?: string;
    cta_text?: string;
    complete_content?: {
      subject: string;
      preheader: string;
      body: string;
      cta: string;
    };
  };
  content_metadata: {
    content_type: string;
    tone: string;
    language: string;
    word_count: number;
    generation_confidence: number;
    content_structure: {
      has_personalization: boolean;
      includes_pricing: boolean;
      urgency_indicators: string[];
      call_to_action_strength: 'weak' | 'medium' | 'strong';
    };
    recommendations: string[];
  };
  error?: string;
}

export async function contentCreate(params: ContentCreateParams): Promise<ContentCreateResult> {
  const startTime = Date.now();
  
  try {
    console.log('✍️ Creating email content:', {
      topic: params.topic,
      content_type: params.content_type,
      tone: params.tone,
      language: params.language
    });

    // Build generation parameters for the copy tool
    const copyParams = {
      topic: params.topic,
      tone: params.tone,
      language: params.language,
      content_type: params.content_type,
      target_audience: params.target_audience || 'general travelers',
      pricing_data: params.pricing_data,
      campaign_context: params.campaign_context
    };

    // Use existing copy generation tool
    const result = await generateCopy(copyParams);
    
    if (!result.success) {
      return {
        success: false,
        content_data: {},
        content_metadata: {
          content_type: params.content_type,
          tone: params.tone,
          language: params.language,
          word_count: 0,
          generation_confidence: 0,
          content_structure: {
            has_personalization: false,
            includes_pricing: false,
            urgency_indicators: [],
            call_to_action_strength: 'weak'
          },
          recommendations: ['Check generation parameters', 'Verify content requirements']
        },
        error: result.error || 'Content generation failed'
      };
    }

    // Extract and structure content
    const contentData = extractContentData(result, params.content_type);
    const contentMetadata = analyzeContentStructure(contentData, params);

    return {
      success: true,
      content_data: contentData,
      content_metadata: contentMetadata
    };

  } catch (error) {
    console.error('❌ Content creation failed:', error);

    return {
      success: false,
      content_data: {},
      content_metadata: {
        content_type: params.content_type,
        tone: params.tone,
        language: params.language,
        word_count: 0,
        generation_confidence: 0,
        content_structure: {
          has_personalization: false,
          includes_pricing: false,
          urgency_indicators: [],
          call_to_action_strength: 'weak'
        },
        recommendations: ['Check error logs', 'Verify generation settings']
      },
      error: error instanceof Error ? error.message : 'Unknown content creation error'
    };
  }
}

function extractContentData(result: any, contentType: string): any {
  const data = result.data || {};
  
  if (contentType === 'complete_campaign') {
    return {
      complete_content: {
        subject: data.subject || data.content?.subject || 'Новое предложение от Kupibilet',
        preheader: data.preheader || data.content?.preheader || 'Ваше путешествие начинается здесь',
        body: data.body || data.email_body || data.content?.body || 'Содержание письма',
        cta: data.cta || data.cta_text || data.content?.cta || 'Забронировать'
      }
    };
  }

  return {
    subject: contentType === 'subject_line' ? data.subject : undefined,
    preheader: contentType === 'preheader' ? data.preheader : undefined,
    email_body: contentType === 'body_text' ? data.body || data.email_body : undefined,
    cta_text: contentType === 'call_to_action' ? data.cta || data.cta_text : undefined
  };
}

function analyzeContentStructure(contentData: any, params: ContentCreateParams): any {
  const allText = JSON.stringify(contentData).toLowerCase();
  const wordCount = allText.split(/\s+/).length;
  
  // Analyze content characteristics
  const hasPersonalization = /вы|ваш|для вас|персонально/i.test(allText);
  const includesPricing = /руб|₽|цена|стоимость|от \d+/i.test(allText);
  
  // Find urgency indicators
  const urgencyIndicators: string[] = [];
  if (/скидка|акция|ограниченное время|успейте|только сегодня/i.test(allText)) {
    urgencyIndicators.push('limited_time_offer');
  }
  if (/осталось|последние места|заканчивается/i.test(allText)) {
    urgencyIndicators.push('scarcity');
  }
  if (/спешите|быстро|немедленно/i.test(allText)) {
    urgencyIndicators.push('action_urgency');
  }

  // Analyze CTA strength
  let ctaStrength: 'weak' | 'medium' | 'strong' = 'weak';
  const ctaText = (contentData.cta_text || contentData.complete_content?.cta || '').toLowerCase();
  
  if (/забронировать сейчас|купить билет|получить скидку/i.test(ctaText)) {
    ctaStrength = 'strong';
  } else if (/забронировать|посмотреть|узнать больше/i.test(ctaText)) {
    ctaStrength = 'medium';
  }

  // Generate recommendations
  const recommendations: string[] = [];
  
  if (!hasPersonalization && params.target_audience) {
    recommendations.push('Consider adding personalization elements');
  }
  
  if (params.pricing_data && !includesPricing) {
    recommendations.push('Include pricing information for better conversion');
  }
  
  if (urgencyIndicators.length === 0 && params.campaign_context?.urgency_level === 'high') {
    recommendations.push('Add urgency indicators for high-priority campaigns');
  }
  
  if (ctaStrength === 'weak') {
    recommendations.push('Strengthen call-to-action with action verbs');
  }

  if (wordCount < 50) {
    recommendations.push('Consider expanding content for better engagement');
  }

  return {
    content_type: params.content_type,
    tone: params.tone,
    language: params.language,
    word_count: wordCount,
    generation_confidence: Math.min(95, 70 + urgencyIndicators.length * 5 + (ctaStrength === 'strong' ? 10 : 0)),
    content_structure: {
      has_personalization: hasPersonalization,
      includes_pricing: includesPricing,
      urgency_indicators: urgencyIndicators,
      call_to_action_strength: ctaStrength
    },
    recommendations
  };
}