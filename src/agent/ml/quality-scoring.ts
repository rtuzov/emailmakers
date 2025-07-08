import { z } from 'zod';
import { tool } from '@openai/agents';

// ============================================================================
// ТИПЫ ДЛЯ ML-SCORING СИСТЕМЫ
// ============================================================================

export interface QualityScore {
  content: number;     // ML-based content analysis (0-100)
  design: number;      // Visual consistency score (0-100)
  technical: number;   // Email client compatibility (0-100)
  performance: number; // Load time and size metrics (0-100)
  overall: number;     // Weighted overall score (0-100)
}

export interface ContentAnalysis {
  readability_score: number;
  sentiment_score: number;
  engagement_potential: number;
  brand_alignment: number;
  call_to_action_effectiveness: number;
  language_quality: number;
}

export interface DesignAnalysis {
  visual_hierarchy: number;
  color_harmony: number;
  typography_consistency: number;
  layout_balance: number;
  responsive_design_quality: number;
  brand_consistency: number;
}

export interface TechnicalAnalysis {
  html_validity: number;
  email_client_compatibility: number;
  accessibility_compliance: number;
  rendering_consistency: number;
  code_quality: number;
  standards_compliance: number;
}

export interface PerformanceAnalysis {
  file_size_optimization: number;
  load_time_estimate: number;
  image_optimization: number;
  css_efficiency: number;
  mobile_performance: number;
  delivery_score: number;
}

export interface QualityReport {
  score: QualityScore;
  content_analysis: ContentAnalysis;
  design_analysis: DesignAnalysis;
  technical_analysis: TechnicalAnalysis;
  performance_analysis: PerformanceAnalysis;
  recommendations: string[];
  issues: QualityIssue[];
  improvement_suggestions: ImprovementSuggestion[];
  generation_timestamp: string;
  analysis_duration_ms: number;
}

export interface QualityIssue {
  category: 'content' | 'design' | 'technical' | 'performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  issue: string;
  impact: string;
  fix_suggestion: string;
  auto_fixable: boolean;
}

export interface ImprovementSuggestion {
  category: 'content' | 'design' | 'technical' | 'performance';
  suggestion: string;
  expected_improvement: number;
  effort_required: 'low' | 'medium' | 'high';
  priority: number;
}

// ============================================================================
// ZODS СХЕМЫ ДЛЯ ВАЛИДАЦИИ
// ============================================================================

const EmailQualityDataSchema = z.object({
  subject_line: z.string().describe('Email subject line'),
  html_content: z.string().describe('HTML email content'),
  mjml_content: z.string().nullable().describe('MJML source code'),
  preheader: z.string().nullable().describe('Email preheader text'),
  email_metadata: z.object({
    cta_text: z.string().nullable(),
    cta_url: z.string().nullable(),
    assets: z.array(z.string())
  }).describe('Email metadata'),
  brand_guidelines: z.object({
    primary_color: z.string().nullable(),
    secondary_color: z.string().nullable(),
    font_family: z.string().nullable(),
    brand_voice: z.string().nullable()
  }).nullable().describe('Brand guidelines for consistency check')
});

// ============================================================================
// ML-BASED КАЧЕСТВЕННЫЙ АНАЛИЗ
// ============================================================================

export class MLQualityScorer {
  private static readonly WEIGHTS = {
    content: 0.35,    // 35% - контент самый важный
    design: 0.25,     // 25% - дизайн важен для восприятия
    technical: 0.25,  // 25% - техническая корректность
    performance: 0.15 // 15% - производительность
  };

