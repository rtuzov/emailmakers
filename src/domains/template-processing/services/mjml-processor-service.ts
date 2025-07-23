import mjml2html from 'mjml';
import { minify } from 'html-minifier';
import juice from 'juice';

// Core interfaces for email template processing
interface EmailTemplate {
  id: string;
  name: string;
  mjmlContent: string;
  designTokens?: DesignTokenSet;
  targetClients: EmailClient[];
  requirements: TemplateRequirements;
}

interface DesignTokenSet {
  colors: ColorToken[];
  typography: TypographyToken[];
  spacing: SpacingToken[];
  components: ComponentToken[];
}

interface ColorToken {
  name: string;
  value: string;
  darkModeValue?: string;
  semanticMeaning: string;
}

interface TypographyToken {
  name: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  emailFallback: string;
}

interface SpacingToken {
  name: string;
  value: number;
  usage: 'margin' | 'padding' | 'gap';
}

interface ComponentToken {
  name: string;
  mjmlTag: string;
  defaultStyles: { [key: string]: string };
}

interface TemplateRequirements {
  maxFileSize: number; // in KB
  targetClients: EmailClient[];
  darkModeSupport: boolean;
  responsiveDesign: boolean;
  accessibilityLevel: 'AA' | 'AAA';
  performanceTargets: PerformanceTargets;
}

interface PerformanceTargets {
  maxLoadTime: number; // in ms
  maxImageSize: number; // in KB
  maxCSSSize: number; // in KB
  compressionLevel: 'none' | 'standard' | 'aggressive';
}

type EmailClient = 'gmail' | 'outlook' | 'outlook-web' | 'apple-mail' | 'yahoo-mail' | 
                   'thunderbird' | 'samsung-mail' | 'android-mail' | 'ios-mail';

interface OptimizedEmailTemplate {
  html: string;
  css: string;
  inlinedHtml: string;
  darkModeHtml: string;
  fileSize: number;
  performance: PerformanceMetrics;
  compatibility: CompatibilityReport;
  optimizations: OptimizationSummary;
}

interface PerformanceMetrics {
  fileSize: number;
  cssSize: number;
  imageCount: number;
  totalImageSize: number;
  loadTime: number;
  compressionRatio: number;
}

interface CompatibilityReport {
  overall: number; // 0-1 score
  clientScores: { [client in EmailClient]: number };
  issues: CompatibilityIssue[];
  recommendations: string[];
}

interface CompatibilityIssue {
  client: EmailClient;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  element: string;
  suggestedFix: string;
}

interface OptimizationSummary {
  applied: OptimizationRule[];
  skipped: OptimizationRule[];
  performance: {
    originalSize: number;
    optimizedSize: number;
    compressionRatio: number;
  };
}

interface OptimizationRule {
  name: string;
  type: 'css' | 'html' | 'image' | 'compatibility' | 'performance';
  description: string;
  impact: 'low' | 'medium' | 'high';
  applied: boolean;
  reason?: string;
}

// Email client compatibility rules
interface ClientCompatibilityRules {
  client: EmailClient;
  cssSupport: CSSSupport;
  htmlSupport: HTMLSupport;
  imageSupport: ImageSupport;
  darkModeSupport: DarkModeSupport;
  limitations: string[];
  workarounds: { [issue: string]: string };
}

interface CSSSupport {
  inlineStyles: boolean;
  embeddedStyles: boolean;
  externalStyles: boolean;
  mediaQueries: boolean;
  flexbox: boolean;
  grid: boolean;
  customProperties: boolean;
  pseudoClasses: string[];
  supportedProperties: string[];
  unsupportedProperties: string[];
}

interface HTMLSupport {
  tables: boolean;
  divs: boolean;
  semanticElements: boolean;
  forms: boolean;
  video: boolean;
  audio: boolean;
  svg: boolean;
  webfonts: boolean;
}

interface ImageSupport {
  formats: string[];
  maxSize: number;
  backgroundImages: boolean;
  retina: boolean;
  webp: boolean;
  svg: boolean;
}

