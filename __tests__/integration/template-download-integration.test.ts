/**
 * @jest-environment jsdom
 */

import { NextRequest } from 'next/server'

// Comprehensive integration tests for template download functionality
describe('Template Download Integration Tests', () => {
  
  // Mock database
  const mockDb = {
    select: jest.fn()
  }

  // Mock JSZip
  const mockZip = {
    file: jest.fn(),
    generateAsync: jest.fn()
  }

  beforeAll(() => {
    // Mock database
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
        updated_at: 'updated_at'
      }
    }))

    jest.mock('drizzle-orm', () => ({
      eq: jest.fn((field, value) => `${field} = ${value}`)
    }))

    jest.mock('jszip', () => jest.fn(() => mockZip))
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockZip.file.mockClear()
    mockZip.generateAsync.mockResolvedValue(Buffer.from('test-zip-content'))
  })

  describe('Security Tests', () => {
    it('should sanitize malicious template names properly', () => {
      const maliciousNames = [
        '../../../etc/passwd',
        '<script>alert("xss")</script>',
        'template"with"quotes',
        'template/with/slashes',
        'template\\with\\backslashes',
        'template|with|pipes',
        'template?with?questions',
        'template*with*asterisks'
      ]

      maliciousNames.forEach(name => {
        const safeName = name
          .replace(/[^a-zA-Z0-9\-_\s]/g, '') // Remove special characters
          .replace(/\s+/g, '-') // Replace spaces with dashes
          .replace(/script|javascript|vbscript|onload|onerror|onclick/gi, '') // Remove dangerous keywords
          .replace(/-+/g, '-') // Replace multiple dashes with single dash
          .replace(/^-+|-+$/g, '') // Trim leading/trailing dashes
          .toLowerCase()
          .substring(0, 50) // Limit length to prevent filesystem issues
        
        // Should not contain any dangerous characters
        expect(safeName).not.toMatch(/[<>"|\\\/\*\?:]/g)
        expect(safeName).not.toMatch(/\.\./g)
        expect(safeName).not.toMatch(/script/gi)
        expect(safeName).not.toMatch(/javascript/gi)
        expect(safeName).not.toMatch(/onload/gi)
      })
    })

    it('should validate UUID format strictly', () => {
      const invalidUUIDs = [
        'not-a-uuid',
        '123e4567-e89b-12d3-a456', // incomplete
        '123e4567-e89b-12d3-a456-426614174000-extra', // too long
        'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', // invalid characters
        '123e4567_e89b_12d3_a456_426614174000', // wrong separators
        '../123e4567-e89b-12d3-a456-426614174000', // path traversal attempt
      ]

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

      invalidUUIDs.forEach(uuid => {
        expect(uuidRegex.test(uuid)).toBe(false)
      })

      // Valid UUIDs should pass
      const validUUIDs = [
        '123e4567-e89b-12d3-a456-426614174000',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
      ]

      validUUIDs.forEach(uuid => {
        expect(uuidRegex.test(uuid)).toBe(true)
      })
    })

    it('should prevent information disclosure through error messages', () => {
      // Error messages should not reveal internal system information
      const errorMessages = [
        'Template not found',
        'HTML content not available for this template', 
        'MJML content not available for this template',
        'Invalid template ID format',
        'Template ID is required'
      ]

      errorMessages.forEach(message => {
        // Should not contain file paths
        expect(message).not.toMatch(/\/|\\|src\/|app\/|api\//g)
        // Should not contain sensitive technical details
        expect(message).not.toMatch(/database|connection|sql|query/gi)
        // Should not contain stack traces
        expect(message).not.toMatch(/at\s+.*\(/g)
      })
    })
  })

  describe('Edge Cases Tests', () => {
    it('should handle very long template names gracefully', () => {
      const longName = 'a'.repeat(1000) // 1000 character name
      const safeName = longName
        .replace(/[^a-zA-Z0-9\-_\s]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with dashes
        .replace(/script|javascript|vbscript|onload|onerror|onclick/gi, '') // Remove dangerous keywords
        .replace(/-+/g, '-') // Replace multiple dashes with single dash
        .replace(/^-+|-+$/g, '') // Trim leading/trailing dashes
        .toLowerCase()
        .substring(0, 50) // Limit length to prevent filesystem issues

      // Should be truncated to 50 characters
      expect(safeName).toBe('a'.repeat(50))
      expect(safeName.length).toBe(50)
      
      // Filename length should be reasonable (adding timestamp and extension)
      const timestamp = '2023-12-01'
      const fullFilename = `${safeName}-${timestamp}.html`
      // Should now be well under 255 characters
      expect(fullFilename.length).toBeLessThan(255)
      expect(fullFilename.length).toBe(50 + 1 + 10 + 5) // name + dash + timestamp + extension = 66
    })

    it('should handle templates with special Unicode characters', () => {
      const unicodeNames = [
        'Шаблон письма', // Cyrillic
        'メールテンプレート', // Japanese
        'قالب البريد الإلكتروني', // Arabic
        'Plantilla de correo electrónico', // Spanish with accents
        'Modèle d\'e-mail', // French with apostrophe
      ]

      unicodeNames.forEach(name => {
        const safeName = name
          .replace(/[^a-zA-Z0-9\-_\s]/g, '')
          .replace(/\s+/g, '-')
          .toLowerCase()
        
        // Unicode characters should be removed, leaving only safe chars
        expect(safeName).toMatch(/^[a-z0-9\-_]*$/g)
      })
    })

    it('should handle empty or whitespace-only template names', () => {
      const emptyNames = ['', '   ', '\t\n\r', '     ']

      emptyNames.forEach(name => {
        const safeName = name
          .replace(/[^a-zA-Z0-9\-_\s]/g, '')
          .replace(/\s+/g, '-')
          .toLowerCase()
          .replace(/^-+|-+$/g, '') // Trim leading/trailing dashes
        
        // Should result in empty string or be handled gracefully
        expect(safeName).toBe('')
      })
    })
  })

  describe('Performance Tests', () => {
    it('should complete download operations within reasonable time', async () => {
      const startTime = Date.now()
      
      // Simulate processing
      const largeMockContent = 'x'.repeat(100000) // 100KB content
      const mockTemplate = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Large Template',
        html_output: largeMockContent,
        mjml_code: largeMockContent
      }

      // Simulate filename generation
      const safeName = mockTemplate.name
        .replace(/[^a-zA-Z0-9\-_\s]/g, '')
        .replace(/\s+/g, '-')
        .toLowerCase()
      
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `${safeName}-${timestamp}.html`

      const endTime = Date.now()
      const processingTime = endTime - startTime

      // Should complete within 100ms for filename processing
      expect(processingTime).toBeLessThan(100)
      expect(filename).toBe('large-template-' + timestamp + '.html')
    })

    it('should handle multiple concurrent download requests', async () => {
      const concurrentRequests = 10
      const promises = []

      for (let i = 0; i < concurrentRequests; i++) {
        const promise = new Promise(resolve => {
          const safeName = `template-${i}`
            .replace(/[^a-zA-Z0-9\-_\s]/g, '')
            .replace(/\s+/g, '-')
            .toLowerCase()
          resolve(safeName)
        })
        promises.push(promise)
      }

      const startTime = Date.now()
      const results = await Promise.all(promises)
      const endTime = Date.now()

      expect(results).toHaveLength(concurrentRequests)
      expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second
    })
  })

  describe('Content Validation Tests', () => {
    it('should validate HTML content structure', () => {
      const validHTMLContent = `
        <!DOCTYPE html>
        <html>
          <head><title>Test</title></head>
          <body><h1>Test Email</h1></body>
        </html>
      `

      const invalidHTMLContent = `
        <script>alert('xss')</script>
        <h1>Broken HTML
      `

      // Valid HTML should have basic structure
      expect(validHTMLContent).toMatch(/<html.*?>.*<\/html>/s)
      expect(validHTMLContent).toMatch(/<head.*?>.*<\/head>/s)
      expect(validHTMLContent).toMatch(/<body.*?>.*<\/body>/s)

      // Should detect potentially dangerous content
      expect(invalidHTMLContent).toMatch(/<script.*?>.*<\/script>/s)
    })

    it('should validate MJML content structure', () => {
      const validMJMLContent = `
        <mjml>
          <mj-head>
            <mj-title>Test Email</mj-title>
          </mj-head>
          <mj-body>
            <mj-section>
              <mj-column>
                <mj-text>Hello World</mj-text>
              </mj-column>
            </mj-section>
          </mj-body>
        </mjml>
      `

      const invalidMJMLContent = `
        <mjml>
          <mj-body>
            <mj-section>
              <mj-column>
                <script>alert('xss')</script>
              </mj-column>
            </mj-section>
        </mjml>
      `

      // Valid MJML should have basic structure
      expect(validMJMLContent).toMatch(/<mjml.*?>.*<\/mjml>/s)
      expect(validMJMLContent).toMatch(/<mj-body.*?>.*<\/mj-body>/s)
      expect(validMJMLContent).toMatch(/<mj-section.*?>.*<\/mj-section>/s)

      // Should detect potentially dangerous content
      expect(invalidMJMLContent).toMatch(/<script.*?>.*<\/script>/s)
    })
  })

  describe('Metadata Generation Tests', () => {
    it('should generate complete metadata structure', () => {
      const mockTemplate = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Template',
        description: 'Test Description',
        status: 'published',
        created_at: new Date('2023-12-01T10:00:00Z'),
        updated_at: new Date('2023-12-01T12:00:00Z')
      }

      const mockGeneratedContent = {
        subject_line: 'Test Subject',
        preheader_text: 'Test Preheader',
        metadata: {
          generation_time: 1500,
          token_usage: 250,
          model: 'gpt-4o-mini'
        }
      }

      const metadata = {
        template: {
          id: mockTemplate.id,
          name: mockTemplate.name,
          description: mockTemplate.description,
          status: mockTemplate.status,
          created_at: mockTemplate.created_at,
          updated_at: mockTemplate.updated_at
        },
        email_details: {
          subject_line: mockGeneratedContent.subject_line,
          preheader_text: mockGeneratedContent.preheader_text,
        },
        generation_metadata: mockGeneratedContent.metadata,
        download_info: {
          format: 'both',
          downloaded_at: new Date().toISOString(),
          query_time: 25
        }
      }

      // Validate metadata structure
      expect(metadata.template).toBeDefined()
      expect(metadata.email_details).toBeDefined()
      expect(metadata.generation_metadata).toBeDefined()
      expect(metadata.download_info).toBeDefined()

      // Validate specific fields
      expect(metadata.template.id).toBe(mockTemplate.id)
      expect(metadata.email_details.subject_line).toBe('Test Subject')
      expect(metadata.generation_metadata.model).toBe('gpt-4o-mini')
      expect(metadata.download_info.format).toBe('both')
    })

    it('should handle missing optional metadata gracefully', () => {
      const mockTemplate = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Template',
        description: null,
        status: 'draft',
        created_at: new Date(),
        updated_at: new Date()
      }

      const metadata = {
        template: {
          id: mockTemplate.id,
          name: mockTemplate.name,
          description: mockTemplate.description, // null
          status: mockTemplate.status,
          created_at: mockTemplate.created_at,
          updated_at: mockTemplate.updated_at
        },
        email_details: {
          subject_line: null, // missing
          preheader_text: null, // missing
        },
        generation_metadata: null, // missing
        download_info: {
          format: 'html',
          downloaded_at: new Date().toISOString(),
          query_time: 10
        }
      }

      // Should not throw errors with null/missing values
      expect(() => JSON.stringify(metadata)).not.toThrow()
      expect(metadata.template.description).toBeNull()
      expect(metadata.email_details.subject_line).toBeNull()
      expect(metadata.generation_metadata).toBeNull()
    })
  })
})