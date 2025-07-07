'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useClientOnly } from '../../../hooks/useClientOnly'

interface SimpleLivePreviewProps {
  htmlContent: string
  subject?: string
  preheader?: string
  metadata?: {
    generation_time?: number
    token_usage?: number
    model?: string
    duration?: number
  }
}

function SimpleLivePreviewComponent({ 
  htmlContent, 
  subject,
  preheader,
  metadata
}: SimpleLivePreviewProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [showCode, setShowCode] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const isClient = useClientOnly()

  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.srcdoc = htmlContent
    }
  }, [htmlContent])

  const handleCopyHTML = () => {
    if (!isClient) return
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(htmlContent)
        .then(() => alert('HTML copied to clipboard!'))
        .catch(() => alert('Failed to copy HTML'))
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = htmlContent
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        alert('HTML copied to clipboard!')
      } catch {
        alert('Failed to copy HTML')
      }
      document.body.removeChild(textArea)
    }
  }

  const handleDownloadHTML = () => {
    if (!isClient) return
    
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `email-template-${Math.random().toString(36).substring(2, 9)}.html`
    a.click()
    URL.revokeObjectURL(url)
  }
  
  if (!isClient) {
    return (
      <div className="mt-8 rounded-xl border backdrop-blur transition-all duration-300 ease-in-out bg-glass-primary border-glass-border shadow-glass">
        <div className="p-4 border-b border-glass-border">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            📧 Generated Email Template
          </h3>
        </div>
        <div className="p-4">
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
    <div className="mt-8 rounded-xl border backdrop-blur transition-all duration-300 ease-in-out bg-glass-primary border-glass-border shadow-glass">
      {/* Header */}
      <div className="p-4 border-b border-glass-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              📧 Generated Email Template
            </h3>
            {metadata && (
              <div className="text-sm text-white/70 mt-1">
                Generated in {metadata.duration || 0}ms • {metadata.token_usage || 0} tokens • Model: {metadata.model || 'gpt-4o-mini'}
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
          </div>
        </div>

        {/* Email metadata */}
        {(subject || preheader) && (
          <div className="space-y-2 p-3 rounded-lg bg-white/5 border border-white/10">
            {subject && (
              <div>
                <span className="text-white/60 text-sm">Subject:</span>
                <div className="text-white font-medium">{subject}</div>
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
      </div>

      {/* Preview content */}
      <div className="p-4">
        {showCode ? (
          <div className="h-96 overflow-auto">
            <pre className="p-4 text-sm text-green-300 bg-black/20 font-mono whitespace-pre-wrap rounded-lg">
              {htmlContent}
            </pre>
          </div>
        ) : (
          <div className="flex justify-center">
            <div 
              className={`border-2 border-white/20 transition-all duration-300 ${
                viewMode === 'desktop' 
                  ? 'w-full max-w-4xl' 
                  : 'w-80'
              }`}
              style={{ height: '600px' }}
            >
              <iframe
                className="w-full h-full border-0 rounded-lg"
                srcDoc={htmlContent}
                title="Email Preview"
                sandbox="allow-same-origin"
                style={{ background: 'white' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer with export options */}
      <div className="p-4 border-t border-glass-border bg-glass-secondary/50">
        <div className="flex items-center justify-between">
          <div className="text-sm text-white/60">
            ✅ Email template ready for export
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleDownloadHTML}
              className="px-4 py-2 rounded-lg bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-all text-sm"
            >
              💾 Download HTML
            </button>
            <button 
              onClick={handleCopyHTML}
              className="px-4 py-2 rounded-lg bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 transition-all text-sm"
            >
              📋 Copy HTML
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Export as dynamic component to prevent SSR hydration issues
const SimpleLivePreview = dynamic(() => Promise.resolve(SimpleLivePreviewComponent), {
  ssr: false,
  loading: () => (
    <div className="mt-8 rounded-xl border backdrop-blur transition-all duration-300 ease-in-out bg-glass-primary border-glass-border shadow-glass">
      <div className="p-4 border-b border-glass-border">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          📧 Generated Email Template
        </h3>
      </div>
      <div className="p-4">
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

export default SimpleLivePreview 