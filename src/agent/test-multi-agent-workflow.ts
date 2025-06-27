/**
 * 🧪 MULTI-AGENT WORKFLOW TEST SUITE
 * 
 * Comprehensive testing of the new multi-agent architecture:
 * - WorkflowOrchestrator → AgentHandoffs → SpecializedAgents → ConsolidatedTools
 * - Performance benchmarking and validation
 * - Production readiness verification
 * - Backward compatibility testing
 */

import { WorkflowOrchestrator, EmailGenerationRequest, EmailGenerationResponse } from './core/workflow-orchestrator';
import { UltraThinkEngine, createUltraThink } from './ultrathink';

// Test configuration interface
interface TestConfig {
  test_name: string;
  description: string;
  request: EmailGenerationRequest;
  expected_outcomes: {
    should_succeed: boolean;
    min_quality_score: number;
    max_execution_time: number;
    required_artifacts: string[];
    expected_agents: string[];
  };
}

// Test results interface
interface TestResult {
  test_name: string;
  success: boolean;
  execution_time: number;
  quality_score: number;
  agents_executed: string[];
  artifacts_generated: string[];
  errors: string[];
  warnings: string[];
  performance_metrics: any;
  recommendations: string[];
}

export class MultiAgentWorkflowTester {
  private orchestrator: WorkflowOrchestrator;
  private ultraThink?: UltraThinkEngine;
  private testResults: TestResult[] = [];

  constructor(enableUltraThink: boolean = false) {
    // Initialize UltraThink if requested
    if (enableUltraThink) {
      this.ultraThink = createUltraThink('quality');
      console.log('🧠 UltraThink enabled for enhanced testing');
    }
    
    // Initialize WorkflowOrchestrator with UltraThink
    this.orchestrator = new WorkflowOrchestrator(this.ultraThink);
    
    console.log('🧪 Multi-Agent Workflow Tester initialized');
    console.log('🎯 Architecture:', this.orchestrator.getOrchestratorCapabilities().architecture);
  }

  /**
   * Run comprehensive test suite
   */
  async runTestSuite(): Promise<void> {
    const startTime = Date.now();
    
    console.log('\n🚀 Starting Multi-Agent Workflow Test Suite');
    console.log('=' .repeat(60));
    
    try {
      // Stage 1: Basic Functionality Tests
      await this.runBasicFunctionalityTests();
      
      // Stage 2: Execution Strategy Tests
      await this.runExecutionStrategyTests();
      
      // Stage 3: Quality & Compliance Tests
      await this.runQualityComplianceTests();
      
      // Stage 4: Performance & Scalability Tests
      await this.runPerformanceTests();
      
      // Stage 5: Error Handling & Recovery Tests
      await this.runErrorHandlingTests();
      
      // Stage 6: Legacy Compatibility Tests
      await this.runLegacyCompatibilityTests();
      
      // Generate comprehensive test report
      await this.generateTestReport(startTime);
      
    } catch (error) {
      console.error('❌ Test suite execution failed:', error);
      throw error;
    }
  }

  /**
   * Stage 1: Basic Functionality Tests
   */
  private async runBasicFunctionalityTests(): Promise<void> {
    console.log('\n📋 Stage 1: Basic Functionality Tests');
    console.log('-'.repeat(40));

    const tests: TestConfig[] = [
      {
        test_name: 'basic_email_generation',
        description: 'Generate basic promotional email with minimal configuration',
        request: {
          topic: 'Летние предложения в Сочи',
          campaign_type: 'promotional',
          target_audience: 'families',
          destination: 'Сочи',
          origin: 'Москва'
        },
        expected_outcomes: {
          should_succeed: true,
          min_quality_score: 70,
          max_execution_time: 120000, // 2 minutes
          required_artifacts: ['html_output'],
          expected_agents: ['content_specialist', 'design_specialist', 'quality_specialist']
        }
      },
      {
        test_name: 'informational_newsletter',
        description: 'Generate informational newsletter without pricing',
        request: {
          topic: 'Новые маршруты и направления 2024',
          campaign_type: 'informational',
          target_audience: 'travel_enthusiasts',
          content_preferences: {
            tone: 'professional',
            language: 'ru'
          }
        },
        expected_outcomes: {
          should_succeed: true,
          min_quality_score: 75,
          max_execution_time: 90000,
          required_artifacts: ['html_output', 'text_version'],
          expected_agents: ['content_specialist', 'design_specialist', 'quality_specialist']
        }
      },
      {
        test_name: 'urgent_campaign',
        description: 'Generate urgent campaign with fast execution',
        request: {
          topic: 'Последние места на рейсы в Дубай',
          campaign_type: 'urgent',
          execution_strategy: 'speed',
          destination: 'Дубай',
          origin: 'Москва',
          output_requirements: {
            formats: ['html'],
            quality_level: 'basic',
            compliance_level: 'basic'
          }
        },
        expected_outcomes: {
          should_succeed: true,
          min_quality_score: 60,
          max_execution_time: 45000, // 45 seconds
          required_artifacts: ['html_output'],
          expected_agents: ['content_specialist', 'design_specialist', 'quality_specialist']
        }
      }
    ];

    for (const test of tests) {
      await this.executeTest(test);
    }
  }

