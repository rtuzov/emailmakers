/**
 * 📝 CONTENT SPECIALIST AGENT - Updated for OpenAI Agents SDK
 * 
 * Updated wrapper for the new Content Specialist Agent structure
 * Uses the specialized agent from tool-registry.ts
 */

import { run } from '@openai/agents';
import { contentSpecialistAgent } from '../core/tool-registry';

// ============================================================================
// CONTENT SPECIALIST WRAPPER
// ============================================================================

/**
 * Execute content specialist tasks using the new agent structure
 */
export async function executeContentSpecialistTask(input: any, options?: any): Promise<any> {
  try {
    console.log('🎯 [CONTENT SPECIALIST] Starting task execution with new agent structure');
    
    // Build prompt based on input type
    const prompt = buildPromptFromInput(input);
    
    // Execute using the specialized agent
    const result = await run(contentSpecialistAgent, prompt);
    
    console.log('✅ [CONTENT SPECIALIST] Task completed successfully');
    
    return {
      success: true,
      data: result.finalOutput,
      metadata: {
        specialist: 'content',
        timestamp: new Date().toISOString(),
        input_type: input.task_type || 'unknown'
      }
    };
    
  } catch (error) {
    console.error('❌ [CONTENT SPECIALIST] Task execution failed:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        specialist: 'content',
        timestamp: new Date().toISOString()
      }
    };
  }
}

/**
 * Build appropriate prompt based on input
 */
function buildPromptFromInput(input: any): string {
  const taskType = input.task_type || 'general';
  
  switch (taskType) {
    case 'campaign_creation':
      return `Create a new email campaign with the following details:
Campaign Name: ${input.campaign_name || 'Untitled Campaign'}
Brand: ${input.brand_name || 'Unknown Brand'}
Type: ${input.campaign_type || 'promotional'}
Target Audience: ${input.target_audience || 'General audience'}
Goals: ${input.campaign_goals?.join(', ') || 'Engagement and conversion'}

Please use the createCampaignFolder tool to set up the campaign structure.`;

    case 'content_generation':
      return `Generate email content for a campaign with these requirements:
Topic: ${input.topic || 'General promotion'}
Tone: ${input.tone || 'professional'}
Target Audience: ${input.target_audience || 'frequent travelers'}
Language: ${input.language || 'ru'}
Content Type: ${input.content_type || 'email'}

Please use the contentGenerator tool to create comprehensive email content.`;

    case 'pricing_analysis':
      return `Analyze pricing for flight route:
Origin: ${input.origin}
Destination: ${input.destination}
Date Range: ${input.date_range}
Analysis Depth: ${input.analysis_depth || 'advanced'}

Please use the pricingIntelligence tool to gather current pricing data.`;

    case 'context_analysis':
      return `Provide contextual analysis for campaign:
Target Date: ${input.target_date || 'current'}
Context Type: ${input.context_type || 'comprehensive'}
Destination: ${input.destination || 'various'}

Please use the contextProvider tool to analyze market and seasonal context.`;
        
      case 'date_intelligence':
      return `Analyze optimal timing for campaign:
Target Date: ${input.target_date}
Analysis Type: ${input.analysis_type || 'comprehensive'}
Region: ${input.region || 'global'}

Please use the dateIntelligence tool to provide timing insights.`;

    case 'asset_strategy':
      return `Plan visual asset strategy for campaign:
Campaign Type: ${input.campaign_type}
Brand Guidelines: ${input.brand_guidelines || 'Standard brand guidelines'}
Target Audience: ${input.target_audience || 'General audience'}
Message Tone: ${input.message_tone || 'professional'}

Please use the assetStrategy tool to plan visual requirements.`;
        
      default:
      return `Process the following content specialist request:
${JSON.stringify(input, null, 2)}

Please analyze the request and use the appropriate tools to complete the task.`;
  }
}

/**
 * Get Content Specialist capabilities
 */
export function getContentSpecialistCapabilities() {
  return {
    name: 'Content Specialist',
    description: 'Handles campaign creation, content generation, pricing intelligence, and context analysis',
    available_tools: [
      'createCampaignFolder',
      'contentGenerator', 
      'pricingIntelligence',
      'contextProvider',
      'dateIntelligence',
      'assetStrategy',
      'transferToDesignSpecialist'
    ],
    workflow_phase: 'content',
    next_specialist: 'design'
  };
}

/**
 * Legacy wrapper class for backward compatibility
 */
export class ContentSpecialistAgentWrapper {
  async executeTask(input: any): Promise<any> {
    return executeContentSpecialistTask(input);
  }
}

// Export the agent for direct use
export { contentSpecialistAgent } from '../core/tool-registry';