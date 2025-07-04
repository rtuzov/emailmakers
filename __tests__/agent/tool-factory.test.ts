import { createAgentTools } from '../../src/agent/tool-factory';

describe('tool-factory', () => {
  test('returns all expected tool names', () => {
    const tools = createAgentTools();
    const names = tools.map(t => (t as any).name);
    expect(names).toEqual(
      expect.arrayContaining([
        'figma_asset_manager',
        'pricing_intelligence',
        'content_generator',
        'email_renderer',
        'quality_controller',
        'delivery_manager',
        'context_provider',
      ])
    );
  });
}); 