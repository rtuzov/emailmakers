import * as cheerio from 'cheerio';
// import { AxeResults } from 'axe-core'; // Currently unused
// import { run as axeRun } from 'axe-core'; // Currently unused

export interface AccessibilityResult {
  wcagLevel: 'A' | 'AA' | 'AAA' | 'fail';
  score: number; // 0-1
  issues: AccessibilityIssue[];
  colorContrast: ContrastResult[];
  altTextCoverage: number; // 0-1
  semanticStructure: boolean;
  keyboardAccessible: boolean;
  screenReaderFriendly: boolean;
  focusManagement: FocusManagementResult;
  summary: AccessibilitySummary;
}

export interface AccessibilityIssue {
  rule: string;
  severity: 'minor' | 'moderate' | 'serious' | 'critical';
  element: string;
  description: string;
  suggestion: string;
  wcagReference: string;
  impact: string;
  xpath?: string;
  html?: string;
}

export interface ContrastResult {
  foreground: string;
  background: string;
  ratio: number;
  level: 'AA' | 'AAA' | 'fail';
  element: string;
  text: string;
  passed: boolean;
  fontSize: number;
  fontWeight: string;
  requiredRatio: number;
}

export interface FocusManagementResult {
  hasFocusableElements: boolean;
  focusOrder: boolean;
  focusIndicators: boolean;
  skipLinks: boolean;
  score: number;
  focusableCount: number;
}

export interface AccessibilitySummary {
  totalIssues: number;
  criticalIssues: number;
  seriousIssues: number;
  moderateIssues: number;
  minorIssues: number;
  passedChecks: number;
  totalChecks: number;
  compliancePercentage: number;
}

/**
 * Enhanced Accessibility Testing Service
 * 
 * Provides comprehensive accessibility testing for email templates:
 * - WCAG 2.1 AA compliance testing with detailed analysis
 * - Accurate color contrast analysis using WCAG algorithms
 * - Alt text validation and coverage assessment
 * - Semantic structure assessment for screen readers
 * - Keyboard accessibility evaluation
 * - Focus management testing
 * - Screen reader compatibility analysis
 */
export class AccessibilityTestingService {
  private contrastThresholds = {
    AA_NORMAL: 4.5,
    AA_LARGE: 3.0,
    AAA_NORMAL: 7.0,
    AAA_LARGE: 4.5
  };

  constructor() {}

  /**
   * Run comprehensive accessibility testing
   */
  async testAccessibility(html: string): Promise<AccessibilityResult> {
    try {
      // Custom accessibility analysis for email templates
      const violations = this.detectAccessibilityViolations(cheerio.load(html));
      const colorContrast = await this.analyzeColorContrast(html);
      const altTextCoverage = this.analyzeAltTextCoverage(html);
      const semanticStructure = this.validateSemanticStructure(html);
      const keyboardAccessible = this.checkKeyboardAccessibility(html);
      const screenReaderFriendly = this.checkScreenReaderCompatibility(html);
      const focusManagement = this.assessFocusManagement(html);

      const issues = violations;
      const summary = this.generateSummary(issues, colorContrast, altTextCoverage, semanticStructure);
      const score = this.calculateAccessibilityScore(
        issues, 
        altTextCoverage, 
        semanticStructure, 
        keyboardAccessible, 
        screenReaderFriendly, 
        focusManagement
      );
      const wcagLevel = this.determineWCAGLevel(score, issues);

      return {
        wcagLevel,
        score,
        issues,
        colorContrast,
        altTextCoverage,
        semanticStructure,
        keyboardAccessible,
        screenReaderFriendly,
        focusManagement,
        summary
      };
    } catch (error) {
      console.error('Accessibility testing failed:', error);
      return {
        wcagLevel: 'fail',
        score: 0,
        issues: [],
        colorContrast: [],
        altTextCoverage: 0,
        semanticStructure: false,
        keyboardAccessible: false,
        screenReaderFriendly: false,
        focusManagement: {
          hasFocusableElements: false,
          focusOrder: false,
          focusIndicators: false,
          skipLinks: false,
          score: 0,
          focusableCount: 0
        },
        summary: {
          totalIssues: 0,
          criticalIssues: 0,
          seriousIssues: 0,
          moderateIssues: 0,
          minorIssues: 0,
          passedChecks: 0,
          totalChecks: 0,
          compliancePercentage: 0
        }
      };
    }
  }



