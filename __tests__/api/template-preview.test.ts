import { NextRequest } from 'next/server'

// Mock the database connection
const mockDb = {
  select: jest.fn(),
  update: jest.fn()
}

jest.mock('@/shared/infrastructure/database/connection', () => ({
  db: mockDb
}))

const { GET, PUT } = require('@/app/api/templates/[id]/preview/route')

jest.mock('@/shared/infrastructure/database/schema', () => ({
  email_templates: {
    id: 'id',
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
  eq: jest.fn((field, value) => `${field} = ${value}`)
}))

const mockTemplateData = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Test Template',
  description: 'A test template description',
  brief_text: 'Test brief text',
  generated_content: {
    subject_line: 'Test Subject',
    preheader_text: 'Test Preheader',
    metadata: {
      generation_time: 1500,
      token_usage: 250,
      model: 'gpt-4o-mini',
      workflow: 'Standard',
      flow: 'Email Generation'
    },
    brief_type: 'text',
    tone: 'professional',
    target_audience: 'business users'
  },
  mjml_code: '<mjml><mj-body><mj-section><mj-column><mj-text>Test</mj-text></mj-column></mj-section></mj-body></mjml>',
  html_output: '<html><body><h1>Test Email</h1></body></html>',
  design_tokens: {
    colors: { primary: '#007bff' }
  },
  status: 'published',
  quality_score: 85,
  created_at: new Date('2023-12-01T10:00:00Z'),
  updated_at: new Date('2023-12-01T12:00:00Z')
}

