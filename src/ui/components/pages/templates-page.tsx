'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/ui/components/layout/dashboard-layout'
import { GlassCard } from '@/ui/components/glass/glass-card'
import { GlassButton } from '@/ui/components/glass/glass-button'
import { AdvancedSearchInput } from '@/ui/components/search/advanced-search-input'
import { SearchResults, type SearchResult } from '@/ui/components/search/search-results'
import { TemplatePreviewModal } from '@/ui/components/templates/template-preview-modal'

// Icons
// const _SearchIcon = () => (
//   <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
//   </svg>
// )

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
  updatedAt?: string
  tags?: string[]
  status?: 'published' | 'draft'
  openRate?: number
  clickRate?: number
  qualityScore?: number
  agentGenerated?: boolean
  subjectLine?: string
  previewText?: string
  // Enhanced metadata fields
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
  // Database-specific fields
  briefText?: string
  mjmlCode?: string
  htmlOutput?: string
  designTokens?: any
}

interface TemplatesResponse {
  success: boolean
  data: {
    templates: Template[]
    pagination: {
      total: number
      page: number
      limit: number
      totalPages: number
      hasNext: boolean
      hasPrev: boolean
    }
    filters: {
      categories: Array<{ value: string; label: string; count: number }>
      tags: string[]
    }
  }
  metadata?: {
    query_time: number
    cache_status: string
  }
}

