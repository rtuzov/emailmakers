/**
 * 👤 HUMAN OVERSIGHT DASHBOARD - Phase 2: Система human oversight для критических решений
 * 
 * Интерфейс для принятия решений человеком-экспертом по критическим
 * изменениям порогов и оптимизации с полным контекстом и анализом рисков.
 */

import { EventEmitter } from 'events';
import { 
  ThresholdChangeRequest, 
  ThresholdAdjustment,
  HumanOversightDecision 
} from './dynamic-thresholds-engine';
import { OptimizationRecommendation, SystemAnalysis } from '../optimization-types';

export interface OversightUser {
  id: string;
  name: string;
  role: 'admin' | 'senior_engineer' | 'team_lead' | 'reviewer';
  permissions: OversightPermission[];
  email: string;
  notification_preferences: NotificationPreferences;
}

export interface OversightPermission {
  action: 'approve_thresholds' | 'approve_optimizations' | 'emergency_rollback' | 'view_analytics';
  scope: 'all' | 'low_risk' | 'medium_risk' | 'high_risk';
  requires_second_approval?: boolean;
}

export interface NotificationPreferences {
  email_enabled: boolean;
  slack_enabled: boolean;
  urgent_only: boolean;
  daily_summary: boolean;
}

export interface OversightContext {
  // System state
  current_system_health: number;
  recent_incidents: SystemIncident[];
  active_alerts: SystemAlert[];
  
  // Historical context
  similar_decisions: PreviousDecision[];
  success_rate_for_similar: number;
  
  // Risk analysis
  predicted_outcomes: PredictedOutcome[];
  risk_mitigation_options: RiskMitigation[];
  
  // Expert recommendations
  ai_recommendation: 'approve' | 'reject' | 'modify';
  ai_confidence: number;
  ai_reasoning: string;
}

export interface SystemIncident {
  id: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  root_cause?: string;
  resolved: boolean;
}

export interface SystemAlert {
  id: string;
  metric: string;
  current_value: number;
  threshold_value: number;
  severity: 'warning' | 'critical';
  duration_minutes: number;
}

export interface PreviousDecision {
  timestamp: string;
  decision_type: 'threshold_change' | 'optimization';
  decision: 'approved' | 'rejected';
  outcome: 'successful' | 'failed' | 'rolled_back';
  similarity_score: number;
}

export interface PredictedOutcome {
  scenario: string;
  probability: number;
  impact_description: string;
  metrics_affected: string[];
  estimated_duration: string;
}

export interface RiskMitigation {
  risk: string;
  mitigation_action: string;
  effectiveness: number;
  implementation_effort: 'low' | 'medium' | 'high';
}

export interface DecisionRequest {
  id: string;
  type: 'threshold_change' | 'optimization_approval' | 'emergency_action';
  created_at: string;
  expires_at: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Request content
  threshold_request?: ThresholdChangeRequest;
  optimization_request?: OptimizationRecommendation;
  emergency_context?: EmergencyContext;
  
  // Decision context
  context: OversightContext;
  required_approvals: number;
  received_approvals: HumanOversightDecision[];
  
  // Status
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'escalated';
  final_decision?: HumanOversightDecision;
}

export interface EmergencyContext {
  incident_id: string;
  severity: 'critical' | 'disaster';
  affected_systems: string[];
  business_impact: string;
  immediate_action_required: string;
}

export interface OversightMetrics {
  total_decisions_today: number;
  approval_rate: number;
  average_decision_time_minutes: number;
  decisions_by_type: Record<string, number>;
  user_activity: Record<string, number>;
  system_health_correlation: number;
}

export class HumanOversightDashboard extends EventEmitter {
  private users: Map<string, OversightUser> = new Map();
  private pendingDecisions: Map<string, DecisionRequest> = new Map();
  private decisionHistory: DecisionRequest[] = [];
  private notifications: NotificationService;
  private analytics: OversightAnalytics;

  constructor() {
    super();
    
    this.notifications = new NotificationService();
    this.analytics = new OversightAnalytics();
    
    console.log('👤 HumanOversightDashboard initialized');
    this.setupDefaultUsers();
  }

  /**
   * Регистрация пользователя с правами oversight
   */
  public registerUser(user: OversightUser): void {
    this.users.set(user.id, user);
    console.log(`👤 Registered oversight user: ${user.name} (${user.role})`);
    
    this.emit('user_registered', user);
  }

  /**
   * Создание запроса на принятие решения
   */
  public async createDecisionRequest(
    type: DecisionRequest['type'],
    content: any,
    priority: DecisionRequest['priority'] = 'medium'
  ): Promise<DecisionRequest> {
    const requestId = `decision-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🚨 Creating ${priority} priority decision request: ${type}`);

    // Генерируем контекст для принятия решения
    const context = await this.generateOversightContext(type, content);
    
    // Определяем количество необходимых подтверждений
    const requiredApprovals = this.calculateRequiredApprovals(type, priority, content);
    
