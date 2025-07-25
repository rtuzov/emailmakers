/**
 * 🔄 HANDOFF SCHEMAS - OpenAI Agents SDK Compatible
 * 
 * Comprehensive data structures for passing context between specialists
 * using OpenAI Agents SDK context parameter patterns.
 * 
 * Replaces the broken global state pattern with proper context flow.
 */

import { z } from 'zod';

// ============================================================================
// BASE SCHEMAS
// ============================================================================

export const HandoffMetadataSchema = z.object({
  handoffId: z.string().describe('Unique identifier for this handoff'),
  timestamp: z.string().describe('ISO timestamp of handoff'),
  fromAgent: z.enum(['content', 'design', 'quality', 'delivery']).describe('Source agent'),
  toAgent: z.enum(['content', 'design', 'quality', 'delivery']).describe('Target agent'),
  dataVersion: z.string().default('1.0').describe('Schema version for compatibility'),
  traceId: z.string().nullable().describe('Trace ID for debugging'),
  executionTime: z.number().nullable().describe('Time taken for processing (ms)')
});

export const CampaignMetadataSchema = z.object({
  id: z.string().describe('Unique campaign identifier'),
  name: z.string().describe('Campaign name'),
  brand: z.string().describe('Brand name'),
  type: z.enum(['promotional', 'transactional', 'newsletter', 'announcement']).describe('Campaign type'),
  target_audience: z.string().describe('Target audience description'),
  language: z.string().default('ru').describe('Campaign language'),
  created_at: z.string().describe('Creation timestamp'),
  status: z.enum(['active', 'draft', 'completed', 'archived']).describe('Campaign status'),
  campaignPath: z.string().describe('File system path to campaign folder')
});

// ============================================================================
// DATA COLLECTION CONTEXT SCHEMAS
// ============================================================================

