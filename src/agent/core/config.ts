import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// ============================================================================
// FAIL-FAST POLICY: Any warning should be treated as a fatal error
// ============================================================================
console.warn = (...args: unknown[]): never => {
  // Re-emit through console.error for visibility
  console.error('❌ WARNING TREATED AS ERROR:', ...args);
  // Throw to halt execution immediately
  throw new Error(
    args.length > 0 ? `Warning escalated to error: ${String(args[0])}` : 'Warning escalated to error.'
  );
};

type PartialDeep<T> = {
  [K in keyof T]?: K extends object ? PartialDeep<T[K]> : T[K];
};

export interface AgentCoreConfig {
  env: 'development' | 'production' | 'test';
  openaiApiKey: string;
  redisUrl?: string | undefined;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  prometheusEnabled: boolean;
  defaultTimeoutMs: number;
}

const defaults: AgentCoreConfig = {
  env: (process.env.NODE_ENV as any) ?? 'development',
  openaiApiKey: process.env.OPENAI_API_KEY ?? '',
  redisUrl: process.env.REDIS_URL ?? (process.env.NODE_ENV === 'development' ? 'redis://localhost:6380' : undefined),
  logLevel: (process.env.LOG_LEVEL as any) ?? 'info',
  prometheusEnabled: process.env.PROMETHEUS_ENABLED !== 'false',
  defaultTimeoutMs: 30_000,
};

let current: AgentCoreConfig = { ...defaults };

export function getConfig(): AgentCoreConfig {
  return current;
}

export function updateConfig(overrides: PartialDeep<AgentCoreConfig>) {
  current = { ...current, ...overrides } as AgentCoreConfig;
} 