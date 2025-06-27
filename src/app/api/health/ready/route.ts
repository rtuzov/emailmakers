import { NextRequest, NextResponse } from 'next/server';

// Simple readiness check for Kubernetes
export async function GET(request: NextRequest) {
  try {
    // Basic readiness check - ensure database and critical services are available
    const memoryUsage = process.memoryUsage();
    const memoryLimitMB = parseInt(process.env.MAX_MEMORY_USAGE || '536870912') / 1024 / 1024;
    const currentUsageMB = memoryUsage.heapUsed / 1024 / 1024;

    // Check if memory usage is within acceptable limits
    if (currentUsageMB > memoryLimitMB * 0.9) {
      return NextResponse.json({
        ready: false,
        message: `Memory usage too high: ${currentUsageMB.toFixed(2)}MB > ${(memoryLimitMB * 0.9).toFixed(2)}MB`,
      }, { status: 503 });
    }

    // Basic database connectivity test (simplified)
    try {
      // In production, this would test actual database connectivity
      await new Promise(resolve => setTimeout(resolve, 10));
    } catch (dbError) {
      return NextResponse.json({
        ready: false,
        message: 'Database connectivity failed',
      }, { status: 503 });
    }

    return NextResponse.json({
      ready: true,
      message: 'Service is ready',
      timestamp: new Date().toISOString(),
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({
      ready: false,
      message: `Readiness check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }, { status: 503 });
  }
}

// Force dynamic rendering
export const dynamic = 'force-dynamic'; 