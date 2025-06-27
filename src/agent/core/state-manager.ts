/**
 * State Manager для централизованного управления состоянием воркфлоу
 * Заменяет передачу данных между инструментами через LLM
 */

import { 
  EmailGenerationRequest, 
  EmailGenerationState,
  PriceData,
  AssetData,
  ContentData,
  CampaignMetadata 
} from '../types';

export type WorkflowStage = 
  | 'initial'
  | 'context_gathering'
  | 'data_fetching' 
  | 'content_generation'
  | 'rendering'
  | 'quality_assurance'
  | 'finalization'
  | 'completed'
  | 'error';

export interface WorkflowProgress {
  currentStage: WorkflowStage;
  completedSteps: string[];
  failedSteps: Array<{
    step: string;
    error: string;
    timestamp: Date;
  }>;
  startTime: Date;
  estimatedDuration: number;
  actualDuration?: number;
}

export class StateManager {
  private state: EmailGenerationState;
  private progress: WorkflowProgress;
  private listeners: Array<(state: EmailGenerationState, progress: WorkflowProgress) => void> = [];

  constructor(request: EmailGenerationRequest) {
    this.state = {
      brief: request.topic,
      currentDate: new Date(),
      prices: null,
      assets: [],
      copy: null,
      html: null,
      qaScore: 0,
      metadata: {
        topic: request.topic,
        routes_analyzed: [],
        date_ranges: [],
        prices_found: 0,
        content_variations: 0
      }
    };

    this.progress = {
      currentStage: 'initial',
      completedSteps: [],
      failedSteps: [],
      startTime: new Date(),
      estimatedDuration: 30 // default 30 seconds
    };
  }

  /**
   * Получить текущее состояние
   */
  getState(): Readonly<EmailGenerationState> {
    return { ...this.state };
  }

  /**
   * Получить прогресс выполнения
   */
  getProgress(): Readonly<WorkflowProgress> {
    return { ...this.progress };
  }

  /**
   * Обновить часть состояния
   */
  updateState(updates: Partial<EmailGenerationState>): void {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }

  /**
   * Установить цены
   */
  setPrices(prices: PriceData): void {
    this.state.prices = prices;
    this.state.metadata.prices_found = prices.prices.length;
    this.state.metadata.routes_analyzed = Array.from(
      new Set(prices.prices.map(p => `${p.origin}-${p.destination}`))
    );
    this.notifyListeners();
  }

  /**
   * Добавить ассеты
   */
  addAssets(assets: AssetData): void {
    this.state.assets.push(assets);
    this.notifyListeners();
  }

  /**
   * Установить контент
   */
  setContent(content: ContentData): void {
    this.state.copy = content;
    this.state.metadata.content_variations = 1;
    this.notifyListeners();
  }

  /**
   * Установить HTML
   */
  setHtml(html: string): void {
    this.state.html = html;
    this.notifyListeners();
  }

  /**
   * Установить QA скор
   */
  setQaScore(score: number): void {
    this.state.qaScore = score;
    this.notifyListeners();
  }

  /**
   * Обновить стадию воркфлоу
   */
  setStage(stage: WorkflowStage): void {
    this.progress.currentStage = stage;
    this.notifyListeners();
  }

  /**
   * Отметить шаг как завершенный
   */
  markStepCompleted(step: string): void {
    if (!this.progress.completedSteps.includes(step)) {
      this.progress.completedSteps.push(step);
    }
    this.notifyListeners();
  }

  /**
   * Отметить шаг как неудачный
   */
  markStepFailed(step: string, error: string): void {
    this.progress.failedSteps.push({
      step,
      error,
      timestamp: new Date()
    });
    this.notifyListeners();
  }

  /**
   * Проверить, выполнен ли шаг
   */
  isStepCompleted(step: string): boolean {
    return this.progress.completedSteps.includes(step);
  }

  /**
   * Проверить, провалился ли шаг
   */
  isStepFailed(step: string): boolean {
    return this.progress.failedSteps.some(f => f.step === step);
  }

