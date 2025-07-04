import { HandoffExecution } from './handoff-types';

export function calculateOverallConfidence(agentResults: any): number {
  const confidenceScores = [] as number[];
  if (agentResults.content_specialist?.analytics?.confidence_score) {
    confidenceScores.push(agentResults.content_specialist.analytics.confidence_score);
  }
  if (agentResults.design_specialist?.analytics?.confidence_score) {
    confidenceScores.push(agentResults.design_specialist.analytics.confidence_score);
  }
  if (agentResults.quality_specialist?.analytics?.confidence_score) {
    confidenceScores.push(agentResults.quality_specialist.analytics.confidence_score);
  }
  if (agentResults.delivery_specialist?.analytics?.agent_efficiency) {
    confidenceScores.push(agentResults.delivery_specialist.analytics.agent_efficiency);
  }
  return confidenceScores.length > 0 ? Math.round(confidenceScores.reduce((s, n) => s + n, 0) / confidenceScores.length) : 0;
}

export function calculateWorkflowEfficiency(executionHistory: HandoffExecution[]): number {
  if (executionHistory.length === 0) return 0;
  const successRate = executionHistory.filter(h => h.success).length / executionHistory.length;
  const retryPenalty = executionHistory.reduce((t, h) => t + h.retry_count, 0) * 0.1;
  return Math.max(0, Math.round((successRate - retryPenalty) * 100));
}

export function detectBottlenecks(executionHistory: HandoffExecution[]): string[] {
  const bottlenecks: string[] = [];
  const avgTime = executionHistory.reduce((sum, exec) => sum + ((exec.end_time ?? exec.start_time) - exec.start_time), 0) / executionHistory.length;
  executionHistory.forEach(exec => {
    const execTime = (exec.end_time ?? exec.start_time) - exec.start_time;
    if (execTime > avgTime * 1.5) {
      bottlenecks.push(`${exec.agent_id} (${execTime}ms)`);
    }
    if (exec.retry_count > 1) {
      bottlenecks.push(`${exec.agent_id} retries (${exec.retry_count})`);
    }
  });
  return bottlenecks;
}

export function calculateHandoffAnalytics(executionHistory: HandoffExecution[]): any {
  const completed = executionHistory.filter(e => e.end_time);
  const times = completed.map(e => (e.end_time! - e.start_time));
  return {
    handoff_count: completed.length,
    average_handoff_time: times.length ? Math.round(times.reduce((s, n) => s + n, 0) / times.length) : 0,
    data_transfer_size: 0,
    workflow_efficiency: calculateWorkflowEfficiency(executionHistory),
    bottlenecks_detected: detectBottlenecks(executionHistory),
  };
} 