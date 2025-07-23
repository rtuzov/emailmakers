import { NextRequest, NextResponse } from 'next/server';
import { QueueService } from '../../../../shared/infrastructure/queue/queue-service';
// import { StorageService } from '../../../../shared/infrastructure/storage/storage-service';
import { MetricsService } from '../../../../shared/infrastructure/monitoring/metrics-service';

// Initialize services (in a real app, these would be injected via DI container)
const metricsService = new MetricsService();
const queueService = new QueueService(
  {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
    db: parseInt(process.env.REDIS_DB || '0'),
  },
  metricsService
);

/**
 * GET /api/render-testing/queue
 * Get queue statistics and status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeWorkers = searchParams.get('workers') === 'true';
    const includeHealth = searchParams.get('health') === 'true';

    const stats = await queueService.getQueueStats();
    
    const response: any = {
      queue: stats,
      timestamp: new Date().toISOString(),
    };

    if (includeWorkers) {
      response.workers = await queueService.getWorkerStats();
    }

    if (includeHealth) {
      response.health = await queueService.healthCheck();
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting queue stats:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get queue statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/render-testing/queue/jobs
 * Add a new job to the queue
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['jobId', 'templateHtml', 'clientIds', 'priority'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate priority
    const validPriorities = ['low', 'normal', 'high', 'urgent'];
    if (!validPriorities.includes(body.priority)) {
      return NextResponse.json(
        { error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate clientIds
    if (!Array.isArray(body.clientIds) || body.clientIds.length === 0) {
      return NextResponse.json(
        { error: 'clientIds must be a non-empty array' },
        { status: 400 }
      );
    }

    const queueJobData = {
      jobId: body.jobId,
      templateHtml: body.templateHtml,
      clientIds: body.clientIds,
      priority: body.priority,
      options: {
        viewports: body.options?.viewports || [
          { width: 600, height: 800, name: 'desktop' },
          { width: 375, height: 667, name: 'mobile' },
        ],
        darkMode: body.options?.darkMode || false,
        mobileSimulation: body.options?.mobileSimulation || false,
        accessibility: body.options?.accessibility || false,
        performance: body.options?.performance || false,
      },
      metadata: {
        userId: body.metadata?.userId,
        campaignId: body.metadata?.campaignId,
        templateId: body.metadata?.templateId,
        createdAt: new Date(),
        ...body.metadata,
      },
    };

    const queueJobId = await queueService.addRenderJob(queueJobData);

    return NextResponse.json({
      success: true,
      queueJobId,
      jobId: body.jobId,
      position: await queueService.getJobStatus(queueJobId).then(status => status.position),
      estimatedStartTime: new Date(Date.now() + (await queueService.getJobStatus(queueJobId).then(status => (status.position || 0) * 30000))).toISOString(),
    }, { status: 201 });

  } catch (error) {
    console.error('Error adding job to queue:', error);
    return NextResponse.json(
      { 
        error: 'Failed to add job to queue',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 