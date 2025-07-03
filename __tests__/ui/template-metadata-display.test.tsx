/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { TemplatesPage } from '@/ui/components/pages/templates-page'

// Mock Next.js components
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode, href: string }) => (
    <a href={href}>{children}</a>
  )
})

// Mock glass components
jest.mock('@/ui/components/glass/glass-card', () => {
  return ({ children, className, hover }: { children: React.ReactNode, className?: string, hover?: boolean }) => (
    <div className={`glass-card ${className || ''} ${hover ? 'hover' : ''}`} data-testid="glass-card">
      {children}
    </div>
  )
})

jest.mock('@/ui/components/glass/glass-button', () => {
  return ({ children, onClick, variant, size, disabled, title, glow, ...props }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled}
      title={title}
      className={`glass-button ${variant || ''} ${size || ''} ${glow ? 'glow' : ''}`}
      {...props}
    >
      {children}
    </button>
  )
})

// Mock layout components
jest.mock('@/ui/components/layout/dashboard-layout', () => {
  return ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-layout">{children}</div>
  )
})

// Mock search components
jest.mock('@/ui/components/search/advanced-search-input', () => {
  return ({ value, onChange, onSearch, placeholder, suggestions, showSyntaxHelp, ...props }: any) => (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      {...props}
    />
  )
})

jest.mock('@/ui/components/search/search-results', () => {
  return ({ results, onPreview, onDownload, ...props }: any) => (
    <div data-testid="search-results" {...props}>
      {results.map((result: any) => (
        <div key={result.id} data-testid={`search-result-${result.id}`}>
          <span>{result.name}</span>
          <button onClick={() => onPreview(result.id)}>Preview</button>
          <button onClick={() => onDownload(result.id)}>Download</button>
        </div>
      ))}
    </div>
  )
})

