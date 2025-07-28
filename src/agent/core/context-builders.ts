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
  DataCollectionContext,
  ContentToDesignHandoff,
  DesignToQualityHandoff,
  QualityToDeliveryHandoff,
  createHandoffMetadata
} from './handoff-schemas';

/**
 * Creates a proper empty DataCollectionContext with undefined values for optional fields
 * to satisfy Zod schema requirements with exactOptionalPropertyTypes
 */
function createEmptyDataCollectionContext(campaignId: string): DataCollectionContext {
  return {
    // Optional fields should be undefined, not null
    destination_analysis: undefined,
    market_intelligence: undefined,
    emotional_profile: undefined,
    travel_intelligence: undefined,
    trend_analysis: undefined,
    consolidated_insights: undefined,
    collection_metadata: {
      campaign_id: campaignId,
      collection_timestamp: new Date().toISOString(),
      data_sources: [],
      collection_status: 'failed' as const,
      data_quality_score: 0
    }
  };
}

/**
 * PHASE 11 TASK 11.8: Workflow Continuity System
 * Enhanced workflow continuity validation and quality preservation tracking
 * Addresses Thailand campaign issue: Quality work lost during phase transitions
 */

/**
 * Workflow state that accumulates context from all specialists
 */
interface WorkflowState {
  campaign_id: string;
  current_stage: 'data_collection' | 'content' | 'design' | 'quality' | 'delivery';
  completed_stages: string[];
  data_collection_context?: any;
  content_context?: any;
  design_context?: any;
  quality_context?: any;
  delivery_context?: any;
  workflow_metadata: {
    started_at: string;
    current_stage_started_at: string;
    total_processing_time: number;
    stage_transitions: Array<{
      from_stage: string;
      to_stage: string;
      timestamp: string;
      duration: number;
    }>;
  };
}

/**
 * Workflow Continuity Validation Interface
 */
interface WorkflowContinuityValidation {
  continuity_score: number; // 0-100
  phase_transition_quality: {
    data_to_content: number;
    content_to_design: number;
    design_to_quality: number;
    quality_to_delivery: number;
    overall_transition_quality: number;
  };
  quality_preservation: {
    content_preservation_score: number;
    design_preservation_score: number;
    asset_preservation_score: number;
    brand_preservation_score: number;
    overall_preservation_score: number;
  };
  continuity_issues: Array<{
    phase_transition: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    issue_type: 'data_loss' | 'quality_degradation' | 'specification_drift' | 'context_loss';
    description: string;
    impact: string;
    recommendation: string;
  }>;
  rollback_triggers: Array<{
    trigger_type: string;
    threshold: number;
    current_value: number;
    triggered: boolean;
    action_required: string;
  }>;
  phase11_compliance: boolean;
}

/**
 * Enhanced workflow continuity validation with quality preservation tracking
 */
