/**
 * ⚡ OPTIMIZATION SERVICE
 * 
 * Handles output optimization, hybrid rendering, and performance enhancements
 * Extracted from consolidated email-renderer.ts for modular architecture
 */

import { 
  EmailRendererParams, 
  EmailRendererResult, 
  ServiceExecutionContext,
  HybridConfig,
  HybridRenderingPipeline,
  HybridRenderingStage,
  // OptimizationContext,
  OptimizationResult
  // EmailClient // Currently unused
} from '../types/email-renderer-types';

export class OptimizationService {
  
  /**
   * Handle output optimization
   */
  async handleOutputOptimization(context: ServiceExecutionContext): Promise<EmailRendererResult> {
    const { params, start_time } = context;
    
    try {
      console.log('⚡ Optimization Service: Starting output optimization');
      
      // Validate optimization parameters
      this.validateOptimizationParams(params);
      
      // Perform comprehensive optimization
      const optimizationResult = await this.performComprehensiveOptimization(params);
      
      // Apply performance enhancements
      const enhancedResult = await this.applyPerformanceEnhancements(optimizationResult, params);
      
      // Calculate optimization metrics
      const metrics = this.calculateOptimizationMetrics(enhancedResult, params);
      
      // Calculate analytics
      const analytics = this.calculateOptimizationAnalytics(start_time, enhancedResult, params);
      
      return {
        success: true,
        action: 'optimize_output',
        data: {
          html: enhancedResult.optimized_html,
          ...(enhancedResult.optimized_mjml && { mjml: enhancedResult.optimized_mjml }),
          ...(enhancedResult.text_version && { text_version: enhancedResult.text_version }),
          ...(enhancedResult.amp_version && { amp_version: enhancedResult.amp_version }),
          rendering_stats: {
            optimizations_performed: enhancedResult.optimizations_applied.length,
            size_reduction_percent: enhancedResult.performance_improvements.size_reduction_percent,
            load_time_improvement: enhancedResult.performance_improvements.load_time_improvement_ms
          }
        },
        rendering_metadata: {
          template_type: 'optimized',
          rendering_engine: 'optimization-engine',
          optimizations_applied: enhancedResult.optimizations_applied,
          client_compatibility: this.getClientCompatibility(enhancedResult),
          file_size: Buffer.byteLength(enhancedResult.optimized_html, 'utf8'),
          load_time_estimate: metrics.estimated_load_time
        },
        analytics,
        recommendations: enhancedResult.warnings
      };
      
    } catch (error) {
      console.error('❌ Optimization Service error:', error);
      
      return {
        success: false,
        action: 'optimize_output',
        error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown optimization error',
        analytics: {
          execution_time: Date.now() - start_time,
          rendering_complexity: 0,
          cache_efficiency: 0,
          components_rendered: 0,
          optimizations_performed: 0
        }
      };
    }
  }
  
  /**
   * Handle hybrid rendering
   */
  async handleHybridRendering(context: ServiceExecutionContext): Promise<EmailRendererResult> {
    const { params, start_time } = context;
    
    try {
      console.log('🔄 Hybrid Rendering Service: Starting hybrid rendering');
      
      // Validate hybrid configuration
      this.validateHybridConfig(params.hybrid_config);
      
      // Execute hybrid rendering pipeline
      const pipeline = await this.executeHybridPipeline(params);
      
      // Apply hybrid optimizations
      const optimizedResult = await this.applyHybridOptimizations(pipeline.final_output, params);
      
      // Calculate analytics
      const analytics = this.calculateHybridAnalytics(start_time, pipeline, params);
      
      return {
        success: true,
        action: 'render_hybrid',
        data: {
          html: optimizedResult.html,
          mjml: optimizedResult.mjml,
          text_version: optimizedResult.text_version,
          rendering_stats: {
            stages_executed: pipeline.stages.length,
            total_execution_time: pipeline.total_execution_time_ms,
            optimizations_applied: pipeline.pipeline_metadata.optimizations_applied.length
          }
        },
        rendering_metadata: {
          template_type: 'hybrid',
          rendering_engine: 'hybrid-pipeline',
          optimizations_applied: pipeline.pipeline_metadata.optimizations_applied,
          client_compatibility: ['gmail', 'outlook', 'apple_mail', 'yahoo'],
          file_size: Buffer.byteLength(optimizedResult.html ?? '', 'utf8'),
          load_time_estimate: this.calculateHybridLoadTime(optimizedResult.html ?? '')
        },
        analytics,
        recommendations: this.generateHybridRecommendations(pipeline)
      };
      
    } catch (error) {
      console.error('❌ Hybrid Rendering Service error:', error);
      
      return {
        success: false,
        action: 'render_hybrid',
        error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown hybrid rendering error',
        analytics: {
          execution_time: Date.now() - start_time,
          rendering_complexity: 0,
          cache_efficiency: 0,
          components_rendered: 0,
          optimizations_performed: 0
        }
      };
    }
  }
  
