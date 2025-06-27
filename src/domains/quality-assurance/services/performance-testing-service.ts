import * as cheerio from 'cheerio';
import { minify } from 'html-minifier-terser';

export interface PerformanceResult {
  renderTime: number; // estimated ms
  domComplexity: number;
  cssComplexity: number;
  imageOptimization: number; // 0-1
  cacheability: number; // 0-1
  mobileOptimization: number; // 0-1
  fileSize: FileSizeAnalysis;
  loadingMetrics: LoadingMetrics;
  optimizations: PerformanceOptimization[];
  score: number; // 0-1
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface FileSizeAnalysis {
  totalSize: number;
  htmlSize: number;
  cssSize: number;
  imageEstimatedSize: number;
  withinEmailLimits: boolean;
  compressionPotential: number; // 0-1
  breakdown: SizeBreakdown;
}

export interface SizeBreakdown {
  html: { size: number; percentage: number };
  css: { size: number; percentage: number };
  images: { size: number; percentage: number };
  other: { size: number; percentage: number };
}

export interface LoadingMetrics {
  estimatedLoadTime: number; // ms
  criticalRenderingPath: number; // ms
  domReadyTime: number; // ms
  imageLoadTime: number; // ms
  totalElements: number;
  criticalElements: number;
}

export interface PerformanceOptimization {
  category: 'html' | 'css' | 'images' | 'structure' | 'caching';
  priority: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  impact: string;
  implementation: string;
  estimatedSavings: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface DOMComplexityMetrics {
  totalElements: number;
  nestingDepth: number;
  tableElements: number;
  imageElements: number;
  linkElements: number;
  complexityScore: number; // 0-1
  recommendations: string[];
}

export interface CSSComplexityMetrics {
  inlineStyles: number;
  embeddedStyles: number;
  totalCSSProperties: number;
  emailCompatibleProperties: number;
  unsupportedProperties: UnsupportedProperty[];
  complexityScore: number; // 0-1
  optimizationPotential: number; // 0-1
}

export interface UnsupportedProperty {
  property: string;
  value: string;
  element: string;
  suggestion: string;
}

export interface ImageOptimizationMetrics {
  totalImages: number;
  imagesWithDimensions: number;
  estimatedTotalSize: number;
  optimizationOpportunities: ImageOptimization[];
  score: number; // 0-1
}

export interface ImageOptimization {
  src: string;
  currentFormat: string;
  suggestedFormat: string;
  estimatedSavings: string;
  hasAltText: boolean;
  hasDimensions: boolean;
}

export interface MobileOptimizationMetrics {
  hasViewportMeta: boolean;
  usesResponsiveImages: boolean;
  hasMediaQueries: boolean;
  touchFriendlyElements: boolean;
  readableTextSize: boolean;
  score: number; // 0-1
  issues: MobileIssue[];
}

export interface MobileIssue {
  type: 'viewport' | 'text-size' | 'touch-targets' | 'media-queries' | 'images';
  description: string;
  suggestion: string;
  impact: 'high' | 'medium' | 'low';
}

/**
 * Enhanced Performance Testing Service
 * 
 * Provides comprehensive performance analysis for email templates:
 * - File size analysis with email client limits (Gmail 102KB)
 * - DOM complexity assessment for rendering performance
 * - CSS optimization analysis with email compatibility
 * - Image optimization assessment and recommendations
 * - Mobile responsiveness evaluation
 * - Loading time estimation and optimization suggestions
 * - Cacheability analysis for improved delivery
 */
export class PerformanceTestingService {
  private emailSizeLimit = 102 * 1024; // Gmail clips at 102KB
  private emailFriendlyCSS: Set<string>;
  private unsupportedCSS: Set<string>;

