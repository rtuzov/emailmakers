/**
 * 📧 MJML Template Entity
 * 
 * Domain entity representing an MJML email template
 * Contains business logic and validation rules
 */

import { 
  ValidationResult, 
  ValidationError, 
  ValidationWarning,
  LayoutType,
  EmailClient,
  PerformanceMetrics,
  GenerationMetadata,
  TemplateSection
} from '../interfaces/mjml-generator.interface';

export class MjmlTemplate {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly mjmlContent: string,
    public readonly metadata: GenerationMetadata,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  /**
   * Factory method to create a new MJML template
   */
  static create(params: {
    name: string;
    mjmlContent: string;
    layoutType: LayoutType;
    sectionsCount: number;
    assetsUsed: number;
  }): MjmlTemplate {
    const id = this.generateId();
    const metadata: GenerationMetadata = {
      templateId: id,
      generatedAt: new Date(),
      version: '1.0.0',
      layoutType: params.layoutType,
      sectionsCount: params.sectionsCount,
      assetsUsed: params.assetsUsed
    };

    const template = new MjmlTemplate(
      id,
      params.name,
      params.mjmlContent,
      metadata
    );

    // Validate during creation (fail-fast approach)
    const validation = template.validate();
    if (!validation.isValid) {
      const criticalErrors = validation.errors.filter(e => e.severity === 'critical');
      if (criticalErrors.length > 0) {
        throw new Error(`Failed to create MJML template: ${criticalErrors[0]?.message || 'Critical validation error'}`);
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
    mjmlContent: string;
    metadata: GenerationMetadata;
    createdAt?: Date;
    updatedAt?: Date;
  }): MjmlTemplate {
    return new MjmlTemplate(
      params.id,
      params.name,
      params.mjmlContent,
      params.metadata,
      params.createdAt,
      params.updatedAt
    );
  }

  /**
   * Validate MJML template structure and content
   */
  validate(): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let score = 100;

    // Critical structure validation
    const structureValidation = this.validateStructure();
    errors.push(...structureValidation.errors);
    warnings.push(...structureValidation.warnings);
    score -= structureValidation.errors.length * 20;

    // Content validation
    const contentValidation = this.validateContent();
    errors.push(...contentValidation.errors);
    warnings.push(...contentValidation.warnings);
    score -= contentValidation.errors.length * 10;

    // Performance validation
    const performanceValidation = this.validatePerformance();
    warnings.push(...performanceValidation.warnings);
    score -= performanceValidation.warnings.length * 5;

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
  private validateStructure(): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Must have root mjml tags
    if (!this.mjmlContent.includes('<mjml>') || !this.mjmlContent.includes('</mjml>')) {
      errors.push({
        code: 'MISSING_ROOT_TAGS',
        message: 'MJML template must have <mjml> root tags',
        severity: 'critical',
        location: 'root',
        suggestedFix: 'Wrap content in <mjml></mjml> tags'
      });
    }

    // Must have head and body sections
    if (!this.mjmlContent.includes('<mj-head>') || !this.mjmlContent.includes('</mj-head>')) {
      errors.push({
        code: 'MISSING_HEAD_SECTION',
        message: 'MJML template must have <mj-head> section',
        severity: 'critical',
        location: 'head',
        suggestedFix: 'Add <mj-head> section with title and preview'
      });
    }

    if (!this.mjmlContent.includes('<mj-body>') || !this.mjmlContent.includes('</mj-body>')) {
      errors.push({
        code: 'MISSING_BODY_SECTION',
        message: 'MJML template must have <mj-body> section',
        severity: 'critical',
        location: 'body',
        suggestedFix: 'Add <mj-body> section with email content'
      });
    }

    // Must have at least one section
    const sectionCount = (this.mjmlContent.match(/<mj-section/g) || []).length;
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
    if (this.mjmlContent.includes('<mj-section') && this.mjmlContent.match(/<mj-section[^>]*>[\s\S]*?<mj-section/)) {
      errors.push({
        code: 'NESTED_SECTIONS',
        message: 'MJML sections cannot be nested inside other sections',
        severity: 'high',
        location: 'sections',
        suggestedFix: 'Remove nested sections or restructure layout'
      });
    }

    // Check for forbidden elements
    const forbiddenElements = ['<mj-list', '<mj-list-item'];
    forbiddenElements.forEach(element => {
      if (this.mjmlContent.includes(element)) {
        warnings.push({
          code: 'FORBIDDEN_ELEMENT',
          message: `Element ${element} is not valid in MJML`,
          location: 'content',
          recommendation: 'Use <mj-text> with HTML lists instead'
        });
      }
    });

    return { errors, warnings };
  }

  /**
   * Validate content quality
   */
  private validateContent(): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check for title and preview
    if (!this.mjmlContent.includes('<mj-title>')) {
      warnings.push({
        code: 'MISSING_TITLE',
        message: 'Email should have a title for better deliverability',
        location: 'head',
        recommendation: 'Add <mj-title> in <mj-head> section'
      });
    }

    if (!this.mjmlContent.includes('<mj-preview>')) {
      warnings.push({
        code: 'MISSING_PREVIEW',
        message: 'Email should have a preview text',
        location: 'head',
        recommendation: 'Add <mj-preview> in <mj-head> section'
      });
    }

    // Check for CTA buttons
    const ctaCount = (this.mjmlContent.match(/<mj-button/g) || []).length;
    if (ctaCount === 0) {
      warnings.push({
        code: 'NO_CTA_BUTTONS',
        message: 'Email should have at least one call-to-action button',
        location: 'body',
        recommendation: 'Add <mj-button> elements for user actions'
      });
    }

