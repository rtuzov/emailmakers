/**
 * 📋 TECHNICAL SPECIFICATION GENERATOR - Complete Technical Specification System
 * 
 * Creates comprehensive technical specifications for email campaigns by combining
 * content analysis, asset requirements, design constraints, and quality criteria.
 * 
 * Integrates with OpenAI Agents SDK context parameter system and provides
 * detailed specifications for Design Specialist to implement.
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';

// ============================================================================
// TECHNICAL SPECIFICATION SCHEMAS
// ============================================================================

const EmailClientConstraintSchema = z.object({
  client: z.enum(['gmail', 'outlook', 'apple-mail', 'yahoo-mail', 'thunderbird']).describe('Email client name'),
  maxWidth: z.number().describe('Maximum email width in pixels'),
  supportsWebP: z.boolean().describe('WebP image support'),
  supportsSVG: z.boolean().describe('SVG image support'),
  supportsCSS: z.object({
    flexbox: z.boolean().describe('CSS Flexbox support'),
    grid: z.boolean().describe('CSS Grid support'),
    transform: z.boolean().describe('CSS Transform support'),
    animation: z.boolean().describe('CSS Animation support')
  }).describe('CSS feature support'),
  darkModeSupport: z.boolean().describe('Dark mode support'),
  notes: z.array(z.string()).describe('Additional compatibility notes')
});

const DesignConstraintSchema = z.object({
  layout: z.object({
    type: z.enum(['single-column', 'multi-column', 'responsive']).describe('Layout type'),
    maxWidth: z.number().min(300).max(800).describe('Maximum content width in pixels'),
    minWidth: z.number().min(280).max(400).describe('Minimum content width for mobile'),
    padding: z.object({
      top: z.number().describe('Top padding in pixels'),
      right: z.number().describe('Right padding in pixels'),
      bottom: z.number().describe('Bottom padding in pixels'),
      left: z.number().describe('Left padding in pixels')
    }).describe('Content padding'),
    sections: z.array(z.object({
      id: z.string().describe('Section identifier'),
      type: z.enum(['header', 'hero', 'content', 'product', 'cta', 'footer']).describe('Section type'),
      order: z.number().describe('Section order'),
      required: z.boolean().describe('Whether section is required'),
      constraints: z.record(z.any()).nullable().describe('Section-specific constraints')
    })).describe('Email sections definition')
  }).describe('Layout constraints'),
  
  typography: z.object({
    headingFont: z.object({
      family: z.string().describe('Font family name'),
      fallbacks: z.array(z.string()).describe('Fallback fonts'),
      sizes: z.object({
        h1: z.number().describe('H1 font size in pixels'),
        h2: z.number().describe('H2 font size in pixels'),
        h3: z.number().describe('H3 font size in pixels')
      }).describe('Heading font sizes'),
      weights: z.array(z.enum(['normal', 'bold', '400', '600', '700'])).describe('Available font weights')
    }).describe('Heading font configuration'),
    bodyFont: z.object({
      family: z.string().describe('Font family name'),
      fallbacks: z.array(z.string()).describe('Fallback fonts'),
      size: z.number().describe('Body font size in pixels'),
      lineHeight: z.number().describe('Line height multiplier'),
      weights: z.array(z.enum(['normal', 'bold', '400', '600'])).describe('Available font weights')
    }).describe('Body font configuration')
  }).describe('Typography specifications'),
  
  colorScheme: z.object({
    primary: z.string().describe('Primary brand color (hex)'),
    secondary: z.string().describe('Secondary brand color (hex)'),
    accent: z.string().describe('Accent color (hex)'),
    text: z.object({
      primary: z.string().describe('Primary text color (hex)'),
      secondary: z.string().describe('Secondary text color (hex)'),
      muted: z.string().describe('Muted text color (hex)')
    }).describe('Text colors'),
    background: z.object({
      primary: z.string().describe('Primary background color (hex)'),
      secondary: z.string().describe('Secondary background color (hex)'),
      accent: z.string().describe('Accent background color (hex)')
    }).describe('Background colors'),
    darkMode: z.object({
      primary: z.string().describe('Dark mode primary color (hex)'),
      secondary: z.string().describe('Dark mode secondary color (hex)'),
      background: z.string().describe('Dark mode background color (hex)'),
      text: z.string().describe('Dark mode text color (hex)')
    }).nullable().describe('Dark mode color overrides')
  }).describe('Color scheme specification'),
  
  spacing: z.object({
    base: z.number().describe('Base spacing unit in pixels'),
    sections: z.number().describe('Section spacing in pixels'),
    elements: z.number().describe('Element spacing in pixels'),
    text: z.number().describe('Text spacing in pixels')
  }).describe('Spacing specifications')
});

const QualityCriteriaSchema = z.object({
  performance: z.object({
    maxFileSize: z.number().describe('Maximum total file size in bytes'),
    maxImageSize: z.number().describe('Maximum individual image size in bytes'),
    compressionQuality: z.number().min(0).max(1).describe('Image compression quality (0-1)'),
    lazyLoading: z.boolean().describe('Enable lazy loading for images'),
    cacheOptimization: z.boolean().describe('Enable cache optimization')
  }).describe('Performance criteria'),
  
  accessibility: z.object({
    wcagLevel: z.enum(['A', 'AA', 'AAA']).describe('WCAG compliance level'),
    contrastRatio: z.number().min(3).max(21).describe('Minimum contrast ratio'),
    altTextRequired: z.boolean().describe('Alt text required for images'),
    focusIndicators: z.boolean().describe('Focus indicators required'),
    screenReaderFriendly: z.boolean().describe('Screen reader optimization'),
    keyboardNavigation: z.boolean().describe('Keyboard navigation support')
  }).describe('Accessibility criteria'),
  
  emailDeliverability: z.object({
    spamScore: z.number().max(5).describe('Maximum spam score threshold'),
    textToHtmlRatio: z.number().min(0).max(1).describe('Text to HTML ratio (0-1)'),
    linkLimit: z.number().describe('Maximum number of links'),
    imageToTextRatio: z.number().min(0).max(1).describe('Image to text ratio (0-1)'),
    subjectLineLength: z.number().max(60).describe('Maximum subject line length'),
    preheaderLength: z.number().max(120).describe('Maximum preheader length')
  }).describe('Email deliverability criteria'),
  
  crossClientCompatibility: z.object({
    targetClients: z.array(z.string()).describe('Target email clients'),
    fallbackStrategies: z.array(z.object({
      feature: z.string().describe('Feature name'),
      fallback: z.string().describe('Fallback strategy')
    })).describe('Fallback strategies for unsupported features'),
    testing: z.object({
      required: z.boolean().describe('Testing required'),
      platforms: z.array(z.string()).describe('Testing platforms'),
      minCompatibility: z.number().min(0).max(100).describe('Minimum compatibility percentage')
    }).describe('Testing requirements')
  }).describe('Cross-client compatibility criteria')
});

const TechnicalSpecificationSchema = z.object({
  version: z.string().describe('Specification version'),
  generatedAt: z.string().describe('Generation timestamp'),
  campaign: z.object({
    id: z.string().describe('Campaign identifier'),
    name: z.string().describe('Campaign name'),
    type: z.string().describe('Campaign type'),
    theme: z.string().describe('Campaign theme'),
    targetAudience: z.string().describe('Target audience'),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).describe('Campaign priority')
  }).describe('Campaign information'),
  
  content: z.object({
    subject: z.string().describe('Email subject line'),
    preheader: z.string().describe('Email preheader text'),
    sections: z.array(z.object({
      id: z.string().describe('Section identifier'),
      type: z.enum(['header', 'hero', 'content', 'product', 'cta', 'footer']).describe('Section type'),
      title: z.string().nullable().describe('Section title'),
      content: z.string().describe('Section content'),
      metadata: z.record(z.any()).nullable().describe('Section metadata'),
      assets: z.array(z.object({
        id: z.string().describe('Asset identifier'),
        type: z.enum(['image', 'icon', 'font']).describe('Asset type'),
        usage: z.string().describe('Asset usage description'),
        required: z.boolean().describe('Whether asset is required')
      })).describe('Section assets')
    })).describe('Content sections'),
    
    callToAction: z.object({
      primary: z.object({
        text: z.string().describe('Primary CTA text'),
        url: z.string().describe('Primary CTA URL'),
        style: z.enum(['button', 'link', 'banner']).describe('CTA style')
      }).describe('Primary call to action'),
      secondary: z.object({
        text: z.string().describe('Secondary CTA text'),
        url: z.string().describe('Secondary CTA URL'),
        style: z.enum(['button', 'link', 'banner']).describe('CTA style')
      }).nullable().describe('Secondary call to action')
    }).describe('Call to action configuration'),
    
    personalization: z.object({
      enabled: z.boolean().describe('Personalization enabled'),
      variables: z.array(z.object({
        name: z.string().describe('Variable name'),
        type: z.enum(['text', 'image', 'url', 'date']).describe('Variable type'),
        defaultValue: z.string().describe('Default value'),
        required: z.boolean().describe('Whether variable is required')
      })).describe('Personalization variables'),
      dynamicContent: z.array(z.object({
        section: z.string().describe('Section identifier'),
        conditions: z.array(z.string()).describe('Display conditions'),
        content: z.string().describe('Dynamic content')
      })).describe('Dynamic content blocks')
    }).describe('Personalization configuration')
  }).describe('Content specification'),
  
  design: z.object({
    constraints: DesignConstraintSchema.describe('Design constraints'),
    assets: z.object({
      manifest: z.object({
        images: z.array(z.object({
          id: z.string().describe('Image identifier'),
          path: z.string().describe('Image file path'),
          alt: z.string().describe('Alt text'),
          usage: z.string().describe('Image usage'),
          dimensions: z.object({
            width: z.number().describe('Image width'),
            height: z.number().describe('Image height')
          }).describe('Image dimensions'),
          responsive: z.boolean().describe('Responsive image'),
          formats: z.array(z.string()).describe('Available formats'),
          optimization: z.object({
            compressed: z.boolean().describe('Image compressed'),
            quality: z.number().describe('Compression quality'),
            size: z.number().describe('File size in bytes')
          }).describe('Optimization details')
        })).describe('Image assets'),
        icons: z.array(z.object({
          id: z.string().describe('Icon identifier'),
          path: z.string().describe('Icon file path'),
          usage: z.string().describe('Icon usage'),
          format: z.string().describe('Icon format'),
          size: z.number().describe('Icon size in pixels')
        })).describe('Icon assets'),
        fonts: z.array(z.object({
          family: z.string().describe('Font family'),
          weights: z.array(z.string()).describe('Font weights'),
          fallbacks: z.array(z.string()).describe('Fallback fonts'),
          usage: z.string().describe('Font usage')
        })).describe('Font assets')
      }).describe('Asset manifest'),
      
      requirements: z.array(z.object({
        id: z.string().describe('Requirement identifier'),
        type: z.enum(['image', 'icon', 'font', 'sprite']).describe('Asset type'),
        description: z.string().describe('Requirement description'),
        specifications: z.record(z.any()).describe('Asset specifications'),
        priority: z.enum(['required', 'recommended', 'optional']).describe('Requirement priority'),
        fallback: z.string().nullable().describe('Fallback strategy')
      })).describe('Asset requirements')
    }).describe('Asset specifications'),
    
    responsive: z.object({
      enabled: z.boolean().describe('Responsive design enabled'),
      breakpoints: z.array(z.object({
        name: z.string().describe('Breakpoint name'),
        width: z.number().describe('Breakpoint width'),
        constraints: z.record(z.any()).describe('Breakpoint constraints')
      })).describe('Responsive breakpoints'),
      strategy: z.enum(['mobile-first', 'desktop-first', 'adaptive']).describe('Responsive strategy')
    }).describe('Responsive design configuration')
  }).describe('Design specification'),
  
  quality: z.object({
    criteria: QualityCriteriaSchema.describe('Quality criteria'),
    testing: z.object({
      required: z.boolean().describe('Testing required'),
      types: z.array(z.enum(['functional', 'visual', 'performance', 'accessibility', 'compatibility'])).describe('Testing types'),
      platforms: z.array(z.string()).describe('Testing platforms'),
      automation: z.object({
        enabled: z.boolean().describe('Test automation enabled'),
        tools: z.array(z.string()).describe('Automation tools'),
        coverage: z.number().min(0).max(100).describe('Test coverage percentage')
      }).describe('Test automation configuration')
    }).describe('Testing requirements'),
    
    validation: z.object({
      htmlValidation: z.boolean().describe('HTML validation required'),
      cssValidation: z.boolean().describe('CSS validation required'),
      linkValidation: z.boolean().describe('Link validation required'),
      spamCheck: z.boolean().describe('Spam check required'),
      accessibilityCheck: z.boolean().describe('Accessibility check required')
    }).describe('Validation requirements')
  }).describe('Quality specification'),
  
  delivery: z.object({
    emailClients: z.array(EmailClientConstraintSchema).describe('Email client constraints'),
    deployment: z.object({
      environment: z.enum(['development', 'staging', 'production']).describe('Deployment environment'),
      approvalRequired: z.boolean().describe('Approval required for deployment'),
      rollbackStrategy: z.string().describe('Rollback strategy'),
      monitoring: z.object({
        enabled: z.boolean().describe('Monitoring enabled'),
        metrics: z.array(z.string()).describe('Metrics to monitor'),
        alerts: z.array(z.string()).describe('Alert conditions')
      }).describe('Monitoring configuration')
    }).describe('Deployment configuration'),
    
    tracking: z.object({
      enabled: z.boolean().describe('Tracking enabled'),
      openTracking: z.boolean().describe('Open tracking enabled'),
      clickTracking: z.boolean().describe('Click tracking enabled'),
      customEvents: z.array(z.object({
        name: z.string().describe('Event name'),
        trigger: z.string().describe('Event trigger'),
        parameters: z.record(z.any()).describe('Event parameters')
      })).describe('Custom tracking events')
    }).describe('Tracking configuration')
  }).describe('Delivery specification'),
  
  metadata: z.object({
    generatedBy: z.string().describe('Tool that generated spec'),
    sourceContext: z.record(z.any()).describe('Source context data'),
    processingTime: z.number().describe('Processing time in milliseconds'),
    complexity: z.enum(['low', 'medium', 'high', 'very-high']).describe('Specification complexity'),
    estimatedImplementationTime: z.number().describe('Estimated implementation time in hours'),
    dependencies: z.array(z.string()).describe('External dependencies'),
    notes: z.array(z.string()).describe('Additional notes')
  }).describe('Specification metadata')
});

// ============================================================================
// TECHNICAL SPECIFICATION GENERATION INTERFACES
// ============================================================================

interface GenerationSummary {
  timestamp: string;
  processingTime: number;
  sourceContexts: number;
  sectionsGenerated: number;
  assetsProcessed: number;
  constraintsApplied: number;
  validationPassed: boolean;
  errors: string[];
  warnings: string[];
}

interface ImplementationGuidance {
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedTime: number;
  complexity: 'low' | 'medium' | 'high' | 'very-high';
  dependencies: string[];
  risks: string[];
  recommendations: string[];
}

interface QualityScore {
  completeness: number;
  consistency: number;
  clarity: number;
  implementability: number;
  overall: number;
}

// ============================================================================
// TECHNICAL SPECIFICATION GENERATION TOOL
// ============================================================================

export const generateTechnicalSpecification = tool({
  name: 'generateTechnicalSpecification',
  description: 'Generate comprehensive technical specification for email campaign combining content analysis, design requirements, and quality criteria',
  parameters: z.object({
    campaignId: z.string().describe('Campaign identifier'),
    campaignPath: z.string().describe('Campaign folder path'),
    contentContext: z.object({
      generated_content: z.object({
        subject: z.string().nullable(),
        preheader: z.string().nullable(),
        body_sections: z.array(z.string()).nullable(),
        cta_buttons: z.array(z.string()).nullable()
      }).nullable(),
      context_analysis: z.object({
        industry: z.string().nullable(),
        target_audience: z.string().nullable(),
        campaign_type: z.string().nullable()
      }).nullable(),
      asset_strategy: z.object({
        visual_style: z.string().nullable(),
        color_palette: z.string().nullable(),
        typography: z.string().nullable()
      }).nullable(),
      pricing_analysis: z.object({
        products: z.array(z.object({
          name: z.string().nullable(),
          price: z.string().nullable()
        })).nullable()
      }).nullable()
    }).describe('Content context with generated content and analysis'),
    assetManifest: z.object({
      images: z.array(z.object({
        id: z.string(),
        path: z.string(),
        alt_text: z.string(),
        usage: z.string(),
        dimensions: z.object({
          width: z.number(),
          height: z.number()
        }),
        file_size: z.number(),
        format: z.string(),
        optimized: z.boolean()
      })),
      icons: z.array(z.object({
        id: z.string(),
        path: z.string(),
        usage: z.string(),
        format: z.string(),
        size: z.string()
      })),
      fonts: z.array(z.object({
        family: z.string(),
        weights: z.array(z.string()),
        fallbacks: z.array(z.string())
      }))
    }).nullable().describe('Asset manifest from asset preparation'),
    designRequirements: z.object({
      layout: z.string().nullable(),
      responsive: z.boolean().nullable(),
      dark_mode: z.boolean().nullable(),
      accessibility_level: z.string().nullable()
    }).nullable().describe('Additional design requirements'),
    qualityCriteria: z.object({
      email_clients: z.array(z.string()).nullable(),
      performance_thresholds: z.object({
        max_file_size: z.number().nullable(),
        load_time: z.number().nullable()
      }).nullable(),
      accessibility_requirements: z.object({
        wcag_level: z.string().nullable(),
        color_contrast: z.number().nullable()
      }).nullable()
    }).nullable().describe('Custom quality criteria'),
    emailClients: z.array(z.string()).default(['gmail', 'outlook', 'apple-mail', 'yahoo-mail']).describe('Target email clients'),
    options: z.object({
      includeAdvancedFeatures: z.boolean().default(true).describe('Include advanced email features'),
      responsiveDesign: z.boolean().default(true).describe('Enable responsive design'),
      darkModeSupport: z.boolean().default(true).describe('Enable dark mode support'),
      accessibilityLevel: z.enum(['A', 'AA', 'AAA']).default('AA').describe('WCAG accessibility level'),
      performanceOptimization: z.boolean().default(true).describe('Enable performance optimization'),
      generateImplementationGuide: z.boolean().default(true).describe('Generate implementation guidance')
    }).nullable().describe('Specification generation options'),
    context: z.object({
      campaignId: z.string().nullable(),
      campaignPath: z.string().nullable(),
      taskType: z.string().nullable(),
      language: z.string().nullable(),
      campaign_type: z.string().nullable(),
      industry: z.string().nullable(),
      urgency: z.string().nullable(),
      target_audience: z.string().nullable()
    }).nullable().describe('Workflow context'),
    trace_id: z.string().nullable().describe('Trace ID for monitoring')
  }),
  execute: async ({ campaignId, campaignPath, contentContext, assetManifest, designRequirements, qualityCriteria, emailClients, options, context, trace_id }) => {
    console.log('\\n📋 === TECHNICAL SPECIFICATION GENERATION STARTED ===');
    console.log(`📋 Campaign: ${campaignId}`);
    console.log(`📁 Campaign Path: ${campaignPath}`);
    console.log(`📧 Target Clients: ${emailClients.join(', ')}`);
    console.log(`🔍 Trace ID: ${trace_id || 'none'}`);
    
    const startTime = Date.now();
    const specificationId = `spec_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const generationOptions = options || {};
    
    try {
      // Create specification directory
      const specDir = path.join(campaignPath, 'docs', 'specifications');
      await fs.mkdir(specDir, { recursive: true });
      
      // Step 1: Analyze content context for technical requirements
      console.log('🔍 Analyzing content context for technical requirements...');
      const contentAnalysis = await analyzeContentForTechnicalRequirements(contentContext);
      
      // Step 2: Generate design constraints based on content and requirements
      console.log('🎨 Generating design constraints...');
      const designConstraints = await generateDesignConstraints(
        contentContext,
        designRequirements,
        generationOptions
      );
      
      // Step 3: Process asset manifest and generate asset specifications
      console.log('📦 Processing asset manifest...');
      const assetSpecifications = await processAssetManifest(
        assetManifest,
        contentContext,
        designConstraints
      );
      
      // Step 4: Generate quality criteria based on campaign requirements
      console.log('✅ Generating quality criteria...');
      const qualitySpecification = await generateQualityCriteria(
        contentContext,
        qualityCriteria,
        emailClients,
        generationOptions
      );
      
      // Step 5: Generate email client constraints
      console.log('📧 Generating email client constraints...');
      const emailClientConstraints = await generateEmailClientConstraints(
        emailClients,
        generationOptions
      );
      
      // Step 6: Create comprehensive technical specification
      console.log('📋 Creating comprehensive technical specification...');
      const technicalSpec = await createTechnicalSpecification(
        specificationId,
        campaignId,
        contentAnalysis,
        designConstraints,
        assetSpecifications,
        qualitySpecification,
        emailClientConstraints,
        generationOptions,
        context
      );
      
      // Step 7: Validate specification completeness and consistency
      console.log('✅ Validating specification completeness...');
      const validationResult = await validateTechnicalSpecificationInternal(technicalSpec);
      
      // Step 8: Generate implementation guidance
      console.log('📖 Generating implementation guidance...');
      const implementationGuidance = generationOptions.generateImplementationGuide 
        ? await generateImplementationGuidance(technicalSpec, contentContext)
        : getDefaultImplementationGuidance();
      
      // Step 9: Calculate quality score
      console.log('📊 Calculating quality score...');
      const qualityScore = calculateSpecificationQualityScore(
        technicalSpec,
        validationResult,
        contentContext
      );
      
      // Step 10: Create final specification result
      const processingTime = Date.now() - startTime;
      const specificationResult = {
        specificationId,
        specification: technicalSpec,
        generationSummary: {
          timestamp: new Date().toISOString(),
          processingTime,
          sourceContexts: Object.keys(contentContext).length,
          sectionsGenerated: technicalSpec.content.sections.length,
          assetsProcessed: assetSpecifications.manifest.images.length + assetSpecifications.manifest.icons.length,
          constraintsApplied: Object.keys(designConstraints).length,
          validationPassed: validationResult.isValid,
          errors: validationResult.errors,
          warnings: validationResult.warnings
        },
        implementationGuidance,
        qualityScore
      };
      
      // Step 11: Save specification to campaign folder
      console.log('💾 Saving technical specification...');
      await fs.writeFile(
        path.join(specDir, 'technical-specification.json'),
        JSON.stringify(specificationResult, null, 2)
      );
      
      // Save human-readable version
      await fs.writeFile(
        path.join(specDir, 'technical-specification.md'),
        await generateHumanReadableSpecification(technicalSpec)
      );
      
      // Save implementation guide
      if (generationOptions.generateImplementationGuide) {
        await fs.writeFile(
          path.join(specDir, 'implementation-guide.md'),
          await generateImplementationGuideDocument(implementationGuidance, technicalSpec)
        );
      }
      
      console.log('✅ Technical specification generation completed successfully');
      console.log(`📊 Specification Quality Score: ${qualityScore.overall}/100`);
      console.log(`📋 Sections Generated: ${technicalSpec.content.sections.length}`);
      console.log(`📦 Assets Processed: ${assetSpecifications.manifest.images.length + assetSpecifications.manifest.icons.length}`);
      console.log(`📧 Email Clients: ${emailClientConstraints.length}`);
      console.log(`⏱️ Processing Time: ${processingTime}ms`);
      
      return `Technical specification generated successfully for campaign ${campaignId}. Quality Score: ${qualityScore.overall}/100. Sections: ${technicalSpec.content.sections.length}. Assets: ${assetSpecifications.manifest.images.length + assetSpecifications.manifest.icons.length}. Email clients: ${emailClientConstraints.length}. Specification saved to docs/specifications/ folder with implementation guide.`;
      
    } catch (error) {
      console.error('❌ Technical specification generation failed:', error);
      throw error;
    }
  }
});

// ============================================================================
// SPECIFICATION VALIDATION TOOL
// ============================================================================

export const validateTechnicalSpecification = tool({
  name: 'validateTechnicalSpecification',
  description: 'Validate technical specification for completeness, consistency, and implementability',
  parameters: z.object({
    specificationPath: z.string().describe('Path to technical specification file'),
    validationRules: z.object({
      requireAllSections: z.boolean().default(true).describe('Require all sections to be present'),
      validateAssetPaths: z.boolean().default(true).describe('Validate asset file paths'),
      checkColorContrast: z.boolean().default(true).describe('Check color contrast ratios'),
      validateEmailClients: z.boolean().default(true).describe('Validate email client constraints'),
      enforceAccessibility: z.boolean().default(true).describe('Enforce accessibility standards')
    }).nullable().describe('Validation rules'),
    context: z.object({
      campaignId: z.string().nullable(),
      campaignPath: z.string().nullable(),
      taskType: z.string().nullable(),
      language: z.string().nullable(),
      campaign_type: z.string().nullable(),
      industry: z.string().nullable(),
      urgency: z.string().nullable(),
      target_audience: z.string().nullable()
    }).nullable().describe('Workflow context'),
    trace_id: z.string().nullable().describe('Trace ID for monitoring')
  }),
  execute: async ({ specificationPath, validationRules, context, trace_id }) => {
    console.log('\\n✅ === TECHNICAL SPECIFICATION VALIDATION STARTED ===');
    console.log(`📂 Specification Path: ${specificationPath}`);
    console.log(`🔍 Trace ID: ${trace_id || 'none'}`);
    
    const _rules // Currently unused = validationRules || {};
    
    try {
      // Load specification
      const specificationContent = await fs.readFile(specificationPath, 'utf8');
      const specification = JSON.parse(specificationContent);
      
      // Validate against schema
      const validationResult = await validateTechnicalSpecificationInternal(specification.specification || specification);
      
      // Generate validation report
      const validationReport = {
        isValid: validationResult.isValid,
        errors: validationResult.errors,
        warnings: validationResult.warnings,
        score: validationResult.isValid ? 100 : Math.max(0, 100 - (validationResult.errors.length * 10)),
        recommendations: generateValidationRecommendations(validationResult),
        timestamp: new Date().toISOString()
      };
      
      // Save validation report
      const reportPath = path.join(path.dirname(specificationPath), 'validation-report.json');
      await fs.writeFile(reportPath, JSON.stringify(validationReport, null, 2));
      
      console.log('✅ Technical specification validation completed');
      console.log(`📊 Validation Score: ${validationReport.score}/100`);
      console.log(`❌ Errors: ${validationResult.errors.length}`);
      console.log(`⚠️ Warnings: ${validationResult.warnings.length}`);
      
      return `Technical specification validation completed. Score: ${validationReport.score}/100. Errors: ${validationResult.errors.length}. Warnings: ${validationResult.warnings.length}. Validation report saved to ${reportPath}.`;
      
    } catch (error) {
      console.error('❌ Technical specification validation failed:', error);
      throw error;
    }
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function analyzeContentForTechnicalRequirements(contentContext: any): Promise<any> {
  const requirements = {
    complexity: 'medium',
    sectionsNeeded: [],
    personalizationRequired: false,
    dynamicContentRequired: false,
    interactivityLevel: 'basic'
  };
  
  // Analyze generated content
  if (contentContext.generated_content) {
    const content = contentContext.generated_content;
    
    // Determine complexity based on content structure
    if (content.sections && content.sections.length > 5) {
      requirements.complexity = 'high';
    } else if (content.sections && content.sections.length > 3) {
      requirements.complexity = 'medium';
    } else {
      requirements.complexity = 'low';
    }
    
    // Identify required sections
    requirements.sectionsNeeded = [
      { id: 'header', type: 'header', required: true },
      { id: 'hero', type: 'hero', required: true },
      { id: 'content', type: 'content', required: true },
      { id: 'cta', type: 'cta', required: true },
      { id: 'footer', type: 'footer', required: true }
    ];
    
    // Add product sections if pricing analysis exists
    if (contentContext.pricing_analysis?.products) {
      requirements.sectionsNeeded.push({
        id: 'products',
        type: 'product',
        required: true,
        metadata: {
          productCount: contentContext.pricing_analysis.products.length
        }
      });
    }
  }
  
  return requirements;
}

async function generateDesignConstraints(
  contentContext: any,
  _designRequirements: any,
  _options: any
): Promise<any> {
  const constraints = {
    layout: {
      type: 'single-column',
      maxWidth: 600,
      minWidth: 320,
      padding: { top: 20, right: 20, bottom: 20, left: 20 },
      sections: []
    },
    typography: {
      headingFont: {
        family: 'Arial, sans-serif',
        fallbacks: ['Helvetica', 'sans-serif'],
        sizes: { h1: 28, h2: 24, h3: 20 },
        weights: ['normal', 'bold']
      },
      bodyFont: {
        family: 'Arial, sans-serif',
        fallbacks: ['Helvetica', 'sans-serif'],
        size: 16,
        lineHeight: 1.5,
        weights: ['normal', 'bold']
      }
    },
    colorScheme: {
      primary: '#007bff',
      secondary: '#6c757d',
      accent: '#28a745',
      text: {
        primary: '#333333',
        secondary: '#666666',
        muted: '#999999'
      },
      background: {
        primary: '#ffffff',
        secondary: '#f8f9fa',
        accent: '#e9ecef'
      }
    },
    spacing: {
      base: 16,
      sections: 40,
      elements: 20,
      text: 12
    }
  };
  
  // Apply brand context colors if available
  if (contentContext.brand_context?.colors) {
    constraints.colorScheme.primary = contentContext.brand_context.colors.primary || constraints.colorScheme.primary;
    constraints.colorScheme.secondary = contentContext.brand_context.colors.secondary || constraints.colorScheme.secondary;
  }
  
  // Apply visual style from asset strategy
  if (contentContext.asset_strategy?.visual_style) {
    const visualStyle = contentContext.asset_strategy.visual_style;
    if (visualStyle.includes('modern')) {
      constraints.typography.headingFont.family = 'Inter, Arial, sans-serif';
      constraints.typography.bodyFont.family = 'Inter, Arial, sans-serif';
    }
  }
  
  return constraints;
}

async function processAssetManifest(
  assetManifest: any,
  contentContext: any,
  _designConstraints: any
): Promise<any> {
  const specifications = {
    manifest: {
      images: [],
      icons: [],
      fonts: []
    },
    requirements: []
  };
  
  // Process existing asset manifest
  if (assetManifest?.images) {
    specifications.manifest.images = assetManifest.images.map((image: any) => ({
      id: image.id,
      path: image.path,
      alt: image.alt_text || image.alt,
      usage: image.usage || 'general',
      dimensions: image.dimensions || { width: 0, height: 0 },
      responsive: true,
      formats: [image.format || 'jpg'],
      optimization: {
        compressed: image.optimized || false,
        quality: 0.8,
        size: image.file_size || 0
      }
    }));
  }
  
  // Process icons
  if (assetManifest?.icons) {
    specifications.manifest.icons = assetManifest.icons.map((icon: any) => ({
      id: icon.id,
      path: icon.path,
      usage: icon.usage || 'decoration',
      format: icon.format || 'svg',
      size: icon.size || 24
    }));
  }
  
  // Process fonts - check both direct fonts and nested assetManifest.fonts
  const fonts = assetManifest?.fonts || assetManifest?.assetManifest?.fonts;
  if (fonts && fonts.length > 0) {
    specifications.manifest.fonts = fonts.map((font: any) => ({
      family: font.family,
      weights: font.weights || ['normal', 'bold'],
      fallbacks: font.fallbacks || ['Arial', 'sans-serif'],
      usage: font.usage || 'body'
    }));
    
    console.log(`✅ Using ${fonts.length} fonts from asset manifest`);
  } else {
    // Add default fonts only if no fonts in asset manifest
    specifications.manifest.fonts = [
      {
        family: 'Arial',
        weights: ['normal', 'bold'],
        fallbacks: ['Helvetica', 'sans-serif'],
        usage: 'primary'
      }
    ];
    
    console.log('⚠️ No fonts in asset manifest, using default Arial font');
  }
  
  // Generate asset requirements based on content
  if (contentContext.generated_content) {
    specifications.requirements = [
      {
        id: 'hero-image',
        type: 'image',
        description: 'Hero image for email header',
        specifications: {
          dimensions: { width: 600, height: 300 },
          formats: ['jpg', 'webp'],
          quality: 'high'
        },
        priority: 'required',
        fallback: 'Solid color background with text overlay'
      },
      {
        id: 'logo',
        type: 'image',
        description: 'Brand logo',
        specifications: {
          dimensions: { height: 60 },
          formats: ['png', 'svg'],
          quality: 'high'
        },
        priority: 'required',
        fallback: 'Text-based brand name'
      }
    ];
  }
  
  return specifications;
}

async function generateQualityCriteria(
  _contentContext: any,
  qualityCriteria: any,
  emailClients: string[],
  options: any
): Promise<any> {
  const criteria = {
    performance: {
      maxFileSize: 100000, // 100KB
      maxImageSize: 50000, // 50KB per image
      compressionQuality: 0.8,
      lazyLoading: false, // Not widely supported in email
      cacheOptimization: true
    },
    accessibility: {
      wcagLevel: options.accessibilityLevel || 'AA',
      contrastRatio: 4.5,
      altTextRequired: true,
      focusIndicators: true,
      screenReaderFriendly: true,
      keyboardNavigation: false // Limited in email
    },
    emailDeliverability: {
      spamScore: 3,
      textToHtmlRatio: 0.3,
      linkLimit: 10,
      imageToTextRatio: 0.6,
      subjectLineLength: 50,
      preheaderLength: 100
    },
    crossClientCompatibility: {
      targetClients: emailClients,
      fallbackStrategies: [
        { feature: 'WebP images', fallback: 'JPEG images' },
        { feature: 'SVG images', fallback: 'PNG images' },
        { feature: 'Custom fonts', fallback: 'System fonts' }
      ],
      testing: {
        required: true,
        platforms: emailClients,
        minCompatibility: 95
      }
    }
  };
  
  // Apply custom quality criteria
  if (qualityCriteria) {
    Object.assign(criteria, qualityCriteria);
  }
  
  return criteria;
}

async function generateEmailClientConstraints(
  emailClients: string[],
  _options: any
): Promise<any[]> {
  const constraints = [];
  
  for (const client of emailClients) {
    switch (client) {
      case 'gmail':
        constraints.push({
          client: 'gmail',
          maxWidth: 600,
          supportsWebP: true,
          supportsSVG: false,
          supportsCSS: {
            flexbox: false,
            grid: false,
            transform: false,
            animation: false
          },
          darkModeSupport: true,
          notes: ['Clips emails over 102KB', 'Limited CSS support']
        });
        break;
      case 'outlook':
        constraints.push({
          client: 'outlook',
          maxWidth: 600,
          supportsWebP: false,
          supportsSVG: false,
          supportsCSS: {
            flexbox: false,
            grid: false,
            transform: false,
            animation: false
          },
          darkModeSupport: false,
          notes: ['Uses Word rendering engine', 'Very limited CSS support']
        });
        break;
      case 'apple-mail':
        constraints.push({
          client: 'apple-mail',
          maxWidth: 600,
          supportsWebP: true,
          supportsSVG: true,
          supportsCSS: {
            flexbox: true,
            grid: false,
            transform: true,
            animation: true
          },
          darkModeSupport: true,
          notes: ['Good CSS support', 'Supports media queries']
        });
        break;
      case 'yahoo-mail':
        constraints.push({
          client: 'yahoo-mail',
          maxWidth: 600,
          supportsWebP: false,
          supportsSVG: false,
          supportsCSS: {
            flexbox: false,
            grid: false,
            transform: false,
            animation: false
          },
          darkModeSupport: false,
          notes: ['Limited CSS support', 'Similar to Gmail']
        });
        break;
    }
  }
  
  return constraints;
}

async function createTechnicalSpecification(
  _specificationId: string,
  campaignId: string,
  contentAnalysis: any,
  designConstraints: any,
  assetSpecifications: any,
  qualitySpecification: any,
  emailClientConstraints: any[],
  options: any,
  context: any
): Promise<any> {
  const specification = {
    version: '1.0',
    generatedAt: new Date().toISOString(),
    campaign: {
      id: campaignId,
      name: context?.campaign?.name || `Campaign ${campaignId}`,
      type: context?.campaign?.type || 'email-marketing',
      theme: context?.campaign?.theme || 'general',
      targetAudience: context?.campaign?.targetAudience || 'general',
      priority: context?.campaign?.priority || 'medium'
    },
    content: {
      subject: context?.generated_content?.subject || 'Email Subject',
      preheader: context?.generated_content?.preheader || 'Email preheader',
      sections: contentAnalysis.sectionsNeeded || [],
      callToAction: {
        primary: {
          text: context?.generated_content?.cta_text || 'Click Here',
          url: context?.generated_content?.cta_url || '#',
          style: 'button'
        }
      },
      personalization: {
        enabled: contentAnalysis.personalizationRequired || false,
        variables: [],
        dynamicContent: []
      }
    },
    design: {
      constraints: designConstraints,
      assets: assetSpecifications,
      responsive: {
        enabled: options.responsiveDesign !== false,
        breakpoints: [
          { name: 'mobile', width: 480, constraints: { maxWidth: 320 } },
          { name: 'tablet', width: 768, constraints: { maxWidth: 600 } },
          { name: 'desktop', width: 1200, constraints: { maxWidth: 600 } }
        ],
        strategy: 'mobile-first'
      }
    },
    quality: {
      criteria: qualitySpecification,
      testing: {
        required: true,
        types: ['functional', 'visual', 'compatibility'],
        platforms: emailClientConstraints.map(c => c.client),
        automation: {
          enabled: false,
          tools: [],
          coverage: 0
        }
      },
      validation: {
        htmlValidation: true,
        cssValidation: true,
        linkValidation: true,
        spamCheck: true,
        accessibilityCheck: true
      }
    },
    delivery: {
      emailClients: emailClientConstraints,
      deployment: {
        environment: 'production',
        approvalRequired: true,
        rollbackStrategy: 'immediate',
        monitoring: {
          enabled: true,
          metrics: ['open_rate', 'click_rate', 'bounce_rate'],
          alerts: ['high_bounce_rate', 'low_open_rate']
        }
      },
      tracking: {
        enabled: true,
        openTracking: true,
        clickTracking: true,
        customEvents: []
      }
    },
    metadata: {
      generatedBy: 'technical-spec-generator',
      sourceContext: context || {},
      processingTime: 0,
      complexity: contentAnalysis.complexity || 'medium',
      estimatedImplementationTime: calculateEstimatedTime(contentAnalysis.complexity),
      dependencies: ['mjml', 'image-optimization', 'html-validation'],
      notes: []
    }
  };
  
  return specification;
}

function calculateEstimatedTime(complexity: string): number {
  switch (complexity) {
    case 'low': return 4;
    case 'medium': return 8;
    case 'high': return 16;
    case 'very-high': return 24;
    default: return 8;
  }
}

async function validateTechnicalSpecificationInternal(specification: any): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate required fields
  if (!specification.version) errors.push('Missing specification version');
  if (!specification.campaign?.id) errors.push('Missing campaign ID');
  if (!specification.content?.subject) errors.push('Missing email subject');
  if (!specification.design?.constraints) errors.push('Missing design constraints');
  
  // Validate content sections
  if (!specification.content?.sections || specification.content.sections.length === 0) {
    errors.push('No content sections defined');
  }
  
  // Validate assets
  if (!specification.design?.assets?.manifest) {
    warnings.push('No asset manifest provided');
  }
  
  // Validate email clients
  if (!specification.delivery?.emailClients || specification.delivery.emailClients.length === 0) {
    errors.push('No email clients specified');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

async function generateImplementationGuidance(
  specification: any,
  contentContext: any
): Promise<any> {
  const complexity = specification.metadata.complexity || 'medium';
  const sectionsCount = specification.content.sections.length;
  const _assetsCount // Currently unused = specification.design.assets.manifest.images.length + specification.design.assets.manifest.icons.length;
  
  return {
    priority: sectionsCount > 5 ? 'high' : 'medium',
    estimatedTime: specification.metadata.estimatedImplementationTime,
    complexity,
    dependencies: specification.metadata.dependencies,
    risks: generateRisks(specification),
    recommendations: generateRecommendations(specification, contentContext)
  };
}

function getDefaultImplementationGuidance(): any {
  return {
    priority: 'medium',
    estimatedTime: 8,
    complexity: 'medium',
    dependencies: ['mjml', 'image-optimization'],
    risks: ['Email client compatibility', 'Performance optimization'],
    recommendations: ['Test across all target email clients', 'Optimize images for web delivery']
  };
}

function generateRisks(specification: any): string[] {
  const risks = [];
  
  if (specification.delivery.emailClients.length > 3) {
    risks.push('Multiple email client compatibility challenges');
  }
  
  if (specification.design.assets.manifest.images.length > 5) {
    risks.push('High image count may impact performance');
  }
  
  if (specification.quality.criteria.performance.maxFileSize > 100000) {
    risks.push('Large file size may cause email clipping');
  }
  
  return risks;
}

function generateRecommendations(specification: any, contentContext: any): string[] {
  const recommendations = [];
  
  recommendations.push('Use table-based layout for maximum compatibility');
  recommendations.push('Inline all CSS for better email client support');
  recommendations.push('Optimize images for web delivery');
  recommendations.push('Test across all target email clients');
  
  if (specification.design.responsive.enabled) {
    recommendations.push('Implement responsive design with media queries');
  }
  
  if (specification.quality.criteria.accessibility.wcagLevel === 'AA') {
    recommendations.push('Ensure WCAG AA compliance with proper alt text and contrast');
  }
  
  return recommendations;
}

function calculateSpecificationQualityScore(
  specification: any,
  validationResult: any,
  _contentContext: any
): any {
  const completeness = validationResult.errors.length === 0 ? 100 : Math.max(0, 100 - (validationResult.errors.length * 10));
  const consistency = calculateConsistencyScore(specification);
  const clarity = calculateClarityScore(specification);
  const implementability = calculateImplementabilityScore(specification);
  
  return {
    completeness,
    consistency,
    clarity,
    implementability,
    overall: Math.round((completeness + consistency + clarity + implementability) / 4)
  };
}

function calculateConsistencyScore(specification: any): number {
  // Check for consistency between different parts of the specification
  let score = 100;
  
  // Check color consistency
  if (specification.design.constraints.colorScheme.primary === '#007bff') {
    score -= 10; // Using default colors
  }
  
  // Check font consistency
  if (specification.design.constraints.typography.headingFont.family !== specification.design.constraints.typography.bodyFont.family) {
    score -= 5; // Different font families
  }
  
  return Math.max(0, score);
}

function calculateClarityScore(specification: any): number {
  // Check for clarity of specifications
  let score = 100;
  
  // Check for detailed descriptions
  if (!specification.content.sections || specification.content.sections.length === 0) {
    score -= 20;
  }
  
  // Check for asset specifications
  if (!specification.design.assets.requirements || specification.design.assets.requirements.length === 0) {
    score -= 15;
  }
  
  return Math.max(0, score);
}

function calculateImplementabilityScore(specification: any): number {
  // Check how implementable the specification is
  let score = 100;
  
  // Check for realistic constraints
  if (specification.quality.criteria.performance.maxFileSize < 10000) {
    score -= 20; // Too restrictive
  }
  
  // Check for feasible requirements
  if (specification.delivery.emailClients.length > 10) {
    score -= 10; // Too many clients to support
  }
  
  return Math.max(0, score);
}

async function generateHumanReadableSpecification(specification: any): Promise<string> {
  return `# Technical Specification

## Campaign Information
- **Campaign ID**: ${specification.campaign.id}
- **Campaign Name**: ${specification.campaign.name}
- **Type**: ${specification.campaign.type}
- **Priority**: ${specification.campaign.priority}

## Content Specification
- **Subject**: ${specification.content.subject}
- **Preheader**: ${specification.content.preheader}
- **Sections**: ${specification.content.sections.length} sections defined

## Design Constraints
- **Layout**: ${specification.design.constraints.layout.type}
- **Max Width**: ${specification.design.constraints.layout.maxWidth}px
- **Primary Color**: ${specification.design.constraints.colorScheme.primary}
- **Font Family**: ${specification.design.constraints.typography.headingFont.family}

## Quality Criteria
- **WCAG Level**: ${specification.quality.criteria.accessibility.wcagLevel}
- **Max File Size**: ${specification.quality.criteria.performance.maxFileSize} bytes
- **Email Clients**: ${specification.delivery.emailClients.length} clients supported

## Implementation
- **Estimated Time**: ${specification.metadata.estimatedImplementationTime} hours
- **Complexity**: ${specification.metadata.complexity}
- **Dependencies**: ${specification.metadata.dependencies.join(', ')}

Generated at: ${specification.generatedAt}
`;
}

async function generateImplementationGuideDocument(guidance: any, specification: any): Promise<string> {
  return `# Implementation Guide

## Overview
- **Priority**: ${guidance.priority}
- **Estimated Time**: ${guidance.estimatedTime} hours
- **Complexity**: ${guidance.complexity}

## Dependencies
${guidance.dependencies.map((dep: string) => `- ${dep}`).join('\\n')}

## Risks
${guidance.risks.map((risk: string) => `- ${risk}`).join('\\n')}

## Recommendations
${guidance.recommendations.map((rec: string) => `- ${rec}`).join('\\n')}

## Step-by-Step Implementation
1. Set up MJML development environment
2. Create base email template structure
3. Implement responsive design system
4. Add content sections with proper styling
5. Integrate assets and optimize for email delivery
6. Test across all target email clients
7. Validate HTML/CSS and accessibility
8. Deploy and monitor performance

## Quality Checkpoints
- [ ] HTML validation passes
- [ ] CSS validation passes
- [ ] All images have alt text
- [ ] Color contrast meets WCAG ${specification.quality.criteria.accessibility.wcagLevel} standards
- [ ] Email renders correctly in all target clients
- [ ] File size under ${specification.quality.criteria.performance.maxFileSize} bytes
- [ ] All links are functional
- [ ] Responsive design works on mobile devices
`;
}

function generateValidationRecommendations(validationResult: any): string[] {
  const recommendations = [];
  
  if (validationResult.errors.length > 0) {
    recommendations.push('Fix all validation errors before implementation');
  }
  
  if (validationResult.warnings.length > 0) {
    recommendations.push('Address validation warnings for better quality');
  }
  
  recommendations.push('Review specification with Design Specialist');
  recommendations.push('Conduct thorough testing across all email clients');
  
  return recommendations;
}

// ============================================================================
// EXPORTS
// ============================================================================

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type EmailClientConstraint = z.infer<typeof EmailClientConstraintSchema>;
export type DesignConstraint = z.infer<typeof DesignConstraintSchema>;
export type QualityCriteria = z.infer<typeof QualityCriteriaSchema>;
export type TechnicalSpecification = z.infer<typeof TechnicalSpecificationSchema>;

export interface TechnicalSpecificationResult {
  success: boolean;
  specificationId: string;
  specification: TechnicalSpecification;
  validationResult: any;
  implementationGuide?: string;
  processingTime: number;
  message: string;
  generationSummary?: GenerationSummary;
  implementationGuidance?: ImplementationGuidance;
  qualityScore?: QualityScore;
}

export interface SpecificationValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  score: {
    completeness: number;
    consistency: number;
    feasibility: number;
    overall: number;
  };
}

export const technicalSpecificationTools = [
  generateTechnicalSpecification,
  validateTechnicalSpecification
];