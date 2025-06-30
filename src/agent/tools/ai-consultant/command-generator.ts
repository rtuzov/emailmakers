/**
 * Phase 13.3: Command Generator
 * 
 * Converts AI recommendations into executable agent commands with proper
 * parameter optimization and dependency management
 */

import { 
  QualityRecommendation,
  AgentCommand,
  AIConsultantRequest,
  AIConsultantConfig,
  AIConsultantError
} from './types';

export class CommandGenerator {
  private config: AIConsultantConfig;

  constructor(config: AIConsultantConfig) {
    this.config = config;
  }

  /**
   * Generate optimized agent commands from recommendations
   */
  generateCommands(
    recommendations: QualityRecommendation[],
    request: AIConsultantRequest
  ): AgentCommand[] {
    try {
      console.log(`⚙️ Generating commands for ${recommendations.length} recommendations`);

      const commands = recommendations.map(rec => 
        this.optimizeCommand(rec.agent_command, rec, request)
      );

      // Sort commands by execution order and dependencies
      const sortedCommands = this.sortCommandsByDependencies(commands);

      console.log(`✅ Generated ${sortedCommands.length} optimized commands`);
      return sortedCommands;

    } catch (error) {
      console.error('❌ Command generation failed:', error);
      throw new AIConsultantError(
        'Failed to generate agent commands',
        'AGENT_COMMAND_FAILED',
        { error: error instanceof Error ? error.message : String(error), recommendationCount: recommendations.length }
      );
    }
  }

  /**
   * Optimize command parameters based on context and recommendation
   */
  private optimizeCommand(
    command: AgentCommand,
    recommendation: QualityRecommendation,
    request: AIConsultantRequest
  ): AgentCommand {
    const optimizedCommand = { ...command };

    // Optimize parameters based on tool type
    switch (command.tool) {
      case 'get_figma_assets':
        optimizedCommand.parameters = this.optimizeFigmaAssetParams(
          command.parameters,
          recommendation,
          request
        );
        break;

      case 'generate_copy':
        optimizedCommand.parameters = this.optimizeCopyGenerationParams(
          command.parameters,
          recommendation,
          request
        );
        break;

      case 'patch_html':
        optimizedCommand.parameters = this.optimizeHtmlPatchParams(
          command.parameters,
          recommendation,
          request
        );
        break;

      case 'render_mjml':
        optimizedCommand.parameters = this.optimizeMjmlRenderParams(
          command.parameters,
          recommendation,
          request
        );
        break;

      default:
        // Keep original parameters for unknown tools
        break;
    }

    // Optimize execution settings
    optimizedCommand.timeout = this.calculateOptimalTimeout(recommendation);
    optimizedCommand.max_retries = this.calculateOptimalRetries(recommendation);

    return optimizedCommand;
  }

  /**
   * Optimize Figma asset parameters
   */
  private optimizeFigmaAssetParams(
    params: Record<string, any>,
    recommendation: QualityRecommendation,
    request: AIConsultantRequest
  ): Record<string, any> {
    const optimized = { ...params };

    // Add context-aware tags
    if (recommendation.type === 'visual' && recommendation.title.includes('emotion')) {
      // For emotion-related recommendations, add emotional context
      optimized.tags = [
        ...((optimized.tags as string[]) || []),
        this.getEmotionalTags(request.campaign_type, request.topic)
      ].flat();

      // Add exclusions to avoid current problematic assets
      if (request.assets_used?.original_assets?.length > 0) {
        optimized.exclude = request.assets_used.original_assets.filter((asset: string) =>
          asset.toLowerCase().includes('грустн') || 
          asset.toLowerCase().includes('печал') ||
          asset.toLowerCase().includes('нейтрал')
        );
      }
    }

    // Add quality filters
    optimized.min_quality = 'high';
    optimized.format_preference = ['png', 'svg'];

    return optimized;
  }

  /**
   * Optimize copy generation parameters
   */
  private optimizeCopyGenerationParams(
    params: Record<string, any>,
    recommendation: QualityRecommendation,
    request: AIConsultantRequest
  ): Record<string, any> {
    const optimized = { ...params };

    // Add context from current content
    if (request.content_metadata) {
      optimized.current_tone = request.content_metadata.tone;
      optimized.current_language = request.content_metadata.language;
      
      // For subject line optimization
      if (params.focus === 'subject_line') {
        optimized.current_length = request.content_metadata.subject?.length || 0;
        optimized.target_length = Math.min(45, optimized.max_length || 45);
      }
    }

    // Add pricing context for urgency/scarcity
    if (params.focus === 'urgency_scarcity' && request.prices) {
      optimized.price_context = {
        route: `${request.prices.origin} → ${request.prices.destination}`,
        price: request.prices.cheapest_price,
        currency: request.prices.currency,
        is_good_deal: request.prices.cheapest_price < this.getAveragePrice(request.prices.origin, request.prices.destination)
      };
    }

    // Add brand context
    optimized.brand_guidelines = {
      name: 'Kupibilet',
      tone: 'friendly_helpful',
      values: ['affordable_travel', 'customer_first', 'reliability'],
      avoid: ['aggressive_sales', 'false_urgency', 'misleading_claims']
    };

    return optimized;
  }

