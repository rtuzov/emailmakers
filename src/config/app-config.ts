/**
 * 🎛️ CENTRALIZED APP CONFIGURATION
 * 
 * Центральный конфигуратор приложения с Zod валидацией
 * Совместим с OpenAI Agents SDK и следует лучшим практикам
 */

import { z } from 'zod';
import { AGENT_CONSTANTS, TRACING_CONSTANTS, API_CONSTANTS } from './constants';

// ============================================================================
// ENVIRONMENT VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema для валидации environment variables
 * Следует OpenAI Agents SDK рекомендациям
 */
export const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Server Configuration
  PORT: z.string().default('3000').transform(Number),
  
  // Database Configuration  
  DATABASE_URL: z.string().min(1, 'Database URL is required'),
  
  // Security Keys
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  ENCRYPTION_KEY: z.string().min(32, 'Encryption key must be at least 32 characters'),
  
  // OpenAI Configuration (следует документации SDK)
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required').describe('OpenAI API key for agents'),
  
  // Anthropic Configuration (fallback)
  ANTHROPIC_API_KEY: z.string().optional().nullable().describe('Anthropic API key for fallback'),
  
  // External Services
  FIGMA_ACCESS_TOKEN: z.string().optional().nullable().describe('Figma API token for design assets'),
  
  // AWS Configuration
  AWS_ACCESS_KEY_ID: z.string().optional().nullable(),
  AWS_SECRET_ACCESS_KEY: z.string().optional().nullable(),
  AWS_REGION: z.string().default('us-east-1'),
  
  // Redis Configuration  
  REDIS_URL: z.string().optional().nullable(),
  
  // OpenAI Agents SDK Configuration (из документации)
  DEBUG: z.string().optional().nullable().describe('Debug logging: openai-agents*'),
  OPENAI_AGENTS_DONT_LOG_MODEL_DATA: z.string().nullable().optional().transform(val => val === '1'),
  OPENAI_AGENTS_DONT_LOG_TOOL_DATA: z.string().nullable().optional().transform(val => val === '1'),
  
  // Custom Application Settings
  MAX_FILE_SIZE_MB: z.string().default('25').transform(Number),
  ENABLE_TRACING: z.string().default('true').transform(val => val === 'true'),
  WORKFLOW_NAME: z.string().default('Email Generation Workflow')
});

// ============================================================================
// AGENT CONFIGURATION SCHEMAS  
// ============================================================================

/**
 * Schema для конфигурации OpenAI Agents SDK
 * Основан на документации ModelSettings и RunConfig
 */
export const agentConfigSchema = z.object({
  // Model Settings (соответствует OpenAI SDK)
  modelSettings: z.object({
    temperature: z.number().min(0).max(2).default(AGENT_CONSTANTS.MODEL_SETTINGS.temperature),
    maxTokens: z.number().positive().default(AGENT_CONSTANTS.MODEL_SETTINGS.max_tokens),
    topP: z.number().min(0).max(1).default(AGENT_CONSTANTS.MODEL_SETTINGS.top_p),
    frequencyPenalty: z.number().min(-2).max(2).default(AGENT_CONSTANTS.MODEL_SETTINGS.frequency_penalty),
    presencePenalty: z.number().min(-2).max(2).default(AGENT_CONSTANTS.MODEL_SETTINGS.presence_penalty),
    toolChoice: z.enum(['auto', 'required', 'none']).default('auto'),
    parallelToolCalls: z.boolean().default(true)
  }).default({}),
  
  // Run Configuration (соответствует RunConfig из документации)
  runConfig: z.object({
    maxTurns: z.number().positive().default(AGENT_CONSTANTS.MAX_TURNS),
    timeout: z.number().positive().default(AGENT_CONSTANTS.DEFAULT_TIMEOUT_MS),
    workflowName: z.string().default(TRACING_CONSTANTS.DEFAULT_WORKFLOW_NAME),
    tracingDisabled: z.boolean().default(false),
    traceIncludeSensitiveData: z.boolean().default(false)
  }).default({}),
  
  // Tool Configuration
  toolConfig: z.object({
    enabledCategories: z.array(z.enum(['content', 'design', 'quality', 'delivery'])).default(['content', 'design', 'quality', 'delivery']),
    maxRetryAttempts: z.number().positive().default(AGENT_CONSTANTS.MAX_RETRY_ATTEMPTS),
    strictMode: z.boolean().default(true).describe('Enable Zod strict mode for tools')
  }).default({})
});

