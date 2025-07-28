import { config } from 'dotenv';
import * as path from 'path';

// ✅ Load .env.local first to ensure it's available everywhere
config({ path: path.resolve(process.cwd(), '.env.local') });

// ✅ Load other env files as fallback
config({ path: path.resolve(process.cwd(), '.env') });

/**
 * Environment configuration with strict validation
 * Loads .env.local and other env files for all processes
 */
export const ENV_CONFIG = {
  // OpenAI Configuration
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  AI_TEMPERATURE: parseFloat(process.env.AI_TEMPERATURE || '0.3'),
  AI_MAX_TOKENS: parseInt(process.env.AI_MAX_TOKENS || '1000'),
  USAGE_MODEL: process.env.USAGE_MODEL || process.env.NEXT_PUBLIC_USAGE_MODEL || 'gpt-4o-mini',

  // Unsplash Configuration
  UNSPLASH_ACCESS_KEY: process.env.UNSPLASH_ACCESS_KEY,

  // Application Configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

  // Validation
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
} as const;

/**
 * Validates required environment variables
 * Throws error if critical variables are missing
 */
export function validateEnvironment(): void {
  const required = [
    'OPENAI_API_KEY',
    'UNSPLASH_ACCESS_KEY'
  ] as const;

  const missing = required.filter(key => !ENV_CONFIG[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => {
      console.error(`   - ${key}`);
    });
    console.error('❌ Please check your .env.local file');
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  console.log('✅ Environment variables validated successfully');
  console.log(`   - OpenAI API Key: ${ENV_CONFIG.OPENAI_API_KEY?.substring(0, 10)}...`);
  console.log(`   - Unsplash Access Key: ${ENV_CONFIG.UNSPLASH_ACCESS_KEY?.substring(0, 10)}...`);
  console.log(`   - Model: ${ENV_CONFIG.USAGE_MODEL}`);
  console.log(`   - Environment: ${ENV_CONFIG.NODE_ENV}`);
}

// ✅ Auto-validate on import (only in development)
if (ENV_CONFIG.isDevelopment && typeof window === 'undefined') {
  try {
    validateEnvironment();
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    // Don't throw in import to avoid breaking builds
  }
} 