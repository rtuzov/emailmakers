export interface MetricLabels {
  [key: string]: string;
}

export interface CounterMetric {
  name: string;
  value: number;
  labels: MetricLabels;
  timestamp: number;
}

export interface HistogramMetric {
  name: string;
  value: number;
  labels: MetricLabels;
  timestamp: number;
  buckets?: number[];
}

export interface GaugeMetric {
  name: string;
  value: number;
  labels: MetricLabels;
  timestamp: number;
}

export interface MetricsSnapshot {
  counters: CounterMetric[];
  histograms: HistogramMetric[];
  gauges: GaugeMetric[];
  timestamp: number;
}

/**
 * Comprehensive metrics service for monitoring application performance
 * Supports counters, histograms, and gauges with Prometheus-compatible format
 */
export class MetricsService {
  private counters = new Map<string, Map<string, number>>();
  private histograms = new Map<string, Map<string, number[]>>();
  private gauges = new Map<string, Map<string, number>>();
  
  // Prometheus client (optional for production environments)
  private prometheusClient?: any;
  private logger?: any;

  constructor(
    prometheusClient?: any,
    logger?: any
  ) {
    this.prometheusClient = prometheusClient;
    this.logger = logger;
  }

  /**
   * Increment a counter metric
   */
  incrementCounter(name: string, labels: MetricLabels = {}): void {
    try {
      const labelKey = this.generateLabelKey(labels);
      
      if (!this.counters.has(name)) {
        this.counters.set(name, new Map());
      }
      
      const counterMap = this.counters.get(name)!;
      const currentValue = counterMap.get(labelKey) || 0;
      counterMap.set(labelKey, currentValue + 1);

      // Send to Prometheus if available
      if (this.prometheusClient) {
        this.prometheusClient.getCounter(name).labels(labels).inc();
      }

      this.logger?.debug('Counter incremented', { name, labels });
    } catch (error) {
      this.logger?.error('Error incrementing counter', { name, labels, error });
    }
  }

  /**
   * Record a duration in a histogram
   */
  recordDuration(name: string, duration: number, labels: MetricLabels = {}): void {
    try {
      const labelKey = this.generateLabelKey(labels);
      
      if (!this.histograms.has(name)) {
        this.histograms.set(name, new Map());
      }
      
      const histogramMap = this.histograms.get(name)!;
      const currentValues = histogramMap.get(labelKey) || [];
      currentValues.push(duration);
      histogramMap.set(labelKey, currentValues);

      // Send to Prometheus if available
      if (this.prometheusClient) {
        this.prometheusClient.getHistogram(name).labels(labels).observe(duration);
      }

      this.logger?.debug('Duration recorded', { name, duration, labels });
    } catch (error) {
      this.logger?.error('Error recording duration', { name, duration, labels, error });
    }
  }

  /**
   * Set a gauge value
   */
  setGauge(name: string, value: number, labels: MetricLabels = {}): void {
    try {
      const labelKey = this.generateLabelKey(labels);
      
      if (!this.gauges.has(name)) {
        this.gauges.set(name, new Map());
      }
      
      const gaugeMap = this.gauges.get(name)!;
      gaugeMap.set(labelKey, value);

      // Send to Prometheus if available
      if (this.prometheusClient) {
        this.prometheusClient.getGauge(name).labels(labels).set(value);
      }

      this.logger?.debug('Gauge set', { name, value, labels });
    } catch (error) {
      this.logger?.error('Error setting gauge', { name, value, labels, error });
    }
  }

  /**
   * Record template generation metrics
   */
  recordTemplateGeneration(
    duration: number,
    success: boolean,
    provider: string
  ): void {
    const labels = { 
      success: success.toString(), 
      provider 
    };

    this.incrementCounter('template.generation.total', labels);
    this.recordDuration('template.generation.duration', duration, { provider });

    if (success) {
      this.incrementCounter('template.generation.success', { provider });
    } else {
      this.incrementCounter('template.generation.failure', { provider });
    }
  }

