/**
 * Advanced Component System - Email-Makers
 * Enhanced React component system with dynamic sizing, caching, and analytics
 */

import { ToolResult, handleToolError } from './index';

// Component sizing system
interface ComponentDimensions {
  width: number;
  height: number;
  scale: number;
  density: 'standard' | 'retina' | 'high-dpi';
}

interface SizingContext {
  emailContentLength: number;
  viewportType: 'mobile' | 'tablet' | 'desktop';
  componentPosition: 'header' | 'body' | 'footer' | 'sidebar';
  contentDensity: 'sparse' | 'normal' | 'dense';
}

interface ComponentCache {
  key: string;
  html: string;
  dimensions: ComponentDimensions;
  timestamp: number;
  usage_count: number;
  performance_metrics: {
    render_time: number;
    memory_usage: number;
    cache_hit: boolean;
  };
}

interface ComponentAnalytics {
  component_type: string;
  usage_frequency: number;
  average_render_time: number;
  cache_hit_rate: number;
  performance_score: number;
  user_engagement: {
    click_rate?: number;
    conversion_rate?: number;
    visual_attention?: number;
  };
}

interface AdvancedComponentParams {
  action: 'render' | 'analyze' | 'preview' | 'clear_cache' | 'get_analytics';
  component_type: 'rabbit' | 'icon' | 'button' | 'price_display' | 'social_proof';
  props?: Record<string, any> | null;
  sizing_context?: SizingContext | null;
  cache_strategy?: 'aggressive' | 'normal' | 'minimal' | 'disabled' | null;
  analytics_tracking?: boolean | null;
}

// In-memory cache and analytics storage
const componentCache = new Map<string, ComponentCache>();
const componentAnalytics = new Map<string, ComponentAnalytics>();

/**
 * Advanced Component System Tool
 * Provides enhanced component rendering with dynamic sizing, caching, and analytics
 */
export async function advancedComponentSystem(params: AdvancedComponentParams): Promise<ToolResult> {
  try {
    console.log(`🎨 Advanced Component System: ${params.action} - ${params.component_type}`);

    switch (params.action) {
      case 'render':
        return await renderAdvancedComponent(params);
      
      case 'analyze':
        return analyzeComponentPerformance(params.component_type);
      
      case 'preview':
        return generateComponentPreview(params);
      
      case 'clear_cache':
        return clearComponentCache(params.component_type);
      
      case 'get_analytics':
        return getComponentAnalytics(params.component_type);
      
      default:
        throw new Error(`Unknown action: ${params.action}`);
    }

  } catch (error) {
    return handleToolError('advanced_component_system', error);
  }
}

/**
 * Render component with advanced features
 */
async function renderAdvancedComponent(params: AdvancedComponentParams): Promise<ToolResult> {
  const startTime = Date.now();
  
  // Generate cache key
  const cacheKey = generateCacheKey(params);
  
  // Check cache first
  if (params.cache_strategy !== 'disabled') {
    const cached = componentCache.get(cacheKey);
    if (cached && isCacheValid(cached)) {
      cached.usage_count++;
      cached.performance_metrics.cache_hit = true;
      
      console.log(`🚀 Cache hit for ${params.component_type}: ${cacheKey}`);
      
      // Update analytics
      if (params.analytics_tracking) {
        updateComponentAnalytics(params.component_type, {
          render_time: 0, // Cache hit
          cache_hit: true
        });
      }
      
      return {
        success: true,
        data: {
          html: cached.html,
          dimensions: cached.dimensions,
          cache_hit: true,
          render_time: Date.now() - startTime,
          component_type: params.component_type
        },
        metadata: {
          action: 'render',
          cached: true,
          performance: cached.performance_metrics
        }
      };
    }
  }
  
  // Calculate dynamic sizing
  const dimensions = calculateDynamicSizing(params.component_type, params.sizing_context);
  
  // Render component with dynamic sizing
  const html = await renderComponentWithSizing(params.component_type, params.props, dimensions);
  
  const renderTime = Date.now() - startTime;
  
  // Cache the result
  if (params.cache_strategy !== 'disabled') {
    const cacheEntry: ComponentCache = {
      key: cacheKey,
      html,
      dimensions,
      timestamp: Date.now(),
      usage_count: 1,
      performance_metrics: {
        render_time: renderTime,
        memory_usage: estimateMemoryUsage(html),
        cache_hit: false
      }
    };
    
    componentCache.set(cacheKey, cacheEntry);
    console.log(`💾 Cached component: ${cacheKey}`);
  }
  
  // Update analytics
  if (params.analytics_tracking) {
    updateComponentAnalytics(params.component_type, {
      render_time: renderTime,
      cache_hit: false
    });
  }
  
  return {
    success: true,
    data: {
      html,
      dimensions,
      cache_hit: false,
      render_time: renderTime,
      component_type: params.component_type,
      optimization_applied: true
    },
    metadata: {
      action: 'render',
      cached: false,
      sizing_context: params.sizing_context
    }
  };
}

