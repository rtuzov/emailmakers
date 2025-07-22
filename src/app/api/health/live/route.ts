import { NextRequest, NextResponse } from 'next/server';

// Simple liveness check for Kubernetes
export async function GET(_request: NextRequest) {
  try {
    // Basic liveness check - just ensure the service can respond
    const memoryUsage = process.memoryUsage();
    const memoryLimitMB = parseInt(process.env.MAX_MEMORY_USAGE || '536870912') / 1024 / 1024;
    const currentUsageMB = memoryUsage.heapUsed / 1024 / 1024;

    // Check if memory usage is within critical limits
    if (currentUsageMB > memoryLimitMB) {
      return NextResponse.json({
        alive: false,
        message: `Memory usage exceeded limit: ${currentUsageMB.toFixed(2)}MB > ${memoryLimitMB}MB`,
      }, { status: 503 });
    }

    return NextResponse.json({
      alive: true,
      message: 'Service is alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({
      alive: false,
      message: `Liveness check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }, { status: 503 });
  }
}

// Force dynamic rendering
export const dynamic = 'force-dynamic'; 