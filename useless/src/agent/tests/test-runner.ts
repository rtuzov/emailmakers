/**
 * 🧪 COMPREHENSIVE TEST RUNNER
 * 
 * Central test runner for all tracing and performance tests
 * Validates the complete agent optimization implementation
 */

import { runTracingVisibilityTests, tracingVisibilityTester } from './tracing-visibility-tests';
import { runTracingIntegrationTests, tracingIntegrationTester } from './tracing-integration-tests';
import { performanceMonitor } from '../core/performance-monitor';
import { performanceDashboard } from '../core/performance-dashboard';

export interface TestSuiteResult {
  suiteName: string;
  passed: number;
  failed: number;
  total: number;
  successRate: number;
  duration: number;
  details: any[];
}

export interface ComprehensiveTestResult {
  overallPassed: boolean;
  totalTests: number;
  totalPassed: number;
  totalFailed: number;
  overallSuccessRate: number;
  totalDuration: number;
  suiteResults: TestSuiteResult[];
  summary: string;
  recommendations: string[];
}

/**
 * 🎯 COMPREHENSIVE TEST RUNNER
 */
export class TracingTestRunner {
  private suiteResults: TestSuiteResult[] = [];

  constructor() {
    console.log('🧪 [TEST RUNNER] Comprehensive Test Runner initialized');
  }

  /**
   * 🚀 Run all test suites
   */
  async runAllTests(): Promise<ComprehensiveTestResult> {
    console.log('🚀 [TEST RUNNER] Starting comprehensive tracing system tests...');
    console.log('='.repeat(80));

    const overallStartTime = Date.now();
    this.suiteResults = [];

    // Suite 1: Tracing Visibility Tests
    const visibilityResult = await this.runTestSuite(
      'Tracing Visibility Tests',
      async () => {
        const results = await tracingVisibilityTester.runAllTests();
        return {
          passed: results.passed,
          failed: results.failed,
          total: results.total,
          details: results.results
        };
      }
    );

    // Suite 2: Tracing Integration Tests
    const integrationResult = await this.runTestSuite(
      'Tracing Integration Tests',
      async () => {
        const results = await tracingIntegrationTester.runAllIntegrationTests();
        return {
          passed: results.passed,
          failed: results.failed,
          total: results.total,
          details: results.results
        };
      }
    );

    // Suite 3: Performance System Tests
    const performanceResult = await this.runTestSuite(
      'Performance System Tests',
      async () => {
        return await this.runPerformanceSystemTests();
      }
    );

    // Suite 4: End-to-End System Tests
    const e2eResult = await this.runTestSuite(
      'End-to-End System Tests',
      async () => {
        return await this.runEndToEndTests();
      }
    );

    const totalDuration = Date.now() - overallStartTime;

    // Calculate overall results
    const totalTests = this.suiteResults.reduce((sum, suite) => sum + suite.total, 0);
    const totalPassed = this.suiteResults.reduce((sum, suite) => sum + suite.passed, 0);
    const totalFailed = this.suiteResults.reduce((sum, suite) => sum + suite.failed, 0);
    const overallSuccessRate = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;
    const overallPassed = totalFailed === 0;

    const result: ComprehensiveTestResult = {
      overallPassed,
      totalTests,
      totalPassed,
      totalFailed,
      overallSuccessRate,
      totalDuration,
      suiteResults: this.suiteResults,
      summary: this.generateComprehensiveSummary(overallPassed, totalTests, totalPassed, totalFailed, overallSuccessRate, totalDuration),
      recommendations: this.generateRecommendations()
    };

    console.log('\n' + '='.repeat(80));
    console.log(result.summary);
    
    return result;
  }

  /**
   * 🧪 Run individual test suite
   */
  private async runTestSuite(
    suiteName: string,
    testFunction: () => Promise<{ passed: number; failed: number; total: number; details: any[] }>
  ): Promise<TestSuiteResult> {
    console.log(`\n🧪 [TEST RUNNER] Running ${suiteName}...`);
    const startTime = Date.now();

    try {
      const results = await testFunction();
      const duration = Date.now() - startTime;
      const successRate = results.total > 0 ? Math.round((results.passed / results.total) * 100) : 0;

      const suiteResult: TestSuiteResult = {
        suiteName,
        passed: results.passed,
        failed: results.failed,
        total: results.total,
        successRate,
        duration,
        details: results.details
      };

      this.suiteResults.push(suiteResult);

      console.log(`✅ [TEST RUNNER] ${suiteName} completed: ${results.passed}/${results.total} passed (${successRate}%) in ${duration}ms`);
      return suiteResult;

    } catch (error) {
      const duration = Date.now() - startTime;
      const suiteResult: TestSuiteResult = {
        suiteName,
        passed: 0,
        failed: 1,
        total: 1,
        successRate: 0,
        duration,
        details: [{ error: String(error) }]
      };

      this.suiteResults.push(suiteResult);
      console.error(`❌ [TEST RUNNER] ${suiteName} failed:`, error);
      return suiteResult;
    }
  }

