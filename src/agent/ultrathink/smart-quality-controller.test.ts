import { describe, test, expect, beforeEach } from '@jest/globals';
import { SmartQualityController } from './quality-controller';
import { QualityControlConfig, ToolSequence } from './types';

describe('SmartQualityController', () => {
  let controller: SmartQualityController;
  
  beforeEach(() => {
    controller = new SmartQualityController({
      enforceAiConsultant: true,
      minimumScore: 70,
      criticalIssueThreshold: 0,
      autoRetryCount: 2,
      requireManualReview: false
    });
  });

  /**
   * TC-SQC-01: Basic Quality Control Configuration
   */
  test('TC-SQC-01: Should initialize with correct default configuration', () => {
    const defaultController = new SmartQualityController();
    const stats = defaultController.getQualityStats();
    
    expect(stats.config.enforceAiConsultant).toBe(true);
    expect(stats.config.minimumScore).toBe(70);
    expect(stats.config.criticalIssueThreshold).toBe(0);
  });

  /**
   * TC-SQC-02: Enforced Sequence Creation
   */
  test('TC-SQC-02: Should create enforced sequence with mandatory quality check', () => {
    const baseSequence: ToolSequence = {
      steps: [
        { tool: 'get_prices', priority: 1 },
        { tool: 'render_mjml', priority: 2 },
        { tool: 'upload_s3', priority: 3 }
      ],
      estimatedDuration: 10000,
      strategy: 'quality'
    };

    const enforcedSequence = controller.createEnforcedSequence(baseSequence);
    
    // Should have ai_quality_consultant added
    expect(enforcedSequence.steps.length).toBeGreaterThan(baseSequence.steps.length);
    
    const hasQualityCheck = enforcedSequence.steps.some(step => step.tool === 'ai_quality_consultant');
    expect(hasQualityCheck).toBe(true);
    
    // Quality check should be before upload
    const qualityIndex = enforcedSequence.steps.findIndex(s => s.tool === 'ai_quality_consultant');
    const uploadIndex = enforcedSequence.steps.findIndex(s => s.tool === 'upload_s3');
    expect(qualityIndex).toBeLessThan(uploadIndex);
  });

  /**
   * TC-SQC-03: Quality Validation - Passing Score
   */
  test('TC-SQC-03: Should validate quality result with passing score', () => {
    const mockToolResult = {
      success: true,
      data: {
        quality_score: 85,
        issues: [],
        recommendations: ['Great work!']
      }
    };

    const result = controller.validateQualityResult(mockToolResult);
    
    expect(result.passed).toBe(true);
    expect(result.score).toBe(85);
    expect(result.shouldProceed).toBe(true);
    expect(result.requiresRegeneration).toBe(false);
    expect(result.recommendations).toContain('Great work!');
  });

  /**
   * TC-SQC-04: Quality Validation - Failing Score
   */
  test('TC-SQC-04: Should validate quality result with failing score', () => {
    const mockToolResult = {
      success: true,
      data: {
        quality_score: 45,
        issues: [
          { severity: 'major', description: 'Content quality below threshold' }
        ],
        recommendations: ['Regenerate content']
      }
    };

    const result = controller.validateQualityResult(mockToolResult);
    
    expect(result.passed).toBe(false);
    expect(result.score).toBe(45);
    expect(result.shouldProceed).toBe(false);
    expect(result.requiresRegeneration).toBe(true);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  /**
   * TC-SQC-05: Quality Validation - Critical Issues
   */
  test('TC-SQC-05: Should handle critical issues properly', () => {
    const mockToolResult = {
      success: true,
      data: {
        quality_score: 80,
        issues: [
          { severity: 'critical', description: 'Security vulnerability detected' }
        ]
      }
    };

    const result = controller.validateQualityResult(mockToolResult);
    
    expect(result.passed).toBe(false);
    expect(result.shouldProceed).toBe(false);
    expect(result.requiresRegeneration).toBe(true);
  });

  /**
   * TC-SQC-06: Quality Validation - Failed Tool Execution
   */
  test('TC-SQC-06: Should handle failed tool execution', () => {
    const mockToolResult = {
      success: false,
      error: 'Tool execution failed'
    };

    const result = controller.validateQualityResult(mockToolResult);
    
    expect(result.passed).toBe(false);
    expect(result.shouldProceed).toBe(false);
    expect(result.requiresRegeneration).toBe(true);
    expect(result.issues[0].severity).toBe('critical');
    expect(result.issues[0].description).toContain('AI Quality Consultant failed');
  });

  /**
   * TC-SQC-07: Workflow Continuation Decision
   */
  test('TC-SQC-07: Should make correct workflow continuation decisions', () => {
    // First, no quality check recorded
    expect(controller.shouldContinueWorkflow('final')).toBe(false);

    // Record a passing quality check
    const passingResult = {
      success: true,
      data: { quality_score: 85 }
    };
    controller.validateQualityResult(passingResult);
    expect(controller.shouldContinueWorkflow('final')).toBe(true);

    // Clear and record a failing quality check
    controller.clearExecutionHistory();
    const failingResult = {
      success: true,
      data: { quality_score: 45 }
    };
    controller.validateQualityResult(failingResult);
    expect(controller.shouldContinueWorkflow('final')).toBe(false);
  });

  /**
   * TC-SQC-08: Memory Management
   */
  test('TC-SQC-08: Should manage memory correctly', () => {
    const initialStats = controller.getQualityStats();
    expect(initialStats.totalChecks).toBe(0);

    // Add a quality result
    const mockResult = {
      success: true,
      data: { quality_score: 75 }
    };
    controller.validateQualityResult(mockResult);

    let stats = controller.getQualityStats();
    expect(stats.totalChecks).toBe(1);
    expect(stats.passedChecks).toBe(1);

    // Clear history
    controller.clearExecutionHistory();
    stats = controller.getQualityStats();
    expect(stats.totalChecks).toBe(0);
  });

  /**
   * TC-SQC-09: Configuration Override
   */
  test('TC-SQC-09: Should respect custom configuration', () => {
    const customController = new SmartQualityController({
      enforceAiConsultant: false,
      minimumScore: 90,
      criticalIssueThreshold: 1
    });

    const mockResult = {
      success: true,
      data: { quality_score: 85 }
    };

    const result = customController.validateQualityResult(mockResult);
    
    // Should fail because score (85) is below custom minimum (90)
    expect(result.passed).toBe(false);
    expect(result.shouldProceed).toBe(false);
  });

  /**
   * TC-SQC-10: Edge Cases and Error Handling
   */
  test('TC-SQC-10: Should handle edge cases gracefully', () => {
    // Null/undefined input
    const nullResult = controller.validateQualityResult(null);
    expect(nullResult.passed).toBe(false);

    // Empty data
    const emptyResult = controller.validateQualityResult({ success: true, data: {} });
    expect(emptyResult.score).toBe(0);

    // Invalid data structure
    const invalidResult = controller.validateQualityResult({ 
      success: true, 
      data: { invalid_field: 'test' }
    });
    expect(invalidResult.score).toBe(0);
  });

  /**
   * TC-SQC-11: Quality Statistics
   */
  test('TC-SQC-11: Should calculate quality statistics correctly', () => {
    // Add multiple quality results
    const results = [
      { success: true, data: { quality_score: 80 } },
      { success: true, data: { quality_score: 90 } },
      { success: true, data: { quality_score: 60 } }, // Below threshold
      { success: true, data: { quality_score: 95 } }
    ];

    results.forEach(result => controller.validateQualityResult(result));

    const stats = controller.getQualityStats();
    expect(stats.totalChecks).toBe(4);
    expect(stats.passedChecks).toBe(3); // 3 above threshold (70)
    expect(stats.averageScore).toBe(81.25); // (80+90+60+95)/4
  });

  /**
   * TC-SQC-12: Max History Size Management
   */
  test('TC-SQC-12: Should manage maximum history size', () => {
    // Set small max size for testing
    controller.setMaxHistorySize(2);

    // Add more entries than max size
    for (let i = 0; i < 5; i++) {
      controller.validateQualityResult({
        success: true,
        data: { quality_score: 70 + i }
      });
    }

    const stats = controller.getQualityStats();
    expect(stats.totalChecks).toBeLessThanOrEqual(2);
  });
});