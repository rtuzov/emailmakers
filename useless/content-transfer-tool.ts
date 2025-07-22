/**
 * Content Specialist Transfer Tool
 * 
 * Handles transfer to Content Specialist and context management
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { run } from '@openai/agents';
import { getErrorMessage } from '../utils/error-handling';

// Base schema for transfer tools
const baseSchema = z.object({
  request: z.string().describe('The request to hand off to the specialist')
});

/**
 * Transfer to Content Specialist tool
 */
export const transferToContentSpecialist = tool({
  name: 'transfer_to_Content_Specialist',
  description: 'Hand off the current request to the Content Specialist agent and return its response',
  parameters: baseSchema,
  execute: async ({ request }, context) => {
    try {
      console.log('🔄 Transferring to Content Specialist with context');
      console.log('📋 Request:', request.slice(0, 100) + '...');
      console.log('📦 Context keys:', context ? Object.keys(context) : 'none');
      
      // Pass context through OpenAI Agents SDK context parameter
      const { contentSpecialistAgent } = await import('../../../core/tool-registry');
      const result = await run(contentSpecialistAgent, request, { context });
      
      // NEW: Persist generated content context into the shared workflow context
      if (result?.finalOutput) {
        // Heuristic: if finalOutput already contains a content_context field – use it; otherwise treat the
        // whole finalOutput object as the context itself (legacy behaviour)
        const extractedContext = (result.finalOutput as any).content_context ?? result.finalOutput;
        if (extractedContext && typeof extractedContext === 'object') {
          context.content_context = extractedContext;
          console.log('💾 Saved content_context into shared context');
        } else {
          console.warn('⚠️ transfer_to_Content_Specialist: finalOutput did not include usable content context');
        }
      } else {
        console.warn('⚠️ transfer_to_Content_Specialist: No finalOutput returned by Content Specialist');
      }

      console.log('✅ Content Specialist completed');
      return result.finalOutput ?? result;
      
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      console.error('❌ Content Specialist transfer failed:', errorMessage);
      return `Content Specialist transfer failed: ${errorMessage}`;
    }
  }
}); 