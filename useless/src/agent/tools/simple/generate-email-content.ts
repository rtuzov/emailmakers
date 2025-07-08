import { z } from 'zod';

/**
 * Simple email content generation tool for OpenAI Agents SDK
 */

export const generateEmailContentSchema = z.object({
  topic: z.string().describe('Topic of the email'),
  tone: z.string().describe('Tone of the email (friendly, professional, urgent)'),
  language: z.string().describe('Language code (ru, en)'),
  target_audience: z.string().describe('Target audience (use empty string if not specified)'),
  campaign_type: z.string().describe('Type of campaign (promotional, newsletter, use empty string if not specified)')
});

export type GenerateEmailContentParams = z.infer<typeof generateEmailContentSchema>;

export interface GenerateEmailContentResult {
  success: boolean;
  subject?: string;
  preheader?: string;
  body?: string;
  cta?: string;
  error?: string;
}

/**
 * Generate email content - this tool will be called by OpenAI Agents SDK
 * The actual content generation happens through the model's instructions
 */
export async function generateEmailContent(params: GenerateEmailContentParams): Promise<GenerateEmailContentResult> {
  throw new Error('generate-email-content tool disabled by policy.');
} 