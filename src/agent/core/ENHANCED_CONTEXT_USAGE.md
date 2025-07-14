# Enhanced Context Parameter Usage - OpenAI Agents SDK

## Overview

This document describes the enhanced context parameter usage system implemented for optimal OpenAI Agents SDK integration. The system provides standardized, validated, and enriched context for all agent `run()` calls with comprehensive data flow tracking.

## Key Improvements

### 1. Standardized Context Structure
- **Unified Schema**: All context follows the `AgentRunContextSchema` with consistent field structure
- **Type Safety**: Full TypeScript support with Zod validation
- **Required Fields**: Ensures all essential context data is present

### 2. Enhanced Data Flow Tracking
- **Correlation IDs**: Track data pipeline progression across all specialists
- **Handoff Chain**: Complete audit trail of agent-to-agent transitions
- **Previous Results**: Access to all prior specialist outputs
- **Persistent State**: Data that flows through entire workflow

### 3. Comprehensive Monitoring
- **Performance Tracking**: Built-in execution metrics and timing
- **Debug Output**: Configurable debugging and context snapshots
- **Quality Metrics**: Validation levels and quality thresholds
- **Error Handling**: Sophisticated error handling strategies

## Usage Examples

### 1. Basic Agent Run with Enhanced Context

```typescript
import { run } from '@openai/agents';
import { createEnhancedContext } from './core/context-manager';
import { contentSpecialistAgent } from './core/tool-registry';

// Create enhanced context
const context = await createEnhancedContext(
  'Generate email for Thailand travel campaign',
  {
    campaign: {
      id: 'thailand-promo-2024',
      name: 'Thailand Spring Promotion',
      brand: 'TravelDeals',
      type: 'promotional'
    },
    execution: {
      mode: 'production',
      maxTurns: 15
    },
    quality: {
      validationLevel: 'strict',
      qualityThreshold: 90
    }
  },
  {
    validateRequired: true,
    enableSnapshot: true
  }
);

// Run agent with enhanced context
const result = await run(contentSpecialistAgent, request, { 
  context,
  maxTurns: context.execution.maxTurns 
});
```

### 2. Specialist Handoff with Context Enhancement

```typescript
import { enhanceContextForHandoff } from './core/context-manager';

// Enhance context for handoff from Content to Design
const enhancedContext = await enhanceContextForHandoff(
  currentContext,
  'content',
  'design',
  contentHandoffData
);

// Run next specialist with enhanced context
const result = await run(designSpecialistAgent, request, { 
  context: enhancedContext 
});
```

### 3. API Integration with Enhanced Context

```typescript
// In API route
const result = await agent.processRequest(requestString, {
  traceId: `api-${Date.now()}`,
  campaignId: 'customer-campaign-123',
  metadata: {
    apiRequest: true,
    validationLevel: 'standard',
    qualityThreshold: 85,
    clientInfo: {
      userAgent: request.headers.get('user-agent'),
      clientIp: request.headers.get('x-forwarded-for')
    }
  },
  context: {
    httpEndpoint: '/api/agent/run',
    requestId: requestId,
    customData: additionalContext
  }
});
```

## Context Structure Reference

### Core Fields

```typescript
interface AgentRunContext {
  // Identification
  requestId: string;           // Unique request identifier
  traceId: string | null;      // Trace ID for monitoring
  timestamp: string;           // Context creation timestamp
  
  // Workflow Management  
  workflowType: 'full-campaign' | 'specialist-direct' | 'test' | 'partial';
  currentPhase: 'data-collection' | 'content' | 'design' | 'quality' | 'delivery';
  totalPhases: number;         // Total workflow phases
  phaseIndex: number;          // Current phase index (0-based)
  
  // Campaign Context
  campaign: {
    id: string;                // Campaign identifier
    name: string;              // Campaign name  
    path: string;              // Campaign folder path
    brand: string;             // Brand name
    language: string;          // Campaign language (default: 'ru')
    type: 'promotional' | 'transactional' | 'newsletter' | 'announcement';
  };
  
  // Execution Context
  execution: {
    mode: 'production' | 'development' | 'test';
    apiRequest: boolean;       // Whether this is an API request
    directSpecialistRun: boolean; // Whether this is direct specialist run
    timeout: number | null;    // Execution timeout in ms
    maxTurns: number;          // Maximum conversation turns
    retryAttempt: number;      // Current retry attempt
  };
  
  // Data Flow Context
  dataFlow: {
    previousResults: Record<string, any>; // Results from previous specialists
    handoffData: any;          // Current handoff data
    persistentState: Record<string, any>; // Persistent workflow state
    correlationId: string;     // Pipeline correlation ID
    handoffChain: string[];    // Chain of specialist handoffs
  };
  
  // Quality Control
  quality: {
    validationLevel: 'strict' | 'standard' | 'relaxed';
    requiresApproval: boolean; // Whether results require approval
    qualityThreshold: number;  // Minimum quality threshold (0-100)
    errorHandling: 'fail-fast' | 'collect-errors' | 'ignore-warnings';
  };
  
  // Monitoring & Debugging
  monitoring: {
    enableDebugOutput: boolean;  // Enable debug output
    logLevel: 'error' | 'warn' | 'info' | 'debug' | 'trace';
    performanceTracking: boolean; // Enable performance tracking
    contextSnapshot: boolean;    // Save context snapshots
    additionalMetrics: Record<string, any>; // Custom metrics
  };
  
  // Extensibility
  extensions: Record<string, any>; // Custom extensions
  metadata: Record<string, any>;   // Additional metadata
}
```

