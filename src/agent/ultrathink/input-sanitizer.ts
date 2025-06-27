/**
 * Input Sanitization and Validation Utilities for UltraThink
 * Provides security-focused input validation to prevent various attacks
 */

import { LIMITS, TIME_CONSTANTS } from './constants';

export class InputSanitizer {
  // Security constants from centralized configuration
  private static readonly MAX_STRING_LENGTH = LIMITS.MAX_STRING_LENGTH;
  private static readonly MAX_CITY_CODE_LENGTH = LIMITS.MAX_CITY_CODE_LENGTH;
  private static readonly MAX_DATE_STRING_LENGTH = LIMITS.MAX_DATE_STRING_LENGTH;
  
  /**
   * Sanitize and validate airport/city code
   */
  static validateCityCode(code: string | undefined | null): string | null {
    if (!code || typeof code !== 'string') {
      return null;
    }
    
    // Trim and limit length
    const trimmed = code.trim().slice(0, this.MAX_CITY_CODE_LENGTH);
    
    // Only allow alphanumeric characters (airport codes)
    const sanitized = trimmed.replace(/[^A-Za-z0-9]/g, '');
    
    // Validate format (3-5 characters)
    if (sanitized.length < 2 || sanitized.length > 5) {
      return null;
    }
    
    return sanitized.toUpperCase();
  }
  
  /**
   * Sanitize and validate general string input
   */
  static validateString(input: string | undefined | null, maxLength: number = this.MAX_STRING_LENGTH): string | null {
    if (!input || typeof input !== 'string') {
      return null;
    }
    
    // Trim whitespace and limit length
    const trimmed = input.trim().slice(0, maxLength);
    
    // Remove potentially dangerous characters
    const sanitized = trimmed
      .replace(/[<>]/g, '') // Remove HTML brackets
      .replace(/['"]/g, '') // Remove quotes that could break SQL/JS
      .replace(/[;&|`$]/g, '') // Remove shell injection chars
      .replace(/\x00/g, ''); // Remove null bytes
    
    return sanitized || null;
  }
  
  /**
   * Sanitize and validate date range string
   */
  static validateDateRange(dateRange: string | undefined | null): string | null {
    if (!dateRange || typeof dateRange !== 'string') {
      return null;
    }
    
    // Trim and limit length
    const trimmed = dateRange.trim().slice(0, this.MAX_DATE_STRING_LENGTH * 2 + 1);
    
    // Only allow dates, commas, and hyphens (YYYY-MM-DD,YYYY-MM-DD format)
    const sanitized = trimmed.replace(/[^0-9,\-]/g, '');
    
    // Basic format validation
    const datePattern = /^\d{4}-\d{2}-\d{2}(,\d{4}-\d{2}-\d{2})?$/;
    if (!datePattern.test(sanitized)) {
      return null;
    }
    
    return sanitized;
  }
  
  /**
   * Sanitize text for logging (prevent log injection)
   */
  static sanitizeForLogging(text: string | undefined | null): string {
    if (!text || typeof text !== 'string') {
      return '[invalid_input]';
    }
    
    // Limit length and remove dangerous characters for logs
    return text
      .slice(0, 200) // Limit log length
      .replace(/[\r\n]/g, ' ') // Remove line breaks (log injection)
      .replace(/[<>&'"]/g, '_') // Escape HTML chars
      .replace(/\x00-\x1f/g, '_'); // Remove control characters
  }
  
  /**
   * Rate limiting helper - track and validate request frequency
   */
  private static requestCounts: Map<string, { count: number; windowStart: number }> = new Map();
  private static readonly RATE_LIMIT_WINDOW_MS = TIME_CONSTANTS.RATE_LIMIT_WINDOW_MS;
  private static readonly MAX_REQUESTS_PER_WINDOW = LIMITS.MAX_REQUESTS_PER_WINDOW;
  
  static checkRateLimit(identifier: string = 'default'): boolean {
    const now = Date.now();
    const windowStart = Math.floor(now / this.RATE_LIMIT_WINDOW_MS) * this.RATE_LIMIT_WINDOW_MS;
    
    const current = this.requestCounts.get(identifier);
    
    if (!current || current.windowStart !== windowStart) {
      // New window or first request
      this.requestCounts.set(identifier, { count: 1, windowStart });
      return true;
    }
    
    if (current.count >= this.MAX_REQUESTS_PER_WINDOW) {
      return false; // Rate limit exceeded
    }
    
    current.count++;
    return true;
  }
  
  /**
   * Clear old rate limit entries to prevent memory leaks
   */
  static cleanupRateLimitHistory(): void {
    const now = Date.now();
    const cutoff = now - (this.RATE_LIMIT_WINDOW_MS * 2); // Keep 2 windows
    
    for (const [key, value] of this.requestCounts.entries()) {
      if (value.windowStart < cutoff) {
        this.requestCounts.delete(key);
      }
    }
  }
  
  /**
   * Validate and sanitize email generation request
   */
  static validateEmailRequest(request: any): {
    valid: boolean;
    sanitized?: any;
    errors: string[];
  } {
    const errors: string[] = [];
    const sanitized: any = {};
    
    // Validate topic
    const topic = this.validateString(request?.topic, 200);
    if (!topic) {
      errors.push('Invalid or missing topic');
    } else {
      sanitized.topic = topic;
    }
    
    // Validate origin
    if (request?.origin) {
      const origin = this.validateCityCode(request.origin);
      if (!origin) {
        errors.push('Invalid origin airport code');
      } else {
        sanitized.origin = origin;
      }
    }
    
    // Validate destination
    if (request?.destination) {
      const destination = this.validateCityCode(request.destination);
      if (!destination) {
        errors.push('Invalid destination airport code');
      } else {
        sanitized.destination = destination;
      }
    }
    
    // Validate date range
    if (request?.date_range) {
      const dateRange = this.validateDateRange(request.date_range);
      if (!dateRange) {
        errors.push('Invalid date range format');
      } else {
        sanitized.date_range = dateRange;
      }
    }
    
    // Validate other string fields
    const stringFields = ['content_brief', 'campaign_type', 'target_audience', 'tone', 'language'];
    for (const field of stringFields) {
      if (request?.[field]) {
        const value = this.validateString(request[field], 100);
        if (value) {
          sanitized[field] = value;
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      sanitized: errors.length === 0 ? sanitized : undefined,
      errors
    };
  }
}