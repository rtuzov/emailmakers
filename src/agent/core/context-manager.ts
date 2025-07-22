/**
 * 🔄 ENHANCED CONTEXT MANAGER - OpenAI Agents SDK
 * 
 * Standardized context management for all agent run() calls with enhanced
 * context parameter usage, validation, and flow between specialists.
 * 
 * Implements best practices for context parameter patterns from OpenAI Agents SDK.
 */

import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import { debuggers } from './debug-output';
import { CampaignPathResolver } from './campaign-path-resolver';

const debug = debuggers.core;

// ============================================================================
// CONTEXT SCHEMAS & TYPES
// ============================================================================

export const AgentRunContextSchema = z.object({
  // Core identification
  requestId: z.string().describe('Unique request identifier'),
  traceId: z.string().nullable().describe('Trace ID for monitoring pipeline'),
  timestamp: z.string().describe('Context creation timestamp'),
  
  // Workflow management
  workflowType: z.enum(['full-campaign', 'specialist-direct', 'test', 'partial']).describe('Type of workflow being executed'),
  currentPhase: z.enum(['data-collection', 'content', 'design', 'quality', 'delivery', 'orchestration']).describe('Current workflow phase'),
  totalPhases: z.number().min(1).max(6).describe('Total phases in workflow'),
  phaseIndex: z.number().min(0).max(5).describe('Current phase index (0-based)'),
  
  // Campaign context
  campaign: z.object({
    id: z.string().describe('Campaign identifier'),
    name: z.string().describe('Campaign name'),
    path: z.string().describe('Campaign folder path'),
    brand: z.string().describe('Brand name'),
    language: z.string().default('ru').describe('Campaign language'),
    type: z.enum(['promotional', 'transactional', 'newsletter', 'announcement']).describe('Campaign type')
  }).describe('Campaign information'),
  
  // Execution context
  execution: z.object({
    mode: z.enum(['production', 'development', 'test']).default('production').describe('Execution mode'),
    apiRequest: z.boolean().default(false).describe('Whether this is an API request'),
    directSpecialistRun: z.boolean().default(false).describe('Whether this is a direct specialist run'),
    timeout: z.number().nullable().describe('Execution timeout in milliseconds'),
    maxTurns: z.number().default(20).describe('Maximum conversation turns'),
    retryAttempt: z.number().default(0).describe('Current retry attempt number')
  }).describe('Execution configuration'),
  
  // Data flow context
  dataFlow: z.object({
    previousResults: z.record(z.unknown()).nullable().describe('Results from previous specialists'),
    handoffData: z.record(z.unknown()).nullable().describe('Current handoff data being processed'),
    persistentState: z.record(z.unknown()).describe('State that persists across all specialists'),
    correlationId: z.string().describe('Correlation ID for tracking data through pipeline'),
    handoffChain: z.array(z.string()).describe('Chain of specialist handoffs')
  }).describe('Data flow information'),
  
  // Quality metrics
  quality: z.object({
    validationLevel: z.enum(['strict', 'standard', 'relaxed']).default('standard').describe('Validation strictness level'),
    requiresApproval: z.boolean().default(true).describe('Whether results require approval'),
    qualityThreshold: z.number().min(0).max(100).default(85).describe('Minimum quality threshold'),
    errorHandling: z.enum(['fail-fast', 'collect-errors', 'ignore-warnings']).default('fail-fast').describe('Error handling strategy')
  }).describe('Quality control settings'),
  
  // Monitoring & debugging
  monitoring: z.object({
    enableDebugOutput: z.boolean().default(false).describe('Enable debug output'),
    logLevel: z.enum(['error', 'warn', 'info', 'debug', 'trace']).default('info').describe('Logging level'),
    performanceTracking: z.boolean().default(true).describe('Enable performance tracking'),
    contextSnapshot: z.boolean().default(false).describe('Save context snapshots'),
    additionalMetrics: z.record(z.unknown()).describe('Additional monitoring metrics')
  }).describe('Monitoring configuration'),
  
  // Extensibility
      extensions: z.record(z.unknown()).describe('Custom extensions for specific use cases'),
    metadata: z.record(z.unknown()).describe('Additional metadata')
});

export type AgentRunContext = z.infer<typeof AgentRunContextSchema>;

export interface ContextEnhancementOptions {
  preserveExisting?: boolean;
  validateRequired?: boolean;
  enableSnapshot?: boolean;
  debugOutput?: boolean;
}

// ============================================================================
// CONTEXT MANAGER CLASS
// ============================================================================

export class ContextManager {
  private static instance: ContextManager;
  private contextStore: Map<string, AgentRunContext> = new Map();
  
  private constructor() {
    debug.info('ContextManager', 'Initializing enhanced context manager');
  }
  
  static getInstance(): ContextManager {
    if (!ContextManager.instance) {
      ContextManager.instance = new ContextManager();
    }
    return ContextManager.instance;
  }
  
