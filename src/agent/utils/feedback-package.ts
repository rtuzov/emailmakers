export type FeedbackSeverity = 'critical' | 'major' | 'minor';
export type FeedbackReason = 'content_issue' | 'design_issue' | 'technical_issue' | 'qa_issue';

export interface FeedbackIssue {
  type: string;     // e.g. 'html', 'image', 'copy'
  msg: string;      // human-readable description
  location?: string;
}

export interface FeedbackPackage {
  from_role: string;             // e.g. 'quality_specialist'
  to_role: string;               // target specialist
  reason: FeedbackReason;
  severity: FeedbackSeverity;
  notes: string;
  issues: FeedbackIssue[];
  next_step_hint: 'return_to_content' | 'return_to_design' | 'approve_for_delivery' | string;
}

/**
 * Build a standard feedback package. This keeps objects consistent between specialists.
 */
export function buildFeedbackPackage(params: Partial<FeedbackPackage>): FeedbackPackage {
  if (!params.from_role || !params.to_role || !params.reason || !params.severity || !params.notes) {
    throw new Error('Incomplete feedback package params');
  }
  return {
    issues: [],
    next_step_hint: 'return_to_design',
    ...params
  } as FeedbackPackage;
} 