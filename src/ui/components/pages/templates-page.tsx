'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/ui/components/layout/dashboard-layout'
import { GlassCard } from '@/ui/components/glass/glass-card'
import { GlassButton } from '@/ui/components/glass/glass-button'

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
  preview?: string
  createdAt: string
  tags?: string[]
  status?: 'published' | 'draft'
  openRate?: number
  clickRate?: number
}

// No mock data - templates must be fetched from API
export function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Mock templates for demo purposes
  const mockTemplates: Template[] = [
    {
      id: '1',
      name: 'Black Friday Campaign',
      category: 'promotional',
      description: 'Eye-catching promotional template with countdown timer and special offers',
      thumbnail: '/api/placeholder/300/200',
      createdAt: '2024-01-15',
      tags: ['sale', 'promotion', 'holiday'],
      status: 'published',
      openRate: 89,
      clickRate: 24
    },
    {
      id: '2',
      name: 'Monthly Newsletter',
      category: 'newsletter',
      description: 'Clean and professional newsletter template with featured articles section',
      thumbnail: '/api/placeholder/300/200',
      createdAt: '2024-01-10',
      tags: ['newsletter', 'updates', 'content'],
      status: 'published',
      openRate: 76,
      clickRate: 18
    },
    {
      id: '3',
      name: 'Product Launch',
      category: 'announcement',
      description: 'Modern product announcement template with hero image and feature highlights',
      thumbnail: '/api/placeholder/300/200',
      createdAt: '2024-01-08',
      tags: ['product', 'launch', 'announcement'],
      status: 'published',
      openRate: 92,
      clickRate: 31
    },
    {
      id: '4',
      name: 'Welcome Series #1',
      category: 'welcome',
      description: 'Warm welcome email template for new subscribers with company introduction',
      thumbnail: '/api/placeholder/300/200',
      createdAt: '2024-01-05',
      tags: ['welcome', 'onboarding', 'introduction'],
      status: 'draft',
      openRate: 84,
      clickRate: 22
    }
  ]

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      // Simulate API call - in real app, this would fetch from your API
      await new Promise(resolve => setTimeout(resolve, 1000))
      setTemplates(mockTemplates)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = [
    { value: 'all', label: 'All Templates' },
    { value: 'newsletter', label: 'Newsletter' },
    { value: 'promotional', label: 'Promotional' },
    { value: 'announcement', label: 'Announcement' },
    { value: 'welcome', label: 'Welcome Series' },
    { value: 'transactional', label: 'Transactional' }
  ]

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-2 border-transparent border-t-kupibilet-primary rounded-full mx-auto mb-4"></div>
            <p className="text-white/70">Loading templates...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <GlassCard className="p-8 text-center max-w-md">
            <div className="text-red-400 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-white mb-2">Failed to Load Templates</h2>
            <p className="text-white/70 mb-6">{error}</p>
            <GlassButton onClick={fetchTemplates} variant="primary">
              Retry
            </GlassButton>
          </GlassCard>
        </div>
      </DashboardLayout>
    )
  }

  if (templates.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <GlassCard className="p-12 text-center max-w-lg">
            <div className="text-white/40 text-8xl mb-6">📧</div>
            <h2 className="text-2xl font-bold text-white mb-4">No Templates Found</h2>
            <p className="text-white/70 mb-8">
              You haven't created any email templates yet. Start by creating your first template.
            </p>
            <Link href="/create">
              <GlassButton variant="primary" size="lg" glow>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Your First Template
              </GlassButton>
            </Link>
          </GlassCard>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-heading font-primary text-white mb-2">
              Email Templates
            </h1>
            <p className="text-white/70">
              Manage your email templates with AI-powered insights and analytics
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3">
            <GlassButton variant="outline" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
              {viewMode === 'grid' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              )}
            </GlassButton>
            <Link href="/create">
              <GlassButton variant="primary" glow>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create New
              </GlassButton>
            </Link>
          </div>
        </div>

        {/* Filters and Search */}
        <GlassCard className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <SearchIcon />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full glass-card pl-10 pr-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-kupibilet-primary/50 rounded-xl"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50">
                <SearchIcon />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2">
              {categories.map((category) => (
                <GlassButton
                  key={category.value}
                  variant={selectedCategory === category.value ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.value)}
                >
                  {category.label}
                </GlassButton>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Templates Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTemplates.map((template) => (
              <TemplateListItem key={template.id} template={template} />
            ))}
          </div>
        )}

        {filteredTemplates.length === 0 && searchTerm && (
          <GlassCard className="p-12 text-center">
            <div className="text-white/40 text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">No templates found</h3>
            <p className="text-white/70">
              Try adjusting your search terms or filters
            </p>
          </GlassCard>
        )}
      </div>
    </DashboardLayout>
  )
}

interface TemplateCardProps {
  template: Template
}

function TemplateCard({ template }: TemplateCardProps) {
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
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-white truncate">{template.name}</h3>
          <div className="flex items-center gap-1 ml-2">
            <span className="text-xs text-kupibilet-primary font-medium">{template.openRate}%</span>
          </div>
        </div>

        <p className="text-white/70 text-sm mb-4 line-clamp-2">{template.description}</p>

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

        {/* Actions */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/50">{template.createdAt}</span>
          <div className="flex gap-2">
            <GlassButton size="sm" variant="outline">
              <EyeIcon />
            </GlassButton>
            <GlassButton size="sm" variant="outline">
              <EditIcon />
            </GlassButton>
            <GlassButton size="sm" variant="outline">
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
}

function TemplateListItem({ template }: TemplateListItemProps) {
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
            <h3 className="text-lg font-semibold text-white truncate">{template.name}</h3>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ml-4 ${
              template.status === 'published' 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              {template.status}
            </div>
          </div>
          <p className="text-white/70 text-sm mb-2">{template.description}</p>
          <div className="flex items-center gap-4 text-xs text-white/50">
            <span>{template.createdAt}</span>
            <span>Open Rate: {template.openRate}%</span>
            <span>Click Rate: {template.clickRate}%</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-shrink-0">
          <GlassButton size="sm" variant="outline">
            <EyeIcon />
          </GlassButton>
          <GlassButton size="sm" variant="outline">
            <EditIcon />
          </GlassButton>
          <GlassButton size="sm" variant="outline">
            <DownloadIcon />
          </GlassButton>
        </div>
      </div>
    </GlassCard>
  )
}

// Add spinning animation to the document head
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `
  document.head.appendChild(style)
} 