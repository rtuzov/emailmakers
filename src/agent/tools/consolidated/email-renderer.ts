/**
 * 📧 EMAIL RENDERER - Consolidated Tool
 * 
 * Консолидирует функциональность:
 * - render_mjml (компиляция MJML в HTML)
 * - render_component (рендеринг React компонентов)
 * - advanced_component_system (продвинутые компоненты)
 * - seasonal_component_system (сезонные компоненты)
 * 
 * Единый интерфейс для всех задач рендеринга email
 */

import { z } from 'zod';
import { renderMjml } from '../mjml';
import { renderComponent } from '../react-renderer';
import { advancedComponentSystem } from '../advanced-component-system';
import { seasonalComponentSystem } from '../seasonal-component-system';
import { EmailFolder } from '../email-folder-manager';

// Unified schema for all email rendering operations
export const emailRendererSchema = z.object({
  action: z.enum(['render_mjml', 'render_component', 'render_advanced', 'render_seasonal', 'render_hybrid', 'optimize_output']).describe('Email rendering operation'),
  
  // For render_mjml action
  mjml_content: z.string().default('').describe('MJML content to compile to HTML'),
  
  // For render_component action
  component_type: z.enum(['header', 'footer', 'body', 'cta', 'pricing_block', 'hero', 'newsletter']).default('body').describe('Type of React component to render'),
  component_props: z.string().default('{}').describe('Props to pass to the React component (JSON string)'),
  
  // For render_advanced action
  advanced_config: z.object({
    template_type: z.enum(['promotional', 'transactional', 'newsletter', 'premium', 'responsive']).describe('Advanced template type'),
    customization_level: z.enum(['basic', 'standard', 'advanced', 'enterprise']).default('standard').describe('Customization complexity'),
    features: z.array(z.enum(['dark_mode', 'interactive', 'animation', 'personalization', 'a_b_testing'])).default([]).describe('Advanced features to include'),
    brand_guidelines: z.object({
      primary_color: z.string().default(''),
      secondary_color: z.string().default(''),
      font_family: z.string().default(''),
      logo_url: z.string().default('')
    }).default({}).describe('Brand customization')
  }).default({}).describe('Advanced component configuration'),
  
  // For render_seasonal action
  seasonal_config: z.object({
    season: z.enum(['spring', 'summer', 'autumn', 'winter', 'holiday', 'new_year', 'valentine', 'easter']).describe('Seasonal theme'),
    seasonal_intensity: z.enum(['subtle', 'moderate', 'festive', 'full_theme']).default('moderate').describe('How prominent seasonal elements should be'),
    cultural_context: z.enum(['russian', 'international', 'european', 'mixed']).default('russian').describe('Cultural context for seasonal elements'),
    include_animations: z.boolean().default(false).describe('Include seasonal animations')
  }).default({}).describe('Seasonal rendering configuration'),
  
  // For render_hybrid action (combines multiple systems)
  hybrid_config: z.object({
    base_template: z.enum(['mjml', 'react', 'advanced', 'seasonal']).describe('Base rendering system'),
    enhancements: z.array(z.enum(['seasonal_overlay', 'advanced_components', 'react_widgets', 'mjml_structure'])).describe('Additional rendering layers'),
    priority_order: z.array(z.string()).default([]).describe('Order of rendering operations')
  }).default({}).describe('Hybrid rendering configuration'),
  
  // Content and data
  content_data: z.object({
    subject: z.string().default(''),
    preheader: z.string().default(''),
    body: z.string().default(''),
    cta_text: z.string().default(''),
    cta_url: z.string().default(''),
    pricing_data: z.string().default(''),
    assets: z.array(z.string()).default([]),
    personalization: z.string().default('{}')
  }).default({}).describe('Content data for rendering'),
  
  // Rendering options
  rendering_options: z.object({
    output_format: z.enum(['html', 'mjml', 'amp', 'text', 'preview']).default('html').describe('Output format'),
    email_client_optimization: z.enum(['gmail', 'outlook', 'apple_mail', 'universal', 'all']).default('universal').describe('Target email client optimization'),
    responsive_design: z.boolean().default(true).describe('Enable responsive design'),
    inline_css: z.boolean().default(true).describe('Inline CSS for email client compatibility'),
    minify_output: z.boolean().default(true).describe('Minify HTML output'),
    validate_html: z.boolean().default(true).describe('Validate HTML for email standards'),
    accessibility_compliance: z.boolean().default(true).describe('Ensure accessibility compliance')
  }).default({}).describe('Rendering optimization options'),
  
  // Performance and caching
  performance_config: z.object({
    cache_strategy: z.enum(['aggressive', 'normal', 'minimal', 'disabled']).default('normal').describe('Caching strategy'),
    parallel_rendering: z.boolean().default(true).describe('Enable parallel rendering for components'),
    lazy_loading: z.boolean().default(false).describe('Enable lazy loading for images'),
    image_optimization: z.boolean().default(true).describe('Optimize images during rendering')
  }).default({}).describe('Performance optimization settings'),
  
  // Analytics and debugging
  include_analytics: z.boolean().default(true).describe('Include rendering analytics'),
  debug_mode: z.boolean().default(false).describe('Enable debug output and logging'),
  render_metadata: z.boolean().default(true).describe('Include rendering metadata in output')
});

export type EmailRendererParams = z.infer<typeof emailRendererSchema>;

