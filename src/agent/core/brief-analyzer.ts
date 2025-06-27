/**
 * Brief Analyzer - Интеллектуальный анализ и уточнение брифа
 * Анализирует неоднозначности и предлагает интерактивные уточнения
 */

import { EmailGenerationRequest } from '../types';
import { UltraThinkEngine } from '../ultrathink';

export interface AmbiguityIssue {
  type: 'missing_info' | 'unclear_intent' | 'conflicting_params' | 'optimization_opportunity';
  field: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  suggestions: string[];
  examples?: string[];
  impact: string;
}

export interface BriefAnalysisResult {
  score: number; // 0-100, качество брифа
  clarity: number; // 0-100, ясность требований  
  completeness: number; // 0-100, полнота информации
  feasibility: number; // 0-100, выполнимость
  issues: AmbiguityIssue[];
  recommendations: string[];
  estimatedDuration: number; // в секундах
  confidence: number; // 0-100, уверенность в анализе
}

export interface ClarificationRequest {
  id: string;
  question: string;
  type: 'single_choice' | 'multiple_choice' | 'text_input' | 'confirmation';
  options?: string[];
  defaultValue?: string;
  required: boolean;
  context: string;
  impact: string;
}

export interface BriefRefinementResult {
  originalRequest: EmailGenerationRequest;
  refinedRequest: EmailGenerationRequest;
  clarifications: Array<{
    question: string;
    answer: string;
    impact: string;
  }>;
  improvements: string[];
  confidenceBoost: number; // на сколько процентов выросла уверенность
}

export class BriefAnalyzer {
  private ultraThink?: UltraThinkEngine;

  constructor(ultraThink?: UltraThinkEngine) {
    this.ultraThink = ultraThink;
  }

  /**
   * Анализ брифа на неоднозначности и проблемы
   */
  async analyzeBrief(request: EmailGenerationRequest): Promise<BriefAnalysisResult> {
    console.log('🔍 Analyzing brief for ambiguities and issues...');
    
    const issues: AmbiguityIssue[] = [];
    let score = 100;
    
    // Анализ основных полей
    const topicAnalysis = this.analyzeTopicClarity(request.topic);
    if (topicAnalysis.issues.length > 0) {
      issues.push(...topicAnalysis.issues);
      score -= topicAnalysis.penalty;
    }
    
    // Анализ маршрута
    const routeAnalysis = this.analyzeRouteSpecificity(request.origin, request.destination);
    if (routeAnalysis.issues.length > 0) {
      issues.push(...routeAnalysis.issues);
      score -= routeAnalysis.penalty;
    }
    
    // Анализ временных параметров
    const dateAnalysis = this.analyzeDateParameters(request.date_range);
    if (dateAnalysis.issues.length > 0) {
      issues.push(...dateAnalysis.issues);
      score -= dateAnalysis.penalty;
    }
    
    // Анализ целевой аудитории
    const audienceAnalysis = this.analyzeTargetAudience(request.target_audience);
    if (audienceAnalysis.issues.length > 0) {
      issues.push(...audienceAnalysis.issues);
      score -= audienceAnalysis.penalty;
    }
    
    // Анализ типа кампании и тона
    const campaignAnalysis = this.analyzeCampaignConsistency(
      request.campaign_type, 
      request.tone, 
      request.target_audience
    );
    if (campaignAnalysis.issues.length > 0) {
      issues.push(...campaignAnalysis.issues);
      score -= campaignAnalysis.penalty;
    }
    
    // UltraThink расширенный анализ
    if (this.ultraThink) {
      console.log('🧠 UltraThink: Performing advanced brief analysis...');
      const advancedAnalysis = await this.performAdvancedAnalysis(request);
      issues.push(...advancedAnalysis.issues);
      score = Math.max(0, score - advancedAnalysis.penalty);
    }
    
    // Расчет метрик
    const clarity = this.calculateClarity(issues);
    const completeness = this.calculateCompleteness(request, issues);
    const feasibility = this.calculateFeasibility(request, issues);
    const confidence = this.calculateConfidence(score, issues.length);
    const estimatedDuration = this.estimateDuration(request, issues);
    
    // Генерация рекомендаций
    const recommendations = this.generateRecommendations(issues, request);
    
    const result: BriefAnalysisResult = {
      score: Math.max(0, Math.min(100, score)),
      clarity,
      completeness,
      feasibility,
      issues: issues.sort((a, b) => this.getSeverityWeight(b.severity) - this.getSeverityWeight(a.severity)),
      recommendations,
      estimatedDuration,
      confidence
    };
    
    console.log(`🔍 Brief analysis complete: Score ${result.score}/100, ` +
                `${issues.length} issues found (${issues.filter(i => i.severity === 'critical').length} critical)`);
    
    return result;
  }

