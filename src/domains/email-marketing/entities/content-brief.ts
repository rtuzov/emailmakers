export interface BriefAttachment {
  id: string;
  name: string;
  type: 'image' | 'document' | 'figma_url' | 'brand_guidelines';
  url: string;
  size?: number;
  metadata?: Record<string, any>;
}

export interface BrandGuidelines {
  tone: 'professional' | 'casual' | 'friendly' | 'formal' | 'playful' | 'urgent';
  voice: 'authoritative' | 'conversational' | 'empathetic' | 'enthusiastic' | 'informative';
  values: string[];
  prohibitedWords: string[];
  preferredLanguage: string;
  colorPalette?: {
    primary: string;
    secondary: string;
    accent: string;
    neutral: string;
  };
  typography?: {
    primaryFont: string;
    secondaryFont: string;
    fallbackFonts: string[];
  };
}

export interface TargetAudience {
  demographics: {
    ageRange?: string;
    gender?: string;
    location?: string;
    income?: string;
    education?: string;
  };
  psychographics: {
    interests: string[];
    values: string[];
    lifestyle: string[];
    painPoints: string[];
  };
  behavior: {
    purchaseHistory?: string;
    engagementLevel?: 'high' | 'medium' | 'low';
    preferredChannels: string[];
    deviceUsage: 'mobile' | 'desktop' | 'both';
  };
}

export interface CampaignContext {
  type: 'newsletter' | 'promotional' | 'transactional' | 'welcome' | 'abandonment' | 'survey' | 'announcement';
  industry: string;
  seasonality?: 'spring' | 'summer' | 'fall' | 'winter' | 'holiday' | 'back-to-school' | 'none';
  urgency: 'low' | 'medium' | 'high';
  competitiveContext?: string;
  previousCampaigns?: string[];
}

export interface ContentRequirements {
  subjectLineRequirements?: {
    maxLength: number;
    includeEmoji: boolean;
    personalization: boolean;
    urgencyLevel: 'low' | 'medium' | 'high';
  };
  bodyRequirements?: {
    wordCount: 'short' | 'medium' | 'long'; // short: <150, medium: 150-300, long: >300
    includeImages: boolean;
    includeCTA: boolean;
    ctaCount: number;
    personalization: boolean;
  };
  designRequirements?: {
    layout: 'single-column' | 'two-column' | 'newsletter' | 'promotional';
    colorScheme: 'brand' | 'seasonal' | 'minimal' | 'vibrant';
    imageStyle: 'photography' | 'illustration' | 'mixed' | 'none';
  };
}

