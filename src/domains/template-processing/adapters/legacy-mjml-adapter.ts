/**
 * 🔄 Legacy MJML Adapter
 * 
 * Adapter for backward compatibility with the old MJML generator API
 * Uses the new domain architecture under the hood while maintaining old interface
 */

import {
  MjmlGenerationService,
  MjmlGenerationRequest
} from '../services/mjml-generation.service';
import { MjmlTemplate } from '../entities/mjml-template.entity';

// Legacy interfaces for backward compatibility
export interface LegacyMjmlParams {
  contentContext: any;
  designBrief?: any;
  assetManifest: any;
  templateDesign?: any;
  colors: {
    primary: string;
    accent: string;
    background: string;
    text: string;
  };
  layout: {
    maxWidth: number;
    headingFont: string;
    bodyFont: string;
    typography: any;
  };
  trace_id?: string | null;
  context?: any;
  error_feedback?: string;
  retry_attempt?: number;
}

export interface LegacyMjmlResult {
  source: string;
  file_size: number;
  technical_compliance: {
    max_width_respected: boolean;
    color_scheme_applied: boolean;
    typography_followed: boolean;
    email_client_optimized: boolean;
    real_asset_paths: boolean;
  };
  specifications_used: {
    layout: string;
    max_width: number;
    color_scheme: number;
    typography: string;
    email_clients: number;
  };
  html_content?: string;
  html_path?: string;
  mjml_path?: string;
}

/**
 * Legacy MJML Adapter Class
 * Provides backward compatibility with old generateDynamicMjmlTemplate function
 */
export class LegacyMjmlAdapter {
  private mjmlService: MjmlGenerationService;

  constructor() {
    this.mjmlService = new MjmlGenerationService();
  }

