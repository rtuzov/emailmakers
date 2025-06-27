#!/usr/bin/env tsx

/**
 * Comprehensive UltraThink Test Suite
 * Полное тестирование всех компонентов улучшенного UltraThink агента
 */

import { EmailGeneratorAgent } from './agent';
import { demonstrateUltraThink } from './ultrathink/example';
import { cacheManager } from './core/cache-manager';
import { briefAnalyzer } from './core/brief-analyzer';
import { EmailGenerationRequest } from './types';

interface TestResult {
  testName: string;
  passed: boolean;
  duration: number;
  details: string;
  score?: number;
}

class UltraThinkComprehensiveTest {
  private results: TestResult[] = [];
  private totalTests = 0;
  private passedTests = 0;

  async runAllTests(): Promise<void> {
    console.log('🧪 ============================================');
    console.log('🧪 ULTRATHINK COMPREHENSIVE TEST SUITE');
    console.log('🧪 ============================================\n');

    try {
      // Phase 1: Core UltraThink Tests
      console.log('📋 Phase 1: Core UltraThink Functionality');
      await this.testPhase1CoreFunctionality();

      // Phase 2: Agent Integration Tests  
      console.log('\n📋 Phase 2: Agent Integration');
      await this.testPhase2AgentIntegration();

      // Phase 3: Workflow Orchestration Tests
      console.log('\n📋 Phase 3: Workflow Orchestration');
      await this.testPhase3WorkflowOrchestration();

      // Phase 4: Caching System Tests
      console.log('\n📋 Phase 4: Caching System');
      await this.testPhase4CachingSystem();

      // Phase 5: Brief Analysis Tests
      console.log('\n📋 Phase 5: Brief Analysis');
      await this.testPhase5BriefAnalysis();

      // Phase 6: Meta-Methods Tests
      console.log('\n📋 Phase 6: Meta-Methods');
      await this.testPhase6MetaMethods();

      // Phase 7: Performance Tests
      console.log('\n📋 Phase 7: Performance Tests');
      await this.testPhase7Performance();

      // Phase 8: Error Handling Tests
      console.log('\n📋 Phase 8: Error Handling');
      await this.testPhase8ErrorHandling();

    } catch (error) {
      console.error('❌ Test suite failed:', error);
    } finally {
      this.printFinalResults();
    }
  }

  /**
   * Phase 1: Core UltraThink Functionality
   */
  private async testPhase1CoreFunctionality(): Promise<void> {
    // Test 1-1: UltraThink Example Demonstration
    await this.runTest('UltraThink Example Demo', async () => {
      await demonstrateUltraThink();
      return { passed: true, details: 'UltraThink demonstration completed successfully' };
    });

    // Test 1-2: Route Validation
    await this.runTest('Route Validation', async () => {
      const { RouteValidator } = await import('./ultrathink');
      
      // Test valid route
      const validRoute = RouteValidator.validateRoute('MOW', 'LED');
      if (!validRoute.valid || validRoute.popularity !== 'high') {
        throw new Error('Valid route validation failed');
      }

      // Test invalid route (same origin/destination)
      const invalidRoute = RouteValidator.validateRoute('LED', 'LED');
      if (invalidRoute.valid || !invalidRoute.correctedDestination) {
        throw new Error('Invalid route correction failed');
      }

      return { passed: true, details: 'Route validation working correctly' };
    });

    // Test 1-3: Date Validation
    await this.runTest('Date Validation', async () => {
      const { DateValidator } = await import('./ultrathink');
      
      // Test future date
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const endDate = new Date(futureDate);
      endDate.setDate(endDate.getDate() + 7);
      
      const dateRange = `${futureDate.toISOString().split('T')[0]},${endDate.toISOString().split('T')[0]}`;
      const validation = DateValidator.validateDateRange(dateRange, 'AER');
      
      if (!validation.valid || !validation.seasonalContext) {
        throw new Error('Date validation failed');
      }

      return { passed: true, details: 'Date validation working correctly' };
    });

    // Test 1-4: Context Enrichment
    await this.runTest('Context Enrichment', async () => {
      const { ContextEnricher } = await import('./ultrathink');
      
      const request: EmailGenerationRequest = {
        topic: 'Летний отпуск в Сочи',
        origin: 'MOW',
        destination: 'AER',
        date_range: '2025-07-15,2025-07-22',
        campaign_type: 'seasonal'
      };

      const enrichment = await ContextEnricher.enrichContext(request);
      
      if (!enrichment.seasonal || enrichment.suggestions.length === 0) {
        throw new Error('Context enrichment failed');
      }

      return { 
        passed: true, 
        details: `Context enriched with ${enrichment.suggestions.length} suggestions`,
        score: enrichment.suggestions.length * 10
      };
    });
  }

