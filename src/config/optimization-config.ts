/**
 * 🚀 PRODUCTION OPTIMIZATION CONFIGURATION
 * 
 * Configuration for the optimization system in production environment.
 * This enables auto-optimization with production-safe settings.
 */

export interface ProductionOptimizationConfig {
  enabled: boolean;
  auto_optimization: boolean;
  require_approval_for_critical: boolean;
  max_auto_optimizations_per_day: number;
  min_confidence_threshold: number;
  metrics_collection_interval_ms: number;
  analysis_interval_ms: number;
  
  // Safety settings
  emergency_stop_enabled: boolean;
  rollback_timeout_minutes: number;
  max_concurrent_optimizations: number;
  
  // ML settings
  ml_enabled: boolean;
  auto_scaling_enabled: boolean;
  human_oversight_required: boolean;
  prediction_confidence_threshold: number;
  
  // Dashboard settings
  dashboard_refresh_interval_ms: number;
  real_time_monitoring: boolean;
  alert_thresholds: {
    low_health_score: number;
    high_error_rate: number;
    slow_response_time_ms: number;
  };
}

export const PRODUCTION_OPTIMIZATION_CONFIG: ProductionOptimizationConfig = {
  // Core settings
  enabled: true,
  auto_optimization: true,
  require_approval_for_critical: true,
  max_auto_optimizations_per_day: 50,
  min_confidence_threshold: 85,
  metrics_collection_interval_ms: 30000, // 30 seconds
  analysis_interval_ms: 300000, // 5 minutes
  
  // Safety settings
  emergency_stop_enabled: true,
  rollback_timeout_minutes: 15,
  max_concurrent_optimizations: 3,
  
  // ML settings
  ml_enabled: true,
  auto_scaling_enabled: true,
  human_oversight_required: true,
  prediction_confidence_threshold: 80,
  
  // Dashboard settings
  dashboard_refresh_interval_ms: 10000, // 10 seconds
  real_time_monitoring: true,
  alert_thresholds: {
    low_health_score: 70,
    high_error_rate: 10, // 10%
    slow_response_time_ms: 2000
  }
};

export const DEVELOPMENT_OPTIMIZATION_CONFIG: ProductionOptimizationConfig = {
  ...PRODUCTION_OPTIMIZATION_CONFIG,
  auto_optimization: false, // Safer for development
  require_approval_for_critical: true,
  max_auto_optimizations_per_day: 10,
  min_confidence_threshold: 70,
  metrics_collection_interval_ms: 60000, // 1 minute
  analysis_interval_ms: 600000, // 10 minutes
  human_oversight_required: false, // Less restrictive for testing
  alert_thresholds: {
    low_health_score: 60,
    high_error_rate: 15,
    slow_response_time_ms: 3000
  }
};

/**
 * Get optimization configuration based on environment
 */
export function getOptimizationConfig(): ProductionOptimizationConfig {
  const isProduction = process.env.NODE_ENV === 'production';
  const config = isProduction ? PRODUCTION_OPTIMIZATION_CONFIG : DEVELOPMENT_OPTIMIZATION_CONFIG;
  
  console.log(`🔧 Loading ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} optimization config`);
  
  return config;
}

/**
 * Validate optimization configuration
 */
export function validateOptimizationConfig(config: ProductionOptimizationConfig): boolean {
  const requiredFields = [
    'enabled', 'auto_optimization', 'require_approval_for_critical',
    'max_auto_optimizations_per_day', 'min_confidence_threshold'
  ];
  
  for (const field of requiredFields) {
    if (config[field as keyof ProductionOptimizationConfig] === undefined) {
      console.error(`❌ Missing required optimization config field: ${field}`);
      return false;
    }
  }
  
  // Validate ranges
  if (config.min_confidence_threshold < 0 || config.min_confidence_threshold > 100) {
    console.error('❌ min_confidence_threshold must be between 0-100');
    return false;
  }
  
  if (config.max_auto_optimizations_per_day < 1) {
    console.error('❌ max_auto_optimizations_per_day must be at least 1');
    return false;
  }
  
  console.log('✅ Optimization configuration validated successfully');
  return true;
}

/**
 * Override configuration with environment variables
 */
export function applyEnvironmentOverrides(config: ProductionOptimizationConfig): ProductionOptimizationConfig {
  const overrides: Partial<ProductionOptimizationConfig> = {};
  
  // Check for environment variable overrides
  if (process.env.OPTIMIZATION_ENABLED !== undefined) {
    overrides.enabled = process.env.OPTIMIZATION_ENABLED === 'true';
  }
  
  if (process.env.AUTO_OPTIMIZATION_ENABLED !== undefined) {
    overrides.auto_optimization = process.env.AUTO_OPTIMIZATION_ENABLED === 'true';
  }
  
  if (process.env.OPTIMIZATION_MAX_PER_DAY !== undefined) {
    overrides.max_auto_optimizations_per_day = parseInt(process.env.OPTIMIZATION_MAX_PER_DAY, 10);
  }
  
  if (process.env.OPTIMIZATION_CONFIDENCE_THRESHOLD !== undefined) {
    overrides.min_confidence_threshold = parseInt(process.env.OPTIMIZATION_CONFIDENCE_THRESHOLD, 10);
  }
  
  if (process.env.ML_AUTO_SCALING_ENABLED !== undefined) {
    overrides.auto_scaling_enabled = process.env.ML_AUTO_SCALING_ENABLED === 'true';
  }
  
  if (Object.keys(overrides).length > 0) {
    console.log('🔧 Applied environment variable overrides:', overrides);
  }
  
  return { ...config, ...overrides };
}