  /**
   * Optimize HTML patch parameters
   */
  private optimizeHtmlPatchParams(
    params: Record<string, any>,
    recommendation: QualityRecommendation,
    request: AIConsultantRequest
  ): Record<string, any> {
    const optimized = { ...params };

    // Add current HTML context
    optimized.current_html = request.html_content;

    // For color scheme optimization
    if (params.target === 'color_scheme') {
      optimized.brand_colors = {
        primary: '#4BFF7E',
        secondary: '#FF6B35',
        accent: '#E6F3FF',
        neutral: '#F5F5F5',
        text: '#333333'
      };
      
      // Ensure WCAG AA compliance
      optimized.accessibility_level = 'AA';
      optimized.min_contrast_ratio = 4.5;
    }

    // For accessibility improvements
    if (params.target === 'image_alt_text') {
      optimized.context = {
        topic: request.topic,
        campaign_type: request.campaign_type,
        target_audience: request.target_audience
      };
    }

    return optimized;
  }

  /**
   * Optimize MJML render parameters
   */
  private optimizeMjmlRenderParams(
    params: Record<string, any>,
    recommendation: QualityRecommendation,
    request: AIConsultantRequest
  ): Record<string, any> {
    const optimized = { ...params };

    // Add performance optimizations
    optimized.minify = true;
    optimized.beautify = false;
    optimized.validation_level = 'strict';

    // Add mobile optimization
    optimized.responsive = true;
    optimized.mobile_first = true;

    return optimized;
  }

  /**
   * Sort commands by dependencies and execution order
   */
  private sortCommandsByDependencies(commands: AgentCommand[]): AgentCommand[] {
    // Define tool execution order and dependencies
    const toolOrder = {
      'get_figma_assets': 1,
      'generate_copy': 2,
      'render_mjml': 3,
      'patch_html': 4,
      'render_test': 5
    };

    return commands.sort((a, b) => {
      const orderA = toolOrder[a.tool as keyof typeof toolOrder] || 999;
      const orderB = toolOrder[b.tool as keyof typeof toolOrder] || 999;
      return orderA - orderB;
    });
  }

  /**
   * Calculate optimal timeout based on recommendation complexity
   */
  private calculateOptimalTimeout(recommendation: QualityRecommendation): number {
    const baseTimeout = 30; // seconds
    
    const complexityMultiplier = {
      'simple': 1.0,
      'moderate': 1.5,
      'complex': 2.0
    };

    const typeMultiplier = {
      'visual': 1.5,    // Figma API can be slow
      'content': 1.2,   // GPT-4o mini processing time
      'technical': 1.0, // Usually fast operations
      'emotional': 1.3, // May require multiple iterations
      'accessibility': 0.8 // Usually quick fixes
    };

    const complexityFactor = complexityMultiplier[recommendation.execution_complexity];
    const typeFactor = typeMultiplier[recommendation.type];

    return Math.ceil(baseTimeout * complexityFactor * typeFactor);
  }

  /**
   * Calculate optimal retry count based on recommendation confidence
   */
  private calculateOptimalRetries(recommendation: QualityRecommendation): number {
    // Higher confidence = fewer retries needed
    if (recommendation.confidence >= 0.9) return 1;
    if (recommendation.confidence >= 0.8) return 2;
    if (recommendation.confidence >= 0.7) return 3;
    return 2; // Default for lower confidence
  }

  /**
   * Get emotional tags based on campaign context
   */
  private getEmotionalTags(campaignType?: string, topic?: string): string[] {
    const baseTags = ['счастливый', 'радостный'];
    
    if (campaignType === 'promotional') {
      baseTags.push('воодушевленный', 'восторженный');
    }
    
    if (topic?.toLowerCase().includes('путешеств')) {
      baseTags.push('путешествие', 'приключение');
    }
    
    return baseTags;
  }

  /**
   * Get average price for route (simplified implementation)
   */
  private getAveragePrice(origin: string, destination: string): number {
    // Simplified price estimation - in real implementation, 
    // this would query historical data
    const routeMap: Record<string, number> = {
      'MOW-LED': 8000,  // Moscow-St.Petersburg
      'MOW-AER': 15000, // Moscow-Sochi
      'LED-AER': 18000, // St.Petersburg-Sochi
    };
    
    const routeKey = `${origin}-${destination}`;
    return routeMap[routeKey] || 12000; // Default average
  }

  /**
   * Validate command before execution
   */
  validateCommand(command: AgentCommand): boolean {
    // Check required fields
    if (!command.tool || !command.parameters) {
      return false;
    }

    // Check timeout and retries are reasonable
    if (command.timeout > 300 || command.max_retries > 5) {
      return false;
    }

    // Tool-specific validation
    switch (command.tool) {
      case 'get_figma_assets':
        return this.validateFigmaCommand(command);
      case 'generate_copy':
        return this.validateCopyCommand(command);
      case 'patch_html':
        return this.validatePatchCommand(command);
      default:
        return true; // Allow unknown tools
    }
  }

  /**
   * Validate Figma asset command
   */
  private validateFigmaCommand(command: AgentCommand): boolean {
    const params = command.parameters;
    
    // Must have tags or search criteria
    if (!params.tags && !params.search && !params.category) {
      return false;
    }

    // Tags should be reasonable
    if (params.tags && Array.isArray(params.tags) && params.tags.length > 10) {
      return false;
    }

    return true;
  }

  /**
   * Validate copy generation command
   */
  private validateCopyCommand(command: AgentCommand): boolean {
    const params = command.parameters;
    
    // Must have focus area
    if (!params.focus) {
      return false;
    }

    // Check for reasonable length limits
    if (params.max_length && (params.max_length < 5 || params.max_length > 200)) {
      return false;
    }

    return true;
  }

  /**
   * Validate HTML patch command
   */
  private validatePatchCommand(command: AgentCommand): boolean {
    const params = command.parameters;
    
    // Must have target
    if (!params.target) {
      return false;
    }

    return true;
  }
} 