    // Check for images
    const imageCount = (this.mjmlContent.match(/<mj-image/g) || []).length;
    if (imageCount === 0) {
      warnings.push({
        code: 'NO_IMAGES',
        message: 'Email might benefit from images for visual appeal',
        location: 'body',
        recommendation: 'Add <mj-image> elements for better engagement'
      });
    }

    return { errors, warnings };
  }

  /**
   * Validate performance characteristics
   */
  private validatePerformance(): { warnings: ValidationWarning[] } {
    const warnings: ValidationWarning[] = [];

    // Check template size
    const sizeKB = Buffer.byteLength(this.mjmlContent, 'utf8') / 1024;
    if (sizeKB > 100) {
      warnings.push({
        code: 'LARGE_TEMPLATE_SIZE',
        message: `Template size (${sizeKB.toFixed(1)}KB) is large and may be clipped by email clients`,
        location: 'overall',
        recommendation: 'Optimize content and reduce template size'
      });
    }

    // Check complexity
    const totalElements = (this.mjmlContent.match(/<mj-/g) || []).length;
    if (totalElements > 50) {
      warnings.push({
        code: 'HIGH_COMPLEXITY',
        message: `Template has many elements (${totalElements}) which may affect rendering performance`,
        location: 'overall',
        recommendation: 'Simplify layout or split into multiple templates'
      });
    }

    return { warnings };
  }

  /**
   * Get template sections information
   */
  getSections(): TemplateSection[] {
    const sections: TemplateSection[] = [];
    
    // Extract sections from MJML content
    const sectionMatches = this.mjmlContent.match(/<mj-section[^>]*>[\s\S]*?<\/mj-section>/g);
    
    if (sectionMatches) {
      sectionMatches.forEach((sectionHtml, index) => {
        sections.push({
          position: this.determineSectionPosition(sectionHtml, index),
          content: {
            text: this.extractSectionText(sectionHtml)
          }
        });
      });
    }

    return sections;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    const sizeBytes = Buffer.byteLength(this.mjmlContent, 'utf8');
    const elementCount = (this.mjmlContent.match(/<mj-/g) || []).length;
    
    return {
      generationTime: 0, // Will be set during generation
      templateSize: sizeBytes,
      complexityScore: Math.min(100, elementCount * 2),
      resourceUsage: {
        memoryMB: sizeBytes / (1024 * 1024),
        cpuTime: 0,
        cacheHits: 0,
        cacheMisses: 0
      }
    };
  }

  /**
   * Check compatibility with email clients
   */
  checkCompatibility(targetClients: EmailClient[]): { client: EmailClient; compatible: boolean; issues: string[] }[] {
    return targetClients.map(client => ({
      client,
      compatible: this.isCompatibleWithClient(client),
      issues: this.getClientIssues(client)
    }));
  }

  /**
   * Generate cache key for this template
   */
  getCacheKey(): string {
    const contentHash = this.generateContentHash();
    return `mjml:${contentHash}:${this.metadata.layoutType}`;
  }

  /**
   * Update template content (creates new instance)
   */
  updateContent(newContent: string): MjmlTemplate {
    return new MjmlTemplate(
      this.id,
      this.name,
      newContent,
      {
        ...this.metadata,
        generatedAt: new Date()
      },
      this.createdAt,
      new Date()
    );
  }

  // Private helper methods
  private static generateId(): string {
    return `mjml_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private determineSectionPosition(sectionHtml: string, index: number): any {
    // Simple heuristics to determine section type
    if (sectionHtml.includes('hero') || index === 0) return 'hero';
    if (sectionHtml.includes('gallery') || sectionHtml.includes('image')) return 'gallery';
    if (sectionHtml.includes('button') || sectionHtml.includes('cta')) return 'cta';
    if (sectionHtml.includes('footer') || index === -1) return 'footer';
    return 'content1';
  }

  private extractSectionText(sectionHtml: string): string {
    const textMatches = sectionHtml.match(/<mj-text[^>]*>([\s\S]*?)<\/mj-text>/g);
    if (textMatches) {
      return textMatches.map(match => 
        match.replace(/<\/?[^>]+(>|$)/g, "").trim()
      ).join(' ').substring(0, 100);
    }
    return '';
  }

  private isCompatibleWithClient(client: EmailClient): boolean {
    // Simplified compatibility check
    const incompatiblePatterns: Record<EmailClient, string[]> = {
      'outlook': ['<mj-hero', 'background-size'],
      'outlook-web': ['<mj-hero', 'background-size'],
      'yahoo-mail': ['<mj-group', 'flexbox'],
      'gmail': ['<mj-group'],
      'apple-mail': [],
      'thunderbird': []
    };

    const patterns = incompatiblePatterns[client] || [];
    return !patterns.some((pattern: string) => this.mjmlContent.includes(pattern));
  }

  private getClientIssues(client: EmailClient): string[] {
    const issues: string[] = [];
    
    switch (client) {
      case 'outlook':
        if (this.mjmlContent.includes('<mj-hero')) {
          issues.push('mj-hero not fully supported in Outlook');
        }
        break;
      case 'gmail':
        if (this.mjmlContent.includes('<mj-group')) {
          issues.push('mj-group may have rendering issues in Gmail');
        }
        break;
    }

    return issues;
  }

  private generateContentHash(): string {
    // Simple hash function for content
    let hash = 0;
    for (let i = 0; i < this.mjmlContent.length; i++) {
      const char = this.mjmlContent.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
} 