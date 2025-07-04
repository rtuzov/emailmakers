/**
 * 📱 RESPONSIVE DESIGN TOOL
 * 
 * Инструмент для создания адаптивного дизайна email шаблонов
 * Оптимизирует отображение на различных устройствах и экранах
 */

import { generateTraceId, tracedAsync } from '../../utils/tracing-utils';



export interface ResponsiveDesignParams {
  action: 'analyze' | 'optimize' | 'generate' | 'test';
  
  // For analysis
  html_content?: string;
  analyze_breakpoints?: boolean;
  check_compatibility?: boolean;
  
  // For optimization
  target_html?: string;
  optimization_level?: 'basic' | 'standard' | 'aggressive';
  preserve_layout?: boolean;
  
  // For generation
  layout_type?: 'single_column' | 'two_column' | 'multi_column' | 'hybrid';
  target_devices?: Array<'mobile' | 'tablet' | 'desktop'>;
  content_blocks?: Array<{
    type: 'header' | 'content' | 'image' | 'cta' | 'footer';
    content: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  
  // For testing
  test_viewports?: Array<{
    name: string;
    width: number;
    height: number;
    device_type: 'mobile' | 'tablet' | 'desktop';
  }>;
  
  // Common options
  email_client_support?: Array<'gmail' | 'outlook' | 'apple_mail' | 'yahoo' | 'thunderbird'>;
  css_approach?: 'inline' | 'embedded' | 'hybrid';
  fallback_strategy?: 'graceful' | 'progressive' | 'minimal';
}

export interface ResponsiveDesignResult {
  success: boolean;
  action_performed: string;
  
  // Analysis results
  analysis_results?: {
    current_breakpoints: Array<{
      width: number;
      type: string;
      rules_count: number;
    }>;
    responsive_score: number;
    compatibility_issues: Array<{
      client: string;
      issue: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      suggestion: string;
    }>;
    layout_analysis: {
      is_mobile_friendly: boolean;
      uses_fluid_layouts: boolean;
      has_proper_scaling: boolean;
      image_optimization: boolean;
    };
  };
  
  // Optimization results
  optimized_html?: string;
  optimization_changes?: Array<{
    type: 'media_query' | 'css_rule' | 'html_structure' | 'image_scaling';
    description: string;
    before: string;
    after: string;
    impact: 'low' | 'medium' | 'high';
  }>;
  
  // Generation results
  generated_template?: {
    html_content: string;
    css_rules: string;
    media_queries: string;
    layout_metadata: {
      breakpoints: Record<string, number>;
      column_behavior: string;
      scaling_strategy: string;
    };
  };
  
  // Testing results
  viewport_tests?: Array<{
    viewport_name: string;
    width: number;
    height: number;
    device_type: string;
    rendering_score: number;
    issues_found: Array<{
      type: string;
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
    }>;
    recommendations: string[];
  }>;
  
  performance_metrics: {
    css_size_kb: number;
    html_size_kb: number;
    media_queries_count: number;
    responsive_score: number;
    client_compatibility_score: number;
  };
  
