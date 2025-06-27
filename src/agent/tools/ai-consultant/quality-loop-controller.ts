/**
 * Phase 13.4: Quality Loop Controller
 * 
 * Manages the iterative improvement process with intelligent decision-making
 * for auto-execute vs manual approval workflows and comprehensive analytics
 */

import { 
  AIConsultantRequest,
  AIConsultantResponse,
  AIConsultantConfig,
  ImprovementIteration,
  ExecutionResult,
  QualityAnalysisResult,
  ImprovementStatus,
  AIConsultantError
} from './types';

import { AIQualityConsultant } from './ai-consultant';

export interface QualityLoopSession {
  session_id: string;
  user_id?: string;
  email_topic: string;
  initial_request: AIConsultantRequest;
  iterations: ImprovementIteration[];
  current_status: ImprovementStatus;
  final_score?: number;
  total_improvement: number;
  session_start: Date;
  session_end?: Date;
  success: boolean;
}

export interface LoopDecision {
  should_continue: boolean;
  reason: string;
  next_iteration_focus?: string;
  recommended_actions: string[];
  escalation_required?: boolean;
}

export class QualityLoopController {
  private consultant: AIQualityConsultant;
  private config: AIConsultantConfig;
  private activeSessions: Map<string, QualityLoopSession> = new Map();
  private analytics: QualityLoopAnalytics;

  constructor(config: AIConsultantConfig) {
    this.config = config;
    this.consultant = new AIQualityConsultant(config);
    this.analytics = new QualityLoopAnalytics();
  }

