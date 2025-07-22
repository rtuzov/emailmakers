import { Agent, run } from '@openai/agents';
import { z } from 'zod';
import {
  CorrectionSuggestion,
  AGENT_CONSTANTS
} from '../types/base-agent-types';

export type HandoffType = 'content-to-design' | 'design-to-quality' | 'quality-to-delivery';
import { getUsageModel } from '../../shared/utils/model-config';

/**
 * 🤖 AI CORRECTOR
 * 
 * Система автоматической коррекции данных через AI
 * Принцип: Получает невалидные данные и предложения по исправлению, возвращает исправленные данные
 */

export interface CorrectionResult {
  success: boolean;
  correctedData?: any;
  error?: string;
  attemptsMade: number;
  correctionApplied: string[];
}

export class AICorrector {
  private agent: Agent;
  private correctionAttempts: Map<string, number> = new Map();

  constructor() {
    this.agent = new Agent({
      name: "data-corrector",
      instructions: this.getCorrectorInstructions(),
      model: getUsageModel(),
      modelSettings: {
        temperature: 0.3, // Низкая температура для точной коррекции
        maxTokens: 8000,
        toolChoice: 'auto'
      },
      tools: []
    });

    console.log('🤖 AICorrector initialized');
  }

  /**
   * 🔄 ОСНОВНОЙ МЕТОД КОРРЕКЦИИ ДАННЫХ
   */
  async correctData(
    invalidData: any,
    correctionSuggestions: CorrectionSuggestion[],
    handoffType: HandoffType
  ): Promise<any> {
    const dataHash = this.generateDataHash(invalidData);
    const currentAttempts = this.correctionAttempts.get(dataHash) || 0;
    
    if (currentAttempts >= AGENT_CONSTANTS.HANDOFF_VALIDATION.MAX_AI_CORRECTION_ATTEMPTS) {
      console.error(`🚫 AICorrector: Максимум попыток коррекции достигнут для данных ${dataHash}`);
      return null;
    }

    try {
      this.correctionAttempts.set(dataHash, currentAttempts + 1);

      const correctionPrompt = this.buildCorrectionPrompt(
        invalidData,
        correctionSuggestions,
        handoffType,
        currentAttempts + 1
      );

      console.log(`🔄 AICorrector: Попытка коррекции ${currentAttempts + 1}/${AGENT_CONSTANTS.HANDOFF_VALIDATION.MAX_AI_CORRECTION_ATTEMPTS} для ${handoffType}`);
      console.log(`🔍 AICorrector: Причины коррекции:`, correctionSuggestions.map(s => `${s.field}: ${s.issue}`));

      // Добавляем таймаут для операции коррекции
      const CORRECTION_TIMEOUT = 15000; // 15 секунд максимум
      const correctionPromise = run(this.agent, correctionPrompt);
      
      const response = await Promise.race([
        correctionPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Коррекция превысила таймаут 15 секунд')), CORRECTION_TIMEOUT)
        )
      ]);
      
      if (!response) {
        throw new Error('AI не предоставил ответ');
      }

      // Попытка парсинга ответа как JSON
      const correctedData = this.parseAIResponse(response, handoffType);
      
      if (correctedData) {
        console.log(`✅ AICorrector: Успешная коррекция для ${handoffType} за ${Date.now() - Date.now()} мс`);
        this.correctionAttempts.delete(dataHash); // Сбросить счетчик при успехе
        return correctedData;
      } else {
        throw new Error('Не удалось извлечь корректированные данные из ответа AI');
      }

    } catch (error) {
      console.error(`❌ AICorrector: Попытка ${currentAttempts + 1} не удалась:`, error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error));
      
