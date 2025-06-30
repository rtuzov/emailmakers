/**
 * Jest Configuration for Email-Makers Agent Validation System
 * 
 * Optimized for testing agent validators with TypeScript support
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // File extensions to consider
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Transform TypeScript files
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.(ts|js)',
    '**/*.(test|spec).(ts|js)',
  ],

  // Module name mapping for absolute imports (FIXED)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/agent/(.*)$': '<rootDir>/src/agent/$1',
    '^@/shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@/domains/(.*)$': '<rootDir>/src/domains/$1',
    // Mock AI Corrector to avoid ES module issues
    '^.*ai-corrector$': '<rootDir>/__tests__/__mocks__/ai-corrector.ts',
  },

  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/agent/validators/**/*.{ts,tsx}',
    'src/agent/types/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
  ],

  // Coverage thresholds (Phase 4 requirements)
  coverageThreshold: {
    global: {
      branches: 50, // Lowered for initial setup
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },

  // Coverage reporters
  coverageReporters: [
    'text',
    'lcov',
    'html',
  ],

  // Coverage directory
  coverageDirectory: 'coverage',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Test timeout (30 seconds for validation tests)
  testTimeout: 30000,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,

  // Verbose output for detailed test results
  verbose: true,

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
  ],

  // TypeScript configuration (FIXED)
  preset: 'ts-jest',
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))',
  ],

  // Module resolution
  extensionsToTreatAsEsm: ['.ts'],

  // Performance optimization
  maxWorkers: '50%',
  cache: true,
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',

  // Error reporting
  errorOnDeprecated: false, // Reduced for compatibility
}; 