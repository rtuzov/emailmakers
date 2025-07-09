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
    console.warn(`Invalid model "${model}" in USAGE_MODEL, falling back to gpt-4o-mini`);
    return 'gpt-4o-mini';
  }
  return model;
}; 