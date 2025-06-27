import { NextRequest, NextResponse } from 'next/server';
import { AuthenticationService } from '@/domains/auth/services/authentication-service';
import { DrizzleUserRepository } from '@/domains/auth/repositories/user-repository';
import { DrizzleSessionRepository } from '@/domains/auth/repositories/session-repository';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 400 });
    }
    
    // Initialize services
    const userRepo = new DrizzleUserRepository();
    const sessionRepo = new DrizzleSessionRepository();
    const authService = new AuthenticationService(userRepo, sessionRepo);
    
    // Logout user
    await authService.logout(token);
    
    return NextResponse.json({ message: 'Logged out successfully' }, { status: 200 });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 