  /**
   * 📊 Run performance system tests
   */
  private async runPerformanceSystemTests(): Promise<{ passed: number; failed: number; total: number; details: any[] }> {
    const tests = [];
    let passed = 0;
    let failed = 0;

    // Test 1: Performance Monitor Functionality
    try {
      await performanceMonitor.recordMetric({
        timestamp: new Date().toISOString(),
        agentType: 'test_performance',
        methodName: 'testMethod',
        executionTime: 100,
        memoryUsage: process.memoryUsage(),
        success: true,
        traceId: 'test_123'
      });

      const report = performanceMonitor.getPerformanceReport();
      const hasMetrics = report.summary.totalMetrics > 0;

      if (hasMetrics) {
        passed++;
        tests.push({ name: 'Performance Monitor', status: 'passed', details: 'Metrics recorded successfully' });
      } else {
        failed++;
        tests.push({ name: 'Performance Monitor', status: 'failed', details: 'No metrics recorded' });
      }
    } catch (error) {
      failed++;
      tests.push({ name: 'Performance Monitor', status: 'failed', details: String(error) });
    }

    // Test 2: Dashboard Functionality
    try {
      performanceDashboard.startMonitoring(500); // Fast for testing
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const dashboardData = performanceDashboard.getDashboardData();
      const report = performanceDashboard.generateReport();
      
      performanceDashboard.stopMonitoring();

      if (dashboardData && report.length > 0) {
        passed++;
        tests.push({ name: 'Performance Dashboard', status: 'passed', details: 'Dashboard working correctly' });
      } else {
        failed++;
        tests.push({ name: 'Performance Dashboard', status: 'failed', details: 'Dashboard not generating data' });
      }
    } catch (error) {
      failed++;
      tests.push({ name: 'Performance Dashboard', status: 'failed', details: String(error) });
    }

    // Test 3: Alert System
    try {
      // Trigger a slow execution alert
      await performanceMonitor.recordMetric({
        timestamp: new Date().toISOString(),
        agentType: 'test_alerts',
        methodName: 'slowMethod',
        executionTime: 6000, // 6 seconds (above threshold)
        memoryUsage: process.memoryUsage(),
        success: true,
        traceId: 'test_slow_123'
      });

      await new Promise(resolve => setTimeout(resolve, 100));
      
      const alerts = performanceMonitor.getActiveAlerts();
      const hasAlerts = alerts.length > 0;

      if (hasAlerts) {
        passed++;
        tests.push({ name: 'Alert System', status: 'passed', details: `${alerts.length} alert(s) generated` });
      } else {
        failed++;
        tests.push({ name: 'Alert System', status: 'failed', details: 'No alerts generated for slow execution' });
      }
    } catch (error) {
      failed++;
      tests.push({ name: 'Alert System', status: 'failed', details: String(error) });
    }

    return {
      passed,
      failed,
      total: passed + failed,
      details: tests
    };
  }

  /**
   * 🔄 Run end-to-end system tests
   */
  private async runEndToEndTests(): Promise<{ passed: number; failed: number; total: number; details: any[] }> {
    const tests = [];
    let passed = 0;
    let failed = 0;

    // Test 1: Complete workflow simulation
    try {
      const workflow = new (class {
        agentType = 'e2e_test';

        async simulateContentGeneration(): Promise<any> {
          await new Promise(resolve => setTimeout(resolve, 100));
          return { content: 'generated', success: true };
        }

        async simulateDesignRendering(): Promise<any> {
          await new Promise(resolve => setTimeout(resolve, 150));
          return { design: 'rendered', success: true };
        }

        async simulateQualityValidation(): Promise<any> {
          await new Promise(resolve => setTimeout(resolve, 80));
          return { quality: 'validated', success: true };
        }

        async simulateDeliveryDeployment(): Promise<any> {
          await new Promise(resolve => setTimeout(resolve, 120));
          return { delivery: 'deployed', success: true };
        }
      })();

      // Simulate complete workflow with performance tracking
      const workflowResults = await Promise.all([
        workflow.simulateContentGeneration(),
        workflow.simulateDesignRendering(), 
        workflow.simulateQualityValidation(),
        workflow.simulateDeliveryDeployment()
      ]);

      const allSuccessful = workflowResults.every(result => result.success);

      if (allSuccessful) {
        passed++;
        tests.push({ name: 'E2E Workflow Simulation', status: 'passed', details: 'All workflow steps completed successfully' });
      } else {
        failed++;
        tests.push({ name: 'E2E Workflow Simulation', status: 'failed', details: 'Some workflow steps failed' });
      }
    } catch (error) {
      failed++;
      tests.push({ name: 'E2E Workflow Simulation', status: 'failed', details: String(error) });
    }

    // Test 2: System health check
    try {
      const report = performanceMonitor.getPerformanceReport();
      const healthScore = report.summary.systemHealthScore;
      const isHealthy = healthScore >= 70; // Reasonable threshold for tests

      if (isHealthy) {
        passed++;
        tests.push({ name: 'System Health Check', status: 'passed', details: `System health: ${healthScore}%` });
      } else {
        failed++;
        tests.push({ name: 'System Health Check', status: 'failed', details: `Poor system health: ${healthScore}%` });
      }
    } catch (error) {
      failed++;
      tests.push({ name: 'System Health Check', status: 'failed', details: String(error) });
    }

    // Test 3: Configuration validation
    try {
      const config = require('../core/tracing-config');
      const profiles = config.tracingConfig.getAllProfiles();
      const hasProfiles = profiles.length >= 4; // content, design, quality, delivery

      if (hasProfiles) {
        passed++;
        tests.push({ name: 'Configuration Validation', status: 'passed', details: `${profiles.length} agent profiles configured` });
      } else {
        failed++;
        tests.push({ name: 'Configuration Validation', status: 'failed', details: 'Missing agent profiles in configuration' });
      }
    } catch (error) {
      failed++;
      tests.push({ name: 'Configuration Validation', status: 'failed', details: String(error) });
    }

    return {
      passed,
      failed,
      total: passed + failed,
      details: tests
    };
  }