    // Рассчитываем время истечения
    const expirationHours = this.getExpirationHours(priority);
    const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000).toISOString();

    const request: DecisionRequest = {
      id: requestId,
      type,
      created_at: new Date().toISOString(),
      expires_at: expiresAt,
      priority,
      context,
      required_approvals: requiredApprovals,
      received_approvals: [],
      status: 'pending'
    };

    // Добавляем специфичный контент
    if (type === 'threshold_change') {
      request.threshold_request = content as ThresholdChangeRequest;
    } else if (type === 'optimization_approval') {
      request.optimization_request = content as OptimizationRecommendation;
    } else if (type === 'emergency_action') {
      request.emergency_context = content as EmergencyContext;
    }

    // Сохраняем запрос
    this.pendingDecisions.set(requestId, request);

    // Отправляем уведомления
    await this.sendNotifications(request);

    // Запускаем автоматическое отслеживание истечения
    this.scheduleExpiration(request);

    this.emit('decision_request_created', request);
    return request;
  }

  /**
   * Обработка решения пользователя
   */
  public async submitDecision(
    requestId: string,
    userId: string,
    decision: HumanOversightDecision
  ): Promise<{ approved: boolean; request: DecisionRequest }> {
    const request = this.pendingDecisions.get(requestId);
    if (!request) {
      throw new Error(`Decision request ${requestId} not found`);
    }

    const user = this.users.get(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    // Проверяем права пользователя
    if (!this.hasPermission(user, request)) {
      throw new Error(`User ${userId} does not have permission for this decision type`);
    }

    console.log(`👤 ${user.name} submitted decision for ${requestId}: ${decision.decision}`);

    // Добавляем решение
    decision.reviewer = user.name;
    decision.timestamp = new Date().toISOString();
    request.received_approvals.push(decision);

    // Проверяем, достаточно ли подтверждений
    const approvalCount = request.received_approvals.filter(d => d.decision === 'approve').length;
    const rejectionCount = request.received_approvals.filter(d => d.decision === 'reject').length;

    let finalStatus: DecisionRequest['status'] = 'pending';
    let approved = false;

    if (rejectionCount > 0) {
      // Любое отклонение отменяет запрос
      finalStatus = 'rejected';
      request.final_decision = request.received_approvals.find(d => d.decision === 'reject');
    } else if (approvalCount >= request.required_approvals) {
      // Достаточно подтверждений
      finalStatus = 'approved';
      approved = true;
      request.final_decision = decision;
    }

    if (finalStatus !== 'pending') {
      request.status = finalStatus;
      
      // Перемещаем в историю
      this.decisionHistory.push(request);
      this.pendingDecisions.delete(requestId);

      console.log(`✅ Decision request ${requestId} ${finalStatus}`);
    }

    // Обновляем аналитику
    this.analytics.recordDecision(user.id, request, decision);

    this.emit('decision_submitted', { request, decision, user, approved });
    return { approved, request };
  }

  /**
   * Эскалация просроченных или критических запросов
   */
  public async escalateRequest(requestId: string, reason: string): Promise<void> {
    const request = this.pendingDecisions.get(requestId);
    if (!request) {
      throw new Error(`Decision request ${requestId} not found`);
    }

    console.log(`🚨 Escalating request ${requestId}: ${reason}`);

    // Повышаем приоритет
    request.priority = 'urgent';
    request.status = 'escalated';

    // Уведомляем старших администраторов
    const admins = Array.from(this.users.values()).filter(u => u.role === 'admin');
    await this.notifications.sendEscalationNotification(request, admins, reason);

    this.emit('request_escalated', { request, reason });
  }

  /**
   * Получение текущих ожидающих решений для пользователя
   */
  public getPendingDecisions(userId: string): DecisionRequest[] {
    const user = this.users.get(userId);
    if (!user) return [];

    return Array.from(this.pendingDecisions.values()).filter(request => 
      this.hasPermission(user, request) && request.status === 'pending'
    );
  }

  /**
   * Получение истории решений
   */
  public getDecisionHistory(limit: number = 50): DecisionRequest[] {
    return this.decisionHistory
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  /**
   * Получение метрик oversight
   */
  public getOversightMetrics(): OversightMetrics {
    return this.analytics.generateMetrics();
  }

  // ===== PRIVATE METHODS =====

  private setupDefaultUsers(): void {
    // Создаем администратора по умолчанию
    this.registerUser({
      id: 'admin-1',
      name: 'System Administrator',
      role: 'admin',
      email: 'admin@email-makers.com',
      permissions: [
        { action: 'approve_thresholds', scope: 'all' },
        { action: 'approve_optimizations', scope: 'all' },
        { action: 'emergency_rollback', scope: 'all' },
        { action: 'view_analytics', scope: 'all' }
      ],
      notification_preferences: {
        email_enabled: true,
        slack_enabled: true,
        urgent_only: false,
        daily_summary: true
      }
    });
  }

  private async generateOversightContext(
    type: DecisionRequest['type'], 
    content: any
  ): Promise<OversightContext> {
    // Генерируем контекст для принятия решения
    // В реальной реализации здесь будет анализ системы
    
    return {
      current_system_health: 87, // Заглушка
      recent_incidents: [],
      active_alerts: [],
      similar_decisions: [],
      success_rate_for_similar: 92,
      predicted_outcomes: [
        {
          scenario: 'Successful application',
          probability: 0.8,
          impact_description: 'Improved system performance with reduced false alerts',
          metrics_affected: ['response_time', 'alert_frequency'],
          estimated_duration: '2-4 hours'
        }
      ],
      risk_mitigation_options: [
        {
          risk: 'Performance degradation',
          mitigation_action: 'Immediate rollback if metrics worsen by >10%',
          effectiveness: 95,
          implementation_effort: 'low'
        }
      ],
      ai_recommendation: 'approve',
      ai_confidence: 85,
      ai_reasoning: 'Historical data shows similar changes result in 8% performance improvement with low risk'
    };
  }

  private calculateRequiredApprovals(
    type: DecisionRequest['type'],
    priority: DecisionRequest['priority'],
    content: any
  ): number {
    if (type === 'emergency_action') return 2;
    if (priority === 'urgent') return 2;
    if (type === 'threshold_change') {
      const totalRisk = content.total_risk_score || 0;
      return totalRisk > 50 ? 2 : 1;
    }
    return 1;
  }

  private getExpirationHours(priority: DecisionRequest['priority']): number {
    switch (priority) {
      case 'urgent': return 2;
      case 'high': return 8;
      case 'medium': return 24;
      case 'low': return 72;
      default: return 24;
    }
  }

  private hasPermission(user: OversightUser, request: DecisionRequest): boolean {
    const actionMap = {
      'threshold_change': 'approve_thresholds',
      'optimization_approval': 'approve_optimizations',
      'emergency_action': 'emergency_rollback'
    } as const;

    const requiredAction = actionMap[request.type];
    if (!requiredAction) return false;

    return user.permissions.some(perm => 
      perm.action === requiredAction && 
      (perm.scope === 'all' || this.checkScopeMatch(perm.scope, request))
    );
  }

  private checkScopeMatch(scope: string, request: DecisionRequest): boolean {
    // Упрощенная проверка области видимости
    return true; // В реальной реализации проверяем риск-уровень
  }

  private async sendNotifications(request: DecisionRequest): Promise<void> {
    const eligibleUsers = Array.from(this.users.values()).filter(user => 
      this.hasPermission(user, request)
    );

    await this.notifications.sendDecisionNotification(request, eligibleUsers);
  }

  private scheduleExpiration(request: DecisionRequest): void {
    const expirationTime = new Date(request.expires_at).getTime() - Date.now();
    
    setTimeout(() => {
      if (this.pendingDecisions.has(request.id)) {
        console.log(`⏰ Decision request ${request.id} expired`);
        request.status = 'expired';
        this.decisionHistory.push(request);
        this.pendingDecisions.delete(request.id);
        
        this.emit('request_expired', request);
      }
    }, expirationTime);
  }
}

// ===== SUPPORTING CLASSES =====

class NotificationService {
  async sendDecisionNotification(request: DecisionRequest, users: OversightUser[]): Promise<void> {
    console.log(`📧 Sending decision notification for ${request.id} to ${users.length} users`);
    // TODO: Implement actual notification logic
  }

  async sendEscalationNotification(request: DecisionRequest, admins: OversightUser[], reason: string): Promise<void> {
    console.log(`🚨 Sending escalation notification for ${request.id} to ${admins.length} admins`);
    // TODO: Implement escalation notification logic
  }
}

class OversightAnalytics {
  private decisions: Array<{ userId: string; request: DecisionRequest; decision: HumanOversightDecision; timestamp: string }> = [];

  recordDecision(userId: string, request: DecisionRequest, decision: HumanOversightDecision): void {
    this.decisions.push({
      userId,
      request,
      decision,
      timestamp: new Date().toISOString()
    });
  }

  generateMetrics(): OversightMetrics {
    const today = new Date().toDateString();
    const todayDecisions = this.decisions.filter(d => 
      new Date(d.timestamp).toDateString() === today
    );

    return {
      total_decisions_today: todayDecisions.length,
      approval_rate: this.calculateApprovalRate(todayDecisions),
      average_decision_time_minutes: this.calculateAvgDecisionTime(todayDecisions),
      decisions_by_type: this.groupByType(todayDecisions),
      user_activity: this.groupByUser(todayDecisions),
      system_health_correlation: 0.85 // Заглушка
    };
  }

  private calculateApprovalRate(decisions: any[]): number {
    if (decisions.length === 0) return 0;
    const approvals = decisions.filter(d => d.decision.decision === 'approve').length;
    return Math.round((approvals / decisions.length) * 100);
  }

  private calculateAvgDecisionTime(decisions: any[]): number {
    // Упрощенная реализация
    return 15; // minutes
  }

  private groupByType(decisions: any[]): Record<string, number> {
    return decisions.reduce((acc, d) => {
      acc[d.request.type] = (acc[d.request.type] || 0) + 1;
      return acc;
    }, {});
  }

  private groupByUser(decisions: any[]): Record<string, number> {
    return decisions.reduce((acc, d) => {
      acc[d.userId] = (acc[d.userId] || 0) + 1;
      return acc;
    }, {});
  }
}