/**
 * Phase 13.1: Smart Email Analyzer
 * 
 * GPT-4o mini powered intelligent quality analysis engine that provides
 * comprehensive email quality assessment with actionable insights
 */

import { OpenAI } from 'openai';
import { 
  QualityAnalysisResult, 
  AIConsultantRequest, 
  AnalyzedElement,
  QualityDimension,
  AIConsultantConfig,
  AIConsultantError
} from './types';

export class SmartEmailAnalyzer {
  private openai: OpenAI;
  private config: AIConsultantConfig;

  constructor(config: AIConsultantConfig) {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.config = config;
  }

  /**
   * Helper function to safely parse JSON from GPT responses
   * Handles both plain JSON and markdown code blocks
   */
  private safeParseJSON(content: string): any {
    try {
      // First try to parse as-is
      return JSON.parse(content);
    } catch (error) {
      try {
        // Try to extract JSON from markdown code blocks
        const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[1]);
        }
        
        // Try to find JSON object in the content
        const jsonObjectMatch = content.match(/\{[\s\S]*\}/);
        if (jsonObjectMatch) {
          return JSON.parse(jsonObjectMatch[0]);
        }
        
        throw new Error('No JSON found in response');
      } catch (parseError) {
        console.warn('JSON parsing failed:', parseError);
        throw new Error(`Failed to parse AI response as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * Perform comprehensive email quality analysis using GPT-4o mini
   */
  async analyzeEmail(request: AIConsultantRequest): Promise<QualityAnalysisResult> {
    try {
      console.log(`🔍 Starting smart analysis for email: ${request.topic}`);
      
      // Prepare analysis context
      const analysisContext = this.prepareAnalysisContext(request);
      
      // Run parallel analysis for different dimensions
      const [
        contentAnalysis,
        visualAnalysis,
        technicalAnalysis,
        emotionalAnalysis,
        brandAnalysis
      ] = await Promise.all([
        this.analyzeContentQuality(analysisContext),
        this.analyzeVisualAppeal(analysisContext),
        this.analyzeTechnicalCompliance(analysisContext),
        this.analyzeEmotionalResonance(analysisContext),
        this.analyzeBrandAlignment(analysisContext)
      ]);

      // Combine analysis results
      const dimensionScores = {
        content_quality: contentAnalysis.score,
        visual_appeal: visualAnalysis.score,
        technical_compliance: technicalAnalysis.score,
        emotional_resonance: emotionalAnalysis.score,
        brand_alignment: brandAnalysis.score
      };

      // Calculate overall score (weighted average)
      const overallScore = this.calculateOverallScore(dimensionScores);
      
      // Analyze individual elements
      const analyzedElements = await this.analyzeIndividualElements(analysisContext);
      
      // Determine quality grade and gate status
      const qualityGrade = this.determineQualityGrade(overallScore);
      const qualityGatePassed = overallScore >= this.config.quality_gate_threshold;

      // Estimate improvement potential
      const improvementPotential = this.estimateImprovementPotential(
        dimensionScores,
        analyzedElements
      );

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
        analysis_time: Date.now(),
        confidence_level: this.calculateConfidenceLevel(dimensionScores),
        analyzed_elements: analyzedElements
      };

      console.log(`✅ Analysis complete. Score: ${result.overall_score}/100, Grade: ${result.quality_grade}`);
      return result;

    } catch (error) {
      console.error('❌ Smart analysis failed:', error);
      throw new AIConsultantError(
        'Smart email analysis failed',
        'ANALYSIS_FAILED',
        { error: error instanceof Error ? error.message : String(error), request: request.topic }
      );
    }
  }

  /**
   * Prepare comprehensive analysis context for AI processing
   */
  private prepareAnalysisContext(request: AIConsultantRequest) {
    return {
      html_content: request.html_content,
      mjml_source: request.mjml_source,
      topic: request.topic,
      target_audience: request.target_audience || 'general',
      campaign_type: request.campaign_type || 'promotional',
      
      // Скриншоты для визуального анализа
      screenshots: request.screenshots || {},
      
      // Context data
      assets_info: this.extractAssetInfo(request.assets_used),
      pricing_info: this.extractPricingInfo(request.prices),
      content_metadata: request.content_metadata,
      render_results: request.render_test_results,
      
      // Previous iteration context
      previous_score: request.previous_analysis?.overall_score,
      iteration_count: request.iteration_count,
      improvement_history: request.improvement_history
    };
  }

  /**
   * Analyze content quality using GPT-4o mini
   */
  private async analyzeContentQuality(context: any): Promise<{ score: number; issues: string[]; insights: string[] }> {
    const prompt = `
Analyze the content quality of this email campaign:

TOPIC: ${context.topic}
TARGET AUDIENCE: ${context.target_audience}
CAMPAIGN TYPE: ${context.campaign_type}

EMAIL CONTENT (TRUNCATED FOR SPEED):
${context.html_content.substring(0, 1500)}...

EVALUATION CRITERIA:
1. Clarity and readability (25%)
2. Persuasiveness and engagement (25%)
3. Tone consistency (20%)
4. Message structure and flow (15%)
5. Call-to-action effectiveness (15%)

Provide:
1. Score (0-100)
2. Top 3 issues found
3. Top 3 improvement insights

IMPORTANT: Return ONLY valid JSON without any markdown formatting or code blocks:
{
  "score": number,
  "issues": ["issue1", "issue2", "issue3"],
  "insights": ["insight1", "insight2", "insight3"]
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.config.ai_model,
        messages: [{ role: 'user', content: prompt }],
        temperature: this.config.analysis_temperature,
        max_tokens: 1000
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Empty response from AI model');
      }
      const result = this.safeParseJSON(content);
      return {
        score: Math.max(0, Math.min(100, result.score)),
        issues: result.issues || [],
        insights: result.insights || []
      };
    } catch (error) {
      console.error('Content analysis failed:', error);
      throw new Error(`Content analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze visual appeal using GPT-4o mini with screenshot support
   */
  private async analyzeVisualAppeal(context: any): Promise<{ score: number; issues: string[]; insights: string[] }> {
    // Подготавливаем сообщения для анализа
    const messages: any[] = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `
Analyze the visual appeal of this email design:

TOPIC: ${context.topic}
CAMPAIGN TYPE: ${context.campaign_type}
ASSETS USED: ${JSON.stringify(context.assets_info)}

EVALUATION CRITERIA:
1. Visual hierarchy and layout (25%)
2. Color scheme and brand consistency (20%)
3. Typography and readability (20%)
4. Image quality and relevance (20%)
5. Mobile responsiveness (15%)

${context.screenshots.desktop || context.screenshots.mobile ? 'I will provide screenshots of the actual email rendering.' : 'Analyzing based on HTML code only.'}

EMAIL HTML CODE (TRUNCATED):
${context.html_content.substring(0, 1000)}...

Provide:
1. Score (0-100)
2. Top 3 visual issues
3. Top 3 design improvements

IMPORTANT: Return ONLY valid JSON without any markdown formatting or code blocks:
{
  "score": number,
  "issues": ["issue1", "issue2", "issue3"],
  "insights": ["insight1", "insight2", "insight3"]
}`
          }
        ]
      }
    ];

    // Добавляем скриншоты если доступны
    if (context.screenshots.desktop) {
      messages[0].content.push({
        type: 'image_url',
        image_url: {
          url: `data:image/png;base64,${context.screenshots.desktop}`,
          detail: 'high'
        }
      });
      messages[0].content[0].text += '\n\n📱 DESKTOP SCREENSHOT: Provided above for visual analysis.';
    }

    if (context.screenshots.mobile) {
      messages[0].content.push({
        type: 'image_url',
        image_url: {
          url: `data:image/png;base64,${context.screenshots.mobile}`,
          detail: 'high'
        }
      });
      messages[0].content[0].text += '\n\n📱 MOBILE SCREENSHOT: Provided above for mobile responsive analysis.';
    }

    try {
      // Используем GPT-4o mini для всех операций
      const model = 'gpt-4o-mini';
      
      const response = await this.openai.chat.completions.create({
        model,
        messages,
        temperature: this.config.analysis_temperature,
        max_tokens: 1000
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Empty response from AI model');
      }
      const result = this.safeParseJSON(content);
      
      console.log(`📸 Visual analysis completed with ${context.screenshots.desktop ? 'desktop' : 'no'} and ${context.screenshots.mobile ? 'mobile' : 'no'} screenshots`);
      
      return {
        score: Math.max(0, Math.min(100, result.score)),
        issues: result.issues || [],
        insights: result.insights || []
      };
    } catch (error) {
      console.error('Visual analysis failed:', error);
      throw new Error(`Visual analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze technical compliance
   */
  private async analyzeTechnicalCompliance(context: any): Promise<{ score: number; issues: string[]; insights: string[] }> {
    const prompt = `
Analyze the technical compliance of this email:

EMAIL HTML:
${context.html_content}

RENDER TEST RESULTS: ${JSON.stringify(context.render_results)}

EVALUATION CRITERIA:
1. Email client compatibility (30%)
2. HTML/CSS validity (25%)
3. Accessibility compliance (WCAG AA) (25%)
4. Performance (file size, load time) (20%)

Provide:
1. Score (0-100)
2. Top 3 technical issues
3. Top 3 compliance improvements

IMPORTANT: Return ONLY valid JSON without any markdown formatting or code blocks:
{
  "score": number,
  "issues": ["issue1", "issue2", "issue3"],
  "insights": ["insight1", "insight2", "insight3"]
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.config.ai_model,
        messages: [{ role: 'user', content: prompt }],
        temperature: this.config.analysis_temperature,
        max_tokens: 1000
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Empty response from AI model');
      }
      const result = this.safeParseJSON(content);
      return {
        score: Math.max(0, Math.min(100, result.score)),
        issues: result.issues || [],
        insights: result.insights || []
      };
    } catch (error) {
      console.error('Technical analysis failed:', error);
      throw new Error(`Technical analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze emotional resonance and engagement potential
   */
  private async analyzeEmotionalResonance(context: any): Promise<{ score: number; issues: string[]; insights: string[] }> {
    const prompt = `
Analyze the emotional resonance of this email campaign:

TOPIC: ${context.topic}
TARGET AUDIENCE: ${context.target_audience}
PRICING INFO: ${JSON.stringify(context.pricing_info)}

EMAIL CONTENT:
${context.html_content}

EVALUATION CRITERIA:
1. Emotional triggers and appeal (30%)
2. Urgency and scarcity messaging (25%)
3. Social proof and trust signals (20%)
4. Call-to-action motivation (25%)

Provide:
1. Score (0-100)
2. Top 3 emotional gaps
3. Top 3 engagement improvements

IMPORTANT: Return ONLY valid JSON without any markdown formatting or code blocks:
{
  "score": number,
  "issues": ["issue1", "issue2", "issue3"],
  "insights": ["insight1", "insight2", "insight3"]
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.config.ai_model,
        messages: [{ role: 'user', content: prompt }],
        temperature: this.config.analysis_temperature,
        max_tokens: 1000
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Empty response from AI model');
      }
      const result = this.safeParseJSON(content);
      return {
        score: Math.max(0, Math.min(100, result.score)),
        issues: result.issues || [],
        insights: result.insights || []
      };
    } catch (error) {
      console.error('Emotional analysis failed:', error);
      throw new Error(`Emotional analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze brand alignment with Kupibilet guidelines
   */
  private async analyzeBrandAlignment(context: any): Promise<{ score: number; issues: string[]; insights: string[] }> {
    const prompt = `
Analyze brand alignment for Kupibilet email campaign:

EMAIL HTML:
${context.html_content}

KUPIBILET BRAND GUIDELINES:
- Primary colors: Bright Green (#4BFF7E), Dark Green (#1DA857), Orange-Red (#FF6240), Pink-Purple (#E03EEF), Dark Background (#2C3959)
- Secondary colors: Light blue (#E6F3FF), Gray (#F5F5F5)
- Typography: Modern, clean sans-serif
- Tone: Friendly, helpful, trustworthy
- Values: Affordable travel, customer-first, reliability

EVALUATION CRITERIA:
1. Color scheme compliance (25%)
2. Typography consistency (20%)
3. Tone of voice alignment (25%)
4. Brand values representation (30%)

Provide:
1. Score (0-100)
2. Top 3 brand inconsistencies
3. Top 3 brand improvements

IMPORTANT: Return ONLY valid JSON without any markdown formatting or code blocks:
{
  "score": number,
  "issues": ["issue1", "issue2", "issue3"],
  "insights": ["insight1", "insight2", "insight3"]
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.config.ai_model,
        messages: [{ role: 'user', content: prompt }],
        temperature: this.config.analysis_temperature,
        max_tokens: 1000
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Empty response from AI model');
      }
      const result = this.safeParseJSON(content);
      return {
        score: Math.max(0, Math.min(100, result.score)),
        issues: result.issues || [],
        insights: result.insights || []
      };
    } catch (error) {
      console.error('Brand analysis failed:', error);
      throw new Error(`Brand analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze individual email elements
   */
  private async analyzeIndividualElements(context: any): Promise<AnalyzedElement[]> {
    // Basic element analysis - can be enhanced with more sophisticated HTML parsing
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

  /**
   * Calculate weighted overall score
   */
  private calculateOverallScore(dimensionScores: Record<QualityDimension, number>): number {
    const weights = {
      content_quality: 0.25,
      visual_appeal: 0.25,
      technical_compliance: 0.20,
      emotional_resonance: 0.20,
      brand_alignment: 0.10
    };

    return Object.entries(dimensionScores).reduce((total, [dimension, score]) => {
      return total + (score * weights[dimension as QualityDimension]);
    }, 0);
  }

  /**
   * Determine quality grade based on score
   */
  private determineQualityGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Estimate improvement potential
   */
  private estimateImprovementPotential(
    dimensionScores: Record<QualityDimension, number>,
    elements: AnalyzedElement[]
  ): number {
    // Calculate potential improvement based on lowest scoring dimensions
    const scores = Object.values(dimensionScores);
    const lowestScores = scores.filter(score => score < 80);
    const averageImprovement = lowestScores.length > 0 
      ? lowestScores.reduce((sum, score) => sum + (80 - score), 0) / lowestScores.length
      : 5;

    return Math.min(30, Math.max(5, averageImprovement));
  }

  /**
   * Calculate maximum achievable score
   */
  private calculateMaxAchievableScore(dimensionScores: Record<QualityDimension, number>): number {
    // Assume we can improve each dimension by up to 20 points, but not exceed 95
    const improvedScores = Object.values(dimensionScores).map(score => 
      Math.min(95, score + 20)
    );
    
    return this.calculateOverallScore({
      content_quality: improvedScores[0],
      visual_appeal: improvedScores[1],
      technical_compliance: improvedScores[2],
      emotional_resonance: improvedScores[3],
      brand_alignment: improvedScores[4]
    });
  }

  /**
   * Calculate confidence level in analysis
   */
  private calculateConfidenceLevel(dimensionScores: Record<QualityDimension, number>): number {
    // Higher confidence when scores are consistent across dimensions
    const scores = Object.values(dimensionScores);
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Lower standard deviation = higher confidence
    return Math.max(0.6, Math.min(1.0, 1.0 - (standardDeviation / 50)));
  }

  /**
   * Extract asset information for analysis
   */
  private extractAssetInfo(assets: any): string[] {
    if (!assets) return [];
    return [
      ...(assets.original_assets || []),
      ...(assets.processed_assets || [])
    ];
  }

  /**
   * Extract pricing information for analysis
   */
  private extractPricingInfo(prices: any): any {
    if (!prices) return null;
    return {
      route: `${prices.origin} → ${prices.destination}`,
      price: `${prices.cheapest_price} ${prices.currency}`,
      dates: prices.date_range
    };
  }
} 