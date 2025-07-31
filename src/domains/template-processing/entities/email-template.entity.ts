/**
 * 📬 Email Template Entity
 * 
 * Domain entity representing a compiled HTML email template
 * Contains the final HTML output and optimization data
 */

import { 
  ValidationResult, 
  ValidationError, 
  ValidationWarning,
  EmailClient,
  PerformanceMetrics
} from '../interfaces/mjml-generator.interface';

export interface EmailTemplateMetadata {
  templateId: string;
  mjmlSourceId: string;
  compiledAt: Date;
  version: string;
  emailClients: EmailClient[];
  optimizations: OptimizationSummary;
}

export interface OptimizationSummary {
  cssInlined: boolean;
  imagesOptimized: boolean;
  darkModeSupported: boolean;
  mobileOptimized: boolean;
  compressionApplied: boolean;
  originalSize: number;
  optimizedSize: number;
}

export interface EmailQualityMetrics {
  deliverabilityScore: number; // 0-100
  accessibilityScore: number; // 0-100
  performanceScore: number; // 0-100
  compatibilityScore: number; // 0-100
  overallScore: number; // 0-100
}

export class EmailTemplate {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly htmlContent: string,
    public readonly cssContent: string,
    public readonly metadata: EmailTemplateMetadata,
    public readonly createdAt: Date = new Date()
  ) {}

  /**
   * Factory method to create a new email template
   */
  static create(params: {
    name: string;
    htmlContent: string;
    cssContent: string;
    mjmlSourceId: string;
    emailClients: EmailClient[];
    optimizations?: Partial<OptimizationSummary>;
  }): EmailTemplate {
    const id = this.generateId();
    const metadata: EmailTemplateMetadata = {
      templateId: id,
      mjmlSourceId: params.mjmlSourceId,
      compiledAt: new Date(),
      version: '1.0.0',
      emailClients: params.emailClients,
      optimizations: {
        cssInlined: true,
        imagesOptimized: false,
        darkModeSupported: false,
        mobileOptimized: true,
        compressionApplied: false,
        originalSize: Buffer.byteLength(params.htmlContent, 'utf8'),
        optimizedSize: Buffer.byteLength(params.htmlContent, 'utf8'),
        ...params.optimizations
      }
    };

    const template = new EmailTemplate(
      id,
      params.name,
      params.htmlContent,
      params.cssContent,
      metadata
    );

    // Validate during creation (fail-fast approach)
    const validation = template.validate();
    if (!validation.isValid) {
      const criticalErrors = validation.errors.filter(e => e.severity === 'critical');
      if (criticalErrors.length > 0) {
        throw new Error(`Failed to create email template: ${criticalErrors[0]?.message || 'Critical validation error'}`);
      }
    }

    return template;
  }

  /**
   * Factory method to create from existing data
   */
  static fromData(params: {
    id: string;
    name: string;
    htmlContent: string;
    cssContent: string;
    metadata: EmailTemplateMetadata;
    createdAt?: Date;
  }): EmailTemplate {
    return new EmailTemplate(
      params.id,
      params.name,
      params.htmlContent,
      params.cssContent,
      params.metadata,
      params.createdAt
    );
  }

  /**
   * Validate email template structure and content
   */
  validate(): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let score = 100;

    // HTML structure validation
    const htmlValidation = this.validateHtmlStructure();
    errors.push(...htmlValidation.errors);
    warnings.push(...htmlValidation.warnings);
    score -= htmlValidation.errors.length * 15;

    // Email compatibility validation
    const compatibilityValidation = this.validateEmailCompatibility();
    errors.push(...compatibilityValidation.errors);
    warnings.push(...compatibilityValidation.warnings);
    score -= compatibilityValidation.errors.length * 10;

    // Performance validation
    const performanceValidation = this.validatePerformance();
    warnings.push(...performanceValidation.warnings);
    score -= performanceValidation.warnings.length * 5;

    // Accessibility validation
    const accessibilityValidation = this.validateAccessibility();
    warnings.push(...accessibilityValidation.warnings);
    score -= accessibilityValidation.warnings.length * 3;

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score)
    };
  }

  /**
   * Validate HTML structure for email clients
   */
  private validateHtmlStructure(): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Must have proper DOCTYPE
    if (!this.htmlContent.includes('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"')) {
      errors.push({
        code: 'INVALID_DOCTYPE',
        message: 'Email must use XHTML 1.0 Transitional DOCTYPE for email clients',
        severity: 'high',
        location: 'document',
        suggestedFix: 'Add proper email DOCTYPE declaration'
      });
    }

    // Must use table-based layout
    if (!this.htmlContent.includes('<table')) {
      errors.push({
        code: 'NO_TABLE_LAYOUT',
        message: 'Email must use table-based layout for email client compatibility',
        severity: 'critical',
        location: 'body',
        suggestedFix: 'Use <table> elements for layout structure'
      });
    }

    // Check for unsupported HTML5 elements
    const unsupportedElements = ['<section', '<article', '<nav', '<header', '<footer', '<aside'];
    unsupportedElements.forEach(element => {
      if (this.htmlContent.includes(element)) {
        errors.push({
          code: 'UNSUPPORTED_HTML5',
          message: `HTML5 element ${element} is not supported in email clients`,
          severity: 'medium',
          location: 'body',
          suggestedFix: 'Use <div> or <table> elements instead'
        });
      }
    });

    // Check for external stylesheets
    if (this.htmlContent.includes('<link') && this.htmlContent.includes('stylesheet')) {
      warnings.push({
        code: 'EXTERNAL_STYLESHEETS',
        message: 'External stylesheets may not be supported in all email clients',
        location: 'head',
        recommendation: 'Use inline styles or embedded CSS'
      });
    }

    return { errors, warnings };
  }

  /**
   * Validate email client compatibility
   */
  private validateEmailCompatibility(): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check for Outlook-specific issues
    if (this.metadata.emailClients.includes('outlook')) {
      if (this.htmlContent.includes('display:flex') || this.htmlContent.includes('display: flex')) {
        warnings.push({
          code: 'FLEXBOX_OUTLOOK',
          message: 'Flexbox is not supported in Outlook desktop clients',
          location: 'styles',
          recommendation: 'Use table layout for Outlook compatibility'
        });
      }

      if (this.htmlContent.includes('background-size')) {
        warnings.push({
          code: 'BACKGROUND_SIZE_OUTLOOK',
          message: 'background-size property is not supported in Outlook',
          location: 'styles',
          recommendation: 'Use alternative background image approaches'
        });
      }
    }

    // Check for Gmail-specific issues
    if (this.metadata.emailClients.includes('gmail')) {
      if (this.htmlContent.includes('<style') && !this.htmlContent.includes('@media')) {
        warnings.push({
          code: 'GMAIL_MEDIA_QUERIES',
          message: 'Gmail may strip <style> tags without media queries',
          location: 'head',
          recommendation: 'Use media queries in embedded styles'
        });
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate performance characteristics
   */
  private validatePerformance(): { warnings: ValidationWarning[] } {
    const warnings: ValidationWarning[] = [];

    // Check file size
    const sizeKB = Buffer.byteLength(this.htmlContent, 'utf8') / 1024;
    if (sizeKB > 100) {
      warnings.push({
        code: 'LARGE_EMAIL_SIZE',
        message: `Email size (${sizeKB.toFixed(1)}KB) exceeds 100KB and may be clipped by Gmail`,
        location: 'overall',
        recommendation: 'Optimize content and reduce email size'
      });
    }

    // Check image count
    const imageCount = (this.htmlContent.match(/<img/g) || []).length;
    if (imageCount > 10) {
      warnings.push({
        code: 'TOO_MANY_IMAGES',
        message: `Email contains ${imageCount} images which may affect loading time`,
        location: 'content',
        recommendation: 'Optimize or reduce number of images'
      });
    }

    // Check for missing alt attributes
    const imagesWithoutAlt = (this.htmlContent.match(/<img(?![^>]*alt=)/g) || []).length;
    if (imagesWithoutAlt > 0) {
      warnings.push({
        code: 'MISSING_ALT_TEXT',
        message: `${imagesWithoutAlt} images missing alt attributes`,
        location: 'images',
        recommendation: 'Add alt attributes for accessibility and fallback text'
      });
    }

    return { warnings };
  }

  /**
   * Validate accessibility
   */
  private validateAccessibility(): { warnings: ValidationWarning[] } {
    const warnings: ValidationWarning[] = [];

    // Check for proper heading hierarchy
    const hasH1 = this.htmlContent.includes('<h1');
    if (!hasH1) {
      warnings.push({
        code: 'NO_H1_HEADING',
        message: 'Email should have at least one H1 heading for accessibility',
        location: 'content',
        recommendation: 'Add H1 heading for main email topic'
      });
    }

    // Check for color contrast (simplified)
    if (this.htmlContent.includes('color:#ffffff') && this.htmlContent.includes('background-color:#ffffff')) {
      warnings.push({
        code: 'POOR_COLOR_CONTRAST',
        message: 'White text on white background detected - poor contrast',
        location: 'styles',
        recommendation: 'Ensure sufficient color contrast for readability'
      });
    }

    // Check for table headers
    const tableCount = (this.htmlContent.match(/<table/g) || []).length;
    const thCount = (this.htmlContent.match(/<th/g) || []).length;
    if (tableCount > 1 && thCount === 0) {
      warnings.push({
        code: 'MISSING_TABLE_HEADERS',
        message: 'Data tables should have proper header cells (th)',
        location: 'tables',
        recommendation: 'Use <th> elements for table headers'
      });
    }

    return { warnings };
  }

  /**
   * Get quality metrics for this email
   */
  getQualityMetrics(): EmailQualityMetrics {
    const validation = this.validate();
    const performance = this.getPerformanceMetrics();
    
    // Calculate individual scores
    const deliverabilityScore = Math.max(0, 100 - validation.errors.length * 10);
    const accessibilityScore = this.calculateAccessibilityScore();
    const performanceScore = this.calculatePerformanceScore(performance);
    const compatibilityScore = this.calculateCompatibilityScore();
    
    // Overall score is weighted average
    const overallScore = Math.round(
      (deliverabilityScore * 0.3 + 
       accessibilityScore * 0.2 + 
       performanceScore * 0.3 + 
       compatibilityScore * 0.2)
    );

    return {
      deliverabilityScore,
      accessibilityScore,
      performanceScore,
      compatibilityScore,
      overallScore
    };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    const sizeBytes = Buffer.byteLength(this.htmlContent, 'utf8');
    const imageCount = (this.htmlContent.match(/<img/g) || []).length;
    const tableCount = (this.htmlContent.match(/<table/g) || []).length;
    
    return {
      generationTime: 0, // Set during compilation
      templateSize: sizeBytes,
      complexityScore: Math.min(100, (imageCount * 5) + (tableCount * 2)),
      resourceUsage: {
        memoryMB: sizeBytes / (1024 * 1024),
        cpuTime: 0,
        cacheHits: this.metadata.optimizations.cssInlined ? 1 : 0,
        cacheMisses: 0
      }
    };
  }

  /**
   * Check if email is ready for delivery
   */
  isReadyForDelivery(): { ready: boolean; issues: string[] } {
    const validation = this.validate();
    const quality = this.getQualityMetrics();
    const issues: string[] = [];

    // Critical errors block delivery
    const criticalErrors = validation.errors.filter(e => e.severity === 'critical');
    if (criticalErrors.length > 0) {
      issues.push(...criticalErrors.map(e => e.message));
    }

    // Low quality score
    if (quality.overallScore < 70) {
      issues.push('Overall quality score is below acceptable threshold (70)');
    }

    // Size issues
    const sizeKB = Buffer.byteLength(this.htmlContent, 'utf8') / 1024;
    if (sizeKB > 100) {
      issues.push('Email size exceeds 100KB limit');
    }

    return {
      ready: issues.length === 0,
      issues
    };
  }

  /**
   * Generate preview text from content
   */
  generatePreviewText(maxLength: number = 150): string {
    // Remove HTML tags and get plain text
    const plainText = this.htmlContent
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return plainText.length > maxLength 
      ? plainText.substring(0, maxLength) + '...'
      : plainText;
  }

  /**
   * Export email for delivery
   */
  exportForDelivery(): {
    html: string;
    text: string;
    subject: string;
    previewText: string;
    metadata: EmailTemplateMetadata;
  } {
    const readiness = this.isReadyForDelivery();
    if (!readiness.ready) {
      throw new Error(`Email not ready for delivery: ${readiness.issues.join(', ')}`);
    }

    return {
      html: this.htmlContent,
      text: this.generatePlainTextVersion(),
      subject: this.extractSubject(),
      previewText: this.generatePreviewText(),
      metadata: this.metadata
    };
  }

  // Private helper methods
  private static generateId(): string {
    return `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateAccessibilityScore(): number {
    let score = 100;
    
    // Check for alt attributes
    const images = (this.htmlContent.match(/<img/g) || []).length;
    const imagesWithAlt = (this.htmlContent.match(/<img[^>]*alt=/g) || []).length;
    if (images > 0) {
      score -= ((images - imagesWithAlt) / images) * 30;
    }

    // Check for proper headings
    const hasH1 = this.htmlContent.includes('<h1');
    if (!hasH1) score -= 20;

    return Math.max(0, Math.round(score));
  }

  private calculatePerformanceScore(metrics: PerformanceMetrics): number {
    let score = 100;
    
    // Size penalty
    const sizeKB = metrics.templateSize / 1024;
    if (sizeKB > 100) score -= (sizeKB - 100) * 2;
    if (sizeKB > 50) score -= (sizeKB - 50) * 1;

    // Complexity penalty
    if (metrics.complexityScore > 50) {
      score -= (metrics.complexityScore - 50);
    }

    return Math.max(0, Math.round(score));
  }

  private calculateCompatibilityScore(): number {
    let score = 100;
    
    // Check for email-unsafe elements
    const unsafeElements = ['<section', '<article', '<nav'];
    unsafeElements.forEach(element => {
      if (this.htmlContent.includes(element)) score -= 20;
    });

    // Check for proper DOCTYPE
    if (!this.htmlContent.includes('XHTML 1.0 Transitional')) score -= 15;

    return Math.max(0, Math.round(score));
  }

  private generatePlainTextVersion(): string {
    return this.htmlContent
      .replace(/<[^>]*>/g, '\n')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }

  private extractSubject(): string {
    const titleMatch = this.htmlContent.match(/<title[^>]*>(.*?)<\/title>/i);
    return titleMatch?.[1] || 'Email Campaign';
  }
} 