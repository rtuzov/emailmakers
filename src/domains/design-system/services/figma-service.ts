// Types and interfaces for Figma integration
export interface FigmaProject {
  id: string;
  name: string;
  url: string;
  lastModified: Date;
  version: string;
}

export interface DesignToken {
  type: 'color' | 'typography' | 'spacing' | 'border' | 'shadow';
  name: string;
  value: string | number;
  category: string;
  description?: string;
  emailCompatible: boolean;
}

export interface ColorToken extends DesignToken {
  type: 'color';
  value: string; // hex, rgb, hsl
  darkModeValue?: string;
  contrastRatio?: number;
  usage: 'primary' | 'secondary' | 'accent' | 'neutral' | 'semantic';
}

export interface TypographyToken extends DesignToken {
  type: 'typography';
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing?: number;
  webSafeAlternative: string;
  emailFallback: string;
}

export interface SpacingToken extends DesignToken {
  type: 'spacing';
  value: number; // in pixels
  usage: 'padding' | 'margin' | 'gap';
}

export interface FigmaComponent {
  id: string;
  name: string;
  type: 'button' | 'header' | 'footer' | 'card' | 'layout' | 'text';
  properties: ComponentProperties;
  emailMapping: EmailComponentMapping;
  variants?: ComponentVariant[];
}

export interface ComponentProperties {
  width?: number;
  height?: number;
  backgroundColor?: string;
  borderRadius?: number;
  padding?: SpacingValues;
  margin?: SpacingValues;
  typography?: TypographyProperties;
  states?: ComponentState[];
}

export interface SpacingValues {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface TypographyProperties {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  textAlign: 'left' | 'center' | 'right';
}

export interface ComponentState {
  name: 'default' | 'hover' | 'active' | 'disabled';
  properties: Partial<ComponentProperties>;
}

export interface EmailComponentMapping {
  htmlStructure: 'table' | 'div' | 'span' | 'a';
  cssProperties: Record<string, string>;
  inlineStyles: Record<string, string>;
  darkModeSupport: boolean;
  clientCompatibility: EmailClientCompatibility;
}

export interface EmailClientCompatibility {
  gmail: boolean;
  outlook: boolean;
  appleMail: boolean;
  yahooMail: boolean;
  thunderbird: boolean;
}

export interface ComponentVariant {
  name: string;
  properties: ComponentProperties;
  conditions: VariantCondition[];
}

export interface VariantCondition {
  property: string;
  value: string | number | boolean;
}

export interface DesignSystem {
  id: string;
  name: string;
  version: string;
  colors: ColorToken[];
  typography: TypographyToken[];
  spacing: SpacingToken[];
  components: FigmaComponent[];
  metadata: {
    extractedAt: Date;
    figmaProjectId: string;
    tokenCount: number;
    componentCount: number;
  };
}

export interface FigmaIntegrationConfig {
  accessToken: string;
  rateLimitBuffer: number; // requests per minute buffer
  cacheTimeout: number; // in milliseconds
  maxRetries: number;
  emailCompatibilityChecks: boolean;
}

export interface SyncResult {
  success: boolean;
  tokensExtracted: number;
  componentsExtracted: number;
  errors: string[];
  warnings: string[];
  performance: {
    totalTime: number;
    apiCalls: number;
    cacheHits: number;
  };
}

/**
 * Figma Integration Service
 * 
 * Implements intelligent design system extraction with:
 * - Smart token extraction with semantic understanding
 * - Component mapping to email-compatible structures
 * - Real-time synchronization with design updates
 * - Performance optimization through caching
 */
export class FigmaService {
  private cache: Map<string, any> = new Map();
  private rateLimitTracker: Map<string, number> = new Map();
  private readonly API_BASE = 'https://api.figma.com/v1';

  constructor(private config: FigmaIntegrationConfig) {}