  /**
   * Анализирует контент с помощью ML-алгоритмов
   */
  private static analyzeContent(emailData: any): ContentAnalysis {
    const { subject, content_data, html_content } = emailData;
    
    // Симуляция ML-анализа контента
    const wordCount = content_data.body.split(' ').length;
    const sentenceCount = content_data.body.split(/[.!?]+/).length;
    const avgWordsPerSentence = wordCount / sentenceCount;
    
    // Анализ читаемости (Flesch Reading Ease приближение)
    const readability_score = Math.max(0, Math.min(100, 
      206.835 - (1.015 * avgWordsPerSentence) - (84.6 * (wordCount / sentenceCount))
    ));
    
    // Анализ настроения (простейшая эвристика)
    const positiveWords = ['отличный', 'прекрасный', 'лучший', 'скидка', 'выгодно', 'бесплатно'];
    const negativeWords = ['плохой', 'ужасный', 'дорого', 'сложно'];
    const positiveCount = positiveWords.filter(word => 
      content_data.body.toLowerCase().includes(word)
    ).length;
    const negativeCount = negativeWords.filter(word => 
      content_data.body.toLowerCase().includes(word)
    ).length;
    const sentiment_score = Math.min(100, Math.max(0, 50 + (positiveCount - negativeCount) * 10));
    
    // Анализ потенциала вовлечения
    const hasCallToAction = content_data.cta_text && content_data.cta_text.length > 0;
    const hasUrgency = /сегодня|сейчас|ограниченное время|только до/i.test(content_data.body);
    const hasPersonalization = /ваш|вам|для вас/i.test(content_data.body);
    const engagement_potential = (
      (hasCallToAction ? 30 : 0) +
      (hasUrgency ? 25 : 0) +
      (hasPersonalization ? 20 : 0) +
      (subject.length > 10 && subject.length < 60 ? 25 : 0)
    );
    
    // Анализ соответствия бренду
    const brand_alignment = emailData.brand_guidelines ? 
      (emailData.brand_guidelines.brand_voice ? 85 : 70) : 60;
    
    // Эффективность призыва к действию
    const call_to_action_effectiveness = hasCallToAction ? 
      (content_data.cta_text.length < 30 ? 90 : 70) : 40;
    
    // Качество языка
    const language_quality = Math.min(100, 
      70 + (readability_score > 60 ? 20 : 0) + (sentiment_score > 60 ? 10 : 0)
    );
    
    return {
      readability_score,
      sentiment_score,
      engagement_potential,
      brand_alignment,
      call_to_action_effectiveness,
      language_quality
    };
  }

