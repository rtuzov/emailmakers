/**
 * 🔍 VALIDATION MONITOR STUB
 * 
 * Stub implementation for validation monitoring system.
 * Provides mock validation capabilities for development and testing.
 */

// Validation event types
export interface ValidationEvent {
  id: string;
  timestamp: string;
  type: 'validation_started' | 'validation_completed' | 'validation_failed';
  source: string;
  details: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface ValidationMetrics {
  total_validations: number;
  success_rate: number;
  average_duration_ms: number;
  failure_count: number;
  last_validation: string | null;
}

export interface ValidationConfig {
  enabled: boolean;
  timeout_ms: number;
  retry_count: number;
  log_level: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Validation Monitor Stub Implementation
 */
export class ValidationMonitorStub {
  private events: ValidationEvent[] = [];
  private config: ValidationConfig;
  private isRunning = false;

  constructor(config: Partial<ValidationConfig> = {}) {
    this.config = {
      enabled: true,
      timeout_ms: 30000,
      retry_count: 3,
      log_level: 'info',
      ...config
    };
  }

  /**
   * Start the validation monitor
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('ValidationMonitor is already running');
      return;
    }

    this.isRunning = true;
    console.log('🔍 ValidationMonitor stub started');
  }

  /**
   * Stop the validation monitor
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.warn('ValidationMonitor is not running');
      return;
    }

    this.isRunning = false;
    console.log('🛑 ValidationMonitor stub stopped');
  }

  /**
   * Log a validation event
   */
  logEvent(event: Omit<ValidationEvent, 'id' | 'timestamp'>): void {
    if (!this.config.enabled) return;

    const fullEvent: ValidationEvent = {
      id: `validation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...event
    };

    this.events.push(fullEvent);

    // Keep only last 1000 events to prevent memory issues
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }

    if (this.config.log_level === 'debug') {
      console.log('📊 Validation event:', fullEvent);
    }
  }

  /**
   * Get validation metrics
   */
  getMetrics(): ValidationMetrics {
    const totalValidations = this.events.length;
    const completedValidations = this.events.filter(e => (e || {}).type === 'validation_completed');
    const failedValidations = this.events.filter(e => (e || {}).type === 'validation_failed');
    
    const successRate = totalValidations > 0 ? (completedValidations.length / totalValidations) * 100 : 0;
    
    // Mock average duration
    const averageDuration = 250 + Math.random() * 500; // 250-750ms
    
    const lastValidation = this.events.length > 0 ? this.events[this.events.length - 1]?.timestamp ?? null : null;

    return {
      total_validations: totalValidations,
      success_rate: Math.round(successRate * 100) / 100,
      average_duration_ms: Math.round(averageDuration),
      failure_count: failedValidations.length,
      last_validation: lastValidation
    };
  }

  /**
   * Get recent validation events
   */
  getRecentEvents(limit = 50): ValidationEvent[] {
    return this.events.slice(-limit).reverse();
  }

  /**
   * Clear all events
   */
  clearEvents(): void {
    this.events = [];
    console.log('🧹 Validation events cleared');
  }

  /**
   * Validate a component or service
   */
  async validateComponent(componentName: string, _validationData: any): Promise<boolean> {
    const startTime = Date.now();
    
    this.logEvent({
      type: 'validation_started',
      source: componentName,
      details: { component: componentName },
      metadata: { startTime }
    });

    try {
      // Mock validation logic - simulate some processing time
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 300));
      
      // Mock success/failure (95% success rate)
      const isValid = Math.random() > 0.05;
      
      if (isValid) {
        this.logEvent({
          type: 'validation_completed',
          source: componentName,
          details: { 
            component: componentName, 
            duration_ms: Date.now() - startTime,
            validation_result: 'passed'
          }
        });
        return true;
      } else {
        throw new Error(`Validation failed for ${componentName}`);
      }
    } catch (error) {
      this.logEvent({
        type: 'validation_failed',
        source: componentName,
        details: { 
          component: componentName, 
          duration_ms: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      return false;
    }
  }

  /**
   * Get configuration
   */
  getConfig(): ValidationConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ValidationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ ValidationMonitor config updated:', this.config);
  }

  /**
   * Check if monitor is running
   */
  isMonitorRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Record validation result
   */
  recordValidation(validationData: any): void {
    this.logEvent({
      type: validationData.isValid ? 'validation_completed' : 'validation_failed',
      source: validationData.agentId || validationData.agentType || 'unknown',
      details: validationData
    });
  }

  /**
   * Record correction action
   */
  recordCorrection(correctionData: any): void {
    this.logEvent({
      type: 'validation_completed',
      source: correctionData.agentId || correctionData.operation || 'correction',
      details: { correction_applied: true, ...correctionData }
    });
  }
}

// Export singleton instance
export const validationMonitor = new ValidationMonitorStub();

// Types are already exported inline above

/**
 * Initialize validation monitor with default config
 */
export async function initializeValidationMonitor(config?: Partial<ValidationConfig>): Promise<ValidationMonitorStub> {
  if (config) {
    validationMonitor.updateConfig(config);
  }
  
  await validationMonitor.start();
  return validationMonitor;
}

/**
 * Cleanup validation monitor
 */
export async function cleanupValidationMonitor(): Promise<void> {
  await validationMonitor.stop();
  validationMonitor.clearEvents();
}