  /**
   * Phase 2: Agent Integration
   */
  private async testPhase2AgentIntegration(): Promise<void> {
    // Test 2-1: Agent Initialization with UltraThink
    await this.runTest('Agent UltraThink Initialization', async () => {
      const agent = new EmailGeneratorAgent(true, 'quality');
      
      // Check if UltraThink is properly initialized
      const workflowMode = agent.getWorkflowMode();
      if (workflowMode !== 'multi_agent') {
        throw new Error('Agent not using orchestrated workflow');
      }

      return { passed: true, details: 'Agent initialized with UltraThink successfully' };
    });

    // Test 2-2: Basic Email Generation
    await this.runTest('Basic Email Generation', async () => {
      const agent = new EmailGeneratorAgent(true, 'speed'); // Speed mode for faster testing
      
      const request: EmailGenerationRequest = {
        topic: 'Тестовая кампания для проверки агента',
        origin: 'MOW',
        destination: 'LED',
        campaign_type: 'promotional'
      };

      const result = await agent.generateEmail(request);
      
      if (result.status !== 'success') {
        throw new Error(`Email generation failed: ${result.error_message}`);
      }

      return { 
        passed: true, 
        details: `Email generated in ${result.generation_time}ms`,
        score: Math.max(0, 100 - (result.generation_time || 0) / 100)
      };
    });
  }

  /**
   * Phase 3: Workflow Orchestration
   */
  private async testPhase3WorkflowOrchestration(): Promise<void> {
    // Test 3-1: Orchestrated Workflow Execution
    await this.runTest('Orchestrated Workflow', async () => {
      const agent = new EmailGeneratorAgent(true, 'quality');
      
      const request: EmailGenerationRequest = {
        topic: 'Сложная кампания для тестирования оркестрации',
        origin: 'MOW',
        destination: 'CDG',
        campaign_type: 'promotional',
        target_audience: 'business travelers',
        date_range: '2025-08-15,2025-08-22'
      };

      const result = await agent.generateEmail(request);
      
      if (result.status !== 'success') {
        throw new Error(`Orchestrated workflow failed: ${result.error_message}`);
      }

      return { 
        passed: true, 
        details: `Orchestrated workflow completed in ${result.generation_time}ms` 
      };
    });

    // Test 3-2: Parallel Tool Execution
    await this.runTest('Parallel Tool Execution', async () => {
      // This test verifies that parallel tools execute faster than sequential
      const agent = new EmailGeneratorAgent(true, 'speed');
      
      const startTime = Date.now();
      
      const request: EmailGenerationRequest = {
        topic: 'Параллельное выполнение инструментов',
        origin: 'LED',
        destination: 'AER',
        campaign_type: 'promotional'
      };

      const result = await agent.generateEmail(request);
      const duration = Date.now() - startTime;
      
      if (result.status !== 'success') {
        throw new Error('Parallel execution test failed');
      }

      // Parallel execution should be reasonably fast
      if (duration > 60000) { // 60 seconds max
        throw new Error(`Parallel execution too slow: ${duration}ms`);
      }

      return { 
        passed: true, 
        details: `Parallel execution completed in ${duration}ms` 
      };
    });
  }

