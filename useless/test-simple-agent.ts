/**
 * Simple Agent Test - Minimal Tool Set
 * Test to identify the hosted_tool issue
 */

import { Agent, tool, run } from '@openai/agents';
import { z } from 'zod';

// Simple test tool
const testTool = tool({
  name: 'test_tool',
  description: 'Simple test tool',
  parameters: z.object({
    message: z.string().describe('Test message')
  }),
  execute: async ({ message }) => {
    console.log(`Test tool executed: ${message}`);
    return `Processed: ${message}`;
  }
});

// Create simple agent
const testAgent = new Agent({
  name: 'Test Agent',
  instructions: 'You are a test agent. Use the test_tool to respond.',
  model: 'gpt-4o-mini',
  tools: [testTool]
});

async function testAgent() {
  try {
    console.log('🧪 Testing simple agent...');
    const result = await run(testAgent, 'Test message for agent');
    console.log('✅ Test successful:', result);
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

if (require.main === module) {
  testAgent();
}

export { testAgent, testTool }; 