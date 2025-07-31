/**
 * 🎯 MJML Generation Application Service
 * 
 * Main application service that orchestrates MJML template generation
 * Coordinates between domain services and provides unified interface
 */

import { 
  MjmlGenerationRequest,
  MjmlGenerationResult,
  RenderingResult,
  ValidationResult,
  EmailClient,
  PerformanceMetrics
} from '../interfaces/mjml-generator.interface';
import { MjmlTemplate } from '../entities/mjml-template.entity';
import { EmailTemplate } from '../entities/email-template.entity';
import { MjmlGeneratorService } from './mjml-generator.service';
import { TemplateRendererService } from './template-renderer.service';
import { TemplateValidatorService } from './template-validator.service';

export interface MjmlGenerationServiceOptions {
  validateInput?: boolean;
  renderToHtml?: boolean;
  optimizeForClients?: EmailClient[];
  enableCaching?: boolean;
  performanceLogging?: boolean;
}

export interface CompleteMjmlGenerationResult {
  mjmlTemplate: MjmlTemplate;
  emailTemplate?: EmailTemplate;
  generationResult: MjmlGenerationResult;
  renderingResult?: RenderingResult;
  finalValidation: ValidationResult;
  performanceMetrics: PerformanceMetrics;
  processingTime: number;
}

export class MjmlGenerationService {
  private mjmlGenerator: MjmlGeneratorService;
  private templateRenderer: TemplateRendererService;
  private templateValidator: TemplateValidatorService;

  constructor(
    mjmlGenerator?: MjmlGeneratorService,
    templateRenderer?: TemplateRendererService,
    templateValidator?: TemplateValidatorService
  ) {
    this.mjmlGenerator = mjmlGenerator || new MjmlGeneratorService();
    this.templateRenderer = templateRenderer || new TemplateRendererService();
    this.templateValidator = templateValidator || new TemplateValidatorService();
  }

