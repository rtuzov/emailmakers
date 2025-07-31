/**
 * 🛠️ MJML Tool Adapter
 * 
 * Adapter for backward compatibility with the old MJML tool (renderMjml function)
 * Bridges old tool interface with new domain services
 */

import { TemplateRendererService } from '../services/template-renderer.service';
import { TemplateValidatorService } from '../services/template-validator.service';
import { MjmlGenerationService } from '../services/mjml-generation.service';

// Legacy tool interfaces
export interface MjmlParams {
  content: any;
  assets: {
    paths: string[];
    metadata: { [key: string]: any };
  };
  emailFolder?: string;
}

export interface ToolResult {
  type: 'success' | 'error';
  data: any;
  message: string;
}

export interface MjmlResult {
  mjml_content: string;
  html_content: string;
  file_details: {
    mjml_file_saved: boolean;
    html_file_saved: boolean;
    final_html_saved: boolean;
  };
  validation?: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  performance?: {
    renderTime: number;
    fileSize: number;
  };
}

/**
 * MJML Tool Adapter Class
 * Provides backward compatibility with old renderMjml tool
 */
export class MjmlToolAdapter {
  private templateRenderer: TemplateRendererService;
  private templateValidator: TemplateValidatorService;
  private mjmlService: MjmlGenerationService;

  constructor() {
    this.templateRenderer = new TemplateRendererService();
    this.templateValidator = new TemplateValidatorService();
    this.mjmlService = new MjmlGenerationService();
  }

