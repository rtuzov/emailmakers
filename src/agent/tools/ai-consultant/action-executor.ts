/**
 * Phase 13.3: Action Executor
 * 
 * Executes agent commands with proper workflow management for auto-execution,
 * manual approval, and error handling strategies
 */

import { 
  AgentCommand,
  ExecutionResult,
  QualityRecommendation,
  AIConsultantConfig,
  AIConsultantError,
  ExecutionStatus
} from './types';

export interface ExecutionContext {
  session_id: string;
  iteration_number: number;
  user_id?: string;
  approval_callback?: (command: AgentCommand) => Promise<boolean>;
  progress_callback?: (status: ExecutionStatus, progress: number) => void;
}

export class ActionExecutor {
  private config: AIConsultantConfig;
  private executionQueue: Map<string, AgentCommand> = new Map();
  private executionResults: Map<string, ExecutionResult> = new Map();

  constructor(config: AIConsultantConfig) {
    this.config = config;
  }

  /**
   * Execute commands based on their approval requirements
   */
  async executeCommands(
    commands: AgentCommand[],
    recommendations: QualityRecommendation[],
    context: ExecutionContext
  ): Promise<ExecutionResult[]> {
    try {
      console.log(`🚀 Executing ${commands.length} commands (Session: ${context.session_id})`);

      const results: ExecutionResult[] = [];

      // Separate commands by execution type
      const autoCommands = this.getAutoExecuteCommands(commands, recommendations);
      const manualCommands = this.getManualApprovalCommands(commands, recommendations);

      // Execute auto commands first
      if (autoCommands.length > 0 && this.config.enable_auto_execution) {
        console.log(`⚡ Auto-executing ${autoCommands.length} safe commands`);
        const autoResults = await this.executeAutoCommands(autoCommands, context);
        results.push(...autoResults);
      }

      // Queue manual approval commands
      if (manualCommands.length > 0) {
        console.log(`👤 Queuing ${manualCommands.length} commands for manual approval`);
        const manualResults = await this.executeManualCommands(manualCommands, context);
        results.push(...manualResults);
      }

      console.log(`✅ Command execution complete. ${results.length} results generated`);
      return results;

    } catch (error) {
      console.error('❌ Command execution failed:', error);
      throw new AIConsultantError(
        'Command execution failed',
        'EXECUTION_TIMEOUT',
        { error: error instanceof Error ? error.message : String(error), sessionId: context.session_id }
      );
    }
  }