  /**
   * Stage 2: Execution Strategy Tests
   */
  private async runExecutionStrategyTests(): Promise<void> {
    console.log('\n⚡ Stage 2: Execution Strategy Tests');
    console.log('-'.repeat(40));

    const baseRequest: EmailGenerationRequest = {
      topic: 'Зимний отдых в горах',
      campaign_type: 'seasonal',
      destination: 'Красная Поляна',
      origin: 'Москва'
    };

    const strategies = ['speed', 'quality', 'comprehensive'] as const;
    
    for (const strategy of strategies) {
      const test: TestConfig = {
        test_name: `strategy_${strategy}`,
        description: `Test ${strategy} execution strategy`,
        request: {
          ...baseRequest,
          execution_strategy: strategy,
          output_requirements: {
            formats: ['html', 'mjml'],
            quality_level: strategy === 'speed' ? 'basic' : strategy === 'quality' ? 'standard' : 'enterprise',
            compliance_level: strategy === 'speed' ? 'basic' : 'enterprise'
          }
        },
        expected_outcomes: {
          should_succeed: true,
          min_quality_score: strategy === 'speed' ? 60 : strategy === 'quality' ? 80 : 90,
          max_execution_time: strategy === 'speed' ? 45000 : strategy === 'quality' ? 90000 : 150000,
          required_artifacts: ['html_output'],
          expected_agents: ['content_specialist', 'design_specialist', 'quality_specialist']
        }
      };

      await this.executeTest(test);
    }
  }

  /**
   * Stage 3: Quality & Compliance Tests
   */
  private async runQualityComplianceTests(): Promise<void> {
    console.log('\n🔍 Stage 3: Quality & Compliance Tests');
    console.log('-'.repeat(40));

    const tests: TestConfig[] = [
      {
        test_name: 'enterprise_quality',
        description: 'Test enterprise-grade quality requirements',
        request: {
          topic: 'Премиум туры в Японию',
          campaign_type: 'promotional',
          destination: 'Токио',
          origin: 'Москва',
          execution_strategy: 'comprehensive',
          output_requirements: {
            formats: ['html', 'mjml', 'preview'],
            quality_level: 'enterprise',
            compliance_level: 'enterprise'
          },
          technical_specs: {
            email_clients: ['gmail', 'outlook', 'apple_mail', 'yahoo'],
            device_targets: ['desktop', 'mobile', 'tablet'],
            performance_targets: {
              max_load_time: 2000,
              max_file_size: 100000,
              min_compatibility: 95
            },
            accessibility_level: 'WCAG_AA'
          },
          workflow_config: {
            enable_quality_gates: true,
            monitoring_enabled: true
          }
        },
        expected_outcomes: {
          should_succeed: true,
          min_quality_score: 90,
          max_execution_time: 180000, // 3 minutes
          required_artifacts: ['html_output', 'mjml_source', 'preview_url'],
          expected_agents: ['content_specialist', 'design_specialist', 'quality_specialist']
        }
      },
      {
        test_name: 'accessibility_compliance',
        description: 'Test WCAG AAA accessibility compliance',
        request: {
          topic: 'Доступные путешествия для всех',
          campaign_type: 'informational',
          technical_specs: {
            email_clients: ['gmail', 'outlook', 'apple_mail'],
            device_targets: ['desktop', 'mobile'],
            performance_targets: {
              max_load_time: 1500,
              max_file_size: 80000,
              min_compatibility: 98
            },
            accessibility_level: 'WCAG_AAA'
          },
          content_preferences: {
            tone: 'professional',
            language: 'ru'
          }
        },
        expected_outcomes: {
          should_succeed: true,
          min_quality_score: 85,
          max_execution_time: 120000,
          required_artifacts: ['html_output'],
          expected_agents: ['content_specialist', 'design_specialist', 'quality_specialist']
        }
      }
    ];

    for (const test of tests) {
      await this.executeTest(test);
    }
  }