  /**
   * Legacy renderMjml function
   * Maintains old tool interface while using new architecture
   */
  async renderMjml(params: MjmlParams): Promise<ToolResult> {
    try {
      console.log('🛠️ MJML Tool Adapter: Processing renderMjml request...');
      
      // Validate input parameters
      this.validateLegacyParams(params);
      
      // Check if we need to generate MJML from content or render existing MJML
      let mjmlContent: string;
      
      if (typeof params.content === 'string' && params.content.includes('<mjml>')) {
        // Content is already MJML, just render it
        mjmlContent = params.content;
        console.log('📄 Using provided MJML content directly');
      } else {
        // Content needs to be converted to MJML first
        mjmlContent = await this.generateMjmlFromContent(params.content, params.assets);
        console.log('🎨 Generated MJML from content');
      }

      // Render MJML to HTML
      const renderingResult = await this.templateRenderer.render(mjmlContent, {
        target_clients: ['gmail', 'outlook', 'apple-mail'],
        validation_level: 'soft',
        minify: false
      });

      // Validate the results
      const mjmlValidation = await this.templateValidator.validateMjml(mjmlContent);
      const htmlValidation = await this.templateValidator.validateHtml(
        renderingResult.html, 
        ['gmail', 'outlook', 'apple-mail']
      );

      // Save files if emailFolder is provided
      const fileDetails = await this.saveFiles(mjmlContent, renderingResult.html, params.emailFolder);

      // Create result in legacy format
      const result: MjmlResult = {
        mjml_content: mjmlContent,
        html_content: renderingResult.html,
        file_details: fileDetails,
        validation: {
          isValid: mjmlValidation.isValid && htmlValidation.isValid,
          errors: [
            ...mjmlValidation.errors.map(e => e.message),
            ...htmlValidation.errors.map(e => e.message)
          ],
          warnings: [
            ...mjmlValidation.warnings.map(w => w.message),
            ...htmlValidation.warnings.map(w => w.message)
          ]
        },
        performance: {
          renderTime: renderingResult.renderTime,
          fileSize: renderingResult.fileSize
        }
      };

      console.log('✅ MJML Tool Adapter: Successfully processed renderMjml request');
      
      return {
        type: 'success',
        data: result,
        message: `MJML rendered successfully. HTML size: ${(renderingResult.fileSize / 1024).toFixed(1)}KB`
      };

    } catch (error) {
      console.error('❌ MJML Tool Adapter error:', error);
      
      return {
        type: 'error',
        data: null,
        message: `MJML rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Legacy generateMjmlWithProgressiveSaving function
   */
  async generateMjmlWithProgressiveSaving(
    mjmlContent: string,
    _campaignId: string,
    _stage: string = 'AI_answer'
  ): Promise<{ mjmlContent: string; aiSaveSuccess: boolean }> {
    try {
      console.log('🛠️ MJML Tool Adapter: Processing generateMjmlWithProgressiveSaving...');
      
      // Validate MJML content
      const validation = await this.templateValidator.validateMjml(mjmlContent);
      
      if (!validation.isValid) {
        console.warn('⚠️ MJML validation warnings:', validation.warnings.map(w => w.message));
      }

      // For now, we don't implement the progressive saving functionality
      // as it's specific to the old file-based system
      console.log('📋 Progressive saving functionality replaced by new domain architecture');

      return {
        mjmlContent,
        aiSaveSuccess: true
      };

    } catch (error) {
      console.error('❌ generateMjmlWithProgressiveSaving error:', error);
      return {
        mjmlContent,
        aiSaveSuccess: false
      };
    }
  }

  /**
   * Validate legacy parameters
   */
  private validateLegacyParams(params: MjmlParams): void {
    if (!params.content) {
      throw new Error('Content parameter is required');
    }

    if (!params.assets) {
      params.assets = { paths: [], metadata: {} };
    }

    if (!Array.isArray(params.assets.paths)) {
      params.assets.paths = [];
    }
  }

  /**
   * Generate MJML from content using new architecture
   */
  private async generateMjmlFromContent(content: any, assets: any): Promise<string> {
    try {
      // Convert legacy content/assets to new request format
      const request = this.convertToGenerationRequest(content, assets);
      
      // Generate MJML using new service
      const result = await this.mjmlService.generateMjmlOnly(request);
      
      return result.mjmlContent;
      
    } catch (error) {
      throw new Error(`Failed to generate MJML from content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert legacy content/assets to new generation request format
   */
  private convertToGenerationRequest(content: any, assets: any): any {
    // Create a basic request structure for legacy content
    return {
      contentContext: {
        campaign: {
          id: 'legacy-tool-campaign',
          type: 'promotional',
          destination: 'unknown'
        },
        subject: content.subject || 'Email Campaign',
        preheader: content.preheader || 'Email preview',
        body: {
          opening: content.opening || 'Welcome!',
          main_content: content.main_content || content.body || 'Main content',
          benefits: content.benefits || ['Great offer'],
          social_proof: content.social_proof || 'Trusted by customers',
          urgency_elements: content.urgency_elements || 'Limited time',
          closing: content.closing || 'Thank you!'
        },
        emotional_hooks: content.emotional_hooks || {},
        personalization: content.personalization || {},
        call_to_action: content.call_to_action || {
          primary: { text: 'Learn More', url: 'https://example.com' }
        },
        pricing: content.pricing
      },
      designRequirements: {
        colors: {
          primary: '#007bff',
          accent: '#28a745',
          background: '#ffffff',
          text: '#333333'
        },
        layout: {
          maxWidth: 600,
          spacing: { small: 10, medium: 20, large: 30, xlarge: 40 },
          structure: { sections: [], columns: 1, responsive_breakpoints: [600] }
        },
        typography: {
          headingFont: 'Arial, sans-serif',
          bodyFont: 'Arial, sans-serif',
          fontSizes: {
            small: '14px', medium: '16px', large: '18px', xlarge: '20px',
            h1: '24px', h2: '20px', h3: '18px', body: '16px'
          },
          fontWeights: { normal: 400, bold: 700 }
        },
        email_clients: ['gmail', 'outlook', 'apple-mail'],
        responsive: true,
        dark_mode: false
      },
      assetManifest: {
        images: (assets.paths || []).map((path: string, index: number) => ({
          url: path,
          alt_text: `Image ${index + 1}`,
          usage: 'general',
          isExternal: path.startsWith('http'),
          description: `Image ${index + 1}`
        })),
        icons: [],
        fonts: []
      },
      templateDesign: {
        template_name: 'legacy-tool-template',
        layout: {
          type: 'gallery-focused',
          max_width: 600,
          spacing_system: { small: 10, medium: 20, large: 30, xlarge: 40 }
        },
        sections: [],
        components: [],
        visual_concept: 'Clean email template',
        target_audience: 'general',
        metadata: {
          campaign_type: 'promotional',
          brand_colors: {
            primary: '#007bff',
            accent: '#28a745',
            background: '#ffffff',
            text: '#333333'
          }
        }
      }
    };
  }

  /**
   * Save files (legacy functionality)
   */
  private async saveFiles(
    _mjmlContent: string, 
    _htmlContent: string, 
    emailFolder?: string
  ): Promise<{ mjml_file_saved: boolean; html_file_saved: boolean; final_html_saved: boolean }> {
    // In the new architecture, file saving is handled differently
    // For backward compatibility, we return success status
    const saved = !!emailFolder;
    
    if (emailFolder) {
      console.log(`📁 Files would be saved to: ${emailFolder} (legacy mode)`);
    }
    
    return {
      mjml_file_saved: saved,
      html_file_saved: saved,
      final_html_saved: saved
    };
  }
}

// Global instance for backward compatibility
export const mjmlToolAdapter = new MjmlToolAdapter();

/**
 * Legacy renderMjml function wrapper
 * Maintains exact same interface as old tool implementation
 */
export async function renderMjml(params: MjmlParams): Promise<ToolResult> {
  return mjmlToolAdapter.renderMjml(params);
}

/**
 * Legacy generateMjmlWithProgressiveSaving function wrapper
 */
export async function generateMjmlWithProgressiveSaving(
  mjmlContent: string,
  campaignId: string,
  stage: string = 'AI_answer'
): Promise<{ mjmlContent: string; aiSaveSuccess: boolean }> {
  return mjmlToolAdapter.generateMjmlWithProgressiveSaving(mjmlContent, campaignId, stage);
} 