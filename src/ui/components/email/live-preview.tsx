'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

interface LivePreviewProps {
  htmlContent?: string
  isLoading?: boolean
  title?: string
  subjectLine?: string
  preheader?: string
  metadata?: {
    generation_time?: number
    token_usage?: number
    model?: string
    workflow?: string
    flow?: string
  }
}

function LivePreviewComponent({ 
  htmlContent, 
  isLoading = false, 
  title = "Email Preview",
  subjectLine,
  preheader,
  metadata
}: LivePreviewProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [showCode, setShowCode] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Ensure client-side only mounting
  useEffect(() => {
    setMounted(true)
  }, [])

  // Auto-refresh iframe when content changes
  useEffect(() => {
    if (mounted && htmlContent) {
      const iframe = document.getElementById('email-preview-iframe') as HTMLIFrameElement
      if (iframe) {
        iframe.contentDocument?.open()
        iframe.contentDocument?.write(htmlContent)
        iframe.contentDocument?.close()
      }
    }
  }, [htmlContent, mounted])

  if (!mounted) {
    return (
      <div className="relative transition-all duration-300">
        <div className="rounded-t-xl border backdrop-blur transition-all duration-300 ease-in-out bg-glass-primary border-glass-border shadow-glass p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                📧 {title}
              </h3>
            </div>
          </div>
        </div>
        <div className="border-x border-b border-glass-border bg-white/5 backdrop-blur">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-white/70">Loading preview...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'relative'} transition-all duration-300`}>
      {/* Header with controls */}
      <div className="rounded-t-xl border backdrop-blur transition-all duration-300 ease-in-out bg-glass-primary border-glass-border shadow-glass p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              📧 {title}
              {isLoading && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              )}
            </h3>
            {metadata && (
              <div className="text-sm text-white/70 mt-1">
                Workflow: {metadata.workflow || 'Standard'} | Flow: {metadata.flow || 'Email Generation'} | Model: {metadata.model || 'gpt-4o-mini'}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex bg-white/10 rounded-lg p-1">
              <button
                onClick={() => setViewMode('desktop')}
                className={`px-3 py-1 rounded text-sm transition-all ${
                  viewMode === 'desktop' 
                    ? 'bg-primary text-white' 
                    : 'text-white/70 hover:text-white'
                }`}
              >
                🖥️ Desktop
              </button>
              <button
                onClick={() => setViewMode('mobile')}
                className={`px-3 py-1 rounded text-sm transition-all ${
                  viewMode === 'mobile' 
                    ? 'bg-primary text-white' 
                    : 'text-white/70 hover:text-white'
                }`}
              >
                📱 Mobile
              </button>
            </div>

            {/* Code view toggle */}
            <button
              onClick={() => setShowCode(!showCode)}
              className={`px-3 py-2 rounded-lg text-sm transition-all ${
                showCode 
                  ? 'bg-accent/20 text-accent border border-accent/30' 
                  : 'bg-white/10 text-white/70 hover:text-white border border-white/20'
              }`}
            >
              {showCode ? '👁️ Preview' : '💻 Code'}
            </button>

            {/* Fullscreen toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="px-3 py-2 rounded-lg text-sm bg-white/10 text-white/70 hover:text-white border border-white/20 transition-all"
            >
              {isFullscreen ? '📉 Exit' : '📈 Fullscreen'}
            </button>
          </div>
        </div>

        {/* Email metadata */}
        {(subjectLine || preheader) && (
          <div className="space-y-2 mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
            {subjectLine && (
              <div>
                <span className="text-white/60 text-sm">Subject:</span>
                <div className="text-white font-medium">{subjectLine}</div>
              </div>
            )}
            {preheader && (
              <div>
                <span className="text-white/60 text-sm">Preheader:</span>
                <div className="text-white/80 text-sm">{preheader}</div>
              </div>
            )}
          </div>
        )}

        {/* Generation metadata */}
        {metadata && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            {metadata.generation_time && (
              <div className="p-2 rounded bg-primary/20 border border-primary/30">
                <span className="text-primary/80">⏱️ Generation:</span>
                <div className="text-primary font-medium">{metadata.generation_time}ms</div>
              </div>
            )}
            {metadata.token_usage && (
              <div className="p-2 rounded bg-accent/20 border border-accent/30">
                <span className="text-accent/80">🔢 Tokens:</span>
                <div className="text-accent font-medium">{metadata.token_usage}</div>
              </div>
            )}
            {metadata.model && (
              <div className="p-2 rounded bg-white/10 border border-white/20">
                <span className="text-white/60">🤖 Model:</span>
                <div className="text-white font-medium">{metadata.model}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preview content */}
      <div className="border-x border-b border-glass-border bg-white/5 backdrop-blur">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-white/70">Generating email template...</p>
            </div>
          </div>
        ) : !htmlContent ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="text-6xl mb-4">📧</div>
              <p className="text-white/70">No email content to preview</p>
              <p className="text-white/50 text-sm mt-2">Generate an email template to see live preview</p>
            </div>
          </div>
        ) : showCode ? (
          <div className="h-96 overflow-auto">
            <pre className="p-4 text-sm text-green-300 bg-black/20 font-mono whitespace-pre-wrap">
              {htmlContent}
            </pre>
          </div>
        ) : (
          <div className="flex justify-center p-4">
            <div 
              className={`border-2 border-white/20 transition-all duration-300 ${
                viewMode === 'desktop' 
                  ? 'w-full max-w-4xl' 
                  : 'w-80'
              }`}
              style={{ 
                height: isFullscreen ? 'calc(100vh - 200px)' : '600px'
              }}
            >
              <iframe
                id="email-preview-iframe"
                className="w-full h-full border-0 rounded-lg"
                title="Email Preview"
                sandbox="allow-same-origin"
                style={{ background: 'white' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer with export options */}
      {htmlContent && !isLoading && (
        <div className="rounded-b-xl border-x border-b border-glass-border bg-glass-secondary backdrop-blur p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-white/60">
              ✅ Email template ready for export
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  const blob = new Blob([htmlContent], { type: 'text/html' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `email-template-${Date.now()}.html`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
                className="px-4 py-2 rounded-lg bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-all text-sm"
              >
                💾 Download HTML
              </button>
              <button 
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(htmlContent)
                    alert('HTML copied to clipboard!')
                  }
                }}
                className="px-4 py-2 rounded-lg bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 transition-all text-sm"
              >
                📋 Copy HTML
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Export as dynamic component to prevent SSR hydration issues
const LivePreview = dynamic(() => Promise.resolve(LivePreviewComponent), {
  ssr: false,
  loading: () => (
    <div className="relative transition-all duration-300">
      <div className="rounded-t-xl border backdrop-blur transition-all duration-300 ease-in-out bg-glass-primary border-glass-border shadow-glass p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              📧 Email Template Preview
            </h3>
          </div>
        </div>
      </div>
      <div className="border-x border-b border-glass-border bg-white/5 backdrop-blur">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-white/70">Loading preview...</p>
          </div>
        </div>
      </div>
    </div>
  )
})

export default LivePreview 