  /**
   * Comprehensive accessibility violation detection
   */
  private detectAccessibilityViolations($: cheerio.Root): AccessibilityIssue[] {
    const violations: AccessibilityIssue[] = [];

    // Check for images without alt text
    $('img').each((_, element) => {
      const $element = $(element);
      if (!$element.attr('alt')) {
        violations.push({
          rule: 'images-have-alt-text',
          severity: 'critical',
          description: 'Images must have alternative text',
          element: (element as any).tagName?.toLowerCase() || 'img',
          suggestion: 'Add alt attribute to images',
          wcagReference: 'WCAG 2.1 SC 1.1.1',
          impact: 'serious',
          xpath: this.getElementXPath($element)
        });
      }
    });

    // Check heading hierarchy (remove duplicate)
    const headings = $('h1, h2, h3, h4, h5, h6').toArray();
    let lastLevel = 0;
    
    headings.forEach((heading) => {
      const $heading = $(heading);
      const level = parseInt((heading as any).tagName?.substring(1) || '1');
      
      if (level > lastLevel + 1) {
        violations.push({
          rule: 'heading-hierarchy',
          severity: 'moderate',
          description: `Heading level ${level} skips hierarchy (previous was ${lastLevel})`,
          element: (heading as any).tagName?.toLowerCase() || 'h1',
          suggestion: 'Ensure heading levels increase by only one level at a time',
          wcagReference: 'WCAG 2.1 SC 1.3.1',
          impact: 'moderate',
          xpath: this.getElementXPath($heading)
        });
      }
      
      lastLevel = level;
    });

    // Check for links without accessible names
    const linksWithoutText = $('a').filter((_i, el) => {
      const $link = $(el);
      const text = $link.text().trim();
      const ariaLabel = $link.attr('aria-label');
      const title = $link.attr('title');
      return !text && !ariaLabel && !title;
    });

    if (linksWithoutText.length > 0) {
      violations.push({
        rule: 'link-name',
        severity: 'serious',
        description: 'Links must have discernible text',
        element: 'a',
        suggestion: 'Add descriptive text, aria-label, or title attribute to links',
        wcagReference: 'WCAG 2.1 SC 2.4.4',
        impact: 'serious',
        xpath: this.getElementXPath(linksWithoutText.first())
      });
    }

    // Check for missing language attribute
    const htmlElement = $('html');
    if (htmlElement.length > 0 && !htmlElement.attr('lang')) {
      violations.push({
        rule: 'html-has-lang',
        severity: 'serious',
        description: 'html element must have a lang attribute',
        element: 'html',
        suggestion: 'Add lang attribute to html element (e.g., lang="en")',
        wcagReference: 'WCAG 2.1 SC 3.1.1',
        impact: 'serious',
        xpath: '/html'
      });
    }

    // Check for tables without headers
    const tables = $('table');
    tables.each((_i, table) => {
      const $table = $(table);
      const hasHeaders = $table.find('th, thead').length > 0;
      const hasScope = $table.find('[scope]').length > 0;
      
      if (!hasHeaders && !hasScope && $table.find('td').length > 3) {
        violations.push({
          rule: 'table-headers',
          severity: 'serious',
          description: 'Data tables should have table headers',
          element: 'table',
          suggestion: 'Add th elements or thead section to provide table headers',
          wcagReference: 'WCAG 2.1 SC 1.3.1',
          impact: 'serious',
          xpath: this.getElementXPath($table)
        });
      }
    });

    return violations;
  }



