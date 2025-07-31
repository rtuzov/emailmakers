/**
 * 🔄 Template Renderer Domain Service
 * 
 * Domain service for rendering MJML templates to HTML
 * Handles compilation, optimization, and email client compatibility
 */

import { 
  ITemplateRenderer,
  RenderingResult,
  RenderingOptions,
  BatchRenderRequest,
  BatchRenderResult,
  EmailClient
} from '../interfaces/mjml-generator.interface';
import { EmailTemplate } from '../entities/email-template.entity';

export class TemplateRendererService implements ITemplateRenderer {
  
  /**
   * Render MJML to HTML with email client optimizations
   */
  async render(mjmlContent: string, options: RenderingOptions = {}): Promise<RenderingResult> {
    const startTime = Date.now();
    
    try {
      // Step 1: Validate MJML content
      this.validateMjmlContent(mjmlContent);
      
      // Step 2: Pre-process MJML for optimization
      const processedMjml = this.preprocessMjml(mjmlContent, options);
      
      // Step 3: Compile MJML to HTML
      const compilationResult = await this.compileMjmlToHtml(processedMjml, options);
      
      // Step 4: Post-process HTML for email clients
      const optimizedHtml = this.postProcessHtml(compilationResult.html, options);
      
      // Step 5: Extract CSS
      const cssContent = this.extractCssFromHtml(optimizedHtml);
      
      // Step 6: Calculate metrics
      const renderTime = Date.now() - startTime;
      const fileSize = Buffer.byteLength(optimizedHtml, 'utf8');
      
      return {
        html: optimizedHtml,
        css: cssContent,
        fileSize,
        renderTime,
        warnings: compilationResult.warnings || []
      };
      
    } catch (error) {
      throw new Error(`MJML rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Batch render multiple MJML templates
   */
  async renderBatch(requests: BatchRenderRequest[]): Promise<BatchRenderResult> {
    const startTime = Date.now();
    const results: BatchRenderResult['results'] = [];
    let successCount = 0;
    let errorCount = 0;

    // Process templates in parallel for better performance
    const promises = requests.map(async (request) => {
      try {
        const result = await this.render(request.mjmlContent, request.options);
        successCount++;
        return {
          id: request.id,
          result
        };
      } catch (error) {
        errorCount++;
        return {
          id: request.id,
          result: {} as RenderingResult,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    const settledResults = await Promise.allSettled(promises);
    settledResults.forEach((settled, index) => {
      if (settled.status === 'fulfilled') {
        results.push(settled.value);
      } else {
        errorCount++;
        results.push({
          id: requests[index]?.id || 'unknown',
          result: {
            html: '',
            fileSize: 0,
            renderTime: 0,
            warnings: []
          },
          error: settled.reason instanceof Error ? settled.reason.message : 'Promise rejected'
        });
      }
    });

    return {
      results,
      totalProcessingTime: Date.now() - startTime,
      successCount,
      errorCount
    };
  }

  /**
   * Create EmailTemplate entity from rendered HTML
   */
  async createEmailTemplate(params: {
    name: string;
    mjmlContent: string;
    renderingResult: RenderingResult;
    mjmlSourceId: string;
    emailClients: EmailClient[];
  }): Promise<EmailTemplate> {
    const { name, mjmlContent, renderingResult, mjmlSourceId, emailClients } = params;
    
    // Calculate optimization summary
    const originalSize = Buffer.byteLength(mjmlContent, 'utf8');
    const optimizedSize = renderingResult.fileSize;
    
    return EmailTemplate.create({
      name,
      htmlContent: renderingResult.html,
      cssContent: renderingResult.css || '',
      mjmlSourceId,
      emailClients,
      optimizations: {
        cssInlined: this.hasCssInlined(renderingResult.html),
        imagesOptimized: false, // Will be handled by separate service
        darkModeSupported: this.hasDarkModeSupport(renderingResult.html),
        mobileOptimized: this.hasMobileOptimization(renderingResult.html),
        compressionApplied: false, // Will be handled by separate service
        originalSize,
        optimizedSize
      }
    });
  }

  /**
   * Validate MJML content structure
   */
  private validateMjmlContent(mjmlContent: string): void {
    if (!mjmlContent || typeof mjmlContent !== 'string') {
      throw new Error('MJML content must be a non-empty string');
    }

    if (!mjmlContent.includes('<mjml>') || !mjmlContent.includes('</mjml>')) {
      throw new Error('MJML content must have <mjml> root tags');
    }

    if (!mjmlContent.includes('<mj-body>')) {
      throw new Error('MJML content must have <mj-body> section');
    }

    // Check for forbidden elements
    const forbiddenElements = ['<mj-list', '<mj-list-item'];
    forbiddenElements.forEach(element => {
      if (mjmlContent.includes(element)) {
        throw new Error(`Forbidden element ${element} found in MJML content`);
      }
    });
  }

  /**
   * Pre-process MJML for optimization
   */
  private preprocessMjml(mjmlContent: string, options: RenderingOptions): string {
    let processed = mjmlContent;
    
    // Fix common MJML issues
    processed = this.fixCommonMjmlIssues(processed);
    
    // Apply email client specific optimizations
    if (options.target_clients) {
      processed = this.applyClientSpecificOptimizations(processed, options.target_clients);
    }
    
    return processed;
  }

  /**
   * Fix common MJML structural issues
   */
  private fixCommonMjmlIssues(mjmlContent: string): string {
    let fixed = mjmlContent;
    
    // Remove invalid MJML elements
    fixed = fixed.replace(/<mj-list[^>]*>/g, '');
    fixed = fixed.replace(/<\/mj-list>/g, '');
    fixed = fixed.replace(/<mj-list-item[^>]*>/g, '');
    fixed = fixed.replace(/<\/mj-list-item>/g, '');
    
    // Replace invalid class attributes with css-class
    fixed = fixed.replace(/\s+class="([^"]*)"/g, ' css-class="$1"');
    fixed = fixed.replace(/\s+class='([^']*)'/g, ' css-class=\'$1\'');
    
    // Fix nested sections
    fixed = this.fixNestedSections(fixed);
    
    return fixed;
  }

  /**
   * Fix nested mj-section elements
   */
  private fixNestedSections(mjmlContent: string): string {
    // Remove nested mj-sections which are invalid
    return mjmlContent.replace(
      /<mj-section([^>]*)>([\s\S]*?)<mj-section([^>]*)>([\s\S]*?)<\/mj-section>([\s\S]*?)<\/mj-section>/g,
      (_match, outerAttrs, outerPre, innerAttrs, innerContent, outerPost) => {
        // Create separate sections instead of nested ones
        return `<mj-section${outerAttrs}>${outerPre}</mj-section>\n<mj-section${innerAttrs}>${innerContent}</mj-section>\n<mj-section${outerAttrs}>${outerPost}</mj-section>`;
      }
    );
  }

  /**
   * Apply email client specific optimizations
   */
  private applyClientSpecificOptimizations(mjmlContent: string, targetClients: EmailClient[]): string {
    let optimized = mjmlContent;
    
    // Outlook optimizations
    if (targetClients.includes('outlook')) {
      optimized = this.optimizeForOutlook(optimized);
    }
    
    // Gmail optimizations
    if (targetClients.includes('gmail')) {
      optimized = this.optimizeForGmail(optimized);
    }
    
    // Apple Mail optimizations
    if (targetClients.includes('apple-mail')) {
      optimized = this.optimizeForAppleMail(optimized);
    }
    
    return optimized;
  }

  /**
   * Optimize MJML for Outlook compatibility
   */
  private optimizeForOutlook(mjmlContent: string): string {
    let optimized = mjmlContent;
    
    // Remove mj-hero elements (not well supported in Outlook)
    optimized = optimized.replace(/<mj-hero[\s\S]*?<\/mj-hero>/g, (match) => {
      // Convert mj-hero to standard mj-section with image
      const imageMatch = match.match(/background-url="([^"]*)"/) || match.match(/src="([^"]*)"/);
      const textMatch = match.match(/<mj-text[^>]*>([\s\S]*?)<\/mj-text>/);
      
      if (imageMatch && textMatch) {
        return `
        <mj-section>
          <mj-column>
            <mj-image src="${imageMatch[1]}" width="600px" />
            <mj-text align="center">${textMatch[1]}</mj-text>
          </mj-column>
        </mj-section>`;
      }
      return match;
    });
    
    // Ensure table-based layout attributes
    optimized = optimized.replace(/<mj-section/g, '<mj-section css-class="outlook-section"');
    
    return optimized;
  }

  /**
   * Optimize MJML for Gmail compatibility
   */
  private optimizeForGmail(mjmlContent: string): string {
    let optimized = mjmlContent;
    
    // Ensure media queries are preserved in style blocks
    if (optimized.includes('<mj-style>') && !optimized.includes('@media')) {
      optimized = optimized.replace('<mj-style>', '<mj-style>\n@media only screen and (max-width: 600px) { .mobile-hide { display: none !important; } }');
    }
    
    return optimized;
  }

  /**
   * Optimize MJML for Apple Mail compatibility
   */
  private optimizeForAppleMail(mjmlContent: string): string {
    // Apple Mail generally has good MJML support, minimal changes needed
    return mjmlContent;
  }

  /**
   * Compile MJML to HTML using MJML library
   */
  private async compileMjmlToHtml(mjmlContent: string, options: RenderingOptions): Promise<{
    html: string;
    warnings?: string[];
  }> {
    try {
      // Dynamic import for better performance
      const mjml = await import('mjml');
      
      if (typeof mjml.default !== 'function') {
        throw new Error('MJML compiler not available');
      }
      
      const result = mjml.default(mjmlContent, {
        validationLevel: options.validation_level || 'soft',
        keepComments: options.keep_comments || false,
        minify: options.minify || false
      });
      
      const warnings: string[] = [];
      if (result.errors && result.errors.length > 0) {
        // Convert MJML errors to warnings (non-blocking)
        warnings.push(...result.errors.map((err: any) => err.message || String(err)));
      }
      
      return {
        html: result.html,
        warnings
      };
      
    } catch (error) {
      throw new Error(`MJML compilation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Post-process HTML for email client compatibility
   */
  private postProcessHtml(html: string, options: RenderingOptions): string {
    let processed = html;
    
    // Ensure proper DOCTYPE for email
    if (!processed.includes('<!DOCTYPE html PUBLIC')) {
      processed = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">\n' + processed;
    }
    
    // Add email-specific meta tags
    processed = this.addEmailMetaTags(processed);
    
    // Apply email client specific fixes
    if (options.target_clients) {
      processed = this.applyHtmlClientFixes(processed, options.target_clients);
    }
    
    return processed;
  }

  /**
   * Add email-specific meta tags
   */
  private addEmailMetaTags(html: string): string {
    const metaTags = `
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="format-detection" content="telephone=no">
    <meta name="format-detection" content="date=no">
    <meta name="format-detection" content="address=no">
    <meta name="format-detection" content="email=no">
    <!--[if !mso]><!-->
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <!--<![endif]-->`;
    
    return html.replace('<head>', `<head>${metaTags}`);
  }

  /**
   * Apply HTML fixes for specific email clients
   */
  private applyHtmlClientFixes(html: string, targetClients: EmailClient[]): string {
    let fixed = html;
    
    // Outlook-specific fixes
    if (targetClients.includes('outlook')) {
      // Add Outlook conditional comments
      fixed = fixed.replace('<body', '<!--[if mso]><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"><tr><td><![endif]-->\n<body');
      fixed = fixed.replace('</body>', '</body>\n<!--[if mso]></td></tr></table><![endif]-->');
    }
    
    return fixed;
  }

  /**
   * Extract CSS content from HTML
   */
  private extractCssFromHtml(html: string): string {
    const styleMatches = html.match(/<style[^>]*>([\s\S]*?)<\/style>/g);
    if (!styleMatches) return '';
    
    return styleMatches
      .map(match => match.replace(/<\/?style[^>]*>/g, ''))
      .join('\n')
      .trim();
  }

  /**
   * Check if HTML has CSS inlined
   */
  private hasCssInlined(html: string): boolean {
    return html.includes('style="') && html.includes('background-color') && html.includes('font-size');
  }

  /**
   * Check if HTML has dark mode support
   */
  private hasDarkModeSupport(html: string): boolean {
    return html.includes('@media (prefers-color-scheme: dark)') || 
           html.includes('data-color-mode="dark"') ||
           html.includes('[data-ogsc]');
  }

  /**
   * Check if HTML has mobile optimization
   */
  private hasMobileOptimization(html: string): boolean {
    return html.includes('@media only screen and (max-width') || 
           html.includes('viewport') ||
           html.includes('mobile-');
  }
} 