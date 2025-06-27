import { HTMLValidationService, HTMLValidationResult as HTMLValidationServiceResult } from './html-validation-service';
import { AccessibilityTestingService, AccessibilityResult as AccessibilityServiceResult } from './accessibility-testing-service';
import { PerformanceTestingService, PerformanceResult as PerformanceServiceResult } from './performance-testing-service';

// Types and interfaces for quality assurance
export interface QualityReport {
  id: string;
  templateId: string;
  timestamp: Date;
  overallScore: number; // 0-1
  passed: boolean;
  tests: TestResult[];
  validation: ValidationResult;
  accessibility: AccessibilityResult;
  performance: PerformanceResult;
  suggestedFixes: AutoFix[];
  recommendations: string[];
}

export interface TestResult {
  category: 'cross-client' | 'html' | 'css' | 'accessibility' | 'performance';
  name: string;
  status: 'passed' | 'failed' | 'warning' | 'skipped';
  score: number; // 0-1
  details: string;
  client?: string;
  executionTime: number;
  metadata: Record<string, any>;
}

export interface ValidationResult {
  html: HTMLValidationResult;
  css: CSSValidationResult;
  email: EmailValidationResult;
  links: LinkValidationResult;
}

export interface HTMLValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  doctype: string;
  encoding: string;
  semanticScore: number;
}

export interface CSSValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  emailCompatible: boolean;
  inlinePercentage: number;
  mediaQuerySupport: boolean;
}

export interface EmailValidationResult {
  sizeCheck: {
    total: number;
    html: number;
    css: number;
    images: number;
    withinLimits: boolean;
  };
  clientCompatibility: ClientCompatibilityScore[];
  spamScore: number; // 0-10, lower is better
  deliverabilityScore: number; // 0-1
}

export interface LinkValidationResult {
  totalLinks: number;
  validLinks: number;
  brokenLinks: BrokenLink[];
  trackingLinks: number;
  unsubscribeLink: boolean;
}

export interface AccessibilityResult {
  wcagLevel: 'A' | 'AA' | 'AAA' | 'fail';
  score: number; // 0-1
  issues: AccessibilityIssue[];
  colorContrast: ContrastResult[];
  altTextCoverage: number; // 0-1
  semanticStructure: boolean;
}

export interface PerformanceResult {
  renderTime: number; // estimated ms
  domComplexity: number;
  cssComplexity: number;
  imageOptimization: number; // 0-1
  cacheability: number; // 0-1
  mobileOptimization: number; // 0-1
}

export interface AutoFix {
  id: string;
  category: 'html' | 'css' | 'accessibility' | 'performance' | 'compatibility';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  element: string;
  currentValue: string;
  suggestedValue: string;
  confidence: number; // 0-1
  autoApplicable: boolean;
  reasoning: string;
}

export interface ValidationError {
  line: number;
  column: number;
  message: string;
  rule: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  line: number;
  column: number;
  message: string;
  rule: string;
  impact: 'low' | 'medium' | 'high';
}

export interface ClientCompatibilityScore {
  client: string;
  score: number; // 0-1
  supported: boolean;
  issues: string[];
}

export interface BrokenLink {
  url: string;
  status: number;
  error: string;
  context: string;
}

export interface AccessibilityIssue {
  rule: string;
  severity: 'minor' | 'moderate' | 'serious' | 'critical';
  element: string;
  description: string;
  suggestion: string;
  wcagReference: string;
}

export interface ContrastResult {
  foreground: string;
  background: string;
  ratio: number;
  level: 'AA' | 'AAA' | 'fail';
  element: string;
}

export interface QualityAssuranceConfig {
  litmusApiKey?: string;
  emailOnAcidApiKey?: string;
  testClients: string[];
  validationLevel: 'strict' | 'moderate' | 'lenient';
  accessibilityLevel: 'A' | 'AA' | 'AAA';
  performanceThresholds: PerformanceThresholds;
  autoFixEnabled: boolean;
}

export interface PerformanceThresholds {
  maxSize: number; // bytes
  maxRenderTime: number; // ms
  maxDOMComplexity: number;
  minAccessibilityScore: number; // 0-1
}

