/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TemplatePreviewModal } from '@/ui/components/templates/template-preview-modal'

// Mock the fetch function
global.fetch = jest.fn()

// Mock the LivePreview component
jest.mock('@/ui/components/email/live-preview', () => {
  return function MockLivePreview({ htmlContent, title, subjectLine, preheader, metadata }: any) {
    return (
      <div data-testid="live-preview">
        <div data-testid="preview-title">{title}</div>
        <div data-testid="preview-subject">{subjectLine}</div>
        <div data-testid="preview-preheader">{preheader}</div>
        <div data-testid="preview-content">{htmlContent}</div>
        <div data-testid="preview-metadata">{JSON.stringify(metadata)}</div>
      </div>
    )
  }
})

// Mock the Dialog components
jest.mock('@/ui/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <div data-testid="dialog-title">{children}</div>,
}))

const mockTemplateData = {
  success: true,
  data: {
    id: 'template-123',
    name: 'Test Template',
    description: 'A test template description',
    status: 'published',
    quality_score: 85,
    created_at: '2023-12-01T10:00:00Z',
    updated_at: '2023-12-01T12:00:00Z',
    html_content: '<html><body><h1>Test Email</h1></body></html>',
    mjml_code: '<mjml><mj-body><mj-section><mj-column><mj-text>Test</mj-text></mj-column></mj-section></mj-body></mjml>',
    subject_line: 'Test Subject Line',
    preheader_text: 'Test preheader text',
    metadata: {
      generation_time: 1500,
      token_usage: 250,
      model: 'gpt-4o-mini',
      workflow: 'Standard',
      flow: 'Email Generation',
      brief_type: 'text',
      tone: 'professional',
      target_audience: 'business users'
    },
    design_tokens: {
      colors: { primary: '#007bff' }
    },
    has_content: true,
    content_length: 45,
    mjml_length: 89
  },
  metadata: {
    query_time: 25,
    timestamp: '2023-12-01T12:00:00Z',
    template_id: 'template-123'
  }
}