  recommendations: string[];
  error?: string;
}

export async function responsiveDesign(params: ResponsiveDesignParams): Promise<ResponsiveDesignResult> {
  const traceId = generateTraceId();
  
  return await tracedAsync({
    name: 'responsive_design',
    metadata: { trace_id: traceId }
  }, async () => {
    const startTime = Date.now();
    console.log(`📱 Responsive Design: ${params.action} operation starting`);

    try {
      // Validate parameters
      const validationResult = validateResponsiveDesignParams(params);
      if (!validationResult.valid) {
        const errorResult: ResponsiveDesignResult = {
          success: false,
          action_performed: params.action,
          performance_metrics: {
            css_size_kb: 0,
            html_size_kb: 0,
            media_queries_count: 0,
            responsive_score: 0,
            client_compatibility_score: 0
          },
          recommendations: ['Fix parameter validation errors'],
          error: validationResult.error
        };

        console.log(`❌ Responsive Design failed: ${validationResult.error}`);
        return errorResult;
      }

      let result: ResponsiveDesignResult;

      switch (params.action) {
        case 'analyze':
          result = await analyzeResponsiveness(params);
          break;
        case 'optimize':
          result = await optimizeResponsiveness(params);
          break;
        case 'generate':
          result = await generateResponsiveTemplate(params);
          break;
        case 'test':
          result = await testResponsiveness(params);
          break;
        default:
          throw new Error(`Unknown action: ${params.action}`);
      }

      const duration = Date.now() - startTime;
      console.log(`✅ Responsive Design ${params.action} completed in ${duration}ms`);
      
      return result;

    } catch (error) {
      const errorResult: ResponsiveDesignResult = {
        success: false,
        action_performed: params.action,
        performance_metrics: {
          css_size_kb: 0,
          html_size_kb: 0,
          media_queries_count: 0,
          responsive_score: 0,
          client_compatibility_score: 0
        },
        recommendations: ['Review error logs and fix issues'],
        error: error instanceof Error ? error.message : 'Unknown error in responsive design operation'
      };

      const duration = Date.now() - startTime;
      console.log(`❌ Responsive Design failed after ${duration}ms:`, error);
      
      return errorResult;
    }
  });
}

/**
 * Валидация параметров для операций с адаптивным дизайном
 */
function validateResponsiveDesignParams(params: ResponsiveDesignParams): { valid: boolean; error?: string } {
  switch (params.action) {
    case 'analyze':
      if (!params.html_content) {
        return { valid: false, error: 'HTML content required for analysis' };
      }
      break;
    case 'optimize':
      if (!params.target_html) {
        return { valid: false, error: 'Target HTML required for optimization' };
      }
      break;
    case 'generate':
      if (!params.layout_type || !params.content_blocks) {
        return { valid: false, error: 'Layout type and content blocks required for generation' };
      }
      break;
    case 'test':
      if (!params.html_content || !params.test_viewports) {
        return { valid: false, error: 'HTML content and test viewports required for testing' };
      }
      break;
  }
  return { valid: true };
}

/**
 * Анализ адаптивности HTML контента
 */
async function analyzeResponsiveness(params: ResponsiveDesignParams): Promise<ResponsiveDesignResult> {
  console.log('🔍 Analyzing responsive design patterns');
  
  const htmlContent = params.html_content!;
  
  // Extract media queries and breakpoints
  const mediaQueryRegex = /@media[^{]+\{[^{}]*\{[^{}]*\}[^{}]*\}/g;
  const mediaQueries = htmlContent.match(mediaQueryRegex) || [];
  
  const breakpoints = extractBreakpoints(mediaQueries);
  const responsiveScore = calculateResponsiveScore(htmlContent, breakpoints);
  const compatibilityIssues = analyzeClientCompatibility(htmlContent, params.email_client_support || []);
  const layoutAnalysis = analyzeLayoutStructure(htmlContent);
  
  const performanceMetrics = calculatePerformanceMetrics(htmlContent, mediaQueries);
  const recommendations = generateAnalysisRecommendations(responsiveScore, compatibilityIssues, layoutAnalysis);
  
  return {
    success: true,
    action_performed: 'analyze',
    analysis_results: {
      current_breakpoints: breakpoints,
      responsive_score: responsiveScore,
      compatibility_issues: compatibilityIssues,
      layout_analysis: layoutAnalysis
    },
    performance_metrics: performanceMetrics,
    recommendations
  };
}

/**
 * Оптимизация адаптивности существующего HTML
 */
async function optimizeResponsiveness(params: ResponsiveDesignParams): Promise<ResponsiveDesignResult> {
  console.log('⚡ Optimizing responsive design');
  
  const targetHtml = params.target_html!;
  const optimizationLevel = params.optimization_level || 'standard';
  const preserveLayout = params.preserve_layout !== false;
  
  let optimizedHtml = targetHtml;
  const optimizationChanges: ResponsiveDesignResult['optimization_changes'] = [];
  
  // Apply responsive optimizations based on level
  switch (optimizationLevel) {
    case 'basic':
      optimizedHtml = await applyBasicOptimizations(optimizedHtml, optimizationChanges);
      break;
    case 'standard':
      optimizedHtml = await applyStandardOptimizations(optimizedHtml, optimizationChanges, preserveLayout);
      break;
    case 'aggressive':
      optimizedHtml = await applyAggressiveOptimizations(optimizedHtml, optimizationChanges, preserveLayout);
      break;
  }
  
  const performanceMetrics = calculatePerformanceMetrics(optimizedHtml, []);
  const recommendations = generateOptimizationRecommendations(optimizationChanges, performanceMetrics);
  
  return {
    success: true,
    action_performed: 'optimize',
    optimized_html: optimizedHtml,
    optimization_changes: optimizationChanges,
    performance_metrics: performanceMetrics,
    recommendations
  };
}

/**
 * Генерация адаптивного шаблона с нуля
 */
async function generateResponsiveTemplate(params: ResponsiveDesignParams): Promise<ResponsiveDesignResult> {
  console.log('🏗️ Generating responsive template');
  
  const layoutType = params.layout_type!;
  const targetDevices = params.target_devices || ['mobile', 'tablet', 'desktop'];
  const contentBlocks = params.content_blocks!;
  const cssApproach = params.css_approach || 'hybrid';
  
  // Generate base HTML structure
  const generatedTemplate = await createResponsiveTemplate(
    layoutType,
    targetDevices,
    contentBlocks,
    cssApproach
  );
  
  const performanceMetrics = calculatePerformanceMetrics(generatedTemplate.html_content, []);
  const recommendations = generateTemplateRecommendations(layoutType, targetDevices, performanceMetrics);
  
  return {
    success: true,
    action_performed: 'generate',
    generated_template: generatedTemplate,
    performance_metrics: performanceMetrics,
    recommendations
  };
}

/**
 * Тестирование адаптивности на различных viewport'ах
 */
async function testResponsiveness(params: ResponsiveDesignParams): Promise<ResponsiveDesignResult> {
  console.log('🧪 Testing responsive behavior across viewports');
  
  const htmlContent = params.html_content!;
  const testViewports = params.test_viewports!;
  
  const viewportTests: ResponsiveDesignResult['viewport_tests'] = [];
  
  for (const viewport of testViewports) {
    console.log(`📱 Testing viewport: ${viewport.name} (${viewport.width}x${viewport.height})`);
    
    const testResult = await runViewportTest(htmlContent, viewport);
    viewportTests.push(testResult);
  }
  
  const averageScore = viewportTests.reduce((sum, test) => sum + test.rendering_score, 0) / viewportTests.length;
  const performanceMetrics = {
    ...calculatePerformanceMetrics(htmlContent, []),
    responsive_score: Math.round(averageScore)
  };
  
  const recommendations = generateTestingRecommendations(viewportTests, performanceMetrics);
  
  return {
    success: true,
    action_performed: 'test',
    viewport_tests: viewportTests,
    performance_metrics: performanceMetrics,
    recommendations
  };
}

// Helper functions

function extractBreakpoints(mediaQueries: string[]): Array<{ width: number; type: string; rules_count: number }> {
  const breakpoints: Array<{ width: number; type: string; rules_count: number }> = [];
  
  mediaQueries.forEach(query => {
    const widthMatch = query.match(/max-width:\s*(\d+)px|min-width:\s*(\d+)px/);
    if (widthMatch) {
      const width = parseInt(widthMatch[1] || widthMatch[2]);
      const type = widthMatch[1] ? 'max-width' : 'min-width';
      const rulesCount = (query.match(/\{[^{}]*\}/g) || []).length;
      
      breakpoints.push({ width, type, rules_count: rulesCount });
    }
  });
  
  return breakpoints.sort((a, b) => a.width - b.width);
}

function calculateResponsiveScore(html: string, breakpoints: any[]): number {
  let score = 0;
  
  // Check for viewport meta tag
  if (html.includes('viewport')) score += 20;
  
  // Check for media queries
  if (breakpoints.length > 0) score += 30;
  
  // Check for fluid layouts
  if (html.includes('width:') && html.includes('%')) score += 20;
  
  // Check for responsive images
  if (html.includes('max-width') && html.includes('img')) score += 15;
  
  // Check for table-based layout (email-specific)
  if (html.includes('<table')) score += 15;
  
  return Math.min(100, score);
}

function analyzeClientCompatibility(html: string, supportedClients: string[]): any[] {
  const issues: any[] = [];
  
  // Check for Outlook compatibility
  if (supportedClients.includes('outlook')) {
    if (html.includes('flexbox') || html.includes('display: flex')) {
      issues.push({
        client: 'outlook',
        issue: 'Flexbox not supported in Outlook',
        severity: 'high' as const,
        suggestion: 'Use table-based layout instead'
      });
    }
  }
  
  // Check for Gmail compatibility
  if (supportedClients.includes('gmail')) {
    if (html.includes('<style>') && html.length > 100000) {
      issues.push({
        client: 'gmail',
        issue: 'Email size may exceed Gmail limits',
        severity: 'medium' as const,
        suggestion: 'Reduce email size or use external CSS'
      });
    }
  }
  
  return issues;
}

function analyzeLayoutStructure(html: string): any {
  return {
    is_mobile_friendly: html.includes('viewport') && html.includes('@media'),
    uses_fluid_layouts: html.includes('width:') && html.includes('%'),
    has_proper_scaling: html.includes('max-width') || html.includes('min-width'),
    image_optimization: html.includes('max-width') && html.includes('img')
  };
}

function calculatePerformanceMetrics(html: string, mediaQueries: string[]): any {
  const htmlSizeKb = Math.round((html.length / 1024) * 100) / 100;
  const cssSize = (html.match(/<style[^>]*>[\s\S]*?<\/style>/g) || []).join('').length;
  const cssSizeKb = Math.round((cssSize / 1024) * 100) / 100;
  
  return {
    css_size_kb: cssSizeKb,
    html_size_kb: htmlSizeKb,
    media_queries_count: mediaQueries.length,
    responsive_score: calculateResponsiveScore(html, []),
    client_compatibility_score: 85 // Simplified calculation
  };
}

function generateAnalysisRecommendations(score: number, issues: any[], layout: any): string[] {
  const recommendations: string[] = [];
  
  if (score < 50) {
    recommendations.push('Implement basic responsive design patterns');
  }
  
  if (!layout.is_mobile_friendly) {
    recommendations.push('Add viewport meta tag and mobile-specific styles');
  }
  
  if (issues.length > 0) {
    recommendations.push(`Address ${issues.length} compatibility issues`);
  }
  
  if (!layout.uses_fluid_layouts) {
    recommendations.push('Consider using fluid layouts for better adaptability');
  }
  
  return recommendations;
}

async function applyBasicOptimizations(html: string, changes: any[]): Promise<string> {
  let optimizedHtml = html;
  
  // Add viewport meta tag if missing
  if (!html.includes('viewport')) {
    const viewportTag = '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
    optimizedHtml = optimizedHtml.replace('<head>', `<head>\n${viewportTag}`);
    
    changes.push({
      type: 'html_structure',
      description: 'Added viewport meta tag',
      before: '<head>',
      after: `<head>\n${viewportTag}`,
      impact: 'medium'
    });
  }
  
  return optimizedHtml;
}

async function applyStandardOptimizations(html: string, changes: any[], preserveLayout: boolean): Promise<string> {
  let optimizedHtml = await applyBasicOptimizations(html, changes);
  
  // Add basic media queries for mobile
  if (!html.includes('@media')) {
    const mobileStyles = `
    <style>
      @media only screen and (max-width: 600px) {
        .container { width: 100% !important; }
        .column { width: 100% !important; display: block !important; }
        .mobile-padding { padding: 10px !important; }
      }
    </style>`;
    
    optimizedHtml = optimizedHtml.replace('</head>', `${mobileStyles}\n</head>`);
    
    changes.push({
      type: 'media_query',
      description: 'Added basic mobile media queries',
      before: 'No media queries',
      after: 'Mobile-responsive media queries added',
      impact: 'high'
    });
  }
  
  return optimizedHtml;
}

async function applyAggressiveOptimizations(html: string, changes: any[], preserveLayout: boolean): Promise<string> {
  let optimizedHtml = await applyStandardOptimizations(html, changes, preserveLayout);
  
  // Add comprehensive responsive styles
  const advancedStyles = `
  <style>
    @media only screen and (max-width: 480px) {
      .mobile-hide { display: none !important; }
      .mobile-center { text-align: center !important; }
      .mobile-full-width { width: 100% !important; }
    }
    @media only screen and (min-width: 481px) and (max-width: 768px) {
      .tablet-column { width: 50% !important; }
    }
  </style>`;
  
  optimizedHtml = optimizedHtml.replace('</head>', `${advancedStyles}\n</head>`);
  
  changes.push({
    type: 'media_query',
    description: 'Added comprehensive responsive styles',
    before: 'Basic responsive styles',
    after: 'Advanced multi-breakpoint styles',
    impact: 'high'
  });
  
  return optimizedHtml;
}

function generateOptimizationRecommendations(changes: any[], metrics: any): string[] {
  const recommendations: string[] = [];
  
  if (changes.length > 0) {
    recommendations.push(`Applied ${changes.length} responsive optimizations`);
  }
  
  if (metrics.css_size_kb > 50) {
    recommendations.push('Consider optimizing CSS for better performance');
  }
  
  recommendations.push('Test optimized template across target email clients');
  
  return recommendations;
}

async function createResponsiveTemplate(
  layoutType: string,
  targetDevices: string[],
  contentBlocks: any[],
  cssApproach: string
): Promise<any> {
  
  const breakpoints = {
    mobile: 480,
    tablet: 768,
    desktop: 1200
  };
  
  const htmlStructure = generateHtmlStructure(layoutType, contentBlocks);
  const cssRules = generateCssRules(layoutType, targetDevices, cssApproach);
  const mediaQueries = generateMediaQueries(targetDevices, breakpoints);
  
  return {
    html_content: htmlStructure,
    css_rules: cssRules,
    media_queries: mediaQueries,
    layout_metadata: {
      breakpoints,
      column_behavior: layoutType,
      scaling_strategy: cssApproach
    }
  };
}

function generateHtmlStructure(layoutType: string, contentBlocks: any[]): string {
  // Simplified HTML generation
  const blocks = contentBlocks.map(block => 
    `<div class="content-block ${block.type}">${block.content}</div>`
  ).join('\n');
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Responsive Email Template</title>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <table class="container" width="600" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td>
              ${blocks}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function generateCssRules(layoutType: string, targetDevices: string[], cssApproach: string): string {
  return `
.container { max-width: 600px; margin: 0 auto; }
.content-block { padding: 20px; }
.header { background-color: #f8f9fa; }
.footer { background-color: #e9ecef; text-align: center; }
`;
}

function generateMediaQueries(targetDevices: string[], breakpoints: any): string {
  let mediaQueries = '';
  
  if (targetDevices.includes('mobile')) {
    mediaQueries += `
@media only screen and (max-width: ${breakpoints.mobile}px) {
  .container { width: 100% !important; }
  .content-block { padding: 10px !important; }
  .mobile-hide { display: none !important; }
}`;
  }
  
  if (targetDevices.includes('tablet')) {
    mediaQueries += `
@media only screen and (min-width: ${breakpoints.mobile + 1}px) and (max-width: ${breakpoints.tablet}px) {
  .container { width: 90% !important; }
  .tablet-column { width: 50% !important; }
}`;
  }
  
  return mediaQueries;
}

function generateTemplateRecommendations(layoutType: string, targetDevices: string[], metrics: any): string[] {
  return [
    `Generated ${layoutType} layout for ${targetDevices.join(', ')} devices`,
    'Test template across target email clients',
    'Validate responsive behavior at different screen sizes',
    'Consider accessibility requirements for responsive design'
  ];
}

async function runViewportTest(html: string, viewport: any): Promise<any> {
  // Simulate viewport testing
  const issues: any[] = [];
  let score = 100;
  
  // Check for mobile-specific issues
  if (viewport.device_type === 'mobile' && viewport.width < 480) {
    if (!html.includes('@media')) {
      issues.push({
        type: 'responsive',
        description: 'No mobile-specific styles detected',
        severity: 'high'
      });
      score -= 30;
    }
  }
  
  // Check for tablet-specific issues
  if (viewport.device_type === 'tablet') {
    if (html.includes('width="600"') && !html.includes('max-width')) {
      issues.push({
        type: 'layout',
        description: 'Fixed width may not work well on tablets',
        severity: 'medium'
      });
      score -= 15;
    }
  }
  
  const recommendations: string[] = [];
  if (issues.length > 0) {
    recommendations.push(`Address ${issues.length} issues for better ${viewport.device_type} experience`);
  }
  
  return {
    viewport_name: viewport.name,
    width: viewport.width,
    height: viewport.height,
    device_type: viewport.device_type,
    rendering_score: Math.max(0, score),
    issues_found: issues,
    recommendations
  };
}

function generateTestingRecommendations(tests: any[], metrics: any): string[] {
  const recommendations: string[] = [];
  
  const failedTests = tests.filter(test => test.rendering_score < 70);
  if (failedTests.length > 0) {
    recommendations.push(`${failedTests.length} viewport tests failed - review responsive design`);
  }
  
  const mobileTests = tests.filter(test => test.device_type === 'mobile');
  const avgMobileScore = mobileTests.reduce((sum, test) => sum + test.rendering_score, 0) / mobileTests.length;
  if (avgMobileScore < 80) {
    recommendations.push('Improve mobile responsiveness for better user experience');
  }
  
  if (metrics.responsive_score > 80) {
    recommendations.push('Responsive design performs well across tested viewports');
  }
  
  return recommendations;
} 