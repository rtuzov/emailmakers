import { NextRequest } from 'next/server';
import { GET } from '@/app/api/templates/route';

// Create a proper mock chain for Drizzle ORM
const createMockQueryBuilder = (returnValue: any = []) => {
  const mockBuilder = {
    select: jest.fn(),
    from: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    offset: jest.fn(),
  };

  // Chain all methods to return themselves
  mockBuilder.select.mockReturnValue(mockBuilder);
  mockBuilder.from.mockReturnValue(mockBuilder);
  mockBuilder.where.mockReturnValue(mockBuilder);
  mockBuilder.orderBy.mockReturnValue(mockBuilder);
  mockBuilder.limit.mockReturnValue(mockBuilder);
  
  // The last method (offset) returns a promise with the data
  mockBuilder.offset.mockReturnValue(Promise.resolve(returnValue));

  return mockBuilder;
};

// Mock database connection
jest.mock('@/shared/infrastructure/database/connection', () => ({
  db: {
    select: jest.fn(() => createMockQueryBuilder())
  }
}));

// Mock NextRequest helper
function createMockRequest(url: string = 'http://localhost:3000/api/templates', method: string = 'GET') {
  return new NextRequest(url, { method });
}

// Mock database templates with varied data for filtering tests
const mockDbTemplates = [
  {
    id: 'template_1',
    user_id: 'user_123',
    name: 'AI Newsletter Template',
    description: 'AI-generated newsletter template with high quality',
    brief_text: 'Brief for AI newsletter',
    generated_content: { subject: 'Weekly AI Updates', content: 'Newsletter content' },
    mjml_code: '<mjml><mj-body><mj-text>Newsletter</mj-text></mj-body></mjml>',
    html_output: '<html><body>Newsletter</body></html>',
    design_tokens: { colors: { primary: '#007bff' } },
    status: 'published',
    quality_score: 95,
    created_at: new Date('2024-03-01T10:00:00Z'),
    updated_at: new Date('2024-03-01T11:00:00Z'),
    tags: ['newsletter', 'ai', 'weekly'],
    category: 'newsletter'
  },
  {
    id: 'template_2', 
    user_id: 'user_123',
    name: 'Manual Promotional Email',
    description: 'Manually created promotional template',
    brief_text: 'Brief for promotional email',
    generated_content: { subject: 'Special Offer', content: 'Promo content' },
    mjml_code: '<mjml><mj-body><mj-text>Promo</mj-text></mj-body></mjml>',
    html_output: '<html><body>Promo</body></html>',
    design_tokens: { colors: { primary: '#28a745' } },
    status: 'draft',
    quality_score: 78,
    created_at: new Date('2024-02-15T14:30:00Z'),
    updated_at: new Date('2024-02-15T15:00:00Z'),
    tags: ['promotional', 'sales', 'discount'],
    category: 'promotional'
  },
  {
    id: 'template_3',
    user_id: 'user_123', 
    name: 'Welcome Series Part 1',
    description: 'First email in welcome series',
    brief_text: 'Brief for welcome email',
    generated_content: { subject: 'Welcome!', content: 'Welcome content' },
    mjml_code: '<mjml><mj-body><mj-text>Welcome</mj-text></mj-body></mjml>',
    html_output: '<html><body>Welcome</body></html>',
    design_tokens: { colors: { primary: '#6f42c1' } },
    status: 'published',
    quality_score: 88,
    created_at: new Date('2024-01-20T09:15:00Z'),
    updated_at: new Date('2024-01-20T10:00:00Z'),
    tags: ['welcome', 'onboarding'],
    category: 'welcome'
  },
  {
    id: 'template_4',
    user_id: 'user_123',
    name: 'Low Quality Test Template',
    description: 'Template with low quality score',
    brief_text: 'Brief for test template',
    generated_content: { subject: 'Test', content: 'Test content' },
    mjml_code: '<mjml><mj-body><mj-text>Test</mj-text></mj-body></mjml>',
    html_output: '<html><body>Test</body></html>',
    design_tokens: { colors: { primary: '#dc3545' } },
    status: 'draft',
    quality_score: 45,
    created_at: new Date('2024-01-10T16:20:00Z'),
    updated_at: new Date('2024-01-10T16:30:00Z'),
    tags: ['test', 'draft'],
    category: 'general'
  }
];

