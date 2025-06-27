/**
 * Dependency Injection Container for UltraThink System
 * Provides IoC container with singleton and transient registrations
 */

import { IDependencyContainer } from './interfaces';

export class DependencyContainer implements IDependencyContainer {
  private readonly services = new Map<string, () => any>();
  private readonly singletons = new Map<string, any>();
  private readonly singletonFactories = new Set<string>();

  /**
   * Register a transient service (new instance each time)
   */
  register<T>(token: string, factory: () => T): void {
    this.services.set(token, factory);
    // Remove from singletons if it was previously registered as singleton
    if (this.singletonFactories.has(token)) {
      this.singletonFactories.delete(token);
      this.singletons.delete(token);
    }
  }

  /**
   * Register a singleton service (same instance each time)
   */
  registerSingleton<T>(token: string, factory: () => T): void {
    this.services.set(token, factory);
    this.singletonFactories.add(token);
  }

  /**
   * Resolve a service by token
   */
  resolve<T>(token: string): T {
    const factory = this.services.get(token);
    if (!factory) {
      throw new Error(`Service '${token}' is not registered`);
    }

    // Return singleton instance if it's registered as singleton
    if (this.singletonFactories.has(token)) {
      if (!this.singletons.has(token)) {
        this.singletons.set(token, factory());
      }
      return this.singletons.get(token);
    }

    // Return new instance for transient services
    return factory();
  }

  /**
   * Check if a service is registered
   */
  isRegistered(token: string): boolean {
    return this.services.has(token);
  }

  /**
   * Clear all registrations
   */
  clear(): void {
    this.services.clear();
    this.singletons.clear();
    this.singletonFactories.clear();
  }

  /**
   * Get all registered service tokens
   */
  getRegisteredTokens(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Get singleton status of a service
   */
  isSingleton(token: string): boolean {
    return this.singletonFactories.has(token);
  }

  /**
   * Force reset a singleton (useful for testing)
   */
  resetSingleton(token: string): void {
    if (this.singletonFactories.has(token)) {
      this.singletons.delete(token);
    }
  }

  /**
   * Get service registration info for debugging
   */
  getServiceInfo(): Array<{ token: string; isSingleton: boolean; isInstantiated: boolean }> {
    return Array.from(this.services.keys()).map(token => ({
      token,
      isSingleton: this.singletonFactories.has(token),
      isInstantiated: this.singletons.has(token)
    }));
  }
}

// Global container instance
let globalContainer: DependencyContainer | null = null;

/**
 * Get the global DI container instance
 */
export function getContainer(): DependencyContainer {
  if (!globalContainer) {
    globalContainer = new DependencyContainer();
  }
  return globalContainer;
}

/**
 * Set a custom container (useful for testing)
 */
export function setContainer(container: DependencyContainer): void {
  globalContainer = container;
}

/**
 * Reset the global container
 */
export function resetContainer(): void {
  globalContainer = null;
}

/**
 * Helper decorator for dependency injection (if using decorators)
 */
export function injectable(token: string) {
  return function<T extends new (...args: any[]) => any>(constructor: T) {
    const container = getContainer();
    if (!container.isRegistered(token)) {
      container.register(token, () => new constructor());
    }
    return constructor;
  };
}

/**
 * Helper decorator for singleton services
 */
export function singleton(token: string) {
  return function<T extends new (...args: any[]) => any>(constructor: T) {
    const container = getContainer();
    if (!container.isRegistered(token)) {
      container.registerSingleton(token, () => new constructor());
    }
    return constructor;
  };
}