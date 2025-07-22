/**
 * 🔍 HANDOFF VALIDATOR UTILITY
 * 
 * Comprehensive validation system for ensuring data completeness and dependencies
 * before handoffs between specialists. Built on existing Zod schemas.
 */

import { promises as fs } from 'fs';
import { 
  ContentToDesignHandoffSchema,
  DesignToQualityHandoffSchema,
  QualityToDeliveryHandoffSchema,
  validateHandoffData,
  type ContentToDesignHandoff,
  type DesignToQualityHandoff,
  type QualityToDeliveryHandoff
} from './handoff-schemas';
import { CampaignPathResolver } from './campaign-path-resolver';
import { debuggers } from './debug-output';

const debug = debuggers.core;

export class HandoffValidationError extends Error {
  constructor(
    message: string,
    public readonly validationType: 'schema' | 'dependency' | 'file' | 'consistency',
    public readonly details?: any
  ) {
    super(message);
    this.name = 'HandoffValidationError';
  }
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingDependencies: string[];
  schemaErrors: string[];
  consistencyIssues: string[];
}

export class HandoffValidator {
  /**
   * Validates Content to Design handoff with full dependency checking
   */
  static async validateContentToDesignHandoff(
    handoffData: unknown,
    campaignPath?: string
  ): Promise<ValidationResult> {
    debug.info('HandoffValidator', 'Validating Content to Design handoff', {
      campaignPath,
      dataKeys: typeof handoffData === 'object' ? Object.keys(handoffData || {}) : undefined
    });

    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      missingDependencies: [],
      schemaErrors: [],
      consistencyIssues: []
    };

    // 1. Schema validation
    const schemaValidation = validateHandoffData(handoffData, ContentToDesignHandoffSchema);
    if (schemaValidation.success === false) {
      result.schemaErrors = schemaValidation.errors;
      result.isValid = false;
      debug.error('HandoffValidator', 'Schema validation failed', { errors: schemaValidation.errors });
    }