  constructor() {
    // Email-friendly CSS properties
    this.emailFriendlyCSS = new Set([
      'background', 'background-color', 'background-image', 'background-repeat',
      'background-position', 'border', 'border-color', 'border-style', 'border-width',
      'border-top', 'border-right', 'border-bottom', 'border-left',
      'color', 'font', 'font-family', 'font-size', 'font-style', 'font-weight',
      'height', 'width', 'line-height', 'margin', 'margin-top', 'margin-right',
      'margin-bottom', 'margin-left', 'padding', 'padding-top', 'padding-right',
      'padding-bottom', 'padding-left', 'text-align', 'text-decoration',
      'vertical-align', 'display', 'float', 'clear'
    ]);

    // CSS properties not supported in email clients
    this.unsupportedCSS = new Set([
      'flexbox', 'grid', 'position', 'z-index', 'transform', 'transition',
      'animation', 'box-shadow', 'text-shadow', 'border-radius', 'opacity',
      'max-width', 'min-width', 'max-height', 'min-height', 'calc'
    ]);
  }

  /**
   * Run comprehensive performance analysis
   */
  async analyzePerformance(html: string): Promise<PerformanceResult> {
    try {
      // Step 1: File size analysis
      const fileSize = this.analyzeFileSize(html);
      
      // Step 2: DOM complexity analysis
      const domComplexity = this.analyzeDOMComplexity(html);
      
      // Step 3: CSS complexity analysis
      const cssComplexity = this.analyzeCSSComplexity(html);
      
      // Step 4: Image optimization analysis
      const imageOptimization = this.analyzeImageOptimization(html);
      
      // Step 5: Mobile optimization analysis
      const mobileOptimization = this.analyzeMobileOptimization(html);
      
      // Step 6: Loading metrics estimation
      const loadingMetrics = this.estimateLoadingMetrics(html, fileSize);
      
      // Step 7: Cacheability analysis
      const cacheability = this.analyzeCacheability(html);
      
      // Step 8: Generate optimization suggestions
      const optimizations = this.generateOptimizations(
        fileSize, domComplexity, cssComplexity, imageOptimization, mobileOptimization
      );
      
      // Step 9: Calculate overall performance score
      const score = this.calculatePerformanceScore(
        fileSize, domComplexity, cssComplexity, imageOptimization, mobileOptimization, cacheability
      );
      
      // Ensure score is valid
      const validScore = isNaN(score) || !isFinite(score) ? 0 : score;
      
      // Step 10: Determine performance grade
      const grade = this.determinePerformanceGrade(validScore);

      return {
        renderTime: this.estimateRenderTime(html, domComplexity),
        domComplexity: domComplexity.complexityScore,
        cssComplexity: cssComplexity.complexityScore,
        imageOptimization: imageOptimization.score,
        cacheability,
        mobileOptimization: mobileOptimization.score,
        fileSize,
        loadingMetrics,
        optimizations,
        score: validScore,
        grade
      };
    } catch (error) {
      console.error('Performance analysis failed:', error);
      return {
        renderTime: 0,
        domComplexity: 0,
        cssComplexity: 0,
        imageOptimization: 0,
        cacheability: 0,
        mobileOptimization: 0,
        fileSize: {
          totalSize: 0,
          htmlSize: 0,
          cssSize: 0,
          imageEstimatedSize: 0,
          withinEmailLimits: false,
          compressionPotential: 0,
          breakdown: {
            html: { size: 0, percentage: 0 },
            css: { size: 0, percentage: 0 },
            images: { size: 0, percentage: 0 },
            other: { size: 0, percentage: 0 }
          }
        },
        loadingMetrics: {
          estimatedLoadTime: 0,
          criticalRenderingPath: 0,
          domReadyTime: 0,
          imageLoadTime: 0,
          totalElements: 0,
          criticalElements: 0
        },
        optimizations: [],
        score: 0,
        grade: 'F'
      };
    }
  }

