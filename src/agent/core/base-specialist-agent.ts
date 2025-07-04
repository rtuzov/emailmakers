import { v4 as uuidv4 } from 'uuid';
import { generateTraceId, delay } from '../utils/tracing-utils';
import { DEFAULT_RETRY_POLICY } from '../../shared/constants';
import { getLogger } from '../../shared/logger';
import { Agent } from '@openai/agents';

/**
 * BaseSpecialistAgent – shared functionality for Content/Design/Quality/Delivery specialists.
 * Provides:
 * • agent/trace initialisation
 * • simple retry helper
 * Reduces duplication across specialist implementations.
 */
export class BaseSpecialistAgent {
  protected readonly agentId: string;
  protected readonly traceId: string;
  /**
   * Proper instance of the OpenAI Agents SDK `Agent`.
   * Using the concrete type ensures we catch SDK-level typing errors at compile time.
   */
  protected readonly agent: Agent;
  protected readonly logger = getLogger({ agent: 'specialist', name: 'base-specialist' });

  protected constructor(name: string, instructions: string, tools: any[] = []) {
    this.agentId = uuidv4();
    this.traceId = generateTraceId();

    // Create a fully-typed SDK Agent instance (complies with latest docs)
    this.agent = new Agent({
      name,
      instructions,
      model: process.env.USAGE_MODEL || 'gpt-4o-mini',
      tools,
    });
  }

  /**
   * Execute operation with tracing
   */
  protected async traced<T>(label: string, op: () => Promise<T>): Promise<T> {
    this.logger.info({ event: 'start', label });
    try {
      const res = await op();
      this.logger.info({ event: 'end', label });
      return res;
    } catch (error) {
      this.logger.error({ event: 'error', label, error });
      throw error;
    }
  }

  /**
   * Generic retry wrapper used by specialist tasks.
   */
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = DEFAULT_RETRY_POLICY.max_retries,
    context: string = 'operation',
  ): Promise<T> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (err) {
        const last = attempt === maxRetries;
        if (last) throw err;
        const backoff = Math.min(DEFAULT_RETRY_POLICY.retry_delay_ms * Math.pow(2, attempt), 10000);
        console.warn(`[${context}] attempt ${attempt + 1} failed, retrying in ${backoff}ms`, err);
        await delay(backoff);
      }
    }
    throw new Error('executeWithRetry: unreachable');
  }
} 