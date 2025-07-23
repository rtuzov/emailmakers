/**
 * 📝 COPY GENERATE - Simple Tool
 * 
 * Простая генерация копирайта для specific элементов email
 * Заменяет часть функциональности content-generator
 */

import { z } from 'zod';
// generateCopy removed - now using consolidated content generator

export const copyGenerateSchema = z.object({
  copy_type: z.enum(['subject', 'preheader', 'cta', 'headline', 'description']).describe('Type of copy to generate'),
  base_content: z.string().describe('Base content or topic for copy generation'),
  style_preferences: z.object({
    tone: z.enum(['professional', 'friendly', 'urgent', 'casual', 'luxury', 'family']).describe('Content tone'),
    length: z.enum(['short', 'medium', 'long']).describe('Content length'),
    formality: z.enum(['formal', 'informal', 'neutral']).describe('Content formality'),
    emotional_appeal: z.enum(['logical', 'emotional', 'urgency', 'curiosity']).describe('Emotional appeal type')
  }).describe('Style preferences for copy generation'),
  // Simplified context - no optional nested fields
  target_audience: z.string().describe('Target audience for copy'),
  campaign_goal: z.enum(['awareness', 'conversion', 'retention', 'engagement']).describe('Campaign goal'),
  max_characters: z.number().describe('Maximum character limit for copy')
});

export type CopyGenerateParams = z.infer<typeof copyGenerateSchema>;

export interface CopyGenerateResult {
  success: boolean;
  generated_copy: {
    primary_option: string;
    alternative_options?: string[];
    formatted_output: {
      text: string;
      character_count: number;
      word_count: number;
      meets_constraints: boolean;
    };
  };
  copy_analysis: {
    copy_type: string;
    style_score: number;
    readability_score: number;
    emotional_impact: 'low' | 'medium' | 'high';
    urgency_level: 'low' | 'medium' | 'high';
    keyword_coverage: number;
    recommendations: string[];
  };
  error?: string;
}

export async function copyGenerate(params: CopyGenerateParams): Promise<CopyGenerateResult> {
  try {
    console.log('📝 Generating specialized copy:', {
      copy_type: params.copy_type,
      base_content: params.base_content.substring(0, 50),
      tone: params.style_preferences.tone
    });

    // Map copy_type to content_type for the copy tool
    // const contentTypeMap = {
    //   'subject': 'subject_line',
    //   'preheader': 'preheader', 
    //   'cta': 'call_to_action',
    //   'headline': 'body_text',
    //   'description': 'body_text'
    // };

    // Build specialized generation parameters with simplified schema
    /*
    const copyParams = { // Currently unused
      topic: params.base_content,
      content_type: contentTypeMap[params.copy_type] as any,
      tone: params.style_preferences.tone,
      language: 'ru' as const,
      target_audience: params.target_audience,
      prices: {
        currency: 'RUB',
        cheapest: 0,
        prices: []
      },
      campaign_context: {
        campaign_type: 'promotional' as const,
        urgency_level: params.style_preferences.emotional_appeal === 'urgency' ? 'high' as const : 'medium' as const
      },
      style_preferences: params.style_preferences,
      max_characters: params.max_characters
    };
    */

    // Generate copy using existing tool
    // generateCopy removed - using mock data for now
  const result = { 
    success: false, 
    error: 'generateCopy tool removed - use consolidated content generator',
    _data: null
  };
    
    if (!result.success) {
      return {
        success: false,
        generated_copy: {
          primary_option: '',
          formatted_output: {
            text: '',
            character_count: 0,
            word_count: 0,
            meets_constraints: false
          }
        },
        copy_analysis: {
          copy_type: params.copy_type,
          style_score: 0,
          readability_score: 0,
          emotional_impact: 'low',
          urgency_level: 'low',
          keyword_coverage: 0,
          recommendations: ['Check generation parameters', 'Verify copy requirements']
        },
        error: result.error || 'Copy generation failed'
      };
    }

    // Extract copy based on type
    const generatedText = extractCopyByType(result._data || {}, params.copy_type);
    
    // Generate alternatives if possible
    const alternatives = generateAlternatives(generatedText, params);
    
    // Analyze the generated copy
    const copyAnalysis = analyzeCopyQuality(generatedText, params);
    
    // Format output
    const formattedOutput = formatCopyOutput(generatedText, params.max_characters);

    return {
      success: true,
      generated_copy: {
        primary_option: generatedText,
        alternative_options: alternatives,
        formatted_output: formattedOutput
      },
      copy_analysis: copyAnalysis
    };

  } catch (error) {
    console.error('❌ Copy generation failed:', error);

    return {
      success: false,
      generated_copy: {
        primary_option: '',
        formatted_output: {
          text: '',
          character_count: 0,
          word_count: 0,
          meets_constraints: false
        }
      },
      copy_analysis: {
        copy_type: params.copy_type,
        style_score: 0,
        readability_score: 0,
        emotional_impact: 'low',
        urgency_level: 'low',
        keyword_coverage: 0,
        recommendations: ['Check error logs', 'Verify generation settings']
      },
      error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown copy generation error'
    };
  }
}

