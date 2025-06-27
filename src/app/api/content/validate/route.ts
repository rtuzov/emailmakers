import { NextRequest, NextResponse } from 'next/server';
import { ContentBrief } from '@/domains/email-marketing/entities/content-brief';
import { ZodError } from 'zod';
import { z } from 'zod';

// Validation schema for content brief validation
const ValidateBriefSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  type: z.enum(['text', 'json', 'figma_url']).default('text'),
  title: z.string().optional(),
  description: z.string().optional(),
  brandGuidelines: z.object({
    tone: z.enum(['professional', 'casual', 'friendly', 'formal', 'playful', 'urgent']).optional(),
    voice: z.enum(['authoritative', 'conversational', 'empathetic', 'enthusiastic', 'informative']).optional(),
    values: z.array(z.string()).optional(),
    prohibitedWords: z.array(z.string()).optional(),
    preferredLanguage: z.string().optional()
  }).optional(),
  targetAudience: z.object({
    demographics: z.object({
      ageRange: z.string().optional(),
      gender: z.string().optional(),
      location: z.string().optional(),
      income: z.string().optional(),
      education: z.string().optional()
    }).optional(),
    psychographics: z.object({
      interests: z.array(z.string()),
      values: z.array(z.string()),
      lifestyle: z.array(z.string()),
      painPoints: z.array(z.string())
    }).optional(),
    behavior: z.object({
      purchaseHistory: z.string().optional(),
      engagementLevel: z.enum(['high', 'medium', 'low']).optional(),
      preferredChannels: z.array(z.string()),
      deviceUsage: z.enum(['mobile', 'desktop', 'both'])
    }).optional()
  }).optional()
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    // Validate input schema
    const validatedData = ValidateBriefSchema.parse(body);
    
    // Create ContentBrief based on type
    let brief: ContentBrief;
    
    try {
      switch (validatedData.type) {
        case 'figma_url':
          brief = ContentBrief.fromFigmaURL(
            validatedData.content,
            validatedData.title,
            validatedData.description,
            {
              brandGuidelines: validatedData.brandGuidelines ? {
                tone: validatedData.brandGuidelines.tone || 'professional',
                voice: validatedData.brandGuidelines.voice || 'conversational',
                values: validatedData.brandGuidelines.values || [],
                prohibitedWords: validatedData.brandGuidelines.prohibitedWords || [],
                preferredLanguage: validatedData.brandGuidelines.preferredLanguage || 'en'
              } : undefined,
              targetAudience: validatedData.targetAudience ? {
                demographics: validatedData.targetAudience.demographics || {},
                psychographics: {
                  interests: validatedData.targetAudience.psychographics?.interests || [],
                  values: validatedData.targetAudience.psychographics?.values || [],
                  lifestyle: validatedData.targetAudience.psychographics?.lifestyle || [],
                  painPoints: validatedData.targetAudience.psychographics?.painPoints || []
                },
                behavior: validatedData.targetAudience.behavior || {
                  purchaseHistory: '',
                  engagementLevel: 'medium' as const,
                  preferredChannels: [],
                  deviceUsage: 'both' as const
                }
              } : undefined
            }
          );
          break;
        case 'json':
          brief = ContentBrief.fromJSON(
            validatedData.content,
            validatedData.title,
            validatedData.description
          );
          break;
        default:
          brief = ContentBrief.fromText(
            validatedData.content,
            validatedData.title,
            validatedData.description,
            {
              brandGuidelines: validatedData.brandGuidelines ? {
                tone: validatedData.brandGuidelines.tone || 'professional',
                voice: validatedData.brandGuidelines.voice || 'conversational',
                values: validatedData.brandGuidelines.values || [],
                prohibitedWords: validatedData.brandGuidelines.prohibitedWords || [],
                preferredLanguage: validatedData.brandGuidelines.preferredLanguage || 'en'
              } : undefined,
              targetAudience: validatedData.targetAudience ? {
                demographics: validatedData.targetAudience.demographics || {},
                psychographics: {
                  interests: validatedData.targetAudience.psychographics?.interests || [],
                  values: validatedData.targetAudience.psychographics?.values || [],
                  lifestyle: validatedData.targetAudience.psychographics?.lifestyle || [],
                  painPoints: validatedData.targetAudience.psychographics?.painPoints || []
                },
                behavior: validatedData.targetAudience.behavior || {
                  purchaseHistory: '',
                  engagementLevel: 'medium' as const,
                  preferredChannels: [],
                  deviceUsage: 'both' as const
                }
              } : undefined
            }
          );
      }
    } catch (briefError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid content brief',
          details: briefError instanceof Error ? briefError.message : 'Unknown error creating brief'
        },
        { status: 400 }
      );
    }
    
    // Validate the brief
    const validation = brief.validate();
    
    return NextResponse.json({
      success: true,
      data: {
        isValid: validation.isValid,
        errors: validation.errors,
        briefInfo: {
          id: brief.id,
          type: brief.type,
          wordCount: brief.getWordCount(),
          characterCount: brief.getCharacterCount(),
          hasAttachments: brief.hasAttachments(),
          figmaUrls: brief.getFigmaURLs(),
          createdAt: brief.createdAt
        },
        suggestions: validation.isValid ? [] : [
          ...validation.errors.map(error => `Fix: ${error}`),
          'Ensure content is descriptive and provides clear context',
          'Include brand guidelines for better content generation',
          'Specify target audience for more targeted content'
        ]
      }
    });
    
  } catch (error) {
    console.error('Content validation error:', error);
    
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
    message: 'Content Brief Validation API',
    version: '1.0.0',
    endpoint: 'POST /api/content/validate',
    description: 'Validate content briefs before template generation',
    supportedTypes: ['text', 'json', 'figma_url'],
    requiredFields: ['content'],
    optionalFields: ['title', 'description', 'brandGuidelines', 'targetAudience']
  });
} 