  /**
   * Record LLM API call metrics
   */
  recordLLMCall(
    provider: string,
    duration: number,
    tokens: number,
    success: boolean,
    cost?: number
  ): void {
    const labels = { 
      provider, 
      success: success.toString() 
    };

    this.incrementCounter('llm.api.calls.total', labels);
    this.recordDuration('llm.api.duration', duration, { provider });
    this.setGauge('llm.api.tokens.used', tokens, { provider });

    if (cost !== undefined) {
      this.setGauge('llm.api.cost', cost, { provider });
    }

    if (success) {
      this.incrementCounter('llm.api.calls.success', { provider });
    } else {
      this.incrementCounter('llm.api.calls.failure', { provider });
    }
  }

  /**
   * Record Figma API call metrics
   */
  recordFigmaCall(
    operation: string,
    duration: number,
    success: boolean,
    tokensExtracted?: number
  ): void {
    const labels = { 
      operation, 
      success: success.toString() 
    };

    this.incrementCounter('figma.api.calls.total', labels);
    this.recordDuration('figma.api.duration', duration, { operation });

    if (tokensExtracted !== undefined) {
      this.setGauge('figma.tokens.extracted', tokensExtracted, { operation });
    }

    if (success) {
      this.incrementCounter('figma.api.calls.success', { operation });
    } else {
      this.incrementCounter('figma.api.calls.failure', { operation });
    }
  }

  /**
   * Record MJML processing metrics
   */
  recordMJMLProcessing(
    duration: number,
    inputSize: number,
    outputSize: number,
    success: boolean
  ): void {
    const labels = { 
      success: success.toString() 
    };

    this.incrementCounter('mjml.processing.total', labels);
    this.recordDuration('mjml.processing.duration', duration);
    this.setGauge('mjml.input.size', inputSize);
    this.setGauge('mjml.output.size', outputSize);

    if (success) {
      this.incrementCounter('mjml.processing.success');
    } else {
      this.incrementCounter('mjml.processing.failure');
    }
  }

  /**
   * Record quality assurance metrics
   */
  recordQualityAssurance(
    duration: number,
    overallScore: number,
    issueCount: number,
    success: boolean
  ): void {
    const labels = { 
      success: success.toString() 
    };

    this.incrementCounter('qa.validation.total', labels);
    this.recordDuration('qa.validation.duration', duration);
    this.setGauge('qa.overall.score', overallScore);
    this.setGauge('qa.issues.count', issueCount);

    if (success) {
      this.incrementCounter('qa.validation.success');
    } else {
      this.incrementCounter('qa.validation.failure');
    }
  }

  /**
   * Record job queue metrics
   */
  recordJobQueued(jobId: string, priority: string): void {
    this.incrementCounter('queue.jobs.queued', { priority });
    this.logger?.info('Job queued', { jobId, priority });
  }

  recordJobCompletion(jobId: string, priority: string, processingTime: number): void {
    this.incrementCounter('queue.jobs.completed', { priority });
    this.recordDuration('queue.jobs.processing_time', processingTime, { priority });
    this.logger?.info('Job completed', { jobId, priority, processingTime });
  }

  recordJobFailure(jobId: string, priority: string, error: string): void {
    this.incrementCounter('queue.jobs.failed', { priority });
    this.logger?.error('Job failed', { jobId, priority, error });
  }

  recordJobStall(jobId: string): void {
    this.incrementCounter('queue.jobs.stalled');
    this.logger?.warn('Job stalled', { jobId });
  }

  recordJobCancellation(jobId: string): void {
    this.incrementCounter('queue.jobs.cancelled');
    this.logger?.info('Job cancelled', { jobId });
  }

  recordJobRetry(jobId: string): void {
    this.incrementCounter('queue.jobs.retried');
    this.logger?.info('Job retried', { jobId });
  }

  recordWorkerStart(workerId: string): void {
    this.incrementCounter('queue.workers.started');
    this.logger?.info('Worker started', { workerId });
  }

  recordWorkerStop(workerId: string): void {
    this.incrementCounter('queue.workers.stopped');
    this.logger?.info('Worker stopped', { workerId });
  }

  /**
   * Record storage metrics
   */
  recordScreenshotUpload(jobId: string, clientId: string, size: number): void {
    this.incrementCounter('storage.screenshots.uploaded', { clientId });
    this.setGauge('storage.screenshots.size', size, { clientId });
    this.logger?.info('Screenshot uploaded', { jobId, clientId, size });
  }

  recordUploadTime(duration: number): void {
    this.recordDuration('storage.upload.duration', duration);
  }