interface DarkModeSupport {
  supported: boolean;
  method: 'media-query' | 'css-variables' | 'none';
  limitations: string[];
}

// Dark mode implementation interfaces
interface DarkModeConfiguration {
  enabled: boolean;
  strategy: 'automatic' | 'manual' | 'hybrid';
  colorMappings: { [lightColor: string]: string };
  customRules: DarkModeRule[];
  fallbackBehavior: 'light' | 'dark' | 'system';
}

interface DarkModeRule {
  selector: string;
  property: string;
  lightValue: string;
  darkValue: string;
  condition?: string;
}

export class MJMLProcessorService {
  private compatibilityRules: Map<EmailClient, ClientCompatibilityRules>;
  private optimizationRules: OptimizationRule[];
  private darkModeProcessor: DarkModeProcessor;
  private performanceOptimizer: PerformanceOptimizer;

  constructor() {
    this.compatibilityRules = new Map();
    this.optimizationRules = [];
    this.darkModeProcessor = new DarkModeProcessor();
    this.performanceOptimizer = new PerformanceOptimizer();
    
    this.initializeCompatibilityRules();
    this.initializeOptimizationRules();
  }

  /**
   * Main processing method - converts MJML to optimized email HTML
   */
  async processTemplate(
    template: EmailTemplate,
    strategy: OptimizationStrategy
  ): Promise<OptimizedEmailTemplate> {
    const startTime = Date.now();
    
    try {
      // Step 1: Pre-process MJML with design tokens
      const processedMJML = await this.preprocessMJMLWithTokens(
        template.mjmlContent, 
        template.designTokens
      );

      // Step 2: Apply client-specific preprocessing
      const clientOptimizedMJML = await this.applyClientSpecificPreprocessing(
        processedMJML,
        template.targetClients
      );

      // Step 3: Convert MJML to HTML
      const mjmlResult = await this.convertMJMLToHTML(clientOptimizedMJML);
      if (mjmlResult.errors.length > 0) {
        console.warn('MJML conversion warnings:', mjmlResult.errors);
      }

      // Step 4: Apply CSS inlining with client compatibility
      const inlinedHtml = await this.inlineCSSWithCompatibility(
        mjmlResult.html,
        template.targetClients
      );

      // Step 5: Implement dark mode support
      const darkModeHtml = template.requirements.darkModeSupport
        ? await this.implementDarkMode(inlinedHtml, template.designTokens?.colors)
        : inlinedHtml;

      // Step 6: Apply performance optimizations
      const optimizedHtml = await this.applyPerformanceOptimizations(
        darkModeHtml,
        template.requirements.performanceTargets,
        strategy
      );

      // Step 7: Generate compatibility report
      const compatibility = await this.generateCompatibilityReport(
        optimizedHtml,
        template.targetClients
      );

      // Step 8: Calculate performance metrics
      const performance = await this.calculatePerformanceMetrics(
        mjmlResult.html,
        optimizedHtml
      );

      const processingTime = Date.now() - startTime;

      return {
        html: mjmlResult.html,
        css: mjmlResult.css || '',
        inlinedHtml: optimizedHtml,
        darkModeHtml,
        fileSize: Buffer.byteLength(optimizedHtml, 'utf8'),
        performance: {
          ...performance,
          loadTime: processingTime
        },
        compatibility,
        optimizations: {
          applied: this.optimizationRules.filter(rule => rule.applied),
          skipped: this.optimizationRules.filter(rule => !rule.applied),
          performance: {
            originalSize: Buffer.byteLength(mjmlResult.html, 'utf8'),
            optimizedSize: Buffer.byteLength(optimizedHtml, 'utf8'),
            compressionRatio: 1 - (Buffer.byteLength(optimizedHtml, 'utf8') / Buffer.byteLength(mjmlResult.html, 'utf8'))
          }
        }
      };
    } catch (error) {
      console.error('Template processing failed:', error);
      throw new Error(`MJML processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Advanced MJML preprocessing with design token integration
   */
  private async preprocessMJMLWithTokens(
    mjmlContent: string,
    designTokens?: DesignTokenSet
  ): Promise<string> {
    let processedMJML = mjmlContent;

    if (designTokens) {
      // Replace color tokens
      if (designTokens.colors) {
        for (const colorToken of designTokens.colors) {
          const tokenPattern = new RegExp(`{{${colorToken.name}}}`, 'g');
          processedMJML = processedMJML.replace(tokenPattern, colorToken.value);
        }
      }

      // Replace typography tokens
      if (designTokens.typography) {
        for (const typographyToken of designTokens.typography) {
          const fontFamilyPattern = new RegExp(`{{${typographyToken.name}.fontFamily}}`, 'g');
          const fontSizePattern = new RegExp(`{{${typographyToken.name}.fontSize}}`, 'g');
          const fontWeightPattern = new RegExp(`{{${typographyToken.name}.fontWeight}}`, 'g');
          
          processedMJML = processedMJML.replace(fontFamilyPattern, typographyToken.emailFallback);
          processedMJML = processedMJML.replace(fontSizePattern, `${typographyToken.fontSize}px`);
          processedMJML = processedMJML.replace(fontWeightPattern, typographyToken.fontWeight.toString());
        }
      }

      // Replace spacing tokens
      if (designTokens.spacing) {
        for (const spacingToken of designTokens.spacing) {
          const tokenPattern = new RegExp(`{{${spacingToken.name}}}`, 'g');
          processedMJML = processedMJML.replace(tokenPattern, `${spacingToken.value}px`);
        }
      }
    }

    return processedMJML;
  }

  /**
   * Client-specific MJML preprocessing
   */
  private async applyClientSpecificPreprocessing(
    mjmlContent: string,
    targetClients: EmailClient[]
  ): Promise<string> {
    let processedMJML = mjmlContent;

    for (const client of targetClients) {
      const rules = this.compatibilityRules.get(client);
      if (!rules) continue;

      // Apply client-specific transformations
      processedMJML = await this.applyClientTransformations(processedMJML, rules);
    }

    return processedMJML;
  }

  /**
   * Apply client-specific transformations
   */
  private async applyClientTransformations(
    mjmlContent: string,
    rules: ClientCompatibilityRules
  ): Promise<string> {
    let transformed = mjmlContent;

    // Outlook-specific transformations
    if (rules.client === 'outlook') {
      // Force table-based layout
      transformed = this.forceTableLayout(transformed);
      
      // Add VML fallbacks for background images
      transformed = this.addVMLFallbacks(transformed);
      
      // Fix button rendering
      transformed = this.fixOutlookButtons(transformed);
    }

    // Gmail-specific transformations
    if (rules.client === 'gmail') {
      // Ensure styles are inline
      transformed = this.ensureInlineStyles(transformed);
      
      // Fix Gmail-specific issues
      transformed = this.fixGmailQuirks(transformed);
    }

    // Apple Mail-specific transformations
    if (rules.client === 'apple-mail') {
      // Optimize for dark mode
      transformed = this.optimizeForAppleDarkMode(transformed);
    }

    return transformed;
  }

  /**
   * Advanced CSS inlining with client compatibility
   */
  private async inlineCSSWithCompatibility(
    html: string,
    targetClients: EmailClient[]
  ): Promise<string> {
    // Extract embedded CSS
    const cssMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    const css = cssMatch && cssMatch[1] ? cssMatch[1] : '';

    // Apply client-specific CSS rules
    let clientOptimizedCSS: string = css;
    for (const client of targetClients) {
      if (client && typeof client === 'string' && this.isValidEmailClient(client)) {
        const emailClient = client as EmailClient;
        clientOptimizedCSS = await this.optimizeCSSForClient(clientOptimizedCSS, emailClient);
      }
    }

    // Inline CSS using juice with custom options
    const juiceOptions = {
      removeStyleTags: true,
      preserveMediaQueries: true,
      preserveFontFaces: true,
      webResources: {
        images: false,
        svgs: false,
        scripts: false,
        links: false
      }
    };

    let inlinedHtml = juice(html, juiceOptions);

    // Post-process inlined HTML for client compatibility
    for (const client of targetClients) {
      inlinedHtml = await this.postProcessForClient(inlinedHtml, client);
    }

    return inlinedHtml;
  }

  /**
   * Sophisticated dark mode implementation
   */
  private async implementDarkMode(
    html: string,
    colorTokens?: ColorToken[]
  ): Promise<string> {
    const darkModeConfig: DarkModeConfiguration = {
      enabled: true,
      strategy: 'hybrid',
      colorMappings: this.generateColorMappings(colorTokens),
      customRules: [],
      fallbackBehavior: 'light'
    };

    return await this.darkModeProcessor.implementDarkMode(html, darkModeConfig);
  }

  /**
   * Performance optimization pipeline
   */
  private async applyPerformanceOptimizations(
    html: string,
    targets: PerformanceTargets,
    strategy: OptimizationStrategy
  ): Promise<string> {
    return await this.performanceOptimizer.optimize(html, targets, strategy);
  }

  /**
   * Generate comprehensive compatibility report
   */
  private async generateCompatibilityReport(
    html: string,
    targetClients: EmailClient[]
  ): Promise<CompatibilityReport> {
    const issues: CompatibilityIssue[] = [];
    const clientScores: { [client in EmailClient]: number } = {} as any;
    const recommendations: string[] = [];

    for (const client of targetClients) {
      const score = await this.calculateClientCompatibilityScore(html, client);
      clientScores[client] = score;

      const clientIssues = await this.detectClientIssues(html, client);
      issues.push(...clientIssues);
    }

    const overall = Object.values(clientScores).reduce((sum, score) => sum + score, 0) / targetClients.length;

    // Generate recommendations based on issues
    const uniqueIssues = this.deduplicateIssues(issues);
    for (const issue of uniqueIssues) {
      if (issue.severity === 'high' || issue.severity === 'critical') {
        recommendations.push(issue.suggestedFix);
      }
    }

    return {
      overall,
      clientScores,
      issues: uniqueIssues,
      recommendations
    };
  }

  /**
   * Calculate performance metrics
   */
  private async calculatePerformanceMetrics(
    originalHtml: string,
    optimizedHtml: string
  ): Promise<PerformanceMetrics> {
    const originalSize = Buffer.byteLength(originalHtml, 'utf8');
    const optimizedSize = Buffer.byteLength(optimizedHtml, 'utf8');
    
    // Extract CSS size
    const cssMatch = optimizedHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
    const cssSize = cssMatch ? cssMatch.join('').length : 0;
    
    // Count images
    const imageMatches = optimizedHtml.match(/<img[^>]*>/gi) || [];
    const imageCount = imageMatches.length;
    
    // Estimate total image size (placeholder - would require actual image analysis)
    const totalImageSize = imageCount * 50; // Placeholder estimation
    
    return {
      fileSize: optimizedSize,
      cssSize,
      imageCount,
      totalImageSize,
      loadTime: 0, // Will be set by caller
      compressionRatio: 1 - (optimizedSize / originalSize)
    };
  }

  // Helper methods for MJML conversion
  private async convertMJMLToHTML(mjmlContent: string): Promise<{ html: string; css?: string; errors: any[] }> {
    try {
      const result = mjml2html(mjmlContent, {
        keepComments: false,
        minify: false, // We'll handle minification separately
        validationLevel: 'strict'
        // Removed deprecated 'beautify' option to prevent warning escalation
      });

      return {
        html: result.html,
        css: this.extractCSS(result.html),
        errors: result.errors || []
      };
    } catch (error) {
      throw new Error(`MJML compilation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private extractCSS(html: string): string {
    const cssMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    return cssMatch && cssMatch[1] ? cssMatch[1] : '';
  }

  // Client-specific optimization methods
  private isValidEmailClient(client: string): client is EmailClient {
    const validClients: EmailClient[] = [
      'gmail', 'outlook', 'outlook-web', 'apple-mail', 'yahoo-mail',
      'thunderbird', 'samsung-mail', 'android-mail', 'ios-mail'
    ];
    return validClients.includes(client as EmailClient);
  }

  private async optimizeCSSForClient(css: string, client: EmailClient): Promise<string> {
    const rules = this.compatibilityRules.get(client);
    if (!rules) return css;

    let optimizedCSS = css;

    // Remove unsupported properties
    for (const unsupportedProp of rules.cssSupport.unsupportedProperties) {
      const propRegex = new RegExp(`${unsupportedProp}\\s*:[^;]+;`, 'gi');
      optimizedCSS = optimizedCSS.replace(propRegex, '');
    }

    // Add client-specific workarounds
    for (const [issue, workaround] of Object.entries(rules.workarounds)) {
      if (css.includes(issue)) {
        optimizedCSS += `\n/* ${client} workaround for ${issue} */\n${workaround}\n`;
      }
    }

    return optimizedCSS;
  }

  private async postProcessForClient(html: string, client: EmailClient): Promise<string> {
    let processed = html;

    switch (client) {
      case 'outlook':
        processed = this.addOutlookConditionalComments(processed);
        processed = this.fixOutlookTableSpacing(processed);
        break;
      case 'gmail':
        processed = this.fixGmailImageBlocking(processed);
        processed = this.addGmailSpecificStyles(processed);
        break;
      case 'apple-mail':
        processed = this.optimizeAppleMailRendering(processed);
        break;
    }

    return processed;
  }

  // Client-specific transformation methods
  private forceTableLayout(mjml: string): string {
    // Convert div-based layouts to table-based for Outlook
    return mjml.replace(/<mj-section([^>]*)>/g, '<mj-section $1 css-class="outlook-table">');
  }

  private addVMLFallbacks(mjml: string): string {
    // Add VML fallbacks for background images in Outlook
    return mjml; // Placeholder implementation
  }

  private fixOutlookButtons(mjml: string): string {
    // Fix button rendering issues in Outlook
    return mjml.replace(
      /<mj-button([^>]*)>/g,
      '<mj-button $1 inner-padding="12px 24px" padding="0">'
    );
  }

  private ensureInlineStyles(mjml: string): string {
    // Ensure all styles are inlined for Gmail
    return mjml; // Placeholder implementation
  }

  private fixGmailQuirks(mjml: string): string {
    // Fix Gmail-specific rendering issues
    return mjml; // Placeholder implementation
  }

  private optimizeForAppleDarkMode(mjml: string): string {
    // Optimize for Apple Mail dark mode
    return mjml; // Placeholder implementation
  }

  private addOutlookConditionalComments(html: string): string {
    // Add Outlook conditional comments
    return html.replace(
      /<table/g,
      '<!--[if mso]><table<![endif]--><!--[if !mso]><!--><table<!--<![endif]-->'
    );
  }

  private fixOutlookTableSpacing(html: string): string {
    // Fix table spacing issues in Outlook
    return html; // Placeholder implementation
  }

  private fixGmailImageBlocking(html: string): string {
    // Fix Gmail image blocking issues
    return html; // Placeholder implementation
  }

  private addGmailSpecificStyles(html: string): string {
    // Add Gmail-specific styles
    return html; // Placeholder implementation
  }

  private optimizeAppleMailRendering(html: string): string {
    // Optimize rendering for Apple Mail
    return html; // Placeholder implementation
  }

  // Compatibility analysis methods
  private async calculateClientCompatibilityScore(html: string, client: EmailClient): Promise<number> {
    const rules = this.compatibilityRules.get(client);
    if (!rules) return 0.5;

    let score = 1.0;
    const issues = await this.detectClientIssues(html, client);
    
    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical':
          score -= 0.3;
          break;
        case 'high':
          score -= 0.2;
          break;
        case 'medium':
          score -= 0.1;
          break;
        case 'low':
          score -= 0.05;
          break;
      }
    }

    return Math.max(0, score);
  }

  private async detectClientIssues(html: string, client: EmailClient): Promise<CompatibilityIssue[]> {
    const issues: CompatibilityIssue[] = [];
    const rules = this.compatibilityRules.get(client);
    if (!rules) return issues;

    // Check for unsupported CSS properties
    for (const unsupportedProp of rules.cssSupport.unsupportedProperties) {
      const propRegex = new RegExp(`style="[^"]*${unsupportedProp}\\s*:`, 'gi');
      if (propRegex.test(html)) {
        issues.push({
          client,
          severity: 'medium',
          description: `Unsupported CSS property: ${unsupportedProp}`,
          element: 'style attribute',
          suggestedFix: `Remove or replace ${unsupportedProp} with supported alternative`
        });
      }
    }

    // Client-specific issue detection
    switch (client) {
      case 'outlook':
        issues.push(...this.detectOutlookIssues(html));
        break;
      case 'gmail':
        issues.push(...this.detectGmailIssues(html));
        break;
      case 'apple-mail':
        issues.push(...this.detectAppleMailIssues(html));
        break;
    }

    return issues;
  }

  private detectOutlookIssues(html: string): CompatibilityIssue[] {
    const issues: CompatibilityIssue[] = [];

    // Check for background images without VML fallback
    if (html.includes('background-image:') && !html.includes('<!--[if mso]>')) {
      issues.push({
        client: 'outlook',
        severity: 'high',
        description: 'Background images may not display in Outlook',
        element: 'background-image',
        suggestedFix: 'Add VML fallback for Outlook compatibility'
      });
    }

    // Check for div-based layouts
    if (html.match(/<div[^>]*style="[^"]*display:\s*flex/gi)) {
      issues.push({
        client: 'outlook',
        severity: 'critical',
        description: 'Flexbox layout not supported in Outlook',
        element: 'div with flexbox',
        suggestedFix: 'Use table-based layout instead of flexbox'
      });
    }

    return issues;
  }

