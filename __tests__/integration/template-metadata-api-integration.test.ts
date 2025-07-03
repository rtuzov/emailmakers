/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'

// Mock the database connection
const mockDb = {
  select: jest.fn()
}

jest.mock('@/shared/infrastructure/database/connection', () => ({
  db: mockDb
}))

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
  eq: jest.fn((field, value) => `${field} = ${value}`),
  like: jest.fn((field, value) => `${field} LIKE ${value}`),
  and: jest.fn((...conditions) => `(${conditions.join(' AND ')})`),
  or: jest.fn((...conditions) => `(${conditions.join(' OR ')})`),
  ilike: jest.fn((field, value) => `${field} ILIKE ${value}`),
  desc: jest.fn((field) => `${field} DESC`),
  asc: jest.fn((field) => `${field} ASC`),
  count: jest.fn(() => 'COUNT(*)'),
  sql: jest.fn((template, ...values) => ({ template, values })),
  gte: jest.fn((field, value) => `${field} >= ${value}`),
  lte: jest.fn((field, value) => `${field} <= ${value}`),
  between: jest.fn((field, min, max) => `${field} BETWEEN ${min} AND ${max}`)
}))

const { GET } = require('@/app/api/templates/route')

// Enhanced mock template data with comprehensive metadata
const mockDbTemplate = {
  id: 'db-template-1',
  user_id: 'user-123',
  name: 'Professional Newsletter Template',
  description: 'A comprehensive newsletter template with AI-generated content',
  brief_text: 'Create a professional newsletter for business updates',
  generated_content: {
    subject_line: 'Weekly Business Updates - Key Insights Inside',
    preheader_text: 'Stay informed with the latest developments and opportunities',
    metadata: {
      generation_time: 2150,
      token_usage: 450,
      model: 'gpt-4o-mini',
      workflow: 'Advanced',
      flow: 'Newsletter Generation'
    },
    brief_type: 'text',
    tone: 'professional',
    target_audience: 'business professionals'
  },
  mjml_code: '<mjml><mj-body><mj-section><mj-column><mj-text>Professional Newsletter Content</mj-text></mj-column></mj-section></mj-body></mjml>',
  html_output: '<html><body><h1>Professional Newsletter</h1><p>Weekly business updates content</p></body></html>',
  design_tokens: {
    colors: {
      primary: '#1e40af',
      secondary: '#6366f1'
    },
    fonts: {
      heading: 'Inter',
      body: 'Open Sans'
    }
  },
  status: 'published',
  quality_score: 94,
  created_at: new Date('2024-03-05T10:30:00Z'),
  updated_at: new Date('2024-03-05T11:45:00Z')
}

const mockDbTemplateMinimal = {
  id: 'db-template-2',
  user_id: 'user-123',
  name: 'Simple Notification',
  description: 'Basic notification template',
  brief_text: 'Simple notification message',
  generated_content: {
    subject_line: 'Important Notification',
    metadata: {
      generation_time: 800,
      model: 'gpt-4o-mini'
      // Missing token_usage, workflow, flow
    }
    // Missing preheader_text, brief_type, tone, target_audience
  },
  mjml_code: '<mjml><mj-body><mj-section><mj-column><mj-text>Notification</mj-text></mj-column></mj-section></mj-body></mjml>',
  html_output: '<html><body><p>Notification content</p></body></html>',
  design_tokens: null,
  status: 'draft',
  quality_score: 78,
  created_at: new Date('2024-03-04T14:20:00Z'),
  updated_at: new Date('2024-03-04T14:20:00Z')
}

const mockDbTemplateEmpty = {
  id: 'db-template-3',
  user_id: 'user-123',
  name: 'Legacy Template',
  description: 'Template created before AI generation',
  brief_text: 'Manual template creation',
  generated_content: null, // No generated content
  mjml_code: '<mjml><mj-body><mj-section><mj-column><mj-text>Legacy</mj-text></mj-column></mj-section></mj-body></mjml>',
  html_output: '<html><body><p>Legacy content</p></body></html>',
  design_tokens: null,
  status: 'published',
  quality_score: null, // No quality score
  created_at: new Date('2024-03-01T09:15:00Z'),
  updated_at: new Date('2024-03-01T09:15:00Z')
}