export const DataCollectionContextSchema = z.object({
  destination_analysis: z.object({
    analysis_type: z.string().describe('Type of destination analysis'),
    data: z.object({
      climate_factors: z.string().optional().describe('Climate and weather factors'),
      cultural_highlights: z.string().optional().describe('Cultural attractions and highlights'),
      key_attractions: z.string().optional().describe('Key tourist attractions'),
      seasonal_advantages: z.string().optional().describe('Seasonal travel advantages'),
      travel_experience_quality: z.string().optional().describe('Overall travel experience quality')
    }).passthrough().describe('Destination analysis data'),
    saved_at: z.string().describe('Analysis timestamp')
  }).optional().describe('Destination analysis from data collection'),
  
  market_intelligence: z.object({
    analysis_type: z.string().describe('Type of market analysis'),
    data: z.object({
      pricing_insights: z.string().optional().describe('Market pricing insights'),
      competitive_position: z.string().optional().describe('Competitive market position'),
      demand_patterns: z.string().optional().describe('Market demand patterns'),
      booking_recommendations: z.string().optional().describe('Booking timing recommendations')
    }).passthrough().describe('Market intelligence data'),
    saved_at: z.string().describe('Analysis timestamp')
  }).optional().describe('Market intelligence from data collection'),
  
  emotional_profile: z.object({
    analysis_type: z.string().describe('Type of emotional analysis'),
    data: z.object({
      core_motivations: z.string().optional().describe('Core traveler motivations'),
      emotional_triggers: z.string().optional().describe('Key emotional triggers'),
      key_desires: z.string().optional().describe('Primary traveler desires'),
      psychological_benefits: z.string().optional().describe('Psychological benefits sought')
    }).passthrough().describe('Emotional profile data'),
    saved_at: z.string().describe('Analysis timestamp')
  }).optional().describe('Emotional profile from data collection'),
  
  consolidated_insights: z.object({
    actionable_insights: z.array(z.string()).describe('Actionable marketing insights'),
    key_insights: z.array(z.string()).describe('Key strategic insights'),
    confidence_score: z.number().min(0).max(1).describe('Confidence in analysis'),
    analysis_timestamp: z.string().describe('Analysis timestamp'),
    saved_at: z.string().describe('Save timestamp')
  }).optional().describe('Consolidated insights from all data'),
  
  travel_intelligence: z.object({
    analysis_type: z.string().optional().describe('Type of travel intelligence analysis'),
    data: z.object({
      route_analysis: z.string().describe('Flight route analysis'),
      pricing_trends: z.string().describe('Historical pricing trends'),
      seasonal_patterns: z.string().describe('Seasonal travel patterns'),
      booking_windows: z.string().describe('Optimal booking windows'),
      destination_insights: z.object({
        route_analysis: z.string().optional(),
        seasonal_patterns: z.string().optional(),
        climate: z.string().optional(),
        culture: z.string().optional()
      }).passthrough().optional().describe('Destination insights'),
      market_insights: z.object({
        pricing_trends: z.string().optional(),
        booking_windows: z.string().optional(),
        demand: z.string().optional(),
        competition: z.string().optional()
      }).passthrough().optional().describe('Market insights'),
      trend_insights: z.object({
        market_trends: z.string().optional(),
        consumer_behavior: z.string().optional(),
        competitive_landscape: z.string().optional(),
        seasonal_factors: z.string().optional()
      }).passthrough().optional().describe('Trend insights')
    }).passthrough().describe('Travel intelligence data'),
    saved_at: z.string().describe('Analysis timestamp')
  }).optional().describe('Travel intelligence data'),
  
  trend_analysis: z.object({
    analysis_type: z.string().optional().describe('Type of trend analysis'),
    data: z.object({
      market_trends: z.string().describe('Current market trends'),
      consumer_behavior: z.string().describe('Consumer behavior patterns'),
      competitive_landscape: z.string().describe('Competitive analysis'),
      seasonal_factors: z.string().describe('Seasonal influence factors')
    }).passthrough().describe('Trend analysis data'),
    saved_at: z.string().describe('Analysis timestamp')
  }).optional().describe('Trend analysis data'),
  
  collection_metadata: z.object({
    campaign_id: z.string().describe('Campaign identifier'),
    collection_timestamp: z.string().describe('Data collection timestamp'),
    data_sources: z.array(z.string()).describe('Sources of collected data'),
    collection_status: z.enum(['complete', 'partial', 'failed']).describe('Collection status'),
    data_quality_score: z.number().min(0).max(100).describe('Quality score of collected data')
  }).optional().describe('Data collection metadata')
}).passthrough().describe('Data collection context');

// ============================================================================
// CONTENT SPECIALIST SCHEMAS
// ============================================================================

export const ContextAnalysisSchema = z.object({
  destination: z.string().describe('Travel destination or location'),
  seasonal_trends: z.string().describe('Seasonal information and trends'),
  emotional_triggers: z.string().describe('Emotional triggers for the destination'),
  market_positioning: z.string().describe('Market positioning strategy'),
  competitive_landscape: z.string().describe('Competitive analysis'),
  price_sensitivity: z.string().describe('Price sensitivity analysis'),
  booking_patterns: z.string().describe('Customer booking behavior patterns')
});

export const DateAnalysisSchema = z.object({
  destination: z.string().describe('Travel destination'),
  season: z.enum(['spring', 'summer', 'autumn', 'winter', 'year-round']).describe('Travel season'),
  optimal_dates: z.array(z.string()).describe('Optimal travel dates (YYYY-MM-DD format)'),
  pricing_windows: z.array(z.string()).describe('Price optimization windows'),
  booking_recommendation: z.string().describe('Booking timing recommendation'),
  seasonal_factors: z.string().describe('Seasonal considerations'),
  current_date: z.string().describe('Analysis date (YYYY-MM-DD)')
});

