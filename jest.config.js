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
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
      },
      useESM: true,
    }],
  },

  // Enable experimental ES modules support
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],

  // Transform ES modules from node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(@openai/agents.*|zod|uuid)/)'
  ],

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js|jsx)',
    '**/*.(test|spec).(ts|tsx|js|jsx)',
  ],

  // Module name mapping for absolute imports (FIXED)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/agent/(.*)$': '<rootDir>/src/agent/$1',
    '^@/domains/(.*)$': '<rootDir>/src/domains/$1',
    '^@/shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@/ui/(.*)$': '<rootDir>/src/ui/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/app/(.*)$': '<rootDir>/src/app/$1',
    '^@/config/(.*)$': '<rootDir>/src/config/$1',
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Coverage settings
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/**/index.ts',
    '!src/app/layout.tsx',
    '!src/app/page.tsx',
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },

  // Coverage directory
  coverageDirectory: 'coverage',

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],

  // Test timeout
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,

  // Maximum worker processes
  maxWorkers: '50%',
}; 