## Best Practices

### 1. Context Creation
- Always use `createEnhancedContext()` for new workflows
- Provide meaningful campaign information
- Set appropriate quality thresholds
- Enable debugging in development mode

### 2. Handoff Enhancement
- Use `enhanceContextForHandoff()` between specialists
- Preserve correlation IDs for tracking
- Pass complete handoff data
- Validate context after enhancement

### 3. Error Handling
- Set appropriate `errorHandling` strategy
- Use `fail-fast` for production critical workflows
- Use `collect-errors` for comprehensive validation
- Monitor context validation failures

### 4. Performance Optimization
- Enable `performanceTracking` for metrics
- Set reasonable `maxTurns` limits
- Use appropriate `timeout` values
- Clean up old contexts regularly

### 5. Debugging & Monitoring
- Enable `contextSnapshot` in development
- Use structured logging levels
- Include correlation IDs in all logs
- Monitor handoff chain progression

## Integration Points

### 1. Main Agent Integration
The `EmailMakersAgent` class automatically uses enhanced context:

```typescript
const agent = new EmailMakersAgent();
const result = await agent.processRequest(request, {
  campaignId: 'my-campaign',
  metadata: { customField: 'value' }
});
```

### 2. Tool Integration
Tools receive enhanced context in their `execute` function:

```typescript
export const myTool = tool({
  name: 'myTool',
  execute: async (params, context: AgentRunContext) => {
    // Access enhanced context
    console.log('Correlation ID:', context.dataFlow.correlationId);
    console.log('Campaign:', context.campaign.name);
    console.log('Quality Threshold:', context.quality.qualityThreshold);
    
    // Use context for decision making
    if (context.quality.validationLevel === 'strict') {
      // Apply strict validation
    }
  }
});
```

### 3. Specialist Agent Integration
Specialist agents automatically receive enhanced context through handoffs:

```typescript
// Context flows automatically through SDK handoffs
export const contentSpecialistAgent = Agent.create({
  name: 'Content Specialist',
  instructions: loadPrompt('specialists/content-specialist.md'),
  tools: [...contentSpecialistTools],
  handoffs: [designSpecialistAgent] // Context flows to next agent
});
```

## Monitoring & Debugging

### 1. Context Snapshots
When `contextSnapshot` is enabled, context is saved to:
```
{campaignPath}/debug/context-snapshot-{requestId}.json
```

### 2. Performance Metrics
Track execution time, handoff counts, and validation results:

```typescript
const contextManager = getContextManager();
const context = contextManager.getContext(requestId);
console.log('Handoff chain:', context?.dataFlow.handoffChain);
console.log('Execution time:', Date.now() - new Date(context?.timestamp).getTime());
```

### 3. Correlation Tracking
Use correlation IDs to track requests across the entire pipeline:

```typescript
console.log(`[${context.dataFlow.correlationId}] Processing ${context.currentPhase}`);
```

## Migration Guide

### From Basic Context
```typescript
// OLD: Basic context
const result = await run(agent, request, {
  context: { 
    campaignId: 'test',
    metadata: { foo: 'bar' }
  }
});

// NEW: Enhanced context
const enhancedContext = await createEnhancedContext(request, {
  campaign: { 
    id: 'test',
    name: 'Test Campaign'
  },
  metadata: { foo: 'bar' }
});

const result = await run(agent, request, { context: enhancedContext });
```

### From Manual Handoffs
```typescript
// OLD: Manual handoff
const handoffData = prepareHandoff(data);
const result = await run(nextAgent, request, { context: handoffData });

// NEW: Enhanced handoff
const enhancedContext = await enhanceContextForHandoff(
  currentContext,
  'content',
  'design', 
  handoffData
);
const result = await run(nextAgent, request, { context: enhancedContext });
```

## Configuration

### Environment Variables
```bash
# Enable development features
NODE_ENV=development

# Context management settings  
CONTEXT_SNAPSHOT_ENABLED=true
CONTEXT_DEBUG_OUTPUT=true
CONTEXT_CLEANUP_INTERVAL=600000  # 10 minutes
```

### Context Options
```typescript
interface ContextEnhancementOptions {
  preserveExisting?: boolean;    // Preserve existing context fields
  validateRequired?: boolean;    // Validate required fields
  enableSnapshot?: boolean;      // Save context snapshots
  debugOutput?: boolean;         // Enable debug output
}
```

This enhanced context system provides comprehensive, validated, and trackable context for all OpenAI Agents SDK `run()` calls, ensuring optimal data flow and debugging capabilities throughout the email generation workflow.