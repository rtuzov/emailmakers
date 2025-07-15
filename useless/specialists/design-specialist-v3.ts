/**
 * 🎨 DESIGN SPECIALIST AGENT V3 - ENHANCED EDITION
 * 
 * Передовой агент для создания интеллектуального email дизайна
 * с анализом контента, адаптивным дизайном и улучшенными компонентами
 */

import { Agent, tool, run } from '@openai/agents';
import { z } from 'zod';

// Import новых инструментов для улучшенного дизайна
import { analyzeContentForDesign } from './design-specialist/content-intelligence-analyzer';
import { generateAdaptiveDesign } from './design-specialist/adaptive-design-engine';
import { generateEnhancedMjmlTemplate } from './design-specialist/enhanced-mjml-generator';

// Import базовых инструментов
import { designSpecialistTools } from './design-specialist';

// ============================================================================
// ENHANCED DESIGN SPECIALIST AGENT V3
// ============================================================================

// Create Quality Specialist as handoff target first
import { qualitySpecialistAgent } from './quality-specialist-v2';

// Use Agent.create for proper handoff support according to OpenAI SDK docs
export const EnhancedDesignSpecialistAgent = Agent.create({
  name: 'Enhanced Design Specialist V3',
  model: 'gpt-4o-mini',
  handoffDescription: 'Expert in creating intelligent email designs with AI-powered content analysis, adaptive design generation, and modern visual components. Handles complete design workflow from content analysis to final template creation.',
  instructions: `Ты - Enhanced Design Specialist V3 в системе Email-Makers, специалист по созданию интеллектуального дизайна email кампаний с анализом контента.

## 🎯 ОСНОВНАЯ ЗАДАЧА

Создавать высококачественные email дизайны с использованием AI анализа контента, адаптивного дизайна и современных визуальных компонентов.

## 🧠 УНИКАЛЬНЫЕ ВОЗМОЖНОСТИ V3

✅ **Content Intelligence** - Анализ контента для определения оптимального дизайна
✅ **Adaptive Design Engine** - Создание персонализированного дизайна на основе аудитории  
✅ **Enhanced MJML Generator** - Современные компоненты с адаптивностью и анимациями
✅ **Visual Component Library** - Библиотека умных компонентов для разных тематик
✅ **Smart Color Systems** - Адаптивные цветовые схемы на основе анализа

## 🔄 УСОВЕРШЕНСТВОВАННАЯ ПОСЛЕДОВАТЕЛЬНОСТЬ (7 ШАГОВ)

ТЫ ДОЛЖЕН НЕМЕДЛЕННО ВЫПОЛНИТЬ ВСЕ 7 ШАГОВ ПОСЛЕДОВАТЕЛЬНО БЕЗ ОСТАНОВКИ:

### ШАГ 1: 📁 ЗАГРУЗКА КОНТЕКСТА (БАЗОВЫЙ)
НЕМЕДЛЕННО вызови: loadDesignContext({})
- Загружает контекст от Content Specialist
- Подготавливает данные для анализа

### ШАГ 2: 🧠 ИНТЕЛЛЕКТУАЛЬНЫЙ АНАЛИЗ КОНТЕНТА (НОВОЕ!)
НЕМЕДЛЕННО вызови: analyzeContentForDesign({})
- Анализирует тематику, эмоциональный тон, тип кампании
- Определяет ценовую категорию и уровень срочности
- Создает дизайн-личность на основе контента
- **ЭТО КЛЮЧЕВОЕ УЛУЧШЕНИЕ V3!**

### ШАГ 3: 🎨 ГЕНЕРАЦИЯ АДАПТИВНОГО ДИЗАЙНА (НОВОЕ!)
НЕМЕДЛЕННО вызови: generateAdaptiveDesign({})
- Создает структуру шаблона на основе анализа
- Генерирует визуальные компоненты
- Адаптирует цветовую систему
- Настраивает типографику и анимации
- **РЕВОЛЮЦИОННОЕ УЛУЧШЕНИЕ V3!**

### ШАГ 4: 🖼️ ОБРАБОТКА АКТИВОВ
НЕМЕДЛЕННО вызови: processContentAssets({})
- Обрабатывает изображения с учетом дизайн-личности
- Оптимизирует ассеты для адаптивного дизайна

### ШАГ 5: 📧 ENHANCED MJML ГЕНЕРАЦИЯ (НОВОЕ!)
НЕМЕДЛЕННО вызови: generateEnhancedMjmlTemplate({})
- Создает современный MJML с умными компонентами
- Интегрирует результаты анализа контента
- Добавляет адаптивность и темную тему
- Включает анимации и интерактивные элементы
- **ГЛАВНОЕ УЛУЧШЕНИЕ V3!**

### ШАГ 6: 🔧 КОМПИЛЯЦИЯ HTML
НЕМЕДЛЕННО вызови: compileMjmlToHtml({})
- Компилирует enhanced MJML в HTML
- Оптимизирует для email клиентов

### ШАГ 7: ✅ ФИНАЛИЗАЦИЯ ДИЗАЙНА
После завершения всех шагов, АВТОМАТИЧЕСКИ передай работу Quality Specialist для проверки качества.

## 🔄 AUTOMATIC HANDOFF TO QUALITY SPECIALIST

После завершения дизайна, система АВТОМАТИЧЕСКИ передаст управление Quality Specialist для:
- Проверки совместимости с email клиентами
- Валидации accessibility  
- Оптимизации производительности
- Финального контроля качества

НЕ НУЖНО ВЫЗЫВАТЬ transferToQualitySpecialist - это произойдет автоматически!

## 🎨 ФИЛОСОФИЯ ДИЗАЙНА V3

**CONTENT-FIRST APPROACH**: Дизайн следует за контентом
- Каждый элемент обоснован анализом контента
- Визуальный стиль соответствует тематике и аудитории
- Цвета и типографика адаптируются к эмоциональному тону

**ADAPTIVE BY DESIGN**: Персонализация на основе данных
- Разные компоненты для разных типов кампаний
- Адаптивная сложность макета
- Умные цветовые схемы

**MODERN & RESPONSIVE**: Современные стандарты
- Mobile-first подход
- Поддержка темной темы
- Плавные анимации (где уместно)
- Accessibility и оптимизация

## ⚡ КЛЮЧЕВЫЕ ОТЛИЧИЯ ОТ V2

❌ **V2**: Простая генерация шаблонов по готовым паттернам
✅ **V3**: Интеллектуальный анализ + адаптивный дизайн

❌ **V2**: Фиксированные цвета и компоненты  
✅ **V3**: Динамические цветовые схемы на основе контента

❌ **V2**: Базовая адаптивность
✅ **V3**: Полный responsive + темная тема + анимации

❌ **V2**: Один размер для всех
✅ **V3**: Персонализация под тип кампании и аудиторию

## 📊 КРИТЕРИИ УСПЕХА

✅ Точное определение дизайн-личности из контента
✅ Соответствие визуального стиля тематике 
✅ Адаптивные компоненты для мобильных устройств
✅ Современные визуальные эффекты
✅ Оптимизация для email клиентов
✅ Высокая конверсия благодаря целевому дизайну

НАЧИНАЙ НЕМЕДЛЕННО С ШАГА 1! НЕ ЖДИ ДОПОЛНИТЕЛЬНЫХ ИНСТРУКЦИЙ!`,

  tools: [
    // БАЗОВЫЕ ИНСТРУМЕНТЫ V2 (совместимость)
    ...designSpecialistTools,
    
    // НОВЫЕ ENHANCED ИНСТРУМЕНТЫ V3
    analyzeContentForDesign,
    generateAdaptiveDesign,
    generateEnhancedMjmlTemplate
  ],
  
  // 🔧 CRITICAL: OpenAI SDK handoffs configuration
  handoffs: [qualitySpecialistAgent]
});

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface EnhancedDesignInputV3 {
  task_type: 'create_enhanced_email_design' | 'intelligent_design' | 'content_aware_design';
  content_data?: any;
  campaign_context?: any;
  design_requirements?: any;
  handoff_data?: any;
  enhancement_level?: 'standard' | 'advanced' | 'premium';
}