/**
 * Calculate dynamic component sizing based on context
 */
function calculateDynamicSizing(componentType: string, context?: SizingContext): ComponentDimensions {
  const baseSizes: Record<string, ComponentDimensions> = {
    rabbit: { width: 120, height: 120, scale: 1.0, density: 'standard' },
    icon: { width: 24, height: 24, scale: 1.0, density: 'standard' },
    button: { width: 200, height: 44, scale: 1.0, density: 'standard' },
    price_display: { width: 180, height: 60, scale: 1.0, density: 'standard' },
    social_proof: { width: 300, height: 80, scale: 1.0, density: 'standard' }
  };
  
  let dimensions = baseSizes[componentType] || baseSizes.rabbit;
  
  if (!context) return dimensions;
  
  // Viewport-based scaling
  switch (context.viewportType) {
    case 'mobile':
      dimensions.scale *= 0.8;
      dimensions.width = Math.round(dimensions.width * 0.8);
      break;
    case 'tablet':
      dimensions.scale *= 0.9;
      break;
    case 'desktop':
      // Keep standard size
      break;
  }
  
  // Content density adjustments
  switch (context.contentDensity) {
    case 'sparse':
      dimensions.scale *= 1.2;
      dimensions.width = Math.round(dimensions.width * 1.2);
      dimensions.height = Math.round(dimensions.height * 1.2);
      break;
    case 'dense':
      dimensions.scale *= 0.8;
      dimensions.width = Math.round(dimensions.width * 0.8);
      dimensions.height = Math.round(dimensions.height * 0.8);
      break;
  }
  
  // Position-based adjustments
  switch (context.componentPosition) {
    case 'header':
      dimensions.scale *= 1.1;
      break;
    case 'footer':
      dimensions.scale *= 0.9;
      break;
    case 'sidebar':
      dimensions.width = Math.round(dimensions.width * 0.7);
      break;
  }
  
  // Content length influence
  if (context.emailContentLength > 2000) {
    dimensions.scale *= 0.9; // Smaller components for long emails
  } else if (context.emailContentLength < 500) {
    dimensions.scale *= 1.1; // Larger components for short emails
  }
  
  return dimensions;
}

/**
 * Render component with specific dimensions
 */
async function renderComponentWithSizing(
  componentType: string, 
  props: any, 
  dimensions: ComponentDimensions
): Promise<string> {
  
  const sizeStyles = `
    width: ${dimensions.width}px;
    height: ${dimensions.height}px;
    transform: scale(${dimensions.scale});
    image-rendering: ${dimensions.density === 'retina' ? 'crisp-edges' : 'auto'};
  `;
  
  switch (componentType) {
    case 'rabbit':
      return renderRabbitComponent(props, sizeStyles, dimensions);
    
    case 'icon':
      return renderIconComponent(props, sizeStyles, dimensions);
    
    case 'button':
      return renderButtonComponent(props, sizeStyles, dimensions);
    
    case 'price_display':
      return renderPriceDisplayComponent(props, sizeStyles, dimensions);
    
    case 'social_proof':
      return renderSocialProofComponent(props, sizeStyles, dimensions);
    
    default:
      throw new Error(`Unknown component type: ${componentType}`);
  }
}

/**
 * Enhanced Rabbit Component with dynamic sizing
 */