  /**
   * Генерация вопросов для уточнения брифа
   */
  generateClarificationQuestions(analysis: BriefAnalysisResult): ClarificationRequest[] {
    const questions: ClarificationRequest[] = [];
    
    // Приоритет критическим и важным проблемам
    const priorityIssues = analysis.issues
      .filter(issue => ['critical', 'high'].includes(issue.severity))
      .slice(0, 5); // Не более 5 вопросов за раз
    
    for (const issue of priorityIssues) {
      const question = this.createClarificationQuestion(issue);
      if (question) {
        questions.push(question);
      }
    }
    
    // Добавляем оптимизационные вопросы если основные проблемы решены
    if (questions.length < 3) {
      const optimizationIssues = analysis.issues
        .filter(issue => issue.type === 'optimization_opportunity')
        .slice(0, 3 - questions.length);
        
      for (const issue of optimizationIssues) {
        const question = this.createClarificationQuestion(issue);
        if (question) {
          questions.push(question);
        }
      }
    }
    
    return questions;
  }

  /**
   * Применение уточнений к брифу
   */
  async refineBrief(
    originalRequest: EmailGenerationRequest,
    clarifications: Array<{ questionId: string; answer: string }>
  ): Promise<BriefRefinementResult> {
    console.log('✨ Refining brief with clarifications...');
    
    let refinedRequest = { ...originalRequest };
    const appliedClarifications: Array<{ question: string; answer: string; impact: string }> = [];
    const improvements: string[] = [];
    let confidenceBoost = 0;
    
    for (const clarification of clarifications) {
      const application = await this.applyClarification(refinedRequest, clarification);
      if (application.success) {
        refinedRequest = application.updatedRequest;
        appliedClarifications.push({
          question: application.question,
          answer: clarification.answer,
          impact: application.impact
        });
        improvements.push(application.improvement);
        confidenceBoost += application.confidenceBoost;
      }
    }
    
    // UltraThink валидация финального брифа
    if (this.ultraThink) {
      console.log('🧠 UltraThink: Brief validation enabled');
      confidenceBoost += 10; // Базовый буст за использование UltraThink
    }
    
    console.log(`✨ Brief refinement complete: ${improvements.length} improvements, ` +
                `+${confidenceBoost.toFixed(1)}% confidence`);
    
    return {
      originalRequest,
      refinedRequest,
      clarifications: appliedClarifications,
      improvements,
      confidenceBoost: Math.min(50, confidenceBoost) // Cap at 50% boost
    };
  }

  /**
   * Приватные методы анализа
   */

  private analyzeTopicClarity(topic: string | undefined): { issues: AmbiguityIssue[]; penalty: number } {
    const issues: AmbiguityIssue[] = [];
    let penalty = 0;
    
    if (!topic || topic.trim().length === 0) {
      issues.push({
        type: 'missing_info',
        field: 'topic',
        severity: 'critical',
        description: 'Тема письма не указана',
        suggestions: ['Укажите конкретную тему кампании', 'Опишите основную цель письма'],
        impact: 'Невозможно создать релевантный контент без темы'
      });
      penalty = 30;
    } else if (topic.length < 10) {
      issues.push({
        type: 'unclear_intent',
        field: 'topic',
        severity: 'high',
        description: 'Тема слишком краткая и неинформативная',
        suggestions: [
          'Добавьте больше деталей о цели кампании',
          'Укажите конкретное предложение или акцию',
          'Опишите какую реакцию ожидаете от получателей'
        ],
        examples: [
          'Вместо "Скидки" → "Скидки до 50% на авиабилеты в Европу на майские праздники"',
          'Вместо "Лето" → "Летние направления 2025: раннее бронирование со скидкой 30%"'
        ],
        impact: 'Снижение релевантности и эффективности контента'
      });
      penalty = 15;
    } else if (!this.containsActionableWords(topic)) {
      issues.push({
        type: 'optimization_opportunity',
        field: 'topic',
        severity: 'medium',
        description: 'Тема не содержит призыва к действию или конкретного предложения',
        suggestions: [
          'Добавьте элемент срочности (ограниченное время)',
          'Укажите конкретную выгоду для клиента',
          'Включите призыв к действию'
        ],
        examples: [
          'Добавить: "только до 31 мая"',
          'Добавить: "сэкономьте до 40%"'
        ],
        impact: 'Возможность повысить engagement и конверсию'
      });
      penalty = 5;
    }
    
    return { issues, penalty };
  }

