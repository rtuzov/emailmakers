/**
 * 🚨 COMPREHENSIVE ERROR TYPES - OpenAI Agents SDK
 * 
 * Comprehensive error type system for better debugging and error handling
 * across all agent operations, specialists, and file operations.
 * 
 * Features:
 * - Hierarchical error classification
 * - Rich error context and metadata
 * - Integration with retry and monitoring systems
 * - Type-safe error handling patterns
 * - Enhanced debugging information
 */

import { AgentRunContext } from './context-manager';
import { RetryContext } from './file-operations-retry';

// ============================================================================
// BASE ERROR TYPES
// ============================================================================

/**
 * Base error class for all Email-Makers operations
 */
export abstract class EmailMakersError extends Error {
  public readonly errorType: string;
  public readonly timestamp: string;
  public readonly errorId: string;
  public readonly context?: Record<string, any>;
  public readonly retryable: boolean;
  public readonly severity: 'low' | 'medium' | 'high' | 'critical';

  constructor(
    message: string,
    errorType: string,
    options: {
      context?: Record<string, any>;
      retryable?: boolean;
      severity?: 'low' | 'medium' | 'high' | 'critical';
      cause?: Error;
    } = {}
  ) {
    super(message);
    this.name = this.constructor.name;
    this.errorType = errorType;
    this.timestamp = new Date().toISOString();
    this.errorId = `err_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    this.context = options.context;
    this.retryable = options.retryable ?? false;
    this.severity = options.severity ?? 'medium';

    if (options.cause) {
      this.cause = options.cause;
    }

    // Capture stack trace
    Error.captureStackTrace?.(this, this.constructor);
  }

  /**
   * Serializes error for logging and monitoring
   */
  toJSON(): Record<string, any> {
    return {
      errorId: this.errorId,
      errorType: this.errorType,
      name: this.name,
      message: this.message,
      timestamp: this.timestamp,
      retryable: this.retryable,
      severity: this.severity,
      context: this.context,
      stack: this.stack,
      cause: this.cause ? {
        name: (this.cause as Error).name,
        message: (this.cause as Error).message,
        stack: (this.cause as Error).stack
      } : undefined
    };
  }

  /**
   * Gets error summary for user display
   */
  getSummary(): string {
    return `[${this.errorType}] ${this.message}`;
  }

  /**
   * Gets detailed error information for debugging
   */
  getDetails(): Record<string, any> {
    return {
      ...this.toJSON(),
      detailedContext: this.context,
      troubleshootingHints: this.getTroubleshootingHints()
    };
  }

  /**
   * Override in subclasses to provide specific troubleshooting hints
   */
  protected getTroubleshootingHints(): string[] {
    return ['Check the error context for more details'];
  }
}

// ============================================================================
// CAMPAIGN ERRORS
// ============================================================================

export class CampaignError extends EmailMakersError {
  constructor(
    message: string,
    public readonly campaignId?: string,
    public readonly campaignPath?: string,
    options: {
      context?: Record<string, any>;
      retryable?: boolean;
      severity?: 'low' | 'medium' | 'high' | 'critical';
      cause?: Error;
    } = {}
  ) {
    super(message, 'CAMPAIGN_ERROR', {
      ...options,
      context: {
        campaignId,
        campaignPath,
        ...options.context
      }
    });
  }

  protected getTroubleshootingHints(): string[] {
    return [
      'Verify campaign ID and path are correct',
      'Check if campaign directory exists and is accessible',
      'Ensure campaign metadata is properly formatted'
    ];
  }
}

export class CampaignNotFoundError extends CampaignError {
  constructor(campaignId: string, campaignPath?: string) {
    super(
      `Campaign not found: ${campaignId}`,
      campaignId,
      campaignPath,
      { severity: 'high' }
    );
  }

  protected getTroubleshootingHints(): string[] {
    return [
      'Verify the campaign ID is correct',
      'Check if the campaign was deleted or moved',
      'Ensure proper permissions to access the campaign directory'
    ];
  }
}

export class CampaignPathError extends CampaignError {
  constructor(path: string, operation: string, cause?: Error) {
    super(
      `Campaign path error during ${operation}: ${path}`,
      undefined,
      path,
      { cause, severity: 'medium', retryable: true }
    );
  }

  protected getTroubleshootingHints(): string[] {
    return [
      'Check if the path exists and is accessible',
      'Verify file system permissions',
      'Ensure the path format is correct'
    ];
  }
}

// ============================================================================
// DATA ERRORS
// ============================================================================

export class DataError extends EmailMakersError {
  constructor(
    message: string,
    public readonly dataType: string,
    public readonly filePath?: string,
    options: {
      context?: Record<string, any>;
      retryable?: boolean;
      severity?: 'low' | 'medium' | 'high' | 'critical';
      cause?: Error;
    } = {}
  ) {
    super(message, 'DATA_ERROR', {
      ...options,
      context: {
        dataType,
        filePath,
        ...options.context
      }
    });
  }

  protected getTroubleshootingHints(): string[] {
    return [
      'Verify the data file exists and is readable',
      'Check data format and schema validity',
      'Ensure data collection completed successfully'
    ];
  }
}

export class DataExtractionError extends DataError {
  constructor(
    field: string,
    dataType: string,
    filePath?: string,
    cause?: Error
  ) {
    super(
      `Failed to extract ${field} from ${dataType} data`,
      dataType,
      filePath,
      { cause, severity: 'high' }
    );
  }

  protected getTroubleshootingHints(): string[] {
    return [
      'Check if the required field exists in the data',
      'Verify data collection completed for this field',
      'Ensure data format matches expected schema'
    ];
  }
}

export class DataValidationError extends DataError {
  constructor(
    field: string,
    expectedType: string,
    actualValue: any,
    filePath?: string
  ) {
    super(
      `Data validation failed for ${field}: expected ${expectedType}, got ${typeof actualValue}`,
      'validation',
      filePath,
      { 
        severity: 'medium',
        context: { field, expectedType, actualValue }
      }
    );
  }

  protected getTroubleshootingHints(): string[] {
    return [
      'Check the data schema definition',
      'Verify data transformation is working correctly',
      'Ensure data sources provide the expected format'
    ];
  }
}

// ============================================================================
// FILE OPERATION ERRORS
// ============================================================================

export class FileOperationError extends EmailMakersError {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly filePath: string,
    public readonly retryContext?: RetryContext,
    options: {
      context?: Record<string, any>;
      retryable?: boolean;
      severity?: 'low' | 'medium' | 'high' | 'critical';
      cause?: Error;
    } = {}
  ) {
    super(message, 'FILE_OPERATION_ERROR', {
      ...options,
      context: {
        operation,
        filePath,
        retryContext,
        ...options.context
      }
    });
  }

  protected getTroubleshootingHints(): string[] {
    return [
      'Check file permissions and accessibility',
      'Verify disk space availability',
      'Ensure the file path is correct and directory exists'
    ];
  }
}

export class FileNotFoundError extends FileOperationError {
  constructor(filePath: string, operation: string = 'read') {
    super(
      `File not found: ${filePath}`,
      operation,
      filePath,
      undefined,
      { severity: 'high', retryable: true }
    );
  }

  protected getTroubleshootingHints(): string[] {
    return [
      'Verify the file path is correct',
      'Check if the file was moved or deleted',
      'Ensure previous operations completed successfully'
    ];
  }
}

export class FileAccessError extends FileOperationError {
  constructor(filePath: string, operation: string, cause?: Error) {
    super(
      `File access denied: ${filePath}`,
      operation,
      filePath,
      undefined,
      { cause, severity: 'medium', retryable: true }
    );
  }

  protected getTroubleshootingHints(): string[] {
    return [
      'Check file and directory permissions',
      'Verify the process has required access rights',
      'Ensure the file is not locked by another process'
    ];
  }
}

// ============================================================================
// HANDOFF ERRORS
// ============================================================================

export class HandoffError extends EmailMakersError {
  constructor(
    message: string,
    public readonly fromAgent: string,
    public readonly toAgent: string,
    public readonly handoffData?: any,
    options: {
      context?: Record<string, any>;
      retryable?: boolean;
      severity?: 'low' | 'medium' | 'high' | 'critical';
      cause?: Error;
    } = {}
  ) {
    super(message, 'HANDOFF_ERROR', {
      ...options,
      context: {
        fromAgent,
        toAgent,
        handoffData: handoffData ? typeof handoffData : undefined,
        ...options.context
      }
    });
  }

  protected getTroubleshootingHints(): string[] {
    return [
      'Verify handoff data completeness',
      'Check agent compatibility and requirements',
      'Ensure previous specialist completed successfully'
    ];
  }
}

export class HandoffValidationError extends HandoffError {
  constructor(
    validationErrors: string[],
    fromAgent: string,
    toAgent: string,
    handoffData?: any
  ) {
    super(
      `Handoff validation failed: ${validationErrors.join(', ')}`,
      fromAgent,
      toAgent,
      handoffData,
      { 
        severity: 'high',
        context: { validationErrors }
      }
    );
  }

  protected getTroubleshootingHints(): string[] {
    return [
      'Review the validation errors for specific issues',
      'Check if all required data was generated',
      'Verify schema compatibility between agents'
    ];
  }
}

// ============================================================================
// AGENT ERRORS
// ============================================================================

export class AgentError extends EmailMakersError {
  constructor(
    message: string,
    public readonly agentName: string,
    public readonly agentContext?: AgentRunContext,
    options: {
      context?: Record<string, any>;
      retryable?: boolean;
      severity?: 'low' | 'medium' | 'high' | 'critical';
      cause?: Error;
    } = {}
  ) {
    super(message, 'AGENT_ERROR', {
      ...options,
      context: {
        agentName,
        requestId: agentContext?.requestId,
        correlationId: agentContext?.dataFlow?.correlationId,
        currentPhase: agentContext?.currentPhase,
        ...options.context
      }
    });
  }

  protected getTroubleshootingHints(): string[] {
    return [
      'Check agent configuration and prompts',
      'Verify tool availability and permissions',
      'Review agent context and input data'
    ];
  }
}

export class AgentTimeoutError extends AgentError {
  constructor(
    agentName: string,
    timeoutMs: number,
    agentContext?: AgentRunContext
  ) {
    super(
      `Agent ${agentName} timed out after ${timeoutMs}ms`,
      agentName,
      agentContext,
      { severity: 'high', retryable: true }
    );
  }

  protected getTroubleshootingHints(): string[] {
    return [
      'Check if the operation is taking unusually long',
      'Verify external service availability',
      'Consider increasing timeout for complex operations'
    ];
  }
}

export class AgentConfigurationError extends AgentError {
  constructor(
    agentName: string,
    configIssue: string,
    agentContext?: AgentRunContext
  ) {
    super(
      `Agent ${agentName} configuration error: ${configIssue}`,
      agentName,
      agentContext,
      { severity: 'critical' }
    );
  }

  protected getTroubleshootingHints(): string[] {
    return [
      'Review agent configuration files',
      'Check environment variables and API keys',
      'Verify tool and prompt availability'
    ];
  }
}

// ============================================================================
// VALIDATION ERRORS
// ============================================================================

export class ValidationError extends EmailMakersError {
  constructor(
    field: string,
    value: any,
    expectedFormat: string,
    options: {
      context?: Record<string, any>;
      retryable?: boolean;
      severity?: 'low' | 'medium' | 'high' | 'critical';
      cause?: Error;
    } = {}
  ) {
    super(
      `Validation failed for ${field}: expected ${expectedFormat}, got ${typeof value}`,
      'VALIDATION_ERROR',
      {
        ...options,
        context: {
          field,
          value,
          expectedFormat,
          ...options.context
        }
      }
    );
  }

  protected getTroubleshootingHints(): string[] {
    return [
      'Check the input data format',
      'Verify schema definitions are up to date',
      'Ensure data transformation is working correctly'
    ];
  }
}

export class SchemaValidationError extends ValidationError {
  constructor(
    schemaName: string,
    validationErrors: string[],
    data: any
  ) {
    super(
      schemaName,
      data,
      'valid schema',
      {
        severity: 'medium',
        context: { schemaName, validationErrors, dataType: typeof data }
      }
    );
    this.message = `Schema validation failed for ${schemaName}: ${validationErrors.join(', ')}`;
  }

  protected getTroubleshootingHints(): string[] {
    return [
      'Review the specific validation errors',
      'Check if all required fields are present',
      'Verify data types match schema expectations'
    ];
  }
}

// ============================================================================
// EXTERNAL SERVICE ERRORS
// ============================================================================

export class ExternalServiceError extends EmailMakersError {
  constructor(
    message: string,
    public readonly serviceName: string,
    public readonly endpoint?: string,
    public readonly statusCode?: number,
    options: {
      context?: Record<string, any>;
      retryable?: boolean;
      severity?: 'low' | 'medium' | 'high' | 'critical';
      cause?: Error;
    } = {}
  ) {
    super(message, 'EXTERNAL_SERVICE_ERROR', {
      ...options,
      context: {
        serviceName,
        endpoint,
        statusCode,
        ...options.context
      },
      retryable: options.retryable ?? (statusCode ? statusCode >= 500 : true)
    });
  }

  protected getTroubleshootingHints(): string[] {
    return [
      'Check service availability and status',
      'Verify API keys and authentication',
      'Review rate limiting and quota usage'
    ];
  }
}

export class APIKeyError extends ExternalServiceError {
  constructor(serviceName: string, endpoint?: string) {
    super(
      `API key missing or invalid for ${serviceName}`,
      serviceName,
      endpoint,
      401,
      { severity: 'critical', retryable: false }
    );
  }

  protected getTroubleshootingHints(): string[] {
    return [
      'Check if API key is set in environment variables',
      'Verify API key is valid and not expired',
      'Ensure API key has required permissions'
    ];
  }
}

export class RateLimitError extends ExternalServiceError {
  constructor(serviceName: string, retryAfter?: number) {
    super(
      `Rate limit exceeded for ${serviceName}`,
      serviceName,
      undefined,
      429,
      { 
        severity: 'medium', 
        retryable: true,
        context: { retryAfter }
      }
    );
  }

  protected getTroubleshootingHints(): string[] {
    return [
      'Wait before retrying the request',
      'Check rate limiting policies',
      'Consider implementing request throttling'
    ];
  }
}

// ============================================================================
// PROCESSING ERRORS
// ============================================================================

export class ProcessingError extends EmailMakersError {
  constructor(
    message: string,
    public readonly stage: string,
    public readonly inputData?: any,
    options: {
      context?: Record<string, any>;
      retryable?: boolean;
      severity?: 'low' | 'medium' | 'high' | 'critical';
      cause?: Error;
    } = {}
  ) {
    super(message, 'PROCESSING_ERROR', {
      ...options,
      context: {
        stage,
        inputDataType: inputData ? typeof inputData : undefined,
        ...options.context
      }
    });
  }

  protected getTroubleshootingHints(): string[] {
    return [
      'Check input data quality and format',
      'Verify processing pipeline configuration',
      'Review stage-specific requirements'
    ];
  }
}

export class ContentGenerationError extends ProcessingError {
  constructor(contentType: string, reason: string, inputData?: any) {
    super(
      `Failed to generate ${contentType}: ${reason}`,
      'content-generation',
      inputData,
      { severity: 'high', retryable: true }
    );
  }

  protected getTroubleshootingHints(): string[] {
    return [
      'Check content generation prompts and templates',
      'Verify AI service availability and limits',
      'Review input data completeness'
    ];
  }
}

export class TemplateProcessingError extends ProcessingError {
  constructor(templateType: string, reason: string, templateData?: any) {
    super(
      `Failed to process ${templateType} template: ${reason}`,
      'template-processing',
      templateData,
      { severity: 'high' }
    );
  }

  protected getTroubleshootingHints(): string[] {
    return [
      'Check template syntax and format',
      'Verify template engine configuration',
      'Ensure required template variables are provided'
    ];
  }
}

// ============================================================================
// ERROR FACTORY FUNCTIONS
// ============================================================================

/**
 * Creates appropriate error based on error type and context
 */
export function createError(
  errorType: string,
  message: string,
  context: Record<string, any> = {},
  cause?: Error
): EmailMakersError {
  switch (errorType) {
    case 'CAMPAIGN_ERROR':
      return new CampaignError(message, context.campaignId, context.campaignPath, { cause });
    
    case 'FILE_OPERATION_ERROR':
      return new FileOperationError(message, context.operation, context.filePath, context.retryContext, { cause });
    
    case 'HANDOFF_ERROR':
      return new HandoffError(message, context.fromAgent, context.toAgent, context.handoffData, { cause });
    
    case 'AGENT_ERROR':
      return new AgentError(message, context.agentName, context.agentContext, { cause });
    
    case 'VALIDATION_ERROR':
      return new ValidationError(context.field, context.value, context.expectedFormat, { cause });
    
    case 'EXTERNAL_SERVICE_ERROR':
      return new ExternalServiceError(message, context.serviceName, context.endpoint, context.statusCode, { cause });
    
    case 'PROCESSING_ERROR':
      return new ProcessingError(message, context.stage, context.inputData, { cause });
    
    default:
      // Create a concrete implementation for unknown error types
      class GenericEmailMakersError extends EmailMakersError {
        constructor(message: string, errorType: string, options: any = {}) {
          super(message, errorType, options);
        }
        
        protected getTroubleshootingHints(): string[] {
          return ['Check the error context for more details'];
        }
      }
      return new GenericEmailMakersError(message, errorType, { context, cause });
  }
}

/**
 * Extracts error information for logging and monitoring
 */
export function extractErrorInfo(error: Error): Record<string, any> {
  if (error instanceof EmailMakersError) {
    return error.toJSON();
  }
  
  return {
    errorId: `external_${Date.now()}`,
    errorType: 'EXTERNAL_ERROR',
    name: error.name,
    message: error.message,
    timestamp: new Date().toISOString(),
    retryable: false,
    severity: 'medium',
    stack: error.stack,
    cause: error.cause ? {
      name: (error.cause as Error).name,
      message: (error.cause as Error).message
    } : undefined
  };
}

/**
 * Checks if error is retryable
 */
export function isRetryableError(error: Error): boolean {
  if (error instanceof EmailMakersError) {
    return error.retryable;
  }
  
  // Check common retryable error patterns
  const retryablePatterns = [
    'ECONNRESET',
    'ENOTFOUND',
    'ETIMEDOUT',
    'ECONNREFUSED',
    'EMFILE',
    'EBUSY',
    'EAGAIN'
  ];
  
  return retryablePatterns.some(pattern => 
    error.message.includes(pattern) || 
    (error as any).code === pattern
  );
}

/**
 * Gets error severity level
 */
export function getErrorSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
  if (error instanceof EmailMakersError) {
    return error.severity;
  }
  
  // Determine severity based on error type
  if (error.name === 'TypeError' || error.name === 'ReferenceError') {
    return 'critical';
  }
  
  if (error.name === 'SyntaxError' || error.name === 'ValidationError') {
    return 'high';
  }
  
  return 'medium';
}

// All error types are already exported individually above