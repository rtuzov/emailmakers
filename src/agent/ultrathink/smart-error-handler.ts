import { ErrorStrategy } from './types';

export class SmartErrorHandler {
  
  // Tool-specific error patterns from experience
  private static readonly errorPatterns: Record<string, Record<string, ErrorStrategy>> = {
    'get_prices': {
      'rate_limit': {
        action: 'wait',
        delay: 5000,
        fallback: 'use_estimated_prices',
        maxAttempts: 2
      },
      'unauthorized': {
        action: 'fallback',
        fallback: 'use_estimated_prices',
        skipRetry: true
      },
      'timeout': {
        action: 'retry',
        delay: 3000,
        modification: 'try_alternative_airports',
        maxAttempts: 3
      },
      'no_flights_found': {
        action: 'fallback',
        fallback: 'use_estimated_prices',
        modification: 'suggest_alternative_dates'
      }
    },
    'get_figma_assets': {
      'rate_limit': {
        action: 'wait',
        delay: 10000,
        fallback: 'use_unsplash_fallback',
        maxAttempts: 2
      },
      'unauthorized': {
        action: 'fallback',
        fallback: 'use_unsplash_fallback',
        skipRetry: true
      },
      'timeout': {
        action: 'retry',
        delay: 2000,
        maxAttempts: 2
      },
      'not_found': {
        action: 'fallback',
        fallback: 'use_unsplash_fallback',
        modification: 'use_generic_assets'
      }
    },
    'generate_copy': {
      'rate_limit': {
        action: 'wait',
        delay: 15000,
        maxAttempts: 3
      },
      'timeout': {
        action: 'retry',
        delay: 5000,
        modification: 'reduce_content_complexity',
        maxAttempts: 2
      },
      'content_filter': {
        action: 'retry',
        modification: 'adjust_prompt_content',
        maxAttempts: 2
      }
    },
    'render_mjml': {
      'syntax_error': {
        action: 'retry',
        modification: 'fix_mjml_syntax',
        maxAttempts: 2
      },
      'template_error': {
        action: 'fallback',
        fallback: 'use_simple_template',
        modification: 'simplify_template'
      }
    },
    'percy_snap': {
      'timeout': {
        action: 'skip',
        modification: 'mark_visual_testing_skipped'
      },
      'unauthorized': {
        action: 'skip',
        modification: 'disable_visual_testing'
      }
    },
    'render_test': {
      'service_unavailable': {
        action: 'skip',
        modification: 'mark_render_testing_skipped'
      },
      'timeout': {
        action: 'retry',
        delay: 10000,
        maxAttempts: 2
      }
    },
    'upload_s3': {
      'unauthorized': {
        action: 'fallback',
        fallback: 'local_storage',
        modification: 'save_locally'
      },
      'quota_exceeded': {
        action: 'retry',
        delay: 2000,
        modification: 'compress_files',
        maxAttempts: 2
      }
    }
  };

  // Rate limit tracking to avoid repeated hits
  private static rateLimitTracker: Record<string, { lastHit: number; backoffMultiplier: number }> = {};

  /**
   * Handle error intelligently based on tool and error type
   */
  static async handleError(
    error: any, 
    tool: string, 
    attempt: number, 
    context?: any
  ): Promise<ErrorStrategy> {
    const errorType = this.identifyErrorType(error, tool);
    console.log(`🔍 SmartErrorHandler: ${tool} failed with ${errorType} (attempt ${attempt})`);

    // Get tool-specific strategy
    const toolPatterns = this.errorPatterns[tool];
    if (toolPatterns && toolPatterns[errorType]) {
      const strategy = { ...toolPatterns[errorType] };
      
      // Adjust strategy based on attempt number and context
      return this.adjustStrategy(strategy, tool, errorType, attempt, context);
    }

    // Generic error handling for unknown patterns
    return this.getGenericStrategy(error, tool, attempt);
  }