export class ContentBrief {
  public readonly id: string;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(
    public readonly type: 'text' | 'json' | 'figma_url',
    public readonly content: string,
    public readonly title?: string,
    public readonly description?: string,
    public readonly attachments?: BriefAttachment[],
    public readonly brandGuidelines?: BrandGuidelines,
    public readonly targetAudience?: TargetAudience,
    public readonly campaignContext?: CampaignContext,
    public readonly contentRequirements?: ContentRequirements,
    public readonly metadata?: Record<string, any>
  ) {
    this.id = this.generateId();
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Create ContentBrief from text input
   */
  static fromText(
    content: string,
    title?: string,
    description?: string,
    options?: {
      brandGuidelines?: BrandGuidelines;
      targetAudience?: TargetAudience;
      campaignContext?: CampaignContext;
      contentRequirements?: ContentRequirements;
    }
  ): ContentBrief {
    return new ContentBrief(
      'text',
      content,
      title,
      description,
      undefined,
      options?.brandGuidelines,
      options?.targetAudience,
      options?.campaignContext,
      options?.contentRequirements
    );
  }

  /**
   * Create ContentBrief from JSON input
   */
  static fromJSON(
    jsonContent: string,
    title?: string,
    description?: string
  ): ContentBrief {
    try {
      const parsed = JSON.parse(jsonContent);
      
      return new ContentBrief(
        'json',
        jsonContent,
        title || parsed.title,
        description || parsed.description,
        parsed.attachments,
        parsed.brandGuidelines,
        parsed.targetAudience,
        parsed.campaignContext,
        parsed.contentRequirements,
        parsed.metadata
      );
    } catch (error) {
      throw new Error(`Invalid JSON content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create ContentBrief from Figma URL
   */
  static fromFigmaURL(
    figmaUrl: string,
    title?: string,
    description?: string,
    options?: {
      brandGuidelines?: BrandGuidelines;
      targetAudience?: TargetAudience;
      campaignContext?: CampaignContext;
      contentRequirements?: ContentRequirements;
    }
  ): ContentBrief {
    if (!this.isValidFigmaURL(figmaUrl)) {
      throw new Error('Invalid Figma URL format');
    }

    const attachments: BriefAttachment[] = [{
      id: this.generateAttachmentId(),
      name: 'Figma Design System',
      type: 'figma_url',
      url: figmaUrl,
      metadata: {
        extractedAt: new Date().toISOString()
      }
    }];

    return new ContentBrief(
      'figma_url',
      figmaUrl,
      title,
      description,
      attachments,
      options?.brandGuidelines,
      options?.targetAudience,
      options?.campaignContext,
      options?.contentRequirements
    );
  }

  /**
   * Validate the content brief
   */
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate content
    if (!this.content || this.content.trim().length === 0) {
      errors.push('Content cannot be empty');
    }

    if (this.content.length > 10000) {
      errors.push('Content too long (max 10,000 characters)');
    }

    // Validate JSON format if type is JSON
    if (this.type === 'json') {
      try {
        JSON.parse(this.content);
      } catch (error) {
        errors.push('Invalid JSON format');
      }
    }

    // Validate Figma URL if type is figma_url
    if (this.type === 'figma_url') {
      if (!ContentBrief.isValidFigmaURL(this.content)) {
        errors.push('Invalid Figma URL format');
      }
    }

    // Validate brand guidelines
    if (this.brandGuidelines) {
      if (this.brandGuidelines.prohibitedWords && this.brandGuidelines.prohibitedWords.length > 100) {
        errors.push('Too many prohibited words (max 100)');
      }
    }

    // Validate content requirements
    if (this.contentRequirements?.bodyRequirements?.ctaCount && 
        this.contentRequirements.bodyRequirements.ctaCount > 5) {
      errors.push('Too many CTAs requested (max 5)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get word count of content
   */
  getWordCount(): number {
    return this.content.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Get character count of content
   */
  getCharacterCount(): number {
    return this.content.length;
  }

  /**
   * Check if brief has attachments
   */
  hasAttachments(): boolean {
    return Boolean(this.attachments && this.attachments.length > 0);
  }

  /**
   * Get attachments by type
   */
  getAttachmentsByType(type: BriefAttachment['type']): BriefAttachment[] {
    return this.attachments?.filter(attachment => attachment.type === type) || [];
  }

  /**
   * Get Figma URLs from attachments
   */
  getFigmaURLs(): string[] {
    return this.getAttachmentsByType('figma_url').map(attachment => attachment.url);
  }

  /**
   * Get brand guidelines or create default ones
   */
  getBrandGuidelinesOrDefault(): BrandGuidelines {
    return this.brandGuidelines || {
      tone: 'professional',
      voice: 'conversational',
      values: [],
      prohibitedWords: [],
      preferredLanguage: 'en'
    };
  }

  /**
   * Get campaign context or create default
   */
  getCampaignContextOrDefault(): CampaignContext {
    return this.campaignContext || {
      type: 'newsletter',
      industry: 'general',
      urgency: 'medium'
    };
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): any {
    return {
      id: this.id,
      type: this.type,
      content: this.content,
      title: this.title,
      description: this.description,
      attachments: this.attachments,
      brandGuidelines: this.brandGuidelines,
      targetAudience: this.targetAudience,
      campaignContext: this.campaignContext,
      contentRequirements: this.contentRequirements,
      metadata: this.metadata,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      wordCount: this.getWordCount(),
      characterCount: this.getCharacterCount()
    };
  }

  /**
   * Create a copy with updated content
   */
  withUpdatedContent(newContent: string): ContentBrief {
    return new ContentBrief(
      this.type,
      newContent,
      this.title,
      this.description,
      this.attachments,
      this.brandGuidelines,
      this.targetAudience,
      this.campaignContext,
      this.contentRequirements,
      this.metadata
    );
  }

  /**
   * Create a copy with updated brand guidelines
   */
  withBrandGuidelines(brandGuidelines: BrandGuidelines): ContentBrief {
    return new ContentBrief(
      this.type,
      this.content,
      this.title,
      this.description,
      this.attachments,
      brandGuidelines,
      this.targetAudience,
      this.campaignContext,
      this.contentRequirements,
      this.metadata
    );
  }

  /**
   * Generate unique ID for brief
   */
  private generateId(): string {
    return `brief_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique ID for attachment
   */
  private static generateAttachmentId(): string {
    return `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate Figma URL format
   */
  private static isValidFigmaURL(url: string): boolean {
    const figmaUrlPattern = /^https:\/\/(www\.)?figma\.com\/(file|proto)\/[A-Za-z0-9]{22,128}\/[A-Za-z0-9\-_%]+/;
    return figmaUrlPattern.test(url);
  }
}

/**
 * Content Brief Builder for fluent construction
 */
export class ContentBriefBuilder {
  private type: 'text' | 'json' | 'figma_url' = 'text';
  private content: string = '';
  private title?: string;
  private description?: string;
  private attachments?: BriefAttachment[];
  private brandGuidelines?: BrandGuidelines;
  private targetAudience?: TargetAudience;
  private campaignContext?: CampaignContext;
  private contentRequirements?: ContentRequirements;
  private metadata?: Record<string, any>;

  static create(): ContentBriefBuilder {
    return new ContentBriefBuilder();
  }

  withText(content: string): ContentBriefBuilder {
    this.type = 'text';
    this.content = content;
    return this;
  }

  withJSON(jsonContent: string): ContentBriefBuilder {
    this.type = 'json';
    this.content = jsonContent;
    return this;
  }

  withFigmaURL(figmaUrl: string): ContentBriefBuilder {
    this.type = 'figma_url';
    this.content = figmaUrl;
    return this;
  }

  withTitle(title: string): ContentBriefBuilder {
    this.title = title;
    return this;
  }

  withDescription(description: string): ContentBriefBuilder {
    this.description = description;
    return this;
  }

  withBrandGuidelines(brandGuidelines: BrandGuidelines): ContentBriefBuilder {
    this.brandGuidelines = brandGuidelines;
    return this;
  }

  withTargetAudience(targetAudience: TargetAudience): ContentBriefBuilder {
    this.targetAudience = targetAudience;
    return this;
  }

  withCampaignContext(campaignContext: CampaignContext): ContentBriefBuilder {
    this.campaignContext = campaignContext;
    return this;
  }

  withContentRequirements(contentRequirements: ContentRequirements): ContentBriefBuilder {
    this.contentRequirements = contentRequirements;
    return this;
  }

  withMetadata(metadata: Record<string, any>): ContentBriefBuilder {
    this.metadata = metadata;
    return this;
  }

  build(): ContentBrief {
    return new ContentBrief(
      this.type,
      this.content,
      this.title,
      this.description,
      this.attachments,
      this.brandGuidelines,
      this.targetAudience,
      this.campaignContext,
      this.contentRequirements,
      this.metadata
    );
  }
} 