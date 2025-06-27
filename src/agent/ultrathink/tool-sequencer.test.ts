import { describe, test, expect, beforeEach } from '@jest/globals';
import { ToolSequencer } from './tool-sequencer';
import { EmailGenerationRequest } from '../types';
import { ToolSequence } from './types';

describe('ToolSequencer', () => {

  /**
   * TC-TS-01: Basic Sequence Optimization
   */
  test('TC-TS-01: Should optimize sequence based on request context', () => {
    const request: EmailGenerationRequest = {
      topic: 'Summer vacation to Barcelona',
      origin: 'MOW',
      destination: 'BCN',
      campaign_type: 'promotional'
    };

    const sequence = ToolSequencer.optimizeSequence(request);
    
    expect(sequence).toBeDefined();
    expect(sequence.steps).toBeDefined();
    expect(sequence.steps.length).toBeGreaterThan(3);
    expect(sequence.estimatedDuration).toBeGreaterThan(0);
    expect(['speed', 'quality', 'balanced']).toContain(sequence.strategy);
  });

  /**
   * TC-TS-02: Strategy Determination
   */
  test('TC-TS-02: Should determine correct strategy based on request', () => {
    // Simple request should use speed strategy
    const simpleRequest: EmailGenerationRequest = {
      topic: 'Quick flight deal'
    };
    const simpleSequence = ToolSequencer.optimizeSequence(simpleRequest);
    expect(simpleSequence.strategy).toBe('speed');

    // Complex request with many parameters should use quality strategy
    const complexRequest: EmailGenerationRequest = {
      topic: 'Luxury travel package to Europe',
      origin: 'MOW',
      destination: 'CDG',
      date_range: '2025-07-15,2025-07-22',
      campaign_type: 'promotional',
      target_audience: 'luxury travelers',
      content_brief: 'Detailed luxury travel experience with personalized recommendations'
    };
    const complexSequence = ToolSequencer.optimizeSequence(complexRequest);
    expect(['quality', 'balanced']).toContain(complexSequence.strategy);
  });

  /**
   * TC-TS-03: Tool Priority Assignment
   */
  test('TC-TS-03: Should assign correct tool priorities', () => {
    const request: EmailGenerationRequest = {
      topic: 'Flight deals to Paris',
      origin: 'LED',
      destination: 'CDG'
    };

    const sequence = ToolSequencer.optimizeSequence(request);
    
    // Verify that essential tools have higher priority
    const essentialTools = ['get_current_date', 'get_figma_assets', 'get_prices', 'generate_copy', 'render_mjml'];
    const sequenceTools = sequence.steps.map(s => s.tool);
    
    essentialTools.forEach(tool => {
      expect(sequenceTools).toContain(tool);
    });

    // Verify priority ordering (lower number = higher priority)
    const priorities = sequence.steps.map(s => s.priority);
    const sortedPriorities = [...priorities].sort((a, b) => a - b);
    expect(priorities).toEqual(sortedPriorities);
  });

  /**
   * TC-TS-04: Enforced Sequence with Quality Gates
   */
  test('TC-TS-04: Should create enforced sequence with quality gates', () => {
    // Initialize quality control first
    ToolSequencer.initializeQualityControl({
      enforceAiConsultant: true,
      minimumScore: 70
    });

    const request: EmailGenerationRequest = {
      topic: 'Business travel to London',
      origin: 'MOW',
      destination: 'LHR',
      campaign_type: 'promotional'
    };

    const enforcedSequence = ToolSequencer.createEnforcedSequence(request);
    
    expect(enforcedSequence).toBeDefined();
    expect(enforcedSequence.steps.length).toBeGreaterThan(0);
    
    // Should have ai_quality_consultant in the sequence
    const hasQualityCheck = enforcedSequence.steps.some(step => step.tool === 'ai_quality_consultant');
    expect(hasQualityCheck).toBe(true);
    
    // Quality check should be before upload
    const qualityIndex = enforcedSequence.steps.findIndex(s => s.tool === 'ai_quality_consultant');
    const uploadIndex = enforcedSequence.steps.findIndex(s => s.tool === 'upload_s3');
    if (uploadIndex !== -1) {
      expect(qualityIndex).toBeLessThan(uploadIndex);
    }
  });

  /**
   * TC-TS-05: Route-specific Optimization
   */
  test('TC-TS-05: Should optimize sequence for different routes', () => {
    // Domestic route
    const domesticRequest: EmailGenerationRequest = {
      topic: 'Moscow to St. Petersburg flights',
      origin: 'MOW',
      destination: 'LED'
    };
    const domesticSequence = ToolSequencer.optimizeSequence(domesticRequest);

    // International route
    const internationalRequest: EmailGenerationRequest = {
      topic: 'Moscow to Bangkok vacation',
      origin: 'MOW',
      destination: 'BKK'
    };
    const internationalSequence = ToolSequencer.optimizeSequence(internationalRequest);

    // Both should have sequences but potentially different strategies
    expect(domesticSequence.steps.length).toBeGreaterThan(0);
    expect(internationalSequence.steps.length).toBeGreaterThan(0);
    
    // International might be more complex
    expect(internationalSequence.estimatedDuration).toBeGreaterThanOrEqual(domesticSequence.estimatedDuration);
  });

  /**
   * TC-TS-06: Campaign Type Optimization
   */
  test('TC-TS-06: Should optimize sequence based on campaign type', () => {
    const baseRequest = {
      topic: 'Travel offer',
      origin: 'MOW',
      destination: 'LED'
    };

    // Promotional campaign
    const promoSequence = ToolSequencer.optimizeSequence({
      ...baseRequest,
      campaign_type: 'promotional'
    });

    // Informational campaign
    const infoSequence = ToolSequencer.optimizeSequence({
      ...baseRequest,
      campaign_type: 'informational'
    });

    // Urgent campaign
    const urgentSequence = ToolSequencer.optimizeSequence({
      ...baseRequest,
      campaign_type: 'urgent'
    });

    // All should have valid sequences
    expect(promoSequence.steps.length).toBeGreaterThan(0);
    expect(infoSequence.steps.length).toBeGreaterThan(0);
    expect(urgentSequence.steps.length).toBeGreaterThan(0);

    // Urgent campaigns should be optimized for speed
    expect(urgentSequence.strategy).toBe('speed');
  });

  /**
   * TC-TS-07: Parallel Execution Optimization
   */
  test('TC-TS-07: Should identify tools that can run in parallel', () => {
    const request: EmailGenerationRequest = {
      topic: 'European vacation package',
      origin: 'MOW',
      destination: 'CDG',
      date_range: '2025-08-01,2025-08-15'
    };

    const sequence = ToolSequencer.optimizeSequence(request);
    
    // Some steps should be marked as parallel
    const parallelSteps = sequence.steps.filter(step => step.parallel === true);
    expect(parallelSteps.length).toBeGreaterThan(0);

    // get_current_date and get_figma_assets can often run in parallel
    const hasParallelDataFetch = sequence.steps.some(step => 
      (step.tool === 'get_current_date' || step.tool === 'get_figma_assets') && step.parallel
    );
    expect(hasParallelDataFetch).toBe(true);
  });

  /**
   * TC-TS-08: Conditional Tool Inclusion
   */
  test('TC-TS-08: Should include conditional tools based on context', () => {
    // Request with date range should include date validation
    const dateRequest: EmailGenerationRequest = {
      topic: 'Summer flights',
      date_range: '2025-07-01,2025-07-31'
    };
    const dateSequence = ToolSequencer.optimizeSequence(dateRequest);
    
    expect(dateSequence.steps.some(s => s.condition?.includes('date'))).toBe(true);

    // Request with specific route should include route optimization
    const routeRequest: EmailGenerationRequest = {
      topic: 'Flight deals',
      origin: 'MOW',
      destination: 'LED'
    };
    const routeSequence = ToolSequencer.optimizeSequence(routeRequest);
    
    expect(routeSequence.steps.some(s => s.tool === 'get_prices')).toBe(true);
  });

  /**
   * TC-TS-09: Duration Estimation
   */
  test('TC-TS-09: Should estimate duration accurately', () => {
    // Simple request
    const simpleRequest: EmailGenerationRequest = {
      topic: 'Quick flight deal'
    };
    const simpleSequence = ToolSequencer.optimizeSequence(simpleRequest);

    // Complex request
    const complexRequest: EmailGenerationRequest = {
      topic: 'Comprehensive travel package with multiple destinations',
      origin: 'MOW',
      destination: 'CDG',
      date_range: '2025-08-01,2025-08-15',
      campaign_type: 'promotional',
      target_audience: 'luxury travelers'
    };
    const complexSequence = ToolSequencer.optimizeSequence(complexRequest);

    // Complex should take longer
    expect(complexSequence.estimatedDuration).toBeGreaterThan(simpleSequence.estimatedDuration);
    
    // Both should have reasonable durations (between 5-60 seconds)
    expect(simpleSequence.estimatedDuration).toBeGreaterThan(5000);
    expect(simpleSequence.estimatedDuration).toBeLessThan(60000);
    expect(complexSequence.estimatedDuration).toBeLessThan(120000);
  });

  /**
   * TC-TS-10: Fallback Tool Configuration
   */
  test('TC-TS-10: Should configure fallback tools correctly', () => {
    const request: EmailGenerationRequest = {
      topic: 'International flight deals',
      origin: 'MOW',
      destination: 'JFK'
    };

    const sequence = ToolSequencer.optimizeSequence(request);
    
    // Tools that commonly need fallbacks should have them configured
    const figmaStep = sequence.steps.find(s => s.tool === 'get_figma_assets');
    if (figmaStep) {
      expect(figmaStep.fallback).toBeDefined();
    }

    const pricesStep = sequence.steps.find(s => s.tool === 'get_prices');
    if (pricesStep) {
      expect(pricesStep.fallback).toBeDefined();
    }
  });

  /**
   * TC-TS-11: Edge Cases and Error Handling
   */
  test('TC-TS-11: Should handle edge cases gracefully', () => {
    // Empty request
    const emptySequence = ToolSequencer.optimizeSequence({} as EmailGenerationRequest);
    expect(emptySequence.steps.length).toBeGreaterThan(0);
    expect(emptySequence.strategy).toBe('speed');

    // Minimal request
    const minimalSequence = ToolSequencer.optimizeSequence({ topic: 'Test' });
    expect(minimalSequence.steps.length).toBeGreaterThan(0);

    // Request with invalid data
    const invalidRequest: EmailGenerationRequest = {
      topic: 'Test flight',
      origin: 'INVALID',
      destination: 'INVALID'
    };
    const invalidSequence = ToolSequencer.optimizeSequence(invalidRequest);
    expect(invalidSequence.steps.length).toBeGreaterThan(0);
  });

  /**
   * TC-TS-12: Performance Optimization
   */
  test('TC-TS-12: Should optimize for performance when needed', () => {
    const urgentRequest: EmailGenerationRequest = {
      topic: 'URGENT: Flash sale ending soon!',
      campaign_type: 'urgent'
    };

    const urgentSequence = ToolSequencer.optimizeSequence(urgentRequest);
    
    // Urgent campaigns should use speed strategy
    expect(urgentSequence.strategy).toBe('speed');
    
    // Should have shorter estimated duration
    expect(urgentSequence.estimatedDuration).toBeLessThan(20000); // Under 20 seconds
    
    // Should have fewer optional steps
    const optionalSteps = urgentSequence.steps.filter(s => s.condition);
    expect(optionalSteps.length).toBeLessThan(3);
  });
});