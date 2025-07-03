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
    name: 'name',
    description: 'description',
    mjml_code: 'mjml_code',
    html_output: 'html_output',
    generated_content: 'generated_content',
    status: 'status',
    created_at: 'created_at',
    updated_at: 'updated_at',
    design_tokens: 'design_tokens',
    quality_score: 'quality_score'
  }
}))

jest.mock('drizzle-orm', () => ({
  eq: jest.fn((field, value) => `${field} = ${value}`)
}))

// Mock JSZip
const mockZip = {
  file: jest.fn(),
  generateAsync: jest.fn().mockResolvedValue(Buffer.from('mock-zip-content'))
}
jest.mock('jszip', () => {
  return jest.fn().mockImplementation(() => mockZip)
})

const { GET, POST } = require('@/app/api/templates/[id]/download/route')

const mockTemplateData = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Test Template',
  description: 'A test template description',
  mjml_code: '<mjml><mj-body><mj-section><mj-column><mj-text>Test</mj-text></mj-column></mj-section></mj-body></mjml>',
  html_output: '<html><body><h1>Test Email</h1></body></html>',
  generated_content: {
    subject_line: 'Test Subject',
    preheader_text: 'Test Preheader',
    metadata: {
      generation_time: 1500,
      token_usage: 250,
      model: 'gpt-4o-mini'
    }
  },
  status: 'published',
  created_at: new Date('2023-12-01T10:00:00Z'),
  updated_at: new Date('2023-12-01T12:00:00Z'),
  design_tokens: { colors: { primary: '#007bff' } },
  quality_score: 85
}