  /**
   * Creates enhanced context for agent run() calls
   */
  async createAgentRunContext(
    request: string,
    baseContext: Partial<AgentRunContext> = {},
    options: ContextEnhancementOptions = {}
  ): Promise<AgentRunContext> {
    const correlationId = this.generateCorrelationId();
    
    debug.info('ContextManager', 'Creating enhanced agent run context', {
      requestPreview: request.substring(0, 100),
      hasBaseContext: Object.keys(baseContext).length > 0,
      correlationId
    });

    const enhancedContext: AgentRunContext = {
      requestId: this.generateRequestId(),
      traceId: baseContext.traceId || null,
      timestamp: new Date().toISOString(),
      
      workflowType: baseContext.workflowType || 'full-campaign',
      currentPhase: baseContext.currentPhase || 'orchestration',
      totalPhases: baseContext.totalPhases || 5,
      phaseIndex: baseContext.phaseIndex || 0,
      
      campaign: {
        id: baseContext.campaign?.id || (() => { throw new Error('❌ STRICT MODE: Campaign ID is required - no automatic generation allowed'); })(),
        name: baseContext.campaign?.name || (() => { throw new Error('❌ STRICT MODE: Campaign name is required - no fallback allowed'); })(),
        path: baseContext.campaign?.path || (baseContext.currentPhase === 'orchestration' ? '' : (() => { throw new Error('❌ STRICT MODE: Campaign path is required for specialists'); })()),
        brand: baseContext.campaign?.brand || (() => { throw new Error('❌ STRICT MODE: Brand is required - no fallback allowed'); })(),
        language: baseContext.campaign?.language || 'ru',
        type: baseContext.campaign?.type || (() => { throw new Error('❌ STRICT MODE: Campaign type is required - no fallback allowed'); })()
      },
      
      execution: {
        mode: baseContext.execution?.mode || (process.env.NODE_ENV === 'production' ? 'production' : 'development'),
        apiRequest: baseContext.execution?.apiRequest || false,
        directSpecialistRun: baseContext.execution?.directSpecialistRun || false,
        timeout: baseContext.execution?.timeout || null,
        maxTurns: baseContext.execution?.maxTurns || 20,
        retryAttempt: baseContext.execution?.retryAttempt || 0
      },
      
      dataFlow: {
        previousResults: baseContext.dataFlow?.previousResults || {},
        handoffData: baseContext.dataFlow?.handoffData || null,
        persistentState: baseContext.dataFlow?.persistentState || {},
        correlationId,
        handoffChain: baseContext.dataFlow?.handoffChain || []
      },
      
      quality: {
        validationLevel: baseContext.quality?.validationLevel || 'standard',
        requiresApproval: baseContext.quality?.requiresApproval ?? true,
        qualityThreshold: baseContext.quality?.qualityThreshold || 85,
        errorHandling: baseContext.quality?.errorHandling || 'fail-fast'
      },
      
      monitoring: {
        enableDebugOutput: baseContext.monitoring?.enableDebugOutput || options.debugOutput || false,
        logLevel: baseContext.monitoring?.logLevel || 'info',
        performanceTracking: baseContext.monitoring?.performanceTracking ?? true,
        contextSnapshot: baseContext.monitoring?.contextSnapshot || options.enableSnapshot || false,
        additionalMetrics: baseContext.monitoring?.additionalMetrics || {}
      },
      
      extensions: baseContext.extensions || {},
      metadata: {
        originalRequest: request,
        userAgent: 'EmailMakers/3.1.0',
        ...baseContext.metadata
      }
    };
    
    // Validate context structure
    if (options.validateRequired) {
      await this.validateContext(enhancedContext);
    }
    
    // Store context for retrieval
    this.contextStore.set(enhancedContext.requestId, enhancedContext);
    
    // Save context snapshot if enabled
    if (options.enableSnapshot) {
      await this.saveContextSnapshot(enhancedContext);
    }
    
    debug.info('ContextManager', 'Enhanced context created successfully', {
      requestId: enhancedContext.requestId,
      correlationId,
      campaign: enhancedContext.campaign.id,
      currentPhase: enhancedContext.currentPhase,
      workflowType: enhancedContext.workflowType
    });
    
    return enhancedContext;
  }
  