  // ============================================================================
  // OPTIMIZATION METHODS
  // ============================================================================
  
  /**
   * Validate optimization parameters
   */
  private validateOptimizationParams(params: EmailRendererParams): void {
    if (!params.content_data && !params.mjml_content) {
      throw new Error('Either content_data or mjml_content is required for optimization');
    }
  }
  
  /**
   * Perform comprehensive optimization
   */
  private async performComprehensiveOptimization(params: EmailRendererParams): Promise<OptimizationResult> {
    console.log('🔧 Performing comprehensive optimization...');
    
    // Get base HTML content
    const baseHtml = await this.getBaseHtmlContent(params);
    
    // Get MJML content from params
    const baseMjml = params.mjml_content || '';
    
    if (!baseMjml) {
      console.warn('⚠️ No MJML content found, using HTML for optimization');
    }
    
    // Create optimization context
    /*
    const _optimizationContext: OptimizationContext = {
      html_content: baseHtml,
      mjml_content: baseMjml,
      target_clients: this.getTargetClients(params),
      performance_targets: {
        max_size_kb: 100,
        max_load_time_ms: 3000,
        min_accessibility_score: 80
      }
    };
    */
    
    // Apply optimization stages
    let optimizedHtml = baseHtml;
    let optimizedMjml = baseMjml;
    const optimizationsApplied: string[] = [];
    const warnings: string[] = [];
    
    // Stage 1: CSS Optimization
    if (params.rendering_options?.inline_css) {
      optimizedHtml = await this.inlineCSS(optimizedHtml);
      optimizationsApplied.push('css_inlined');
    }
    
    // Stage 2: HTML Minification
    if (params.rendering_options?.minify_output) {
      optimizedHtml = this.minifyHTML(optimizedHtml);
      optimizationsApplied.push('html_minified');
    }
    
    // Stage 3: Client-specific optimizations
    if (params.rendering_options?.email_client_optimization !== 'universal') {
      optimizedHtml = await this.optimizeForClient(
        optimizedHtml, 
        params.rendering_options?.email_client_optimization ?? 'gmail'
      );
      optimizationsApplied.push('client_optimized');
    }
    
    // Stage 4: Accessibility improvements
    if (params.rendering_options?.accessibility_compliance) {
      optimizedHtml = await this.improveAccessibility(optimizedHtml);
      optimizationsApplied.push('accessibility_improved');
    }
    
    // Stage 5: Performance optimizations
    if (params.performance_config?.image_optimization) {
      optimizedHtml = await this.optimizeImages(optimizedHtml);
      optimizationsApplied.push('images_optimized');
    }
    
    // Calculate performance improvements
    const originalSize = Buffer.byteLength(baseHtml, 'utf8');
    const optimizedSize = Buffer.byteLength(optimizedHtml, 'utf8');
    const sizeReduction = ((originalSize - optimizedSize) / originalSize) * 100;
    
    return {
      optimized_html: optimizedHtml,
      optimized_mjml: optimizedMjml,
      optimizations_applied: optimizationsApplied,
      performance_improvements: {
        size_reduction_percent: Math.max(0, sizeReduction),
        load_time_improvement_ms: Math.round(sizeReduction * 10),
        accessibility_score_improvement: params.rendering_options?.accessibility_compliance ? 15 : 0
      },
      warnings
    };
  }
  
  /**
   * Apply performance enhancements
   */
  private async applyPerformanceEnhancements(result: OptimizationResult, params: EmailRendererParams): Promise<OptimizationResult> {
    let enhancedHtml = result.optimized_html;
    const additionalOptimizations: string[] = [];
    
    // Apply caching optimizations
    if (params.performance_config?.cache_strategy === 'aggressive') {
      enhancedHtml = await this.applyCachingOptimizations(enhancedHtml);
      additionalOptimizations.push('caching_optimized');
    }
    
    // Apply lazy loading
    if (params.performance_config?.lazy_loading) {
      enhancedHtml = await this.applyLazyLoading(enhancedHtml);
      additionalOptimizations.push('lazy_loading_applied');
    }
    
    // Generate alternative formats
    const textVersion = this.generateTextVersion(enhancedHtml);
    const enhancedResult: OptimizationResult = {
      ...result,
      optimized_html: enhancedHtml,
      text_version: textVersion,
      optimizations_applied: [...result.optimizations_applied, ...additionalOptimizations]
    };
    
    // Add amp_version only if it exists
    if (params.rendering_options?.output_format === 'amp') {
      const ampVersion = await this.generateAmpVersion(enhancedHtml);
      (enhancedResult as any).amp_version = ampVersion;
    }
    
    return enhancedResult;
  }
  