// ============================================================================
// API CONFIGURATION SCHEMAS
// ============================================================================

/**
 * Schema для API конфигурации
 */
export const apiConfigSchema = z.object({
  // Retry Policy (соответствует API_CONSTANTS)
  retryPolicy: z.object({
    maxRetries: z.number().positive().default(API_CONSTANTS.RETRY_POLICY.max_retries),
    retryDelayMs: z.number().positive().default(API_CONSTANTS.RETRY_POLICY.retry_delay_ms),
    retryBackoffMultiplier: z.number().positive().default(API_CONSTANTS.RETRY_POLICY.retry_backoff_multiplier),
    maxRetryDelayMs: z.number().positive().default(API_CONSTANTS.RETRY_POLICY.max_retry_delay_ms)
  }).default({}),
  
  // Timeouts
  timeouts: z.object({
    apiRequest: z.number().positive().default(API_CONSTANTS.TIMEOUTS.API_REQUEST),
    openaiRequest: z.number().positive().default(API_CONSTANTS.TIMEOUTS.OPENAI_REQUEST),
    anthropicRequest: z.number().positive().default(API_CONSTANTS.TIMEOUTS.ANTHROPIC_REQUEST),
    figmaRequest: z.number().positive().default(API_CONSTANTS.TIMEOUTS.FIGMA_REQUEST),
    databaseQuery: z.number().positive().default(API_CONSTANTS.TIMEOUTS.DATABASE_QUERY)
  }).default({}),
  
  // Rate Limits
  rateLimits: z.object({
    openaiRpm: z.number().positive().default(API_CONSTANTS.RATE_LIMITS.OPENAI_RPM),
    anthropicRpm: z.number().positive().default(API_CONSTANTS.RATE_LIMITS.ANTHROPIC_RPM),
    internalApiRps: z.number().positive().default(API_CONSTANTS.RATE_LIMITS.INTERNAL_API_RPS)
  }).default({})
});

// ============================================================================
// TRACING CONFIGURATION SCHEMAS
// ============================================================================

/**
 * Schema для конфигурации трейсинга
 * Соответствует OpenAI Agents SDK tracing architecture
 */
export const tracingConfigSchema = z.object({
  // Basic Tracing Settings
  enabled: z.boolean().default(true),
  workflowName: z.string().default(TRACING_CONSTANTS.DEFAULT_WORKFLOW_NAME),
  includeSensitiveData: z.boolean().default(TRACING_CONSTANTS.EXPORT_CONFIG.include_sensitive_data),
  
  // Performance Settings
  performance: z.object({
    batchTimeoutMs: z.number().positive().default(TRACING_CONSTANTS.PERFORMANCE.batch_timeout_ms),
    maxBatchSize: z.number().positive().default(TRACING_CONSTANTS.PERFORMANCE.max_batch_size),
    maxQueueSize: z.number().positive().default(TRACING_CONSTANTS.PERFORMANCE.max_queue_size),
    exportTimeoutMs: z.number().positive().default(TRACING_CONSTANTS.PERFORMANCE.export_timeout_ms)
  }).default({}),
  
  // Export Configuration
  exportConfig: z.object({
    maxSpanEvents: z.number().positive().default(TRACING_CONSTANTS.EXPORT_CONFIG.max_span_events),
    maxSpanLinks: z.number().positive().default(TRACING_CONSTANTS.EXPORT_CONFIG.max_span_links),
    maxSpanAttributeLength: z.number().positive().default(TRACING_CONSTANTS.EXPORT_CONFIG.max_span_attribute_length)
  }).default({})
});