  /**
   * Execute auto-approved commands
   */
  private async executeAutoCommands(
    commands: AgentCommand[],
    context: ExecutionContext
  ): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];

    for (const command of commands) {
      try {
        context.progress_callback?.('executing', (results.length / commands.length) * 100);

        const result = await this.executeCommand(command, context);
        results.push(result);

        // Brief pause between auto-executions to avoid overwhelming the system
        await this.sleep(500);

      } catch (error) {
        console.error(`❌ Auto-command failed: ${command.tool}`, error);
        
        // Create failure result
        results.push({
          recommendation_id: `auto_${Date.now()}`,
          command: command,
          execution_time: 0,
          success: false,
          result: null,
          error_message: error instanceof Error ? error.message : String(error),
          score_impact: 0
        });

        // Continue with other commands unless it's a critical failure
        if (this.isCriticalFailure(error)) {
          break;
        }
      }
    }

    return results;
  }

  /**
   * Execute manual approval commands
   */
  private async executeManualCommands(
    commands: AgentCommand[],
    context: ExecutionContext
  ): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];

    for (const command of commands) {
      try {
        // Request approval if callback provided
        if (context.approval_callback) {
          const approved = await context.approval_callback(command);
          
          if (!approved) {
            console.log(`👎 Command rejected by user: ${command.tool}`);
            results.push({
              recommendation_id: `manual_${Date.now()}`,
              command: command,
              execution_time: 0,
              success: false,
              result: null,
              error_message: 'User rejected command',
              score_impact: 0
            });
            continue;
          }
        }

        context.progress_callback?.('executing', (results.length / commands.length) * 100);

        const result = await this.executeCommand(command, context);
        results.push(result);

      } catch (error) {
        console.error(`❌ Manual command failed: ${command.tool}`, error);
        
        results.push({
          recommendation_id: `manual_${Date.now()}`,
          command: command,
          execution_time: 0,
          success: false,
          result: null,
          error_message: error instanceof Error ? error.message : String(error),
          score_impact: 0
        });
      }
    }

    return results;
  }

  /**
   * Execute a single command
   */
  private async executeCommand(
    command: AgentCommand,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const commandId = `${command.tool}_${startTime}`;

    try {
      console.log(`⚙️ Executing: ${command.tool}`);

      // Simulate command execution (in real implementation, this would call actual agent tools)
      const result = await this.simulateCommandExecution(command);

      const executionTime = Date.now() - startTime;
      const scoreImpact = this.calculateScoreImpact(command, result);

      console.log(`✅ Command completed: ${command.tool} (+${scoreImpact} points)`);

      return {
        recommendation_id: commandId,
        command: command,
        execution_time: executionTime,
        success: true,
        result: result,
        score_impact: scoreImpact
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      console.error(`❌ Command failed: ${command.tool}`, error);

      // Try fallback if available
      if (command.fallback_strategy) {
        console.log(`🔄 Trying fallback strategy for: ${command.tool}`);
        try {
          const fallbackResult = await this.executeCommand(command.fallback_strategy, context);
          return {
            ...fallbackResult,
            recommendation_id: commandId,
            command: command // Keep original command reference
          };
        } catch (fallbackError) {
          console.error(`❌ Fallback also failed: ${command.tool}`, fallbackError);
        }
      }

      return {
        recommendation_id: commandId,
        command: command,
        execution_time: executionTime,
        success: false,
        result: null,
        error_message: error instanceof Error ? error.message : String(error),
        score_impact: 0
      };
    }
  }

  /**
   * Simulate command execution (placeholder for real implementation)
   */
  private async simulateCommandExecution(command: AgentCommand): Promise<any> {
    // Simulate execution time
    await this.sleep(Math.random() * 2000 + 500);

    // Simulate different outcomes based on command type
    switch (command.tool) {
      case 'get_figma_assets':
        return {
          assets: ['новый-счастливый-заяц.png'],
          count: 1,
          quality: 'high'
        };

      case 'generate_copy':
        if (command.parameters.focus === 'subject_line') {
          return {
            subject: 'Скидки до 40% на авиабилеты! 🎉',
            length: 38,
            improved: true
          };
        }
        return {
          content: 'Улучшенный контент с лучшим призывом к действию',
          word_count: 45,
          tone_match: true
        };

      case 'patch_html':
        return {
          html_updated: true,
          changes_applied: command.parameters.target,
          accessibility_improved: true
        };

      case 'render_mjml':
        return {
          html: '<html>Обновленный email HTML</html>',
          size_kb: 85,
          mobile_optimized: true
        };

      default:
        return {
          success: true,
          message: `${command.tool} executed successfully`
        };
    }
  }

  /**
   * Calculate score impact of command execution
   */
  private calculateScoreImpact(command: AgentCommand, result: any): number {
    // Base impact based on command type
    const baseImpact = {
      'get_figma_assets': 8,
      'generate_copy': 12,
      'patch_html': 5,
      'render_mjml': 3
    };

    const base = baseImpact[command.tool as keyof typeof baseImpact] || 5;

    // Adjust based on execution success indicators
    let multiplier = 1.0;

    if (result?.quality === 'high') multiplier += 0.2;
    if (result?.improved === true) multiplier += 0.3;
    if (result?.accessibility_improved === true) multiplier += 0.1;
    if (result?.mobile_optimized === true) multiplier += 0.1;

    return Math.round(base * multiplier);
  }

  /**
   * Get commands that can be auto-executed
   */
  private getAutoExecuteCommands(
    commands: AgentCommand[],
    recommendations: QualityRecommendation[]
  ): AgentCommand[] {
    const autoRecIds = recommendations
      .filter(rec => rec.auto_execute && rec.category === 'auto_execute')
      .map(rec => rec.id);

    return commands.filter((_, index) => 
      index < autoRecIds.length && this.isSafeForAutoExecution(commands[index])
    );
  }

  /**
   * Get commands that need manual approval
   */
  private getManualApprovalCommands(
    commands: AgentCommand[],
    recommendations: QualityRecommendation[]
  ): AgentCommand[] {
    const manualRecIds = recommendations
      .filter(rec => !rec.auto_execute || rec.category === 'manual_approval')
      .map(rec => rec.id);

    return commands.filter((_, index) => 
      index < manualRecIds.length || !this.isSafeForAutoExecution(commands[index])
    );
  }

  /**
   * Check if command is safe for auto-execution
   */
  private isSafeForAutoExecution(command: AgentCommand): boolean {
    // Safe operations that don't change content significantly
    const safeTool = [
      'patch_html', // HTML improvements
      'render_mjml'  // Re-rendering
    ].includes(command.tool);

    // Safe patch operations
    const safePatchTargets = [
      'image_alt_text',
      'color_scheme',
      'email_compatibility'
    ];

    if (command.tool === 'patch_html') {
      return safePatchTargets.includes(command.parameters.target);
    }

    return safeTool;
  }

  /**
   * Check if error is critical and should stop execution
   */
  private isCriticalFailure(error: any): boolean {
    const criticalErrors = [
      'AUTHENTICATION_FAILED',
      'RATE_LIMIT_EXCEEDED',
      'SYSTEM_UNAVAILABLE'
    ];

    return criticalErrors.some(critical => 
      error.message?.includes(critical) || error.code === critical
    );
  }

  /**
   * Sleep utility for pacing executions
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get execution status for monitoring
   */
  getExecutionStatus(): {
    queued: number;
    completed: number;
    failed: number;
    total: number;
  } {
    const total = this.executionResults.size;
    const completed = Array.from(this.executionResults.values()).filter(r => r.success).length;
    const failed = total - completed;
    const queued = this.executionQueue.size;

    return { queued, completed, failed, total };
  }

  /**
   * Clear execution history
   */
  clearHistory(): void {
    this.executionQueue.clear();
    this.executionResults.clear();
  }
} 