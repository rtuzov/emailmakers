export interface QualityReport {
  id: string;
  templateId: string;
  overallScore: number;
  timestamp: Date;
  validation: {
    isValid: boolean;
    score: number;
    issues: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      line?: number;
      column?: number;
      rule?: string;
    }>;
  };
  accessibility: {
    score: number;
    issues: Array<{
      rule: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      element: string;
      description: string;
      suggestion: string;
    }>;
    wcagLevel: 'AA' | 'AAA';
  };
  performance: {
    fileSize: number;
    loadTime: number;
    imageOptimization: number;
    cssOptimization: number;
  };
  compatibility: {
    clients: Array<{
      name: string;
      score: number;
      issues: string[];
    }>;
    overallCompatibility: number;
  };
  recommendations: string[];
}

export class QualityReportEntity implements QualityReport {
  constructor(
    public id: string,
    public templateId: string,
    public overallScore: number,
    public timestamp: Date,
    public validation: {
      isValid: boolean;
      score: number;
      issues: Array<{
        type: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        message: string;
        line?: number;
        column?: number;
        rule?: string;
      }>;
    },
    public accessibility: {
      score: number;
      issues: Array<{
        rule: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        element: string;
        description: string;
        suggestion: string;
      }>;
      wcagLevel: 'AA' | 'AAA';
    },
    public performance: {
      fileSize: number;
      loadTime: number;
      imageOptimization: number;
      cssOptimization: number;
    },
    public compatibility: {
      clients: Array<{
        name: string;
        score: number;
        issues: string[];
      }>;
      overallCompatibility: number;
    },
    public recommendations: string[]
  ) {}

  static create(data: Partial<QualityReport>): QualityReportEntity {
    return new QualityReportEntity(
      data.id || crypto.randomUUID(),
      data.templateId || '',
      data.overallScore || 0.8,
      data.timestamp || new Date(),
      data.validation || {
        isValid: true,
        score: 0.9,
        issues: []
      },
      data.accessibility || {
        score: 0.85,
        issues: [],
        wcagLevel: 'AA'
      },
      data.performance || {
        fileSize: 0,
        loadTime: 0,
        imageOptimization: 1,
        cssOptimization: 1
      },
      data.compatibility || {
        clients: [],
        overallCompatibility: 0.9
      },
      data.recommendations || []
    );
  }
} 