  /**
   * Analyze file size and breakdown
   */
  private analyzeFileSize(html: string): FileSizeAnalysis {
    // Handle empty or invalid HTML
    if (!html || html.trim().length === 0) {
      return {
        totalSize: 0,
        htmlSize: 0,
        cssSize: 0,
        imageEstimatedSize: 0,
        withinEmailLimits: true,
        compressionPotential: 0,
        breakdown: {
          html: { size: 0, percentage: 0 },
          css: { size: 0, percentage: 0 },
          images: { size: 0, percentage: 0 },
          other: { size: 0, percentage: 0 }
        }
      };
    }

    const $ = cheerio.load(html);
    
    // Calculate total HTML size
    const totalSize = Buffer.byteLength(html, 'utf8');
    
    // Extract and calculate CSS size
    let cssSize = 0;
    $('[style]').each((_, element) => {
      cssSize += Buffer.byteLength($(element).attr('style') || '', 'utf8');
    });
    $('style').each((_, element) => {
      cssSize += Buffer.byteLength($(element).html() || '', 'utf8');
    });
    
    // Estimate image sizes (rough estimation based on typical email image sizes)
    let imageEstimatedSize = 0;
    $('img').each((_, img) => {
      const $img = $(img);
      const width = parseInt($img.attr('width') || '100');
      const height = parseInt($img.attr('height') || '100');
      
      // Rough estimation: 1KB per 1000 pixels for optimized email images
      imageEstimatedSize += Math.max(1024, (width * height) / 10);
    });
    
    const htmlSize = totalSize - cssSize;
    const otherSize = Math.max(0, totalSize - htmlSize - cssSize);
    
    // Calculate breakdown percentages
    const totalWithImages = totalSize + imageEstimatedSize;
    const breakdown: SizeBreakdown = {
      html: {
        size: htmlSize,
        percentage: totalWithImages > 0 ? Math.round((htmlSize / totalWithImages) * 100) : 0
      },
      css: {
        size: cssSize,
        percentage: totalWithImages > 0 ? Math.round((cssSize / totalWithImages) * 100) : 0
      },
      images: {
        size: imageEstimatedSize,
        percentage: totalWithImages > 0 ? Math.round((imageEstimatedSize / totalWithImages) * 100) : 0
      },
      other: {
        size: otherSize,
        percentage: totalWithImages > 0 ? Math.round((otherSize / totalWithImages) * 100) : 0
      }
    };
    
    // Calculate compression potential
    const compressionPotential = this.calculateCompressionPotential(html);
    
    return {
      totalSize,
      htmlSize,
      cssSize,
      imageEstimatedSize,
      withinEmailLimits: (totalSize + imageEstimatedSize) <= this.emailSizeLimit,
      compressionPotential,
      breakdown
    };
  }

  /**
   * Analyze DOM complexity
   */
  private analyzeDOMComplexity(html: string): DOMComplexityMetrics {
    // Handle empty or invalid HTML
    if (!html || html.trim().length === 0) {
      return {
        totalElements: 0,
        nestingDepth: 0,
        tableElements: 0,
        imageElements: 0,
        linkElements: 0,
        complexityScore: 0,
        recommendations: []
      };
    }

    const $ = cheerio.load(html);
    
    const totalElements = $('*').length;
    const tableElements = $('table, tr, td, th').length;
    const imageElements = $('img').length;
    const linkElements = $('a').length;
    
    // Calculate nesting depth
    let maxDepth = 0;
    $('*').each((_, element) => {
      const depth = $(element).parents().length;
      maxDepth = Math.max(maxDepth, depth);
    });
    
    // Calculate complexity score (0-1, lower is better)
    let complexityScore = 0;
    
    // Factor in total elements (penalty for too many elements)
    if (totalElements > 500) complexityScore += 0.3;
    else if (totalElements > 300) complexityScore += 0.2;
    else if (totalElements > 150) complexityScore += 0.1;
    
    // Factor in nesting depth (penalty for deep nesting)
    if (maxDepth > 15) complexityScore += 0.3;
    else if (maxDepth > 10) complexityScore += 0.2;
    else if (maxDepth > 7) complexityScore += 0.1;
    
    // Factor in table complexity (tables are good for email, but too many can be complex)
    const tableRatio = tableElements / totalElements;
    if (tableRatio < 0.3) complexityScore += 0.1; // Too few tables for email
    else if (tableRatio > 0.8) complexityScore += 0.2; // Too many tables
    
    complexityScore = Math.min(1, complexityScore);
    
    // Generate recommendations
    const recommendations: string[] = [];
    if (totalElements > 300) {
      recommendations.push('Consider simplifying the template structure to reduce DOM complexity');
    }
    if (maxDepth > 10) {
      recommendations.push('Reduce nesting depth to improve rendering performance');
    }
    if (tableRatio < 0.3) {
      recommendations.push('Consider using more table-based layouts for better email client compatibility');
    }
    
    return {
      totalElements,
      nestingDepth: maxDepth,
      tableElements,
      imageElements,
      linkElements,
      complexityScore,
      recommendations
    };
  }