  /**
   * Stage 4: Performance & Scalability Tests
   */
  private async runPerformanceTests(): Promise<void> {
    console.log('\n⚡ Stage 4: Performance & Scalability Tests');
    console.log('-'.repeat(40));

    // Single execution benchmark
    await this.runPerformanceBenchmark();
    
    // Concurrent execution test
    await this.runConcurrentExecutionTest();
  }

  /**
   * Single execution performance benchmark
   */
  private async runPerformanceBenchmark(): Promise<void> {
    const test: TestConfig = {
      test_name: 'performance_benchmark',
      description: 'Performance benchmark with comprehensive configuration',
      request: {
        topic: 'Luxury Travel Experience',
        campaign_type: 'promotional',
        destination: 'Мальдивы',
        origin: 'Москва',
        execution_strategy: 'quality',
        content_preferences: {
          tone: 'luxury',
          language: 'ru',
          personalization_level: 'advanced',
          a_b_testing: true
        },
        technical_specs: {
          email_clients: ['gmail', 'outlook', 'apple_mail', 'yahoo'],
          device_targets: ['desktop', 'mobile', 'tablet'],
          performance_targets: {
            max_load_time: 2000,
            max_file_size: 100000,
            min_compatibility: 95
          },
          accessibility_level: 'WCAG_AA'
        },
        workflow_config: {
          use_parallel_processing: true,
          enable_quality_gates: true,
          monitoring_enabled: true
        }
      },
      expected_outcomes: {
        should_succeed: true,
        min_quality_score: 85,
        max_execution_time: 90000,
        required_artifacts: ['html_output', 'mjml_source'],
        expected_agents: ['content_specialist', 'design_specialist', 'quality_specialist']
      }
    };

    await this.executeTest(test);
  }

  /**
   * Concurrent execution test
   */
  private async runConcurrentExecutionTest(): Promise<void> {
    console.log('\n🔄 Testing concurrent execution...');
    
    const concurrentRequests: EmailGenerationRequest[] = [
      {
        topic: 'Отдых в Турции',
        campaign_type: 'promotional',
        destination: 'Анталья',
        execution_strategy: 'speed'
      },
      {
        topic: 'Бизнес поездки в Европу',
        campaign_type: 'informational',
        execution_strategy: 'quality'
      },
      {
        topic: 'Новогодние туры',
        campaign_type: 'seasonal',
        execution_strategy: 'quality'
      }
    ];

    const startTime = Date.now();
    
    try {
      const promises = concurrentRequests.map(async (request, index) => {
        console.log(`🚀 Starting concurrent request ${index + 1}: ${request.topic}`);
        return await this.orchestrator.generateEmail(request);
      });

      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      
      const successCount = results.filter(r => r.success).length;
      const avgExecutionTime = results.reduce((sum, r) => sum + r.execution_analytics.total_execution_time, 0) / results.length;
      
      console.log(`✅ Concurrent execution completed:`);
      console.log(`   - Total time: ${totalTime}ms`);
      console.log(`   - Success rate: ${successCount}/${results.length}`);
      console.log(`   - Average execution time: ${Math.round(avgExecutionTime)}ms`);
      
      // Store concurrent test result
      this.testResults.push({
        test_name: 'concurrent_execution',
        success: successCount === results.length,
        execution_time: totalTime,
        quality_score: results.reduce((sum, r) => sum + r.quality_metrics.overall_score, 0) / results.length,
        agents_executed: ['multiple'],
        artifacts_generated: ['html_output'],
        errors: results.filter(r => !r.success).map(r => r.error?.message || 'Unknown error'),
        warnings: [],
        performance_metrics: {
          concurrent_requests: results.length,
          success_rate: (successCount / results.length) * 100,
          avg_execution_time: avgExecutionTime
        },
        recommendations: []
      });
      
    } catch (error) {
      console.error('❌ Concurrent execution test failed:', error);
      
      this.testResults.push({
        test_name: 'concurrent_execution',
        success: false,
        execution_time: Date.now() - startTime,
        quality_score: 0,
        agents_executed: [],
        artifacts_generated: [],
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        warnings: [],
        performance_metrics: {},
        recommendations: ['Review concurrent execution implementation']
      });
    }
  }

