/**
 * 🎯 BRAND VOICE TOOL
 * 
 * Инструмент для анализа и обеспечения согласованности голоса бренда
 * Проверяет соответствие контента фирменному стилю и тону
 */


import { z } from 'zod';
import { generateTraceId, tracedAsync } from '../../utils/tracing-utils';

export interface BrandVoiceParams {
  action: 'analyze' | 'validate' | 'adjust' | 'define';
  
  // For analysis and validation
  content?: string;
  content_type?: 'subject' | 'body' | 'cta' | 'full_email';
  
  // For brand definition
  brand_guidelines?: {
    tone: Array<'professional' | 'friendly' | 'casual' | 'formal' | 'playful' | 'authoritative' | 'empathetic'>;
    voice_attributes: Array<'warm' | 'confident' | 'approachable' | 'expert' | 'innovative' | 'trustworthy'>;
    vocabulary_preferences: {
      preferred_words: string[];
      avoided_words: string[];
      industry_terms: string[];
    };
    style_guide: {
      sentence_length: 'short' | 'medium' | 'long' | 'mixed';
      paragraph_structure: 'concise' | 'detailed' | 'conversational';
      punctuation_style: 'minimal' | 'standard' | 'expressive';
    };
  };
  
  // For content adjustment
  target_content?: string;
  adjustment_level?: 'light' | 'moderate' | 'comprehensive';
  preserve_meaning?: boolean;
  
  // Analysis options
  compare_with_samples?: string[];
  industry_context?: string;
  target_audience?: 'b2b' | 'b2c' | 'mixed';
}

export interface BrandVoiceResult {
  success: boolean;
  action_performed: string;
  
  // Analysis results
  voice_analysis?: {
    overall_score: number;
    tone_consistency: number;
    vocabulary_alignment: number;
    style_compliance: number;
    brand_personality_match: number;
    
    detected_tone: string[];
    detected_attributes: string[];
    
    issues_found: Array<{
      type: 'tone_mismatch' | 'vocabulary_violation' | 'style_inconsistency' | 'personality_conflict';
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      location?: {
        section: string;
        text_snippet: string;
      };
      suggestion: string;
    }>;
    
    strengths: string[];
    improvements_needed: string[];
  };
  
  // Validation results
  validation_summary?: {
    compliant: boolean;
    compliance_score: number;
    violations: Array<{
      guideline: string;
      violation_type: string;
      examples: string[];
      impact: 'low' | 'medium' | 'high';
    }>;
    recommendations: string[];
  };
  
  // Adjustment results
  adjusted_content?: {
    original_content: string;
    revised_content: string;
    changes_made: Array<{
      type: 'tone_adjustment' | 'vocabulary_replacement' | 'style_modification';
      original_text: string;
      revised_text: string;
      reason: string;
    }>;
    improvement_metrics: {
      tone_improvement: number;
      vocabulary_improvement: number;
      style_improvement: number;
      overall_improvement: number;
    };
  };
  
  // Brand definition results
  brand_profile?: {
    defined_tone: string[];
    voice_characteristics: string[];
    vocabulary_guidelines: {
      preferred_terms: string[];
      terms_to_avoid: string[];
      brand_specific_terms: string[];
    };
    style_specifications: {
      writing_style: string;
      communication_approach: string;
      content_structure: string;
    };
    implementation_guide: string[];
  };
  
  performance_metrics: {
    brand_alignment_score: number;
    consistency_score: number;
    audience_appropriateness: number;
    engagement_potential: number;
  };
  
  recommendations: string[];
  error?: string;
}