  /**
   * Analyze CSS complexity and email compatibility
   */
  private analyzeCSSComplexity(html: string): CSSComplexityMetrics {
    // Handle empty or invalid HTML
    if (!html || html.trim().length === 0) {
      return {
        inlineStyles: 0,
        embeddedStyles: 0,
        totalCSSProperties: 0,
        emailCompatibleProperties: 0,
        unsupportedProperties: [],
        complexityScore: 0,
        optimizationPotential: 0
      };
    }

    const $ = cheerio.load(html);
    
    let inlineStyles = 0;
    let embeddedStyles = 0;
    let totalCSSProperties = 0;
    let emailCompatibleProperties = 0;
    const unsupportedProperties: UnsupportedProperty[] = [];
    
    // Analyze inline styles
    $('[style]').each((_, element) => {
      inlineStyles++;
      const style = $(element).attr('style') || '';
      const properties = style.split(';').filter(prop => prop.trim());
      
      properties.forEach(property => {
        const [prop, value] = property.split(':').map(p => p.trim());
        totalCSSProperties++;
        
        if (this.emailFriendlyCSS.has(prop)) {
          emailCompatibleProperties++;
        } else if (this.unsupportedCSS.has(prop)) {
          unsupportedProperties.push({
            property: prop,
            value: value || '',
            element: (element as any).tagName?.toLowerCase() || 'unknown',
            suggestion: this.getCSSAlternative(prop)
          });
        } else {
          emailCompatibleProperties++; // Assume neutral properties are okay
        }
      });
    });
    
    // Analyze embedded styles
    $('style').each((_, styleElement) => {
      embeddedStyles++;
      const styleContent = $(styleElement).html() || '';
      
      // Count CSS rules (simplified)
      const rules = styleContent.split('{').length - 1;
      totalCSSProperties += rules * 3; // Rough estimate of properties per rule
      emailCompatibleProperties += rules * 2; // Assume most are compatible
    });
    
    // Calculate complexity score (0-1, lower is better)
    let complexityScore = 0;
    
    // Penalty for external/embedded styles (email should use inline)
    if (embeddedStyles > 0) complexityScore += 0.3;
    
    // Penalty for unsupported properties
    const unsupportedRatio = unsupportedProperties.length / totalCSSProperties;
    complexityScore += unsupportedRatio * 0.4;
    
    // Penalty for too many CSS properties
    if (totalCSSProperties > 1000) complexityScore += 0.2;
    else if (totalCSSProperties > 500) complexityScore += 0.1;
    
    complexityScore = Math.min(1, complexityScore);
    
    // Calculate optimization potential
    const optimizationPotential = Math.min(1, 
      (embeddedStyles * 0.3) + (unsupportedRatio * 0.5) + (totalCSSProperties > 500 ? 0.2 : 0)
    );
    
    return {
      inlineStyles,
      embeddedStyles,
      totalCSSProperties,
      emailCompatibleProperties,
      unsupportedProperties,
      complexityScore,
      optimizationPotential
    };
  }