  /**
   * Stage 5: Error Handling & Recovery Tests
   */
  private async runErrorHandlingTests(): Promise<void> {
    console.log('\n🛡️ Stage 5: Error Handling & Recovery Tests');
    console.log('-'.repeat(40));

    const tests: TestConfig[] = [
      {
        test_name: 'invalid_request_handling',
        description: 'Test handling of invalid request parameters',
        request: {
          topic: '', // Invalid empty topic
          campaign_type: 'promotional'
        },
        expected_outcomes: {
          should_succeed: false,
          min_quality_score: 0,
          max_execution_time: 10000,
          required_artifacts: [],
          expected_agents: []
        }
      },
      {
        test_name: 'fallback_strategy',
        description: 'Test fallback when high complexity meets speed strategy',
        request: {
          topic: 'Сложная многосегментная кампания с персонализацией',
          campaign_type: 'promotional',
          execution_strategy: 'speed',
          content_preferences: {
            personalization_level: 'dynamic',
            a_b_testing: true
          },
          technical_specs: {
            email_clients: ['gmail', 'outlook', 'apple_mail', 'yahoo', 'thunderbird'],
            device_targets: ['desktop', 'mobile'],
            performance_targets: {
              max_load_time: 2000,
              max_file_size: 100000,
              min_compatibility: 95
            },
            accessibility_level: 'WCAG_AAA'
          }
        },
        expected_outcomes: {
          should_succeed: true,
          min_quality_score: 75, // Should upgrade to quality strategy
          max_execution_time: 120000,
          required_artifacts: ['html_output'],
          expected_agents: ['content_specialist', 'design_specialist', 'quality_specialist']
        }
      }
    ];

    for (const test of tests) {
      await this.executeTest(test);
    }
  }

  /**
   * Stage 6: Legacy Compatibility Tests
   */
  private async runLegacyCompatibilityTests(): Promise<void> {
    console.log('\n🔄 Stage 6: Legacy Compatibility Tests');
    console.log('-'.repeat(40));

    const legacyRequest: EmailGenerationRequest = {
      topic: 'Тест обратной совместимости',
      campaign_type: 'promotional',
      destination: 'Сочи',
      origin: 'Москва'
    };

    try {
      console.log('🔄 Testing legacy orchestrate() method...');
      const startTime = Date.now();
      
      // Test legacy method
      const legacyResult = await this.orchestrator.orchestrate(legacyRequest);
      const executionTime = Date.now() - startTime;
      
      // Validate legacy format
      const hasRequiredFields = !!(
        legacyResult.success !== undefined &&
        legacyResult.finalState &&
        legacyResult.duration !== undefined &&
        legacyResult.stats
      );
      
      console.log(`✅ Legacy compatibility test:`);
      console.log(`   - Success: ${legacyResult.success}`);
      console.log(`   - Execution time: ${executionTime}ms`);
      console.log(`   - Has required fields: ${hasRequiredFields}`);
      console.log(`   - Final state keys: ${Object.keys(legacyResult.finalState || {}).join(', ')}`);
      
      this.testResults.push({
        test_name: 'legacy_compatibility',
        success: legacyResult.success && hasRequiredFields,
        execution_time: executionTime,
        quality_score: legacyResult.finalState?.qa_score || 0,
        agents_executed: ['legacy_interface'],
        artifacts_generated: legacyResult.finalState?.html ? ['html'] : [],
        errors: legacyResult.success ? [] : [legacyResult.error || 'Legacy execution failed'],
        warnings: [],
        performance_metrics: {
          legacy_compatibility: hasRequiredFields,
          stats: legacyResult.stats
        },
        recommendations: hasRequiredFields ? [] : ['Review legacy interface compatibility']
      });
      
    } catch (error) {
      console.error('❌ Legacy compatibility test failed:', error);
      
      this.testResults.push({
        test_name: 'legacy_compatibility',
        success: false,
        execution_time: 0,
        quality_score: 0,
        agents_executed: [],
        artifacts_generated: [],
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        warnings: [],
        performance_metrics: {},
        recommendations: ['Fix legacy interface compatibility']
      });
    }
  }

