/**
 * Phase 13.1: T11 AI Quality Consultant Tool
 * 
 * Agent tool wrapper for the AI Quality Consultant system.
 * Integrates intelligent quality improvement into the email generation pipeline.
 */

import { z } from 'zod';
import { AIQualityConsultant } from './ai-consultant/ai-consultant';
import { 
  AIConsultantRequest,
  AIConsultantResponse,
  AIConsultantConfig,
  QualityAnalysisResult,
  ImprovementIteration
} from './ai-consultant/types';
import { getValidatedUsageModel } from '../../shared/utils/model-config';
import { AgentEmailAnalyzer } from './ai-consultant/agent-analyzer';

// Zod schema for agent tool parameters
export const aiQualityConsultantSchema = z.object({
  // Email content (может быть сокращенным для оптимизации)
  html_content: z.string().describe('Generated email HTML content (может быть сокращенным с ...[truncated])'),
  mjml_source: z.string().optional().nullable().describe('Original MJML source code'),
  campaign_id: z.string().optional().nullable().describe('Campaign ID для загрузки полного HTML из файла'),
  topic: z.string().describe('Email campaign topic'),
  
  // Скриншоты для визуального анализа
  screenshots: z.object({
    desktop: z.string().optional().nullable().describe('Base64 encoded desktop screenshot'),
    mobile: z.string().optional().nullable().describe('Base64 encoded mobile screenshot'),
    tablet: z.string().optional().nullable().describe('Base64 encoded tablet screenshot')
  }).optional().nullable().describe('Screenshots from generate_screenshots tool'),
  
  // Campaign context
  target_audience: z.string().optional().nullable().describe('Target audience for the campaign'),
  campaign_type: z.enum(['promotional', 'informational', 'seasonal']),
  
  // Assets from previous tools
  assets_used: z.object({
    original_assets: z.array(z.string()),
    processed_assets: z.array(z.string()),
    sprite_metadata: z.string().optional().nullable()
  }).optional().nullable().describe('Assets used from T1/T10 tools'),
  
  // Pricing data from T2
  prices: z.object({
    origin: z.string().optional().nullable(),
    destination: z.string().optional().nullable(),
    cheapest_price: z.number().optional().nullable(),
    currency: z.string().optional().nullable(),
    date_range: z.string().optional().nullable()
  }).optional().nullable().describe('Price data from get_prices tool'),
  
  // Content metadata from T3
  content_metadata: z.object({
    subject: z.string().optional().nullable(),
    tone: z.string().optional().nullable(),
    language: z.string().optional().nullable(),
    word_count: z.number().optional().nullable()
  }).optional().nullable().describe('Content metadata from generate_copy tool'),
  
  // Render test results from T8
  render_test_results: z.object({
    overall_score: z.number(),
    client_compatibility: z.object({}).passthrough().optional().nullable(),
    issues_found: z.array(z.string()).optional().nullable()
  }).optional().nullable().describe('Results from render_test tool'),
  
  // Improvement iteration tracking
  iteration_count: z.number().describe('Current improvement iteration number'),
  previous_analysis: z.object({
    overall_score: z.number(),
    quality_grade: z.enum(['A', 'B', 'C', 'D', 'F']),
    recommendations: z.array(z.string())
  }).optional().nullable().describe('Previous quality analysis results'),
  improvement_history: z.array(z.object({
    iteration: z.number(),
    score: z.number(),
    changes_made: z.array(z.string())
  })).optional().nullable().describe('History of improvement iterations'),
  
  // Configuration overrides
  config_overrides: z.object({
    quality_gate_threshold: z.number().optional().nullable(),
    max_iterations: z.number().optional().nullable(),
    enable_auto_execution: z.boolean().optional().nullable(),
    max_recommendations: z.number().optional().nullable()
  }).optional().nullable().describe('Configuration overrides for AI consultant')
});

export type AIQualityConsultantParams = z.infer<typeof aiQualityConsultantSchema>;