jest.mock('@/ui/components/templates/template-preview-modal', () => {
  return ({ templateId, isOpen, onClose }: any) => (
    isOpen ? (
      <div data-testid="template-preview-modal">
        Modal for {templateId}
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
  )
})

// Mock fetch
global.fetch = jest.fn()

const mockTemplateWithFullMetadata = {
  id: 'template-with-metadata',
  name: 'Template with Full Metadata',
  category: 'promotional',
  description: 'A template with comprehensive metadata',
  createdAt: '2024-03-04T14:30:00Z',
  updatedAt: '2024-03-04T15:45:00Z',
  status: 'published' as const,
  openRate: 89.5,
  clickRate: 24.8,
  qualityScore: 92,
  agentGenerated: true,
  subjectLine: 'Original Subject Line',
  previewText: 'Original Preview Text',
  generatedContent: {
    subject_line: 'AI Generated Subject Line',
    preheader_text: 'AI Generated Preheader Text',
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
  tags: ['promotional', 'ai', 'high-quality']
}

const mockTemplateMinimalMetadata = {
  id: 'template-minimal',
  name: 'Template with Minimal Metadata',
  category: 'transactional',
  description: 'A template with minimal metadata',
  createdAt: '2024-03-03T10:15:00Z',
  status: 'draft' as const,
  openRate: 45.2,
  clickRate: 12.1,
  qualityScore: 75,
  agentGenerated: false
}

const mockTemplateNoMetadata = {
  id: 'template-no-metadata',
  name: 'Template without Metadata',
  category: 'newsletter',
  description: 'A template without any metadata',
  createdAt: '2024-03-02T16:20:00Z',
  status: 'published' as const,
  openRate: 67.8,
  clickRate: 19.3
}

const mockApiResponse = {
  success: true,
  data: {
    templates: [
      mockTemplateWithFullMetadata,
      mockTemplateMinimalMetadata,
      mockTemplateNoMetadata
    ],
    pagination: {
      total: 3,
      page: 1,
      limit: 12,
      totalPages: 1,
      hasNext: false,
      hasPrev: false
    },
    filters: {
      categories: [
        { value: 'all', label: 'All Templates', count: 3 },
        { value: 'promotional', label: 'Promotional', count: 1 },
        { value: 'transactional', label: 'Transactional', count: 1 },
        { value: 'newsletter', label: 'Newsletter', count: 1 }
      ],
      tags: ['promotional', 'ai', 'high-quality']
    }
  },
  metadata: {
    query_time: 150,
    cache_status: 'database'
  }
}

describe('Template Metadata Display Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse
    })
  })

  describe('TemplateCard Enhanced Metadata Display', () => {
    it('should display comprehensive metadata for templates with full data', async () => {
      render(<TemplatesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Template with Full Metadata')).toBeInTheDocument()
      })

      // Check quality score display in thumbnail
      expect(screen.getByText('⭐ 92%')).toBeInTheDocument()

      // Check subject line display
      expect(screen.getByText('📧 AI Generated Subject Line')).toBeInTheDocument()

      // Check preheader text display
      expect(screen.getByText('👁️ AI Generated Preheader Text')).toBeInTheDocument()

      // Check generation metadata
      expect(screen.getByText('⚡ 1500ms')).toBeInTheDocument()
      expect(screen.getByText('🧠 gpt-4o-mini')).toBeInTheDocument()
      expect(screen.getByText('🎯 250')).toBeInTheDocument()

      // Check performance metrics
      expect(screen.getByText('Open: 89.5%')).toBeInTheDocument()
      expect(screen.getByText('Click: 24.8%')).toBeInTheDocument()

      // Check AI badge
      expect(screen.getByText('🤖 AI')).toBeInTheDocument()

      // Check status badge
      expect(screen.getByText('published')).toBeInTheDocument()
    })

    it('should handle templates with minimal metadata gracefully', async () => {
      render(<TemplatesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Template with Minimal Metadata')).toBeInTheDocument()
      })

      // Should show quality score
      expect(screen.getByText('⭐ 75%')).toBeInTheDocument()

      // Should show performance metrics
      expect(screen.getByText('Open: 45.2%')).toBeInTheDocument()
      expect(screen.getByText('Click: 12.1%')).toBeInTheDocument()

      // Should not show AI badge for non-AI generated
      expect(screen.queryByText('🤖 AI')).not.toBeInTheDocument()

      // Should not show generation metadata that doesn't exist
      expect(screen.queryByText(/⚡.*ms/)).not.toBeInTheDocument()
      expect(screen.queryByText(/🧠 gpt/)).not.toBeInTheDocument()
    })

    it('should handle templates without any metadata', async () => {
      render(<TemplatesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Template without Metadata')).toBeInTheDocument()
      })

      // Should still show basic information
      expect(screen.getByText('Open: 67.8%')).toBeInTheDocument()
      expect(screen.getByText('Click: 19.3%')).toBeInTheDocument()

      // Should not show metadata that doesn't exist
      expect(screen.queryByText(/⭐.*%/)).not.toBeInTheDocument()
      expect(screen.queryByText('🤖 AI')).not.toBeInTheDocument()
      expect(screen.queryByText('📧')).not.toBeInTheDocument()
      expect(screen.queryByText('👁️')).not.toBeInTheDocument()
    })
  })

  describe('TemplateListItem Enhanced Metadata Display', () => {
    it('should display quality score in list view', async () => {
      render(<TemplatesPage />)
      
      // Switch to list view
      await waitFor(() => {
        const viewModeButton = screen.getByRole('button', { name: /view/i })
        fireEvent.click(viewModeButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Template with Full Metadata')).toBeInTheDocument()
      })

      // Check quality score badge
      expect(screen.getByText('⭐ 92%')).toBeInTheDocument()

      // Check subject line in list item
      expect(screen.getByText('📧 AI Generated Subject Line')).toBeInTheDocument()

      // Check preheader text
      expect(screen.getByText('👁️ AI Generated Preheader Text')).toBeInTheDocument()

      // Check generation metadata in list view
      expect(screen.getByText('⚡ 1500ms')).toBeInTheDocument()
      expect(screen.getByText('🧠 gpt-4o-mini')).toBeInTheDocument()
      expect(screen.getByText('🎯 250 tokens')).toBeInTheDocument()
    })

    it('should handle missing quality scores in list view', async () => {
      render(<TemplatesPage />)
      
      // Switch to list view
      await waitFor(() => {
        const viewModeButton = screen.getByRole('button', { name: /view/i })
        fireEvent.click(viewModeButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Template without Metadata')).toBeInTheDocument()
      })

      // Should show basic metrics but not quality score
      expect(screen.getByText('Open: 67.8%')).toBeInTheDocument()
      expect(screen.getByText('Click: 19.3%')).toBeInTheDocument()
      
      // Should not show quality score badge for template without it
      const qualityBadges = screen.queryAllByText(/⭐.*%/)
      const hasTemplateWithoutMetadataQuality = qualityBadges.some(badge => 
        badge.closest('[data-testid="glass-card"]')?.textContent?.includes('Template without Metadata')
      )
      expect(hasTemplateWithoutMetadataQuality).toBe(false)
    })
  })

  describe('Quality Score Color Coding', () => {
    it('should use correct colors for different quality score ranges', async () => {
      render(<TemplatesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Template with Full Metadata')).toBeInTheDocument()
      })

      // High quality (92%) should use green colors
      const highQualityBadge = screen.getByText('⭐ 92%')
      expect(highQualityBadge).toHaveClass('text-green-300') // In card thumbnail
      
      // Check list view colors
      await waitFor(() => {
        const viewModeButton = screen.getByRole('button', { name: /view/i })
        fireEvent.click(viewModeButton)
      })

      await waitFor(() => {
        const listQualityBadge = screen.getByText('⭐ 92%')
        expect(listQualityBadge).toHaveClass('text-green-400') // In list view
      })
    })

    it('should handle medium quality scores with yellow colors', async () => {
      // Modify mock data for medium quality
      const mockResponseMediumQuality = {
        ...mockApiResponse,
        data: {
          ...mockApiResponse.data,
          templates: [{
            ...mockTemplateMinimalMetadata,
            qualityScore: 85
          }]
        }
      }
      
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponseMediumQuality
      })

      render(<TemplatesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Template with Minimal Metadata')).toBeInTheDocument()
      })

      const qualityBadge = screen.getByText('⭐ 85%')
      expect(qualityBadge).toHaveClass('text-yellow-300') // Medium quality uses yellow
    })
  })

  describe('Subject Line and Preheader Display Priority', () => {
    it('should prioritize generatedContent over template fields', async () => {
      render(<TemplatesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Template with Full Metadata')).toBeInTheDocument()
      })

      // Should show AI generated content, not original template fields
      expect(screen.getByText('📧 AI Generated Subject Line')).toBeInTheDocument()
      expect(screen.queryByText('📧 Original Subject Line')).not.toBeInTheDocument()

      expect(screen.getByText('👁️ AI Generated Preheader Text')).toBeInTheDocument()
      expect(screen.queryByText('👁️ Original Preview Text')).not.toBeInTheDocument()
    })

    it('should fallback to template fields when generatedContent is missing', async () => {
      const mockResponseFallback = {
        ...mockApiResponse,
        data: {
          ...mockApiResponse.data,
          templates: [{
            ...mockTemplateWithFullMetadata,
            generatedContent: {}, // Empty generated content
            subjectLine: 'Fallback Subject',
            previewText: 'Fallback Preheader'
          }]
        }
      }
      
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponseFallback
      })

      render(<TemplatesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Template with Full Metadata')).toBeInTheDocument()
      })

      // Should fallback to template fields
      expect(screen.getByText('📧 Fallback Subject')).toBeInTheDocument()
      expect(screen.getByText('👁️ Fallback Preheader')).toBeInTheDocument()
    })
  })

  describe('Generation Metadata Display', () => {
    it('should format generation time correctly', async () => {
      render(<TemplatesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Template with Full Metadata')).toBeInTheDocument()
      })

      expect(screen.getByText('⚡ 1500ms')).toBeInTheDocument()
    })

    it('should display model information', async () => {
      render(<TemplatesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Template with Full Metadata')).toBeInTheDocument()
      })

      expect(screen.getByText('🧠 gpt-4o-mini')).toBeInTheDocument()
    })

    it('should handle different token usage formats', async () => {
      render(<TemplatesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Template with Full Metadata')).toBeInTheDocument()
      })

      // In card view
      expect(screen.getByText('🎯 250')).toBeInTheDocument()
      
      // Switch to list view to check full format
      const viewModeButton = screen.getByRole('button', { name: /view/i })
      fireEvent.click(viewModeButton)

      await waitFor(() => {
        expect(screen.getByText('🎯 250 tokens')).toBeInTheDocument()
      })
    })
  })

  describe('Template Actions Integration', () => {
    it('should maintain preview functionality with enhanced metadata', async () => {
      render(<TemplatesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Template with Full Metadata')).toBeInTheDocument()
      })

      const previewButtons = screen.getAllByTitle('Preview Template')
      fireEvent.click(previewButtons[0])

      await waitFor(() => {
        expect(screen.getByTestId('template-preview-modal')).toBeInTheDocument()
      })
    })

    it('should maintain download functionality with enhanced metadata', async () => {
      const mockDownloadResponse = new Response(
        '<html><body>Template Content</body></html>',
        {
          status: 200,
          headers: {
            'Content-Type': 'text/html',
            'Content-Disposition': 'attachment; filename="template-with-metadata-2024-03-04.html"'
          }
        }
      )

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockApiResponse
        })
        .mockResolvedValueOnce(mockDownloadResponse)

      render(<TemplatesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Template with Full Metadata')).toBeInTheDocument()
      })

      const downloadButtons = screen.getAllByTitle('Download Template')
      fireEvent.click(downloadButtons[0])

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/templates/template-with-metadata/download?format=html',
          expect.any(Object)
        )
      })
    })
  })
})