  private analyzeRouteSpecificity(origin?: string, destination?: string): { issues: AmbiguityIssue[]; penalty: number } {
    const issues: AmbiguityIssue[] = [];
    let penalty = 0;
    
    if (!origin && !destination) {
      issues.push({
        type: 'optimization_opportunity',
        field: 'route',
        severity: 'medium',
        description: 'Не указан конкретный маршрут',
        suggestions: [
          'Укажите популярные направления для таргетинга',
          'Добавьте origin/destination для персонализации цен',
          'Рассмотрите сезонные направления'
        ],
        impact: 'Упущенная возможность персонализации и актуальных цен'
      });
      penalty = 5;
    } else if (origin === destination) {
      issues.push({
        type: 'conflicting_params',
        field: 'route',
        severity: 'high',
        description: 'Город отправления совпадает с городом назначения',
        suggestions: ['Укажите разные города', 'Проверьте правильность маршрута'],
        impact: 'Невозможно найти релевантные цены и предложения'
      });
      penalty = 20;
    }
    
    return { issues, penalty };
  }

  private analyzeDateParameters(dateRange?: string): { issues: AmbiguityIssue[]; penalty: number } {
    const issues: AmbiguityIssue[] = [];
    let penalty = 0;
    
    if (!dateRange) {
      issues.push({
        type: 'optimization_opportunity',
        field: 'date_range',
        severity: 'low',
        description: 'Не указан диапазон дат для поиска',
        suggestions: [
          'Укажите конкретные даты для актуальных цен',
          'Добавьте сезонную привязку (лето, новогодние каникулы)',
          'Используйте диапазон для лучших предложений'
        ],
        impact: 'Возможность показать более актуальные цены и предложения'
      });
      penalty = 3;
    } else {
      // Проверка формата даты
      const datePattern = /^\d{4}-\d{2}-\d{2}(,\d{4}-\d{2}-\d{2})?$/;
      if (!datePattern.test(dateRange)) {
        issues.push({
          type: 'unclear_intent',
          field: 'date_range',
          severity: 'medium',
          description: 'Неправильный формат диапазона дат',
          suggestions: [
            'Используйте формат YYYY-MM-DD',
            'Для диапазона: YYYY-MM-DD,YYYY-MM-DD'
          ],
          examples: ['2025-07-15', '2025-07-15,2025-07-22'],
          impact: 'Возможны ошибки при поиске цен'
        });
        penalty = 10;
      }
    }
    
    return { issues, penalty };
  }

  private analyzeTargetAudience(audience?: string): { issues: AmbiguityIssue[]; penalty: number } {
    const issues: AmbiguityIssue[] = [];
    let penalty = 0;
    
    if (!audience) {
      issues.push({
        type: 'optimization_opportunity',
        field: 'target_audience',
        severity: 'medium',
        description: 'Не указана целевая аудитория',
        suggestions: [
          'Укажите демографию (семьи, молодежь, бизнес-путешественники)',
          'Добавьте интересы и потребности аудитории',
          'Определите уровень дохода для таргетинга предложений'
        ],
        examples: [
          'семьи с детьми',
          'молодые пары 25-35 лет',
          'бизнес-путешественники'
        ],
        impact: 'Упущенная возможность персонализации тона и предложений'
      });
      penalty = 8;
    } else if (audience.length < 5) {
      issues.push({
        type: 'unclear_intent',
        field: 'target_audience',
        severity: 'medium',
        description: 'Описание аудитории слишком общее',
        suggestions: [
          'Добавьте больше деталей о целевой группе',
          'Укажите возраст, интересы, потребности',
          'Опишите мотивацию к путешествиям'
        ],
        impact: 'Снижение персонализации контента'
      });
      penalty = 5;
    }
    
    return { issues, penalty };
  }

