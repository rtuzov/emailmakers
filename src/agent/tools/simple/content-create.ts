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
    console.log('✍️ Creating email content structure:', {
      topic: params.topic,
      content_type: params.content_type,
      tone: params.tone,
      language: params.language
    });

    // This tool will be called by OpenAI Agents SDK
    // The tool should return a signal that content needs to be generated
    console.log('📝 content_create tool called with parameters:', params);
    
    // Return a signal that indicates content generation is needed
    // The OpenAI model will see this and generate the actual content
    const result = {
      success: true,
      data: {
        content_generation_request: {
          topic: params.topic,
          tone: params.tone,
          language: params.language,
          content_type: params.content_type,
          target_audience: params.target_audience,
          instructions: `Generate ${params.language === 'ru' ? 'Russian' : 'English'} email content for topic: "${params.topic}" with ${params.tone} tone. Return JSON with: {"subject": "...", "preheader": "...", "body": "...", "cta": "..."}`
        }
      }
    };
    
    console.log('🔍 content_create tool executed - content generation requested');
    
    if (!result.success) {
      console.error('❌ Copy generation failed:', 'Content generation failed');
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
        error: 'Content generation failed'
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
  
  // If this is a content generation request, return placeholder content
  // The actual content will be generated by OpenAI Agents SDK
  if (data.content_generation_request) {
    const request = data.content_generation_request;
    return {
      complete_content: {
        subject: `Generated content for: ${request.topic}`,
        preheader: `Learn more about ${request.topic}`,
        body: `Content will be generated by OpenAI Agents SDK for topic: ${request.topic}`,
        cta: 'Learn More'
      }
    };
  }
  
  // Handle email content type (complete email content)
  if (contentType === 'email' || contentType === 'complete_campaign') {
    return {
      complete_content: {
        subject: data.subject || data.content?.subject || `Email about ${contentType}`,
        preheader: data.preheader || data.content?.preheader || 'Learn more',
        body: data.body || data.email_body || data.content?.body || 'Content will be generated',
        cta: data.cta || data.cta_text || data.content?.cta || 'Learn More'
      }
    };
  }

  // Handle specific content types
  switch (contentType) {
    case 'subject_line':
      if (!data.subject) {
        console.error('❌ ContentCreate: Subject отсутствует для subject_line');
        throw new Error('Subject обязателен для subject_line');
      }
      return { subject: data.subject };
    case 'preheader':
      if (!data.preheader) {
        console.error('❌ ContentCreate: Preheader отсутствует для preheader');
        throw new Error('Preheader обязателен для preheader');
      }
      return { preheader: data.preheader };
    case 'body_text':
      const body = data.body || data.email_body;
      if (!body) {
        console.error('❌ ContentCreate: Body отсутствует для body_text');
        throw new Error('Body обязателен для body_text');
      }
      return { email_body: body };
    case 'call_to_action':
      const cta = data.cta || data.cta_text;
      if (!cta) {
        console.error('❌ ContentCreate: CTA отсутствует для call_to_action');
        throw new Error('CTA обязателен для call_to_action');
      }
      return { cta_text: cta };
    default:
      console.error(`❌ ContentCreate: Неизвестный content_type: ${contentType}`);
      throw new Error(`Неподдерживаемый content_type: ${contentType}`);
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
  const ctaText = (contentData.cta_text || contentData.complete_content?.cta);
  if (!ctaText) {
    console.error('❌ ContentCreate: CTA текст отсутствует для анализа силы');
    throw new Error('CTA текст обязателен для анализа силы призыва к действию');
  }
  const ctaLowerCase = ctaText.toLowerCase();
  
  if (/забронировать сейчас|купить билет|получить скидку/i.test(ctaLowerCase)) {
    ctaStrength = 'strong';
  } else if (/забронировать|посмотреть|узнать больше/i.test(ctaLowerCase)) {
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