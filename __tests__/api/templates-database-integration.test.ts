import { NextRequest } from 'next/server';
import { GET } from '@/app/api/templates/route';
import { db } from '@/shared/infrastructure/database/connection';
import { email_templates } from '@/shared/infrastructure/database/schema';
import { eq } from 'drizzle-orm';

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

// Mock database data
const mockDbTemplates = [
  {
    id: 'db_1709567890123',
    user_id: 'user_123',
    name: 'Database Template 1',
    description: 'Template from database',
    brief_text: 'Brief text for template 1',
    generated_content: { subject: 'Test Subject', content: 'Test content' },
    mjml_code: '<mjml><mj-body><mj-text>Test</mj-text></mj-body></mjml>',
    html_output: '<html><body>Test</body></html>',
    design_tokens: { colors: { primary: '#007bff' } },
    status: 'published',
    quality_score: 95,
    created_at: new Date('2024-03-04T14:30:00Z'),
    updated_at: new Date('2024-03-04T15:45:00Z'),
  },
  {
    id: 'db_1709567890124',
    user_id: 'user_123',
    name: 'Database Template 2',
    description: 'Another template from database',
    brief_text: 'Brief text for template 2',
    generated_content: { subject: 'Test Subject 2', content: 'Test content 2' },
    mjml_code: '<mjml><mj-body><mj-text>Test 2</mj-text></mj-body></mjml>',
    html_output: '<html><body>Test 2</body></html>',
    design_tokens: { colors: { primary: '#28a745' } },
    status: 'draft',
    quality_score: 88,
    created_at: new Date('2024-03-03T10:15:00Z'),
    updated_at: new Date('2024-03-03T10:15:00Z'),
  }
];