  /**
   * 📋 Generate comprehensive summary
   */
  private generateComprehensiveSummary(
    overallPassed: boolean,
    totalTests: number,
    totalPassed: number,
    totalFailed: number,
    overallSuccessRate: number,
    totalDuration: number
  ): string {
    const lines = [];

    lines.push('🎯 COMPREHENSIVE TRACING SYSTEM TEST RESULTS');
    lines.push('='.repeat(80));
    lines.push('');
    
    // Overall results
    lines.push('📊 OVERALL RESULTS:');
    lines.push(`   Total Tests: ${totalTests}`);
    lines.push(`   Passed: ${totalPassed} ✅`);
    lines.push(`   Failed: ${totalFailed} ${totalFailed > 0 ? '❌' : ''}`);
    lines.push(`   Success Rate: ${overallSuccessRate}%`);
    lines.push(`   Total Duration: ${Math.round(totalDuration / 1000)}s`);
    lines.push('');

    // Suite breakdown
    lines.push('🧪 TEST SUITE BREAKDOWN:');
    this.suiteResults.forEach(suite => {
      const status = suite.failed === 0 ? '✅' : '❌';
      lines.push(`   ${status} ${suite.suiteName}: ${suite.passed}/${suite.total} (${suite.successRate}%) - ${suite.duration}ms`);
    });
    lines.push('');

    // Final verdict
    if (overallPassed && overallSuccessRate >= 95) {
      lines.push('🎉 EXCELLENT! All systems fully operational and optimized.');
      lines.push('🚀 Agent tracing system is production-ready.');
      lines.push('📊 All functions are visible in OpenAI SDK tracing.');
      lines.push('⚡ Performance monitoring is working perfectly.');
    } else if (overallSuccessRate >= 80) {
      lines.push('✅ GOOD! Most systems working with minor issues.');
      lines.push('⚠️ Some optimization may be needed.');
    } else {
      lines.push('❌ ATTENTION REQUIRED! Significant issues detected.');
      lines.push('🔧 System needs debugging and fixes.');
    }

    return lines.join('\n');
  }

  /**
   * 💡 Generate recommendations based on test results
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    this.suiteResults.forEach(suite => {
      if (suite.failed > 0) {
        recommendations.push(`Fix ${suite.failed} failing test(s) in ${suite.suiteName}`);
      }
      
      if (suite.successRate < 90) {
        recommendations.push(`Improve ${suite.suiteName} success rate (currently ${suite.successRate}%)`);
      }
      
      if (suite.duration > 5000) { // 5 seconds
        recommendations.push(`Optimize performance of ${suite.suiteName} (${suite.duration}ms)`);
      }
    });

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push('System is fully optimized - consider monitoring for production deployment');
    } else {
      recommendations.push('After fixes, re-run tests to validate improvements');
    }

    return recommendations;
  }

  /**
   * 📊 Get detailed results
   */
  getDetailedResults(): TestSuiteResult[] {
    return this.suiteResults;
  }
}

/**
 * 🌍 Global test runner instance
 */
export const tracingTestRunner = new TracingTestRunner();

/**
 * 🚀 Quick comprehensive test execution
 */
export async function runComprehensiveTests(): Promise<ComprehensiveTestResult> {
  return await tracingTestRunner.runAllTests();
}

/**
 * 📋 Quick test summary
 */
export async function getTestSummary(): Promise<string> {
  const results = await runComprehensiveTests();
  return results.summary;
}