export interface EnhancedDesignOutputV3 {
  success: boolean;
  task_type: string;
  results: {
    content_analysis: any;
    design_personality: any;
    adaptive_design: any;
    enhanced_mjml: any;
    final_templates: any;
  };
  enhancements: {
    content_intelligence: boolean;
    adaptive_design: boolean;
    modern_components: boolean;
    responsive_design: boolean;
    dark_theme_support: boolean;
    animations: string;
  };
  recommendations: {
    next_agent: string;
    next_actions: string[];
    optimization_suggestions: string[];
  };
  analytics: {
    execution_time: number;
    operations_performed: number;
    confidence_score: number;
    design_complexity: 'simple' | 'moderate' | 'complex';
    mobile_optimization: number;
  };
}

// ============================================================================
// ENHANCED DESIGN SPECIALIST V3 CLASS
// ============================================================================

export class EnhancedDesignSpecialistV3 {
  private agent: Agent;
  
  constructor() {
    this.agent = EnhancedDesignSpecialistAgent;
  }

  async execute(input: EnhancedDesignInputV3): Promise<EnhancedDesignOutputV3> {
    const startTime = Date.now();
    
    try {
      console.log('\n🎨 === ENHANCED DESIGN SPECIALIST V3 STARTING ===');
      console.log('Enhancement Level:', input.enhancement_level || 'standard');
      console.log('Task Type:', input.task_type);
      
      // Создаем prompt для enhanced workflow
      const enhancedPrompt = this.buildEnhancedWorkflowPrompt(input);
      
      // Запускаем enhanced agent с новой последовательностью
      const result = await run(this.agent, enhancedPrompt);
      
      console.log('✅ Enhanced Design Specialist V3 completed');
      
      // Парсим результаты enhanced выполнения
      const executionTime = Date.now() - startTime;
      
      return {
        success: true,
        task_type: input.task_type,
        results: {
          content_analysis: this.extractContentAnalysis(result),
          design_personality: this.extractDesignPersonality(result),
          adaptive_design: this.extractAdaptiveDesign(result),
          enhanced_mjml: this.extractEnhancedMjml(result),
          final_templates: this.extractFinalTemplates(result)
        },
        enhancements: {
          content_intelligence: true,
          adaptive_design: true,
          modern_components: true,
          responsive_design: true,
          dark_theme_support: true,
          animations: this.detectAnimationLevel(result)
        },
        recommendations: {
          next_agent: 'DeliverySpecialist',
          next_actions: [
            'html_validation',
            'email_client_testing',
            'performance_optimization',
            'final_delivery'
          ],
          optimization_suggestions: this.generateOptimizationSuggestions(result)
        },
        analytics: {
          execution_time: executionTime,
          operations_performed: 7, // Enhanced 7-step workflow
          confidence_score: this.calculateConfidenceScore(result),
          design_complexity: this.assessDesignComplexity(result),
          mobile_optimization: this.calculateMobileOptimization(result)
        }
      };
      
    } catch (error) {
      console.error('❌ Enhanced Design Specialist V3 failed:', error);
      
      return {
        success: false,
        task_type: input.task_type,
        results: {
          content_analysis: null,
          design_personality: null,
          adaptive_design: null,
          enhanced_mjml: null,
          final_templates: null
        },
        enhancements: {
          content_intelligence: false,
          adaptive_design: false,
          modern_components: false,
          responsive_design: false,
          dark_theme_support: false,
          animations: 'none'
        },
        recommendations: {
          next_agent: 'ErrorHandler',
          next_actions: ['debug_design_process', 'retry_with_fallback'],
          optimization_suggestions: []
        },
        analytics: {
          execution_time: Date.now() - startTime,
          operations_performed: 0,
          confidence_score: 0,
          design_complexity: 'simple',
          mobile_optimization: 0
        }
      };
    }
  }

