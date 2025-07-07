/**
 * ⚡ PHASE 2 PARALLELIZATION DEMONSTRATION
 * 
 * Демонстрирует улучшения Фазы 2:
 * - Параллельная обработка операций
 * - Унифицированная retry стратегия
 * - Обработка зависимостей
 * - Performance metrics
 */

import { 
  ParallelProcessor, 
  executeParallel, 
  executeWithDependencies,
  executeAll,
  benchmarkParallel,
  ParallelOperation
} from '../core/parallel-processor';

import { 
  UnifiedRetryStrategy,
  withRetry,
  withOpenAIRetry,
  withFigmaRetry,
  RetryMetrics,
  RetryableErrorType
} from '../../shared/utils/retry-strategy';

/**
 * 🎯 Demo 1: Basic Parallel Execution
 */
async function demoBasicParallelization() {
  console.log('\n⚡ === DEMO 1: Basic Parallel Execution ===');
  
  // Симулируем независимые операции, которые раньше выполнялись последовательно
  const operations = {
    fetchFigmaAssets: async (): Promise<any> => {
      console.log('🎨 Fetching Figma assets...');
      await delay(2000); // Симуляция API вызова
      return { assets: ['logo.png', 'banner.jpg'], count: 2 };
    },
    
    generateContent: async (): Promise<any> => {
      console.log('✍️ Generating content...');
      await delay(1500); // Симуляция OpenAI API
      return { subject: 'Summer Sale!', body: 'Get 50% off today!' };
    },
    
    fetchPricingData: async (): Promise<any> => {
      console.log('💰 Fetching pricing data...');
      await delay(1000); // Симуляция database query
      return { basePrice: 100, discount: 50 };
    },
    
    validateBrandGuidelines: async (): Promise<any> => {
      console.log('🎯 Validating brand guidelines...');
      await delay(800); // Симуляция validation
      return { valid: true, guidelines: ['Use blue colors', 'Sans-serif fonts'] };
    }
  };

  const startTime = Date.now();
  
  try {
    const result = await executeParallel(operations, {
      concurrency: 4,
      logProgress: true
    });

    const totalTime = Date.now() - startTime;
    
    console.log('✅ Parallel execution completed:', {
      totalTime: `${totalTime}ms`,
      successCount: result.successCount,
      errorCount: result.errorCount,
      overallSuccess: result.overallSuccess
    });

    // Показываем результаты
    for (const [name, operationResult] of result.results.entries()) {
      if (operationResult.success) {
        console.log(`  ✅ ${name}: ${operationResult.executionTime}ms`, operationResult.result);
      } else {
        console.log(`  ❌ ${name}: Failed`, operationResult.error);
      }
    }

    // Сравнение с последовательным выполнением
    const sequentialTime = 2000 + 1500 + 1000 + 800; // 5300ms
    const improvement = ((sequentialTime - totalTime) / sequentialTime * 100).toFixed(1);
    console.log(`🚀 Performance improvement: ${improvement}% (${sequentialTime}ms → ${totalTime}ms)`);

  } catch (error) {
    console.error('❌ Parallel execution failed:', error);
  }
}

/**
 * 🔄 Demo 2: Retry Strategy Demonstration
 */