  recordFileDeletion(key: string): void {
    this.incrementCounter('storage.files.deleted');
    this.logger?.info('File deleted', { key });
  }

  recordCleanupOperation(deletedCount: number, freedSpace: number): void {
    this.setGauge('storage.cleanup.deleted_count', deletedCount);
    this.setGauge('storage.cleanup.freed_space', freedSpace);
    this.logger?.info('Cleanup operation completed', { deletedCount, freedSpace });
  }

  /**
   * Record render testing metrics
   */
  recordRenderTestStart(jobId: string, clientCount: number): void {
    this.incrementCounter('render.tests.started');
    this.setGauge('render.tests.client_count', clientCount);
    this.logger?.info('Render test started', { jobId, clientCount });
  }

  recordRenderTestCompletion(
    jobId: string,
    duration: number,
    success: boolean,
    clientResults: Array<{ clientId: string; success: boolean; score: number }>
  ): void {
    const labels = { success: success.toString() };
    
    this.incrementCounter('render.tests.completed', labels);
    this.recordDuration('render.tests.duration', duration);

    // Record per-client results
    clientResults.forEach(result => {
      this.incrementCounter('render.tests.client_results', {
        clientId: result.clientId,
        success: result.success.toString()
      });
      this.setGauge('render.tests.client_score', result.score, {
        clientId: result.clientId
      });
    });

    this.logger?.info('Render test completed', { jobId, duration, success, clientResults });
  }

  recordScreenshotCapture(clientId: string, viewport: string, success: boolean, duration: number): void {
    const labels = { clientId, viewport, success: success.toString() };
    
    this.incrementCounter('render.screenshots.captured', labels);
    this.recordDuration('render.screenshots.capture_time', duration, { clientId, viewport });
    
    this.logger?.info('Screenshot captured', { clientId, viewport, success, duration });
  }

  /**
   * Record accessibility test completion
   */
  recordAccessibilityTest(score: number, violationCount: number, success: boolean): void {
    this.incrementCounter('accessibility_tests_total', { success: success.toString() });
    this.setGauge('accessibility_score', score);
    this.setGauge('accessibility_violations', violationCount);
    
    if (success) {
      this.incrementCounter('accessibility_tests_success_total');
    } else {
      this.incrementCounter('accessibility_tests_failure_total');
    }
  }

  /**
   * Get current metrics snapshot
   */
  getSnapshot(): MetricsSnapshot {
    const timestamp = Date.now();
    
    const counters: CounterMetric[] = [];
    for (const [name, labelMap] of Array.from(this.counters.entries())) {
      for (const [labelKey, value] of Array.from(labelMap.entries())) {
        counters.push({
          name,
          value,
          labels: this.parseLabelKey(labelKey),
          timestamp
        });
      }
    }

    const histograms: HistogramMetric[] = [];
    for (const [name, labelMap] of Array.from(this.histograms.entries())) {
      for (const [labelKey, values] of Array.from(labelMap.entries())) {
        histograms.push({
          name,
          value: this.calculateHistogramValue(values),
          labels: this.parseLabelKey(labelKey),
          timestamp,
          buckets: this.calculateHistogramBuckets(values)
        });
      }
    }

    const gauges: GaugeMetric[] = [];
    for (const [name, labelMap] of Array.from(this.gauges.entries())) {
      for (const [labelKey, value] of Array.from(labelMap.entries())) {
        gauges.push({
          name,
          value,
          labels: this.parseLabelKey(labelKey),
          timestamp
        });
      }
    }

    return {
      counters,
      histograms,
      gauges,
      timestamp
    };
  }

