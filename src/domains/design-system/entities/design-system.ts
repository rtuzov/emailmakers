export interface DesignSystemTokens {
  colors: Array<{
    name: string;
    value: string;
    darkModeValue?: string;
    semanticMeaning: string;
  }>;
  typography: Array<{
    name: string;
    fontFamily: string;
    fontSize: number;
    fontWeight: number;
    lineHeight: number;
    emailFallback: string;
  }>;
  spacing: Array<{
    name: string;
    value: number;
    usage: 'margin' | 'padding' | 'gap';
  }>;
  components: Array<{
    name: string;
    mjmlTag: string;
    defaultStyles: { [key: string]: string };
  }>;
}

export interface DesignSystem {
  id: string;
  name: string;
  version: string;
  tokens: DesignSystemTokens;
  components: Array<{
    id: string;
    name: string;
    type: string;
    properties: { [key: string]: any };
  }>;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    source: 'figma' | 'manual' | 'imported';
    figmaFileId?: string;
  };
}

export class DesignSystemEntity implements DesignSystem {
  constructor(
    public id: string,
    public name: string,
    public version: string,
    public tokens: DesignSystemTokens,
    public components: Array<{
      id: string;
      name: string;
      type: string;
      properties: { [key: string]: any };
    }>,
    public metadata: {
      createdAt: Date;
      updatedAt: Date;
      source: 'figma' | 'manual' | 'imported';
      figmaFileId?: string;
    }
  ) {}

  static create(data: Partial<DesignSystem>): DesignSystemEntity {
    return new DesignSystemEntity(
      data.id || crypto.randomUUID(),
      data.name || 'Untitled Design System',
      data.version || '1.0.0',
      data.tokens || {
        colors: [],
        typography: [],
        spacing: [],
        components: []
      },
      data.components || [],
      data.metadata || {
        createdAt: new Date(),
        updatedAt: new Date(),
        source: 'manual'
      }
    );
  }
} 