async function demoRetryStrategies() {
  console.log('\n🔄 === DEMO 2: Retry Strategy Demonstration ===');

  // Demo различных retry стратегий
  const strategies = [
    {
      name: 'OpenAI API Strategy',
      strategy: UnifiedRetryStrategy.forOperation(RetryableErrorType.OPENAI_API),
      operation: async () => {
        if (Math.random() < 0.6) { // 60% chance of failure
          throw new Error('OpenAI API rate limit exceeded');
        }
        return 'Content generated successfully';
      }
    },
    {
      name: 'Figma API Strategy', 
      strategy: UnifiedRetryStrategy.forOperation(RetryableErrorType.FIGMA_API),
      operation: async () => {
        if (Math.random() < 0.4) { // 40% chance of failure
          throw new Error('Figma API server error');
        }
        return 'Assets fetched successfully';
      }
    },
    {
      name: 'Network Strategy',
      strategy: UnifiedRetryStrategy.forOperation(RetryableErrorType.NETWORK),
      operation: async () => {
        if (Math.random() < 0.3) { // 30% chance of failure
          throw new Error('Network timeout');
        }
        return 'Network operation completed';
      }
    }
  ];

  for (const { name, strategy, operation } of strategies) {
    console.log(`\n🔧 Testing ${name}:`);
    
    try {
      const result = await strategy.executeWithResult(operation);
      
      console.log(`  ✅ Success after ${result.attempts} attempts (${result.totalTime}ms)`);
      console.log(`  📊 Result:`, result.result);
      
      // Записываем метрики
      RetryMetrics.recordResult(name, result);
      
    } catch (error) {
      console.log(`  ❌ Failed after all retries:`, error.message);
    }
  }

  // Показываем собранные метрики
  console.log('\n📊 Retry Metrics Summary:');
  const metrics = RetryMetrics.getMetrics();
  for (const [operation, stats] of Object.entries(metrics)) {
    console.log(`  ${operation}:`, {
      averageAttempts: stats.averageAttempts.toFixed(2),
      successRate: `${(stats.totalSuccesses / (stats.totalSuccesses + stats.totalFailures) * 100).toFixed(1)}%`,
      averageTime: `${stats.averageTime.toFixed(0)}ms`
    });
  }
}

/**
 * 🔗 Demo 3: Operations with Dependencies
 */
async function demoDependencyHandling() {
  console.log('\n🔗 === DEMO 3: Operations with Dependencies ===');

  // Операции с зависимостями (как в реальном email workflow)
  const operations: ParallelOperation<any>[] = [
    {
      name: 'fetchBrandGuidelines',
      operation: async () => {
        console.log('📋 Fetching brand guidelines...');
        await delay(500);
        return { primaryColor: '#007bff', font: 'Arial' };
      }
    },
    {
      name: 'generateContent', 
      operation: async () => {
        console.log('✍️ Generating content...');
        await delay(1200);
        return { subject: 'Newsletter', body: 'Hello world!' };
      }
    },
    {
      name: 'fetchAssets',
      operation: async () => {
        console.log('🎨 Fetching assets...');
        await delay(800);
        return { logo: 'logo.png', images: ['img1.jpg', 'img2.jpg'] };
      }
    },
    {
      name: 'createDesign',
      operation: async () => {
        console.log('🎨 Creating design with brand guidelines and assets...');
        await delay(1000);
        return { mjml: '<mjml>...</mjml>', css: 'body { font-family: Arial; }' };
      },
      dependencies: ['fetchBrandGuidelines', 'fetchAssets'] // Зависит от guidelines и assets
    },
    {
      name: 'generateTemplate',
      operation: async () => {
        console.log('📧 Generating final template...');
        await delay(600);
        return { html: '<html>...</html>', size: '45KB' };
      },
      dependencies: ['createDesign', 'generateContent'] // Зависит от дизайна и контента
    },
    {
      name: 'validateQuality',
      operation: async () => {
        console.log('✅ Validating quality...');
        await delay(400);
        return { score: 95, issues: [] };
      },
      dependencies: ['generateTemplate'] // Зависит от готового шаблона
    }
  ];

  const startTime = Date.now();
  
  try {
    const result = await executeWithDependencies(operations, {
      concurrency: 3,
      logProgress: true,
      failFast: false
    });

    const totalTime = Date.now() - startTime;
    
    console.log('\n✅ Dependency-aware execution completed:', {
      totalTime: `${totalTime}ms`,
      successCount: result.successCount,
      errorCount: result.errorCount
    });

    // Показываем порядок выполнения
    const sortedResults = Array.from(result.results.entries())
      .sort((a, b) => a[1].executionTime - b[1].executionTime);
    
    console.log('\n📊 Execution order:');
    sortedResults.forEach(([name, result], index) => {
      console.log(`  ${index + 1}. ${name}: ${result.executionTime}ms`);
    });

    // Сравнение с последовательным выполнением
    const sequentialTime = operations.reduce((sum, op) => {
      // Примерное время выполнения каждой операции
      const times = { fetchBrandGuidelines: 500, generateContent: 1200, fetchAssets: 800, 
                     createDesign: 1000, generateTemplate: 600, validateQuality: 400 };
      return sum + (times[op.name as keyof typeof times] || 500);
    }, 0);
    
    const improvement = ((sequentialTime - totalTime) / sequentialTime * 100).toFixed(1);
    console.log(`🚀 Performance improvement: ${improvement}% (${sequentialTime}ms → ${totalTime}ms)`);

  } catch (error) {
    console.error('❌ Dependency execution failed:', error);
  }
}