describe('TemplatePreviewModal', () => {
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockTemplateData
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should render modal when open with template ID', async () => {
    render(
      <TemplatePreviewModal
        templateId="template-123"
        isOpen={true}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByTestId('dialog')).toBeInTheDocument()
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('👁️ Template Preview')
  })

  it('should not render modal when closed', () => {
    render(
      <TemplatePreviewModal
        templateId="template-123"
        isOpen={false}
        onClose={mockOnClose}
      />
    )

    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()
  })

  it('should show loading state initially', async () => {
    render(
      <TemplatePreviewModal
        templateId="template-123"
        isOpen={true}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText('Loading template preview...')).toBeInTheDocument()
  })

  it('should fetch and display template preview data', async () => {
    render(
      <TemplatePreviewModal
        templateId="template-123"
        isOpen={true}
        onClose={mockOnClose}
      />
    )

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/templates/template-123/preview', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    })

    await waitFor(() => {
      expect(screen.getByTestId('live-preview')).toBeInTheDocument()
    })

    expect(screen.getByTestId('preview-title')).toHaveTextContent('Test Template')
    expect(screen.getByTestId('preview-subject')).toHaveTextContent('Test Subject Line')
    expect(screen.getByTestId('preview-preheader')).toHaveTextContent('Test preheader text')
  })

  it('should display template metadata correctly', async () => {
    render(
      <TemplatePreviewModal
        templateId="template-123"
        isOpen={true}
        onClose={mockOnClose}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('published')).toBeInTheDocument()
    })

    expect(screen.getByText('85/100')).toBeInTheDocument()
    expect(screen.getByText('45 chars')).toBeInTheDocument()
  })

  it('should display generation details when available', async () => {
    render(
      <TemplatePreviewModal
        templateId="template-123"
        isOpen={true}
        onClose={mockOnClose}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Generation Details')).toBeInTheDocument()
    })

    expect(screen.getByText('text')).toBeInTheDocument()
    expect(screen.getByText('professional')).toBeInTheDocument()
    expect(screen.getByText('business users')).toBeInTheDocument()
  })

  it('should handle fetch error gracefully', async () => {
    ;(fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

    render(
      <TemplatePreviewModal
        templateId="template-123"
        isOpen={true}
        onClose={mockOnClose}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Failed to load template preview')).toBeInTheDocument()
    })

    expect(screen.getByText('Network error')).toBeInTheDocument()
  })

  it('should handle API error response', async () => {
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ success: false, error: 'Template not found' })
    })

    render(
      <TemplatePreviewModal
        templateId="template-123"
        isOpen={true}
        onClose={mockOnClose}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Failed to load template preview')).toBeInTheDocument()
    })

    expect(screen.getByText(/Failed to fetch template preview: 404/)).toBeInTheDocument()
  })

  it('should provide retry functionality on error', async () => {
    ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockTemplateData
    })

    render(
      <TemplatePreviewModal
        templateId="template-123"
        isOpen={true}
        onClose={mockOnClose}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('🔄 Retry')).toBeInTheDocument()
    })

    const retryButton = screen.getByText('🔄 Retry')
    await act(async () => {
      await userEvent.click(retryButton)
    })

    await waitFor(() => {
      expect(screen.getByTestId('live-preview')).toBeInTheDocument()
    })

    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('should handle templates without content', async () => {
    const noContentData = {
      ...mockTemplateData,
      data: {
        ...mockTemplateData.data,
        html_content: null,
        mjml_code: null,
        has_content: false
      }
    }

    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => noContentData
    })

    render(
      <TemplatePreviewModal
        templateId="template-123"
        isOpen={true}
        onClose={mockOnClose}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('No content available')).toBeInTheDocument()
    })

    expect(screen.getByText("This template doesn't have HTML or MJML content yet")).toBeInTheDocument()
  })

  it('should not fetch data when modal is closed', () => {
    render(
      <TemplatePreviewModal
        templateId="template-123"
        isOpen={false}
        onClose={mockOnClose}
      />
    )

    expect(fetch).not.toHaveBeenCalled()
  })

  it('should not fetch data when templateId is null', () => {
    render(
      <TemplatePreviewModal
        templateId={null}
        isOpen={true}
        onClose={mockOnClose}
      />
    )

    expect(fetch).not.toHaveBeenCalled()
    expect(screen.getByText('No template selected')).toBeInTheDocument()
  })

  it('should clear data when closing modal', async () => {
    const { rerender } = render(
      <TemplatePreviewModal
        templateId="template-123"
        isOpen={true}
        onClose={mockOnClose}
      />
    )

    await waitFor(() => {
      expect(screen.getByTestId('live-preview')).toBeInTheDocument()
    })

    // Close modal
    rerender(
      <TemplatePreviewModal
        templateId="template-123"
        isOpen={false}
        onClose={mockOnClose}
      />
    )

    // Open again
    rerender(
      <TemplatePreviewModal
        templateId="template-123"
        isOpen={true}
        onClose={mockOnClose}
      />
    )

    // Should show loading again since data was cleared
    expect(screen.getByText('Loading template preview...')).toBeInTheDocument()
  })

  it('should display template name in header when loaded', async () => {
    render(
      <TemplatePreviewModal
        templateId="template-123"
        isOpen={true}
        onClose={mockOnClose}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('• Test Template')).toBeInTheDocument()
    })
  })

  it('should handle quality score display correctly', async () => {
    render(
      <TemplatePreviewModal
        templateId="template-123"
        isOpen={true}
        onClose={mockOnClose}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Quality Score:')).toBeInTheDocument()
      expect(screen.getByText('85/100')).toBeInTheDocument()
    })
  })

  it('should handle templates without quality score', async () => {
    const noQualityData = {
      ...mockTemplateData,
      data: {
        ...mockTemplateData.data,
        quality_score: null
      }
    }

    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => noQualityData
    })

    render(
      <TemplatePreviewModal
        templateId="template-123"
        isOpen={true}
        onClose={mockOnClose}
      />
    )

    await waitFor(() => {
      expect(screen.getByTestId('live-preview')).toBeInTheDocument()
    })

    expect(screen.queryByText('Quality Score:')).not.toBeInTheDocument()
  })
})