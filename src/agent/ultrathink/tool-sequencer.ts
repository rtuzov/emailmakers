import { ToolSequence, ToolStep } from './types';
import { EmailGenerationRequest } from '../agent';

export class ToolSequencer {
  
  /**
   * Optimize tool execution sequence based on request context
   */
  static optimizeSequence(request: EmailGenerationRequest): ToolSequence {
    const strategy = this.determineStrategy(request);
    const steps = this.buildSequence(request, strategy);
    const estimatedDuration = this.estimateDuration(steps, strategy);

    return {
      steps,
      estimatedDuration,
      strategy
    };
  }

  /**
   * Determine optimal strategy based on request characteristics
   */
  private static determineStrategy(request: EmailGenerationRequest): 'speed' | 'quality' | 'balanced' {
    // Speed strategy: when we have all required data
    if (request.origin && request.destination && request.date_range) {
      return 'speed';
    }

    // Quality strategy: for complex campaigns or missing data
    if (request.campaign_type === 'seasonal' || !request.origin || !request.destination) {
      return 'quality';
    }

    // Balanced strategy: default case
    return 'balanced';
  }

  /**
   * Build optimized tool sequence
   */
  private static buildSequence(request: EmailGenerationRequest, strategy: 'speed' | 'quality' | 'balanced'): ToolStep[] {
    const steps: ToolStep[] = [];

    // Step 1: Always start with current date for temporal context
    steps.push({
      tool: 'get_current_date',
      priority: 1,
      condition: 'always'
    });

    // Determine path based on available information
    if (request.origin && request.destination) {
      // Fast path: we have route information
      this.addFastPathSteps(steps, strategy);
    } else {
      // Analysis path: need to extract route from topic
      this.addAnalysisPathSteps(steps, strategy);
    }

    // Add quality assurance steps based on strategy
    this.addQualitySteps(steps, strategy);

    // Add finalization steps
    this.addFinalizationSteps(steps, strategy);

    return steps;
  }

  /**
   * Add steps for fast path (when route is known)
   */
  private static addFastPathSteps(steps: ToolStep[], strategy: 'speed' | 'quality' | 'balanced'): void {
    if (strategy === 'speed') {
      // Parallel execution for speed
      steps.push(
        {
          tool: 'get_prices',
          priority: 2,
          parallel: true,
          fallback: 'use_estimated_prices'
        },
        {
          tool: 'get_figma_assets',
          priority: 2,
          parallel: true,
          fallback: 'use_unsplash_fallback'
        }
      );
    } else {
      // Sequential execution for reliability
      steps.push(
        {
          tool: 'get_prices',
          priority: 2,
          fallback: 'use_estimated_prices'
        },
        {
          tool: 'get_figma_assets',
          priority: 3,
          fallback: 'use_unsplash_fallback'
        }
      );
    }

    // Content generation (depends on prices and assets)
    steps.push({
      tool: 'generate_copy',
      priority: strategy === 'speed' ? 3 : 4,
      condition: 'has_prices_or_fallback'
    });

    // MJML rendering
    steps.push({
      tool: 'render_mjml',
      priority: strategy === 'speed' ? 4 : 5,
      condition: 'has_content_and_assets'
    });
  }

  /**
   * Add steps for analysis path (when route needs to be extracted)
   */
  private static addAnalysisPathSteps(steps: ToolStep[], strategy: 'speed' | 'quality' | 'balanced'): void {
    // Topic analysis to extract route information
    steps.push({
      tool: 'analyze_topic',
      priority: 2,
      condition: 'missing_route_info'
    });

    // Then follow standard path
    steps.push(
      {
        tool: 'get_prices',
        priority: 3,
        fallback: 'use_estimated_prices'
      },
      {
        tool: 'get_figma_assets',
        priority: strategy === 'balanced' ? 3 : 4,
        parallel: strategy === 'speed',
        fallback: 'use_unsplash_fallback'
      },
      {
        tool: 'generate_copy',
        priority: 4,
        condition: 'has_prices_or_fallback'
      },
      {
        tool: 'render_mjml',
        priority: 5,
        condition: 'has_content_and_assets'
      }
    );
  }

