/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

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

// Template Card component for testing (extracted from templates-page.tsx)
interface Template {
  id: string
  name: string
  category: string
  description: string
  thumbnail?: string
  preview?: string
  createdAt: string
  updatedAt?: string
  tags?: string[]
  status?: 'published' | 'draft'
  openRate?: number
  clickRate?: number
  qualityScore?: number
  agentGenerated?: boolean
  subjectLine?: string
  previewText?: string
  generatedContent?: {
    subject_line?: string
    preheader_text?: string
    metadata?: {
      generation_time?: number
      token_usage?: number
      model?: string
      workflow?: string
      flow?: string
    }
    brief_type?: string
    tone?: string
    target_audience?: string
  }
  briefText?: string
  mjmlCode?: string
  htmlOutput?: string
  designTokens?: any
}

// Icon components
const MailIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-testid="mail-icon">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)

const EyeIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-testid="eye-icon">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

const DownloadIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-testid="download-icon">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
)

const EditIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-testid="edit-icon">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

// Import glass components for mocking
const GlassCard = require('@/ui/components/glass/glass-card').default || require('@/ui/components/glass/glass-card')
const GlassButton = require('@/ui/components/glass/glass-button').default || require('@/ui/components/glass/glass-button')

interface TemplateCardProps {
  template: Template
  onPreview: (templateId: string) => void
  onDownload: (templateId: string) => void
}

