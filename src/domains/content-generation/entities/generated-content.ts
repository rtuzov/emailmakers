export interface GeneratedContent {
  id: string;
  contentType: 'subject' | 'preheader' | 'body' | 'cta' | 'footer';
  content: string;
  metadata: {
    wordCount: number;
    tone: string;
    provider: string;
    generatedAt: Date;
    version: number;
  };
  alternatives?: string[];
  quality: {
    score: number;
    readabilityScore: number;
    brandAlignment: number;
    engagement: number;
  };
}

export class GeneratedContentEntity implements GeneratedContent {
  constructor(
    public id: string,
    public contentType: 'subject' | 'preheader' | 'body' | 'cta' | 'footer',
    public content: string,
    public metadata: {
      wordCount: number;
      tone: string;
      provider: string;
      generatedAt: Date;
      version: number;
    },
    public alternatives: string[] = [],
    public quality: {
      score: number;
      readabilityScore: number;
      brandAlignment: number;
      engagement: number;
    } = {
      score: 0.8,
      readabilityScore: 0.8,
      brandAlignment: 0.8,
      engagement: 0.8
    }
  ) {}

  static create(data: Partial<GeneratedContent>): GeneratedContentEntity {
    return new GeneratedContentEntity(
      data.id || crypto.randomUUID(),
      data.contentType || 'body',
      data.content || '',
      data.metadata || {
        wordCount: 0,
        tone: 'professional',
        provider: 'openai',
        generatedAt: new Date(),
        version: 1
      },
      data.alternatives || [],
      data.quality || {
        score: 0.8,
        readabilityScore: 0.8,
        brandAlignment: 0.8,
        engagement: 0.8
      }
    );
  }
} 