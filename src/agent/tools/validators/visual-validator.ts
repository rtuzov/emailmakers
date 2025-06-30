/**
 * T11 Visual Validator - Brand Compliance & Design Quality Assessment
 * 
 * Validates brand compliance, accessibility standards, and email client compatibility
 * Weight: 25% of overall quality score
 */

import { 
  QualityValidationRequest,
  VisualValidationResult,
  ValidationCheck,
  BrandGuidelines,
  AccessibilityConfig,
  EmailCompatibilityConfig
} from './types';

/**
 * Visual Validator Class
 * Handles brand compliance and design quality assessment
 */
export class VisualValidator {
  
  private brandGuidelines: BrandGuidelines;
  private accessibilityConfig: AccessibilityConfig;
  private emailCompatibilityConfig: EmailCompatibilityConfig;
  
  constructor() {
    // Initialize Kupibilet brand guidelines
    this.brandGuidelines = this.getKupibiletBrandGuidelines();
    this.accessibilityConfig = this.getAccessibilityConfig();
    this.emailCompatibilityConfig = this.getEmailCompatibilityConfig();
  }
  
  /**
   * Perform comprehensive visual validation
   */
  async validate(request: QualityValidationRequest): Promise<VisualValidationResult> {
    try {
      console.log('🎨 Visual Validator: Starting brand compliance and design quality assessment');
      
      // Run all visual checks
      const brandCompliance = await this.checkBrandCompliance(request.html_content);
      const accessibility = await this.checkAccessibility(request.html_content);
      const emailCompatibility = await this.checkEmailCompatibility(request.html_content);
      const layoutQuality = await this.checkLayoutQuality(request.html_content);
      
      // Calculate overall visual score
      const checks = {
        brand_compliance: brandCompliance,
        accessibility: accessibility,
        email_compatibility: emailCompatibility,
        layout_quality: layoutQuality
      };
      
      const overallScore = this.calculateVisualScore(checks);
      const passed = overallScore >= 70;
      
      // Collect all issues and recommendations
      const allIssues = this.collectIssues(checks);
      const allRecommendations = this.generateRecommendations(checks);
      
      console.log(`✅ Visual Validator: Score ${overallScore}/100 (${passed ? 'PASSED' : 'FAILED'})`);
      
      return {
        score: overallScore,
        passed: passed,
        checks: checks,
        issues: allIssues,
        recommendations: allRecommendations
      };
      
    } catch (error) {
      console.error('❌ Visual Validator: Validation failed:', error);
      return this.createFailedResult(`Visual validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Check brand compliance against Kupibilet guidelines
   */
  private async checkBrandCompliance(htmlContent: string): Promise<ValidationCheck> {
    try {
      const issues: string[] = [];
      let score = 100;
      
      // Check for required brand colors
      const hasKupibiletColors = this.checkBrandColors(htmlContent);
      if (!hasKupibiletColors.valid) {
        issues.push('Missing Kupibilet brand colors');
        score -= 25;
      }
      
      // Check for proper font usage
      const hasBrandFonts = this.checkBrandFonts(htmlContent);
      if (!hasBrandFonts.valid) {
        issues.push('Non-standard font usage detected');
        score -= 20;
      }
      
      // Check for logo placement (if logo is present)
      const logoPlacement = this.checkLogoPlacement(htmlContent);
      if (!logoPlacement.valid && logoPlacement.hasLogo) {
        issues.push('Improper logo placement or sizing');
        score -= 15;
      }
      
      // Check overall brand consistency
      const brandConsistency = this.checkBrandConsistency(htmlContent);
      if (!brandConsistency.valid) {
        issues.push('Inconsistent brand presentation');
        score -= 20;
      }
      
      const passed = score >= 70 && issues.length === 0;
      
      return {
        passed: passed,
        score: Math.max(0, score),
        message: passed ? 'Brand compliance requirements met' : `Brand compliance issues found: ${issues.join(', ')}`,
        details: {
          issues: issues,
          colors_check: hasKupibiletColors,
          fonts_check: hasBrandFonts,
          logo_check: logoPlacement,
          consistency_check: brandConsistency
        }
      };
      
    } catch (error) {
      return {
        passed: false,
        score: 0,
        message: `Brand compliance check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error }
      };
    }
  }
  
  /**
   * Check WCAG AA accessibility standards
   */
  private async checkAccessibility(htmlContent: string): Promise<ValidationCheck> {
    try {
      const issues: string[] = [];
      let score = 100;
      
      // Check contrast ratios
      const contrastCheck = this.checkContrastRatios(htmlContent);
      if (!contrastCheck.valid) {
        issues.push('Insufficient color contrast for accessibility');
        score -= 30;
      }
      
      // Check for alt text on images
      const altTextCheck = this.checkImageAltText(htmlContent);
      if (!altTextCheck.valid) {
        issues.push('Missing alt text on images');
        score -= 25;
      }
      
      // Check semantic HTML structure
      const semanticCheck = this.checkSemanticStructure(htmlContent);
      if (!semanticCheck.valid) {
        issues.push('Poor semantic HTML structure');
        score -= 20;
      }
      
      // Check text readability
      const readabilityCheck = this.checkTextReadability(htmlContent);
      if (!readabilityCheck.valid) {
        issues.push('Text readability issues');
        score -= 15;
      }
      
      const passed = score >= 70;
      
      return {
        passed: passed,
        score: Math.max(0, score),
        message: passed ? 'Accessibility standards met (WCAG AA)' : `Accessibility issues found: ${issues.join(', ')}`,
        details: {
          issues: issues,
          contrast_check: contrastCheck,
          alt_text_check: altTextCheck,
          semantic_check: semanticCheck,
          readability_check: readabilityCheck
        }
      };
      
    } catch (error) {
      return {
        passed: false,
        score: 0,
        message: `Accessibility check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error }
      };
    }
  }
  
  /**
   * Check email client compatibility
   */
  private async checkEmailCompatibility(htmlContent: string): Promise<ValidationCheck> {
    try {
      const issues: string[] = [];
      let score = 100;
      
      // Check for table-based layout (required for email clients)
      const layoutCheck = this.checkTableBasedLayout(htmlContent);
      if (!layoutCheck.valid) {
        issues.push('Non-table-based layout may break in email clients');
        score -= 35;
      }
      
      // Check for inline CSS (required for email clients)
      const cssCheck = this.checkInlineCSS(htmlContent);
      if (!cssCheck.valid) {
        issues.push('External CSS or non-inline styles detected');
        score -= 25;
      }
      
      // Check file size (should be under 100KB)
      const sizeCheck = this.checkFileSize(htmlContent);
      if (!sizeCheck.valid) {
        issues.push('Email size exceeds recommended limits');
        score -= 20;
      }
      
      // Check for email-safe elements only
      const elementsCheck = this.checkEmailSafeElements(htmlContent);
      if (!elementsCheck.valid) {
        issues.push('Potentially incompatible HTML elements detected');
        score -= 15;
      }
      
      const passed = score >= 70;
      
      return {
        passed: passed,
        score: Math.max(0, score),
        message: passed ? 'Email client compatibility requirements met' : `Compatibility issues found: ${issues.join(', ')}`,
        details: {
          issues: issues,
          layout_check: layoutCheck,
          css_check: cssCheck,
          size_check: sizeCheck,
          elements_check: elementsCheck
        }
      };
      
    } catch (error) {
      return {
        passed: false,
        score: 0,
        message: `Email compatibility check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error }
      };
    }
  }
  
  /**
   * Check overall layout quality
   */
  private async checkLayoutQuality(htmlContent: string): Promise<ValidationCheck> {
    try {
      const issues: string[] = [];
      let score = 100;
      
      // Check for responsive design elements
      const responsiveCheck = this.checkResponsiveDesign(htmlContent);
      if (!responsiveCheck.valid) {
        issues.push('Layout not optimized for mobile devices');
        score -= 25;
      }
      
      // Check visual hierarchy
      const hierarchyCheck = this.checkVisualHierarchy(htmlContent);
      if (!hierarchyCheck.valid) {
        issues.push('Poor visual hierarchy in layout');
        score -= 20;
      }
      
      // Check content spacing and alignment
      const spacingCheck = this.checkContentSpacing(htmlContent);
      if (!spacingCheck.valid) {
        issues.push('Inconsistent spacing and alignment');
        score -= 20;
      }
      
      // Check overall design balance
      const balanceCheck = this.checkDesignBalance(htmlContent);
      if (!balanceCheck.valid) {
        issues.push('Unbalanced layout design');
        score -= 15;
      }
      
      const passed = score >= 70;
      
      return {
        passed: passed,
        score: Math.max(0, score),
        message: passed ? 'Layout quality standards met' : `Layout quality issues found: ${issues.join(', ')}`,
        details: {
          issues: issues,
          responsive_check: responsiveCheck,
          hierarchy_check: hierarchyCheck,
          spacing_check: spacingCheck,
          balance_check: balanceCheck
        }
      };
      
    } catch (error) {
      return {
        passed: false,
        score: 0,
        message: `Layout quality check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error }
      };
    }
  }
  
  // Brand checking methods
  private checkBrandColors(htmlContent: string): ValidationCheck {
    // Check for Kupibilet brand colors in CSS and style attributes
    const kupibiletPrimary = /#4BFF7E|rgb\(75,\s*255,\s*126\)/i;
    const kupibiletDark = /#1DA857|rgb\(29,\s*168,\s*87\)/i;
    const kupibiletBackground = /#2C3959|rgb\(44,\s*57,\s*89\)/i;
    const kupibiletAccent = /#FF6240|rgb\(255,\s*98,\s*64\)/i;
    const kupibiletSecondary = /#E03EEF|rgb\(224,\s*62,\s*239\)/i;

    const hasPrimary = kupibiletPrimary.test(htmlContent);
    const hasDark = kupibiletDark.test(htmlContent);
    const hasBackground = kupibiletBackground.test(htmlContent);
    const hasAccent = kupibiletAccent.test(htmlContent);
    const hasSecondary = kupibiletSecondary.test(htmlContent);

    const colorCount = [hasPrimary, hasDark, hasBackground, hasAccent, hasSecondary].filter(Boolean).length;
    
    return {
      valid: colorCount >= 1,
      score: Math.min(100, colorCount * 25),
      details: `Found ${colorCount}/5 Kupibilet brand colors`,
      colors_found: {
        primary: hasPrimary,
        dark: hasDark,
        background: hasBackground,
        accent: hasAccent,
        secondary: hasSecondary
      }
    };
  }
  
  private checkBrandFonts(htmlContent: string): { valid: boolean; details: any } {
    // Check for web-safe fonts and proper font stack
    const fontFamilyPattern = /font-family\s*:\s*([^;]+)/gi;
    const matches: string[] = htmlContent.match(fontFamilyPattern) || [];
    
    const safeStacks = [
      'Arial, sans-serif',
      'Helvetica, Arial, sans-serif', 
      'Georgia, serif',
      'Times, serif'
    ];
    
    let hasValidFonts = true;
    const fontDetails: string[] = [];
    
    matches.forEach((match: string) => {
      const fontStack = match.replace('font-family:', '').trim();
      fontDetails.push(fontStack);
      
      if (!safeStacks.some(safe => fontStack.toLowerCase().includes(safe.toLowerCase()))) {
        hasValidFonts = false;
      }
    });
    
    return {
      valid: hasValidFonts,
      details: {
        fonts_found: fontDetails,
        safe_font_stacks: hasValidFonts
      }
    };
  }
  
  private checkLogoPlacement(htmlContent: string): { valid: boolean; hasLogo: boolean; details: any } {
    // Check if logo is present and properly placed
    const logoPattern = /(logo|brand|kupibilet)/i;
    const hasLogo = logoPattern.test(htmlContent);
    
    if (!hasLogo) {
      return { valid: true, hasLogo: false, details: { logo_present: false } };
    }
    
    // If logo is present, check placement (usually in header area)
    const headerPattern = /<th[^>]*>[\s\S]*?(logo|brand|kupibilet)[\s\S]*?<\/th>/i;
    const tablePattern = /<table[^>]*>[\s\S]*?(logo|brand|kupibilet)[\s\S]*?<\/table>/i;
    
    const hasProperPlacement = headerPattern.test(htmlContent) || tablePattern.test(htmlContent);
    
    return {
      valid: hasProperPlacement,
      hasLogo: true,
      details: {
        logo_present: true,
        proper_placement: hasProperPlacement
      }
    };
  }
  
  private checkBrandConsistency(htmlContent: string): { valid: boolean; details: any } {
    // Check for consistent brand presentation
    const consistencyScore = 100;
    
    // This is a simplified check - in production, this would be more sophisticated
    const hasConsistentStyling = !/<style[^>]*>[\s\S]*?color\s*:\s*[^;]*(?!#0066CC|#00CC66|#FF6600)/i.test(htmlContent);
    
    return {
      valid: hasConsistentStyling,
      details: {
        consistent_colors: hasConsistentStyling,
        consistency_score: consistencyScore
      }
    };
  }
  
  // Accessibility checking methods
  private checkContrastRatios(htmlContent: string): { valid: boolean; details: any } {
    // Simplified contrast checking - look for light text on light backgrounds
    const lightTextPattern = /color\s*:\s*(#[f-f]{3,6}|white|#fff)/i;
    const lightBackgroundPattern = /background-color\s*:\s*(#[f-f]{3,6}|white|#fff)/i;
    
    const hasLightText = lightTextPattern.test(htmlContent);
    const hasLightBackground = lightBackgroundPattern.test(htmlContent);
    
    // Basic check: avoid light text on light background
    const hasGoodContrast = !(hasLightText && hasLightBackground);
    
    return {
      valid: hasGoodContrast,
      details: {
        potential_contrast_issues: !hasGoodContrast,
        has_light_text: hasLightText,
        has_light_background: hasLightBackground
      }
    };
  }
  
  private checkImageAltText(htmlContent: string): { valid: boolean; details: any } {
    // Check for images without alt text
    const imgTags: string[] = htmlContent.match(/<img[^>]*>/gi) || [];
    const imagesWithoutAlt: string[] = [];
    
    imgTags.forEach((img: string) => {
      if (!img.includes('alt=') || /alt\s*=\s*["']?\s*["']?/i.test(img)) {
        imagesWithoutAlt.push(img);
      }
    });
    
    return {
      valid: imagesWithoutAlt.length === 0,
      details: {
        total_images: imgTags.length,
        images_without_alt: imagesWithoutAlt.length,
        images_missing_alt: imagesWithoutAlt
      }
    };
  }
  
  private checkSemanticStructure(htmlContent: string): { valid: boolean; details: any } {
    // Check for proper semantic structure in emails
    const hasProperTables = /<table[^>]*>[\s\S]*?<\/table>/gi.test(htmlContent);
    const hasProperCells = /<td[^>]*>[\s\S]*?<\/td>/gi.test(htmlContent);
    
    return {
      valid: hasProperTables && hasProperCells,
      details: {
        has_table_structure: hasProperTables,
        has_proper_cells: hasProperCells
      }
    };
  }
  
  private checkTextReadability(htmlContent: string): { valid: boolean; details: any } {
    // Check font sizes and line spacing
    const fontSizePattern = /font-size\s*:\s*(\d+)px/gi;
    const matches: string[] = htmlContent.match(fontSizePattern) || [];
    
    let hasReadableFonts = true;
    const smallFonts: number[] = [];
    
    matches.forEach((match: string) => {
      const sizeMatch = match.match(/\d+/);
      const size = parseInt(sizeMatch?.[0] || '0');
      if (size < 14) {
        hasReadableFonts = false;
        smallFonts.push(size);
      }
    });
    
    return {
      valid: hasReadableFonts,
      details: {
        small_fonts_detected: smallFonts,
        readable_font_sizes: hasReadableFonts
      }
    };
  }
  
  // Email compatibility checking methods
  private checkTableBasedLayout(htmlContent: string): { valid: boolean; details: any } {
    // Email must use table-based layout
    const hasMainTable = /<table[^>]*>[\s\S]*?<\/table>/i.test(htmlContent);
    const hasTableCells = /<td[^>]*>[\s\S]*?<\/td>/i.test(htmlContent);
    const hasIncompatibleLayout = /<div[^>]*display\s*:\s*flex/i.test(htmlContent) || 
                                 /<div[^>]*display\s*:\s*grid/i.test(htmlContent);
    
    return {
      valid: hasMainTable && hasTableCells && !hasIncompatibleLayout,
      details: {
        has_main_table: hasMainTable,
        has_table_cells: hasTableCells,
        has_incompatible_layout: hasIncompatibleLayout
      }
    };
  }
  
  private checkInlineCSS(htmlContent: string): { valid: boolean; details: any } {
    // Check for external CSS or non-inline styles
    const hasExternalCSS = /<link[^>]*rel\s*=\s*["']stylesheet["']/i.test(htmlContent);
    const hasStyleTag = /<style[^>]*>[\s\S]*?<\/style>/i.test(htmlContent);
    const hasInlineStyles = /style\s*=\s*["'][^"']+["']/i.test(htmlContent);
    
    return {
      valid: !hasExternalCSS && hasInlineStyles,
      details: {
        has_external_css: hasExternalCSS,
        has_style_tag: hasStyleTag,
        has_inline_styles: hasInlineStyles
      }
    };
  }
  
  private checkFileSize(htmlContent: string): { valid: boolean; details: any } {
    const sizeInBytes = Buffer.byteLength(htmlContent, 'utf8');
    const sizeInKB = Math.round(sizeInBytes / 1024);
    const isUnderLimit = sizeInKB <= 100;
    
    return {
      valid: isUnderLimit,
      details: {
        size_bytes: sizeInBytes,
        size_kb: sizeInKB,
        under_limit: isUnderLimit
      }
    };
  }
  
  private checkEmailSafeElements(htmlContent: string): { valid: boolean; details: any } {
    // Check for potentially incompatible elements
    const unsafeElements = [
      /<video[^>]*>/i,
      /<audio[^>]*>/i,
      /<canvas[^>]*>/i,
      /<svg[^>]*>/i,
      /<iframe[^>]*>/i,
      /<script[^>]*>/i
    ];
    
    const foundUnsafeElements: string[] = [];
    
    unsafeElements.forEach(pattern => {
      if (pattern.test(htmlContent)) {
        foundUnsafeElements.push(pattern.source);
      }
    });
    
    return {
      valid: foundUnsafeElements.length === 0,
      details: {
        unsafe_elements_found: foundUnsafeElements
      }
    };
  }
  
  // Layout quality checking methods
  private checkResponsiveDesign(htmlContent: string): { valid: boolean; details: any } {
    // Check for responsive elements
    const hasMediaQueries = /@media[^{]*{[^}]*}/i.test(htmlContent);
    const hasViewportMeta = /<meta[^>]*viewport[^>]*>/i.test(htmlContent);
    const hasResponsiveImages = /max-width\s*:\s*100%/i.test(htmlContent);
    
    return {
      valid: hasMediaQueries || hasResponsiveImages,
      details: {
        has_media_queries: hasMediaQueries,
        has_viewport_meta: hasViewportMeta,
        has_responsive_images: hasResponsiveImages
      }
    };
  }
  
  private checkVisualHierarchy(htmlContent: string): { valid: boolean; details: any } {
    // Check for proper heading structure and emphasis
    const hasHeadings = /<h[1-6][^>]*>/i.test(htmlContent);
    const hasEmphasis = /<(strong|b|em|i)[^>]*>/i.test(htmlContent);
    const hasDifferentFontSizes = /font-size\s*:\s*\d+px/gi.test(htmlContent);
    
    return {
      valid: hasHeadings || (hasEmphasis && hasDifferentFontSizes),
      details: {
        has_headings: hasHeadings,
        has_emphasis: hasEmphasis,
        has_different_font_sizes: hasDifferentFontSizes
      }
    };
  }
  
  private checkContentSpacing(htmlContent: string): { valid: boolean; details: any } {
    // Check for proper spacing
    const hasPadding = /padding\s*:\s*\d+px/i.test(htmlContent);
    const hasMargin = /margin\s*:\s*\d+px/i.test(htmlContent);
    const hasLineHeight = /line-height\s*:\s*[\d.]+/i.test(htmlContent);
    
    return {
      valid: hasPadding || hasMargin,
      details: {
        has_padding: hasPadding,
        has_margin: hasMargin,
        has_line_height: hasLineHeight
      }
    };
  }
  
  private checkDesignBalance(htmlContent: string): { valid: boolean; details: any } {
    // Basic design balance check
    const textLength = htmlContent.replace(/<[^>]*>/g, '').length;
    const imageCount = (htmlContent.match(/<img[^>]*>/gi) || []).length;
    const tableCount = (htmlContent.match(/<table[^>]*>/gi) || []).length;
    
    // Simple heuristic: should have reasonable text-to-image ratio
    const textToImageRatio = imageCount > 0 ? textLength / imageCount : textLength;
    const isBalanced = textToImageRatio > 100 && textToImageRatio < 5000;
    
    return {
      valid: isBalanced,
      details: {
        text_length: textLength,
        image_count: imageCount,
        table_count: tableCount,
        text_to_image_ratio: textToImageRatio,
        is_balanced: isBalanced
      }
    };
  }
  
  // Utility methods
  private calculateVisualScore(checks: Record<string, ValidationCheck>): number {
    const weights = {
      brand_compliance: 0.35,     // 35% - Most important for brand
      accessibility: 0.25,        // 25% - Critical for compliance
      email_compatibility: 0.25,  // 25% - Essential for delivery
      layout_quality: 0.15        // 15% - Nice to have
    };
    
    return Math.round(
      checks.brand_compliance.score * weights.brand_compliance +
      checks.accessibility.score * weights.accessibility +
      checks.email_compatibility.score * weights.email_compatibility +
      checks.layout_quality.score * weights.layout_quality
    );
  }
  
  private collectIssues(checks: Record<string, ValidationCheck>): string[] {
    const allIssues: string[] = [];
    
    Object.values(checks).forEach(check => {
      if (!check.passed && check.details?.issues) {
        allIssues.push(...check.details.issues);
      }
    });
    
    return allIssues;
  }
  
  private generateRecommendations(checks: Record<string, ValidationCheck>): string[] {
    const recommendations: string[] = [];
    
    // Brand compliance recommendations
    if (!checks.brand_compliance.passed) {
      recommendations.push('Use Kupibilet brand colors (#4BFF7E, #1DA857, #FF6240) in your design');
      recommendations.push('Ensure consistent brand presentation throughout the email');
    }
    
    // Accessibility recommendations
    if (!checks.accessibility.passed) {
      recommendations.push('Improve color contrast to meet WCAG AA standards (4.5:1 ratio)');
      recommendations.push('Add descriptive alt text to all images for screen readers');
      recommendations.push('Use minimum 14px font size for better readability');
    }
    
    // Email compatibility recommendations
    if (!checks.email_compatibility.passed) {
      recommendations.push('Use table-based layout instead of CSS flexbox/grid for email client compatibility');
      recommendations.push('Move all CSS to inline styles for better email client support');
      recommendations.push('Optimize email size to stay under 100KB total');
    }
    
    // Layout quality recommendations
    if (!checks.layout_quality.passed) {
      recommendations.push('Add responsive design elements for mobile email clients');
      recommendations.push('Improve visual hierarchy with proper headings and emphasis');
      recommendations.push('Balance text and image content for better engagement');
    }
    
    return recommendations;
  }
  
  private createFailedResult(errorMessage: string): VisualValidationResult {
    return {
      score: 0,
      passed: false,
      checks: {
        brand_compliance: { passed: false, score: 0, message: errorMessage },
        accessibility: { passed: false, score: 0, message: errorMessage },
        email_compatibility: { passed: false, score: 0, message: errorMessage },
        layout_quality: { passed: false, score: 0, message: errorMessage }
      },
      issues: [errorMessage],
      recommendations: ['Fix validation errors and try again']
    };
  }
  
  // Configuration methods
  private getKupibiletBrandGuidelines(): BrandGuidelines {
    return {
      colors: {
        primary: ['#4BFF7E', '#1DA857'],
        secondary: ['#E03EEF'],
        accent: ['#FF6240']
      },
      fonts: {
        primary: ['Inter', 'system-ui', 'sans-serif'],
        fallback: ['Arial', 'Helvetica', 'sans-serif']
      },
      required_elements: ['kupibilet'],
      spacing: {
        base: 16,
        scale: [8, 16, 24, 32, 48, 64]
      }
    };
  }
  
  private getAccessibilityConfig(): AccessibilityConfig {
    return {
      contrast_ratio_aa: 4.5,
      contrast_ratio_aaa: 7.0,
      required_alt_text: true,
      max_line_length: 80
    };
  }
  
  private getEmailCompatibilityConfig(): EmailCompatibilityConfig {
    return {
      supported_clients: ['gmail', 'outlook', 'apple-mail', 'yahoo-mail'],
      required_fallbacks: ['table-layout', 'inline-css'],
      max_html_size: 102400, // 100KB
      inline_css_required: true
    };
  }
} 