  /**
   * Add quality assurance steps
   */
  private static addQualitySteps(steps: ToolStep[], strategy: 'speed' | 'quality' | 'balanced'): void {
    const basePriority = this.getLastPriority(steps) + 1;

    if (strategy === 'quality') {
      // Full quality pipeline
      steps.push(
        {
          tool: 'diff_html',
          priority: basePriority,
          condition: 'has_html'
        },
        {
          tool: 'patch_html',
          priority: basePriority + 1,
          condition: 'diff_issues_detected'
        },
        {
          tool: 'percy_snap',
          priority: basePriority + 2,
          condition: 'has_html',
          fallback: 'skip_visual_testing'
        },
        {
          tool: 'render_test',
          priority: basePriority + 3,
          condition: 'has_html',
          fallback: 'skip_render_testing'
        }
      );
    } else if (strategy === 'balanced') {
      // Essential quality checks
      steps.push(
        {
          tool: 'diff_html',
          priority: basePriority,
          condition: 'has_html'
        },
        {
          tool: 'patch_html',
          priority: basePriority + 1,
          condition: 'diff_issues_detected'
        },
        {
          tool: 'render_test',
          priority: basePriority + 2,
          condition: 'has_html',
          fallback: 'skip_render_testing'
        }
      );
    } else {
      // Speed: minimal quality checks
      steps.push({
        tool: 'diff_html',
        priority: basePriority,
        condition: 'has_html'
      });
    }
  }

  /**
   * Add finalization steps
   */
  private static addFinalizationSteps(steps: ToolStep[], strategy: 'speed' | 'quality' | 'balanced'): void {
    const basePriority = this.getLastPriority(steps) + 1;

    steps.push({
      tool: 'upload_s3',
      priority: basePriority,
      condition: 'has_final_html'
    });
  }

  /**
   * Get the highest priority from existing steps
   */
  private static getLastPriority(steps: ToolStep[]): number {
    return Math.max(...steps.map(step => step.priority), 0);
  }

  /**
   * Estimate total execution duration
   */
  private static estimateDuration(steps: ToolStep[], strategy: 'speed' | 'quality' | 'balanced'): number {
    // Base duration estimates per tool (in seconds)
    const toolDurations: Record<string, number> = {
      'get_current_date': 1,
      'analyze_topic': 3,
      'get_prices': 5,
      'get_figma_assets': 4,
      'generate_copy': 8,
      'render_mjml': 3,
      'diff_html': 2,
      'patch_html': 5,
      'percy_snap': 6,
      'render_test': 8,
      'upload_s3': 3
    };

    let totalDuration = 0;
    const parallelGroups: Record<number, ToolStep[]> = {};

    // Group steps by priority (parallel execution)
    for (const step of steps) {
      if (!parallelGroups[step.priority]) {
        parallelGroups[step.priority] = [];
      }
      parallelGroups[step.priority].push(step);
    }

    // Calculate duration for each priority group
    for (const [priority, groupSteps] of Object.entries(parallelGroups)) {
      const groupDurations = groupSteps.map(step => toolDurations[step.tool] || 5);
      
      // If any step in the group is parallel, take max; otherwise, sum
      const hasParallel = groupSteps.some(step => step.parallel);
      const groupDuration = hasParallel ? Math.max(...groupDurations) : groupDurations.reduce((a, b) => a + b, 0);
      
      totalDuration += groupDuration;
    }

    // Apply strategy multipliers
    const strategyMultipliers = {
      'speed': 0.8,    // Optimistic timing
      'balanced': 1.0, // Standard timing
      'quality': 1.3   // Conservative timing with extra checks
    };

    return Math.round(totalDuration * strategyMultipliers[strategy]);
  }

