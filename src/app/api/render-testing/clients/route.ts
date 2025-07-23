import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RenderOrchestrationService } from '@/domains/render-testing/services/render-orchestration-service';
import { EmailClientFactory } from '@/domains/render-testing/entities/email-client';

/**
 * API Routes for Email Client Management
 * 
 * GET /api/render-testing/clients - List available email clients
 * POST /api/render-testing/clients - Create new email client configuration (admin)
 */

// Query schemas
const ListClientsQuerySchema = z.object({
  type: z.enum(['web', 'desktop', 'mobile']).optional().nullable(),
  platform: z.string().optional().nullable(),
  active: z.string().transform(val => val === 'true').optional().nullable(),
  popular: z.string().transform(val => val === 'true').optional().nullable(),
  capability: z.string().optional().nullable()
});

// Response schemas
// const EmailClientResponseSchema = z.object({
//   id: z.string(),
//   name: z.string(),
//   displayName: z.string(),
//   vendor: z.string(),
//   version: z.string().optional().nullable(),
//   type: z.string(),
//   platform: z.string(),
//   renderingEngine: z.string(),
//   marketShare: z.number().optional().nullable(),
//   capabilities: z.object({
//     darkMode: z.boolean(),
//     responsiveDesign: z.boolean(),
//     css3Support: z.boolean(),
//     webFonts: z.boolean(),
//     backgroundImages: z.boolean(),
//     mediaQueries: z.boolean(),
//     flexbox: z.boolean(),
//     grid: z.boolean(),
//     animations: z.boolean(),
//     interactiveElements: z.boolean(),
//     customProperties: z.boolean(),
//     maxEmailWidth: z.number().optional().nullable(),
//     maxEmailHeight: z.number().optional().nullable(),
//     imageFormats: z.array(z.string()),
//     videoSupport: z.boolean(),
//     accessibilityFeatures: z.boolean()
//   }),
//   testConfig: z.object({
//     enabled: z.boolean(),
//     priority: z.number(),
//     timeout: z.number(),
//     retries: z.number(),
//     screenshotDelay: z.number(),
//     loadWaitTime: z.number(),
//     darkModeTest: z.boolean(),
//     viewports: z.array(z.object({
//       width: z.number(),
//       height: z.number(),
//       devicePixelRatio: z.number(),
//       name: z.string(),
//       isDefault: z.boolean()
//     }))
//   }),
//   automationConfig: z.object({
//     workerType: z.string(),
//     containerImage: z.string().optional().nullable(),
//     vmTemplate: z.string().optional().nullable(),
//     browserConfig: z.object({
//       browser: z.string().optional().nullable(),
//       headless: z.boolean(),
//       args: z.array(z.string()).optional().nullable()
//     }).optional().nullable()
//   }),
//   isActive: z.boolean(),
//   tags: z.array(z.string()),
//   compatibilityScore: z.number(),
//   estimatedDuration: z.number(),
//   supportsDarkMode: z.boolean(),
//   isHighPriority: z.boolean(),
//   createdAt: z.string(),
//   updatedAt: z.string()
// });

// const ClientSummaryResponseSchema = z.object({
//   id: z.string(),
//   displayName: z.string(),
//   type: z.string(),
//   platform: z.string(),
//   vendor: z.string(),
//   compatibilityScore: z.number(),
//   isActive: z.boolean(),
//   supportsDarkMode: z.boolean(),
//   estimatedDuration: z.number(),
//   marketShare: z.number().optional().nullable(),
//   tags: z.array(z.string())
// });

// Initialize service (in real implementation, this would be dependency injected)
// For now, we'll create a mock service that returns predefined clients
const renderOrchestrationService = {
  async getActiveEmailClients() {
    // Return predefined clients for demo
    return [
      EmailClientFactory.createGmail(),
      EmailClientFactory.createOutlookWeb(),
      EmailClientFactory.createOutlookDesktop(),
      EmailClientFactory.createAppleMail(),
      EmailClientFactory.createYandexMail(),
      EmailClientFactory.createMailRu()
    ];
  }
} as Pick<RenderOrchestrationService, 'getActiveEmailClients'>;

/**
 * GET /api/render-testing/clients
 * List available email clients with filtering options
 */
