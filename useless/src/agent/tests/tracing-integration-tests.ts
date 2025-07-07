/**
 * 🧪 TRACING INTEGRATION TESTS
 * 
 * Integration tests for the complete tracing system:
 * - Decorators + Performance Monitoring + OpenAI SDK
 * - End-to-end tracing workflow validation
 */

import { 
  Traced, 
  TracedAgent, 
  TracedTool, 
  TracedHandoff,
  TracedPerformance 
} from '../core/tracing-decorators';
import { 
  TracedWithPerformance,
  PerformanceTrackedAgent,
  withPerformanceTracking 
} from '../core/performance-integration';
import { performanceMonitor } from '../core/performance-monitor';
import { performanceDashboard } from '../core/performance-dashboard';

export interface IntegrationTestResult {
  testName: string;
  passed: boolean;
  details: string;
  tracingData?: any;
  performanceData?: any;
  errors?: string[];
}

/**
 * 🧪 Test class for decorator validation
 */
class TestAgent {
  agentType = 'test';

  // @Traced({ includeArgs: true, includeResult: true })
  async basicTracedMethod(input: string): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return `processed: ${input}`;
  }

  // @TracedAgent('test', { includeArgs: true })
  async agentTracedMethod(data: any): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 150));
    return { success: true, data };
  }

  // @TracedTool('test_tool', { includeArgs: true })
  async toolTracedMethod(params: any): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return { tool: 'test_tool', result: params };
  }

  // @TracedHandoff({ includeArgs: true })
  async handoffTracedMethod(payload: any): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 75));
    return { handoff: true, payload };
  }

  // @TracedPerformance({ includeArgs: false })
  async performanceTracedMethod(iterations: number): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, iterations * 10));
    return { iterations, completed: true };
  }

  // @TracedWithPerformance({ enablePerformanceTracking: true })
  async performanceIntegratedMethod(workload: number): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, workload));
    return { workload, success: true };
  }

  // @PerformanceTrackedAgent('test', { includeArgs: true })
  async fullTrackedMethod(complexity: number): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, complexity * 5));
    return { complexity, result: 'completed' };
  }
}

/**
 * 🔧 TRACING INTEGRATION TESTER
 */
export class TracingIntegrationTester {
  private testResults: IntegrationTestResult[] = [];
  private testAgent: TestAgent;

  constructor() {
    this.testAgent = new TestAgent();
    console.log('🧪 [INTEGRATION TEST] TracingIntegrationTester initialized');
  }

