/**
 * 🔄 FILE OPERATIONS WITH RETRY LOGIC - OpenAI Agents SDK
 * 
 * Implements robust file operations with exponential backoff retry logic
 * for improved reliability in file system operations across all finalization tools.
 * 
 * Features:
 * - Exponential backoff retry mechanism
 * - Configurable retry counts and delays
 * - Comprehensive error logging and monitoring
 * - Type-safe operation wrappers
 * - Integration with existing agent context system
 */

import { promises as fs, Stats } from 'fs';
import path from 'path';
import { debuggers } from './debug-output';

const debug = debuggers.core;

// ============================================================================
// RETRY CONFIGURATION & TYPES
// ============================================================================

export interface RetryOptions {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
  enableLogging: boolean;
}

export interface RetryContext {
  operation: string;
  filePath: string;
  attempt: number;
  maxRetries: number;
  lastError?: Error;
  totalDuration: number;
  startTime: number;
}

export interface FileOperationResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalDuration: number;
  retryContext?: RetryContext;
}

// Default retry configuration optimized for file operations
const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelay: 100, // 100ms
  maxDelay: 2000,    // 2s max delay
  backoffMultiplier: 2,
  retryableErrors: [
    'ENOENT',  // File not found (temporary)
    'EBUSY',   // Resource busy
    'EMFILE',  // Too many open files
    'EAGAIN',  // Resource temporarily unavailable
    'ENOTDIR', // Not a directory (race condition)
    'EEXIST'   // File exists (for operations expecting non-existence)
  ],
  enableLogging: process.env.NODE_ENV === 'development'
};

// ============================================================================
// RETRY UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculates delay for exponential backoff
 */
function calculateDelay(attempt: number, options: RetryOptions): number {
  const delay = options.initialDelay * Math.pow(options.backoffMultiplier, attempt);
  return Math.min(delay, options.maxDelay);
}

/**
 * Checks if error is retryable based on configuration
 */
function isRetryableError(error: Error, options: RetryOptions): boolean {
  const errorCode = (error as any).code;
  return options.retryableErrors.includes(errorCode) || 
         error.message.includes('EMFILE') ||
         error.message.includes('EBUSY') ||
         error.message.includes('temporarily unavailable');
}

/**
 * Sleeps for specified duration
 */
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Logs retry attempt with context
 */
function logRetryAttempt(context: RetryContext, error: Error, options: RetryOptions): void {
  if (!options.enableLogging) return;
  
  debug.warn('FileRetry', `Retry attempt ${context.attempt}/${context.maxRetries} for ${context.operation}`, {
    filePath: context.filePath,
    error: error.message,
    errorCode: (error as any).code,
    attempt: context.attempt,
    operation: context.operation
  });
}

/**
 * Logs final retry result
 */
function logRetryResult<T>(result: FileOperationResult<T>, context: RetryContext, options: RetryOptions): void {
  if (!options.enableLogging) return;
  
  if (result.success) {
    debug.info('FileRetry', `Operation ${context.operation} succeeded after ${result.attempts} attempts`, {
      filePath: context.filePath,
      attempts: result.attempts,
      totalDuration: result.totalDuration,
      operation: context.operation
    });
  } else {
    debug.error('FileRetry', `Operation ${context.operation} failed after ${result.attempts} attempts`, {
      filePath: context.filePath,
      attempts: result.attempts,
      totalDuration: result.totalDuration,
      finalError: result.error?.message || 'Unknown error',
      errorType: result.error?.constructor?.name || 'Unknown',
      operation: context.operation
    });
  }
}

// ============================================================================
// CORE RETRY WRAPPER
// ============================================================================

