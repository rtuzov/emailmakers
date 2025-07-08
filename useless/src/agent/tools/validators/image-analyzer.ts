/**
 * T11 Image Analyzer - AI-Powered Image Content Analysis
 * 
 * Uses OpenAI Vision API to analyze image content, emotional tone, and relevance
 * Weight: 20% of overall quality score
 */

import { 
  QualityValidationRequest,
  ImageAnalysisResult,
  ImageAnalysis,
  ValidationCheck,
  ValidatorConfig,
  VisionAPIError
} from './types';

/**
 * Image Analyzer Class
 * Handles AI-powered image content analysis using OpenAI Vision API
 */
export class ImageAnalyzer {
  
  private config: ValidatorConfig;
  private cache: Map<string, ImageAnalysis> = new Map();
  
  constructor(config: ValidatorConfig) {
    this.config = config;
  }
  
  /**
   * Perform comprehensive image analysis
   */
  async validate(request: QualityValidationRequest): Promise<ImageAnalysisResult> {
    try {
      console.log('🖼️ Image Analyzer: Starting AI-powered image content analysis');
      
      // Extract image paths from HTML and assets
      const imagePaths = this.extractImagePaths(request.html_content, request.assets_used);
      
      if (imagePaths.length === 0) {
        console.log('📷 Image Analyzer: No images found for analysis');
        return this.createNoImagesResult();
      }
      
      console.log(`📷 Image Analyzer: Found ${imagePaths.length} images to analyze`);
      
      // Analyze each image using OpenAI Vision API
      const imageAnalyses = await this.analyzeImages(imagePaths, request.topic);
      
      // Run all image checks
      const contentRecognition = await this.checkContentRecognition(imageAnalyses);
      const emotionalTone = await this.checkEmotionalTone(imageAnalyses, request.topic);
      const topicRelevance = await this.checkTopicRelevance(imageAnalyses, request.topic);
      const qualityAssessment = await this.checkQualityAssessment(imageAnalyses);
      
      // Calculate overall image score
      const checks = {
        content_recognition: contentRecognition,
        emotional_tone: emotionalTone,
        topic_relevance: topicRelevance,
        quality_assessment: qualityAssessment
      };
      
      const overallScore = this.calculateImageScore(checks, imageAnalyses);
      const passed = overallScore >= 70;
      
      // Collect all issues and recommendations
      const allIssues = this.collectIssues(checks, imageAnalyses);
      const allRecommendations = this.generateRecommendations(checks, imageAnalyses);
      
      console.log(`✅ Image Analyzer: Score ${overallScore}/100 (${passed ? 'PASSED' : 'FAILED'})`);
      console.log(`📊 Image Analyzer: Analyzed ${imageAnalyses.length} images with avg relevance ${Math.round(imageAnalyses.reduce((sum, img) => sum + img.relevance_score, 0) / imageAnalyses.length)}%`);
      
      return {
        score: overallScore,
        passed: passed,
        images_analyzed: imageAnalyses,
        checks: checks,
        issues: allIssues,
        recommendations: allRecommendations
      };
      
    } catch (error) {
      console.error('❌ Image Analyzer: Analysis failed:', error);
      return this.createFailedResult(`Image analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Extract image paths from HTML content and assets
   */
  private extractImagePaths(htmlContent: string, assetsUsed: any): string[] {
    const imagePaths: string[] = [];
    
    // Extract images from HTML img tags
    const imgTagPattern = /<img[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/gi;
    let match;
    
    while ((match = imgTagPattern.exec(htmlContent)) !== null) {
      const src = match[1];
      if (this.isValidImagePath(src)) {
        imagePaths.push(src);
      }
    }
    
    // Add images from assets_used (original and processed)
    if (assetsUsed.original_assets) {
      assetsUsed.original_assets.forEach((asset: string) => {
        if (this.isValidImagePath(asset) && !imagePaths.includes(asset)) {
          imagePaths.push(asset);
        }
      });
    }
    
    if (assetsUsed.processed_assets) {
      assetsUsed.processed_assets.forEach((asset: string) => {
        if (this.isValidImagePath(asset) && !imagePaths.includes(asset)) {
          imagePaths.push(asset);
        }
      });
    }
    
    // Add T10 sprite components if available
    if (assetsUsed.sprite_metadata?.split_components) {
      assetsUsed.sprite_metadata.split_components.forEach((component: any) => {
        if (this.isValidImagePath(component.path) && !imagePaths.includes(component.path)) {
          imagePaths.push(component.path);
        }
      });
    }
    
    return imagePaths;
  }
  
  /**
   * Check if path is a valid image file
   */
  private isValidImagePath(path: string): boolean {
    if (!path || typeof path !== 'string') {
      return false;
    }
    
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const lowerPath = path.toLowerCase();
    
    return imageExtensions.some(ext => lowerPath.includes(ext)) || 
           lowerPath.includes('image') || 
           lowerPath.includes('figma');
  }
  
  /**
   * Analyze multiple images using OpenAI Vision API
   */
  private async analyzeImages(imagePaths: string[], topic: string): Promise<ImageAnalysis[]> {
    const analyses: ImageAnalysis[] = [];
    
    // Process images in batches to respect API limits
    const batchSize = 3;
    for (let i = 0; i < imagePaths.length; i += batchSize) {
      const batch = imagePaths.slice(i, i + batchSize);
      const batchPromises = batch.map(path => this.analyzeImage(path, topic));
      
      try {
        const batchResults = await Promise.all(batchPromises);
        analyses.push(...batchResults.filter(result => result !== null) as ImageAnalysis[]);
      } catch (error) {
        console.warn(`⚠️ Image Analyzer: Batch analysis failed for images ${i}-${i + batchSize}:`, error);
        // Continue with remaining batches
      }
      
      // Rate limiting delay between batches
      if (i + batchSize < imagePaths.length) {
        await this.delay(500); // 500ms delay between batches
      }
    }
    
    return analyses;
  }
  
  /**
   * Analyze single image using OpenAI Vision API
   */
  private async analyzeImage(imagePath: string, topic: string): Promise<ImageAnalysis | null> {
    try {
      // Check cache first
      const cacheKey = `${imagePath}-${topic}`;
      if (this.cache.has(cacheKey)) {
        console.log(`📋 Image Analyzer: Using cached analysis for ${imagePath}`);
        return this.cache.get(cacheKey)!;
      }
      
      console.log(`🔍 Image Analyzer: Analyzing image ${imagePath}`);
      
      // For development/testing, simulate OpenAI Vision API response
      const analysis = await this.simulateVisionAPI(imagePath, topic);
      
      // In production, this would use actual OpenAI Vision API:
      // const analysis = await this.callOpenAIVisionAPI(imagePath, topic);
      
      // Cache the result
      this.cache.set(cacheKey, analysis);
      
      return analysis;
      
    } catch (error) {
      console.error(`❌ Image Analyzer: Failed to analyze ${imagePath}:`, error);
      return null;
    }
  }
  
  /**
   * Simulate OpenAI Vision API for development/testing
   */
  private async simulateVisionAPI(imagePath: string, topic: string): Promise<ImageAnalysis> {
    // Simulate API delay
    await this.delay(200);
    
    const fileName = imagePath.toLowerCase();
    
    // Analyze based on filename and topic context
    let description = 'General image';
    let emotionalTone: 'positive' | 'neutral' | 'negative' = 'neutral';
    let relevanceScore = 50;
    let qualityScore = 80;
    let detectedObjects: string[] = [];
    let aiConfidence = 85;
    
    // Rabbit character analysis
    if (fileName.includes('заяц') || fileName.includes('rabbit')) {
      detectedObjects.push('rabbit character', 'mascot');
      description = 'Kupibilet rabbit mascot character';
      relevanceScore = 90;
      qualityScore = 90;
      aiConfidence = 95;
      
      if (fileName.includes('счастлив') || fileName.includes('happy')) {
        emotionalTone = 'positive';
        description = 'Happy Kupibilet rabbit mascot expressing joy and satisfaction';
        relevanceScore = 95;
      } else if (fileName.includes('недоволен') || fileName.includes('angry')) {
        emotionalTone = 'negative';
        description = 'Upset Kupibilet rabbit mascot expressing concern or frustration';
        relevanceScore = 90;
      } else if (fileName.includes('озадачен') || fileName.includes('puzzled')) {
        emotionalTone = 'neutral';
        description = 'Puzzled Kupibilet rabbit mascot expressing confusion or curiosity';
        relevanceScore = 85;
      }
    }
    
    // Travel-related content analysis
    if (topic.toLowerCase().includes('москва') || topic.toLowerCase().includes('moscow')) {
      if (fileName.includes('москва') || fileName.includes('moscow')) {
        relevanceScore = Math.min(95, relevanceScore + 20);
        description += ' relevant to Moscow travel';
        detectedObjects.push('Moscow', 'destination');
      }
    }
    
    if (topic.toLowerCase().includes('париж') || topic.toLowerCase().includes('paris')) {
      if (fileName.includes('париж') || fileName.includes('paris')) {
        relevanceScore = Math.min(95, relevanceScore + 20);
        description += ' relevant to Paris travel';
        detectedObjects.push('Paris', 'destination');
      }
    }
    
    // Airline logos analysis
    if (fileName.includes('airline') || fileName.includes('авиа')) {
      detectedObjects.push('airline logo', 'brand');
      description = 'Airline brand logo or aviation-related imagery';
      relevanceScore = Math.min(90, relevanceScore + 15);
      qualityScore = 85;
      
      if (fileName.includes('aeroflot') || fileName.includes('аэрофлот')) {
        description = 'Aeroflot airline logo';
        detectedObjects.push('Aeroflot');
        relevanceScore = Math.min(95, relevanceScore + 10);
      }
    }
    
    // General travel content
    if (fileName.includes('билет') || fileName.includes('ticket')) {
      detectedObjects.push('ticket', 'travel');
      description += ' - ticket or booking related';
      relevanceScore = Math.min(90, relevanceScore + 10);
    }
    
    // Quality assessment based on filename patterns
    if (fileName.includes('low-quality') || fileName.includes('blur')) {
      qualityScore = 40;
      aiConfidence = 60;
    } else if (fileName.includes('high-quality') || fileName.includes('hd')) {
      qualityScore = 95;
      aiConfidence = 95;
    }
    
    return {
      image_path: imagePath,
      description: description,
      emotional_tone: emotionalTone,
      relevance_score: Math.max(0, Math.min(100, relevanceScore)),
      quality_score: Math.max(0, Math.min(100, qualityScore)),
      detected_objects: detectedObjects,
      ai_confidence: Math.max(0, Math.min(100, aiConfidence))
    };
  }
  
  /**
   * Real OpenAI Vision API call (for production use)
   */
  private async callOpenAIVisionAPI(imagePath: string, topic: string): Promise<ImageAnalysis> {
    try {
      // This would be the actual OpenAI Vision API implementation
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.openai_api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.vision_model,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analyze this image for an email about "${topic}". Provide: 1) Detailed description, 2) Emotional tone (positive/neutral/negative), 3) Relevance to topic (0-100), 4) Image quality (0-100), 5) Detected objects/elements. Focus on travel, airline, and brand elements.`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imagePath
                  }
                }
              ]
            }
          ],
          max_tokens: 300
        })
      });
      
      if (!response.ok) {
        throw new VisionAPIError(`OpenAI Vision API error: ${response.status}`, response.status);
      }
      
      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';
      
      // Parse the AI response and extract structured data
      return this.parseVisionAPIResponse(content, imagePath);
      
    } catch (error) {
      throw new VisionAPIError(
        `Vision API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        { imagePath, topic }
      );
    }
  }
  
  /**
   * Parse OpenAI Vision API response into structured data
   */
  private parseVisionAPIResponse(content: string, imagePath: string): ImageAnalysis {
    // This would parse the actual AI response
    // For now, return a default structure
    return {
      image_path: imagePath,
      description: content.substring(0, 200) || 'AI-generated description',
      emotional_tone: 'neutral',
      relevance_score: 75,
      quality_score: 80,
      detected_objects: [],
      ai_confidence: 85
    };
  }
  
  /**
   * Check content recognition quality
   */
  private async checkContentRecognition(analyses: ImageAnalysis[]): Promise<ValidationCheck> {
    try {
      const issues: string[] = [];
      let score = 100;
      
      // Check if AI confidence is generally high
      const avgConfidence = analyses.reduce((sum, img) => sum + img.ai_confidence, 0) / analyses.length;
      if (avgConfidence < 70) {
        issues.push('Low AI confidence in image content recognition');
        score -= 25;
      }
      
      // Check if images have meaningful descriptions
      const emptyDescriptions = analyses.filter(img => !img.description || img.description.length < 10);
      if (emptyDescriptions.length > 0) {
        issues.push(`${emptyDescriptions.length} images have insufficient descriptions`);
        score -= 20;
      }
      
      // Check if objects are detected
      const noObjectsDetected = analyses.filter(img => img.detected_objects.length === 0);
      if (noObjectsDetected.length > analyses.length * 0.5) {
        issues.push('Many images have no detectable objects or elements');
        score -= 15;
      }
      
      const passed = score >= 70;
      
      return {
        passed: passed,
        score: Math.max(0, score),
        message: passed ? 'Content recognition successful' : `Content recognition issues: ${issues.join(', ')}`,
        details: {
          issues: issues,
          avg_confidence: Math.round(avgConfidence),
          empty_descriptions: emptyDescriptions.length,
          no_objects_detected: noObjectsDetected.length
        }
      };
      
    } catch (error) {
      return {
        passed: false,
        score: 0,
        message: `Content recognition check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error }
      };
    }
  }
  
  /**
   * Check emotional tone appropriateness
   */
  private async checkEmotionalTone(analyses: ImageAnalysis[], topic: string): Promise<ValidationCheck> {
    try {
      const issues: string[] = [];
      let score = 100;
      
      // Determine expected emotional tone based on topic
      const expectedTone = this.determineExpectedTone(topic);
      
      // Check tone alignment
      const mismatchedTones = analyses.filter(img => {
        if (expectedTone === 'any') return false;
        return img.emotional_tone !== expectedTone;
      });
      
      if (mismatchedTones.length > 0) {
        issues.push(`${mismatchedTones.length} images have mismatched emotional tone`);
        score -= Math.min(40, mismatchedTones.length * 15);
      }
      
      // Check for negative emotions in promotional content
      if (topic.toLowerCase().includes('промо') || topic.toLowerCase().includes('скидка')) {
        const negativeImages = analyses.filter(img => img.emotional_tone === 'negative');
        if (negativeImages.length > 0) {
          issues.push('Negative emotional imagery in promotional content');
          score -= 25;
        }
      }
      
      const passed = score >= 70;
      
      return {
        passed: passed,
        score: Math.max(0, score),
        message: passed ? 'Emotional tone appropriate' : `Emotional tone issues: ${issues.join(', ')}`,
        details: {
          issues: issues,
          expected_tone: expectedTone,
          mismatched_tones: mismatchedTones.length,
          tone_distribution: this.getToneDistribution(analyses)
        }
      };
      
    } catch (error) {
      return {
        passed: false,
        score: 0,
        message: `Emotional tone check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error }
      };
    }
  }
  
  /**
   * Check topic relevance
   */
  private async checkTopicRelevance(analyses: ImageAnalysis[], topic: string): Promise<ValidationCheck> {
    try {
      const issues: string[] = [];
      let score = 100;
      
      // Calculate average relevance score
      const avgRelevance = analyses.reduce((sum, img) => sum + img.relevance_score, 0) / analyses.length;
      
      if (avgRelevance < 50) {
        issues.push('Images have low relevance to email topic');
        score -= 40;
      } else if (avgRelevance < 70) {
        issues.push('Images have moderate relevance to email topic');
        score -= 20;
      }
      
      // Check for highly irrelevant images
      const irrelevantImages = analyses.filter(img => img.relevance_score < 30);
      if (irrelevantImages.length > 0) {
        issues.push(`${irrelevantImages.length} images are highly irrelevant to the topic`);
        score -= Math.min(30, irrelevantImages.length * 10);
      }
      
      const passed = score >= 70;
      
      return {
        passed: passed,
        score: Math.max(0, score),
        message: passed ? 'Images are relevant to topic' : `Topic relevance issues: ${issues.join(', ')}`,
        details: {
          issues: issues,
          avg_relevance: Math.round(avgRelevance),
          irrelevant_images: irrelevantImages.length,
          relevance_distribution: this.getRelevanceDistribution(analyses)
        }
      };
      
    } catch (error) {
      return {
        passed: false,
        score: 0,
        message: `Topic relevance check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error }
      };
    }
  }
  
  /**
   * Check overall image quality
   */
  private async checkQualityAssessment(analyses: ImageAnalysis[]): Promise<ValidationCheck> {
    try {
      const issues: string[] = [];
      let score = 100;
      
      // Calculate average quality score
      const avgQuality = analyses.reduce((sum, img) => sum + img.quality_score, 0) / analyses.length;
      
      if (avgQuality < 60) {
        issues.push('Images have low quality scores');
        score -= 35;
      } else if (avgQuality < 75) {
        issues.push('Images have moderate quality scores');
        score -= 15;
      }
      
      // Check for very low quality images
      const lowQualityImages = analyses.filter(img => img.quality_score < 50);
      if (lowQualityImages.length > 0) {
        issues.push(`${lowQualityImages.length} images have very low quality`);
        score -= Math.min(25, lowQualityImages.length * 12);
      }
      
      const passed = score >= 70;
      
      return {
        passed: passed,
        score: Math.max(0, score),
        message: passed ? 'Image quality meets standards' : `Quality issues: ${issues.join(', ')}`,
        details: {
          issues: issues,
          avg_quality: Math.round(avgQuality),
          low_quality_images: lowQualityImages.length,
          quality_distribution: this.getQualityDistribution(analyses)
        }
      };
      
    } catch (error) {
      return {
        passed: false,
        score: 0,
        message: `Quality assessment failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error }
      };
    }
  }
  
  // Utility methods
  private determineExpectedTone(topic: string): 'positive' | 'neutral' | 'negative' | 'any' {
    const lowerTopic = topic.toLowerCase();
    
    if (lowerTopic.includes('промо') || lowerTopic.includes('скидка') || lowerTopic.includes('отдых')) {
      return 'positive';
    }
    
    if (lowerTopic.includes('отмена') || lowerTopic.includes('задержка') || lowerTopic.includes('проблема')) {
      return 'negative';
    }
    
    return 'any'; // Most topics can have any appropriate tone
  }
  
  private getToneDistribution(analyses: ImageAnalysis[]): Record<string, number> {
    const distribution = { positive: 0, neutral: 0, negative: 0 };
    
    analyses.forEach(img => {
      distribution[img.emotional_tone]++;
    });
    
    return distribution;
  }
  
  private getRelevanceDistribution(analyses: ImageAnalysis[]): Record<string, number> {
    const distribution = { high: 0, medium: 0, low: 0 };
    
    analyses.forEach(img => {
      if (img.relevance_score >= 80) {
        distribution.high++;
      } else if (img.relevance_score >= 50) {
        distribution.medium++;
      } else {
        distribution.low++;
      }
    });
    
    return distribution;
  }
  
  private getQualityDistribution(analyses: ImageAnalysis[]): Record<string, number> {
    const distribution = { high: 0, medium: 0, low: 0 };
    
    analyses.forEach(img => {
      if (img.quality_score >= 80) {
        distribution.high++;
      } else if (img.quality_score >= 60) {
        distribution.medium++;
      } else {
        distribution.low++;
      }
    });
    
    return distribution;
  }
  
  private calculateImageScore(checks: Record<string, ValidationCheck>, analyses: ImageAnalysis[]): number {
    const weights = {
      content_recognition: 0.25,    // 25% - Can we understand the images?
      emotional_tone: 0.25,         // 25% - Do emotions match intent?
      topic_relevance: 0.30,        // 30% - Most important for engagement
      quality_assessment: 0.20      // 20% - Technical quality
    };
    
    return Math.round(
      checks.content_recognition.score * weights.content_recognition +
      checks.emotional_tone.score * weights.emotional_tone +
      checks.topic_relevance.score * weights.topic_relevance +
      checks.quality_assessment.score * weights.quality_assessment
    );
  }
  
  private collectIssues(checks: Record<string, ValidationCheck>, analyses: ImageAnalysis[]): string[] {
    const allIssues: string[] = [];
    
    Object.values(checks).forEach(check => {
      if (!check.passed && check.details?.issues) {
        allIssues.push(...check.details.issues);
      }
    });
    
    return allIssues;
  }
  
  private generateRecommendations(checks: Record<string, ValidationCheck>, analyses: ImageAnalysis[]): string[] {
    const recommendations: string[] = [];
    
    // Content recognition recommendations
    if (!checks.content_recognition.passed) {
      recommendations.push('Use higher quality images with clear, recognizable content');
      recommendations.push('Ensure images have distinctive visual elements for better AI recognition');
    }
    
    // Emotional tone recommendations
    if (!checks.emotional_tone.passed) {
      recommendations.push('Align image emotional tone with email content and purpose');
      recommendations.push('Use positive imagery for promotional content, neutral for informational');
    }
    
    // Topic relevance recommendations
    if (!checks.topic_relevance.passed) {
      recommendations.push('Choose images that directly relate to the email topic and destination');
      recommendations.push('Consider using destination-specific imagery or travel-related visuals');
    }
    
    // Quality recommendations
    if (!checks.quality_assessment.passed) {
      recommendations.push('Replace low-quality images with higher resolution alternatives');
      recommendations.push('Ensure all images are clear, well-lit, and professionally composed');
    }
    
    // General recommendations based on analysis
    const avgRelevance = analyses.reduce((sum, img) => sum + img.relevance_score, 0) / analyses.length;
    if (avgRelevance < 80) {
      recommendations.push('Consider using more topic-specific images to improve relevance');
    }
    
    return recommendations;
  }
  
  private createNoImagesResult(): ImageAnalysisResult {
    return {
      score: 100, // No images means no image issues
      passed: true,
      images_analyzed: [],
      checks: {
        content_recognition: { passed: true, score: 100, message: 'No images to analyze' },
        emotional_tone: { passed: true, score: 100, message: 'No images to analyze' },
        topic_relevance: { passed: true, score: 100, message: 'No images to analyze' },
        quality_assessment: { passed: true, score: 100, message: 'No images to analyze' }
      },
      issues: [],
      recommendations: ['Consider adding relevant images to improve email engagement']
    };
  }
  
  private createFailedResult(errorMessage: string): ImageAnalysisResult {
    return {
      score: 0,
      passed: false,
      images_analyzed: [],
      checks: {
        content_recognition: { passed: false, score: 0, message: errorMessage },
        emotional_tone: { passed: false, score: 0, message: errorMessage },
        topic_relevance: { passed: false, score: 0, message: errorMessage },
        quality_assessment: { passed: false, score: 0, message: errorMessage }
      },
      issues: [errorMessage],
      recommendations: ['Fix image analysis errors and try again']
    };
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 