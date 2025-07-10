/**
 * 🔄 TRANSFER TOOLS V2 - OpenAI Agents SDK Compatible
 * 
 * Complete redesign of transfer tools to solve critical data loss issues.
 * Uses comprehensive handoff schemas and context parameter patterns.
 * 
 * Replaces the broken transfer-tools.ts with proper context flow.
 */

import { tool } from '@openai/agents';
import { run } from '@openai/agents';
import {
  ContentToDesignHandoffSchema,
  DesignToQualityHandoffSchema,
  QualityToDeliveryHandoffSchema,
  CompleteWorkflowContextSchema,
  validateHandoffData,
  createHandoffMetadata,
  getHandoffDataSize,
  serializeHandoffData,
  type ContentToDesignHandoff,
  type DesignToQualityHandoff,
  type QualityToDeliveryHandoff,
  type CompleteWorkflowContext,
  type HandoffMetadata
} from './handoff-schemas';

import {
  contentSpecialistAgent,
  designSpecialistAgent,
  qualitySpecialistAgent,
  deliverySpecialistAgent
} from './tool-registry';

// ============================================================================
// CONFIGURATION
// ============================================================================

const HANDOFF_CONFIG = {
  MAX_CONTEXT_SIZE: 10 * 1024 * 1024, // 10MB max context size
  ENABLE_COMPRESSION: process.env.ENABLE_CONTEXT_COMPRESSION === 'true',
  ENABLE_VALIDATION: process.env.ENABLE_HANDOFF_VALIDATION !== 'false',
  ENABLE_MONITORING: process.env.ENABLE_HANDOFF_MONITORING !== 'false',
  TIMEOUT_MS: parseInt(process.env.HANDOFF_TIMEOUT_MS || '120000'), // 2 minutes
  RETRY_COUNT: parseInt(process.env.HANDOFF_RETRY_COUNT || '3')
};

// ============================================================================
// MONITORING AND LOGGING
// ============================================================================

interface HandoffMetrics {
  handoffId: string;
  fromAgent: string;
  toAgent: string;
  dataSize: number;
  processingTime: number;
  validationStatus: 'success' | 'warning' | 'error';
  errorCount: number;
  timestamp: string;
}

const handoffMetrics: HandoffMetrics[] = [];

function logHandoffMetrics(metrics: HandoffMetrics): void {
  if (HANDOFF_CONFIG.ENABLE_MONITORING) {
    handoffMetrics.push(metrics);
    console.log(`📊 Handoff Metrics: ${metrics.handoffId}`, {
      fromAgent: metrics.fromAgent,
      toAgent: metrics.toAgent,
      dataSize: `${(metrics.dataSize / 1024).toFixed(2)} KB`,
      processingTime: `${metrics.processingTime}ms`,
      status: metrics.validationStatus
    });
  }
}

