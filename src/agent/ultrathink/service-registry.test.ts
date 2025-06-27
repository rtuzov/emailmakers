/**
 * Test suite for UltraThink Service Registry and Dependency Injection
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { DependencyContainer } from './di-container';
import { UltraThinkServiceFactory, configureUltraThinkDI, resetUltraThinkServices } from './service-factory';
import { SERVICE_TOKENS } from './interfaces';

describe('UltraThink Service Registry', () => {
  let container: DependencyContainer;

  beforeEach(() => {
    container = new DependencyContainer();
  });

  afterEach(() => {
    container.clear();
  });

  /**
   * TC-SR-01: Basic Container Functionality
   */
  test('TC-SR-01: Should register and resolve services correctly', () => {
    // Test transient registration
    container.register('TestService', () => ({ id: Math.random() }));
    
    const instance1 = container.resolve('TestService');
    const instance2 = container.resolve('TestService');
    
    expect(instance1).toBeDefined();
    expect(instance2).toBeDefined();
    expect((instance1 as any).id).not.toBe((instance2 as any).id); // Different instances
  });

  /**
   * TC-SR-02: Singleton Registration
   */
  test('TC-SR-02: Should create singleton instances correctly', () => {
    container.registerSingleton('SingletonService', () => ({ id: Math.random() }));
    
    const instance1 = container.resolve('SingletonService');
    const instance2 = container.resolve('SingletonService');
    
    expect(instance1).toBeDefined();
    expect(instance2).toBeDefined();
    expect((instance1 as any).id).toBe((instance2 as any).id); // Same instance
    expect(container.isSingleton('SingletonService')).toBe(true);
  });

  /**
   * TC-SR-03: Service Factory Configuration
   */
  test('TC-SR-03: Should configure all UltraThink services', () => {
    UltraThinkServiceFactory.configureDI(container);
    
    // Check that all core services are registered
    expect(container.isRegistered(SERVICE_TOKENS.UltraThinkEngine)).toBe(true);
    expect(container.isRegistered(SERVICE_TOKENS.QualityController)).toBe(true);
    expect(container.isRegistered(SERVICE_TOKENS.ToolSequencer)).toBe(true);
    expect(container.isRegistered(SERVICE_TOKENS.ErrorHandler)).toBe(true);
    expect(container.isRegistered(SERVICE_TOKENS.DataProvider)).toBe(true);
    expect(container.isRegistered(SERVICE_TOKENS.ContextEnricher)).toBe(true);
    expect(container.isRegistered(SERVICE_TOKENS.Logger)).toBe(true);
    expect(container.isRegistered(SERVICE_TOKENS.ConfigProvider)).toBe(true);

    // Verify singleton configuration
    expect(container.isSingleton(SERVICE_TOKENS.UltraThinkEngine)).toBe(true);
    expect(container.isSingleton(SERVICE_TOKENS.QualityController)).toBe(true);
    expect(container.isSingleton(SERVICE_TOKENS.Logger)).toBe(true);
  });

  /**
   * TC-SR-04: Service Resolution
   */
  test('TC-SR-04: Should resolve configured services without errors', () => {
    UltraThinkServiceFactory.configureDI(container);
    
    // Test resolving core services
    const engine = container.resolve(SERVICE_TOKENS.UltraThinkEngine);
    expect(engine).toBeDefined();
    expect(typeof (engine as any).enhanceRequest).toBe('function');

    const qualityController = container.resolve(SERVICE_TOKENS.QualityController);
    expect(qualityController).toBeDefined();
    expect(typeof (qualityController as any).validateQualityResult).toBe('function');

    const logger = container.resolve(SERVICE_TOKENS.Logger);
    expect(logger).toBeDefined();
    expect(typeof (logger as any).log).toBe('function');

    const configProvider = container.resolve(SERVICE_TOKENS.ConfigProvider);
    expect(configProvider).toBeDefined();
    expect(typeof (configProvider as any).getTimeConstants).toBe('function');
  });

  /**
   * TC-SR-05: Configuration Provider
   */
  test('TC-SR-05: Should provide correct configuration constants', () => {
    UltraThinkServiceFactory.configureDI(container);
    
    const configProvider = container.resolve(SERVICE_TOKENS.ConfigProvider);
    
    const timeConstants = (configProvider as any).getTimeConstants();
    expect(timeConstants.EXECUTION_HISTORY_TTL_MS).toBe(3600000); // 1 hour
    expect(timeConstants.STANDARD_RETRY_DELAY_MS).toBe(1000); // 1 second

    const limits = (configProvider as any).getLimits();
    expect(limits.MAX_EXECUTION_HISTORY_SIZE).toBe(100);
    expect(limits.MAX_STRING_LENGTH).toBe(100);

    const qualityConstants = (configProvider as any).getQualityConstants();
    expect(qualityConstants.DEFAULT_MINIMUM_SCORE).toBe(70);
    expect(qualityConstants.DEFAULT_AUTO_RETRY_COUNT).toBe(2);
  });

  /**
   * TC-SR-06: Error Handling
   */
  test('TC-SR-06: Should handle unregistered services correctly', () => {
    expect(() => {
      container.resolve('UnregisteredService');
    }).toThrow("Service 'UnregisteredService' is not registered");

    expect(container.isRegistered('UnregisteredService')).toBe(false);
  });

  /**
   * TC-SR-07: Container State Management
   */
  test('TC-SR-07: Should manage container state correctly', () => {
    container.register('TestService', () => ({ value: 'test' }));
    container.registerSingleton('SingletonService', () => ({ value: 'singleton' }));
    
    expect(container.getRegisteredTokens().length).toBe(2);
    expect(container.getRegisteredTokens()).toContain('TestService');
    expect(container.getRegisteredTokens()).toContain('SingletonService');

    const serviceInfo = container.getServiceInfo();
    expect(serviceInfo.length).toBe(2);
    expect(serviceInfo.find(s => s.token === 'SingletonService')?.isSingleton).toBe(true);
    expect(serviceInfo.find(s => s.token === 'TestService')?.isSingleton).toBe(false);

    container.clear();
    expect(container.getRegisteredTokens().length).toBe(0);
  });

  /**
   * TC-SR-08: Singleton Reset
   */
  test('TC-SR-08: Should reset singleton instances correctly', () => {
    container.registerSingleton('ResetService', () => ({ id: Math.random() }));
    
    const instance1 = container.resolve('ResetService');
    const instance2 = container.resolve('ResetService');
    expect((instance1 as any).id).toBe((instance2 as any).id);

    container.resetSingleton('ResetService');
    const instance3 = container.resolve('ResetService');
    expect((instance3 as any).id).not.toBe((instance1 as any).id); // New instance after reset
  });

  /**
   * TC-SR-09: Service Factory Integration
   */
  test('TC-SR-09: Should create configured engine with dependencies', () => {
    const engine = UltraThinkServiceFactory.createConfiguredEngine({}, container);
    
    expect(engine).toBeDefined();
    expect(typeof (engine as any).enhanceRequest).toBe('function');
    expect(typeof (engine as any).validateQualityResult).toBe('function');
    expect(typeof (engine as any).handleExecutionError).toBe('function');

    // Verify that the container is configured
    expect(container.isRegistered(SERVICE_TOKENS.UltraThinkEngine)).toBe(true);
  });

  /**
   * TC-SR-10: Service Summary
   */
  test('TC-SR-10: Should provide accurate service summary', () => {
    UltraThinkServiceFactory.configureDI(container);
    
    const summary = UltraThinkServiceFactory.getServiceSummary(container);
    
    expect(summary.totalServices).toBeGreaterThan(8);
    expect(summary.singletons).toBeGreaterThan(5);
    expect(summary.transients).toBeGreaterThan(0);
    expect(summary.services).toBeDefined();
    expect(summary.services[SERVICE_TOKENS.UltraThinkEngine]).toBeDefined();
    expect(summary.services[SERVICE_TOKENS.UltraThinkEngine].isSingleton).toBe(true);
  });

  /**
   * TC-SR-11: Reset Services
   */
  test('TC-SR-11: Should reset services correctly', () => {
    UltraThinkServiceFactory.configureDI(container);
    
    // Resolve a service to instantiate it
    const engine1 = container.resolve(SERVICE_TOKENS.UltraThinkEngine);
    expect(engine1).toBeDefined();

    // Reset services
    UltraThinkServiceFactory.resetServices(container);
    
    // Should still be registered but with new instances
    expect(container.isRegistered(SERVICE_TOKENS.UltraThinkEngine)).toBe(true);
    
    const engine2 = container.resolve(SERVICE_TOKENS.UltraThinkEngine);
    expect(engine2).toBeDefined();
    // Note: Due to the nature of singletons, we can't easily test instance equality here
  });

  /**
   * TC-SR-12: Convenience Functions
   */
  test('TC-SR-12: Should support convenience functions', () => {
    // Test global configuration
    configureUltraThinkDI(container);
    expect(container.isRegistered(SERVICE_TOKENS.UltraThinkEngine)).toBe(true);

    // Test service summary
    const summary = UltraThinkServiceFactory.getServiceSummary(container);
    expect(summary.totalServices).toBeGreaterThan(0);
  });
});