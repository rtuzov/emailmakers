import { NextApiRequest, NextApiResponse } from 'next';
import { ZodSchema, ZodError } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

export interface SecurityConfig {
  cors: {
    origin: string[];
    credentials: boolean;
    methods: string[];
    allowedHeaders: string[];
  };
  csp: {
    directives: Record<string, string[]>;
  };
  headers: Record<string, string>;
  rateLimit: {
    windowMs: number;
    max: number;
    skipSuccessfulRequests?: boolean;
  };
}

export interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

export class SecurityMiddlewareService {
  private rateLimitStore: RateLimitStore = {};
  private config: SecurityConfig;

  constructor() {
    this.config = this.getSecurityConfig();
    
    // Clean up rate limit store periodically
    setInterval(() => this.cleanupRateLimitStore(), 60000); // Every minute
  }

  /**
   * Get security configuration based on environment
   */
  private getSecurityConfig(): SecurityConfig {
    const isProduction = process.env.NODE_ENV === 'production';

    return {
      cors: {
        origin: isProduction
          ? ['https://emailmakers.com', 'https://app.emailmakers.com']
          : ['http://localhost:3000', 'http://127.0.0.1:3000'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      },
      csp: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'", // Required for Next.js
            "'unsafe-eval'", // Required for development
            'https://cdn.emailmakers.com',
          ],
          styleSrc: [
            "'self'",
            "'unsafe-inline'", // Required for Tailwind CSS
            'https://fonts.googleapis.com',
          ],
          imgSrc: [
            "'self'",
            'data:',
            'https://cdn.emailmakers.com',
            'https://images.unsplash.com',
            'https://api.figma.com',
          ],
          connectSrc: [
            "'self'",
            'https://api.openai.com',
            'https://api.anthropic.com',
            'https://api.figma.com',
            'https://api.litmus.com',
          ],
          fontSrc: [
            "'self'",
            'https://fonts.gstatic.com',
          ],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      headers: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': isProduction
          ? 'max-age=31536000; includeSubDomains; preload'
          : '',
      },
      rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Limit each IP to 100 requests per windowMs
        skipSuccessfulRequests: false,
      },
    };
  }

  /**
   * CORS middleware
   */
  corsMiddleware() {
    return (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
      const origin = req.headers.origin;
      
      if (origin && this.config.cors.origin.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }
      
      res.setHeader('Access-Control-Allow-Credentials', this.config.cors.credentials.toString());
      res.setHeader('Access-Control-Allow-Methods', this.config.cors.methods.join(', '));
      res.setHeader('Access-Control-Allow-Headers', this.config.cors.allowedHeaders.join(', '));
      
      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
      }
      
      next();
    };
  }

  /**
   * Content Security Policy middleware
   */
  cspMiddleware() {
    return (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
      const cspDirectives = Object.entries(this.config.csp.directives)
        .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
        .join('; ');
      
      res.setHeader('Content-Security-Policy', cspDirectives);
      next();
    };
  }

  /**
   * Security headers middleware
   */
  securityHeadersMiddleware() {
    return (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
      Object.entries(this.config.headers).forEach(([header, value]) => {
        if (value) {
          res.setHeader(header, value);
        }
      });
      
      next();
    };
  }

  /**
   * Rate limiting middleware
   */
  rateLimitMiddleware() {
    return (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
      const clientId = this.getClientIdentifier(req);
      const now = Date.now();
      const windowStart = now - this.config.rateLimit.windowMs;
      
      // Initialize or get existing rate limit data
      if (!this.rateLimitStore[clientId]) {
        this.rateLimitStore[clientId] = {
          count: 0,
          resetTime: now + this.config.rateLimit.windowMs,
        };
      }
      
      const clientData = this.rateLimitStore[clientId];
      
      // Reset if window has expired
      if (now > clientData.resetTime) {
        clientData.count = 0;
        clientData.resetTime = now + this.config.rateLimit.windowMs;
      }
      
      // Check if limit exceeded
      if (clientData.count >= this.config.rateLimit.max) {
        res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
        });
        return;
      }
      
      // Increment counter
      clientData.count++;
      
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', this.config.rateLimit.max.toString());
      res.setHeader('X-RateLimit-Remaining', (this.config.rateLimit.max - clientData.count).toString());
      res.setHeader('X-RateLimit-Reset', Math.ceil(clientData.resetTime / 1000).toString());
      
      next();
    };
  }

  /**
   * Input validation and sanitization middleware
   */
  validateAndSanitizeMiddleware<T>(schema: ZodSchema<T>) {
    return (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
      try {
        // Validate input against schema
        const validatedData = schema.parse(req.body);
        
        // Sanitize HTML content recursively
        req.body = this.sanitizeObject(validatedData);
        
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          res.status(400).json({
            error: 'Validation Error',
            message: 'Invalid input data',
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          });
        } else {
          res.status(400).json({
            error: 'Validation Error',
            message: 'Invalid input data',
          });
        }
      }
    };
  }

  /**
   * Sanitize object recursively
   */
  private sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return DOMPurify.sanitize(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      Object.keys(obj).forEach(key => {
        sanitized[key] = this.sanitizeObject(obj[key]);
      });
      return sanitized;
    }
    
    return obj;
  }

  /**
   * Get client identifier for rate limiting
   */
  private getClientIdentifier(req: NextApiRequest): string {
    // Try to get real IP from various headers (for proxy/load balancer scenarios)
    const forwarded = req.headers['x-forwarded-for'] as string;
    const realIp = req.headers['x-real-ip'] as string;
    const remoteAddress = req.socket.remoteAddress;
    
    let clientIp = forwarded?.split(',')[0] || realIp || remoteAddress || 'unknown';
    
    // For authenticated requests, use user ID for more accurate rate limiting
    const userId = (req as any).user?.id;
    if (userId) {
      clientIp = `user_${userId}`;
    }
    
    return clientIp;
  }

  /**
   * Clean up expired rate limit entries
   */
  private cleanupRateLimitStore(): void {
    const now = Date.now();
    Object.keys(this.rateLimitStore).forEach(clientId => {
      if (now > this.rateLimitStore[clientId].resetTime) {
        delete this.rateLimitStore[clientId];
      }
    });
  }

  /**
   * Create comprehensive security middleware stack
   */
  createSecurityMiddleware() {
    return [
      this.corsMiddleware(),
      this.securityHeadersMiddleware(),
      this.cspMiddleware(),
      this.rateLimitMiddleware(),
    ];
  }

  /**
   * Create API route wrapper with security
   */
  secureAPIRoute<T>(
    handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
    options: {
      validation?: ZodSchema<T>;
      rateLimit?: Partial<SecurityConfig['rateLimit']>;
      requireAuth?: boolean;
    } = {}
  ) {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      try {
        // Apply security middleware
        const middlewares = this.createSecurityMiddleware();
        
        // Apply custom rate limit if provided
        if (options.rateLimit) {
          const originalRateLimit = this.config.rateLimit;
          this.config.rateLimit = { ...originalRateLimit, ...options.rateLimit };
        }
        
        // Run security middleware
        for (const middleware of middlewares) {
          await new Promise<void>((resolve, reject) => {
            middleware(req, res, (error?: any) => {
              if (error) reject(error);
              else resolve();
            });
          });
        }
        
        // Apply validation if provided
        if (options.validation) {
          await new Promise<void>((resolve, reject) => {
            this.validateAndSanitizeMiddleware(options.validation!)(req, res, (error?: any) => {
              if (error) reject(error);
              else resolve();
            });
          });
        }
        
        // Check authentication if required
        if (options.requireAuth) {
          // This would integrate with your authentication system
          const token = req.headers.authorization?.replace('Bearer ', '');
          if (!token) {
            res.status(401).json({ error: 'Authentication required' });
            return;
          }
          // Add token validation logic here
        }
        
        // Execute the actual handler
        await handler(req, res);
        
      } catch (error) {
        console.error('Security middleware error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    };
  }

  /**
   * Get current rate limit status for a client
   */
  getRateLimitStatus(req: NextApiRequest): {
    limit: number;
    remaining: number;
    resetTime: number;
  } {
    const clientId = this.getClientIdentifier(req);
    const clientData = this.rateLimitStore[clientId];
    
    if (!clientData) {
      return {
        limit: this.config.rateLimit.max,
        remaining: this.config.rateLimit.max,
        resetTime: Date.now() + this.config.rateLimit.windowMs,
      };
    }
    
    return {
      limit: this.config.rateLimit.max,
      remaining: Math.max(0, this.config.rateLimit.max - clientData.count),
      resetTime: clientData.resetTime,
    };
  }
}

// Export singleton instance
export const securityMiddleware = new SecurityMiddlewareService(); 