function validateHandoffSize(data: any, handoffType: string): void {
  const dataSize = getHandoffDataSize(data);
  if (dataSize > HANDOFF_CONFIG.MAX_CONTEXT_SIZE) {
    console.warn(`⚠️ Large handoff detected: ${handoffType} = ${(dataSize / 1024 / 1024).toFixed(2)} MB`);
  }
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

class HandoffError extends Error {
  constructor(
    message: string,
    public readonly handoffType: string,
    public readonly fromAgent: string,
    public readonly toAgent: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'HandoffError';
  }
}

async function executeWithRetry<T>(
  operation: () => Promise<T>,
  handoffType: string,
  maxRetries: number = HANDOFF_CONFIG.RETRY_COUNT
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.warn(`⚠️ Handoff attempt ${attempt}/${maxRetries} failed: ${handoffType}`, error.message);
      
      if (attempt === maxRetries) {
        throw new HandoffError(
          `Handoff failed after ${maxRetries} attempts: ${lastError.message}`,
          handoffType,
          'unknown',
          'unknown',
          lastError
        );
      }
      
      // Exponential backoff
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// ============================================================================
// CONTENT SPECIALIST → DESIGN SPECIALIST HANDOFF
// ============================================================================

export const handoffToDesignSpecialist = tool({
  name: 'handoff_to_design_specialist',
  description: 'Transfer complete content analysis and specifications to Design Specialist with full context preservation',
  parameters: ContentToDesignHandoffSchema,
  execute: async (handoffData: ContentToDesignHandoff, context?: any) => {
    const startTime = Date.now();
    const metrics: Partial<HandoffMetrics> = {
      handoffId: handoffData.metadata.handoffId,
      fromAgent: 'content',
      toAgent: 'design',
      timestamp: new Date().toISOString(),
      errorCount: 0
    };

    try {
      console.log(`\n🔄 === CONTENT → DESIGN HANDOFF STARTED ===`);
      console.log(`📋 Handoff ID: ${handoffData.metadata.handoffId}`);
      console.log(`📊 Content Context: Campaign ${handoffData.content_context.campaign.id}`);
      console.log(`💰 Pricing: ${handoffData.content_context.pricing_analysis.best_price} ${handoffData.content_context.pricing_analysis.currency}`);
      console.log(`🎨 Visual Style: ${handoffData.content_context.asset_strategy.visual_style}`);

      // Validate handoff data
      if (HANDOFF_CONFIG.ENABLE_VALIDATION) {
        const validation = validateHandoffData(handoffData, ContentToDesignHandoffSchema);
        if (!validation.success) {
          const errors = 'errors' in validation ? validation.errors : ['Unknown validation error'];
          throw new HandoffError(
            `Content→Design handoff validation failed: ${errors.join(', ')}`,
            'content_to_design',
            'content',
            'design'
          );
        }
        console.log('✅ Handoff data validation passed');
      }

      // Check context size
      validateHandoffSize(handoffData, 'Content→Design');

      // Execute design specialist with full context
      const result = await executeWithRetry(async () => {
        return await run(designSpecialistAgent, handoffData.request, {
          context: handoffData
        });
      }, 'content_to_design');

      // Update metrics
      metrics.processingTime = Date.now() - startTime;
      metrics.dataSize = getHandoffDataSize(handoffData);
      metrics.validationStatus = 'success';

      console.log('✅ Content→Design handoff completed successfully');
      console.log(`⏱️ Processing time: ${metrics.processingTime}ms`);
      console.log(`📊 Data transferred: ${(metrics.dataSize! / 1024).toFixed(2)} KB`);

      return result.finalOutput ?? result;

    } catch (error) {
      metrics.processingTime = Date.now() - startTime;
      metrics.dataSize = getHandoffDataSize(handoffData);
      metrics.validationStatus = 'error';
      metrics.errorCount = 1;

      console.error('❌ Content→Design handoff failed:', error);
      throw error;
    } finally {
      logHandoffMetrics(metrics as HandoffMetrics);
    }
  }
});

// ============================================================================
// DESIGN SPECIALIST → QUALITY SPECIALIST HANDOFF
// ============================================================================

export const handoffToQualitySpecialist = tool({
  name: 'handoff_to_quality_specialist',
  description: 'Transfer complete design package and all previous context to Quality Specialist for validation',
  parameters: DesignToQualityHandoffSchema,
  execute: async (handoffData: DesignToQualityHandoff, context?: any) => {
    const startTime = Date.now();
    const metrics: Partial<HandoffMetrics> = {
      handoffId: handoffData.metadata.handoffId,
      fromAgent: 'design',
      toAgent: 'quality',
      timestamp: new Date().toISOString(),
      errorCount: 0
    };

    try {
      console.log(`\n🔄 === DESIGN → QUALITY HANDOFF STARTED ===`);
      console.log(`📋 Handoff ID: ${handoffData.metadata.handoffId}`);
      console.log(`🎨 Design Context: ${handoffData.design_context.mjml_template.validation_status}`);
      console.log(`📊 Performance Score: ${handoffData.design_context.performance_metrics.optimization_score}`);
      console.log(`📄 HTML Size: ${(handoffData.design_context.performance_metrics.html_size / 1024).toFixed(2)} KB`);

      // Validate handoff data
      if (HANDOFF_CONFIG.ENABLE_VALIDATION) {
        const validation = validateHandoffData(handoffData, DesignToQualityHandoffSchema);
        if (!validation.success) {
          const errors = 'errors' in validation ? validation.errors : ['Unknown validation error'];
          throw new HandoffError(
            `Design→Quality handoff validation failed: ${errors.join(', ')}`,
            'design_to_quality',
            'design',
            'quality'
          );
        }
        console.log('✅ Handoff data validation passed');
      }

      // Check context size
      validateHandoffSize(handoffData, 'Design→Quality');

      // Execute quality specialist with full context
      const result = await executeWithRetry(async () => {
        return await run(qualitySpecialistAgent, handoffData.request, {
          context: handoffData
        });
      }, 'design_to_quality');

      // Update metrics
      metrics.processingTime = Date.now() - startTime;
      metrics.dataSize = getHandoffDataSize(handoffData);
      metrics.validationStatus = 'success';

      console.log('✅ Design→Quality handoff completed successfully');
      console.log(`⏱️ Processing time: ${metrics.processingTime}ms`);
      console.log(`📊 Data transferred: ${(metrics.dataSize! / 1024).toFixed(2)} KB`);

      return result.finalOutput ?? result;

    } catch (error) {
      metrics.processingTime = Date.now() - startTime;
      metrics.dataSize = getHandoffDataSize(handoffData);
      metrics.validationStatus = 'error';
      metrics.errorCount = 1;

      console.error('❌ Design→Quality handoff failed:', error);
      throw error;
    } finally {
      logHandoffMetrics(metrics as HandoffMetrics);
    }
  }
});

// ============================================================================
// QUALITY SPECIALIST → DELIVERY SPECIALIST HANDOFF
// ============================================================================

export const handoffToDeliverySpecialist = tool({
  name: 'handoff_to_delivery_specialist',
  description: 'Transfer complete quality report and all workflow context to Delivery Specialist for final packaging',
  parameters: QualityToDeliveryHandoffSchema,
  execute: async (handoffData: QualityToDeliveryHandoff, context?: any) => {
    const startTime = Date.now();
    const metrics: Partial<HandoffMetrics> = {
      handoffId: handoffData.metadata.handoffId,
      fromAgent: 'quality',
      toAgent: 'delivery',
      timestamp: new Date().toISOString(),
      errorCount: 0
    };

    try {
      console.log(`\n🔄 === QUALITY → DELIVERY HANDOFF STARTED ===`);
      console.log(`📋 Handoff ID: ${handoffData.metadata.handoffId}`);
      console.log(`✅ Quality Score: ${handoffData.quality_context.quality_report.overall_score}`);
      console.log(`📧 Client Tests: ${handoffData.quality_context.quality_report.email_client_tests.length}`);
      console.log(`🎯 Approval Status: ${handoffData.quality_context.quality_report.approval_status}`);

      // Validate handoff data
      if (HANDOFF_CONFIG.ENABLE_VALIDATION) {
        const validation = validateHandoffData(handoffData, QualityToDeliveryHandoffSchema);
        if (!validation.success) {
          const errors = 'errors' in validation ? validation.errors : ['Unknown validation error'];
          throw new HandoffError(
            `Quality→Delivery handoff validation failed: ${errors.join(', ')}`,
            'quality_to_delivery',
            'quality',
            'delivery'
          );
        }
        console.log('✅ Handoff data validation passed');
      }

      // Check context size
      validateHandoffSize(handoffData, 'Quality→Delivery');

      // Execute delivery specialist with full context
      const result = await executeWithRetry(async () => {
        return await run(deliverySpecialistAgent, handoffData.request, {
          context: handoffData
        });
      }, 'quality_to_delivery');

      // Update metrics
      metrics.processingTime = Date.now() - startTime;
      metrics.dataSize = getHandoffDataSize(handoffData);
      metrics.validationStatus = 'success';

      console.log('✅ Quality→Delivery handoff completed successfully');
      console.log(`⏱️ Processing time: ${metrics.processingTime}ms`);
      console.log(`📊 Data transferred: ${(metrics.dataSize! / 1024).toFixed(2)} KB`);

      return result.finalOutput ?? result;

    } catch (error) {
      metrics.processingTime = Date.now() - startTime;
      metrics.dataSize = getHandoffDataSize(handoffData);
      metrics.validationStatus = 'error';
      metrics.errorCount = 1;

      console.error('❌ Quality→Delivery handoff failed:', error);
      throw error;
    } finally {
      logHandoffMetrics(metrics as HandoffMetrics);
    }
  }
});

// ============================================================================
// CONTEXT BUILDER UTILITIES
// ============================================================================

/**
 * Builds content context from Content Specialist outputs
 */
export async function buildContentContext(
  campaignData: any,
  contextAnalysis: any,
  dateAnalysis: any,
  pricingAnalysis: any,
  assetStrategy: any,
  generatedContent: any,
  technicalRequirements?: any
): Promise<ContentToDesignHandoff> {
  const metadata = createHandoffMetadata('content', 'design');
  
  const contentContext = {
    campaign: campaignData,
    context_analysis: contextAnalysis,
    date_analysis: dateAnalysis,
    pricing_analysis: pricingAnalysis,
    asset_strategy: assetStrategy,
    generated_content: generatedContent,
    technical_requirements: technicalRequirements || {
      max_width: '600px',
      email_clients: ['gmail', 'outlook', 'apple_mail'],
      dark_mode_support: true,
      accessibility_level: 'AA' as const
    }
  };

  return {
    request: 'Process content specifications and create email design',
    metadata,
    content_context: contentContext
  };
}

/**
 * Builds design context from Design Specialist outputs
 */
export async function buildDesignContext(
  contentContext: any,
  assetManifest: any,
  mjmlTemplate: any,
  designDecisions: any,
  previewFiles: any,
  performanceMetrics: any
): Promise<DesignToQualityHandoff> {
  const metadata = createHandoffMetadata('design', 'quality');
  
  const designContext = {
    content_context: contentContext,
    asset_manifest: assetManifest,
    mjml_template: mjmlTemplate,
    design_decisions: designDecisions,
    preview_files: previewFiles,
    performance_metrics: performanceMetrics
  };

  return {
    request: 'Validate design quality and email compatibility',
    metadata,
    content_context: contentContext,
    design_context: designContext
  };
}

/**
 * Builds quality context from Quality Specialist outputs
 */
export async function buildQualityContext(
  designContext: any,
  qualityReport: any,
  testArtifacts: any,
  complianceStatus: any
): Promise<QualityToDeliveryHandoff> {
  const metadata = createHandoffMetadata('quality', 'delivery');
  
  const qualityContext = {
    design_context: designContext,
    quality_report: qualityReport,
    test_artifacts: testArtifacts,
    compliance_status: complianceStatus
  };

  return {
    request: 'Create final delivery package with all materials',
    metadata,
    content_context: designContext.content_context,
    design_context: designContext,
    quality_context: qualityContext
  };
}

// ============================================================================
// MONITORING AND ANALYTICS
// ============================================================================

/**
 * Get handoff metrics for monitoring
 */
export function getHandoffMetrics(): HandoffMetrics[] {
  return [...handoffMetrics];
}

/**
 * Get handoff statistics
 */
export function getHandoffStatistics(): {
  totalHandoffs: number;
  successRate: number;
  averageProcessingTime: number;
  averageDataSize: number;
  errorsByType: Record<string, number>;
} {
  const totalHandoffs = handoffMetrics.length;
  const successfulHandoffs = handoffMetrics.filter(m => m.validationStatus === 'success').length;
  const successRate = totalHandoffs > 0 ? (successfulHandoffs / totalHandoffs) * 100 : 0;
  
  const averageProcessingTime = totalHandoffs > 0 
    ? handoffMetrics.reduce((sum, m) => sum + m.processingTime, 0) / totalHandoffs 
    : 0;
    
  const averageDataSize = totalHandoffs > 0 
    ? handoffMetrics.reduce((sum, m) => sum + m.dataSize, 0) / totalHandoffs 
    : 0;
    
  const errorsByType = handoffMetrics
    .filter(m => m.validationStatus === 'error')
    .reduce((acc, m) => {
      const key = `${m.fromAgent}_to_${m.toAgent}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  return {
    totalHandoffs,
    successRate,
    averageProcessingTime,
    averageDataSize,
    errorsByType
  };
}

/**
 * Clear handoff metrics (for testing)
 */
export function clearHandoffMetrics(): void {
  handoffMetrics.length = 0;
}

// ============================================================================
// DEBUGGING AND TROUBLESHOOTING
// ============================================================================

/**
 * Debug handoff data structure
 */
export function debugHandoffData(handoffData: any, handoffType: string): void {
  console.log(`\n🔍 DEBUG: ${handoffType} Handoff Data Structure`);
  console.log(`📋 Handoff ID: ${handoffData.metadata?.handoffId}`);
  console.log(`📊 Data Size: ${(getHandoffDataSize(handoffData) / 1024).toFixed(2)} KB`);
  console.log(`🏗️ Structure:`, Object.keys(handoffData));
  
  if (handoffData.content_context) {
    console.log(`📝 Content Context:`, Object.keys(handoffData.content_context));
  }
  if (handoffData.design_context) {
    console.log(`🎨 Design Context:`, Object.keys(handoffData.design_context));
  }
  if (handoffData.quality_context) {
    console.log(`✅ Quality Context:`, Object.keys(handoffData.quality_context));
  }
}

/**
 * Validate and debug handoff chain
 */
export function validateHandoffChain(handoffData: any): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check basic structure
  if (!handoffData.request) {
    errors.push('Missing request field');
  }
  if (!handoffData.metadata) {
    errors.push('Missing metadata field');
  }

  // Check metadata
  if (handoffData.metadata) {
    if (!handoffData.metadata.handoffId) {
      errors.push('Missing handoff ID');
    }
    if (!handoffData.metadata.timestamp) {
      errors.push('Missing timestamp');
    }
  }

  // Check context chain
  if (handoffData.design_context && !handoffData.content_context) {
    errors.push('Design context present but content context missing');
  }
  if (handoffData.quality_context && !handoffData.design_context) {
    errors.push('Quality context present but design context missing');
  }

  // Check data sizes
  const dataSize = getHandoffDataSize(handoffData);
  if (dataSize > HANDOFF_CONFIG.MAX_CONTEXT_SIZE) {
    warnings.push(`Large handoff data: ${(dataSize / 1024 / 1024).toFixed(2)} MB`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const transferToolsV2 = [
  handoffToDesignSpecialist,
  handoffToQualitySpecialist,
  handoffToDeliverySpecialist
];

// All other functions are already exported in their declarations above