export const PricingAnalysisSchema = z.object({
  best_price: z.number().optional().describe('Best available price'),
  min_price: z.number().optional().describe('Minimum price found'),
  max_price: z.number().optional().describe('Maximum price found'),
  average_price: z.number().optional().describe('Average price across offers'),
  currency: z.string().optional().describe('Currency code (RUB, USD, EUR)'),
  offers_count: z.number().optional().describe('Number of offers found'),
  recommended_dates: z.array(z.string()).optional().describe('Recommended booking dates'),
  route: z.object({
    from: z.string().optional().describe('Departure city'),
    to: z.string().optional().describe('Destination city'),
    from_code: z.string().optional().describe('Departure airport code'),
    to_code: z.string().optional().describe('Destination airport code')
  }).optional().describe('Flight route information'),
  enhanced_features: z.object({
    airport_conversion: z.record(z.unknown()).optional().describe('Airport conversion data'),
    csv_integration: z.string().optional().describe('CSV integration status'),
    api_source: z.string().optional().describe('API source identifier')
  }).optional().describe('Enhanced pricing features'),
  // Support comprehensive pricing format
  comprehensive_pricing: z.object({
    best_price_overall: z.number().optional(),
    currency: z.string().optional()
  }).optional().describe('Comprehensive pricing data')
}).passthrough().describe('Pricing analysis data');

export const AssetStrategySchema = z.object({
  theme: z.string().optional().describe('Campaign theme'),
  visual_style: z.enum(['modern', 'classic', 'minimalist', 'vibrant', 'elegant']).optional().describe('Visual style'),
  color_palette: z.string().optional().describe('Color scheme description'),
  typography: z.string().optional().describe('Typography guidelines'),
  image_concepts: z.array(z.string()).optional().describe('Image concept descriptions'),
  layout_hierarchy: z.string().optional().describe('Layout hierarchy guidelines'),
  emotional_triggers: z.enum(['excitement', 'trust', 'urgency', 'relaxation', 'adventure']).optional().describe('Target emotion'),
  brand_consistency: z.string().optional().describe('Brand consistency requirements'),
  // Support actual generated structure
  visual_direction: z.object({
    primary_style: z.string().optional(),
    color_scheme: z.string().optional()
  }).optional().describe('Visual direction'),
  content_strategy: z.object({
    tone: z.string().optional(),
    key_messages: z.array(z.string()).optional(),
    emotional_triggers: z.array(z.string()).optional(),
    call_to_action: z.object({
      primary: z.string().optional()
    }).optional()
  }).optional().describe('Content strategy'),
  asset_types: z.array(z.object({
    type: z.string().optional(),
    description: z.string().optional()
  })).optional().describe('Asset types')
}).passthrough().describe('Asset strategy data');

export const GeneratedContentSchema = z.object({
  subject: z.string().optional().describe('Email subject line'),
  preheader: z.string().optional().describe('Email preheader text'),
  body: z.union([z.string(), z.object({}).passthrough()]).optional().describe('Main email body content - can be string or object'),
  cta: z.object({
    primary: z.string().optional().describe('Primary call-to-action text'),
    secondary: z.string().optional().describe('Secondary call-to-action text')
  }).optional().describe('Call-to-action elements'),
  personalization_level: z.enum(['basic', 'advanced', 'premium']).optional().describe('Personalization level'),
  urgency_level: z.enum(['low', 'medium', 'high']).optional().describe('Urgency level'),
  // Support actual generated structure
  content: z.object({}).passthrough().optional().describe('Generated content object'),
  metadata: z.object({}).passthrough().optional().describe('Content metadata')
}).passthrough().describe('Generated content data');

