import { tool } from '@openai/agents';
import { z } from 'zod';
import { run } from '@openai/agents';
import {
  contentSpecialistAgent,
  designSpecialistAgent,
  qualitySpecialistAgent,
  deliverySpecialistAgent
} from './tool-registry';

// ---------------------------------------------------------------------------
// TRANSFER TOOLS
// ---------------------------------------------------------------------------

const baseSchema = z.object({
  request: z.string().describe('The user request or prompt to pass to the target specialist')
});

export const transferToContentSpecialist = tool({
  name: 'transfer_to_Content_Specialist',
  description: 'Hand off the current request to the Content Specialist agent and return its response',
  parameters: baseSchema,
  execute: async ({ request }) => {
    const result = await run(contentSpecialistAgent, request);
    return result.finalOutput ?? result;
  }
});

export const transferToDesignSpecialist = tool({
  name: 'transfer_to_Design_Specialist',
  description: 'Hand off the current request to the Design Specialist agent and return its response',
  parameters: baseSchema,
  execute: async ({ request }) => {
    const result = await run(designSpecialistAgent, request);
    return result.finalOutput ?? result;
  }
});

export const transferToQualitySpecialist = tool({
  name: 'transfer_to_Quality_Specialist',
  description: 'Hand off the current request to the Quality Specialist agent and return its response',
  parameters: baseSchema,
  execute: async ({ request }) => {
    const result = await run(qualitySpecialistAgent, request);
    return result.finalOutput ?? result;
  }
});

export const transferToDeliverySpecialist = tool({
  name: 'transfer_to_Delivery_Specialist',
  description: 'Hand off the current request to the Delivery Specialist agent and return its response',
  parameters: baseSchema,
  execute: async ({ request }) => {
    const result = await run(deliverySpecialistAgent, request);
    return result.finalOutput ?? result;
  }
});

// Convenience export collection
export const transferTools = [
  transferToContentSpecialist,
  transferToDesignSpecialist,
  transferToQualitySpecialist,
  transferToDeliverySpecialist
]; 