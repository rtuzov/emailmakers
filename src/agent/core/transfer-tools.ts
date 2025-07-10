/**
 * 🔄 CONTEXT-AWARE TRANSFER TOOLS - OpenAI Agents SDK Compatible
 * 
 * Updated transfer tools that properly pass context between specialists
 * through the OpenAI Agents SDK context parameter system.
 * 
 * These tools maintain the orchestrator workflow while ensuring
 * proper context continuity throughout the agent handoff process.
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { run } from '@openai/agents';
import {
  dataCollectionSpecialistAgent,
  contentSpecialistAgent,
  designSpecialistAgent,
  qualitySpecialistAgent,
  deliverySpecialistAgent
} from './tool-registry';

// ============================================================================
// CONTEXT-AWARE TRANSFER TOOLS
// ============================================================================

const baseSchema = z.object({
  request: z.string().describe('The user request or prompt to pass to the target specialist')
});

export const transferToDataCollectionSpecialist = tool({
  name: 'transfer_to_Data_Collection_Specialist',
  description: 'Hand off the current request to the Data Collection Specialist agent for LLM-powered data gathering and return its response',
  parameters: baseSchema,
  execute: async ({ request }, context) => {
    console.log('🔄 Transferring to Data Collection Specialist with context');
    console.log('📋 Request:', request.slice(0, 100) + '...');
    console.log('📦 Context keys:', context ? Object.keys(context) : 'none');
    
    // Pass context through OpenAI Agents SDK context parameter
    const result = await run(dataCollectionSpecialistAgent, request, { context });
    
    console.log('✅ Data Collection Specialist completed');
    return result.finalOutput ?? result;
  }
});

export const transferToContentSpecialist = tool({
  name: 'transfer_to_Content_Specialist',
  description: 'Hand off the current request to the Content Specialist agent and return its response',
  parameters: baseSchema,
  execute: async ({ request }, context) => {
    console.log('🔄 Transferring to Content Specialist with context');
    console.log('📋 Request:', request.slice(0, 100) + '...');
    console.log('📦 Context keys:', context ? Object.keys(context) : 'none');
    
    // Pass context through OpenAI Agents SDK context parameter
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
  }
});

export const transferToDesignSpecialist = tool({
  name: 'transfer_to_Design_Specialist',
  description: 'Hand off the current request to the Design Specialist agent and return its response',
  parameters: baseSchema,
  execute: async ({ request }, context) => {
    console.log('🔄 Transferring to Design Specialist with context');
    console.log('📋 Request:', request.slice(0, 100) + '...');
    console.log('📦 Context keys:', context ? Object.keys(context) : 'none');
    
    // Pass context through OpenAI Agents SDK context parameter
    const result = await run(designSpecialistAgent, request, { context });
    
    console.log('✅ Design Specialist completed');
    return result.finalOutput ?? result;
  }
});

export const transferToQualitySpecialist = tool({
  name: 'transfer_to_Quality_Specialist',
  description: 'Hand off the current request to the Quality Specialist agent and return its response',
  parameters: baseSchema,
  execute: async ({ request }, context) => {
    console.log('🔄 Transferring to Quality Specialist with context');
    console.log('📋 Request:', request.slice(0, 100) + '...');
    console.log('📦 Context keys:', context ? Object.keys(context) : 'none');
    
    // Pass context through OpenAI Agents SDK context parameter
    const result = await run(qualitySpecialistAgent, request, { context });
    
    console.log('✅ Quality Specialist completed');
    return result.finalOutput ?? result;
  }
});

export const transferToDeliverySpecialist = tool({
  name: 'transfer_to_Delivery_Specialist',
  description: 'Hand off the current request to the Delivery Specialist agent and return its response',
  parameters: baseSchema,
  execute: async ({ request }, context) => {
    console.log('🔄 Transferring to Delivery Specialist with context');
    console.log('📋 Request:', request.slice(0, 100) + '...');
    console.log('📦 Context keys:', context ? Object.keys(context) : 'none');
    
    // Pass context through OpenAI Agents SDK context parameter
    const result = await run(deliverySpecialistAgent, request, { context });
    
    console.log('✅ Delivery Specialist completed');
    return result.finalOutput ?? result;
  }
});

// Convenience export collection (in workflow order)
export const transferTools = [
  transferToDataCollectionSpecialist,
  transferToContentSpecialist,
  transferToDesignSpecialist,
  transferToQualitySpecialist,
  transferToDeliverySpecialist
]; 