  /**
   * Enhanced color contrast analysis using WCAG algorithms
   */
  private async analyzeColorContrast(html: string): Promise<ContrastResult[]> {
    const $ = cheerio.load(html);
    const results: ContrastResult[] = [];

    // Analyze all text elements
    const textElements = $('p, h1, h2, h3, h4, h5, h6, span, div, td, th, li, a, strong, em, small').filter((_i, el) => {
      return $(el).text().trim().length > 0;
    });

    textElements.each((_i, element) => {
      const $el = $(element);
      const text = $el.text().trim();
      
      if (text.length === 0) return;

      // Extract colors from inline styles or computed styles
      const foreground = this.getTextColor($el);
      const background = this.getBackgroundColor($el);
      
      if (foreground && background) {
        const ratio = this.calculateContrastRatio(foreground, background);
        const fontSize = this.getFontSize($el);
        const fontWeight = this.getFontWeight($el);
        const isLargeText = this.isLargeText(fontSize, fontWeight);
        
        const requiredRatio = isLargeText ? this.contrastThresholds.AA_LARGE : this.contrastThresholds.AA_NORMAL;
        const level = this.determineContrastLevel(ratio, isLargeText);
        
        results.push({
          foreground,
          background,
          ratio: Math.round(ratio * 100) / 100,
          level,
          element: (element as any).tagName?.toLowerCase() || 'unknown',
          text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
          passed: ratio >= requiredRatio,
          fontSize,
          fontWeight,
          requiredRatio
        });
      }
    });

    return results;
  }

  /**
   * Analyze alt text coverage for images
   */
  private analyzeAltTextCoverage(html: string): number {
    const $ = cheerio.load(html);
    const images = $('img');
    
    if (images.length === 0) {
      return 1; // Perfect score if no images
    }

    let imagesWithAlt = 0;
    let totalImages = 0;

    images.each((_, element) => {
      const $img = $(element);
      const alt = $img.attr('alt');
      const src = $img.attr('src') || '';
      
      totalImages++;
      
      // Check if image has meaningful alt text
      if (alt !== undefined) {
        // Empty alt is acceptable for decorative images
        if (alt === '' && this.isDecorativeImage(src, alt)) {
          imagesWithAlt++;
        } else if (alt.trim().length > 0) {
          imagesWithAlt++;
        }
      }
    });

    return totalImages > 0 ? imagesWithAlt / totalImages : 1;
  }

  /**
   * Validate semantic structure of HTML
   */
  private validateSemanticStructure(html: string): boolean {
    const $ = cheerio.load(html);
    let score = 0;
    let totalChecks = 0;

    // Check for proper heading hierarchy
    const headings = $('h1, h2, h3, h4, h5, h6');
    if (headings.length > 0) {
      totalChecks++;
      let hasProperHierarchy = true;
      let lastLevel = 0;
      
      headings.each((_, heading) => {
        const level = parseInt((heading as any).tagName?.substring(1) || '1');
        if (level > lastLevel + 1 && lastLevel > 0) {
          hasProperHierarchy = false;
        }
        lastLevel = level;
      });
      
      if (hasProperHierarchy) score++;
    }

    // Check for semantic HTML5 elements
    totalChecks++;
    const semanticElements = $('main, article, section, nav, header, footer, aside');
    if (semanticElements.length > 0) {
      score++;
    }

    // Check for proper list structure
    const lists = $('ul, ol');
    if (lists.length > 0) {
      totalChecks++;
      let hasProperListStructure = true;
      
      lists.each((_, list) => {
        const $list = $(list);
        const listItems = $list.find('> li');
        if (listItems.length === 0) {
          hasProperListStructure = false;
        }
      });
      
      if (hasProperListStructure) score++;
    }

    // Check for proper table structure
    const tables = $('table');
    if (tables.length > 0) {
      totalChecks++;
      let hasProperTableStructure = true;
      
      tables.each((_, table) => {
        const $table = $(table);
        const headers = $table.find('th');
        const caption = $table.find('caption');
        
        // Tables should have headers or caption for accessibility
        if (headers.length === 0 && caption.length === 0) {
          hasProperTableStructure = false;
        }
      });
      
      if (hasProperTableStructure) score++;
    }

    // Check for proper form structure
    const forms = $('form');
    if (forms.length > 0) {
      totalChecks++;
      let hasProperFormStructure = true;
      
      forms.each((_, form) => {
        const $form = $(form);
        const inputs = $form.find('input, textarea, select');
        
        inputs.each((_, input) => {
          const $input = $(input);
          const id = $input.attr('id');
          const label = $form.find(`label[for="${id}"]`);
          const ariaLabel = $input.attr('aria-label');
          const ariaLabelledby = $input.attr('aria-labelledby');
          
          // Inputs should have associated labels or aria attributes
          if (!label.length && !ariaLabel && !ariaLabelledby) {
            hasProperFormStructure = false;
          }
        });
      });
      
      if (hasProperFormStructure) score++;
    }

    // If no specific elements to check, consider basic HTML structure
    if (totalChecks === 0) {
      totalChecks = 1;
      // Check for basic semantic elements like paragraphs, divs with meaningful content
      const contentElements = $('p, div, span').filter((_, el) => {
        return $(el).text().trim().length > 0;
      });
      if (contentElements.length > 0) {
        score = 1;
      }
    }

    return totalChecks > 0 ? (score / totalChecks) >= 0.7 : false;
  }

