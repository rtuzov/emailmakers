import { SmartErrorHandler } from '../ultrathink/smart-error-handler';
import { logger } from './logger';

export const ErrorOrchestrator = SmartErrorHandler;

/**
 * Unified helper to log and convert error into standard result shape.
 */
export function handleToolErrorUnified(toolName: string, error: any) {
  logger.error(`Tool ${toolName} failed`, { error: error?.message || error });
  ErrorOrchestrator.handleError(error, toolName, 0).catch(() => {});
  return {
    success: false,
    error: error instanceof Error ? error.message : String(error),
  };
} 