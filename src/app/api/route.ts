import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    message: 'Email-Makers API',
    version: '1.0.0',
    description: 'AI-powered email template generation with design system integration',
    documentation: 'https://docs.email-makers.com/api',
    endpoints: {
      authentication: {
        register: {
          method: 'POST',
          path: '/api/auth/register',
          description: 'Register a new user account',
          requiredFields: ['email', 'password', 'name'],
          status: 'active'
        },
        login: {
          method: 'POST', 
          path: '/api/auth/login',
          description: 'Authenticate user and create session',
          requiredFields: ['email', 'password'],
          status: 'active'
        },
        logout: {
          method: 'POST',
          path: '/api/auth/logout', 
          description: 'End user session',
          status: 'active'
        },
        me: {
          method: 'GET',
          path: '/api/auth/me',
          description: 'Get current user information',
          requiresAuth: true,
          status: 'active'
        }
      },
      templates: {
        generate: {
          method: 'POST',
          path: '/api/templates/generate',
          description: 'Generate email templates from content briefs',
          requiredFields: ['content'],
          optionalFields: ['type', 'title', 'description', 'options'],
          supportedTypes: ['text', 'json', 'figma_url'],
          status: 'active'
        }
      },
      content: {
        validate: {
          method: 'POST',
          path: '/api/content/validate',
          description: 'Validate content briefs before template generation',
          requiredFields: ['content'],
          optionalFields: ['type', 'title', 'description', 'brandGuidelines', 'targetAudience'],
          status: 'active'
        }
      },
      designSystem: {
        extract: {
          method: 'POST',
          path: '/api/design-system/extract',
          description: 'Extract design tokens and components from Figma URLs',
          requiredFields: ['figmaUrl'],
          optionalFields: ['options'],
          status: 'active'
        }
      },
      quality: {
        validate: {
          method: 'POST',
          path: '/api/quality/validate',
          description: 'Validate email templates for quality assurance',
          requiredFields: ['html'],
          optionalFields: ['mjml', 'options'],
          status: 'active'
        }
      }
    },
    features: {
      contentGeneration: {
        description: 'AI-powered content generation using OpenAI GPT-4o mini and Anthropic Claude',
        providers: ['openai', 'anthropic'],
        fallbackSupport: true
      },
      designSystemIntegration: {
        description: 'Extract design tokens and components from Figma',
        supportedPlatforms: ['figma'],
        tokenTypes: ['colors', 'typography', 'spacing', 'effects']
      },
      templateProcessing: {
        description: 'MJML-based email template compilation with cross-client optimization',
        outputFormats: ['html', 'mjml'],
        emailClientSupport: ['gmail', 'outlook', 'apple_mail', 'yahoo_mail']
      },
      qualityAssurance: {
        description: 'Comprehensive email template validation and testing',
        validationTypes: ['cross-client', 'accessibility', 'performance', 'html-standards'],
        autoFixSuggestions: true
      }
    },
    limits: {
      rateLimit: '100 requests per minute per API key',
      maxFileSize: '10MB for uploads',
      maxTemplateSize: '100KB HTML output',
      cacheTTL: '1 hour for design tokens, 24 hours for generated content'
    },
    status: {
      server: 'operational',
      database: 'operational',
      externalServices: {
        openai: 'operational',
        anthropic: 'operational', 
        figma: 'operational',
        litmus: 'operational'
      },
      lastUpdated: new Date().toISOString()
    }
  });
} 