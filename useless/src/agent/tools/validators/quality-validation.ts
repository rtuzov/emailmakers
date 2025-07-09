/**
 * T11 Quality Validation Orchestrator - Main Quality Assessment Service
 * 
 * Coordinates all validation modules and provides comprehensive quality assessment
 * Positioned between T8 (render_test) and T9 (upload_s3) as quality gate
 */

import { 
  QualityValidationRequest,
  QualityValidationResponse,
  LogicValidationResult,
  VisualValidationResult,
  ImageAnalysisResult,
  CoherenceValidationResult,
  QualityValidationError,
  ValidatorConfig,
  QUALITY_SCORING_WEIGHTS,
  QUALITY_GATE_THRESHOLD
} from './types';
import { LogicValidator } from './logic-validator';
import { VisualValidator } from './visual-validator';
import { ImageAnalyzer } from './image-analyzer';
import { CoherenceChecker } from './coherence-checker';

/**
 * Quality Validation Service
 * Main orchestrator for comprehensive email quality assessment
 */
export class QualityValidationService {
  
  private logicValidator: LogicValidator;
  private visualValidator: VisualValidator;
  private imageAnalyzer: ImageAnalyzer;
  private coherenceChecker: CoherenceChecker;
  private config: ValidatorConfig;
  
  constructor(config: ValidatorConfig) {
    this.config = config;
    this.logicValidator = new LogicValidator();
    this.visualValidator = new VisualValidator();
    this.imageAnalyzer = new ImageAnalyzer(config);
    this.coherenceChecker = new CoherenceChecker();
  }
  