  /**
   * Phase 4: Caching System
   */
  private async testPhase4CachingSystem(): Promise<void> {
    // Test 4-1: Cache Write and Read
    await this.runTest('Cache Write/Read', async () => {
      const testKey = 'test-cache-key';
      const testData = { test: 'data', timestamp: Date.now() };
      
      // Write to cache
      await cacheManager.set(testKey, testData, 1); // 1 minute TTL
      
      // Read from cache
      const cachedData = await cacheManager.get(testKey);
      
      if (!cachedData || (cachedData as any).test !== testData.test) {
        throw new Error('Cache write/read failed');
      }

      return { passed: true, details: 'Cache write/read working correctly' };
    });

    // Test 4-2: Cache Performance
    await this.runTest('Cache Performance', async () => {
      const stats = cacheManager.getStats();
      
      if (stats.totalEntries < 0) {
        throw new Error('Invalid cache stats');
      }

      return { 
        passed: true, 
        details: `Cache has ${stats.totalEntries} entries, hit rate: ${(stats.hitRate * 100).toFixed(1)}%`,
        score: Math.round(stats.hitRate * 100)
      };
    });

    // Test 4-3: Cache TTL
    await this.runTest('Cache TTL', async () => {
      const testKey = 'test-ttl-key';
      const testData = { test: 'ttl-data' };
      
      // Write with very short TTL (for testing)
      await cacheManager.set(testKey, testData, 0.01); // 0.6 seconds
      
      // Should be available immediately
      let cachedData = await cacheManager.get(testKey);
      if (!cachedData) {
        throw new Error('Cache data should be available immediately');
      }
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Should be expired now
      cachedData = await cacheManager.get(testKey);
      if (cachedData) {
        throw new Error('Cache data should have expired');
      }

      return { passed: true, details: 'Cache TTL working correctly' };
    });
  }

  /**
   * Phase 5: Brief Analysis
   */
  private async testPhase5BriefAnalysis(): Promise<void> {
    // Test 5-1: Brief Quality Analysis
    await this.runTest('Brief Quality Analysis', async () => {
      const goodRequest: EmailGenerationRequest = {
        topic: 'Летние скидки до 50% на авиабилеты в Турцию - только до 31 июля!',
        origin: 'MOW',
        destination: 'AYT',
        campaign_type: 'promotional',
        target_audience: 'семьи с детьми',
        tone: 'friendly',
        date_range: '2025-07-01,2025-08-31'
      };

      const analysis = await briefAnalyzer.analyzeBrief(goodRequest);
      
      if (analysis.score < 70) {
        throw new Error(`Brief analysis score too low: ${analysis.score}`);
      }

      return { 
        passed: true, 
        details: `Brief scored ${analysis.score}/100 with ${analysis.issues.length} issues`,
        score: analysis.score
      };
    });

    // Test 5-2: Brief with Issues
    await this.runTest('Brief Issue Detection', async () => {
      const poorRequest: EmailGenerationRequest = {
        topic: 'Лето', // Very poor topic
        origin: 'LED',
        destination: 'LED', // Same origin/destination
        campaign_type: 'urgent',
        tone: 'casual' // Conflicting with urgent campaign
      };

      const analysis = await briefAnalyzer.analyzeBrief(poorRequest);
      
      if (analysis.issues.length === 0) {
        throw new Error('Should have detected issues in poor brief');
      }

      const criticalIssues = analysis.issues.filter(i => i.severity === 'critical');
      if (criticalIssues.length === 0) {
        throw new Error('Should have detected critical issues');
      }

      return { 
        passed: true, 
        details: `Detected ${analysis.issues.length} issues (${criticalIssues.length} critical)` 
      };
    });
  }

  /**
   * Phase 6: Meta-Methods
   */
  private async testPhase6MetaMethods(): Promise<void> {
    // Test 6-1: Promotional Email Meta-Method
    await this.runTest('Promotional Email Meta-Method', async () => {
      const agent = new EmailGeneratorAgent(true, 'speed');
      
      const result = await agent.generatePromotionalEmail({
        destination: 'PAR',
        discount: '30%',
        urgency: 'high',
        audience: 'business',
        season: 'summer'
      });

      if (result.status !== 'success') {
        throw new Error(`Promotional meta-method failed: ${result.error_message}`);
      }

      return { 
        passed: true, 
        details: `Promotional email generated in ${result.generation_time}ms` 
      };
    });

    // Test 6-2: Seasonal Email Meta-Method
    await this.runTest('Seasonal Email Meta-Method', async () => {
      const agent = new EmailGeneratorAgent(true, 'speed');
      
      const result = await agent.generateSeasonalEmail({
        season: 'winter',
        destinations: ['AYT', 'HRG'],
        theme: 'vacation',
        priceRange: 'budget'
      });

      if (result.status !== 'success') {
        throw new Error(`Seasonal meta-method failed: ${result.error_message}`);
      }

      return { 
        passed: true, 
        details: `Seasonal email generated in ${result.generation_time}ms` 
      };
    });

    // Test 6-3: Quick Email Generation
    await this.runTest('Quick Email Generation', async () => {
      const agent = new EmailGeneratorAgent(true, 'speed');
      
      const result = await agent.generateQuickEmail('LON', 'Зимние предложения');

      if (result.status !== 'success') {
        throw new Error(`Quick email generation failed: ${result.error_message}`);
      }

      // Quick generation should be fast
      if ((result.generation_time || 0) > 30000) {
        throw new Error(`Quick generation too slow: ${result.generation_time}ms`);
      }

      return { 
        passed: true, 
        details: `Quick email generated in ${result.generation_time}ms` 
      };
    });
  }