/**
 * Generic retry wrapper for any async operation
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  filePath: string,
  options: Partial<RetryOptions> = {}
): Promise<FileOperationResult<T>> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  const startTime = Date.now();
  
  const context: RetryContext = {
    operation: operationName,
    filePath,
    attempt: 0,
    maxRetries: config.maxRetries,
    totalDuration: 0,
    startTime
  };
  
  let lastError: Error;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    context.attempt = attempt;
    
    try {
      const data = await operation();
      const totalDuration = Date.now() - startTime;
      
      const result: FileOperationResult<T> = {
        success: true,
        data,
        attempts: attempt + 1,
        totalDuration,
        retryContext: context
      };
      
      logRetryResult(result, context, config);
      return result;
      
    } catch (error) {
      lastError = error as Error;
      context.lastError = lastError;
      
      // If this is the last attempt or error is not retryable, fail
      if (attempt === config.maxRetries || !isRetryableError(lastError, config)) {
        break;
      }
      
      // Log retry attempt
      logRetryAttempt(context, lastError, config);
      
      // Wait before retry with exponential backoff
      const delay = calculateDelay(attempt, config);
      await sleep(delay);
    }
  }
  
  // All retries exhausted
  const totalDuration = Date.now() - startTime;
  const result: FileOperationResult<T> = {
    success: false,
    error: lastError,
    attempts: context.maxRetries + 1,
    totalDuration,
    retryContext: context
  };
  
  logRetryResult(result, context, config);
  return result;
}

// ============================================================================
// FILE OPERATION WRAPPERS
// ============================================================================

/**
 * Reads file with retry logic
 */
export async function readFileWithRetry(
  filePath: string,
  encoding: BufferEncoding = 'utf-8',
  options: Partial<RetryOptions> = {}
): Promise<FileOperationResult<string>> {
  return withRetry(
    () => fs.readFile(filePath, encoding),
    'readFile',
    filePath,
    options
  );
}

/**
 * Writes file with retry logic
 */
export async function writeFileWithRetry(
  filePath: string,
  data: string | Buffer,
  options: Partial<RetryOptions> = {}
): Promise<FileOperationResult<void>> {
  return withRetry(
    async () => {
      // Ensure directory exists first
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, data);
    },
    'writeFile',
    filePath,
    options
  );
}

/**
 * Checks file access with retry logic
 */
export async function accessFileWithRetry(
  filePath: string,
  mode?: number,
  options: Partial<RetryOptions> = {}
): Promise<FileOperationResult<boolean>> {
  return withRetry(
    async () => {
      await fs.access(filePath, mode);
      return true;
    },
    'accessFile',
    filePath,
    options
  );
}

/**
 * Creates directory with retry logic
 */
export async function mkdirWithRetry(
  dirPath: string,
  options: Partial<RetryOptions> = {}
): Promise<FileOperationResult<void>> {
  return withRetry(
    async () => {
      await fs.mkdir(dirPath, { recursive: true });
      return undefined;
    },
    'mkdir',
    dirPath,
    options
  );
}

/**
 * Reads directory with retry logic
 */
export async function readdirWithRetry(
  dirPath: string,
  options: Partial<RetryOptions> = {}
): Promise<FileOperationResult<string[]>> {
  return withRetry(
    () => fs.readdir(dirPath),
    'readdir',
    dirPath,
    options
  );
}

/**
 * Gets file stats with retry logic
 */
export async function statWithRetry(
  filePath: string,
  options: Partial<RetryOptions> = {}
): Promise<FileOperationResult<Stats>> {
  return withRetry(
    () => fs.stat(filePath),
    'stat',
    filePath,
    options
  );
}

/**
 * Copies file with retry logic
 */
export async function copyFileWithRetry(
  src: string,
  dest: string,
  options: Partial<RetryOptions> = {}
): Promise<FileOperationResult<void>> {
  return withRetry(
    async () => {
      // Ensure destination directory exists
      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.copyFile(src, dest);
    },
    'copyFile',
    `${src} -> ${dest}`,
    options
  );
}

/**
 * Removes file with retry logic
 */
export async function unlinkWithRetry(
  filePath: string,
  options: Partial<RetryOptions> = {}
): Promise<FileOperationResult<void>> {
  return withRetry(
    () => fs.unlink(filePath),
    'unlink',
    filePath,
    options
  );
}

// ============================================================================
// JSON OPERATIONS WITH RETRY
// ============================================================================

/**
 * Reads and parses JSON file with retry logic
 */
export async function readJSONWithRetry<T = any>(
  filePath: string,
  options: Partial<RetryOptions> = {}
): Promise<FileOperationResult<T>> {
  return withRetry(
    async () => {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content) as T;
    },
    'readJSON',
    filePath,
    options
  );
}

