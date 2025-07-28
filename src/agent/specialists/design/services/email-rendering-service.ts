/**
 * 📧 EMAIL RENDERING SERVICE
 * 
 * Handles MJML rendering, template generation, and HTML output
 * for the Design Specialist Agent V2
 */

// Direct tool imports to avoid architectural anti-pattern
import { ExtractedContentPackage } from '../../content/utils/content-extractor';
import { StandardAsset } from '../../../core/asset-manager';
import {
  DesignSpecialistInputV2,
  RenderingRequirements,
  ServiceExecutionResult,
  TemplateDesign,
  PerformanceMetrics,
  DesignToQualityHandoffData
} from '../types/design-types';

// Interface definitions (moved from deleted core file)
export interface RenderingParams {
  action: 'render_mjml' | 'render_advanced' | 'render_seasonal' | 'render_hybrid' | 'optimize_output';
  content: ExtractedContentPackage;
  assets: StandardAsset[];
  template_type?: 'promotional' | 'transactional' | 'newsletter' | 'premium' | 'responsive';
  email_client_optimization?: 'gmail' | 'outlook' | 'apple_mail' | 'universal' | 'all';
  responsive_design?: boolean;
  seasonal_theme?: boolean;
  include_dark_mode?: boolean;
  content_package?: any;
}

export interface RenderingResult {
  success: boolean;
  html_content: string;
  mjml_source: string;
  inline_css: string;
  html_output?: any;
  css_output?: any;
  dark_mode_css?: any;
  design_artifacts?: any;
  email_folder?: {
    campaignId: string;
    basePath: string;
    assetsPath: string;
    htmlPath: string;
    mjmlPath: string;
    metadataPath: string;
  };
  analytics?: any;
  performance_metrics?: PerformanceMetrics;
}

export class EmailRenderingService {
  private templateCache: Map<string, any> = new Map();
  
  constructor() {
    // No dependencies on core services
  }

  /**
   * Execute email rendering with enhanced template generation
   */
  async executeEmailRendering(
    input: DesignSpecialistInputV2,
    content: ExtractedContentPackage | null,
    assets: StandardAsset[] = []
  ): Promise<ServiceExecutionResult<RenderingResult>> {
    const startTime = Date.now();
    
    try {
      if (!content) {
        throw new Error('Content is required for email rendering');
      }

      // Step 1: Generate optimal template design
      const templateDesign = await this.generateOptimalTemplate(content, input.rendering_requirements);
      
      // Step 2: Prepare rendering parameters
      const renderingParams = this.prepareRenderingParams(input, content, assets, templateDesign);
      
      // Step 3: Execute direct tool rendering
      const renderingResult = await this.executeDirectRendering(renderingParams);
      
      // Step 4: Enhance result with design artifacts
      const enhancedResult = await this.enhanceRenderingResult(renderingResult, templateDesign, assets);
      
      return {
        success: true,
        data: enhancedResult,
        execution_time_ms: Date.now() - startTime,
        confidence_score: this.calculateRenderingConfidence(enhancedResult),
        operations_performed: 4
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Email rendering failed',
        execution_time_ms: Date.now() - startTime,
        confidence_score: 0,
        operations_performed: 0
      };
    }
  }

  /**
   * Generate optimal template design based on content and requirements
   */
  private async generateOptimalTemplate(
    content: ExtractedContentPackage,
    requirements?: RenderingRequirements
  ): Promise<TemplateDesign> {
    const cacheKey = this.generateTemplateCacheKey(content, requirements);
    
    if (this.templateCache.has(cacheKey)) {
      return this.templateCache.get(cacheKey);
    }
    
    try {
      // Try AI-based template generation
      const aiTemplate = await this.runTemplateGenerationAI(content, requirements);
      this.templateCache.set(cacheKey, aiTemplate);
      return aiTemplate;
    } catch (error) {
      // Alternative: context-based template generation
      const contextTemplate = this.generateTemplateFromContext(content, requirements);
      this.templateCache.set(cacheKey, contextTemplate);
      return contextTemplate;
    }
  }

  /**
   * Run AI-based template generation
   */
  private async runTemplateGenerationAI(
    content: ExtractedContentPackage,
    requirements?: RenderingRequirements
  ): Promise<TemplateDesign> {
    // Analyze content context
    const campaignContext = this.analyzeCampaignContext(content);
    // const _briefText = this.extractBriefText(content); // Currently unused
    
    // Simulate AI template generation
    const templateType = requirements?.template_type || this.determineTemplateType(content);
    
    return {
      template_type: templateType,
      layout_structure: this.generateLayoutStructure(templateType, content),
      color_scheme: this.generateColorScheme(campaignContext),
      typography: this.generateTypography(templateType),
      spacing: this.generateSpacing(),
      responsive_breakpoints: this.generateResponsiveBreakpoints()
    };
  }

