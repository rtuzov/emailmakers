import { describe, test, expect } from '@jest/globals';
import { SmartErrorHandler } from './smart-error-handler';
import { ErrorStrategy } from './types';

describe('SmartErrorHandler', () => {

  /**
   * TC-SEH-01: Basic Error Strategy Detection
   */
  test('TC-SEH-01: Should detect correct error strategy for known patterns', () => {
    // Rate limit error
    const rateLimitError = new Error('Rate limit exceeded');
    const rateLimitStrategy = SmartErrorHandler.getErrorStrategy('get_prices', rateLimitError);
    
    expect(rateLimitStrategy.action).toBe('wait');
    expect(rateLimitStrategy.delay).toBe(5000);
    expect(rateLimitStrategy.fallback).toBe('use_estimated_prices');
    expect(rateLimitStrategy.maxAttempts).toBe(2);

    // Unauthorized error
    const authError = new Error('Unauthorized: Invalid API key');
    const authStrategy = SmartErrorHandler.getErrorStrategy('get_prices', authError);
    
    expect(authStrategy.action).toBe('fallback');
    expect(authStrategy.fallback).toBe('use_estimated_prices');
    expect(authStrategy.skipRetry).toBe(true);

    // Timeout error
    const timeoutError = new Error('Request timeout after 30 seconds');
    const timeoutStrategy = SmartErrorHandler.getErrorStrategy('get_prices', timeoutError);
    
    expect(timeoutStrategy.action).toBe('retry');
    expect(timeoutStrategy.delay).toBe(3000);
    expect(timeoutStrategy.modification).toBe('try_alternative_airports');
    expect(timeoutStrategy.maxAttempts).toBe(3);
  });

  /**
   * TC-SEH-02: Figma-specific Error Handling
   */
  test('TC-SEH-02: Should handle Figma-specific errors correctly', () => {
    // Figma rate limit
    const figmaRateLimit = new Error('API rate limit exceeded');
    const figmaStrategy = SmartErrorHandler.getErrorStrategy('get_figma_assets', figmaRateLimit);
    
    expect(figmaStrategy.action).toBe('wait');
    expect(figmaStrategy.delay).toBe(10000);
    expect(figmaStrategy.fallback).toBe('use_unsplash_fallback');

    // Figma unauthorized
    const figmaAuth = new Error('Access token is invalid');
    const figmaAuthStrategy = SmartErrorHandler.getErrorStrategy('get_figma_assets', figmaAuth);
    
    expect(figmaAuthStrategy.action).toBe('fallback');
    expect(figmaAuthStrategy.fallback).toBe('use_unsplash_fallback');
    expect(figmaAuthStrategy.skipRetry).toBe(true);
  });

  /**
   * TC-SEH-03: MJML Error Handling
   */
  test('TC-SEH-03: Should handle MJML compilation errors', () => {
    const mjmlError = new Error('MJML compilation failed: Invalid syntax');
    const mjmlStrategy = SmartErrorHandler.getErrorStrategy('render_mjml', mjmlError);
    
    expect(mjmlStrategy.action).toBe('retry');
    expect(mjmlStrategy.delay).toBe(1000);
    expect(mjmlStrategy.modification).toBe('use_simplified_template');
    expect(mjmlStrategy.maxAttempts).toBe(2);
  });

  /**
   * TC-SEH-04: Upload Service Error Handling
   */
  test('TC-SEH-04: Should handle upload service errors', () => {
    const uploadError = new Error('S3 upload failed: Network error');
    const uploadStrategy = SmartErrorHandler.getErrorStrategy('upload_s3', uploadError);
    
    expect(uploadStrategy.action).toBe('retry');
    expect(uploadStrategy.delay).toBe(2000);
    expect(uploadStrategy.maxAttempts).toBe(3);
  });

  /**
   * TC-SEH-05: Unknown Tool Fallback
   */
  test('TC-SEH-05: Should provide default strategy for unknown tools', () => {
    const unknownError = new Error('Some error');
    const defaultStrategy = SmartErrorHandler.getErrorStrategy('unknown_tool', unknownError);
    
    expect(defaultStrategy.action).toBe('standard_retry');
    expect(defaultStrategy.maxAttempts).toBe(3);
    expect(defaultStrategy.delay).toBe(1000);
  });

  /**
   * TC-SEH-06: Error Pattern Matching
   */
  test('TC-SEH-06: Should match error patterns correctly', () => {
    // Test various rate limit message variations
    const rateLimitMessages = [
      'Rate limit exceeded',
      'Too many requests',
      'API quota exceeded',
      'rate-limit-exceeded'
    ];

    rateLimitMessages.forEach(message => {
      const error = new Error(message);
      const strategy = SmartErrorHandler.getErrorStrategy('get_prices', error);
      expect(strategy.action).toBe('wait');
    });

    // Test unauthorized patterns
    const authMessages = [
      'Unauthorized',
      'Invalid API key',
      'Authentication failed',
      'Access denied'
    ];

    authMessages.forEach(message => {
      const error = new Error(message);
      const strategy = SmartErrorHandler.getErrorStrategy('get_figma_assets', error);
      expect(strategy.action).toBe('fallback');
    });
  });

  /**
   * TC-SEH-07: Error Context Analysis
   */
  test('TC-SEH-07: Should analyze error context correctly', () => {
    const context = {
      tool: 'get_prices',
      attempt: 2,
      lastError: 'timeout',
      duration: 35000
    };

    const analysis = SmartErrorHandler.analyzeErrorContext('get_prices', new Error('Timeout'), context);
    
    expect(analysis.shouldContinue).toBeDefined();
    expect(analysis.strategy).toBeDefined();
    expect(analysis.nextSteps).toBeDefined();
    expect(Array.isArray(analysis.nextSteps)).toBe(true);
  });

  /**
   * TC-SEH-08: Execution Context Integration
   */
  test('TC-SEH-08: Should integrate with execution context', async () => {
    const error = new Error('Network connection failed');
    const context = {
      tool: 'get_prices',
      attempt: 1,
      params: { origin: 'MOW', destination: 'LED' }
    };

    const result = await SmartErrorHandler.handleExecutionError(error, 'get_prices', 1, context);
    
    expect(result.shouldContinue).toBeDefined();
    expect(result.strategy).toBeDefined();
    expect(typeof result.shouldContinue).toBe('boolean');
  });

  /**
   * TC-SEH-09: Retry Logic Validation
   */
  test('TC-SEH-09: Should validate retry logic correctly', () => {
    // First attempt should usually allow retry
    const firstAttempt = SmartErrorHandler.getErrorStrategy('get_prices', new Error('Network error'));
    expect(firstAttempt.action).not.toBe('skip');

    // Test max attempts enforcement through context
    const maxAttemptsContext = {
      tool: 'get_prices',
      attempt: 5,
      errors: ['timeout', 'timeout', 'timeout', 'timeout']
    };

    const analysis = SmartErrorHandler.analyzeErrorContext(
      'get_prices', 
      new Error('Timeout'), 
      maxAttemptsContext
    );
    
    // Should eventually stop retrying after too many attempts
    expect(analysis.shouldContinue).toBe(false);
  });

  /**
   * TC-SEH-10: Specific Service Error Patterns
   */
  test('TC-SEH-10: Should handle specific service error patterns', () => {
    // No flights found
    const noFlightsError = new Error('No flights found for the specified route');
    const noFlightsStrategy = SmartErrorHandler.getErrorStrategy('get_prices', noFlightsError);
    
    expect(noFlightsStrategy.action).toBe('fallback');
    expect(noFlightsStrategy.fallback).toBe('use_estimated_prices');
    expect(noFlightsStrategy.modification).toBe('suggest_alternative_dates');

    // Figma node not found
    const figmaNotFound = new Error('Figma node not found');
    const figmaNotFoundStrategy = SmartErrorHandler.getErrorStrategy('get_figma_assets', figmaNotFound);
    
    expect(figmaNotFoundStrategy.action).toBe('fallback');
    expect(figmaNotFoundStrategy.fallback).toBe('use_unsplash_fallback');
  });

  /**
   * TC-SEH-11: Complex Error Scenarios
   */
  test('TC-SEH-11: Should handle complex error scenarios', async () => {
    // Simulate a complex scenario with multiple previous errors
    const complexContext = {
      tool: 'get_figma_assets',
      attempt: 3,
      previousErrors: ['rate_limit', 'timeout'],
      fallbackUsed: false,
      duration: 45000
    };

    const complexError = new Error('Service temporarily unavailable');
    const result = await SmartErrorHandler.handleExecutionError(
      complexError, 
      'get_figma_assets', 
      3, 
      complexContext
    );

    expect(result).toBeDefined();
    expect(result.strategy).toBeDefined();
    expect(result.nextSteps.length).toBeGreaterThan(0);
  });

  /**
   * TC-SEH-12: Edge Cases and Error Robustness
   */
  test('TC-SEH-12: Should handle edge cases gracefully', () => {
    // Null error
    const nullStrategy = SmartErrorHandler.getErrorStrategy('get_prices', null as any);
    expect(nullStrategy.action).toBe('standard_retry');

    // Undefined error
    const undefinedStrategy = SmartErrorHandler.getErrorStrategy('get_prices', undefined as any);
    expect(undefinedStrategy.action).toBe('standard_retry');

    // Non-Error object
    const stringError = SmartErrorHandler.getErrorStrategy('get_prices', 'string error' as any);
    expect(stringError.action).toBe('standard_retry');

    // Empty tool name
    const emptyToolStrategy = SmartErrorHandler.getErrorStrategy('', new Error('test'));
    expect(emptyToolStrategy.action).toBe('standard_retry');
  });
});