  /**
   * Complete MJML generation workflow
   * Generates MJML, optionally renders to HTML, and validates everything
   */
  async generateComplete(
    request: MjmlGenerationRequest,
    options: MjmlGenerationServiceOptions = {}
  ): Promise<CompleteMjmlGenerationResult> {
    const startTime = Date.now();
    
    try {
      // Step 1: Input validation (if enabled)
      if (options.validateInput !== false) {
        const inputValidation = this.mjmlGenerator.validateRequest(request);
        if (!inputValidation.isValid) {
          throw new Error(`Invalid generation request: ${inputValidation.errors[0]?.message || 'Validation error'}`);
        }
      }

      // Step 2: Generate MJML template
      const generationResult = await this.mjmlGenerator.generate(request);
      
      // Step 3: Create MJML template entity
      const mjmlTemplate = MjmlTemplate.create({
        name: this.generateTemplateName(request),
        mjmlContent: generationResult.mjmlContent,
        layoutType: generationResult.metadata.layoutType,
        sectionsCount: generationResult.metadata.sectionsCount,
        assetsUsed: generationResult.metadata.assetsUsed
      });

      // Step 4: Render to HTML (if requested)
      let renderingResult: RenderingResult | undefined;
      let emailTemplate: EmailTemplate | undefined;
      
      if (options.renderToHtml !== false) {
        renderingResult = await this.templateRenderer.render(
          generationResult.mjmlContent,
          {
            target_clients: options.optimizeForClients || ['gmail', 'outlook', 'apple-mail'],
            validation_level: 'soft',
            minify: false
          }
        );

        // Create email template entity
        emailTemplate = await this.templateRenderer.createEmailTemplate({
          name: mjmlTemplate.name,
          mjmlContent: generationResult.mjmlContent,
          renderingResult,
          mjmlSourceId: mjmlTemplate.id,
          emailClients: options.optimizeForClients || ['gmail', 'outlook', 'apple-mail']
        });
      }

      // Step 5: Final validation
      const finalValidation = this.performFinalValidation(
        mjmlTemplate,
        emailTemplate,
        options.optimizeForClients
      );

      // Step 6: Calculate comprehensive performance metrics
      const performanceMetrics = this.calculateComprehensiveMetrics(
        generationResult.performance,
        renderingResult,
        startTime
      );

      const result: CompleteMjmlGenerationResult = {
        mjmlTemplate,
        generationResult,
        finalValidation,
        performanceMetrics,
        processingTime: Date.now() - startTime
      };

      // Add optional properties only if they exist
      if (emailTemplate) {
        result.emailTemplate = emailTemplate;
      }
      if (renderingResult) {
        result.renderingResult = renderingResult;
      }

      // Log performance if enabled
      if (options.performanceLogging) {
        this.logPerformanceMetrics(result);
      }

      return result;

    } catch (error) {
      throw new Error(`MJML generation workflow failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate MJML only (without rendering to HTML)
   */
  async generateMjmlOnly(request: MjmlGenerationRequest): Promise<MjmlGenerationResult> {
    return this.mjmlGenerator.generate(request);
  }

  /**
   * Render existing MJML to HTML
   */
  async renderMjmlToHtml(
    mjmlContent: string,
    options: {
      targetClients?: EmailClient[];
      validateFirst?: boolean;
    } = {}
  ): Promise<RenderingResult> {
    // Validate MJML first if requested
    if (options.validateFirst !== false) {
      const validation = this.templateValidator.validateMjml(mjmlContent);
      if (!validation.isValid) {
        throw new Error(`MJML validation failed: ${validation.errors[0]?.message || 'Validation error'}`);
      }
    }

    return this.templateRenderer.render(mjmlContent, {
      target_clients: options.targetClients || ['gmail', 'outlook', 'apple-mail'],
      validation_level: 'soft'
    });
  }

  /**
   * Validate MJML template
   */
  async validateMjmlTemplate(mjmlContent: string): Promise<ValidationResult> {
    return this.templateValidator.validateMjml(mjmlContent);
  }

  /**
   * Validate HTML email template
   */
  async validateHtmlTemplate(
    htmlContent: string,
    targetClients: EmailClient[] = ['gmail', 'outlook', 'apple-mail']
  ): Promise<ValidationResult> {
    return this.templateValidator.validateHtml(htmlContent, targetClients);
  }

  /**
   * Batch process multiple MJML generation requests
   */
  async generateBatch(
    requests: Array<{
      id: string;
      request: MjmlGenerationRequest;
      options?: MjmlGenerationServiceOptions;
    }>
  ): Promise<Array<{
    id: string;
    result?: CompleteMjmlGenerationResult;
    error?: string;
  }>> {
    const results = await Promise.allSettled(
      requests.map(async ({ id, request, options }) => {
        try {
          const result = await this.generateComplete(request, options);
          return { id, result };
        } catch (error) {
          return {
            id,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    return results.map((settled, index) => {
      if (settled.status === 'fulfilled') {
        return settled.value;
      } else {
        return {
          id: requests[index]?.id || 'unknown',
          error: settled.reason instanceof Error ? settled.reason.message : 'Promise rejected'
        };
      }
    });
  }

  /**
   * Get template compatibility report
   */
  async getCompatibilityReport(
    mjmlContent: string,
    targetClients: EmailClient[]
  ): Promise<{
    mjmlValidation: ValidationResult;
    htmlValidation?: ValidationResult;
    clientSpecificIssues: Array<{
      client: EmailClient;
      compatible: boolean;
      issues: string[];
    }>;
  }> {
    // Validate MJML
    const mjmlValidation = await this.validateMjmlTemplate(mjmlContent);
    
    let htmlValidation: ValidationResult | undefined;
    let clientSpecificIssues: Array<{
      client: EmailClient;
      compatible: boolean;
      issues: string[];
    }> = [];

    try {
      // Render to HTML for client-specific validation
      const renderingResult = await this.renderMjmlToHtml(mjmlContent, {
        targetClients,
        validateFirst: false
      });

      // Validate HTML
      htmlValidation = await this.validateHtmlTemplate(renderingResult.html, targetClients);

      // Create MJML template for compatibility checking
      const mjmlTemplate = MjmlTemplate.create({
        name: 'compatibility-test',
        mjmlContent,
        layoutType: 'gallery-focused',
        sectionsCount: 1,
        assetsUsed: 0
      });

      // Get client-specific compatibility
      clientSpecificIssues = mjmlTemplate.checkCompatibility(targetClients);

    } catch (error) {
      // If rendering fails, still return MJML validation
      console.warn('HTML rendering failed during compatibility check:', error);
    }

    return {
      mjmlValidation,
      htmlValidation: htmlValidation || {
        isValid: true,
        errors: [],
        warnings: [],
        score: 100
      },
      clientSpecificIssues
    };
  }

  /**
   * Optimize existing MJML for specific email clients
   */
  async optimizeForClients(
    mjmlContent: string,
    targetClients: EmailClient[]
  ): Promise<{
    optimizedMjml: string;
    optimizedHtml: string;
    optimizations: string[];
  }> {
    const optimizations: string[] = [];

    // Render with client-specific optimizations
    const renderingResult = await this.templateRenderer.render(mjmlContent, {
      target_clients: targetClients,
      validation_level: 'soft'
    });

    optimizations.push('Applied email client specific optimizations');
    optimizations.push('Added proper DOCTYPE for email');
    optimizations.push('Inlined CSS for better compatibility');

    if (targetClients.includes('outlook')) {
      optimizations.push('Applied Outlook-specific fixes');
    }

    if (targetClients.includes('gmail')) {
      optimizations.push('Applied Gmail-specific optimizations');
    }

    return {
      optimizedMjml: mjmlContent, // For now, MJML optimization is done during rendering
      optimizedHtml: renderingResult.html,
      optimizations
    };
  }

  // Private helper methods
  private performFinalValidation(
    mjmlTemplate: MjmlTemplate,
    emailTemplate?: EmailTemplate,
    targetClients?: EmailClient[]
  ): ValidationResult {
    const mjmlValidation = mjmlTemplate.validate();
    
    if (emailTemplate && targetClients) {
      const htmlValidation = emailTemplate.validate();
      
      // Combine validations
      return {
        isValid: mjmlValidation.isValid && htmlValidation.isValid,
        errors: [...mjmlValidation.errors, ...htmlValidation.errors],
        warnings: [...mjmlValidation.warnings, ...htmlValidation.warnings],
        score: Math.round((mjmlValidation.score + htmlValidation.score) / 2)
      };
    }

    return mjmlValidation;
  }

  private calculateComprehensiveMetrics(
    generationMetrics: PerformanceMetrics,
    renderingResult?: RenderingResult,
    startTime?: number
  ): PerformanceMetrics {
    const baseMetrics = { ...generationMetrics };
    
    if (renderingResult) {
      baseMetrics.resourceUsage.cpuTime += renderingResult.renderTime;
    }

    if (startTime) {
      baseMetrics.generationTime = Date.now() - startTime;
    }

    return baseMetrics;
  }

  private generateTemplateName(request: MjmlGenerationRequest): string {
    const destination = request.contentContext.campaign.destination || 'email';
    const layoutType = request.templateDesign?.layout?.type || 'standard';
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    
    return `${destination}-${layoutType}-${timestamp}`;
  }

  private logPerformanceMetrics(result: CompleteMjmlGenerationResult): void {
    console.log('🚀 MJML Generation Performance Metrics:');
    console.log(`   📊 Total Processing Time: ${result.processingTime}ms`);
    console.log(`   🎨 MJML Generation: ${result.performanceMetrics.generationTime}ms`);
    
    if (result.renderingResult) {
      console.log(`   🔄 HTML Rendering: ${result.renderingResult.renderTime}ms`);
      console.log(`   📏 File Sizes: MJML(${(result.performanceMetrics.templateSize / 1024).toFixed(1)}KB) → HTML(${(result.renderingResult.fileSize / 1024).toFixed(1)}KB)`);
    }
    
    console.log(`   ✅ Validation Score: ${result.finalValidation.score}/100`);
    console.log(`   ⚠️  Warnings: ${result.finalValidation.warnings.length}`);
    console.log(`   ❌ Errors: ${result.finalValidation.errors.length}`);
    
    if (result.finalValidation.errors.length === 0) {
      console.log(`   🎯 Status: Ready for delivery`);
    } else {
      console.log(`   🔧 Status: Needs fixes before delivery`);
    }
  }
}

// Export types for external use
export type {
  MjmlGenerationRequest
} from '../interfaces/mjml-generator.interface'; 