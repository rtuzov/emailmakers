import { UltraThinkConfig, ContextEnrichment, ValidationResult, ToolSequence } from './types';
import { EmailGenerationRequest } from '../agent';
import { RouteValidator } from './route-validator';
import { DateValidator } from './date-validator';
import { ToolSequencer } from './tool-sequencer';
import { SmartErrorHandler } from './smart-error-handler';
import { SimpleDataProvider } from './simple-data-provider';
import { ContextEnricher } from './context-enricher';

export class UltraThinkEngine {
  private config: UltraThinkConfig;
  private executionHistory: Array<{
    step: string;
    success: boolean;
    duration: number;
    error?: any;
    timestamp: number;
  }> = [];

  constructor(config: Partial<UltraThinkConfig> = {}) {
    this.config = {
      enableValidation: true,
      enableContextEnrichment: true,
      enableSmartSequencing: true,
      enableErrorIntelligence: true,
      fallbackToUnsplash: true,
      debugMode: false,
      ...config
    };

    if (this.config.debugMode) {
      console.log('🧠 UltraThink Engine initialized with config:', this.config);
    }
  }

  /**
   * Main orchestration method - enhances request with intelligence
   */
  async enhanceRequest(request: EmailGenerationRequest): Promise<{
    validatedRequest: EmailGenerationRequest;
    enrichedContext: ContextEnrichment;
    optimizedSequence: ToolSequence;
    validationResult: ValidationResult;
  }> {
    const startTime = Date.now();
    
    if (this.config.debugMode) {
      console.log('🚀 UltraThink: Starting request enhancement');
    }

    try {
      // Step 1: Validate and correct request
      let validationResult: ValidationResult = { valid: true, issues: [], suggestions: [] };
      let validatedRequest = request;

      if (this.config.enableValidation) {
        validationResult = await ContextEnricher.validateAndCorrect(request);
        validatedRequest = validationResult.correctedRequest || request;
        
        if (this.config.debugMode && validationResult.issues.length > 0) {
          console.log('🔍 UltraThink: Validation issues found:', validationResult.issues.length);
        }
      }

      // Step 2: Enrich context
      let enrichedContext: ContextEnrichment = {
        seasonal: SimpleDataProvider.getSeasonalContext(new Date()),
        holidays: false,
        routePopularity: 'medium',
        timezoneDiff: 0,
        suggestions: [],
        warnings: []
      };

      if (this.config.enableContextEnrichment) {
        enrichedContext = await ContextEnricher.enrichContext(validatedRequest);
        
        if (this.config.debugMode) {
          console.log('🧠 UltraThink: Context enriched -', ContextEnricher.getEnrichmentSummary(enrichedContext));
        }
      }

      // Step 3: Optimize tool sequence
      let optimizedSequence: ToolSequence;
      
      if (this.config.enableSmartSequencing) {
        optimizedSequence = ToolSequencer.optimizeSequence(validatedRequest);
        
        if (this.config.debugMode) {
          const stats = ToolSequencer.getSequenceStats(optimizedSequence);
          console.log('⚡ UltraThink: Sequence optimized -', stats);
        }
      } else {
        // Fallback to basic sequence
        optimizedSequence = this.createBasicSequence();
      }

      const duration = Date.now() - startTime;
      
      if (this.config.debugMode) {
        console.log(`✅ UltraThink: Enhancement completed in ${duration}ms`);
      }

      return {
        validatedRequest,
        enrichedContext,
        optimizedSequence,
        validationResult
      };

    } catch (error) {
      console.error('❌ UltraThink: Enhancement failed:', error);
      
      // Return safe fallback
      return {
        validatedRequest: request,
        enrichedContext: {
          seasonal: SimpleDataProvider.getSeasonalContext(new Date()),
          holidays: false,
          routePopularity: 'medium',
          timezoneDiff: 0,
          suggestions: ['UltraThink enhancement failed - using basic mode'],
          warnings: ['Limited intelligence available']
        },
        optimizedSequence: this.createBasicSequence(),
        validationResult: { valid: true, issues: [], suggestions: [] }
      };
    }
  }

  /**
   * Handle errors intelligently during execution
   */
  async handleExecutionError(
    error: any, 
    tool: string, 
    attempt: number, 
    context?: any
  ): Promise<{
    strategy: any;
    shouldContinue: boolean;
    nextSteps: string[];
  }> {
    // Record error in history
    this.executionHistory.push({
      step: tool,
      success: false,
      duration: 0,
      error,
      timestamp: Date.now()
    });

    if (!this.config.enableErrorIntelligence) {
      return {
        strategy: { action: 'standard_retry', delay: 1000 },
        shouldContinue: true,
        nextSteps: []
      };
    }

    try {
      const strategy = await SmartErrorHandler.handleError(error, tool, attempt, context);
      
      if (this.config.debugMode) {
        console.log(`🔧 UltraThink: Error strategy for ${tool}:`, strategy.action);
      }

      // Determine if execution should continue
      const shouldContinue = this.shouldContinueExecution(tool, strategy, attempt);
      
      // Get next steps if continuing
      const nextSteps = shouldContinue ? this.getRecoverySteps(tool, strategy) : [];

      return {
        strategy,
        shouldContinue,
        nextSteps
      };

    } catch (handlerError) {
      console.error('❌ UltraThink: Error handler failed:', handlerError);
      
      return {
        strategy: { action: 'skip' },
        shouldContinue: true,
        nextSteps: []
      };
    }
  }