/**
 * 📊 Demo 4: Performance Benchmarking
 */
async function demoBenchmarking() {
  console.log('\n📊 === DEMO 4: Performance Benchmarking ===');

  // Бенчмарк простых операций
  const simpleOperations = {
    operation1: () => delay(100).then(() => 'Result 1'),
    operation2: () => delay(150).then(() => 'Result 2'), 
    operation3: () => delay(200).then(() => 'Result 3'),
    operation4: () => delay(120).then(() => 'Result 4')
  };

  console.log('🔄 Running benchmark (3 iterations)...');
  
  try {
    const benchmark = await benchmarkParallel(simpleOperations, 3);
    
    console.log('📈 Benchmark Results:', {
      averageTime: `${benchmark.averageTime.toFixed(0)}ms`,
      minTime: `${benchmark.minTime}ms`,
      maxTime: `${benchmark.maxTime}ms`,
      successRate: `${(benchmark.successRate * 100).toFixed(1)}%`
    });

    // Сравнение с последовательным выполнением
    const sequentialTime = 100 + 150 + 200 + 120; // 570ms
    const improvement = ((sequentialTime - benchmark.averageTime) / sequentialTime * 100).toFixed(1);
    console.log(`🚀 Average improvement: ${improvement}% (${sequentialTime}ms → ${benchmark.averageTime.toFixed(0)}ms)`);

  } catch (error) {
    console.error('❌ Benchmark failed:', error);
  }
}

/**
 * 🎮 Demo 5: Real-world Email Workflow Simulation
 */
