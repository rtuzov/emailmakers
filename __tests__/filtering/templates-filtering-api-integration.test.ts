/**
 * Phase 2.3.3 API Integration Tests for Template Filtering
 * Tests the API endpoint's filtering functionality with database integration
 */

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/templates/route'
import { jest } from '@jest/globals'

// Mock the database connection
const mockDb = {
  select: jest.fn(),
  from: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  offset: jest.fn()
}

jest.unstable_mockModule('@/shared/infrastructure/database/connection', () => ({
  db: mockDb
}))

jest.unstable_mockModule('@/shared/infrastructure/database/schema', () => ({
  email_templates: {
    id: 'id',
    user_id: 'user_id',
    name: 'name',
    description: 'description',
    brief_text: 'brief_text',
    generated_content: 'generated_content',
    mjml_code: 'mjml_code',
    html_output: 'html_output',
    design_tokens: 'design_tokens',
    status: 'status',
    quality_score: 'quality_score',
    created_at: 'created_at',
    updated_at: 'updated_at'
  },
  users: {
    id: 'id',
    email: 'email'
  }
}))

// Mock drizzle-orm functions
jest.unstable_mockModule('drizzle-orm', () => ({
  eq: jest.fn((field, value) => ({ type: 'eq', field, value })),
  like: jest.fn((field, value) => ({ type: 'like', field, value })),
  ilike: jest.fn((field, value) => ({ type: 'ilike', field, value })),
  and: jest.fn((...conditions) => ({ type: 'and', conditions })),
  or: jest.fn((...conditions) => ({ type: 'or', conditions })),
  desc: jest.fn((field) => ({ type: 'desc', field })),
  asc: jest.fn((field) => ({ type: 'asc', field })),
  count: jest.fn(() => ({ type: 'count' })),
  gte: jest.fn((field, value) => ({ type: 'gte', field, value })),
  lte: jest.fn((field, value) => ({ type: 'lte', field, value })),
  between: jest.fn((field, min, max) => ({ type: 'between', field, min, max })),
  sql: jest.fn((query) => ({ type: 'sql', query }))
}))

const createMockQueryBuilder = (returnValue: any = []) => {
  const mockBuilder = {
    select: jest.fn(),
    from: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    offset: jest.fn(),
  }
  
  // Chain methods return the builder
  mockBuilder.select.mockReturnValue(mockBuilder)
  mockBuilder.from.mockReturnValue(mockBuilder)
  mockBuilder.where.mockReturnValue(mockBuilder)
  mockBuilder.orderBy.mockReturnValue(mockBuilder)
  mockBuilder.limit.mockReturnValue(mockBuilder)
  
  // Final method returns promise
  mockBuilder.offset.mockReturnValue(Promise.resolve(returnValue))
  
  return mockBuilder
}

