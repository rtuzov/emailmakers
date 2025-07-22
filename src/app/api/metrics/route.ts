import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../../../agent/core/logger';

/**
 * Prometheus metrics endpoint
 * GET /api/metrics
 */
export async function GET(_request: NextRequest) {
  try {
    const metrics = await logger.metrics();
    
    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Failed to generate metrics:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 