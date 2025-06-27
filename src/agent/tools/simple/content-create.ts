/**
 * ✍️ CONTENT CREATE - Simple Tool
 * 
 * Простое создание основного email контента с учетом контекста
 * Заменяет часть функциональности content-generator
 */

import { z } from 'zod';
import { generateCopy } from '../copy';

// МАКСИМАЛЬНО ПРОСТАЯ СХЕМА ДЛЯ OPENAI СОВМЕСТИМОСТИ
export const contentCreateSchema = z.object({
  topic: z.string().describe('Main topic for email content'),
  content_type: z.enum(['email', 'subject_line', 'preheader', 'body_text', 'complete_campaign']).describe('Type of content to generate'),
  tone: z.enum(['professional', 'friendly', 'urgent', 'casual', 'luxury', 'family']).describe('Content tone'),
  language: z.enum(['ru', 'en']).describe('Content language'),
  target_audience: z.string().describe('Target audience for personalization'),
  urgency_level: z.enum(['low', 'medium', 'high']).describe('Campaign urgency level'),
  include_personalization: z.boolean().describe('Include personalization elements'),
  include_cta: z.boolean().describe('Include call-to-action'),
  content_length: z.enum(['short', 'medium', 'long']).describe('Desired content length'),
  generation_quality: z.enum(['fast', 'balanced', 'quality']).describe('Generation quality vs speed')
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

    // Build generation parameters for the copy tool with simplified schema
    const copyParams = {
      topic: params.topic,
      tone: params.tone,
      language: params.language,
      content_type: params.content_type,
      target_audience: params.target_audience,
      prices: {
        currency: 'RUB',
        cheapest: 0,
        prices: []
      },
      campaign_context: {
        campaign_type: 'promotional' as const,
        seasonality: 'general' as const,
        urgency_level: params.urgency_level
      }
    };

    // Use existing copy generation tool
    const result = await generateCopy(copyParams);
    
    if (!result.success) {
      console.error('❌ Copy generation failed:', result.error);
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

    // Validate that we have proper content data
    if (!result.data || typeof result.data !== 'object') {
      console.warn('⚠️ Copy generation returned invalid data structure');
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
          recommendations: ['Invalid data structure from copy generation']
        },
        error: 'Invalid data structure returned from copy generation'
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
  
  // Handle email content type (complete email content)
  if (contentType === 'email' || contentType === 'complete_campaign') {
    return {
      complete_content: {
        subject: data.subject || data.content?.subject || 'Новое предложение от Kupibilet',
        preheader: data.preheader || data.content?.preheader || 'Ваше путешествие начинается здесь',
        body: data.body || data.email_body || data.content?.body || 'Содержание письма',
        cta: data.cta || data.cta_text || data.content?.cta || 'Забронировать'
      }
    };
  }

  // Handle specific content types
  switch (contentType) {
    case 'subject_line':
      return {
        subject: data.subject || 'Новое предложение от Kupibilet'
      };
    case 'preheader':
      return {
        preheader: data.preheader || 'Ваше путешествие начинается здесь'
      };
    case 'body_text':
      return {
        email_body: data.body || data.email_body || 'Содержание письма'
      };
    case 'call_to_action':
      return {
        cta_text: data.cta || data.cta_text || 'Забронировать'
      };
    default:
      // Fallback for unknown content types - return complete content
      return {
        complete_content: {
          subject: data.subject || 'Новое предложение от Kupibilet',
          preheader: data.preheader || 'Ваше путешествие начинается здесь',
          body: data.body || data.email_body || 'Содержание письма',
          cta: data.cta || data.cta_text || 'Забронировать'
        }
      };
  }
}

function analyzeContentStructure(contentData: any, params: ContentCreateParams): any {
  const allText = JSON.stringify(contentData).toLowerCase();
  const wordCount = allText.split(/\s+/).length;
  
  // Analyze content characteristics
  const hasPersonalization = params.include_personalization && /вы|ваш|для вас|персонально/i.test(allText);
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
  
  if (!hasPersonalization && params.include_personalization) {
    recommendations.push('Consider adding personalization elements');
  }
  
  if (!includesPricing && params.urgency_level === 'high') {
    recommendations.push('Include pricing information for better conversion');
  }
  
  if (urgencyIndicators.length === 0 && params.urgency_level === 'high') {
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