  private buildEnhancedWorkflowPrompt(input: EnhancedDesignInputV3): string {
    return `Enhanced Email Design Task - V3 Intelligence

ЗАДАЧА: ${input.task_type}
ENHANCEMENT LEVEL: ${input.enhancement_level || 'standard'}

КОНТЕКСТ ДАННЫХ:
${input.content_data ? JSON.stringify(input.content_data, null, 2) : 'No content data provided'}

ТРЕБОВАНИЯ К ДИЗАЙНУ:
${input.design_requirements ? JSON.stringify(input.design_requirements, null, 2) : 'Standard design requirements'}

ДАННЫЕ HANDOFF:
${input.handoff_data ? JSON.stringify(input.handoff_data, null, 2) : 'No handoff data'}

ИНСТРУКЦИИ ДЛЯ V3 ENHANCED WORKFLOW:

Ты должен выполнить ПОЛНУЮ ПОСЛЕДОВАТЕЛЬНОСТЬ из 7 шагов Enhanced Design V3.
Каждый шаг использует передовые AI возможности для создания интеллектуального дизайна.

НЕМЕДЛЕННО начинай с Шага 1 (loadDesignContext) и выполняй ВСЕ шаги подряд!

ФОКУС НА КЛЮЧЕВЫХ УЛУЧШЕНИЯХ V3:
- Анализ контента для определения дизайн-личности
- Адаптивный дизайн на основе типа кампании
- Современные компоненты с анимациями
- Полная адаптивность и поддержка темной темы

НАЧИНАЙ СЕЙЧАС!`;
  }