function renderRabbitComponent(props: any, sizeStyles: string, dimensions: ComponentDimensions): string {
  const emotion = props?.emotion || 'happy';
  const variant = props?.variant || '01';
  const alt = props?.alt || `Rabbit character - ${emotion}`;
  
  return `
    <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
      <tr>
        <td style="text-align: center; padding: 10px;">
          <img 
            src="/assets/rabbit-${emotion}-${variant}.png" 
            alt="${alt}"
            style="${sizeStyles} display: block; margin: 0 auto;"
            width="${dimensions.width}"
            height="${dimensions.height}"
          />
        </td>
      </tr>
    </table>
  `;
}

/**
 * Enhanced Icon Component with dynamic sizing
 */
function renderIconComponent(props: any, sizeStyles: string, dimensions: ComponentDimensions): string {
  const iconType = props?.iconType || 'arrow';
  const color = props?.color || '#007bff';
  const alt = props?.alt || `${iconType} icon`;
  
  return `
    <table cellpadding="0" cellspacing="0" border="0" style="display: inline-table;">
      <tr>
        <td style="text-align: center; vertical-align: middle;">
          <img 
            src="/assets/icon-${iconType}.png" 
            alt="${alt}"
            style="${sizeStyles} display: inline-block; vertical-align: middle;"
            width="${dimensions.width}"
            height="${dimensions.height}"
          />
        </td>
      </tr>
    </table>
  `;
}

/**
 * New Button Component
 */