function TemplateCard({ template, onPreview, onDownload }: TemplateCardProps) {
  // Parse generated content metadata
  const generatedContent = template.generatedContent || {}
  const metadata = generatedContent.metadata || {}

  return (
    <GlassCard className="overflow-hidden hover" hover>
      {/* Thumbnail */}
      <div className="aspect-video bg-gradient-to-br from-kupibilet-primary/20 to-kupibilet-accent/20 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <MailIcon />
          <div className="absolute top-4 right-4">
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              template.status === 'published' 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              {template.status}
            </div>
          </div>
          {/* Quality Score Badge in Top Left */}
          {template.qualityScore && (
            <div className="absolute top-4 left-4">
              <div className={`px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                template.qualityScore >= 90 ? 'bg-green-500/30 text-green-300' :
                template.qualityScore >= 80 ? 'bg-yellow-500/30 text-yellow-300' :
                'bg-red-500/30 text-red-300'
              }`}>
                ⭐ {template.qualityScore}%
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-white truncate">{template.name}</h3>
          <div className="flex items-center gap-1 ml-2">
            <span className="text-xs text-kupibilet-primary font-medium">{template.openRate?.toFixed(1)}%</span>
          </div>
        </div>

        {/* Subject Line Display */}
        {(generatedContent.subject_line || template.subjectLine) && (
          <p className="text-sm text-kupibilet-primary/80 mb-2 line-clamp-1">
            📧 {generatedContent.subject_line || template.subjectLine}
          </p>
        )}

        <p className="text-white/70 text-sm mb-3 line-clamp-2">{template.description}</p>

        {/* Preheader Text */}
        {(generatedContent.preheader_text || template.previewText) && (
          <p className="text-white/50 text-xs mb-3 line-clamp-1">
            👁️ {generatedContent.preheader_text || template.previewText}
          </p>
        )}

        {/* Generation Metadata */}
        {(metadata.generation_time || metadata.model || metadata.token_usage) && (
          <div className="flex flex-wrap gap-2 mb-3 text-xs text-white/50">
            {metadata.generation_time && (
              <span className="px-2 py-1 bg-white/5 rounded-full">
                ⚡ {metadata.generation_time}ms
              </span>
            )}
            {metadata.model && (
              <span className="px-2 py-1 bg-white/5 rounded-full">
                🧠 {metadata.model}
              </span>
            )}
            {metadata.token_usage && (
              <span className="px-2 py-1 bg-white/5 rounded-full">
                🎯 {metadata.token_usage}
              </span>
            )}
          </div>
        )}

        {/* Tags */}
        {template.tags && (
          <div className="flex flex-wrap gap-1 mb-4">
            {template.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="px-2 py-1 bg-white/10 text-xs text-white/80 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Performance Metrics and AI Badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs text-white/60">
            <span>Open: {template.openRate?.toFixed(1)}%</span>
            <span>•</span>
            <span>Click: {template.clickRate?.toFixed(1)}%</span>
          </div>
          {template.agentGenerated && (
            <div className="px-2 py-1 bg-kupibilet-primary/20 text-kupibilet-primary text-xs rounded-full">
              🤖 AI
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/50">
            {new Date(template.createdAt).toLocaleDateString('ru-RU')}
          </span>
          <div className="flex gap-2">
            <GlassButton 
              size="sm" 
              variant="outline"
              onClick={() => onPreview(template.id)}
              title="Preview Template"
            >
              <EyeIcon />
            </GlassButton>
            <GlassButton size="sm" variant="outline" title="Edit Template">
              <EditIcon />
            </GlassButton>
            <GlassButton 
              size="sm" 
              variant="outline" 
              onClick={() => onDownload(template.id)}
              title="Download Template"
            >
              <DownloadIcon />
            </GlassButton>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}

interface TemplateListItemProps {
  template: Template
  onPreview: (templateId: string) => void
  onDownload: (templateId: string) => void
}

function TemplateListItem({ template, onPreview, onDownload }: TemplateListItemProps) {
  // Parse generated content metadata
  const generatedContent = template.generatedContent || {}
  const metadata = generatedContent.metadata || {}

  return (
    <GlassCard className="p-6 hover" hover>
      <div className="flex items-center gap-6">
        {/* Thumbnail */}
        <div className="w-24 h-16 bg-gradient-to-br from-kupibilet-primary/20 to-kupibilet-accent/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <MailIcon />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white truncate">{template.name}</h3>
              {/* Subject Line Display */}
              {(generatedContent.subject_line || template.subjectLine) && (
                <p className="text-sm text-kupibilet-primary/80 truncate mt-1">
                  📧 {generatedContent.subject_line || template.subjectLine}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
              {/* Quality Score Display */}
              {template.qualityScore && (
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  template.qualityScore >= 90 ? 'bg-green-500/20 text-green-400' :
                  template.qualityScore >= 80 ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  ⭐ {template.qualityScore}%
                </div>
              )}
              {/* AI Generated Badge */}
              {template.agentGenerated && (
                <div className="px-2 py-1 bg-kupibilet-primary/20 text-kupibilet-primary text-xs rounded-full">
                  🤖 AI
                </div>
              )}
              {/* Status Badge */}
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                template.status === 'published' 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                {template.status}
              </div>
            </div>
          </div>
          
          <p className="text-white/70 text-sm mb-2">{template.description}</p>
          
          {/* Preheader Text */}
          {(generatedContent.preheader_text || template.previewText) && (
            <p className="text-white/50 text-xs mb-2 truncate">
              👁️ {generatedContent.preheader_text || template.previewText}
            </p>
          )}
          
          {/* Enhanced Metadata Row */}
          <div className="flex items-center gap-4 text-xs text-white/50">
            <span>{new Date(template.createdAt).toLocaleDateString('ru-RU')}</span>
            <span>Open: {template.openRate?.toFixed(1)}%</span>
            <span>Click: {template.clickRate?.toFixed(1)}%</span>
            {metadata.generation_time && (
              <span>⚡ {metadata.generation_time}ms</span>
            )}
            {metadata.model && (
              <span>🧠 {metadata.model}</span>
            )}
            {metadata.token_usage && (
              <span>🎯 {metadata.token_usage} tokens</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-shrink-0">
          <GlassButton 
            size="sm" 
            variant="outline"
            onClick={() => onPreview(template.id)}
            title="Preview Template"
          >
            <EyeIcon />
          </GlassButton>
          <GlassButton size="sm" variant="outline" title="Edit Template">
            <EditIcon />
          </GlassButton>
          <GlassButton 
            size="sm" 
            variant="outline"
            onClick={() => onDownload(template.id)}
            title="Download Template"
          >
            <DownloadIcon />
          </GlassButton>
        </div>
      </div>
    </GlassCard>
  )
}

const mockTemplateFullMetadata: Template = {
  id: 'template-full',
  name: 'Professional Newsletter Template',
  category: 'newsletter',
  description: 'A comprehensive newsletter template with AI-generated content',
  createdAt: '2024-03-05T10:30:00Z',
  status: 'published',
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
      workflow: 'Advanced',
      flow: 'Newsletter Generation'
    },
    brief_type: 'text',
    tone: 'professional',
    target_audience: 'business professionals'
  },
  tags: ['newsletter', 'professional', 'ai-generated']
}

const mockTemplateMinimalMetadata: Template = {
  id: 'template-minimal',
  name: 'Simple Notification',
  category: 'transactional',
  description: 'Basic notification template',
  createdAt: '2024-03-04T14:20:00Z',
  status: 'draft',
  openRate: 45.2,
  clickRate: 12.1,
  qualityScore: 78,
  agentGenerated: false
}

const mockTemplateNoMetadata: Template = {
  id: 'template-none',
  name: 'Legacy Template',
  category: 'legacy',
  description: 'Template without metadata',
  createdAt: '2024-03-01T09:15:00Z',
  status: 'published',
  openRate: 67.8,
  clickRate: 19.3
}

describe('Template Card Metadata Display Tests', () => {
  const mockOnPreview = jest.fn()
  const mockOnDownload = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('TemplateCard with Full Metadata', () => {
    it('should display all metadata fields correctly', () => {
      render(
        <TemplateCard 
          template={mockTemplateFullMetadata} 
          onPreview={mockOnPreview} 
          onDownload={mockOnDownload} 
        />
      )

      // Check quality score in thumbnail
      expect(screen.getByText('⭐ 92%')).toBeInTheDocument()

      // Check subject line (should prioritize generated content)
      expect(screen.getByText('📧 AI Generated Subject Line')).toBeInTheDocument()
      expect(screen.queryByText('📧 Original Subject Line')).not.toBeInTheDocument()

      // Check preheader text
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

      // Check tags
      expect(screen.getByText('newsletter')).toBeInTheDocument()
      expect(screen.getByText('professional')).toBeInTheDocument()
    })

    it('should handle click events correctly', () => {
      render(
        <TemplateCard 
          template={mockTemplateFullMetadata} 
          onPreview={mockOnPreview} 
          onDownload={mockOnDownload} 
        />
      )

      // Test preview click
      const previewButton = screen.getByTitle('Preview Template')
      fireEvent.click(previewButton)
      expect(mockOnPreview).toHaveBeenCalledWith('template-full')

      // Test download click
      const downloadButton = screen.getByTitle('Download Template')
      fireEvent.click(downloadButton)
      expect(mockOnDownload).toHaveBeenCalledWith('template-full')
    })
  })

  describe('TemplateCard with Minimal Metadata', () => {
    it('should handle templates with minimal metadata gracefully', () => {
      render(
        <TemplateCard 
          template={mockTemplateMinimalMetadata} 
          onPreview={mockOnPreview} 
          onDownload={mockOnDownload} 
        />
      )

      // Should show quality score
      expect(screen.getByText('⭐ 78%')).toBeInTheDocument()

      // Should show performance metrics
      expect(screen.getByText('Open: 45.2%')).toBeInTheDocument()
      expect(screen.getByText('Click: 12.1%')).toBeInTheDocument()

      // Should not show AI badge for non-AI generated
      expect(screen.queryByText('🤖 AI')).not.toBeInTheDocument()

      // Should not show metadata that doesn't exist
      expect(screen.queryByText(/⚡.*ms/)).not.toBeInTheDocument()
      expect(screen.queryByText(/🧠 gpt/)).not.toBeInTheDocument()
      expect(screen.queryByText('📧')).not.toBeInTheDocument()
    })
  })

  describe('TemplateCard without Metadata', () => {
    it('should handle templates without any metadata', () => {
      render(
        <TemplateCard 
          template={mockTemplateNoMetadata} 
          onPreview={mockOnPreview} 
          onDownload={mockOnDownload} 
        />
      )

      // Should show basic information
      expect(screen.getByText('Legacy Template')).toBeInTheDocument()
      expect(screen.getByText('Open: 67.8%')).toBeInTheDocument()
      expect(screen.getByText('Click: 19.3%')).toBeInTheDocument()

      // Should not show metadata that doesn't exist
      expect(screen.queryByText(/⭐.*%/)).not.toBeInTheDocument()
      expect(screen.queryByText('🤖 AI')).not.toBeInTheDocument()
      expect(screen.queryByText('📧')).not.toBeInTheDocument()
    })
  })

  describe('TemplateListItem with Full Metadata', () => {
    it('should display quality score and metadata in list view', () => {
      render(
        <TemplateListItem 
          template={mockTemplateFullMetadata} 
          onPreview={mockOnPreview} 
          onDownload={mockOnDownload} 
        />
      )

      // Check quality score badge
      expect(screen.getByText('⭐ 92%')).toBeInTheDocument()

      // Check subject line
      expect(screen.getByText('📧 AI Generated Subject Line')).toBeInTheDocument()

      // Check preheader text
      expect(screen.getByText('👁️ AI Generated Preheader Text')).toBeInTheDocument()

      // Check generation metadata in list view
      expect(screen.getByText('⚡ 1500ms')).toBeInTheDocument()
      expect(screen.getByText('🧠 gpt-4o-mini')).toBeInTheDocument()
      expect(screen.getByText('🎯 250 tokens')).toBeInTheDocument()

      // Check AI badge
      expect(screen.getByText('🤖 AI')).toBeInTheDocument()
    })
  })

  describe('Quality Score Color Coding', () => {
    it('should use green colors for high quality scores (90+)', () => {
      render(
        <TemplateCard 
          template={mockTemplateFullMetadata} 
          onPreview={mockOnPreview} 
          onDownload={mockOnDownload} 
        />
      )

      const qualityBadge = screen.getByText('⭐ 92%')
      expect(qualityBadge).toHaveClass('text-green-300')
    })

    it('should use yellow colors for medium quality scores (80-89)', () => {
      const mediumQualityTemplate = {
        ...mockTemplateMinimalMetadata,
        qualityScore: 85
      }

      render(
        <TemplateListItem 
          template={mediumQualityTemplate} 
          onPreview={mockOnPreview} 
          onDownload={mockOnDownload} 
        />
      )

      const qualityBadge = screen.getByText('⭐ 85%')
      expect(qualityBadge).toHaveClass('text-yellow-400')
    })

    it('should use red colors for low quality scores (<80)', () => {
      const lowQualityTemplate = {
        ...mockTemplateMinimalMetadata,
        qualityScore: 65
      }

      render(
        <TemplateCard 
          template={lowQualityTemplate} 
          onPreview={mockOnPreview} 
          onDownload={mockOnDownload} 
        />
      )

      const qualityBadge = screen.getByText('⭐ 65%')
      expect(qualityBadge).toHaveClass('text-red-300')
    })
  })

  describe('Subject Line and Preheader Priority', () => {
    it('should prioritize generatedContent over template fields', () => {
      render(
        <TemplateCard 
          template={mockTemplateFullMetadata} 
          onPreview={mockOnPreview} 
          onDownload={mockOnDownload} 
        />
      )

      // Should show AI generated content, not original template fields
      expect(screen.getByText('📧 AI Generated Subject Line')).toBeInTheDocument()
      expect(screen.queryByText('📧 Original Subject Line')).not.toBeInTheDocument()

      expect(screen.getByText('👁️ AI Generated Preheader Text')).toBeInTheDocument()
      expect(screen.queryByText('👁️ Original Preview Text')).not.toBeInTheDocument()
    })

    it('should fallback to template fields when generatedContent is missing', () => {
      const templateWithFallback = {
        ...mockTemplateFullMetadata,
        generatedContent: {}, // Empty generated content
        subjectLine: 'Fallback Subject',
        previewText: 'Fallback Preheader'
      }

      render(
        <TemplateCard 
          template={templateWithFallback} 
          onPreview={mockOnPreview} 
          onDownload={mockOnDownload} 
        />
      )

      // Should fallback to template fields
      expect(screen.getByText('📧 Fallback Subject')).toBeInTheDocument()
      expect(screen.getByText('👁️ Fallback Preheader')).toBeInTheDocument()
    })
  })
})