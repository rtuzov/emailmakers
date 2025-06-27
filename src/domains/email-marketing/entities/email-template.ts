export interface TemplateMetadata {
  id: string;
  name?: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  generatedBy: string;
  templateType: 'newsletter' | 'promotional' | 'transactional' | 'welcome' | 'abandonment' | 'survey' | 'announcement';
  tags: string[];
  size: {
    html: number; // Size in bytes
    mjml: number; // Size in bytes
    css: number; // Size in bytes
  };
  performance: {
    loadTime?: number; // Estimated load time in ms
    renderTime?: number; // Estimated render time in ms
    optimizationScore?: number; // 0-1 score
  };
  compatibility: {
    emailClients: string[];
    mobileOptimized: boolean;
    darkModeSupported: boolean;
    accessibilityCompliant: boolean;
  };
}

export interface TemplateContent {
  subject: string;
  preheader: string;
  body: string;
  cta: string[];
  footer?: string;
  unsubscribeLink?: string;
}

export interface TemplateAssets {
  images: {
    id: string;
    url: string;
    alt: string;
    width: number;
    height: number;
    size: number;
    optimized: boolean;
  }[];
  fonts: {
    family: string;
    url: string;
    fallbacks: string[];
    weight: string[];
  }[];
  stylesheets: {
    url: string;
    inline: boolean;
    critical: boolean;
  }[];
}

export interface TemplateVariables {
  [key: string]: {
    type: 'text' | 'number' | 'boolean' | 'date' | 'url' | 'email';
    defaultValue: any;
    required: boolean;
    description?: string;
    validation?: {
      pattern?: string;
      min?: number;
      max?: number;
    };
  };
}

export interface TemplateOptimizations {
  cssInlined: boolean;
  imagesOptimized: boolean;
  darkModeSupported: boolean;
  mobileOptimized: boolean;
  accessibilityEnhanced: boolean;
  performanceOptimized: boolean;
  compressionApplied: boolean;
  minified: boolean;
}