  /**
   * Get metrics in Prometheus format
   */
  getPrometheusMetrics(): string {
    const lines: string[] = [];
    const timestamp = Date.now();

    // Counters
    for (const [name, labelMap] of Array.from(this.counters.entries())) {
      lines.push(`# TYPE ${name} counter`);
      for (const [labelKey, value] of Array.from(labelMap.entries())) {
        const labels = this.formatPrometheusLabels(labelKey);
        lines.push(`${name}${labels} ${value} ${timestamp}`);
      }
    }

    // Histograms
    for (const [name, labelMap] of Array.from(this.histograms.entries())) {
      lines.push(`# TYPE ${name} histogram`);
      for (const [labelKey, values] of Array.from(labelMap.entries())) {
        const labels = this.formatPrometheusLabels(labelKey);
        const sum = values.reduce((a, b) => a + b, 0);
        const count = values.length;
        
        lines.push(`${name}_sum${labels} ${sum} ${timestamp}`);
        lines.push(`${name}_count${labels} ${count} ${timestamp}`);
        
        // Histogram buckets
        const buckets = this.calculateHistogramBuckets(values);
        for (const bucket of buckets) {
          const bucketLabels = this.addBucketLabel(labelKey, bucket);
          const bucketCount = values.filter(v => v <= bucket).length;
          lines.push(`${name}_bucket${bucketLabels} ${bucketCount} ${timestamp}`);
        }
      }
    }

    // Gauges
    for (const [name, labelMap] of Array.from(this.gauges.entries())) {
      lines.push(`# TYPE ${name} gauge`);
      for (const [labelKey, value] of Array.from(labelMap.entries())) {
        const labels = this.formatPrometheusLabels(labelKey);
        lines.push(`${name}${labels} ${value} ${timestamp}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.counters.clear();
    this.histograms.clear();
    this.gauges.clear();
    this.logger?.info('Metrics reset');
  }

  /**
   * Get system performance metrics
   */
  getSystemMetrics(): {
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
    cpuUsage: NodeJS.CpuUsage;
  } {
    return {
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      cpuUsage: process.cpuUsage()
    };
  }

  /**
   * Generate a key for label combinations
   */
  private generateLabelKey(labels: MetricLabels): string {
    const sortedKeys = Object.keys(labels).sort();
    return sortedKeys.map(key => `${key}=${labels[key]}`).join(',');
  }

  /**
   * Parse label key back to labels object
   */
  private parseLabelKey(labelKey: string): MetricLabels {
    if (!labelKey) return {};
    
    const labels: MetricLabels = {};
    const pairs = labelKey.split(',');
    
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key && value) {
        labels[key] = value;
      }
    }
    
    return labels;
  }

  /**
   * Calculate histogram summary value (mean)
   */
  private calculateHistogramValue(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Calculate histogram buckets
   */
  private calculateHistogramBuckets(values: number[]): number[] {
    if (values.length === 0) return [];
    
    const sorted = values.slice().sort((a, b) => a - b);
    const max = sorted[sorted.length - 1];
    
    // Generate exponential buckets
    const buckets: number[] = [];
    let bucket = 0.001; // Start with 1ms
    
    while (bucket <= max * 2) {
      buckets.push(bucket);
      bucket *= 2;
    }
    
    return buckets;
  }

  /**
   * Format labels for Prometheus output
   */
  private formatPrometheusLabels(labelKey: string): string {
    if (!labelKey) return '';
    
    const labels = this.parseLabelKey(labelKey);
    const pairs = Object.entries(labels).map(([key, value]) => `${key}="${value}"`);
    
    return pairs.length > 0 ? `{${pairs.join(',')}}` : '';
  }

  /**
   * Add bucket label for histogram
   */
  private addBucketLabel(labelKey: string, bucket: number): string {
    const labels = this.parseLabelKey(labelKey);
    labels.le = bucket.toString();
    return this.formatPrometheusLabels(this.generateLabelKey(labels));
  }
}

/**
 * Metrics collector for aggregating metrics from multiple sources
 */
export class MetricsCollector {
  private services: MetricsService[] = [];
  
  addService(service: MetricsService): void {
    this.services.push(service);
  }

  /**
   * Collect metrics from all registered services
   */
  collectAll(): MetricsSnapshot {
    const aggregated: MetricsSnapshot = {
      counters: [],
      histograms: [],
      gauges: [],
      timestamp: Date.now()
    };

    for (const service of this.services) {
      const snapshot = service.getSnapshot();
      aggregated.counters.push(...snapshot.counters);
      aggregated.histograms.push(...snapshot.histograms);
      aggregated.gauges.push(...snapshot.gauges);
    }

    return aggregated;
  }

  /**
   * Get aggregated Prometheus metrics
   */
  getPrometheusMetrics(): string {
    const lines: string[] = [];
    
    for (const service of this.services) {
      lines.push(service.getPrometheusMetrics());
    }
    
    return lines.join('\n\n');
  }
} 