  /**
   * Check keyboard accessibility
   */
  private checkKeyboardAccessibility(html: string): boolean {
    const $ = cheerio.load(html);
    
    // Check for interactive elements
    const interactiveElements = $('a, button, input, select, textarea, [tabindex]');
    
    if (interactiveElements.length === 0) return true; // No interactive elements to check
    
    let accessibleElements = 0;
    
    interactiveElements.each((_i, element) => {
      const $el = $(element);
      const tagName = (element as any).tagName?.toLowerCase() || 'unknown';
      
      // Check if element is keyboard accessible
      const hasTabindex = $el.attr('tabindex') !== undefined;
      const isNaturallyFocusable = ['a', 'button', 'input', 'select', 'textarea'].includes(tagName);
      const tabindexValue = parseInt($el.attr('tabindex') || '0');
      
      // Element is accessible if it's naturally focusable or has positive tabindex
      if (isNaturallyFocusable && tabindexValue !== -1) {
        accessibleElements++;
      } else if (hasTabindex && tabindexValue >= 0) {
        accessibleElements++;
      }
    });
    
    // If most elements are accessible, consider it keyboard accessible
    return interactiveElements.length === 0 || (accessibleElements / interactiveElements.length) >= 0.8;
  }

  /**
   * Check screen reader compatibility
   */
  private checkScreenReaderCompatibility(html: string): boolean {
    const $ = cheerio.load(html);
    let score = 0;
    let maxScore = 0;

    // Check for proper ARIA labels and text content
    maxScore += 30;
    const interactiveElements = $('a, button, input, select, textarea');
    
    if (interactiveElements.length > 0) {
      let elementsWithLabels = 0;
      
      interactiveElements.each((_, element) => {
        const $el = $(element);
        const text = $el.text().trim();
        const ariaLabel = $el.attr('aria-label');
        const ariaLabelledby = $el.attr('aria-labelledby');
        const id = $el.attr('id');
        const label = id ? $(`label[for="${id}"]`) : $('');
        
        if (text || ariaLabel || ariaLabelledby || label.length > 0) {
          elementsWithLabels++;
        }
      });
      
      const labelCoverage = elementsWithLabels / interactiveElements.length;
      score += labelCoverage * 30;
    } else {
      score += 30; // No interactive elements to label
    }

    // Check for proper heading structure or semantic elements
    maxScore += 25;
    const headings = $('h1, h2, h3, h4, h5, h6');
    const semanticElements = $('main, article, section, nav, header, footer');
    if (headings.length > 0 || semanticElements.length > 0) {
      score += 25;
    }

    // Check for alt text on images
    maxScore += 25;
    const images = $('img');
    const imagesWithAlt = $('img[alt]');
    if (images.length === 0 || images.length === imagesWithAlt.length) {
      score += 25;
    }

    // Check for meaningful content structure
    maxScore += 20;
    const contentElements = $('p, div, span, td, th').filter((_, el) => {
      return $(el).text().trim().length > 0;
    });
    if (contentElements.length > 0) {
      score += 20;
    }

    return (score / maxScore) >= 0.75; // 75% threshold for better compatibility
  }

