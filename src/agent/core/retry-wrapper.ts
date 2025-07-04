import { DEFAULT_RETRY_POLICY, RETRY_BACKOFF_MAX } from '../../shared/constants';
import { delay } from '../utils/common';
import { getLogger } from '../../shared/logger';

const log = getLogger({ module: 'retry-wrapper' });

export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = DEFAULT_RETRY_POLICY.max_retries,
  context: string = 'operation'
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      if (attempt === maxRetries) throw err;
      const backoff = Math.min(DEFAULT_RETRY_POLICY.retry_delay_ms * Math.pow(2, attempt), RETRY_BACKOFF_MAX);
      log.warn({ context, attempt: attempt + 1, backoff, err }, 'retrying');
      await delay(backoff);
    }
  }
  throw new Error('executeWithRetry reached unreachable code');
} 