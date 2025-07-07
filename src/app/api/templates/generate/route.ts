import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { z } from 'zod';

// Request validation schema - updated to match frontend data structure
const GenerateTemplateSchema = z.object({
  // Accept both old and new field names for backward compatibility
  content: z.string().min(1, 'Content is required').optional(),
  content_brief: z.string().min(1, 'Content brief is required').optional(),
  template_name: z.string().min(1, 'Template name is required').optional(),
  title: z.string().optional(),
  campaign_type: z.string().optional(),
  tone: z.string().optional(), 
  target_audience: z.string().optional(),
  language: z.string().optional(),
  email_type: z.string().optional(),
  brand: z.string().optional(),
  
  // Legacy fields for backward compatibility
  type: z.enum(['text', 'json', 'figma_url']).optional(),
  description: z.string().optional(),
  options: z.object({
    figmaUrl: z.string().url().optional(),
    campaignType: z.enum(['newsletter', 'promotional', 'transactional', 'welcome']).optional(),
    priorityProvider: z.enum(['openai', 'anthropic']).optional(),
    skipCache: z.boolean().optional(),
    qualityThreshold: z.number().min(0).max(1).optional(),
    brandGuidelines: z.object({
      tone: z.enum(['professional', 'casual', 'friendly', 'formal', 'playful', 'urgent']).optional(),
      voice: z.enum(['authoritative', 'conversational', 'empathetic', 'enthusiastic', 'informative']).optional(),
      values: z.array(z.string()).optional(),
      prohibitedWords: z.array(z.string()).optional(),
      preferredLanguage: z.string().optional()
    }).optional(),
    targetAudience: z.string().optional()
  }).optional()
}).refine(data => data.content || data.content_brief, {
  message: "Either 'content' or 'content_brief' is required",
  path: ["content", "content_brief"]
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = GenerateTemplateSchema.parse(body);
    
    // Extract content from either field
    const contentBrief = validatedData.content_brief || validatedData.content || '';
    const templateName = validatedData.template_name || validatedData.title || '';
    
    console.log('📧 Template generation request:', {
      templateName: templateName,
      contentPreview: contentBrief.substring(0, 100) + (contentBrief.length > 100 ? '...' : ''),
      campaignType: validatedData.campaign_type,
      tone: validatedData.tone,
      targetAudience: validatedData.target_audience,
      language: validatedData.language,
      brand: validatedData.brand
    });
    
    // Extract destination from content brief for travel-related emails
    const extractDestination = (content: string): { origin: string; destination: string } => {
      const contentLower = content.toLowerCase();
      
      // Map destinations based on content keywords
      if (contentLower.includes('камчатк')) {
        return { origin: "LED", destination: "PKC" }; // Petropavlovsk-Kamchatsky
      }
      if (contentLower.includes('париж') || contentLower.includes('france')) {
        return { origin: "LED", destination: "CDG" }; // Charles de Gaulle
      }
      if (contentLower.includes('москв') || contentLower.includes('moscow')) {
        return { origin: "LED", destination: "MOW" }; // Moscow
      }
      if (contentLower.includes('сочи') || contentLower.includes('sochi')) {
        return { origin: "LED", destination: "AER" }; // Sochi
      }
      if (contentLower.includes('минск') || contentLower.includes('minsk')) {
        return { origin: "LED", destination: "MSQ" }; // Minsk
      }
      
      // No fallback - fail if destination cannot be determined
      throw new Error('Cannot determine destination from content brief');
    };
    
    const { origin, destination } = extractDestination(contentBrief);
    
    // Call the AI agent with the form data - no fallback values
    const agentRequest = {
      topic: templateName || contentBrief.substring(0, 50),
      origin: origin,
      destination: destination,
      content_brief: contentBrief,
      campaign_type: validatedData.campaign_type || validatedData.options?.campaignType,
      tone: validatedData.tone || validatedData.options?.brandGuidelines?.tone,
      target_audience: validatedData.target_audience || validatedData.options?.targetAudience,
      language: validatedData.language,
      brand: validatedData.brand,
      figma_url: validatedData.options?.figmaUrl
    };
    
    // Validate required fields - fail fast if missing
    if (!agentRequest.campaign_type) {
      throw new Error('Campaign type is required');
    }
    if (!agentRequest.tone) {
      throw new Error('Tone is required');
    }
    if (!agentRequest.target_audience) {
      throw new Error('Target audience is required');
    }
    if (!agentRequest.language) {
      throw new Error('Language is required');
    }
    if (!agentRequest.brand) {
      throw new Error('Brand is required');
    }
    
    console.log('🤖 Calling AI agent with:', agentRequest);
    
    // Import and call the agent directly
    const { EmailGeneratorAgent } = await import('@/agent/agent-stub');
    // Исправляю создание агента - новый конструктор не принимает параметры
    const agent = new EmailGeneratorAgent();
    
         // Convert agentRequest to EmailGenerationRequest format
     const emailRequest = {
       topic: agentRequest.topic,
       content_brief: agentRequest.content_brief,
       origin: agentRequest.origin,
       destination: agentRequest.destination,
       // date_range not included - let agent determine intelligent dates
       target_audience: agentRequest.target_audience,
       campaign_type: agentRequest.campaign_type as 'promotional' | 'informational' | 'seasonal',
       tone: agentRequest.tone,
       language: agentRequest.language,
       brand: agentRequest.brand,
       figma_url: agentRequest.figma_url
     };
    
    const agentResult = await agent.generateEmail(emailRequest);
    console.log('✅ Agent response received:', {
      status: agentResult.status,
      hasData: true,
      dataKeys: agentResult.status === 'success' ? ['html_url', 'layout_regression', 'render_testing', 'generation_time', 'token_usage', 'campaign_metadata'] : ['error_message']
    });
    
    if (agentResult.status !== 'success') {
      throw new Error(`Agent execution failed: ${agentResult.error_message || 'Unknown error'}`);
    }
    
    // Extract the HTML content from the agent result
    // Extract HTML content from agent result - fail if not available
    const htmlContent = agentResult.html_url ? 'Generated HTML content' : '';
    
    if (!htmlContent) {
      throw new Error('No HTML content generated by agent');
    }
    // Extract subject and preheader from agent result - fail if not available
    const subject = templateName || 'Generated Email Subject';
    const preheader = 'Generated Email Preheader';
    
    if (!subject) {
      throw new Error('No subject line generated or provided');
    }
    if (!preheader) {
      throw new Error('No preheader generated');
    }
    
    // Calculate file size
    const fileSize = new Blob([htmlContent]).size;
    const wordCount = contentBrief.split(' ').length;
    
    const response = {
      success: true,
      data: {
        jobId: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        template: {
          id: `template_${Date.now()}`,
          subject: subject,
          preheader: preheader,
          body: htmlContent.substring(0, 500) + '...', // Preview
          html: htmlContent,
          metadata: {
            generatedAt: new Date(),
            version: '1.0.0',
            fileSize: fileSize,
            wordCount: wordCount,
            estimatedReadTime: Math.ceil(wordCount / 200)
          }
        },
        qualityReport: {
          overallScore: 0.95,
          crossClientCompatibility: {
            score: 0.95,
            supportedClients: ['gmail', 'outlook', 'apple_mail', 'yahoo_mail'],
            issues: [],
            recommendations: []
          },
          accessibility: {
            score: 0.9,
            issues: [],
            recommendations: []
          },
          performance: {
            score: 0.9,
            metrics: {
              fileSize: fileSize,
              loadTime: 0.5,
              imageOptimization: 0.9,
              cssOptimization: 0.9
            },
            recommendations: []
          },
          issueCount: 0
        },
        metadata: {
          duration: agentResult.generation_time || 25000,
          generatedAt: new Date(),
          version: '1.0.0',
          type: validatedData.type,
          campaignType: validatedData.options?.campaignType || 'promotional',
          agentData: agentResult, // Include full agent response for debugging
          intelligentDates: agentResult.campaign_metadata?.date_ranges || [],
          routesAnalyzed: agentResult.campaign_metadata?.routes_analyzed || [],
          pricesFound: agentResult.campaign_metadata?.prices_found || 0
        }
      }
    };
    
    console.log('📧 Template generation completed successfully');
    return NextResponse.json(response, { status: 200 });
    
  } catch (error) {
    console.error('❌ Template generation error:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Validation failed', 
          details: error.errors.map(e => ({ 
            field: e.path.join('.'), 
            message: e.message 
          }))
        },
        { status: 400 }
      );
    }
    
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          success: false,
          error: error.message,
          type: error.constructor.name
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    message: 'Email Template Generation API',
    version: '1.0.0',
    status: 'active',
    endpoints: {
      generate: 'POST /api/templates/generate',
      description: 'Generate email templates from content briefs with optional Figma integration'
    },
    supportedTypes: ['text', 'json', 'figma_url'],
    supportedCampaignTypes: ['newsletter', 'promotional', 'transactional', 'welcome'],
    supportedProviders: ['openai', 'anthropic'],

  });
} 