export async function brandVoice(params: BrandVoiceParams): Promise<BrandVoiceResult> {
  const traceId = generateTraceId();
  
  return await tracedAsync({
    name: 'brand_voice',
    metadata: { trace_id: traceId }
  }, async () => {
    const startTime = Date.now();
    console.log(`🎯 Brand Voice: ${params.action} operation starting`);

    try {
      // Validate parameters
      const validationResult = validateBrandVoiceParams(params);
      if (!validationResult.valid) {
        const errorResult: BrandVoiceResult = {
          success: false,
          action_performed: params.action,
          performance_metrics: {
            brand_alignment_score: 0,
            consistency_score: 0,
            audience_appropriateness: 0,
            engagement_potential: 0
          },
          recommendations: ['Fix parameter validation errors'],
          error: validationResult.error
        };

        console.log(`❌ Brand Voice failed: ${validationResult.error}`);
        return errorResult;
      }

      let result: BrandVoiceResult;

      switch (params.action) {
        case 'analyze':
          result = await analyzeBrandVoice(params);
          break;
        case 'validate':
          result = await validateBrandCompliance(params);
          break;
        case 'adjust':
          result = await adjustContentVoice(params);
          break;
        case 'define':
          result = await defineBrandVoice(params);
          break;
        default:
          throw new Error(`Unknown action: ${params.action}`);
      }

      const duration = Date.now() - startTime;
      console.log(`✅ Brand Voice ${params.action} completed in ${duration}ms`);
      
      return result;

    } catch (error) {
      const errorResult: BrandVoiceResult = {
        success: false,
        action_performed: params.action,
        performance_metrics: {
          brand_alignment_score: 0,
          consistency_score: 0,
          audience_appropriateness: 0,
          engagement_potential: 0
        },
        recommendations: ['Review error logs and fix issues'],
        error: error instanceof Error ? error.message : 'Unknown error in brand voice operation'
      };

      const duration = Date.now() - startTime;
      console.log(`❌ Brand Voice failed after ${duration}ms:`, error);
      
      return errorResult;
    }
  });
}

/**
 * Валидация параметров для операций с голосом бренда
 */
function validateBrandVoiceParams(params: BrandVoiceParams): { valid: boolean; error?: string } {
  switch (params.action) {
    case 'analyze':
    case 'validate':
      if (!params.content) {
        return { valid: false, error: 'Content required for brand voice analysis/validation' };
      }
      break;
    case 'adjust':
      if (!params.target_content) {
        return { valid: false, error: 'Target content required for brand voice adjustment' };
      }
      break;
    case 'define':
      if (!params.brand_guidelines) {
        return { valid: false, error: 'Brand guidelines required for brand voice definition' };
      }
      break;
  }
  return { valid: true };
}

/**
 * Анализ голоса бренда в контенте
 */
async function analyzeBrandVoice(params: BrandVoiceParams): Promise<BrandVoiceResult> {
  console.log('🔍 Analyzing brand voice in content');
  
  const content = params.content!;
  const contentType = params.content_type || 'full_email';
  const brandGuidelines = params.brand_guidelines;
  
  // Analyze tone and voice characteristics
  const voiceAnalysis = await performVoiceAnalysis(content, contentType, brandGuidelines);
  
  // Compare with sample content if provided
  if (params.compare_with_samples) {
    const comparisonResults = await compareWithSamples(content, params.compare_with_samples);
    voiceAnalysis.detected_tone.push(...comparisonResults.consistent_tones);
  }
  
  // Industry and audience context analysis
  const contextAnalysis = await analyzeContextAlignment(
    content, 
    params.industry_context, 
    params.target_audience
  );
  
  const performanceMetrics = calculateVoiceMetrics(voiceAnalysis, contextAnalysis);
  const recommendations = generateAnalysisRecommendations(voiceAnalysis, performanceMetrics);
  
  return {
    success: true,
    action_performed: 'analyze',
    voice_analysis: voiceAnalysis,
    performance_metrics: performanceMetrics,
    recommendations
  };
}

/**
 * Валидация соответствия бренду
 */
async function validateBrandCompliance(params: BrandVoiceParams): Promise<BrandVoiceResult> {
  console.log('✅ Validating brand compliance');
  
  const content = params.content!;
  const brandGuidelines = params.brand_guidelines;
  
  if (!brandGuidelines) {
    throw new Error('Brand guidelines required for validation');
  }
  
  const validationSummary = await performBrandValidation(content, brandGuidelines);
  const performanceMetrics = calculateComplianceMetrics(validationSummary);
  const recommendations = generateValidationRecommendations(validationSummary);
  
  return {
    success: true,
    action_performed: 'validate',
    validation_summary: validationSummary,
    performance_metrics: performanceMetrics,
    recommendations
  };
}