  /**
   * Analyze image optimization opportunities
   */
  private analyzeImageOptimization(html: string): ImageOptimizationMetrics {
    // Handle empty or invalid HTML
    if (!html || html.trim().length === 0) {
      return {
        totalImages: 0,
        imagesWithDimensions: 0,
        estimatedTotalSize: 0,
        optimizationOpportunities: [],
        score: 1
      };
    }

    const $ = cheerio.load(html);
    const images = $('img');
    
    let imagesWithDimensions = 0;
    let estimatedTotalSize = 0;
    const optimizationOpportunities: ImageOptimization[] = [];
    
    images.each((_, img) => {
      const $img = $(img);
      const src = $img.attr('src') || '';
      const width = $img.attr('width');
      const height = $img.attr('height');
      const alt = $img.attr('alt');
      
      const hasDimensions = width !== undefined && height !== undefined;
      if (hasDimensions) imagesWithDimensions++;
      
      // Estimate image size
      const estimatedSize = this.estimateImageSize(width, height);
      estimatedTotalSize += estimatedSize;
      
      // Determine current and suggested format
      const currentFormat = this.getImageFormat(src);
      const suggestedFormat = this.getSuggestedImageFormat(src, estimatedSize);
      
      if (currentFormat !== suggestedFormat || !hasDimensions || !alt) {
        optimizationOpportunities.push({
          src: src.substring(0, 50) + (src.length > 50 ? '...' : ''),
          currentFormat,
          suggestedFormat,
          estimatedSavings: this.calculateImageSavings(currentFormat, suggestedFormat, estimatedSize),
          hasAltText: alt !== undefined,
          hasDimensions
        });
      }
    });
    
    // Calculate score (0-1, higher is better)
    let score = 1.0;
    
    if (images.length > 0) {
      // Penalty for missing dimensions
      const dimensionRatio = imagesWithDimensions / images.length;
      score *= dimensionRatio;
      
      // Penalty for optimization opportunities
      const optimizationRatio = optimizationOpportunities.length / images.length;
      score *= (1 - optimizationRatio * 0.5);
      
      // Penalty for large estimated size
      if (estimatedTotalSize > 500 * 1024) score *= 0.5; // 500KB threshold
      else if (estimatedTotalSize > 200 * 1024) score *= 0.8; // 200KB threshold
    }
    
    return {
      totalImages: images.length,
      imagesWithDimensions,
      estimatedTotalSize,
      optimizationOpportunities,
      score: Math.max(0, score)
    };
  }

  /**
   * Analyze mobile optimization
   */
  private analyzeMobileOptimization(html: string): MobileOptimizationMetrics {
    // Handle empty or invalid HTML
    if (!html || html.trim().length === 0) {
      return {
        hasViewportMeta: false,
        usesResponsiveImages: true,
        hasMediaQueries: false,
        touchFriendlyElements: true,
        readableTextSize: true,
        score: 0.6, // Neutral score for empty HTML
        issues: []
      };
    }

    const $ = cheerio.load(html);
    const issues: MobileIssue[] = [];
    
    // Check for viewport meta tag
    const hasViewportMeta = $('meta[name="viewport"]').length > 0;
    if (!hasViewportMeta) {
      issues.push({
        type: 'viewport',
        description: 'Missing viewport meta tag',
        suggestion: 'Add <meta name="viewport" content="width=device-width, initial-scale=1.0">',
        impact: 'high'
      });
    }
    
    // Check for responsive images
    const images = $('img');
    const responsiveImages = $('img[style*="max-width"], img[style*="width: 100%"]');
    const usesResponsiveImages = images.length === 0 || responsiveImages.length / images.length >= 0.8;
    
    if (!usesResponsiveImages && images.length > 0) {
      issues.push({
        type: 'images',
        description: 'Images may not be responsive',
        suggestion: 'Add max-width: 100% and height: auto to image styles',
        impact: 'medium'
      });
    }
    
    // Check for media queries
    const styleContent = $('style').html() || '';
    const inlineStyles = $('[style]').map((_, el) => $(el).attr('style')).get().join(' ');
    const hasMediaQueries = styleContent.includes('@media') || inlineStyles.includes('@media');
    
    if (!hasMediaQueries) {
      issues.push({
        type: 'media-queries',
        description: 'No responsive media queries detected',
        suggestion: 'Add @media queries for mobile optimization',
        impact: 'medium'
      });
    }
    
    // Check for touch-friendly elements
    const links = $('a');
    let touchFriendlyElements = true;
    
    links.each((_, link) => {
      const $link = $(link);
      const style = $link.attr('style') || '';
      
      // Check for minimum touch target size (simplified check)
      const hasMinSize = style.includes('padding') || style.includes('height') || style.includes('width');
      if (!hasMinSize) {
        touchFriendlyElements = false;
      }
    });
    
    if (!touchFriendlyElements && links.length > 0) {
      issues.push({
        type: 'touch-targets',
        description: 'Touch targets may be too small',
        suggestion: 'Ensure interactive elements have minimum 44px touch targets',
        impact: 'medium'
      });
    }
    
    // Check for readable text size
    const textElements = $('p, span, div, td, th').filter((_, el) => $(el).text().trim().length > 0);
    let readableTextSize = true;
    
    textElements.each((_, element) => {
      const $el = $(element);
      const style = $el.attr('style') || '';
      const fontSizeMatch = style.match(/font-size:\s*(\d+)px/);
      
      if (fontSizeMatch) {
        const fontSize = parseInt(fontSizeMatch[1]);
        if (fontSize < 14) {
          readableTextSize = false;
        }
      }
    });
    
    if (!readableTextSize) {
      issues.push({
        type: 'text-size',
        description: 'Text may be too small for mobile devices',
        suggestion: 'Use minimum 14px font size for body text',
        impact: 'medium'
      });
    }
    
    // Calculate score
    const checks = [hasViewportMeta, usesResponsiveImages, hasMediaQueries, touchFriendlyElements, readableTextSize];
    const score = checks.filter(Boolean).length / checks.length;
    
    return {
      hasViewportMeta,
      usesResponsiveImages,
      hasMediaQueries,
      touchFriendlyElements,
      readableTextSize,
      score,
      issues
    };
  }