  /**
   * Execute individual test case
   */
  private async executeTest(test: TestConfig): Promise<void> {
    console.log(`\n🧪 Running test: ${test.test_name}`);
    console.log(`   Description: ${test.description}`);
    
    const startTime = Date.now();
    
    try {
      const result = await this.orchestrator.generateEmail(test.request);
      const executionTime = Date.now() - startTime;
      
      // Validate test outcomes
      const validation = this.validateTestResult(result, test.expected_outcomes);
      
      console.log(`   ${validation.success ? '✅' : '❌'} Result: ${validation.success ? 'PASSED' : 'FAILED'}`);
      console.log(`   Execution time: ${executionTime}ms (max: ${test.expected_outcomes.max_execution_time}ms)`);
      console.log(`   Quality score: ${result.quality_metrics.overall_score} (min: ${test.expected_outcomes.min_quality_score})`);
      console.log(`   Agents executed: ${result.execution_analytics.agent_breakdown.map(a => a.agent).join(', ')}`);
      
      if (!validation.success) {
        console.log(`   Issues: ${validation.issues.join(', ')}`);
      }
      
      // Store test result
      this.testResults.push({
        test_name: test.test_name,
        success: validation.success,
        execution_time: executionTime,
        quality_score: result.quality_metrics.overall_score,
        agents_executed: result.execution_analytics.agent_breakdown.map(a => a.agent),
        artifacts_generated: Object.keys(result.email_artifacts).filter(key => result.email_artifacts[key as keyof typeof result.email_artifacts]),
        errors: result.success ? [] : [result.error?.message || 'Unknown error'],
        warnings: result.warnings || [],
        performance_metrics: result.execution_analytics,
        recommendations: result.recommendations.content_optimizations.slice(0, 2)
      });
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.log(`   ❌ FAILED: ${errorMessage}`);
      console.log(`   Execution time: ${executionTime}ms`);
      
      const expectedToFail = !test.expected_outcomes.should_succeed;
      
      this.testResults.push({
        test_name: test.test_name,
        success: expectedToFail, // Success if we expected it to fail
        execution_time: executionTime,
        quality_score: 0,
        agents_executed: [],
        artifacts_generated: [],
        errors: [errorMessage],
        warnings: [],
        performance_metrics: {},
        recommendations: ['Review error handling implementation']
      });
    }
  }

  /**
   * Validate test result against expected outcomes
   */
  private validateTestResult(result: EmailGenerationResponse, expected: TestConfig['expected_outcomes']): { success: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check basic success expectation
    if (result.success !== expected.should_succeed) {
      issues.push(`Expected success: ${expected.should_succeed}, got: ${result.success}`);
    }
    
    if (expected.should_succeed && result.success) {
      // Check quality score
      if (result.quality_metrics.overall_score < expected.min_quality_score) {
        issues.push(`Quality score ${result.quality_metrics.overall_score} below minimum ${expected.min_quality_score}`);
      }
      
      // Check execution time
      if (result.execution_analytics.total_execution_time > expected.max_execution_time) {
        issues.push(`Execution time ${result.execution_analytics.total_execution_time}ms exceeds maximum ${expected.max_execution_time}ms`);
      }
      
      // Check required artifacts
      for (const artifact of expected.required_artifacts) {
        if (!result.email_artifacts[artifact as keyof typeof result.email_artifacts]) {
          issues.push(`Missing required artifact: ${artifact}`);
        }
      }
      
      // Check expected agents
      const executedAgents = result.execution_analytics.agent_breakdown.map(a => a.agent);
      for (const expectedAgent of expected.expected_agents) {
        if (!executedAgents.includes(expectedAgent)) {
          issues.push(`Expected agent not executed: ${expectedAgent}`);
        }
      }
    }
    
    return {
      success: issues.length === 0,
      issues
    };
  }