/**
 * Корректировка контента под голос бренда
 */
async function adjustContentVoice(params: BrandVoiceParams): Promise<BrandVoiceResult> {
  console.log('🔧 Adjusting content to match brand voice');
  
  const targetContent = params.target_content!;
  const adjustmentLevel = params.adjustment_level || 'moderate';
  const preserveMeaning = params.preserve_meaning !== false;
  const brandGuidelines = params.brand_guidelines;
  
  const adjustedContent = await performContentAdjustment(
    targetContent,
    brandGuidelines,
    adjustmentLevel,
    preserveMeaning
  );
  
  const performanceMetrics = calculateAdjustmentMetrics(adjustedContent);
  const recommendations = generateAdjustmentRecommendations(adjustedContent, performanceMetrics);
  
  return {
    success: true,
    action_performed: 'adjust',
    adjusted_content: adjustedContent,
    performance_metrics: performanceMetrics,
    recommendations
  };
}

/**
 * Определение профиля голоса бренда
 */
async function defineBrandVoice(params: BrandVoiceParams): Promise<BrandVoiceResult> {
  console.log('📋 Defining brand voice profile');
  
  const brandGuidelines = params.brand_guidelines!;
  const industryContext = params.industry_context;
  const targetAudience = params.target_audience;
  
  const brandProfile = await createBrandProfile(brandGuidelines, industryContext, targetAudience);
  const performanceMetrics = calculateProfileMetrics(brandProfile);
  const recommendations = generateDefinitionRecommendations(brandProfile);
  
  return {
    success: true,
    action_performed: 'define',
    brand_profile: brandProfile,
    performance_metrics: performanceMetrics,
    recommendations
  };
}

// Helper functions

async function performVoiceAnalysis(content: string, contentType: string, brandGuidelines?: any): Promise<any> {
  const analysis = {
    overall_score: 0,
    tone_consistency: 0,
    vocabulary_alignment: 0,
    style_compliance: 0,
    brand_personality_match: 0,
    detected_tone: [] as string[],
    detected_attributes: [] as string[],
    issues_found: [] as any[],
    strengths: [] as string[],
    improvements_needed: [] as string[]
  };
  
  // Analyze tone
  const toneAnalysis = analyzeTone(content);
  analysis.detected_tone = toneAnalysis.tones;
  analysis.tone_consistency = toneAnalysis.consistency;
  
  // Analyze vocabulary
  const vocabAnalysis = analyzeVocabulary(content, brandGuidelines?.vocabulary_preferences);
  analysis.vocabulary_alignment = vocabAnalysis.alignment;
  
  // Analyze style
  const styleAnalysis = analyzeWritingStyle(content, brandGuidelines?.style_guide);
  analysis.style_compliance = styleAnalysis.compliance;
  
  // Detect brand personality
  analysis.detected_attributes = detectPersonalityAttributes(content);
  
  // Calculate overall score
  analysis.overall_score = Math.round(
    (analysis.tone_consistency + analysis.vocabulary_alignment + analysis.style_compliance) / 3
  );
  
  // Identify issues
  if (analysis.tone_consistency < 70) {
    analysis.issues_found.push({
      type: 'tone_mismatch',
      description: 'Inconsistent tone throughout content',
      severity: 'medium',
      suggestion: 'Maintain consistent tone throughout the email'
    });
  }
  
  if (analysis.vocabulary_alignment < 60) {
    analysis.issues_found.push({
      type: 'vocabulary_violation',
      description: 'Vocabulary does not align with brand guidelines',
      severity: 'high',
      suggestion: 'Use brand-approved terminology and avoid flagged words'
    });
  }
  
  // Identify strengths
  if (analysis.tone_consistency > 80) {
    analysis.strengths.push('Consistent tone throughout content');
  }
  
  if (analysis.vocabulary_alignment > 80) {
    analysis.strengths.push('Strong vocabulary alignment with brand');
  }
  
  // Suggest improvements
  if (analysis.overall_score < 80) {
    analysis.improvements_needed.push('Improve overall brand voice consistency');
  }
  
  return analysis;
}