/**
 * T11 AI Quality Consultant Tool
 * 
 * Provides intelligent quality analysis and improvement recommendations
 * for email campaigns with automated execution capabilities.
 */
export async function aiQualityConsultant(params: AIQualityConsultantParams) {
  try {
    console.log(`🤖 T11: AI Quality Consultant starting for topic: ${params.topic}`);
    
    // Initialize OpenAI Agents SDK once (idempotent)
    try {
      await AgentEmailAnalyzer.initializeSDK();
    } catch (sdkError) {
      console.warn('⚠️ T11: SDK already initialized or initialization failed:', sdkError.message);
    }
    
    // Получаем полный HTML если он сокращен
    let fullHtml = params.html_content;
    if (params.html_content?.includes('...[truncated]') && params.campaign_id) {
      console.log('🔄 T11: HTML is truncated, loading full version from file...');
      try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const htmlPath = path.join(process.cwd(), 'mails', params.campaign_id, 'email.html');
        fullHtml = await fs.readFile(htmlPath, 'utf8');
        console.log(`✅ T11: Loaded full HTML from file: ${fullHtml.length} characters`);
      } catch (error) {
        console.warn('⚠️ T11: Could not load full HTML from file, using provided HTML:', error.message);
        // Пытаемся восстановить HTML убрав маркер truncated
        fullHtml = params.html_content.replace('...[truncated]', '');
      }
    }
    
    // Create AI consultant with configuration
    const config: Partial<AIConsultantConfig> = {
      quality_gate_threshold: params.config_overrides?.quality_gate_threshold || 70,
      max_iterations: params.config_overrides?.max_iterations || 3,
      enable_auto_execution: params.config_overrides?.enable_auto_execution ?? true,
      max_recommendations: params.config_overrides?.max_recommendations || 10,
      ai_model: getValidatedUsageModel(),
      analysis_temperature: 0.3,
      enable_image_analysis: true,
      enable_brand_compliance: true,
      enable_accessibility_checks: true
    };
    
    const consultant = new AIQualityConsultant(config);
    
    // Prepare consultant request
    const consultantRequest: AIConsultantRequest = {
      html_content: fullHtml, // Используем полный HTML
      mjml_source: params.mjml_source || '',
      topic: params.topic,
      target_audience: params.target_audience || undefined,
      campaign_type: params.campaign_type,
      assets_used: {
        original_assets: params.assets_used?.original_assets || [],
        processed_assets: params.assets_used?.processed_assets || [],
        sprite_metadata: params.assets_used?.sprite_metadata || undefined
      },
      prices: params.prices ? {
        origin: params.prices.origin,
        destination: params.prices.destination,
        cheapest_price: params.prices.cheapest_price,
        currency: params.prices.currency,
        date_range: params.prices.date_range
      } : undefined,
      content_metadata: params.content_metadata ? {
        subject: params.content_metadata.subject,
        tone: params.content_metadata.tone,
        language: params.content_metadata.language,
        word_count: params.content_metadata.word_count
      } : undefined,
      render_test_results: params.render_test_results ? {
        overall_score: params.render_test_results.overall_score,
        client_compatibility: params.render_test_results.client_compatibility,
        issues_found: params.render_test_results.issues_found
      } : undefined,
      previous_analysis: params.previous_analysis ? {
        overall_score: params.previous_analysis.overall_score,
        quality_grade: params.previous_analysis.quality_grade,
        quality_gate_passed: params.previous_analysis.overall_score >= 70,
        dimension_scores: {
          content_quality: 0,
          visual_appeal: 0,
          technical_compliance: 0,
          emotional_resonance: 0,
          brand_alignment: 0
        },
        recommendations: [],
        auto_executable_count: 0,
        manual_approval_count: 0,
        critical_issues_count: 0,
        improvement_potential: 0,
        estimated_final_score: params.previous_analysis.overall_score,
        max_achievable_score: 100,
        analysis_time: 0,
        confidence_level: 0.8,
        analyzed_elements: []
      } : undefined,
      iteration_count: params.iteration_count,
      improvement_history: (params.improvement_history || []).map(item => ({
        iteration_number: item.iteration,
        timestamp: new Date(),
        initial_score: item.score,
        final_score: item.score,
        score_improvement: 0,
        recommendations_applied: item.changes_made,
        execution_results: [],
        total_time: 0,
        success: true,
        error_message: undefined,
        consultant_response: undefined
      }))
    };
    
    // Get AI consultation with detailed logging
    console.log(`🔍 T11: Starting AI quality analysis...`);
    console.log(`📋 T11: Request details: Topic="${params.topic}", Campaign="${params.campaign_type}", Iteration=${params.iteration_count}`);
    console.log(`📸 T11: Screenshots available: Desktop=${!!params.screenshots?.desktop}, Mobile=${!!params.screenshots?.mobile}, Tablet=${!!params.screenshots?.tablet}`);
    
    // Добавляем скриншоты в запрос консультанта
    if (params.screenshots) {
      consultantRequest.screenshots = params.screenshots;
    }
    
    const consultation = await consultant.consultOnQuality(consultantRequest);
    
    // Log detailed analysis results
    console.log(`\n🤖 === AI QUALITY CONSULTANT ANALYSIS ===`);
    console.log(`📊 Overall Score: ${consultation.analysis.overall_score}/100`);
    console.log(`🎯 Quality Grade: ${consultation.analysis.quality_grade}`);
    console.log(`🔍 Issues Found: ${consultation.analysis.critical_issues_count} critical`);
    
    if (consultation.analysis.critical_issues_count > 0) {
      console.log(`\n⚠️ Critical Issues Identified: ${consultation.analysis.critical_issues_count}`);
    }
    
    console.log(`\n💡 Recommendations (${consultation.analysis.recommendations.length}):`);
    consultation.analysis.recommendations.forEach((rec, i) => {
      console.log(`  ${i + 1}. [${rec.priority}] ${rec.title}`);
      console.log(`     📝 ${rec.description}`);
      console.log(`     📈 Expected improvement: ${rec.estimated_improvement}%`);
      console.log(`     ⏱️ Estimated time: ${rec.estimated_time}`);
      if (rec.auto_execute) {
        console.log(`     🤖 Auto-executable: ${rec.agent_command || 'Yes'}`);
      }
    });
    
    console.log(`\n🎯 Next Actions:`);
    consultation.next_actions.forEach((action, i) => {
      console.log(`  ${i + 1}. ${action.type}: ${action.description}`);
    });
    
    console.log(`🚦 Quality Gate: ${consultation.analysis.overall_score >= 70 ? '✅ PASSED' : '❌ FAILED'}`);
    
    // Improved status messages
    if (consultation.analysis.overall_score >= 70) {
      console.log(`✅ Next Action: Ready for delivery`);
    } else if (consultation.should_continue) {
      console.log(`🔧 Next Action: Auto-fix available - will attempt improvements`);
    } else {
      console.log(`🛑 Next Action: Manual intervention required or max iterations reached`);
    }
    
    if (consultation.completion_reason) {
      console.log(`📝 Status: ${consultation.completion_reason}`);
    }
    console.log(`🤖 === END AI CONSULTANT ANALYSIS ===\n`);
    
    // Format response for agent
    const response = formatConsultationResponse(consultation, params);
    
    console.log(`✅ T11: Analysis complete - Score: ${consultation.analysis.overall_score}/100, Grade: ${consultation.analysis.quality_grade}`);
    console.log(`🎯 T11: ${consultation.analysis.recommendations.length} recommendations generated`);
    
    return response;
    
  } catch (error) {
    console.error('❌ T11: AI Quality Consultant failed:', error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

/**
 * Format consultation response for agent consumption
 */
function formatConsultationResponse(consultation: AIConsultantResponse, params: AIQualityConsultantParams) {
  const { analysis, execution_plan, next_actions, should_continue, completion_reason } = consultation;
  
  // Determine primary next action
  const primaryAction = next_actions[0];
  let nextActionType = 'complete';
  let actionDescription = 'Email quality is acceptable';
  
  if (primaryAction) {
    nextActionType = primaryAction.type;
    actionDescription = primaryAction.description;
  }
  
  // Format recommendations for easy consumption
  const formattedRecommendations = analysis.recommendations.map(rec => ({
    id: rec.id,
    type: rec.type,
    priority: rec.priority,
    category: rec.category,
    title: rec.title,
    description: rec.description,
    reasoning: rec.reasoning,
    estimated_improvement: rec.estimated_improvement,
    estimated_time: rec.estimated_time,
    auto_execute: rec.auto_execute,
    requires_approval: rec.requires_approval,
    agent_command: rec.agent_command
  }));
  
  // Create execution summary
  const executionSummary = {
    total_recommendations: execution_plan.total_recommendations,
    auto_executable: execution_plan.auto_execute_actions.length,
    manual_approval: execution_plan.manual_approval_actions.length,
    critical_review: execution_plan.critical_review_actions.length,
    estimated_time: execution_plan.estimated_total_time
  };
  
  return {
    // Core results
    success: true,
    quality_gate_passed: analysis.quality_gate_passed,
    score: analysis.overall_score,
    grade: analysis.quality_grade,
    confidence: analysis.confidence_level,
    
    // Dimensional breakdown
    dimension_scores: analysis.dimension_scores,
    improvement_potential: analysis.improvement_potential,
    estimated_final_score: analysis.estimated_final_score,
    
    // Recommendations and actions
    recommendations: formattedRecommendations,
    execution_summary: executionSummary,
    next_action: nextActionType,
    action_description: actionDescription,
    
    // Workflow control
    should_continue: should_continue,
    completion_reason: completion_reason,
    iteration_count: params.iteration_count,
    
    // Auto-execution commands (if any)
    auto_execute_commands: execution_plan.auto_execute_actions,
    manual_approval_commands: execution_plan.manual_approval_actions,
    
    // Analytics
    analysis_time: analysis.analysis_time,
    analyzed_elements: analysis.analyzed_elements.length,
    
    // Status message
    message: generateStatusMessage(analysis, nextActionType, should_continue)
  };
}

/**
 * Generate human-readable status message
 */
function generateStatusMessage(analysis: QualityAnalysisResult, nextAction: string, shouldContinue: boolean): string {
  const score = analysis.overall_score;
  const grade = analysis.quality_grade;
  const recCount = analysis.recommendations.length;
  
  if (analysis.quality_gate_passed) {
    return `✅ Quality gate PASSED! Score: ${score}/100 (Grade ${grade}). Email ready for delivery.`;
  }
  
  // Quality gate failed - explain what happens next
  if (nextAction === 'auto_execute' && shouldContinue) {
    return `🔄 Quality gate FAILED (${score}/100, Grade ${grade}). Auto-fixing ${analysis.auto_executable_count} issues now...`;
  }
  
  if (nextAction === 'request_approval') {
    return `👤 Quality gate FAILED (${score}/100, Grade ${grade}). ${analysis.manual_approval_count} improvements need your approval.`;
  }
  
  if (nextAction === 'escalate') {
    return `⚠️ Quality gate FAILED (${score}/100, Grade ${grade}). Critical issues detected - manual review required.`;
  }
  
  if (!shouldContinue) {
    return `⏹️ Quality gate FAILED (${score}/100, Grade ${grade}). ${recCount} recommendations available, but improvement potential limited.`;
  }
  
  return `📊 Quality gate FAILED (${score}/100, Grade ${grade}). ${recCount} recommendations available for improvement.`;
}

// Export the tool configuration
export const aiQualityConsultantTool = {
  name: 'ai_quality_consultant',
  description: 'T11: Intelligent email quality analysis and improvement recommendations',
  parameters: aiQualityConsultantSchema,
  function: aiQualityConsultant
};

export { AIQualityConsultant } from './ai-consultant/ai-consultant';
export * from './ai-consultant/types';