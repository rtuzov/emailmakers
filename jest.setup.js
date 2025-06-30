/**
 * Jest Setup File
 * 
 * Global test configuration and utilities for Email-Makers validation tests
 */

// Use CommonJS require instead of ES6 imports
require('@testing-library/jest-dom');

// Environment variables for testing
process.env.NODE_ENV = 'test';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
process.env.ENCRYPTION_KEY = 'test-encryption-key-123456789012';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';

// Extend Jest matchers
expect.extend({
  toBeValidHandoffData(received) {
    const pass = received && received.isValid === true && received.errors.length === 0;
    
    if (pass) {
      return {
        message: () => `Expected handoff data to be invalid, but it was valid`,
        pass: true,
      };
    } else {
      return {
        message: () => {
          const errors = received?.errors || [];
          return `Expected handoff data to be valid, but found ${errors.length} errors: ${
            errors.map(e => `${e.field}: ${e.message}`).join(', ')
          }`;
        },
        pass: false,
      };
    }
  },

  toHaveValidationError(received, field, errorType) {
    const errors = received?.errors || [];
    const hasError = errors.some(error => 
      error.field === field && error.errorType === errorType
    );
    
    if (hasError) {
      return {
        message: () => `Expected not to find validation error for field '${field}' with type '${errorType}'`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected to find validation error for field '${field}' with type '${errorType}', but found: ${
          errors.map(e => `${e.field}:${e.errorType}`).join(', ')
        }`,
        pass: false,
      };
    }
  },

  toMeetPerformanceThreshold(received, maxTime) {
    const duration = received?.performance?.validationTime || Infinity;
    const pass = duration < maxTime;
    
    if (pass) {
      return {
        message: () => `Expected validation to exceed ${maxTime}ms, but completed in ${duration}ms`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected validation to complete within ${maxTime}ms, but took ${duration}ms`,
        pass: false,
      };
    }
  },
});

// Global test utilities
global.testUtils = {
  // Create valid trace ID
  createTraceId: () => `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  
  // Create valid timestamp
  createTimestamp: () => new Date().toISOString(),
  
  // Mock AI Corrector
  createMockAICorrector: () => ({
    correctHandoffData: jest.fn(),
    getErrorCorrections: jest.fn(),
    validateCorrection: jest.fn(),
  }),
  
  // Performance test wrapper
  measurePerformance: async (fn) => {
    const startTime = Date.now();
    const result = await fn();
    const endTime = Date.now();
    
    return {
      ...result,
      performance: {
        ...result.performance,
        validationTime: endTime - startTime,
      },
    };
  },
};

// Console output control for cleaner test runs
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  // Suppress expected error logs during tests
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  // Restore console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Mock external dependencies that aren't part of validation logic
jest.mock('openai', () => ({
  OpenAI: jest.fn(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  })),
}));

jest.mock('@anthropic-ai/sdk', () => ({
  Anthropic: jest.fn(() => ({
    messages: {
      create: jest.fn(),
    },
  })),
}));

// Mock file system operations
jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  readFileSync: jest.fn(() => 'mock file content'),
  writeFileSync: jest.fn(),
  promises: {
    readFile: jest.fn(() => Promise.resolve('mock file content')),
    writeFile: jest.fn(() => Promise.resolve()),
  },
}));

console.log('🧪 Jest setup complete - Email-Makers Agent Validation Test Suite ready');
