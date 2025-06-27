import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedRequest } from '@/api/middleware/auth-middleware';

async function getMeHandler(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    // User info is already attached by middleware
    return NextResponse.json({ user: request.user }, { status: 200 });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(getMeHandler); 