    if (schemaValidation.success === true) {
      const data = schemaValidation.data as ContentToDesignHandoff;
      
      // 2. Campaign path validation
      if (campaignPath) {
        try {
          await CampaignPathResolver.validatePath(campaignPath);
        } catch (error) {
          result.errors.push(`Campaign path validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          result.isValid = false;
        }
      }

      // 3. Required data dependencies check
      const dependencies = await this.checkContentDependencies(data, campaignPath);
      result.missingDependencies = dependencies.missing;
      result.warnings.push(...dependencies.warnings);
      
      if (dependencies.missing.length > 0) {
        result.isValid = false;
      }

      // 4. Data consistency validation
      const consistency = this.validateContentConsistency(data);
      result.consistencyIssues = consistency.issues;
      result.warnings.push(...consistency.warnings);
      
      if (consistency.critical.length > 0) {
        result.errors.push(...consistency.critical);
        result.isValid = false;
      }

      // 5. Content quality validation
      const quality = this.validateContentQuality(data);
      result.warnings.push(...quality.warnings);
      
      if (quality.critical.length > 0) {
        result.errors.push(...quality.critical);
        result.isValid = false;
      }
    }

    debug.info('HandoffValidator', 'Content to Design validation completed', {
      isValid: result.isValid,
      errorCount: result.errors.length,
      warningCount: result.warnings.length,
      missingDependencies: result.missingDependencies.length
    });

    return result;
  }

  /**
   * Validates Design to Quality handoff with comprehensive checks
   */
  static async validateDesignToQualityHandoff(
    handoffData: unknown,
    campaignPath?: string
  ): Promise<ValidationResult> {
    debug.info('HandoffValidator', 'Validating Design to Quality handoff', {
      campaignPath
    });

    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      missingDependencies: [],
      schemaErrors: [],
      consistencyIssues: []
    };

    // 1. Schema validation
    const schemaValidation = validateHandoffData(handoffData, DesignToQualityHandoffSchema);
    if (schemaValidation.success === false) {
      result.schemaErrors = schemaValidation.errors;
      result.isValid = false;
      debug.error('HandoffValidator', 'Design handoff schema validation failed', { errors: schemaValidation.errors });
    }

    if (schemaValidation.success === true) {
      const data = schemaValidation.data as DesignToQualityHandoff;
      
      // 2. Design output completeness
      const designCheck = await this.checkDesignCompleteness(data, campaignPath);
      result.missingDependencies.push(...designCheck.missing);
      result.warnings.push(...designCheck.warnings);
      
      if (designCheck.critical.length > 0) {
        result.errors.push(...designCheck.critical);
        result.isValid = false;
      }

      // 3. Template validation
      const templateCheck = this.validateMJMLTemplate(data.design_context);
      result.warnings.push(...templateCheck.warnings);
      
      if (templateCheck.errors.length > 0) {
        result.errors.push(...templateCheck.errors);
        result.isValid = false;
      }

      // 4. Asset validation
      const assetCheck = await this.validateAssetManifest(data.design_context, campaignPath);
      result.warnings.push(...assetCheck.warnings);
      
      if (assetCheck.errors.length > 0) {
        result.errors.push(...assetCheck.errors);
        result.isValid = false;
      }
    }

    return result;
  }

  /**
   * Validates Quality to Delivery handoff
   */
  static async validateQualityToDeliveryHandoff(
    handoffData: unknown,
    campaignPath?: string
  ): Promise<ValidationResult> {
    debug.info('HandoffValidator', 'Validating Quality to Delivery handoff', {
      campaignPath
    });

    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      missingDependencies: [],
      schemaErrors: [],
      consistencyIssues: []
    };

    // 1. Schema validation
    const schemaValidation = validateHandoffData(handoffData, QualityToDeliveryHandoffSchema);
    if (schemaValidation.success === false) {
      result.schemaErrors = schemaValidation.errors;
      result.isValid = false;
    }

    if (schemaValidation.success) {
      const data = schemaValidation.data as QualityToDeliveryHandoff;
      
      // 2. Quality assurance completeness
      const qualityCheck = this.validateQualityResults(data.quality_context);
      result.warnings.push(...qualityCheck.warnings);
      
      if (qualityCheck.critical.length > 0) {
        result.errors.push(...qualityCheck.critical);
        result.isValid = false;
      }

      // 3. Delivery readiness check
      const deliveryCheck = this.validateDeliveryReadiness(data);
      result.warnings.push(...deliveryCheck.warnings);
      
      if (deliveryCheck.errors.length > 0) {
        result.errors.push(...deliveryCheck.errors);
        result.isValid = false;
      }
    }

    return result;
  }

  /**
   * Checks required data dependencies for Content specialist output
   */
  private static async checkContentDependencies(
    data: ContentToDesignHandoff,
    campaignPath?: string
  ): Promise<{ missing: string[], warnings: string[] }> {
    const missing: string[] = [];
    const warnings: string[] = [];

    // Check campaign data files exist
    if (campaignPath) {
      const standardPaths = CampaignPathResolver.getStandardPaths(campaignPath);
      
      const requiredDataFiles = [
        { path: standardPaths.data.destination, name: 'destination-analysis.json' },
        { path: standardPaths.data.market, name: 'market-intelligence.json' },
        { path: standardPaths.data.emotional, name: 'emotional-profile.json' }
      ];

      for (const file of requiredDataFiles) {
        try {
          await fs.access(file.path);
        } catch {
          missing.push(`Required data file missing: ${file.name}`);
        }
      }
    }

    // Check content completeness
    if (!data.content_context.generated_content?.subject) {
      missing.push('Email subject line is required');
    }
    
    if (!data.content_context.generated_content?.body) {
      missing.push('Email body content is required');
    }
    
    if (!data.content_context.pricing_analysis?.best_price || data.content_context.pricing_analysis.best_price <= 0) {
      missing.push('Valid pricing information is required');
    }

    if (!data.content_context.asset_strategy?.visual_style) {
      missing.push('Visual style specification is required');
    }

    // Check data collection context
    if (!data.data_collection_context || !data.data_collection_context.collection_metadata) {
      missing.push('Data collection context is required');
    } else if (data.data_collection_context.collection_metadata.collection_status !== 'complete') {
      warnings.push(`Data collection status is "${data.data_collection_context.collection_metadata.collection_status}", not complete`);
    }

    return { missing, warnings };
  }

  /**
   * Validates content data consistency
   */
  private static validateContentConsistency(data: ContentToDesignHandoff): {
    issues: string[];
    warnings: string[];
    critical: string[];
  } {
    const issues: string[] = [];
    const warnings: string[] = [];
    const critical: string[] = [];

    // Check destination consistency
    const contentDestination = data.content_context.context_analysis?.destination;
    const dateDestination = data.content_context.date_analysis?.destination;
    
    if (contentDestination && dateDestination && contentDestination !== dateDestination) {
      issues.push(`Destination mismatch: context (${contentDestination}) vs date analysis (${dateDestination})`);
    }

    // Check currency consistency
    const pricingCurrency = data.content_context.pricing_analysis?.currency;
    if (pricingCurrency && !['RUB', 'USD', 'EUR'].includes(pricingCurrency)) {
      warnings.push(`Unusual currency code: ${pricingCurrency}`);
    }

    // Check price range validity
    if (data.content_context.pricing_analysis) {
      const { min_price, max_price, best_price } = data.content_context.pricing_analysis;
      if ((min_price || 0) > (max_price || 0)) {
        critical.push(`Invalid price range: min (${min_price || 0}) > max (${max_price || 0})`);
      }
      if ((best_price || 0) < (min_price || 0) || (best_price || 0) > (max_price || 0)) {
        warnings.push(`Best price (${best_price || 0}) outside of range (${min_price || 0}-${max_price || 0})`);
      }
    }

    return { issues, warnings, critical };
  }

  /**
   * Validates content quality metrics
   */
  private static validateContentQuality(data: ContentToDesignHandoff): {
    warnings: string[];
    critical: string[];
  } {
    const warnings: string[] = [];
    const critical: string[] = [];

    const content = data.content_context.generated_content;

    if (content) {
      // Subject line validation
      if (content.subject && content.subject.length < 10) {
        warnings.push('Subject line is very short (< 10 characters)');
      }
      if (content.subject && content.subject.length > 50) {
        warnings.push('Subject line is very long (> 50 characters)');
      }

      // Body content validation
      if (content.body && typeof content.body === 'string' && content.body.length < 100) {
        warnings.push('Email body is very short (< 100 characters)');
      }

      // CTA validation
      if (!content.cta?.primary) {
        critical.push('Primary CTA is required');
      }
    }

    return { warnings, critical };
  }

  /**
   * Checks Design specialist output completeness
   */
  private static async checkDesignCompleteness(
    data: DesignToQualityHandoff,
    _campaignPath?: string
  ): Promise<{ missing: string[], warnings: string[], critical: string[] }> {
    const missing: string[] = [];
    const warnings: string[] = [];
    const critical: string[] = [];

    // Check MJML template
    if (!data.design_context?.mjml_template?.source) {
      critical.push('MJML template source is required');
    }
    if (!data.design_context?.mjml_template?.compiled_html) {
      critical.push('Compiled HTML is required');
    }

    // Check asset manifest
    if (!data.design_context?.asset_manifest?.images?.length) {
      missing.push('At least one image asset is required');
    }

    // Check performance metrics
    if (data.design_context?.performance_metrics?.total_assets_size && data.design_context.performance_metrics.total_assets_size > 100000) { // 100KB
      warnings.push('Template file size exceeds recommended 100KB limit');
    }

    return { missing, warnings, critical };
  }

  /**
   * Validates MJML template structure and compilation
   */
  private static validateMJMLTemplate(designContext: any): {
    warnings: string[];
    errors: string[];
  } {
    const warnings: string[] = [];
    const errors: string[] = [];

    const template = designContext.mjml_template;

    if (template.validation_status === 'errors') {
      errors.push(`MJML validation errors: ${template.validation_messages.join(', ')}`);
    } else if (template.validation_status === 'warnings') {
      warnings.push(`MJML validation warnings: ${template.validation_messages.join(', ')}`);
    }

    // Check file size
    if (template.file_size > 100000) {
      warnings.push('Template exceeds 100KB size limit for email clients');
    }

    return { warnings, errors };
  }

  /**
   * Validates asset manifest and file existence
   */
  private static async validateAssetManifest(
    designContext: any,
    campaignPath?: string
  ): Promise<{ warnings: string[], errors: string[] }> {
    const warnings: string[] = [];
    const errors: string[] = [];

    const manifest = designContext.asset_manifest;

    // Check image assets
    for (const image of manifest.images) {
      if (image.file_size > 500000) { // 500KB
        warnings.push(`Image ${image.id} is large (${Math.round(image.file_size / 1024)}KB)`);
      }
      
      if (!image.alt_text) {
        errors.push(`Image ${image.id} missing alt text for accessibility`);
      }

      // Check file existence if we have campaign path
      if (campaignPath && !image.path.startsWith('http')) {
        try {
          await fs.access(image.path);
        } catch {
          errors.push(`Image file not found: ${image.path}`);
        }
      }
    }

    return { warnings, errors };
  }

  /**
   * Validates Quality specialist results
   */
  private static validateQualityResults(qualityContext: any): {
    warnings: string[];
    critical: string[];
  } {
    const warnings: string[] = [];
    const critical: string[] = [];

    if (!qualityContext.quality_report) {
      critical.push('Quality report is required');
      return { warnings, critical };
    }

    const report = qualityContext.quality_report;

    if (report.overall_score < 70) {
      critical.push(`Quality score too low: ${report.overall_score}% (minimum 70% required)`);
    } else if (report.overall_score < 85) {
      warnings.push(`Quality score below optimal: ${report.overall_score}% (target 85%+)`);
    }

    if (report.approval_status !== 'approved') {
      critical.push(`Quality approval status is "${report.approval_status}", must be "approved"`);
    }

    return { warnings, critical };
  }

  /**
   * Validates delivery readiness
   */
  private static validateDeliveryReadiness(data: QualityToDeliveryHandoff): {
    warnings: string[];
    errors: string[];
  } {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check all required contexts are present
    if (!data.content_context) {
      errors.push('Content context is required for delivery');
    }
    if (!data.design_context) {
      errors.push('Design context is required for delivery');
    }
    if (!data.quality_context) {
      errors.push('Quality context is required for delivery');
    }

    // Check final HTML is available
    if (!data.design_context?.mjml_template?.compiled_html) {
      errors.push('Final compiled HTML is required for delivery');
    }

    return { warnings, errors };
  }
}