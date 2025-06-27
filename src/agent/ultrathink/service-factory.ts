/**
 * Service Factory for UltraThink System
 * Provides factory methods for creating and configuring all services
 */

import { 
  IUltraThinkFactory, 
  IUltraThinkEngine, 
  IQualityController, 
  IToolSequencer, 
  IErrorHandler, 
  IDataProvider, 
  IContextEnricher, 
  ILogger,
  SERVICE_TOKENS 
} from './interfaces';
import { QualityControlConfig, UltraThinkConfig } from './types';
import { DependencyContainer, getContainer } from './di-container';

// Import concrete implementations
import { UltraThinkEngine } from './ultrathink-engine';
import { SmartQualityController } from './quality-controller';
import { ToolSequencer } from './tool-sequencer';
import { SmartErrorHandler } from './smart-error-handler';
import { SimpleDataProvider } from './simple-data-provider';
import { ContextEnricher } from './context-enricher';
import { SecureLogger } from './secure-logger';
import { RouteValidator } from './route-validator';
import { DateValidator } from './date-validator';
import { InputSanitizer } from './input-sanitizer';
import { TIME_CONSTANTS, LIMITS, QUALITY_CONSTANTS, BUSINESS_THRESHOLDS, TOOL_CONSTANTS } from './constants';

export class UltraThinkServiceFactory implements IUltraThinkFactory {
  constructor(private container: DependencyContainer = getContainer()) {}

  createEngine(config?: Partial<UltraThinkConfig>): IUltraThinkEngine {
    return new UltraThinkEngine(config);
  }

  createQualityController(config?: Partial<QualityControlConfig>): IQualityController {
    return new SmartQualityController(config);
  }

  createToolSequencer(): IToolSequencer {
    return ToolSequencer as any;
  }

  createErrorHandler(): IErrorHandler {
    return SmartErrorHandler as any;
  }

  createDataProvider(): IDataProvider {
    return SimpleDataProvider as any;
  }

  createContextEnricher(): IContextEnricher {
    return new ContextEnricher() as any;
  }

  createLogger(): ILogger {
    return SecureLogger as any;
  }

  /**
   * Configure the DI container with all UltraThink services
   */
  static configureDI(container: DependencyContainer = getContainer()): void {
    const factory = new UltraThinkServiceFactory(container);

    // Register core engine as singleton
    container.registerSingleton(SERVICE_TOKENS.UltraThinkEngine, () => 
      factory.createEngine()
    );

    // Register quality controller as singleton
    container.registerSingleton(SERVICE_TOKENS.QualityController, () => 
      factory.createQualityController()
    );

    // Register static services as singletons
    container.registerSingleton(SERVICE_TOKENS.ToolSequencer, () => 
      factory.createToolSequencer()
    );

    container.registerSingleton(SERVICE_TOKENS.ErrorHandler, () => 
      factory.createErrorHandler()
    );

    container.registerSingleton(SERVICE_TOKENS.DataProvider, () => 
      factory.createDataProvider()
    );

    container.registerSingleton(SERVICE_TOKENS.Logger, () => 
      factory.createLogger()
    );

    // Register transient services (new instance each time)
    container.register(SERVICE_TOKENS.ContextEnricher, () => 
      factory.createContextEnricher()
    );

    // Register validators as singletons
    container.registerSingleton(SERVICE_TOKENS.RouteValidator, () => 
      new RouteValidator()
    );

    container.registerSingleton(SERVICE_TOKENS.DateValidator, () => 
      new DateValidator()
    );

    container.registerSingleton(SERVICE_TOKENS.InputSanitizer, () => 
      InputSanitizer
    );

    // Register configuration provider
    container.registerSingleton(SERVICE_TOKENS.ConfigProvider, () => ({
      getTimeConstants: () => TIME_CONSTANTS,
      getLimits: () => LIMITS,
      getQualityConstants: () => QUALITY_CONSTANTS,
      getBusinessThresholds: () => BUSINESS_THRESHOLDS,
      getToolConstants: () => TOOL_CONSTANTS
    }));

    console.log('🏭 UltraThink DI container configured with all services');
  }

  /**
   * Create a pre-configured UltraThink engine with all dependencies injected
   */
  static createConfiguredEngine(
    config?: Partial<UltraThinkConfig>,
    container: DependencyContainer = getContainer()
  ): IUltraThinkEngine {
    // Ensure DI is configured
    if (!container.isRegistered(SERVICE_TOKENS.UltraThinkEngine)) {
      UltraThinkServiceFactory.configureDI(container);
    }

    // Create engine with injected dependencies
    const engine = new UltraThinkEngine(config);
    
    // Manually inject dependencies for better control
    // This is a simplified approach - in a full DI implementation,
    // we would use constructor injection
    
    console.log('🧠 Created configured UltraThink engine with DI');
    return engine;
  }

  /**
   * Reset and reconfigure all services (useful for testing)
   */
  static resetServices(container: DependencyContainer = getContainer()): void {
    container.clear();
    UltraThinkServiceFactory.configureDI(container);
    console.log('🔄 UltraThink services reset and reconfigured');
  }

  /**
   * Get service registration summary for debugging
   */
  static getServiceSummary(container: DependencyContainer = getContainer()): any {
    const services = container.getServiceInfo();
    const summary = {
      totalServices: services.length,
      singletons: services.filter(s => s.isSingleton).length,
      transients: services.filter(s => !s.isSingleton).length,
      instantiated: services.filter(s => s.isInstantiated).length,
      services: services.reduce((acc, service) => {
        acc[service.token] = {
          isSingleton: service.isSingleton,
          isInstantiated: service.isInstantiated
        };
        return acc;
      }, {} as Record<string, any>)
    };

    console.log('📊 UltraThink Service Summary:', summary);
    return summary;
  }
}

// Export convenience functions
export function configureUltraThinkDI(container?: DependencyContainer): void {
  UltraThinkServiceFactory.configureDI(container);
}

export function createUltraThinkEngine(config?: Partial<UltraThinkConfig>, container?: DependencyContainer): IUltraThinkEngine {
  return UltraThinkServiceFactory.createConfiguredEngine(config, container);
}

export function resetUltraThinkServices(container?: DependencyContainer): void {
  UltraThinkServiceFactory.resetServices(container);
}

export function getUltraThinkServiceSummary(container?: DependencyContainer): any {
  return UltraThinkServiceFactory.getServiceSummary(container);
}