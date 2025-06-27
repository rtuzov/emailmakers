import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { z } from 'zod';

// Validation schema for quality assurance
const ValidateQualitySchema = z.object({
  html: z.string().min(1, 'HTML content is required'),
  mjml: z.string().optional(),
  options: z.object({
    skipLitmusTest: z.boolean().optional(),
    skipAccessibilityTest: z.boolean().optional(),
    skipPerformanceTest: z.boolean().optional(),
    targetClients: z.array(z.enum([
      'gmail', 'outlook_2016', 'outlook_365', 'apple_mail', 
      'yahoo_mail', 'thunderbird', 'samsung_email'
    ])).optional(),
    performanceThresholds: z.object({
      maxFileSize: z.number().optional(),
      maxLoadTime: z.number().optional(),
      minAccessibilityScore: z.number().optional()
    }).optional()
  }).optional()
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = ValidateQualitySchema.parse(body);
    
    // Import QualityAssuranceService - fail fast if not available
    const { QualityAssuranceService } = await import('@/domains/quality-assurance/services/quality-assurance-service');
    
    // Validate quality - no fallback, fail if service fails
    const qualityService = new QualityAssuranceService();
    const validationResult = await qualityService.runQualityAssurance(
      validatedData.html,
      {
        includeAccessibility: !validatedData.options?.skipAccessibilityTest,
        includePerformance: !validatedData.options?.skipPerformanceTest,
        strictMode: true,
        targetClients: validatedData.options?.targetClients
      }
    );
    
    return NextResponse.json({
      success: true,
      data: validationResult
    });
    
  } catch (error) {
    console.error('Quality validation error:', error);
    
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
    
    if (error instanceof Error && error.message.includes('HTML parsing')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid HTML',
          details: 'The provided HTML could not be parsed for validation'
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
    message: 'Quality Assurance Validation API',
    version: '1.0.0',
    status: 'active',
    endpoint: 'POST /api/quality/validate',
    description: 'Validate email templates for cross-client compatibility, accessibility, and performance',
    validationTypes: [
      'Cross-client compatibility testing',
      'HTML validation and standards compliance',
      'Accessibility (WCAG AA) compliance',
      'Performance optimization analysis',
      'Auto-fix suggestion generation'
    ],
    supportedClients: [
      'gmail', 'outlook_2016', 'outlook_365', 'apple_mail', 
      'yahoo_mail', 'thunderbird', 'samsung_email'
    ],
    scoringSystem: {
      overallScore: 'Weighted average of all validation scores (0-1)',
      minimumThreshold: 0.7,
      productionReady: 0.8
    },
    requiredFields: ['html'],
    optionalFields: ['mjml', 'options']
  });
} 