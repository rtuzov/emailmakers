/**
 * Centralized model configuration utility
 * Allows changing the AI model in one place via USAGE_MODEL environment variable
 */

// Type definitions for supported models
export type SupportedModel = 
  | 'gpt-4o-mini';

// Model validation
export const isValidModel = (model: string): model is SupportedModel => {
  const supportedModels: SupportedModel[] = [
    'gpt-4o-mini'
  ];
  return supportedModels.includes(model as SupportedModel);
};

// Usage model providers
export const getUsageModel = (): string => {
  const envModel = process.env.USAGE_MODEL;
  return envModel && isValidModel(envModel) ? envModel : 'gpt-4o-mini';
};

export const getPublicUsageModel = (): string => {
  const envModel = process.env.NEXT_PUBLIC_USAGE_MODEL;
  return envModel && isValidModel(envModel) ? envModel : 'gpt-4o-mini';
};

// Get model with validation
export const getValidatedUsageModel = (): SupportedModel => {
  const model = getUsageModel();
  if (!isValidModel(model)) {
    throw new Error(`❌ INVALID MODEL CONFIGURATION: Model "${model}" is not supported. Valid models are: gpt-3.5-turbo, gpt-4o-mini, gpt-4o, claude-3-5-sonnet-20241022. Please check your USAGE_MODEL environment variable.`);
  }
  return model;
}; 