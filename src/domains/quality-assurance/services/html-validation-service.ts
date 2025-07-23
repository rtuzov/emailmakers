import * as cheerio from 'cheerio';
import { HtmlValidate } from 'html-validate';
import { minify } from 'html-minifier-terser';

export interface HTMLValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  doctype: string;
  encoding: string;
  semanticScore: number;
  emailCompliance: EmailComplianceResult;
  sizeAnalysis: SizeAnalysis;
  optimizations: OptimizationSuggestion[];
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

export interface EmailComplianceResult {
  hasValidDoctype: boolean;
  usesTableLayout: boolean;
  hasInlineStyles: boolean;
  imagesHaveAttributes: boolean;
  hasEmailFriendlyCSS: boolean;
  withinSizeLimit: boolean;
  hasValidStructure: boolean;
  score: number; // 0-1
  details: ComplianceDetail[];
}

export interface ComplianceDetail {
  check: string;
  passed: boolean;
  message: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
}

export interface SizeAnalysis {
  totalSize: number;
  htmlSize: number;
  cssSize: number;
  imageCount: number;
  withinGmailLimit: boolean; // 102KB limit
  compressionRatio: number;
}

export interface OptimizationSuggestion {
  type: 'html' | 'css' | 'images' | 'structure';
  priority: 'high' | 'medium' | 'low';
  description: string;
  potentialSavings: string;
  implementation: string;
}

/**
 * Enhanced HTML Validation Service
 * 
 * Provides comprehensive HTML validation specifically designed for email templates:
 * - Standard HTML validation using html-validate
 * - Email-specific compliance checking (DOCTYPE, table layout, inline CSS)
 * - Performance and size analysis with Gmail limits
 * - Semantic structure validation
 * - Cross-client compatibility validation
 * - Optimization suggestions
 */
export class HTMLValidationService {
  private htmlValidator: HtmlValidate;
  private emailFriendlyCSS: Set<string>;
  private unsupportedCSS: Set<string>;

  constructor() {
    // Configure html-validate for email-specific rules
    this.htmlValidator = new HtmlValidate({
      rules: {
        'doctype-html': 'error',
        'no-inline-style': 'off', // Allow inline styles for email
        'element-required-attributes': 'error',
        'attribute-boolean-style': 'error',
        'no-deprecated-attr': 'error',
        'no-unknown-elements': 'error',
        'void-style': 'error',
        'no-missing-close': 'error',
        'close-order': 'error',
        'no-dup-attr': 'error',
        'no-dup-id': 'error',
        'valid-id': 'error',
        'attr-quotes': 'error',
        'tag-name-case': 'error',
        'attr-case': 'error'
      }
    });

    // Email-friendly CSS properties
    this.emailFriendlyCSS = new Set([
      'background', 'background-color', 'background-image', 'background-repeat',
      'background-position', 'border', 'border-color', 'border-style', 'border-width',
      'border-top', 'border-right', 'border-bottom', 'border-left',
      'color', 'font', 'font-family', 'font-size', 'font-style', 'font-weight',
      'height', 'width', 'line-height', 'margin', 'margin-top', 'margin-right',
      'margin-bottom', 'margin-left', 'padding', 'padding-top', 'padding-right',
      'padding-bottom', 'padding-left', 'text-align', 'text-decoration',
      'vertical-align', 'display', 'float', 'clear'
    ]);

    // CSS properties not supported in email clients
    this.unsupportedCSS = new Set([
      'flexbox', 'grid', 'position', 'z-index', 'transform', 'transition',
      'animation', 'box-shadow', 'text-shadow', 'border-radius', 'opacity',
      'max-width', 'min-width', 'max-height', 'min-height'
    ]);
  }