function renderButtonComponent(props: any, sizeStyles: string, dimensions: ComponentDimensions): string {
  const text = props?.text || 'Book Now';
  const href = props?.href || '#';
  const backgroundColor = props?.backgroundColor || '#007bff';
  const textColor = props?.textColor || '#ffffff';
  
  return `
    <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
      <tr>
        <td style="text-align: center; padding: 10px;">
          <a href="${href}" style="
            display: inline-block;
            background-color: ${backgroundColor};
            color: ${textColor};
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-family: Arial, sans-serif;
            font-size: 16px;
            font-weight: bold;
            ${sizeStyles}
            min-width: ${dimensions.width}px;
            text-align: center;
          ">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
}

/**
 * New Price Display Component
 */
function renderPriceDisplayComponent(props: any, sizeStyles: string, dimensions: ComponentDimensions): string {
  const price = props?.price || '25,000';
  const currency = props?.currency || 'RUB';
  const label = props?.label || 'от';
  const highlight = props?.highlight || false;
  
  const highlightStyle = highlight ? 'background-color: #fff3cd; border: 2px solid #ffc107;' : '';
  
  return `
    <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
      <tr>
        <td style="
          text-align: center; 
          padding: 12px 16px;
          ${highlightStyle}
          border-radius: 8px;
          ${sizeStyles}
        ">
          <div style="font-family: Arial, sans-serif; line-height: 1.2;">
            <div style="font-size: 14px; color: #666; margin-bottom: 4px;">${label}</div>
            <div style="font-size: 24px; font-weight: bold; color: #333;">
              ${price} <span style="font-size: 16px; color: #666;">${currency}</span>
            </div>
          </div>
        </td>
      </tr>
    </table>
  `;
}

/**
 * New Social Proof Component
 */
function renderSocialProofComponent(props: any, sizeStyles: string, dimensions: ComponentDimensions): string {
  const testimonial = props?.testimonial || 'Отличный сервис!';
  const author = props?.author || 'Анна К.';
  const rating = props?.rating || 5;
  
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
  
  return `
    <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
      <tr>
        <td style="
          text-align: center; 
          padding: 16px;
          background-color: #f8f9fa;
          border-radius: 8px;
          ${sizeStyles}
          max-width: ${dimensions.width}px;
        ">
          <div style="font-family: Arial, sans-serif;">
            <div style="color: #ffc107; font-size: 18px; margin-bottom: 8px;">${stars}</div>
            <div style="font-size: 14px; color: #333; font-style: italic; margin-bottom: 8px;">
              "${testimonial}"
            </div>
            <div style="font-size: 12px; color: #666;">— ${author}</div>
          </div>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Generate cache key for component
 */
function generateCacheKey(params: AdvancedComponentParams): string {
  const propsHash = JSON.stringify(params.props || {});
  const contextHash = JSON.stringify(params.sizing_context || {});
  return `${params.component_type}-${Buffer.from(propsHash + contextHash).toString('base64').substring(0, 16)}`;
}

/**
 * Check if cache entry is still valid
 */
function isCacheValid(cache: ComponentCache): boolean {
  const maxAge = 30 * 60 * 1000; // 30 minutes
  return (Date.now() - cache.timestamp) < maxAge;
}

/**
 * Estimate memory usage of component HTML
 */
function estimateMemoryUsage(html: string): number {
  return html.length * 2; // Rough estimate: 2 bytes per character
}

/**
 * Update component analytics
 */
function updateComponentAnalytics(componentType: string, metrics: { render_time: number; cache_hit: boolean }): void {
  const existing = componentAnalytics.get(componentType) || {
    component_type: componentType,
    usage_frequency: 0,
    average_render_time: 0,
    cache_hit_rate: 0,
    performance_score: 0,
    user_engagement: {}
  };
  
  existing.usage_frequency++;
  existing.average_render_time = (existing.average_render_time + metrics.render_time) / 2;
  
  if (metrics.cache_hit) {
    existing.cache_hit_rate = (existing.cache_hit_rate + 1) / 2;
  }
  
  // Calculate performance score (0-100)
  existing.performance_score = Math.min(100, 
    (existing.cache_hit_rate * 40) + 
    (Math.max(0, 100 - existing.average_render_time / 10) * 60)
  );
  
  componentAnalytics.set(componentType, existing);
}

/**
 * Analyze component performance
 */
function analyzeComponentPerformance(componentType?: string): ToolResult {
  const analytics = componentType 
    ? [componentAnalytics.get(componentType)].filter(Boolean)
    : Array.from(componentAnalytics.values());
  
  const cacheStats = {
    total_entries: componentCache.size,
    cache_hit_rate: analytics.reduce((sum, a) => sum + a.cache_hit_rate, 0) / analytics.length || 0,
    average_render_time: analytics.reduce((sum, a) => sum + a.average_render_time, 0) / analytics.length || 0
  };
  
  return {
    success: true,
    data: {
      analytics,
      cache_statistics: cacheStats,
      performance_summary: {
        total_components: analytics.length,
        best_performing: analytics.sort((a, b) => b.performance_score - a.performance_score)[0]?.component_type,
        optimization_opportunities: analytics.filter(a => a.performance_score < 70).map(a => a.component_type)
      }
    },
    metadata: {
      action: 'analyze',
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Generate component preview
 */
function generateComponentPreview(params: AdvancedComponentParams): ToolResult {
  const previewHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Component Preview: ${params.component_type}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .preview-container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .preview-info { margin-bottom: 20px; padding: 10px; background: #e3f2fd; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="preview-container">
        <div class="preview-info">
          <h3>Component Preview: ${params.component_type}</h3>
          <p>Props: ${JSON.stringify(params.props || {}, null, 2)}</p>
          <p>Sizing Context: ${JSON.stringify(params.sizing_context || {}, null, 2)}</p>
        </div>
        <div class="component-preview">
          <!-- Component will be rendered here -->
          <p>Preview functionality ready - component rendering integration needed</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return {
    success: true,
    data: {
      preview_html: previewHtml,
      component_type: params.component_type,
      preview_url: `/preview/${params.component_type}/${Date.now()}`
    },
    metadata: {
      action: 'preview',
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Clear component cache
 */
function clearComponentCache(componentType?: string): ToolResult {
  if (componentType) {
    const keysToDelete = Array.from(componentCache.keys()).filter(key => key.startsWith(componentType));
    keysToDelete.forEach(key => componentCache.delete(key));
    
    return {
      success: true,
      data: {
        cleared_entries: keysToDelete.length,
        component_type: componentType
      },
      metadata: {
        action: 'clear_cache',
        timestamp: new Date().toISOString()
      }
    };
  } else {
    const totalEntries = componentCache.size;
    componentCache.clear();
    
    return {
      success: true,
      data: {
        cleared_entries: totalEntries,
        component_type: 'all'
      },
      metadata: {
        action: 'clear_cache',
        timestamp: new Date().toISOString()
      }
    };
  }
}

/**
 * Get component analytics
 */
function getComponentAnalytics(componentType?: string): ToolResult {
  return analyzeComponentPerformance(componentType);
} 