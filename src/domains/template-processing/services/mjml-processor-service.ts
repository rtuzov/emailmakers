/**
 * 🔄 MJML Processor Service (Refactored)
 * 
 * Refactored version of the MJML processor using new domain architecture
 * Replaces old monolithic implementation with clean domain services
 */

import { 
  MjmlGenerationService, 
  MjmlGenerationServiceOptions,
  CompleteMjmlGenerationResult 
} from './mjml-generation.service';
import { TemplateRendererService } from './template-renderer.service';
import { TemplateValidatorService } from './template-validator.service';
import { 
  MjmlGenerationRequest,
  EmailClient,
  ValidationResult,
  RenderingResult 
} from '../interfaces/mjml-generator.interface';
import { MjmlTemplate } from '../entities/mjml-template.entity';
import { EmailTemplate } from '../entities/email-template.entity';

// Legacy compatibility interfaces (keeping for backward compatibility)
export interface EmailTemplate_Legacy {
  id: string;
  name: string;
  mjmlContent: string;
  designTokens?: DesignTokenSet;
  targetClients: EmailClient[];
  requirements: TemplateRequirements;
}

export interface DesignTokenSet {
  colors: ColorToken[];
  typography: TypographyToken[];
  spacing: SpacingToken[];
  components: ComponentToken[];
}

export interface ColorToken {
  name: string;
  value: string;
  darkModeValue?: string;
  semanticMeaning: string;
}

export interface TypographyToken {
  name: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  emailFallback: string;
}

export interface SpacingToken {
  name: string;
  value: number;
  usage: 'margin' | 'padding' | 'gap';
}

export interface ComponentToken {
  name: string;
  mjmlTag: string;
  defaultStyles: { [key: string]: string };
}

export interface TemplateRequirements {
  maxWidth: number;
  darkModeSupport: boolean;
  accessibilityLevel: 'basic' | 'enhanced' | 'full';
  clientCompatibility: EmailClient[];
}

export interface ProcessingResult {
  success: boolean;
  template: MjmlTemplate;
  htmlTemplate?: EmailTemplate;
  validation: ValidationResult;
  renderingResult?: RenderingResult;
  processingTime: number;
  optimization?: OptimizationReport;
}

export interface OptimizationReport {
    originalSize: number;
    optimizedSize: number;
    compressionRatio: number;
  optimizationsApplied: string[];
  performanceScore: number;
}

/**
 * MJML Processor Service - Refactored Implementation
 * 
 * This service now acts as a facade over the new domain architecture
 * while maintaining backward compatibility with the old interface
 */
export class MjmlProcessorService {
  private mjmlGenerationService: MjmlGenerationService;
  private templateRenderer: TemplateRendererService;
  private templateValidator: TemplateValidatorService;

  constructor() {
    this.mjmlGenerationService = new MjmlGenerationService();
    this.templateRenderer = new TemplateRendererService();
    this.templateValidator = new TemplateValidatorService();
  }