  /**
   * Estimate loading metrics
   */
  private estimateLoadingMetrics(html: string, fileSize: FileSizeAnalysis): LoadingMetrics {
    // Handle empty or invalid HTML
    if (!html || html.trim().length === 0 || fileSize.totalSize === 0) {
      return {
        estimatedLoadTime: 0,
        criticalRenderingPath: 0,
        domReadyTime: 0,
        imageLoadTime: 0,
        totalElements: 0,
        criticalElements: 0
      };
    }

    const $ = cheerio.load(html);
    
    const totalElements = $('*').length;
    const images = $('img').length;
    const links = $('a').length;
    const tables = $('table').length;
    
    // Critical elements that affect rendering
    const criticalElements = $('table, img, style, [style]').length;
    
    // Estimate loading times (simplified calculations)
    const baseLoadTime = 50; // Base parsing time
    const elementLoadTime = totalElements * 0.1; // 0.1ms per element
    const cssLoadTime = fileSize.cssSize / 1024 * 2; // 2ms per KB of CSS
    const imageLoadTime = images * 100; // 100ms per image (placeholder)
    
    const estimatedLoadTime = baseLoadTime + elementLoadTime + cssLoadTime + imageLoadTime;
    const criticalRenderingPath = baseLoadTime + cssLoadTime + (criticalElements * 0.5);
    const domReadyTime = baseLoadTime + elementLoadTime;
    
    return {
      estimatedLoadTime: Math.round(estimatedLoadTime),
      criticalRenderingPath: Math.round(criticalRenderingPath),
      domReadyTime: Math.round(domReadyTime),
      imageLoadTime: Math.round(imageLoadTime),
      totalElements,
      criticalElements
    };
  }

  /**
   * Analyze cacheability
   */
  private analyzeCacheability(html: string): number {
    // Handle empty or invalid HTML
    if (!html || html.trim().length === 0) {
      return 1.0; // Perfect cacheability for empty content
    }

    const $ = cheerio.load(html);
    
    let score = 1.0;
    
    // Check for inline styles (good for email caching)
    const inlineStyles = $('[style]').length;
    const totalElements = $('*').length;
    const inlineRatio = totalElements > 0 ? inlineStyles / totalElements : 0;
    
    if (inlineRatio < 0.3) score *= 0.8; // Penalty for low inline style usage
    
    // Check for external resources (bad for email caching)
    const externalCSS = $('link[rel="stylesheet"]').length;
    const externalJS = $('script[src]').length;
    
    if (externalCSS > 0) score *= 0.5; // Heavy penalty for external CSS
    if (externalJS > 0) score *= 0.3; // Heavy penalty for external JS
    
    // Check for embedded styles (okay but not ideal)
    const embeddedStyles = $('style').length;
    if (embeddedStyles > 0) score *= 0.9; // Small penalty for embedded styles
    
    return Math.max(0, score);
  }