  private detectGmailIssues(html: string): CompatibilityIssue[] {
    const issues: CompatibilityIssue[] = [];

    // Check for embedded styles
    if (html.includes('<style>') && html.includes('</style>')) {
      issues.push({
        client: 'gmail',
        severity: 'medium',
        description: 'Embedded styles may be stripped by Gmail',
        element: 'style tag',
        suggestedFix: 'Inline all critical styles'
      });
    }

    return issues;
  }

  private detectAppleMailIssues(html: string): CompatibilityIssue[] {
    const issues: CompatibilityIssue[] = [];

    // Check for dark mode optimization
    if (!html.includes('@media (prefers-color-scheme: dark)')) {
      issues.push({
        client: 'apple-mail',
        severity: 'low',
        description: 'No dark mode optimization detected',
        element: 'media query',
        suggestedFix: 'Add dark mode media queries for better user experience'
      });
    }

    return issues;
  }

  private deduplicateIssues(issues: CompatibilityIssue[]): CompatibilityIssue[] {
    const seen = new Set<string>();
    return issues.filter(issue => {
      const key = `${issue.client}-${issue.description}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Utility methods
  private generateColorMappings(colorTokens?: ColorToken[]): { [lightColor: string]: string } {
    const mappings: { [lightColor: string]: string } = {};
    
    if (colorTokens) {
      for (const token of colorTokens) {
        if (token.darkModeValue) {
          mappings[token.value] = token.darkModeValue;
        }
      }
    }

    // Default color mappings
    mappings['#ffffff'] = '#1a1a1a';
    mappings['#000000'] = '#ffffff';
    mappings['#f8f9fa'] = '#212529';
    mappings['#e9ecef'] = '#495057';

    return mappings;
  }

  // Initialize compatibility rules and optimization rules
  private initializeCompatibilityRules(): void {
    // Outlook compatibility rules
    this.compatibilityRules.set('outlook', {
      client: 'outlook',
      cssSupport: {
        inlineStyles: true,
        embeddedStyles: false,
        externalStyles: false,
        mediaQueries: false,
        flexbox: false,
        grid: false,
        customProperties: false,
        pseudoClasses: [],
        supportedProperties: ['background-color', 'color', 'font-family', 'font-size', 'text-align'],
        unsupportedProperties: ['display: flex', 'display: grid', 'transform', 'box-shadow']
      },
      htmlSupport: {
        tables: true,
        divs: true,
        semanticElements: false,
        forms: false,
        video: false,
        audio: false,
        svg: false,
        webfonts: false
      },
      imageSupport: {
        formats: ['jpg', 'png', 'gif'],
        maxSize: 1024,
        backgroundImages: false,
        retina: false,
        webp: false,
        svg: false
      },
      darkModeSupport: {
        supported: false,
        method: 'none',
        limitations: ['No dark mode support']
      },
      limitations: ['No flexbox', 'No CSS Grid', 'Limited media query support'],
      workarounds: {
        'background-image': 'Use VML for background images',
        'flexbox': 'Use table-based layout instead'
      }
    });

    // Gmail compatibility rules
    this.compatibilityRules.set('gmail', {
      client: 'gmail',
      cssSupport: {
        inlineStyles: true,
        embeddedStyles: false,
        externalStyles: false,
        mediaQueries: true,
        flexbox: false,
        grid: false,
        customProperties: false,
        pseudoClasses: [':hover'],
        supportedProperties: ['background-color', 'color', 'font-family', 'font-size', 'text-align', 'padding', 'margin'],
        unsupportedProperties: ['display: flex', 'display: grid']
      },
      htmlSupport: {
        tables: true,
        divs: true,
        semanticElements: false,
        forms: false,
        video: false,
        audio: false,
        svg: false,
        webfonts: true
      },
      imageSupport: {
        formats: ['jpg', 'png', 'gif', 'webp'],
        maxSize: 102400, // 100KB limit to avoid clipping
        backgroundImages: true,
        retina: true,
        webp: true,
        svg: false
      },
      darkModeSupport: {
        supported: true,
        method: 'media-query',
        limitations: ['Limited dark mode customization']
      },
      limitations: ['Clips emails over 102KB', 'Strips some embedded styles'],
      workarounds: {
        'large-email': 'Keep total size under 100KB',
        'embedded-styles': 'Inline all critical styles'
      }
    });

    // Apple Mail compatibility rules
    this.compatibilityRules.set('apple-mail', {
      client: 'apple-mail',
      cssSupport: {
        inlineStyles: true,
        embeddedStyles: true,
        externalStyles: false,
        mediaQueries: true,
        flexbox: true,
        grid: false,
        customProperties: true,
        pseudoClasses: [':hover', ':focus', ':active'],
        supportedProperties: ['all'],
        unsupportedProperties: []
      },
      htmlSupport: {
        tables: true,
        divs: true,
        semanticElements: true,
        forms: false,
        video: false,
        audio: false,
        svg: true,
        webfonts: true
      },
      imageSupport: {
        formats: ['jpg', 'png', 'gif', 'webp', 'svg'],
        maxSize: 10240,
        backgroundImages: true,
        retina: true,
        webp: true,
        svg: true
      },
      darkModeSupport: {
        supported: true,
        method: 'media-query',
        limitations: []
      },
      limitations: [],
      workarounds: {}
    });

    // Add more client rules as needed...
  }

  private initializeOptimizationRules(): void {
    this.optimizationRules = [
      {
        name: 'CSS Minification',
        type: 'css',
        description: 'Minify CSS to reduce file size',
        impact: 'medium',
        applied: false
      },
      {
        name: 'HTML Minification',
        type: 'html',
        description: 'Minify HTML to reduce file size',
        impact: 'medium',
        applied: false
      },
      {
        name: 'Image Optimization',
        type: 'image',
        description: 'Optimize images for email delivery',
        impact: 'high',
        applied: false
      },
      {
        name: 'Outlook Table Fix',
        type: 'compatibility',
        description: 'Fix table rendering issues in Outlook',
        impact: 'high',
        applied: false
      },
      {
        name: 'Gmail Size Optimization',
        type: 'performance',
        description: 'Optimize for Gmail 102KB limit',
        impact: 'high',
        applied: false
      }
    ];
  }
}

// Supporting classes for dark mode and performance optimization
class DarkModeProcessor {
  async implementDarkMode(html: string, config: DarkModeConfiguration): Promise<string> {
    let darkModeHtml = html;

    // Add dark mode media query styles
    const darkModeCSS = this.generateDarkModeCSS(config);
    
    // Insert dark mode styles before closing head tag
    if (darkModeHtml.includes('</head>')) {
      darkModeHtml = darkModeHtml.replace(
        '</head>',
        `<style type="text/css">${darkModeCSS}</style></head>`
      );
    } else {
      // If no head tag, add styles at the beginning
      darkModeHtml = `<style type="text/css">${darkModeCSS}</style>${darkModeHtml}`;
    }

    // Apply color mappings to inline styles
    for (const [_lightColor, _darkColor] of Object.entries(config.colorMappings)) {
      // const _colorRegex = new RegExp(`color:\\s*${_lightColor.replace('#', '\\#')}`, 'gi'); // Currently unused
      // const _bgColorRegex = new RegExp(`background-color:\\s*${_lightColor.replace('#', '\\#')}`, 'gi'); // Currently unused
      
      // Note: This is a simplified approach. Production would need more sophisticated parsing
      // to avoid conflicts with existing dark mode styles
    }

    return darkModeHtml;
  }

  private generateDarkModeCSS(config: DarkModeConfiguration): string {
    let css = '@media (prefers-color-scheme: dark) {\n';

    // Apply color mappings
    for (const [lightColor, darkColor] of Object.entries(config.colorMappings)) {
      css += `  [style*="color: ${lightColor}"] { color: ${darkColor} !important; }\n`;
      css += `  [style*="background-color: ${lightColor}"] { background-color: ${darkColor} !important; }\n`;
    }

    // Apply custom rules
    for (const rule of config.customRules) {
      css += `  ${rule.selector} { ${rule.property}: ${rule.darkValue} !important; }\n`;
    }

    css += '}\n';
    return css;
  }
}

class PerformanceOptimizer {
  async optimize(
    html: string,
    targets: PerformanceTargets,
    _strategy: OptimizationStrategy
  ): Promise<string> {
    let optimized = html;

    // Apply compression based on level
    switch (targets.compressionLevel) {
      case 'aggressive':
        optimized = this.aggressiveOptimization(optimized);
        break;
      case 'standard':
        optimized = this.standardOptimization(optimized);
        break;
      case 'none':
        break;
    }

    // Ensure file size is within limits
    if (Buffer.byteLength(optimized, 'utf8') > targets.maxImageSize * 1024) {
      optimized = await this.reduceSizeToTarget(optimized, targets.maxImageSize * 1024);
    }

    return optimized;
  }

  private aggressiveOptimization(html: string): string {
    return minify(html, {
      removeComments: true,
      // removeCDATASectionsFromCDATA: true, // Not supported in current MJML version
      collapseWhitespace: true,
      conservativeCollapse: false,
      removeAttributeQuotes: true,
      useShortDoctype: true,
      removeEmptyAttributes: true,
      removeOptionalTags: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      minifyJS: true,
      minifyCSS: true
    });
  }

  private standardOptimization(html: string): string {
    return minify(html, {
      removeComments: true,
      collapseWhitespace: true,
      conservativeCollapse: true,
      removeEmptyAttributes: true,
      minifyCSS: true
    });
  }

  private async reduceSizeToTarget(html: string, _targetSize: number): Promise<string> {
    // Implement size reduction strategies
    // This is a placeholder - production would implement sophisticated size reduction
    return html;
  }
}

interface OptimizationStrategy {
  priority: 'size' | 'compatibility' | 'performance';
  aggressiveness: 'conservative' | 'moderate' | 'aggressive';
  preserveFormatting: boolean;
} 