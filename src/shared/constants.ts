export const BRAND_COLORS = {
  PRIMARY: '#4BFF7E',
  SECONDARY: '#1DA857',
  TERTIARY: '#2C3959',
} as const;

export const DEFAULT_RETRY_POLICY = {
  max_retries: 2,
  retry_delay_ms: 1000,
  retry_on_failure: true,
} as const;

export const QUALITY_SCORE_THRESHOLD = 85;

export const CAMPAIGN_TYPES = [
  'promotional',
  'informational',
  'seasonal',
  'urgent',
  'newsletter',
] as const;

export type CampaignType = typeof CAMPAIGN_TYPES[number];

export const BRAND_REGEX = /(#4BFF7E|#1DA857|#2C3959)/i;

export const RETRY_BACKOFF_MAX = 10_000; // ms 