  /**
   * Generate performance optimizations
   */
  private generateOptimizations(
    fileSize: FileSizeAnalysis,
    domComplexity: DOMComplexityMetrics,
    cssComplexity: CSSComplexityMetrics,
    imageOptimization: ImageOptimizationMetrics,
    mobileOptimization: MobileOptimizationMetrics
  ): PerformanceOptimization[] {
    const optimizations: PerformanceOptimization[] = [];
    
    // File size optimizations
    if (!fileSize.withinEmailLimits) {
      optimizations.push({
        category: 'html',
        priority: 'critical',
        description: 'Template exceeds email size limits',
        impact: `Reduce size by ${Math.round((fileSize.totalSize + fileSize.imageEstimatedSize - this.emailSizeLimit) / 1024)}KB`,
        implementation: 'Minify HTML, optimize images, reduce inline CSS',
        estimatedSavings: `${Math.round(fileSize.compressionPotential * 100)}% size reduction`,
        difficulty: 'medium'
      });
    }
    
    // DOM complexity optimizations
    if (domComplexity.complexityScore > 0.5) {
      optimizations.push({
        category: 'structure',
        priority: domComplexity.complexityScore > 0.7 ? 'high' : 'medium',
        description: 'Reduce DOM complexity for better performance',
        impact: 'Faster rendering and improved compatibility',
        implementation: domComplexity.recommendations.join('; '),
        estimatedSavings: '20-40% faster rendering',
        difficulty: 'medium'
      });
    }
    
    // CSS optimizations
    if (cssComplexity.optimizationPotential > 0.3) {
      optimizations.push({
        category: 'css',
        priority: cssComplexity.embeddedStyles > 0 ? 'high' : 'medium',
        description: 'Optimize CSS for email compatibility',
        impact: 'Better email client support and faster rendering',
        implementation: 'Inline all CSS, remove unsupported properties',
        estimatedSavings: `${Math.round(cssComplexity.optimizationPotential * 100)}% CSS optimization`,
        difficulty: 'easy'
      });
    }
    
    // Image optimizations
    if (imageOptimization.score < 0.8 && imageOptimization.totalImages > 0) {
      optimizations.push({
        category: 'images',
        priority: imageOptimization.score < 0.5 ? 'high' : 'medium',
        description: 'Optimize images for better performance',
        impact: 'Faster loading and smaller file size',
        implementation: 'Add width/height attributes, optimize formats, compress images',
        estimatedSavings: `${Math.round((1 - imageOptimization.score) * 100)}% image optimization`,
        difficulty: 'easy'
      });
    }
    
    // Mobile optimizations
    if (mobileOptimization.score < 0.8) {
      optimizations.push({
        category: 'structure',
        priority: mobileOptimization.hasViewportMeta ? 'medium' : 'high',
        description: 'Improve mobile responsiveness',
        impact: 'Better mobile user experience',
        implementation: mobileOptimization.issues.map(issue => issue.suggestion).join('; '),
        estimatedSavings: 'Improved mobile compatibility',
        difficulty: 'medium'
      });
    }
    
    // Caching optimizations
    if (cssComplexity.embeddedStyles > 0) {
      optimizations.push({
        category: 'caching',
        priority: 'low',
        description: 'Improve cacheability by inlining styles',
        impact: 'Better email client caching',
        implementation: 'Move embedded CSS to inline styles',
        estimatedSavings: 'Improved caching efficiency',
        difficulty: 'easy'
      });
    }
    
    return optimizations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Calculate overall performance score
   */
  private calculatePerformanceScore(
    fileSize: FileSizeAnalysis,
    domComplexity: DOMComplexityMetrics,
    cssComplexity: CSSComplexityMetrics,
    imageOptimization: ImageOptimizationMetrics,
    mobileOptimization: MobileOptimizationMetrics,
    cacheability: number
  ): number {
    // Handle empty or invalid input
    if (fileSize.totalSize === 0 || isNaN(fileSize.totalSize)) {
      return 0;
    }
    
    let score = 1.0;
    
    // File size score (30% weight)
    const fileSizeScore = fileSize.withinEmailLimits ? 1.0 : 0.5;
    score *= (fileSizeScore * 0.3 + 0.7);
    
    // DOM complexity score (20% weight)
    const domScore = 1 - domComplexity.complexityScore;
    score *= (domScore * 0.2 + 0.8);
    
    // CSS complexity score (20% weight)
    const cssScore = 1 - cssComplexity.complexityScore;
    score *= (cssScore * 0.2 + 0.8);
    
    // Image optimization score (15% weight)
    score *= (imageOptimization.score * 0.15 + 0.85);
    
    // Mobile optimization score (10% weight)
    score *= (mobileOptimization.score * 0.1 + 0.9);
    
    // Cacheability score (5% weight)
    score *= (cacheability * 0.05 + 0.95);
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Determine performance grade
   */
  private determinePerformanceGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 0.9) return 'A';
    if (score >= 0.8) return 'B';
    if (score >= 0.7) return 'C';
    if (score >= 0.6) return 'D';
    return 'F';
  }

