import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { z } from 'zod';

// Validation schema for Figma design system extraction
const ExtractDesignSystemSchema = z.object({
  figmaUrl: z.string().url('Invalid Figma URL format'),
  options: z.object({
    skipCache: z.boolean().optional(),
    includeAssets: z.boolean().optional(),
    includeComponents: z.boolean().optional(),
    includeTokens: z.boolean().optional(),
    optimizeForEmail: z.boolean().optional()
  }).optional()
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = ExtractDesignSystemSchema.parse(body);
    
    // Import FigmaService - fail fast if not available
    const { FigmaService } = await import('@/domains/design-system/services/figma-service');
    
    // Extract design system from Figma - no fallback, fail if service fails
    const figmaService = new FigmaService({
      accessToken: process.env.FIGMA_ACCESS_TOKEN || '',
      rateLimitBuffer: 10,
      cacheTimeout: 300000, // 5 minutes
      maxRetries: 3,
      emailCompatibilityChecks: true
    });
    const designSystem = await figmaService.extractDesignSystem(
      validatedData.figmaUrl
    );
    
    return NextResponse.json({
      success: true,
      data: { designSystem }
    });
    
  } catch (error) {
    console.error('Design system extraction error:', error);
    
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
    
    if (error instanceof Error && error.message.includes('Invalid Figma URL')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid Figma URL',
          details: 'Please provide a valid Figma file URL'
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
    message: 'Design System Extraction API',
    version: '1.0.0',
    status: 'active',
    endpoint: 'POST /api/design-system/extract',
    description: 'Extract design tokens, components, and assets from Figma URLs',
    supportedFeatures: [
      'Color token extraction with email-safe validation',
      'Typography token extraction with web-safe fallbacks',
      'Spacing token extraction',
      'Component mapping to MJML equivalents',
      'Asset optimization for email clients',
      'Dark mode variant generation'
    ],
    requiredFields: ['figmaUrl'],
    optionalFields: ['options']
  });
} 