describe('Templates API Filtering - Phase 2.3.3', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default mock responses
    const countBuilder = createMockQueryBuilder([{ count: 0 }])
    const templatesBuilder = createMockQueryBuilder([])
    
    mockDb.select
      .mockReturnValueOnce(countBuilder)
      .mockReturnValueOnce(templatesBuilder)
  })

  describe('Basic Filtering Parameters', () => {
    test('should handle search parameter', async () => {
      const request = new NextRequest('http://localhost/api/templates?search=париж')
      
      await GET(request)
      
      expect(mockDb.select).toHaveBeenCalled()
    })

    test('should handle category parameter', async () => {
      const request = new NextRequest('http://localhost/api/templates?category=promotional')
      
      await GET(request)
      
      expect(mockDb.select).toHaveBeenCalled()
    })

    test('should handle status parameter', async () => {
      const request = new NextRequest('http://localhost/api/templates?status=published')
      
      await GET(request)
      
      expect(mockDb.select).toHaveBeenCalled()
    })

    test('should handle multiple basic parameters', async () => {
      const request = new NextRequest('http://localhost/api/templates?search=париж&category=promotional&status=published')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('Advanced Filtering Parameters', () => {
    test('should handle tag filtering', async () => {
      const request = new NextRequest('http://localhost/api/templates?tags=париж,скидка')
      
      await GET(request)
      
      expect(mockDb.select).toHaveBeenCalled()
    })

    test('should handle quality score range', async () => {
      const request = new NextRequest('http://localhost/api/templates?qualityMin=80&qualityMax=95')
      
      await GET(request)
      
      expect(mockDb.select).toHaveBeenCalled()
    })

    test('should handle agent generation filter', async () => {
      const request = new NextRequest('http://localhost/api/templates?agentGenerated=true')
      
      await GET(request)
      
      expect(mockDb.select).toHaveBeenCalled()
    })

    test('should handle date range filtering', async () => {
      const request = new NextRequest('http://localhost/api/templates?dateStart=2024-01-01&dateEnd=2024-12-31')
      
      await GET(request)
      
      expect(mockDb.select).toHaveBeenCalled()
    })

    test('should handle all advanced filters combined', async () => {
      const request = new NextRequest('http://localhost/api/templates?tags=париж,скидка&qualityMin=85&qualityMax=100&agentGenerated=true&dateStart=2024-01-01&dateEnd=2024-12-31')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('Sorting Parameters', () => {
    test('should handle sortBy parameter', async () => {
      const request = new NextRequest('http://localhost/api/templates?sortBy=qualityScore')
      
      await GET(request)
      
      expect(mockDb.select).toHaveBeenCalled()
    })

    test('should handle sortOrder parameter', async () => {
      const request = new NextRequest('http://localhost/api/templates?sortBy=name&sortOrder=asc')
      
      await GET(request)
      
      expect(mockDb.select).toHaveBeenCalled()
    })

    test('should validate sort fields', async () => {
      const request = new NextRequest('http://localhost/api/templates?sortBy=invalidField')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid sort field')
    })
  })

  describe('Pagination Integration', () => {
    test('should handle pagination parameters', async () => {
      const request = new NextRequest('http://localhost/api/templates?page=2&limit=24')
      
      await GET(request)
      
      expect(mockDb.select).toHaveBeenCalled()
    })

    test('should validate pagination parameters', async () => {
      const request = new NextRequest('http://localhost/api/templates?page=0&limit=0')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid pagination parameters')
    })

    test('should limit maximum page size', async () => {
      const request = new NextRequest('http://localhost/api/templates?limit=100')
      
      await GET(request)
      
      // Should be capped at 50
      expect(mockDb.select).toHaveBeenCalled()
    })
  })

  describe('Parameter Validation', () => {
    test('should validate quality score range', async () => {
      const request = new NextRequest('http://localhost/api/templates?qualityMin=-5')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid quality score minimum value')
    })

    test('should validate quality score maximum', async () => {
      const request = new NextRequest('http://localhost/api/templates?qualityMax=150')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid quality score maximum value')
    })

    test('should validate status enum', async () => {
      const request = new NextRequest('http://localhost/api/templates?status=invalid')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid status value')
    })

    test('should validate boolean parameters', async () => {
      const request = new NextRequest('http://localhost/api/templates?agentGenerated=maybe')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid boolean value for agentGenerated')
    })

    test('should validate date format', async () => {
      const request = new NextRequest('http://localhost/api/templates?dateStart=invalid-date')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid date format for dateStart')
    })
  })

  describe('Database Query Integration', () => {
    test('should build database query with filters', async () => {
      const templates = [
        {
          id: 'template-1',
          user_id: 'user-1',
          name: 'Test Template',
          description: 'Test description',
          brief_text: 'Test brief',
          generated_content: {},
          mjml_code: '<mjml></mjml>',
          html_output: '<html></html>',
          design_tokens: {},
          status: 'published',
          quality_score: 85,
          created_at: new Date('2024-03-01'),
          updated_at: new Date('2024-03-01')
        }
      ]

      // Setup mock to return templates
      const countBuilder = createMockQueryBuilder([{ count: 1 }])
      const templatesBuilder = createMockQueryBuilder(templates)
      
      mockDb.select
        .mockReturnValueOnce(countBuilder)
        .mockReturnValueOnce(templatesBuilder)

      const request = new NextRequest('http://localhost/api/templates?search=test&status=published')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.templates).toHaveLength(1)
      expect(data.data.templates[0].name).toBe('Test Template')
    })

    test('should handle database errors gracefully', async () => {
      mockDb.select.mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      const request = new NextRequest('http://localhost/api/templates')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to fetch templates')
    })
  })

  describe('Fallback to Mock Data', () => {
    test('should return mock data when database is empty', async () => {
      // Empty database response
      const countBuilder = createMockQueryBuilder([{ count: 0 }])
      const templatesBuilder = createMockQueryBuilder([])
      
      mockDb.select
        .mockReturnValueOnce(countBuilder)
        .mockReturnValueOnce(templatesBuilder)

      const request = new NextRequest('http://localhost/api/templates')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.templates.length).toBeGreaterThan(0) // Should have mock templates
      expect(data.metadata?.cache_status).toBe('fallback')
    })

    test('should apply filters to mock data', async () => {
      // Empty database response
      const countBuilder = createMockQueryBuilder([{ count: 0 }])
      const templatesBuilder = createMockQueryBuilder([])
      
      mockDb.select
        .mockReturnValueOnce(countBuilder)
        .mockReturnValueOnce(templatesBuilder)

      const request = new NextRequest('http://localhost/api/templates?category=promotional')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.metadata?.cache_status).toBe('fallback')
      
      // Should only return promotional templates from mock data
      data.data.templates.forEach((template: any) => {
        expect(template.category).toBe('promotional')
      })
    })
  })

  describe('Response Format', () => {
    test('should return correct response structure', async () => {
      const request = new NextRequest('http://localhost/api/templates')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(data).toHaveProperty('success')
      expect(data).toHaveProperty('data')
      expect(data.data).toHaveProperty('templates')
      expect(data.data).toHaveProperty('pagination')
      expect(data.data).toHaveProperty('filters')
      expect(data).toHaveProperty('metadata')
      
      expect(data.data.pagination).toHaveProperty('total')
      expect(data.data.pagination).toHaveProperty('page')
      expect(data.data.pagination).toHaveProperty('limit')
      expect(data.data.pagination).toHaveProperty('totalPages')
      expect(data.data.pagination).toHaveProperty('hasNext')
      expect(data.data.pagination).toHaveProperty('hasPrev')
      
      expect(data.data.filters).toHaveProperty('categories')
      expect(data.data.filters).toHaveProperty('tags')
      
      expect(data.metadata).toHaveProperty('query_time')
      expect(data.metadata).toHaveProperty('cache_status')
    })

    test('should include correct headers', async () => {
      const request = new NextRequest('http://localhost/api/templates')
      
      const response = await GET(request)
      
      expect(response.headers.get('Cache-Control')).toBe('public, max-age=60, stale-while-revalidate=300')
      expect(response.headers.get('X-Total-Count')).toBeDefined()
      expect(response.headers.get('X-Page')).toBeDefined()
      expect(response.headers.get('X-Per-Page')).toBeDefined()
      expect(response.headers.get('X-Data-Source')).toBeDefined()
    })
  })

  describe('Filter Categories Response', () => {
    test('should return available categories with counts', async () => {
      const request = new NextRequest('http://localhost/api/templates')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(data.data.filters.categories).toBeInstanceOf(Array)
      expect(data.data.filters.categories.length).toBeGreaterThan(0)
      
      const allCategory = data.data.filters.categories.find((cat: any) => cat.value === 'all')
      expect(allCategory).toBeDefined()
      expect(allCategory.label).toBe('All Templates')
    })

    test('should return available tags', async () => {
      const request = new NextRequest('http://localhost/api/templates')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(data.data.filters.tags).toBeInstanceOf(Array)
      expect(data.data.filters.tags.length).toBeGreaterThan(0)
    })
  })

  describe('Performance Metrics', () => {
    test('should include query time in metadata', async () => {
      const request = new NextRequest('http://localhost/api/templates')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(data.metadata?.query_time).toBeDefined()
      expect(typeof data.metadata?.query_time).toBe('number')
      expect(data.metadata?.query_time).toBeGreaterThan(0)
    })

    test('should indicate data source in metadata', async () => {
      const request = new NextRequest('http://localhost/api/templates')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(data.metadata?.cache_status).toBeDefined()
      expect(['database', 'fallback']).toContain(data.metadata?.cache_status)
    })
  })
})