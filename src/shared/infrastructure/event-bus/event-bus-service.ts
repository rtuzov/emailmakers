export interface EventPayload {
  [key: string]: any;
}

export interface EventHandler<T = EventPayload> {
  (payload: T): Promise<void> | void;
}

export interface EventSubscription {
  unsubscribe(): void;
}

export interface EventMetadata {
  eventId: string;
  timestamp: number;
  source: string;
  correlationId?: string;
}

export interface Event<T = EventPayload> {
  type: string;
  payload: T;
  metadata: EventMetadata;
}

/**
 * Event Bus Service for asynchronous communication between services
 * Supports both in-memory and NATS-based event distribution
 */
export class EventBusService {
  private handlers = new Map<string, Set<EventHandler>>();
  private natsClient?: any; // NATS client (optional)
  private logger?: any;
  private eventHistory: Event[] = [];
  private maxHistorySize = 1000;

  constructor(
    natsClient?: any,
    logger?: any,
    options: {
      maxHistorySize?: number;
    } = {}
  ) {
    this.natsClient = natsClient;
    this.logger = logger;
    this.maxHistorySize = options.maxHistorySize || 1000;
  }

  /**
   * Emit an event to all registered handlers
   */
  async emit<T extends EventPayload = EventPayload>(
    eventType: string,
    payload: T,
    metadata: Partial<EventMetadata> = {}
  ): Promise<void> {
    const event: Event<T> = {
      type: eventType,
      payload,
      metadata: {
        eventId: this.generateEventId(),
        timestamp: Date.now(),
        source: metadata.source || 'unknown',
        ...(metadata.correlationId ? { correlationId: metadata.correlationId } : {})
      }
    };

    try {
      // Store in event history
      this.addToHistory(event);

      // Emit to local handlers
      await this.emitToLocalHandlers(event);

      // Emit to NATS if available
      if (this.natsClient) {
        await this.emitToNATS(event);
      }

      this.logger?.debug('Event emitted', { eventType, eventId: event.metadata.eventId });
    } catch (error) {
      this.logger?.error('Error emitting event', { eventType, error });
      throw error;
    }
  }

  /**
   * Subscribe to events of a specific type
   */
  subscribe<T = EventPayload>(
    eventType: string,
    handler: EventHandler<T>
  ): EventSubscription {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }

    const handlers = this.handlers.get(eventType)!;
    handlers.add(handler as EventHandler);

    this.logger?.debug('Event handler subscribed', { eventType });

