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
  try {
    console.log('📧 generateEmailContent tool called with:', params);
    
    // This tool signals to the OpenAI model that it should generate content
    // The model will see this function call and generate the actual content
    return {
      success: true,
      subject: `Please generate a compelling subject line for: ${params.topic}`,
      preheader: `Please generate a preheader for: ${params.topic}`,
      body: `Please generate email body content for topic: ${params.topic} with ${params.tone} tone in ${params.language} language`,
      cta: 'Please generate a call-to-action button text'
    };
  } catch (error) {
    console.error('❌ generateEmailContent failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 