  private analyzeCampaignConsistency(
    campaignType?: string,
    tone?: string,
    audience?: string
  ): { issues: AmbiguityIssue[]; penalty: number } {
    const issues: AmbiguityIssue[] = [];
    let penalty = 0;
    
    // Анализ соответствия типа кампании и тона
    if (campaignType === 'urgent' && tone === 'casual') {
      issues.push({
        type: 'conflicting_params',
        field: 'campaign_tone',
        severity: 'medium',
        description: 'Срочная кампания не сочетается с непринужденным тоном',
        suggestions: [
          'Для срочных кампаний используйте "urgent" или "direct" тон',
          'Или измените тип кампании на "promotional"'
        ],
        impact: 'Снижение эффективности призыва к действию'
      });
      penalty = 8;
    }
    
    // Анализ соответствия аудитории и тона
    if (audience?.includes('бизнес') && tone === 'playful') {
      issues.push({
        type: 'conflicting_params',
        field: 'audience_tone',
        severity: 'medium',
        description: 'Игривый тон не подходит для бизнес-аудитории',
        suggestions: [
          'Для бизнес-аудитории используйте "professional" или "friendly" тон',
          'Или уточните тип аудитории'
        ],
        impact: 'Несоответствие ожиданиям аудитории'
      });
      penalty = 6;
    }
    
    return { issues, penalty };
  }

  private async performAdvancedAnalysis(request: EmailGenerationRequest): Promise<{ issues: AmbiguityIssue[]; penalty: number }> {
    // Заглушка для UltraThink анализа
    // В реальной реализации здесь был бы вызов UltraThink для глубокого анализа
    const issues: AmbiguityIssue[] = [];
    let penalty = 0;
    
    // Симуляция продвинутого анализа
    if (request.topic && this.detectSeasonalOpportunity(request.topic)) {
      issues.push({
        type: 'optimization_opportunity',
        field: 'seasonal_optimization',
        severity: 'low',
        description: 'Обнаружена возможность сезонной оптимизации',
        suggestions: [
          'Добавьте сезонные элементы в дизайн',
          'Используйте сезонные предложения',
          'Подчеркните актуальность времени года'
        ],
        impact: 'Повышение релевантности и engagement'
      });
      penalty = 0; // Это возможность, не штраф
    }
    
    return { issues, penalty };
  }

  private calculateClarity(issues: AmbiguityIssue[]): number {
    const clarityIssues = issues.filter(i => i.type === 'unclear_intent');
    const penalty = clarityIssues.reduce((sum, issue) => sum + this.getSeverityWeight(issue.severity) * 10, 0);
    return Math.max(0, 100 - penalty);
  }

  private calculateCompleteness(request: EmailGenerationRequest, issues: AmbiguityIssue[]): number {
    const missingInfoIssues = issues.filter(i => i.type === 'missing_info');
    const penalty = missingInfoIssues.reduce((sum, issue) => sum + this.getSeverityWeight(issue.severity) * 15, 0);
    
    // Базовая полнота на основе заполненных полей
    const fields = ['topic', 'origin', 'destination', 'target_audience', 'campaign_type', 'tone'];
    const filledFields = fields.filter(field => request[field as keyof EmailGenerationRequest]);
    const baseCompleteness = (filledFields.length / fields.length) * 100;
    
    return Math.max(0, Math.min(100, baseCompleteness - penalty));
  }

  private calculateFeasibility(request: EmailGenerationRequest, issues: AmbiguityIssue[]): number {
    const conflictingIssues = issues.filter(i => i.type === 'conflicting_params');
    const penalty = conflictingIssues.reduce((sum, issue) => sum + this.getSeverityWeight(issue.severity) * 20, 0);
    return Math.max(0, 100 - penalty);
  }

  private calculateConfidence(score: number, issueCount: number): number {
    let confidence = score;
    confidence -= issueCount * 3; // Каждая проблема снижает уверенность на 3%
    return Math.max(0, Math.min(100, confidence));
  }

  private estimateDuration(request: EmailGenerationRequest, issues: AmbiguityIssue[]): number {
    let baseDuration = 30; // 30 секунд базовое время
    
    // Увеличиваем время для сложных случаев
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;
    
    baseDuration += criticalIssues * 10; // +10 сек за критичную проблему
    baseDuration += highIssues * 5; // +5 сек за важную проблему
    
    // Корректировка на основе сложности
    if (!request.origin || !request.destination) baseDuration += 5;
    if (!request.target_audience) baseDuration += 3;
    
    return baseDuration;
  }

  private generateRecommendations(issues: AmbiguityIssue[], request: EmailGenerationRequest): string[] {
    const recommendations: string[] = [];
    
    // Топ-приоритетные рекомендации
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      recommendations.push('Критически важно: ' + criticalIssues[0].suggestions[0]);
    }
    
    // Быстрые улучшения
    const optimizationIssues = issues.filter(i => i.type === 'optimization_opportunity');
    if (optimizationIssues.length > 0) {
      recommendations.push('Быстрое улучшение: ' + optimizationIssues[0].suggestions[0]);
    }
    