function analyzeTone(content: string): { tones: string[]; consistency: number } {
  const tones: string[] = [];
  let consistency = 85; // Default high consistency
  
  // Simple tone detection based on keywords and patterns
  if (content.includes('exciting') || content.includes('amazing') || content.includes('!')) {
    tones.push('enthusiastic');
  }
  
  if (content.includes('professional') || content.includes('expertise') || content.includes('solution')) {
    tones.push('professional');
  }
  
  if (content.includes('friendly') || content.includes('help') || content.includes('welcome')) {
    tones.push('friendly');
  }
  
  // Check for tone conflicts
  if (tones.includes('professional') && tones.includes('casual')) {
    consistency -= 20;
  }
  
  return { tones, consistency };
}

function analyzeVocabulary(content: string, vocabularyPrefs?: any): { alignment: number } {
  let alignment = 80; // Default good alignment
  
  if (vocabularyPrefs) {
    // Check for preferred words
    const preferredCount = vocabularyPrefs.preferred_words?.filter((word: string) => 
      content.toLowerCase().includes(word.toLowerCase())
    ).length || 0;
    
    // Check for avoided words
    const avoidedCount = vocabularyPrefs.avoided_words?.filter((word: string) => 
      content.toLowerCase().includes(word.toLowerCase())
    ).length || 0;
    
    // Adjust alignment based on vocabulary usage
    alignment += preferredCount * 5;
    alignment -= avoidedCount * 10;
  }
  
  return { alignment: Math.min(100, Math.max(0, alignment)) };
}

function analyzeWritingStyle(content: string, styleGuide?: any): { compliance: number } {
  let compliance = 75; // Default moderate compliance
  
  if (styleGuide) {
    // Analyze sentence length
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.trim().split(' ').length, 0) / sentences.length;
    
    if (styleGuide.sentence_length === 'short' && avgSentenceLength <= 15) {
      compliance += 10;
    } else if (styleGuide.sentence_length === 'long' && avgSentenceLength >= 20) {
      compliance += 10;
    } else if (styleGuide.sentence_length === 'medium' && avgSentenceLength >= 10 && avgSentenceLength <= 20) {
      compliance += 10;
    }
    
    // Check punctuation style
    const exclamationCount = (content.match(/!/g) || []).length;
    if (styleGuide.punctuation_style === 'expressive' && exclamationCount > 0) {
      compliance += 5;
    } else if (styleGuide.punctuation_style === 'minimal' && exclamationCount === 0) {
      compliance += 5;
    }
  }
  
  return { compliance: Math.min(100, compliance) };
}

function detectPersonalityAttributes(content: string): string[] {
  const attributes: string[] = [];
  
  if (content.includes('trust') || content.includes('reliable') || content.includes('secure')) {
    attributes.push('trustworthy');
  }
  
  if (content.includes('innovative') || content.includes('cutting-edge') || content.includes('advanced')) {
    attributes.push('innovative');
  }
  
  if (content.includes('expert') || content.includes('professional') || content.includes('experienced')) {
    attributes.push('expert');
  }
  
  if (content.includes('friendly') || content.includes('approachable') || content.includes('welcome')) {
    attributes.push('approachable');
  }
  
  return attributes;
}

async function compareWithSamples(content: string, samples: string[]): Promise<{ consistent_tones: string[] }> {
  // Simplified comparison - would use more sophisticated NLP in production
  const consistent_tones: string[] = [];
  
  samples.forEach(sample => {
    const contentTones = analyzeTone(content).tones;
    const sampleTones = analyzeTone(sample).tones;
    
    const commonTones = contentTones.filter(tone => sampleTones.includes(tone));
    consistent_tones.push(...commonTones);
  });
  
  return { consistent_tones: [...new Set(consistent_tones)] };
}