export const ContentContextSchema = z.object({
  campaign: CampaignMetadataSchema.optional().describe('Campaign metadata'),
  data_collection_context: DataCollectionContextSchema.optional().describe('Raw data collection results'),
  context_analysis: ContextAnalysisSchema.optional().describe('Destination and market context'),
  date_analysis: DateAnalysisSchema.optional().describe('Date optimization analysis'),
  pricing_analysis: PricingAnalysisSchema.optional().describe('Pricing intelligence data'),
  asset_strategy: AssetStrategySchema.optional().describe('Visual asset strategy'),
  generated_content: GeneratedContentSchema.optional().describe('Generated email content'),
  technical_requirements: z.object({
    max_width: z.string().default('600px').describe('Maximum email width'),
    email_clients: z.array(z.string()).default(['gmail', 'outlook', 'apple_mail']).describe('Target email clients'),
    dark_mode_support: z.boolean().default(true).describe('Dark mode compatibility requirement'),
    accessibility_level: z.enum(['AA', 'AAA']).default('AA').describe('WCAG accessibility level')
  }).optional().describe('Technical constraints and requirements')
});

// ============================================================================
// DESIGN SPECIALIST SCHEMAS
// ============================================================================

export const AssetManifestSchema = z.object({
  images: z.array(z.object({
    id: z.string().describe('Asset identifier'),
    path: z.string().describe('File system path to asset'),
    url: z.string().nullable().describe('URL if hosted'),
    alt_text: z.string().describe('Alternative text description'),
    usage: z.string().describe('Usage context (hero, thumbnail, icon)'),
    dimensions: z.object({
      width: z.number().describe('Image width in pixels'),
      height: z.number().describe('Image height in pixels')
    }).describe('Image dimensions'),
    file_size: z.number().describe('File size in bytes'),
    format: z.enum(['jpg', 'png', 'svg', 'webp']).describe('Image format'),
    optimized: z.boolean().describe('Whether image is optimized for email')
  })).describe('Image assets'),
  icons: z.array(z.object({
    id: z.string().describe('Icon identifier'),
    path: z.string().describe('File system path to icon'),
    usage: z.string().describe('Icon usage context'),
    format: z.enum(['svg', 'png']).describe('Icon format'),
    size: z.string().describe('Icon size (e.g., 24x24)')
  })).describe('Icon assets'),
  fonts: z.array(z.object({
    family: z.string().describe('Font family name'),
    weights: z.array(z.string()).describe('Available font weights'),
    fallbacks: z.array(z.string()).describe('Fallback fonts')
  })).describe('Typography assets')
});

export const MJMLTemplateSchema = z.object({
  source: z.string().describe('Raw MJML template code'),
  compiled_html: z.string().describe('Compiled HTML output'),
  inline_css: z.string().describe('Inlined CSS for email clients'),
  file_size: z.number().describe('Template file size in bytes'),
  validation_status: z.enum(['valid', 'warnings', 'errors']).describe('MJML validation status'),
  validation_messages: z.array(z.string()).describe('Validation messages'),
  responsive_breakpoints: z.array(z.object({
    width: z.string().describe('Breakpoint width'),
    modifications: z.string().describe('Responsive modifications')
  })).describe('Responsive design breakpoints')
});

export const DesignDecisionsSchema = z.object({
  layout_strategy: z.string().describe('Layout approach and rationale'),
  color_scheme_applied: z.object({
    primary: z.string().describe('Primary color hex'),
    secondary: z.string().describe('Secondary color hex'),
    accent: z.string().describe('Accent color hex'),
    background: z.string().describe('Background color hex'),
    text: z.string().describe('Text color hex')
  }).describe('Applied color scheme'),
  typography_implementation: z.object({
    heading_font: z.string().describe('Heading font family'),
    body_font: z.string().describe('Body text font family'),
    font_sizes: z.record(z.string()).describe('Font size mappings')
  }).describe('Typography implementation'),
  asset_optimization: z.array(z.object({
    original_path: z.string().describe('Original asset path'),
    optimized_path: z.string().describe('Optimized asset path'),
    optimization_type: z.string().describe('Type of optimization applied'),
    size_reduction: z.number().describe('Size reduction percentage')
  })).describe('Asset optimization details'),
  accessibility_features: z.array(z.string()).describe('Implemented accessibility features'),
  email_client_adaptations: z.record(z.string()).describe('Client-specific adaptations')
});