  /**
   * 🎯 Test basic decorator functionality
   */
  async testBasicDecorators(): Promise<IntegrationTestResult> {
    const testName = 'Basic Decorator Functionality';
    console.log(`🧪 [INTEGRATION TEST] Starting ${testName}...`);

    try {
      const errors: string[] = [];
      const tracingData: any = {};

      // Test @Traced decorator
      try {
        const result = await this.testAgent.basicTracedMethod('test_input');
        tracingData.basicTraced = { success: true, result };
      } catch (error) {
        errors.push(`@Traced failed: ${error}`);
      }

      // Test @TracedAgent decorator
      try {
        const result = await this.testAgent.agentTracedMethod({ test: 'data' });
        tracingData.agentTraced = { success: true, result };
      } catch (error) {
        errors.push(`@TracedAgent failed: ${error}`);
      }

      // Test @TracedTool decorator
      try {
        const result = await this.testAgent.toolTracedMethod({ param: 'value' });
        tracingData.toolTraced = { success: true, result };
      } catch (error) {
        errors.push(`@TracedTool failed: ${error}`);
      }

      // Test @TracedHandoff decorator
      try {
        const result = await this.testAgent.handoffTracedMethod({ transfer: 'data' });
        tracingData.handoffTraced = { success: true, result };
      } catch (error) {
        errors.push(`@TracedHandoff failed: ${error}`);
      }

      const passed = errors.length === 0;
      const result: IntegrationTestResult = {
        testName,
        passed,
        details: passed 
          ? 'All basic decorators executed successfully'
          : `${errors.length} decorator(s) failed`,
        tracingData,
        errors: errors.length > 0 ? errors : undefined
      };

      this.testResults.push(result);
      console.log(`🧪 [INTEGRATION TEST] ${testName}: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
      return result;

    } catch (error) {
      const result: IntegrationTestResult = {
        testName,
        passed: false,
        details: `Test execution failed: ${error}`,
        errors: [String(error)]
      };

      this.testResults.push(result);
      return result;
    }
  }

  /**
   * 📊 Test performance integration
   */
  async testPerformanceIntegration(): Promise<IntegrationTestResult> {
    const testName = 'Performance Integration';
    console.log(`🧪 [INTEGRATION TEST] Starting ${testName}...`);

    try {
      const errors: string[] = [];
      const performanceData: any = {};

      // Get baseline metrics
      const initialReport = performanceMonitor.getPerformanceReport();
      const initialMetrics = initialReport.summary.totalMetrics;

      // Test @TracedPerformance decorator
      try {
        const result = await this.testAgent.performanceTracedMethod(5);
        performanceData.performanceTraced = { success: true, result };
      } catch (error) {
        errors.push(`@TracedPerformance failed: ${error}`);
      }

      // Test @TracedWithPerformance decorator
      try {
        const result = await this.testAgent.performanceIntegratedMethod(100);
        performanceData.performanceIntegrated = { success: true, result };
      } catch (error) {
        errors.push(`@TracedWithPerformance failed: ${error}`);
      }

      // Test @PerformanceTrackedAgent decorator
      try {
        const result = await this.testAgent.fullTrackedMethod(10);
        performanceData.fullTracked = { success: true, result };
      } catch (error) {
        errors.push(`@PerformanceTrackedAgent failed: ${error}`);
      }

      // Test withPerformanceTracking wrapper
      try {
        const result = await withPerformanceTracking(
          'test',
          'wrapperMethod',
          async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
            return { wrapper: true };
          },
          { testMode: true }
        );
        performanceData.wrapper = { success: true, result };
      } catch (error) {
        errors.push(`withPerformanceTracking failed: ${error}`);
      }

      // Wait a bit for metrics to be recorded
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check if metrics were recorded
      const finalReport = performanceMonitor.getPerformanceReport();
      const finalMetrics = finalReport.summary.totalMetrics;
      const metricsRecorded = finalMetrics > initialMetrics;

      if (!metricsRecorded) {
        errors.push('No performance metrics were recorded');
      }

      const passed = errors.length === 0 && metricsRecorded;
      const result: IntegrationTestResult = {
        testName,
        passed,
        details: passed 
          ? `Performance integration working. ${finalMetrics - initialMetrics} new metrics recorded.`
          : `Performance integration issues: ${errors.join(', ')}`,
        performanceData: {
          ...performanceData,
          initialMetrics,
          finalMetrics,
          newMetrics: finalMetrics - initialMetrics
        },
        errors: errors.length > 0 ? errors : undefined
      };

      this.testResults.push(result);
      console.log(`🧪 [INTEGRATION TEST] ${testName}: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
      return result;

    } catch (error) {
      const result: IntegrationTestResult = {
        testName,
        passed: false,
        details: `Performance integration test failed: ${error}`,
        errors: [String(error)]
      };

      this.testResults.push(result);
      return result;
    }
  }

  /**
   * 📊 Test dashboard integration
   */
  async testDashboardIntegration(): Promise<IntegrationTestResult> {
    const testName = 'Dashboard Integration';
    console.log(`🧪 [INTEGRATION TEST] Starting ${testName}...`);

    try {
      const errors: string[] = [];

      // Start dashboard monitoring
      performanceDashboard.startMonitoring(1000); // 1 second for testing

      // Generate some activity
      await this.testAgent.basicTracedMethod('dashboard_test');
      await this.testAgent.performanceIntegratedMethod(50);

      // Wait for dashboard update
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Check dashboard data
      const dashboardData = performanceDashboard.getDashboardData();
      const hasData = dashboardData !== null;

      if (!hasData) {
        errors.push('Dashboard data not available');
      }

      // Test health cards
      const healthCards = performanceDashboard.getAgentHealthCards();
      const hasHealthCards = healthCards.length > 0;

      if (!hasHealthCards) {
        errors.push('Agent health cards not generated');
      }

      // Test report generation
      let reportGenerated = false;
      try {
        const report = performanceDashboard.generateReport();
        reportGenerated = report.length > 0;
      } catch (error) {
        errors.push(`Report generation failed: ${error}`);
      }

      // Stop monitoring
      performanceDashboard.stopMonitoring();

      const passed = errors.length === 0 && hasData && hasHealthCards && reportGenerated;
      const result: IntegrationTestResult = {
        testName,
        passed,
        details: passed 
          ? 'Dashboard integration working correctly'
          : `Dashboard issues: ${errors.join(', ')}`,
        tracingData: {
          hasData,
          hasHealthCards,
          reportGenerated,
          healthCardsCount: healthCards.length
        },
        errors: errors.length > 0 ? errors : undefined
      };

      this.testResults.push(result);
      console.log(`🧪 [INTEGRATION TEST] ${testName}: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
      return result;

    } catch (error) {
      const result: IntegrationTestResult = {
        testName,
        passed: false,
        details: `Dashboard integration test failed: ${error}`,
        errors: [String(error)]
      };

      this.testResults.push(result);
      return result;
    }
  }

  /**
   * 🔄 Test error handling and recovery
   */
  async testErrorHandling(): Promise<IntegrationTestResult> {
    const testName = 'Error Handling';
    console.log(`🧪 [INTEGRATION TEST] Starting ${testName}...`);

    try {
      const errors: string[] = [];
      const errorData: any = {};

      // Test decorator error handling
      const errorTestAgent = new (class extends TestAgent {
        // @Traced({ includeArgs: true })
        async errorMethod(): Promise<any> {
          throw new Error('Test error for tracing');
        }

        // @TracedWithPerformance({ enablePerformanceTracking: true })
        async performanceErrorMethod(): Promise<any> {
          throw new Error('Test error for performance tracking');
        }
      })();

      // Test that errors are properly handled and propagated
      let tracedErrorHandled = false;
      try {
        await errorTestAgent.errorMethod();
      } catch (error) {
        tracedErrorHandled = true;
        errorData.tracedError = { caught: true, message: (error as Error).message };
      }

      let performanceErrorHandled = false;
      try {
        await errorTestAgent.performanceErrorMethod();
      } catch (error) {
        performanceErrorHandled = true;
        errorData.performanceError = { caught: true, message: (error as Error).message };
      }

      // Test error metrics recording
      await new Promise(resolve => setTimeout(resolve, 100));
      const report = performanceMonitor.getPerformanceReport();
      const hasErrorMetrics = report.agentStats.some(stats => stats.errorRate > 0);

      if (!tracedErrorHandled) {
        errors.push('Traced decorator did not handle errors properly');
      }

      if (!performanceErrorHandled) {
        errors.push('Performance tracked decorator did not handle errors properly');
      }

      if (!hasErrorMetrics) {
        errors.push('Error metrics not recorded in performance monitor');
      }

      const passed = errors.length === 0;
      const result: IntegrationTestResult = {
        testName,
        passed,
        details: passed 
          ? 'Error handling working correctly across all components'
          : `Error handling issues: ${errors.join(', ')}`,
        tracingData: {
          ...errorData,
          hasErrorMetrics,
          errorRate: report.agentStats.find(s => s.agentType === 'test')?.errorRate || 0
        },
        errors: errors.length > 0 ? errors : undefined
      };

      this.testResults.push(result);
      console.log(`🧪 [INTEGRATION TEST] ${testName}: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
      return result;

    } catch (error) {
      const result: IntegrationTestResult = {
        testName,
        passed: false,
        details: `Error handling test failed: ${error}`,
        errors: [String(error)]
      };

      this.testResults.push(result);
      return result;
    }
  }

  /**
   * 🏃 Run all integration tests
   */
  async runAllIntegrationTests(): Promise<{
    passed: number;
    failed: number;
    total: number;
    results: IntegrationTestResult[];
    summary: string;
  }> {
    console.log('🚀 [INTEGRATION TEST] Starting comprehensive integration tests...');
    
    this.testResults = [];

    // Run all test suites
    await this.testBasicDecorators();
    await this.testPerformanceIntegration();
    await this.testDashboardIntegration();
    await this.testErrorHandling();

    // Calculate results
    const passed = this.testResults.filter(r => r.passed).length;
    const failed = this.testResults.filter(r => !r.passed).length;
    const total = this.testResults.length;

    const summary = this.generateIntegrationSummary(passed, failed, total);

    console.log('📊 [INTEGRATION TEST] Integration test execution completed');
    console.log(summary);

    return {
      passed,
      failed,
      total,
      results: this.testResults,
      summary
    };
  }

  /**
   * 📋 Generate integration test summary
   */
  private generateIntegrationSummary(passed: number, failed: number, total: number): string {
    const lines = [];
    
    lines.push('🧪 TRACING INTEGRATION TEST SUMMARY');
    lines.push('='.repeat(50));
    lines.push(`Total Tests: ${total}`);
    lines.push(`Passed: ${passed} ✅`);
    lines.push(`Failed: ${failed} ${failed > 0 ? '❌' : ''}`);
    lines.push(`Success Rate: ${Math.round((passed / total) * 100)}%`);
    lines.push('');

    // Detailed results
    this.testResults.forEach(result => {
      const status = result.passed ? '✅ PASSED' : '❌ FAILED';
      lines.push(`${status} ${result.testName}`);
      lines.push(`  ${result.details}`);
      
      if (result.errors && result.errors.length > 0) {
        lines.push(`  Errors: ${result.errors.join(', ')}`);
      }
      lines.push('');
    });

    lines.push(failed === 0 
      ? '🎉 ALL INTEGRATION TESTS PASSED! System fully integrated and working.'
      : '⚠️ Some integration tests failed. Check errors above.'
    );

    return lines.join('\n');
  }

  /**
   * 📊 Get test results
   */
  getIntegrationResults(): IntegrationTestResult[] {
    return this.testResults;
  }
}

/**
 * 🌍 Global integration tester
 */
export const tracingIntegrationTester = new TracingIntegrationTester();

/**
 * 🚀 Quick integration test runner
 */
export async function runTracingIntegrationTests(): Promise<void> {
  const results = await tracingIntegrationTester.runAllIntegrationTests();
  
  if (results.failed === 0) {
    console.log('🎉 All tracing integration tests passed!');
  } else {
    console.warn(`⚠️ ${results.failed} integration tests failed. Check details above.`);
  }
}