// ============================================================================
// MAIN APPLICATION CONFIG SCHEMA
// ============================================================================

/**
 * Основная schema для конфигурации всего приложения
 */
export const appConfigSchema = z.object({
  env: envSchema,
  agent: agentConfigSchema,
  api: apiConfigSchema,
  tracing: tracingConfigSchema
});

export type AppConfig = z.infer<typeof appConfigSchema>;
export type EnvConfig = z.infer<typeof envSchema>;
export type AgentConfig = z.infer<typeof agentConfigSchema>;
export type ApiConfig = z.infer<typeof apiConfigSchema>;
export type TracingConfig = z.infer<typeof tracingConfigSchema>;

// ============================================================================
// CONFIGURATION LOADER AND VALIDATOR
// ============================================================================

/**
 * Загружает и валидирует конфигурацию из environment variables
 * Следует лучшим практикам OpenAI Agents SDK
 */
export function loadAndValidateConfig(): AppConfig {
  try {
    // Валидируем environment variables
    const env = envSchema.parse(process.env);
    
    // Создаем конфигурацию по умолчанию
    const defaultConfig = {
      env,
      agent: {},
      api: {},
      tracing: {
        enabled: env.ENABLE_TRACING,
        workflowName: env.WORKFLOW_NAME,
        includeSensitiveData: !env.OPENAI_AGENTS_DONT_LOG_MODEL_DATA
      }
    };
    
    // Валидируем полную конфигурацию
    const config = appConfigSchema.parse(defaultConfig);
    
    console.log('✅ Configuration loaded and validated successfully');
    console.log(`📊 Environment: ${config.env.NODE_ENV}`);
    console.log(`🤖 Agents SDK: Model ${config.agent.modelSettings.temperature}temp, ${config.agent.modelSettings.maxTokens}tokens`);
    console.log(`📈 Tracing: ${config.tracing.enabled ? 'enabled' : 'disabled'} (${config.tracing.workflowName})`);
    
    return config;
    
  } catch (error) {
    console.error('❌ Configuration validation failed:');
    
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        console.error(`  • ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      console.error(`  • ${error}`);
    }
    
    throw new Error('Invalid application configuration');
  }
}

/**
 * Validates specific configuration section
 */
export function validateConfigSection<T>(
  schema: z.ZodSchema<T>, 
  data: unknown, 
  sectionName: string
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    console.error(`❌ ${sectionName} configuration validation failed:`);
    
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        console.error(`  • ${err.path.join('.')}: ${err.message}`);
      });
    }
    
    throw new Error(`Invalid ${sectionName} configuration`);
  }
}

// ============================================================================
// SINGLETON CONFIGURATION INSTANCE
// ============================================================================

let configInstance: AppConfig | null = null;

/**
 * Получает singleton instance конфигурации
 * Lazy loading с валидацией
 */
export function getAppConfig(): AppConfig {
  if (!configInstance) {
    configInstance = loadAndValidateConfig();
  }
  return configInstance;
}

/**
 * Обновляет конфигурацию (для тестов)
 */
export function resetConfig(): void {
  configInstance = null;
}

// ============================================================================
// CONVENIENCE GETTERS
// ============================================================================

/**
 * Быстрый доступ к часто используемым настройкам
 */
export const config = {
  get env() {
    return getAppConfig().env;
  },
  
  get agent() {
    return getAppConfig().agent;
  },
  
  get api() {
    return getAppConfig().api;
  },
  
  get tracing() {
    return getAppConfig().tracing;
  },
  
  get isDevelopment() {
    return getAppConfig().env.NODE_ENV === 'development';
  },
  
  get isProduction() {
    return getAppConfig().env.NODE_ENV === 'production';
  },
  
  get isTest() {
    return getAppConfig().env.NODE_ENV === 'test';
  }
};

// Export default config for convenient usage
export default config;