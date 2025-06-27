import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { z } from 'zod';

// Validation schema for Figma design system extraction
const ExtractDesignSystemSchema = z.object({
  figmaUrl: z.string().url('Invalid Figma URL format'),
  options: z.object({
    skipCache: z.boolean().optional(),
    includeAssets: z.boolean().default(true),
    includeComponents: z.boolean().default(true),
    includeTokens: z.boolean().default(true),
    optimizeForEmail: z.boolean().default(true)
  }).optional()
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = ExtractDesignSystemSchema.parse(body);
    
    // Mock response for demonstration - in production this would use FigmaService
    const mockResponse = {
      success: true,
      data: {
        designSystem: {
          tokens: {
            colors: [
              {
                name: 'primary',
                value: '#007bff',
                emailSafe: true,
                darkModeVariant: '#0d6efd'
              },
              {
                name: 'secondary',
                value: '#6c757d',
                emailSafe: true,
                darkModeVariant: '#495057'
              }
            ],
            typography: [
              {
                name: 'heading',
                fontFamily: 'Arial',
                fontSize: 24,
                fontWeight: 700,
                lineHeight: 1.2,
                emailSafe: true,
                fallbacks: ['Helvetica', 'sans-serif']
              },
              {
                name: 'body',
                fontFamily: 'Arial',
                fontSize: 16,
                fontWeight: 400,
                lineHeight: 1.5,
                emailSafe: true,
                fallbacks: ['Helvetica', 'sans-serif']
              }
            ],
            spacing: [
              {
                name: 'small',
                value: 8,
                emailSafe: true
              },
              {
                name: 'medium',
                value: 16,
                emailSafe: true
              },
              {
                name: 'large',
                value: 32,
                emailSafe: true
              }
            ]
          },
          components: [
            {
              id: 'button-primary',
              name: 'Primary Button',
              type: 'button',
              emailMapping: {
                htmlStructure: 'table',
                cssProperties: {
                  'background-color': '#007bff',
                  'color': '#ffffff',
                  'padding': '12px 24px',
                  'border-radius': '4px'
                },
                darkModeSupport: true
              },
              mjmlEquivalent: 'mj-button'
            }
          ],
          assets: [
            {
              id: 'logo',
              name: 'Company Logo',
              url: 'https://example.com/logo.png',
              type: 'image',
              optimized: true,
              emailSafe: true
            }
          ],
          metadata: {
            projectId: 'mock-project-id',
            extractedAt: new Date(),
            version: '1.0.0',
            totalTokens: 5,
            totalComponents: 1,
            totalAssets: 1
          }
        }
      }
    };
    
    return NextResponse.json(mockResponse);
    
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
    status: 'active (mock)',
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
    optionalFields: ['options'],
    note: 'This is currently a mock implementation. Full Figma integration will be available in production.'
  });
} 