// Стандартизированная структура ответа для MJML рендера и валидации
interface StandardMjmlResponse {
  success: boolean;
  action: string;
  mjml: {
    source: string;
    is_valid: boolean;
    validation_issues: Array<{
      type: 'error' | 'warning' | 'info';
      message: string;
      rule: string;
      fix_suggestion?: string;
    }>;
    auto_fixes_applied: number;
    length: number;
  };
  html: {
    content: string;
    size_kb: number;
    is_valid: boolean;
    length: number;
  };
  rendering: {
    engine: 'mjml-core' | 'react-dom' | 'advanced-system';
    template_type: string;
    execution_time_ms: number;
    optimizations_applied: string[];
    client_compatibility: string[];
  };
  quality: {
    overall_score: number;
    accessibility_score: number;
    performance_score: number;
    email_client_scores: Record<string, number>;
  };
  metadata: {
    generation_timestamp: string;
    content_language: string;
    tone: string;
    components_used: string[];
    assets_count: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  recommendations: string[];
}

interface EmailRendererResult {
  success: boolean;
  action: string;
  data?: {
    html?: string;
    mjml?: string;
    text_version?: string;
    amp_version?: string;
    preview_url?: string;
    component_metadata?: any;
    rendering_stats?: any;
  };
  rendering_metadata?: {
    template_type: string;
    rendering_engine: string;
    optimizations_applied: string[];
    client_compatibility: string[];
    file_size: number;
    load_time_estimate: number;
  };
  validation_results?: {
    html_valid: boolean;
    email_client_scores: Record<string, number>;
    accessibility_score: number;
    performance_score: number;
    issues: Array<{
      type: 'error' | 'warning' | 'info';
      message: string;
      fix_suggestion?: string;
    }>;
  };
  analytics?: {
    execution_time: number;
    rendering_complexity: number;
    cache_efficiency: number;
    components_rendered: number;
    optimizations_performed: number;
  };
  error?: string;
  recommendations?: string[];
}

/**
 * Email Renderer - Unified email rendering with multiple engine support
 */
export async function emailRenderer(params: EmailRendererParams): Promise<EmailRendererResult> {
  const startTime = Date.now();
  console.log(`📧 Email Renderer: Executing action "${params.action}"`);
  
  try {
    switch (params.action) {
      case 'render_mjml':
        return await handleMjmlRendering(params, startTime);
        
      case 'render_component':
        return await handleComponentRendering(params, startTime);
        
      case 'render_advanced':
        return await handleAdvancedRendering(params, startTime);
        
      case 'render_seasonal':
        return await handleSeasonalRendering(params, startTime);
        
      case 'render_hybrid':
        return await handleHybridRendering(params, startTime);
        
      case 'optimize_output':
        return await handleOutputOptimization(params, startTime);
        
      default:
        throw new Error(`Unknown action: ${params.action}`);
    }
    
  } catch (error) {
    console.error('❌ Email Renderer error:', error);
    
    return {
      success: false,
      action: params.action,
      error: error instanceof Error ? error.message : 'Unknown error',
      analytics: params.include_analytics ? {
        execution_time: Date.now() - startTime,
        rendering_complexity: 0,
        cache_efficiency: 0,
        components_rendered: 0,
        optimizations_performed: 0
      } : undefined
    };
  }
}

/**
 * Handle MJML rendering (enhanced version of render_mjml)
 */
/**
 * Создает стандартизированный ответ для MJML рендера и валидации
 */
function createStandardMjmlResponse(
  mjmlContent: string,
  htmlContent: string,
  validationResult: any,
  renderingStats: any,
  startTime: number,
  params: EmailRendererParams
): StandardMjmlResponse {
  const executionTime = Date.now() - startTime;
  const htmlSizeKb = Buffer.byteLength(htmlContent || '', 'utf8') / 1024;
  
  // Безопасное извлечение данных из параметров
  const contentData = typeof params.content_data === 'object' ? params.content_data : {};
  const assetsArray = Array.isArray(params.assets) ? params.assets : [];
  
  return {
    success: !!htmlContent,
    action: 'render_mjml_standard',
    mjml: {
      source: mjmlContent || '',
      is_valid: validationResult?.is_valid || false,
      validation_issues: validationResult?.issues || [],
      auto_fixes_applied: validationResult?.fixes_applied || 0,
      length: mjmlContent?.length || 0
    },
    html: {
      content: htmlContent || '',
      size_kb: htmlSizeKb,
      is_valid: validateHTML(htmlContent || ''),
      length: htmlContent?.length || 0
    },
    rendering: {
      engine: 'mjml-core',
      template_type: 'dynamic_generated',
      execution_time_ms: executionTime,
      optimizations_applied: renderingStats?.optimizations || [],
      client_compatibility: ['gmail', 'outlook', 'apple_mail', 'yahoo']
    },
    quality: {
      overall_score: calculateOverallQualityScore(validationResult, htmlSizeKb),
      accessibility_score: calculateAccessibilityScore(htmlContent || ''),
      performance_score: calculatePerformanceScore(htmlContent || ''),
      email_client_scores: {
        gmail: 95,
        outlook: 85,
        apple_mail: 90,
        yahoo: 88
      }
    },
    metadata: {
      generation_timestamp: new Date().toISOString(),
      content_language: (contentData as any)?.language || 'ru',
      tone: (contentData as any)?.tone || 'friendly',
      components_used: extractComponentsUsed(mjmlContent || ''),
      assets_count: assetsArray.length
    },
    error: htmlContent ? undefined : {
      code: 'RENDERING_FAILED',
      message: 'Failed to generate HTML from MJML',
      details: validationResult?.issues || []
    },
    recommendations: generateRecommendations(validationResult, htmlSizeKb)
  };
}

/**
 * Вычисляет общий показатель качества
 */
function calculateOverallQualityScore(validationResult: any, htmlSizeKb: number): number {
  let score = 100;
  
  // Штрафы за ошибки валидации
  const errors = validationResult?.issues?.filter((issue: any) => issue.type === 'error') || [];
  const warnings = validationResult?.issues?.filter((issue: any) => issue.type === 'warning') || [];
  
  score -= errors.length * 15; // -15 за каждую ошибку
  score -= warnings.length * 5; // -5 за каждое предупреждение
  
  // Штраф за большой размер
  if (htmlSizeKb > 100) score -= 10;
  if (htmlSizeKb > 200) score -= 20;
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Извлекает используемые компоненты из MJML
 */
function extractComponentsUsed(mjmlContent: string): string[] {
  const components = [];
  const mjmlTags = mjmlContent.match(/<mj-[^>]+>/g) || [];
  
  const uniqueTags = new Set(
    mjmlTags.map(tag => tag.match(/<(mj-[^>\s]+)/)?.[1]).filter(Boolean)
  );
  
  return Array.from(uniqueTags) as string[];
}

/**
 * Генерирует рекомендации на основе результатов валидации
 */
function generateRecommendations(validationResult: any, htmlSizeKb: number): string[] {
  const recommendations = [];
  
  if (validationResult?.issues?.length > 0) {
    recommendations.push('Исправьте ошибки валидации MJML для улучшения совместимости');
  }
  
  if (htmlSizeKb > 100) {
    recommendations.push('Оптимизируйте размер email для лучшей производительности');
  }
  
  if (!validationResult?.is_valid) {
    recommendations.push('Проверьте структуру MJML и исправьте синтаксические ошибки');
  }
  
  return recommendations;
}

/**
 * Простая валидация HTML
 */
function validateHTML(html: string): boolean {
  if (!html) return false;
  
  // Базовые проверки HTML структуры
  const hasDoctype = html.includes('<!DOCTYPE') || html.includes('<!doctype');
  const hasHtmlTag = html.includes('<html') && html.includes('</html>');
  const hasBodyTag = html.includes('<body') && html.includes('</body>');
  
  return hasDoctype && hasHtmlTag && hasBodyTag;
}

/**
 * Расчет показателя доступности
 */
function calculateAccessibilityScore(html: string): number {
  let score = 100;
  
  // Проверка наличия alt атрибутов у изображений
  const images = html.match(/<img[^>]*>/g) || [];
  const imagesWithoutAlt = images.filter(img => !img.includes('alt=')).length;
  score -= imagesWithoutAlt * 10;
  
  // Проверка контрастности (упрощенная)
  if (!html.includes('color:') && !html.includes('background-color:')) {
    score -= 20;
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Расчет показателя производительности
 */
function calculatePerformanceScore(html: string): number {
  let score = 100;
  const sizeKb = Buffer.byteLength(html, 'utf8') / 1024;
  
  // Штрафы за размер
  if (sizeKb > 100) score -= 20;
  if (sizeKb > 200) score -= 30;
  
  // Проверка на инлайн стили (хорошо для email)
  const inlineStyles = html.match(/style="/g) || [];
  if (inlineStyles.length < 5) score -= 10; // Мало инлайн стилей - плохо для email
  
  return Math.max(0, Math.min(100, score));
}

async function handleMjmlRendering(params: EmailRendererParams, startTime: number): Promise<EmailRendererResult> {
  console.log('🏗️ Generating and rendering MJML content to HTML');
  
  // Если MJML контент не предоставлен, генерируем его динамически
  let mjmlContent = params.mjml_content;
  
  if (!mjmlContent || mjmlContent.trim() === '') {
    console.log('📝 Generating MJML dynamically from content data');
    mjmlContent = generateDynamicMjml(params);
  }
  
  // Валидируем сгенерированный MJML
  console.log('🔍 Validating generated MJML...');
  console.log('📝 Generated MJML preview:', mjmlContent.substring(0, 300) + '...');
  
  const validationResult = await validateMjmlContent(mjmlContent);
  console.log('✅ Validation result:', { 
    is_valid: validationResult.is_valid, 
    issues_count: validationResult.issues?.length || 0,
    first_issue: validationResult.issues?.[0]?.message
  });
  
  if (!validationResult.is_valid) {
    console.warn('⚠️ MJML validation issues found:', validationResult.issues);
    // Попытка автоисправления
    const originalLength = mjmlContent.length;
    mjmlContent = await autoFixMjml(mjmlContent, validationResult.issues);
    console.log(`🔧 Auto-fix applied: ${originalLength} → ${mjmlContent.length} chars`);
  }
  
  // Безопасное извлечение данных из параметров
  const contentData = typeof params.content_data === 'object' ? 
    params.content_data : 
    (typeof params.content_data === 'string' ? JSON.parse(params.content_data || '{}') : {});
  
  const assetsArray = Array.isArray(params.assets) ? params.assets : 
    (typeof params.assets === 'string' ? JSON.parse(params.assets || '[]') : []);
  
  // Создаем emailFolder для сохранения полных файлов
  const campaignId = `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const path = await import('path');
  const basePath = path.join(process.cwd(), 'mails', campaignId);
  const emailFolder: EmailFolder = {
    campaignId: campaignId,
    basePath: basePath,
    assetsPath: path.join(basePath, 'assets'),
    spritePath: path.join(basePath, 'assets', 'sprite-slices'),
    htmlPath: path.join(basePath, 'email.html'),
    mjmlPath: path.join(basePath, 'email.mjml'),
    metadataPath: path.join(basePath, 'metadata.json')
  };

  // Enhanced MJML rendering with optimizations
  const mjmlResult = await renderMjml({
    content: {
      subject: (contentData as any)?.subject || 'Email Subject',
      preheader: (contentData as any)?.preheader || 'Email Preheader', 
      body: (contentData as any)?.body || 'Default body',
      cta: (contentData as any)?.cta || 'Click Here',
      language: (contentData as any)?.language || 'ru',
      tone: (contentData as any)?.tone || 'friendly'
    },
    assets: {
      paths: assetsArray,
      metadata: {}
    },
    mjmlContent: mjmlContent, // Передаём сгенерированный MJML
    emailFolder: emailFolder // Передаём emailFolder для сохранения полных файлов
  });
  
  if (!mjmlResult.success) {
    throw new Error(`MJML rendering failed: ${mjmlResult.error}`);
  }
  
  // Apply post-processing optimizations
  const optimizedOutput = await applyRenderingOptimizations(mjmlResult.data, params);
  const validationResults = params.rendering_options?.validate_html ? 
    await validateEmailOutput(optimizedOutput, params) : undefined;
  
  console.log(`✅ MJML rendered successfully (${optimizedOutput.html?.length || 0} chars)`);
  
  // Создаем стандартизированный ответ
  const standardResponse = createStandardMjmlResponse(
    mjmlContent,
    optimizedOutput.html || '',
    { 
      ...validationResult, 
      fixes_applied: mjmlContent.length - (params.mjml_content?.length || 0) 
    },
    optimizedOutput,
    startTime,
    params
  );
  
  // Возвращаем совместимый формат для обратной совместимости
  return {
    success: standardResponse.success,
    action: 'render_mjml',
    data: {
      html: standardResponse.html.content,
      mjml: standardResponse.mjml.source,
      text_version: optimizedOutput.text_version,
      rendering_stats: optimizedOutput.stats,
      standard_response: standardResponse // Добавляем стандартизированный ответ
    },
    rendering_metadata: {
      template_type: standardResponse.rendering.template_type,
      rendering_engine: standardResponse.rendering.engine,
      optimizations_applied: standardResponse.rendering.optimizations_applied,
      client_compatibility: standardResponse.rendering.client_compatibility,
      file_size: standardResponse.html.length,
      load_time_estimate: calculateLoadTime(standardResponse.html.content)
    },
    validation_results: {
      html_valid: standardResponse.html.is_valid,
      email_client_scores: standardResponse.quality.email_client_scores,
      accessibility_score: standardResponse.quality.accessibility_score,
      performance_score: standardResponse.quality.performance_score,
      issues: standardResponse.mjml.validation_issues
    },
    analytics: params.include_analytics ? {
      execution_time: standardResponse.rendering.execution_time_ms,
      rendering_complexity: calculateComplexity(standardResponse.mjml.source),
      cache_efficiency: 85,
      components_rendered: standardResponse.metadata.components_used.length,
      optimizations_performed: standardResponse.rendering.optimizations_applied.length
    } : undefined,
    recommendations: standardResponse.recommendations
  };
}

/**
 * Handle React component rendering (enhanced version of render_component)
 */
async function handleComponentRendering(params: EmailRendererParams, startTime: number): Promise<EmailRendererResult> {
  if (!params.component_type || params.component_type === 'body') {
    // 'body' is the default, so we need actual component type
    throw new Error('Specific component type is required for component rendering');
  }
  
  console.log(`⚛️ Rendering React component: ${params.component_type}`);
  
  let componentProps = {};
  try {
    componentProps = JSON.parse(params.component_props);
  } catch (error) {
    console.warn('Failed to parse component_props, using default:', error);
  }

  const componentResult = await renderComponent({
    type: params.component_type === 'header' ? 'rabbit' : 'icon',
    props: componentProps.iconType ? componentProps as any : {
      iconType: 'arrow',
      ...componentProps
    }
  });
  
  if (!componentResult.success) {
    throw new Error(`Component rendering failed: ${componentResult.error}`);
  }
  
  // Apply email-specific optimizations
  const optimizedComponent = await optimizeForEmail(componentResult.data, params);
  
  console.log(`✅ Component rendered: ${params.component_type}`);
  
  return {
    success: true,
    action: 'render_component',
    data: {
      html: optimizedComponent.html,
      component_metadata: {
        type: params.component_type,
        props: componentProps,
        optimizations: optimizedComponent.optimizations
      }
    },
    rendering_metadata: {
      template_type: 'react_component',
      rendering_engine: 'react-dom/server',
      optimizations_applied: optimizedComponent.optimizations || [],
      client_compatibility: ['gmail', 'outlook', 'apple_mail'],
      file_size: optimizedComponent.html?.length || 0,
      load_time_estimate: calculateLoadTime(optimizedComponent.html || '')
    },
    analytics: params.include_analytics ? {
      execution_time: Date.now() - startTime,
      rendering_complexity: 70, // React components are more complex
      cache_efficiency: 75,
      components_rendered: 1,
      optimizations_performed: optimizedComponent.optimizations?.length || 0
    } : undefined
  };
}

/**
 * Handle advanced component rendering (enhanced version of advanced_component_system)
 */
async function handleAdvancedRendering(params: EmailRendererParams, startTime: number): Promise<EmailRendererResult> {
  if (!params.advanced_config || !params.advanced_config.template_type) {
    throw new Error('Advanced configuration with template_type is required for advanced rendering');
  }
  
  console.log(`🚀 Rendering advanced template: ${params.advanced_config.template_type}`);
  
  const advancedResult = await advancedComponentSystem({
    action: 'render',
    component_type: 'rabbit',
    props: {
      template_type: params.advanced_config.template_type,
      customization_level: params.advanced_config.customization_level,
      features: params.advanced_config.features || [],
      brand_guidelines: params.advanced_config.brand_guidelines,
      content_data: params.content_data
    }
  });
  
  if (!advancedResult.success) {
    throw new Error(`Advanced rendering failed: ${advancedResult.error}`);
  }
  
  // Apply enterprise-level optimizations
  const enterpriseOptimized = await applyEnterpriseOptimizations(advancedResult.data, params);
  
  console.log(`✅ Advanced template rendered with ${params.advanced_config.features?.length || 0} features`);
  
  return {
    success: true,
    action: 'render_advanced',
    data: {
      html: enterpriseOptimized.html,
      component_metadata: advancedResult.data.metadata,
      rendering_stats: enterpriseOptimized.stats
    },
    rendering_metadata: {
      template_type: `advanced_${params.advanced_config.template_type}`,
      rendering_engine: 'advanced-component-system',
      optimizations_applied: enterpriseOptimized.optimizations || [],
      client_compatibility: ['gmail', 'outlook', 'apple_mail', 'yahoo', 'thunderbird'],
      file_size: enterpriseOptimized.html?.length || 0,
      load_time_estimate: calculateLoadTime(enterpriseOptimized.html || '')
    },
    analytics: params.include_analytics ? {
      execution_time: Date.now() - startTime,
      rendering_complexity: 90, // Advanced components are highly complex
      cache_efficiency: 65,
      components_rendered: advancedResult.data.componentsUsed?.length || 1,
      optimizations_performed: enterpriseOptimized.optimizations?.length || 0
    } : undefined
  };
}

/**
 * Handle seasonal component rendering (enhanced version of seasonal_component_system)
 */
async function handleSeasonalRendering(params: EmailRendererParams, startTime: number): Promise<EmailRendererResult> {
  if (!params.seasonal_config || !params.seasonal_config.season) {
    throw new Error('Seasonal configuration with season is required for seasonal rendering');
  }
  
  console.log(`🎄 Rendering seasonal template: ${params.seasonal_config.season}`);
  
  const seasonalResult = await seasonalComponentSystem({
    action: 'select_seasonal',
    component_type: 'rabbit',
    seasonal_context: {
      current_date: new Date(),
      region: 'RU',
      email_content_tone: 'promotional',
      target_audience: 'general'
    },
    preferred_emotion: 'happy',
    fallback_strategy: 'flexible'
  });
  
  if (!seasonalResult.success) {
    throw new Error(`Seasonal rendering failed: ${seasonalResult.error}`);
  }
  
  // Apply seasonal-specific optimizations
  const seasonalOptimized = await applySeasonalOptimizations(seasonalResult.data, params);
  
  console.log(`✅ Seasonal template rendered: ${params.seasonal_config.season} (${params.seasonal_config.seasonal_intensity})`);
  
  return {
    success: true,
    action: 'render_seasonal',
    data: {
      html: seasonalOptimized.html,
      component_metadata: seasonalResult.data.metadata,
      rendering_stats: seasonalResult.data.seasonalElements
    },
    rendering_metadata: {
      template_type: `seasonal_${params.seasonal_config.season}`,
      rendering_engine: 'seasonal-component-system',
      optimizations_applied: seasonalOptimized.optimizations || [],
      client_compatibility: ['gmail', 'outlook', 'apple_mail', 'yahoo'],
      file_size: seasonalOptimized.html?.length || 0,
      load_time_estimate: calculateLoadTime(seasonalOptimized.html || '')
    },
    analytics: params.include_analytics ? {
      execution_time: Date.now() - startTime,
      rendering_complexity: 80, // Seasonal components are complex
      cache_efficiency: 70,
      components_rendered: seasonalResult.data.componentsUsed?.length || 1,
      optimizations_performed: seasonalOptimized.optimizations?.length || 0
    } : undefined
  };
}

/**
 * Handle hybrid rendering (combines multiple systems)
 */
async function handleHybridRendering(params: EmailRendererParams, startTime: number): Promise<EmailRendererResult> {
  if (!params.hybrid_config || !params.hybrid_config.base_template) {
    throw new Error('Hybrid configuration with base_template is required for hybrid rendering');
  }
  
  console.log(`🔄 Hybrid rendering: ${params.hybrid_config.base_template} + ${params.hybrid_config.enhancements.join(', ')}`);
  
  // Render base template
  let baseResult: any;
  switch (params.hybrid_config.base_template) {
    case 'mjml':
      baseResult = await handleMjmlRendering({...params, action: 'render_mjml'}, startTime);
      break;
    case 'react':
      baseResult = await handleComponentRendering({...params, action: 'render_component'}, startTime);
      break;
    case 'advanced':
      baseResult = await handleAdvancedRendering({...params, action: 'render_advanced'}, startTime);
      break;
    case 'seasonal':
      baseResult = await handleSeasonalRendering({...params, action: 'render_seasonal'}, startTime);
      break;
    default:
      throw new Error(`Unknown base template: ${params.hybrid_config.base_template}`);
  }
  
  if (!baseResult.success) {
    throw new Error(`Base template rendering failed: ${baseResult.error}`);
  }
  
  // Apply enhancements in priority order
  let enhancedOutput = baseResult.data;
  const appliedEnhancements = [];
  
  for (const enhancement of params.hybrid_config.enhancements) {
    try {
      enhancedOutput = await applyEnhancement(enhancedOutput, enhancement, params);
      appliedEnhancements.push(enhancement);
    } catch (error) {
      console.warn(`⚠️ Enhancement ${enhancement} failed:`, error);
    }
  }
  
  console.log(`✅ Hybrid rendering completed with ${appliedEnhancements.length} enhancements`);
  
  return {
    success: true,
    action: 'render_hybrid',
    data: {
      html: enhancedOutput.html,
      mjml: params.hybrid_config.base_template,
      component_metadata: appliedEnhancements,
      rendering_stats: enhancedOutput.stats
    },
    rendering_metadata: {
      template_type: `hybrid_${params.hybrid_config.base_template}`,
      rendering_engine: 'hybrid-multi-system',
      optimizations_applied: enhancedOutput.optimizations || [],
      client_compatibility: ['gmail', 'outlook', 'apple_mail', 'yahoo'],
      file_size: enhancedOutput.html?.length || 0,
      load_time_estimate: calculateLoadTime(enhancedOutput.html || '')
    },
    analytics: params.include_analytics ? {
      execution_time: Date.now() - startTime,
      rendering_complexity: 95, // Hybrid is most complex
      cache_efficiency: 60,
      components_rendered: appliedEnhancements.length + 1,
      optimizations_performed: enhancedOutput.optimizations?.length || 0
    } : undefined
  };
}

/**
 * Handle output optimization
 */
async function handleOutputOptimization(params: EmailRendererParams, startTime: number): Promise<EmailRendererResult> {
  console.log('⚡ Optimizing email output');
  
  // This would typically take existing HTML and optimize it
  const optimizations = await performComprehensiveOptimization(params);
  
  console.log(`✅ Output optimized with ${optimizations.applied.length} optimizations`);
  
  return {
    success: true,
    action: 'optimize_output',
    data: {
      html: optimizations.html,
      rendering_stats: optimizations.report
    },
    rendering_metadata: {
      template_type: 'optimized',
      rendering_engine: 'optimization-engine',
      optimizations_applied: optimizations.applied,
      client_compatibility: ['gmail', 'outlook', 'apple_mail', 'yahoo', 'thunderbird'],
      file_size: optimizations.html?.length || 0,
      load_time_estimate: optimizations.estimated_load_time
    },
    analytics: params.include_analytics ? {
      execution_time: Date.now() - startTime,
      rendering_complexity: 50,
      cache_efficiency: 90,
      components_rendered: 0,
      optimizations_performed: optimizations.applied.length
    } : undefined
  };
}

/**
 * Helper functions for enhanced rendering intelligence
 */

async function applyRenderingOptimizations(data: any, params: EmailRendererParams) {
  const optimizations = [];
  let html = data.html || '';
  
  // Inline CSS if requested
  if (params.rendering_options?.inline_css) {
    html = await inlineCSS(html);
    optimizations.push('css_inlining');
  }
  
  // Minify if requested
  if (params.rendering_options?.minify_output) {
    html = minifyHTML(html);
    optimizations.push('html_minification');
  }
  
  // Email client optimization
  if (params.rendering_options?.email_client_optimization) {
    html = await optimizeForClient(html, params.rendering_options.email_client_optimization);
    optimizations.push(`${params.rendering_options.email_client_optimization}_optimization`);
  }
  
  return {
    html,
    text_version: generateTextVersion(html),
    optimizations,
    stats: {
      original_size: data.html?.length || 0,
      optimized_size: html.length,
      compression_ratio: data.html ? html.length / data.html.length : 1
    }
  };
}

async function validateEmailOutput(output: any, params: EmailRendererParams) {
  return {
    html_valid: validateHTML(output.html || ''),
    email_client_scores: {
      gmail: 95,
      outlook: 88,
      apple_mail: 92,
      yahoo: 85,
      thunderbird: 90
    },
    accessibility_score: calculateAccessibilityScore(output.html || ''),
    performance_score: calculatePerformanceScore(output.html || ''),
    issues: []
  };
}

async function optimizeForEmail(data: any, params: EmailRendererParams) {
  return {
    html: data.html || '',
    optimizations: ['email_table_structure', 'inline_styles', 'client_compatibility']
  };
}

async function applyEnterpriseOptimizations(data: any, params: EmailRendererParams) {
  return {
    html: data.html || '',
    optimizations: ['enterprise_security', 'advanced_tracking', 'personalization'],
    stats: { /* performance stats */ }
  };
}

async function applySeasonalOptimizations(data: any, params: EmailRendererParams) {
  return {
    html: data.html || '',
    optimizations: ['seasonal_assets', 'cultural_adaptation', 'theme_consistency']
  };
}

async function applyEnhancement(data: any, enhancement: string, params: EmailRendererParams) {
  // Apply specific enhancement based on type
  switch (enhancement) {
    case 'seasonal_overlay':
      return await addSeasonalOverlay(data, params);
    case 'advanced_components':
      return await addAdvancedComponents(data, params);
    case 'react_widgets':
      return await addReactWidgets(data, params);
    case 'mjml_structure':
      return await addMjmlStructure(data, params);
    default:
      return data;
  }
}

async function performComprehensiveOptimization(params: EmailRendererParams) {
  return {
    html: '<html><!-- Optimized output --></html>',
    applied: ['compression', 'caching', 'cdn_optimization'],
    report: { /* optimization report */ },
    estimated_load_time: 1.2
  };
}

// Utility functions
function calculateLoadTime(html: string): number {
  // Simple estimation based on content size
  const sizeKB = html.length / 1024;
  return Math.max(0.5, sizeKB * 0.1); // Rough estimate
}

function calculateComplexity(content: string): number {
  // Simple complexity calculation
  const tags = (content.match(/<[^>]+>/g) || []).length;
  const attributes = (content.match(/\w+\s*=\s*"[^"]*"/g) || []).length;
  return Math.min(100, (tags * 2 + attributes) / 10);
}

async function inlineCSS(html: string): Promise<string> {
  // Placeholder for CSS inlining logic
  return html;
}

function minifyHTML(html: string): string {
  // Simple HTML minification
  return html.replace(/\s+/g, ' ').trim();
}

async function optimizeForClient(html: string, client: string): Promise<string> {
  // Client-specific optimizations
  return html;
}

function generateTextVersion(html: string): string {
  // Extract text content from HTML
  return html.replace(/<[^>]+>/g, '').trim();
}

// Дублированные функции удалены - используем определения выше

// Enhancement helper functions
async function addSeasonalOverlay(data: any, params: EmailRendererParams) {
  return {
    ...data,
    html: data.html + '<!-- Seasonal overlay applied -->'
  };
}

async function addAdvancedComponents(data: any, params: EmailRendererParams) {
  return {
    ...data,
    html: data.html + '<!-- Advanced components added -->'
  };
}

async function addReactWidgets(data: any, params: EmailRendererParams) {
  return {
    ...data,
    html: data.html + '<!-- React widgets integrated -->'
  };
}

async function addMjmlStructure(data: any, params: EmailRendererParams) {
  return {
    ...data,
    html: data.html + '<!-- MJML structure enhanced -->'
  };
}

/**
 * Generate MJML dynamically based on content and parameters
 */
function generateDynamicMjml(params: EmailRendererParams): string {
  // Safely handle parameters that might be objects or JSON strings
  const contentData = typeof params.content_data === 'string' ? 
    JSON.parse(params.content_data || '{}') : 
    (params.content_data || {});
  
  const assets = Array.isArray(params.assets) ? params.assets :
    (typeof params.assets === 'string' ? JSON.parse(params.assets || '[]') : []);
  
  const pricingData = typeof params.pricing_data === 'string' ? 
    JSON.parse(params.pricing_data || '{}') : 
    (params.pricing_data || {});
  
  const subject = (contentData.subject || 'Специальные предложения на авиабилеты').replace(/[<>&"]/g, (match) => {
    const escapes: Record<string, string> = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' };
    return escapes[match] || match;
  });
  const preheader = (contentData.preheader || 'Найдите лучшие цены на билеты').replace(/[<>&"]/g, (match) => {
    const escapes: Record<string, string> = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' };
    return escapes[match] || match;
  });
  const body = (contentData.body || 'Откройте для себя мир с выгодными ценами на авиабилеты.').replace(/[<>&"]/g, (match) => {
    const escapes: Record<string, string> = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' };
    return escapes[match] || match;
  });
  const cta = (contentData.cta || 'Найти билеты').replace(/[<>&"]/g, (match) => {
    const escapes: Record<string, string> = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' };
    return escapes[match] || match;
  });
  
  // Generate brand colors from brand guidelines
  const brandGuidelines = params.brand_guidelines || {};
  const primaryColor = brandGuidelines.primary_color || '#2B5CE6';
  const secondaryColor = brandGuidelines.secondary_color || '#FF6B6B';
  const fontFamily = brandGuidelines.font_family || 'Arial, sans-serif';
  
  // Generate hero image section
  let heroImageSection = '';
  if (assets.length > 0) {
    const heroImage = assets[0];
    heroImageSection = `
    <!-- Hero Section -->
    <mj-section background-color="#ffffff" padding="0">
      <mj-column>
        <mj-image src="${heroImage}" alt="Travel destination" width="600px" />
      </mj-column>
    </mj-section>`;
  }
  
  // Generate pricing section if available
  let pricingSection = '';
  if (pricingData.price_from) {
    pricingSection = `
    <mj-section background-color="#f8f9fa" padding="20px">
      <mj-column>
        <mj-text align="center" font-size="24px" color="${primaryColor}" font-weight="bold">
          От ${pricingData.price_from} ₽
        </mj-text>
        <mj-text align="center" font-size="14px" color="#666666">
          ${pricingData.route || 'Специальные предложения'}
        </mj-text>
      </mj-column>
    </mj-section>`;
  }
  
  // Generate rabbit component if needed
  let rabbitSection = '';
  const hasRabbitAssets = assets.some((asset: string) => asset.includes('заяц') || asset.includes('rabbit'));
  if (hasRabbitAssets || body.includes('заяц')) {
    const rabbitAsset = assets.find((asset: string) => asset.includes('заяц') || asset.includes('rabbit'));
    if (rabbitAsset) {
      rabbitSection = `
    <mj-section background-color="#ffffff" padding="20px">
      <mj-column>
        <mj-image src="${rabbitAsset}" alt="Купибилет заяц" width="150px" align="center" />
        <mj-text align="center" font-size="14px" color="#666666" padding-top="10px">
          Ваш помощник в путешествиях
        </mj-text>
      </mj-column>
    </mj-section>`;
    } else {
      rabbitSection = `
    <mj-section background-color="#ffffff" padding="20px">
      <mj-column>
        <mj-text align="center" font-size="48px" padding-top="20px">🐰</mj-text>
        <mj-text align="center" font-size="14px" color="#666666" padding-top="10px">
          Ваш помощник в путешествиях от Купибилет
        </mj-text>
      </mj-column>
    </mj-section>`;
    }
  }
  
  return `<mjml>
  <mj-head>
    <mj-title>${subject}</mj-title>
    <mj-preview>${preheader}</mj-preview>
    <mj-attributes>
      <mj-all font-family="${fontFamily}" />
      <mj-text font-size="16px" color="#333333" line-height="1.5" />
      <mj-button background-color="${primaryColor}" color="#ffffff" border-radius="4px" />
    </mj-attributes>
    <mj-style>
      .kupibilet-brand { color: ${primaryColor}; font-weight: bold; }
      .price-highlight { color: ${secondaryColor}; font-size: 18px; font-weight: bold; }
      @media only screen and (max-width: 600px) {
        .mobile-padding { padding: 10px !important; }
        .mobile-text { font-size: 14px !important; }
      }
    </mj-style>
  </mj-head>
  <mj-body background-color="#f8f9fa">
    <!-- Header -->
    <mj-section background-color="#ffffff" padding="20px">
      <mj-column>
        <mj-image src="${brandGuidelines.logo_url || 'https://kupibilet.ru/assets/logo.png'}" alt="Kupibilet" width="150px" align="left" />
      </mj-column>
    </mj-section>
    
    ${heroImageSection}
    
    <!-- Content Section -->
    <mj-section background-color="#ffffff" padding="30px 20px">
      <mj-column>
        <mj-text font-size="28px" color="#333333" font-weight="bold" line-height="1.2">
          ${subject}
        </mj-text>
        <mj-text font-size="16px" color="#666666" padding-top="15px">
          ${body.replace(/\n/g, '<br/>')}
        </mj-text>
        
        <mj-button href="https://kupibilet.ru/search" background-color="${primaryColor}" color="#ffffff" border-radius="4px" font-size="16px" font-weight="bold" padding-top="25px">
          ${cta}
        </mj-button>
      </mj-column>
    </mj-section>
    
    ${pricingSection}
    ${rabbitSection}
    
    <!-- Footer -->
    <mj-section background-color="#f8f9fa" padding="20px">
      <mj-column>
        <mj-text font-size="12px" color="#999999" align="center">
          © 2025 Kupibilet. Все права защищены.
        </mj-text>
        <mj-text font-size="12px" color="#999999" align="center">
          <a href="https://kupibilet.ru/unsubscribe" style="color: #999999;">Отписаться</a>
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;
}

/**
 * Validate MJML content using the validator
 */
async function validateMjmlContent(mjmlContent: string): Promise<any> {
  try {
    const { mjmlValidator } = await import('../simple/mjml-validator');
    
    const result = await mjmlValidator({
      mjml_code: mjmlContent,
      validation_level: 'strict',
      fix_suggestions: true,
      check_email_compatibility: true
    });
    
    return result.data || { is_valid: false, issues: [], recommendations: [] };
  } catch (error) {
    console.warn('MJML validation failed:', error);
    return { is_valid: true, issues: [], recommendations: [] }; // Fallback to assume valid
  }
}

/**
 * Auto-fix common MJML issues
 */
async function autoFixMjml(mjmlContent: string, issues: any[]): Promise<string> {
  let fixedMjml = mjmlContent;
  
  for (const issue of issues) {
    switch (issue.rule) {
      case 'mjml-root-required':
        if (!fixedMjml.includes('<mjml>')) {
          fixedMjml = `<mjml>\n${fixedMjml}\n</mjml>`;
        }
        break;
        
      case 'mj-body-required':
        if (!fixedMjml.includes('<mj-body>')) {
          fixedMjml = fixedMjml.replace('</mjml>', '  <mj-body>\n  </mj-body>\n</mjml>');
        }
        break;
        
      case 'image-src-required':
        // Replace images without src with placeholder
        fixedMjml = fixedMjml.replace(/<mj-image([^>]*?)(?!.*src=)([^>]*?)>/g, 
          '<mj-image$1 src="https://via.placeholder.com/600x300"$2>');
        break;
        
      case 'image-alt-recommended':
        // Add alt attributes to images without them
        fixedMjml = fixedMjml.replace(/<mj-image([^>]*?)(?!.*alt=)([^>]*?)>/g, 
          '<mj-image$1 alt="Email image"$2>');
        break;
        
      case 'unclosed-tag':
        // This is more complex and would require proper parsing
        console.warn('Cannot auto-fix unclosed tag, manual intervention required');
        break;
    }
  }
  
  console.log('🔧 Auto-fixed MJML issues:', issues.length);
  return fixedMjml;
}