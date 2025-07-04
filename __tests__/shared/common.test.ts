import { generateTraceId, delay, mapCampaignType } from '../../src/agent/utils/common';

describe('utils/common', () => {
  test('generateTraceId returns unique ids', () => {
    const id1 = generateTraceId();
    const id2 = generateTraceId();
    expect(id1).not.toEqual(id2);
  });

  test('delay resolves after given time', async () => {
    const start = Date.now();
    await delay(100);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(90);
  });

  test('mapCampaignType maps unknown to promotional', () => {
    expect(mapCampaignType('unknown' as any)).toBe('promotional');
  });
}); 