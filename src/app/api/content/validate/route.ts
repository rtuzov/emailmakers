import { NextRequest, NextResponse } from 'next/server';
import { ContentBrief } from '@/domains/email-marketing/entities/content-brief';
import { ZodError } from 'zod';
import { z } from 'zod';

// Validation schema for content brief validation
const ValidateBriefSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  type: z.enum(['text', 'json', 'figma_url']).optional().nullable(),
  title: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  brandGuidelines: z.object({
    tone: z.enum(['professional', 'casual', 'friendly', 'formal', 'playful', 'urgent']).optional().nullable(),
    voice: z.enum(['authoritative', 'conversational', 'empathetic', 'enthusiastic', 'informative']).optional().nullable(),
    values: z.array(z.string()).optional().nullable(),
    prohibitedWords: z.array(z.string()).optional().nullable(),
    preferredLanguage: z.string().optional().nullable()
  }).optional().nullable(),
  targetAudience: z.object({
    demographics: z.object({
      ageRange: z.string().optional().nullable(),
      gender: z.string().optional().nullable(),
      location: z.string().optional().nullable(),
      income: z.string().optional().nullable(),
      education: z.string().optional().nullable()
    }).optional().nullable(),
    psychographics: z.object({
      interests: z.array(z.string()),
      values: z.array(z.string()),
      lifestyle: z.array(z.string()),
      painPoints: z.array(z.string())
    }).optional().nullable(),
    behavior: z.object({
      purchaseHistory: z.string().optional().nullable(),
      engagementLevel: z.enum(['high', 'medium', 'low']).optional().nullable(),
      preferredChannels: z.array(z.string()),
      deviceUsage: z.enum(['mobile', 'desktop', 'both'])
    }).optional().nullable()
  }).optional().nullable()
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    // Validate input schema
    const validatedData = ValidateBriefSchema.parse(body);
    
    // Create ContentBrief based on type
    let brief: ContentBrief;
    
    // Determine type - fail if not provided
    const briefType = validatedData.type || 'text';
    
    switch (briefType) {
      case 'figma_url':
        brief = ContentBrief.fromFigmaURL(
          validatedData.content,
          validatedData.title || undefined,
          validatedData.description || undefined,
          {
            ...(validatedData.brandGuidelines && {
              brandGuidelines: {
                tone: validatedData.brandGuidelines.tone || 'professional',
                voice: validatedData.brandGuidelines.voice || 'conversational',
                values: validatedData.brandGuidelines.values || [],
                prohibitedWords: validatedData.brandGuidelines.prohibitedWords || [],
                preferredLanguage: validatedData.brandGuidelines.preferredLanguage || 'en'
              }
            }),
            ...(validatedData.targetAudience && {
              targetAudience: {
                demographics: {
                  ...(validatedData.targetAudience.demographics?.ageRange !== undefined && validatedData.targetAudience.demographics?.ageRange !== null && { ageRange: validatedData.targetAudience.demographics.ageRange }),
                  ...(validatedData.targetAudience.demographics?.gender !== undefined && validatedData.targetAudience.demographics?.gender !== null && { gender: validatedData.targetAudience.demographics.gender }),
                  ...(validatedData.targetAudience.demographics?.location !== undefined && validatedData.targetAudience.demographics?.location !== null && { location: validatedData.targetAudience.demographics.location }),
                  ...(validatedData.targetAudience.demographics?.income !== undefined && validatedData.targetAudience.demographics?.income !== null && { income: validatedData.targetAudience.demographics.income }),
                  ...(validatedData.targetAudience.demographics?.education !== undefined && validatedData.targetAudience.demographics?.education !== null && { education: validatedData.targetAudience.demographics.education })
                },
                psychographics: {
                  interests: validatedData.targetAudience.psychographics?.interests || [],
                  values: validatedData.targetAudience.psychographics?.values || [],
                  lifestyle: validatedData.targetAudience.psychographics?.lifestyle || [],
                  painPoints: validatedData.targetAudience.psychographics?.painPoints || []
                },
                behavior: {
                  ...(validatedData.targetAudience.behavior?.purchaseHistory !== undefined && validatedData.targetAudience.behavior?.purchaseHistory !== null && { purchaseHistory: validatedData.targetAudience.behavior.purchaseHistory }),
                  ...(validatedData.targetAudience.behavior?.engagementLevel !== undefined && validatedData.targetAudience.behavior?.engagementLevel !== null && { engagementLevel: validatedData.targetAudience.behavior.engagementLevel }),
                  preferredChannels: validatedData.targetAudience.behavior?.preferredChannels || [],
                  deviceUsage: validatedData.targetAudience.behavior?.deviceUsage || 'both'
                }
              }
            })
          }
        );
        break;
      case 'json':
        brief = ContentBrief.fromJSON(
          validatedData.content,
          validatedData.title || undefined,
          validatedData.description || undefined
        );
        break;
      case 'text':
        brief = ContentBrief.fromText(
          validatedData.content,
          validatedData.title || undefined,
          validatedData.description || undefined,
          {
            ...(validatedData.brandGuidelines && {
              brandGuidelines: {
                tone: validatedData.brandGuidelines.tone || 'professional',
                voice: validatedData.brandGuidelines.voice || 'conversational',
                values: validatedData.brandGuidelines.values || [],
                prohibitedWords: validatedData.brandGuidelines.prohibitedWords || [],
                preferredLanguage: validatedData.brandGuidelines.preferredLanguage || 'en'
              }
            }),
            ...(validatedData.targetAudience && {
              targetAudience: {
                demographics: {
                  ...(validatedData.targetAudience.demographics?.ageRange !== undefined && validatedData.targetAudience.demographics?.ageRange !== null && { ageRange: validatedData.targetAudience.demographics.ageRange }),
                  ...(validatedData.targetAudience.demographics?.gender !== undefined && validatedData.targetAudience.demographics?.gender !== null && { gender: validatedData.targetAudience.demographics.gender }),
                  ...(validatedData.targetAudience.demographics?.location !== undefined && validatedData.targetAudience.demographics?.location !== null && { location: validatedData.targetAudience.demographics.location }),
                  ...(validatedData.targetAudience.demographics?.income !== undefined && validatedData.targetAudience.demographics?.income !== null && { income: validatedData.targetAudience.demographics.income }),
                  ...(validatedData.targetAudience.demographics?.education !== undefined && validatedData.targetAudience.demographics?.education !== null && { education: validatedData.targetAudience.demographics.education })
                },
                psychographics: {
                  interests: validatedData.targetAudience.psychographics?.interests || [],
                  values: validatedData.targetAudience.psychographics?.values || [],
                  lifestyle: validatedData.targetAudience.psychographics?.lifestyle || [],
                  painPoints: validatedData.targetAudience.psychographics?.painPoints || []
                },
                behavior: {
                  ...(validatedData.targetAudience.behavior?.purchaseHistory !== undefined && validatedData.targetAudience.behavior?.purchaseHistory !== null && { purchaseHistory: validatedData.targetAudience.behavior.purchaseHistory }),
                  ...(validatedData.targetAudience.behavior?.engagementLevel !== undefined && validatedData.targetAudience.behavior?.engagementLevel !== null && { engagementLevel: validatedData.targetAudience.behavior.engagementLevel }),
                  preferredChannels: validatedData.targetAudience.behavior?.preferredChannels || [],
                  deviceUsage: validatedData.targetAudience.behavior?.deviceUsage || 'both'
                }
              }
            })
          }
        );
        break;
      default:
        throw new Error(`Unsupported content type: ${briefType}`);
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