export class EmailTemplate {
  public readonly id: string;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(
    public readonly mjml: string,
    public readonly html: string,
    public readonly content: TemplateContent,
    public readonly metadata: TemplateMetadata,
    public readonly assets?: TemplateAssets,
    public readonly variables?: TemplateVariables,
    public readonly optimizations?: TemplateOptimizations,
    public readonly rawCSS?: string,
    public readonly inlineCSS?: string
  ) {
    this.id = this.generateId();
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Create EmailTemplate from MJML and compiled HTML
   */
  static create(
    mjml: string,
    html: string,
    content: TemplateContent,
    options: {
      templateType?: TemplateMetadata['templateType'];
      name?: string;
      tags?: string[];
      assets?: TemplateAssets;
      variables?: TemplateVariables;
      optimizations?: TemplateOptimizations;
      rawCSS?: string;
      inlineCSS?: string;
    } = {}
  ): EmailTemplate {
    const metadata: TemplateMetadata = {
      id: EmailTemplate.generateStaticId(),
      name: options.name,
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      generatedBy: 'email-makers-ai',
      templateType: options.templateType || 'newsletter',
      tags: options.tags || [],
      size: {
        html: html.length,
        mjml: mjml.length,
        css: (options.rawCSS || '').length
      },
      performance: {
        optimizationScore: EmailTemplate.calculateOptimizationScore(html, options.optimizations)
      },
      compatibility: {
        emailClients: EmailTemplate.getCompatibleClients(html),
        mobileOptimized: options.optimizations?.mobileOptimized || false,
        darkModeSupported: options.optimizations?.darkModeSupported || false,
        accessibilityCompliant: options.optimizations?.accessibilityEnhanced || false
      }
    };

    return new EmailTemplate(
      mjml,
      html,
      content,
      metadata,
      options.assets,
      options.variables,
      options.optimizations,
      options.rawCSS,
      options.inlineCSS
    );
  }

  /**
   * Validate the email template
   */
  validate(): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate MJML
    if (!this.mjml || this.mjml.trim().length === 0) {
      errors.push('MJML content cannot be empty');
    }

    // Validate HTML
    if (!this.html || this.html.trim().length === 0) {
      errors.push('HTML content cannot be empty');
    }

    // Check HTML size (Gmail clips at ~102KB)
    if (this.html.length > 100000) {
      warnings.push('HTML size exceeds 100KB - may be clipped by Gmail');
    }

    // Validate content
    if (!this.content.subject || this.content.subject.trim().length === 0) {
      errors.push('Subject line cannot be empty');
    }

    if (this.content.subject.length > 78) {
      warnings.push('Subject line exceeds 78 characters - may be truncated');
    }

    if (!this.content.body || this.content.body.trim().length === 0) {
      errors.push('Email body cannot be empty');
    }

    // Validate preheader
    if (this.content.preheader && this.content.preheader.length > 90) {
      warnings.push('Preheader exceeds 90 characters - may be truncated');
    }

    // Check for required DOCTYPE
    if (!this.html.includes('<!DOCTYPE')) {
      warnings.push('Missing DOCTYPE declaration - may cause rendering issues');
    }

    // Check for table-based layout (email best practice)
    if (!this.html.includes('<table')) {
      warnings.push('No table elements found - may not render correctly in email clients');
    }

    // Check for inline CSS (required for email)
    if (!this.optimizations?.cssInlined) {
      warnings.push('CSS not inlined - may not render correctly in email clients');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get template size information
   */
  getSizeInfo(): {
    total: number;
    html: number;
    mjml: number;
    css: number;
    formatted: {
      total: string;
      html: string;
      mjml: string;
      css: string;
    };
  } {
    const htmlSize = this.html.length;
    const mjmlSize = this.mjml.length;
    const cssSize = (this.rawCSS || '').length;
    const totalSize = htmlSize + mjmlSize + cssSize;

    return {
      total: totalSize,
      html: htmlSize,
      mjml: mjmlSize,
      css: cssSize,
      formatted: {
        total: this.formatBytes(totalSize),
        html: this.formatBytes(htmlSize),
        mjml: this.formatBytes(mjmlSize),
        css: this.formatBytes(cssSize)
      }
    };
  }

  /**
   * Get template performance metrics
   */
  getPerformanceMetrics(): {
    optimizationScore: number;
    loadTimeEstimate: number;
    renderComplexity: 'low' | 'medium' | 'high';
    recommendations: string[];
  } {
    const size = this.getSizeInfo();
    const recommendations: string[] = [];

    // Calculate load time estimate (rough approximation)
    const loadTimeEstimate = Math.max(100, size.total / 1000); // 1KB per ms baseline

    // Determine render complexity
    const tableCount = (this.html.match(/<table/g) || []).length;
    const imageCount = (this.html.match(/<img/g) || []).length;
    const renderComplexity = 
      tableCount > 10 || imageCount > 5 ? 'high' :
      tableCount > 5 || imageCount > 2 ? 'medium' : 'low';

    // Generate recommendations
    if (size.html > 100000) {
      recommendations.push('Reduce HTML size to prevent Gmail clipping');
    }

    if (!this.optimizations?.imagesOptimized) {
      recommendations.push('Optimize images for faster loading');
    }

    if (!this.optimizations?.cssInlined) {
      recommendations.push('Inline CSS for better email client compatibility');
    }

    if (!this.optimizations?.minified) {
      recommendations.push('Minify HTML to reduce file size');
    }

    return {
      optimizationScore: this.metadata.performance.optimizationScore || 0,
      loadTimeEstimate,
      renderComplexity,
      recommendations
    };
  }

  /**
   * Get compatibility information
   */
  getCompatibilityInfo(): {
    emailClients: string[];
    mobileSupport: boolean;
    darkModeSupport: boolean;
    accessibilitySupport: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check for common compatibility issues
    if (this.html.includes('flexbox') || this.html.includes('display: flex')) {
      issues.push('Flexbox not supported in many email clients');
    }

    if (this.html.includes('grid') || this.html.includes('display: grid')) {
      issues.push('CSS Grid not supported in email clients');
    }

    if (this.html.includes('position: absolute') || this.html.includes('position: fixed')) {
      issues.push('Absolute/fixed positioning not reliable in email clients');
    }

    if (!this.html.includes('width=') && this.html.includes('<img')) {
      issues.push('Images should have explicit width attributes');
    }

    return {
      emailClients: this.metadata.compatibility.emailClients,
      mobileSupport: this.metadata.compatibility.mobileOptimized,
      darkModeSupport: this.metadata.compatibility.darkModeSupported,
      accessibilitySupport: this.metadata.compatibility.accessibilityCompliant,
      issues
    };
  }

  /**
   * Extract template variables from content
   */
  extractVariables(): TemplateVariables {
    const variables: TemplateVariables = {};
    const variablePattern = /\{\{([^}]+)\}\}/g;
    
    let match;
    while ((match = variablePattern.exec(this.html)) !== null) {
      const variableName = match[1].trim();
      if (!variables[variableName]) {
        variables[variableName] = {
          type: 'text',
          defaultValue: '',
          required: true,
          description: `Variable: ${variableName}`
        };
      }
    }

    return variables;
  }

  /**
   * Replace variables in template
   */
  replaceVariables(values: Record<string, any>): EmailTemplate {
    let processedHtml = this.html;
    let processedMjml = this.mjml;

    // Replace variables in HTML
    for (const [key, value] of Object.entries(values)) {
      const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      processedHtml = processedHtml.replace(pattern, String(value));
    }

    // Replace variables in MJML
    for (const [key, value] of Object.entries(values)) {
      const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      processedMjml = processedMjml.replace(pattern, String(value));
    }

    return new EmailTemplate(
      processedMjml,
      processedHtml,
      this.content,
      this.metadata,
      this.assets,
      this.variables,
      this.optimizations,
      this.rawCSS,
      this.inlineCSS
    );
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): any {
    return {
      id: this.id,
      mjml: this.mjml,
      html: this.html,
      content: this.content,
      metadata: this.metadata,
      assets: this.assets,
      variables: this.variables,
      optimizations: this.optimizations,
      rawCSS: this.rawCSS,
      inlineCSS: this.inlineCSS,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      sizeInfo: this.getSizeInfo(),
      performanceMetrics: this.getPerformanceMetrics(),
      compatibilityInfo: this.getCompatibilityInfo()
    };
  }

  /**
   * Create a copy with updated content
   */
  withUpdatedContent(content: Partial<TemplateContent>): EmailTemplate {
    return new EmailTemplate(
      this.mjml,
      this.html,
      { ...this.content, ...content },
      this.metadata,
      this.assets,
      this.variables,
      this.optimizations,
      this.rawCSS,
      this.inlineCSS
    );
  }

  /**
   * Create a copy with updated metadata
   */
  withUpdatedMetadata(metadata: Partial<TemplateMetadata>): EmailTemplate {
    return new EmailTemplate(
      this.mjml,
      this.html,
      this.content,
      { ...this.metadata, ...metadata },
      this.assets,
      this.variables,
      this.optimizations,
      this.rawCSS,
      this.inlineCSS
    );
  }

  /**
   * Generate unique ID for template
   */
  private generateId(): string {
    return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate static ID for metadata
   */
  private static generateStaticId(): string {
    return `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Calculate optimization score
   */
  private static calculateOptimizationScore(
    html: string, 
    optimizations?: TemplateOptimizations
  ): number {
    let score = 0;
    const maxScore = 10;

    // CSS inlined (+2 points)
    if (optimizations?.cssInlined) score += 2;

    // Images optimized (+1 point)
    if (optimizations?.imagesOptimized) score += 1;

    // Dark mode supported (+1 point)
    if (optimizations?.darkModeSupported) score += 1;

    // Mobile optimized (+2 points)
    if (optimizations?.mobileOptimized) score += 2;

    // Accessibility enhanced (+2 points)
    if (optimizations?.accessibilityEnhanced) score += 2;

    // Minified (+1 point)
    if (optimizations?.minified) score += 1;

    // Size check (+1 point if under 100KB)
    if (html.length < 100000) score += 1;

    return score / maxScore;
  }

  /**
   * Get compatible email clients based on HTML content
   */
  private static getCompatibleClients(html: string): string[] {
    const clients = ['Gmail', 'Outlook', 'Apple Mail', 'Yahoo Mail'];
    
    // Basic compatibility check (simplified)
    if (html.includes('flexbox') || html.includes('grid')) {
      return clients.filter(client => client === 'Apple Mail');
    }
    
    return clients;
  }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

/**
 * Email Template Builder for fluent construction
 */
export class EmailTemplateBuilder {
  private mjml: string = '';
  private html: string = '';
  private content: Partial<TemplateContent> = {};
  private options: any = {};

  static create(): EmailTemplateBuilder {
    return new EmailTemplateBuilder();
  }

  withMJML(mjml: string): EmailTemplateBuilder {
    this.mjml = mjml;
    return this;
  }

  withHTML(html: string): EmailTemplateBuilder {
    this.html = html;
    return this;
  }

  withSubject(subject: string): EmailTemplateBuilder {
    this.content.subject = subject;
    return this;
  }

  withPreheader(preheader: string): EmailTemplateBuilder {
    this.content.preheader = preheader;
    return this;
  }

  withBody(body: string): EmailTemplateBuilder {
    this.content.body = body;
    return this;
  }

  withCTA(cta: string[]): EmailTemplateBuilder {
    this.content.cta = cta;
    return this;
  }

  withTemplateType(templateType: TemplateMetadata['templateType']): EmailTemplateBuilder {
    this.options.templateType = templateType;
    return this;
  }

  withName(name: string): EmailTemplateBuilder {
    this.options.name = name;
    return this;
  }

  withTags(tags: string[]): EmailTemplateBuilder {
    this.options.tags = tags;
    return this;
  }

  withOptimizations(optimizations: TemplateOptimizations): EmailTemplateBuilder {
    this.options.optimizations = optimizations;
    return this;
  }

  build(): EmailTemplate {
    const fullContent: TemplateContent = {
      subject: this.content.subject || '',
      preheader: this.content.preheader || '',
      body: this.content.body || '',
      cta: this.content.cta || []
    };

    return EmailTemplate.create(
      this.mjml,
      this.html,
      fullContent,
      this.options
    );
  }
} 