  /**
   * Calculate optimization metrics
   */
  private calculateOptimizationMetrics(result: OptimizationResult, _params: EmailRendererParams) {
    const htmlSize = Buffer.byteLength(result.optimized_html, 'utf8');
    const estimatedLoadTime = this.calculateLoadTime(result.optimized_html);
    
    return {
      file_size_bytes: htmlSize,
      file_size_kb: htmlSize / 1024,
      estimated_load_time: estimatedLoadTime,
      optimization_score: this.calculateOptimizationScore(result),
      client_compatibility_score: this.calculateClientCompatibilityScore(result.optimized_html)
    };
  }
  
  // ============================================================================
  // HYBRID RENDERING METHODS
  // ============================================================================
  
  /**
   * Validate hybrid configuration
   */
  private validateHybridConfig(config?: HybridConfig): void {
    if (!config) {
      throw new Error('hybrid_config is required for hybrid rendering');
    }
    
    if (!config.base_template) {
      throw new Error('base_template is required in hybrid_config');
    }
    
    if (!config.enhancements || config.enhancements.length === 0) {
      throw new Error('At least one enhancement is required in hybrid_config');
    }
  }
  
  /**
   * Execute hybrid rendering pipeline
   */
  private async executeHybridPipeline(_params: EmailRendererParams): Promise<HybridRenderingPipeline> {
    const config = _params.hybrid_config!;
    const stages: HybridRenderingStage[] = [];
    const startTime = Date.now();
    
    // Stage 1: Base template rendering
    const baseStage = await this.executeBaseTemplateStage(config.base_template, _params);
    stages.push(baseStage);
    
    let currentData = baseStage.output_data;
    
    // Stage 2: Apply enhancements in order
    const enhancementOrder = (config.priority_order && config.priority_order.length > 0) ? 
      config.priority_order : (config.enhancements ?? []);
    
    for (const enhancement of enhancementOrder) {
      if (this.isValidEnhancement(enhancement) && config.enhancements && config.enhancements.includes(enhancement as any)) {
        const enhancementStage = await this.executeEnhancementStage(enhancement, currentData, _params);
        stages.push(enhancementStage);
        
        if (enhancementStage.success) {
          currentData = enhancementStage.output_data;
        }
      }
    }
    
    const totalExecutionTime = Date.now() - startTime;
    
    return {
      stages,
      total_execution_time_ms: totalExecutionTime,
      final_output: currentData,
      pipeline_metadata: {
        stages_executed: stages.length,
        stages_failed: stages.filter(s => !s.success).length,
        optimizations_applied: this.extractPipelineOptimizations(stages)
      }
    };
  }
  
  /**
   * Execute base template stage
   */
  private async executeBaseTemplateStage(baseTemplate: string, _params: EmailRendererParams): Promise<HybridRenderingStage> {
    const stageStartTime = Date.now();
    
    try {
      let outputData: any;
      
      switch (baseTemplate) {
        case 'mjml':
          outputData = await this.renderMjmlBase(_params);
          break;
        case 'react':
          outputData = await this.renderReactBase(_params);
          break;
        case 'advanced':
          outputData = await this.renderAdvancedBase(_params);
          break;
        case 'seasonal':
          outputData = await this.renderSeasonalBase(_params);
          break;
        default:
          throw new Error(`Unknown base template: ${baseTemplate}`);
      }
      
      return {
        stage_name: `base_${baseTemplate}`,
        engine: this.getEngineForTemplate(baseTemplate),
        input_data: _params,
        output_data: outputData,
        execution_time_ms: Date.now() - stageStartTime,
        success: true
      };
      
    } catch (error) {
      return {
        stage_name: `base_${baseTemplate}`,
        engine: this.getEngineForTemplate(baseTemplate),
        input_data: _params,
        execution_time_ms: Date.now() - stageStartTime,
        success: false,
        error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error'
      };
    }
  }
  