export interface QualityAssuranceResult {
  html: HTMLValidationServiceResult;
  accessibility: AccessibilityServiceResult;
  performance: PerformanceServiceResult;
  overallScore: number;
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  recommendations: QualityRecommendation[];
  summary: QualitySummary;
  testMetadata: TestMetadata;
}

export interface QualityRecommendation {
  category: 'html' | 'accessibility' | 'performance' | 'general';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  implementation: string;
  estimatedEffort: 'low' | 'medium' | 'high';
  estimatedImpact: 'low' | 'medium' | 'high';
}

export interface QualitySummary {
  totalIssues: number;
  criticalIssues: number;
  highPriorityIssues: number;
  mediumPriorityIssues: number;
  lowPriorityIssues: number;
  emailClientCompatibility: number; // 0-1
  wcagCompliance: number; // 0-1
  performanceScore: number; // 0-1
  overallHealthScore: number; // 0-1
}

export interface TestMetadata {
  timestamp: string;
  testDuration: number; // ms
  htmlSize: number;
  testVersion: string;
  environment: string;
  validationStandards: string[];
}

/**
 * Enhanced Quality Assurance Service
 * 
 * Orchestrates comprehensive quality analysis for email templates:
 * - HTML validation with email-specific rules and compliance checking
 * - Accessibility testing with WCAG 2.1 AA compliance and color contrast analysis
 * - Performance analysis with file size, loading metrics, and optimization suggestions
 * - Cross-client compatibility assessment
 * - Automated fix suggestions and optimization recommendations
 * - Detailed reporting with actionable insights
 */
export class QualityAssuranceService {
  private htmlValidator: HTMLValidationService;
  private accessibilityTester: AccessibilityTestingService;
  private performanceTester: PerformanceTestingService;

  constructor() {
    this.htmlValidator = new HTMLValidationService();
    this.accessibilityTester = new AccessibilityTestingService();
    this.performanceTester = new PerformanceTestingService();
  }

  /**
   * Run comprehensive quality assurance analysis
   * 
   * @param html - Email template HTML to analyze
   * @param options - Analysis options and configuration
   * @returns Comprehensive quality assurance results
   */
  async runQualityAssurance(
    html: string, 
    options: {
      includeAccessibility?: boolean;
      includePerformance?: boolean;
      strictMode?: boolean;
      targetClients?: string[];
    } = {}
  ): Promise<QualityAssuranceResult> {
    const startTime = Date.now();
    
    try {
      // Set default options
      const config = {
        includeAccessibility: true,
        includePerformance: true,
        strictMode: false,
        targetClients: ['gmail', 'outlook', 'apple-mail', 'yahoo'],
        ...options
      };

      console.log('🔍 Starting comprehensive quality assurance analysis...');

      // Run all quality checks in parallel for better performance
      const [htmlResult, accessibilityResult, performanceResult] = await Promise.all([
        this.htmlValidator.validateEmailHTML(html),
        config.includeAccessibility ? this.accessibilityTester.testAccessibility(html) : this.getDefaultAccessibilityResult(),
        config.includePerformance ? this.performanceTester.analyzePerformance(html) : this.getDefaultPerformanceResult()
      ]);

      console.log('✅ Quality analysis completed successfully');

      // Calculate overall scores
      const overallScore = this.calculateOverallScore(htmlResult, accessibilityResult, performanceResult);
      const overallGrade = this.determineOverallGrade(overallScore);

      // Generate comprehensive recommendations
      const recommendations = this.generateRecommendations(htmlResult, accessibilityResult, performanceResult);

      // Create quality summary
      const summary = this.createQualitySummary(htmlResult, accessibilityResult, performanceResult, recommendations);

      // Create test metadata
      const testMetadata = this.createTestMetadata(html, startTime);

      return {
        html: htmlResult,
        accessibility: accessibilityResult,
        performance: performanceResult,
        overallScore,
        overallGrade,
        recommendations,
        summary,
        testMetadata
      };

    } catch (error) {
      console.error('❌ Quality assurance analysis failed:', error);
      return this.createErrorResult(html, startTime, error);
    }
  }