export async function GET(_request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(_request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedQuery = ListClientsQuerySchema.parse(queryParams);

    // Get all active email clients
    const clients = await renderOrchestrationService.getActiveEmailClients();

    // Apply filters
    let filteredClients = clients;

    if (validatedQuery.type) {
      filteredClients = filteredClients.filter(client => client.type === validatedQuery.type);
    }

    if (validatedQuery.platform) {
      filteredClients = filteredClients.filter(client => client.platform === validatedQuery.platform);
    }

    if (validatedQuery.active !== undefined) {
      filteredClients = filteredClients.filter(client => client.isActive === validatedQuery.active);
    }

    if (validatedQuery.popular) {
      filteredClients = filteredClients.filter(client => client.isHighPriority());
    }

    if (validatedQuery.capability) {
      filteredClients = filteredClients.filter(client => 
        client.supportsFeature(validatedQuery.capability as any)
      );
    }

    // Determine response format based on query
    const detailed = searchParams.get('detailed') === 'true';

    if (detailed) {
      // Return detailed client information
      const response = {
        clients: filteredClients.map(client => ({
          id: client.id,
          name: client.name,
          displayName: client.displayName,
          vendor: client.vendor,
          version: client.version,
          type: client.type,
          platform: client.platform,
          renderingEngine: client.renderingEngine,
          marketShare: client.marketShare,
          capabilities: client.capabilities,
          testConfig: client.testConfig,
          automationConfig: {
            workerType: client.automationConfig.workerType,
            containerImage: client.automationConfig.containerImage,
            vmTemplate: client.automationConfig.vmTemplate,
            browserConfig: client.automationConfig.browserConfig
          },
          isActive: client.isActive,
          tags: client.tags,
          compatibilityScore: client.getCompatibilityScore(),
          estimatedDuration: client.getEstimatedTestDuration(),
          supportsDarkMode: client.supportsDarkMode(),
          isHighPriority: client.isHighPriority(),
          createdAt: client.createdAt.toISOString(),
          updatedAt: client.updatedAt.toISOString()
        })),
        total: filteredClients.length,
        filters: {
          types: [...new Set(clients.map(c => c.type))],
          platforms: [...new Set(clients.map(c => c.platform))],
          vendors: [...new Set(clients.map(c => c.vendor))],
          renderingEngines: [...new Set(clients.map(c => c.renderingEngine))]
        }
      };

      return NextResponse.json(response);
    } else {
      // Return summary information
      const response = {
        clients: filteredClients.map(client => ({
          id: client.id,
          displayName: client.displayName,
          type: client.type,
          platform: client.platform,
          vendor: client.vendor,
          compatibilityScore: client.getCompatibilityScore(),
          isActive: client.isActive,
          supportsDarkMode: client.supportsDarkMode(),
          estimatedDuration: client.getEstimatedTestDuration(),
          marketShare: client.marketShare,
          tags: client.tags
        })),
        total: filteredClients.length,
        summary: {
          totalClients: clients.length,
          activeClients: clients.filter(c => c.isActive).length,
          webClients: clients.filter(c => c.type === 'web').length,
          desktopClients: clients.filter(c => c.type === 'desktop').length,
          mobileClients: clients.filter(c => c.type === 'mobile').length,
          darkModeSupport: clients.filter(c => c.supportsDarkMode()).length,
          averageCompatibilityScore: Math.round(
            clients.reduce((sum, c) => sum + c.getCompatibilityScore(), 0) / clients.length
          )
        }
      };

      return NextResponse.json(response);
    }

  } catch (error) {
    console.error('Error listing email clients:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid query parameters',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/render-testing/clients
 * Create a new email client configuration (admin only)
 */
export async function POST(_request: NextRequest) {
  try {
    // Check admin privileges
    const isAdmin = await checkAdminPrivileges(_request);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }

    // Parse request body
    // const _body = await request.json();
    
    // For demo purposes, we'll return predefined clients
    // In real implementation, this would validate and save new client config
    const predefinedClients = [
      EmailClientFactory.createGmail(),
      EmailClientFactory.createOutlookWeb(),
      EmailClientFactory.createOutlookDesktop(),
      EmailClientFactory.createAppleMail()
    ];

    // Return the first predefined client as example
    const client = (predefinedClients && predefinedClients[0] ? predefinedClients[0] : null);
    
    if (!client) {
      return NextResponse.json({ error: 'No client found' }, { status: 404 });
    }
    
    const response = {
      id: client.id,
      name: client.name,
      displayName: client.displayName,
      vendor: client.vendor,
      type: client.type,
      platform: client.platform,
      renderingEngine: client.renderingEngine,
      marketShare: client.marketShare,
      capabilities: client.capabilities,
      testConfig: client.testConfig,
      automationConfig: {
        workerType: client.automationConfig.workerType,
        containerImage: client.automationConfig.containerImage,
        vmTemplate: client.automationConfig.vmTemplate,
        browserConfig: client.automationConfig.browserConfig
      },
      isActive: client.isActive,
      tags: client.tags,
      compatibilityScore: client.getCompatibilityScore(),
      estimatedDuration: client.getEstimatedTestDuration(),
      supportsDarkMode: client.supportsDarkMode(),
      isHighPriority: client.isHighPriority(),
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString(),
      message: 'Email client configuration created successfully'
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Error creating email client:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to check admin privileges
 */
async function checkAdminPrivileges(_request: NextRequest): Promise<boolean> {
  // Placeholder implementation
  // In real app, this would check user roles/permissions
  // const _authHeader = request.headers.get('authorization');
  const adminToken = _request.headers.get('x-admin-token');
  
  // Mock admin check
  return adminToken === 'admin-secret-token';
}

/**
 * Helper function to get client capabilities summary
 */
// function getCapabilitiesSummary(clients: any[]) {
//   const capabilities = [
//     'darkMode',
//     'responsiveDesign',
//     'css3Support',
//     'webFonts',
//     'backgroundImages',
//     'mediaQueries',
//     'flexbox',
//     'grid',
//     'animations',
//     'interactiveElements',
//     'customProperties',
//     'videoSupport',
//     'accessibilityFeatures'
//   ];
//
//   const summary: Record<string, number> = {};
//
//   capabilities.forEach(capability => {
//     summary[capability] = clients.filter(client => 
//       client.capabilities[capability]
//     ).length;
//   });
//
//   return summary;
// }

/**
 * Helper function to get platform distribution
 */
// function getPlatformDistribution(clients: any[]) {
//   const platforms: Record<string, number> = {};
//
//   clients.forEach(client => {
//     platforms[client.platform] = (platforms[client.platform] || 0) + 1;
//   });
//
//   return platforms;
// }

/**
 * Helper function to get vendor distribution
 */
// function getVendorDistribution(clients: any[]) {
//   const vendors: Record<string, number> = {};
//
//   clients.forEach(client => {
//     vendors[client.vendor] = (vendors[client.vendor] || 0) + 1;
//   });
//
//   return vendors;
// } 