  /**
   * Record successful execution step
   */
  recordSuccess(tool: string, duration: number): void {
    this.executionHistory.push({
      step: tool,
      success: true,
      duration,
      timestamp: Date.now()
    });

    if (this.config.debugMode) {
      console.log(`✅ UltraThink: ${tool} completed successfully in ${duration}ms`);
    }
  }

  /**
   * Get execution analytics
   */
  getExecutionAnalytics(): {
    totalSteps: number;
    successfulSteps: number;
    failedSteps: number;
    totalDuration: number;
    averageStepDuration: number;
    errorRate: number;
    mostProblematicTool?: string;
  } {
    const totalSteps = this.executionHistory.length;
    const successfulSteps = this.executionHistory.filter(h => h.success).length;
    const failedSteps = totalSteps - successfulSteps;
    const totalDuration = this.executionHistory.reduce((sum, h) => sum + h.duration, 0);
    const averageStepDuration = totalSteps > 0 ? totalDuration / totalSteps : 0;
    const errorRate = totalSteps > 0 ? failedSteps / totalSteps : 0;

    // Find most problematic tool
    const errorsByTool: Record<string, number> = {};
    this.executionHistory.filter(h => !h.success).forEach(h => {
      errorsByTool[h.step] = (errorsByTool[h.step] || 0) + 1;
    });

    const mostProblematicTool = Object.entries(errorsByTool)
      .sort(([,a], [,b]) => b - a)[0]?.[0];

    return {
      totalSteps,
      successfulSteps,
      failedSteps,
      totalDuration,
      averageStepDuration,
      errorRate,
      mostProblematicTool
    };
  }

  /**
   * Generate enhanced prompt with context
   */
  formatEnhancedPrompt(
    originalPrompt: string, 
    enrichedContext: ContextEnrichment
  ): string {
    if (!this.config.enableContextEnrichment) {
      return originalPrompt;
    }

    const contextSection = ContextEnricher.formatForPrompt(enrichedContext);
    
    return `${originalPrompt}

ДОПОЛНИТЕЛЬНЫЙ КОНТЕКСТ:
${contextSection}

Используйте этот контекст для создания более релевантного и персонализированного контента.`;
  }

  /**
   * Get prevention suggestions based on execution history
   */
  getPreventionSuggestions(): string[] {
    const recentErrors = this.executionHistory
      .filter(h => !h.success && Date.now() - h.timestamp < 3600000) // Last hour
      .reduce((acc, h) => {
        acc[h.step] = acc[h.step] || [];
        acc[h.step].push({ error: h.error, timestamp: h.timestamp });
        return acc;
      }, {} as Record<string, Array<{ error: any; timestamp: number }>>);

    const suggestions: string[] = [];
    
    for (const [tool, errors] of Object.entries(recentErrors)) {
      const toolSuggestions = SmartErrorHandler.generatePreventionSuggestions(tool, errors);
      suggestions.push(...toolSuggestions);
    }

    return suggestions;
  }

  /**
   * Reset execution history (for new generation)
   */
  resetExecutionHistory(): void {
    this.executionHistory = [];
    SmartErrorHandler.resetRateLimitTracking();
    
    if (this.config.debugMode) {
      console.log('🔄 UltraThink: Execution history reset');
    }
  }

  /**
   * Private helper methods
   */
  private createBasicSequence(): ToolSequence {
    return {
      steps: [
        { tool: 'get_current_date', priority: 1 },
        { tool: 'get_prices', priority: 2 },
        { tool: 'get_figma_assets', priority: 3 },
        { tool: 'generate_copy', priority: 4 },
        { tool: 'render_mjml', priority: 5 },
        { tool: 'upload_s3', priority: 6 }
      ],
      estimatedDuration: 30,
      strategy: 'balanced'
    };
  }

  private shouldContinueExecution(tool: string, strategy: any, attempt: number): boolean {
    // Critical tools should retry more aggressively
    const criticalTools = ['get_current_date', 'generate_copy', 'render_mjml'];
    
    if (strategy.action === 'skip' && criticalTools.includes(tool)) {
      return attempt < 3; // Allow more retries for critical tools
    }

    if (strategy.action === 'fallback' || strategy.action === 'skip') {
      return true; // Continue with fallback or skip
    }

    return strategy.action !== 'stop';
  }

  private getRecoverySteps(tool: string, strategy: any): string[] {
    const steps: string[] = [];

    if (strategy.action === 'fallback' && strategy.fallback) {
      steps.push(`Execute fallback: ${strategy.fallback}`);
    }

    if (strategy.modification) {
      steps.push(`Apply modification: ${strategy.modification}`);
    }

    if (strategy.action === 'wait' && strategy.delay) {
      steps.push(`Wait ${strategy.delay}ms before retry`);
    }

    return steps;
  }

  /**
   * Static factory methods
   */
  static createSpeedOptimized(): UltraThinkEngine {
    return new UltraThinkEngine({
      enableValidation: true,
      enableContextEnrichment: false, // Skip for speed
      enableSmartSequencing: true,
      enableErrorIntelligence: false, // Skip for speed
      fallbackToUnsplash: true,
      debugMode: false
    });
  }

  static createQualityOptimized(): UltraThinkEngine {
    return new UltraThinkEngine({
      enableValidation: true,
      enableContextEnrichment: true,
      enableSmartSequencing: true,
      enableErrorIntelligence: true,
      fallbackToUnsplash: true,
      debugMode: false
    });
  }

  static createDebugMode(): UltraThinkEngine {
    return new UltraThinkEngine({
      enableValidation: true,
      enableContextEnrichment: true,
      enableSmartSequencing: true,
      enableErrorIntelligence: true,
      fallbackToUnsplash: true,
      debugMode: true
    });
  }
}