export const DesignContextSchema = z.object({
  content_context: ContentContextSchema.optional().describe('Content specialist outputs'),
  data_collection_context: DataCollectionContextSchema.optional().describe('Raw data collection results'),
  asset_manifest: AssetManifestSchema.optional().describe('Prepared assets for design'),
  mjml_template: MJMLTemplateSchema.partial().describe('Generated MJML template'),
  design_decisions: DesignDecisionsSchema.partial().describe('Design implementation decisions'),
  preview_files: z.array(z.object({
    type: z.enum(['desktop', 'mobile', 'dark_mode']).describe('Preview type'),
    path: z.string().describe('Preview image path'),
    format: z.enum(['png', 'jpg']).describe('Image format')
  })).optional().describe('Preview images generated'),
  performance_metrics: z.object({
    html_size: z.number().optional().describe('HTML file size in bytes'),
    total_assets_size: z.number().optional().describe('Total assets size in bytes'),
    estimated_load_time: z.number().optional().describe('Estimated load time in milliseconds'),
    optimization_score: z.number().min(0).max(100).optional().describe('Optimization score out of 100')
  }).partial().describe('Performance metrics')
});

// ============================================================================
// QUALITY SPECIALIST SCHEMAS
// ============================================================================

export const ValidationResultSchema = z.object({
  validator: z.string().describe('Validator name'),
  status: z.enum(['pass', 'warning', 'fail']).describe('Validation status'),
  score: z.number().min(0).max(100).describe('Validation score'),
  issues: z.array(z.object({
    severity: z.enum(['error', 'warning', 'info']).describe('Issue severity'),
    message: z.string().describe('Issue description'),
    location: z.string().nullable().describe('Location of issue'),
    suggestion: z.string().nullable().describe('Suggested fix')
  })).describe('Validation issues found'),
  metrics: z.object({}).nullable().describe('Additional metrics')
});

export const EmailClientTestSchema = z.object({
  client: z.string().describe('Email client name'),
  version: z.string().describe('Client version'),
  platform: z.enum(['desktop', 'mobile', 'web']).describe('Platform type'),
  test_status: z.enum(['pass', 'fail', 'partial']).describe('Test result'),
  screenshot_path: z.string().nullable().describe('Screenshot file path'),
  issues: z.array(z.string()).describe('Client-specific issues'),
  compatibility_score: z.number().min(0).max(100).describe('Compatibility score'),
  rendering_time: z.number().describe('Rendering time in milliseconds')
});

export const AccessibilityTestSchema = z.object({
  wcag_level: z.enum(['A', 'AA', 'AAA']).describe('WCAG compliance level tested'),
  overall_score: z.number().min(0).max(100).describe('Overall accessibility score'),
  color_contrast: z.object({
    pass: z.boolean().describe('Color contrast test pass'),
    ratio: z.number().describe('Contrast ratio'),
    minimum_required: z.number().describe('Minimum required ratio')
  }).describe('Color contrast analysis'),
  alt_text_coverage: z.object({
    total_images: z.number().describe('Total images found'),
    images_with_alt: z.number().describe('Images with alt text'),
    coverage_percentage: z.number().describe('Alt text coverage percentage')
  }).describe('Alt text coverage analysis'),
  keyboard_navigation: z.boolean().describe('Keyboard navigation support'),
  screen_reader_compatibility: z.boolean().describe('Screen reader compatibility'),
  issues: z.array(z.object({
    rule: z.string().describe('WCAG rule'),
    description: z.string().describe('Issue description'),
    impact: z.enum(['minor', 'moderate', 'serious', 'critical']).describe('Impact level'),
    fix_suggestion: z.string().describe('How to fix the issue')
  })).describe('Accessibility issues')
});

