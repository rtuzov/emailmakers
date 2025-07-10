/**
 * 🔄 HANDOFF MONITORING SYSTEM - Advanced Agent Handoff Tracking
 * 
 * Comprehensive monitoring system for agent handoffs with:
 * - Real-time handoff tracking
 * - Data integrity validation
 * - Performance metrics collection
 * - Error detection and reporting
 * - Campaign folder integration
 * - OpenAI Agents SDK compatibility
 * 
 * Monitors all handoffs between:
 * - Content Specialist → Design Specialist
 * - Design Specialist → Quality Specialist
 * - Quality Specialist → Delivery Specialist
 */

import { promises as fs } from 'fs';
import path from 'path';
import { AgentLogger } from './agent-logger';
import { debuggers } from './debug-output';

// ============================================================================
// HANDOFF MONITORING TYPES
// ============================================================================

export interface HandoffMetadata {
  handoffId: string;
  timestamp: string;
  sourceAgent: string;
  targetAgent: string;
  campaignId: string;
  campaignPath: string;
  traceId?: string;
  sessionId?: string;
}

export interface HandoffData {
  contentContext?: any;
  assetManifest?: any;
  technicalSpecification?: any;
  designPackage?: any;
  qualityReport?: any;
  deliveryPackage?: any;
  metadata: HandoffMetadata;
}

export interface HandoffValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingFields: string[];
  dataSize: number;
  checksum: string;
}

export interface HandoffPerformanceMetrics {
  handoffId: string;
  sourceAgent: string;
  targetAgent: string;
  startTime: number;
  endTime: number;
  duration: number;
  dataSize: number;
  validationDuration: number;
  persistenceDuration: number;
  success: boolean;
  error?: string;
}

export interface HandoffSummary {
  campaignId: string;
  totalHandoffs: number;
  successfulHandoffs: number;
  failedHandoffs: number;
  averageDuration: number;
  totalDataTransferred: number;
  handoffChain: string[];
  errors: string[];
  warnings: string[];
}

// ============================================================================
// HANDOFF MONITORING CLASS
// ============================================================================

export class HandoffMonitor {
  private logger: AgentLogger;
  private handoffHistory: HandoffPerformanceMetrics[] = [];
  private campaignPath: string;
  private debug = debuggers.handoffs;

  constructor(campaignPath: string, logger: AgentLogger) {
    this.campaignPath = campaignPath;
    this.logger = logger;
    this.initializeMonitoring();
  }

  // ============================================================================
  // CORE MONITORING METHODS
  // ============================================================================