  /**
   * Assess focus management
   */
  private assessFocusManagement(html: string): FocusManagementResult {
    const $ = cheerio.load(html);
    
    const focusableElements = $('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const focusableCount = focusableElements.length;
    
    let score = 0;
    let maxScore = 0;

    // Check if there are focusable elements
    maxScore += 25;
    const hasFocusableElements = focusableCount > 0;
    if (hasFocusableElements) score += 25;

    // Check focus order (simplified - check for logical tabindex values)
    maxScore += 25;
    let focusOrder = true;
    if (focusableCount > 0) {
      const tabindexValues: number[] = [];
      focusableElements.each((_i, el) => {
        const tabindex = parseInt($(el).attr('tabindex') || '0');
        tabindexValues.push(tabindex);
      });
      
      // Check if tabindex values are in logical order
      const positiveTabindexes = tabindexValues.filter(val => val > 0).sort((a, b) => a - b);
      const hasLogicalOrder = positiveTabindexes.length === 0 || 
        positiveTabindexes.every((val, i) => i === 0 || val >= (positiveTabindexes[i - 1] || 0));
      
      if (hasLogicalOrder) score += 25;
    } else {
      score += 25; // No focusable elements is fine
    }

    // Check for focus indicators (simplified - check for CSS focus styles)
    maxScore += 25;
    const hasFocusStyles = html.includes(':focus') || html.includes('outline');
    if (hasFocusStyles) score += 25;

    // Check for skip links (not typically needed in emails)
    maxScore += 25;
    const skipLinks = $('a[href^="#"]').filter((_i, el) => {
      const text = $(el).text().toLowerCase();
      return text.includes('skip') || text.includes('jump');
    });
    const hasSkipLinks = skipLinks.length > 0;
    
    // For emails, skip links are not required, so give full score
    score += 25;

    return {
      hasFocusableElements,
      focusOrder: focusOrder,
      focusIndicators: hasFocusStyles,
      skipLinks: hasSkipLinks,
      score: score / maxScore,
      focusableCount
    };
  }

  /**
   * Compile accessibility issues from various tests
   */
  /*
  private _compileAccessibilityIssues(axeResults: AxeResults, _contrastResults: ContrastResult[]): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];

    // Add axe violations
    axeResults.violations.forEach(violation => {
      violation.nodes.forEach(node => {
        issues.push({
          rule: violation.id,
          severity: this.mapAxeImpactToSeverity(violation.impact || 'minor'),
          element: node.target ? (typeof node.target === 'string' ? node.target : String(node.target[0])) : 'unknown',
          description: violation.description,
          suggestion: this.getFixSuggestion(violation.id),
          wcagReference: this.getWCAGReference(violation.id),
          impact: violation.impact || 'minor',
          xpath: Array.isArray(node.xpath) ? node.xpath[0] : node.xpath,
          html: node.html
        });
      });
    });

    // Add contrast issues
    contrastResults.forEach(result => {
      if (!result.passed) {
        issues.push({
          rule: 'color-contrast',
          severity: result.ratio < 3.0 ? 'critical' : 'serious',
          element: result.element,
          description: `Insufficient color contrast ratio: ${result.ratio}:1 (required: ${result.requiredRatio}:1)`,
          suggestion: 'Increase the contrast between foreground and background colors',
          wcagReference: 'WCAG 2.1 AA 1.4.3',
          impact: 'serious'
        });
      }
    });

    return issues;
  }
  */

  /**
   * Generate accessibility summary
   */
  private generateSummary(
    issues: AccessibilityIssue[],
    contrastResults: ContrastResult[],
    altTextCoverage: number,
    semanticStructure: boolean
  ): AccessibilitySummary {
    const criticalIssues = issues.filter(i => (i || {}).severity === 'critical').length;
    const seriousIssues = issues.filter(i => (i || {}).severity === 'serious').length;
    const moderateIssues = issues.filter(i => (i || {}).severity === 'moderate').length;
    const minorIssues = issues.filter(i => (i || {}).severity === 'minor').length;

    const totalChecks = issues.length + contrastResults.length + 2; // +2 for alt text and semantic structure
    const passedChecks = contrastResults.filter(r => r.passed).length + 
                        (altTextCoverage >= 0.9 ? 1 : 0) + 
                        (semanticStructure ? 1 : 0);

    const compliancePercentage = totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 100;

    return {
      totalIssues: issues.length,
      criticalIssues,
      seriousIssues,
      moderateIssues,
      minorIssues,
      passedChecks,
      totalChecks,
      compliancePercentage: Math.round(compliancePercentage)
    };
  }

  /**
   * Calculate accessibility score based on multiple factors
   */
  private calculateAccessibilityScore(
    issues: AccessibilityIssue[],
    altTextCoverage: number,
    semanticStructure: boolean,
    keyboardAccessible: boolean,
    screenReaderFriendly: boolean,
    focusManagement: FocusManagementResult
  ): number {
    let score = 1.0;

    // Deduct points for issues
    const criticalIssues = issues.filter(i => (i || {}).severity === 'critical').length;
    const seriousIssues = issues.filter(i => (i || {}).severity === 'serious').length;
    const moderateIssues = issues.filter(i => (i || {}).severity === 'moderate').length;
    const minorIssues = issues.filter(i => (i || {}).severity === 'minor').length;

    score -= (criticalIssues * 0.3);
    score -= (seriousIssues * 0.2);
    score -= (moderateIssues * 0.1);
    score -= (minorIssues * 0.05);

    // Factor in coverage and capabilities
    score *= altTextCoverage;
    score *= (semanticStructure ? 1.0 : 0.7);
    score *= (keyboardAccessible ? 1.0 : 0.8);
    score *= (screenReaderFriendly ? 1.0 : 0.8);
    score *= (focusManagement.score);

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Determine WCAG compliance level
   */
  private determineWCAGLevel(score: number, issues: AccessibilityIssue[]): 'A' | 'AA' | 'AAA' | 'fail' {
    const criticalIssues = issues.filter(i => (i || {}).severity === 'critical').length;
    const seriousIssues = issues.filter(i => (i || {}).severity === 'serious').length;
    
    if (criticalIssues > 0 || score < 0.5) return 'fail';
    if (seriousIssues > 0 || score < 0.7) return 'A';
    if (score < 0.85) return 'AA';
    return 'AAA';
  }

  // Helper methods for color analysis
  private getTextColor($el: cheerio.Cheerio): string | null {
    const style = $el.attr('style') || '';
    const colorMatch = style.match(/color:\s*([^;]+)/i);
    return colorMatch ? colorMatch[1]?.trim() || null : '#000000'; // Default to black
  }

  private getBackgroundColor($el: cheerio.Cheerio): string | null {
    const style = $el.attr('style') || '';
    const bgMatch = style.match(/background(?:-color)?:\s*([^;]+)/i);
    
    if (bgMatch) {
      return bgMatch[1]?.trim() || null;
    }
    
    // Check parent elements for background
    let parent = $el.parent();
    while (parent.length > 0) {
      const parentStyle = parent.attr('style') || '';
      const parentBgMatch = parentStyle.match(/background(?:-color)?:\s*([^;]+)/i);
      if (parentBgMatch?.[1]) {
        return parentBgMatch[1].trim();
      }
      parent = parent.parent();
    }
    
    return '#ffffff'; // Default to white
  }

  private getFontSize($el: cheerio.Cheerio): number {
    const style = $el.attr('style') || '';
    const sizeMatch = style.match(/font-size:\s*(\d+)px/i);
    return sizeMatch ? parseInt(sizeMatch[1] || '16') : 16; // Default to 16px
  }

  private getFontWeight($el: cheerio.Cheerio): string {
    const style = $el.attr('style') || '';
    const weightMatch = style.match(/font-weight:\s*([^;]+)/i);
    return weightMatch?.[1]?.trim() ?? 'normal';
  }

  private isLargeText(fontSize: number, fontWeight: string): boolean {
    if (fontSize >= 24) return true;
    if (fontSize >= 18 && (fontWeight === 'bold' || fontWeight === '700' || parseInt(fontWeight) >= 700)) return true;
    return false;
  }

  private isDecorativeImage(src: string, alt?: string): boolean {
    const decorativeKeywords = ['decoration', 'spacer', 'divider', 'border', 'background'];
    const srcLower = src.toLowerCase();
    
    if (alt === '') return true; // Explicitly marked as decorative
    
    return decorativeKeywords.some(keyword => srcLower.includes(keyword));
  }

  /**
   * Calculate color contrast ratio using WCAG algorithm
   */
  private calculateContrastRatio(foreground: string, background: string): number {
    const fgLuminance = this.getLuminance(foreground);
    const bgLuminance = this.getLuminance(background);
    
    const lighter = Math.max(fgLuminance, bgLuminance);
    const darker = Math.min(fgLuminance, bgLuminance);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Calculate relative luminance according to WCAG
   */
  private getLuminance(color: string): number {
    // Convert color to RGB
    const rgb = this.hexToRgb(color) || this.parseRgb(color);
    if (!rgb) return 0;

    // Convert to relative luminance
    const rsRGB = rgb.r / 255;
    const gsRGB = rgb.g / 255;
    const bsRGB = rgb.b / 255;

    const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1] || '0', 16),
      g: parseInt(result[2] || '0', 16),
      b: parseInt(result[3] || '0', 16)
    } : null;
  }

