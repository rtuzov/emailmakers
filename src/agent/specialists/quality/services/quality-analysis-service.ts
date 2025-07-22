/**
 * 🔍 QUALITY ANALYSIS SERVICE
 * 
 * Service for handling quality analysis tasks
 * - HTML validation and quality assessment
 * - ML-powered quality scoring integration
 * - Issue detection and scoring
 * - Quality report generation
 * - Handoff data validation
 */

import { QualitySpecialistInput, TaskResults, QualityRecommendations, QualityAnalytics } from '../types/quality-types';
import { EmailValidationService } from './email-validation-service';
import { getLogger } from '../../../../shared/utils/logger';
import { MLQualityScorer } from '../../../ml/quality-scoring';

const logger = getLogger({ component: 'quality-analysis' });

export class QualityAnalysisService {
  private static instance: QualityAnalysisService;
  private validationService: EmailValidationService;

  private constructor() {
    this.validationService = EmailValidationService.getInstance();
  }

  static getInstance(): QualityAnalysisService {
    if (!QualityAnalysisService.instance) {
      QualityAnalysisService.instance = new QualityAnalysisService();
    }
    return QualityAnalysisService.instance;
  }

  /**
   * Главный метод анализа качества с ML-scoring интеграцией
   */
  async handleQualityAnalysis(input: QualitySpecialistInput): Promise<TaskResults> {
    console.log('🔍 QUALITY SERVICE: Starting comprehensive quality analysis...');
    console.log('📊 Input data:', {
      hasEmailPackage: !!input.email_package,
      htmlLength: input.email_package?.html_output?.length || 0,
      hasSubject: !!input.email_package?.subject,
      hasBrandGuidelines: !!input.brand_guidelines
    });

    try {
      const startTime = Date.now();
      
      // 1. ML-Powered Quality Analysis
      console.log('🤖 QUALITY SERVICE: Running ML-powered quality analysis...');
      const mlAnalysisStart = Date.now();
      const mlAnalysis = await this.runMLScoringAnalysis(input);
      const mlAnalysisTime = Date.now() - mlAnalysisStart;
      console.log(`✅ QUALITY SERVICE: ML analysis completed in ${mlAnalysisTime}ms`);
      console.log('📊 ML Scores:', {
        overall: mlAnalysis.overall_score,
        content: mlAnalysis.category_scores.content,
        design: mlAnalysis.category_scores.design,
        technical: mlAnalysis.category_scores.technical,
        performance: mlAnalysis.category_scores.performance
      });

      // 2. Traditional Validation
      console.log('🔧 QUALITY SERVICE: Running traditional email validation...');
      const validationStart = Date.now();
      const validationResult = await this.validationService.validateEmailPackage(input.email_package);
      const validationTime = Date.now() - validationStart;
      console.log(`✅ QUALITY SERVICE: Traditional validation completed in ${validationTime}ms`);
      console.log('📋 Validation results:', {
        isValid: validationResult.isValid,
        errorCount: validationResult.errors.length,
        warningCount: validationResult.warnings.length
      });

      // 3. Combine Results
      console.log('🔄 QUALITY SERVICE: Combining ML and traditional analysis results...');
      const combinedAnalysis = this.combineQualityAnalysis(mlAnalysis, validationResult);
      
      const totalTime = Date.now() - startTime;
      console.log(`🏁 QUALITY SERVICE: Complete analysis finished in ${totalTime}ms`);
      console.log('📈 Final analysis summary:', {
        overallScore: combinedAnalysis.ml_quality_report.overall_score,
        totalIssues: combinedAnalysis.ml_quality_report.issues.length,
        totalRecommendations: combinedAnalysis.ml_quality_report.recommendations.length,
        validationPassed: combinedAnalysis.validation_result.isValid
      });

      return {
        status: 'completed',
        quality_score: combinedAnalysis.ml_quality_report.overall_score,
        validation_passed: combinedAnalysis.validation_result.isValid,
        recommendations: combinedAnalysis.recommendations,
        analytics: combinedAnalysis.analytics,
        ml_quality_report: combinedAnalysis.ml_quality_report,
        validation_result: combinedAnalysis.validation_result,
        processing_time_ms: totalTime,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ QUALITY SERVICE ERROR:', errorMessage);
      logger.error('Quality analysis failed', { error: errorMessage, input });
      
      return {
        status: 'failed',
        quality_score: 0,
        validation_passed: false,
        recommendations: {
          critical_issues: [`Quality analysis failed: ${errorMessage}`],
          improvements: ['Please check input data and try again'],
          ml_recommendations: []
        },
        analytics: {
          total_checks: 0,
          passed_checks: 0,
          failed_checks: 1,
          processing_time_ms: 0,
          ml_score: 0,
          ml_issues: [],
          ml_recommendations: []
        },
        processing_time_ms: 0,
        error: errorMessage,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Запуск ML-анализа качества
   */
  private async runMLScoringAnalysis(input: QualitySpecialistInput): Promise<any> {
    console.log('🧠 ML-SCORING SERVICE: Preparing data for ML analysis...');
    
    try {
      // Prepare data for ML analysis
      const mlData = this.prepareMLScoringData(input);
      console.log('📦 ML-SCORING SERVICE: Data prepared:', {
        subject: mlData.subject?.substring(0, 50) + '...',
        contentLength: mlData.content?.length || 0,
        hasDesignTokens: Object.keys(mlData.design_tokens || {}).length > 0,
        hasBrandGuidelines: Object.keys(mlData.brand_guidelines || {}).length > 0
      });

      // Run ML analysis
      console.log('⚙️ ML-SCORING SERVICE: Executing ML quality analysis...');
      const analysisResult = await MLQualityScorer.analyzeQuality(mlData);
      
      console.log('✅ ML-SCORING SERVICE: Analysis completed successfully');
      console.log('📊 ML-SCORING RESULTS:', {
        overall_score: analysisResult.score.overall,
        category_scores: {
          content: analysisResult.score.content,
          design: analysisResult.score.design,
          technical: analysisResult.score.technical,
          performance: analysisResult.score.performance
        },
        issues_found: analysisResult.issues.length,
        recommendations_generated: analysisResult.recommendations.length
      });

      // Convert to expected format
      return {
        overall_score: analysisResult.score.overall,
        category_scores: {
          content: analysisResult.score.content,
          design: analysisResult.score.design,
          technical: analysisResult.score.technical,
          performance: analysisResult.score.performance
        },
        recommendations: analysisResult.recommendations,
        issues: analysisResult.issues,
        detailed_analysis: {
          content: analysisResult.content_analysis,
          design: analysisResult.design_analysis,
          technical: analysisResult.technical_analysis,
          performance: analysisResult.performance_analysis
        },
        generation_timestamp: analysisResult.generation_timestamp,
        analysis_duration_ms: analysisResult.analysis_duration_ms
      };

    } catch (error) {
      console.error('❌ ML-SCORING SERVICE ERROR:', error instanceof Error ? error.message : 'Unknown error');
      throw new Error(`ML scoring analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Подготовка данных для ML-анализа
   */
  private prepareMLScoringData(input: QualitySpecialistInput): any {
    console.log('📋 ML-SCORING SERVICE: Extracting data components...');
    
    const emailPackage = input.email_package;
    if (!emailPackage) {
      throw new Error('Email package is required for ML analysis');
    }

    // Use html_output as the primary content source
    const htmlContent = emailPackage.html_output || emailPackage.html_content || '';
    
    // Extract content text from HTML
    const contentText = this.extractContentFromHTML(htmlContent);
    console.log('📝 Extracted content length:', contentText.length);

    // Extract CTA information
    const ctaInfo = this.extractCTAText(htmlContent);
    console.log('🔗 CTA extraction:', { count: ctaInfo.length });

    // Extract URLs
    const urls = this.extractURLs(htmlContent);
    console.log('🌐 URL extraction:', { count: urls.length });

    const mlData = {
      subject: emailPackage.subject || 'No subject',
      preheader: emailPackage.preheader || '',
      content: htmlContent,
      design_tokens: input.design_tokens || {},
      brand_guidelines: input.brand_guidelines || {},
      images: emailPackage.assets || []
    };

    console.log('✅ ML-SCORING SERVICE: Data preparation completed');
    return mlData;
  }

  /**
   * Объединение результатов ML и традиционного анализа
   */
  private combineQualityAnalysis(mlAnalysis: any, validationResult: any): any {
    console.log('🔄 QUALITY SERVICE: Merging analysis results...');
    console.log('📊 ML Analysis score:', mlAnalysis.overall_score);
    console.log('✅ Validation status:', validationResult.isValid);

    // Combine recommendations
    const combinedRecommendations: QualityRecommendations = {
      critical_issues: [
        ...validationResult.errors,
        ...mlAnalysis.issues.filter((issue: any) => issue.severity === 'critical').map((issue: any) => issue.issue)
      ],
      improvements: [
        ...validationResult.warnings,
        ...mlAnalysis.recommendations.slice(0, 5) // Top 5 ML recommendations
      ],
      ml_recommendations: mlAnalysis.recommendations
    };

    // Extract analytics with ML metrics
    const analytics: QualityAnalytics = this.extractAnalytics(mlAnalysis, validationResult);

    console.log('📈 Combined analytics:', {
      ml_score: analytics.ml_score,
      total_checks: analytics.total_checks,
      passed_checks: analytics.passed_checks,
      failed_checks: analytics.failed_checks
    });

    console.log('✅ QUALITY SERVICE: Analysis combination completed');

    return {
      ml_quality_report: mlAnalysis,
      validation_result: validationResult,
      recommendations: combinedRecommendations,
      analytics
    };
  }

  /**
   * Извлечение аналитики с ML-метриками
   */
  private extractAnalytics(mlAnalysis: any, validationResult: any): QualityAnalytics {
    const totalChecks = validationResult.errors.length + validationResult.warnings.length + mlAnalysis.issues.length;
    const failedChecks = validationResult.errors.length + mlAnalysis.issues.filter((issue: any) => 
      issue.severity === 'critical' || issue.severity === 'high'
    ).length;

    return {
      total_checks: Math.max(totalChecks, 10), // Minimum baseline
      passed_checks: Math.max(totalChecks - failedChecks, 0),
      failed_checks: failedChecks,
      processing_time_ms: mlAnalysis.analysis_duration_ms || 0,
      ml_score: mlAnalysis.overall_score,
      ml_issues: mlAnalysis.issues,
      ml_recommendations: mlAnalysis.recommendations
    };
  }

  /**
   * Извлечение текста из HTML
   */
  private extractContentFromHTML(html: string): string {
    // Simple HTML tag removal for content extraction
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Извлечение текста CTA
   */
  private extractCTAText(html: string): string[] {
    const ctaRegex = /<a[^>]*>(.*?)<\/a>/gi;
    const matches = [];
    let match;
    
    while ((match = ctaRegex.exec(html)) !== null) {
      const text = (match[1] || '').replace(/<[^>]*>/g, '').trim();
      if (text) {
        matches.push(text);
      }
    }
    
    return matches;
  }

  /**
   * Извлечение URL
   */
  private extractURLs(html: string): string[] {
    const urlRegex = /href\s*=\s*["']([^"']+)["']/gi;
    const urls: string[] = [];
    let match;
    
    while ((match = urlRegex.exec(html)) !== null) {
      if (match[1]) urls.push(match[1]);
    }
    
    return urls;
  }
} 