describe('/api/templates Advanced Filtering Integration', () => {
  const mockDb = require('@/shared/infrastructure/database/connection').db;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper to setup database mocks with specific filtered results
  const setupFilteredDbMocks = (countResult: number, templatesResult: any[]) => {
    const countBuilder = createMockQueryBuilder([{ count: countResult }]);
    const templatesBuilder = createMockQueryBuilder(templatesResult);
    
    mockDb.select
      .mockReturnValueOnce(countBuilder)
      .mockReturnValueOnce(templatesBuilder);
  };

  describe('Status Filtering', () => {
    test('should filter by published status', async () => {
      const publishedTemplates = mockDbTemplates.filter(t => t.status === 'published');
      setupFilteredDbMocks(publishedTemplates.length, publishedTemplates);

      const request = createMockRequest('http://localhost:3000/api/templates?status=published');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.templates).toHaveLength(2); // 2 published templates
      data.data.templates.forEach((template: any) => {
        expect(template.status).toBe('published');
      });
    });

    test('should filter by draft status', async () => {
      const draftTemplates = mockDbTemplates.filter(t => t.status === 'draft');
      setupFilteredDbMocks(draftTemplates.length, draftTemplates);

      const request = createMockRequest('http://localhost:3000/api/templates?status=draft');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.templates).toHaveLength(2); // 2 draft templates
      data.data.templates.forEach((template: any) => {
        expect(template.status).toBe('draft');
      });
    });
  });

  describe('Tag Filtering', () => {
    test('should filter by single tag', async () => {
      const newsletterTemplates = mockDbTemplates.filter(t => t.tags?.includes('newsletter'));
      setupFilteredDbMocks(newsletterTemplates.length, newsletterTemplates);

      const request = createMockRequest('http://localhost:3000/api/templates?tags=newsletter');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.templates).toHaveLength(1);
      expect(data.data.templates[0].name).toBe('AI Newsletter Template');
    });

    test('should filter by multiple tags', async () => {
      setupFilteredDbMocks(0, []); // No templates match both tags in our mock data

      const request = createMockRequest('http://localhost:3000/api/templates?tags=newsletter,promotional');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // Should fallback to mock data and filter there
      expect(data.metadata.cache_status).toBe('fallback');
    });

    test('should handle non-existent tags gracefully', async () => {
      setupFilteredDbMocks(0, []);

      const request = createMockRequest('http://localhost:3000/api/templates?tags=nonexistent');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.templates).toHaveLength(0);
    });
  });

  describe('Quality Score Filtering', () => {
    test('should filter by minimum quality score', async () => {
      const highQualityTemplates = mockDbTemplates.filter(t => t.quality_score >= 80);
      setupFilteredDbMocks(highQualityTemplates.length, highQualityTemplates);

      const request = createMockRequest('http://localhost:3000/api/templates?qualityMin=80');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.templates).toHaveLength(2); // Only 2 templates meet criteria in mock data
      data.data.templates.forEach((template: any) => {
        expect(template.qualityScore).toBeGreaterThanOrEqual(80);
      });
    });

    test('should filter by maximum quality score', async () => {
      const lowQualityTemplates = mockDbTemplates.filter(t => t.quality_score <= 50);
      setupFilteredDbMocks(lowQualityTemplates.length, lowQualityTemplates);

      const request = createMockRequest('http://localhost:3000/api/templates?qualityMax=50');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.templates).toHaveLength(1);
      expect(data.data.templates[0].qualityScore).toBeLessThanOrEqual(50);
    });

    test('should filter by quality score range', async () => {
      const mediumQualityTemplates = mockDbTemplates.filter(
        t => t.quality_score >= 70 && t.quality_score <= 90
      );
      setupFilteredDbMocks(mediumQualityTemplates.length, mediumQualityTemplates);

      const request = createMockRequest('http://localhost:3000/api/templates?qualityMin=70&qualityMax=90');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.templates).toHaveLength(2);
      data.data.templates.forEach((template: any) => {
        expect(template.qualityScore).toBeGreaterThanOrEqual(70);
        expect(template.qualityScore).toBeLessThanOrEqual(90);
      });
    });
  });

  describe('Agent Generation Filtering', () => {
    test('should filter AI-generated templates', async () => {
      // Assuming AI-generated templates have specific indicators
      const aiTemplates = [mockDbTemplates[0]]; // Only first template is AI-generated in our mock
      setupFilteredDbMocks(aiTemplates.length, aiTemplates);

      const request = createMockRequest('http://localhost:3000/api/templates?agentGenerated=true');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.templates).toHaveLength(1);
      expect(data.data.templates[0].agentGenerated).toBe(true);
    });

    test('should filter manually created templates', async () => {
      // Since database templates default to agentGenerated=true, this will fall back to mock data
      setupFilteredDbMocks(0, []);

      const request = createMockRequest('http://localhost:3000/api/templates?agentGenerated=false');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.templates.length).toBeGreaterThan(0);
      expect(data.metadata.cache_status).toBe('fallback');
      data.data.templates.forEach((template: any) => {
        expect(template.agentGenerated).toBe(false);
      });
    });
  });

  describe('Date Range Filtering', () => {
    test('should filter by start date', async () => {
      const recentTemplates = mockDbTemplates.filter(
        t => new Date(t.created_at) >= new Date('2024-02-01')
      );
      setupFilteredDbMocks(recentTemplates.length, recentTemplates);

      const request = createMockRequest('http://localhost:3000/api/templates?dateStart=2024-02-01');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.templates).toHaveLength(2);
      data.data.templates.forEach((template: any) => {
        expect(new Date(template.createdAt).getTime()).toBeGreaterThanOrEqual(
          new Date('2024-02-01').getTime()
        );
      });
    });

    test('should filter by end date', async () => {
      const olderTemplates = mockDbTemplates.filter(
        t => new Date(t.created_at) <= new Date('2024-02-01')
      );
      setupFilteredDbMocks(olderTemplates.length, olderTemplates);

      const request = createMockRequest('http://localhost:3000/api/templates?dateEnd=2024-02-01');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.templates).toHaveLength(2);
      data.data.templates.forEach((template: any) => {
        expect(new Date(template.createdAt).getTime()).toBeLessThanOrEqual(
          new Date('2024-02-01').getTime()
        );
      });
    });

    test('should filter by date range', async () => {
      const dateRangeTemplates = mockDbTemplates.filter(
        t => {
          const date = new Date(t.created_at);
          return date >= new Date('2024-01-15') && date <= new Date('2024-02-20');
        }
      );
      setupFilteredDbMocks(dateRangeTemplates.length, dateRangeTemplates);

      const request = createMockRequest(
        'http://localhost:3000/api/templates?dateStart=2024-01-15&dateEnd=2024-02-20'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.templates).toHaveLength(2);
    });
  });

  describe('Combined Filtering', () => {
    test('should apply multiple filters simultaneously', async () => {
      // Published newsletters with high quality
      const filteredTemplates = mockDbTemplates.filter(
        t => t.status === 'published' && 
             t.category === 'newsletter' && 
             t.quality_score >= 90
      );
      setupFilteredDbMocks(filteredTemplates.length, filteredTemplates);

      const request = createMockRequest(
        'http://localhost:3000/api/templates?status=published&category=newsletter&qualityMin=90'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.templates).toHaveLength(1);
      expect(data.data.templates[0].name).toBe('AI Newsletter Template');
    });

    test('should handle complex filter combinations', async () => {
      setupFilteredDbMocks(0, []); // No results for this complex combination

      const request = createMockRequest(
        'http://localhost:3000/api/templates?status=published&tags=newsletter,ai&qualityMin=90&agentGenerated=true&dateStart=2024-03-01'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.templates).toHaveLength(0);
    });

    test.skip('should maintain correct pagination with filters', async () => {
      const filteredTemplates = mockDbTemplates.filter(t => t.status === 'published');
      // Mock count and templates queries separately
      const mockBuilder1 = createMockQueryBuilder([{ count: 2 }]);
      const mockBuilder2 = createMockQueryBuilder([filteredTemplates[0]]);
      
      mockDb.select
        .mockReturnValueOnce(mockBuilder1)
        .mockReturnValueOnce(mockBuilder2);

      const request = createMockRequest(
        'http://localhost:3000/api/templates?status=published&page=1&limit=1'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.templates).toHaveLength(1);
      expect(data.data.pagination.page).toBe(1);
      expect(data.data.pagination.limit).toBe(1);
      expect(data.data.pagination.total).toBe(2); // Total published templates
    });
  });

  describe('Filter Validation', () => {
    test('should validate quality score range parameters', async () => {
      const request = createMockRequest('http://localhost:3000/api/templates?qualityMin=150');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('quality score');
    });

    test('should validate date format parameters', async () => {
      const request = createMockRequest('http://localhost:3000/api/templates?dateStart=invalid-date');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('date format');
    });

    test('should validate status enum values', async () => {
      const request = createMockRequest('http://localhost:3000/api/templates?status=invalid');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('status');
    });

    test('should validate boolean parameters', async () => {
      const request = createMockRequest('http://localhost:3000/api/templates?agentGenerated=maybe');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('boolean');
    });
  });

  describe('Filter Performance', () => {
    test('should maintain reasonable performance with multiple filters', async () => {
      setupFilteredDbMocks(1, [mockDbTemplates[0]]);

      const startTime = Date.now();
      const request = createMockRequest(
        'http://localhost:3000/api/templates?search=AI&status=published&category=newsletter&tags=ai,newsletter&qualityMin=90&agentGenerated=true'
      );
      const response = await GET(request);
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    test('should include performance metadata for filtered queries', async () => {
      setupFilteredDbMocks(1, [mockDbTemplates[0]]);

      const request = createMockRequest('http://localhost:3000/api/templates?status=published');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.metadata).toHaveProperty('query_time');
      expect(data.metadata.query_time).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Filter Edge Cases', () => {
    test('should handle empty tag list', async () => {
      setupFilteredDbMocks(4, mockDbTemplates);

      const request = createMockRequest('http://localhost:3000/api/templates?tags=');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // Should return all templates when tags parameter is empty
    });

    test('should handle quality score edge values', async () => {
      setupFilteredDbMocks(0, []);

      const request = createMockRequest('http://localhost:3000/api/templates?qualityMin=0&qualityMax=100');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    test('should handle future date ranges', async () => {
      setupFilteredDbMocks(0, []);

      const request = createMockRequest('http://localhost:3000/api/templates?dateStart=2025-01-01');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.templates).toHaveLength(0);
    });
  });
});