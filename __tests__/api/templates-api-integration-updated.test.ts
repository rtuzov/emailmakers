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

// Mock database connection at the module level
jest.mock('@/shared/infrastructure/database/connection', () => ({
  db: {
    select: jest.fn(() => createMockQueryBuilder())
  }
}));

// Mock NextRequest helper
function createMockRequest(url: string = 'http://localhost:3000/api/templates', method: string = 'GET') {
  return new NextRequest(url, { method });
}

describe('/api/templates API Integration (Updated with Database)', () => {
  const mockDb = require('@/shared/infrastructure/database/connection').db;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  // Helper to setup database mocks
  const setupDbMocks = (countResult: number, templatesResult: any[] = []) => {
    // Mock count query
    const countBuilder = createMockQueryBuilder([{ count: countResult }]);
    // Mock templates query
    const templatesBuilder = createMockQueryBuilder(templatesResult);
    
    mockDb.select
      .mockReturnValueOnce(countBuilder) // For count query
      .mockReturnValueOnce(templatesBuilder); // For templates query
  };

  describe('GET /api/templates', () => {
    test('should return templates with default parameters', async () => {
      setupDbMocks(0, []); // Empty database, should fall back to mock data

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('templates');
      expect(data.data).toHaveProperty('pagination');
      expect(data.data).toHaveProperty('filters');
      expect(Array.isArray(data.data.templates)).toBe(true);
      expect(data.data.pagination).toMatchObject({
        page: 1,
        limit: 12,
        total: expect.any(Number),
        totalPages: expect.any(Number),
        hasNext: expect.any(Boolean),
        hasPrev: expect.any(Boolean)
      });
    });

    test('should include database fallback indicator', async () => {
      setupDbMocks(0, []); // Empty database triggers fallback

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.metadata.cache_status).toBe('fallback');
      expect(response.headers.get('X-Data-Source')).toBe('fallback');
    });

    test('should respect pagination parameters', async () => {
      const request = createMockRequest('http://localhost:3000/api/templates?page=2&limit=2');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.pagination.page).toBe(2);
      expect(data.data.pagination.limit).toBe(2);
      expect(data.data.templates.length).toBeLessThanOrEqual(2);
    });

    test('should filter by category', async () => {
      const request = createMockRequest('http://localhost:3000/api/templates?category=promotional');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      data.data.templates.forEach((template: any) => {
        expect(template.category).toBe('promotional');
      });
    });

    test('should filter by status', async () => {
      const request = createMockRequest('http://localhost:3000/api/templates?status=published');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      data.data.templates.forEach((template: any) => {
        expect(template.status).toBe('published');
      });
    });

    test('should sort by different fields', async () => {
      const request = createMockRequest('http://localhost:3000/api/templates?sortBy=name&sortOrder=asc');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      // Check if sorted alphabetically by name
      const names = data.data.templates.map((t: any) => t.name.toLowerCase());
      const sortedNames = [...names].sort();
      expect(names).toEqual(sortedNames);
    });

    test('should include correct template fields', async () => {
      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      if (data.data.templates.length > 0) {
        const template = data.data.templates[0];
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('category');
        expect(template).toHaveProperty('description');
        expect(template).toHaveProperty('createdAt');
        expect(template).toHaveProperty('status');
        expect(template).toHaveProperty('openRate');
        expect(template).toHaveProperty('clickRate');
        expect(template).toHaveProperty('qualityScore');
        expect(template).toHaveProperty('agentGenerated');
        expect(template).toHaveProperty('tags');
      }
    });

    test('should include filters metadata', async () => {
      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.filters).toHaveProperty('categories');
      expect(data.data.filters).toHaveProperty('tags');
      expect(Array.isArray(data.data.filters.categories)).toBe(true);
      expect(Array.isArray(data.data.filters.tags)).toBe(true);
      
      // Check categories structure
      data.data.filters.categories.forEach((cat: any) => {
        expect(cat).toHaveProperty('value');
        expect(cat).toHaveProperty('label');
        expect(cat).toHaveProperty('count');
      });
    });

    test('should include performance metadata', async () => {
      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.metadata).toHaveProperty('query_time');
      expect(data.metadata).toHaveProperty('cache_status');
      expect(typeof data.metadata.query_time).toBe('number');
      expect(data.metadata.query_time).toBeGreaterThan(0);
    });

    test('should include correct response headers', async () => {
      const request = createMockRequest();
      const response = await GET(request);

      expect(response.headers.get('Cache-Control')).toContain('public');
      expect(response.headers.get('X-Total-Count')).toBeDefined();
      expect(response.headers.get('X-Page')).toBe('1');
      expect(response.headers.get('X-Per-Page')).toBe('12');
      expect(response.headers.get('X-Data-Source')).toBeDefined();
    });

    test('should handle edge case: page beyond total pages', async () => {
      const request = createMockRequest('http://localhost:3000/api/templates?page=999');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.templates).toHaveLength(0);
      expect(data.data.pagination.page).toBe(999);
      expect(data.data.pagination.hasNext).toBe(false);
    });

    test('should handle multiple filters combined', async () => {
      const request = createMockRequest('http://localhost:3000/api/templates?category=promotional&status=published');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      data.data.templates.forEach((template: any) => {
        expect(template.category).toBe('promotional');
        expect(template.status).toBe('published');
      });
    });
  });

  describe('Parameter Validation', () => {
    test('should reject invalid page parameter', async () => {
      const request = createMockRequest('http://localhost:3000/api/templates?page=-1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid pagination parameters');
    });

    test('should reject invalid limit parameter', async () => {
      const request = createMockRequest('http://localhost:3000/api/templates?limit=0');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid pagination parameters');
    });

    test('should reject invalid sort field', async () => {
      const request = createMockRequest('http://localhost:3000/api/templates?sortBy=invalidField');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid sort field');
    });

    test('should enforce maximum limit', async () => {
      const request = createMockRequest('http://localhost:3000/api/templates?limit=100');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.pagination.limit).toBe(50); // Max limit enforced
    });

    test('should handle non-existent category gracefully', async () => {
      const request = createMockRequest('http://localhost:3000/api/templates?category=nonexistent');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.templates).toHaveLength(0);
    });

    test('should handle empty search results', async () => {
      const request = createMockRequest('http://localhost:3000/api/templates?search=xyzabc123nonexistent');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.templates).toHaveLength(0);
      expect(data.data.pagination.total).toBe(0);
    });
  });

  describe('Data Quality', () => {
    test('should return templates with valid date formats', async () => {
      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      data.data.templates.forEach((template: any) => {
        expect(new Date(template.createdAt).toString()).not.toBe('Invalid Date');
        if (template.updatedAt) {
          expect(new Date(template.updatedAt).toString()).not.toBe('Invalid Date');
        }
      });
    });

    test('should return templates with valid performance metrics', async () => {
      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      data.data.templates.forEach((template: any) => {
        if (template.openRate !== undefined) {
          expect(template.openRate).toBeGreaterThanOrEqual(0);
          expect(template.openRate).toBeLessThanOrEqual(100);
        }
        if (template.clickRate !== undefined) {
          expect(template.clickRate).toBeGreaterThanOrEqual(0);
          expect(template.clickRate).toBeLessThanOrEqual(100);
        }
        if (template.qualityScore !== undefined) {
          expect(template.qualityScore).toBeGreaterThanOrEqual(0);
          expect(template.qualityScore).toBeLessThanOrEqual(100);
        }
      });
    });

    test('should return templates with valid status values', async () => {
      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      data.data.templates.forEach((template: any) => {
        if (template.status) {
          expect(['published', 'draft']).toContain(template.status);
        }
      });
    });

    test('should return templates with valid category values', async () => {
      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      const validCategories = ['promotional', 'newsletter', 'announcement', 'welcome', 'transactional', 'general'];
      data.data.templates.forEach((template: any) => {
        expect(validCategories).toContain(template.category);
      });
    });
  });

  describe('Database Integration Features', () => {
    test('should indicate fallback mode when database is empty', async () => {
      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.metadata.cache_status).toBe('fallback');
      expect(response.headers.get('X-Data-Source')).toBe('fallback');
    });

    test('should preserve mock data functionality in fallback mode', async () => {
      const request = createMockRequest('http://localhost:3000/api/templates?category=promotional');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.templates.length).toBeGreaterThan(0);
      
      data.data.templates.forEach((template: any) => {
        expect(template.category).toBe('promotional');
      });
    });

    test('should include new database-specific fields in response', async () => {
      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      if (data.data.templates.length > 0) {
        const template = data.data.templates[0];
        // These fields should be present even in fallback mode
        expect(template).toHaveProperty('briefText');
        expect(template).toHaveProperty('generatedContent');
        expect(template).toHaveProperty('mjmlCode');
        expect(template).toHaveProperty('htmlOutput');
        expect(template).toHaveProperty('designTokens');
      }
    });
  });

  describe('Performance', () => {
    test('should complete request within reasonable time', async () => {
      const startTime = Date.now();
      const request = createMockRequest();
      const response = await GET(request);
      const endTime = Date.now();
      
      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    test('should include query time metadata', async () => {
      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.metadata.query_time).toBeGreaterThanOrEqual(0);
      expect(data.metadata.query_time).toBeLessThan(1000); // Reasonable query time
    });
  });

  describe('Caching Headers', () => {
    test('should include appropriate cache headers', async () => {
      const request = createMockRequest();
      const response = await GET(request);

      const cacheControl = response.headers.get('Cache-Control');
      expect(cacheControl).toContain('public');
      expect(cacheControl).toContain('max-age');
      expect(cacheControl).toContain('stale-while-revalidate');
    });

    test('should include pagination headers', async () => {
      const request = createMockRequest('http://localhost:3000/api/templates?page=2&limit=5');
      const response = await GET(request);

      expect(response.headers.get('X-Page')).toBe('2');
      expect(response.headers.get('X-Per-Page')).toBe('5');
      expect(response.headers.get('X-Total-Count')).toBeDefined();
    });
  });
});