    return {
      unsubscribe: () => {
        handlers.delete(handler as EventHandler);
        if (handlers.size === 0) {
          this.handlers.delete(eventType);
        }
        this.logger?.debug('Event handler unsubscribed', { eventType });
      }
    };
  }

  /**
   * Subscribe to multiple event types with a single handler
   */
  subscribeToMultiple<T = EventPayload>(
    eventTypes: string[],
    handler: EventHandler<T>
  ): EventSubscription[] {
    return eventTypes.map(eventType => this.subscribe(eventType, handler));
  }

  /**
   * Subscribe to all events (wildcard subscription)
   */
  subscribeToAll<T = EventPayload>(
    handler: EventHandler<T>
  ): EventSubscription {
    return this.subscribe('*', handler);
  }

  /**
   * Get event history
   */
  getEventHistory(
    eventType?: string,
    limit?: number,
    since?: number
  ): Event[] {
    let events = this.eventHistory;

    // Filter by event type
    if (eventType && eventType !== '*') {
      events = events.filter(event => event.type === eventType);
    }

    // Filter by timestamp
    if (since) {
      events = events.filter(event => event.metadata.timestamp >= since);
    }

    // Apply limit
    if (limit) {
      events = events.slice(-limit);
    }

    return events;
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
    this.logger?.info('Event history cleared');
  }

  /**
   * Get subscription statistics
   */
  getStats(): {
    totalHandlers: number;
    eventTypes: string[];
    historySize: number;
  } {
    const eventTypes = Array.from(this.handlers.keys());
    const totalHandlers = Array.from(this.handlers.values())
      .reduce((sum, handlers) => sum + handlers.size, 0);

    return {
      totalHandlers,
      eventTypes,
      historySize: this.eventHistory.length
    };
  }

  /**
   * Emit event to local handlers
   */
  private async emitToLocalHandlers<T extends EventPayload = EventPayload>(event: Event<T>): Promise<void> {
    const promises: Promise<void>[] = [];

    // Emit to specific event type handlers
    const specificHandlers = this.handlers.get(event.type);
    if (specificHandlers) {
      for (const handler of specificHandlers) {
        promises.push(this.executeHandler(handler, event.payload));
      }
    }

    // Emit to wildcard handlers
    const wildcardHandlers = this.handlers.get('*');
    if (wildcardHandlers) {
      for (const handler of wildcardHandlers) {
        promises.push(this.executeHandler(handler, event.payload));
      }
    }

    // Wait for all handlers to complete
    const results = await Promise.allSettled(promises);

    // Log any handler errors
    results.forEach((result, _index) => {
      if (result.status === 'rejected') {
        this.logger?.error('Event handler failed', {
          eventType: event.type,
          eventId: event.metadata.eventId,
          error: result.reason
        });
      }
    });
  }

  /**
   * Execute a single event handler with error handling
   */
  private async executeHandler<T>(
    handler: EventHandler<T>,
    payload: T
  ): Promise<void> {
    try {
      const result = handler(payload);
      if (result instanceof Promise) {
        await result;
      }
    } catch (error) {
      // Error is logged by the caller
      throw error;
    }
  }

  /**
   * Emit event to NATS
   */
  private async emitToNATS<T>(event: Event<T>): Promise<void> {
    try {
      const subject = `events.${event.type}`;
      const message = JSON.stringify(event);
      
      await this.natsClient.publish(subject, message);
      
      this.logger?.debug('Event published to NATS', {
        subject,
        eventId: event.metadata.eventId
      });
    } catch (error) {
      this.logger?.error('Error publishing to NATS', {
        eventType: event.type,
        eventId: event.metadata.eventId,
        error
      });
      throw error;
    }
  }

  /**
   * Add event to history with size management
   */
  private addToHistory<T extends EventPayload = EventPayload>(event: Event<T>): void {
    this.eventHistory.push(event);

    // Maintain history size limit
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Template Generation Events
 * Specific event types for template generation workflow
 */
export class TemplateGenerationEvents {
  constructor(private eventBus: EventBusService) {}

  // Template generation lifecycle events
  async emitGenerationStarted(jobId: string, brief: any, options: any): Promise<void> {
    await this.eventBus.emit('template.generation.started', {
      jobId,
      brief,
      options
    });
  }

  async emitContentGenerated(jobId: string, contentType: string, wordCount: number, provider: string): Promise<void> {
    await this.eventBus.emit('template.content.generated', {
      jobId,
      contentType,
      wordCount,
      provider
    });
  }

  async emitDesignExtracted(jobId: string, tokenCount: number, componentCount: number): Promise<void> {
    await this.eventBus.emit('template.design.extracted', {
      jobId,
      tokenCount,
      componentCount
    });
  }

  async emitTemplateProcessed(jobId: string, templateSize: number, mjmlSize: number, hasDesignSystem: boolean): Promise<void> {
    await this.eventBus.emit('template.processed', {
      jobId,
      templateSize,
      mjmlSize,
      hasDesignSystem
    });
  }

  async emitTemplateValidated(jobId: string, overallScore: number, issueCount: number, accessibilityScore: number): Promise<void> {
    await this.eventBus.emit('template.validated', {
      jobId,
      overallScore,
      issueCount,
      accessibilityScore
    });
  }

  async emitGenerationCompleted(jobId: string, result: any): Promise<void> {
    await this.eventBus.emit('template.generation.completed', {
      jobId,
      result
    });
  }

  async emitGenerationFailed(jobId: string, error: string, duration: number): Promise<void> {
    await this.eventBus.emit('template.generation.failed', {
      jobId,
      error,
      duration
    });
  }

  // Cache events
  async emitCacheHit(jobId: string): Promise<void> {
    await this.eventBus.emit('template.generation.cache_hit', { jobId });
  }

  // Auto-fix events
  async emitAutoFixesApplied(jobId: string, fixesApplied: number, originalScore: number): Promise<void> {
    await this.eventBus.emit('template.auto_fixes_applied', {
      jobId,
      fixesApplied,
      originalScore
    });
  }

  async emitAutoFixesFailed(jobId: string, error: string): Promise<void> {
    await this.eventBus.emit('template.auto_fixes_failed', {
      jobId,
      error
    });
  }

  // Design system events
  async emitDesignExtractionFailed(jobId: string, error: string): Promise<void> {
    await this.eventBus.emit('template.design.extraction_failed', {
      jobId,
      error
    });
  }
}

/**
 * Event Bus Factory for creating event bus instances
 */
export class EventBusFactory {
  static createInMemoryEventBus(logger?: any): EventBusService {
    return new EventBusService(undefined, logger);
  }

  static createNATSEventBus(natsClient: any, logger?: any): EventBusService {
    return new EventBusService(natsClient, logger);
  }

  static createTemplateGenerationEvents(eventBus: EventBusService): TemplateGenerationEvents {
    return new TemplateGenerationEvents(eventBus);
  }
}

/**
 * Event Bus Middleware for cross-cutting concerns
 */
export class EventBusMiddleware {
  constructor(private eventBus: EventBusService) {}

  /**
   * Add correlation ID middleware
   */
  addCorrelationIdMiddleware(): void {
    const originalEmit = this.eventBus.emit.bind(this.eventBus);
    
    this.eventBus.emit = async function<T extends EventPayload>(
      eventType: string,
      payload: T,
      metadata: Partial<EventMetadata> = {}
    ) {
      // Add correlation ID if not present
      if (!metadata.correlationId) {
        metadata.correlationId = `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      
      return originalEmit(eventType, payload, metadata);
    };
  }

  /**
   * Add retry middleware for failed events
   */
  addRetryMiddleware(_maxRetries: number = 3, _retryDelay: number = 1000): void {
    this.eventBus.subscribe('*', async (_payload: any) => {
      // Implementation would track failed events and retry them
      // This is a placeholder for the retry logic
    });
  }

  /**
   * Add metrics middleware
   */
  addMetricsMiddleware(metricsService: any): void {
    this.eventBus.subscribe('*', async (_payload: any) => {
      metricsService.incrementCounter('events.processed');
    });
  }
} 