  private parseRgb(rgb: string): { r: number; g: number; b: number } | null {
    const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    return match ? {
      r: parseInt(match[1] || '0'),
      g: parseInt(match[2] || '0'),
      b: parseInt(match[3] || '0')
    } : null;
  }

  private determineContrastLevel(ratio: number, isLargeText: boolean): 'AA' | 'AAA' | 'fail' {
    if (isLargeText) {
      if (ratio >= this.contrastThresholds.AAA_LARGE) return 'AAA';
      if (ratio >= this.contrastThresholds.AA_LARGE) return 'AA';
    } else {
      if (ratio >= this.contrastThresholds.AAA_NORMAL) return 'AAA';
      if (ratio >= this.contrastThresholds.AA_NORMAL) return 'AA';
    }
    return 'fail';
  }



  private getElementXPath($element: cheerio.Cheerio): string {
    if ($element.length === 0) return '';
    const element = $element.get(0);
    if (!element) return '';
    // Simple xpath generation for email templates
    const tagName = (element as any).tagName?.toLowerCase() || 'unknown';
    return `//${tagName}`;
  }

  /*
  private mapAxeImpactToSeverity(impact: string): 'minor' | 'moderate' | 'serious' | 'critical' {
    switch (impact) {
      case 'critical': return 'critical';
      case 'serious': return 'serious';
      case 'moderate': return 'moderate';
      case 'minor': return 'minor';
      default: return 'moderate';
    }
  }

  private getFixSuggestion(ruleId: string): string {
    const suggestions: Record<string, string> = {
      'image-alt': 'Add descriptive alt text to images. Use empty alt="" for decorative images.',
      'link-name': 'Ensure links have descriptive text, aria-label, or title attributes.',
      'color-contrast': 'Increase contrast between text and background colors to meet WCAG AA standards.',
      'heading-order': 'Use heading levels in logical order (h1, then h2, then h3, etc.).',
      'html-has-lang': 'Add a lang attribute to the html element (e.g., <html lang="en">).',
      'table-headers': 'Add table headers using <th> elements or scope attributes.'
    };
    
    return suggestions[ruleId] || 'Review the element to ensure it meets accessibility standards.';
  }

  private getWCAGReference(ruleId: string): string {
    const references: Record<string, string> = {
      'image-alt': 'WCAG 2.1 AA 1.1.1',
      'link-name': 'WCAG 2.1 AA 2.4.4',
      'color-contrast': 'WCAG 2.1 AA 1.4.3',
      'heading-order': 'WCAG 2.1 AA 1.3.1',
      'html-has-lang': 'WCAG 2.1 AA 3.1.1',
      'table-headers': 'WCAG 2.1 AA 1.3.1'
    };
    
    return references[ruleId] || 'WCAG 2.1 AA';
  }
  */
} 