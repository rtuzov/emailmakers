/**
 * Example of how to use the UltraThink DI Container
 * Demonstrates integration patterns and best practices
 */

import { 
  configureUltraThinkDI, 
  createUltraThinkEngine, 
  getUltraThinkServiceSummary 
} from './service-factory';
import { getContainer, DependencyContainer } from './di-container';
import { SERVICE_TOKENS, IUltraThinkEngine, IQualityController, ILogger } from './interfaces';
import { EmailGenerationRequest } from './types';

/**
 * Example 1: Basic DI Usage
 */
export async function basicDIExample(): Promise<void> {
  console.log('📦 Example 1: Basic DI Usage');
  
  // Configure the DI container
  configureUltraThinkDI();
  
  // Get services from container
  const container = getContainer();
  const engine = container.resolve<IUltraThinkEngine>(SERVICE_TOKENS.UltraThinkEngine);
  const qualityController = container.resolve<IQualityController>(SERVICE_TOKENS.QualityController);
  const logger = container.resolve<ILogger>(SERVICE_TOKENS.Logger);
  
  logger.log('info', 'DI container configured and services resolved');
  
  // Use the services
  const request: EmailGenerationRequest = {
    topic: 'Basic UltraThink integration example',
    origin: 'MOW',
    destination: 'LED', 
    departure_date: '2025-02-01',
    campaign_type: 'promotional'
  };
  
  const enhancement = await engine.enhanceRequest(request);
  logger.log('info', 'Request enhanced using DI services', { enhancement });
  
  console.log('✅ Basic DI example completed');
}

/**
 * Example 2: Custom Configuration with DI
 */
export function customConfigurationExample(): void {
  console.log('📦 Example 2: Custom Configuration with DI');
  
  // Create a custom container
  const customContainer = new DependencyContainer();
  
  // Configure with custom settings
  configureUltraThinkDI(customContainer);
  
  // Override a service with custom implementation
  customContainer.register(SERVICE_TOKENS.Logger, () => ({
    log: (level: string, message: string, context?: any) => {
      console.log(`[CUSTOM ${level.toUpperCase()}] ${message}`, context || '');
    },
    logSecure: (level: string, message: string, context?: any) => {
      console.log(`[SECURE ${level.toUpperCase()}] ${message}`);
    },
    sanitizeForLogging: (data: any) => ({ sanitized: true, ...data })
  }));
  
  // Use the custom logger
  const customLogger = customContainer.resolve<ILogger>(SERVICE_TOKENS.Logger);
  customLogger.log('info', 'Using custom logger implementation');
  
  console.log('✅ Custom configuration example completed');
}

/**
 * Example 3: Testing with DI (Mock Services)
 */
export function testingWithDIExample(): void {
  console.log('📦 Example 3: Testing with DI (Mock Services)');
  
  // Create a test container
  const testContainer = new DependencyContainer();
  
  // Register mock services for testing
  testContainer.register(SERVICE_TOKENS.DataProvider, () => ({
    isHoliday: () => true, // Mock: always return holiday
    getSeasonalContext: () => ({ season: 'test', priceFactor: 1.0, months: [1], description: 'Test season' }),
    getRoutePopularity: () => 10, // Mock: always high popularity
    isWeekend: () => false,
    isSchoolHoliday: () => ({ isHoliday: false }),
    getTravelAdvisory: () => ({ level: 'green', description: 'Test advisory' }),
    convertCurrency: (amount: number) => amount * 2, // Mock: simple conversion
    getPriceMultiplier: () => ({ multiplier: 1.5, factors: ['test'] }),
    getYearlyHolidays: () => ['2025-01-01', '2025-12-25'],
    getBookingRecommendations: () => ({ recommendation: 'Test recommendation', urgency: 'low' }),
    getDestinationTips: () => ['Test tip 1', 'Test tip 2']
  }));
  
  testContainer.register(SERVICE_TOKENS.Logger, () => ({
    log: (level: string, message: string) => {
      console.log(`[TEST ${level.toUpperCase()}] ${message}`);
    },
    logSecure: (level: string, message: string) => {
      console.log(`[TEST SECURE ${level.toUpperCase()}] ${message}`);
    },
    sanitizeForLogging: (data: any) => data
  }));
  
  // Use mock services
  const mockDataProvider = testContainer.resolve(SERVICE_TOKENS.DataProvider);
  const mockLogger = testContainer.resolve<ILogger>(SERVICE_TOKENS.Logger);
  
  mockLogger.log('info', 'Testing with mock services');
  console.log('Mock holiday check:', (mockDataProvider as any).isHoliday('2025-01-01', 'US'));
  console.log('Mock route popularity:', (mockDataProvider as any).getRoutePopularity('NYC', 'LAX'));
  
  console.log('✅ Testing with DI example completed');
}