      // Если это таймаут, возвращаем null немедленно
      if (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error).includes('таймаут')) {
        console.error(`⏱️ AICorrector: Коррекция отменена из-за превышения времени выполнения`);
        this.correctionAttempts.delete(dataHash);
        return null;
      }
      
      return null;
    }
  }

  /**
   * 📝 ПОСТРОЕНИЕ ПРОМПТА ДЛЯ КОРРЕКЦИИ
   */
  private buildCorrectionPrompt(
    invalidData: any,
    suggestions: CorrectionSuggestion[],
    handoffType: HandoffType,
    attemptNumber: number
  ): string {
    const prioritizedSuggestions = suggestions
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

    const criticalSuggestions = prioritizedSuggestions.filter(s => s.priority === 'high');
    const majorSuggestions = prioritizedSuggestions.filter(s => s.priority === 'medium');

    let prompt = `# КРИТИЧЕСКАЯ КОРРЕКЦИЯ ДАННЫХ - ПОПЫТКА ${attemptNumber}

## КОНТЕКСТ
Тип handoff: ${handoffType}
Данные НЕ прошли валидацию и требуют НЕМЕДЛЕННОГО исправления.

## ИСХОДНЫЕ ДАННЫЕ (С ОШИБКАМИ)
\`\`\`json
${JSON.stringify(invalidData, null, 2)}
\`\`\`

## КРИТИЧЕСКИЕ ПРОБЛЕМЫ (ОБЯЗАТЕЛЬНО ИСПРАВИТЬ):
${criticalSuggestions.map((s, i) => `
${i + 1}. **Поле**: ${s.field}
   **Проблема**: ${s.issue}
   **Решение**: ${s.suggestion}
   **Инструкция**: ${s.correctionPrompt}
`).join('\n')}

## ДОПОЛНИТЕЛЬНЫЕ УЛУЧШЕНИЯ:
${majorSuggestions.map((s, i) => `
${i + 1}. **Поле**: ${s.field} - ${s.suggestion}
`).join('\n')}

## ТРЕБОВАНИЯ К КОРРЕКЦИИ:

### ${handoffType === 'content-to-design' ? 'CONTENT → DESIGN СПЕЦИФИЧНЫЕ ТРЕБОВАНИЯ:' : ''}
${handoffType === 'content-to-design' ? `
- ✅ Subject: 1-100 символов, привлекательный заголовок
- ✅ Preheader: 1-150 символов, дополняет subject
- ✅ Body: 10-5000 символов, структурированный контент
- ✅ CTA: 1-50 символов, четкий призыв к действию
- ✅ trace_id: Валидный UUID формат
- ✅ timestamp: ISO datetime формат
- ✅ language: 'ru' или 'en'
- ✅ template_type: 'promotional', 'informational', 'newsletter', 'transactional'
` : ''}

### ${handoffType === 'design-to-quality' ? 'DESIGN → QUALITY СПЕЦИФИЧНЫЕ ТРЕБОВАНИЯ:' : ''}
${handoffType === 'design-to-quality' ? `
- ✅ HTML контент: Корректный, валидный, >100 символов
- ✅ Размер файла: СТРОГО ≤100KB (102400 байт)
- ✅ MJML source: Валидный MJML код
- ✅ Asset URLs: Корректные URL адреса
- ✅ Время рендеринга: ≤1000мс
- ✅ CSS правила: Минимизированы, инлайн стили
- ✅ total_size_kb: ≤100KB ОБЯЗАТЕЛЬНО
` : ''}

### ${handoffType === 'quality-to-delivery' ? 'QUALITY → DELIVERY СПЕЦИФИЧНЫЕ ТРЕБОВАНИЯ:' : ''}
${handoffType === 'quality-to-delivery' ? `
- ✅ Quality score: ОБЯЗАТЕЛЬНО ≥70 баллов
- ✅ WCAG AA compliance: ОБЯЗАТЕЛЬНО true
- ✅ Email client compatibility: ≥95% совместимость
- ✅ Spam score: ≤3 баллов СТРОГО
- ✅ W3C HTML compliance: ОБЯЗАТЕЛЬНО true
- ✅ Accessibility score: ≥80 баллов
- ✅ Все performance scores: ≥70 баллов
` : ''}

## ИНСТРУКЦИИ ПО ВЫВОДУ:

1. **АНАЛИЗИРУЙТЕ** все проблемы внимательно
2. **ИСПРАВЬТЕ** ВСЕ критические ошибки (priority: high)
3. **УЛУЧШИТЕ** показатели согласно требованиям
4. **ВЕРНИТЕ** ТОЛЬКО исправленные данные в JSON формате
5. **НЕ ДОБАВЛЯЙТЕ** никакие комментарии или объяснения

## ФОРМАТ ОТВЕТА:
Верните ТОЛЬКО валидный JSON объект с исправленными данными. Никаких дополнительных текстов, объяснений или комментариев. Только чистый JSON:

\`\`\`json
{
  // исправленные данные здесь
}
\`\`\`

КРИТИЧНО: Данные ДОЛЖНЫ пройти валидацию после коррекции. Это попытка ${attemptNumber} из ${AGENT_CONSTANTS.HANDOFF_VALIDATION.MAX_AI_CORRECTION_ATTEMPTS}.`;

    return prompt;
  }

  /**
   * 🧠 ИНСТРУКЦИИ ДЛЯ AI КОРРЕКТОРА
   */
  private getCorrectorInstructions(): string {
    return `You are a Data Correction Specialist for email generation workflow.

MISSION: Fix validation errors in handoff data between agents quickly and accurately.

CORE PRINCIPLES:
1. Fix only what's broken, preserve what works
2. Ensure compliance with size and format requirements
3. Return ONLY valid JSON, no explanations

KEY REQUIREMENTS BY HANDOFF TYPE:
- content-to-design: Valid content structure, proper metadata
- design-to-quality: HTML validation, size <100KB, MJML compliance
- quality-to-delivery: Quality scores ≥70, WCAG AA compliance

OUTPUT: Return ONLY the corrected JSON object. No markdown, no explanations, no additional text.

TIMEOUT: You have 10 seconds maximum to complete the correction.`;
  }

  /**
   * 🔍 ПАРСИНГ ОТВЕТА AI
   */
  private parseAIResponse(response: any, handoffType: HandoffType): any {
    const content = typeof response === 'string' ? response : JSON.stringify(response);
    try {
      // Поиск JSON в ответе
      const jsonMatch = content.match(/```json\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }

      // Попытка парсинга всего контента как JSON
      const trimmedContent = content.trim();
      if (trimmedContent.startsWith('{') && trimmedContent.endsWith('}')) {
        return JSON.parse(trimmedContent);
      }

      // Поиск JSON объекта в тексте
      const jsonObjectMatch = content.match(/\{[\s\S]*\}/);
      if (jsonObjectMatch) {
        return JSON.parse(jsonObjectMatch[0]);
      }

      console.error('❌ AICorrector: Не удалось найти JSON в ответе AI:', content.substring(0, 200));
      return null;

    } catch (error) {
      console.error('❌ AICorrector: Ошибка парсинга JSON ответа:', error);
      console.error('Проблемный контент:', content.substring(0, 500));
      return null;
    }
  }

  /**
   * 🔐 ГЕНЕРАЦИЯ ХЕША ДЛЯ ДАННЫХ
   */
  private generateDataHash(data: any): string {
    const dataString = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * 📊 СТАТИСТИКА КОРРЕКЦИЙ
   */
  public getCorrectionStats(): {
    activeCorrections: number;
    totalAttempts: number;
    averageAttempts: number;
  } {
    const attempts = Array.from(this.correctionAttempts.values());
    return {
      activeCorrections: this.correctionAttempts.size,
      totalAttempts: attempts.reduce((sum, count) => sum + count, 0),
      averageAttempts: attempts.length > 0 ? attempts.reduce((sum, count) => sum + count, 0) / attempts.length : 0
    };
  }

  /**
   * 🧹 ОЧИСТКА СТАРЫХ ПОПЫТОК
   */
  public clearCorrectionHistory(): void {
    this.correctionAttempts.clear();
    console.log('🧹 AICorrector: История коррекций очищена');
  }
}