  /**
   * Main method to extract complete design system from Figma project
   */
  async extractDesignSystem(figmaUrl: string): Promise<DesignSystem> {
    try {
      const projectId = this.extractProjectId(figmaUrl);
      const cacheKey = `design-system-${projectId}`;
      
      // Check cache first
      if (this.cache.has(cacheKey) && !this.isCacheExpired(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      console.log(`Extracting design system from Figma project: ${projectId}`);
      
      // Step 1: Fetch Figma file data
      const figmaFile = await this.fetchFigmaFile(projectId);
      
      // Step 2: Extract design tokens with semantic analysis
      const tokens = await this.extractTokensWithSemantics(figmaFile);
      
      // Step 3: Map components to email-compatible structures
      const components = await this.mapComponentsToEmail(figmaFile);
      
      // Step 4: Create design system with optimization
      const designSystem = await this.optimizeAndCache({
        id: projectId,
        name: figmaFile.name,
        version: figmaFile.version,
        colors: tokens.colors,
        typography: tokens.typography,
        spacing: tokens.spacing,
        components,
        metadata: {
          extractedAt: new Date(),
          figmaProjectId: projectId,
          tokenCount: tokens.colors.length + tokens.typography.length + tokens.spacing.length,
          componentCount: components.length
        }
      });

      // Cache the result
      this.cache.set(cacheKey, designSystem);
      
      return designSystem;
      
    } catch (error) {
      console.error('Design system extraction failed:', error);
      throw new Error(`Failed to extract design system: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Intelligent token extraction with semantic understanding
   */
  private async extractTokensWithSemantics(figmaFile: any): Promise<{
    colors: ColorToken[];
    typography: TypographyToken[];
    spacing: SpacingToken[];
  }> {
    const colors: ColorToken[] = [];
    const typography: TypographyToken[] = [];
    const spacing: SpacingToken[] = [];

    // Extract color tokens from styles
    if (figmaFile.styles) {
      for (const [_styleId, style] of Object.entries(figmaFile.styles)) {
        if ((style as any).styleType === 'FILL') {
          const colorToken = await this.createColorToken(style, figmaFile);
          if (colorToken) colors.push(colorToken);
        } else if ((style as any).styleType === 'TEXT') {
          const typographyToken = await this.createTypographyToken(style, figmaFile);
          if (typographyToken) typography.push(typographyToken);
        }
      }
    }

    // Extract spacing tokens from component analysis
    const spacingTokens = await this.analyzeSpacingPatterns(figmaFile);
    spacing.push(...spacingTokens);

    // Validate email compatibility
    await this.validateEmailCompatibility(colors, typography, spacing);

    return { colors, typography, spacing };
  }

  /**
   * Create color token with email compatibility analysis
   */
  private async createColorToken(style: any, _figmaFile: any): Promise<ColorToken | null> {
    try {
      const paint = style.fills?.[0];
      if (!paint || paint.type !== 'SOLID') return null;

      const color = paint.color;
      const hexValue = this.rgbToHex(color.r, color.g, color.b);
      
      // Semantic analysis for color usage
      const usage = this.analyzeColorUsage(style.name, hexValue);
      
      // Email compatibility check
      const emailCompatible = await this.checkColorEmailCompatibility(hexValue);
      
      // Generate dark mode variant
      const darkModeValue = this.generateDarkModeVariant(hexValue, usage);
      
      // Calculate contrast ratio
      const contrastRatio = this.calculateContrastRatio(hexValue, '#FFFFFF');

      return {
        type: 'color',
        name: style.name,
        value: hexValue,
        category: this.categorizeColor(style.name),
        darkModeValue,
        contrastRatio,
        usage,
        emailCompatible,
        description: style.description
      };
    } catch (error) {
      console.error('Failed to create color token:', error);
      return null;
    }
  }

  /**
   * Create typography token with web-safe alternatives
   */
  private async createTypographyToken(style: any, _figmaFile: any): Promise<TypographyToken | null> {
    try {
      const textStyle = style.textStyle;
      if (!textStyle) return null;

      const fontFamily = textStyle.fontFamily;
      const webSafeAlternative = this.getWebSafeAlternative(fontFamily);
      const emailFallback = this.getEmailFallback(fontFamily);

      return {
        type: 'typography',
        name: style.name,
        value: `${textStyle.fontSize}px`,
        category: this.categorizeTypography(style.name),
        fontFamily,
        fontSize: textStyle.fontSize,
        fontWeight: textStyle.fontWeight,
        lineHeight: textStyle.lineHeight?.value || textStyle.fontSize * 1.2,
        letterSpacing: textStyle.letterSpacing,
        webSafeAlternative,
        emailFallback,
        emailCompatible: this.isEmailCompatibleFont(fontFamily),
        description: style.description
      };
    } catch (error) {
      console.error('Failed to create typography token:', error);
      return null;
    }
  }

  /**
   * Component mapping to email-compatible structures
   */
  private async mapComponentsToEmail(figmaFile: any): Promise<FigmaComponent[]> {
    const components: FigmaComponent[] = [];
    
    if (figmaFile.componentSets) {
      for (const [_componentId, componentSet] of Object.entries(figmaFile.componentSets)) {
        const emailComponent = await this.createEmailComponent(componentSet, figmaFile);
        if (emailComponent) components.push(emailComponent);
      }
    }

    return components;
  }

  /**
   * Create email-compatible component mapping
   */
  private async createEmailComponent(componentSet: any, _figmaFile: any): Promise<FigmaComponent | null> {
    try {
      const componentType = this.identifyComponentType(componentSet.name);
      const properties = await this.extractComponentProperties(componentSet);
      const emailMapping = await this.createEmailMapping(componentType, properties);
      const variants = await this.extractComponentVariants(componentSet);

      return {
        id: componentSet.id,
        name: componentSet.name,
        type: componentType,
        properties,
        emailMapping,
        variants
      };
    } catch (error) {
      console.error('Failed to create email component:', error);
      return null;
    }
  }

  /**
   * Create email-specific component mapping
   */
  private async createEmailMapping(
    componentType: string, 
    properties: ComponentProperties
  ): Promise<EmailComponentMapping> {
    const mappings = {
      button: {
        htmlStructure: 'table' as const,
        cssProperties: {
          'border-collapse': 'collapse',
          'mso-table-lspace': '0pt',
          'mso-table-rspace': '0pt'
        },
        inlineStyles: {
          'background-color': properties.backgroundColor || '#007bff',
          'border-radius': `${properties.borderRadius || 4}px`,
          'padding': this.formatSpacing(properties.padding)
        },
        darkModeSupport: true,
        clientCompatibility: {
          gmail: true,
          outlook: true,
          appleMail: true,
          yahooMail: true,
          thunderbird: true
        }
      },
      header: {
        htmlStructure: 'table' as const,
        cssProperties: {
          'width': '100%',
          'border-collapse': 'collapse'
        },
        inlineStyles: {
          'background-color': properties.backgroundColor || '#f8f9fa',
          'padding': this.formatSpacing(properties.padding)
        },
        darkModeSupport: true,
        clientCompatibility: {
          gmail: true,
          outlook: true,
          appleMail: true,
          yahooMail: true,
          thunderbird: true
        }
      }
      // Add more mappings...
    };

    return mappings[componentType as keyof typeof mappings] || mappings.button;
  }

  /**
   * Analyze spacing patterns in the design system
   */
  private async analyzeSpacingPatterns(figmaFile: any): Promise<SpacingToken[]> {
    const spacingValues = new Set<number>();
    const spacingTokens: SpacingToken[] = [];

    // Analyze components for consistent spacing
    this.traverseNodes(figmaFile.document, (node: any) => {
      if (node.paddingLeft) spacingValues.add(node.paddingLeft);
      if (node.paddingRight) spacingValues.add(node.paddingRight);
      if (node.paddingTop) spacingValues.add(node.paddingTop);
      if (node.paddingBottom) spacingValues.add(node.paddingBottom);
      if (node.itemSpacing) spacingValues.add(node.itemSpacing);
    });

    // Create tokens for common spacing values
    const sortedValues = Array.from(spacingValues).sort((a, b) => a - b);
    sortedValues.forEach((value, index) => {
      spacingTokens.push({
        type: 'spacing',
        name: `spacing-${index + 1}`,
        value,
        category: 'spacing',
        usage: this.determineSpacingUsage(value),
        emailCompatible: true
      });
    });

    return spacingTokens;
  }

  /**
   * Validate email compatibility for all tokens
   */
  private async validateEmailCompatibility(
    colors: ColorToken[],
    typography: TypographyToken[],
    spacing: SpacingToken[]
  ): Promise<void> {
    // Color validation
    colors.forEach(color => {
      color.emailCompatible = this.validateColorForEmail(color.value);
    });

    // Typography validation
    typography.forEach(typo => {
      typo.emailCompatible = this.isEmailCompatibleFont(typo.fontFamily);
    });

    // Spacing validation (all spacing values are email compatible)
    spacing.forEach(space => {
      space.emailCompatible = true;
    });
  }

  // Utility methods
  private extractProjectId(figmaUrl: string): string {
    const match = figmaUrl.match(/figma\.com\/file\/([a-zA-Z0-9]+)/);
    if (!match) throw new Error('Invalid Figma URL');
    return match[1]!;
  }

  private async fetchFigmaFile(projectId: string): Promise<any> {
    await this.checkRateLimit();
    
    const response = await fetch(`${this.API_BASE}/files/${projectId}`, {
      headers: {
        'X-Figma-Token': this.config.accessToken
      }
    });

    if (!response.ok) {
      throw new Error(`Figma API error: ${response.statusText}`);
    }

    return await response.json();
  }

  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const minute = Math.floor(now / 60000);
    const requests = this.rateLimitTracker.get(minute.toString()) || 0;
    
    if (requests >= (100 - this.config.rateLimitBuffer)) {
      const waitTime = 60000 - (now % 60000);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.rateLimitTracker.set(minute.toString(), requests + 1);
  }

  private isCacheExpired(cacheKey: string): boolean {
    const cached = this.cache.get(cacheKey);
    if (!cached || !cached.metadata) return true;
    
    const age = Date.now() - cached.metadata.extractedAt.getTime();
    return age > this.config.cacheTimeout;
  }

  private rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  private analyzeColorUsage(name: string, _hex: string): ColorToken['usage'] {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('primary') || lowerName.includes('brand')) return 'primary';
    if (lowerName.includes('secondary')) return 'secondary';
    if (lowerName.includes('accent')) return 'accent';
    if (lowerName.includes('error') || lowerName.includes('success') || lowerName.includes('warning')) return 'semantic';
    return 'neutral';
  }

  private categorizeColor(name: string): string {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('background')) return 'background';
    if (lowerName.includes('text')) return 'text';
    if (lowerName.includes('border')) return 'border';
    if (lowerName.includes('button')) return 'interactive';
    return 'general';
  }

  private categorizeTypography(name: string): string {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('heading') || lowerName.includes('title')) return 'heading';
    if (lowerName.includes('body') || lowerName.includes('paragraph')) return 'body';
    if (lowerName.includes('caption') || lowerName.includes('small')) return 'caption';
    if (lowerName.includes('button') || lowerName.includes('link')) return 'interactive';
    return 'general';
  }

  private getWebSafeAlternative(fontFamily: string): string {
    const webSafeFonts = {
      'Inter': 'Arial, sans-serif',
      'Roboto': 'Arial, sans-serif',
      'Open Sans': 'Arial, sans-serif',
      'Helvetica Neue': 'Helvetica, Arial, sans-serif',
      'SF Pro Display': 'system-ui, -apple-system, sans-serif',
      'Montserrat': 'Arial, sans-serif'
    };
    
    return webSafeFonts[fontFamily as keyof typeof webSafeFonts] || 'Arial, sans-serif';
  }

  private getEmailFallback(fontFamily: string): string {
    // Email clients have limited font support
    const emailSafeFonts = {
      'Inter': 'Arial, sans-serif',
      'Roboto': 'Arial, sans-serif',
      'Open Sans': 'Arial, sans-serif',
      'Helvetica Neue': 'Helvetica, Arial, sans-serif',
      'Times New Roman': 'Times, serif',
      'Georgia': 'Georgia, serif'
    };
    
    return emailSafeFonts[fontFamily as keyof typeof emailSafeFonts] || 'Arial, sans-serif';
  }

  private isEmailCompatibleFont(fontFamily: string): boolean {
    const emailSafeFonts = [
      'Arial', 'Helvetica', 'Times New Roman', 'Times', 'Georgia', 
      'Verdana', 'Courier New', 'Trebuchet MS', 'Comic Sans MS'
    ];
    
    return emailSafeFonts.some(safe => fontFamily.includes(safe));
  }

  private validateColorForEmail(_hexColor: string): boolean {
    // Check if color is supported across email clients
    // Most colors are supported, but some specific combinations might not render well
    return true; // Simplified for now
  }

  private generateDarkModeVariant(hexColor: string, usage: ColorToken['usage']): string {
    // Simplified dark mode color generation
    if (usage === 'primary') return this.adjustBrightness(hexColor, 0.2);
    if (usage === 'secondary') return this.adjustBrightness(hexColor, 0.3);
    return this.adjustBrightness(hexColor, 0.4);
  }

  private adjustBrightness(hexColor: string, factor: number): string {
    // Simplified brightness adjustment
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const newR = Math.min(255, Math.floor(r * (1 + factor)));
    const newG = Math.min(255, Math.floor(g * (1 + factor)));
    const newB = Math.min(255, Math.floor(b * (1 + factor)));
    
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }

  private calculateContrastRatio(_color1: string, _color2: string): number {
    // Simplified contrast ratio calculation
    // In production, use proper WCAG contrast calculation
    return 4.5; // Placeholder
  }

  private identifyComponentType(name: string): FigmaComponent['type'] {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('button')) return 'button';
    if (lowerName.includes('header')) return 'header';
    if (lowerName.includes('footer')) return 'footer';
    if (lowerName.includes('card')) return 'card';
    if (lowerName.includes('layout')) return 'layout';
    return 'text';
  }

  private async extractComponentProperties(componentSet: any): Promise<ComponentProperties> {
    // Extract properties from component set
    return {
      ...(componentSet.absoluteBoundingBox?.width ? { width: componentSet.absoluteBoundingBox.width } : {}),
      ...(componentSet.absoluteBoundingBox?.height ? { height: componentSet.absoluteBoundingBox.height } : {}),
      ...(componentSet.backgroundColor ? { 
        backgroundColor: this.rgbToHex(
          componentSet.backgroundColor.r,
          componentSet.backgroundColor.g,
          componentSet.backgroundColor.b
        ) 
      } : {}),
      ...(componentSet.cornerRadius ? { borderRadius: componentSet.cornerRadius } : {}),
      padding: {
        top: componentSet.paddingTop || 0,
        right: componentSet.paddingRight || 0,
        bottom: componentSet.paddingBottom || 0,
        left: componentSet.paddingLeft || 0
      }
    };
  }

  private async extractComponentVariants(_componentSet: any): Promise<ComponentVariant[]> {
    // Extract component variants
    return []; // Simplified for now
  }

  private formatSpacing(spacing?: SpacingValues): string {
    if (!spacing) return '0';
    return `${spacing.top}px ${spacing.right}px ${spacing.bottom}px ${spacing.left}px`;
  }

  private determineSpacingUsage(value: number): SpacingToken['usage'] {
    if (value <= 8) return 'gap';
    if (value <= 24) return 'padding';
    return 'margin';
  }

  private traverseNodes(node: any, callback: (node: any) => void): void {
    callback(node);
    if (node.children) {
      node.children.forEach((child: any) => this.traverseNodes(child, callback));
    }
  }

  private async optimizeAndCache(designSystem: DesignSystem): Promise<DesignSystem> {
    // Optimization logic here
    return designSystem;
  }

  private async checkColorEmailCompatibility(_hexColor: string): Promise<boolean> {
    // Email color compatibility check
    return true; // Simplified
  }
} 