  async monitorHandoff(
    sourceAgent: string,
    targetAgent: string,
    data: any,
    campaignId: string
  ): Promise<HandoffPerformanceMetrics> {
    const handoffId = this.generateHandoffId(sourceAgent, targetAgent);
    const startTime = Date.now();

    this.debug.info('HandoffMonitor', `🔄 Starting handoff: ${sourceAgent} → ${targetAgent}`, {
      handoffId,
      campaignId,
      dataKeys: Object.keys(data || {})
    });

    const performanceMarkId = this.debug.performanceStart('HandoffMonitor', `${sourceAgent}_to_${targetAgent}`);

    try {
      // Validate handoff data
      const validationStart = Date.now();
      const validationResult = await this.validateHandoffData(data, sourceAgent, targetAgent);
      const validationDuration = Date.now() - validationStart;

      if (!validationResult.isValid) {
        throw new Error(`Handoff validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Log validation warnings
      if (validationResult.warnings.length > 0) {
        this.debug.warn('HandoffMonitor', `Handoff validation warnings`, {
          handoffId,
          warnings: validationResult.warnings
        });
      }

      // Persist handoff data
      const persistenceStart = Date.now();
      await this.persistHandoffData(handoffId, sourceAgent, targetAgent, data, campaignId);
      const persistenceDuration = Date.now() - persistenceStart;

      // Calculate metrics
      const endTime = Date.now();
      const duration = endTime - startTime;
      const dataSize = JSON.stringify(data).length;

      const metrics: HandoffPerformanceMetrics = {
        handoffId,
        sourceAgent,
        targetAgent,
        startTime,
        endTime,
        duration,
        dataSize,
        validationDuration,
        persistenceDuration,
        success: true
      };

      this.handoffHistory.push(metrics);

      // Log successful handoff
      this.logger.logHandoff(handoffId, sourceAgent, targetAgent, data, true);
      
      this.debug.info('HandoffMonitor', `✅ Handoff completed successfully`, {
        handoffId,
        duration,
        dataSize,
        validationDuration,
        persistenceDuration
      });

      this.debug.performanceEnd(performanceMarkId, 'HandoffMonitor', `${sourceAgent}_to_${targetAgent}`, {
        dataSize,
        validationDuration,
        persistenceDuration
      });

      return metrics;

    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      const metrics: HandoffPerformanceMetrics = {
        handoffId,
        sourceAgent,
        targetAgent,
        startTime,
        endTime,
        duration,
        dataSize: JSON.stringify(data).length,
        validationDuration: 0,
        persistenceDuration: 0,
        success: false,
        error: errorMessage
      };

      this.handoffHistory.push(metrics);

      // Log failed handoff
      this.logger.logHandoff(handoffId, sourceAgent, targetAgent, data, false, errorMessage);
      
      this.debug.error('HandoffMonitor', `❌ Handoff failed`, {
        handoffId,
        error: errorMessage,
        duration
      });

      throw error;
    }
  }

  // ============================================================================
  // DATA VALIDATION METHODS
  // ============================================================================

  private async validateHandoffData(
    data: any,
    sourceAgent: string,
    targetAgent: string
  ): Promise<HandoffValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const missingFields: string[] = [];

    // Basic data validation
    if (!data) {
      errors.push('Handoff data is null or undefined');
      return {
        isValid: false,
        errors,
        warnings,
        missingFields,
        dataSize: 0,
        checksum: ''
      };
    }

    // Validate based on handoff type
    switch (`${sourceAgent}_to_${targetAgent}`) {
      case 'ContentSpecialist_to_DesignSpecialist':
        this.validateContentToDesignHandoff(data, errors, warnings, missingFields);
        break;
      
      case 'DesignSpecialist_to_QualitySpecialist':
        this.validateDesignToQualityHandoff(data, errors, warnings, missingFields);
        break;
      
      case 'QualitySpecialist_to_DeliverySpecialist':
        this.validateQualityToDeliveryHandoff(data, errors, warnings, missingFields);
        break;
      
      default:
        warnings.push(`Unknown handoff type: ${sourceAgent} → ${targetAgent}`);
    }

    // Calculate data size and checksum
    const dataString = JSON.stringify(data);
    const dataSize = dataString.length;
    const checksum = this.calculateChecksum(dataString);

    // Size validation
    if (dataSize > 10 * 1024 * 1024) { // 10MB
      warnings.push(`Large handoff data size: ${Math.round(dataSize / 1024 / 1024)}MB`);
    }

    if (dataSize === 0) {
      errors.push('Handoff data is empty');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      missingFields,
      dataSize,
      checksum
    };
  }

  private validateContentToDesignHandoff(
    data: any,
    errors: string[],
    warnings: string[],
    missingFields: string[]
  ): void {
    // Validate top-level structure
    if (!data.content_context) {
      missingFields.push('content_context');
      errors.push('Missing required field: content_context');
      return; // Can't validate nested fields if content_context is missing
    }

    if (!data.request) {
      missingFields.push('request');
      errors.push('Missing required field: request');
    }

    if (!data.metadata) {
      missingFields.push('metadata');
      errors.push('Missing required field: metadata');
    }

    const contentContext = data.content_context;
    const requiredContentFields = [
      'generated_content',
      'pricing_analysis',
      'context_analysis',
      'asset_strategy',
      'technical_requirements'
    ];

    requiredContentFields.forEach(field => {
      if (!contentContext[field]) {
        missingFields.push(`content_context.${field}`);
        errors.push(`Missing required field: content_context.${field}`);
      }
    });

    // Validate content structure
    if (contentContext.generated_content && !contentContext.generated_content.subject) {
      errors.push('Generated content missing subject');
    }

    if (contentContext.generated_content && !contentContext.generated_content.body) {
      errors.push('Generated content missing body');
    }

    // Validate pricing data
    if (contentContext.pricing_analysis && typeof contentContext.pricing_analysis.best_price === 'undefined') {
      warnings.push('Pricing analysis missing best_price');
    }

    // Validate technical requirements
    if (contentContext.technical_requirements && !contentContext.technical_requirements.max_width) {
      warnings.push('Technical requirements missing max_width');
    }

    // Validate campaign metadata
    if (contentContext.campaign && !contentContext.campaign.id) {
      warnings.push('Campaign metadata missing id');
    }
  }

  private validateDesignToQualityHandoff(
    data: any,
    errors: string[],
    warnings: string[],
    missingFields: string[]
  ): void {
    const requiredFields = [
      'design_package',
      'mjml_template',
      'html_output',
      'assets_used',
      'technical_specification'
    ];

    requiredFields.forEach(field => {
      if (!data[field]) {
        missingFields.push(field);
        errors.push(`Missing required field: ${field}`);
      }
    });

    // Validate MJML template
    if (data.mjml_template && !data.mjml_template.includes('<mjml>')) {
      errors.push('Invalid MJML template format');
    }

    // Validate HTML output
    if (data.html_output && !data.html_output.includes('<!DOCTYPE html>')) {
      warnings.push('HTML output missing DOCTYPE declaration');
    }

    // Validate assets
    if (data.assets_used && !Array.isArray(data.assets_used)) {
      errors.push('Assets used should be an array');
    }
  }

  private validateQualityToDeliveryHandoff(
    data: any,
    errors: string[],
    warnings: string[],
    missingFields: string[]
  ): void {
    const requiredFields = [
      'quality_report',
      'validated_template',
      'test_results',
      'recommendations'
    ];

    requiredFields.forEach(field => {
      if (!data[field]) {
        missingFields.push(field);
        errors.push(`Missing required field: ${field}`);
      }
    });

    // Validate quality report
    if (data.quality_report && !data.quality_report.overall_score) {
      errors.push('Quality report missing overall_score');
    }

    // Validate test results
    if (data.test_results && !data.test_results.email_clients) {
      warnings.push('Test results missing email_clients');
    }

    // Validate recommendations
    if (data.recommendations && !Array.isArray(data.recommendations)) {
      errors.push('Recommendations should be an array');
    }
  }

  // ============================================================================
  // PERSISTENCE METHODS
  // ============================================================================

  private async persistHandoffData(
    handoffId: string,
    sourceAgent: string,
    targetAgent: string,
    data: any,
    campaignId: string
  ): Promise<void> {
    const handoffDir = path.join(this.campaignPath, 'logs', 'handoffs');
    await fs.mkdir(handoffDir, { recursive: true });

    const handoffFile = path.join(handoffDir, `${handoffId}.json`);
    
    const handoffRecord = {
      handoffId,
      timestamp: new Date().toISOString(),
      sourceAgent,
      targetAgent,
      campaignId,
      data,
      metadata: {
        dataSize: JSON.stringify(data).length,
        checksum: this.calculateChecksum(JSON.stringify(data))
      }
    };

    await fs.writeFile(handoffFile, JSON.stringify(handoffRecord, null, 2));

    this.debug.fileOperation('HandoffMonitor', 'persist', handoffFile, JSON.stringify(handoffRecord).length);
  }

  // ============================================================================
  // METRICS AND REPORTING
  // ============================================================================

  async generateHandoffSummary(campaignId: string): Promise<HandoffSummary> {
    const campaignHandoffs = this.handoffHistory.filter(h => 
      h.handoffId.includes(campaignId.slice(-8))
    );

    const totalHandoffs = campaignHandoffs.length;
    const successfulHandoffs = campaignHandoffs.filter(h => h.success).length;
    const failedHandoffs = totalHandoffs - successfulHandoffs;
    
    const averageDuration = totalHandoffs > 0 ? 
      campaignHandoffs.reduce((sum, h) => sum + h.duration, 0) / totalHandoffs : 0;
    
    const totalDataTransferred = campaignHandoffs.reduce((sum, h) => sum + h.dataSize, 0);
    
    const handoffChain = campaignHandoffs
      .sort((a, b) => a.startTime - b.startTime)
      .map(h => `${h.sourceAgent} → ${h.targetAgent}`);
    
    const errors = campaignHandoffs
      .filter(h => !h.success)
      .map(h => h.error!)
      .filter(Boolean);
    
    const warnings: string[] = [];

    const summary: HandoffSummary = {
      campaignId,
      totalHandoffs,
      successfulHandoffs,
      failedHandoffs,
      averageDuration: Math.round(averageDuration),
      totalDataTransferred,
      handoffChain,
      errors,
      warnings
    };

    // Save summary to file
    const summaryFile = path.join(this.campaignPath, 'logs', 'handoff-summary.json');
    await fs.writeFile(summaryFile, JSON.stringify(summary, null, 2));

    return summary;
  }

  getHandoffMetrics(): HandoffPerformanceMetrics[] {
    return [...this.handoffHistory];
  }

  getHandoffById(handoffId: string): HandoffPerformanceMetrics | undefined {
    return this.handoffHistory.find(h => h.handoffId === handoffId);
  }

  // ============================================================================
  // REAL-TIME MONITORING
  // ============================================================================

  startRealTimeMonitoring(intervalMs: number = 30000): NodeJS.Timeout {
    return setInterval(async () => {
      await this.performHealthCheck();
    }, intervalMs);
  }

  private async performHealthCheck(): Promise<void> {
    const recentHandoffs = this.handoffHistory.filter(h => 
      Date.now() - h.endTime < 300000 // Last 5 minutes
    );

    if (recentHandoffs.length === 0) {
      return;
    }

    const failedHandoffs = recentHandoffs.filter(h => !h.success);
    const averageDuration = recentHandoffs.reduce((sum, h) => sum + h.duration, 0) / recentHandoffs.length;

    // Alert on high failure rate
    if (failedHandoffs.length / recentHandoffs.length > 0.2) {
      this.debug.warn('HandoffMonitor', `🚨 High handoff failure rate: ${failedHandoffs.length}/${recentHandoffs.length}`);
    }

    // Alert on slow handoffs
    if (averageDuration > 30000) { // 30 seconds
      this.debug.warn('HandoffMonitor', `🐌 Slow handoff performance: ${Math.round(averageDuration)}ms average`);
    }

    this.debug.info('HandoffMonitor', `📊 Health check complete`, {
      recentHandoffs: recentHandoffs.length,
      failedHandoffs: failedHandoffs.length,
      averageDuration: Math.round(averageDuration),
      successRate: Math.round((1 - failedHandoffs.length / recentHandoffs.length) * 100)
    });
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private generateHandoffId(sourceAgent: string, targetAgent: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `handoff_${sourceAgent}_${targetAgent}_${timestamp}_${random}`;
  }

  private calculateChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  private async initializeMonitoring(): Promise<void> {
    try {
      const logsDir = path.join(this.campaignPath, 'logs');
      await fs.mkdir(logsDir, { recursive: true });
      
      const handoffDir = path.join(logsDir, 'handoffs');
      await fs.mkdir(handoffDir, { recursive: true });

      this.debug.info('HandoffMonitor', `📁 Monitoring initialized`, {
        campaignPath: this.campaignPath,
        logsDir,
        handoffDir
      });
    } catch (error) {
      this.debug.error('HandoffMonitor', `❌ Failed to initialize monitoring`, {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // ============================================================================
  // INTEGRATION METHODS
  // ============================================================================

  async exportMetricsToFile(filePath: string): Promise<void> {
    const exportData = {
      exportedAt: new Date().toISOString(),
      campaignPath: this.campaignPath,
      handoffHistory: this.handoffHistory,
      summary: await this.generateHandoffSummary(
        path.basename(this.campaignPath)
      )
    };

    await fs.writeFile(filePath, JSON.stringify(exportData, null, 2));
    
    this.debug.info('HandoffMonitor', `📤 Metrics exported`, {
      filePath,
      handoffCount: this.handoffHistory.length
    });
  }

  async importMetricsFromFile(filePath: string): Promise<void> {
    try {
      const importData = JSON.parse(await fs.readFile(filePath, 'utf8'));
      
      if (importData.handoffHistory && Array.isArray(importData.handoffHistory)) {
        this.handoffHistory.push(...importData.handoffHistory);
        
        this.debug.info('HandoffMonitor', `📥 Metrics imported`, {
          filePath,
          importedHandoffs: importData.handoffHistory.length
        });
      }
    } catch (error) {
      this.debug.error('HandoffMonitor', `❌ Failed to import metrics`, {
        filePath,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // ============================================================================
  // CLEANUP METHODS
  // ============================================================================

  async cleanup(): Promise<void> {
    await this.generateHandoffSummary(path.basename(this.campaignPath));
    
    this.debug.info('HandoffMonitor', `🧹 Monitoring cleanup complete`, {
      totalHandoffs: this.handoffHistory.length,
      campaignPath: this.campaignPath
    });
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createHandoffMonitor(campaignPath: string, logger: AgentLogger): HandoffMonitor {
  return new HandoffMonitor(campaignPath, logger);
}

// ============================================================================
// GLOBAL MONITORING REGISTRY
// ============================================================================

const monitorRegistry = new Map<string, HandoffMonitor>();

export function getHandoffMonitor(campaignPath: string, logger: AgentLogger): HandoffMonitor {
  if (!monitorRegistry.has(campaignPath)) {
    monitorRegistry.set(campaignPath, createHandoffMonitor(campaignPath, logger));
  }
  return monitorRegistry.get(campaignPath)!;
}

export function clearMonitorRegistry(): void {
  monitorRegistry.clear();
}