  /**
   * Execute enhancement stage
   */
  private async executeEnhancementStage(enhancement: 'seasonal_overlay' | 'advanced_components' | 'react_widgets' | 'mjml_structure', inputData: any, _params: EmailRendererParams): Promise<HybridRenderingStage> {
    const stageStartTime = Date.now();
    
    try {
      let outputData: any;
      
      const validEnhancements = ['seasonal_overlay', 'advanced_components', 'react_widgets', 'mjml_structure'];
      if (!validEnhancements.includes(enhancement)) {
        console.warn(`Unknown enhancement: ${enhancement}, skipping...`);
        outputData = inputData;
      } else {
        switch (enhancement as 'seasonal_overlay' | 'advanced_components' | 'react_widgets' | 'mjml_structure') {
          case 'seasonal_overlay':
            outputData = await this.addSeasonalOverlay(inputData, _params);
            break;
          case 'advanced_components':
            outputData = await this.addAdvancedComponents(inputData, _params);
            break;
          case 'react_widgets':
            outputData = await this.addReactWidgets(inputData, _params);
            break;
          case 'mjml_structure':
            outputData = await this.addMjmlStructure(inputData, _params);
            break;
        }
      }
      
      return {
        stage_name: `enhancement_${enhancement}`,
        engine: 'advanced-system',
        input_data: inputData,
        output_data: outputData,
        execution_time_ms: Date.now() - stageStartTime,
        success: true
      };
      
    } catch (error) {
      return {
        stage_name: `enhancement_${enhancement}`,
        engine: 'advanced-system',
        input_data: inputData,
        execution_time_ms: Date.now() - stageStartTime,
        success: false,
        error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error'
      };
    }
  }
  
  /**
   * Apply hybrid optimizations
   */
  private async applyHybridOptimizations(finalOutput: any, _params: EmailRendererParams): Promise<any> {
    const optimizations = [];
    
    // Apply cross-system optimizations
    if (_params.rendering_options?.inline_css) {
      finalOutput.html = await this.inlineCSS(finalOutput.html);
      optimizations.push('css_inlined');
    }
    
    // Apply hybrid-specific optimizations
    if (_params.performance_config?.parallel_rendering) {
      finalOutput = await this.optimizeHybridPerformance(finalOutput);
      optimizations.push('hybrid_performance_optimized');
    }
    
    return {
      ...finalOutput,
      optimizations_applied: optimizations
    };
  }
  
  // ============================================================================
  // UTILITY METHODS
  // ============================================================================
  
  private async getBaseHtmlContent(params: EmailRendererParams): Promise<string> {
    if (params.mjml_content) {
      // Would compile MJML to HTML
      return `<html><body>${params.mjml_content}</body></html>`;
    } else if (params.content_data) {
      // Generate HTML from content data
      return `<html><body><h1>${params.content_data.subject}</h1><p>${params.content_data.body}</p></body></html>`;
    }
    
    // ✅ FAIL FAST: No default content fallbacks allowed
    throw new Error('EmailRenderer: No content provided. Either mjml_content or content_data is required.');
  }
  
  /*
  private getTargetClients(_params: EmailRendererParams): EmailClient[] {
    const clientOpt = _params.rendering_options?.email_client_optimization;
    if (clientOpt === 'all') {
      return ['gmail', 'outlook', 'apple_mail', 'yahoo'];
    } else if (clientOpt && clientOpt !== 'universal') {
      return [clientOpt];
    }
    return ['gmail', 'outlook', 'apple_mail'];
  }
  */
  
  private getClientCompatibility(_result: OptimizationResult): string[] {
    // Based on optimizations applied, determine client compatibility
    const compatibility = ['gmail', 'apple_mail'];
    
    if (_result.optimizations_applied.includes('client_optimized')) {
      compatibility.push('outlook');
    }
    
    if (_result.optimizations_applied.includes('accessibility_improved')) {
      compatibility.push('yahoo');
    }
    
    return compatibility;
  }
  
  private calculateOptimizationAnalytics(startTime: number, _result: OptimizationResult, _params: EmailRendererParams) {
    return {
      execution_time: Date.now() - startTime,
      rendering_complexity: Buffer.byteLength(_result.optimized_html, 'utf8') / 1000,
      cache_efficiency: _params.performance_config?.cache_strategy === 'aggressive' ? 0.95 : 0.8,
      components_rendered: 1,
      optimizations_performed: _result.optimizations_applied.length
    };
  }
  
