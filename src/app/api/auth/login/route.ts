import { NextRequest, NextResponse } from 'next/server';
import { AuthenticationService, AuthError } from '@/domains/auth/services/authentication-service';
import { DrizzleUserRepository } from '@/domains/auth/repositories/user-repository';
import { DrizzleSessionRepository } from '@/domains/auth/repositories/session-repository';
import { LoginSchema } from '@/shared/utils/validation/auth-schemas';
import { ZodError } from 'zod';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = LoginSchema.parse(body);
    
    // Initialize services
    const userRepo = new DrizzleUserRepository();
    const sessionRepo = new DrizzleSessionRepository();
    const authService = new AuthenticationService(userRepo, sessionRepo);
    
    // Login user
    const result = await authService.login(validatedData);
    
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        },
        { status: 400 }
      );
    }
    
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 401 }
      );
    }
    
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 