  /**
   * Identify error type from error object
   */
  private static identifyErrorType(error: any, tool: string): string {
    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code || error.status;

    // Rate limiting detection
    if (
      errorMessage.includes('rate limit') ||
      errorMessage.includes('too many requests') ||
      errorCode === 429
    ) {
      return 'rate_limit';
    }

    // Authentication errors
    if (
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('invalid token') ||
      errorMessage.includes('authentication') ||
      errorCode === 401
    ) {
      return 'unauthorized';
    }

    // Timeout errors
    if (
      errorMessage.includes('timeout') ||
      errorMessage.includes('timed out') ||
      errorCode === 408 ||
      error.code === 'ETIMEDOUT'
    ) {
      return 'timeout';
    }

    // Service unavailable
    if (
      errorMessage.includes('service unavailable') ||
      errorMessage.includes('server error') ||
      errorCode === 503 ||
      errorCode === 500
    ) {
      return 'service_unavailable';
    }

    // Tool-specific error patterns
    switch (tool) {
      case 'get_prices':
        if (errorMessage.includes('no flights') || errorMessage.includes('no results')) {
          return 'no_flights_found';
        }
        break;
        
      case 'get_figma_assets':
        if (errorMessage.includes('not found') || errorCode === 404) {
          return 'not_found';
        }
        break;
        
      case 'generate_copy':
        if (errorMessage.includes('content policy') || errorMessage.includes('filter')) {
          return 'content_filter';
        }
        break;
        
      case 'render_mjml':
        if (errorMessage.includes('syntax') || errorMessage.includes('parse')) {
          return 'syntax_error';
        }
        if (errorMessage.includes('template')) {
          return 'template_error';
        }
        break;
        
      case 'upload_s3':
        if (errorMessage.includes('quota') || errorMessage.includes('storage')) {
          return 'quota_exceeded';
        }
        break;
    }

    return 'unknown';
  }

  /**
   * Adjust strategy based on context and attempt number
   */
  private static adjustStrategy(
    strategy: ErrorStrategy, 
    tool: string, 
    errorType: string, 
    attempt: number, 
    context?: any
  ): ErrorStrategy {
    let adjustedStrategy = { ...strategy };

    // Check if we've exceeded max attempts
    if (strategy.maxAttempts && attempt >= strategy.maxAttempts) {
      if (strategy.fallback) {
        adjustedStrategy.action = 'fallback';
      } else {
        adjustedStrategy.action = 'skip';
      }
      return adjustedStrategy;
    }

    // Handle rate limiting with intelligent backoff
    if (errorType === 'rate_limit') {
      adjustedStrategy.delay = this.calculateRateLimitDelay(tool, attempt);
    }

    // Adjust timeouts based on previous failures
    if (errorType === 'timeout') {
      adjustedStrategy.delay = (adjustedStrategy.delay || 1000) * Math.pow(1.5, attempt - 1);
    }

    // Context-specific adjustments
    if (context) {
      adjustedStrategy = this.applyContextualAdjustments(adjustedStrategy, tool, context);
    }

    return adjustedStrategy;
  }

  /**
   * Calculate intelligent rate limit delay
   */
  private static calculateRateLimitDelay(tool: string, attempt: number): number {
    const now = Date.now();
    const tracker = this.rateLimitTracker[tool] || { lastHit: 0, backoffMultiplier: 1 };

    // If we hit rate limit recently, increase backoff
    if (now - tracker.lastHit < 60000) { // Within last minute
      tracker.backoffMultiplier = Math.min(tracker.backoffMultiplier * 1.5, 5);
    } else {
      tracker.backoffMultiplier = Math.max(tracker.backoffMultiplier * 0.8, 1);
    }

    tracker.lastHit = now;
    this.rateLimitTracker[tool] = tracker;

    // Base delays per tool (in milliseconds)
    const baseDelays: Record<string, number> = {
      'get_prices': 5000,
      'get_figma_assets': 10000,
      'generate_copy': 15000,
      'render_mjml': 2000,
      'percy_snap': 5000,
      'render_test': 10000,
      'upload_s3': 3000
    };

    const baseDelay = baseDelays[tool] || 5000;
    return Math.round(baseDelay * tracker.backoffMultiplier * Math.pow(1.5, attempt - 1));
  }

  /**
   * Apply contextual adjustments to strategy
   */
  private static applyContextualAdjustments(
    strategy: ErrorStrategy, 
    tool: string, 
    context: any
  ): ErrorStrategy {
    const adjusted = { ...strategy };

    // If we're in speed mode, prefer fallbacks over retries
    if (context.strategy === 'speed' && strategy.fallback) {
      adjusted.action = 'fallback';
      adjusted.delay = 0;
    }

    // If critical tools fail and we have no fallback, be more aggressive with retries
    const criticalTools = ['get_prices', 'generate_copy', 'render_mjml'];
    if (criticalTools.includes(tool) && !strategy.fallback) {
      adjusted.maxAttempts = Math.max(adjusted.maxAttempts || 1, 3);
    }

    // If we're near the end of the generation pipeline, prefer skipping over long delays
    if (context.stepsCompleted > 5 && (adjusted.delay || 0) > 10000) {
      if (strategy.fallback || ['percy_snap', 'render_test'].includes(tool)) {
        adjusted.action = strategy.fallback ? 'fallback' : 'skip';
        adjusted.delay = 0;
      }
    }

    return adjusted;
  }

