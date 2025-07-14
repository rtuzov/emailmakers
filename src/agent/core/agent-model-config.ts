/**
 * Agent Model Configuration
 * Centralized configuration for OpenAI Agents SDK model selection
 * Uses USAGE_MODEL environment variable to ensure all agents use the same model
 */

import { getUsageModel } from '../../shared/utils/model-config';

/**
 * Get the model to use for OpenAI Agents SDK
 * This ensures all agents use the same model from environment variable
 */
export function getAgentModel(): string {
  const model = getUsageModel();
  console.log(`🤖 [Agent Model Config] Using model: ${model} for all agents`);
  return model;
}

/**
 * Log agent model configuration
 */
export function logAgentModelConfig(): void {
  const model = getAgentModel();
  const envModel = process.env.USAGE_MODEL;
  
  console.log('====================================');
  console.log('🎯 AGENT MODEL CONFIGURATION');
  console.log('====================================');
  console.log(`📌 Environment Variable: USAGE_MODEL=${envModel || 'not set'}`);
  console.log(`🤖 Active Model: ${model}`);
  console.log(`✅ All agents will use: ${model}`);
  console.log('====================================');
}