  // Утилиты для извлечения результатов
  private extractContentAnalysis(result: any): any {
    const resultText = result.finalOutput || '';
    if (resultText.includes('Content analysis completed')) {
      return { analyzed: true, method: 'content_intelligence' };
    }
    return null;
  }

  private extractDesignPersonality(result: any): any {
    const resultText = result.finalOutput || '';
    if (resultText.includes('Design personality generated')) {
      return { generated: true, method: 'adaptive_engine' };
    }
    return null;
  }

  private extractAdaptiveDesign(result: any): any {
    const resultText = result.finalOutput || '';
    if (resultText.includes('Adaptive design created')) {
      return { created: true, method: 'adaptive_design_engine' };
    }
    return null;
  }

  private extractEnhancedMjml(result: any): any {
    const resultText = result.finalOutput || '';
    if (resultText.includes('Enhanced MJML template generated')) {
      return { 
        generated: true, 
        method: 'enhanced_mjml_generator',
        features: ['content_aware', 'adaptive_colors', 'modern_components']
      };
    }
    return null;
  }

  private extractFinalTemplates(result: any): any {
    const resultText = result.finalOutput || '';
    if (resultText.includes('finalized') || resultText.includes('completed')) {
      return { finalized: true, ready_for_delivery: true };
    }
    return null;
  }

  private detectAnimationLevel(result: any): string {
    const resultText = result.finalOutput || '';
    if (resultText.includes('dynamic')) return 'dynamic';
    if (resultText.includes('moderate')) return 'moderate';
    if (resultText.includes('subtle')) return 'subtle';
    return 'none';
  }

  private generateOptimizationSuggestions(result: any): string[] {
    const suggestions = [];
    const resultText = result.finalOutput || '';
    
    if (resultText.includes('complex')) {
      suggestions.push('Consider simplifying for mobile users');
    }
    
    if (resultText.includes('premium')) {
      suggestions.push('Add trust badges and social proof');
    }
    
    if (resultText.includes('urgency')) {
      suggestions.push('Include countdown timer for urgency');
    }
    
    return suggestions;
  }

  private calculateConfidenceScore(result: any): number {
    const resultText = result.finalOutput || '';
    let score = 0;
    
    if (resultText.includes('Content analysis completed')) score += 20;
    if (resultText.includes('Design personality generated')) score += 20;
    if (resultText.includes('Adaptive design created')) score += 20;
    if (resultText.includes('Enhanced MJML template generated')) score += 25;
    if (resultText.includes('finalized')) score += 15;
    
    return Math.min(score, 100);
  }

  private assessDesignComplexity(result: any): 'simple' | 'moderate' | 'complex' {
    const resultText = result.finalOutput || '';
    if (resultText.includes('complex')) return 'complex';
    if (resultText.includes('moderate')) return 'moderate';
    return 'simple';
  }

  private calculateMobileOptimization(result: any): number {
    const resultText = result.finalOutput || '';
    let score = 0;
    
    if (resultText.includes('Mobile-first')) score += 30;
    if (resultText.includes('responsive')) score += 25;
    if (resultText.includes('@media')) score += 25;
    if (resultText.includes('adaptive')) score += 20;
    
    return Math.min(score, 100);
  }
}

// ============================================================================
// CONVENIENCE FUNCTION
// ============================================================================

export async function runEnhancedDesignSpecialistV3(
  input: EnhancedDesignInputV3
): Promise<EnhancedDesignOutputV3> {
  const specialist = new EnhancedDesignSpecialistV3();
  return await specialist.execute(input);
} 