describe('Template Metadata API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Database Template Metadata Retrieval', () => {
    it('should return comprehensive metadata for fully populated templates', async () => {
      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue([mockDbTemplate])
      }
      mockDb.select.mockReturnValue(mockSelect)

      // Mock count query
      const mockCountSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ count: 1 }])
      }
      mockDb.select.mockReturnValueOnce(mockCountSelect).mockReturnValue(mockSelect)

      const request = new NextRequest('http://localhost:3000/api/templates')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.templates).toHaveLength(1)

      const template = data.data.templates[0]
      
      // Check basic template information
      expect(template.id).toBe('db-template-1')
      expect(template.name).toBe('Professional Newsletter Template')
      expect(template.qualityScore).toBe(94)
      expect(template.agentGenerated).toBe(true)

      // Check generated content metadata
      expect(template.generatedContent).toBeDefined()
      expect(template.generatedContent.subject_line).toBe('Weekly Business Updates - Key Insights Inside')
      expect(template.generatedContent.preheader_text).toBe('Stay informed with the latest developments and opportunities')
      
      // Check generation metadata
      expect(template.generatedContent.metadata).toBeDefined()
      expect(template.generatedContent.metadata.generation_time).toBe(2150)
      expect(template.generatedContent.metadata.token_usage).toBe(450)
      expect(template.generatedContent.metadata.model).toBe('gpt-4o-mini')
      expect(template.generatedContent.metadata.workflow).toBe('Advanced')
      expect(template.generatedContent.metadata.flow).toBe('Newsletter Generation')

      // Check additional content metadata
      expect(template.generatedContent.brief_type).toBe('text')
      expect(template.generatedContent.tone).toBe('professional')
      expect(template.generatedContent.target_audience).toBe('business professionals')

      // Check database-specific fields
      expect(template.briefText).toBe('Create a professional newsletter for business updates')
      expect(template.mjmlCode).toContain('<mjml>')
      expect(template.htmlOutput).toContain('<html>')
      expect(template.designTokens).toBeDefined()
      expect(template.designTokens.colors.primary).toBe('#1e40af')
    })

    it('should handle templates with partial metadata gracefully', async () => {
      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue([mockDbTemplateMinimal])
      }
      mockDb.select.mockReturnValue(mockSelect)

      const mockCountSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ count: 1 }])
      }
      mockDb.select.mockReturnValueOnce(mockCountSelect).mockReturnValue(mockSelect)

      const request = new NextRequest('http://localhost:3000/api/templates')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      const template = data.data.templates[0]
      
      // Check that partial metadata is preserved
      expect(template.generatedContent.subject_line).toBe('Important Notification')
      expect(template.generatedContent.preheader_text).toBeUndefined()
      
      expect(template.generatedContent.metadata.generation_time).toBe(800)
      expect(template.generatedContent.metadata.model).toBe('gpt-4o-mini')
      expect(template.generatedContent.metadata.token_usage).toBeUndefined()
      expect(template.generatedContent.metadata.workflow).toBeUndefined()

      // Check quality score handling
      expect(template.qualityScore).toBe(78)

      // Check missing fields are handled gracefully
      expect(template.designTokens).toBeNull()
    })

    it('should handle templates without generated content', async () => {
      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue([mockDbTemplateEmpty])
      }
      mockDb.select.mockReturnValue(mockSelect)

      const mockCountSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ count: 1 }])
      }
      mockDb.select.mockReturnValueOnce(mockCountSelect).mockReturnValue(mockSelect)

      const request = new NextRequest('http://localhost:3000/api/templates')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      const template = data.data.templates[0]
      
      // Check that null generated content is handled
      expect(template.generatedContent).toBeNull()
      expect(template.qualityScore).toBeUndefined() // null quality score becomes undefined
      expect(template.agentGenerated).toBe(true) // Default value

      // Check that other fields are still available
      expect(template.name).toBe('Legacy Template')
      expect(template.description).toBe('Template created before AI generation')
      expect(template.briefText).toBe('Manual template creation')
    })
  })

  describe('Quality Score Filtering with Metadata', () => {
    it('should filter templates by quality score range and return metadata', async () => {
      const allTemplates = [mockDbTemplate, mockDbTemplateMinimal, mockDbTemplateEmpty]
      
      // Return templates that match quality filter (94 >= 80, 78 < 80)
      const filteredTemplates = [mockDbTemplate] // Only the high quality template
      
      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue(filteredTemplates)
      }
      mockDb.select.mockReturnValue(mockSelect)

      const mockCountSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ count: 1 }])
      }
      mockDb.select.mockReturnValueOnce(mockCountSelect).mockReturnValue(mockSelect)

      const request = new NextRequest('http://localhost:3000/api/templates?qualityMin=80')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.templates).toHaveLength(1)

      // Check that high quality template has its metadata
      const highQualityTemplate = data.data.templates[0]
      expect(highQualityTemplate.qualityScore).toBe(94)
      expect(highQualityTemplate.generatedContent.metadata.generation_time).toBe(2150)
      expect(highQualityTemplate.generatedContent.metadata.model).toBe('gpt-4o-mini')
    })

    it('should handle quality score validation with proper error messages', async () => {
      const request = new NextRequest('http://localhost:3000/api/templates?qualityMin=150')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid quality score minimum value')
    })
  })

  describe('Metadata Sorting and Pagination', () => {
    it('should sort templates by quality score with metadata preserved', async () => {
      const sortedTemplates = [mockDbTemplate, mockDbTemplateMinimal] // Sorted by quality score desc
      
      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue(sortedTemplates)
      }
      mockDb.select.mockReturnValue(mockSelect)

      const mockCountSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ count: 2 }])
      }
      mockDb.select.mockReturnValueOnce(mockCountSelect).mockReturnValue(mockSelect)

      const request = new NextRequest('http://localhost:3000/api/templates?sortBy=qualityScore&sortOrder=desc')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.templates).toHaveLength(2)

      // Check sorting order
      expect(data.data.templates[0].qualityScore).toBe(94)
      expect(data.data.templates[1].qualityScore).toBe(78)

      // Check that metadata is preserved during sorting
      expect(data.data.templates[0].generatedContent.metadata.generation_time).toBe(2150)
      expect(data.data.templates[1].generatedContent.metadata.generation_time).toBe(800)
    })

    it('should handle pagination with metadata correctly', async () => {
      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue([mockDbTemplate]) // Only first template
      }
      mockDb.select.mockReturnValue(mockSelect)

      const mockCountSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ count: 3 }])
      }
      mockDb.select.mockReturnValueOnce(mockCountSelect).mockReturnValue(mockSelect)

      const request = new NextRequest('http://localhost:3000/api/templates?page=1&limit=1')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.templates).toHaveLength(1)
      expect(data.data.pagination.total).toBe(3)
      expect(data.data.pagination.page).toBe(1)
      expect(data.data.pagination.totalPages).toBe(3)
      expect(data.data.pagination.hasNext).toBe(true)

      // Check that metadata is included in paginated results
      expect(data.data.templates[0].generatedContent.metadata.generation_time).toBe(2150)
    })
  })

  describe('API Response Headers and Metadata', () => {
    it('should include appropriate response headers for metadata queries', async () => {
      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue([mockDbTemplate])
      }
      mockDb.select.mockReturnValue(mockSelect)

      const mockCountSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ count: 1 }])
      }
      mockDb.select.mockReturnValueOnce(mockCountSelect).mockReturnValue(mockSelect)

      const request = new NextRequest('http://localhost:3000/api/templates')
      const response = await GET(request)

      expect(response.headers.get('Cache-Control')).toBe('public, max-age=60, stale-while-revalidate=300')
      expect(response.headers.get('X-Total-Count')).toBe('1')
      expect(response.headers.get('X-Page')).toBe('1')
      expect(response.headers.get('X-Per-Page')).toBe('12')
      expect(response.headers.get('X-Data-Source')).toBe('database')
    })

    it('should include API response metadata with timing information', async () => {
      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue([mockDbTemplate])
      }
      mockDb.select.mockReturnValue(mockSelect)

      const mockCountSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ count: 1 }])
      }
      mockDb.select.mockReturnValueOnce(mockCountSelect).mockReturnValue(mockSelect)

      const request = new NextRequest('http://localhost:3000/api/templates')
      const response = await GET(request)
      const data = await response.json()

      expect(data.metadata).toBeDefined()
      expect(data.metadata.query_time).toBeDefined()
      expect(typeof data.metadata.query_time).toBe('number')
      expect(data.metadata.cache_status).toBe('database')
    })
  })

  describe('Error Handling with Metadata Context', () => {
    it('should handle database errors gracefully and provide helpful error context', async () => {
      mockDb.select.mockImplementation(() => {
        throw new Error('Database connection failed during metadata query')
      })

      const request = new NextRequest('http://localhost:3000/api/templates')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to fetch templates')
      expect(data.code).toBe('TEMPLATES_FETCH_ERROR')
      expect(data.timestamp).toBeDefined()
    })

    it('should validate metadata-related query parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/templates?qualityMin=invalid')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid quality score minimum value')
    })
  })

  describe('Fallback to Mock Data with Metadata', () => {
    it('should include metadata in mock data fallback when database is empty', async () => {
      // Simulate empty database
      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue([])
      }
      mockDb.select.mockReturnValue(mockSelect)

      const mockCountSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ count: 0 }])
      }
      mockDb.select.mockReturnValueOnce(mockCountSelect).mockReturnValue(mockSelect)

      const request = new NextRequest('http://localhost:3000/api/templates')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.templates.length).toBeGreaterThan(0) // Mock data fallback
      expect(data.metadata.cache_status).toBe('fallback')

      // Check that mock data includes quality scores and basic metadata
      const templateWithQuality = data.data.templates.find(t => t.qualityScore)
      expect(templateWithQuality).toBeDefined()
      expect(templateWithQuality.agentGenerated).toBe(true)
      expect(templateWithQuality.subjectLine).toBeDefined()
    })
  })
})