  /**
   * Quick quality check for basic validation
   */
  async quickQualityCheck(html: string): Promise<{
    isValid: boolean;
    criticalIssues: string[];
    score: number;
    grade: string;
  }> {
    try {
      const htmlResult = await this.htmlValidator.validateEmailHTML(html);
      
      const criticalIssues = [
        ...htmlResult.errors.filter(e => e.severity === 'error').map(e => e.message)
      ];

      const isValid = criticalIssues.length === 0;
      const score = htmlResult.emailCompliance.score;
      const grade = score >= 0.9 ? 'A' : score >= 0.8 ? 'B' : score >= 0.7 ? 'C' : score >= 0.6 ? 'D' : 'F';

      return {
        isValid,
        criticalIssues,
        score,
        grade
      };
    } catch (error) {
      console.error('Quick quality check failed:', error);
      return {
        isValid: false,
        criticalIssues: ['Quality check failed due to analysis error'],
        score: 0,
        grade: 'F'
      };
    }
  }

  /**
   * Generate automated fix suggestions
   */
  async generateFixSuggestions(html: string): Promise<{
    fixes: AutomatedFix[];
    canAutoFix: boolean;
    manualFixesRequired: string[];
  }> {
    try {
      const htmlResult = await this.htmlValidator.validateEmailHTML(html);
      const accessibilityResult = await this.accessibilityTester.testAccessibility(html);
      
      const fixes: AutomatedFix[] = [];
      const manualFixesRequired: string[] = [];

      // HTML fixes
      htmlResult.errors.forEach(error => {
        // For now, all HTML errors require manual fixes since ValidationError doesn't have fixSuggestion
        manualFixesRequired.push(error.message);
      });

      // Accessibility fixes
      accessibilityResult.issues.forEach(issue => {
        // For now, all accessibility issues require manual fixes
        manualFixesRequired.push(issue.description);
      });

      return {
        fixes,
        canAutoFix: fixes.length > 0,
        manualFixesRequired
      };
    } catch (error) {
      console.error('Fix suggestion generation failed:', error);
      return {
        fixes: [],
        canAutoFix: false,
        manualFixesRequired: ['Unable to generate fix suggestions due to analysis error']
      };
    }
  }

  /**
   * Validate email template against specific client requirements
   */
  async validateForEmailClient(html: string, client: string): Promise<{
    compatible: boolean;
    issues: string[];
    recommendations: string[];
    supportScore: number;
  }> {
    try {
      const htmlResult = await this.htmlValidator.validateEmailHTML(html);
      
      // Client-specific validation rules
      const clientRules = this.getClientSpecificRules(client);
      const issues: string[] = [];
      const recommendations: string[] = [];

      // Check client-specific compliance
      htmlResult.emailCompliance.details.forEach(detail => {
        if (!detail.passed && clientRules.criticalIssues.includes(detail.check)) {
          issues.push(detail.message);
        }
        if (!detail.passed && clientRules.recommendations.includes(detail.check)) {
          recommendations.push(`Fix ${detail.check}: ${detail.message}`);
        }
      });

      // Calculate support score based on issues
      const supportScore = Math.max(0, 1 - (issues.length * 0.1));
      const compatible = issues.length === 0;

      return {
        compatible,
        issues,
        recommendations,
        supportScore
      };
    } catch (error) {
      console.error(`Email client validation failed for ${client}:`, error);
      return {
        compatible: false,
        issues: ['Validation failed due to analysis error'],
        recommendations: [],
        supportScore: 0
      };
    }
  }

  /**
   * Calculate overall quality score
   */
  private calculateOverallScore(
    html: HTMLValidationServiceResult,
    accessibility: AccessibilityServiceResult,
    performance: PerformanceServiceResult
  ): number {
    // Weighted scoring: HTML (40%), Accessibility (30%), Performance (30%)
    const htmlWeight = 0.4;
    const accessibilityWeight = 0.3;
    const performanceWeight = 0.3;

    const weightedScore = 
      (html.emailCompliance.score * htmlWeight) +
      (accessibility.score * accessibilityWeight) +
      (performance.score * performanceWeight);

    return Math.max(0, Math.min(1, weightedScore));
  }

