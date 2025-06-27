/**
 * T11 Coherence Checker - Text-Image Semantic Alignment Validation
 * 
 * Validates semantic alignment between text content and images for coherent messaging
 * Weight: 25% of total quality score (essential for user experience)
 */

import { 
  CoherenceValidationResult, 
  ValidationCheck, 
  QualityValidationRequest,
  QualityValidationError,
  ImageAnalysis
} from './types';

/**
 * Coherence Checker Service
 * Validates text-image semantic alignment and thematic consistency
 */
export class CoherenceChecker {
  
  /**
   * Validate coherence between text and images
   */
  async validate(request: QualityValidationRequest, imageAnalyses: ImageAnalysis[]): Promise<CoherenceValidationResult> {
    const startTime = Date.now();
    
    try {
      console.log('🔗 T11 Coherence Checker: Starting text-image coherence validation');
      
      // Extract themes from text content
      const textThemes = this.extractTextThemes(request);
      console.log(`📝 T11 Coherence Checker: Extracted ${textThemes.length} text themes`);
      
      // Extract themes from image analyses
      const imageThemes = this.extractImageThemes(imageAnalyses);
      console.log(`🖼️ T11 Coherence Checker: Extracted ${imageThemes.length} image themes`);
      
      // Perform coherence analysis
      const coherenceAnalysis = this.performCoherenceAnalysis(textThemes, imageThemes, request);
      
      // Run all coherence validation checks in parallel
      const [
        semanticAlignment,
        thematicConsistency,
        emotionalCoherence,
        ctaAlignment
      ] = await Promise.all([
        this.validateSemanticAlignment(coherenceAnalysis, request),
        this.validateThematicConsistency(coherenceAnalysis, request),
        this.validateEmotionalCoherence(coherenceAnalysis, request, imageAnalyses),
        this.validateCTAAlignment(coherenceAnalysis, request)
      ]);
      
      // Calculate overall coherence score
      const checks = {
        semantic_alignment: semanticAlignment,
        thematic_consistency: thematicConsistency,
        emotional_coherence: emotionalCoherence,
        cta_alignment: ctaAlignment
      };
      
      const score = this.calculateCoherenceScore(checks);
      const passed = score >= 70;
      
      // Collect issues and recommendations
      const issues = Object.values(checks)
        .filter(check => !check.passed)
        .map(check => check.message);
      
      const recommendations = this.generateRecommendations(checks, coherenceAnalysis);
      
      const validationTime = Date.now() - startTime;
      console.log(`✅ T11 Coherence Checker: Completed in ${validationTime}ms, score: ${score}`);
      
      return {
        score,
        passed,
        checks,
        coherence_analysis: coherenceAnalysis,
        issues,
        recommendations
      };
      
    } catch (error) {
      const validationTime = Date.now() - startTime;
      console.error('❌ T11 Coherence Checker: Validation failed:', error);
      
      throw new QualityValidationError(
        `Coherence validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'COHERENCE_VALIDATION_FAILED',
        { validationTime, error }
      );
    }
  }
  
  /**
   * Extract themes from text content
   */
  private extractTextThemes(request: QualityValidationRequest): string[] {
    const themes: string[] = [];
    
    try {
      // Extract from topic
      if (request.topic) {
        themes.push(...this.extractThemesFromText(request.topic));
      }
      
      // Extract from email subject
      const content = request.campaign_metadata.content;
      if (content && content.subject) {
        themes.push(...this.extractThemesFromText(content.subject));
      }
      
      // Extract from HTML content (simplified)
      if (request.html_content) {
        const textContent = this.extractTextFromHTML(request.html_content);
        themes.push(...this.extractThemesFromText(textContent));
      }
      
      // Extract from price/route context
      const prices = request.campaign_metadata.prices;
      if (prices) {
        themes.push('travel', 'flight', 'destination');
        if (prices.origin && prices.destination) {
          themes.push('route', 'journey');
        }
      }
      
      // Remove duplicates and normalize
      const normalizedThemes = themes.map(theme => theme.toLowerCase().trim());
      return Array.from(new Set(normalizedThemes));
      
    } catch (error) {
      console.error('Error extracting text themes:', error);
      return ['email', 'content']; // Fallback themes
    }
  }
  
  /**
   * Extract themes from image analyses
   */
  private extractImageThemes(imageAnalyses: ImageAnalysis[]): string[] {
    const themes: string[] = [];
    
    try {
      for (const analysis of imageAnalyses) {
        // Add detected objects as themes
        themes.push(...analysis.detected_objects);
        
        // Extract themes from description
        if (analysis.description) {
          themes.push(...this.extractThemesFromText(analysis.description));
        }
        
        // Add emotional tone as theme
        themes.push(analysis.emotional_tone);
      }
      
      // Remove duplicates and normalize
      const normalizedThemes = themes.map(theme => theme.toLowerCase().trim());
      return Array.from(new Set(normalizedThemes));
      
    } catch (error) {
      console.error('Error extracting image themes:', error);
      return ['image']; // Fallback theme
    }
  }
  
  /**
   * Extract themes from text using keyword analysis
   */
  private extractThemesFromText(text: string): string[] {
    const themes: string[] = [];
    const normalizedText = text.toLowerCase();
    
    // Travel and flight themes
    const travelKeywords = [
      'travel', 'flight', 'fly', 'trip', 'journey', 'vacation', 'holiday',
      'destination', 'airport', 'airline', 'booking', 'ticket', 'route'
    ];
    
    // Emotional themes
    const emotionalKeywords = [
      'happy', 'excited', 'sad', 'worried', 'confident', 'relaxed',
      'stressed', 'joyful', 'disappointed', 'satisfied', 'frustrated'
    ];
    
    // Business themes
    const businessKeywords = [
      'deal', 'offer', 'discount', 'sale', 'promotion', 'price', 'cheap',
      'expensive', 'value', 'save', 'money', 'cost', 'budget'
    ];
    
    // Time themes
    const timeKeywords = [
      'now', 'today', 'tomorrow', 'week', 'month', 'year', 'soon',
      'urgent', 'limited', 'deadline', 'expire', 'hurry'
    ];
    
    // Check for keyword matches
    const allKeywords = [...travelKeywords, ...emotionalKeywords, ...businessKeywords, ...timeKeywords];
    
    for (const keyword of allKeywords) {
      if (normalizedText.includes(keyword)) {
        themes.push(keyword);
      }
    }
    
    // Extract specific entities (simplified)
    const words = normalizedText.split(/\s+/);
    for (const word of words) {
      // Airport codes (3 letters, uppercase in original)
      if (/^[A-Z]{3}$/.test(word.toUpperCase()) && text.includes(word.toUpperCase())) {
        themes.push('airport', 'destination');
      }
      
      // Currency amounts
      if (/\d+/.test(word)) {
        themes.push('price', 'money');
      }
    }
    
    return themes;
  }
  
  /**
   * Extract text content from HTML
   */
  private extractTextFromHTML(html: string): string {
    try {
      // Remove HTML tags and get text content
      const textContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')   // Remove styles
        .replace(/<[^>]*>/g, ' ')                          // Remove HTML tags
        .replace(/\s+/g, ' ')                              // Normalize whitespace
        .trim();
      
      return textContent;
    } catch (error) {
      console.error('Error extracting text from HTML:', error);
      return '';
    }
  }
  
  /**
   * Perform coherence analysis between text and image themes
   */
  private performCoherenceAnalysis(textThemes: string[], imageThemes: string[], request: QualityValidationRequest) {
    // Calculate theme alignment
    const commonThemes = textThemes.filter(theme => imageThemes.includes(theme));
    const alignmentScore = textThemes.length > 0 
      ? Math.round((commonThemes.length / textThemes.length) * 100)
      : 0;
    
    // Identify mismatches
    const mismatches: string[] = [];
    
    // Check for contradictory themes
    if (textThemes.includes('happy') && imageThemes.includes('negative')) {
      mismatches.push('Text suggests positive tone but images appear negative');
    }
    
    if (textThemes.includes('urgent') && imageThemes.includes('relaxed')) {
      mismatches.push('Text suggests urgency but images appear relaxed');
    }
    
    if (textThemes.includes('travel') && !imageThemes.some(theme => 
      ['travel', 'flight', 'destination', 'airport', 'airline'].includes(theme))) {
      mismatches.push('Travel-related text but no travel imagery detected');
    }
    
    // Check for missing brand consistency
    if (textThemes.includes('kupibilet') && !imageThemes.includes('rabbit')) {
      mismatches.push('Brand name mentioned but brand mascot not detected in images');
    }
    
    return {
      text_themes: textThemes,
      image_themes: imageThemes,
      alignment_score: alignmentScore,
      mismatches
    };
  }
  
  /**
   * Validate semantic alignment between text and images
   */
  private async validateSemanticAlignment(coherenceAnalysis: any, request: QualityValidationRequest): Promise<ValidationCheck> {
    const { alignment_score, text_themes, image_themes, mismatches } = coherenceAnalysis;
    
    // Calculate semantic alignment score
    let score = alignment_score;
    
    // Bonus for strong theme overlap
    if (alignment_score >= 80) {
      score = Math.min(100, score + 10);
    }
    
    // Penalty for major mismatches
    score -= mismatches.length * 15;
    score = Math.max(0, score);
    
    const passed = score >= 70 && mismatches.length <= 1;
    
    return {
      passed,
      score,
      message: passed
        ? `Strong semantic alignment between text and images (${score}%)`
        : `Weak semantic alignment detected (${score}%) - ${mismatches.length} mismatches`,
      details: {
        alignment_score: score,
        text_theme_count: text_themes.length,
        image_theme_count: image_themes.length,
        mismatch_count: mismatches.length
      }
    };
  }
  
  /**
   * Validate thematic consistency throughout the email
   */
  private async validateThematicConsistency(coherenceAnalysis: any, request: QualityValidationRequest): Promise<ValidationCheck> {
    const { text_themes, image_themes } = coherenceAnalysis;
    
    // Check for consistent theme categories
    const travelThemes = [...text_themes, ...image_themes].filter(theme =>
      ['travel', 'flight', 'destination', 'airport', 'airline', 'journey', 'trip'].includes(theme)
    );
    
    const businessThemes = [...text_themes, ...image_themes].filter(theme =>
      ['deal', 'offer', 'discount', 'sale', 'promotion', 'price', 'money'].includes(theme)
    );
    
    const brandThemes = [...text_themes, ...image_themes].filter(theme =>
      ['kupibilet', 'rabbit', 'mascot', 'brand'].includes(theme)
    );
    
    // Calculate consistency score
    let score = 70; // Base score
    
    // Bonus for consistent travel theme
    if (travelThemes.length >= 2) {
      score += 15;
    }
    
    // Bonus for consistent business theme
    if (businessThemes.length >= 2) {
      score += 10;
    }
    
    // Bonus for brand consistency
    if (brandThemes.length >= 1) {
      score += 15;
    }
    
    // Penalty for theme conflicts
    const conflictingThemes = this.detectThemeConflicts(text_themes, image_themes);
    score -= conflictingThemes.length * 10;
    
    score = Math.min(100, Math.max(0, score));
    const passed = score >= 70;
    
    return {
      passed,
      score,
      message: passed
        ? `Thematic consistency is maintained throughout the email`
        : `Thematic inconsistencies detected - review content alignment`,
      details: {
        travel_themes: travelThemes.length,
        business_themes: businessThemes.length,
        brand_themes: brandThemes.length,
        conflicting_themes: conflictingThemes,
        consistency_score: score
      }
    };
  }
  
  /**
   * Validate emotional coherence between text and images
   */
  private async validateEmotionalCoherence(coherenceAnalysis: any, request: QualityValidationRequest, imageAnalyses: ImageAnalysis[]): Promise<ValidationCheck> {
    const { text_themes } = coherenceAnalysis;
    
    // Determine text emotional tone
    const textEmotion = this.determineTextEmotion(text_themes, request);
    
    // Get image emotional tones
    const imageEmotions = imageAnalyses.map(analysis => analysis.emotional_tone);
    
    // Calculate emotional alignment
    let score = 70; // Base score
    
    // Check for emotional alignment
    const alignedImages = imageEmotions.filter(emotion => {
      if (textEmotion === 'positive' && emotion === 'positive') return true;
      if (textEmotion === 'negative' && emotion === 'negative') return true;
      if (textEmotion === 'neutral' && emotion === 'neutral') return true;
      return false;
    });
    
    if (imageEmotions.length > 0) {
      const alignmentRatio = alignedImages.length / imageEmotions.length;
      score = Math.round(alignmentRatio * 100);
    }
    
    // Penalty for emotional conflicts
    const conflictingImages = imageEmotions.filter(emotion => {
      if (textEmotion === 'positive' && emotion === 'negative') return true;
      if (textEmotion === 'negative' && emotion === 'positive') return true;
      return false;
    });
    
    score -= conflictingImages.length * 20;
    score = Math.max(0, score);
    
    const passed = score >= 70 && conflictingImages.length === 0;
    
    return {
      passed,
      score,
      message: passed
        ? `Emotional coherence is maintained between text and images`
        : `Emotional conflicts detected between text (${textEmotion}) and images`,
      details: {
        text_emotion: textEmotion,
        image_emotions: imageEmotions,
        aligned_images: alignedImages.length,
        conflicting_images: conflictingImages.length,
        coherence_score: score
      }
    };
  }
  
  /**
   * Validate call-to-action alignment with overall message
   */
  private async validateCTAAlignment(coherenceAnalysis: any, request: QualityValidationRequest): Promise<ValidationCheck> {
    const { text_themes } = coherenceAnalysis;
    
    // Extract CTA elements from HTML
    const ctaElements = this.extractCTAElements(request.html_content);
    
    if (ctaElements.length === 0) {
      return {
        passed: false,
        score: 30,
        message: 'No clear call-to-action elements found',
        details: { cta_count: 0 }
      };
    }
    
    // Analyze CTA alignment with content themes
    let alignmentScore = 70; // Base score
    
    // Check if CTA matches travel theme
    if (text_themes.includes('travel') || text_themes.includes('flight')) {
      const travelCTAs = ctaElements.filter(cta =>
        /book|search|find|flight|travel|trip/.test(cta.toLowerCase())
      );
      
      if (travelCTAs.length > 0) {
        alignmentScore += 20;
      } else {
        alignmentScore -= 15;
      }
    }
    
    // Check if CTA matches promotional theme
    if (text_themes.includes('deal') || text_themes.includes('offer')) {
      const promoCTAs = ctaElements.filter(cta =>
        /buy|get|save|claim|grab|offer/.test(cta.toLowerCase())
      );
      
      if (promoCTAs.length > 0) {
        alignmentScore += 15;
      } else {
        alignmentScore -= 10;
      }
    }
    
    alignmentScore = Math.min(100, Math.max(0, alignmentScore));
    const passed = alignmentScore >= 70;
    
    return {
      passed,
      score: alignmentScore,
      message: passed
        ? `Call-to-action elements align well with email content`
        : `Call-to-action elements may not align with email content`,
      details: {
        cta_elements: ctaElements,
        cta_count: ctaElements.length,
        alignment_score: alignmentScore
      }
    };
  }
  
  /**
   * Determine text emotion from themes and content
   */
  private determineTextEmotion(textThemes: string[], request: QualityValidationRequest): 'positive' | 'neutral' | 'negative' {
    const positiveThemes = ['happy', 'excited', 'deal', 'offer', 'save', 'discount', 'promotion'];
    const negativeThemes = ['sad', 'worried', 'problem', 'issue', 'cancel', 'delay', 'refund'];
    
    const positiveCount = textThemes.filter(theme => positiveThemes.includes(theme)).length;
    const negativeCount = textThemes.filter(theme => negativeThemes.includes(theme)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }
  
  /**
   * Detect theme conflicts between text and images
   */
  private detectThemeConflicts(textThemes: string[], imageThemes: string[]): string[] {
    const conflicts: string[] = [];
    
    // Check for obvious conflicts
    if (textThemes.includes('urgent') && imageThemes.includes('relaxed')) {
      conflicts.push('Urgent text vs relaxed imagery');
    }
    
    if (textThemes.includes('professional') && imageThemes.includes('casual')) {
      conflicts.push('Professional text vs casual imagery');
    }
    
    if (textThemes.includes('luxury') && imageThemes.includes('budget')) {
      conflicts.push('Luxury text vs budget imagery');
    }
    
    return conflicts;
  }
  
  /**
   * Extract CTA elements from HTML
   */
  private extractCTAElements(html: string): string[] {
    const ctaElements: string[] = [];
    
    try {
      // Extract button text
      const buttonMatches = html.match(/<button[^>]*>(.*?)<\/button>/gi);
      if (buttonMatches) {
        buttonMatches.forEach(match => {
          const text = match.replace(/<[^>]*>/g, '').trim();
          if (text) ctaElements.push(text);
        });
      }
      
      // Extract link text that looks like CTAs
      const linkMatches = html.match(/<a[^>]*>(.*?)<\/a>/gi);
      if (linkMatches) {
        linkMatches.forEach(match => {
          const text = match.replace(/<[^>]*>/g, '').trim();
          if (text && /book|buy|get|find|search|claim|grab|save|offer|deal/.test(text.toLowerCase())) {
            ctaElements.push(text);
          }
        });
      }
      
    } catch (error) {
      console.error('Error extracting CTA elements:', error);
    }
    
    return ctaElements;
  }
  
  /**
   * Calculate overall coherence score from individual checks
   */
  private calculateCoherenceScore(checks: Record<string, ValidationCheck>): number {
    const weights = {
      semantic_alignment: 0.35,    // 35% - Most critical
      thematic_consistency: 0.25,  // 25% - Very important
      emotional_coherence: 0.25,   // 25% - Very important
      cta_alignment: 0.15          // 15% - Important but less critical
    };
    
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const [checkName, check] of Object.entries(checks)) {
      const weight = weights[checkName as keyof typeof weights] || 0;
      totalScore += check.score * weight;
      totalWeight += weight;
    }
    
    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }
  
  /**
   * Generate recommendations based on coherence analysis
   */
  private generateRecommendations(checks: Record<string, ValidationCheck>, coherenceAnalysis: any): string[] {
    const recommendations: string[] = [];
    
    if (!checks.semantic_alignment.passed) {
      recommendations.push('Improve alignment between text content and image themes');
      recommendations.push('Choose images that better represent the email topic');
    }
    
    if (!checks.thematic_consistency.passed) {
      recommendations.push('Maintain consistent themes throughout the email');
      recommendations.push('Ensure all content elements support the main message');
    }
    
    if (!checks.emotional_coherence.passed) {
      recommendations.push('Align emotional tone between text and images');
      recommendations.push('Use appropriate rabbit emotional states for the message');
    }
    
    if (!checks.cta_alignment.passed) {
      recommendations.push('Ensure call-to-action elements match the email content');
      recommendations.push('Use action words that align with the email purpose');
    }
    
    // Specific recommendations based on mismatches
    if (coherenceAnalysis.mismatches.length > 0) {
      recommendations.push('Address identified content mismatches:');
      coherenceAnalysis.mismatches.forEach((mismatch: string) => {
        recommendations.push(`- ${mismatch}`);
      });
    }
    
    return recommendations;
  }
} 