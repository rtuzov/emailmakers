'use client'

import { useState, useEffect } from 'react'
import { GlassCard, GlassButton, GlassInput } from '../glass'

// Icons
const SearchIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const MailIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)

const EyeIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

const DownloadIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
)

const EditIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const FilterIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
  </svg>
)

interface Template {
  id: string
  name: string
  category: string
  description: string
  thumbnail?: string
  createdAt: string
  status: 'published' | 'draft'
  openRate?: number
  clickRate?: number
}

// No mock data - templates must be fetched from API
export function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/templates')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch templates: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load templates')
      }
      
      setTemplates(data.templates || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-white/70">Loading templates...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Failed to Load Templates</h2>
          <p className="text-white/70 mb-6">{error}</p>
          <button
            onClick={fetchTemplates}
            className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/80 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 backdrop-blur-lg border-b border-glass-border bg-background/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <h1 className="text-3xl font-bold text-white">
                Email<span className="text-primary">Makers</span>
              </h1>
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-20">
            <div className="text-white/40 text-8xl mb-6">📧</div>
            <h2 className="text-3xl font-bold text-white mb-4">No Templates Found</h2>
            <p className="text-white/70 mb-8 max-w-md mx-auto">
              You haven't created any email templates yet. Start by creating your first template.
            </p>
            <a
              href="/create"
              className="inline-flex items-center justify-center px-8 py-4 bg-accent text-white rounded-lg hover:bg-accent/80 transition-colors font-medium"
            >
              Create Your First Template
            </a>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 backdrop-blur-lg border-b border-glass-border bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-3xl font-bold text-white">
              Email<span className="text-primary">Makers</span>
            </h1>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Email Templates</h2>
          <p className="text-white/70">Manage and browse your professional email templates</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      </main>
    </div>
  )
}

interface TemplateCardProps {
  template: Template
}

function TemplateCard({ template }: TemplateCardProps) {
  return (
    <div className="rounded-xl border backdrop-blur transition-all duration-300 ease-in-out bg-glass-primary border-glass-border shadow-glass hover:shadow-glass-lg hover:scale-[1.02] hover:border-glass-border overflow-hidden">
      <div className="aspect-[3/2] bg-background-light/20 relative">
        <div className="absolute inset-0 flex items-center justify-center text-white/60">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 bg-accent/20 rounded-lg flex items-center justify-center">
              📧
            </div>
            <p className="text-sm font-medium">Email Template</p>
          </div>
        </div>
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
            template.status === 'published' 
              ? 'bg-primary/20 text-primary border-primary/30' 
              : 'bg-warning/20 text-warning border-warning/30'
          }`}>
            {template.status}
          </span>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-white line-clamp-1">{template.name}</h3>
          <span className="text-xs text-accent bg-accent/10 px-2 py-1 rounded ml-2 whitespace-nowrap">
            {template.category}
          </span>
        </div>
        
        <p className="text-white/70 text-sm mb-4 line-clamp-2">{template.description}</p>
        
        {template.openRate && (
          <div className="flex gap-4 mb-4 text-sm">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
              <span className="text-white/60">Open:</span>
              <span className="text-primary ml-1 font-medium">{template.openRate}%</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-accent rounded-full mr-2"></div>
              <span className="text-white/60">Click:</span>
              <span className="text-accent ml-1 font-medium">{template.clickRate}%</span>
            </div>
          </div>
        )}
        
        <div className="text-xs text-white/50 mb-4">
          Created {template.createdAt}
        </div>
        
        <div className="flex gap-2">
          <button className="flex-1 px-3 py-1.5 text-sm bg-primary/20 border border-primary/30 text-primary rounded-lg hover:bg-primary/30 transition-colors">
            Preview
          </button>
          <button className="flex-1 px-3 py-1.5 text-sm bg-white/5 border border-white/10 text-white rounded-lg hover:bg-accent/10 transition-colors">
            Edit
          </button>
        </div>
      </div>
    </div>
  )
} 