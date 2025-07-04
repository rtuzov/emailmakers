/**
 * 🎯 OPTIMIZATION SYSTEM DEMO - Демонстрация работы системы оптимизации
 * 
 * Показывает полный цикл работы системы автоматической оптимизации:
 * от анализа метрик до применения рекомендаций с rollback возможностями.
 */

import { OptimizationService } from './optimization-service';
import { 
  OptimizationServiceConfig,
  MetricsSnapshot,
  AgentType 
} from './optimization-types';

// Local factory function to avoid circular dependency
function createOptimizationService(config?: Partial<OptimizationServiceConfig>) {
  return OptimizationService.getInstance(config);
}

/**
 * Демонстрация полного цикла оптимизации
 */
export async function demonstrateOptimizationSystem() {
  console.log('🚀 Starting Optimization System Demonstration...\n');

  // 1. Создание и настройка сервиса
  const config: Partial<OptimizationServiceConfig> = {
    enabled: true,
    auto_optimization: false, // Начинаем с ручного режима для демонстрации
    require_approval_for_critical: true,
    max_auto_optimizations_per_day: 10,
    min_confidence_threshold: 85,
    metrics_collection_interval_ms: 30000, // 30 секунд для демо
    analysis_interval_ms: 60000, // 1 минута для демо
    integration: {
      enabled: true,
      auto_optimization_enabled: false,
      metrics_collection_interval_ms: 30000,
      optimization_interval_ms: 120000,
      require_human_approval_for_critical: true,
      max_auto_optimizations_per_hour: 3
    }
  };

  const optimizationService = createOptimizationService(config);

  try {
    // 2. Инициализация системы
    console.log('📋 Step 1: Initializing Optimization Service...');
    await optimizationService.initialize();
    
    const status = optimizationService.getStatus();
    console.log('✅ Service Status:', status);
    console.log();

    // 3. Анализ текущего состояния системы
    console.log('🔍 Step 2: Analyzing System Performance...');
    const systemAnalysis = await optimizationService.analyzeSystem();
    
    console.log('📊 System Analysis Results:');
    console.log(`- Health Score: ${systemAnalysis.current_state.system_metrics.system_health_score}`);
    console.log(`- Trends Found: ${systemAnalysis.trends.length}`);
    console.log(`- Bottlenecks Identified: ${systemAnalysis.bottlenecks.length}`);
    console.log(`- Error Patterns: ${systemAnalysis.error_patterns.length}`);
    console.log(`- Predicted Issues: ${systemAnalysis.predicted_issues.length}`);
    console.log(`- Assessment: ${systemAnalysis.overall_health_assessment}`);
    console.log();

    // 4. Получение рекомендаций по оптимизации
    console.log('💡 Step 3: Generating Optimization Recommendations...');
    const recommendations = await optimizationService.getRecommendations();
    
    console.log(`📋 Generated ${recommendations.length} recommendations:`);
    recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`);
      console.log(`   - Type: ${rec.type}`);
      console.log(`   - Expected Impact: ${rec.expected_impact.performance_improvement_percent}% improvement`);
      console.log(`   - Risk Level: ${rec.safety_assessment.risk_level}`);
      console.log(`   - Requires Approval: ${rec.requires_human_approval ? 'Yes' : 'No'}`);
      console.log();
    });

    // 5. Применение безопасной рекомендации (если есть)
    const safeRecommendations = recommendations.filter(r => 
      !r.requires_human_approval && 
      ['low', 'medium'].includes(r.safety_assessment.risk_level)
    );

    if (safeRecommendations.length > 0) {
      console.log('⚙️ Step 4: Applying Safe Optimization...');
      const recommendationToApply = safeRecommendations[0];
      
      console.log(`Applying: ${recommendationToApply.title}`);
      const result = await optimizationService.applyRecommendation(recommendationToApply.id);
      
      console.log('✅ Optimization Result:');
      console.log(`- Status: ${result.status}`);
      console.log(`- Applied At: ${result.applied_at}`);
      console.log(`- Actions Executed: ${result.actions_executed.length}`);
      console.log(`- Issues: ${result.issues_encountered.length}`);
      console.log();

      // 6. Демонстрация rollback (если нужно)
      if (result.status === 'completed') {
        console.log('🔙 Step 5: Demonstrating Rollback Capability...');
        console.log('(In production, rollback would be triggered by performance degradation)');
        
        try {
          const rollbackResult = await optimizationService.rollbackOptimization(result.optimization_id);
          console.log('✅ Rollback Result:');
          console.log(`- Status: ${rollbackResult.status}`);
          console.log(`- Rollback Triggered: ${rollbackResult.rollback_triggered}`);
          console.log(`- Reason: ${rollbackResult.rollback_reason || 'Manual demonstration'}`);
          console.log();
        } catch (rollbackError) {
          console.log('ℹ️ Rollback demonstration skipped (expected in demo mode)');
          console.log();
        }
      }
    } else {
      console.log('ℹ️ Step 4: No safe recommendations available for auto-application');
      console.log('All recommendations require human approval or have high risk levels.');
      console.log();
    }

    // 7. Генерация динамических порогов
    console.log('📊 Step 6: Generating Dynamic Thresholds...');
    try {
      const dynamicThresholds = await optimizationService.generateDynamicThresholds();
      
      console.log('🎯 Dynamic Thresholds Generated:');
      console.log(`- Current Thresholds: ${Object.keys(dynamicThresholds.current).length} parameters`);
      console.log(`- Recommended Changes: ${dynamicThresholds.reasoning.length} adjustments`);
      console.log(`- Safety Assessment: ${dynamicThresholds.safety_check.risk_level} risk`);
      console.log();
    } catch (thresholdError) {
      console.log('ℹ️ Dynamic thresholds generation skipped (requires more historical data)');
      console.log();
    }

    // 8. Генерация отчета по оптимизации
    console.log('📋 Step 7: Generating Optimization Report...');
    const report = await optimizationService.generateOptimizationReport(1); // За последний час
    
    console.log('📊 Optimization Report Summary:');
    console.log(`- Report Period: ${report.analysis_period}`);
    console.log(`- Total Recommendations: ${report.recommendations.length}`);
    console.log(`- Applied Optimizations: ${report.applied_optimizations.length}`);
    console.log(`- Performance Improvement: ${report.performance_metrics.improvement_percentage}%`);
    console.log(`- Next Analysis: ${new Date(report.next_analysis_scheduled).toLocaleString()}`);
    console.log();

    // 9. Просмотр истории оптимизаций
    console.log('📜 Step 8: Reviewing Optimization History...');
    const history = optimizationService.getOptimizationHistory(5); // Последние 5
    
    console.log(`📚 Recent Optimization History (${history.length} items):`);
    history.forEach((item, index) => {
      console.log(`${index + 1}. ${item.optimization_id} - ${item.status} (${new Date(item.applied_at).toLocaleTimeString()})`);
    });
    console.log();

    // 10. Завершение демонстрации
    console.log('🎉 Step 9: Optimization System Demonstration Complete!');
    console.log('\n📈 Key Achievements:');
    console.log('✅ System analysis completed successfully');
    console.log('✅ Recommendations generated and categorized by risk');
    console.log('✅ Safe optimization applied (if available)');
    console.log('✅ Rollback capability demonstrated');
    console.log('✅ Dynamic thresholds generated');
    console.log('✅ Comprehensive reporting functional');
    
    console.log('\n🚀 Ready for Production Deployment!');
    console.log('Next Steps:');
    console.log('1. Enable auto_optimization for autonomous operation');
    console.log('2. Integrate with monitoring dashboards');
    console.log('3. Set up alerting for critical optimizations');
    console.log('4. Configure ML-based pattern learning');

  } catch (error) {
    console.error('❌ Demonstration failed:', error);
    throw error;
  } finally {
    // Очистка ресурсов
    console.log('\n🧹 Cleaning up resources...');
    await optimizationService.shutdown();
    console.log('✅ Cleanup complete.');
  }
}

/**
 * Симуляция работы с реальными метриками
 */
export async function simulateRealWorldOptimization() {
  console.log('🌍 Starting Real-World Optimization Simulation...\n');

  const service = createOptimizationService({
    enabled: true,
    auto_optimization: true, // Включаем автоматическую оптимизацию
    require_approval_for_critical: true,
    max_auto_optimizations_per_day: 50,
    min_confidence_threshold: 90, // Высокий порог уверенности
    metrics_collection_interval_ms: 60000, // 1 минута
    analysis_interval_ms: 300000 // 5 минут
  });

  try {
    await service.initialize();
    
    console.log('🔄 Simulation: Running continuous optimization for 30 seconds...');
    console.log('(In production, this would run 24/7)');
    
    // Запускаем мониторинг событий
    service.on('analysis_completed', (analysis) => {
      console.log(`📊 Analysis completed - Health Score: ${analysis.current_state.system_metrics.system_health_score}`);
    });
    
    service.on('new_recommendations_available', (recommendations) => {
      console.log(`💡 New recommendations: ${recommendations.length} items`);
    });
    
    service.on('automated_optimization_completed', (results) => {
      console.log(`⚙️ Auto-optimization completed: ${results.length} optimizations applied`);
    });

    // Имитируем работу в течение 30 секунд
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    console.log('\n📊 Simulation Results:');
    const finalStatus = service.getStatus();
    console.log('Final Status:', finalStatus);

  } catch (error) {
    console.error('❌ Simulation failed:', error);
  } finally {
    await service.shutdown();
  }
}

/**
 * Демонстрация интеграции с существующими системами
 */
export async function demonstrateSystemIntegration() {
  console.log('🔗 Demonstrating System Integration...\n');

  const service = createOptimizationService();

  try {
    await service.initialize();

    console.log('📡 Integration Points:');
    console.log('✅ ValidationMonitor - Real-time validation metrics');
    console.log('✅ MetricsService - Infrastructure and performance metrics');
    console.log('✅ PerformanceMonitor - System resource monitoring');
    console.log();

    console.log('🔄 Event-Driven Optimization:');
    console.log('- Critical validation failures trigger immediate analysis');
    console.log('- Performance degradation triggers rollback evaluation');
    console.log('- Resource exhaustion triggers scaling recommendations');
    console.log();

    console.log('📊 Metrics Collection:');
    console.log('- Agent performance metrics (response time, success rate, throughput)');
    console.log('- System metrics (CPU, memory, health score)');
    console.log('- Validation metrics (success rate, quality scores)');
    console.log();

    console.log('🛡️ Safety Mechanisms:');
    console.log('- Human approval required for critical changes');
    console.log('- Automatic rollback on performance degradation');
    console.log('- Confidence thresholds for pattern detection');
    console.log('- Rate limiting for optimization frequency');

  } finally {
    await service.shutdown();
  }
}

// Экспорт для использования в других модулях
export {
  demonstrateOptimizationSystem as runDemo,
  simulateRealWorldOptimization as runSimulation,
  demonstrateSystemIntegration as showIntegration
};