  /**
   * Validate HTML for email template compliance
   */
  async validateEmailHTML(html: string): Promise<HTMLValidationResult> {
    try {
      // Step 1: Standard HTML validation
      const htmlValidation = await this.validateStandardHTML(html);
      
      // Step 2: Email-specific compliance checking
      const emailCompliance = this.validateEmailCompliance(html);
      
      // Step 3: Calculate semantic score
      const semanticScore = this.calculateSemanticScore(html);
      
      // Step 4: Size analysis
      const sizeAnalysis = this.analyzeSizes(html);
      
      // Step 5: Generate optimization suggestions
      const optimizations = this.generateOptimizations(html, emailCompliance, sizeAnalysis);
      
      // Step 6: Extract document metadata
      const doctype = this.extractDoctype(html);
      const encoding = this.extractEncoding(html);

      return {
        valid: htmlValidation.valid && emailCompliance.score > 0.8,
        errors: htmlValidation.errors,
        warnings: htmlValidation.warnings,
        doctype,
        encoding,
        semanticScore,
        emailCompliance,
        sizeAnalysis,
        optimizations
      };
    } catch (error) {
      console.error('HTML validation failed:', error);
      return {
        valid: false,
        errors: [{
          line: 0,
          column: 0,
          message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          rule: 'validation-error',
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
      };
    }
  }

  /**
   * Standard HTML validation using html-validate
   */
  private async validateStandardHTML(html: string): Promise<{
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
  }> {
    const report = this.htmlValidator.validateString(html);
    
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (const result of (await report).results) {
      for (const message of result.messages) {
        const item = {
          line: message.line || 0,
          column: message.column || 0,
          message: message.message,
          rule: message.ruleId || 'unknown',
          severity: message.severity === 2 ? 'error' as const : 'warning' as const
        };

        if (message.severity === 2) {
          errors.push(item);
        } else {
          warnings.push({
            ...item,
            impact: this.determineImpact(message.ruleId || '')
          });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Enhanced email-specific compliance validation
   */
  private validateEmailCompliance(html: string): EmailComplianceResult {
    const $ = cheerio.load(html);
    const details: ComplianceDetail[] = [];
    
    // Check for valid email doctype
    const hasValidDoctype = this.hasValidEmailDoctype(html);
    details.push({
      check: 'DOCTYPE',
      passed: hasValidDoctype,
      message: hasValidDoctype 
        ? 'Valid XHTML 1.0 Transitional DOCTYPE found'
        : 'Missing or invalid DOCTYPE. Use XHTML 1.0 Transitional for email compatibility',
      importance: 'critical'
    });
    
    // Check for table-based layout
    const usesTableLayout = this.usesTableLayout($);
    details.push({
      check: 'Table Layout',
      passed: usesTableLayout,
      message: usesTableLayout
        ? 'Table-based layout detected'
        : 'No table-based layout found. Email clients require table layouts for consistent rendering',
      importance: 'critical'
    });
    
    // Check for inline styles
    const hasInlineStyles = this.hasInlineStyles($);
    details.push({
      check: 'Inline Styles',
      passed: hasInlineStyles,
      message: hasInlineStyles
        ? 'Inline styles found for email compatibility'
        : 'Missing inline styles. Email clients strip external CSS',
      importance: 'high'
    });
    
    // Check image attributes
    const imagesHaveAttributes = this.validateImageAttributes($);
    details.push({
      check: 'Image Attributes',
      passed: imagesHaveAttributes,
      message: imagesHaveAttributes
        ? 'All images have required attributes (width, height, alt)'
        : 'Some images missing required attributes (width, height, alt)',
      importance: 'high'
    });
    
    // Check CSS email compatibility
    const hasEmailFriendlyCSS = this.validateEmailCSS($);
    details.push({
      check: 'Email-Friendly CSS',
      passed: hasEmailFriendlyCSS,
      message: hasEmailFriendlyCSS
        ? 'CSS properties are email-client compatible'
        : 'Some CSS properties may not be supported in email clients',
      importance: 'medium'
    });
    
    // Check size limits
    const withinSizeLimit = this.checkSizeLimit(html);
    details.push({
      check: 'Size Limit',
      passed: withinSizeLimit,
      message: withinSizeLimit
        ? 'Template size within Gmail limit (102KB)'
        : 'Template exceeds Gmail size limit (102KB) - may be clipped',
      importance: 'high'
    });

    // Check valid structure
    const hasValidStructure = this.validateEmailStructure($);
    details.push({
      check: 'Email Structure',
      passed: hasValidStructure,
      message: hasValidStructure
        ? 'Valid email structure with proper container and content tables'
        : 'Invalid email structure - missing proper container or content organization',
      importance: 'high'
    });

    // Calculate overall compliance score
    const checks = [
      hasValidDoctype,
      usesTableLayout,
      hasInlineStyles,
      imagesHaveAttributes,
      hasEmailFriendlyCSS,
      withinSizeLimit,
      hasValidStructure
    ];
    const score = checks.filter(Boolean).length / checks.length;

    return {
      hasValidDoctype,
      usesTableLayout,
      hasInlineStyles,
      imagesHaveAttributes,
      hasEmailFriendlyCSS,
      withinSizeLimit,
      hasValidStructure,
      score,
      details
    };
  }

  /**
   * Check for valid email DOCTYPE
   */
  private hasValidEmailDoctype(html: string): boolean {
    const validDoctypes = [
      '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">',
      '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">',
      '<!DOCTYPE html>' // HTML5 is also acceptable for modern email clients
    ];
    
    const normalizedHTML = html.trim().replace(/\s+/g, ' ');
    return validDoctypes.some(doctype => 
      normalizedHTML.toLowerCase().startsWith(doctype.toLowerCase().replace(/\s+/g, ' '))
    );
  }

  /**
   * Check for table-based layout
   */
  private usesTableLayout($: cheerio.Root): boolean {
    const tables = $('table');
    const containerTable = $('table[width="100%"], table[width="600"], table[width="640"]');
    const contentTables = $('table table'); // Nested tables for content
    
    return tables.length >= 2 && containerTable.length >= 1 && contentTables.length >= 1;
  }

  /**
   * Check for inline styles
   */
  private hasInlineStyles($: cheerio.Root): boolean {
    const elementsWithStyles = $('[style]');
    const totalElements = $('*').length;
    const stylePercentage = elementsWithStyles.length / totalElements;
    
    // At least 30% of elements should have inline styles for email compatibility
    return stylePercentage >= 0.3;
  }

  /**
   * Validate image attributes
   */
  private validateImageAttributes($: cheerio.Root): boolean {
    const images = $('img');
    if (images.length === 0) return true; // No images to validate
    
    let validImages = 0;
    images.each((_, img) => {
      const $img = $(img);
      const hasWidth = $img.attr('width') !== undefined;
      const hasHeight = $img.attr('height') !== undefined;
      const hasAlt = $img.attr('alt') !== undefined;
      
      if (hasWidth && hasHeight && hasAlt) {
        validImages++;
      }
    });
    
    return validImages === images.length;
  }

  /**
   * Validate CSS for email compatibility
   */
  private validateEmailCSS($: cheerio.Root): boolean {
    let totalProperties = 0;
    let compatibleProperties = 0;
    
    $('[style]').each((_, element) => {
      const style = $(element).attr('style') || '';
      const properties = style.split(';').filter(prop => prop.trim());
      
      properties.forEach(property => {
        const parts = property.split(':').map(p => p.trim());
        const prop = parts[0];
        if (!prop) return; // Skip if property name is empty
        
        totalProperties++;
        
        if (this.emailFriendlyCSS.has(prop) || !this.unsupportedCSS.has(prop)) {
          compatibleProperties++;
        }
      });
    });
    
    if (totalProperties === 0) return true; // No CSS to validate
    return (compatibleProperties / totalProperties) >= 0.8; // 80% compatibility threshold
  }

  /**
   * Check size limits (Gmail clips emails over 102KB)
   */
  private checkSizeLimit(html: string): boolean {
    const sizeInBytes = Buffer.byteLength(html, 'utf8');
    const gmailLimit = 102 * 1024; // 102KB in bytes
    return sizeInBytes <= gmailLimit;
  }

  /**
   * Validate email structure
   */
  private validateEmailStructure($: cheerio.Root): boolean {
    // Check for proper email structure
    const hasHtmlTag = $('html').length > 0;
    const hasHeadTag = $('head').length > 0;
    const hasBodyTag = $('body').length > 0;
    const hasContainerTable = $('table[width], table[style*="width"]').length > 0;
    
    return hasHtmlTag && hasHeadTag && hasBodyTag && hasContainerTable;
  }

  /**
   * Analyze file sizes
   */
  private analyzeSizes(html: string): SizeAnalysis {
    const totalSize = Buffer.byteLength(html, 'utf8');
    const gmailLimit = 102 * 1024; // 102KB
    
    // Extract CSS size (rough estimation)
    const $ = cheerio.load(html);
    let cssSize = 0;
    $('[style]').each((_, element) => {
      cssSize += Buffer.byteLength($(element).attr('style') || '', 'utf8');
    });
    $('style').each((_, element) => {
      cssSize += Buffer.byteLength($(element).html() || '', 'utf8');
    });
    
    const htmlSize = totalSize - cssSize;
    const imageCount = $('img').length;
    
    return {
      totalSize,
      htmlSize,
      cssSize,
      imageCount,
      withinGmailLimit: totalSize <= gmailLimit,
      compressionRatio: 0 // Would be calculated after minification
    };
  }

  /**
   * Generate optimization suggestions
   */
  private generateOptimizations(
    _html: string, 
    compliance: EmailComplianceResult, 
    sizeAnalysis: SizeAnalysis
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    
    // Size optimization
    if (!sizeAnalysis.withinGmailLimit) {
      suggestions.push({
        type: 'html',
        priority: 'high',
        description: 'Template exceeds Gmail size limit',
        potentialSavings: `${Math.round((sizeAnalysis.totalSize - 102*1024) / 1024)}KB reduction needed`,
        implementation: 'Minify HTML, optimize images, reduce inline CSS'
      });
    }
    
    // Structure optimization
    if (!compliance.usesTableLayout) {
      suggestions.push({
        type: 'structure',
        priority: 'high',
        description: 'Convert to table-based layout',
        potentialSavings: 'Improved cross-client compatibility',
        implementation: 'Replace div layouts with table structures'
      });
    }
    
    // CSS optimization
    if (!compliance.hasInlineStyles) {
      suggestions.push({
        type: 'css',
        priority: 'high',
        description: 'Inline CSS styles',
        potentialSavings: 'Better email client support',
        implementation: 'Move all CSS to inline style attributes'
      });
    }
    
    // Image optimization
    if (sizeAnalysis.imageCount > 0 && !compliance.imagesHaveAttributes) {
      suggestions.push({
        type: 'images',
        priority: 'medium',
        description: 'Add missing image attributes',
        potentialSavings: 'Improved accessibility and rendering',
        implementation: 'Add width, height, and alt attributes to all images'
      });
    }
    
    return suggestions;
  }

  /**
   * Calculate semantic score based on HTML structure
   */
  private calculateSemanticScore(html: string): number {
    const $ = cheerio.load(html);
    let score = 0;
    let maxScore = 0;

    // Check for semantic elements
    const semanticElements = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 'strong', 'em'];
    semanticElements.forEach(tag => {
      maxScore += 10;
      if ($(tag).length > 0) {
        score += 10;
      }
    });

    // Check for proper heading hierarchy
    maxScore += 20;
    const headings = $('h1, h2, h3, h4, h5, h6');
    if (headings.length > 0) {
      let properHierarchy = true;
      let lastLevel = 0;
      
      headings.each((_, heading) => {
        const level = parseInt((heading as any).tagName?.substring(1) || '1');
        if (level > lastLevel + 1) {
          properHierarchy = false;
        }
        lastLevel = level;
      });
      
      if (properHierarchy) score += 20;
    }

    // Check for alt text on images
    maxScore += 20;
    const images = $('img');
    const imagesWithAlt = $('img[alt]');
    if (images.length === 0 || images.length === imagesWithAlt.length) {
      score += 20;
    }

    // Check for table structure
    maxScore += 30;
    const tables = $('table');
    const tablesWithHeaders = $('table th, table thead');
    if (tables.length > 0) {
      score += 15; // Base score for using tables
      if (tablesWithHeaders.length > 0) {
        score += 15; // Additional score for proper table headers
      }
    }

    return maxScore > 0 ? score / maxScore : 0;
  }

  /**
   * Extract DOCTYPE from HTML
   */
  private extractDoctype(html: string): string {
    const doctypeMatch = html.match(/<!DOCTYPE[^>]*>/i);
    return doctypeMatch ? doctypeMatch[0] : 'none';
  }

  /**
   * Extract encoding from HTML
   */
  private extractEncoding(html: string): string {
    const $ = cheerio.load(html);
    const metaCharset = $('meta[charset]').attr('charset');
    const metaHttpEquiv = $('meta[http-equiv="Content-Type"]').attr('content');
    
    if (metaCharset) return metaCharset;
    if (metaHttpEquiv) {
      const charsetMatch = metaHttpEquiv.match(/charset=([^;]+)/i);
      return charsetMatch ? charsetMatch[1] || 'unknown' : 'unknown';
    }
    return 'unknown';
  }

  /**
   * Determine impact level of validation warnings
   */
  private determineImpact(ruleId: string): 'low' | 'medium' | 'high' {
    const highImpactRules = ['doctype-html', 'no-missing-close', 'no-dup-id'];
    const mediumImpactRules = ['element-required-attributes', 'attr-quotes'];
    
    if (highImpactRules.includes(ruleId)) return 'high';
    if (mediumImpactRules.includes(ruleId)) return 'medium';
    return 'low';
  }

  /**
   * Minify HTML for production
   */
  async minifyHTML(html: string): Promise<string> {
    try {
      return await minify(html, {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: false, // Keep original DOCTYPE for email compatibility
        minifyCSS: true,
        minifyJS: false, // Avoid JS in emails
        preserveLineBreaks: false
      });
    } catch (error) {
      console.error('HTML minification failed:', error);
      return html; // Return original if minification fails
    }
  }
} 