  private calculateHybridAnalytics(startTime: number, pipeline: HybridRenderingPipeline, _params: EmailRendererParams) {
    return {
      execution_time: Date.now() - startTime,
      rendering_complexity: pipeline.stages.length * 10,
      cache_efficiency: _params.performance_config?.cache_strategy === 'aggressive' ? 0.9 : 0.75,
      components_rendered: pipeline.stages.length,
      optimizations_performed: pipeline.pipeline_metadata.optimizations_applied.length
    };
  }
  
  private generateHybridRecommendations(pipeline: HybridRenderingPipeline): string[] {
    const recommendations = [];
    
    if (pipeline.pipeline_metadata.stages_failed > 0) {
      recommendations.push('Some hybrid rendering stages failed - check configuration');
    }
    
    if (pipeline.total_execution_time_ms > 5000) {
      recommendations.push('Consider optimizing hybrid pipeline for better performance');
    }
    
    return recommendations;
  }
  
  private calculateHybridLoadTime(html: string): number {
    return Math.round(Buffer.byteLength(html, 'utf8') / 1024 * 0.2);
  }
  
  private calculateLoadTime(html: string): number {
    return Math.round(Buffer.byteLength(html, 'utf8') / 1024 * 0.1);
  }
  
  private calculateOptimizationScore(_result: OptimizationResult): number {
    let score = 100;
    
    // Deduct for large file size
    const sizeKb = Buffer.byteLength(_result.optimized_html, 'utf8') / 1024;
    if (sizeKb > 100) score -= 10;
    if (sizeKb > 200) score -= 20;
    
    // Add for optimizations applied
    score += _result.optimizations_applied.length * 5;
    
    return Math.min(100, Math.max(0, score));
  }
  
  private calculateClientCompatibilityScore(html: string): number {
    let score = 100;
    
    // Check for problematic patterns
    if (html.includes('flexbox')) score -= 20;
    if (html.includes('grid')) score -= 20;
    if (html.includes('@media')) score += 10; // Good for responsive
    
    return Math.max(0, score);
  }
  
  private getEngineForTemplate(template: string): any {
    switch (template) {
      case 'mjml': return 'mjml-core';
      case 'react': return 'react-dom';
      case 'advanced': return 'advanced-system';
      case 'seasonal': return 'seasonal-system';
      default: return 'unknown';
    }
  }
  
  private extractPipelineOptimizations(stages: HybridRenderingStage[]): string[] {
    const optimizations = [];
    
    for (const stage of stages) {
      if (stage.success) {
        optimizations.push(`${stage.stage_name}_completed`);
      }
    }
    
    return optimizations;
  }
  
  /**
   * Type guard to check if enhancement is valid
   */
  private isValidEnhancement(enhancement: string): enhancement is 'seasonal_overlay' | 'advanced_components' | 'react_widgets' | 'mjml_structure' {
    return ['seasonal_overlay', 'advanced_components', 'react_widgets', 'mjml_structure'].includes(enhancement);
  }

  // Placeholder methods for various optimizations
  private async inlineCSS(html: string): Promise<string> { return html; }
  private minifyHTML(html: string): string { return html.replace(/\s+/g, ' ').trim(); }
  private async optimizeForClient(html: string, _client: string): Promise<string> { return html; }
  private async improveAccessibility(html: string): Promise<string> { return html; }
  private async optimizeImages(html: string): Promise<string> { return html; }
  private async applyCachingOptimizations(html: string): Promise<string> { return html; }
  private async applyLazyLoading(html: string): Promise<string> { return html; }
  private generateTextVersion(html: string): string { return html.replace(/<[^>]*>/g, '').trim(); }
  private async generateAmpVersion(html: string): Promise<string> { return html; }
  private async renderMjmlBase(_params: EmailRendererParams): Promise<any> { return { html: '<html></html>' }; }
  private async renderReactBase(_params: EmailRendererParams): Promise<any> { return { html: '<html></html>' }; }
  private async renderAdvancedBase(_params: EmailRendererParams): Promise<any> { return { html: '<html></html>' }; }
  private async renderSeasonalBase(_params: EmailRendererParams): Promise<any> { return { html: '<html></html>' }; }
  private async addSeasonalOverlay(data: any, _params: EmailRendererParams): Promise<any> { return data; }
  private async addAdvancedComponents(_data: any, _params: EmailRendererParams): Promise<any> { return _data; }
  private async addReactWidgets(_data: any, _params: EmailRendererParams): Promise<any> { return _data; }
  private async addMjmlStructure(_data: any, _params: EmailRendererParams): Promise<any> { return _data; }
  private async optimizeHybridPerformance(output: any): Promise<any> { return output; }
  
} 