  // Helper methods
  private estimateRenderTime(html: string, domComplexity: DOMComplexityMetrics): number {
    const baseTime = 50; // Base rendering time
    const elementTime = domComplexity.totalElements * 0.1;
    const complexityPenalty = domComplexity.complexityScore * 100;
    
    return Math.round(baseTime + elementTime + complexityPenalty);
  }

  private calculateCompressionPotential(html: string): number {
    const originalSize = html.length;
    const whitespaceCount = (html.match(/\s+/g) || []).length;
    const commentCount = (html.match(/<!--[\s\S]*?-->/g) || []).length;
    
    // Estimate compression potential based on whitespace and comments
    const compressionEstimate = (whitespaceCount * 0.5 + commentCount * 20) / originalSize;
    return Math.min(0.5, compressionEstimate); // Cap at 50%
  }

  private estimateImageSize(width?: string, height?: string): number {
    const w = parseInt(width || '100');
    const h = parseInt(height || '100');
    
    // Rough estimation: 1KB per 1000 pixels for optimized email images
    return Math.max(1024, (w * h) / 10);
  }

  private getImageFormat(src: string): string {
    const extension = src.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg': return 'JPEG';
      case 'png': return 'PNG';
      case 'gif': return 'GIF';
      case 'webp': return 'WebP';
      default: return 'Unknown';
    }
  }

  private getSuggestedImageFormat(src: string, estimatedSize: number): string {
    const currentFormat = this.getImageFormat(src);
    
    // For email, PNG is often better for small images, JPEG for photos
    if (estimatedSize < 10000) return 'PNG'; // Small images
    if (src.includes('photo') || src.includes('picture')) return 'JPEG'; // Photos
    return currentFormat; // Keep current if no clear optimization
  }

  private calculateImageSavings(current: string, suggested: string, size: number): string {
    if (current === suggested) return '0%';
    
    const savings = current === 'PNG' && suggested === 'JPEG' ? 0.3 : 0.1;
    return `${Math.round(savings * 100)}%`;
  }

  private getCSSAlternative(property: string): string {
    const alternatives: Record<string, string> = {
      'flexbox': 'Use table layouts instead',
      'grid': 'Use table layouts instead',
      'position': 'Use margin/padding for positioning',
      'transform': 'Use margin/padding for positioning',
      'box-shadow': 'Use border or background-color',
      'border-radius': 'Use images for rounded corners',
      'opacity': 'Use solid colors or images',
      'max-width': 'Use width with media queries',
      'min-width': 'Use width with media queries'
    };
    
    return alternatives[property] || 'Remove or replace with email-compatible property';
  }
} 