'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui/components/ui/dialog'
import LivePreview from '@/ui/components/email/live-preview'

interface TemplatePreviewModalProps {
  templateId: string | null
  isOpen: boolean
  onClose: () => void
}

interface TemplatePreviewData {
  id: string
  name: string
  description: string
  status: string
  quality_score: number
  created_at: string
  updated_at: string
  html_content: string | null
  mjml_code: string | null
  subject_line: string | null
  preheader_text: string | null
  metadata: {
    generation_time?: number
    token_usage?: number
    model?: string
    workflow?: string
    flow?: string
    brief_type?: string
    tone?: string
    target_audience?: string
  }
  design_tokens: any
  has_content: boolean
  content_length: number
  mjml_length: number
}

interface TemplatePreviewResponse {
  success: boolean
  data: TemplatePreviewData
  metadata: {
    query_time: number
    timestamp: string
    template_id: string
  }
}

export function TemplatePreviewModal({ templateId, isOpen, onClose }: TemplatePreviewModalProps) {
  const [previewData, setPreviewData] = useState<TemplatePreviewData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (templateId && isOpen) {
      fetchTemplatePreview()
    }
  }, [templateId, isOpen])

  const fetchTemplatePreview = async () => {
    if (!templateId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/templates/${templateId}/preview`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch template preview: ${response.status}`)
      }

      const result: TemplatePreviewResponse = await response.json()

      if (!result.success) {
        throw new Error(result.data?.toString() || 'Failed to load template preview')
      }

      setPreviewData(result.data)
    } catch (err) {
      console.error('Template preview fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load template preview')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setPreviewData(null)
    setError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl h-[90vh] overflow-hidden bg-glass-primary border-glass-border">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            👁️ Template Preview
            {previewData && (
              <span className="text-sm font-normal text-white/70">
                • {previewData.name}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-white/70">Loading template preview...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="text-6xl mb-4">⚠️</div>
                <p className="text-red-400 font-medium mb-2">Failed to load template preview</p>
                <p className="text-white/60 text-sm">{error}</p>
                <button 
                  onClick={fetchTemplatePreview}
                  className="mt-4 px-4 py-2 rounded-lg bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-all text-sm"
                >
                  🔄 Retry
                </button>
              </div>
            </div>
          ) : previewData ? (
            <div className="space-y-4">
              {/* Template metadata */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg bg-white/5 border border-white/10">
                <div>
                  <span className="text-white/60 text-sm">Status:</span>
                  <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ml-2 ${
                    previewData.status === 'published' 
                      ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                      : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                  }`}>
                    {previewData.status}
                  </div>
                </div>
                {previewData.quality_score && (
                  <div>
                    <span className="text-white/60 text-sm">Quality Score:</span>
                    <div className="text-white font-medium ml-2">
                      {previewData.quality_score}/100
                    </div>
                  </div>
                )}
                <div>
                  <span className="text-white/60 text-sm">Content Length:</span>
                  <div className="text-white font-medium ml-2">
                    {previewData.content_length.toLocaleString()} chars
                  </div>
                </div>
              </div>

              {/* Main preview */}
              {previewData.has_content ? (
                <LivePreview
                  htmlContent={previewData.html_content || undefined}
                  title={previewData.name}
                  subjectLine={previewData.subject_line || undefined}
                  preheader={previewData.preheader_text || undefined}
                  metadata={previewData.metadata}
                />
              ) : (
                <div className="flex items-center justify-center h-96 rounded-xl border border-glass-border bg-glass-primary">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📧</div>
                    <p className="text-white/70">No content available</p>
                    <p className="text-white/50 text-sm mt-2">
                      This template doesn&apos;t have HTML or MJML content yet
                    </p>
                  </div>
                </div>
              )}

              {/* Additional metadata */}
              {previewData.metadata && Object.keys(previewData.metadata).length > 0 && (
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <h4 className="text-white font-medium mb-3">Generation Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {previewData.metadata.brief_type && (
                      <div>
                        <span className="text-white/60">Brief Type:</span>
                        <span className="text-white ml-2">{previewData.metadata.brief_type}</span>
                      </div>
                    )}
                    {previewData.metadata.tone && (
                      <div>
                        <span className="text-white/60">Tone:</span>
                        <span className="text-white ml-2">{previewData.metadata.tone}</span>
                      </div>
                    )}
                    {previewData.metadata.target_audience && (
                      <div>
                        <span className="text-white/60">Target Audience:</span>
                        <span className="text-white ml-2">{previewData.metadata.target_audience}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-white/70">No template selected</p>
                <p className="text-white/50 text-sm mt-2">Select a template to view its preview</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}