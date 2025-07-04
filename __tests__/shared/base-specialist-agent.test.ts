import { BaseSpecialistAgent } from '../../src/agent/core/base-specialist-agent';

class DummyAgent extends BaseSpecialistAgent {
  public async alwaysFails() {
    return this.executeWithRetry(async () => {
      throw new Error('fail');
    }, 1, 'alwaysFails');
  }
}

describe('BaseSpecialistAgent', () => {
  test('executeWithRetry retries and eventually throws', async () => {
    const agent = new DummyAgent('dummy', 'test');
    const start = Date.now();
    await expect(agent.alwaysFails()).rejects.toThrow('fail');
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual( DEFAULT_RETRY_POLICY.retry_delay_ms );
  });
}); 