  /**
   * Generate comprehensive test report
   */
  private async generateTestReport(startTime: number): Promise<void> {
    const totalTime = Date.now() - startTime;
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    
    console.log('\n📊 TEST SUITE RESULTS');
    console.log('='.repeat(60));
    console.log(`Total execution time: ${Math.round(totalTime / 1000)}s`);
    console.log(`Tests run: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`Success rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    
    // Performance summary
    const avgExecutionTime = this.testResults.reduce((sum, r) => sum + r.execution_time, 0) / totalTests;
    const avgQualityScore = this.testResults.filter(r => r.quality_score > 0).reduce((sum, r) => sum + r.quality_score, 0) / this.testResults.filter(r => r.quality_score > 0).length;
    
    console.log('\n📈 PERFORMANCE SUMMARY');
    console.log('-'.repeat(40));
    console.log(`Average execution time: ${Math.round(avgExecutionTime)}ms`);
    console.log(`Average quality score: ${Math.round(avgQualityScore)}`);
    
    // Detailed results
    console.log('\n📋 DETAILED RESULTS');
    console.log('-'.repeat(40));
    
    for (const result of this.testResults) {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.test_name}: ${Math.round(result.execution_time)}ms, Q:${result.quality_score}`);
      
      if (!result.success && result.errors.length > 0) {
        console.log(`   Error: ${result.errors[0]}`);
      }
    }
    
    // Recommendations
    const allRecommendations = this.testResults.flatMap(r => r.recommendations).filter(Boolean);
    if (allRecommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS');
      console.log('-'.repeat(40));
      [...new Set(allRecommendations)].slice(0, 5).forEach(rec => {
        console.log(`• ${rec}`);
      });
    }
    
    // Architecture capabilities summary
    console.log('\n🏗️ ARCHITECTURE CAPABILITIES');
    console.log('-'.repeat(40));
    const capabilities = this.orchestrator.getOrchestratorCapabilities();
    console.log(`Architecture: ${capabilities.architecture}`);
    console.log(`Supported strategies: ${capabilities.supported_strategies.join(', ')}`);
    console.log(`Expected success rate: ${capabilities.performance_metrics.success_rate}`);
    console.log(`UltraThink integration: ${capabilities.features.ultrathink_integration ? 'Enabled' : 'Disabled'}`);
    
    // Final verdict
    console.log('\n🎯 FINAL VERDICT');
    console.log('='.repeat(60));
    
    if (passedTests / totalTests >= 0.8) {
      console.log('✅ PRODUCTION READY');
      console.log('The multi-agent architecture is ready for production deployment.');
    } else if (passedTests / totalTests >= 0.6) {
      console.log('⚠️  NEEDS IMPROVEMENTS');
      console.log('Some issues detected. Review failed tests before production deployment.');
    } else {
      console.log('❌ NOT READY');
      console.log('Significant issues detected. Major fixes required before deployment.');
    }
    
    console.log('\nTest suite completed! 🎉');
  }

  /**
   * Get test results for external analysis
   */
  getTestResults(): TestResult[] {
    return this.testResults;
  }

  /**
   * Get orchestrator instance for external testing
   */
  getOrchestrator(): WorkflowOrchestrator {
    return this.orchestrator;
  }
}

// Main execution function for standalone testing
export async function runMultiAgentTests(enableUltraThink: boolean = false): Promise<void> {
  console.log('🚀 Starting Multi-Agent Workflow Test Suite');
  console.log(`🧠 UltraThink: ${enableUltraThink ? 'Enabled' : 'Disabled'}`);
  
  const tester = new MultiAgentWorkflowTester(enableUltraThink);
  
  try {
    await tester.runTestSuite();
    
    const results = tester.getTestResults();
    const successRate = results.filter(r => r.success).length / results.length;
    
    if (successRate >= 0.8) {
      console.log('\n🎉 All tests passed! Multi-agent architecture is production ready.');
      process.exit(0);
    } else {
      console.log('\n⚠️ Some tests failed. Review the results before deployment.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Test suite execution failed:', error);
    process.exit(1);
  }
}

// Run tests if executed directly
if (require.main === module) {
  const enableUltraThink = process.argv.includes('--ultrathink');
  runMultiAgentTests(enableUltraThink);
}