  /**
   * Process email template using new domain architecture
   * Main entry point that replaces old monolithic processing
   */
  async processTemplate(
    request: MjmlGenerationRequest,
    options: MjmlGenerationServiceOptions = {}
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 MJML Processor: Starting template processing with new architecture...');

      // Use new domain service for complete generation
      const result = await this.mjmlGenerationService.generateComplete(request, {
        ...options,
        renderToHtml: true,
        validateInput: true,
        performanceLogging: true
      });

      // Create optimization report
      const optimizationReport = this.createOptimizationReport(result);

      const processingResult: ProcessingResult = {
        success: true,
        template: result.mjmlTemplate,
        validation: result.finalValidation,
        processingTime: Date.now() - startTime,
        optimization: optimizationReport
      };

      // Add optional properties only if they exist
      if (result.emailTemplate) {
        processingResult.htmlTemplate = result.emailTemplate;
      }
      if (result.renderingResult) {
        processingResult.renderingResult = result.renderingResult;
      }

      console.log('✅ MJML Processor: Template processing completed successfully');
      return processingResult;

    } catch (error) {
      console.error('❌ MJML Processor error:', error);
      
      // Return error result
      return {
        success: false,
        template: {} as MjmlTemplate,
        validation: {
          isValid: false,
          errors: [{
            code: 'PROCESSING_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
            severity: 'critical',
            location: 'processor'
          }],
          warnings: [],
          score: 0
        },
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Process MJML template from string (legacy compatibility)
   */
  async processMjmlString(
    mjmlContent: string,
    targetClients: EmailClient[] = ['gmail', 'outlook', 'apple-mail'],
    options: { validate?: boolean; optimize?: boolean } = {}
  ): Promise<{
    html: string;
    validation: ValidationResult;
    performance: { renderTime: number; fileSize: number };
  }> {
    console.log('🔄 MJML Processor: Processing MJML string...');

    try {
      // Validate MJML if requested
      let validation: ValidationResult = { isValid: true, errors: [], warnings: [], score: 100 };
      
      if (options.validate !== false) {
        validation = await this.templateValidator.validateMjml(mjmlContent);
        if (!validation.isValid) {
          console.warn('⚠️ MJML validation issues found:', validation.errors.length, 'errors');
        }
      }

      // Render MJML to HTML
      const renderingResult = await this.templateRenderer.render(mjmlContent, {
        target_clients: targetClients,
        validation_level: 'soft',
        minify: options.optimize || false
      });

      return {
        html: renderingResult.html,
        validation,
        performance: {
          renderTime: renderingResult.renderTime,
          fileSize: renderingResult.fileSize
        }
      };

    } catch (error) {
      throw new Error(`MJML string processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate template against email client compatibility
   */
  async validateTemplate(
    template: MjmlTemplate | string,
    targetClients: EmailClient[]
  ): Promise<ValidationResult> {
    const mjmlContent = typeof template === 'string' ? template : template.mjmlContent;
    
    // Use new validator service
    const mjmlValidation = await this.templateValidator.validateMjml(mjmlContent);
    
    // If MJML is valid, also validate HTML output
    if (mjmlValidation.isValid) {
      try {
        const renderingResult = await this.templateRenderer.render(mjmlContent, {
          target_clients: targetClients
        });
        
        const htmlValidation = await this.templateValidator.validateHtml(
          renderingResult.html, 
          targetClients
        );
        
        // Combine validations
        return {
          isValid: mjmlValidation.isValid && htmlValidation.isValid,
          errors: [...mjmlValidation.errors, ...htmlValidation.errors],
          warnings: [...mjmlValidation.warnings, ...htmlValidation.warnings],
          score: Math.round((mjmlValidation.score + htmlValidation.score) / 2)
        };
      } catch (error) {
        // If HTML rendering fails, return MJML validation only
        return mjmlValidation;
      }
    }
    
    return mjmlValidation;
  }

  /**
   * Optimize template for specific email clients
   */
  async optimizeForClients(
    mjmlContent: string,
    targetClients: EmailClient[]
  ): Promise<{
    optimizedMjml: string;
    optimizedHtml: string;
    optimizations: string[];
    performanceGain: number;
  }> {
    console.log('🎯 MJML Processor: Optimizing for clients:', targetClients.join(', '));

    const originalSize = Buffer.byteLength(mjmlContent, 'utf8');

    // Use new service for optimization
    const result = await this.mjmlGenerationService.optimizeForClients(mjmlContent, targetClients);
    
    const optimizedSize = Buffer.byteLength(result.optimizedHtml, 'utf8');
    const performanceGain = ((originalSize - optimizedSize) / originalSize) * 100;

    return {
      optimizedMjml: result.optimizedMjml,
      optimizedHtml: result.optimizedHtml,
      optimizations: result.optimizations,
      performanceGain: Math.max(0, performanceGain)
    };
  }

  /**
   * Get compatibility report for template
   */
  async getCompatibilityReport(
    mjmlContent: string,
    targetClients: EmailClient[]
  ): Promise<{
    overallCompatibility: number;
    clientReports: Array<{
      client: EmailClient;
      compatible: boolean;
      issues: string[];
      score: number;
    }>;
    recommendations: string[];
  }> {
    console.log('📊 MJML Processor: Generating compatibility report...');

    // Use new service for compatibility analysis
    const report = await this.mjmlGenerationService.getCompatibilityReport(mjmlContent, targetClients);
    
    // Calculate overall compatibility score
    const compatibleClients = report.clientSpecificIssues.filter(c => c.compatible).length;
    const overallCompatibility = (compatibleClients / targetClients.length) * 100;
    
    // Generate recommendations
    const recommendations = this.generateCompatibilityRecommendations(report.clientSpecificIssues);

    return {
      overallCompatibility,
      clientReports: report.clientSpecificIssues.map(issue => ({
        client: issue.client,
        compatible: issue.compatible,
        issues: issue.issues,
        score: issue.compatible ? 100 : Math.max(0, 100 - (issue.issues.length * 20))
      })),
      recommendations
    };
  }

  /**
   * Create template from design tokens (new feature)
   */
  async createFromDesignTokens(
    designTokens: DesignTokenSet,
    content: any,
    targetClients: EmailClient[]
  ): Promise<ProcessingResult> {
    console.log('🎨 MJML Processor: Creating template from design tokens...');

    // Convert design tokens to new format
    const request = this.convertDesignTokensToRequest(designTokens, content, targetClients);
    
    // Use new architecture
    return this.processTemplate(request, {
      validateInput: true,
      renderToHtml: true,
      optimizeForClients: targetClients,
      performanceLogging: true
    });
  }

  // Private helper methods
  private createOptimizationReport(result: CompleteMjmlGenerationResult): OptimizationReport {
    const originalSize = result.performanceMetrics.templateSize;
    const optimizedSize = result.renderingResult?.fileSize || originalSize;
    const compressionRatio = optimizedSize / originalSize;
    
    const optimizationsApplied = [
      'MJML compilation',
      'CSS inlining',
      'Email client optimization'
    ];
    
    if (result.emailTemplate?.metadata.optimizations.darkModeSupported) {
      optimizationsApplied.push('Dark mode support');
    }
    
    if (result.emailTemplate?.metadata.optimizations.mobileOptimized) {
      optimizationsApplied.push('Mobile optimization');
    }

    return {
      originalSize,
      optimizedSize,
      compressionRatio,
      optimizationsApplied,
      performanceScore: result.finalValidation.score
    };
  }

  private generateCompatibilityRecommendations(
    clientIssues: Array<{ client: EmailClient; compatible: boolean; issues: string[] }>
  ): string[] {
    const recommendations: string[] = [];
    
    const outlookIssues = clientIssues.find(c => c.client === 'outlook');
    if (outlookIssues && !outlookIssues.compatible) {
      recommendations.push('Use table-based layouts for better Outlook compatibility');
      recommendations.push('Avoid CSS flexbox and grid properties');
    }
    
    const gmailIssues = clientIssues.find(c => c.client === 'gmail');
    if (gmailIssues && !gmailIssues.compatible) {
      recommendations.push('Keep email size under 102KB to prevent Gmail clipping');
      recommendations.push('Use media queries in embedded styles');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Template is well-optimized for target email clients');
    }
    
    return recommendations;
  }

  private convertDesignTokensToRequest(
    designTokens: DesignTokenSet,
    content: any,
    targetClients: EmailClient[]
  ): MjmlGenerationRequest {
    // Extract colors from design tokens
    const colors = {
      primary: designTokens.colors.find(c => c.semanticMeaning === 'primary')?.value || '#007bff',
      accent: designTokens.colors.find(c => c.semanticMeaning === 'accent')?.value || '#28a745',
      background: designTokens.colors.find(c => c.semanticMeaning === 'background')?.value || '#ffffff',
      text: designTokens.colors.find(c => c.semanticMeaning === 'text')?.value || '#333333'
    };
    
    // Extract typography
    const typography = designTokens.typography[0] || {
      fontFamily: 'Arial, sans-serif',
      fontSize: 16,
      fontWeight: 400,
      lineHeight: 1.5,
      emailFallback: 'Arial, sans-serif'
    };

    return {
      contentContext: {
        campaign: {
          id: 'design-tokens-campaign',
          type: 'promotional',
          destination: 'generated'
        },
        subject: content.subject || 'Email Campaign',
        preheader: content.preheader || 'Email preview',
        body: content.body || {
          opening: 'Welcome!',
          main_content: 'Main content',
          benefits: ['Great features'],
          social_proof: 'Trusted by customers',
          urgency_elements: 'Limited time',
          closing: 'Thank you!'
        },
        emotional_hooks: content.emotional_hooks || {},
        personalization: content.personalization || {},
        call_to_action: content.call_to_action || {
          primary: { text: 'Learn More', url: 'https://example.com' }
        }
      },
      designRequirements: {
        colors,
        layout: {
          maxWidth: 600,
          spacing: { small: 10, medium: 20, large: 30, xlarge: 40 },
          structure: { sections: [], columns: 1, responsive_breakpoints: [600] }
        },
        typography: {
          headingFont: typography.fontFamily,
          bodyFont: typography.fontFamily,
          fontSizes: {
            small: '14px', medium: '16px', large: '18px', xlarge: '20px',
            h1: '24px', h2: '20px', h3: '18px', body: `${typography.fontSize}px`
          },
          fontWeights: { normal: typography.fontWeight, bold: 700 }
        },
        email_clients: targetClients,
        responsive: true,
        dark_mode: designTokens.colors.some(c => c.darkModeValue)
      },
      assetManifest: {
        images: content.images || [],
        icons: [],
        fonts: []
      },
      templateDesign: {
        template_name: 'design-tokens-template',
        layout: {
          type: 'gallery-focused',
          max_width: 600,
          spacing_system: { small: 10, medium: 20, large: 30, xlarge: 40 }
        },
        sections: [],
        components: [],
        visual_concept: 'Modern design token based template',
        target_audience: 'general',
        metadata: {
          campaign_type: 'promotional',
          brand_colors: colors
        }
      }
    };
  }
} 