  /**
   * Perform comprehensive quality validation
   * Main entry point for T11 quality validation
   */
  async validateQuality(request: QualityValidationRequest): Promise<QualityValidationResponse> {
    const startTime = Date.now();
    
    try {
      console.log('🔍 T11 Quality Validation: Starting comprehensive quality assessment');
      console.log(`📊 T11 Quality Validation: Analyzing topic "${request.topic}"`);
      
      // Validate input request
      this.validateRequest(request);
      
      // Run validation modules based on configuration
      const validationResults = this.config.parallel_execution 
        ? await this.runValidationsInParallel(request)
        : await this.runValidationsSequentially(request);
      
      // Calculate overall quality score
      const overallScore = this.calculateOverallScore(validationResults);
      const qualityGatePassed = overallScore >= QUALITY_GATE_THRESHOLD;
      
      // Collect all issues and recommendations
      const allIssues = this.collectAllIssues(validationResults);
      const allRecommendations = this.collectAllRecommendations(validationResults);
      
      // Identify critical issues that block upload
      const criticalIssues = this.identifyCriticalIssues(validationResults, overallScore);
      
      const validationTime = Date.now() - startTime;
      
      // Log final results
      console.log(`✅ T11 Quality Validation: Completed in ${validationTime}ms`);
      console.log(`📊 T11 Quality Validation: Overall Score: ${overallScore}/100`);
      console.log(`🚪 T11 Quality Validation: Quality Gate: ${qualityGatePassed ? 'PASSED' : 'FAILED'}`);
      
      if (!qualityGatePassed) {
        console.log(`❌ T11 Quality Validation: Email blocked from upload (score: ${overallScore} < ${QUALITY_GATE_THRESHOLD})`);
      }
      
      return {
        overall_score: overallScore,
        quality_gate_passed: qualityGatePassed,
        logic_validation: validationResults.logic,
        visual_validation: validationResults.visual,
        image_analysis: validationResults.image,
        coherence_validation: validationResults.coherence,
        critical_issues: criticalIssues,
        recommendations: allRecommendations,
        validation_time: validationTime
      };
      
    } catch (error) {
      const validationTime = Date.now() - startTime;
      console.error('❌ T11 Quality Validation: Comprehensive validation failed:', error);
      
      throw new QualityValidationError(
        `Quality validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'QUALITY_VALIDATION_FAILED',
        { validationTime, error }
      );
    }
  }
  
  /**
   * Validate the input request
   */
  private validateRequest(request: QualityValidationRequest): void {
    const errors: string[] = [];
    
    if (!request.html_content || request.html_content.trim().length === 0) {
      errors.push('HTML content is required');
    }
    
    if (!request.mjml_source || request.mjml_source.trim().length === 0) {
      errors.push('MJML source is required');
    }
    
    if (!request.topic || request.topic.trim().length === 0) {
      errors.push('Email topic is required');
    }
    
    if (!request.assets_used) {
      errors.push('Assets information is required');
    }
    
    if (!request.campaign_metadata) {
      errors.push('Campaign metadata is required');
    }
    
    if (!request.original_request) {
      errors.push('Original request context is required');
    }
    
    if (errors.length > 0) {
      throw new QualityValidationError(
        `Invalid validation request: ${errors.join(', ')}`,
        'INVALID_REQUEST',
        { errors }
      );
    }
  }
  
  /**
   * Run all validations in parallel for better performance
   */
  private async runValidationsInParallel(request: QualityValidationRequest): Promise<{
    logic: LogicValidationResult;
    visual: VisualValidationResult;
    image: ImageAnalysisResult;
    coherence: CoherenceValidationResult;
  }> {
    console.log('⚡ T11 Quality Validation: Running validations in parallel');
    
    // Run logic, visual and image validations in parallel
    const [logicResult, visualResult, imageResult] = await Promise.all([
      this.logicValidator.validate(request),
      this.visualValidator.validate(request),
      this.imageAnalyzer.validate(request)
    ]);
    
    // Run coherence validation with image analysis results
    const coherenceResult = await this.coherenceChecker.validate(request, imageResult.images_analyzed);
    
    return {
      logic: logicResult,
      visual: visualResult,
      image: imageResult,
      coherence: coherenceResult
    };
  }
  
  /**
   * Run validations sequentially (fallback mode)
   */
  private async runValidationsSequentially(request: QualityValidationRequest): Promise<{
    logic: LogicValidationResult;
    visual: VisualValidationResult;
    image: ImageAnalysisResult;
    coherence: CoherenceValidationResult;
  }> {
    console.log('🔄 T11 Quality Validation: Running validations sequentially');
    
    // Run logic validation first (fastest)
    const logicResult = await this.logicValidator.validate(request);
    console.log(`✅ Logic Validation: ${logicResult.score}/100`);
    
    // Run visual validation
    const visualResult = await this.visualValidator.validate(request);
    console.log(`✅ Visual Validation: ${visualResult.score}/100`);
    
    // Run image analysis
    const imageResult = await this.imageAnalyzer.validate(request);
    console.log(`✅ Image Analysis: ${imageResult.score}/100`);
    
    // Run coherence validation with image results
    const coherenceResult = await this.coherenceChecker.validate(request, imageResult.images_analyzed);
    console.log(`✅ Coherence Validation: ${coherenceResult.score}/100`);
    
    return {
      logic: logicResult,
      visual: visualResult,
      image: imageResult,
      coherence: coherenceResult
    };
  }
  
  /**
   * Calculate overall quality score using weighted algorithm
   */
  private calculateOverallScore(validationResults: {
    logic: LogicValidationResult;
    visual: VisualValidationResult;
    image: ImageAnalysisResult;
    coherence: CoherenceValidationResult;
  }): number {
    const weights = QUALITY_SCORING_WEIGHTS;
    
    const weightedScore = 
      (validationResults.logic.score * weights.logic) +
      (validationResults.visual.score * weights.visual) +
      (validationResults.image.score * weights.image) +
      (validationResults.coherence.score * weights.coherence);
    
    return Math.round(weightedScore);
  }
  
  /**
   * Collect all issues from validation results
   */
  private collectAllIssues(validationResults: {
    logic: LogicValidationResult;
    visual: VisualValidationResult;
    image: ImageAnalysisResult;
    coherence: CoherenceValidationResult;
  }): string[] {
    const allIssues: string[] = [];
    
    allIssues.push(...validationResults.logic.issues);
    allIssues.push(...validationResults.visual.issues);
    allIssues.push(...validationResults.image.issues);
    allIssues.push(...validationResults.coherence.issues);
    
    return allIssues;
  }
  
  /**
   * Collect all recommendations from validation results
   */
  private collectAllRecommendations(validationResults: {
    logic: LogicValidationResult;
    visual: VisualValidationResult;
    image: ImageAnalysisResult;
    coherence: CoherenceValidationResult;
  }): string[] {
    const allRecommendations: string[] = [];
    
    allRecommendations.push(...validationResults.logic.recommendations);
    allRecommendations.push(...validationResults.visual.recommendations);
    allRecommendations.push(...validationResults.image.recommendations);
    allRecommendations.push(...validationResults.coherence.recommendations);
    
    // Remove duplicates and empty recommendations
    const filteredRecommendations = allRecommendations.filter(rec => rec && rec.trim().length > 0);
    return Array.from(new Set(filteredRecommendations));
  }
  
  /**
   * Identify critical issues that block email upload
   */
  private identifyCriticalIssues(validationResults: {
    logic: LogicValidationResult;
    visual: VisualValidationResult;
    image: ImageAnalysisResult;
    coherence: CoherenceValidationResult;
  }, overallScore: number): string[] {
    const criticalIssues: string[] = [];
    
    // Overall score too low
    if (overallScore < QUALITY_GATE_THRESHOLD) {
      criticalIssues.push(`Overall quality score ${overallScore} is below threshold ${QUALITY_GATE_THRESHOLD}`);
    }
    
    // Logic validation failures (critical for functionality)
    if (!validationResults.logic.passed) {
      criticalIssues.push('Logic validation failed - email contains data accuracy issues');
    }
    
    // Visual validation failures (critical for brand compliance)
    if (!validationResults.visual.passed) {
      criticalIssues.push('Visual validation failed - email does not meet brand or accessibility standards');
    }
    
    // Specific critical checks
    if (validationResults.logic.checks.price_realism && !validationResults.logic.checks.price_realism.passed) {
      criticalIssues.push('Price data appears unrealistic and may mislead customers');
    }
    
    if (validationResults.logic.checks.date_consistency && !validationResults.logic.checks.date_consistency.passed) {
      criticalIssues.push('Date information is inconsistent or invalid');
    }
    
    if (validationResults.visual.checks.email_compatibility && !validationResults.visual.checks.email_compatibility.passed) {
      criticalIssues.push('Email may not render correctly in major email clients');
    }
    
    if (validationResults.visual.checks.accessibility && !validationResults.visual.checks.accessibility.passed) {
      criticalIssues.push('Email does not meet accessibility standards (WCAG AA)');
    }
    
    // Coherence issues that affect user experience
    if (validationResults.coherence.coherence_analysis.mismatches.length > 2) {
      criticalIssues.push('Multiple content mismatches detected that may confuse recipients');
    }
    
    return criticalIssues;
  }
  
  /**
   * Generate quality assessment summary
   */
  generateQualitySummary(response: QualityValidationResponse): string {
    const { overall_score, quality_gate_passed, logic_validation, visual_validation, image_analysis, coherence_validation } = response;
    
    let summary = `🔍 T11 Quality Assessment Summary\\n`;
    summary += `Overall Score: ${overall_score}/100\\n`;
    summary += `Quality Gate: ${quality_gate_passed ? '✅ PASSED' : '❌ FAILED'}\\n\\n`;
    
    summary += `📊 Individual Scores:\\n`;
    summary += `• Logic: ${logic_validation.score}/100 ${logic_validation.passed ? '✅' : '❌'}\\n`;
    summary += `• Visual: ${visual_validation.score}/100 ${visual_validation.passed ? '✅' : '❌'}\\n`;
    summary += `• Images: ${image_analysis.score}/100 ${image_analysis.passed ? '✅' : '❌'}\\n`;
    summary += `• Coherence: ${coherence_validation.score}/100 ${coherence_validation.passed ? '✅' : '❌'}\\n\\n`;
    
    if (response.critical_issues.length > 0) {
      summary += `🚨 Critical Issues:\\n`;
      response.critical_issues.forEach(issue => {
        summary += `• ${issue}\\n`;
      });
      summary += `\\n`;
    }
    
    if (response.recommendations.length > 0) {
      summary += `💡 Recommendations:\\n`;
      response.recommendations.slice(0, 5).forEach(rec => { // Show top 5 recommendations
        summary += `• ${rec}\\n`;
      });
      
      if (response.recommendations.length > 5) {
        summary += `• ... and ${response.recommendations.length - 5} more recommendations\\n`;
      }
    }
    
    return summary;
  }
  
  /**
   * Create validator configuration from environment
   */
  static createConfig(): ValidatorConfig {
    return {
      openai_api_key: process.env.OPENAI_API_KEY || '',
      vision_model: 'gpt-4o-mini',
      max_image_size: 20 * 1024 * 1024, // 20MB
      cache_ttl: 3600, // 1 hour
      parallel_execution: true,
      timeout: 30000 // 30 seconds
    };
  }
  
  /**
   * Validate configuration
   */
  static validateConfig(config: ValidatorConfig): void {
    if (!config.openai_api_key) {
      throw new QualityValidationError(
        'OpenAI API key is required for image analysis',
        'MISSING_API_KEY'
      );
    }
    
    if (config.timeout < 5000) {
      throw new QualityValidationError(
        'Timeout must be at least 5 seconds',
        'INVALID_TIMEOUT'
      );
    }
    
    if (config.max_image_size < 1024 * 1024) {
      throw new QualityValidationError(
        'Max image size must be at least 1MB',
        'INVALID_IMAGE_SIZE'
      );
    }
  }
}

/**
 * Create and configure quality validation service
 */
export function createQualityValidationService(): QualityValidationService {
  const config = QualityValidationService.createConfig();
  QualityValidationService.validateConfig(config);
  return new QualityValidationService(config);
}

/**
 * Quality validation tool function for agent integration
 */
export async function validateEmailQuality(request: QualityValidationRequest): Promise<QualityValidationResponse> {
  const service = createQualityValidationService();
  return await service.validateQuality(request);
} 