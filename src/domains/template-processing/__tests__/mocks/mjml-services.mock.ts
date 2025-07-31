/**
 * 🧪 MJML Services Mock
 * 
 * Mock implementations for all MJML domain services
 * Provides predictable responses for testing
 */

import { 
  MjmlGenerationRequest,
  MjmlGenerationResult,
  ValidationResult,
  RenderingResult,
  EmailClient,
  PerformanceMetrics,
  CachedTemplate
} from '../../interfaces/mjml-generator.interface';
import { MjmlTemplate } from '../../entities/mjml-template.entity';
import { EmailTemplate } from '../../entities/email-template.entity';
import { CompleteMjmlGenerationResult } from '../../services/mjml-generation.service';

// Mock data constants
export const MOCK_MJML_CONTENT = `<mjml>
  <mj-head>
    <mj-title>Test Email</mj-title>
    <mj-preview>Test preview</mj-preview>
  </mj-head>
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-text>Hello World</mj-text>
        <mj-button href="https://example.com">Click Here</mj-button>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;

export const MOCK_HTML_CONTENT = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Test Email</title>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
</head>
<body>
  <table width="600" cellpadding="0" cellspacing="0">
    <tr><td>Hello World</td></tr>
    <tr><td><a href="https://example.com">Click Here</a></td></tr>
  </table>
</body>
</html>`;

export const MOCK_VALIDATION_RESULT: ValidationResult = {
  isValid: true,
  errors: [],
  warnings: [],
  score: 95
};

export const MOCK_PERFORMANCE_METRICS: PerformanceMetrics = {
  generationTime: 150,
  templateSize: 2048,
  complexityScore: 25,
  resourceUsage: {
    memoryMB: 1.5,
    cpuTime: 120,
    cacheHits: 0,
    cacheMisses: 1
  }
};

/**
 * Mock MJML Generator Service
 */
export class MockMjmlGeneratorService {
  private shouldFail: boolean = false;
  private generationDelay: number = 100;

  async generate(request: MjmlGenerationRequest): Promise<MjmlGenerationResult> {
    if (this.shouldFail) {
      throw new Error('Mock generation failure');
    }

    await this.delay(this.generationDelay);

    return {
      mjmlContent: MOCK_MJML_CONTENT,
      metadata: {
        templateId: 'mock-template-id',
        generatedAt: new Date(),
        version: '1.0.0',
        layoutType: 'gallery-focused',
        sectionsCount: 1,
        assetsUsed: 0
      },
      validation: MOCK_VALIDATION_RESULT,
      performance: MOCK_PERFORMANCE_METRICS
    };
  }

  validateRequest(request: MjmlGenerationRequest): ValidationResult {
    if (!request.contentContext) {
      return {
        isValid: false,
        errors: [{
          code: 'MISSING_CONTENT',
          message: 'Content context is required',
          severity: 'critical',
          location: 'request'
        }],
        warnings: [],
        score: 0
      };
    }

    return MOCK_VALIDATION_RESULT;
  }

  // Test utilities
  setShouldFail(fail: boolean) {
    this.shouldFail = fail;
  }