/**
 * Writes JSON file with retry logic
 */
export async function writeJSONWithRetry(
  filePath: string,
  data: any,
  options: Partial<RetryOptions> = {}
): Promise<FileOperationResult<void>> {
  return withRetry(
    async () => {
      const jsonContent = JSON.stringify(data, null, 2);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, jsonContent, 'utf-8');
    },
    'writeJSON',
    filePath,
    options
  );
}

// ============================================================================
// ENHANCED ERROR HANDLING
// ============================================================================

/**
 * Enhanced file operation that throws on failure or returns data on success
 */
export async function readFileOrThrow(
  filePath: string,
  encoding: BufferEncoding = 'utf-8',
  options: Partial<RetryOptions> = {}
): Promise<string> {
  const result = await readFileWithRetry(filePath, encoding, options);
  
  if (!result.success) {
    const error = new Error(
      `Failed to read file after ${result.attempts} attempts: ${filePath}. ` +
      `Last error: ${result.error?.message}`
    );
    (error as any).originalError = result.error;
    (error as any).retryContext = result.retryContext;
    throw error;
  }
  
  return result.data!;
}

/**
 * Enhanced JSON read that throws on failure
 */
export async function readJSONOrThrow<T = any>(
  filePath: string,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const result = await readJSONWithRetry<T>(filePath, options);
  
  if (!result.success) {
    const error = new Error(
      `Failed to read JSON file after ${result.attempts} attempts: ${filePath}. ` +
      `Last error: ${result.error?.message}`
    );
    (error as any).originalError = result.error;
    (error as any).retryContext = result.retryContext;
    throw error;
  }
  
  return result.data!;
}

/**
 * Enhanced write operation that throws on failure
 */
export async function writeFileOrThrow(
  filePath: string,
  data: string | Buffer,
  options: Partial<RetryOptions> = {}
): Promise<void> {
  const result = await writeFileWithRetry(filePath, data, options);
  
  if (!result.success) {
    const error = new Error(
      `Failed to write file after ${result.attempts} attempts: ${filePath}. ` +
      `Last error: ${result.error?.message}`
    );
    (error as any).originalError = result.error;
    (error as any).retryContext = result.retryContext;
    throw error;
  }
}

/**
 * Enhanced access check that throws on failure
 */
export async function accessFileOrThrow(
  filePath: string,
  mode?: number,
  options: Partial<RetryOptions> = {}
): Promise<void> {
  const result = await accessFileWithRetry(filePath, mode, options);
  
  if (!result.success) {
    const error = new Error(
      `File access failed after ${result.attempts} attempts: ${filePath}. ` +
      `Last error: ${result.error?.message}`
    );
    (error as any).originalError = result.error;
    (error as any).retryContext = result.retryContext;
    throw error;
  }
}

// ============================================================================
// CONFIGURATION UTILITIES
// ============================================================================

/**
 * Creates custom retry options for specific use cases
 */
export function createRetryOptions(overrides: Partial<RetryOptions>): RetryOptions {
  return { ...DEFAULT_RETRY_OPTIONS, ...overrides };
}

/**
 * Retry options optimized for critical operations
 */
export const CRITICAL_OPERATION_RETRY_OPTIONS: RetryOptions = {
  ...DEFAULT_RETRY_OPTIONS,
  maxRetries: 5,
  initialDelay: 200,
  maxDelay: 5000,
  enableLogging: true
};

/**
 * Retry options optimized for bulk operations
 */
export const BULK_OPERATION_RETRY_OPTIONS: RetryOptions = {
  ...DEFAULT_RETRY_OPTIONS,
  maxRetries: 2,
  initialDelay: 50,
  maxDelay: 1000,
  enableLogging: false
};

/**
 * Retry options for development/testing
 */
export const DEVELOPMENT_RETRY_OPTIONS: RetryOptions = {
  ...DEFAULT_RETRY_OPTIONS,
  maxRetries: 1,
  initialDelay: 100,
  maxDelay: 500,
  enableLogging: true
};

// Export default configuration
export { DEFAULT_RETRY_OPTIONS };