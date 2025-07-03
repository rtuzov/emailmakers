/**
 * Advanced Search API Tests
 * Тестирование /api/templates/search endpoint
 */

import { NextRequest } from 'next/server'
import { jest } from '@jest/globals'

// Mock database connection
const mockDb = {
  select: jest.fn(),
  from: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  offset: jest.fn()
}

jest.mock('@/shared/infrastructure/database/connection', () => ({
  db: mockDb
}))

// Import after mocking
const { POST } = require('@/app/api/templates/search/route')

jest.mock('@/shared/infrastructure/database/schema', () => ({
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
  }
}))

jest.mock('drizzle-orm', () => ({
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
  sql: jest.fn((query) => ({ type: 'sql', query }))
}))

const createMockQueryBuilder = (returnValue: any = []) => {
  const mockBuilder = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockResolvedValue(returnValue),
  }
  return mockBuilder
}

describe('🔍 Advanced Search API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('✅ Basic Search Functionality', () => {
    test('should handle simple search query', async () => {
      // Mock empty database to trigger fallback
      const countBuilder = createMockQueryBuilder([{ count: 0 }])
      const templatesBuilder = createMockQueryBuilder([])
      
      mockDb.select
        .mockReturnValueOnce(countBuilder)
        .mockReturnValueOnce(templatesBuilder)

      const request = new NextRequest('http://localhost/api/templates/search', {
        method: 'POST',
        body: JSON.stringify({
          query: 'париж',
          page: 1,
          limit: 12
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.searchInfo.query).toBe('париж')
      expect(data.data.templates.length).toBeGreaterThan(0) // Should find mock templates
      expect(data.metadata.search_method).toBe('fallback')
    })

    test('should handle advanced search operators', async () => {
      const countBuilder = createMockQueryBuilder([{ count: 0 }])
      const templatesBuilder = createMockQueryBuilder([])
      
      mockDb.select
        .mockReturnValueOnce(countBuilder)
        .mockReturnValueOnce(templatesBuilder)

      const request = new NextRequest('http://localhost/api/templates/search', {
        method: 'POST',
        body: JSON.stringify({
          query: '"горящие туры" -дорого name:париж',
          page: 1,
          limit: 12,
          sortBy: 'relevance'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.searchInfo.parsedQuery.exactPhrases).toContain('горящие туры')
      expect(data.data.searchInfo.parsedQuery.excludedTerms).toContain('дорого')
      expect(data.data.searchInfo.parsedQuery.fieldQueries).toContainEqual({
        field: 'name',
        value: 'париж'
      })
    })

    test('should apply relevance scoring correctly', async () => {
      const countBuilder = createMockQueryBuilder([{ count: 0 }])
      const templatesBuilder = createMockQueryBuilder([])
      
      mockDb.select
        .mockReturnValueOnce(countBuilder)
        .mockReturnValueOnce(templatesBuilder)

      const request = new NextRequest('http://localhost/api/templates/search', {
        method: 'POST',
        body: JSON.stringify({
          query: 'париж',
          sortBy: 'relevance',
          sortOrder: 'desc'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      
      // Check that templates have relevance scores
      const templates = data.data.templates
      expect(templates.length).toBeGreaterThan(0)
      expect(templates[0]).toHaveProperty('relevanceScore')
      
      // Check that they're sorted by relevance (descending)
      for (let i = 1; i < templates.length; i++) {
        expect(templates[i-1].relevanceScore).toBeGreaterThanOrEqual(templates[i].relevanceScore)
      }
    })
  })

  describe('✅ Search with Filters', () => {
    test('should apply status filter', async () => {
      const countBuilder = createMockQueryBuilder([{ count: 0 }])
      const templatesBuilder = createMockQueryBuilder([])
      
      mockDb.select
        .mockReturnValueOnce(countBuilder)
        .mockReturnValueOnce(templatesBuilder)

      const request = new NextRequest('http://localhost/api/templates/search', {
        method: 'POST',
        body: JSON.stringify({
          query: 'отдых',
          filters: {
            status: 'published'
          }
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      
      // All templates should be published
      data.data.templates.forEach((template: any) => {
        expect(template.status).toBe('published')
      })
    })

    test('should apply quality score range filter', async () => {
      const countBuilder = createMockQueryBuilder([{ count: 0 }])
      const templatesBuilder = createMockQueryBuilder([])
      
      mockDb.select
        .mockReturnValueOnce(countBuilder)
        .mockReturnValueOnce(templatesBuilder)

      const request = new NextRequest('http://localhost/api/templates/search', {
        method: 'POST',
        body: JSON.stringify({
          query: 'шаблон',
          filters: {
            qualityMin: 85,
            qualityMax: 100
          }
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      
      // All templates should be within quality range
      data.data.templates.forEach((template: any) => {
        if (template.qualityScore) {
          expect(template.qualityScore).toBeGreaterThanOrEqual(85)
          expect(template.qualityScore).toBeLessThanOrEqual(100)
        }
      })
    })

    test('should apply multiple filters combined', async () => {
      const countBuilder = createMockQueryBuilder([{ count: 0 }])
      const templatesBuilder = createMockQueryBuilder([])
      
      mockDb.select
        .mockReturnValueOnce(countBuilder)
        .mockReturnValueOnce(templatesBuilder)

      const request = new NextRequest('http://localhost/api/templates/search', {
        method: 'POST',
        body: JSON.stringify({
          query: 'подтверждение',
          filters: {
            status: 'published',
            qualityMin: 90,
            agentGenerated: true
          }
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      
      // Check all filters are applied
      data.data.templates.forEach((template: any) => {
        expect(template.status).toBe('published')
        if (template.qualityScore) {
          expect(template.qualityScore).toBeGreaterThanOrEqual(90)
        }
        expect(template.agentGenerated).toBe(true)
      })
    })
  })

  describe('✅ Search Results Enhancement', () => {
    test('should include highlighted terms', async () => {
      const countBuilder = createMockQueryBuilder([{ count: 0 }])
      const templatesBuilder = createMockQueryBuilder([])
      
      mockDb.select
        .mockReturnValueOnce(countBuilder)
        .mockReturnValueOnce(templatesBuilder)

      const request = new NextRequest('http://localhost/api/templates/search', {
        method: 'POST',
        body: JSON.stringify({
          query: 'париж'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      
      // Check that templates have highlighting
      const matchingTemplates = data.data.templates.filter((t: any) => 
        t.highlightedName?.includes('<mark>') || t.highlightedDescription?.includes('<mark>')
      )
      expect(matchingTemplates.length).toBeGreaterThan(0)
    })

    test('should include search snippets', async () => {
      const countBuilder = createMockQueryBuilder([{ count: 0 }])
      const templatesBuilder = createMockQueryBuilder([])
      
      mockDb.select
        .mockReturnValueOnce(countBuilder)
        .mockReturnValueOnce(templatesBuilder)

      const request = new NextRequest('http://localhost/api/templates/search', {
        method: 'POST',
        body: JSON.stringify({
          query: 'подтверждение'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      
      // Check that templates have snippets
      data.data.templates.forEach((template: any) => {
        expect(template).toHaveProperty('snippet')
        expect(typeof template.snippet).toBe('string')
      })
    })

    test('should include search metadata', async () => {
      const countBuilder = createMockQueryBuilder([{ count: 0 }])
      const templatesBuilder = createMockQueryBuilder([])
      
      mockDb.select
        .mockReturnValueOnce(countBuilder)
        .mockReturnValueOnce(templatesBuilder)

      const request = new NextRequest('http://localhost/api/templates/search', {
        method: 'POST',
        body: JSON.stringify({
          query: 'тест'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      
      // Check search info
      expect(data.data.searchInfo).toHaveProperty('query')
      expect(data.data.searchInfo).toHaveProperty('parsedQuery')
      expect(data.data.searchInfo).toHaveProperty('totalMatches')
      expect(data.data.searchInfo).toHaveProperty('searchTime')
      expect(typeof data.data.searchInfo.searchTime).toBe('number')
      expect(data.data.searchInfo.searchTime).toBeGreaterThan(0)
    })
  })

  describe('✅ Pagination and Sorting', () => {
    test('should handle pagination correctly', async () => {
      const countBuilder = createMockQueryBuilder([{ count: 0 }])
      const templatesBuilder = createMockQueryBuilder([])
      
      mockDb.select
        .mockReturnValueOnce(countBuilder)
        .mockReturnValueOnce(templatesBuilder)

      const request = new NextRequest('http://localhost/api/templates/search', {
        method: 'POST',
        body: JSON.stringify({
          query: 'шаблон',
          page: 2,
          limit: 5
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.pagination.page).toBe(2)
      expect(data.data.pagination.limit).toBe(5)
      expect(data.data.templates.length).toBeLessThanOrEqual(5)
    })

    test('should handle different sort options', async () => {
      const countBuilder = createMockQueryBuilder([{ count: 0 }])
      const templatesBuilder = createMockQueryBuilder([])
      
      mockDb.select
        .mockReturnValueOnce(countBuilder)
        .mockReturnValueOnce(templatesBuilder)

      const request = new NextRequest('http://localhost/api/templates/search', {
        method: 'POST',
        body: JSON.stringify({
          query: 'тест',
          sortBy: 'qualityScore',
          sortOrder: 'desc'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      
      // Check sorting by quality score
      const templates = data.data.templates
      for (let i = 1; i < templates.length; i++) {
        if (templates[i-1].qualityScore && templates[i].qualityScore) {
          expect(templates[i-1].qualityScore).toBeGreaterThanOrEqual(templates[i].qualityScore)
        }
      }
    })
  })

  describe('✅ Error Handling and Validation', () => {
    test('should validate search query', async () => {
      const request = new NextRequest('http://localhost/api/templates/search', {
        method: 'POST',
        body: JSON.stringify({
          query: ''
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid search query')
    })

    test('should validate pagination parameters', async () => {
      const request = new NextRequest('http://localhost/api/templates/search', {
        method: 'POST',
        body: JSON.stringify({
          query: 'тест',
          page: 0,
          limit: 100
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid pagination parameters')
    })

    test('should handle unmatched quotes in query', async () => {
      const request = new NextRequest('http://localhost/api/templates/search', {
        method: 'POST',
        body: JSON.stringify({
          query: 'тест "незакрытая кавычка'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid search query')
      expect(data.message).toContain('Unmatched quotes')
    })

    test('should handle database errors gracefully', async () => {
      mockDb.select.mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      const request = new NextRequest('http://localhost/api/templates/search', {
        method: 'POST',
        body: JSON.stringify({
          query: 'тест'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Search failed')
    })
  })

  describe('✅ Performance and Caching', () => {
    test('should include proper cache headers', async () => {
      const countBuilder = createMockQueryBuilder([{ count: 0 }])
      const templatesBuilder = createMockQueryBuilder([])
      
      mockDb.select
        .mockReturnValueOnce(countBuilder)
        .mockReturnValueOnce(templatesBuilder)

      const request = new NextRequest('http://localhost/api/templates/search', {
        method: 'POST',
        body: JSON.stringify({
          query: 'тест'
        })
      })

      const response = await POST(request)

      expect(response.headers.get('Cache-Control')).toBe('public, max-age=30, stale-while-revalidate=60')
      expect(response.headers.get('X-Search-Method')).toBeDefined()
      expect(response.headers.get('X-Search-Time')).toBeDefined()
    })

    test('should complete search within reasonable time', async () => {
      const countBuilder = createMockQueryBuilder([{ count: 0 }])
      const templatesBuilder = createMockQueryBuilder([])
      
      mockDb.select
        .mockReturnValueOnce(countBuilder)
        .mockReturnValueOnce(templatesBuilder)

      const startTime = Date.now()
      
      const request = new NextRequest('http://localhost/api/templates/search', {
        method: 'POST',
        body: JSON.stringify({
          query: 'производительность'
        })
      })

      const response = await POST(request)
      const endTime = Date.now()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(endTime - startTime).toBeLessThan(1000) // Should complete in under 1 second
      expect(data.metadata.query_time).toBeGreaterThanOrEqual(0)
    })
  })

  describe('✅ Search Result Quality', () => {
    test('should find relevant results for Russian queries', async () => {
      const countBuilder = createMockQueryBuilder([{ count: 0 }])
      const templatesBuilder = createMockQueryBuilder([])
      
      mockDb.select
        .mockReturnValueOnce(countBuilder)
        .mockReturnValueOnce(templatesBuilder)

      const request = new NextRequest('http://localhost/api/templates/search', {
        method: 'POST',
        body: JSON.stringify({
          query: 'добро пожаловать'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      
      // Should find the welcome template
      const welcomeTemplate = data.data.templates.find((t: any) => 
        t.name.toLowerCase().includes('добро пожаловать')
      )
      expect(welcomeTemplate).toBeDefined()
      expect(welcomeTemplate.relevanceScore).toBeGreaterThan(0)
    })

    test('should prioritize exact phrase matches', async () => {
      const countBuilder = createMockQueryBuilder([{ count: 0 }])
      const templatesBuilder = createMockQueryBuilder([])
      
      mockDb.select
        .mockReturnValueOnce(countBuilder)
        .mockReturnValueOnce(templatesBuilder)

      const request = new NextRequest('http://localhost/api/templates/search', {
        method: 'POST',
        body: JSON.stringify({
          query: '"горящие предложения"',
          sortBy: 'relevance'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      
      if (data.data.templates.length > 0) {
        const topResult = data.data.templates[0]
        expect(topResult.relevanceScore).toBeGreaterThan(0)
        // Exact phrase should get high relevance
        const hasExactPhrase = topResult.name.toLowerCase().includes('горящие предложения') ||
                              topResult.description.toLowerCase().includes('горящие предложения')
        if (hasExactPhrase) {
          expect(topResult.relevanceScore).toBeGreaterThan(20) // High score for exact phrase
        }
      }
    })
  })
})