  setGenerationDelay(delay: number) {
    this.generationDelay = delay;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Mock Template Renderer Service
 */
export class MockTemplateRendererService {
  private shouldFail: boolean = false;
  private renderDelay: number = 50;

  async render(mjmlContent: string): Promise<RenderingResult> {
    if (this.shouldFail) {
      throw new Error('Mock rendering failure');
    }

    await this.delay(this.renderDelay);

    return {
      html: MOCK_HTML_CONTENT,
      css: 'body { margin: 0; }',
      fileSize: Buffer.byteLength(MOCK_HTML_CONTENT, 'utf8'),
      renderTime: this.renderDelay,
      warnings: []
    };
  }

  async renderBatch(requests: any[]): Promise<any> {
    const results = await Promise.all(
      requests.map(async (req) => ({
        id: req.id,
        result: await this.render(req.mjmlContent),
        error: undefined
      }))
    );

    return {
      results,
      totalProcessingTime: this.renderDelay * requests.length,
      successCount: results.length,
      errorCount: 0
    };
  }

  // Test utilities
  setShouldFail(fail: boolean) {
    this.shouldFail = fail;
  }

  setRenderDelay(delay: number) {
    this.renderDelay = delay;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Mock Template Validator Service
 */
export class MockTemplateValidatorService {
  private validationResults: Map<string, ValidationResult> = new Map();

  validateMjml(mjmlContent: string): ValidationResult {
    const customResult = this.validationResults.get(mjmlContent);
    if (customResult) {
      return customResult;
    }

    // Simple validation logic for testing
    if (!mjmlContent.includes('<mjml>')) {
      return {
        isValid: false,
        errors: [{
          code: 'MISSING_ROOT',
          message: 'Missing <mjml> root tag',
          severity: 'critical',
          location: 'root'
        }],
        warnings: [],
        score: 0
      };
    }

    return MOCK_VALIDATION_RESULT;
  }

  validateHtml(htmlContent: string, targetClients: EmailClient[]): ValidationResult {
    const customResult = this.validationResults.get(htmlContent);
    if (customResult) {
      return customResult;
    }

    // Check for basic HTML structure
    if (!htmlContent.includes('<!DOCTYPE')) {
      return {
        isValid: false,
        errors: [{
          code: 'MISSING_DOCTYPE',
          message: 'Missing DOCTYPE declaration',
          severity: 'high',
          location: 'document'
        }],
        warnings: [],
        score: 60
      };
    }

    return MOCK_VALIDATION_RESULT;
  }

  // Test utilities
  setValidationResult(content: string, result: ValidationResult) {
    this.validationResults.set(content, result);
  }

  clearValidationResults() {
    this.validationResults.clear();
  }
}

/**
 * Mock Template Cache Service
 */
export class MockTemplateCacheService {
  private cache: Map<string, CachedTemplate> = new Map();
  private shouldFail: boolean = false;
  private cacheDelay: number = 10;

  async get(key: string): Promise<CachedTemplate | null> {
    if (this.shouldFail) {
      throw new Error('Mock cache failure');
    }

    await this.delay(this.cacheDelay);
    return this.cache.get(key) || null;
  }

  async set(key: string, template: CachedTemplate): Promise<void> {
    if (this.shouldFail) {
      throw new Error('Mock cache failure');
    }

    await this.delay(this.cacheDelay);
    this.cache.set(key, template);
  }

  async clear(key?: string): Promise<void> {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  getMetrics() {
    return {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalRequests: 0,
      cacheSize: this.cache.size,
      memoryUsageMB: 0
    };
  }

  // Test utilities
  setShouldFail(fail: boolean) {
    this.shouldFail = fail;
  }

  setCacheDelay(delay: number) {
    this.cacheDelay = delay;
  }

  getCacheContents() {
    return new Map(this.cache);
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Mock Factory Functions
 */
export function createMockMjmlTemplate(overrides: Partial<any> = {}): MjmlTemplate {
  return MjmlTemplate.create({
    name: 'mock-template',
    mjmlContent: MOCK_MJML_CONTENT,
    layoutType: 'gallery-focused',
    sectionsCount: 1,
    assetsUsed: 0,
    ...overrides
  });
}

export function createMockEmailTemplate(overrides: Partial<any> = {}): EmailTemplate {
  return EmailTemplate.create({
    name: 'mock-email',
    htmlContent: MOCK_HTML_CONTENT,
    cssContent: 'body { margin: 0; }',
    mjmlSourceId: 'mock-mjml-id',
    emailClients: ['gmail', 'outlook', 'apple-mail'],
    ...overrides
  });
}

export function createMockGenerationRequest(overrides: Partial<MjmlGenerationRequest> = {}): MjmlGenerationRequest {
  return {
    contentContext: {
      campaign: {
        id: 'mock-campaign',
        type: 'promotional',
        destination: 'test-destination'
      },
      subject: 'Test Subject',
      preheader: 'Test Preview',
      body: {
        opening: 'Hello!',
        main_content: 'This is a test email',
        benefits: ['Great features'],
        social_proof: 'Trusted by users',
        urgency_elements: 'Limited time',
        closing: 'Thank you!'
      },
      emotional_hooks: {},
      personalization: {},
      call_to_action: {
        primary: {
          text: 'Click Here',
          url: 'https://example.com'
        }
      }
    },
    designRequirements: {
      colors: {
        primary: '#007bff',
        accent: '#28a745',
        background: '#ffffff',
        text: '#333333'
      },
      layout: {
        maxWidth: 600,
        spacing: { small: 10, medium: 20, large: 30, xlarge: 40 },
        structure: { sections: [], columns: 1, responsive_breakpoints: [600] }
      },
      typography: {
        headingFont: 'Arial, sans-serif',
        bodyFont: 'Arial, sans-serif',
        fontSizes: {
          small: '14px', medium: '16px', large: '18px', xlarge: '20px',
          h1: '24px', h2: '20px', h3: '18px', body: '16px'
        },
        fontWeights: { normal: 400, bold: 700 }
      },
      email_clients: ['gmail', 'outlook', 'apple-mail'],
      responsive: true,
      dark_mode: false
    },
    assetManifest: {
      images: [{
        url: 'https://example.com/image.jpg',
        alt_text: 'Test image',
        usage: 'hero',
        isExternal: true,
        description: 'Test image'
      }],
      icons: [],
      fonts: []
    },
    templateDesign: {
      template_name: 'mock-template',
      layout: {
        type: 'gallery-focused',
        max_width: 600,
        spacing_system: { small: 10, medium: 20, large: 30, xlarge: 40 }
      },
      sections: [],
      components: [],
      visual_concept: 'Test template',
      target_audience: 'general',
      metadata: {
        campaign_type: 'promotional',
        brand_colors: {
          primary: '#007bff',
          accent: '#28a745',
          background: '#ffffff',
          text: '#333333'
        }
      }
    },
    ...overrides
  };
}

export function createMockCompleteResult(overrides: Partial<CompleteMjmlGenerationResult> = {}): CompleteMjmlGenerationResult {
  const mjmlTemplate = createMockMjmlTemplate();
  const emailTemplate = createMockEmailTemplate();

  return {
    mjmlTemplate,
    emailTemplate,
    generationResult: {
      mjmlContent: MOCK_MJML_CONTENT,
      metadata: mjmlTemplate.metadata,
      validation: MOCK_VALIDATION_RESULT,
      performance: MOCK_PERFORMANCE_METRICS
    },
    renderingResult: {
      html: MOCK_HTML_CONTENT,
      css: 'body { margin: 0; }',
      fileSize: Buffer.byteLength(MOCK_HTML_CONTENT, 'utf8'),
      renderTime: 50,
      warnings: []
    },
    finalValidation: MOCK_VALIDATION_RESULT,
    performanceMetrics: MOCK_PERFORMANCE_METRICS,
    processingTime: 200,
    ...overrides
  };
}

/**
 * Test Utilities
 */
export class MockTestHelper {
  static expectValidMjmlTemplate(template: MjmlTemplate) {
    expect(template).toBeDefined();
    expect(template.id).toBeTruthy();
    expect(template.mjmlContent).toContain('<mjml>');
    expect(template.metadata).toBeDefined();
  }

  static expectValidEmailTemplate(template: EmailTemplate) {
    expect(template).toBeDefined();
    expect(template.id).toBeTruthy();
    expect(template.htmlContent).toContain('<!DOCTYPE');
    expect(template.metadata).toBeDefined();
  }

  static expectValidValidationResult(result: ValidationResult) {
    expect(result).toBeDefined();
    expect(typeof result.isValid).toBe('boolean');
    expect(Array.isArray(result.errors)).toBe(true);
    expect(Array.isArray(result.warnings)).toBe(true);
    expect(typeof result.score).toBe('number');
  }

  static expectValidPerformanceMetrics(metrics: PerformanceMetrics) {
    expect(metrics).toBeDefined();
    expect(typeof metrics.generationTime).toBe('number');
    expect(typeof metrics.templateSize).toBe('number');
    expect(typeof metrics.complexityScore).toBe('number');
    expect(metrics.resourceUsage).toBeDefined();
  }
} 