  /**
   * Получить данные для передачи в инструменты
   */
  getContextForTools(): Record<string, any> {
    return {
      brief: this.state.brief,
      currentDate: this.state.currentDate,
      prices: this.state.prices,
      assets: this.state.assets,
      copy: this.state.copy,
      html: this.state.html,
      qaScore: this.state.qaScore,
      completedSteps: this.progress.completedSteps,
      currentStage: this.progress.currentStage
    };
  }

  /**
   * Валидация состояния для конкретного шага
   */
  validateStateForStep(step: string): { valid: boolean; missing: string[] } {
    const missing: string[] = [];

    switch (step) {
      case 'get_prices':
        if (!this.state.brief) missing.push('brief');
        break;
      
      case 'get_figma_assets':
        if (!this.state.brief) missing.push('brief');
        break;
      
      case 'generate_copy':
        if (!this.state.prices && !this.state.assets.length) {
          missing.push('prices or assets');
        }
        break;
      
      case 'render_mjml':
        if (!this.state.copy) missing.push('copy');
        if (this.state.assets.length === 0) missing.push('assets');
        break;
      
      case 'ai_quality_consultant':
        if (!this.state.html) missing.push('html');
        break;
      
      case 'upload_s3':
        if (!this.state.html) missing.push('html');
        if (this.state.qaScore < 70) missing.push('sufficient_qa_score');
        break;
    }

    return {
      valid: missing.length === 0,
      missing
    };
  }

  /**
   * Получить статистику выполнения
   */
  getExecutionStats(): {
    progress: number;
    duration: number;
    successful_steps: number;
    failed_steps: number;
    estimated_remaining: number;
  } {
    const totalSteps = 8; // Примерное количество основных шагов
    const completedCount = this.progress.completedSteps.length;
    const duration = Date.now() - this.progress.startTime.getTime();
    
    return {
      progress: Math.round((completedCount / totalSteps) * 100),
      duration: Math.round(duration / 1000), // в секундах
      successful_steps: completedCount,
      failed_steps: this.progress.failedSteps.length,
      estimated_remaining: Math.max(0, this.progress.estimatedDuration - (duration / 1000))
    };
  }

  /**
   * Установить оценочную продолжительность
   */
  setEstimatedDuration(seconds: number): void {
    this.progress.estimatedDuration = seconds;
  }

  /**
   * Завершить выполнение
   */
  markCompleted(success: boolean = true): void {
    this.progress.currentStage = success ? 'completed' : 'error';
    this.progress.actualDuration = Date.now() - this.progress.startTime.getTime();
    this.notifyListeners();
  }

  /**
   * Подписаться на изменения состояния
   */
  subscribe(listener: (state: EmailGenerationState, progress: WorkflowProgress) => void): () => void {
    this.listeners.push(listener);
    
    // Возвращаем функцию отписки
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Уведомить всех подписчиков об изменении
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getState(), this.getProgress());
      } catch (error) {
        console.error('StateManager: Error in listener:', error);
      }
    });
  }

  /**
   * Создать сериализуемый снапшот состояния
   */
  createSnapshot(): {
    state: EmailGenerationState;
    progress: WorkflowProgress;
    timestamp: Date;
  } {
    return {
      state: this.getState(),
      progress: this.getProgress(),
      timestamp: new Date()
    };
  }

  /**
   * Восстановить состояние из снапшота
   */
  restoreFromSnapshot(snapshot: {
    state: EmailGenerationState;
    progress: WorkflowProgress;
  }): void {
    this.state = { ...snapshot.state };
    this.progress = { ...snapshot.progress };
    this.notifyListeners();
  }

  /**
   * Получить резюме для логирования
   */
  getSummary(): string {
    const stats = this.getExecutionStats();
    return [
      `Stage: ${this.progress.currentStage}`,
      `Progress: ${stats.progress}%`,
      `Duration: ${stats.duration}s`,
      `Steps: ${stats.successful_steps}✅ ${stats.failed_steps}❌`,
      `QA Score: ${this.state.qaScore}/100`
    ].join(' | ');
  }
}