# Multi-Agent System Architecture Documentation

## Overview

The Email-Makers project uses a sophisticated multi-agent system built on top of the OpenAI Agents SDK. This architecture enables the generation of high-quality email campaigns through a coordinated workflow of specialized agents.

## Architecture Components

### 1. Core Agent System

#### Main Entry Points
- **EmailMakersAgent** (`/src/agent/main-agent.ts`): Primary orchestration interface
- **EmailCampaignOrchestrator** (`/src/agent/specialists/specialist-agents.ts`): Mandatory entry point for all workflows

#### Agent Model Configuration
- Primary Model: GPT-4o mini (as per project requirements)
- Configuration managed through `getAgentModel()` function
- Environment-based model selection supported

### 2. Specialist Agents

The system consists of 5 specialist agents that work in sequence:

#### 2.1 Data Collection Specialist
- **Purpose**: Gathers pricing data, destination information, and market intelligence
- **Handoff**: Automatically transfers to Content Specialist
- **Key Tools**:
  - Pricing intelligence gathering
  - Destination analysis
  - Market trend analysis
  - Emotional profile creation

#### 2.2 Content Specialist
- **Purpose**: Generates compelling email content and asset strategies
- **Handoff**: Automatically transfers to Design Specialist
- **Key Tools**:
  - Content generation with OpenAI
  - Asset manifest creation
  - Technical specification generation
  - Context analysis

#### 2.3 Design Specialist V3
- **Purpose**: Creates intelligent MJML email templates with AI content analysis
- **Handoff**: Automatically transfers to Quality Specialist
- **Key Tools**:
  - MJML template generation
  - Figma integration
  - Asset optimization
  - Responsive design implementation

#### 2.4 Quality Specialist
- **Purpose**: Validates email templates for cross-client compatibility
- **Handoff**: Automatically transfers to Delivery Specialist
- **Key Tools**:
  - HTML/CSS validation
  - Email client testing
  - Accessibility compliance
  - Performance analysis

#### 2.5 Delivery Specialist
- **Purpose**: Finalizes and packages email campaigns for delivery
- **Handoff**: None (final agent in chain)
- **Key Tools**:
  - Package creation
  - Documentation generation
  - Deployment preparation
  - Final delivery report

### 3. Agent Communication

#### 3.1 Handoff Mechanism
- Uses OpenAI Agents SDK native handoff functionality
- Each agent has a `handoffs` array pointing to the next agent
- Context is preserved through the SDK's context parameter

#### 3.2 Transfer Tools
Transfer tools in `/src/agent/core/transfer-tools.ts` enable orchestrator-managed handoffs:
- `transferToDataCollectionSpecialist`
- `transferToContentSpecialist`
- `transferToDesignSpecialist`
- `transferToQualitySpecialist`
- `transferToDeliverySpecialist`

#### 3.3 Context Flow
```typescript
// Context structure passed between agents
AgentRunContext {
  requestId: string
  traceId: string | null
  campaign: {
    id: string
    name: string
    path: string
    brand: string
    language: string
    type: 'promotional' | 'transactional' | 'newsletter' | 'announcement'
  }
  dataFlow: {
    previousResults: Record<string, unknown>
    handoffData: Record<string, unknown> | null
    persistentState: Record<string, unknown>
    correlationId: string
    handoffChain: string[]
  }
  // ... additional fields
}
```

### 4. State Management

#### 4.1 Context Manager
The `ContextManager` (`/src/agent/core/context-manager.ts`) provides:
- Centralized context creation and validation
- Context enhancement for handoffs
- State persistence across agent transitions
- Context snapshots for debugging

#### 4.2 Campaign Structure
Each campaign gets a dedicated folder structure:
```
campaigns/campaign_[timestamp]_[id]/
├── content/      # Content Specialist outputs
├── data/         # Data Collection outputs
├── assets/       # Design Specialist assets
├── templates/    # MJML/HTML templates
├── docs/         # Documentation
├── handoffs/     # Inter-specialist data
├── exports/      # Final deliverables
└── logs/         # Process logs
```

### 5. Tool Organization

#### 5.1 Tool Registry
The central tool registry (`/src/agent/core/tool-registry.ts`) manages:
- Tool collections by specialist
- Dynamic prompt loading from `/prompts/` directory
- Tool statistics and capabilities