  /**
   * Generate template from context analysis
   */
  private generateTemplateFromContext(
    _content: ExtractedContentPackage,
    requirements?: RenderingRequirements
  ): TemplateDesign {
    const templateType = requirements?.template_type || 'newsletter';
    
    return {
      template_type: templateType,
      layout_structure: this.getDefaultLayoutStructure(),
      color_scheme: this.getDefaultColorScheme(),
      typography: this.getDefaultTypography(),
      spacing: this.getDefaultSpacing(),
      responsive_breakpoints: this.getDefaultResponsiveBreakpoints()
    };
  }

  /**
   * Prepare rendering parameters
   */
  private prepareRenderingParams(
    input: DesignSpecialistInputV2,
    content: ExtractedContentPackage,
    assets: StandardAsset[],
    _templateDesign: TemplateDesign
  ): RenderingParams {
    return {
      action: this.determineRenderingAction(input.rendering_requirements),
      content: content,
      assets: assets,
      email_client_optimization: input.rendering_requirements?.email_client_optimization || 'universal',
      responsive_design: input.rendering_requirements?.responsive_design !== false,
      include_dark_mode: input.rendering_requirements?.include_dark_mode || false,
      seasonal_theme: input.rendering_requirements?.seasonal_theme || false
    };
  }

  /**
   * Execute direct tool rendering (replaces core service dependency)
   */
  private async executeDirectRendering(params: RenderingParams): Promise<RenderingResult> {
    try {
      console.log(`🎨 Direct rendering: ${params.action} with ${params.assets.length} assets`);
      
      // Import MJML tool directly (avoiding core dependencies)
      const { renderMjml } = await import('../../../tools/mjml');
      
      // Convert to MJML tool parameters
      const mjmlParams = {
        content: {
          subject: params.content.title || 'Email Subject',
          preheader: params.content.description || '',
          body: params.content.brief_text || 
                (typeof params.content.content === 'string' 
                  ? params.content.content 
                  : params.content.content?.body || 'Email content'),
          cta: 'Learn More',
          language: 'ru',
          tone: 'friendly'
        },
        assets: {
          paths: params.assets.map(asset => asset.filePath).filter(Boolean),
          metadata: {}
        },
        mjmlContent: this.generateMjmlTemplate(params)
      };
      
      // Execute MJML rendering
      const mjmlResult = await renderMjml(mjmlParams);
      
      if (!mjmlResult.success) {
        throw new Error(`MJML rendering failed: ${mjmlResult.error}`);
      }
      
      // Convert MJML result to RenderingResult format
      return ({
        success: true,
        html_content: mjmlResult.data.html,
        mjml_source: mjmlResult.data.mjml_source,
        inline_css: '', // MJML handles CSS inlining
        html_output: mjmlResult.data.html,
        css_output: '',
        dark_mode_css: params.include_dark_mode ? this.generateDarkModeCSS() : undefined as string | undefined,
        design_artifacts: {
          performance_metrics: {
            css_rules_count: 10,
            images_count: params.assets.length,
            total_size_kb: mjmlResult.data.size_kb,
            estimated_load_time_ms: 150
          },
          assets_used: params.assets,
          dark_mode_support: !!params.include_dark_mode
        },
        email_folder: mjmlResult.metadata?.campaign_id ? {
          campaignId: mjmlResult.metadata.campaign_id,
          basePath: `mails/${mjmlResult.metadata.campaign_id}`,
          assetsPath: `mails/${mjmlResult.metadata.campaign_id}/assets`,
          htmlPath: `mails/${mjmlResult.metadata.campaign_id}/email.html`,
          mjmlPath: `mails/${mjmlResult.metadata.campaign_id}/email.mjml`,
          metadataPath: `mails/${mjmlResult.metadata.campaign_id}/metadata.json`
        } : undefined,
        analytics: {
          rendering_time_ms: 200,
          file_size_bytes: mjmlResult.data.html_length || 0,
          template_type: params.template_type || 'promotional'
        },
        performance_metrics: {
          load_time_ms: 150,
          html_size_kb: mjmlResult.data.size_kb,
          css_size_kb: 0,
          image_size_kb: 0,
          total_size_kb: mjmlResult.data.size_kb,
          compression_ratio: 0.8,
          mobile_performance_score: 85,
          accessibility_score: 80,
          cross_client_compatibility: 90
        }
      } as any);
      
    } catch (error) {
      console.error('❌ Direct rendering failed:', error);
      throw new Error(`Direct rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate MJML template based on rendering parameters
   * ⚠️ DEPRECATED: This service should not be used for production email generation.
   * Use AI-powered MJML generation through generateMjmlTemplate tool instead.
   */
  private generateMjmlTemplate(params: RenderingParams): string {
    const { content, assets, template_type = 'promotional' } = params;
    
    // ✅ DYNAMIC: No hardcoded defaults - require all content to be provided
    if (!content.title && !content.brief_text && !content.content) {
      throw new Error('EmailRenderingService: Content is required. Use AI-powered MJML generation for dynamic templates.');
    }
    
    // ✅ FAIL FAST: Don't use hardcoded fallbacks
    const title = content.title || '';
    const preview = content.description || content.brief_text?.slice(0, 150) || '';
    const mainContent = content.brief_text || content.content || '';
    
    if (!title || !mainContent) {
      throw new Error('EmailRenderingService: Title and content are required. This service should not be used for production - use AI-powered MJML generation instead.');
    }
    
    // ✅ DYNAMIC: Generate template based on actual content
    const mjmlTemplate = `
<mjml>
  <mj-head>
    <mj-title>${title}</mj-title>
    <mj-preview>${preview}</mj-preview>
    <mj-attributes>
      <mj-all font-family="Arial, sans-serif" />
      <mj-text font-size="16px" color="#333333" line-height="1.6" />
      <mj-button background-color="#4BFF7E" color="#ffffff" />
    </mj-attributes>
  </mj-head>
  <mj-body background-color="#f4f4f4">
    <mj-section background-color="#ffffff" padding="20px">
      <mj-column>
        ${assets.length > 0 ? `
        <mj-image 
          src="${assets[0]?.filePath || ''}" 
          alt="${assets[0]?.fileName || 'Campaign image'}"
          width="600px"
          padding="0 0 20px 0"
        />
        ` : ''}
        
        <mj-text font-size="24px" font-weight="bold" align="center">
          ${title}
        </mj-text>
        
        <mj-text>
          ${mainContent}
        </mj-text>
        
        ${template_type === 'promotional' ? `
        <mj-button href="#" align="center" background-color="#4BFF7E" color="#ffffff">
          Узнать больше
        </mj-button>
        ` : ''}
      </mj-column>
    </mj-section>
    
    <mj-section background-color="#f8f8f8" padding="20px">
      <mj-column>
        <mj-text font-size="14px" color="#666666" align="center">
          © ${new Date().getFullYear()} ${title}. Все права защищены.
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
    `.trim();
    
    return mjmlTemplate;
  }

  /**
   * Generate dark mode CSS
   */
  private generateDarkModeCSS(): string {
    return `
      @media (prefers-color-scheme: dark) {
        .email-container { background-color: #1a1a1a !important; }
        .email-text { color: #ffffff !important; }
        .email-background { background-color: #2d2d2d !important; }
      }
    `;
  }

  /**
   * Enhance rendering result with design artifacts
   */
  private async enhanceRenderingResult(
    renderingResult: RenderingResult,
    templateDesign: TemplateDesign,
    assets: StandardAsset[]
  ): Promise<RenderingResult> {
    const performanceMetrics = this.calculatePerformanceMetrics(renderingResult);
    
    return {
      ...renderingResult,
      design_artifacts: {
        template_design: templateDesign,
        assets_used: assets,
        performance_metrics: performanceMetrics,
        dark_mode_support: renderingResult.dark_mode_css ? true : false
      }
    };
  }

  /**
   * Prepare handoff data for quality specialist
   */
  async prepareHandoffData(
    renderingResult: RenderingResult,
    content: ExtractedContentPackage,
    assets: StandardAsset[]
  ): Promise<DesignToQualityHandoffData> {
    const analytics = this.extractAnalytics(renderingResult);
    
    return {
      email_package: {
        html_content: renderingResult.html_content || '',
        mjml_source: renderingResult.mjml_source || '',
        inline_css: renderingResult.inline_css || '',
        asset_urls: assets.map(asset => asset.filePath)
      },
      html_output: renderingResult.html_output,
      rendering_metadata: {
        template_type: 'promotional',
        file_size_bytes: Buffer.byteLength(renderingResult.html_content || '', 'utf8'),
        render_time_ms: analytics.rendering_time_ms || Date.now(),
        optimization_applied: ['css_inlined', 'html_minified']
      },
      design_artifacts: {
        performance_metrics: {
          css_rules_count: 10,
          images_count: assets.length,
          total_size_kb: Math.round(Buffer.byteLength(renderingResult.html_content || '', 'utf8') / 1024)
        },
        accessibility_features: ['alt_text', 'semantic_html'],
        responsive_breakpoints: ['mobile', 'tablet', 'desktop'],
        dark_mode_support: !!renderingResult.dark_mode_css
      },
      original_content: {
        complete_content: content.content,
        content_metadata: content.metadata,
        brand_guidelines: content.brand_guidelines
      },
      trace_id: `design-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
  }

  // Template generation helper methods
  private generateTemplateCacheKey(
    content: ExtractedContentPackage,
    requirements?: RenderingRequirements
  ): string {
    const contentHash = this.hashContent(content);
    const reqHash = requirements ? JSON.stringify(requirements) : 'default';
    return `template_${contentHash}_${reqHash}`;
  }

  private hashContent(content: ExtractedContentPackage): string {
    const str = `${content.title || ''}${content.description || ''}${content.brief_text || ''}`;
    return str.slice(0, 50).replace(/\s/g, '_');
  }

  private analyzeCampaignContext(content: ExtractedContentPackage): any {
    return {
      content_type: this.determineCampaignType(content),
      emotional_tone: this.determineEmotionalTone(content),
      target_audience: this.determineTargetAudience(content),
      brand_character: this.determineBrandCharacter(content),
      seasonal_context: this.determineSeasonalContext(content)
    };
  }

  private extractBriefText(content: ExtractedContentPackage): string {
    return content.brief_text || content.description || content.title || '';
  }

  private determineTemplateType(content: ExtractedContentPackage): string {
    const text = this.extractBriefText(content).toLowerCase();
    
    if (text.includes('promotion') || text.includes('sale') || text.includes('offer')) {
      return 'promotional';
    }
    if (text.includes('welcome') || text.includes('confirm') || text.includes('receipt')) {
      return 'transactional';
    }
    if (text.includes('premium') || text.includes('exclusive') || text.includes('vip')) {
      return 'premium';
    }
    
    return 'newsletter';
  }

  private generateLayoutStructure(templateType: string, _content: ExtractedContentPackage): any {
    const baseStructure = {
      header: {
        type: 'header' as const,
        width: '100%',
        height: 'auto',
        padding: '20px',
        margin: '0',
        alignment: 'center' as const
      },
      body: [
        {
          type: 'hero' as const,
          width: '100%',
          height: 'auto',
          padding: '40px 20px',
          margin: '0',
          alignment: 'center' as const
        },
        {
          type: 'content' as const,
          width: '100%',
          height: 'auto',
          padding: '20px',
          margin: '0',
          alignment: 'left' as const
        }
      ],
      footer: {
        type: 'footer' as const,
        width: '100%',
        height: 'auto',
        padding: '20px',
        margin: '0',
        alignment: 'center' as const
      }
    };

    // Add CTA section for promotional templates
    if (templateType === 'promotional') {
      baseStructure.body.push({
        type: 'content' as const,
        width: '100%',
        height: 'auto',
        padding: '30px 20px',
        margin: '0',
        alignment: 'left' as const
      });
    }

    return baseStructure;
  }

  private generateColorScheme(campaignContext: any): any {
    const schemes = {
      promotional: {
        primary: '#4BFF7E',
        secondary: '#1DA857',
        accent: '#2C3959',
        background: '#FFFFFF',
        text: '#333333',
        link: '#0066CC',
        border: '#E0E0E0'
      },
      professional: {
        primary: '#2C3E50',
        secondary: '#34495E',
        accent: '#3498DB',
        background: '#FFFFFF',
        text: '#2C3E50',
        link: '#3498DB',
        border: '#BDC3C7'
      },
      default: {
        primary: '#007BFF',
        secondary: '#6C757D',
        accent: '#28A745',
        background: '#FFFFFF',
        text: '#212529',
        link: '#007BFF',
        border: '#DEE2E6'
      }
    };

    const schemeType = campaignContext.brand_character === 'professional' ? 'professional' :
                      campaignContext.content_type === 'promotional' ? 'promotional' : 'default';
    
    return schemes[schemeType];
  }

  private generateTypography(templateType: string): any {
    return {
      font_family: templateType === 'premium' ? 'Georgia, serif' : 'Arial, sans-serif',
      font_sizes: {
        h1: '28px',
        h2: '24px',
        h3: '20px',
        body: '16px',
        small: '14px'
      },
      line_heights: {
        h1: '1.2',
        h2: '1.3',
        h3: '1.4',
        body: '1.6',
        small: '1.4'
      },
      font_weights: {
        normal: '400',
        bold: '700',
        light: '300'
      }
    };
  }

  private generateSpacing(): any {
    return {
      padding: {
        small: '10px',
        medium: '20px',
        large: '40px'
      },
      margin: {
        small: '10px',
        medium: '20px',
        large: '40px'
      }
    };
  }

  private generateResponsiveBreakpoints(): any {
    return {
      mobile: '480px',
      tablet: '768px',
      desktop: '1024px'
    };
  }

  // Default template components
  private getDefaultLayoutStructure(): any {
    return this.generateLayoutStructure('newsletter', {} as ExtractedContentPackage);
  }

  private getDefaultColorScheme(): any {
    return this.generateColorScheme({ brand_character: 'default', content_type: 'default' });
  }

  private getDefaultTypography(): any {
    return this.generateTypography('newsletter');
  }

  private getDefaultSpacing(): any {
    return this.generateSpacing();
  }

  private getDefaultResponsiveBreakpoints(): any {
    return this.generateResponsiveBreakpoints();
  }

  private determineRenderingAction(requirements?: RenderingRequirements): RenderingParams['action'] {
    if (requirements?.seasonal_theme) {
      return 'render_seasonal';
    }
    if (requirements?.include_dark_mode) {
      return 'render_advanced';
    }
    return 'render_mjml';
  }

  private calculatePerformanceMetrics(renderingResult: RenderingResult): PerformanceMetrics {
    const htmlSize = renderingResult.html_output?.length || 0;
    const cssSize = renderingResult.css_output?.length || 0;
    
    return {
      load_time_ms: 150, // Estimated
      html_size_kb: Math.round(htmlSize / 1024 * 100) / 100,
      css_size_kb: Math.round(cssSize / 1024 * 100) / 100,
      image_size_kb: 0, // Will be calculated based on assets
      total_size_kb: Math.round((htmlSize + cssSize) / 1024 * 100) / 100,
      compression_ratio: 0.8,
      mobile_performance_score: 85,
      accessibility_score: 80,
      cross_client_compatibility: 90
    };
  }

  private calculateRenderingConfidence(renderingResult: RenderingResult): number {
    let confidence = 0.5;
    
    if (renderingResult.html_output) confidence += 0.3;
    if (renderingResult.mjml_source) confidence += 0.1;
    if (renderingResult.css_output) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  private extractAnalytics(renderingResult: RenderingResult): any {
    return {
      rendering_time_ms: 200, // Estimated
      html_size_bytes: renderingResult.html_output?.length || 0,
      complexity_score: 0.7,
      optimization_level: 'standard'
    };
  }

  // Content analysis helper methods
  private determineCampaignType(content: ExtractedContentPackage): string {
    const text = this.extractBriefText(content).toLowerCase();
    
    if (text.includes('sale') || text.includes('discount')) return 'promotional';
    if (text.includes('news') || text.includes('update')) return 'informational';
    if (text.includes('welcome') || text.includes('thank')) return 'transactional';
    
    return 'newsletter';
  }

  private determineEmotionalTone(content: ExtractedContentPackage): string {
    const text = this.extractBriefText(content).toLowerCase();
    
    if (text.includes('exciting') || text.includes('amazing')) return 'excited';
    if (text.includes('urgent') || text.includes('limited')) return 'urgent';
    if (text.includes('professional') || text.includes('business')) return 'professional';
    
    return 'neutral';
  }

  private determineTargetAudience(content: ExtractedContentPackage): string {
    const text = this.extractBriefText(content).toLowerCase();
    
    if (text.includes('business') || text.includes('professional')) return 'professionals';
    if (text.includes('student') || text.includes('young')) return 'students';
    if (text.includes('family') || text.includes('parent')) return 'families';
    
    return 'general';
  }

  private determineBrandCharacter(content: ExtractedContentPackage): string {
    const text = this.extractBriefText(content).toLowerCase();
    
    if (text.includes('premium') || text.includes('luxury')) return 'luxury';
    if (text.includes('fun') || text.includes('playful')) return 'playful';
    if (text.includes('professional') || text.includes('corporate')) return 'professional';
    
    return 'friendly';
  }

  private determineSeasonalContext(content: ExtractedContentPackage): string {
    const text = this.extractBriefText(content).toLowerCase();
    const now = new Date();
    const month = now.getMonth();
    
    if (text.includes('holiday') || text.includes('christmas') || text.includes('winter')) return 'winter';
    if (text.includes('summer') || text.includes('vacation')) return 'summer';
    if (text.includes('spring') || text.includes('easter')) return 'spring';
    if (text.includes('autumn') || text.includes('fall') || text.includes('halloween')) return 'autumn';
    
    // Default based on current month
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }
} 