describe('/api/templates Database Integration', () => {
  const mockDb = db as jest.Mocked<typeof db>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Helper to setup database mocks
  const setupDbMocks = (countResult: number, templatesResult: any[]) => {
    // Mock count query
    const countBuilder = createMockQueryBuilder([{ count: countResult }]);
    // Mock templates query
    const templatesBuilder = createMockQueryBuilder(templatesResult);
    
    mockDb.select
      .mockReturnValueOnce(countBuilder as any) // For count query
      .mockReturnValueOnce(templatesBuilder as any); // For templates query
  };

  describe('Database Query Execution', () => {
    test('should execute database queries when data exists', async () => {
      setupDbMocks(10, mockDbTemplates);

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.templates).toHaveLength(2);
      expect(data.data.templates[0].name).toBe('Database Template 1');
      expect(data.metadata.cache_status).toBe('database');
      expect(response.headers.get('X-Data-Source')).toBe('database');
    });

    test('should fall back to mock data when database is empty', async () => {
      setupDbMocks(0, []);

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.templates.length).toBeGreaterThan(0); // Should have mock data
      expect(data.metadata.cache_status).toBe('fallback');
      expect(response.headers.get('X-Data-Source')).toBe('fallback');
    });

    test('should use database query for status filtering', async () => {
      setupDbMocks(1, [mockDbTemplates[0]]);

      const request = createMockRequest('http://localhost:3000/api/templates?status=published');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.templates).toHaveLength(1);
      expect(data.data.templates[0].status).toBe('published');
    });

    test('should use database query for search functionality', async () => {
      setupDbMocks(1, [mockDbTemplates[0]]);

      const request = createMockRequest('http://localhost:3000/api/templates?search=Database');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.templates).toHaveLength(1);
      expect(data.data.templates[0].name).toContain('Database');
    });

    test('should apply sorting to database query', async () => {
      setupDbMocks(2, [...mockDbTemplates].reverse());

      const request = createMockRequest('http://localhost:3000/api/templates?sortBy=name&sortOrder=asc');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.templates).toHaveLength(2);
    });

    test('should apply pagination to database query', async () => {
      const countQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue(Promise.resolve([{ count: 10 }])),
      };

      const templatesQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnValue(Promise.resolve([mockDbTemplates[0]])),
      };

      mockDb.select
        .mockReturnValueOnce(countQueryBuilder as any)
        .mockReturnValueOnce(templatesQueryBuilder as any);

      const request = createMockRequest('http://localhost:3000/api/templates?page=2&limit=1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.pagination.page).toBe(2);
      expect(data.data.pagination.limit).toBe(1);
      expect(data.data.pagination.total).toBe(10);
    });
  });

  describe('Database Error Handling', () => {
    test('should handle database connection errors gracefully', async () => {
      mockDb.select.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch templates');
      expect(data.message).toBe('Database connection failed');
    });

    test('should handle database timeout errors', async () => {
      mockDb.select.mockImplementation(() => {
        throw new Error('Query timeout');
      });

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Query timeout');
    });
  });

  describe('Data Transformation', () => {
    test('should transform database fields to API response format', async () => {
      const countQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue(Promise.resolve([{ count: 1 }])),
      };

      const templatesQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnValue(Promise.resolve([mockDbTemplates[0]])),
      };

      mockDb.select
        .mockReturnValueOnce(countQueryBuilder as any)
        .mockReturnValueOnce(templatesQueryBuilder as any);

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      const template = data.data.templates[0];
      
      expect(template).toHaveProperty('id');
      expect(template).toHaveProperty('name');
      expect(template).toHaveProperty('category');
      expect(template).toHaveProperty('description');
      expect(template).toHaveProperty('createdAt');
      expect(template).toHaveProperty('status');
      expect(template).toHaveProperty('qualityScore');
      expect(template).toHaveProperty('agentGenerated');
      expect(template).toHaveProperty('briefText');
      expect(template).toHaveProperty('generatedContent');
      expect(template).toHaveProperty('mjmlCode');
      expect(template).toHaveProperty('htmlOutput');
      expect(template).toHaveProperty('designTokens');
      
      // Check data types
      expect(typeof template.createdAt).toBe('string');
      expect(typeof template.qualityScore).toBe('number');
      expect(typeof template.agentGenerated).toBe('boolean');
    });

    test('should handle null/undefined database fields gracefully', async () => {
      const templateWithNulls = {
        ...mockDbTemplates[0],
        description: null,
        quality_score: null,
        updated_at: null,
      };

      const countQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue(Promise.resolve([{ count: 1 }])),
      };

      const templatesQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnValue(Promise.resolve([templateWithNulls])),
      };

      mockDb.select
        .mockReturnValueOnce(countQueryBuilder as any)
        .mockReturnValueOnce(templatesQueryBuilder as any);

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      const template = data.data.templates[0];
      
      expect(template.description).toBe('');
      expect(template.qualityScore).toBeUndefined();
      expect(template.updatedAt).toBeUndefined();
    });
  });

  describe('Performance Optimization', () => {
    test('should include query performance metadata', async () => {
      const countQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue(Promise.resolve([{ count: 5 }])),
      };

      const templatesQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnValue(Promise.resolve(mockDbTemplates)),
      };

      mockDb.select
        .mockReturnValueOnce(countQueryBuilder as any)
        .mockReturnValueOnce(templatesQueryBuilder as any);

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(data.metadata).toHaveProperty('query_time');
      expect(data.metadata).toHaveProperty('cache_status');
      expect(typeof data.metadata.query_time).toBe('number');
      expect(data.metadata.query_time).toBeGreaterThanOrEqual(0);
    });

    test('should include appropriate response headers', async () => {
      const countQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue(Promise.resolve([{ count: 5 }])),
      };

      const templatesQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnValue(Promise.resolve(mockDbTemplates)),
      };

      mockDb.select
        .mockReturnValueOnce(countQueryBuilder as any)
        .mockReturnValueOnce(templatesQueryBuilder as any);

      const request = createMockRequest();
      const response = await GET(request);

      expect(response.headers.get('Cache-Control')).toContain('public');
      expect(response.headers.get('X-Total-Count')).toBe('5');
      expect(response.headers.get('X-Page')).toBe('1');
      expect(response.headers.get('X-Per-Page')).toBe('12');
      expect(response.headers.get('X-Data-Source')).toBe('database');
    });
  });

  describe('Fallback Mechanism', () => {
    test('should use fallback data when search returns no results', async () => {
      const countQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue(Promise.resolve([{ count: 0 }])),
      };

      const templatesQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnValue(Promise.resolve([])),
      };

      mockDb.select
        .mockReturnValueOnce(countQueryBuilder as any)
        .mockReturnValueOnce(templatesQueryBuilder as any);

      const request = createMockRequest('http://localhost:3000/api/templates?search=nonexistent');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.templates).toHaveLength(0);
      expect(data.metadata.cache_status).toBe('fallback'); // Falls back when no results found
    });

    test('should preserve mock data functionality when database is empty', async () => {
      const countQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue(Promise.resolve([{ count: 0 }])),
      };

      const templatesQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnValue(Promise.resolve([])),
      };

      mockDb.select
        .mockReturnValueOnce(countQueryBuilder as any)
        .mockReturnValueOnce(templatesQueryBuilder as any);

      const request = createMockRequest('http://localhost:3000/api/templates?category=promotional');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.templates.length).toBeGreaterThan(0);
      expect(data.metadata.cache_status).toBe('fallback');
      
      // Should filter mock data by category
      data.data.templates.forEach((template: any) => {
        expect(template.category).toBe('promotional');
      });
    });
  });
});