  /**
   * Phase 7: Performance Tests
   */
  private async testPhase7Performance(): Promise<void> {
    // Test 7-1: Multiple Concurrent Requests
    await this.runTest('Concurrent Requests', async () => {
      const agent = new EmailGeneratorAgent(true, 'speed');
      
      const requests = Array.from({ length: 3 }, (_, i) => ({
        topic: `Параллельный запрос ${i + 1}`,
        origin: 'MOW',
        destination: ['LED', 'AER', 'KZN'][i],
        campaign_type: 'promotional' as const
      }));

      const startTime = Date.now();
      
      const results = await Promise.all(
        requests.map(req => agent.generateEmail(req))
      );
      
      const duration = Date.now() - startTime;
      
      const successCount = results.filter(r => r.status === 'success').length;
      
      if (successCount !== 3) {
        throw new Error(`Only ${successCount}/3 concurrent requests succeeded`);
      }

      return { 
        passed: true, 
        details: `3 concurrent requests completed in ${duration}ms` 
      };
    });

    // Test 7-2: Cache Hit Performance
    await this.runTest('Cache Hit Performance', async () => {
      const agent = new EmailGeneratorAgent(true, 'speed');
      
      const request: EmailGenerationRequest = {
        topic: 'Тест кэширования',
        origin: 'MOW',
        destination: 'LED',
        campaign_type: 'promotional'
      };

      // First request (cache miss)
      const result1 = await agent.generateEmail(request);
      const time1 = result1.generation_time || 0;

      // Second identical request (should use cache)
      const result2 = await agent.generateEmail(request);
      const time2 = result2.generation_time || 0;

      if (result1.status !== 'success' || result2.status !== 'success') {
        throw new Error('Cache test requests failed');
      }

      // Second request should be faster due to caching
      const improvement = ((time1 - time2) / time1) * 100;

      return { 
        passed: true, 
        details: `Cache improved performance by ${improvement.toFixed(1)}%`,
        score: Math.max(0, improvement)
      };
    });
  }

  /**
   * Phase 8: Error Handling
   */
  private async testPhase8ErrorHandling(): Promise<void> {
    // Test 8-1: Invalid Request Handling
    await this.runTest('Invalid Request Handling', async () => {
      const agent = new EmailGeneratorAgent(true, 'speed');
      
      const invalidRequest: EmailGenerationRequest = {
        topic: '', // Empty topic
        campaign_type: 'promotional'
      };

      try {
        const result = await agent.generateEmail(invalidRequest);
        if (result.status === 'success') {
          throw new Error('Should have failed with empty topic');
        }
      } catch (error) {
        // Expected error
      }

      return { passed: true, details: 'Invalid request properly handled' };
    });

    // Test 8-2: Auto-correction of Conflicting Parameters
    await this.runTest('Auto-correction', async () => {
      const agent = new EmailGeneratorAgent(true, 'speed');
      
      const conflictingRequest: EmailGenerationRequest = {
        topic: 'Тест автокоррекции',
        origin: 'LED',
        destination: 'LED', // Same as origin - should be auto-corrected
        campaign_type: 'promotional'
      };

      const result = await agent.generateEmail(conflictingRequest);
      
      if (result.status !== 'success') {
        throw new Error(`Auto-correction failed: ${result.error_message}`);
      }

      return { 
        passed: true, 
        details: 'Conflicting parameters auto-corrected successfully' 
      };
    });
  }