  /**
   * Adjust sequence based on runtime conditions
   */
  static adjustSequence(
    originalSequence: ToolSequence, 
    completedSteps: string[], 
    failedSteps: string[], 
    currentContext: any
  ): ToolSequence {
    const adjustedSteps = originalSequence.steps.filter(step => {
      // Remove completed steps
      if (completedSteps.includes(step.tool)) {
        return false;
      }

      // Remove steps that depend on failed steps without fallbacks
      if (this.dependsOnFailedStep(step, failedSteps)) {
        return false;
      }

      // Check if condition is still met
      if (!this.evaluateCondition(step.condition, currentContext)) {
        return false;
      }

      return true;
    });

    // Recalculate priorities
    this.recalculatePriorities(adjustedSteps);

    return {
      steps: adjustedSteps,
      estimatedDuration: this.estimateDuration(adjustedSteps, originalSequence.strategy),
      strategy: originalSequence.strategy
    };
  }

  /**
   * Check if step depends on a failed step
   */
  private static dependsOnFailedStep(step: ToolStep, failedSteps: string[]): boolean {
    const dependencies: Record<string, string[]> = {
      'generate_copy': ['get_prices'],
      'render_mjml': ['generate_copy', 'get_figma_assets'],
      'diff_html': ['render_mjml'],
      'patch_html': ['diff_html'],
      'percy_snap': ['render_mjml'],
      'render_test': ['render_mjml'],
      'upload_s3': ['render_mjml']
    };

    const stepDependencies = dependencies[step.tool] || [];
    return stepDependencies.some(dep => failedSteps.includes(dep)) && !step.fallback;
  }

  /**
   * Evaluate if a condition is met
   */
  private static evaluateCondition(condition: string | undefined, context: any): boolean {
    if (!condition || condition === 'always') {
      return true;
    }

    switch (condition) {
      case 'missing_route_info':
        return !context.origin || !context.destination;
      
      case 'has_prices_or_fallback':
        return context.prices || context.fallbackPrices;
      
      case 'has_content_and_assets':
        return context.content && (context.assets || context.fallbackAssets);
      
      case 'has_html':
        return context.html;
      
      case 'diff_issues_detected':
        return context.diffResult && context.diffResult.critical_changes.length > 0;
      
      case 'has_final_html':
        return context.finalHtml || context.html;
      
      default:
        return true;
    }
  }

  /**
   * Recalculate step priorities after filtering
   */
  private static recalculatePriorities(steps: ToolStep[]): void {
    const priorityGroups = new Map<number, ToolStep[]>();
    
    // Group by original priority
    for (const step of steps) {
      if (!priorityGroups.has(step.priority)) {
        priorityGroups.set(step.priority, []);
      }
      priorityGroups.get(step.priority)!.push(step);
    }

    // Reassign sequential priorities
    let newPriority = 1;
    for (const [originalPriority, groupSteps] of Array.from(priorityGroups.entries()).sort((a, b) => a[0] - b[0])) {
      for (const step of groupSteps) {
        step.priority = newPriority;
      }
      newPriority++;
    }
  }

  /**
   * Get next steps ready for execution
   */
  static getNextSteps(sequence: ToolSequence, completedSteps: string[]): ToolStep[] {
    const remainingSteps = sequence.steps.filter(step => !completedSteps.includes(step.tool));
    
    if (remainingSteps.length === 0) {
      return [];
    }

    // Find the lowest priority among remaining steps
    const nextPriority = Math.min(...remainingSteps.map(step => step.priority));
    
    // Return all steps with that priority (can be executed in parallel)
    return remainingSteps.filter(step => step.priority === nextPriority);
  }

  /**
   * Get sequence statistics
   */
  static getSequenceStats(sequence: ToolSequence): {
    totalSteps: number;
    parallelSteps: number;
    sequentialSteps: number;
    hasFallbacks: number;
    estimatedDuration: number;
  } {
    const totalSteps = sequence.steps.length;
    const parallelSteps = sequence.steps.filter(step => step.parallel).length;
    const hasFallbacks = sequence.steps.filter(step => step.fallback).length;

    return {
      totalSteps,
      parallelSteps,
      sequentialSteps: totalSteps - parallelSteps,
      hasFallbacks,
      estimatedDuration: sequence.estimatedDuration
    };
  }
}