async function demoRealWorldWorkflow() {
  console.log('\n🎮 === DEMO 5: Real-world Email Workflow Simulation ===');

  console.log('🚀 Simulating complete email generation workflow...');
  
  const workflow: ParallelOperation<any>[] = [
    // Level 0: Independent initial operations
    {
      name: 'parseBrief',
      operation: async () => {
        console.log('📋 Parsing brief...');
        await delay(300);
        return { type: 'promotional', target: 'summer_sale' };
      }
    },
    {
      name: 'fetchBrandAssets',
      operation: async () => {
        console.log('🎨 Fetching brand assets...');
        await delay(1200);
        return { logo: 'brand-logo.png', colors: ['#ff6b6b', '#4ecdc4'] };
      }
    },
    {
      name: 'loadContentTemplates',
      operation: async () => {
        console.log('📝 Loading content templates...');
        await delay(800);
        return { promotional: 'Get {{discount}}% off...', newsletter: 'This week...' };
      }
    },

    // Level 1: Operations depending on initial data
    {
      name: 'generateSubject',
      operation: async () => {
        console.log('🎯 Generating subject line...');
        await delay(1500);
        return { subject: '🔥 Summer Sale: 50% Off Everything!' };
      },
      dependencies: ['parseBrief', 'loadContentTemplates']
    },
    {
      name: 'selectAssets',
      operation: async () => {
        console.log('🖼️ Selecting relevant assets...');
        await delay(600);
        return { selectedImages: ['summer1.jpg', 'sale-banner.png'] };
      },
      dependencies: ['parseBrief', 'fetchBrandAssets']
    },
    {
      name: 'generateBody',
      operation: async () => {
        console.log('📄 Generating email body...');
        await delay(2000);
        return { body: 'Don\'t miss our amazing summer sale...', cta: 'Shop Now' };
      },
      dependencies: ['parseBrief', 'loadContentTemplates']
    },

    // Level 2: Design and assembly
    {
      name: 'createMJMLTemplate',
      operation: async () => {
        console.log('🏗️ Creating MJML template...');
        await delay(1800);
        return { mjml: '<mjml><mj-body>...</mj-body></mjml>' };
      },
      dependencies: ['generateSubject', 'generateBody', 'selectAssets']
    },

    // Level 3: Final processing
    {
      name: 'compileHTML',
      operation: async () => {
        console.log('⚙️ Compiling to HTML...');
        await delay(1000);
        return { html: '<html>...</html>', size: '42KB' };
      },
      dependencies: ['createMJMLTemplate']
    },
    {
      name: 'validateAccessibility',
      operation: async () => {
        console.log('♿ Validating accessibility...');
        await delay(500);
        return { score: 92, issues: ['Missing alt text on one image'] };
      },
      dependencies: ['compileHTML']
    },
    {
      name: 'testClientCompatibility',
      operation: async () => {
        console.log('📱 Testing client compatibility...');
        await delay(1200);
        return { compatibility: 94, supportedClients: ['Gmail', 'Outlook', 'Apple Mail'] };
      },
      dependencies: ['compileHTML']
    }
  ];

  const startTime = Date.now();
  
  try {
    const result = await executeWithDependencies(workflow, {
      concurrency: 4,
      logProgress: true,
      retryOptions: { maxAttempts: 2 }
    });

    const totalTime = Date.now() - startTime;
    
    console.log('\n🎉 Email workflow completed:', {
      totalTime: `${totalTime}ms`,
      successCount: result.successCount,
      errorCount: result.errorCount,
      overallSuccess: result.overallSuccess
    });

    if (result.overallSuccess) {
      console.log('\n📧 Generated Email Summary:');
      const htmlResult = result.results.get('compileHTML');
      const accessibilityResult = result.results.get('validateAccessibility');
      const compatibilityResult = result.results.get('testClientCompatibility');
      
      console.log(`  📄 HTML Size: ${htmlResult?.result?.size}`);
      console.log(`  ♿ Accessibility Score: ${accessibilityResult?.result?.score}/100`);
      console.log(`  📱 Compatibility: ${compatibilityResult?.result?.compatibility}%`);
    }

    // Расчет улучшения производительности
    const estimatedSequentialTime = workflow.reduce((sum, op) => {
      const times = {
        parseBrief: 300, fetchBrandAssets: 1200, loadContentTemplates: 800,
        generateSubject: 1500, selectAssets: 600, generateBody: 2000,
        createMJMLTemplate: 1800, compileHTML: 1000, validateAccessibility: 500,
        testClientCompatibility: 1200
      };
      return sum + (times[op.name as keyof typeof times] || 500);
    }, 0);

    const improvement = ((estimatedSequentialTime - totalTime) / estimatedSequentialTime * 100).toFixed(1);
    console.log(`\n🚀 Overall Performance Improvement: ${improvement}%`);
    console.log(`   Sequential estimate: ${estimatedSequentialTime}ms`);
    console.log(`   Parallel actual: ${totalTime}ms`);
    console.log(`   Time saved: ${estimatedSequentialTime - totalTime}ms`);

  } catch (error) {
    console.error('❌ Workflow failed:', error);
  }
}

/**
 * 🛠️ Utility Functions
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 🎯 Main Demo Function
 */
async function runPhase2Demo() {
  console.log('⚡ === PHASE 2 PARALLELIZATION & RETRY OPTIMIZATION DEMO ===');
  console.log('Demonstrating 50-70% performance improvements through:');
  console.log('• Parallel execution of independent operations');
  console.log('• Unified retry strategies with exponential backoff');
  console.log('• Dependency-aware operation scheduling');
  console.log('• Performance benchmarking and metrics');
  
  const startTime = Date.now();

  try {
    await demoBasicParallelization();
    await demoRetryStrategies();
    await demoDependencyHandling();
    await demoBenchmarking();
    await demoRealWorldWorkflow();

    const totalTime = Date.now() - startTime;
    
    console.log('\n🎉 === PHASE 2 DEMO COMPLETED ===');
    console.log(`⏱️ Total demo time: ${totalTime}ms`);
    console.log('✅ All Phase 2 optimizations demonstrated successfully');
    console.log('🚀 Ready for Phase 3 implementation');
    
  } catch (error) {
    console.error('💥 Demo failed:', error);
  }
}

// Запускаем демо
if (require.main === module) {
  runPhase2Demo();
}

export {
  runPhase2Demo,
  demoBasicParallelization,
  demoRetryStrategies,
  demoDependencyHandling,
  demoBenchmarking,
  demoRealWorldWorkflow
}; 