  /**
   * Get generic strategy for unknown error patterns
   */
  private static getGenericStrategy(error: any, tool: string, attempt: number): ErrorStrategy {
    const isNetworkError = error.code === 'ECONNRESET' || 
                          error.code === 'ENOTFOUND' || 
                          error.code === 'ECONNREFUSED';

    const isCriticalTool = ['get_prices', 'generate_copy', 'render_mjml'].includes(tool);

    if (isNetworkError) {
      return {
        action: 'retry',
        delay: Math.pow(2, attempt) * 1000,
        maxAttempts: isCriticalTool ? 3 : 2
      };
    }

    // For unknown errors, be conservative
    return {
      action: attempt < 2 ? 'retry' : (isCriticalTool ? 'retry' : 'skip'),
      delay: Math.pow(2, attempt) * 1000,
      maxAttempts: isCriticalTool ? 3 : 2
    };
  }

  /**
   * Get fallback tool for a given tool
   */
  static getFallbackTool(tool: string): string | null {
    const fallbacks: Record<string, string> = {
      'get_figma_assets': 'use_unsplash_fallback',
      'get_prices': 'use_estimated_prices',
      'percy_snap': 'skip_visual_testing',
      'render_test': 'skip_render_testing',
      'upload_s3': 'local_storage'
    };

    return fallbacks[tool] || null;
  }

  /**
   * Check if error is recoverable
   */
  static isRecoverable(error: any, tool: string): boolean {
    const errorType = this.identifyErrorType(error, tool);
    
    const nonRecoverableTypes = ['unauthorized', 'content_filter', 'syntax_error'];
    return !nonRecoverableTypes.includes(errorType);
  }

  /**
   * Get error summary for reporting
   */
  static getErrorSummary(errors: Array<{ tool: string; error: any; attempt: number }>): {
    totalErrors: number;
    criticalErrors: number;
    recoverableErrors: number;
    errorsByTool: Record<string, number>;
    errorsByType: Record<string, number>;
  } {
    const summary = {
      totalErrors: errors.length,
      criticalErrors: 0,
      recoverableErrors: 0,
      errorsByTool: {} as Record<string, number>,
      errorsByType: {} as Record<string, number>
    };

    for (const { tool, error, attempt } of errors) {
      // Count by tool
      summary.errorsByTool[tool] = (summary.errorsByTool[tool] || 0) + 1;

      // Count by type
      const errorType = this.identifyErrorType(error, tool);
      summary.errorsByType[errorType] = (summary.errorsByType[errorType] || 0) + 1;

      // Classify severity
      if (this.isRecoverable(error, tool)) {
        summary.recoverableErrors++;
      } else {
        summary.criticalErrors++;
      }
    }

    return summary;
  }

  /**
   * Generate error prevention suggestions
   */
  static generatePreventionSuggestions(
    tool: string, 
    recentErrors: Array<{ error: any; timestamp: number }>
  ): string[] {
    const suggestions: string[] = [];
    
    // Analyze error patterns
    const errorTypes = recentErrors.map(e => this.identifyErrorType(e.error, tool));
    const uniqueTypes = Array.from(new Set(errorTypes));

    for (const errorType of uniqueTypes) {
      switch (errorType) {
        case 'rate_limit':
          suggestions.push(`Implement request spacing for ${tool} to avoid rate limits`);
          break;
        case 'timeout':
          suggestions.push(`Consider increasing timeout values for ${tool}`);
          break;
        case 'unauthorized':
          suggestions.push(`Verify API credentials for ${tool}`);
          break;
        case 'service_unavailable':
          suggestions.push(`Check service status and implement circuit breaker for ${tool}`);
          break;
        case 'not_found':
          suggestions.push(`Validate input parameters for ${tool}`);
          break;
      }
    }

    // Frequency-based suggestions
    if (recentErrors.length > 3) {
      suggestions.push(`High error rate for ${tool} - consider implementing more robust fallbacks`);
    }

    return suggestions;
  }

  /**
   * Reset rate limit tracking (for testing or manual reset)
   */
  static resetRateLimitTracking(): void {
    this.rateLimitTracker = {};
  }
}