  /**
   * Determine overall grade based on score
   */
  private determineOverallGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 0.9) return 'A';
    if (score >= 0.8) return 'B';
    if (score >= 0.7) return 'C';
    if (score >= 0.6) return 'D';
    return 'F';
  }

  /**
   * Generate comprehensive recommendations
   */
  private generateRecommendations(
    html: HTMLValidationServiceResult,
    accessibility: AccessibilityServiceResult,
    performance: PerformanceServiceResult
  ): QualityRecommendation[] {
    const recommendations: QualityRecommendation[] = [];

    // HTML recommendations
    html.errors.forEach(error => {
      if (error.severity === 'error' || error.severity === 'warning') {
        recommendations.push({
          category: 'html',
          priority: error.severity === 'error' ? 'critical' : 'medium',
          title: `HTML ${error.severity}: ${error.rule}`,
          description: error.message,
          impact: 'Email client compatibility and rendering issues',
          implementation: 'Review and fix HTML structure',
          estimatedEffort: 'medium',
          estimatedImpact: error.severity === 'error' ? 'high' : 'medium'
        });
      }
    });

    // Accessibility recommendations
    accessibility.issues.forEach(issue => {
      if (issue.severity === 'critical' || issue.severity === 'serious') {
        recommendations.push({
          category: 'accessibility',
          priority: issue.severity === 'critical' ? 'high' : 'medium',
          title: `Accessibility: ${issue.rule}`,
          description: issue.description,
          impact: issue.impact,
          implementation: issue.suggestion,
          estimatedEffort: 'medium',
          estimatedImpact: issue.severity === 'critical' ? 'high' : 'medium'
        });
      }
    });

    // Performance recommendations
    performance.optimizations.forEach(optimization => {
      recommendations.push({
        category: 'performance',
        priority: optimization.priority,
        title: `Performance: ${optimization.category}`,
        description: optimization.description,
        impact: optimization.impact,
        implementation: optimization.implementation,
        estimatedEffort: optimization.difficulty === 'easy' ? 'low' : optimization.difficulty === 'medium' ? 'medium' : 'high',
        estimatedImpact: optimization.priority === 'critical' ? 'high' : optimization.priority === 'high' ? 'high' : 'medium'
      });
    });

    // Sort by priority
    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Create quality summary
   */
  private createQualitySummary(
    html: HTMLValidationServiceResult,
    accessibility: AccessibilityServiceResult,
    performance: PerformanceServiceResult,
    recommendations: QualityRecommendation[]
  ): QualitySummary {
    const criticalIssues = recommendations.filter(r => r.priority === 'critical').length;
    const highPriorityIssues = recommendations.filter(r => r.priority === 'high').length;
    const mediumPriorityIssues = recommendations.filter(r => r.priority === 'medium').length;
    const lowPriorityIssues = recommendations.filter(r => r.priority === 'low').length;

    return {
      totalIssues: recommendations.length,
      criticalIssues,
      highPriorityIssues,
      mediumPriorityIssues,
      lowPriorityIssues,
      emailClientCompatibility: html.emailCompliance.score,
      wcagCompliance: accessibility.wcagLevel === 'AA' || accessibility.wcagLevel === 'AAA' ? accessibility.score : 0,
      performanceScore: performance.score,
      overallHealthScore: this.calculateOverallScore(html, accessibility, performance)
    };
  }

  /**
   * Create test metadata
   */
  private createTestMetadata(html: string, startTime: number): TestMetadata {
    return {
      timestamp: new Date().toISOString(),
      testDuration: Date.now() - startTime,
      htmlSize: Buffer.byteLength(html, 'utf8'),
      testVersion: '1.0.0',
      environment: 'Email-Makers QA Suite',
      validationStandards: ['HTML Email Standards', 'WCAG 2.1 AA', 'Email Client Best Practices']
    };
  }

  /**
   * Get client-specific validation rules
   */
  private getClientSpecificRules(client: string): {
    criticalIssues: string[];
    recommendations: string[];
  } {
    const rules = {
      gmail: {
        criticalIssues: ['missing-doctype', 'external-css', 'unsupported-css', 'large-file-size'],
        recommendations: ['inline-css', 'table-layout', 'image-optimization']
      },
      outlook: {
        criticalIssues: ['flexbox-layout', 'grid-layout', 'css-transforms', 'external-css'],
        recommendations: ['table-layout', 'vml-fallbacks', 'conditional-comments']
      },
      'apple-mail': {
        criticalIssues: ['external-css', 'unsupported-css'],
        recommendations: ['webkit-optimization', 'retina-images', 'dark-mode-support']
      },
      yahoo: {
        criticalIssues: ['external-css', 'javascript', 'form-elements'],
        recommendations: ['inline-css', 'table-layout', 'image-optimization']
      }
    };

    return rules[client as keyof typeof rules] || {
      criticalIssues: ['external-css', 'javascript'],
      recommendations: ['inline-css', 'table-layout']
    };
  }

  /**
   * Default results for when services are disabled
   */
  private getDefaultAccessibilityResult(): AccessibilityServiceResult {
    return {
      wcagLevel: 'AA',
      score: 1,
      issues: [],
      colorContrast: [],
      altTextCoverage: 1,
      semanticStructure: true,
      keyboardAccessible: true,
      screenReaderFriendly: true,
      focusManagement: {
        hasFocusableElements: false,
        focusOrder: true,
        focusIndicators: true,
        skipLinks: false,
        score: 1,
        focusableCount: 0
      },
      summary: {
        totalIssues: 0,
        criticalIssues: 0,
        seriousIssues: 0,
        moderateIssues: 0,
        minorIssues: 0,
        passedChecks: 1,
        totalChecks: 1,
        compliancePercentage: 100
      }
    };
  }

  private getDefaultPerformanceResult(): PerformanceServiceResult {
    return {
      renderTime: 0,
      domComplexity: 0,
      cssComplexity: 0,
      imageOptimization: 1,
      cacheability: 1,
      mobileOptimization: 1,
      fileSize: {
        totalSize: 0,
        htmlSize: 0,
        cssSize: 0,
        imageEstimatedSize: 0,
        withinEmailLimits: true,
        compressionPotential: 0,
        breakdown: {
          html: { size: 0, percentage: 0 },
          css: { size: 0, percentage: 0 },
          images: { size: 0, percentage: 0 },
          other: { size: 0, percentage: 0 }
        }
      },
      loadingMetrics: {
        estimatedLoadTime: 0,
        criticalRenderingPath: 0,
        domReadyTime: 0,
        imageLoadTime: 0,
        totalElements: 0,
        criticalElements: 0
      },
      optimizations: [],
      score: 1,
      grade: 'A'
    };
  }

  /**
   * Create error result when analysis fails
   */
  private createErrorResult(html: string, startTime: number, error: any): QualityAssuranceResult {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return {
      html: {
        valid: false,
        errors: [{
          line: 0,
          column: 0,
          message: `Quality analysis failed: ${errorMessage}`,
          rule: 'analysis-error',
          severity: 'error'
        }],
        warnings: [],
        doctype: 'unknown',
        encoding: 'unknown',
        semanticScore: 0,
        emailCompliance: {
          hasValidDoctype: false,
          usesTableLayout: false,
          hasInlineStyles: false,
          imagesHaveAttributes: false,
          hasEmailFriendlyCSS: false,
          withinSizeLimit: false,
          hasValidStructure: false,
          score: 0,
          details: []
        },
        sizeAnalysis: {
          totalSize: 0,
          htmlSize: 0,
          cssSize: 0,
          imageCount: 0,
          withinGmailLimit: false,
          compressionRatio: 0
        },
        optimizations: []
      },
      accessibility: this.getDefaultAccessibilityResult(),
      performance: this.getDefaultPerformanceResult(),
      overallScore: 0,
      overallGrade: 'F',
      recommendations: [{
        category: 'general',
        priority: 'critical',
        title: 'Analysis Error',
        description: `Quality assurance analysis failed: ${errorMessage}`,
        impact: 'Unable to assess email quality',
        implementation: 'Check HTML structure and try analysis again',
        estimatedEffort: 'low',
        estimatedImpact: 'high'
      }],
      summary: {
        totalIssues: 1,
        criticalIssues: 1,
        highPriorityIssues: 0,
        mediumPriorityIssues: 0,
        lowPriorityIssues: 0,
        emailClientCompatibility: 0,
        wcagCompliance: 0,
        performanceScore: 0,
        overallHealthScore: 0
      },
      testMetadata: this.createTestMetadata(html, startTime)
    };
  }
}

// Supporting interfaces
export interface AutomatedFix {
  type: 'html' | 'accessibility' | 'performance';
  description: string;
  fix: string;
  line: number;
  column: number;
  automated: boolean;
} 