export function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })
  const [availableCategories, setAvailableCategories] = useState<Array<{ value: string; label: string; count: number }>>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [sortBy] = useState('createdAt')
  const [sortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Advanced filtering state
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'published' | 'draft'>('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [qualityScoreRange, setQualityScoreRange] = useState<[number, number]>([0, 100])
  const [agentGeneratedFilter, setAgentGeneratedFilter] = useState<'all' | 'ai' | 'manual'>('all')
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' })
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  
  // Advanced search state
  const [searchMode, setSearchMode] = useState<'basic' | 'advanced'>('basic')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchInfo, setSearchInfo] = useState<{
    query: string
    totalMatches: number
    searchTime: number
  } | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  
  // Preview modal state
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)

  useEffect(() => {
    fetchTemplates()
  }, [searchTerm, selectedCategory, selectedStatus, selectedTags, qualityScoreRange, agentGeneratedFilter, dateRange, pagination.page, sortBy, sortOrder])

  // Debounce search term and reset pagination when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page !== 1) {
        setPagination(prev => ({ ...prev, page: 1 }))
      } else {
        fetchTemplates()
      }
    }, 300)
    
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Reset pagination when any filter changes
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [selectedCategory, selectedStatus, selectedTags, qualityScoreRange, agentGeneratedFilter, dateRange])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      setError(null)

      // Build query parameters
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder
      })

      if (searchTerm) params.append('search', searchTerm)
      if (selectedCategory && selectedCategory !== 'all') {
        params.append('category', selectedCategory)
      }
      if (selectedStatus && selectedStatus !== 'all') {
        params.append('status', selectedStatus)
      }
      if (selectedTags.length > 0) {
        params.append('tags', selectedTags.join(','))
      }
      if (qualityScoreRange[0] > 0 || qualityScoreRange[1] < 100) {
        params.append('qualityMin', qualityScoreRange[0].toString())
        params.append('qualityMax', qualityScoreRange[1].toString())
      }
      if (agentGeneratedFilter !== 'all') {
        params.append('agentGenerated', agentGeneratedFilter === 'ai' ? 'true' : 'false')
      }
      if (dateRange.start) {
        params.append('dateStart', dateRange.start)
      }
      if (dateRange.end) {
        params.append('dateEnd', dateRange.end)
      }

      const response = await fetch(`/api/templates?${params}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data: TemplatesResponse = await response.json()

      if (data.success) {
        setTemplates(data.data.templates)
        setPagination(data.data.pagination)
        setAvailableCategories(data.data.filters.categories)
        setAvailableTags(data.data.filters.tags)
      } else {
        throw new Error('Failed to fetch templates')
      }

    } catch (err) {
      console.error('Failed to fetch templates:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }

  // Advanced search function
  const performAdvancedSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchMode('basic')
      setSearchResults([])
      setSearchInfo(null)
      return
    }

    try {
      setIsSearching(true)
      setSearchMode('advanced')

      const searchRequest = {
        query: query.trim(),
        page: pagination.page,
        limit: pagination.limit,
        sortBy,
        sortOrder,
        filters: {
          ...(selectedCategory !== 'all' && { category: selectedCategory }),
          ...(selectedStatus !== 'all' && { status: selectedStatus }),
          ...(qualityScoreRange[0] > 0 && { qualityMin: qualityScoreRange[0] }),
          ...(qualityScoreRange[1] < 100 && { qualityMax: qualityScoreRange[1] }),
          ...(agentGeneratedFilter !== 'all' && { 
            agentGenerated: agentGeneratedFilter === 'ai' 
          }),
          ...(dateRange.start && { dateStart: dateRange.start }),
          ...(dateRange.end && { dateEnd: dateRange.end }),
          ...(selectedTags.length > 0 && { tags: selectedTags })
        }
      }

      const response = await fetch('/api/templates/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify(searchRequest)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        setSearchResults(data.data.templates)
        setPagination(data.data.pagination)
        setSearchInfo({
          query: data.data.searchInfo.query,
          totalMatches: data.data.searchInfo.totalMatches,
          searchTime: data.data.searchInfo.searchTime
        })
      } else {
        throw new Error(data.error || 'Search failed')
      }
    } catch (err) {
      console.error('Advanced search failed:', err)
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setIsSearching(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  // const _handleSortChange = (field: string) => {
  //   if (field === sortBy) {
  //     setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
  //   } else {
  //     setSortBy(field)
  //     setSortOrder('desc')
  //   }
  // }

  const refreshTemplates = () => {
    fetchTemplates()
  }

  const handlePreviewTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId)
    setPreviewModalOpen(true)
  }

  const handleClosePreview = () => {
    setPreviewModalOpen(false)
    setSelectedTemplateId(null)
  }

  const handleDownloadTemplate = async (templateId: string) => {
    try {
      // Default to HTML format for quick download
      const response = await fetch(`/api/templates/${templateId}/download?format=html`, {
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`)
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition')
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') || `template-${templateId}.html`
        : `template-${templateId}.html`

      // Create download link
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)

      // Show success message (you could replace with a toast notification)
      console.log(`Template downloaded: ${filename}`)
    } catch (error) {
      console.error('Download failed:', error)
      // Show error message (you could replace with a toast notification)
      alert('Failed to download template. Please try again.')
    }
  }

  const clearAllFilters = () => {
    setSearchTerm('')
    setSelectedCategory('all')
    setSelectedStatus('all')
    setSelectedTags([])
    setQualityScoreRange([0, 100])
    setAgentGeneratedFilter('all')
    setDateRange({ start: '', end: '' })
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const hasActiveFilters = () => {
    return selectedCategory !== 'all' ||
           selectedStatus !== 'all' ||
           selectedTags.length > 0 ||
           qualityScoreRange[0] > 0 ||
           qualityScoreRange[1] < 100 ||
           agentGeneratedFilter !== 'all' ||
           dateRange.start !== '' ||
           dateRange.end !== '' ||
           searchTerm !== ''
  }

  // Templates are already filtered by the API, so we just use them directly
  const filteredTemplates = templates

  // Categories come from the API response
  const categories = availableCategories.length > 0 ? availableCategories : [
    { value: 'all', label: 'All Templates', count: 0 }
  ]

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div data-testid="loading-spinner" className="animate-spin w-12 h-12 border-2 border-transparent border-t-kupibilet-primary rounded-full mx-auto mb-4"></div>
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
            <GlassButton onClick={refreshTemplates} variant="primary">
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
              You haven&apos;t created any email templates yet. Start by creating your first template.
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
          <div className="space-y-4">
            {/* Search and Quick Actions */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Advanced Search */}
              <div className="flex-1">
                <AdvancedSearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  onSearch={performAdvancedSearch}
                  placeholder="Поиск шаблонов... (используйте кавычки для точной фразы, минус для исключения)"
                  suggestions={availableTags.map(tag => ({
                    text: tag,
                    type: 'suggestion' as const,
                    description: 'Популярный тег'
                  }))}
                  showSyntaxHelp={true}
                  data-testid="advanced-search-input"
                />
              </div>

              {/* Filter Controls */}
              <div className="flex gap-2">
                <GlassButton
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  data-testid="advanced-filters-toggle"
                >
                  <FilterIcon />
                  <span className="ml-2">Filters</span>
                  {hasActiveFilters() && (
                    <span className="ml-2 px-2 py-0.5 bg-kupibilet-primary text-xs rounded-full">
                      {[selectedCategory !== 'all', selectedStatus !== 'all', selectedTags.length > 0, 
                        qualityScoreRange[0] > 0 || qualityScoreRange[1] < 100, agentGeneratedFilter !== 'all',
                        dateRange.start || dateRange.end, searchTerm].filter(Boolean).length}
                    </span>
                  )}
                </GlassButton>
                {hasActiveFilters() && (
                  <GlassButton
                    variant="outline"
                    size="sm"
                    onClick={clearAllFilters}
                    data-testid="clear-filters"
                  >
                    Clear All
                  </GlassButton>
                )}
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <GlassButton
                  key={category.value}
                  variant={selectedCategory === category.value ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.value)}
                  data-testid={`category-filter-${category.value}`}
                >
                  {category.label}
                  {category.count > 0 && (
                    <span className="ml-1 text-xs opacity-70">({category.count})</span>
                  )}
                </GlassButton>
              ))}
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="border-t border-white/10 pt-4 space-y-4" data-testid="advanced-filters-panel">
                {/* Status Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Status</label>
                  <div className="flex gap-2">
                    {[{ value: 'all', label: 'All' }, { value: 'published', label: 'Published' }, { value: 'draft', label: 'Draft' }].map((status) => (
                      <GlassButton
                        key={status.value}
                        variant={selectedStatus === status.value ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedStatus(status.value as any)}
                        data-testid={`status-filter-${status.value}`}
                      >
                        {status.label}
                      </GlassButton>
                    ))}
                  </div>
                </div>

                {/* Tags Filter */}
                {availableTags.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80">Tags</label>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                      {availableTags.map((tag) => (
                        <GlassButton
                          key={tag}
                          variant={selectedTags.includes(tag) ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => toggleTag(tag)}
                          data-testid={`tag-filter-${tag}`}
                        >
                          {tag}
                        </GlassButton>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quality Score Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">
                    Quality Score: {qualityScoreRange[0]}% - {qualityScoreRange[1]}%
                  </label>
                  <div className="flex gap-4 items-center">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={qualityScoreRange[0]}
                      onChange={(e) => setQualityScoreRange([parseInt(e.target.value), qualityScoreRange[1]])}
                      className="flex-1"
                      data-testid="quality-min-range"
                    />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={qualityScoreRange[1]}
                      onChange={(e) => setQualityScoreRange([qualityScoreRange[0], parseInt(e.target.value)])}
                      className="flex-1"
                      data-testid="quality-max-range"
                    />
                  </div>
                </div>

                {/* AI Generation Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Generation Type</label>
                  <div className="flex gap-2">
                    {[{ value: 'all', label: 'All' }, { value: 'ai', label: 'AI Generated' }, { value: 'manual', label: 'Manual' }].map((type) => (
                      <GlassButton
                        key={type.value}
                        variant={agentGeneratedFilter === type.value ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setAgentGeneratedFilter(type.value as any)}
                        data-testid={`generation-filter-${type.value}`}
                      >
                        {type.label}
                      </GlassButton>
                    ))}
                  </div>
                </div>

                {/* Date Range Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Date Range</label>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-xs text-white/60">From</label>
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="w-full glass-card px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-kupibilet-primary/50 rounded-lg"
                        data-testid="date-start-input"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-white/60">To</label>
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="w-full glass-card px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-kupibilet-primary/50 rounded-lg"
                        data-testid="date-end-input"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Templates Display */}
        {searchMode === 'advanced' ? (
          /* Advanced Search Results */
          <SearchResults
            results={searchResults}
            query={searchInfo?.query || ''}
            totalResults={searchInfo?.totalMatches || 0}
            searchTime={searchInfo?.searchTime || 0}
            loading={isSearching}
            onResultClick={(result) => {
              // Handle template click - could navigate to edit or preview
              console.log('Template clicked:', result)
            }}
            onPreview={(result) => {
              handlePreviewTemplate(result.id)
            }}
            onDownload={(result) => {
              handleDownloadTemplate(result.id)
            }}
            data-testid="advanced-search-results"
          />
        ) : (
          /* Traditional Grid/List View */
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((template) => (
                  <TemplateCard 
                    key={template.id} 
                    template={template} 
                    onPreview={handlePreviewTemplate}
                    onDownload={handleDownloadTemplate}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTemplates.map((template) => (
                  <TemplateListItem 
                    key={template.id} 
                    template={template} 
                    onPreview={handlePreviewTemplate}
                    onDownload={handleDownloadTemplate}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {searchMode === 'basic' && filteredTemplates.length === 0 && (searchTerm || hasActiveFilters()) && (
          <GlassCard className="p-12 text-center">
            <div className="text-white/40 text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">No templates found</h3>
            <p className="text-white/70">
              Try adjusting your search terms or filters
            </p>
          </GlassCard>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-white/70 text-sm">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} templates
              </div>
              <div className="flex items-center gap-2">
                <GlassButton
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                >
                  Previous
                </GlassButton>
                
                {/* Page numbers */}
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    
                    return (
                      <GlassButton
                        key={pageNum}
                        variant={pageNum === pagination.page ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </GlassButton>
                    );
                  })}
                </div>

                <GlassButton
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                >
                  Next
                </GlassButton>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Template Preview Modal */}
        <TemplatePreviewModal
          templateId={selectedTemplateId}
          isOpen={previewModalOpen}
          onClose={handleClosePreview}
        />
      </div>
    </DashboardLayout>
  )
}

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