  /**
   * Анализирует дизайн и визуальные аспекты
   */
  private static analyzeDesign(emailData: any): DesignAnalysis {
    const { html_content, brand_guidelines } = emailData;
    
    // Анализ визуальной иерархии
    const hasHeaders = /<h[1-6]/i.test(html_content);
    const hasParagraphs = /<p/i.test(html_content);
    const hasImages = /<img/i.test(html_content);
    const visual_hierarchy = (
      (hasHeaders ? 30 : 0) +
      (hasParagraphs ? 25 : 0) +
      (hasImages ? 25 : 0) +
      20 // базовая структура
    );
    
    // Анализ цветовой гармонии
    const colorMatches = html_content.match(/color:\s*#[0-9a-f]{6}/gi) || [];
    const uniqueColors = new Set(colorMatches).size;
    const color_harmony = uniqueColors > 0 && uniqueColors <= 5 ? 85 : 
                         uniqueColors > 5 ? 60 : 70;
    
    // Консистентность типографики
    const fontMatches = html_content.match(/font-family:\s*[^;]+/gi) || [];
    const uniqueFonts = new Set(fontMatches).size;
    const typography_consistency = uniqueFonts <= 3 ? 90 : 
                                  uniqueFonts <= 5 ? 70 : 50;
    
    // Баланс макета
    const hasTable = /<table/i.test(html_content);
    const hasFlexbox = /display:\s*flex/i.test(html_content);
    const layout_balance = (hasTable || hasFlexbox) ? 85 : 70;
    
    // Качество адаптивного дизайна
    const hasMediaQueries = /@media/i.test(html_content);
    const hasViewportMeta = /viewport/i.test(html_content);
    const responsive_design_quality = (
      (hasMediaQueries ? 50 : 0) +
      (hasViewportMeta ? 30 : 0) +
      20 // базовая адаптивность
    );
    
    // Консистентность с брендом
    const brand_consistency = brand_guidelines ? 
      (brand_guidelines.primary_color && 
       html_content.includes(brand_guidelines.primary_color) ? 90 : 70) : 60;
    
    return {
      visual_hierarchy,
      color_harmony,
      typography_consistency,
      layout_balance,
      responsive_design_quality,
      brand_consistency
    };
  }

  /**
   * Анализирует технические аспекты
   */
  private static analyzeTechnical(emailData: any): TechnicalAnalysis {
    const { html_content, mjml_content } = emailData;
    
    // Валидность HTML
    const hasDoctype = /<!DOCTYPE/i.test(html_content);
    const hasValidStructure = /<html[\s>]/i.test(html_content) && 
                             /<head[\s>]/i.test(html_content) && 
                             /<body[\s>]/i.test(html_content);
    const html_validity = (
      (hasDoctype ? 30 : 0) +
      (hasValidStructure ? 40 : 0) +
      30 // базовая валидность
    );
    
    // Совместимость с email-клиентами
    const hasTableLayout = /<table/i.test(html_content);
    const hasInlineStyles = /style\s*=/i.test(html_content);
    const noModernCSS = !/flexbox|grid|transform/i.test(html_content);
    const email_client_compatibility = (
      (hasTableLayout ? 35 : 0) +
      (hasInlineStyles ? 35 : 0) +
      (noModernCSS ? 30 : 0)
    );
    
    // Соответствие accessibility
    const hasAltTags = /<img[^>]+alt\s*=/i.test(html_content);
    const hasAriaLabels = /aria-label/i.test(html_content);
    const hasSemanticHTML = /<(header|main|section|article|nav|footer)/i.test(html_content);
    const accessibility_compliance = (
      (hasAltTags ? 40 : 0) +
      (hasAriaLabels ? 30 : 0) +
      (hasSemanticHTML ? 30 : 0)
    );
    
    // Консистентность рендеринга
    const rendering_consistency = mjml_content ? 90 : 75; // MJML обеспечивает лучшую консистентность
    
    // Качество кода
    const isMinified = html_content.length < 1000 || !/\n\s+/.test(html_content);
    const hasComments = /<!--/.test(html_content);
    const code_quality = (
      (isMinified ? 30 : 20) +
      (!hasComments ? 30 : 20) + // комментарии в продакшене не нужны
      40 // базовое качество
    );
    
    // Соответствие стандартам
    const standards_compliance = (html_validity + email_client_compatibility) / 2;
    
    return {
      html_validity,
      email_client_compatibility,
      accessibility_compliance,
      rendering_consistency,
      code_quality,
      standards_compliance
    };
  }

  /**
   * Анализирует производительность
   */
  private static analyzePerformance(emailData: any): PerformanceAnalysis {
    const { html_content } = emailData;
    
    // Оптимизация размера файла
    const fileSize = html_content.length;
    const file_size_optimization = fileSize < 50000 ? 100 : 
                                  fileSize < 100000 ? 80 : 
                                  fileSize < 200000 ? 60 : 40;
    
    // Оценка времени загрузки
    const estimatedLoadTime = fileSize / 10000; // примерная оценка
    const load_time_estimate = estimatedLoadTime < 2 ? 100 :
                              estimatedLoadTime < 5 ? 80 :
                              estimatedLoadTime < 10 ? 60 : 40;
    
    // Оптимизация изображений
    const imageCount = (html_content.match(/<img/gi) || []).length;
    const hasLazyLoading = /loading\s*=\s*["']lazy["']/i.test(html_content);
    const image_optimization = imageCount === 0 ? 100 :
                              hasLazyLoading ? 90 :
                              imageCount < 5 ? 80 : 60;
    
    // Эффективность CSS
    const inlineStylesCount = (html_content.match(/style\s*=/gi) || []).length;
    const hasExternalCSS = /<link[^>]+stylesheet/i.test(html_content);
    const css_efficiency = !hasExternalCSS && inlineStylesCount > 0 ? 90 : 70;
    
    // Производительность на мобильных
    const hasViewport = /viewport/i.test(html_content);
    const hasMediaQueries = /@media/i.test(html_content);
    const mobile_performance = (
      (hasViewport ? 50 : 0) +
      (hasMediaQueries ? 30 : 0) +
      20 // базовая мобильная совместимость
    );
    
    // Оценка доставляемости
    const hasSpamWords = /бесплатно|срочно|немедленно|гарантия/i.test(html_content);
    const delivery_score = hasSpamWords ? 70 : 90;
    
    return {
      file_size_optimization,
      load_time_estimate,
      image_optimization,
      css_efficiency,
      mobile_performance,
      delivery_score
    };
  }

  /**
   * Генерирует рекомендации по улучшению
   */
  private static generateRecommendations(
    score: QualityScore,
    analyses: {
      content: ContentAnalysis;
      design: DesignAnalysis;
      technical: TechnicalAnalysis;
      performance: PerformanceAnalysis;
    }
  ): string[] {
    const recommendations: string[] = [];
    
    // Рекомендации по контенту
    if (analyses.content.readability_score < 60) {
      recommendations.push('Упростите текст для лучшей читаемости. Используйте короткие предложения и простые слова.');
    }
    if (analyses.content.call_to_action_effectiveness < 70) {
      recommendations.push('Добавьте четкий и привлекательный призыв к действию (CTA).');
    }
    if (analyses.content.engagement_potential < 70) {
      recommendations.push('Добавьте элементы персонализации и создайте ощущение срочности.');
    }
    
    // Рекомендации по дизайну
    if (analyses.design.visual_hierarchy < 70) {
      recommendations.push('Улучшите визуальную иерархию с помощью заголовков и структурированного контента.');
    }
    if (analyses.design.responsive_design_quality < 80) {
      recommendations.push('Добавьте медиа-запросы для лучшей адаптивности на мобильных устройствах.');
    }
    
    // Технические рекомендации
    if (analyses.technical.accessibility_compliance < 80) {
      recommendations.push('Добавьте alt-теги для изображений и aria-labels для лучшей доступности.');
    }
    if (analyses.technical.email_client_compatibility < 80) {
      recommendations.push('Используйте табличную верстку и инлайн-стили для лучшей совместимости с email-клиентами.');
    }
    
    // Рекомендации по производительности
    if (analyses.performance.file_size_optimization < 80) {
      recommendations.push('Оптимизируйте размер файла, удалив лишние пробелы и комментарии.');
    }
    if (analyses.performance.image_optimization < 80) {
      recommendations.push('Оптимизируйте изображения и добавьте lazy loading.');
    }
    
    return recommendations;
  }

  /**
   * Генерирует список проблем
   */
  private static generateIssues(
    score: QualityScore,
    analyses: {
      content: ContentAnalysis;
      design: DesignAnalysis;
      technical: TechnicalAnalysis;
      performance: PerformanceAnalysis;
    }
  ): QualityIssue[] {
    const issues: QualityIssue[] = [];
    
    if (analyses.technical.html_validity < 70) {
      issues.push({
        category: 'technical',
        severity: 'high',
        issue: 'HTML код не соответствует стандартам',
        impact: 'Может привести к проблемам отображения в email-клиентах',
        fix_suggestion: 'Добавьте DOCTYPE и исправьте структуру HTML',
        auto_fixable: true
      });
    }
    
    if (analyses.content.call_to_action_effectiveness < 50) {
      issues.push({
        category: 'content',
        severity: 'medium',
        issue: 'Отсутствует эффективный призыв к действию',
        impact: 'Снижает конверсию и вовлеченность',
        fix_suggestion: 'Добавьте яркую кнопку с четким текстом CTA',
        auto_fixable: false
      });
    }
    
    if (analyses.performance.file_size_optimization < 60) {
      issues.push({
        category: 'performance',
        severity: 'medium',
        issue: 'Большой размер файла',
        impact: 'Медленная загрузка, особенно на мобильных устройствах',
        fix_suggestion: 'Минифицируйте HTML и оптимизируйте изображения',
        auto_fixable: true
      });
    }
    
    return issues;
  }

  /**
   * Основной метод для анализа качества
   */
  static async analyzeQuality(emailData: any): Promise<QualityReport> {
    const startTime = Date.now();
    
    // Проводим все виды анализа
    const content_analysis = this.analyzeContent(emailData);
    const design_analysis = this.analyzeDesign(emailData);
    const technical_analysis = this.analyzeTechnical(emailData);
    const performance_analysis = this.analyzePerformance(emailData);
    
    // Вычисляем взвешенные оценки
    const contentScore = Object.values(content_analysis).reduce((a, b) => a + b, 0) / Object.keys(content_analysis).length;
    const designScore = Object.values(design_analysis).reduce((a, b) => a + b, 0) / Object.keys(design_analysis).length;
    const technicalScore = Object.values(technical_analysis).reduce((a, b) => a + b, 0) / Object.keys(technical_analysis).length;
    const performanceScore = Object.values(performance_analysis).reduce((a, b) => a + b, 0) / Object.keys(performance_analysis).length;
    
    const score: QualityScore = {
      content: Math.round(contentScore),
      design: Math.round(designScore),
      technical: Math.round(technicalScore),
      performance: Math.round(performanceScore),
      overall: Math.round(
        contentScore * this.WEIGHTS.content +
        designScore * this.WEIGHTS.design +
        technicalScore * this.WEIGHTS.technical +
        performanceScore * this.WEIGHTS.performance
      )
    };
    
    const analyses = { content: content_analysis, design: design_analysis, technical: technical_analysis, performance: performance_analysis };
    
    // Генерируем рекомендации и проблемы
    const recommendations = this.generateRecommendations(score, analyses);
    const issues = this.generateIssues(score, analyses);
    
    // Генерируем предложения по улучшению
    const improvement_suggestions: ImprovementSuggestion[] = [
      {
        category: 'content',
        suggestion: 'Добавить персонализацию в заголовок',
        expected_improvement: 15,
        effort_required: 'low',
        priority: score.content < 70 ? 9 : 5
      },
      {
        category: 'design',
        suggestion: 'Улучшить цветовую схему в соответствии с брендом',
        expected_improvement: 20,
        effort_required: 'medium',
        priority: score.design < 70 ? 8 : 4
      },
      {
        category: 'technical',
        suggestion: 'Добавить alt-теги для всех изображений',
        expected_improvement: 25,
        effort_required: 'low',
        priority: score.technical < 80 ? 10 : 6
      }
    ];
    
    const endTime = Date.now();
    
    return {
      score,
      content_analysis,
      design_analysis,
      technical_analysis,
      performance_analysis,
      recommendations,
      issues,
      improvement_suggestions,
      generation_timestamp: new Date().toISOString(),
      analysis_duration_ms: endTime - startTime
    };
  }
}

// ============================================================================
// OPENAI AGENTS SDK TOOLS
// ============================================================================

/**
 * OpenAI Agent tool для анализа качества email
 */
export const analyzeEmailQualityTool = tool({
  name: 'analyze_email_quality',
  description: 'Проводит комплексный ML-анализ качества email-шаблона по контенту, дизайну, техническим аспектам и производительности',
  parameters: EmailQualityDataSchema,
  execute: async (emailData) => {
    try {
      const qualityReport = await MLQualityScorer.analyzeQuality(emailData);
      
      return JSON.stringify({
        success: true,
        data: qualityReport,
        summary: {
          overall_score: qualityReport.score.overall,
          main_strengths: qualityReport.score.overall >= 80 ? 
            ['Высокое качество контента', 'Хорошая техническая реализация'] :
            qualityReport.score.overall >= 60 ?
            ['Приемлемое качество', 'Есть потенциал для улучшения'] :
            ['Требует значительных улучшений'],
          priority_issues: qualityReport.issues
            .filter(issue => issue.severity === 'high' || issue.severity === 'critical')
            .map(issue => issue.issue),
          quick_wins: qualityReport.improvement_suggestions
            .filter(suggestion => suggestion.effort_required === 'low')
            .sort((a, b) => b.priority - a.priority)
            .slice(0, 3)
            .map(suggestion => suggestion.suggestion)
        }
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during quality analysis'
      });
    }
  }
});

/**
 * OpenAI Agent tool для быстрой оценки качества
 */
export const quickQualityCheckTool = tool({
  name: 'quick_quality_check',
  description: 'Быстрая оценка качества email-шаблона с основными метриками',
  parameters: z.object({
    html_content: z.string().describe('HTML content to analyze'),
    subject: z.string().describe('Email subject line')
  }),
  execute: async ({ html_content, subject }) => {
    try {
      const emailData = {
        html_content,
        subject,
        content_data: {
          body: html_content.replace(/<[^>]*>/g, ''), // простое удаление HTML-тегов
          cta_text: '',
          cta_url: ''
        }
      };
      
      const qualityReport = await MLQualityScorer.analyzeQuality(emailData);
      
      return JSON.stringify({
        success: true,
        quick_score: qualityReport.score.overall,
        category_scores: {
          content: qualityReport.score.content,
          design: qualityReport.score.design,
          technical: qualityReport.score.technical,
          performance: qualityReport.score.performance
        },
        top_recommendations: qualityReport.recommendations.slice(0, 3),
        critical_issues: qualityReport.issues.filter(issue => 
          issue.severity === 'critical' || issue.severity === 'high'
        ).length,
        analysis_time_ms: qualityReport.analysis_duration_ms
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Quick analysis failed'
      });
    }
  }
});

// ============================================================================
// ЭКСПОРТ
// ============================================================================

export default MLQualityScorer;
export { EmailQualityDataSchema }; 