export const QualityReportSchema = z.object({
  overall_score: z.number().min(0).max(100).describe('Overall quality score'),
  html_validation: ValidationResultSchema.describe('HTML validation results'),
  css_validation: ValidationResultSchema.describe('CSS validation results'),
  mjml_validation: ValidationResultSchema.describe('MJML validation results'),
  email_client_tests: z.array(EmailClientTestSchema).describe('Email client compatibility tests'),
  accessibility_test: AccessibilityTestSchema.describe('Accessibility compliance test'),
  performance_analysis: z.object({
    load_time: z.number().describe('Page load time in milliseconds'),
    size_analysis: z.object({
      html_size: z.number().describe('HTML size in bytes'),
      css_size: z.number().describe('CSS size in bytes'),
      images_size: z.number().describe('Images total size in bytes'),
      total_size: z.number().describe('Total email size in bytes')
    }).describe('Size analysis'),
    optimization_suggestions: z.array(z.string()).describe('Performance optimization suggestions')
  }).describe('Performance analysis'),
  deliverability_score: z.number().min(0).max(100).describe('Email deliverability score'),
  spam_analysis: z.object({
    spam_score: z.number().describe('Spam filter score'),
    flagged_content: z.array(z.string()).describe('Content flagged by spam filters'),
    suggestions: z.array(z.string()).describe('Suggestions to improve deliverability')
  }).describe('Spam filter analysis'),
  approval_status: z.enum(['approved', 'needs_revision', 'rejected']).describe('Quality approval status'),
  recommendations: z.array(z.string()).describe('Quality improvement recommendations')
});

export const QualityContextSchema = z.object({
  design_context: DesignContextSchema.describe('Design specialist outputs'),
  data_collection_context: DataCollectionContextSchema.optional().describe('Raw data collection results'),
  quality_report: QualityReportSchema.describe('Comprehensive quality analysis'),
  test_artifacts: z.object({
    screenshots: z.array(z.object({
      client: z.string().describe('Email client name'),
      path: z.string().describe('Screenshot file path'),
      timestamp: z.string().describe('Screenshot timestamp')
    })).describe('Generated screenshots'),
    validation_logs: z.array(z.object({
      validator: z.string().describe('Validator name'),
      log_path: z.string().describe('Log file path'),
      timestamp: z.string().describe('Validation timestamp')
    })).describe('Validation log files'),
    performance_reports: z.array(z.object({
      metric: z.string().describe('Performance metric name'),
      report_path: z.string().describe('Report file path'),
      timestamp: z.string().describe('Report timestamp')
    })).describe('Performance analysis reports')
  }).describe('Quality testing artifacts'),
  compliance_status: z.object({
    html_standards: z.boolean().describe('HTML standards compliance'),
    email_standards: z.boolean().describe('Email-specific standards compliance'),
    accessibility_standards: z.boolean().describe('Accessibility standards compliance'),
    brand_guidelines: z.boolean().describe('Brand guidelines compliance'),
    legal_compliance: z.boolean().describe('Legal requirements compliance')
  }).describe('Various compliance statuses')
});

// ============================================================================
// DELIVERY SPECIALIST SCHEMAS
// ============================================================================

export const DeliveryManifestSchema = z.object({
  campaign_id: z.string().describe('Campaign identifier'),
  package_version: z.string().describe('Package version'),
  created_at: z.string().describe('Package creation timestamp'),
  total_files: z.number().describe('Total number of files in package'),
  total_size: z.number().describe('Total package size in bytes'),
  files: z.array(z.object({
    name: z.string().describe('File name'),
    path: z.string().describe('Relative path in package'),
    size: z.number().describe('File size in bytes'),
    type: z.enum(['template', 'asset', 'documentation', 'report']).describe('File type'),
    description: z.string().describe('File description')
  })).describe('Package file manifest'),
  checksums: z.object({}).describe('File checksums for integrity verification')
});

export const ExportFormatSchema = z.object({
  format: z.enum(['zip', 'tar', 'folder']).describe('Export format'),
  compression: z.enum(['none', 'standard', 'maximum']).describe('Compression level'),
  encryption: z.boolean().describe('Whether package is encrypted'),
  password_protected: z.boolean().describe('Whether package is password protected'),
  export_path: z.string().describe('Full path to exported package'),
  download_url: z.string().nullable().describe('Download URL if available'),
  expiry_date: z.string().nullable().describe('Package expiry date')
});

