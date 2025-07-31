/**
 * ✅ Template Validator Domain Service
 * 
 * Domain service for validating MJML templates and HTML emails
 * Provides comprehensive validation for structure, content, and compatibility
 */

import { 
  ITemplateValidator,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  EmailClient
} from '../interfaces/mjml-generator.interface';

export class TemplateValidatorService implements ITemplateValidator {
  
  /**
   * Validate MJML structure and content
   */
  validateMjml(mjmlContent: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let score = 100;
    
    try {
      // Basic structure validation
      const structureValidation = this.validateMjmlStructure(mjmlContent);
      errors.push(...structureValidation.errors);
      warnings.push(...structureValidation.warnings);
      score -= structureValidation.errors.length * 20;
      
      // Content quality validation
      const contentValidation = this.validateMjmlContent(mjmlContent);
      warnings.push(...contentValidation.warnings);
      score -= contentValidation.warnings.length * 5;
      
      // Performance validation
      const performanceValidation = this.validateMjmlPerformance(mjmlContent);
      warnings.push(...performanceValidation.warnings);
      score -= performanceValidation.warnings.length * 3;
      
    } catch (error) {
      errors.push({
        code: 'VALIDATION_ERROR',
        message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'critical',
        location: 'validator'
      });
      score = 0;
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score)
    };
  }

  /**
   * Validate generated HTML against email client compatibility
   */
  validateHtml(htmlContent: string, targetClients: EmailClient[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let score = 100;
    
    try {
      // HTML structure validation
      const structureValidation = this.validateHtmlStructure(htmlContent);
      errors.push(...structureValidation.errors);
      warnings.push(...structureValidation.warnings);
      score -= structureValidation.errors.length * 15;
      
      // Email client compatibility validation
      const compatibilityValidation = this.validateEmailClientCompatibility(htmlContent, targetClients);
      errors.push(...compatibilityValidation.errors);
      warnings.push(...compatibilityValidation.warnings);
      score -= compatibilityValidation.errors.length * 10;
      
      // Accessibility validation
      const accessibilityValidation = this.validateAccessibility(htmlContent);
      warnings.push(...accessibilityValidation.warnings);
      score -= accessibilityValidation.warnings.length * 5;
      
      // Performance validation
      const performanceValidation = this.validateHtmlPerformance(htmlContent);
      warnings.push(...performanceValidation.warnings);
      score -= performanceValidation.warnings.length * 3;
      
    } catch (error) {
      errors.push({
        code: 'HTML_VALIDATION_ERROR',
        message: `HTML validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'critical',
        location: 'validator'
      });
      score = 0;
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score)
    };
  }

  /**
   * Validate MJML structure
   */
  private validateMjmlStructure(mjmlContent: string): { errors: ValidationError[], warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    // Must have root mjml tags
    if (!mjmlContent.includes('<mjml>') || !mjmlContent.includes('</mjml>')) {
      errors.push({
        code: 'MISSING_MJML_ROOT',
        message: 'MJML template must have <mjml> root tags',
        severity: 'critical',
        location: 'root',
        suggestedFix: 'Wrap content in <mjml></mjml> tags'
      });
    }
    
    // Must have head section
    if (!mjmlContent.includes('<mj-head>')) {
      errors.push({
        code: 'MISSING_MJ_HEAD',
        message: 'MJML template must have <mj-head> section',
        severity: 'critical',
        location: 'head',
        suggestedFix: 'Add <mj-head> section with title and preview'
      });
    }
    
    // Must have body section
    if (!mjmlContent.includes('<mj-body>')) {
      errors.push({
        code: 'MISSING_MJ_BODY',
        message: 'MJML template must have <mj-body> section',
        severity: 'critical',
        location: 'body',
        suggestedFix: 'Add <mj-body> section with email content'
      });
    }
    
    // Must have at least one section
    const sectionCount = (mjmlContent.match(/<mj-section/g) || []).length;
    if (sectionCount === 0) {
      errors.push({
        code: 'NO_SECTIONS',
        message: 'MJML template must have at least one <mj-section>',
        severity: 'high',
        location: 'body',
        suggestedFix: 'Add <mj-section> elements with content'
      });
    }
    
    // Check for invalid nested sections
    if (this.hasNestedSections(mjmlContent)) {
      errors.push({
        code: 'NESTED_SECTIONS',
        message: 'MJML sections cannot be nested inside other sections',
        severity: 'high',
        location: 'sections',
        suggestedFix: 'Remove nested sections or restructure layout'
      });
    }
    
    // Check for invalid elements
    const invalidElements = this.findInvalidMjmlElements(mjmlContent);
    invalidElements.forEach(element => {
      warnings.push({
        code: 'INVALID_ELEMENT',
        message: `Element ${element} is not valid in MJML`,
        location: 'content',
        recommendation: 'Use valid MJML elements only'
      });
    });
    
    // Check for missing required attributes
    const missingAttributes = this.findMissingRequiredAttributes(mjmlContent);
    missingAttributes.forEach(issue => {
      warnings.push({
        code: 'MISSING_ATTRIBUTE',
        message: issue.message,
        location: issue.location,
        recommendation: issue.recommendation
      });
    });
    
    return { errors, warnings };
  }

  /**
   * Validate MJML content quality
   */
  private validateMjmlContent(mjmlContent: string): { warnings: ValidationWarning[] } {
    const warnings: ValidationWarning[] = [];
    
    // Check for title
    if (!mjmlContent.includes('<mj-title>')) {
      warnings.push({
        code: 'MISSING_TITLE',
        message: 'Email should have a title for better deliverability',
        location: 'head',
        recommendation: 'Add <mj-title> in <mj-head> section'
      });
    }
    
    // Check for preview
    if (!mjmlContent.includes('<mj-preview>')) {
      warnings.push({
        code: 'MISSING_PREVIEW',
        message: 'Email should have preview text',
        location: 'head',
        recommendation: 'Add <mj-preview> in <mj-head> section'
      });
    }
    
    // Check for CTA buttons
    const ctaCount = (mjmlContent.match(/<mj-button/g) || []).length;
    if (ctaCount === 0) {
      warnings.push({
        code: 'NO_CTA_BUTTONS',
        message: 'Email should have at least one call-to-action button',
        location: 'body',
        recommendation: 'Add <mj-button> elements for user actions'
      });
    }
    
    // Check for images
    const imageCount = (mjmlContent.match(/<mj-image/g) || []).length;
    if (imageCount === 0) {
      warnings.push({
        code: 'NO_IMAGES',
        message: 'Email might benefit from images for visual appeal',
        location: 'body',
        recommendation: 'Add <mj-image> elements for better engagement'
      });
    }
    
    // Check for alt attributes on images
    const imagesWithoutAlt = this.findImagesWithoutAlt(mjmlContent);
    if (imagesWithoutAlt > 0) {
      warnings.push({
        code: 'MISSING_ALT_ATTRIBUTES',
        message: `${imagesWithoutAlt} images missing alt attributes`,
        location: 'images',
        recommendation: 'Add alt attributes to all images for accessibility'
      });
    }
    
    return { warnings };
  }

  /**
   * Validate MJML performance characteristics
   */
  private validateMjmlPerformance(mjmlContent: string): { warnings: ValidationWarning[] } {
    const warnings: ValidationWarning[] = [];
    
    // Check template size
    const sizeKB = Buffer.byteLength(mjmlContent, 'utf8') / 1024;
    if (sizeKB > 100) {
      warnings.push({
        code: 'LARGE_TEMPLATE_SIZE',
        message: `Template size (${sizeKB.toFixed(1)}KB) is large and may be clipped`,
        location: 'overall',
        recommendation: 'Optimize content and reduce template size'
      });
    }
    
    // Check complexity
    const elementCount = (mjmlContent.match(/<mj-/g) || []).length;
    if (elementCount > 50) {
      warnings.push({
        code: 'HIGH_COMPLEXITY',
        message: `Template has many elements (${elementCount}) which may affect performance`,
        location: 'overall',
        recommendation: 'Simplify layout or split into multiple templates'
      });
    }
    
    return { warnings };
  }

  /**
   * Validate HTML structure for email compatibility
   */
  private validateHtmlStructure(htmlContent: string): { errors: ValidationError[], warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    // Must have proper DOCTYPE
    if (!htmlContent.includes('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"')) {
      errors.push({
        code: 'INVALID_DOCTYPE',
        message: 'Email must use XHTML 1.0 Transitional DOCTYPE',
        severity: 'high',
        location: 'document',
        suggestedFix: 'Add proper email DOCTYPE declaration'
      });
    }
    
    // Must use table-based layout
    if (!htmlContent.includes('<table')) {
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
      if (htmlContent.includes(element)) {
        errors.push({
          code: 'UNSUPPORTED_HTML5',
          message: `HTML5 element ${element} is not supported in email clients`,
          severity: 'medium',
          location: 'body',
          suggestedFix: 'Use <div> or <table> elements instead'
        });
      }
    });
    
    // Check for external resources
    if (htmlContent.includes('<link') && htmlContent.includes('stylesheet')) {
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
  private validateEmailClientCompatibility(htmlContent: string, targetClients: EmailClient[]): { errors: ValidationError[], warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    targetClients.forEach(client => {
      const clientIssues = this.validateForSpecificClient(htmlContent, client);
      warnings.push(...clientIssues);
    });
    
    return { errors, warnings };
  }

  /**
   * Validate for specific email client
   */
  private validateForSpecificClient(htmlContent: string, client: EmailClient): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];
    
    switch (client) {
      case 'outlook':
        warnings.push(...this.validateOutlookCompatibility(htmlContent));
        break;
      case 'gmail':
        warnings.push(...this.validateGmailCompatibility(htmlContent));
        break;
      case 'apple-mail':
        warnings.push(...this.validateAppleMailCompatibility(htmlContent));
        break;
      case 'yahoo-mail':
        warnings.push(...this.validateYahooMailCompatibility(htmlContent));
        break;
    }
    
    return warnings;
  }

  /**
   * Validate Outlook compatibility
   */
  private validateOutlookCompatibility(htmlContent: string): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];
    
    if (htmlContent.includes('display:flex') || htmlContent.includes('display: flex')) {
      warnings.push({
        code: 'OUTLOOK_FLEXBOX',
        message: 'Flexbox is not supported in Outlook desktop clients',
        location: 'styles',
        recommendation: 'Use table layout for Outlook compatibility'
      });
    }
    
    if (htmlContent.includes('background-size')) {
      warnings.push({
        code: 'OUTLOOK_BACKGROUND_SIZE',
        message: 'background-size property is not supported in Outlook',
        location: 'styles',
        recommendation: 'Use alternative background image approaches'
      });
    }
    
    if (htmlContent.includes('<video') || htmlContent.includes('<audio')) {
      warnings.push({
        code: 'OUTLOOK_MEDIA',
        message: 'Video and audio elements are not supported in Outlook',
        location: 'content',
        recommendation: 'Use static images with play buttons'
      });
    }
    
    return warnings;
  }

  /**
   * Validate Gmail compatibility
   */
  private validateGmailCompatibility(htmlContent: string): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];
    
    if (htmlContent.includes('<style') && !htmlContent.includes('@media')) {
      warnings.push({
        code: 'GMAIL_STYLE_STRIPPING',
        message: 'Gmail may strip <style> tags without media queries',
        location: 'head',
        recommendation: 'Use media queries in embedded styles'
      });
    }
    
    const sizeKB = Buffer.byteLength(htmlContent, 'utf8') / 1024;
    if (sizeKB > 102) {
      warnings.push({
        code: 'GMAIL_CLIPPING',
        message: `Email size (${sizeKB.toFixed(1)}KB) exceeds Gmail's 102KB limit`,
        location: 'overall',
        recommendation: 'Reduce email size to prevent clipping'
      });
    }
    
    return warnings;
  }

  /**
   * Validate Apple Mail compatibility
   */
  private validateAppleMailCompatibility(htmlContent: string): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];
    
    // Apple Mail generally has good support, fewer issues
    if (htmlContent.includes('position:fixed') || htmlContent.includes('position: fixed')) {
      warnings.push({
        code: 'APPLE_MAIL_FIXED_POSITION',
        message: 'Fixed positioning may not work consistently in Apple Mail',
        location: 'styles',
        recommendation: 'Use static or relative positioning'
      });
    }
    
    return warnings;
  }

  /**
   * Validate Yahoo Mail compatibility
   */
  private validateYahooMailCompatibility(htmlContent: string): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];
    
    if (htmlContent.includes('display:grid') || htmlContent.includes('display: grid')) {
      warnings.push({
        code: 'YAHOO_GRID',
        message: 'CSS Grid is not supported in Yahoo Mail',
        location: 'styles',
        recommendation: 'Use table layout instead'
      });
    }
    
    return warnings;
  }

  /**
   * Validate accessibility
   */
  private validateAccessibility(htmlContent: string): { warnings: ValidationWarning[] } {
    const warnings: ValidationWarning[] = [];
    
    // Check for proper heading hierarchy
    const hasH1 = htmlContent.includes('<h1');
    if (!hasH1) {
      warnings.push({
        code: 'NO_H1_HEADING',
        message: 'Email should have at least one H1 heading for accessibility',
        location: 'content',
        recommendation: 'Add H1 heading for main email topic'
      });
    }
    
    // Check for alt attributes on images
    const images = (htmlContent.match(/<img/g) || []).length;
    const imagesWithAlt = (htmlContent.match(/<img[^>]*alt=/g) || []).length;
    if (images > imagesWithAlt) {
      warnings.push({
        code: 'MISSING_ALT_TEXT',
        message: `${images - imagesWithAlt} images missing alt attributes`,
        location: 'images',
        recommendation: 'Add alt attributes for accessibility and fallback text'
      });
    }
    
    // Check for color contrast (simplified check)
    if (htmlContent.includes('color:#ffffff') && htmlContent.includes('background-color:#ffffff')) {
      warnings.push({
        code: 'POOR_COLOR_CONTRAST',
        message: 'White text on white background detected - poor contrast',
        location: 'styles',
        recommendation: 'Ensure sufficient color contrast for readability'
      });
    }
    
    // Check for table headers
    const tableCount = (htmlContent.match(/<table/g) || []).length;
    const thCount = (htmlContent.match(/<th/g) || []).length;
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
   * Validate HTML performance
   */
  private validateHtmlPerformance(htmlContent: string): { warnings: ValidationWarning[] } {
    const warnings: ValidationWarning[] = [];
    
    // Check file size
    const sizeKB = Buffer.byteLength(htmlContent, 'utf8') / 1024;
    if (sizeKB > 100) {
      warnings.push({
        code: 'LARGE_EMAIL_SIZE',
        message: `Email size (${sizeKB.toFixed(1)}KB) may be clipped by email clients`,
        location: 'overall',
        recommendation: 'Optimize content and reduce email size'
      });
    }
    
    // Check image count
    const imageCount = (htmlContent.match(/<img/g) || []).length;
    if (imageCount > 15) {
      warnings.push({
        code: 'TOO_MANY_IMAGES',
        message: `Email contains ${imageCount} images which may affect loading`,
        location: 'content',
        recommendation: 'Optimize or reduce number of images'
      });
    }
    
    // Check for inline styles bloat
    const inlineStylesCount = (htmlContent.match(/style="/g) || []).length;
    if (inlineStylesCount > 100) {
      warnings.push({
        code: 'EXCESSIVE_INLINE_STYLES',
        message: `Many inline styles (${inlineStylesCount}) may increase file size`,
        location: 'styles',
        recommendation: 'Consider CSS optimization'
      });
    }
    
    return { warnings };
  }

  // Helper methods
  private hasNestedSections(mjmlContent: string): boolean {
    return !!mjmlContent.match(/<mj-section[^>]*>[\s\S]*?<mj-section/);
  }

  private findInvalidMjmlElements(mjmlContent: string): string[] {
    const invalidElements = ['<mj-list', '<mj-list-item', '<mj-grid', '<mj-flex'];
    return invalidElements.filter(element => mjmlContent.includes(element));
  }

  private findMissingRequiredAttributes(mjmlContent: string): Array<{ message: string, location: string, recommendation: string }> {
    const issues = [];
    
    // Check for images without src
    const imagesWithoutSrc = (mjmlContent.match(/<mj-image(?![^>]*src=)/g) || []).length;
    if (imagesWithoutSrc > 0) {
      issues.push({
        message: `${imagesWithoutSrc} images missing src attribute`,
        location: 'images',
        recommendation: 'Add src attribute to all images'
      });
    }
    
    // Check for buttons without href
    const buttonsWithoutHref = (mjmlContent.match(/<mj-button(?![^>]*href=)/g) || []).length;
    if (buttonsWithoutHref > 0) {
      issues.push({
        message: `${buttonsWithoutHref} buttons missing href attribute`,
        location: 'buttons',
        recommendation: 'Add href attribute to all buttons'
      });
    }
    
    return issues;
  }

  private findImagesWithoutAlt(mjmlContent: string): number {
    const allImages = (mjmlContent.match(/<mj-image/g) || []).length;
    const imagesWithAlt = (mjmlContent.match(/<mj-image[^>]*alt=/g) || []).length;
    return allImages - imagesWithAlt;
  }
} 