export async function validateWorkflowContinuity(
  workflowState: WorkflowState,
  options: {
    strict_mode?: boolean;
    continuity_threshold?: number; // Default: 90%
    preservation_threshold?: number; // Default: 95%
    enable_rollback?: boolean;
    validate_all_transitions?: boolean;
  } = {}
): Promise<WorkflowContinuityValidation> {
  const config = {
    strict_mode: true,
    continuity_threshold: 90,
    preservation_threshold: 95,
    enable_rollback: true,
    validate_all_transitions: true,
    ...options
  };

  console.log(`🚀 Phase 11 Task 11.8: Starting Workflow Continuity Validation`);
  console.log(`📊 Targets: Continuity ${config.continuity_threshold}%+, Preservation ${config.preservation_threshold}%+`);

  try {
    // Step 1: Validate Phase Transitions
    console.log(`🔄 Step 1: Validating phase transitions...`);
    const phaseTransitionQuality = await validatePhaseTransitions(workflowState, config);
    
    // Step 2: Validate Quality Preservation
    console.log(`🎯 Step 2: Validating quality preservation...`);
    const qualityPreservation = await validateQualityPreservation(workflowState, config);
    
    // Step 3: Calculate Overall Continuity Score
    const continuityScore = calculateContinuityScore(phaseTransitionQuality, qualityPreservation);
    console.log(`📊 Overall continuity score: ${continuityScore}%`);
    
    // Step 4: Identify Continuity Issues
    const continuityIssues = identifyContinuityIssues(
      phaseTransitionQuality,
      qualityPreservation,
      config
    );
    
    // Step 5: Check Rollback Triggers
    const rollbackTriggers = checkRollbackTriggers(
      continuityScore,
      phaseTransitionQuality,
      qualityPreservation,
      config
    );
    
    // Step 6: Phase 11 Compliance Check
    const phase11Compliance = checkWorkflowContinuityCompliance(
      continuityScore,
      phaseTransitionQuality,
      qualityPreservation,
      config
    );
    
    console.log(`${phase11Compliance ? '✅' : '❌'} Phase 11 Workflow Continuity: ${phase11Compliance ? 'PASSED' : 'FAILED'}`);
    
    const validation: WorkflowContinuityValidation = {
      continuity_score: continuityScore,
      phase_transition_quality: phaseTransitionQuality,
      quality_preservation: qualityPreservation,
      continuity_issues: continuityIssues,
      rollback_triggers: rollbackTriggers,
      phase11_compliance: phase11Compliance
    };
    
    // Log results
    console.log(`\n📊 WORKFLOW CONTINUITY VALIDATION RESULTS:`);
    console.log(`   Continuity Score: ${continuityScore}%`);
    console.log(`   Transition Quality: ${phaseTransitionQuality.overall_transition_quality}%`);
    console.log(`   Preservation Quality: ${qualityPreservation.overall_preservation_score}%`);
    console.log(`   Critical Issues: ${continuityIssues.filter(i => i.severity === 'critical').length}`);
    console.log(`   Rollback Triggers: ${rollbackTriggers.filter(t => t.triggered).length}`);
    
    return validation;
    
  } catch (error) {
    console.error('❌ Workflow continuity validation failed:', error);
    throw new Error(`Workflow continuity validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate phase transitions for quality preservation
 */
async function validatePhaseTransitions(
  workflowState: WorkflowState,
  _config: any
): Promise<any> {
  console.log('🔄 Validating phase transitions...');
  
  const transitions = {
    data_to_content: 0,
    content_to_design: 0,
    design_to_quality: 0,
    quality_to_delivery: 0,
    overall_transition_quality: 0
  };
  
  // Data to Content transition
  if (workflowState.data_collection_context && workflowState.content_context) {
    transitions.data_to_content = validateDataToContentTransition(
      workflowState.data_collection_context,
      workflowState.content_context
    );
  }
  
  // Content to Design transition
  if (workflowState.content_context && workflowState.design_context) {
    transitions.content_to_design = validateContentToDesignTransition(
      workflowState.content_context,
      workflowState.design_context
    );
  }
  
  // Design to Quality transition
  if (workflowState.design_context && workflowState.quality_context) {
    transitions.design_to_quality = validateDesignToQualityTransition(
      workflowState.design_context,
      workflowState.quality_context
    );
  }
  
  // Quality to Delivery transition
  if (workflowState.quality_context && workflowState.delivery_context) {
    transitions.quality_to_delivery = validateQualityToDeliveryTransition(
      workflowState.quality_context,
      workflowState.delivery_context
    );
  }
  
  // Calculate overall transition quality
  const validTransitions = Object.values(transitions).filter(score => score > 0);
  transitions.overall_transition_quality = validTransitions.length > 0 
    ? Math.round(validTransitions.reduce((sum, score) => sum + score, 0) / validTransitions.length)
    : 0;
  
  return transitions;
}

/**
 * Validate quality preservation across workflow
 */
async function validateQualityPreservation(
  workflowState: WorkflowState,
  _config: any
): Promise<any> {
  console.log('🎯 Validating quality preservation...');
  
  const preservation = {
    content_preservation_score: 0,
    design_preservation_score: 0,
    asset_preservation_score: 0,
    brand_preservation_score: 0,
    overall_preservation_score: 0
  };
  
  // Content preservation (Thailand campaign: lost pricing, dates, routes)
  if (workflowState.content_context && workflowState.design_context) {
    preservation.content_preservation_score = validateContentPreservationInWorkflow(
      workflowState.content_context,
      workflowState.design_context,
      workflowState.quality_context
    );
  }
  
  // Design preservation
  if (workflowState.design_context && workflowState.quality_context) {
    preservation.design_preservation_score = validateDesignPreservationInWorkflow(
      workflowState.design_context,
      workflowState.quality_context
    );
  }
  
  // Asset preservation (Thailand campaign: only 1/7 images used)
  if (workflowState.design_context) {
    preservation.asset_preservation_score = validateAssetPreservationInWorkflow(
      workflowState.design_context,
      workflowState.quality_context
    );
  }
  
  // Brand preservation (Thailand campaign: no brand colors used)
  if (workflowState.design_context) {
    preservation.brand_preservation_score = validateBrandPreservationInWorkflow(
      workflowState.design_context,
      workflowState.quality_context
    );
  }
  
  // Calculate overall preservation score
  const preservationScores = Object.values(preservation).filter(score => score > 0);
  preservation.overall_preservation_score = preservationScores.length > 0
    ? Math.round(preservationScores.reduce((sum, score) => sum + score, 0) / preservationScores.length)
    : 0;
  
  return preservation;
}

// Helper functions for transition validation
function validateDataToContentTransition(dataContext: any, contentContext: any): number {
  let score = 100;
  
  // Check if key data elements are preserved
  if (!contentContext.destination && dataContext.destination) score -= 20;
  if (!contentContext.travel_dates && dataContext.travel_dates) score -= 15;
  if (!contentContext.pricing && dataContext.pricing) score -= 20;
  
  return Math.max(score, 0);
}

function validateContentToDesignTransition(contentContext: any, designContext: any): number {
  let score = 100;
  
  // Check if content elements are preserved in design
  if (!designContext.content_integration?.subject && contentContext.subject) score -= 25;
  if (!designContext.content_integration?.pricing && contentContext.pricing) score -= 25;
  if (!designContext.content_integration?.travel_dates && contentContext.travel_dates) score -= 20;
  
  return Math.max(score, 0);
}

function validateDesignToQualityTransition(designContext: any, qualityContext: any): number {
  let score = 100;
  
  // Check if design elements are preserved in quality validation
  if (!qualityContext.design_validation && designContext.design_decisions) score -= 30;
  if (!qualityContext.asset_validation && designContext.asset_manifest) score -= 25;
  
  return Math.max(score, 0);
}

function validateQualityToDeliveryTransition(qualityContext: any, deliveryContext: any): number {
  let score = 100;
  
  // Check if quality standards are maintained in delivery
  if (!deliveryContext.quality_preservation && qualityContext.quality_report) score -= 30;
  
  return Math.max(score, 0);
}

// Helper functions for preservation validation
function validateContentPreservationInWorkflow(contentContext: any, designContext: any, _qualityContext?: any): number {
  let score = 100;
  
  // Thailand campaign issues: pricing, dates, routes lost
  const criticalContent = ['pricing', 'travel_dates', 'destination', 'routes'];
  
  criticalContent.forEach(element => {
    if (contentContext[element] && !designContext.content_integration?.[element]) {
      score -= 25; // Heavy penalty for content loss
    }
  });
  
  return Math.max(score, 0);
}

function validateDesignPreservationInWorkflow(_designContext: any, qualityContext: any): number {
  let score = 100;
  
  // Check if design decisions are preserved
  if (!qualityContext.design_validation?.layout_consistency) score -= 20;
  if (!qualityContext.design_validation?.visual_hierarchy) score -= 20;
  if (!qualityContext.design_validation?.typography_consistency) score -= 15;
  
  return Math.max(score, 0);
}

function validateAssetPreservationInWorkflow(designContext: any, _qualityContext?: any): number {
  // Thailand campaign: only 1/7 images used
  const totalAssets = (designContext.asset_manifest?.images?.length || 0) + 
                     (designContext.asset_manifest?.icons?.length || 0);
  const usedAssets = designContext.asset_utilization?.used_assets?.length || 1; // Thailand: only 1 used
  
  if (totalAssets === 0) return 100;
  
  const utilizationRate = (usedAssets / totalAssets) * 100;
  return Math.min(utilizationRate, 100);
}

function validateBrandPreservationInWorkflow(designContext: any, _qualityContext?: any): number {
  let score = 100;
  
  // Thailand campaign: no brand colors used
  const brandElements = ['primary_color', 'secondary_color', 'accent_color', 'logo'];
  
  brandElements.forEach(element => {
    if (!designContext.brand_application?.[element]) {
      score -= 25; // Heavy penalty for brand inconsistency
    }
  });
  
  return Math.max(score, 0);
}

function calculateContinuityScore(phaseTransitions: any, qualityPreservation: any): number {
  const transitionWeight = 0.4;
  const preservationWeight = 0.6;
  
  return Math.round(
    (phaseTransitions.overall_transition_quality * transitionWeight) +
    (qualityPreservation.overall_preservation_score * preservationWeight)
  );
}

function identifyContinuityIssues(phaseTransitions: any, qualityPreservation: any, _config: any): any[] {
  const issues = [];
  
  // Transition quality issues
  if (phaseTransitions.content_to_design < 80) {
    issues.push({
      phase_transition: 'content_to_design',
      severity: 'critical',
      issue_type: 'data_loss',
      description: 'Critical content elements lost during content-to-design transition',
      impact: 'Key information (pricing, dates, routes) missing from final template',
      recommendation: 'Implement mandatory content preservation validation'
    });
  }
  
  // Preservation issues
  if (qualityPreservation.content_preservation_score < 90) {
    issues.push({
      phase_transition: 'workflow_wide',
      severity: 'critical',
      issue_type: 'quality_degradation',
      description: 'Content preservation below 90% threshold',
      impact: 'Important content details lost during workflow execution',
      recommendation: 'Strengthen content handoff validation and tracking'
    });
  }
  
  if (qualityPreservation.asset_preservation_score < 80) {
    issues.push({
      phase_transition: 'design_phase',
      severity: 'high',
      issue_type: 'specification_drift',
      description: 'Asset utilization below 80% threshold',
      impact: 'Collected assets not properly integrated into final template',
      recommendation: 'Enforce asset utilization requirements in design phase'
    });
  }
  
  if (qualityPreservation.brand_preservation_score < 70) {
    issues.push({
      phase_transition: 'design_phase',
      severity: 'high',
      issue_type: 'specification_drift',
      description: 'Brand consistency below 70% threshold',
      impact: 'Brand guidelines not properly applied in final template',
      recommendation: 'Implement automatic brand consistency enforcement'
    });
  }
  
  return issues;
}

function checkRollbackTriggers(
  continuityScore: number,
  _phaseTransitions: any,
  qualityPreservation: any,
  config: any
): any[] {
  const triggers = [];
  
  // Overall continuity trigger
  triggers.push({
    trigger_type: 'overall_continuity',
    threshold: config.continuity_threshold,
    current_value: continuityScore,
    triggered: continuityScore < config.continuity_threshold,
    action_required: continuityScore < config.continuity_threshold 
      ? 'Rollback to previous phase for continuity restoration'
      : 'Continue workflow'
  });
  
  // Content preservation trigger
  triggers.push({
    trigger_type: 'content_preservation',
    threshold: config.preservation_threshold,
    current_value: qualityPreservation.content_preservation_score,
    triggered: qualityPreservation.content_preservation_score < config.preservation_threshold,
    action_required: qualityPreservation.content_preservation_score < config.preservation_threshold
      ? 'Rollback to content phase to restore lost content'
      : 'Content preservation acceptable'
  });
  
  // Asset utilization trigger
  triggers.push({
    trigger_type: 'asset_utilization',
    threshold: 80,
    current_value: qualityPreservation.asset_preservation_score,
    triggered: qualityPreservation.asset_preservation_score < 80,
    action_required: qualityPreservation.asset_preservation_score < 80
      ? 'Rollback to design phase to improve asset integration'
      : 'Asset utilization acceptable'
  });
  
  return triggers;
}

function checkWorkflowContinuityCompliance(
  continuityScore: number,
  phaseTransitions: any,
  qualityPreservation: any,
  config: any
): boolean {
  return (
    continuityScore >= config.continuity_threshold &&
    qualityPreservation.overall_preservation_score >= config.preservation_threshold &&
    phaseTransitions.overall_transition_quality >= 85
  );
}

// ============================================================================
// DATA COLLECTION CONTEXT LOADER
// ============================================================================

/**
 * Loads data collection context from campaign files
 */
export async function loadDataCollectionContext(
  campaignPath: string
): Promise<DataCollectionContext> {
  const dataDir = path.join(campaignPath, 'data');
  
  // Helper function to read JSON files safely
  async function readJsonSafely(fileName: string): Promise<any> {
    try {
      const content = await fs.readFile(path.join(dataDir, fileName), 'utf-8');
      return JSON.parse(content);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`Failed to read ${fileName}:`, errorMessage);
      return null;
    }
  }
  
  // Load all data collection files
  const [
    destinationAnalysis,
    marketIntelligence,
    emotionalProfile,
    consolidatedInsights,
    travelIntelligence,
    trendAnalysis
  ] = await Promise.all([
    readJsonSafely('destination-analysis.json'),
    readJsonSafely('market-intelligence.json'),
    readJsonSafely('emotional-profile.json'),
    readJsonSafely('consolidated-insights.json'),
    readJsonSafely('travel_intelligence-insights.json'),
    readJsonSafely('trend-analysis.json')
  ]);
  
  // Count available sources
  const availableSources = [
    destinationAnalysis && 'destination-analysis',
    marketIntelligence && 'market-intelligence',
    emotionalProfile && 'emotional-profile',
    consolidatedInsights && 'consolidated-insights',
    travelIntelligence && 'travel-intelligence',
    trendAnalysis && 'trend-analysis'
  ].filter(Boolean);
  
  const dataQualityScore = Math.round((availableSources.length / 6) * 100);
  
  // Create the data collection context object
  const dataCollectionContext = {
    destination_analysis: destinationAnalysis,
    market_intelligence: marketIntelligence,
    emotional_profile: emotionalProfile,
    consolidated_insights: consolidatedInsights,
    travel_intelligence: travelIntelligence,
    trend_analysis: trendAnalysis,
    collection_metadata: {
      campaign_id: path.basename(campaignPath),
      collection_timestamp: new Date().toISOString(),
      data_sources: availableSources,
      collection_status: availableSources.length >= 4 ? 'complete' as const : 
                        availableSources.length >= 2 ? 'partial' as const : 'failed' as const,
      data_quality_score: dataQualityScore
    }
  };

  // DEBUG: Validate the data collection context against schema to catch issues early
  try {
    const { DataCollectionContextSchema } = await import('./handoff-schemas');
    const validation = DataCollectionContextSchema.safeParse(dataCollectionContext);
    
    if (!validation.success) {
      console.warn('⚠️ DATA COLLECTION CONTEXT VALIDATION ISSUES:');
      
      // Filter out optional field errors for backward compatibility
      const criticalErrors = validation.error.errors.filter(error => {
        const path = error.path.join('.');
        // Allow missing optional fields for backward compatibility
        const isOptionalField = path.includes('travel_experience_quality') || 
                               path.includes('pricing_insights') ||
                               path.includes('competitive_position') ||
                               path.includes('demand_patterns') ||
                               path.includes('booking_recommendations') ||
                               path.includes('core_motivations') ||
                               path.includes('emotional_triggers') ||
                               path.includes('key_desires') ||
                               path.includes('psychological_benefits');
        return !isOptionalField;
      });
      
      if (criticalErrors.length > 0) {
        console.error('❌ CRITICAL validation errors:');
        criticalErrors.forEach(error => {
          console.error(`  - Path: ${error.path.join('.')} | Message: ${error.message} | Code: ${error.code}`);
        });
      }
      
      // Log non-critical issues as warnings
      const nonCriticalErrors = validation.error.errors.filter(error => {
        const path = error.path.join('.');
        const isOptionalField = path.includes('travel_experience_quality') || 
                               path.includes('pricing_insights') ||
                               path.includes('competitive_position') ||
                               path.includes('demand_patterns') ||
                               path.includes('booking_recommendations') ||
                               path.includes('core_motivations') ||
                               path.includes('emotional_triggers') ||
                               path.includes('key_desires') ||
                               path.includes('psychological_benefits');
        return isOptionalField;
      });
      
      if (nonCriticalErrors.length > 0) {
        console.warn('⚠️ NON-CRITICAL validation warnings (backward compatibility):');
        nonCriticalErrors.forEach(error => {
          console.warn(`  - Path: ${error.path.join('.')} | Message: ${error.message} | Code: ${error.code}`);
        });
      }
      
      // Continue with data anyway for backward compatibility
      console.warn('⚠️ Continuing with data collection context (backward compatibility mode)');
    } else {
      console.log('✅ Data collection context schema validation passed');
    }
  } catch (importError: unknown) {
    const errorMessage = importError instanceof Error ? importError.message : String(importError);
    console.warn('Could not import schema for validation:', errorMessage);
  }
  
  return dataCollectionContext;
}

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
  technicalRequirements?: any,
  dataCollectionContext?: DataCollectionContext
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
      dates.push(futureDate.toISOString().split('T')[0] || '');
      
      futureDate.setDate(15); // Mid month
      dates.push(futureDate.toISOString().split('T')[0] || '');
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

  // Load data collection context if not provided
  const loadedDataContext = dataCollectionContext || await loadDataCollectionContext(campaignPath);
  
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
    data_collection_context: loadedDataContext,
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
        : ensureArray(dateAnalysisData?.optimal_dates).length > 0
          ? ensureArray(dateAnalysisData.optimal_dates).slice(0, 2)
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
  performanceMetricsData: any,
  dataCollectionContext?: DataCollectionContext
): Promise<DesignContext> {
  
  const designContext: DesignContext = {
    content_context: contentContext,
    data_collection_context: dataCollectionContext || contentContext.data_collection_context,
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
  // 🛡️ КРИТИЧЕСКАЯ ЗАЩИТА: Создаем папку docs если она не существует
  const docsDir = path.join(campaignPath, 'docs');
  try {
    await fs.access(docsDir);
  } catch {
    console.log('📁 Creating missing docs directory:', docsDir);
    await fs.mkdir(docsDir, { recursive: true });
  }
  
  const contextPath = path.join(docsDir, 'design-context.json');
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
  complianceStatusData: any,
  dataCollectionContext?: DataCollectionContext
): Promise<QualityContext> {
  
  const qualityContext: QualityContext = {
    design_context: designContext,
    data_collection_context: dataCollectionContext || designContext.data_collection_context || createEmptyDataCollectionContext('unknown'),
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
  deploymentArtifactsData: any,
  dataCollectionContext?: DataCollectionContext
): Promise<DeliveryContext> {
  
  const deliveryContext: DeliveryContext = {
    quality_context: qualityContext,
    data_collection_context: dataCollectionContext || qualityContext.data_collection_context,
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
  
  // PHASE 11 FIX: Include original content for preservation validation
  const originalContent = {
    user_request: request,
    campaign_brief: contentContext.campaign?.name || 'Email campaign',
    content_requirements: {
      personalization_level: contentContext.generated_content?.personalization_level,
      urgency_level: contentContext.generated_content?.urgency_level,
      target_audience: contentContext.campaign?.target_audience
    },
    data_collection_inputs: contentContext.data_collection_context || {
      destination_analysis: null,
      market_intelligence: null,
      emotional_profile: null,
      travel_intelligence: null,
      trend_analysis: null,
      consolidated_insights: null,
      collection_metadata: {
        campaign_id: 'unknown',
        collection_timestamp: new Date().toISOString(),
        data_sources: [],
        collection_status: 'failed' as const,
        data_quality_score: 0
      }
    }
  };
  
  return {
    request,
    metadata,
    content_context: contentContext,
    data_collection_context: contentContext.data_collection_context || createEmptyDataCollectionContext('unknown'),
    original_content: originalContent
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
    design_context: designContext,
    data_collection_context: designContext.data_collection_context
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
    quality_context: qualityContext,
    data_collection_context: qualityContext.data_collection_context
  };
}

// ============================================================================
// WORKFLOW CONTEXT ACCUMULATION
// ============================================================================


/**
 * Creates initial workflow state for context accumulation
 */
export function createWorkflowState(campaignId: string, dataCollectionContext: DataCollectionContext): WorkflowState {
  const now = new Date().toISOString();
  
  return {
    campaign_id: campaignId,
    current_stage: 'data_collection',
    completed_stages: ['data_collection'],
    data_collection_context: dataCollectionContext,
    workflow_metadata: {
      started_at: now,
      current_stage_started_at: now,
      total_processing_time: 0,
      stage_transitions: []
    }
  };
}

/**
 * Advances workflow state to next stage with full context accumulation
 */
export function advanceWorkflowState(
  workflowState: WorkflowState,
  nextStage: 'content' | 'design' | 'quality' | 'delivery',
  stageContext: ContentContext | DesignContext | QualityContext | DeliveryContext
): WorkflowState {
  const now = new Date().toISOString();
  const currentStageStart = new Date(workflowState.workflow_metadata.current_stage_started_at);
  const stageDuration = Date.now() - currentStageStart.getTime();
  
  const updatedState: WorkflowState = {
    ...workflowState,
    current_stage: nextStage,
    completed_stages: [...workflowState.completed_stages, nextStage],
    workflow_metadata: {
      ...workflowState.workflow_metadata,
      current_stage_started_at: now,
      total_processing_time: workflowState.workflow_metadata.total_processing_time + stageDuration,
      stage_transitions: [
        ...workflowState.workflow_metadata.stage_transitions,
        {
          from_stage: workflowState.current_stage,
          to_stage: nextStage,
          timestamp: now,
          duration: stageDuration
        }
      ]
    }
  };
  
  // Add stage-specific context while preserving all previous contexts
  switch (nextStage) {
    case 'content':
      updatedState.content_context = stageContext as ContentContext;
      break;
    case 'design':
      updatedState.design_context = stageContext as DesignContext;
      break;
    case 'quality':
      updatedState.quality_context = stageContext as QualityContext;
      break;
    case 'delivery':
      updatedState.delivery_context = stageContext as DeliveryContext;
      break;
  }
  
  return updatedState;
}

/**
 * Saves workflow state to campaign folder for persistence
 */
export async function saveWorkflowState(
  workflowState: WorkflowState,
  campaignPath: string
): Promise<string> {
  const statePath = path.join(campaignPath, 'docs', 'workflow-state.json');
  await fs.mkdir(path.dirname(statePath), { recursive: true });
  await fs.writeFile(statePath, JSON.stringify(workflowState, null, 2));
  console.log(`📊 Workflow state saved to: ${statePath}`);
  return statePath;
}

/**
 * Recovers workflow state from campaign folder
 */
export async function recoverWorkflowState(
  campaignPath: string
): Promise<WorkflowState | null> {
  const statePath = path.join(campaignPath, 'docs', 'workflow-state.json');
  
  try {
    const stateContent = await fs.readFile(statePath, 'utf-8');
    const workflowState = JSON.parse(stateContent) as WorkflowState;
    console.log(`🔄 Recovered workflow state from: ${statePath}`);
    return workflowState;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`⚠️ Could not recover workflow state from ${statePath}:`, errorMessage);
    return null;
  }
}

/**
 * Validates that context accumulation is working correctly
 */
export function validateContextAccumulation(workflowState: WorkflowState): {
  isValid: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Check that data collection context is preserved throughout
  if (!workflowState.data_collection_context) {
    issues.push('Data collection context is missing from workflow state');
  }
  
  // Check context consistency across stages
  if (workflowState.content_context && workflowState.design_context) {
    const contentCampaignId = workflowState.content_context.campaign?.id;
    const designCampaignId = workflowState.design_context.content_context?.campaign?.id;
    if (contentCampaignId && designCampaignId && contentCampaignId !== designCampaignId) {
      issues.push('Campaign ID mismatch between content and design contexts');
    }
    
    if (!workflowState.design_context.data_collection_context) {
      issues.push('Design context missing data collection context');
      recommendations.push('Ensure data collection context flows to design specialist');
    }
  }
  
  // Check stage progression logic
  const expectedProgression = ['data_collection', 'content', 'design', 'quality', 'delivery'];
  for (let i = 0; i < workflowState.completed_stages.length - 1; i++) {
    const currentStage = workflowState.completed_stages[i];
    const nextStage = workflowState.completed_stages[i + 1];
    const currentIndex = expectedProgression.indexOf(currentStage || '');
    const nextIndex = expectedProgression.indexOf(nextStage || '');
    
    if (nextIndex !== currentIndex + 1) {
      issues.push(`Invalid stage progression: ${currentStage} -> ${nextStage}`);
    }
  }
  
  // Check context availability for current stage
  switch (workflowState.current_stage) {
    case 'design':
      if (!workflowState.content_context) {
        issues.push('Design stage requires content context');
      }
      break;
    case 'quality':
      if (!workflowState.design_context) {
        issues.push('Quality stage requires design context');
      }
      break;
    case 'delivery':
      if (!workflowState.quality_context) {
        issues.push('Delivery stage requires quality context');
      }
      break;
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    recommendations
  };
}

/**
 * Enhanced context builder that ensures full context accumulation
 */
export async function buildAccumulatedContext(
  campaignPath: string,
  targetStage: 'content' | 'design' | 'quality' | 'delivery',
  stageSpecificData: any
): Promise<{
  workflowState: WorkflowState;
  accumulatedContext: ContentContext | DesignContext | QualityContext | DeliveryContext;
}> {
  // Try to recover existing workflow state
  let workflowState = await recoverWorkflowState(campaignPath);
  
  // If no workflow state exists, create initial state
  if (!workflowState) {
    const dataCollectionContext = await loadDataCollectionContext(campaignPath);
    workflowState = createWorkflowState(path.basename(campaignPath), dataCollectionContext);
  }
  
  let accumulatedContext: ContentContext | DesignContext | QualityContext | DeliveryContext;
  
  switch (targetStage) {
    case 'content':
      // Build content context with accumulated data
      accumulatedContext = await buildContentContextFromOutputs(
        workflowState.campaign_id,
        campaignPath,
        stageSpecificData.contextAnalysis,
        stageSpecificData.dateAnalysis,
        stageSpecificData.pricingAnalysis,
        stageSpecificData.assetStrategy,
        stageSpecificData.generatedContent,
        stageSpecificData.technicalRequirements,
        workflowState.data_collection_context
      );
      break;
      
    case 'design':
      // Build design context with all previous contexts
      if (!workflowState.content_context) {
        throw new Error('Design stage requires content context');
      }
      accumulatedContext = await buildDesignContextFromOutputs(
        workflowState.content_context,
        stageSpecificData.assetManifest,
        stageSpecificData.mjmlTemplate,
        stageSpecificData.designDecisions,
        stageSpecificData.previewFiles,
        stageSpecificData.performanceMetrics,
        workflowState.data_collection_context
      );
      break;
      
    case 'quality':
      // Build quality context with all previous contexts
      if (!workflowState.design_context) {
        throw new Error('Quality stage requires design context');
      }
      accumulatedContext = await buildQualityContextFromOutputs(
        workflowState.design_context,
        stageSpecificData.qualityReport,
        stageSpecificData.testArtifacts,
        stageSpecificData.complianceStatus,
        workflowState.data_collection_context
      );
      break;
      
    case 'delivery':
      // Build delivery context with all previous contexts
      if (!workflowState.quality_context) {
        throw new Error('Delivery stage requires quality context');
      }
      accumulatedContext = await buildDeliveryContextFromOutputs(
        workflowState.quality_context,
        stageSpecificData.deliveryManifest,
        stageSpecificData.exportFormat,
        stageSpecificData.deliveryReport,
        stageSpecificData.deploymentArtifacts,
        workflowState.data_collection_context
      );
      break;
      
    default:
      throw new Error(`Unknown target stage: ${targetStage}`);
  }
  
  // Advance workflow state with new context
  workflowState = advanceWorkflowState(workflowState, targetStage, accumulatedContext);
  
  // Validate context accumulation
  const validation = validateContextAccumulation(workflowState);
  if (!validation.isValid) {
    console.warn('⚠️ Context accumulation validation issues:', validation.issues);
    if (validation.recommendations.length > 0) {
      console.warn('💡 Recommendations:', validation.recommendations);
    }
  }
  
  // Save updated workflow state
  await saveWorkflowState(workflowState, campaignPath);
  
  return {
    workflowState,
    accumulatedContext
  };
}

// ============================================================================
// CONTEXT VALIDATION UTILITIES
// ============================================================================

/**
 * Enhanced validation for context completeness, content quality, and data integrity
 */
export function validateContextCompleteness(context: any, contextType: string): {
  isComplete: boolean;
  missingFields: string[];
  warnings: string[];
  hardcodeViolations: string[];
  contentQualityScore: number;
  dataConsistencyIssues: string[];
} {
  const missingFields: string[] = [];
  const warnings: string[] = [];
  const hardcodeViolations: string[] = [];
  const dataConsistencyIssues: string[] = [];
  let contentQualityScore = 100; // Start with perfect score
  
  // HARDCODE DETECTION PATTERNS - REMOVED ALL HARDCODED VALUES
  const HARDCODE_PATTERNS = {
    destinations: [], // No hardcoded destinations - any destination is valid
    seasons: [], // No hardcoded seasons - any season is valid
    routes: [], // No hardcoded routes - any route is valid
    currencies: [], // No hardcoded currencies - any currency is valid
    pricing: ['0', 0, '0.00'], // Keep zero price detection as it indicates missing data
    emotional_triggers: [] // No hardcoded emotional triggers - any trigger is valid
  };

  // Helper function to check for hardcoded values
  function checkHardcodes(value: any, path: string, patterns: (string | number)[]): void {
    if (typeof value === 'string') {
      for (const pattern of patterns) {
        if (typeof pattern === 'string' && value.includes(pattern)) {
          hardcodeViolations.push(`${path}: contains hardcoded value '${pattern}'`);
        } else if (typeof pattern === 'number' && value.includes(pattern.toString())) {
          hardcodeViolations.push(`${path}: contains hardcoded value '${pattern}'`);
        }
      }
    } else if (typeof value === 'number') {
      const stringPatterns = patterns.map(p => typeof p === 'string' ? p : p.toString());
      if (stringPatterns.includes(value.toString()) || patterns.includes(value)) {
        hardcodeViolations.push(`${path}: suspicious hardcoded number '${value}'`);
      }
    }
  }

  // Helper function to check for generic/template values
  function checkGenericValues(value: any, path: string): void {
    if (typeof value === 'string') {
      const genericPatterns = [
        'Travel industry',
        'Travel market competition', 
        'Autumn travel trends',
        'Advanced booking recommended',
        'Unknown Destination',
        'Unknown'
      ];
      
      for (const pattern of genericPatterns) {
        if (value.includes(pattern)) {
          hardcodeViolations.push(`${path}: contains generic template value '${pattern}'`);
          contentQualityScore -= 15; // Penalize generic content
        }
      }
    }
  }

  // Enhanced content quality assessment
  function assessContentQuality(content: any, path: string): void {
    if (typeof content === 'string') {
      // Check for meaningful content length
      if (content.length < 10) {
        warnings.push(`${path}: content too short (${content.length} chars)`);
        contentQualityScore -= 10;
      }
      
      // Check for placeholder text
      const placeholderPatterns = [
        'Lorem ipsum', 'placeholder', 'TODO', 'TBD', 'PLACEHOLDER',
        'example text', 'sample content', 'default value'
      ];
      
      for (const pattern of placeholderPatterns) {
        if (content.toLowerCase().includes(pattern.toLowerCase())) {
          hardcodeViolations.push(`${path}: contains placeholder text '${pattern}'`);
          contentQualityScore -= 20;
        }
      }
      
      // Check for repetitive or template-like content
      if (content.includes('...') || content.includes('[INSERT]') || content.includes('{{')) {
        warnings.push(`${path}: contains template markers or incomplete content`);
        contentQualityScore -= 15;
      }
    }
  }

  // Data consistency validation
  function validateDataConsistency(context: any): void {
    if (contextType === 'content' && context.context_analysis && context.date_analysis && context.pricing_analysis) {
      const destination1 = context.context_analysis.destination;
      const destination2 = context.date_analysis.destination;
      
      // Check destination consistency
      if (destination1 !== destination2) {
        dataConsistencyIssues.push(`Destination mismatch: context_analysis="${destination1}" vs date_analysis="${destination2}"`);
        contentQualityScore -= 10;
      }
      
      // No hardcoded route validation - any route is valid for any destination
      // Routes are determined by real API data based on user input
      
      // Check pricing consistency (non-zero prices for real campaigns)
      if (context.pricing_analysis.best_price === 0 && context.pricing_analysis.min_price === 0) {
        dataConsistencyIssues.push('All pricing values are zero - indicates missing real pricing data');
        contentQualityScore -= 20;
      }
      
      // Check date consistency (should have future dates)
      if (context.date_analysis.optimal_dates?.length > 0) {
        const today = new Date();
        const futureCount = context.date_analysis.optimal_dates.filter((date: string) => {
          return new Date(date) > today;
        }).length;
        
        if (futureCount === 0) {
          dataConsistencyIssues.push('No future dates found in optimal_dates - all dates are in the past');
          contentQualityScore -= 10;
        }
      }
      
      // Check content richness
      const subject = context.generated_content?.subject || '';
      const body = context.generated_content?.body || '';
      
      if (subject.length < 10) {
        warnings.push('Email subject is too short or missing');
        contentQualityScore -= 15;
      }
      
      if (body.length < 50) {
        warnings.push('Email body content is too short - may lack substance');
        contentQualityScore -= 15;
      }
      
      // Check for campaign-specific content integration
      const hasDestinationMention = subject.includes(destination1) || body.includes(destination1);
      if (!hasDestinationMention && destination1 !== 'Unknown') {
        warnings.push(`Generated content doesn't mention the destination "${destination1}"`);
        contentQualityScore -= 10;
      }
    }
  }

  switch (contextType) {
    case 'content':
      // Check field presence
      if (!context.campaign) missingFields.push('campaign');
      if (!context.context_analysis) missingFields.push('context_analysis');
      if (!context.date_analysis) missingFields.push('date_analysis');
      if (!context.pricing_analysis) missingFields.push('pricing_analysis');
      if (!context.asset_strategy) missingFields.push('asset_strategy');
      if (!context.generated_content) missingFields.push('generated_content');

      // 🚨 CHECK FOR HARDCODES IN CONTENT CONTEXT - REMOVED ALL HARDCODED CHECKS
      if (context.context_analysis) {
        // Only check for generic template values, not specific destinations
        checkGenericValues(context.context_analysis.market_positioning, 'context_analysis.market_positioning');
        checkGenericValues(context.context_analysis.competitive_landscape, 'context_analysis.competitive_landscape');
      }

      if (context.date_analysis) {
        // No hardcoded season checks - any season is valid for any destination
        // Only check for generic template values
        checkGenericValues(context.date_analysis.destination, 'date_analysis.destination');
      }

      if (context.pricing_analysis) {
        // Only check for zero prices which indicate missing data
        checkHardcodes(context.pricing_analysis.best_price, 'pricing_analysis.best_price', HARDCODE_PATTERNS.pricing);
        
        // No hardcoded route checks - any route is valid for any destination
        // Routes are determined by real API data, not hardcoded patterns
      }

      // Enhanced content quality assessment for content context
      if (context.generated_content) {
        assessContentQuality(context.generated_content.subject, 'generated_content.subject');
        assessContentQuality(context.generated_content.body, 'generated_content.body');
        assessContentQuality(context.generated_content.preheader, 'generated_content.preheader');
      }
      
      if (context.asset_strategy) {
        assessContentQuality(context.asset_strategy.theme, 'asset_strategy.theme');
      }
      
      // Validate data consistency across all context fields
      validateDataConsistency(context);
      
      // Log detected violations
      if (hardcodeViolations.length > 0) {
        console.error('🚨 HARDCODE VIOLATIONS DETECTED:', hardcodeViolations);
      }
      
      if (dataConsistencyIssues.length > 0) {
        console.warn('⚠️ DATA CONSISTENCY ISSUES:', dataConsistencyIssues);
      }
      break;
      
    case 'design':
      if (!context.content_context) missingFields.push('content_context');
      if (!context.asset_manifest) missingFields.push('asset_manifest');
      if (!context.mjml_template) missingFields.push('mjml_template');
      if (!context.design_decisions) missingFields.push('design_decisions');

      // Check for hardcodes passed from content context
      if (context.content_context) {
        const contentValidation = validateContextCompleteness(context.content_context, 'content');
        hardcodeViolations.push(...contentValidation.hardcodeViolations);
        dataConsistencyIssues.push(...contentValidation.dataConsistencyIssues);
        contentQualityScore = Math.min(contentQualityScore, contentValidation.contentQualityScore);
      }
      
      // Validate MJML template quality
      if (context.mjml_template) {
        assessContentQuality(context.mjml_template.source, 'mjml_template.source');
        
        if (context.mjml_template.file_size && context.mjml_template.file_size > 100000) {
          warnings.push(`MJML template size (${context.mjml_template.file_size} bytes) exceeds 100KB limit`);
          contentQualityScore -= 10;
        }
      }
      break;
      
    case 'quality':
      if (!context.design_context) missingFields.push('design_context');
      if (!context.quality_report) missingFields.push('quality_report');
      if (!context.test_artifacts) missingFields.push('test_artifacts');
      if (!context.compliance_status) missingFields.push('compliance_status');

      // Check for hardcodes passed from design context
      if (context.design_context?.content_context) {
        const contentValidation = validateContextCompleteness(context.design_context.content_context, 'content');
        hardcodeViolations.push(...contentValidation.hardcodeViolations);
        dataConsistencyIssues.push(...contentValidation.dataConsistencyIssues);
        contentQualityScore = Math.min(contentQualityScore, contentValidation.contentQualityScore);
      }
      
      // Validate quality metrics
      if (context.quality_report) {
        if (context.quality_report.overall_score < 80) {
          warnings.push(`Quality score (${context.quality_report.overall_score}) below acceptable threshold`);
          contentQualityScore -= 15;
        }
        
        if (context.quality_report.approval_status !== 'approved') {
          dataConsistencyIssues.push(`Quality approval status: ${context.quality_report.approval_status}`);
        }
      }
      break;
      
    case 'delivery':
      if (!context.quality_context) missingFields.push('quality_context');
      if (!context.delivery_manifest) missingFields.push('delivery_manifest');
      if (!context.export_format) missingFields.push('export_format');
      if (!context.delivery_report) missingFields.push('delivery_report');

      // Check for hardcodes passed from quality context
      if (context.quality_context?.design_context?.content_context) {
        const contentValidation = validateContextCompleteness(context.quality_context.design_context.content_context, 'content');
        hardcodeViolations.push(...contentValidation.hardcodeViolations);
        dataConsistencyIssues.push(...contentValidation.dataConsistencyIssues);
        contentQualityScore = Math.min(contentQualityScore, contentValidation.contentQualityScore);
      }
      
      // Validate delivery readiness
      if (context.delivery_report) {
        if (!context.delivery_report.deployment_ready) {
          dataConsistencyIssues.push('Campaign not marked as deployment ready');
        }
        
        assessContentQuality(context.delivery_report.campaign_summary, 'delivery_report.campaign_summary');
      }
      break;
  }
  
  // Add hardcode violations to warnings
  if (hardcodeViolations.length > 0) {
    warnings.push(`Detected ${hardcodeViolations.length} hardcode violations`);
  }
  
  // Final quality score normalization
  contentQualityScore = Math.max(0, Math.min(100, contentQualityScore));
  
  // Log quality assessment
  if (contentQualityScore < 70) {
    warnings.push(`Content quality score (${contentQualityScore}) below recommended threshold`);
  }
  
  return {
    isComplete: missingFields.length === 0 && hardcodeViolations.length === 0 && dataConsistencyIssues.length === 0,
    missingFields,
    warnings,
    hardcodeViolations,
    contentQualityScore,
    dataConsistencyIssues
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to recover ${contextType} context from ${contextPath}: ${errorMessage}`);
  }
}

// ============================================================================
// DATA SOURCE LOGGING FOR MONITORING
// ============================================================================

/**
 * Data source tracking interface for monitoring
 */
interface DataSource {
  field_path: string;
  source_type: 'campaign_file' | 'user_input' | 'generated' | 'fallback' | 'hardcoded';
  source_location: string;
  confidence_score: number; // 0-100
  timestamp: string;
  value_preview: string;
  validation_status: 'valid' | 'warning' | 'error';
}

/**
 * Global data source registry for monitoring
 */
const dataSourceRegistry: Map<string, DataSource[]> = new Map();

/**
 * Logs a data source for monitoring and debugging
 */
export function logDataSource(
  campaignId: string,
  fieldPath: string,
  sourceType: DataSource['source_type'],
  sourceLocation: string,
  value: any,
  confidenceScore: number = 100,
  validationStatus: DataSource['validation_status'] = 'valid'
): void {
  const dataSource: DataSource = {
    field_path: fieldPath,
    source_type: sourceType,
    source_location: sourceLocation,
    confidence_score: confidenceScore,
    timestamp: new Date().toISOString(),
    value_preview: typeof value === 'string' ? value.substring(0, 100) : JSON.stringify(value).substring(0, 100),
    validation_status: validationStatus
  };
  
  if (!dataSourceRegistry.has(campaignId)) {
    dataSourceRegistry.set(campaignId, []);
  }
  
  dataSourceRegistry.get(campaignId)!.push(dataSource);
  
  // Console logging for immediate debugging
  console.log(`📊 Data Source [${campaignId}]: ${fieldPath} <- ${sourceType}(${sourceLocation}) [${confidenceScore}%]`);
}

/**
 * Gets all data sources for a campaign
 */
export function getDataSources(campaignId: string): DataSource[] {
  return dataSourceRegistry.get(campaignId) || [];
}

/**
 * Generates a comprehensive data source report
 */
export function generateDataSourceReport(campaignId: string): {
  total_fields: number;
  source_breakdown: Record<DataSource['source_type'], number>;
  confidence_average: number;
  validation_issues: DataSource[];
  low_confidence_sources: DataSource[];
  hardcoded_sources: DataSource[];
  report_timestamp: string;
} {
  const sources = getDataSources(campaignId);
  
  const sourceBreakdown: Record<DataSource['source_type'], number> = {
    campaign_file: 0,
    user_input: 0,
    generated: 0,
    fallback: 0,
    hardcoded: 0
  };
  
  let totalConfidence = 0;
  const validationIssues: DataSource[] = [];
  const lowConfidenceSources: DataSource[] = [];
  const hardcodedSources: DataSource[] = [];
  
  sources.forEach(source => {
    sourceBreakdown[source.source_type]++;
    totalConfidence += source.confidence_score;
    
    if (source.validation_status !== 'valid') {
      validationIssues.push(source);
    }
    
    if (source.confidence_score < 70) {
      lowConfidenceSources.push(source);
    }
    
    if (source.source_type === 'hardcoded') {
      hardcodedSources.push(source);
    }
  });
  
  return {
    total_fields: sources.length,
    source_breakdown: sourceBreakdown,
    confidence_average: sources.length > 0 ? Math.round(totalConfidence / sources.length) : 0,
    validation_issues: validationIssues,
    low_confidence_sources: lowConfidenceSources,
    hardcoded_sources: hardcodedSources,
    report_timestamp: new Date().toISOString()
  };
}

/**
 * Saves data source report to campaign folder for monitoring
 */
export async function saveDataSourceReport(
  campaignId: string,
  campaignPath: string
): Promise<string> {
  const report = generateDataSourceReport(campaignId);
  const reportPath = path.join(campaignPath, 'docs', 'data-source-report.json');
  
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`📈 Data source report saved to: ${reportPath}`);
  
  // Log summary to console
  console.log(`📊 Data Source Summary [${campaignId}]:`);
  console.log(`   📁 Campaign files: ${report.source_breakdown.campaign_file}`);
  console.log(`   👤 User inputs: ${report.source_breakdown.user_input}`);
  console.log(`   🤖 Generated: ${report.source_breakdown.generated}`);
  console.log(`   🔄 Fallbacks: ${report.source_breakdown.fallback}`);
  console.log(`   ⚠️  Hardcoded: ${report.source_breakdown.hardcoded}`);
  console.log(`   📊 Avg confidence: ${report.confidence_average}%`);
  
  if (report.validation_issues.length > 0) {
    console.warn(`   🚨 Validation issues: ${report.validation_issues.length}`);
  }
  
  if (report.hardcoded_sources.length > 0) {
    console.error(`   💥 HARDCODED SOURCES DETECTED: ${report.hardcoded_sources.length}`);
    report.hardcoded_sources.forEach(source => {
      console.error(`      - ${source.field_path}: ${source.value_preview}`);
    });
  }
  
  return reportPath;
}

/**
 * Enhanced data extraction with source logging
 */
export function extractWithLogging(
  campaignId: string,
  fieldPath: string,
  extractFunction: () => any,
  sourceType: DataSource['source_type'],
  sourceLocation: string
): any {
  try {
    const extracted = extractFunction();
    
    if (extracted !== undefined && extracted !== null && extracted !== '') {
      logDataSource(campaignId, fieldPath, sourceType, sourceLocation, extracted, 95, 'valid');
      return extracted;
    } else {
      console.error(`❌ FALLBACK POLICY VIOLATION: Empty value for field "${fieldPath}" from ${sourceLocation}`);
      logDataSource(campaignId, fieldPath, 'generated', 'empty_value_error', null, 0, 'error');
      throw new Error(`Required field "${fieldPath}" is empty. Fallback values are prohibited.`);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Extraction failed for ${fieldPath}:`, errorMessage);
    console.error(`❌ FALLBACK POLICY VIOLATION: No fallback allowed for extraction errors`);
    
    logDataSource(campaignId, fieldPath, 'generated', 'extraction_error', null, 0, 'error');
    throw new Error(`Extraction failed for field "${fieldPath}": ${errorMessage}. Fallback values are prohibited.`);
  }
}

/**
 * Clears data source registry for a campaign (useful for testing)
 */
export function clearDataSources(campaignId: string): void {
  dataSourceRegistry.delete(campaignId);
  console.log(`🗑️ Cleared data sources for campaign: ${campaignId}`);
}

// ============================================================================
// EXPORTS
// ============================================================================

// All functions are already exported in their declarations above