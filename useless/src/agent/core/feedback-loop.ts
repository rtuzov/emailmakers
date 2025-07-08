/**
 * Feedback Loop System for Multi-Agent Workflow
 * Enables Quality Specialist to send work back to previous agents with specific feedback
 * 
 * Features:
 * - Iteration counting to prevent infinite loops
 * - Enhanced prompts for retry attempts
 * - Quality scoring and evaluation
 * - Feedback categorization and routing
 */

export interface FeedbackIssue {
  category: 'content' | 'design' | 'quality' | 'technical';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  suggestion: string;
  examples?: string[];
}

export interface FeedbackResult {
  shouldRetry: boolean;
  targetAgent: 'content' | 'design' | null;
  issues: FeedbackIssue[];
  qualityScore: number;
  iterationCount: number;
  enhancedPrompt?: string;
}

export interface IterationState {
  agentName: string;
  count: number;
  lastFeedback?: FeedbackIssue[];
  startTime: number;
}

export class FeedbackLoop {
  private iterationCounts = new Map<string, IterationState>();
  private readonly maxIterations = 3;
  private readonly qualityThreshold = 80;
  private readonly timeoutMs = 300000; // 5 minutes

  /**
   * Evaluate the quality of work and determine if feedback is needed
   */
  async evaluateQuality(
    agentName: string,
    result: any,
    context: any
  ): Promise<FeedbackResult> {
    const currentIteration = this.getIterationState(agentName);
    
    // Check if we've exceeded max iterations
    if (currentIteration.count >= this.maxIterations) {
      return {
        shouldRetry: false,
        targetAgent: null,
        issues: [{
          category: 'technical',
          severity: 'critical',
          description: 'Maximum iterations exceeded',
          suggestion: 'Manual review required'
        }],
        qualityScore: 0,
        iterationCount: currentIteration.count
      };
    }

    // Check for timeout
    if (Date.now() - currentIteration.startTime > this.timeoutMs) {
      return {
        shouldRetry: false,
        targetAgent: null,
        issues: [{
          category: 'technical',
          severity: 'critical',
          description: 'Feedback loop timeout',
          suggestion: 'Process taking too long, manual intervention needed'
        }],
        qualityScore: 0,
        iterationCount: currentIteration.count
      };
    }

    // Evaluate quality based on agent type and result
    const qualityScore = await this.calculateQualityScore(agentName, result, context);
    const issues = await this.identifyIssues(agentName, result, context);

    if (qualityScore >= this.qualityThreshold && issues.length === 0) {
      // Quality is good, no feedback needed
      this.resetIterationState(agentName);
      return {
        shouldRetry: false,
        targetAgent: null,
        issues: [],
        qualityScore,
        iterationCount: currentIteration.count
      };
    }

    // Quality needs improvement, determine target agent
    const targetAgent = this.determineTargetAgent(issues);
    const enhancedPrompt = await this.createEnhancedPrompt(
      agentName,
      targetAgent,
      issues,
      currentIteration.count + 1
    );

    // Increment iteration count
    this.incrementIteration(agentName, issues);

    return {
      shouldRetry: true,
      targetAgent,
      issues,
      qualityScore,
      iterationCount: currentIteration.count,
      enhancedPrompt
    };
  }