  /**
   * Enhances context for specialist handoffs
   */
  async enhanceContextForHandoff(
    currentContext: AgentRunContext,
    fromSpecialist: string,
    toSpecialist: string,
    handoffData: any
  ): Promise<AgentRunContext> {
    debug.info('ContextManager', 'Enhancing context for specialist handoff', {
      requestId: currentContext.requestId,
      from: fromSpecialist,
      to: toSpecialist,
      correlationId: currentContext.dataFlow.correlationId
    });
    
    const phaseMap: Record<string, number> = {
      'data-collection': 0,
      'content': 1,
      'design': 2,
      'quality': 3,
      'delivery': 4
    };
    
    const enhancedContext: AgentRunContext = {
      ...currentContext,
      currentPhase: toSpecialist as any,
      phaseIndex: phaseMap[toSpecialist] || currentContext.phaseIndex + 1,
      timestamp: new Date().toISOString(),
      
      dataFlow: {
        ...currentContext.dataFlow,
        handoffData,
        handoffChain: [...currentContext.dataFlow.handoffChain, `${fromSpecialist}->${toSpecialist}`],
        previousResults: {
          ...currentContext.dataFlow.previousResults,
          [fromSpecialist]: handoffData
        }
      },
      
      monitoring: {
        ...currentContext.monitoring,
        additionalMetrics: {
          ...currentContext.monitoring.additionalMetrics,
          [`handoff_${fromSpecialist}_to_${toSpecialist}_timestamp`]: new Date().toISOString()
        }
      }
    };
    
    // Update stored context
    this.contextStore.set(currentContext.requestId, enhancedContext);
    
    debug.info('ContextManager', 'Context enhanced for handoff', {
      requestId: currentContext.requestId,
      newPhase: enhancedContext.currentPhase,
      handoffChainLength: enhancedContext.dataFlow.handoffChain.length
    });
    
    return enhancedContext;
  }
  
  /**
   * Validates context structure and required fields
   */
  async validateContext(context: AgentRunContext): Promise<void> {
    try {
      AgentRunContextSchema.parse(context);
      
      // Additional validation for campaign path
      if (context.campaign.path) {
        const pathExists = await CampaignPathResolver.validatePath(context.campaign.path);
        if (!pathExists) {
          throw new Error(`Campaign path does not exist: ${context.campaign.path}`);
        }
      }
      
      debug.info('ContextManager', 'Context validation passed', {
        requestId: context.requestId,
        campaign: context.campaign.id
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      debug.error('ContextManager', 'Context validation failed', {
        error: errorMessage,
        requestId: context.requestId
      });
      throw new Error(`Context validation failed: ${errorMessage}`);
    }
  }
  
  /**
   * Retrieves context by request ID
   */
  getContext(requestId: string): AgentRunContext | null {
    return this.contextStore.get(requestId) || null;
  }
  
  /**
   * Updates context in store
   */
  updateContext(requestId: string, updates: Partial<AgentRunContext>): void {
    const existing = this.contextStore.get(requestId);
    if (existing) {
      const updated = { ...existing, ...updates };
      this.contextStore.set(requestId, updated);
      
      debug.info('ContextManager', 'Context updated', {
        requestId,
        updatedFields: Object.keys(updates)
      });
    }
  }
  
  /**
   * Cleans up old contexts to prevent memory leaks
   */
  cleanup(maxAge: number = 3600000): void { // 1 hour default
    const cutoff = Date.now() - maxAge;
    let cleaned = 0;
    
    for (const [requestId, context] of this.contextStore.entries()) {
      const contextTime = new Date(context.timestamp).getTime();
      if (contextTime < cutoff) {
        this.contextStore.delete(requestId);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      debug.info('ContextManager', 'Cleaned up old contexts', {
        cleaned,
        remaining: this.contextStore.size
      });
    }
  }
  

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  // API campaign creation removed - only Orchestrator creates campaigns
  
  /**
   * Saves context snapshot for debugging
   */
  private async saveContextSnapshot(context: AgentRunContext): Promise<void> {
    try {
      const snapshotPath = path.join(
        context.campaign.path,
        'debug',
        `context-snapshot-${context.requestId}.json`
      );
      
      await fs.mkdir(path.dirname(snapshotPath), { recursive: true });
      await fs.writeFile(snapshotPath, JSON.stringify(context, null, 2));
      
      debug.info('ContextManager', 'Context snapshot saved', {
        requestId: context.requestId,
        snapshotPath
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      debug.warn('ContextManager', 'Failed to save context snapshot', {
        error: errorMessage,
        requestId: context.requestId
      });
    }
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Creates enhanced context for agent run() calls
 */
export async function createEnhancedContext(
  request: string,
  baseContext: Partial<AgentRunContext> = {},
  options: ContextEnhancementOptions = {}
): Promise<AgentRunContext> {
  const manager = ContextManager.getInstance();
  return await manager.createAgentRunContext(request, baseContext, options);
}

/**
 * Enhances context for specialist handoffs
 */
export async function enhanceContextForHandoff(
  currentContext: AgentRunContext,
  fromSpecialist: string,
  toSpecialist: string,
  handoffData: any
): Promise<AgentRunContext> {
  const manager = ContextManager.getInstance();
  return await manager.enhanceContextForHandoff(currentContext, fromSpecialist, toSpecialist, handoffData);
}

/**
 * Validates context structure
 */
export async function validateAgentContext(context: AgentRunContext): Promise<void> {
  const manager = ContextManager.getInstance();
  await manager.validateContext(context);
}

/**
 * Gets context manager instance
 */
export function getContextManager(): ContextManager {
  return ContextManager.getInstance();
}

// Start cleanup timer
setInterval(() => {
  ContextManager.getInstance().cleanup();
}, 600000); // Cleanup every 10 minutes