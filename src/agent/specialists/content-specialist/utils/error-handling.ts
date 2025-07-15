/**
 * Standardized Error Handling Utilities for Content Specialist
 * 
 * Provides consistent error handling patterns and type guards
 * for managing errors throughout the Content Specialist workflow.
 */

import { ToolError, ErrorHandler } from '../types';

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
 * Create standardized tool error
 */
export function createToolError(error: unknown, toolName: string): ToolError {
  const message = getErrorMessage(error);
  const toolError = new Error(`[${toolName}] ${message}`) as ToolError;
  toolError.toolName = toolName;
  toolError.originalError = error;
  return toolError;
}

/**
 * Standard error handler for content specialist tools
 */
export const contentSpecialistErrorHandler: ErrorHandler = (error: unknown, toolName: string): string => {
  const errorMessage = getErrorMessage(error);
  console.error(`❌ [${toolName}] Error:`, errorMessage);
  
  // Return user-friendly error message
  return `Failed to execute ${toolName}: ${errorMessage}`;
};

/**
 * Log error with context for debugging
 */
export function logErrorWithContext(
  error: unknown, 
  toolName: string, 
  context?: Record<string, any>
): void {
  console.error(`❌ [${toolName}] Error:`, {
    error: getErrorMessage(error),
    context,
    stack: isError(error) ? error.stack : undefined
  });
}

/**
 * Wrap async function with error handling
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  toolName: string
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      throw createToolError(error, toolName);
    }
  };
} 