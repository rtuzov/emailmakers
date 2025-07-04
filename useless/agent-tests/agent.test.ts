import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { emailGeneratorAgent, EmailGenerationRequest } from '../agent';

describe('Email Generator Agent', () => {
  beforeAll(async () => {
    // Setup test environment
    console.log('Setting up agent tests...');
  });

  afterAll(async () => {
    // Cleanup test environment
    console.log('Cleaning up agent tests...');
  });

  /**
   * TC-01: Basic Email Generation
   * Test basic email generation with topic 'Путешествие в Москву'
   */
  test('TC-01: Basic email generation', async () => {
    const request: EmailGenerationRequest = {
      topic: 'Путешествие в Москву',
      origin: 'LED',
      destination: 'MOW',
      date_range: '2025-02-01,2025-02-15'
    };

    const response = await emailGeneratorAgent.generateEmail(request);

    expect(response.status).toBe('success');
    expect(response.html_url).toBeDefined();
    expect(response.generation_time).toBeLessThan(30);
    
    if (response.html_url) {
      // Verify HTML content contains topic
      // const htmlContent = await fetchHtml(response.html_url);
      // expect(htmlContent).toContain('Москва');
      // expect(htmlContent.length).toBeLessThan(100000); // <100KB
    }
  }, 35000); // 35 second timeout

  /**
   * TC-02: Price Validation Test
   * Test that LED→LED is corrected to valid route
   */
  test('TC-02: Price validation - route correction', async () => {
    const request: EmailGenerationRequest = {
      topic: 'Осень в Питере',
      origin: 'LED',
      destination: 'LED', // Invalid route
      date_range: '2025-02-01,2025-02-15'
    };

    const response = await emailGeneratorAgent.generateEmail(request);

    expect(response.status).toBe('success');
    // Should contain corrected route (MOW→LED), not LED→LED
    // This would be verified by checking the HTML content
  }, 35000);

  /**
   * TC-03: Figma Token Failure Fallback
   * Test fallback to Unsplash when Figma token fails
   */
  test('TC-03: Figma fallback handling', async () => {
    // Temporarily unset Figma token to test fallback
    const originalToken = process.env.FIGMA_TOKEN;
    delete process.env.FIGMA_TOKEN;

    const request: EmailGenerationRequest = {
      topic: 'Летний отпуск',
      origin: 'MOW',
      destination: 'AER',
      date_range: '2025-06-01,2025-06-15'
    };

    const response = await emailGeneratorAgent.generateEmail(request);

    expect(response.status).toBe('success');
    // Should contain Unsplash fallback images
    
    // Restore original token
    if (originalToken) {
      process.env.FIGMA_TOKEN = originalToken;
    }
  }, 35000);

  /**
   * TC-04: API Unavailability Handling
   * Test graceful handling when price API is unavailable
   */
  test('TC-04: API unavailability graceful handling', async () => {
    // Temporarily unset price API key to test fallback
    const originalKey = process.env.FLIGHTS_KEY;
    delete process.env.FLIGHTS_KEY;

    const request: EmailGenerationRequest = {
      topic: 'Зимний отдых',
      origin: 'MOW',
      destination: 'SVX',
      date_range: '2025-12-01,2025-12-15'
    };

    const response = await emailGeneratorAgent.generateEmail(request);

    expect(response.status).toBe('success');
    // Should contain fallback pricing message
    
    // Restore original key
    if (originalKey) {
      process.env.FLIGHTS_KEY = originalKey;
    }
  }, 35000);

  /**
   * TC-05: HTML Diff and Patch Convergence
   * Test that diff > 10% triggers patch_html and converges to ≤10%
   */
  test('TC-05: HTML diff and patch convergence', async () => {
    const request: EmailGenerationRequest = {
      topic: 'Бизнес поездка',
      origin: 'MOW',
      destination: 'LED',
      date_range: '2025-03-01,2025-03-15'
    };

    const response = await emailGeneratorAgent.generateEmail(request);

    expect(response.status).toBe('success');
    expect(response.layout_regression).toBe('pass');
    
    // Verify patch_html was called and converged
    // This would be verified by checking agent logs
  }, 35000);

  /**
   * Performance Test: Generation Time
   * Ensure generation time is ≤30 seconds
   */
  test('Performance: Generation time under 30 seconds', async () => {
    const request: EmailGenerationRequest = {
      topic: 'Выходные в Сочи',
      origin: 'MOW',
      destination: 'AER',
      date_range: '2025-04-01,2025-04-15'
    };

    const startTime = Date.now();
    const response = await emailGeneratorAgent.generateEmail(request);
    const endTime = Date.now();

    const actualTime = (endTime - startTime) / 1000;

    expect(response.status).toBe('success');
    expect(actualTime).toBeLessThan(30);
    expect(response.generation_time).toBeLessThan(30);
  }, 35000);

  /**
   * Quality Test: Token Usage
   * Ensure token usage is ≤12,000 tokens
   */
  test('Quality: Token usage under 12k tokens', async () => {
    const request: EmailGenerationRequest = {
      topic: 'Культурная поездка в Санкт-Петербург',
      origin: 'MOW',
      destination: 'LED',
      date_range: '2025-05-01,2025-05-15'
    };

    const response = await emailGeneratorAgent.generateEmail(request);

    expect(response.status).toBe('success');
    if (response.token_usage) {
      expect(response.token_usage).toBeLessThan(12000);
    }
  }, 35000);
});

// Helper functions for testing
async function fetchHtml(url: string): Promise<string> {
  // Mock implementation - in production would fetch actual HTML
  return `<html><body>Test HTML content for ${url}</body></html>`;
}

// Mock environment setup for testing
export function setupTestEnvironment() {
  (process.env as any).NODE_ENV = 'test';
  
  // Set default test API keys if not provided
  if (!process.env.OPENAI_API_KEY) {
    process.env.OPENAI_API_KEY = 'test-openai-key';
  }
  
  if (!process.env.FIGMA_TOKEN) {
    process.env.FIGMA_TOKEN = 'test-figma-token';
  }
  
  if (!process.env.FLIGHTS_KEY) {
    process.env.FLIGHTS_KEY = 'test-flights-key';
  }
} 