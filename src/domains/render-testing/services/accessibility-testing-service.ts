import { Page } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import { MetricsService } from '../../../shared/infrastructure/monitoring/metrics-service';

export interface AccessibilityViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  tags: string[];
  nodes: Array<{
    target: string[];
    html: string;
    failureSummary: string;
  }>;
}

export interface AccessibilityResult {
  score: number;
  violations: AccessibilityViolation[];
  passes: number;
  incomplete: number;
  inapplicable: number;
  wcagLevel: 'AA' | 'AAA';
  compliance: {
    perceivable: number;
    operable: number;
    understandable: number;
    robust: number;
  };
  recommendations: string[];
}

export interface AccessibilityTestOptions {
  wcagLevel: 'AA' | 'AAA';
  rules?: string[];
  tags?: string[];
  includeHidden?: boolean;
  timeout?: number;
}

export class AccessibilityTestingService {
  constructor(private metricsService: MetricsService) {}

  /**
   * Run comprehensive accessibility testing on email template
   */
  async testEmailAccessibility(
    page: Page,
    htmlContent: string,
    options: AccessibilityTestOptions = { wcagLevel: 'AA' }
  ): Promise<AccessibilityResult> {
    const startTime = Date.now();

    try {
      // Set HTML content
      await page.setContent(htmlContent, { waitUntil: 'networkidle' });

      // Create axe builder for email testing
      const axeBuilder = await this.configureAxeForEmail(page, options);

      // Run accessibility tests
      const results = await this.runAccessibilityTests(page, options);

      // Calculate compliance scores
      const compliance = this.calculateComplianceScores(results.violations);

      // Generate recommendations
      const recommendations = this.generateRecommendations(results.violations);

      // Calculate overall score
      const score = this.calculateAccessibilityScore(results, compliance);

      const duration = Date.now() - startTime;
      this.metricsService.recordDuration('accessibility.test.duration', duration);

      return {
        score,
        violations: results.violations,
        passes: results.passes,
        incomplete: results.incomplete,
        inapplicable: results.inapplicable,
        wcagLevel: options.wcagLevel,
        compliance,
        recommendations,
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.metricsService.recordDuration('accessibility.test.duration', duration, { success: 'false' });

      throw new Error(`Accessibility testing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Configure axe-core specifically for email template testing
   */
  private async configureAxeForEmail(page: Page, options: AccessibilityTestOptions): Promise<AxeBuilder> {
    const axeBuilder = new AxeBuilder({ page });

    // Email-specific rule configurations
    axeBuilder
      .withRules(['color-contrast', 'image-alt', 'link-name', 'heading-order'])
      .disableRules([
        'landmark-one-main', // Not applicable for emails
        'page-has-heading-one', // Not applicable for emails
        'region', // Not applicable for emails
        'skip-link', // Not applicable for emails
        'bypass', // Not applicable for emails
        'meta-viewport', // Not applicable for emails
        'document-title', // Not applicable for emails
        'html-has-lang', // Not applicable for emails
      ])
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa']);

    if (options.wcagLevel === 'AAA') {
      axeBuilder.withTags(['wcag2aaa', 'wcag21aaa']);
    }

    return axeBuilder;
  }

  /**
   * Run accessibility tests and return results
   */
  private async runAccessibilityTests(page: Page, options: AccessibilityTestOptions): Promise<{
    violations: AccessibilityViolation[];
    passes: number;
    incomplete: number;
    inapplicable: number;
  }> {
    const axeBuilder = await this.configureAxeForEmail(page, options);
    
    try {
      const results = await axeBuilder.analyze();

      return {
        violations: results.violations.map(violation => ({
          id: violation.id,
          impact: violation.impact as 'minor' | 'moderate' | 'serious' | 'critical',
          description: violation.description,
          help: violation.help,
          helpUrl: violation.helpUrl,
          tags: violation.tags,
          nodes: violation.nodes.map(node => ({
            target: Array.isArray(node.target) ? node.target.map(String) : [String(node.target)],
            html: node.html,
            failureSummary: node.failureSummary || '',
          })),
        })),
        passes: results.passes?.length || 0,
        incomplete: results.incomplete?.length || 0,
        inapplicable: results.inapplicable?.length || 0,
      };

    } catch (error) {
      throw new Error(`Accessibility testing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate WCAG compliance scores by principle
   */
  private calculateComplianceScores(violations: AccessibilityViolation[]): {
    perceivable: number;
    operable: number;
    understandable: number;
    robust: number;
  } {
    const principleMapping = {
      perceivable: ['color-contrast', 'image-alt', 'audio-caption', 'video-caption'],
      operable: ['link-name', 'button-name', 'keyboard', 'focus-order-semantics'],
      understandable: ['heading-order', 'label', 'language', 'consistent-navigation'],
      robust: ['valid-lang', 'duplicate-id', 'aria-valid-attr', 'aria-required-attr'],
    };

    const scores = {
      perceivable: 100,
      operable: 100,
      understandable: 100,
      robust: 100,
    };

    violations.forEach(violation => {
      const impactWeight = this.getImpactWeight(violation.impact);
      
      Object.entries(principleMapping).forEach(([principle, rules]) => {
        if (rules.some(rule => violation.id.includes(rule))) {
          scores[principle as keyof typeof scores] -= impactWeight;
        }
      });
    });

    // Ensure scores don't go below 0
    Object.keys(scores).forEach(key => {
      scores[key as keyof typeof scores] = Math.max(0, scores[key as keyof typeof scores]);
    });

    return scores;
  }

  /**
   * Get impact weight for scoring
   */
  private getImpactWeight(impact: string): number {
    switch (impact) {
      case 'critical': return 25;
      case 'serious': return 15;
      case 'moderate': return 10;
      case 'minor': return 5;
      default: return 5;
    }
  }

  /**
   * Calculate overall accessibility score
   */
  private calculateAccessibilityScore(
    results: { violations: AccessibilityViolation[]; passes: number },
    compliance: { perceivable: number; operable: number; understandable: number; robust: number }
  ): number {
    const totalViolations = results.violations.length;
    const totalPasses = results.passes;
    
    if (totalViolations === 0 && totalPasses > 0) {
      return 100;
    }

    if (totalPasses === 0) {
      return 0;
    }

    // Calculate weighted score based on violation impacts
    let violationPenalty = 0;
    results.violations.forEach(violation => {
      violationPenalty += this.getImpactWeight(violation.impact);
    });

    // Base score from compliance principles
    const principleScore = (
      compliance.perceivable +
      compliance.operable +
      compliance.understandable +
      compliance.robust
    ) / 4;

    // Final score considering both principles and specific violations
    const finalScore = Math.max(0, principleScore - (violationPenalty / 2));

    return Math.round(finalScore);
  }

  /**
   * Generate actionable recommendations based on violations
   */
  private generateRecommendations(violations: AccessibilityViolation[]): string[] {
    const recommendations: string[] = [];
    const violationTypes = new Set(violations.map(v => v.id));

    // Color contrast recommendations
    if (violationTypes.has('color-contrast')) {
      recommendations.push(
        'Improve color contrast ratios to meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text)'
      );
    }

    // Image alt text recommendations
    if (violations.some(v => v.id.includes('image-alt'))) {
      recommendations.push(
        'Add descriptive alt text to all images. Use empty alt="" for decorative images'
      );
    }

    // Link accessibility recommendations
    if (violations.some(v => v.id.includes('link-name'))) {
      recommendations.push(
        'Ensure all links have descriptive text. Avoid "click here" or "read more" without context'
      );
    }

    // Table accessibility recommendations
    if (violations.some(v => v.id.includes('table'))) {
      recommendations.push(
        'Add proper table headers and captions for data tables. Use scope attributes for complex tables'
      );
    }

    // Heading structure recommendations
    if (violations.some(v => v.id.includes('heading'))) {
      recommendations.push(
        'Maintain proper heading hierarchy (h1, h2, h3) and ensure headings describe content structure'
      );
    }

    // ARIA recommendations
    if (violations.some(v => v.id.includes('aria'))) {
      recommendations.push(
        'Fix ARIA attributes and ensure they are properly implemented for screen readers'
      );
    }

    // General email accessibility recommendations
    recommendations.push(
      'Test email template with screen readers and keyboard navigation',
      'Ensure email is readable with images disabled',
      'Use semantic HTML elements for better accessibility'
    );

    return recommendations;
  }
}