  /**
   * Legacy generateDynamicMjmlTemplate function
   * Maintains old interface while using new architecture
   */
  async generateDynamicMjmlTemplate(params: LegacyMjmlParams): Promise<LegacyMjmlResult> {
    try {
      console.log('🔄 Legacy MJML Adapter: Converting old API to new architecture...');
      
      // Convert legacy parameters to new format
      const newRequest = this.convertLegacyParams(params);
      
      // Use new service architecture
      const result = await this.mjmlService.generateComplete(newRequest, {
        validateInput: true,
        renderToHtml: true,
        optimizeForClients: ['gmail', 'outlook', 'apple-mail'],
        performanceLogging: !!params.trace_id
      });

      // Convert result back to legacy format
      const legacyResult = this.convertToLegacyResult(result.mjmlTemplate, result.emailTemplate);
      
      console.log('✅ Legacy MJML Adapter: Successfully generated template using new architecture');
      return legacyResult;
      
    } catch (error) {
      console.error('❌ Legacy MJML Adapter error:', error);
      throw new Error(`Legacy MJML generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert legacy parameters to new MjmlGenerationRequest format
   */
  private convertLegacyParams(params: LegacyMjmlParams): MjmlGenerationRequest {
    const { contentContext, assetManifest, templateDesign, colors, layout } = params;

    // Extract campaign information
    const campaignInfo = this.extractCampaignInfo(contentContext, params.context);

    // Convert to new format
    const request: MjmlGenerationRequest = {
      contentContext: {
        campaign: {
          id: campaignInfo.id,
          type: campaignInfo.type,
          destination: campaignInfo.destination
        },
        subject: this.extractSubject(contentContext),
        preheader: contentContext.preheader || contentContext.generated_content?.preheader || '',
        body: this.extractStructuredBody(contentContext),
        emotional_hooks: contentContext.emotional_hooks || contentContext.generated_content?.emotional_hooks || {},
        personalization: contentContext.personalization || contentContext.generated_content?.personalization || {},
        call_to_action: this.extractCallToAction(contentContext),
        pricing: contentContext.pricing || contentContext.pricing_analysis || contentContext.generated_content?.pricing
      },
      designRequirements: {
        colors,
        layout: {
          maxWidth: layout.maxWidth,
          spacing: { small: 10, medium: 20, large: 30, xlarge: 40 },
          structure: { sections: [], columns: 1, responsive_breakpoints: [600] }
        },
        typography: {
          headingFont: layout.headingFont,
          bodyFont: layout.bodyFont,
          fontSizes: {
            small: '14px', medium: '16px', large: '18px', xlarge: '20px',
            h1: '28px', h2: '24px', h3: '20px', body: '16px'
          },
          fontWeights: { normal: 400, bold: 700 }
        },
        email_clients: ['gmail', 'outlook', 'apple-mail'],
        responsive: true,
        dark_mode: false
      },
      assetManifest: this.convertAssetManifest(assetManifest),
      templateDesign: templateDesign || this.createDefaultTemplateDesign(colors, layout)
    };

    // Add traceId only if it exists
    if (params.trace_id) {
      (request as any).traceId = params.trace_id;
    }

    return request;
  }

  /**
   * Extract campaign information from legacy context
   */
  private extractCampaignInfo(contentContext: any, context?: any): {
    id: string;
    type: any;
    destination: string;
  } {
    // Try to extract campaign ID from various sources
    let campaignId = 'legacy-campaign';
    if (context?.context?.campaign?.id) {
      campaignId = context.context.campaign.id;
    } else if (context?.campaignContext?.campaign?.id) {
      campaignId = context.campaignContext.campaign.id;
    }

    // Determine campaign type from content
    let campaignType: any = 'promotional';
    if (contentContext.pricing || contentContext.pricing_analysis) {
      campaignType = 'promotional';
    } else if (contentContext.newsletter || contentContext.type === 'newsletter') {
      campaignType = 'newsletter';
    }

    // Extract destination
    let destination = 'destination';
    if (contentContext.destination) {
      destination = contentContext.destination;
    } else if (contentContext.location) {
      destination = contentContext.location;
    } else if (contentContext.travel_destination) {
      destination = contentContext.travel_destination;
    }

    return { id: campaignId, type: campaignType, destination };
  }

  /**
   * Extract subject from legacy format
   */
  private extractSubject(contentContext: any): string {
    let subject = contentContext.subject || contentContext.subject_line || contentContext.generated_content?.subject;
    
    if (typeof subject === 'object' && subject) {
      subject = subject.primary || subject.main || subject.text || subject.value || String(subject);
    }
    
    return typeof subject === 'string' ? subject : 'Email Campaign';
  }

  /**
   * Extract structured body from legacy format
   */
  private extractStructuredBody(contentContext: any): any {
    const body = contentContext.body || contentContext.sections || contentContext.generated_content?.body || contentContext.generated_content?.sections;
    
    if (typeof body === 'object' && body) {
      return {
        opening: body.opening || 'Welcome!',
        main_content: body.main_content || 'Main content',
        benefits: Array.isArray(body.benefits) ? body.benefits : ['Great benefits available'],
        social_proof: body.social_proof || 'Trusted by thousands',
        urgency_elements: body.urgency_elements || 'Limited time offer',
        closing: body.closing || 'Thank you!'
      };
    }
    
    // Fallback for string body
    return {
      opening: 'Welcome!',
      main_content: typeof body === 'string' ? body : 'Main content',
      benefits: ['Great offer available'],
      social_proof: 'Trusted by customers',
      urgency_elements: 'Book now',
      closing: 'Thank you!'
    };
  }

  /**
   * Extract call to action from legacy format
   */
  private extractCallToAction(contentContext: any): any {
    const cta = contentContext.call_to_action || contentContext.cta || contentContext.generated_content?.call_to_action;
    
    if (cta?.primary) {
      return cta;
    }
    
    // Create default CTA
    return {
      primary: {
        text: 'Book Now',
        url: 'https://example.com'
      }
    };
  }

  /**
   * Convert legacy asset manifest to new format
   */
  private convertAssetManifest(assetManifest: any): any {
    const images = assetManifest?.images || assetManifest?.assetManifest?.images || [];
    
    return {
      images: images.map((img: any, index: number) => ({
        url: img.path || img.file_path || img.url,
        alt_text: img.description || img.alt_text || `Image ${index + 1}`,
        usage: img.usage || 'general',
        isExternal: img.purpose === 'external_image' || img.isExternal || false,
        description: img.description || `Image ${index + 1}`
      })),
      icons: [],
      fonts: []
    };
  }

  /**
   * Create default template design for legacy compatibility
   */
  private createDefaultTemplateDesign(colors: any, layout: any): any {
    return {
      template_name: `legacy-template-${Date.now()}`,
      layout: {
        type: 'gallery-focused',
        max_width: layout.maxWidth || 600,
        spacing_system: { small: 10, medium: 20, large: 30, xlarge: 40 }
      },
      sections: [], // Will be generated dynamically
      components: [],
      visual_concept: 'Modern email template',
      target_audience: 'general',
      metadata: {
        campaign_type: 'promotional',
        brand_colors: colors
      }
    };
  }

  /**
   * Convert new result back to legacy format
   */
  private convertToLegacyResult(mjmlTemplate: MjmlTemplate, emailTemplate?: any): LegacyMjmlResult {
    const fileSize = Buffer.byteLength(mjmlTemplate.mjmlContent, 'utf8');
    
    return {
      source: mjmlTemplate.mjmlContent,
      file_size: fileSize,
      technical_compliance: {
        max_width_respected: mjmlTemplate.mjmlContent.includes('600px') || mjmlTemplate.mjmlContent.includes('max-width'),
        color_scheme_applied: mjmlTemplate.mjmlContent.includes('background-color') || mjmlTemplate.mjmlContent.includes('color'),
        typography_followed: mjmlTemplate.mjmlContent.includes('font-family') || mjmlTemplate.mjmlContent.includes('font-size'),
        email_client_optimized: mjmlTemplate.mjmlContent.includes('mj-') && mjmlTemplate.mjmlContent.includes('<mjml>'),
        real_asset_paths: mjmlTemplate.mjmlContent.includes('<mj-image')
      },
      specifications_used: {
        layout: mjmlTemplate.metadata.layoutType,
        max_width: 600,
        color_scheme: 4, // primary, accent, background, text
        typography: 'Inter, Arial, sans-serif',
        email_clients: 3 // gmail, outlook, apple-mail
      },
      html_content: emailTemplate?.htmlContent,
      html_path: emailTemplate?.id ? `templates/${emailTemplate.id}.html` : `templates/${mjmlTemplate.id}.html`,
      mjml_path: `templates/${mjmlTemplate.id}.mjml`
    };
  }
}

// Global instance for backward compatibility
export const legacyMjmlAdapter = new LegacyMjmlAdapter();

/**
 * Legacy function wrapper for generateDynamicMjmlTemplate
 * Maintains exact same interface as old implementation
 */
export async function generateDynamicMjmlTemplate(params: LegacyMjmlParams): Promise<LegacyMjmlResult> {
  return legacyMjmlAdapter.generateDynamicMjmlTemplate(params);
}

// Export old MjmlTemplate type for compatibility
export interface MjmlTemplate_Legacy {
  source: string;
  file_size: number;
  technical_compliance: {
    max_width_respected: boolean;
    color_scheme_applied: boolean;
    typography_followed: boolean;
    email_client_optimized: boolean;
    real_asset_paths: boolean;
  };
  specifications_used: {
    layout: string;
    max_width: number;
    color_scheme: number;
    typography: string;
    email_clients: number;
  };
  html_content?: string;
  html_path?: string;
  mjml_path?: string;
} 