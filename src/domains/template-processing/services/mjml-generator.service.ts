/**
 * 🎨 MJML Generator Domain Service
 * 
 * Core domain service for generating MJML templates
 * Contains the main business logic extracted from the original generator
 */

import { 
  IMjmlGenerator,
  MjmlGenerationRequest,
  MjmlGenerationResult,
  ValidationResult,
  TemplateSection,
  ColorScheme,
  PerformanceMetrics,
  LayoutType
} from '../interfaces/mjml-generator.interface';
import { MjmlTemplate } from '../entities/mjml-template.entity';

export class MjmlGeneratorService implements IMjmlGenerator {
  
  /**
   * Generate MJML template from content and design requirements
   */
  async generate(request: MjmlGenerationRequest): Promise<MjmlGenerationResult> {
    const startTime = Date.now();
    
    // Validate request
    const requestValidation = this.validateRequest(request);
    if (!requestValidation.isValid) {
      throw new Error(`Invalid generation request: ${requestValidation.errors[0]?.message || 'Validation error'}`);
    }

    try {
      // Step 1: Determine optimal layout
      const layoutConfig = this.determineLayoutType(request);
      
      // Step 2: Build structured sections
      const sections = this.buildTemplateSections(request, layoutConfig);
      
      // Step 3: Generate MJML content
      const mjmlContent = this.generateMjmlContent(request, sections);
      
      // Step 4: Create MJML template entity
      const template = MjmlTemplate.create({
        name: this.generateTemplateName(request),
        mjmlContent,
        layoutType: layoutConfig.layoutType,
        sectionsCount: sections.length,
        assetsUsed: request.assetManifest.images.length
      });

      // Step 5: Calculate performance metrics
      const performanceMetrics = this.calculatePerformanceMetrics(template, startTime);
      
      return {
        mjmlContent,
        metadata: template.metadata,
        validation: template.validate(),
        performance: performanceMetrics
      };

    } catch (error) {
      throw new Error(`MJML generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate MJML generation request
   */
  validateRequest(request: MjmlGenerationRequest): ValidationResult {
    const errors = [];
    const warnings = [];

    // Validate content context
    if (!request.contentContext) {
      errors.push({
        code: 'MISSING_CONTENT_CONTEXT',
        message: 'Content context is required',
        severity: 'critical' as const,
        location: 'request',
        suggestedFix: 'Provide contentContext object'
      });
    } else {
      if (!request.contentContext.subject) {
        errors.push({
          code: 'MISSING_SUBJECT',
          message: 'Email subject is required',
          severity: 'high' as const,
          location: 'contentContext',
          suggestedFix: 'Provide subject field'
        });
      }

      if (!request.contentContext.body) {
        errors.push({
          code: 'MISSING_BODY',
          message: 'Email body content is required',
          severity: 'high' as const,
          location: 'contentContext',
          suggestedFix: 'Provide structured body content'
        });
      }

      if (!request.contentContext.call_to_action?.primary) {
        errors.push({
          code: 'MISSING_PRIMARY_CTA',
          message: 'Primary call-to-action is required',
          severity: 'high' as const,
          location: 'contentContext',
          suggestedFix: 'Provide primary CTA with text and URL'
        });
      }
    }

    // Validate design requirements
    if (!request.designRequirements) {
      errors.push({
        code: 'MISSING_DESIGN_REQUIREMENTS',
        message: 'Design requirements are required',
        severity: 'critical' as const,
        location: 'request',
        suggestedFix: 'Provide designRequirements object'
      });
    } else {
      if (!request.designRequirements.colors) {
        errors.push({
          code: 'MISSING_COLORS',
          message: 'Color scheme is required',
          severity: 'high' as const,
          location: 'designRequirements',
          suggestedFix: 'Provide color scheme with primary, accent, background, and text colors'
        });
      }
    }

    // Validate asset manifest
    if (!request.assetManifest?.images || request.assetManifest.images.length === 0) {
      errors.push({
        code: 'MISSING_IMAGES',
        message: 'At least one image is required',
        severity: 'high' as const,
        location: 'assetManifest',
        suggestedFix: 'Provide at least one image in asset manifest'
      });
    }

    // Validate template design
    if (!request.templateDesign) {
      warnings.push({
        code: 'MISSING_TEMPLATE_DESIGN',
        message: 'Template design not provided, will use default layout',
        location: 'request',
        recommendation: 'Provide template design for better customization'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, 100 - errors.length * 20 - warnings.length * 5)
    };
  }

  /**
   * Determine optimal layout type based on content and requirements
   */
  private determineLayoutType(request: MjmlGenerationRequest): {
    layoutType: LayoutType;
    imageStrategy: string;
    sectionPriority: string[];
  } {
    const { contentContext, assetManifest, templateDesign } = request;
    
    const imageCount = assetManifest.images.length;
    const hasMultipleCTAs = contentContext.call_to_action && 
      (contentContext.call_to_action.secondary || contentContext.call_to_action.urgency_cta);
    const contentLength = JSON.stringify(contentContext.body).length;
    const campaignType = templateDesign?.metadata?.campaign_type;
    
    let layoutType: LayoutType = 'gallery-focused'; // default
    let imageStrategy = 'standard-gallery';
    let sectionPriority = ['hero', 'gallery', 'content', 'cta', 'footer'];

    // MINIMAL LAYOUT: Less content, fewer images
    if (imageCount <= 2 || contentLength < 500) {
      layoutType = 'minimal';
      imageStrategy = 'hero-only';
      sectionPriority = ['hero', 'content', 'cta', 'footer'];
    }
    // CONTENT-HEAVY LAYOUT: Long content, story-driven
    else if (contentLength > 1500 || campaignType === 'newsletter') {
      layoutType = 'content-heavy';
      imageStrategy = 'content-supporting';
      sectionPriority = ['hero', 'content', 'gallery', 'cta', 'footer'];
    }
    // CTA-FOCUSED LAYOUT: Multiple CTAs, conversion-driven
    else if (hasMultipleCTAs || campaignType === 'promotional') {
      layoutType = 'cta-focused';
      imageStrategy = 'conversion-supporting';
      sectionPriority = ['hero', 'urgency', 'benefits', 'gallery', 'multiple-cta', 'footer'];
    }
    // LUXURY LAYOUT: Premium destinations, visual-first
    else if (campaignType === 'luxury' || templateDesign?.target_audience === 'luxury') {
      layoutType = 'luxury-visual';
      imageStrategy = 'hero-gallery-showcase';
      sectionPriority = ['hero', 'gallery', 'premium-content', 'exclusive-cta', 'footer'];
    }

    console.log(`🎨 Selected layout: ${layoutType} with ${imageStrategy} strategy`);
    console.log(`📋 Section priority: ${sectionPriority.join(' → ')}`);
    
    return { layoutType, imageStrategy, sectionPriority };
  }

  /**
   * Build template sections based on layout and content
   */
  private buildTemplateSections(
    request: MjmlGenerationRequest, 
    layoutConfig: { layoutType: LayoutType; sectionPriority: string[] }
  ): TemplateSection[] {
    const sections: TemplateSection[] = [];
    const { contentContext, designRequirements, assetManifest } = request;

    // Use template design sections if available
    if (request.templateDesign?.sections) {
      return request.templateDesign.sections;
    }

    // Generate sections based on layout priority
    layoutConfig.sectionPriority.forEach(sectionType => {
      switch (sectionType) {
        case 'hero':
          sections.push(this.createHeroSection(contentContext, assetManifest, designRequirements.colors));
          break;
        case 'content':
          sections.push(this.createContentSection(contentContext, designRequirements.colors));
          break;
        case 'gallery':
          if (assetManifest.images.length > 1) {
            sections.push(this.createGallerySection(assetManifest, designRequirements.colors));
          }
          break;
        case 'benefits':
          if (contentContext.body.benefits && contentContext.body.benefits.length > 0) {
            sections.push(this.createBenefitsSection(contentContext, designRequirements.colors));
          }
          break;
        case 'urgency':
          if (contentContext.body.urgency_elements) {
            sections.push(this.createUrgencySection(contentContext, designRequirements.colors));
          }
          break;
        case 'cta':
        case 'multiple-cta':
          sections.push(this.createCtaSection(contentContext, designRequirements.colors));
          break;
        case 'footer':
          sections.push(this.createFooterSection(designRequirements.colors));
          break;
      }
    });

    return sections;
  }

  /**
   * Generate complete MJML content
   */
  private generateMjmlContent(
    request: MjmlGenerationRequest,
    sections: TemplateSection[]
  ): string {
    const { contentContext, designRequirements } = request;
    
    const mjmlHead = this.generateMjmlHead(contentContext, designRequirements);
    const mjmlBody = this.generateMjmlBody(sections, designRequirements.colors);

    return `<mjml>
  ${mjmlHead}
  ${mjmlBody}
</mjml>`;
  }

  /**
   * Generate MJML head section
   */
  private generateMjmlHead(contentContext: any, designRequirements: any): string {
    return `<mj-head>
    <mj-title>${contentContext.subject}</mj-title>
    <mj-preview>${contentContext.preheader}</mj-preview>
    
    <mj-attributes>
      <mj-all font-family="${designRequirements.typography?.bodyFont || 'Arial, sans-serif'}" />
      <mj-text font-size="16px" color="${designRequirements.colors.text}" line-height="1.6" />
      <mj-button background-color="${designRequirements.colors.primary}" 
                 color="white"
                 border-radius="4px"
                 font-weight="bold" />
    </mj-attributes>
    
    <mj-style>
      .benefit-list { margin: 0; padding-left: 20px; }
      .benefit-list li { margin-bottom: 10px; }
      @media only screen and (max-width: 600px) {
        .mobile-center { text-align: center !important; }
        .mobile-padding { padding: 10px !important; }
      }
    </mj-style>
  </mj-head>`;
  }

  /**
   * Generate MJML body with sections
   */
  private generateMjmlBody(sections: TemplateSection[], colors: ColorScheme): string {
    const sectionsHtml = sections.map(section => this.generateSectionMjml(section, colors)).join('\n');
    
    return `<mj-body background-color="${colors.background}">
    ${sectionsHtml}
  </mj-body>`;
  }

  /**
   * Generate MJML for individual section
   */
  private generateSectionMjml(section: TemplateSection, colors: ColorScheme): string {
    const backgroundColor = section.background?.color || colors.background;
    
    switch (section.position) {
      case 'hero':
        return this.generateHeroSectionMjml(section, backgroundColor, colors);
      case 'content1':
        return this.generateContentSectionMjml(section, backgroundColor, colors);
      case 'gallery':
        return this.generateGallerySectionMjml(section, backgroundColor, colors);
      case 'benefits':
        return this.generateBenefitsSectionMjml(section, backgroundColor, colors);
      case 'urgency':
        return this.generateUrgencySectionMjml(section, backgroundColor);
      case 'cta':
        return this.generateCtaSectionMjml(section, backgroundColor, colors);
      case 'footer':
        return this.generateFooterSectionMjml(section, backgroundColor, colors);
      default:
        return this.generateDefaultSectionMjml(section, backgroundColor, colors);
    }
  }

  // Section generators
  private createHeroSection(contentContext: any, assetManifest: any, colors: ColorScheme): TemplateSection {
    const heroImage = assetManifest.images[0];
    return {
      position: 'hero',
      background: { type: 'color', color: colors.background },
      content: {
        text: contentContext.body.opening,
        images: heroImage ? [heroImage.url] : [],
        font: { size: '24px', weight: 'bold', color: colors.text }
      }
    };
  }

  private createContentSection(contentContext: any, colors: ColorScheme): TemplateSection {
    return {
      position: 'content1',
      background: { type: 'color', color: colors.background },
      content: {
        text: contentContext.body.main_content,
        font: { size: '16px', weight: 'normal', color: colors.text }
      }
    };
  }

  private createGallerySection(assetManifest: any, colors: ColorScheme): TemplateSection {
    return {
      position: 'gallery',
      background: { type: 'color', color: colors.background },
      content: {
        text: 'Галерея направления',
        images: assetManifest.images.slice(1, 4).map((img: any) => img.url),
        font: { size: '20px', weight: 'bold', color: colors.text }
      }
    };
  }

  private createBenefitsSection(contentContext: any, colors: ColorScheme): TemplateSection {
    return {
      position: 'benefits',
      background: { type: 'color', color: colors.background },
      content: {
        text: 'Преимущества предложения',
        items: contentContext.body.benefits,
        font: { size: '16px', weight: 'normal', color: colors.text }
      }
    };
  }

  private createUrgencySection(contentContext: any, colors: ColorScheme): TemplateSection {
    return {
      position: 'urgency',
      background: { type: 'color', color: colors.accent },
      content: {
        text: contentContext.body.urgency_elements,
        font: { size: '18px', weight: 'bold', color: 'white' }
      }
    };
  }

  private createCtaSection(contentContext: any, colors: ColorScheme): TemplateSection {
    const buttons = [];
    
    if (contentContext.call_to_action.primary) {
      buttons.push({
        text: contentContext.call_to_action.primary.text,
        link: contentContext.call_to_action.primary.url,
        font: { size: '18px', weight: 'bold', color: 'white' }
      });
    }
    
    if (contentContext.call_to_action.secondary) {
      buttons.push({
        text: contentContext.call_to_action.secondary.text,
        link: contentContext.call_to_action.secondary.url,
        font: { size: '16px', weight: 'normal', color: colors.primary }
      });
    }

    return {
      position: 'cta',
      background: { type: 'color', color: colors.background },
      content: {
        text: '',
        buttons,
        font: { size: '18px', weight: 'bold', color: colors.text }
      }
    };
  }

  private createFooterSection(colors: ColorScheme): TemplateSection {
    return {
      position: 'footer',
      background: { type: 'color', color: colors.background },
      content: {
        text: 'С уважением, команда Kupibilet\n\n© 2024 Kupibilet. Все права защищены.\nКонтакты: support@kupibilet.ru',
        font: { size: '14px', weight: 'normal', color: colors.text }
      }
    };
  }

  // MJML generators for each section type
  private generateHeroSectionMjml(section: TemplateSection, bgColor: string, colors: ColorScheme): string {
    const hasImage = section.content.images && section.content.images.length > 0;
    const image = hasImage ? section.content.images![0] : '';

    return `
    <mj-section background-color="${bgColor}" padding="20px 0">
      ${hasImage ? `
      <mj-column width="100%">
        <mj-image src="${image}" width="550px" alt="Hero image" padding="10px" />
      </mj-column>` : ''}
      <mj-column width="100%">
        <mj-text align="center" font-size="${section.content.font?.size || '24px'}" 
                 font-weight="${section.content.font?.weight || 'bold'}" 
                 color="${section.content.font?.color || colors.text}" 
                 padding="20px">
          ${section.content.text}
        </mj-text>
      </mj-column>
    </mj-section>`;
  }

  private generateContentSectionMjml(section: TemplateSection, bgColor: string, colors: ColorScheme): string {
    return `
    <mj-section background-color="${bgColor}" padding="20px 0">
      <mj-column width="100%">
        <mj-text align="left" font-size="${section.content.font?.size || '16px'}" 
                 color="${section.content.font?.color || colors.text}" 
                 padding="20px">
          ${section.content.text}
        </mj-text>
      </mj-column>
    </mj-section>`;
  }

  private generateGallerySectionMjml(section: TemplateSection, bgColor: string, colors: ColorScheme): string {
    if (!section.content.images || section.content.images.length === 0) {
      return '';
    }

    const imageColumns = section.content.images.map(imageUrl => `
        <mj-column width="33%">
          <mj-image src="${imageUrl}" width="180px" alt="Gallery image" padding="10px" />
        </mj-column>`).join('');

    return `
    <mj-section background-color="${bgColor}" padding="20px 0">
      <mj-column width="100%">
        <mj-text align="center" font-size="20px" font-weight="bold" color="${colors.text}" padding="10px 20px">
          ${section.content.text}
        </mj-text>
      </mj-column>
      ${imageColumns}
    </mj-section>`;
  }

  private generateBenefitsSectionMjml(section: TemplateSection, bgColor: string, colors: ColorScheme): string {
    const benefitItems = section.content.items?.map(item => `<li>${item}</li>`).join('') || '';

    return `
    <mj-section background-color="${bgColor}" padding="20px 0">
      <mj-column width="100%">
        <mj-text align="center" font-size="20px" font-weight="bold" color="${colors.text}" padding="10px 20px">
          ${section.content.text}
        </mj-text>
        <mj-text align="left" font-size="${section.content.font?.size || '16px'}" 
                 color="${section.content.font?.color || colors.text}" 
                 padding="10px 20px">
          <ul css-class="benefit-list">${benefitItems}</ul>
        </mj-text>
      </mj-column>
    </mj-section>`;
  }

  private generateUrgencySectionMjml(section: TemplateSection, bgColor: string): string {
    return `
    <mj-section background-color="${bgColor}" padding="20px 0">
      <mj-column width="100%">
        <mj-text align="center" font-size="${section.content.font?.size || '18px'}" 
                 font-weight="${section.content.font?.weight || 'bold'}" 
                 color="${section.content.font?.color || 'white'}" 
                 padding="15px 20px">
          ⚡ ${section.content.text}
        </mj-text>
      </mj-column>
    </mj-section>`;
  }

  private generateCtaSectionMjml(section: TemplateSection, bgColor: string, colors: ColorScheme): string {
    const buttons = section.content.buttons || [];
    const buttonElements = buttons.map(btn => `
        <mj-button href="${btn.link}" 
                   background-color="${colors.primary}" 
                   color="${btn.font?.color || 'white'}" 
                   font-size="${btn.font?.size || '18px'}" 
                   font-weight="${btn.font?.weight || 'bold'}" 
                   border-radius="4px" 
                   padding="10px 25px">
          ${btn.text}
        </mj-button>`).join('');

    return `
    <mj-section background-color="${bgColor}" padding="30px 0">
      <mj-column width="100%">
        ${buttonElements}
      </mj-column>
    </mj-section>`;
  }

  private generateFooterSectionMjml(section: TemplateSection, bgColor: string, colors: ColorScheme): string {
    return `
    <mj-section background-color="${bgColor}" padding="20px 0">
      <mj-column width="100%">
        <mj-text align="center" font-size="${section.content.font?.size || '14px'}" 
                 color="${section.content.font?.color || colors.text}" 
                 padding="20px"
                 line-height="1.6">
          ${section.content.text.replace(/\n/g, '<br />')}
        </mj-text>
      </mj-column>
    </mj-section>`;
  }

  private generateDefaultSectionMjml(section: TemplateSection, bgColor: string, colors: ColorScheme): string {
    return `
    <mj-section background-color="${bgColor}" padding="20px 0">
      <mj-column width="100%">
        <mj-text align="center" font-size="16px" color="${colors.text}" padding="20px">
          ${section.content.text}
        </mj-text>
      </mj-column>
    </mj-section>`;
  }

  // Helper methods
  private generateTemplateName(request: MjmlGenerationRequest): string {
    const destination = request.contentContext.campaign.destination || 'campaign';
    const timestamp = new Date().toISOString().slice(0, 10);
    return `email-${destination}-${timestamp}`;
  }

  private calculatePerformanceMetrics(template: MjmlTemplate, startTime: number): PerformanceMetrics {
    const endTime = Date.now();
    const templateMetrics = template.getPerformanceMetrics();
    
    return {
      ...templateMetrics,
      generationTime: endTime - startTime,
      resourceUsage: {
        ...templateMetrics.resourceUsage,
        cpuTime: endTime - startTime
      }
    };
  }
} 