    // Общие рекомендации
    if (!request.target_audience) {
      recommendations.push('Укажите целевую аудиторию для лучшей персонализации');
    }
    
    if (!request.date_range) {
      recommendations.push('Добавьте диапазон дат для актуальных цен');
    }
    
    return recommendations.slice(0, 4); // Максимум 4 рекомендации
  }

  private createClarificationQuestion(issue: AmbiguityIssue): ClarificationRequest | null {
    const id = `${issue.field}_${issue.type}_${Date.now()}`;
    
    switch (issue.field) {
      case 'topic':
        if (issue.type === 'missing_info') {
          return {
            id,
            question: 'Какая основная тема или цель вашей email-кампании?',
            type: 'text_input',
            required: true,
            context: 'Тема определяет весь контент письма',
            impact: 'Позволит создать релевантный и целенаправленный контент'
          };
        }
        break;
        
      case 'route':
        if (issue.type === 'optimization_opportunity') {
          return {
            id,
            question: 'Хотите ли вы включить конкретный маршрут для показа актуальных цен?',
            type: 'single_choice',
            options: ['Да, укажу маршрут', 'Нет, общие предложения', 'Добавлю позже'],
            required: false,
            context: 'Конкретный маршрут позволит показать актуальные цены',
            impact: 'Повысит персонализацию и релевантность предложений'
          };
        }
        break;
        
      case 'target_audience':
        if (issue.type === 'optimization_opportunity') {
          return {
            id,
            question: 'Кто ваша основная целевая аудитория?',
            type: 'multiple_choice',
            options: [
              'Семьи с детьми',
              'Молодые пары (25-35 лет)',
              'Бизнес-путешественники',
              'Студенты и молодежь',
              'Пенсионеры',
              'Люксовые путешественники'
            ],
            required: false,
            context: 'Поможет настроить тон и предложения',
            impact: 'Улучшит персонализацию контента и повысит конверсию'
          };
        }
        break;
    }
    
    return null;
  }

  private async applyClarification(
    request: EmailGenerationRequest,
    clarification: { questionId: string; answer: string }
  ): Promise<{
    success: boolean;
    updatedRequest: EmailGenerationRequest;
    question: string;
    impact: string;
    improvement: string;
    confidenceBoost: number;
  }> {
    const updated = { ...request };
    let question = '';
    let impact = '';
    let improvement = '';
    let confidenceBoost = 0;
    
    // Парсинг ID для определения поля и действия
    const [field, type] = clarification.questionId.split('_');
    
    switch (field) {
      case 'topic':
        if (!updated.topic || updated.topic.length < 10) {
          updated.topic = clarification.answer;
          question = 'Тема кампании';
          impact = 'Улучшен фокус и релевантность контента';
          improvement = 'Добавлена четкая тема кампании';
          confidenceBoost = 25;
        }
        break;
        
      case 'route':
        if (clarification.answer === 'Да, укажу маршрут') {
          // В реальной реализации здесь был бы дополнительный запрос маршрута
          question = 'Включение конкретного маршрута';
          impact = 'Повышена персонализация предложений';
          improvement = 'Включен анализ конкретного маршрута';
          confidenceBoost = 10;
        }
        break;
        
      case 'target':
        if (!updated.target_audience) {
          updated.target_audience = clarification.answer;
          question = 'Целевая аудитория';
          impact = 'Улучшена персонализация тона и предложений';
          improvement = 'Определена целевая аудитория';
          confidenceBoost = 15;
        }
        break;
    }
    
    return {
      success: true,
      updatedRequest: updated,
      question,
      impact,
      improvement,
      confidenceBoost
    };
  }

  private getSeverityWeight(severity: string): number {
    switch (severity) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 1;
    }
  }

  private containsActionableWords(text: string): boolean {
    const actionWords = [
      'скидка', 'акция', 'предложение', 'спецпредложение',
      'ограниченное время', 'только', 'сэкономьте', 'выгода',
      'бесплатно', 'подарок', 'бонус', 'эксклюзивно'
    ];
    
    const lowerText = text.toLowerCase();
    return actionWords.some(word => lowerText.includes(word));
  }

  private detectSeasonalOpportunity(topic: string): boolean {
    const seasonalKeywords = [
      'лето', 'зима', 'весна', 'осень',
      'новый год', 'каникулы', 'праздники',
      'майские', 'отпуск', 'сезон'
    ];
    
    const lowerTopic = topic.toLowerCase();
    return seasonalKeywords.some(keyword => lowerTopic.includes(keyword));
  }
}

// Экспорт singleton instance
export const briefAnalyzer = new BriefAnalyzer();