async function analyzeContextAlignment(content: string, industry?: string, audience?: string): Promise<any> {
  let score = 80; // Default good alignment
  
  if (industry === 'technology' && content.includes('innovation')) {
    score += 10;
  }
  
  if (audience === 'b2b' && content.includes('solution')) {
    score += 5;
  }
  
  if (audience === 'b2c' && content.includes('you')) {
    score += 5;
  }
  
  return { alignment_score: Math.min(100, score) };
}

function calculateVoiceMetrics(analysis: any, context: any): any {
  return {
    brand_alignment_score: analysis.overall_score,
    consistency_score: analysis.tone_consistency,
    audience_appropriateness: context?.alignment_score || 80,
    engagement_potential: Math.round((analysis.overall_score + analysis.tone_consistency) / 2)
  };
}

async function performBrandValidation(content: string, guidelines: any): Promise<any> {
  const violations: any[] = [];
  let complianceScore = 100;
  
  // Check tone compliance
  const contentTones = analyzeTone(content).tones;
  const requiredTones = guidelines.tone || [];
  
  const toneMatch = requiredTones.some((tone: string) => contentTones.includes(tone));
  if (!toneMatch && requiredTones.length > 0) {
    violations.push({
      guideline: 'Tone Requirements',
      violation_type: 'tone_mismatch',
      examples: [`Content tone (${contentTones.join(', ')}) doesn't match required tone (${requiredTones.join(', ')})`],
      impact: 'high'
    });
    complianceScore -= 30;
  }
  
  // Check vocabulary compliance
  if (guidelines.vocabulary_preferences?.avoided_words) {
    const avoidedWordsFound = guidelines.vocabulary_preferences.avoided_words.filter((word: string) =>
      content.toLowerCase().includes(word.toLowerCase())
    );
    
    if (avoidedWordsFound.length > 0) {
      violations.push({
        guideline: 'Vocabulary Guidelines',
        violation_type: 'prohibited_words',
        examples: avoidedWordsFound.map((word: string) => `Use of prohibited word: "${word}"`),
        impact: 'medium'
      });
      complianceScore -= avoidedWordsFound.length * 10;
    }
  }
  
  return {
    compliant: violations.length === 0,
    compliance_score: Math.max(0, complianceScore),
    violations,
    recommendations: violations.length > 0 ? ['Address identified violations', 'Review brand guidelines'] : ['Content is compliant with brand guidelines']
  };
}

function calculateComplianceMetrics(validation: any): any {
  return {
    brand_alignment_score: validation.compliance_score,
    consistency_score: validation.compliant ? 100 : 60,
    audience_appropriateness: 85,
    engagement_potential: validation.compliance_score
  };
}

async function performContentAdjustment(
  content: string,
  guidelines: any,
  level: string,
  preserveMeaning: boolean
): Promise<any> {
  
  let revisedContent = content;
  const changesMade: any[] = [];
  
  // Tone adjustments
  if (guidelines?.tone?.includes('professional') && content.includes('awesome')) {
    revisedContent = revisedContent.replace(/awesome/g, 'excellent');
    changesMade.push({
      type: 'tone_adjustment',
      original_text: 'awesome',
      revised_text: 'excellent',
      reason: 'Adjusted to maintain professional tone'
    });
  }
  
  // Vocabulary replacements
  if (guidelines?.vocabulary_preferences?.avoided_words) {
    guidelines.vocabulary_preferences.avoided_words.forEach((word: string) => {
      if (revisedContent.toLowerCase().includes(word.toLowerCase())) {
        const replacement = guidelines.vocabulary_preferences?.preferred_words?.[0] || 'appropriate term';
        revisedContent = revisedContent.replace(new RegExp(word, 'gi'), replacement);
        changesMade.push({
          type: 'vocabulary_replacement',
          original_text: word,
          revised_text: replacement,
          reason: 'Replaced prohibited word with brand-approved alternative'
        });
      }
    });
  }
  
  // Calculate improvement metrics
  const originalAnalysis = await performVoiceAnalysis(content, 'full_email', guidelines);
  const revisedAnalysis = await performVoiceAnalysis(revisedContent, 'full_email', guidelines);
  
  return {
    original_content: content,
    revised_content: revisedContent,
    changes_made: changesMade,
    improvement_metrics: {
      tone_improvement: revisedAnalysis.tone_consistency - originalAnalysis.tone_consistency,
      vocabulary_improvement: revisedAnalysis.vocabulary_alignment - originalAnalysis.vocabulary_alignment,
      style_improvement: revisedAnalysis.style_compliance - originalAnalysis.style_compliance,
      overall_improvement: revisedAnalysis.overall_score - originalAnalysis.overall_score
    }
  };
}

