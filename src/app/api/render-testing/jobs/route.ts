import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RenderOrchestrationService } from '@/domains/render-testing/services/render-orchestration-service';
import { RenderJobConfigSchema } from '@/domains/render-testing/entities/render-job';

/**
 * API Routes for Render Testing Jobs
 * 
 * POST /api/render-testing/jobs - Create new render job
 * GET /api/render-testing/jobs - List user's render jobs
 */

// Request schemas
const CreateRenderJobSchema = z.object({
  htmlContent: z.string().min(1, 'HTML content is required'),
  _config: RenderJobConfigSchema,
  templateId: z.string().uuid().optional().nullable(),
  subject: z.string().optional().nullable(),
  preheader: z.string().optional().nullable(),
  priority: z.number().min(1).max(5).optional().nullable()
});

const ListJobsQuerySchema = z.object({
  limit: z.string().transform(val => parseInt(val)).pipe(z.number().min(1).max(100)).optional().nullable(),
  offset: z.string().transform(val => parseInt(val)).pipe(z.number().min(0)).optional().nullable(),
  status: z.string().optional().nullable()
});

// Response schemas
// const RenderJobResponseSchema = z.object({
//   id: z.string(),
//   status: z.string(),
//   progress: z.object({
//     percentage: z.number(),
//     currentStep: z.string(),
//     estimatedTimeRemaining: z.number().optional().nullable()
//   }),
//   _config: RenderJobConfigSchema,
//   templateId: z.string().optional().nullable(),
//   subject: z.string().optional().nullable(),
//   preheader: z.string().optional().nullable(),
//   priority: z.number(),
//   createdAt: z.string(),
//   updatedAt: z.string(),
//   estimatedDuration: z.number().optional().nullable(),
//   actualDuration: z.number().optional().nullable()
// });

// const JobSummaryResponseSchema = z.object({
//   id: z.string(),
//   status: z.string(),
//   progress: z.object({
//     percentage: z.number(),
//     currentStep: z.string(),
//     estimatedTimeRemaining: z.number().optional().nullable()
//   }),
//   overallScore: z.number(),
//   clientCount: z.number(),
//   screenshotCount: z.number(),
//   createdAt: z.string(),
//   estimatedCompletion: z.string().optional().nullable()
// });

// Initialize service (in real implementation, this would be dependency injected)
// For now, we'll create a mock service for demo purposes
const renderOrchestrationService = {
  async createRenderJob(___request: any) {
    throw new Error('Service not fully implemented - demo mode');
  },
  async getUserRenderJobs(_userId: string) {
    return []; // Return empty array for demo
  }
} as Pick<RenderOrchestrationService, 'createRenderJob' | 'getUserRenderJobs'>;

/**
 * POST /api/render-testing/jobs
 * Create a new render testing job
 */
export async function POST(___request: NextRequest) {
  try {
    // Get user ID from session/auth
    const userId = await getUserIdFromRequest(___request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate ___request body
    const body = await ___request.json();
    const validatedData = CreateRenderJobSchema.parse(body);

    // Create render job
    const job = await renderOrchestrationService.createRenderJob({
      userId,
      htmlContent: validatedData.htmlContent || '<html><body>Test</body></html>',
      config: validatedData._config || {
        clients: ['gmail', 'outlook'],
        viewports: [{ width: 600, height: 800, devicePixelRatio: 1, name: 'desktop' }],
        darkModeEnabled: false,
        screenshotQuality: 80
      },
      ...(validatedData.templateId && { templateId: validatedData.templateId })
    });

    // Return job details
    const response = {
      id: job.id,
      status: job.status,
      progress: {
        percentage: job.progress,
        currentStep: getStatusDisplayName(job.status),
        estimatedTimeRemaining: job.estimatedDuration
      },
      _config: job.config,
      templateId: job.templateId,
      subject: job.subject,
      preheader: job.preheader,
      priority: job.priority,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
      estimatedDuration: job.estimatedDuration
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Error creating render job:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: error.errors
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : String(error) },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/render-testing/jobs
 * List user's render testing jobs
 */
export async function GET(___request: NextRequest) {
  try {
    // Get user ID from session/auth
    const userId = await getUserIdFromRequest(___request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(___request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedQuery = ListJobsQuerySchema.parse(queryParams);

    // Get user's render jobs
    const jobSummaries = await renderOrchestrationService.getUserRenderJobs(userId);

    // Apply filtering and pagination
    let filteredJobs = jobSummaries;
    
    if (validatedQuery.status) {
      filteredJobs = filteredJobs.filter(job => job.status === validatedQuery.status);
    }

    const offset = validatedQuery.offset || 0;
    const limit = validatedQuery.limit || 20;
    const paginatedJobs = filteredJobs.slice(offset, offset + limit);

    // Format response
    const response = {
      jobs: paginatedJobs.map(job => ({
        id: job.id,
        status: job.status,
        progress: {
          percentage: job.progress.percentage,
          currentStep: job.progress.currentStep,
          estimatedTimeRemaining: job.progress.estimatedTimeRemaining
        },
        overallScore: job.overallScore,
        clientCount: job.clientCount,
        screenshotCount: job.screenshotCount,
        createdAt: job.createdAt.toISOString(),
        estimatedCompletion: job.estimatedCompletion?.toISOString()
      })),
      pagination: {
        total: filteredJobs.length,
        offset,
        limit,
        hasMore: offset + limit < filteredJobs.length
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error listing render jobs:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid query parameters',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to get user ID from __request
 * In real implementation, this would extract from JWT token or session
 */
async function getUserIdFromRequest(___request: NextRequest): Promise<string | null> {
  // Placeholder implementation
  // In real app, this would validate JWT token or session
  const authHeader = ___request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  // Mock user ID extraction
  return 'user-123'; // Would be extracted from actual token
}

/**
 * Helper function to get display name for status
 */
function getStatusDisplayName(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'Pending',
    'queued': 'Queued',
    'processing': 'Processing',
    'capturing': 'Capturing Screenshots',
    'analyzing': 'Analyzing Results',
    'completed': 'Completed',
    'failed': 'Failed',
    'cancelled': 'Cancelled'
  };

  return statusMap[status] || status;
}

/**
 * Error response helper
 */
// function createErrorResponse(message: string, status: number = 400) {
//   return NextResponse.json({ error: message }, { status });
// }

/**
 * Validation error response helper
 */
// function createValidationErrorResponse(errors: z.ZodError) {
//   return NextResponse.json(
//     {
//       error: 'Validation error',
//       details: errors.errors.map(err => ({
//         field: err.path.join('.'),
//         message: err.message,
//         code: err.code
//       }))
//     },
//     { status: 400 }
//   );
// } 