#### 5.2 Tool Categories
- **Common Tools**: Available to all agents
- **Specialist Tools**: Specific to each agent's domain
- **Transfer Tools**: For orchestrator handoffs

### 6. Error Handling

#### 6.1 Error Handler
The `ErrorHandler` (`/src/agent/core/error-handler.ts`) provides:
- Error categorization by type and severity
- Standardized error format
- Error metrics collection
- System health monitoring

#### 6.2 Error Types
- `VALIDATION_ERROR`: Input validation failures
- `CONTENT_EXTRACTION_ERROR`: Content processing issues
- `ASSET_SEARCH_ERROR`: Asset discovery problems
- `RENDERING_ERROR`: Template generation failures
- `HANDOFF_ERROR`: Agent communication issues

### 7. Monitoring and Logging

#### 7.1 Agent Logger
The `AgentLogger` (`/src/agent/core/agent-logger.ts`) offers:
- Structured JSON logging
- Performance metrics tracking
- Handoff event monitoring
- Campaign-folder-based log storage

#### 7.2 Log Categories
- `agent`: Agent execution logs
- `tool`: Tool execution logs
- `handoff`: Inter-agent handoff logs
- `performance`: Performance metrics
- `error`: Error tracking

### 8. Data Schemas

#### 8.1 Handoff Schemas
Comprehensive schemas in `/src/agent/core/handoff-schemas.ts` define:
- Content context structure
- Design context structure
- Quality context structure
- Delivery context structure
- Complete workflow context

#### 8.2 Schema Validation
- Zod-based schema validation
- Type-safe data transfer
- Automatic validation on handoffs

## Workflow Execution

### 1. Standard Workflow
```
User Request
    ↓
Orchestrator (creates campaign folder)
    ↓
Data Collection Specialist
    ↓
Content Specialist
    ↓
Design Specialist
    ↓
Quality Specialist
    ↓
Delivery Specialist
    ↓
Final Package
```

### 2. Direct Specialist Execution
Individual specialists can be run directly for testing:
```typescript
const agent = new EmailMakersAgent();
await agent.processRequest(request, {
  specialist: 'content',
  context: existingContext
});
```

### 3. Context Preservation
- Each agent receives full context from previous agents
- Context accumulates as workflow progresses
- Final context contains complete workflow history

## Key Technical Details

### 1. OpenAI Agents SDK Integration
- Uses `@openai/agents` package
- Agents created with `Agent.create()`
- Execution via `run(agent, request, { context })`
- Native handoff support through agent configuration

### 2. Strict Mode Requirements
- No automatic fallbacks allowed
- Campaign metadata must be explicitly provided
- File paths must exist before use
- All required fields must be populated

### 3. Performance Considerations
- Async/await for all I/O operations
- Buffered logging to reduce file I/O
- Context cleanup to prevent memory leaks
- Configurable max turns per agent (default: 20)

### 4. Security Features
- API key encryption
- Sensitive data sanitization in logs
- Context validation before handoffs
- Error message sanitization

## Migration Considerations for n8n

### 1. Agent Decomposition
Each specialist agent would become an n8n workflow node with:
- Input schema matching current context structure
- Tool execution as sub-nodes or custom functions
- Output schema for next agent

### 2. State Management
- Use n8n's workflow variables for context
- Implement context validation nodes
- Store intermediate results in workflow data

### 3. Error Handling
- Implement error catch nodes
- Map error types to n8n error handling
- Preserve error context for debugging

### 4. Monitoring
- Use n8n's execution logs
- Implement custom metrics nodes
- Create monitoring dashboard

### 5. Tool Migration
- Convert OpenAI SDK tools to n8n nodes
- Preserve tool parameters and schemas
- Implement tool retry logic

## Summary

The Email-Makers multi-agent system is a sophisticated orchestration of specialized agents using the OpenAI Agents SDK. The architecture emphasizes:
- Clear separation of concerns
- Type-safe data flow
- Comprehensive error handling
- Detailed monitoring and logging
- Strict validation without fallbacks

The system is designed for high-quality email campaign generation with full traceability and debugging capabilities throughout the workflow.