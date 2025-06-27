import { NextRequest, NextResponse } from 'next/server';
import { AuthenticationService, AuthError } from '@/domains/auth/services/authentication-service';
import { DrizzleUserRepository } from '@/domains/auth/repositories/user-repository';
import { DrizzleSessionRepository } from '@/domains/auth/repositories/session-repository';
import { RegisterSchema } from '@/shared/utils/validation/auth-schemas';
import { ZodError } from 'zod';

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: '.env.local' });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = RegisterSchema.parse(body);
    
    // Initialize services
    const userRepo = new DrizzleUserRepository();
    const sessionRepo = new DrizzleSessionRepository();
    const authService = new AuthenticationService(userRepo, sessionRepo);
    
    // Register user
    const result = await authService.register(validatedData);
    
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Registration error details:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      env: {
        DATABASE_URL: !!process.env.DATABASE_URL,
        JWT_SECRET: !!process.env.JWT_SECRET
      }
    });
    
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
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 