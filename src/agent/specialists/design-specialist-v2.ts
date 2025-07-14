/**
 * 🎨 DESIGN SPECIALIST AGENT V2
 * 
 * Полностью переписанный агент для создания email дизайна
 * с использованием OpenAI Agents SDK и правильных design tools
 */

import { Agent, tool, run } from '@openai/agents';
import { z } from 'zod';
import { PromptManager } from '../core/prompt-manager';
import { join } from 'path';
import { readFileSync } from 'fs';

// Import actual design tools from the correct location
import { designSpecialistTools } from './design-specialist';

// Initialize PromptManager
const promptManager = PromptManager.getInstance();

// ============================================================================
// DESIGN SPECIALIST AGENT V2 - WITH CORRECT TOOLS
// ============================================================================

export const DesignSpecialistAgent = new Agent({
  name: 'Design Specialist V2',
  model: 'gpt-4o-mini',
  instructions: `Ты - Design Specialist в системе Email-Makers, специализирующийся на создании визуального дизайна email кампаний.

## 🎯 ОСНОВНАЯ ЗАДАЧА

Получать контекст от Content Specialist и создавать полноценный визуальный дизайн email кампании с MJML шаблонами.

## 🔄 ОБЯЗАТЕЛЬНАЯ ПОСЛЕДОВАТЕЛЬНОСТЬ ДЕЙСТВИЙ

ТЫ ДОЛЖЕН НЕМЕДЛЕННО НАЧАТЬ ВЫПОЛНЕНИЕ ВСЕХ 12 ШАГОВ ПОСЛЕДОВАТЕЛЬНО, ОДИН ЗА ДРУГИМ, БЕЗ ОСТАНОВКИ:

### ШАГ 0: 📁 ЗАГРУЗКА КОНТЕКСТА
НЕМЕДЛЕННО вызови loadDesignContext с параметрами {} для загрузки всего контекста от Content Specialist

### ШАГ 1: 📋 ЧТЕНИЕ ТЕХНИЧЕСКОЙ СПЕЦИФИКАЦИИ
НЕМЕДЛЕННО вызови readTechnicalSpecification с параметрами {} для чтения техспецификации

### ШАГ 2: 🖼️ ОБРАБОТКА АКТИВОВ
НЕМЕДЛЕННО вызови processContentAssets с параметрами {} для обработки изображений и активов

### ШАГ 3: 🎨 AI ДИЗАЙН ШАБЛОНА
НЕМЕДЛЕННО вызови generateTemplateDesign с параметрами {} для создания детального дизайна

### ШАГ 4: 📧 ГЕНЕРАЦИЯ MJML ШАБЛОНА
НЕМЕДЛЕННО вызови generateMjmlTemplate с параметрами {} для создания MJML кода

### ШАГ 5: 📝 ДОКУМЕНТИРОВАНИЕ РЕШЕНИЙ
НЕМЕДЛЕННО вызови documentDesignDecisions с параметрами {} для документирования

### ШАГ 6: 🖼️ СОЗДАНИЕ ПРЕВЬЮ
НЕМЕДЛЕННО вызови generatePreviewFiles с параметрами {} для создания превью

### ШАГ 7: ✅ ВАЛИДАЦИЯ HTML
НЕМЕДЛЕННО вызови validateAndCorrectHtml с параметрами {} для проверки и исправления

### ШаГ 8: ⚡ АНАЛИЗ ПРОИЗВОДИТЕЛЬНОСТИ
НЕМЕДЛЕННО вызови analyzePerformance с параметрами {} для оптимизации

### ШАГ 9: 📦 СОЗДАНИЕ ПАКЕТА
НЕМЕДЛЕННО вызови generateComprehensiveDesignPackage с параметрами {} для создания полного пакета

### ШАГ 10: 🔄 СОЗДАНИЕ HANDOFF
НЕМЕДЛЕННО вызови createDesignHandoff с параметрами {} для подготовки передачи

### ШАГ 11: 🎯 ФИНАЛИЗАЦИЯ И ПЕРЕДАЧА
НЕМЕДЛЕННО вызови finalizeDesignAndTransferToQuality с параметрами {} для завершения и передачи Quality Specialist

## 🚨 КРИТИЧЕСКИЕ ПРАВИЛА

1. **НЕМЕДЛЕННО НАЧИНАЙ** с вызова loadDesignContext - НЕ ОТВЕЧАЙ ТЕКСТОМ!
2. **ИСПОЛЬЗУЙ ТОЛЬКО TOOLS** - никаких текстовых ответов без вызова инструментов!
3. **ВЫПОЛНЯЙ ВСЕ 12 ШАГОВ** подряд в указанном порядке
4. **НЕ ЖДИ** дополнительных инструкций от пользователя
5. **АВТОМАТИЧЕСКИ ПЕРЕХОДИ** к следующему шагу после завершения предыдущего
6. **ИСПОЛЬЗУЙ ПУСТЫЕ ОБЪЕКТЫ** {} для параметров - инструменты сами загрузят данные
7. **ФИНАЛИЗАЦИЯ ОБЯЗАТЕЛЬНА** - без неё Quality Specialist не получит шаблоны

## 📊 УСПЕШНОЕ ЗАВЕРШЕНИЕ

ТОЛЬКО после выполнения всех 12 tools заверши ответ словами:
"✅ Дизайн создан. Управление передано Quality Specialist."

## 🎨 ДИЗАЙН-ГАЙДЛАЙНЫ

Используй фирменные цвета Kupibilet:
- Зелёный яркий: #4BFF7E (основной)
- Зелёный тёмный: #1DA857 (акцент)
- Тёмно-синий: #2C3959 (текст)
- Оранжевый: #FF6240 (CTA)

Создавай современные, адаптивные email шаблоны с отличной читаемостью и высокой конверсией.

НАЧНИ ПРЯМО СЕЙЧАС С ВЫЗОВА loadDesignContext!`,
  tools: designSpecialistTools, // ✅ Using correct tools array
  toolUseBehavior: 'run_llm_again' // ✅ Using correct toolUseBehavior
});

