/**
 * Centralized model configuration utility
 * Allows changing the AI model in one place via USAGE_MODEL environment variable
 */

export const getUsageModel = (): string => {
  return process.env.USAGE_MODEL || 'gpt-4o-mini';
};

export const getPublicUsageModel = (): string => {
  return process.env.NEXT_PUBLIC_USAGE_MODEL || 'gpt-4o-mini';
};

// Type definitions for supported models
export type SupportedModel = 
  | 'gpt-4o-mini'
  | 'gpt-4o' 
  | 'gpt-4'
  | 'gpt-3.5-turbo'
  | 'claude-3-5-sonnet-20241022';

// Model validation
export const isValidModel = (model: string): model is SupportedModel => {
  const supportedModels: SupportedModel[] = [
    'gpt-4o-mini',
    'gpt-4o',
    'gpt-4',
    'gpt-3.5-turbo',
    'claude-3-5-sonnet-20241022'
  ];
  return supportedModels.includes(model as SupportedModel);
};

// Get model with validation
export const getValidatedUsageModel = (): SupportedModel => {
  const model = getUsageModel();
  if (!isValidModel(model)) {
    console.warn(`Invalid model "${model}" in USAGE_MODEL, falling back to gpt-4o-mini`);
    return 'gpt-4o-mini';
  }
  return model;
}; 