function calculateAdjustmentMetrics(adjustment: any): any {
  const baseScore = 75;
  return {
    brand_alignment_score: baseScore + adjustment.improvement_metrics.overall_improvement,
    consistency_score: baseScore + adjustment.improvement_metrics.tone_improvement,
    audience_appropriateness: 80,
    engagement_potential: baseScore + Math.round(adjustment.improvement_metrics.overall_improvement / 2)
  };
}

async function createBrandProfile(guidelines: any, industry?: string, audience?: string): Promise<any> {
  return {
    defined_tone: guidelines.tone || [],
    voice_characteristics: guidelines.voice_attributes || [],
    vocabulary_guidelines: {
      preferred_terms: guidelines.vocabulary_preferences?.preferred_words || [],
      terms_to_avoid: guidelines.vocabulary_preferences?.avoided_words || [],
      brand_specific_terms: guidelines.vocabulary_preferences?.industry_terms || []
    },
    style_specifications: {
      writing_style: guidelines.style_guide?.sentence_length || 'medium',
      communication_approach: guidelines.style_guide?.paragraph_structure || 'conversational',
      content_structure: guidelines.style_guide?.punctuation_style || 'standard'
    },
    implementation_guide: [
      'Use defined tone consistently across all communications',
      'Incorporate voice characteristics in content creation',
      'Follow vocabulary guidelines strictly',
      'Maintain style specifications for brand consistency'
    ]
  };
}

function calculateProfileMetrics(profile: any): any {
  return {
    brand_alignment_score: 90,
    consistency_score: 85,
    audience_appropriateness: 88,
    engagement_potential: 82
  };
}

function generateAnalysisRecommendations(analysis: any, metrics: any): string[] {
  const recommendations: string[] = [];
  
  if (analysis.overall_score < 70) {
    recommendations.push('Improve overall brand voice consistency');
  }
  
  if (analysis.issues_found.length > 0) {
    recommendations.push(`Address ${analysis.issues_found.length} identified voice issues`);
  }
  
  if (analysis.strengths.length > 0) {
    recommendations.push(`Build on ${analysis.strengths.length} identified strengths`);
  }
  
  return recommendations;
}

function generateValidationRecommendations(validation: any): string[] {
  const recommendations: string[] = [];
  
  if (!validation.compliant) {
    recommendations.push('Address brand compliance violations');
    recommendations.push('Review and update content according to brand guidelines');
  } else {
    recommendations.push('Content meets brand voice requirements');
  }
  
  return recommendations;
}

function generateAdjustmentRecommendations(adjustment: any, metrics: any): string[] {
  const recommendations: string[] = [];
  
  if (adjustment.changes_made.length > 0) {
    recommendations.push(`Successfully applied ${adjustment.changes_made.length} voice adjustments`);
  }
  
  if (adjustment.improvement_metrics.overall_improvement > 10) {
    recommendations.push('Significant improvement in brand voice alignment achieved');
  }
  
  recommendations.push('Review adjusted content for accuracy and meaning preservation');
  
  return recommendations;
}

function generateDefinitionRecommendations(profile: any): string[] {
  return [
    'Implement brand voice profile across all content creation',
    'Train content creators on defined voice characteristics',
    'Regularly audit content for brand voice compliance',
    'Update guidelines as brand evolves'
  ];
}

// Export minimal schema to satisfy imports
export const brandVoiceSchema = z.object({
  action: z.enum(['analyze', 'validate', 'adjust', 'define']),
  content: z.string().optional().nullable(),
  target_content: z.string().optional().nullable(),
}); 