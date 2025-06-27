import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

type PartialDeep<T> = {
  [K in keyof T]?: K extends object ? PartialDeep<T[K]> : T[K];
};

export interface AgentCoreConfig {
  env: 'development' | 'production' | 'test';
  openaiApiKey: string;
  redisUrl?: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  prometheusEnabled: boolean;
  defaultTimeoutMs: number;
}

const defaults: AgentCoreConfig = {
  env: (process.env.NODE_ENV as any) || 'development',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  redisUrl: process.env.REDIS_URL || (process.env.NODE_ENV === 'development' ? 'redis://localhost:6380' : undefined),
  logLevel: (process.env.LOG_LEVEL as any) || 'info',
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