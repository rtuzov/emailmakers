import { NextRequest, NextResponse } from 'next/server';
import { AuthenticationService } from '@/domains/auth/services/authentication-service';
import { DrizzleUserRepository } from '@/domains/auth/repositories/user-repository';
import { DrizzleSessionRepository } from '@/domains/auth/repositories/session-repository';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export async function authMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userRepo = new DrizzleUserRepository();
    const sessionRepo = new DrizzleSessionRepository();
    const authService = new AuthenticationService(userRepo, sessionRepo);
    
    const user = await authService.verifyToken(token);
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Add user to request context
    (request as AuthenticatedRequest).user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    return null; // Continue to next middleware/handler
  } catch (error) {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
}

export function requireAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await authMiddleware(request);
    if (authResult) {
      return authResult; // Return error response
    }
    
    return handler(request as AuthenticatedRequest);
  };
}

export function requireRole(role: string) {
  return function(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
    return async (request: NextRequest): Promise<NextResponse> => {
      const authResult = await authMiddleware(request);
      if (authResult) {
        return authResult; // Return error response
      }
      
      const authenticatedRequest = request as AuthenticatedRequest;
      if (authenticatedRequest.user?.role !== role && authenticatedRequest.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
      
      return handler(authenticatedRequest);
    };
  };
} 