export const DeliveryReportSchema = z.object({
  campaign_summary: z.object({
    campaign_id: z.string().describe('Campaign identifier'),
    campaign_name: z.string().describe('Campaign name'),
    brand: z.string().describe('Brand name'),
    completion_date: z.string().describe('Completion timestamp'),
    total_processing_time: z.number().describe('Total processing time in milliseconds')
  }).describe('Campaign summary information'),
  content_summary: z.object({
    subject_line: z.string().describe('Final subject line'),
    content_type: z.string().describe('Content type'),
    target_audience: z.string().describe('Target audience'),
    emotional_appeal: z.string().describe('Primary emotional appeal'),
    key_messaging: z.array(z.string()).describe('Key messaging points')
  }).describe('Content summary'),
  design_summary: z.object({
    template_type: z.string().describe('Template layout type'),
    color_scheme: z.string().describe('Applied color scheme'),
    asset_count: z.number().describe('Number of assets used'),
    responsive_support: z.boolean().describe('Responsive design implementation'),
    dark_mode_support: z.boolean().describe('Dark mode compatibility')
  }).describe('Design implementation summary'),
  quality_summary: z.object({
    overall_score: z.number().describe('Overall quality score'),
    email_client_compatibility: z.number().describe('Email client compatibility percentage'),
    accessibility_score: z.number().describe('Accessibility compliance score'),
    performance_score: z.number().describe('Performance optimization score'),
    deliverability_score: z.number().describe('Email deliverability score')
  }).describe('Quality assurance summary'),
  deliverables: z.object({
    mjml_template: z.string().describe('Path to MJML template file'),
    html_email: z.string().describe('Path to compiled HTML email'),
    assets_folder: z.string().describe('Path to assets folder'),
    documentation: z.string().describe('Path to documentation'),
    quality_reports: z.string().describe('Path to quality reports'),
    package_file: z.string().describe('Path to complete package file')
  }).describe('Final deliverable file paths'),
  deployment_ready: z.boolean().describe('Whether package is ready for deployment'),
  next_steps: z.array(z.string()).describe('Recommended next steps'),
  support_information: z.object({
    documentation_url: z.string().nullable().describe('Documentation URL'),
    support_contact: z.string().nullable().describe('Support contact information'),
    maintenance_notes: z.array(z.string()).describe('Maintenance and update notes')
  }).describe('Support and maintenance information')
});

export const DeliveryContextSchema = z.object({
  quality_context: QualityContextSchema.describe('Quality specialist outputs'),
  data_collection_context: DataCollectionContextSchema.optional().describe('Raw data collection results'),
  delivery_manifest: DeliveryManifestSchema.describe('Package manifest'),
  export_format: ExportFormatSchema.describe('Export configuration'),
  delivery_report: DeliveryReportSchema.describe('Final delivery report'),
  deployment_artifacts: z.object({
    production_ready_files: z.array(z.string()).describe('Production-ready file paths'),
    testing_files: z.array(z.string()).describe('Testing and validation file paths'),
    documentation_files: z.array(z.string()).describe('Documentation file paths'),
    source_files: z.array(z.string()).describe('Source file paths for future editing')
  }).describe('Deployment artifact organization'),
  delivery_status: z.enum(['packaging', 'ready', 'delivered', 'error']).describe('Delivery status'),
  delivery_timestamp: z.string().describe('Final delivery timestamp')
});

// ============================================================================
// MAIN HANDOFF DATA INTERFACE
// ============================================================================

export const BaseHandoffDataSchema = z.object({
  request: z.string().describe('Original user request'),
  metadata: HandoffMetadataSchema.describe('Handoff tracking metadata')
});

