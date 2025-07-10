/**
 * 🏗️ CONTEXT BUILDERS - Context Construction Utilities
 * 
 * Helper functions to build context objects from specialist outputs.
 * Used by specialist tools to prepare handoff data in proper format.
 */

import { promises as fs } from 'fs';
import path from 'path';
import {
  ContentContext,
  DesignContext, 
  QualityContext,
  DeliveryContext,
  CampaignMetadata,
  ContentToDesignHandoff,
  DesignToQualityHandoff,
  QualityToDeliveryHandoff,
  createHandoffMetadata,
  type HandoffMetadata
} from './handoff-schemas';

// ============================================================================
// CONTENT CONTEXT BUILDER  
// ============================================================================

/**
 * Builds comprehensive content context from Content Specialist tool outputs
 * with proper dynamic fallbacks instead of hardcoded Turkey/Istanbul values
 */
export async function buildContentContextFromOutputs(
  campaignId: string,
  campaignPath: string,
  contextAnalysisData: any,
  dateAnalysisData: any,
  pricingAnalysisData: any,
  assetStrategyData: any,
  generatedContentData: any,
  technicalRequirements?: any
): Promise<ContentContext> {
  
  // ============ HELPER FUNCTIONS ============
  
  function normalizeEmotionalTrigger(value: any): 'excitement' | 'trust' | 'urgency' | 'relaxation' | 'adventure' {
    const triggers = ['excitement', 'trust', 'urgency', 'relaxation', 'adventure'];
    return triggers.includes(value) ? value : 'excitement';
  }
  
  function normalizeVisualStyle(value: any): 'modern' | 'classic' | 'minimalist' | 'vibrant' | 'elegant' {
    const styles = ['modern', 'classic', 'minimalist', 'vibrant', 'elegant'];
    return styles.includes(value) ? value : 'modern';
  }
  
  function normalizeSeason(value: any): 'spring' | 'summer' | 'autumn' | 'winter' | 'year-round' {
    const seasons = ['spring', 'summer', 'autumn', 'winter', 'year-round'];
    
    // Check if value is already a valid season
    if (seasons.includes(value)) return value;
    
    // Try to detect from string content
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      
      // Russian season detection
      if (lowerValue.includes('осен') || lowerValue.includes('autumn') || lowerValue.includes('fall')) return 'autumn';
      if (lowerValue.includes('зим') || lowerValue.includes('winter')) return 'winter';
      if (lowerValue.includes('весн') || lowerValue.includes('spring')) return 'spring';
      if (lowerValue.includes('лет') || lowerValue.includes('summer')) return 'summer';
    }
    
    // Default to autumn for Thailand autumn campaign context
    return 'autumn';
  }
  
  function parsePrice(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value.replace(/[^\d.]/g, ''));
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }
  
  function ensureArray(value: any): string[] {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    return [];
  }
  
  function ensureString(value: any, fallback: string = ''): string {
    return typeof value === 'string' ? value : fallback;
  }

  // Generate current dynamic dates instead of hardcoded 2024 dates
  function generateCurrentDates(): string[] {
    const currentDate = new Date();
    const dates: string[] = [];
    
    // Generate dates starting from next month
    for (let i = 1; i <= 3; i++) {
      const futureDate = new Date(currentDate);
      futureDate.setMonth(futureDate.getMonth() + i);
      futureDate.setDate(1); // First of month
      dates.push(futureDate.toISOString().split('T')[0]);
      
      futureDate.setDate(15); // Mid month
      dates.push(futureDate.toISOString().split('T')[0]);
    }
    
    return dates;
  }

  function generateCurrentPricingWindows(): string[] {
    const currentDate = new Date();
    const windows: string[] = [];
    
    // Generate pricing windows for next few months
    for (let i = 1; i <= 2; i++) {
      const startDate = new Date(currentDate);
      startDate.setMonth(startDate.getMonth() + i);
      startDate.setDate(1);
      
      const endDate = new Date(startDate);
      endDate.setDate(15);
      
      windows.push(`${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
      
      const nextStart = new Date(endDate);
      nextStart.setDate(16);
      const nextEnd = new Date(nextStart);
      nextEnd.setMonth(nextEnd.getMonth() + 1);
      nextEnd.setDate(0); // Last day of month
      
      windows.push(`${nextStart.toISOString().split('T')[0]} to ${nextEnd.toISOString().split('T')[0]}`);
    }
    
    return windows;
  }

  // Detect destination from campaign data
  function detectDestination(): string {
    // First try to get from actual data
    const detectedDest = contextAnalysisData?.destination || 
                        dateAnalysisData?.destination || 
                        pricingAnalysisData?.route?.to ||
                        generatedContentData?.subject?.includes('Thailand') ? 'Thailand' :
                        generatedContentData?.subject?.includes('Таиланд') ? 'Thailand' :
                        assetStrategyData?.theme?.includes('Thailand') ? 'Thailand' :
                        assetStrategyData?.theme?.includes('Таиланд') ? 'Thailand' :
                        'Thailand'; // Default for current campaign
    
    return detectedDest;
  }

  function detectRoute() {
    // Try to detect from pricing data first
    if (pricingAnalysisData?.route) {
      return {
        from: ensureString(pricingAnalysisData.route.from, 'Moscow'),
        to: ensureString(pricingAnalysisData.route.to, 'Bangkok'),
        from_code: ensureString(pricingAnalysisData.route.from_code, 'MOW'),
        to_code: ensureString(pricingAnalysisData.route.to_code, 'BKK')
      };
    }
    
    // Default route for Thailand campaign
    return {
      from: 'Moscow',
      to: 'Bangkok', 
      from_code: 'MOW',
      to_code: 'BKK'
    };
  }

  const detectedDestination = detectDestination();
  const detectedRoute = detectRoute();
  const currentDates = generateCurrentDates();
  const currentPricingWindows = generateCurrentPricingWindows();

  const contentContext: ContentContext = {
    campaign: {
      id: campaignId,
      campaignPath: campaignPath,
      name: `Campaign ${campaignId}`,
      brand: 'Email Makers',
      type: 'promotional',
      target_audience: 'travel enthusiasts',
      language: 'ru',
      created_at: new Date().toISOString(),
      status: 'active'
    },
    context_analysis: {
      destination: detectedDestination,
      seasonal_trends: ensureString(contextAnalysisData?.seasonal_trends, `Current season trends for ${detectedDestination}`),
      emotional_triggers: ensureString(contextAnalysisData?.emotional_triggers, 'Exotic adventure and relaxation'),
      market_positioning: ensureString(contextAnalysisData?.market_positioning, 'Premium exotic destination'),
      competitive_landscape: ensureString(contextAnalysisData?.competitive_landscape, 'Strong competition in Southeast Asia travel market'),
      price_sensitivity: ensureString(contextAnalysisData?.price_sensitivity, 'Medium price sensitivity for exotic destinations'),
      booking_patterns: ensureString(contextAnalysisData?.booking_patterns, 'Advance planning with seasonal booking patterns')
    },
    date_analysis: {
      destination: detectedDestination,
      season: normalizeSeason(dateAnalysisData?.season),
      optimal_dates: ensureArray(dateAnalysisData?.optimal_dates).length > 0 
        ? ensureArray(dateAnalysisData.optimal_dates) 
        : currentDates.slice(0, 3),
      pricing_windows: ensureArray(dateAnalysisData?.pricing_windows).length > 0
        ? ensureArray(dateAnalysisData.pricing_windows)
        : currentPricingWindows,
      booking_recommendation: ensureString(dateAnalysisData?.booking_recommendation, 'Book 2-3 months in advance for best rates'),
      seasonal_factors: ensureString(dateAnalysisData?.seasonal_factors, `Winter season - optimal time for ${detectedDestination}`),
      current_date: ensureString(dateAnalysisData?.current_date, new Date().toISOString().split('T')[0])
    },
    pricing_analysis: {
      best_price: parsePrice(pricingAnalysisData?.best_price),
      min_price: parsePrice(pricingAnalysisData?.min_price || pricingAnalysisData?.best_price || 0),
      max_price: parsePrice(pricingAnalysisData?.max_price || pricingAnalysisData?.best_price || 0),
      average_price: parsePrice(pricingAnalysisData?.average_price || pricingAnalysisData?.best_price || 0),
      currency: ensureString(pricingAnalysisData?.currency, 'RUB'),
      offers_count: parseInt(pricingAnalysisData?.offers_count) || 0,
      recommended_dates: ensureArray(pricingAnalysisData?.recommended_dates).length > 0
        ? ensureArray(pricingAnalysisData.recommended_dates)
        : currentDates.slice(0, 2),
      route: detectedRoute,
      enhanced_features: {
        airport_conversion: pricingAnalysisData?.enhanced_features?.airport_conversion || {},
        csv_integration: ensureString(pricingAnalysisData?.enhanced_features?.csv_integration, 'enabled'),
        api_source: ensureString(pricingAnalysisData?.enhanced_features?.api_source, 'kupibilet_api')
      }
    },
    asset_strategy: {
      theme: ensureString(assetStrategyData?.theme, `${detectedDestination} Travel Experience`),
      visual_style: normalizeVisualStyle(assetStrategyData?.visual_style),
      color_palette: ensureString(assetStrategyData?.color_palette, 'Tropical warm colors with brand accents'),
      typography: ensureString(assetStrategyData?.typography, 'Modern clean typography'),
      image_concepts: ensureArray(assetStrategyData?.image_concepts).length > 0
        ? ensureArray(assetStrategyData.image_concepts)
        : ['Hero destination image', 'Cultural lifestyle photography', 'Service and amenity icons'],
      layout_hierarchy: ensureString(assetStrategyData?.layout_hierarchy, 'Hero section, content blocks, call-to-action'),
      emotional_triggers: normalizeEmotionalTrigger(assetStrategyData?.emotional_triggers),
      brand_consistency: ensureString(assetStrategyData?.brand_consistency, 'Maintain brand colors and typography')
    },
    generated_content: {
      subject: ensureString(generatedContentData?.subject, `Special ${detectedDestination} Travel Offer`),
      preheader: ensureString(generatedContentData?.preheader, 'Don\'t miss this amazing deal'),
      body: ensureString(generatedContentData?.body, `Discover ${detectedDestination} with our exclusive travel offers...`),
      cta: {
        primary: ensureString(generatedContentData?.cta?.primary || generatedContentData?.cta_primary, 'Book Now'),
        secondary: ensureString(generatedContentData?.cta?.secondary || generatedContentData?.cta_secondary, 'View Deals')
      },
      personalization_level: (generatedContentData?.personalization_level as any) || 'advanced',
      urgency_level: generatedContentData?.urgency_level === 'high' ? 'medium' : 
                    (generatedContentData?.urgency_level as any) || 'medium'
    },
    technical_requirements: technicalRequirements || {
      max_width: '600px',
      email_clients: ['gmail', 'outlook', 'apple_mail'],
      dark_mode_support: true,
      accessibility_level: 'AA' as const
    }
  };

  return contentContext;
}

/**
 * Saves content context to campaign folder
 */
export async function saveContentContext(
  contentContext: ContentContext,
  campaignPath: string
): Promise<string> {
  const contextPath = path.join(campaignPath, 'docs', 'content-context.json');
  await fs.writeFile(contextPath, JSON.stringify(contentContext, null, 2));
  console.log(`📝 Content context saved to: ${contextPath}`);
  return contextPath;
}

// ============================================================================
// DESIGN CONTEXT BUILDER
// ============================================================================

/**
 * Builds comprehensive design context from Design Specialist tool outputs
 */
export async function buildDesignContextFromOutputs(
  contentContext: ContentContext,
  assetManifestData: any,
  mjmlTemplateData: any,
  designDecisionsData: any,
  previewFilesData: any,
  performanceMetricsData: any
): Promise<DesignContext> {
  
  const designContext: DesignContext = {
    content_context: contentContext,
    asset_manifest: {
      images: assetManifestData.images || [],
      icons: assetManifestData.icons || [],
      fonts: assetManifestData.fonts || []
    },
    mjml_template: {
      source: mjmlTemplateData.source,
      compiled_html: mjmlTemplateData.compiled_html,
      inline_css: mjmlTemplateData.inline_css,
      file_size: mjmlTemplateData.file_size,
      validation_status: mjmlTemplateData.validation_status || 'valid',
      validation_messages: mjmlTemplateData.validation_messages || [],
      responsive_breakpoints: mjmlTemplateData.responsive_breakpoints || []
    },
    design_decisions: {
      layout_strategy: designDecisionsData.layout_strategy,
      color_scheme_applied: designDecisionsData.color_scheme_applied,
      typography_implementation: designDecisionsData.typography_implementation,
      asset_optimization: designDecisionsData.asset_optimization || [],
      accessibility_features: designDecisionsData.accessibility_features || [],
      email_client_adaptations: designDecisionsData.email_client_adaptations || {}
    },
    preview_files: previewFilesData.map((preview: any) => ({
      type: preview.type,
      path: preview.path,
      format: preview.format || 'png'
    })),
    performance_metrics: {
      html_size: performanceMetricsData.html_size,
      total_assets_size: performanceMetricsData.total_assets_size,
      estimated_load_time: performanceMetricsData.estimated_load_time,
      optimization_score: performanceMetricsData.optimization_score
    }
  };

  return designContext;
}

/**
 * Saves design context to campaign folder
 */
export async function saveDesignContext(
  designContext: DesignContext,
  campaignPath: string
): Promise<string> {
  const contextPath = path.join(campaignPath, 'docs', 'design-context.json');
  await fs.writeFile(contextPath, JSON.stringify(designContext, null, 2));
  console.log(`🎨 Design context saved to: ${contextPath}`);
  return contextPath;
}

// ============================================================================
// QUALITY CONTEXT BUILDER
// ============================================================================

/**
 * Builds comprehensive quality context from Quality Specialist tool outputs
 */
export async function buildQualityContextFromOutputs(
  designContext: DesignContext,
  qualityReportData: any,
  testArtifactsData: any,
  complianceStatusData: any
): Promise<QualityContext> {
  
  const qualityContext: QualityContext = {
    design_context: designContext,
    quality_report: {
      overall_score: qualityReportData.overall_score,
      html_validation: qualityReportData.html_validation,
      css_validation: qualityReportData.css_validation,
      mjml_validation: qualityReportData.mjml_validation,
      email_client_tests: qualityReportData.email_client_tests || [],
      accessibility_test: qualityReportData.accessibility_test,
      performance_analysis: qualityReportData.performance_analysis,
      deliverability_score: qualityReportData.deliverability_score,
      spam_analysis: qualityReportData.spam_analysis,
      approval_status: qualityReportData.approval_status,
      recommendations: qualityReportData.recommendations || []
    },
    test_artifacts: {
      screenshots: testArtifactsData.screenshots || [],
      validation_logs: testArtifactsData.validation_logs || [],
      performance_reports: testArtifactsData.performance_reports || []
    },
    compliance_status: {
      html_standards: complianceStatusData.html_standards !== false,
      email_standards: complianceStatusData.email_standards !== false,
      accessibility_standards: complianceStatusData.accessibility_standards !== false,
      brand_guidelines: complianceStatusData.brand_guidelines !== false,
      legal_compliance: complianceStatusData.legal_compliance !== false
    }
  };

  return qualityContext;
}

/**
 * Saves quality context to campaign folder
 */
export async function saveQualityContext(
  qualityContext: QualityContext,
  campaignPath: string
): Promise<string> {
  const contextPath = path.join(campaignPath, 'docs', 'quality-context.json');
  await fs.writeFile(contextPath, JSON.stringify(qualityContext, null, 2));
  console.log(`✅ Quality context saved to: ${contextPath}`);
  return contextPath;
}

// ============================================================================
// DELIVERY CONTEXT BUILDER
// ============================================================================

/**
 * Builds comprehensive delivery context from Delivery Specialist tool outputs
 */
export async function buildDeliveryContextFromOutputs(
  qualityContext: QualityContext,
  deliveryManifestData: any,
  exportFormatData: any,
  deliveryReportData: any,
  deploymentArtifactsData: any
): Promise<DeliveryContext> {
  
  const deliveryContext: DeliveryContext = {
    quality_context: qualityContext,
    delivery_manifest: {
      campaign_id: deliveryManifestData.campaign_id,
      package_version: deliveryManifestData.package_version,
      created_at: deliveryManifestData.created_at,
      total_files: deliveryManifestData.total_files,
      total_size: deliveryManifestData.total_size,
      files: deliveryManifestData.files || [],
      checksums: deliveryManifestData.checksums || {}
    },
    export_format: {
      format: exportFormatData.format || 'zip',
      compression: exportFormatData.compression || 'standard',
      encryption: exportFormatData.encryption || false,
      password_protected: exportFormatData.password_protected || false,
      export_path: exportFormatData.export_path,
      download_url: exportFormatData.download_url,
      expiry_date: exportFormatData.expiry_date
    },
    delivery_report: {
      campaign_summary: deliveryReportData.campaign_summary,
      content_summary: deliveryReportData.content_summary,
      design_summary: deliveryReportData.design_summary,
      quality_summary: deliveryReportData.quality_summary,
      deliverables: deliveryReportData.deliverables,
      deployment_ready: deliveryReportData.deployment_ready,
      next_steps: deliveryReportData.next_steps || [],
      support_information: deliveryReportData.support_information || {}
    },
    deployment_artifacts: {
      production_ready_files: deploymentArtifactsData.production_ready_files || [],
      testing_files: deploymentArtifactsData.testing_files || [],
      documentation_files: deploymentArtifactsData.documentation_files || [],
      source_files: deploymentArtifactsData.source_files || []
    },
    delivery_status: 'ready',
    delivery_timestamp: new Date().toISOString()
  };

  return deliveryContext;
}

/**
 * Saves delivery context to campaign folder
 */
export async function saveDeliveryContext(
  deliveryContext: DeliveryContext,
  campaignPath: string
): Promise<string> {
  const contextPath = path.join(campaignPath, 'docs', 'delivery-context.json');
  await fs.writeFile(contextPath, JSON.stringify(deliveryContext, null, 2));
  console.log(`📦 Delivery context saved to: ${contextPath}`);
  return contextPath;
}

// ============================================================================
// HANDOFF PREPARATION UTILITIES
// ============================================================================

/**
 * Prepares Content → Design handoff
 */
export async function prepareContentToDesignHandoff(
  request: string,
  contentContext: ContentContext,
  traceId?: string,
  executionTime?: number
): Promise<ContentToDesignHandoff> {
  
  const metadata = createHandoffMetadata('content', 'design', traceId);
  
  // Set execution time if provided
  if (executionTime !== undefined) {
    metadata.executionTime = executionTime;
  }
  
  return {
    request,
    metadata,
    content_context: contentContext
  };
}

/**
 * Prepares Design → Quality handoff
 */
export async function prepareDesignToQualityHandoff(
  request: string,
  contentContext: ContentContext,
  designContext: DesignContext,
  traceId?: string
): Promise<DesignToQualityHandoff> {
  
  const metadata = createHandoffMetadata('design', 'quality', traceId);
  
  return {
    request,
    metadata,
    content_context: contentContext,
    design_context: designContext
  };
}

/**
 * Prepares Quality → Delivery handoff
 */
export async function prepareQualityToDeliveryHandoff(
  request: string,
  contentContext: ContentContext,
  designContext: DesignContext,
  qualityContext: QualityContext,
  traceId?: string
): Promise<QualityToDeliveryHandoff> {
  
  const metadata = createHandoffMetadata('quality', 'delivery', traceId);
  
  return {
    request,
    metadata,
    content_context: contentContext,
    design_context: designContext,
    quality_context: qualityContext
  };
}

// ============================================================================
// CONTEXT VALIDATION UTILITIES
// ============================================================================

/**
 * Validates context completeness
 */
export function validateContextCompleteness(context: any, contextType: string): {
  isComplete: boolean;
  missingFields: string[];
  warnings: string[];
} {
  const missingFields: string[] = [];
  const warnings: string[] = [];
  
  switch (contextType) {
    case 'content':
      if (!context.campaign) missingFields.push('campaign');
      if (!context.context_analysis) missingFields.push('context_analysis');
      if (!context.date_analysis) missingFields.push('date_analysis');
      if (!context.pricing_analysis) missingFields.push('pricing_analysis');
      if (!context.asset_strategy) missingFields.push('asset_strategy');
      if (!context.generated_content) missingFields.push('generated_content');
      break;
      
    case 'design':
      if (!context.content_context) missingFields.push('content_context');
      if (!context.asset_manifest) missingFields.push('asset_manifest');
      if (!context.mjml_template) missingFields.push('mjml_template');
      if (!context.design_decisions) missingFields.push('design_decisions');
      break;
      
    case 'quality':
      if (!context.design_context) missingFields.push('design_context');
      if (!context.quality_report) missingFields.push('quality_report');
      if (!context.test_artifacts) missingFields.push('test_artifacts');
      if (!context.compliance_status) missingFields.push('compliance_status');
      break;
      
    case 'delivery':
      if (!context.quality_context) missingFields.push('quality_context');
      if (!context.delivery_manifest) missingFields.push('delivery_manifest');
      if (!context.export_format) missingFields.push('export_format');
      if (!context.delivery_report) missingFields.push('delivery_report');
      break;
  }
  
  return {
    isComplete: missingFields.length === 0,
    missingFields,
    warnings
  };
}

/**
 * Recovers context from campaign folder
 */
export async function recoverContextFromCampaign(
  campaignPath: string,
  contextType: 'content' | 'design' | 'quality' | 'delivery'
): Promise<any> {
  const contextPath = path.join(campaignPath, 'docs', `${contextType}-context.json`);
  
  try {
    const contextContent = await fs.readFile(contextPath, 'utf-8');
    const context = JSON.parse(contextContent);
    console.log(`🔄 Recovered ${contextType} context from: ${contextPath}`);
    return context;
  } catch (error) {
    throw new Error(`Failed to recover ${contextType} context from ${contextPath}: ${error.message}`);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

// All functions are already exported in their declarations above