/**
 * Example 4: Performance Monitoring with DI
 */
export function performanceMonitoringExample(): void {
  console.log('📦 Example 4: Performance Monitoring with DI');
  
  const container = getContainer();
  configureUltraThinkDI(container);
  
  // Create a performance-aware logger wrapper
  const originalLogger = container.resolve<ILogger>(SERVICE_TOKENS.Logger);
  
  const performanceLogger = {
    ...originalLogger,
    log: (level: string, message: string, context?: any) => {
      const timestamp = new Date().toISOString();
      const enhancedContext = {
        ...context,
        timestamp,
        performance: {
          memory: process.memoryUsage(),
          uptime: process.uptime()
        }
      };
      originalLogger.log(level as 'info' | 'warn' | 'error' | 'debug', message, enhancedContext);
    }
  };
  
  // Override the logger with performance monitoring
  container.register(SERVICE_TOKENS.Logger, () => performanceLogger);
  
  const logger = container.resolve<ILogger>(SERVICE_TOKENS.Logger);
  logger.log('info', 'Performance monitoring enabled');
  
  console.log('✅ Performance monitoring example completed');
}

/**
 * Example 5: Service Summary and Debugging
 */
export function debuggingExample(): void {
  console.log('📦 Example 5: Service Summary and Debugging');
  
  configureUltraThinkDI();
  
  // Get service summary for debugging
  const summary = getUltraThinkServiceSummary();
  console.log('📊 Service Registry Summary:', {
    totalServices: summary.totalServices,
    singletons: summary.singletons,
    transients: summary.transients,
    instantiated: summary.instantiated
  });
  
  // List all registered services
  const container = getContainer();
  console.log('📋 Registered Services:', container.getRegisteredTokens());
  
  // Check specific service configurations
  console.log('🔍 Service Details:');
  const serviceInfo = container.getServiceInfo();
  serviceInfo.forEach(service => {
    console.log(`  ${service.token}: ${service.isSingleton ? 'Singleton' : 'Transient'} ${service.isInstantiated ? '(Instantiated)' : '(Not Instantiated)'}`);
  });
  
  console.log('✅ Debugging example completed');
}

/**
 * Example 6: Factory Pattern with DI
 */
export async function factoryPatternExample(): Promise<void> {
  console.log('📦 Example 6: Factory Pattern with DI');
  
  // Use the factory to create a pre-configured engine
  const engine = createUltraThinkEngine({
    enableValidation: true,
    enableContextEnrichment: true,
    enableSmartSequencing: true,
    enableQualityControl: true
  });
  
  console.log('🏭 Created UltraThink engine via factory');
  
  // Use the engine
  const request: EmailGenerationRequest = {
    topic: 'Factory pattern email generation',
    origin: 'MOW',
    destination: 'LED',
    departure_date: '2025-02-01',
    campaign_type: 'promotional'
  };
  
  try {
    const enhancement = await engine.enhanceRequest(request);
    console.log('✅ Request enhanced via factory-created engine');
  } catch (error) {
    console.log('⚠️ Enhancement skipped (expected in test environment)');
  }
  
  console.log('✅ Factory pattern example completed');
}

/**
 * Run all examples
 */
export async function runAllDIExamples(): Promise<void> {
  console.log('🚀 Running UltraThink DI Integration Examples...\n');
  
  try {
    await basicDIExample();
    console.log('');
    
    customConfigurationExample();
    console.log('');
    
    testingWithDIExample();
    console.log('');
    
    performanceMonitoringExample();
    console.log('');
    
    debuggingExample();
    console.log('');
    
    await factoryPatternExample();
    console.log('');
    
    console.log('🎉 All DI integration examples completed successfully!');
  } catch (error) {
    console.error('❌ Error running DI examples:', error);
  }
}

// Note: runAllDIExamples is already exported above as a named export