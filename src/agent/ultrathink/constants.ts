/**
 * UltraThink System Constants
 * Centralized configuration for all magic numbers used throughout the UltraThink system
 */

// Time Constants (milliseconds)
export const TIME_CONSTANTS = {
  ONE_HOUR_MS: 60 * 60 * 1000,
  ONE_MINUTE_MS: 60 * 1000,
  ONE_DAY_MS: 24 * 60 * 60 * 1000,
  
  // History TTL
  EXECUTION_HISTORY_TTL_MS: 60 * 60 * 1000, // 1 hour
  QUALITY_HISTORY_TTL_MS: 60 * 60 * 1000,   // 1 hour
  RATE_LIMIT_WINDOW_MS: 60 * 1000,          // 1 minute
  RECENT_ERRORS_WINDOW_MS: 60 * 60 * 1000,  // 1 hour
  
  // Timeouts
  QUALITY_GATE_TIMEOUT_POST_RENDER: 30000,  // 30 seconds
  QUALITY_GATE_TIMEOUT_PRE_UPLOAD: 15000,   // 15 seconds
  QUALITY_CHECK_DURATION_MS: 25000,         // 25 seconds
  
  // Delays
  STANDARD_RETRY_DELAY_MS: 1000,             // 1 second
} as const;

// Size and Count Limits
export const LIMITS = {
  MAX_EXECUTION_HISTORY_SIZE: 100,
  MAX_QUALITY_HISTORY_SIZE: 50,
  MAX_STRING_LENGTH: 100,
  MAX_CITY_CODE_LENGTH: 5,
  MAX_DATE_STRING_LENGTH: 20,
  MAX_REQUESTS_PER_WINDOW: 100,
  MAX_RETRIES_CRITICAL_TOOLS: 3,
  MAX_TRIP_DURATION_DAYS: 30,
  MIN_DAYS_AHEAD_BOOKING: 2,
  MAX_DAYS_AHEAD_BOOKING: 330, // ~11 months
} as const;

// Quality Control Constants
export const QUALITY_CONSTANTS = {
  DEFAULT_MINIMUM_SCORE: 70,
  DEFAULT_CRITICAL_ISSUE_THRESHOLD: 0,
  DEFAULT_AUTO_RETRY_COUNT: 2,
  QUALITY_CHECK_PRIORITY: 9,
  REGENERATION_SCORE_THRESHOLD: 50,
} as const;

// Price and Popularity Thresholds
export const BUSINESS_THRESHOLDS = {
  HIGH_POPULARITY_THRESHOLD: 8,
  LOW_POPULARITY_THRESHOLD: 4,
  JETLAG_TIMEZONE_THRESHOLD: 6,
  PRICE_INCREASE_WARNING_THRESHOLD: 1.15,
  PRICE_DECREASE_SUGGESTION_THRESHOLD: 0.9,
  HOLIDAY_PRICE_MULTIPLIER: 1.15,
  WEEKEND_PRICE_MULTIPLIER: 1.05,
  SCHOOL_HOLIDAY_PRICE_MULTIPLIER: 1.1,
} as const;

// Tool Configuration Constants
export const TOOL_CONSTANTS = {
  // Estimated execution duration in seconds for each tool
  DURATION_ESTIMATES: {
    'get_current_date': 1,
    'analyze_topic': 3,
    'get_prices': 5,
    'get_figma_assets': 4,
    'generate_copy': 8,
    'render_mjml': 3,
    'diff_html': 2,
    'patch_html': 5,
    'percy_snap': 6,
    'render_test': 8,
    'upload_s3': 3,
    'ai_quality_consultant': 25,
  },
  
  // Base delay for error recovery in milliseconds
  BASE_DELAYS: {
    'get_prices': 5000,
    'get_figma_assets': 10000,
    'generate_copy': 15000,
    'render_mjml': 2000,
    'percy_snap': 5000,
    'render_test': 10000,
    'upload_s3': 3000,
    'ai_quality_consultant': 2000,
  },
  
  // Strategy multipliers for duration estimation
  STRATEGY_MULTIPLIERS: {
    speed: 0.8,
    balanced: 1.0,
    quality: 1.3,
  },
} as const;

// Export type definitions for TypeScript
export type TimeConstants = typeof TIME_CONSTANTS;
export type Limits = typeof LIMITS;
export type QualityConstants = typeof QUALITY_CONSTANTS;
export type BusinessThresholds = typeof BUSINESS_THRESHOLDS;
export type ToolConstants = typeof TOOL_CONSTANTS;