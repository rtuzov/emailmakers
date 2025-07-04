import { run } from '@openai/agents';

export async function runWithTimeout<T = any>(agent: any, prompt: string, timeoutMs = 30_000): Promise<T> {
  return Promise.race([
    agent ? (run as any)(agent, prompt) as Promise<T> : Promise.reject(new Error('Agent missing')), // use SDK run helper
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Tool call timed out after ${timeoutMs} ms`)), timeoutMs)
    ),
  ]);
} 