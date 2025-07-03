'use client'

import React from 'react'
import { GlassCard } from '@/ui/components/glass/glass-card'
import { GlassButton } from '@/ui/components/glass/glass-button'

export interface SearchResult {
  id: string
  name: string
  description: string
  category: string
  status: 'published' | 'draft'
  qualityScore?: number
  createdAt: string
  updatedAt?: string
  tags?: string[]
  thumbnail?: string
  relevanceScore?: number
  highlightedName?: string
  highlightedDescription?: string
  snippet?: string
  openRate?: number
  clickRate?: number
  agentGenerated?: boolean
}

interface SearchResultsProps {
  results: SearchResult[]
  query: string
  totalResults: number
  searchTime: number
  loading?: boolean
  onResultClick?: (result: SearchResult) => void
  onPreview?: (result: SearchResult) => void
  onDownload?: (result: SearchResult) => void
  className?: string
  'data-testid'?: string
}

export function SearchResults({
  results,
  query,
  totalResults,
  searchTime,
  loading = false,
  onResultClick,
  onPreview,
  onDownload,
  className = '',
  'data-testid': testId = 'search-results'
}: SearchResultsProps) {
  
  if (loading) {
    return (
      <div className={`space-y-4 ${className}`} data-testid={`${testId}-loading`}>
        {/* Loading skeleton */}
        {[...Array(3)].map((_, index) => (
          <GlassCard key={index} className="p-6 animate-pulse">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-white/10 rounded-lg"></div>
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-white/10 rounded w-3/4"></div>
                <div className="h-3 bg-white/10 rounded w-full"></div>
                <div className="h-3 bg-white/10 rounded w-5/6"></div>
                <div className="flex gap-2">
                  <div className="h-6 bg-white/10 rounded w-16"></div>
                  <div className="h-6 bg-white/10 rounded w-16"></div>
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    )
  }

  if (results.length === 0 && query) {
    return (
      <div className={`text-center py-12 ${className}`} data-testid={`${testId}-empty`}>
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-medium text-white mb-2">Ничего не найдено</h3>
        <p className="text-white/70 mb-6">
          По запросу &quot;<span className="text-kupibilet-primary">{query}</span>&quot; результаты не найдены
        </p>
        <div className="text-sm text-white/50">
          <p>Попробуйте:</p>
          <ul className="mt-2 space-y-1">
            <li>• Проверить орфографию</li>
            <li>• Использовать более общие термины</li>
            <li>• Попробовать синонимы</li>
            <li>• Использовать операторы поиска</li>
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`} data-testid={testId}>
      {/* Search summary */}
      {query && (
        <div className="flex items-center justify-between text-sm text-white/70" data-testid="search-summary">
          <div>
            Найдено <span className="text-kupibilet-primary font-medium">{totalResults}</span> результатов
            {query && (
              <span> по запросу &quot;<span className="text-white">{query}</span>&quot;</span>
            )}
          </div>
          <div>
            {searchTime < 100 ? `${searchTime}мс` : `${(searchTime / 1000).toFixed(2)}с`}
          </div>
        </div>
      )}

      {/* Results list */}
      <div className="space-y-4">
        {results.map((result) => (
          <SearchResultCard
            key={result.id}
            result={result}
            onClick={onResultClick}
            onPreview={onPreview}
            onDownload={onDownload}
          />
        ))}
      </div>
    </div>
  )
}

interface SearchResultCardProps {
  result: SearchResult
  onClick?: (result: SearchResult) => void
  onPreview?: (result: SearchResult) => void
  onDownload?: (result: SearchResult) => void
}

function SearchResultCard({ result, onClick, onPreview, onDownload }: SearchResultCardProps) {
  const handleCardClick = () => {
    onClick?.(result)
  }

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation()
    onPreview?.(result)
  }

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDownload?.(result)
  }

  return (
    <GlassCard 
      className="p-6 hover:bg-white/5 transition-all duration-200 cursor-pointer group"
      onClick={handleCardClick}
      data-testid={`search-result-${result.id}`}
    >
      <div className="flex items-start gap-4">
        {/* Thumbnail */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 bg-gradient-to-br from-kupibilet-primary/20 to-kupibilet-secondary/20 rounded-lg flex items-center justify-center">
            <svg className="w-8 h-8 text-kupibilet-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title with highlighting */}
          <h3 className="text-lg font-medium text-white mb-2 group-hover:text-kupibilet-primary transition-colors">
            {result.highlightedName ? (
              <span 
                dangerouslySetInnerHTML={{ __html: result.highlightedName }}
                className="[&_mark]:bg-kupibilet-primary/30 [&_mark]:text-kupibilet-primary [&_mark]:px-1 [&_mark]:rounded"
              />
            ) : (
              result.name
            )}
          </h3>

          {/* Description/Snippet with highlighting */}
          <div className="text-white/70 mb-3 line-clamp-2">
            {result.snippet || result.highlightedDescription ? (
              <span 
                dangerouslySetInnerHTML={{ 
                  __html: result.snippet || result.highlightedDescription || result.description 
                }}
                className="[&_mark]:bg-kupibilet-primary/30 [&_mark]:text-kupibilet-primary [&_mark]:px-1 [&_mark]:rounded"
              />
            ) : (
              result.description
            )}
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-4 mb-3 text-sm text-white/50">
            {/* Category */}
            <span className="capitalize">{result.category}</span>
            
            {/* Status */}
            <span className={`px-2 py-1 rounded text-xs ${
              result.status === 'published' 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              {result.status === 'published' ? 'Опубликован' : 'Черновик'}
            </span>

            {/* Quality Score */}
            {result.qualityScore && (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
                {result.qualityScore}
              </span>
            )}

            {/* Relevance Score */}
            {result.relevanceScore !== undefined && result.relevanceScore > 0 && (
              <span className="text-kupibilet-primary">
                Релевантность: {result.relevanceScore.toFixed(1)}
              </span>
            )}

            {/* Date */}
            <span>{new Date(result.createdAt).toLocaleDateString('ru-RU')}</span>
          </div>

          {/* Tags */}
          {result.tags && result.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {result.tags.slice(0, 4).map((tag, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-white/10 text-white/70 text-xs rounded"
                >
                  {tag}
                </span>
              ))}
              {result.tags.length > 4 && (
                <span className="px-2 py-1 bg-white/10 text-white/50 text-xs rounded">
                  +{result.tags.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Performance metrics */}
          {(result.openRate || result.clickRate) && (
            <div className="flex items-center gap-4 text-xs text-white/50 mb-3">
              {result.openRate && (
                <span>📈 Open: {result.openRate.toFixed(1)}%</span>
              )}
              {result.clickRate && (
                <span>👆 Click: {result.clickRate.toFixed(1)}%</span>
              )}
              {result.agentGenerated && (
                <span>🤖 AI Generated</span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {onPreview && (
            <GlassButton
              variant="outline"
              size="sm"
              onClick={handlePreview}
              data-testid={`preview-${result.id}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </GlassButton>
          )}
          
          {onDownload && (
            <GlassButton
              variant="outline"
              size="sm"
              onClick={handleDownload}
              data-testid={`download-${result.id}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </GlassButton>
          )}
        </div>
      </div>
    </GlassCard>
  )
}