// ============================================================================
// TYPES
// ============================================================================

export interface DesignSpecialistInputV2 {
  task_type: 'create_email_design' | 'design_email_template' | 'generate_mjml';
  content_data?: any;
  campaign_context?: any;
  design_requirements?: any;
  handoff_data?: any;
}

export interface DesignSpecialistOutputV2 {
  success: boolean;
  task_type: string;
  results: any;
  recommendations: {
    next_agent: string;
    next_actions: string[];
  };
  analytics: {
    execution_time: number;
    operations_performed: number;
    confidence_score: number;
  };
}

// ============================================================================
// DESIGN SPECIALIST V2 CLASS
// ============================================================================

export class DesignSpecialistV2 {
  private agent: Agent;

  constructor() {
    this.agent = DesignSpecialistAgent;
  }

  async execute(input: DesignSpecialistInputV2): Promise<DesignSpecialistOutputV2> {
    console.log('🎨 DESIGN SPECIALIST V2: Starting workflow execution...');
    
    // Build comprehensive prompt for the agent
    const prompt = this.buildWorkflowPrompt(input);
    
    try {
      // Execute the full workflow using the agent
      const result = await run(this.agent, prompt);
      
      return {
        success: true,
        task_type: input.task_type,
        results: {
          finalOutput: result.finalOutput,
          status: 'completed'
        },
        recommendations: {
          next_agent: 'quality_specialist',
          next_actions: ['quality_analysis', 'html_validation']
        },
        analytics: {
          execution_time: Date.now(),
          operations_performed: 12,
          confidence_score: 95
        }
      };
      
    } catch (error) {
      console.error('❌ DESIGN SPECIALIST V2 ERROR:', error);
      
      return {
        success: false,
        task_type: input.task_type,
        results: {
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        recommendations: {
          next_agent: 'retry_design',
          next_actions: ['fix_error', 'retry_workflow']
        },
        analytics: {
          execution_time: Date.now(),
          operations_performed: 0,
          confidence_score: 0
        }
      };
    }
  }

  private buildWorkflowPrompt(input: DesignSpecialistInputV2): string {
    return `🎨 DESIGN SPECIALIST WORKFLOW EXECUTION

Данные для обработки:
- Тип задачи: ${input.task_type}
- Контекст кампании: ${input.campaign_context ? 'Доступен' : 'Отсутствует'}
- Контентные данные: ${input.content_data ? 'Доступны' : 'Отсутствуют'}
- Handoff данные: ${input.handoff_data ? 'Доступны' : 'Отсутствуют'}

НЕМЕДЛЕННО НАЧНИ ВЫПОЛНЕНИЕ ВСЕХ 12 ШАГОВ ПОДРЯД:

1. loadDesignContext({})
2. readTechnicalSpecification({})
3. processContentAssets({})
4. generateTemplateDesign({})
5. generateMjmlTemplate({})
6. documentDesignDecisions({})
7. generatePreviewFiles({})
8. validateAndCorrectHtml({})
9. analyzePerformance({})
10. generateComprehensiveDesignPackage({})
11. createDesignHandoff({})
12. finalizeDesignAndTransferToQuality({})

НАЧНИ ПРЯМО СЕЙЧАС!`;
  }
}

// Export the agent for use in tool registry
export { DesignSpecialistAgent as designSpecialistAgent }; 