describe('/api/templates/[id]/preview', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should return template preview data successfully', async () => {
      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockTemplateData])
      }
      mockDb.select.mockReturnValue(mockSelect)

      const request = new NextRequest('http://localhost:3000/api/templates/123e4567-e89b-12d3-a456-426614174000/preview')
      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe(mockTemplateData.id)
      expect(data.data.name).toBe(mockTemplateData.name)
      expect(data.data.html_content).toBe(mockTemplateData.html_output)
      expect(data.data.subject_line).toBe('Test Subject')
      expect(data.data.preheader_text).toBe('Test Preheader')
      expect(data.data.has_content).toBe(true)
      expect(data.data.content_length).toBe(45)
      expect(data.data.metadata.generation_time).toBe(1500)
    })

    it('should return 400 for missing template ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/templates//preview')
      const params = { id: '' }

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Template ID is required')
      expect(data.code).toBe('MISSING_TEMPLATE_ID')
    })

    it('should return 400 for invalid UUID format', async () => {
      const request = new NextRequest('http://localhost:3000/api/templates/invalid-uuid/preview')
      const params = { id: 'invalid-uuid' }

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid template ID format')
      expect(data.code).toBe('INVALID_TEMPLATE_ID')
    })

    it('should return 404 for non-existent template', async () => {
      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      }
      mockDb.select.mockReturnValue(mockSelect)

      const request = new NextRequest('http://localhost:3000/api/templates/123e4567-e89b-12d3-a456-426614174000/preview')
      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Template not found')
      expect(data.code).toBe('TEMPLATE_NOT_FOUND')
    })

    it('should handle database errors gracefully', async () => {
      mockDb.select.mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      const request = new NextRequest('http://localhost:3000/api/templates/123e4567-e89b-12d3-a456-426614174000/preview')
      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to load template preview')
      expect(data.code).toBe('PREVIEW_LOAD_ERROR')
    })

    it('should handle templates without generated content', async () => {
      const templateWithoutContent = {
        ...mockTemplateData,
        generated_content: null
      }

      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([templateWithoutContent])
      }
      mockDb.select.mockReturnValue(mockSelect)

      const request = new NextRequest('http://localhost:3000/api/templates/123e4567-e89b-12d3-a456-426614174000/preview')
      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.subject_line).toBe(null)
      expect(data.data.preheader_text).toBe(null)
      expect(data.data.metadata.generation_time).toBe(null)
    })

    it('should set appropriate cache headers', async () => {
      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockTemplateData])
      }
      mockDb.select.mockReturnValue(mockSelect)

      const request = new NextRequest('http://localhost:3000/api/templates/123e4567-e89b-12d3-a456-426614174000/preview')
      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }

      const response = await GET(request, { params })

      expect(response.headers.get('Cache-Control')).toBe('public, max-age=300, stale-while-revalidate=600')
      expect(response.headers.get('X-Template-ID')).toBe('123e4567-e89b-12d3-a456-426614174000')
      expect(response.headers.get('X-Query-Time')).toBeDefined()
    })
  })

  describe('PUT', () => {
    it('should update template content successfully', async () => {
      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ generated_content: mockTemplateData.generated_content }])
      }
      mockDb.select.mockReturnValue(mockSelect)

      const mockUpdate = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{
          id: mockTemplateData.id,
          name: mockTemplateData.name,
          updated_at: new Date()
        }])
      }
      mockDb.update.mockReturnValue(mockUpdate)

      const requestBody = {
        html_content: '<html><body><h2>Updated Content</h2></body></html>',
        subject_line: 'Updated Subject'
      }

      const request = new NextRequest('http://localhost:3000/api/templates/123e4567-e89b-12d3-a456-426614174000/preview', {
        method: 'PUT',
        body: JSON.stringify(requestBody)
      })
      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }

      const response = await PUT(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.content_updated).toBe(true)
      expect(data.data.metadata_updated).toBe(true)
    })

    it('should return 400 for missing template ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/templates//preview', {
        method: 'PUT',
        body: JSON.stringify({ html_content: '<html></html>' })
      })
      const params = { id: '' }

      const response = await PUT(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Template ID is required')
    })

    it('should return 400 for missing content', async () => {
      const request = new NextRequest('http://localhost:3000/api/templates/123e4567-e89b-12d3-a456-426614174000/preview', {
        method: 'PUT',
        body: JSON.stringify({ subject_line: 'Test' })
      })
      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }

      const response = await PUT(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Either HTML content or MJML code is required')
      expect(data.code).toBe('MISSING_CONTENT')
    })

    it('should handle update failure', async () => {
      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ generated_content: {} }])
      }
      mockDb.select.mockReturnValue(mockSelect)

      const mockUpdate = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([])
      }
      mockDb.update.mockReturnValue(mockUpdate)

      const request = new NextRequest('http://localhost:3000/api/templates/123e4567-e89b-12d3-a456-426614174000/preview', {
        method: 'PUT',
        body: JSON.stringify({ html_content: '<html></html>' })
      })
      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }

      const response = await PUT(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Template not found or update failed')
      expect(data.code).toBe('UPDATE_FAILED')
    })

    it('should handle database errors during update', async () => {
      mockDb.update.mockImplementation(() => {
        throw new Error('Database update failed')
      })

      const request = new NextRequest('http://localhost:3000/api/templates/123e4567-e89b-12d3-a456-426614174000/preview', {
        method: 'PUT',
        body: JSON.stringify({ html_content: '<html></html>' })
      })
      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }

      const response = await PUT(request, { params })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to update template preview')
      expect(data.code).toBe('PREVIEW_UPDATE_ERROR')
    })

    it('should update only MJML code without HTML', async () => {
      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ generated_content: {} }])
      }
      mockDb.select.mockReturnValue(mockSelect)

      const mockUpdate = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{
          id: mockTemplateData.id,
          name: mockTemplateData.name,
          updated_at: new Date()
        }])
      }
      mockDb.update.mockReturnValue(mockUpdate)

      const request = new NextRequest('http://localhost:3000/api/templates/123e4567-e89b-12d3-a456-426614174000/preview', {
        method: 'PUT',
        body: JSON.stringify({ mjml_code: '<mjml></mjml>' })
      })
      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }

      const response = await PUT(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.content_updated).toBe(true)
      expect(data.data.metadata_updated).toBe(false)
    })

    it('should update metadata without content', async () => {
      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ generated_content: {} }])
      }
      mockDb.select.mockReturnValue(mockSelect)

      const mockUpdate = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{
          id: mockTemplateData.id,
          name: mockTemplateData.name,
          updated_at: new Date()
        }])
      }
      mockDb.update.mockReturnValue(mockUpdate)

      const request = new NextRequest('http://localhost:3000/api/templates/123e4567-e89b-12d3-a456-426614174000/preview', {
        method: 'PUT',
        body: JSON.stringify({ 
          html_content: '<html></html>',
          preheader_text: 'Updated preheader'
        })
      })
      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }

      const response = await PUT(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.content_updated).toBe(true)
      expect(data.data.metadata_updated).toBe(true)
    })
  })
})