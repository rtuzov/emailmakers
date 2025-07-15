/**
 * Error Handling Utilities for Content Specialist
 * 
 * Provides standardized error handling patterns and type guards
 * for managing errors throughout the Content Specialist workflow.
 */

/**
 * Type guard to check if error is an Error instance
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Safely extract error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as any).message);
  }
  
  return String(error || 'Unknown error');
}

/**
 * Log error with context
 */
export function logErrorWithContext(
  error: unknown,
  context: Record<string, any> = {}
): string {
  const errorMessage = getErrorMessage(error);
  console.error('ContentSpecialist Error:', {
    error: errorMessage,
    ...context,
    timestamp: new Date().toISOString()
  });
  return errorMessage;
}

/**
 * Content Specialist specific error handler
 */
export function contentSpecialistErrorHandler(
  error: unknown,
  operation: string,
  params?: Record<string, any>
): never {
  const errorMessage = getErrorMessage(error);
  const context = {
    operation,
    params,
    timestamp: new Date().toISOString()
  };
  
  logErrorWithContext(error, context);
  throw new Error(`ContentSpecialist ${operation} failed: ${errorMessage}`);
} 