function extractCopyByType(data: any, copyType: string): string {
  switch (copyType) {
    case 'subject':
      return data.subject || data.content?.subject || 'Новое предложение';
    case 'preheader':
      return data.preheader || data.content?.preheader || 'Узнайте больше';
    case 'cta':
      return data.cta || data.cta_text || data.content?.cta || 'Забронировать';
    case 'headline':
      return data.headline || extractHeadlineFromBody(data.body || data.email_body || '');
    case 'description':
      return data.body || data.email_body || data.content?.body || 'Описание предложения';
    default:
      return data.content || 'Сгенерированный контент';
  }
}

function extractHeadlineFromBody(body: string): string {
  // Extract first meaningful sentence as headline
  const sentences = body.split(/[.!?]/);
  const headline = (sentences && sentences[0] ? sentences[0] : "")?.trim();
  
  if (headline && headline.length > 10 && headline.length < 80) {
    return headline;
  }
  
  return 'Заголовок предложения';
}

function generateAlternatives(primaryCopy: string, _params: CopyGenerateParams): string[] {
  const alternatives: string[] = [];
  
  // Simple alternative generation based on copy type and style
  if (_params.copy_type === 'subject') {
    alternatives.push(
      primaryCopy.replace(/!/g, ''),
      `🎯 ${primaryCopy}`,
      primaryCopy.replace(/\.$/, '!')
    );
  } else if (_params.copy_type === 'cta') {
    const urgentVariants = ['Забронировать сейчас', 'Купить билеты', 'Получить предложение'];
    const friendlyVariants = ['Посмотреть варианты', 'Узнать подробности', 'Выбрать билеты'];
    
    const variants = _params.style_preferences.emotional_appeal === 'urgency' ? urgentVariants : friendlyVariants;
    alternatives.push(...variants.filter(v => v !== primaryCopy).slice(0, 2));
  }
  
  return alternatives.filter(alt => alt && alt !== primaryCopy);
}

function analyzeCopyQuality(copy: string, params: CopyGenerateParams): any {
  const lowerCopy = copy.toLowerCase();
  
  // Style score based on tone matching
  let styleScore = 70;
  const toneKeywords = {
    professional: ['услуга', 'качество', 'профессионально', 'надежно'],
    friendly: ['приглашаем', 'рады', 'вместе', 'для вас'],
    urgent: ['скидка', 'спешите', 'ограниченное время', 'осталось'],
    casual: ['привет', 'привлекательно', 'легко', 'просто'],
    luxury: ['премиум', 'эксклюзивно', 'роскошь', 'vip'],
    family: ['семья', 'дети', 'вместе', 'семейный']
  };
  
  const expectedKeywords = toneKeywords[params.style_preferences.tone] || [];
  const foundKeywords = expectedKeywords.filter((keyword: string) => lowerCopy.includes(keyword));
  styleScore += (foundKeywords.length / expectedKeywords.length) * 20;

  // Readability score (simple heuristic)
  const words = copy.split(/\s+/);
  const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
  const readabilityScore = Math.max(0, 100 - (avgWordLength - 4) * 10);

  // Emotional impact
  const emotionalWords = ['захватывающий', 'удивительный', 'незабываемый', 'особенный', 'уникальный'];
  const emotionalWordCount = emotionalWords.filter(word => lowerCopy.includes(word)).length;
  const emotionalImpact = emotionalWordCount >= 2 ? 'high' : emotionalWordCount >= 1 ? 'medium' : 'low';

  // Urgency level
  const urgencyWords = ['сейчас', 'быстро', 'ограниченно', 'спешите', 'осталось'];
  const urgencyWordCount = urgencyWords.filter(word => lowerCopy.includes(word)).length;
  const urgencyLevel = urgencyWordCount >= 2 ? 'high' : urgencyWordCount >= 1 ? 'medium' : 'low';

  // Keyword coverage (simplified - no constraints object)
  const keywordCoverage = 100;

  // Recommendations
  const recommendations: string[] = [];
  
  if (styleScore < 80) {
    recommendations.push(`Add more ${params.style_preferences.tone} tone elements`);
  }
  
  if (emotionalImpact === 'low' && params.style_preferences.emotional_appeal === 'emotional') {
    recommendations.push('Include more emotional language');
  }
  
  if (urgencyLevel === 'low' && params.style_preferences.emotional_appeal === 'urgency') {
    recommendations.push('Add urgency indicators');
  }
  
  if (keywordCoverage < 100) {
    recommendations.push('Include all required keywords');
  }

  return {
    copy_type: params.copy_type,
    style_score: Math.round(styleScore),
    readability_score: Math.round(readabilityScore),
    emotional_impact: emotionalImpact as 'low' | 'medium' | 'high',
    urgency_level: urgencyLevel as 'low' | 'medium' | 'high',
    keyword_coverage: Math.round(keywordCoverage),
    recommendations
  };
}

function formatCopyOutput(copy: string, maxCharacters: number): any {
  const characterCount = copy.length;
  const wordCount = copy.split(/\s+/).length;
  
  let meetsConstraints = true;
  
  if (characterCount > maxCharacters) {
    meetsConstraints = false;
  }
  
  return {
    text: copy,
    character_count: characterCount,
    word_count: wordCount,
    meets_constraints: meetsConstraints
  };
}