  /**
   * Start a new quality improvement session
   */
  async startQualityLoop(
    request: AIConsultantRequest,
    sessionId?: string
  ): Promise<QualityLoopSession> {
    try {
      const session_id = sessionId || `ql_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`🔄 Starting quality loop session: ${session_id}`);
      console.log(`📧 Email topic: ${request.topic}`);

      // Initialize session
      const session: QualityLoopSession = {
        session_id,
        user_id: request.user_id,
        email_topic: request.topic,
        initial_request: { ...request, session_id },
        iterations: [],
        current_status: 'not_started',
        total_improvement: 0,
        session_start: new Date(),
        success: false
      };

      // Store session
      this.activeSessions.set(session_id, session);

      // Start first iteration
      const firstIteration = await this.executeIteration(session, 1);
      session.iterations.push(firstIteration);
      session.current_status = firstIteration.success ? 'in_progress' : 'failed';

      // Update analytics
      this.analytics.recordSessionStart(session);

      console.log(`✅ Quality loop session started. Initial score: ${firstIteration.initial_score}`);
      return session;

    } catch (error) {
      console.error('❌ Failed to start quality loop:', error);
      throw new AIConsultantError(
        'Failed to start quality improvement loop',
        'ANALYSIS_FAILED',
        { error: error instanceof Error ? error.message : String(error), topic: request.topic }
      );
    }
  }

  /**
   * Continue existing quality loop with next iteration
   */
  async continueQualityLoop(
    sessionId: string,
    userApprovals?: Record<string, boolean>
  ): Promise<QualityLoopSession> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new AIConsultantError(
          'Quality loop session not found',
          'INVALID_REQUEST',
          { sessionId }
        );
      }

      console.log(`🔄 Continuing quality loop: ${sessionId}`);
      console.log(`📈 Iteration ${session.iterations.length + 1}/${this.config.max_iterations}`);

      // Check if we should continue
      const decision = this.makeLoopDecision(session, userApprovals);
      
      if (!decision.should_continue) {
        return await this.completeQualityLoop(sessionId, decision.reason);
      }

      // Execute next iteration
      const nextIterationNumber = session.iterations.length + 1;
      const nextIteration = await this.executeIteration(session, nextIterationNumber, userApprovals);
      
      session.iterations.push(nextIteration);
      session.total_improvement = this.calculateTotalImprovement(session);

      // Update status
      if (nextIteration.success) {
        const latestScore = nextIteration.final_score;
        if (latestScore >= this.config.quality_gate_threshold) {
          session.current_status = 'completed';
          session.success = true;
          session.final_score = latestScore;
        } else {
          session.current_status = 'in_progress';
        }
      } else {
        session.current_status = 'failed';
      }

      // Update analytics
      this.analytics.recordIteration(session, nextIteration);

      console.log(`📊 Iteration ${nextIterationNumber} complete. Score: ${nextIteration.final_score}`);
      return session;

    } catch (error) {
      console.error('❌ Failed to continue quality loop:', error);
      throw new AIConsultantError(
        'Failed to continue quality improvement loop',
        'ANALYSIS_FAILED',
        { error: error instanceof Error ? error.message : String(error), sessionId }
      );
    }
  }

  /**
   * Complete quality loop session
   */
  async completeQualityLoop(
    sessionId: string,
    reason: string
  ): Promise<QualityLoopSession> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new AIConsultantError(
          'Quality loop session not found',
          'INVALID_REQUEST',
          { sessionId }
        );
      }

      console.log(`🏁 Completing quality loop: ${sessionId}`);
      console.log(`📋 Completion reason: ${reason}`);

      // Finalize session
      session.session_end = new Date();
      session.current_status = 'completed';
      
      // Calculate final metrics
      const lastIteration = session.iterations[session.iterations.length - 1];
      if (lastIteration) {
        session.final_score = lastIteration.final_score;
        session.success = lastIteration.final_score >= this.config.quality_gate_threshold;
      }

      session.total_improvement = this.calculateTotalImprovement(session);

      // Update analytics
      this.analytics.recordSessionComplete(session, reason);

      // Remove from active sessions
      this.activeSessions.delete(sessionId);

      console.log(`✅ Quality loop completed. Final score: ${session.final_score}, Improvement: +${session.total_improvement}`);
      return session;

    } catch (error) {
      console.error('❌ Failed to complete quality loop:', error);
      throw new AIConsultantError(
        'Failed to complete quality improvement loop',
        'ANALYSIS_FAILED',
        { error: error instanceof Error ? error.message : String(error), sessionId }
      );
    }
  }

  /**
   * Execute a single improvement iteration
   */
  private async executeIteration(
    session: QualityLoopSession,
    iterationNumber: number,
    userApprovals?: Record<string, boolean>
  ): Promise<ImprovementIteration> {
    const startTime = Date.now();

    try {
      console.log(`⚙️ Executing iteration ${iterationNumber} for session ${session.session_id}`);

      // Prepare request for this iteration
      const iterationRequest: AIConsultantRequest = {
        ...session.initial_request,
        iteration_count: iterationNumber - 1, // 0-based for consultant
        improvement_history: session.iterations,
        user_approvals: userApprovals
      };

      // Get AI consultant response
      const consultantResponse = await this.consultant.consultOnQuality(iterationRequest);
      
      // Calculate scores
      const initialScore = session.iterations.length > 0 
        ? session.iterations[session.iterations.length - 1].final_score
        : consultantResponse.analysis.overall_score;
      
      const finalScore = consultantResponse.analysis.overall_score;
      const scoreImprovement = finalScore - initialScore;

      // Extract execution results
      const executionResults = consultantResponse.execution_results || [];
      const recommendationsApplied = executionResults
        .filter(r => r.success)
        .map(r => r.recommendation_id);

      // Create iteration record
      const iteration: ImprovementIteration = {
        iteration_number: iterationNumber,
        timestamp: new Date(),
        initial_score: initialScore,
        final_score: finalScore,
        score_improvement: scoreImprovement,
        recommendations_applied: recommendationsApplied,
        execution_results: executionResults,
        total_time: Date.now() - startTime,
        success: consultantResponse.analysis.quality_gate_passed || scoreImprovement > 0,
        consultant_response: consultantResponse
      };

      console.log(`✅ Iteration ${iterationNumber} executed. Score change: ${initialScore} → ${finalScore} (+${scoreImprovement})`);
      return iteration;

    } catch (error) {
      console.error(`❌ Iteration ${iterationNumber} failed:`, error);
      
      return {
        iteration_number: iterationNumber,
        timestamp: new Date(),
        initial_score: session.iterations.length > 0 
          ? session.iterations[session.iterations.length - 1].final_score 
          : 0,
        final_score: 0,
        score_improvement: 0,
        recommendations_applied: [],
        execution_results: [],
        total_time: Date.now() - startTime,
        success: false,
        error_message: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Make intelligent decision about continuing the loop
   */
  private makeLoopDecision(
    session: QualityLoopSession,
    userApprovals?: Record<string, boolean>
  ): LoopDecision {
    const lastIteration = session.iterations[session.iterations.length - 1];
    const currentScore = lastIteration?.final_score || 0;
    const iterationCount = session.iterations.length;

    // Check quality gate
    if (currentScore >= this.config.quality_gate_threshold) {
      return {
        should_continue: false,
        reason: `Quality gate passed with score ${currentScore}/100`,
        recommended_actions: ['proceed_to_upload']
      };
    }

    // Check max iterations
    if (iterationCount >= this.config.max_iterations) {
      return {
        should_continue: false,
        reason: `Maximum iterations (${this.config.max_iterations}) reached`,
        recommended_actions: ['manual_review', 'accept_current_quality'],
        escalation_required: currentScore < this.config.critical_issue_threshold
      };
    }

    // Check improvement trend
    const improvementTrend = this.calculateImprovementTrend(session);
    if (improvementTrend < 1 && iterationCount >= 2) {
      return {
        should_continue: false,
        reason: 'Minimal improvement detected in recent iterations',
        recommended_actions: ['manual_review', 'try_different_approach'],
        escalation_required: true
      };
    }

    // Check critical issues
    if (currentScore < this.config.critical_issue_threshold) {
      return {
        should_continue: false,
        reason: `Critical quality issues detected (score: ${currentScore})`,
        recommended_actions: ['escalate_to_human', 'manual_review'],
        escalation_required: true
      };
    }

    // Check user approvals for manual actions
    const pendingApprovals = this.getPendingApprovals(lastIteration, userApprovals);
    if (pendingApprovals.length > 0) {
      return {
        should_continue: false,
        reason: 'Waiting for user approval on manual actions',
        recommended_actions: ['request_user_approval'],
        next_iteration_focus: 'user_approved_actions'
      };
    }

    // Continue with next iteration
    return {
      should_continue: true,
      reason: `Continuing improvement (current score: ${currentScore})`,
      recommended_actions: ['execute_next_iteration'],
      next_iteration_focus: this.determineNextFocus(session)
    };
  }

  /**
   * Calculate improvement trend over recent iterations
   */
  private calculateImprovementTrend(session: QualityLoopSession): number {
    if (session.iterations.length < 2) return 10; // Assume positive for first iteration

    const recentIterations = session.iterations.slice(-2);
    const totalImprovement = recentIterations.reduce((sum, iter) => sum + iter.score_improvement, 0);
    return totalImprovement;
  }

  /**
   * Calculate total improvement across all iterations
   */
  private calculateTotalImprovement(session: QualityLoopSession): number {
    if (session.iterations.length === 0) return 0;
    
    const firstScore = session.iterations[0].initial_score;
    const lastScore = session.iterations[session.iterations.length - 1].final_score;
    return lastScore - firstScore;
  }

  /**
   * Get pending approval actions
   */
  private getPendingApprovals(
    lastIteration: ImprovementIteration | undefined,
    userApprovals?: Record<string, boolean>
  ): string[] {
    if (!lastIteration?.consultant_response) return [];

    const manualActions = lastIteration.consultant_response.next_actions
      .filter((action: any) => action.approval_required)
      .map((action: any) => action.description);

    // Filter out already approved actions
    return manualActions.filter((action: any) => !(action in (userApprovals || {})));
  }

  /**
   * Determine next improvement focus based on analysis
   */
  private determineNextFocus(session: QualityLoopSession): string {
    const lastIteration = session.iterations[session.iterations.length - 1];
    if (!lastIteration?.consultant_response) return 'general_improvement';

    const analysis = lastIteration.consultant_response.analysis;
    const lowestDimension = Object.entries(analysis.dimension_scores)
      .sort(([,a], [,b]) => (a as number) - (b as number))[0];

    return lowestDimension[0] as string;
  }

  /**
   * Get session status
   */
  getSessionStatus(sessionId: string): QualityLoopSession | null {
    return this.activeSessions.get(sessionId) || null;
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): QualityLoopSession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Get analytics data
   */
  getAnalytics(): any {
    return this.analytics.getAnalytics();
  }
}

/**
 * Analytics tracking for quality loop performance
 */
class QualityLoopAnalytics {
  private sessions: QualityLoopSession[] = [];
  private metrics = {
    total_sessions: 0,
    successful_sessions: 0,
    average_iterations: 0,
    average_improvement: 0,
    average_session_time: 0,
    quality_gate_pass_rate: 0
  };

  recordSessionStart(session: QualityLoopSession): void {
    this.metrics.total_sessions++;
  }

  recordIteration(session: QualityLoopSession, iteration: ImprovementIteration): void {
    // Analytics logic for iteration tracking
  }

  recordSessionComplete(session: QualityLoopSession, reason: string): void {
    this.sessions.push(session);
    
    if (session.success) {
      this.metrics.successful_sessions++;
    }

    this.updateMetrics();
  }

  private updateMetrics(): void {
    if (this.sessions.length === 0) return;

    this.metrics.average_iterations = this.sessions.reduce((sum, s) => sum + s.iterations.length, 0) / this.sessions.length;
    this.metrics.average_improvement = this.sessions.reduce((sum, s) => sum + s.total_improvement, 0) / this.sessions.length;
    this.metrics.quality_gate_pass_rate = this.metrics.successful_sessions / this.metrics.total_sessions;
    
    const totalTime = this.sessions.reduce((sum, s) => {
      return sum + (s.session_end ? s.session_end.getTime() - s.session_start.getTime() : 0);
    }, 0);
    this.metrics.average_session_time = totalTime / this.sessions.length;
  }

  getAnalytics(): any {
    return {
      ...this.metrics,
      recent_sessions: this.sessions.slice(-10)
    };
  }
} 