  /**
   * Calculate quality score based on agent type and output
   */
  private async calculateQualityScore(
    agentName: string,
    result: any,
    context: any
  ): Promise<number> {
    let score = 100;

    switch (agentName) {
      case 'content':
        score = this.evaluateContentQuality(result, context);
        break;
      case 'design':
        score = this.evaluateDesignQuality(result, context);
        break;
      case 'quality':
        score = this.evaluateQualityControlQuality(result, context);
        break;
      case 'delivery':
        score = this.evaluateDeliveryQuality(result, context);
        break;
      default:
        score = 70; // Default moderate score
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Evaluate content quality
   */
  private evaluateContentQuality(result: any, context: any): number {
    let score = 100;

    // Check content length
    if (result.content && result.content.length < 50) {
      score -= 30; // Too short
    } else if (result.content && result.content.length > 2000) {
      score -= 20; // Too long
    }

    // Check for required elements
    if (!result.subject || result.subject.length < 10) {
      score -= 25; // Missing or poor subject
    }

    if (!result.preheader || result.preheader.length < 20) {
      score -= 15; // Missing or poor preheader
    }

    // Check for engagement elements
    if (!result.content || !result.content.includes('call-to-action')) {
      score -= 10; // Missing CTA
    }

    return score;
  }

  /**
   * Evaluate design quality
   */
  private evaluateDesignQuality(result: any, context: any): number {
    let score = 100;

    // Check MJML validity
    if (!result.mjml || !result.mjml.includes('<mjml>')) {
      score -= 40; // Invalid MJML structure
    }

    // Check for responsive design
    if (!result.mjml || !result.mjml.includes('mj-section')) {
      score -= 20; // Missing responsive structure
    }

    // Check for brand colors
    if (!result.mjml || !result.mjml.includes('#4BFF7E')) {
      score -= 15; // Missing brand colors
    }

    // Check for images
    if (!result.mjml || !result.mjml.includes('mj-image')) {
      score -= 10; // Missing images
    }

    return score;
  }

  /**
   * Evaluate quality control quality
   */
  private evaluateQualityControlQuality(result: any, context: any): number {
    let score = 100;

    // Check validation results
    if (!result.validation || !result.validation.html_valid) {
      score -= 30; // HTML validation failed
    }

    if (!result.validation || !result.validation.accessibility_score || result.validation.accessibility_score < 80) {
      score -= 20; // Poor accessibility
    }

    if (!result.validation || !result.validation.mobile_friendly) {
      score -= 25; // Not mobile friendly
    }

    return score;
  }

  /**
   * Evaluate delivery quality
   */
  private evaluateDeliveryQuality(result: any, context: any): number {
    let score = 100;

    // Check file completeness
    if (!result.files || !result.files.html) {
      score -= 40; // Missing HTML file
    }

    if (!result.files || !result.files.images || result.files.images.length === 0) {
      score -= 20; // Missing images
    }

    // Check file sizes
    if (result.files && result.files.html && result.files.html.size > 100000) {
      score -= 15; // HTML too large
    }

    return score;
  }

  /**
   * Identify specific issues with the work
   */
  private async identifyIssues(
    agentName: string,
    result: any,
    context: any
  ): Promise<FeedbackIssue[]> {
    const issues: FeedbackIssue[] = [];

    switch (agentName) {
      case 'content':
        issues.push(...this.identifyContentIssues(result, context));
        break;
      case 'design':
        issues.push(...this.identifyDesignIssues(result, context));
        break;
      case 'quality':
        issues.push(...this.identifyQualityIssues(result, context));
        break;
      case 'delivery':
        issues.push(...this.identifyDeliveryIssues(result, context));
        break;
    }

    return issues;
  }

  /**
   * Identify content-specific issues
   */
  private identifyContentIssues(result: any, context: any): FeedbackIssue[] {
    const issues: FeedbackIssue[] = [];

    if (!result.subject || result.subject.length < 10) {
      issues.push({
        category: 'content',
        severity: 'high',
        description: 'Subject line is too short or missing',
        suggestion: 'Create a compelling subject line of 30-50 characters that includes the key benefit',
        examples: ['Найди билеты от 2990₽ — летим в Европу!', 'Скидка 30% на все направления — только сегодня!']
      });
    }

    if (!result.content || result.content.length < 100) {
      issues.push({
        category: 'content',
        severity: 'high',
        description: 'Email content is too short',
        suggestion: 'Expand the content to include more value proposition, benefits, and clear call-to-action',
        examples: ['Add destination highlights', 'Include pricing details', 'Add urgency elements']
      });
    }

    if (!result.content || !result.content.toLowerCase().includes('купить') && !result.content.toLowerCase().includes('забронировать')) {
      issues.push({
        category: 'content',
        severity: 'medium',
        description: 'Missing clear call-to-action',
        suggestion: 'Add a clear action verb like "Купить билет" or "Забронировать сейчас"',
        examples: ['Купить билет от 2990₽', 'Забронировать сейчас со скидкой']
      });
    }

    return issues;
  }

  /**
   * Identify design-specific issues
   */
  private identifyDesignIssues(result: any, context: any): FeedbackIssue[] {
    const issues: FeedbackIssue[] = [];

    if (!result.mjml || !result.mjml.includes('<mjml>')) {
      issues.push({
        category: 'design',
        severity: 'critical',
        description: 'Invalid MJML structure',
        suggestion: 'Ensure the email starts with <mjml> tag and follows proper MJML syntax',
        examples: ['<mjml><mj-head>...</mj-head><mj-body>...</mj-body></mjml>']
      });
    }

    if (!result.mjml || !result.mjml.includes('#4BFF7E')) {
      issues.push({
        category: 'design',
        severity: 'medium',
        description: 'Missing brand colors',
        suggestion: 'Include the primary brand color #4BFF7E in buttons and accents',
        examples: ['<mj-button background-color="#4BFF7E">', '<mj-section background-color="#4BFF7E">']
      });
    }

    if (!result.mjml || !result.mjml.includes('mj-image')) {
      issues.push({
        category: 'design',
        severity: 'medium',
        description: 'Missing visual elements',
        suggestion: 'Add relevant images for destinations or promotional content',
        examples: ['Destination photos', 'Promotional banners', 'Logo placement']
      });
    }

    return issues;
  }

  /**
   * Identify quality control issues
   */
  private identifyQualityIssues(result: any, context: any): FeedbackIssue[] {
    const issues: FeedbackIssue[] = [];

    if (!result.validation || !result.validation.html_valid) {
      issues.push({
        category: 'quality',
        severity: 'high',
        description: 'HTML validation failed',
        suggestion: 'Fix HTML validation errors to ensure proper email rendering',
        examples: ['Close all HTML tags', 'Use proper MJML syntax', 'Validate against W3C standards']
      });
    }

    if (!result.validation || !result.validation.mobile_friendly) {
      issues.push({
        category: 'quality',
        severity: 'high',
        description: 'Email is not mobile-friendly',
        suggestion: 'Ensure responsive design works on mobile devices',
        examples: ['Use mj-section for responsive layout', 'Test on mobile viewport', 'Optimize font sizes']
      });
    }

    return issues;
  }

  /**
   * Identify delivery issues
   */
  private identifyDeliveryIssues(result: any, context: any): FeedbackIssue[] {
    const issues: FeedbackIssue[] = [];

    if (!result.files || !result.files.html) {
      issues.push({
        category: 'technical',
        severity: 'critical',
        description: 'HTML file is missing',
        suggestion: 'Generate and include the final HTML file',
        examples: ['Compile MJML to HTML', 'Include inline CSS', 'Validate final output']
      });
    }

    return issues;
  }

  /**
   * Determine which agent should receive the feedback
   */
  private determineTargetAgent(issues: FeedbackIssue[]): 'content' | 'design' | null {
    const contentIssues = issues.filter(i => i.category === 'content').length;
    const designIssues = issues.filter(i => i.category === 'design').length;

    if (contentIssues > designIssues) {
      return 'content';
    } else if (designIssues > 0) {
      return 'design';
    }

    return null;
  }

  /**
   * Create enhanced prompt for retry attempt
   */
  private async createEnhancedPrompt(
    originalAgent: string,
    targetAgent: 'content' | 'design' | null,
    issues: FeedbackIssue[],
    iterationNumber: number
  ): Promise<string> {
    if (!targetAgent) return '';

    const criticalIssues = issues.filter(i => i.severity === 'critical');
    const highIssues = issues.filter(i => i.severity === 'high');
    const mediumIssues = issues.filter(i => i.severity === 'medium');

    let prompt = `🔄 RETRY ATTEMPT #${iterationNumber} - FEEDBACK INTEGRATION\n\n`;
    prompt += `❌ QUALITY ISSUES IDENTIFIED:\n\n`;

    if (criticalIssues.length > 0) {
      prompt += `🚨 CRITICAL ISSUES (Must Fix):\n`;
      criticalIssues.forEach((issue, index) => {
        prompt += `${index + 1}. ${issue.description}\n`;
        prompt += `   💡 Solution: ${issue.suggestion}\n`;
        if (issue.examples) {
          prompt += `   📝 Examples: ${issue.examples.join(', ')}\n`;
        }
        prompt += `\n`;
      });
    }

    if (highIssues.length > 0) {
      prompt += `⚠️ HIGH PRIORITY ISSUES:\n`;
      highIssues.forEach((issue, index) => {
        prompt += `${index + 1}. ${issue.description}\n`;
        prompt += `   💡 Solution: ${issue.suggestion}\n`;
        if (issue.examples) {
          prompt += `   📝 Examples: ${issue.examples.join(', ')}\n`;
        }
        prompt += `\n`;
      });
    }

    if (mediumIssues.length > 0) {
      prompt += `📋 MEDIUM PRIORITY ISSUES:\n`;
      mediumIssues.forEach((issue, index) => {
        prompt += `${index + 1}. ${issue.description}\n`;
        prompt += `   💡 Solution: ${issue.suggestion}\n`;
        if (issue.examples) {
          prompt += `   📝 Examples: ${issue.examples.join(', ')}\n`;
        }
        prompt += `\n`;
      });
    }

    prompt += `\n✅ SUCCESS CRITERIA:\n`;
    prompt += `- Address all CRITICAL issues completely\n`;
    prompt += `- Resolve HIGH priority issues\n`;
    prompt += `- Maintain Kupibilet brand consistency\n`;
    prompt += `- Ensure mobile-friendly responsive design\n`;
    prompt += `- Include clear call-to-action\n\n`;

    prompt += `🎯 FOCUS AREAS FOR THIS RETRY:\n`;
    if (targetAgent === 'content') {
      prompt += `- Improve content quality and engagement\n`;
      prompt += `- Enhance subject line and preheader\n`;
      prompt += `- Strengthen call-to-action\n`;
      prompt += `- Ensure proper content length and structure\n`;
    } else if (targetAgent === 'design') {
      prompt += `- Fix MJML structure and validation\n`;
      prompt += `- Apply brand colors (#4BFF7E, #1DA857, #2C3959)\n`;
      prompt += `- Ensure responsive mobile design\n`;
      prompt += `- Add appropriate visual elements\n`;
    }

    return prompt;
  }

  /**
   * Get current iteration state for an agent
   */
  private getIterationState(agentName: string): IterationState {
    if (!this.iterationCounts.has(agentName)) {
      this.iterationCounts.set(agentName, {
        agentName,
        count: 0,
        startTime: Date.now()
      });
    }
    return this.iterationCounts.get(agentName)!;
  }

  /**
   * Increment iteration count
   */
  private incrementIteration(agentName: string, feedback: FeedbackIssue[]): void {
    const current = this.getIterationState(agentName);
    current.count += 1;
    current.lastFeedback = feedback;
    this.iterationCounts.set(agentName, current);
  }

  /**
   * Reset iteration state for successful completion
   */
  private resetIterationState(agentName: string): void {
    this.iterationCounts.delete(agentName);
  }

  /**
   * Get current iteration count for an agent
   */
  getIterationCount(agentName: string): number {
    return this.getIterationState(agentName).count;
  }

  /**
   * Check if agent has exceeded max iterations
   */
  hasExceededMaxIterations(agentName: string): boolean {
    return this.getIterationCount(agentName) >= this.maxIterations;
  }

  /**
   * Get feedback history for an agent
   */
  getFeedbackHistory(agentName: string): FeedbackIssue[] {
    const state = this.getIterationState(agentName);
    return state.lastFeedback || [];
  }

  /**
   * Clear all iteration states (for testing or reset)
   */
  clearAllStates(): void {
    this.iterationCounts.clear();
  }
}

// Export singleton instance
export const feedbackLoop = new FeedbackLoop(); 