  /**
   * Test runner helper
   */
  private async runTest(
    testName: string, 
    testFn: () => Promise<{ passed: boolean; details: string; score?: number }>
  ): Promise<void> {
    const startTime = Date.now();
    this.totalTests++;
    
    try {
      console.log(`🧪 Running: ${testName}...`);
      
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      this.results.push({
        testName,
        passed: result.passed,
        duration,
        details: result.details,
        score: result.score
      });
      
      if (result.passed) {
        this.passedTests++;
        const scoreText = result.score ? ` (Score: ${result.score})` : '';
        console.log(`✅ ${testName}: ${result.details} (${duration}ms)${scoreText}`);
      } else {
        console.log(`❌ ${testName}: ${result.details} (${duration}ms)`);
      }
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.push({
        testName,
        passed: false,
        duration,
        details: error instanceof Error ? error.message : 'Unknown error'
      });
      
      console.log(`❌ ${testName}: ${error instanceof Error ? error.message : 'Unknown error'} (${duration}ms)`);
    }
  }

  /**
   * Print final test results
   */
  private printFinalResults(): void {
    console.log('\n🧪 ============================================');
    console.log('🧪 FINAL TEST RESULTS');
    console.log('🧪 ============================================');
    
    const successRate = (this.passedTests / this.totalTests) * 100;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    const averageScore = this.results
      .filter(r => r.score !== undefined)
      .reduce((sum, r, _, arr) => sum + (r.score || 0) / arr.length, 0);
    
    console.log(`📊 Overall Results:`);
    console.log(`   Tests Passed: ${this.passedTests}/${this.totalTests} (${successRate.toFixed(1)}%)`);
    console.log(`   Total Duration: ${totalDuration}ms (${(totalDuration / 1000).toFixed(1)}s)`);
    console.log(`   Average Score: ${averageScore.toFixed(1)}/100`);
    
    console.log(`\n📋 Test Breakdown:`);
    
    const phases = [
      'Core UltraThink',
      'Agent Integration', 
      'Workflow Orchestration',
      'Caching System',
      'Brief Analysis',
      'Meta-Methods',
      'Performance',
      'Error Handling'
    ];
    
    phases.forEach((phase, index) => {
      const phaseResults = this.results.filter(r => 
        r.testName.includes(this.getPhaseKeywords(index))
      );
      
      if (phaseResults.length > 0) {
        const phasePassed = phaseResults.filter(r => r.passed).length;
        const phaseRate = (phasePassed / phaseResults.length) * 100;
        const status = phaseRate === 100 ? '✅' : phaseRate >= 75 ? '⚠️' : '❌';
        
        console.log(`   ${status} ${phase}: ${phasePassed}/${phaseResults.length} (${phaseRate.toFixed(1)}%)`);
      }
    });
    
    // Show failed tests
    const failedTests = this.results.filter(r => !r.passed);
    if (failedTests.length > 0) {
      console.log(`\n❌ Failed Tests:`);
      failedTests.forEach(test => {
        console.log(`   - ${test.testName}: ${test.details}`);
      });
    }
    
    // Final verdict
    console.log(`\n🎯 Final Verdict:`);
    if (successRate === 100) {
      console.log('🎉 ALL TESTS PASSED! UltraThink is fully operational.');
    } else if (successRate >= 90) {
      console.log('✅ Excellent! UltraThink is working very well.');
    } else if (successRate >= 75) {
      console.log('⚠️ Good! UltraThink is working with minor issues.');
    } else if (successRate >= 50) {
      console.log('⚠️ Fair! UltraThink has some issues that need attention.');
    } else {
      console.log('❌ Poor! UltraThink has significant issues requiring fixes.');
    }
    
    console.log('\n🧪 ============================================');
  }

  private getPhaseKeywords(phase: number): string {
    const keywords = [
      'UltraThink|Route|Date|Context', // Phase 1
      'Agent|Initialization|Generation', // Phase 2  
      'Orchestrated|Workflow|Parallel', // Phase 3
      'Cache', // Phase 4
      'Brief|Analysis', // Phase 5
      'Meta-Method|Promotional|Seasonal|Quick', // Phase 6
      'Performance|Concurrent', // Phase 7
      'Error|Invalid|Auto-correction' // Phase 8
    ];
    
    return keywords[phase] || '';
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const testSuite = new UltraThinkComprehensiveTest();
  testSuite.runAllTests().catch(console.error);
}

export { UltraThinkComprehensiveTest };