export const ContentToDesignHandoffSchema = BaseHandoffDataSchema.extend({
  content_context: ContentContextSchema.describe('Complete content specialist outputs'),
  data_collection_context: DataCollectionContextSchema.optional().describe('Raw data collection results'),
  original_content: z.object({
    user_request: z.string().describe('Original user request'),
    campaign_brief: z.string().optional().describe('Campaign brief'),
    content_requirements: z.object({}).optional().describe('Original content requirements'),
    data_collection_inputs: z.object({}).optional().describe('Original data collection inputs')
  }).describe('Original content for preservation validation')
});

export const DesignToQualityHandoffSchema = BaseHandoffDataSchema.extend({
  content_context: ContentContextSchema.optional().describe('Content specialist outputs'),
  design_context: DesignContextSchema.optional().describe('Complete design specialist outputs'),
  data_collection_context: DataCollectionContextSchema.optional().describe('Raw data collection results')
});

export const QualityToDeliveryHandoffSchema = BaseHandoffDataSchema.extend({
  content_context: ContentContextSchema.describe('Content specialist outputs'),
  design_context: DesignContextSchema.describe('Design specialist outputs'),
  quality_context: QualityContextSchema.describe('Complete quality specialist outputs'),
  data_collection_context: DataCollectionContextSchema.optional().describe('Raw data collection results')
});

export const CompleteWorkflowContextSchema = BaseHandoffDataSchema.extend({
  content_context: ContentContextSchema.describe('Content specialist outputs'),
  design_context: DesignContextSchema.describe('Design specialist outputs'),
  quality_context: QualityContextSchema.describe('Quality specialist outputs'),
  delivery_context: DeliveryContextSchema.describe('Complete delivery specialist outputs'),
  data_collection_context: DataCollectionContextSchema.optional().describe('Raw data collection results')
});

// ============================================================================
// TYPESCRIPT INTERFACES (INFERRED FROM SCHEMAS)
// ============================================================================

export type HandoffMetadata = z.infer<typeof HandoffMetadataSchema>;
export type CampaignMetadata = z.infer<typeof CampaignMetadataSchema>;
export type DataCollectionContext = z.infer<typeof DataCollectionContextSchema>;
export type ContentContext = z.infer<typeof ContentContextSchema>;
export type DesignContext = z.infer<typeof DesignContextSchema>;
export type QualityContext = z.infer<typeof QualityContextSchema>;
export type DeliveryContext = z.infer<typeof DeliveryContextSchema>;

export type ContentToDesignHandoff = z.infer<typeof ContentToDesignHandoffSchema>;
export type DesignToQualityHandoff = z.infer<typeof DesignToQualityHandoffSchema>;
export type QualityToDeliveryHandoff = z.infer<typeof QualityToDeliveryHandoffSchema>;
export type CompleteWorkflowContext = z.infer<typeof CompleteWorkflowContextSchema>;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Creates a new handoff metadata object with unique ID and timestamp
 */
export function createHandoffMetadata(
  fromAgent: HandoffMetadata['fromAgent'],
  toAgent: HandoffMetadata['toAgent'],
  traceId?: string
): HandoffMetadata {
  return {
    handoffId: `handoff_${Date.now()}_${Math.random().toString(36).substring(2)}`,
    timestamp: new Date().toISOString(),
    fromAgent,
    toAgent,
    dataVersion: '1.0',
    traceId: traceId || null,
    executionTime: null
  };
}

/**
 * Validates handoff data against the appropriate schema
 */
export function validateHandoffData<T extends z.ZodSchema>(
  data: unknown,
  schema: T
): { success: true; data: z.infer<T> } | { success: false; errors: string[] } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Unknown validation error']
    };
  }
}

/**
 * Creates a serialized version of handoff data for storage or transmission
 */
export function serializeHandoffData(data: any): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Deserializes handoff data from JSON string
 */
export function deserializeHandoffData<T>(jsonString: string): T {
  return JSON.parse(jsonString) as T;
}

/**
 * Calculates the size of handoff data in bytes (for monitoring)
 */
export function getHandoffDataSize(data: any): number {
  return new TextEncoder().encode(JSON.stringify(data)).length;
}