describe('/api/templates/[id]/download', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockZip.file.mockClear()
    mockZip.generateAsync.mockClear()
  })

  describe('GET', () => {
    it('should download HTML template successfully', async () => {
      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockTemplateData])
      }
      mockDb.select.mockReturnValue(mockSelect)

      const request = new NextRequest('http://localhost:3000/api/templates/123e4567-e89b-12d3-a456-426614174000/download?format=html')
      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }

      const response = await GET(request, { params })
      const content = await response.text()

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('text/html')
      expect(response.headers.get('Content-Disposition')).toContain('attachment')
      expect(response.headers.get('Content-Disposition')).toContain('.html')
      expect(content).toBe(mockTemplateData.html_output)
    })

    it('should download MJML template successfully', async () => {
      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockTemplateData])
      }
      mockDb.select.mockReturnValue(mockSelect)

      const request = new NextRequest('http://localhost:3000/api/templates/123e4567-e89b-12d3-a456-426614174000/download?format=mjml')
      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }

      const response = await GET(request, { params })
      const content = await response.text()

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('text/plain')
      expect(response.headers.get('Content-Disposition')).toContain('attachment')
      expect(response.headers.get('Content-Disposition')).toContain('.mjml')
      expect(content).toBe(mockTemplateData.mjml_code)
    })

    it('should download both formats as ZIP', async () => {
      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockTemplateData])
      }
      mockDb.select.mockReturnValue(mockSelect)

      const request = new NextRequest('http://localhost:3000/api/templates/123e4567-e89b-12d3-a456-426614174000/download?format=both')
      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }

      const response = await GET(request, { params })

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('application/zip')
      expect(response.headers.get('Content-Disposition')).toContain('attachment')
      expect(response.headers.get('Content-Disposition')).toContain('.zip')
      expect(mockZip.file).toHaveBeenCalledWith(expect.stringContaining('.html'), mockTemplateData.html_output)
      expect(mockZip.file).toHaveBeenCalledWith(expect.stringContaining('.mjml'), mockTemplateData.mjml_code)
      expect(mockZip.file).toHaveBeenCalledWith(expect.stringContaining('-metadata.json'), expect.any(String))
    })

    it('should return 400 for missing template ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/templates//download')
      const params = { id: '' }

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Template ID is required')
      expect(data.code).toBe('MISSING_TEMPLATE_ID')
    })

    it('should return 400 for invalid UUID format', async () => {
      const request = new NextRequest('http://localhost:3000/api/templates/invalid-uuid/download')
      const params = { id: 'invalid-uuid' }

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid template ID format')
      expect(data.code).toBe('INVALID_TEMPLATE_ID')
    })

    it('should return 400 for invalid format parameter', async () => {
      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockTemplateData])
      }
      mockDb.select.mockReturnValue(mockSelect)

      const request = new NextRequest('http://localhost:3000/api/templates/123e4567-e89b-12d3-a456-426614174000/download?format=invalid')
      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid format. Must be html, mjml, or both')
      expect(data.code).toBe('INVALID_FORMAT')
    })

    it('should return 404 for non-existent template', async () => {
      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      }
      mockDb.select.mockReturnValue(mockSelect)

      const request = new NextRequest('http://localhost:3000/api/templates/123e4567-e89b-12d3-a456-426614174000/download?format=html')
      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Template not found')
      expect(data.code).toBe('TEMPLATE_NOT_FOUND')
    })

    it('should return 404 when HTML content not available', async () => {
      const templateWithoutHTML = {
        ...mockTemplateData,
        html_output: null
      }

      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([templateWithoutHTML])
      }
      mockDb.select.mockReturnValue(mockSelect)

      const request = new NextRequest('http://localhost:3000/api/templates/123e4567-e89b-12d3-a456-426614174000/download?format=html')
      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('HTML content not available for this template')
      expect(data.code).toBe('HTML_NOT_AVAILABLE')
    })

    it('should return 404 when MJML content not available', async () => {
      const templateWithoutMJML = {
        ...mockTemplateData,
        mjml_code: null
      }

      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([templateWithoutMJML])
      }
      mockDb.select.mockReturnValue(mockSelect)

      const request = new NextRequest('http://localhost:3000/api/templates/123e4567-e89b-12d3-a456-426614174000/download?format=mjml')
      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('MJML content not available for this template')
      expect(data.code).toBe('MJML_NOT_AVAILABLE')
    })

    it('should handle database errors gracefully', async () => {
      mockDb.select.mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      const request = new NextRequest('http://localhost:3000/api/templates/123e4567-e89b-12d3-a456-426614174000/download?format=html')
      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to download template')
      expect(data.code).toBe('DOWNLOAD_ERROR')
    })

    it('should set appropriate headers', async () => {
      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockTemplateData])
      }
      mockDb.select.mockReturnValue(mockSelect)

      const request = new NextRequest('http://localhost:3000/api/templates/123e4567-e89b-12d3-a456-426614174000/download?format=html')
      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }

      const response = await GET(request, { params })

      expect(response.headers.get('X-Template-ID')).toBe('123e4567-e89b-12d3-a456-426614174000')
      expect(response.headers.get('X-Query-Time')).toBeDefined()
      expect(response.headers.get('X-Download-Format')).toBe('html')
    })
  })

  describe('POST', () => {
    it('should download template with custom options', async () => {
      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockTemplateData])
      }
      mockDb.select.mockReturnValue(mockSelect)

      const requestBody = {
        format: 'html',
        include_metadata: true,
        filename_prefix: 'custom',
        packaging: 'zip'
      }

      const request = new NextRequest('http://localhost:3000/api/templates/123e4567-e89b-12d3-a456-426614174000/download', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })
      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }

      const response = await POST(request, { params })

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('application/zip')
      expect(response.headers.get('X-Packaging')).toBe('zip')
      expect(mockZip.file).toHaveBeenCalledWith(expect.stringContaining('custom-'), mockTemplateData.html_output)
      expect(mockZip.file).toHaveBeenCalledWith(expect.stringContaining('-metadata.json'), expect.any(String))
    })

    it('should download single file when packaging is single', async () => {
      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockTemplateData])
      }
      mockDb.select.mockReturnValue(mockSelect)

      const requestBody = {
        format: 'html',
        include_metadata: false,
        packaging: 'single'
      }

      const request = new NextRequest('http://localhost:3000/api/templates/123e4567-e89b-12d3-a456-426614174000/download', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })
      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }

      const response = await POST(request, { params })
      const content = await response.text()

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('text/html')
      expect(content).toBe(mockTemplateData.html_output)
    })

    it('should return 400 for missing template ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/templates//download', {
        method: 'POST',
        body: JSON.stringify({ format: 'html' })
      })
      const params = { id: '' }

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Template ID is required')
    })

    it('should return 404 for non-existent template', async () => {
      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      }
      mockDb.select.mockReturnValue(mockSelect)

      const request = new NextRequest('http://localhost:3000/api/templates/123e4567-e89b-12d3-a456-426614174000/download', {
        method: 'POST',
        body: JSON.stringify({ format: 'html' })
      })
      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Template not found')
    })

    it('should return 404 when requested content not available', async () => {
      const templateWithoutHTML = {
        ...mockTemplateData,
        html_output: null
      }

      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([templateWithoutHTML])
      }
      mockDb.select.mockReturnValue(mockSelect)

      const request = new NextRequest('http://localhost:3000/api/templates/123e4567-e89b-12d3-a456-426614174000/download', {
        method: 'POST',
        body: JSON.stringify({ format: 'html', packaging: 'single' })
      })
      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }

      const response = await POST(request, { params })
      
      // Should return ZIP with available content, not 404
      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('application/zip')
    })

    it('should handle database errors gracefully', async () => {
      mockDb.select.mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      const request = new NextRequest('http://localhost:3000/api/templates/123e4567-e89b-12d3-a456-426614174000/download', {
        method: 'POST',
        body: JSON.stringify({ format: 'html' })
      })
      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to download template')
      expect(data.code).toBe('DOWNLOAD_ERROR')
    })

    it('should include design tokens in metadata when available', async () => {
      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockTemplateData])
      }
      mockDb.select.mockReturnValue(mockSelect)

      const requestBody = {
        format: 'html',
        include_metadata: true,
        packaging: 'zip'
      }

      const request = new NextRequest('http://localhost:3000/api/templates/123e4567-e89b-12d3-a456-426614174000/download', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })
      const params = { id: '123e4567-e89b-12d3-a456-426614174000' }

      await POST(request, { params })

      // Check that metadata was added to ZIP
      const metadataCall = mockZip.file.mock.calls.find(call => 
        call[0].includes('-metadata.json')
      )
      expect(metadataCall).toBeDefined()

      const metadataContent = JSON.parse(metadataCall[1])
      expect(metadataContent.design_tokens).toEqual(mockTemplateData.design_tokens)
      expect(metadataContent.template.quality_score).toBe(mockTemplateData.quality_score)
    })
  })
})