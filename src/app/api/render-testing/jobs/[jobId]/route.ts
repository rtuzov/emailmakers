import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RenderOrchestrationService } from '@/domains/render-testing/services/render-orchestration-service';

/**
 * API Routes for Individual Render Testing Jobs
 * 
 * GET /api/render-testing/jobs/[jobId] - Get job details with results
 * DELETE /api/render-testing/jobs/[jobId] - Cancel job
 * POST /api/render-testing/jobs/[jobId]/retry - Retry failed job
 */

// Request schemas
const JobIdSchema = z.string().uuid();

const RetryJobSchema = z.object({
  priority: z.number().min(1).max(5).optional().nullable()
});

// Response schemas
const JobDetailsResponseSchema = z.object({
  job: z.object({
    id: z.string(),
    status: z.string(),
    progress: z.object({
      percentage: z.number(),
      currentStep: z.string(),
      totalSteps: z.number(),
      completedSteps: z.number(),
      estimatedTimeRemaining: z.number().optional().nullable(),
      details: z.string().optional().nullable()
    }),
    _config: z.object({
      clients: z.array(z.string()),
      viewports: z.array(z.object({
        width: z.number(),
        height: z.number(),
        devicePixelRatio: z.number(),
        name: z.string()
      })),
      darkModeEnabled: z.boolean(),
      accessibilityTesting: z.boolean(),
      performanceAnalysis: z.boolean(),
      spamAnalysis: z.boolean(),
      screenshotFormat: z.string(),
      screenshotQuality: z.number()
    }),
    htmlContent: z.string(),
    templateId: z.string().optional().nullable(),
    subject: z.string().optional().nullable(),
    preheader: z.string().optional().nullable(),
    priority: z.number(),
    estimatedDuration: z.number().optional().nullable(),
    actualDuration: z.number().optional().nullable(),
    errorMessage: z.string().optional().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    startedAt: z.string().optional().nullable(),
    completedAt: z.string().optional().nullable()
  }),
  _result: z.object({
    id: z.string(),
    overallStatus: z.string(),
    overallScore: z.number(),
    summary: z.object({
      totalClients: z.number(),
      passedClients: z.number(),
      failedClients: z.number(),
      averageCompatibilityScore: z.number(),
      totalRenderTime: z.number(),
      totalScreenshots: z.number(),
      criticalIssues: z.number(),
      majorIssues: z.number(),
      minorIssues: z.number()
    }),
    clientResults: z.array(z.object({
      clientId: z.string(),
      clientName: z.string(),
      status: z.string(),
      compatibilityScore: z.number(),
      compatibilityLevel: z.string(),
      compatibilityIssues: z.array(z.object({
        severity: z.string(),
        category: z.string(),
        description: z.string(),
        recommendation: z.string().optional().nullable()
      })),
      screenshots: z.array(z.object({
        id: z.string(),
        url: z.string(),
        thumbnailUrl: z.string().optional().nullable(),
        darkMode: z.boolean(),
        viewport: z.object({
          width: z.number(),
          height: z.number(),
          name: z.string()
        })
      })),
      renderTime: z.number()
    })),
    accessibilityResult: z.object({
      score: z.number(),
      level: z.string(),
      violations: z.array(z.object({
        id: z.string(),
        impact: z.string(),
        description: z.string(),
        help: z.string()
      }))
    }).optional().nullable(),
    performanceResult: z.object({
      totalSize: z.number(),
      loadTime: z.number(),
      optimizationScore: z.number(),
      recommendations: z.array(z.object({
        type: z.string(),
        priority: z.string(),
        description: z.string(),
        potentialSavings: z.number().optional().nullable()
      }))
    }).optional().nullable(),
    spamResult: z.object({
      score: z.number(),
      status: z.string(),
      deliverabilityScore: z.number(),
      recommendations: z.array(z.object({
        priority: z.string(),
        category: z.string(),
        description: z.string(),
        solution: z.string()
      }))
    }).optional().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    completedAt: z.string().optional().nullable()
  }).optional().nullable(),
  screenshots: z.array(z.object({
    id: z.string(),
    clientId: z.string(),
    clientName: z.string(),
    status: z.string(),
    url: z.string().optional().nullable(),
    thumbnailUrl: z.string().optional().nullable(),
    darkMode: z.boolean(),
    viewport: z.object({
      width: z.number(),
      height: z.number(),
      devicePixelRatio: z.number(),
      name: z.string()
    }),
    fileSize: z.number().optional().nullable(),
    errorMessage: z.string().optional().nullable(),
    capturedAt: z.string().optional().nullable()
  }))
});

// Initialize service (in real implementation, this would be dependency injected)
// For now, we'll create a mock service for demo purposes
const renderOrchestrationService = {
  async getRenderJobWithResults(jobId: string) {
    return null; // Return null for demo
  },
  async getRenderJobProgress(jobId: string) {
    // Return a proper Progress object structure
    return {
      _data: { completed: 0, total: 100 },
      currentStep: 0,
      totalSteps: 100,
      completedSteps: 0,
      percentage: 0,
      isComplete: false,
      isActive: false,
      message: 'Demo mode',
      startedAt: new Date(),
      estimatedCompletion: new Date(),
      details: {}
    };
  },
  async cancelRenderJob(jobId: string, userId: string) {
    throw new Error('Service not fully implemented - demo mode');
  },
  async retryRenderJob(jobId: string, userId: string) {
    throw new Error('Service not fully implemented - demo mode');
  }
};

/**
 * GET /api/render-testing/jobs/[jobId]
 * Get detailed job information with results and screenshots
 */
export async function GET(
  _request: Request,
  { params }: { _params: { jobId: string } }
) {
  try {
    // For demo purposes, return a simple response
    const { jobId } = params;
    return NextResponse.json({
      id: jobId,
      status: 'pending',
      progress: {
        percentage: 0,
        currentStep: 'Initializing',
        estimatedTimeRemaining: null
      },
      priority: 'normal',
      createdAt: new Date().toISOString(),
      message: 'Demo mode - service not fully implemented'
    });
  } catch (error) {
    console.error('Error fetching render job:', error);
    return NextResponse.json(
      { error: 'Failed to fetch render job' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/render-testing/jobs/[jobId]
 * Cancel a render testing job
 */
export async function DELETE(
  _request: Request,
  { params }: { _params: { jobId: string } }
) {
  try {
    // For demo purposes, return a simple response
    const { jobId } = params;
    return NextResponse.json({
      message: 'Job cancelled successfully (demo mode)',
      jobId: jobId
    });
  } catch (error) {
    console.error('Error cancelling render job:', error);
    return NextResponse.json(
      { error: 'Failed to cancel render job' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/render-testing/jobs/[jobId]/retry
 * Retry a failed render testing job
 */
export async function POST(
  _request: Request,
  { params }: { _params: { jobId: string } }
) {
  try {
    // For demo purposes, return a simple response
    const { jobId } = params;
    return NextResponse.json({
      message: 'Job retried successfully (demo mode)',
      id: jobId + '-retry',
      originalJobId: jobId,
      status: 'pending',
      createdAt: new Date().toISOString()
    }, { status: 201 });
  } catch (error) {
    console.error('Error retrying render job:', error);
    return NextResponse.json(
      { error: 'Failed to retry render job' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to get user ID from request
 * In real implementation, this would extract from JWT token or session
 */
async function getUserIdFromRequest(_request: NextRequest): Promise<string | null> {
  // Placeholder implementation
  // In real app, this would validate JWT token or session
  const authHeader = request.headers.get('authorization');
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