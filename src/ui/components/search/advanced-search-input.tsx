'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { GlassCard } from '@/ui/components/glass/glass-card'
import { parseSearchQuery, type SearchQuery } from '@/shared/utils/search-parser'

export interface SearchSuggestion {
  text: string
  type: 'recent' | 'suggestion' | 'field'
  description?: string
}

interface AdvancedSearchInputProps {
  value: string
  onChange: (value: string) => void
  onSearch?: (query: string) => void
  placeholder?: string
  suggestions?: SearchSuggestion[]
  showSyntaxHelp?: boolean
  className?: string
  disabled?: boolean
  'data-testid'?: string
}

const SEARCH_OPERATORS = [
  {
    syntax: '"exact phrase"',
    description: 'Точная фраза в кавычках',
    example: '"париж уикенд"'
  },
  {
    syntax: '-exclude',
    description: 'Исключить слово (с минусом)',
    example: 'отдых -дорого'
  },
  {
    syntax: 'field:value',
    description: 'Поиск в конкретном поле',
    example: 'name:париж'
  },
  {
    syntax: 'term1 OR term2',
    description: 'Альтернативные варианты',
    example: 'москва OR спб'
  }
]

const SEARCH_FIELDS = [
  { field: 'name', description: 'Название шаблона' },
  { field: 'description', description: 'Описание' },
  { field: 'tags', description: 'Теги' },
  { field: 'status', description: 'Статус (published/draft)' }
]

export function AdvancedSearchInput({
  value,
  onChange,
  onSearch,
  placeholder = 'Поиск шаблонов...',
  suggestions = [],
  showSyntaxHelp = true,
  className = '',
  disabled = false,
  'data-testid': testId = 'advanced-search-input'
}: AdvancedSearchInputProps) {
  const [focused, setFocused] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [parsedQuery, setParsedQuery] = useState<SearchQuery | null>(null)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [cursorPosition, setCursorPosition] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('emailTemplatesRecentSearches')
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored).slice(0, 5))
      } catch {
        // Ignore invalid JSON
      }
    }
  }, [])

  // Parse query when value changes
  useEffect(() => {
    if (value.trim()) {
      setParsedQuery(parseSearchQuery(value))
    } else {
      setParsedQuery(null)
    }
  }, [value])

  // Save search to recent searches
  const saveToRecentSearches = useCallback((query: string) => {
    if (!query.trim()) return
    
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('emailTemplatesRecentSearches', JSON.stringify(updated))
  }, [recentSearches])

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    setCursorPosition(e.target.selectionStart || 0)
    
    // Show dropdown when typing
    if (newValue.trim() && focused) {
      setShowDropdown(true)
    } else {
      setShowDropdown(false)
    }
  }

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
      setShowHelp(false)
      inputRef.current?.blur()
    }
  }

  // Handle search execution
  const handleSearch = () => {
    if (value.trim()) {
      saveToRecentSearches(value.trim())
      onSearch?.(value.trim())
    }
    setShowDropdown(false)
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'field') {
      // Insert field syntax at cursor position
      const before = value.substring(0, cursorPosition)
      const after = value.substring(cursorPosition)
      const newValue = `${before}${suggestion.text}:${after}`
      onChange(newValue)
      
      // Focus and position cursor after the field:
      setTimeout(() => {
        if (inputRef.current) {
          const newPos = before.length + suggestion.text.length + 1
          inputRef.current.setSelectionRange(newPos, newPos)
          inputRef.current.focus()
        }
      }, 0)
    } else {
      onChange(suggestion.text)
      handleSearch()
    }
    setShowDropdown(false)
  }

  // Handle focus/blur
  const handleFocus = () => {
    setFocused(true)
    if (value.trim() || recentSearches.length > 0) {
      setShowDropdown(true)
    }
  }

  const handleBlur = () => {
    setFocused(false)
    // Delay hiding dropdown to allow clicks
    setTimeout(() => {
      setShowDropdown(false)
    }, 200)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
        setShowHelp(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Generate suggestions based on current input
  const generateSuggestions = (): SearchSuggestion[] => {
    const allSuggestions: SearchSuggestion[] = []

    // Recent searches
    if (!value.trim() && recentSearches.length > 0) {
      allSuggestions.push(
        ...recentSearches.map(search => ({
          text: search,
          type: 'recent' as const,
          description: 'Недавний поиск'
        }))
      )
    }

    // Field suggestions when typing field:
    if (value.includes(':') || value.endsWith(' ')) {
      SEARCH_FIELDS.forEach(field => {
        allSuggestions.push({
          text: field.field,
          type: 'field' as const,
          description: field.description
        })
      })
    }

    // Custom suggestions from props
    allSuggestions.push(...suggestions)

    return allSuggestions.slice(0, 8) // Limit to 8 suggestions
  }

  const currentSuggestions = generateSuggestions()

  return (
    <div className={`relative ${className}`}>
      {/* Main search input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full glass-card pl-10 pr-16 py-3 text-white placeholder-white/50 
            focus:outline-none focus:ring-2 focus:ring-kupibilet-primary/50 rounded-xl
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          data-testid={testId}
        />
        
        {/* Search icon */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Help button */}
        {showSyntaxHelp && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              setShowHelp(!showHelp)
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white transition-colors"
            data-testid="search-help-button"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        )}

        {/* Search button */}
        <button
          type="button"
          onClick={handleSearch}
          disabled={disabled || !value.trim()}
          className="absolute right-8 top-1/2 transform -translate-y-1/2 text-kupibilet-primary hover:text-kupibilet-primary/80 disabled:text-white/30 transition-colors"
          data-testid="search-submit-button"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M6 12h12" />
          </svg>
        </button>
      </div>

      {/* Query breakdown display */}
      {parsedQuery && (parsedQuery.terms.length > 0 || parsedQuery.exactPhrases.length > 0 || parsedQuery.excludedTerms.length > 0) && (
        <div className="mt-2 flex flex-wrap gap-1" data-testid="search-query-breakdown">
          {parsedQuery.terms.map((term, index) => (
            <span key={`term-${index}`} className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">
              {term}
            </span>
          ))}
          {parsedQuery.exactPhrases.map((phrase, index) => (
            <span key={`phrase-${index}`} className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded">
              &quot;{phrase}&quot;
            </span>
          ))}
          {parsedQuery.excludedTerms.map((term, index) => (
            <span key={`excluded-${index}`} className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded">
              -{term}
            </span>
          ))}
          {parsedQuery.fieldQueries.map((fq, index) => (
            <span key={`field-${index}`} className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded">
              {fq.field}:{fq.value}
            </span>
          ))}
        </div>
      )}

      {/* Suggestions dropdown */}
      {showDropdown && currentSuggestions.length > 0 && (
        <div ref={dropdownRef} className="absolute top-full left-0 right-0 mt-1 z-50" data-testid="search-suggestions">
          <GlassCard className="p-2 max-h-64 overflow-y-auto">
            {currentSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-3 py-2 hover:bg-white/10 rounded text-white/90 transition-colors"
                data-testid={`search-suggestion-${index}`}
              >
                <div className="flex items-center gap-2">
                  {suggestion.type === 'recent' && (
                    <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {suggestion.type === 'field' && (
                    <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  )}
                  <div className="flex-1">
                    <div className="text-sm">{suggestion.text}</div>
                    {suggestion.description && (
                      <div className="text-xs text-white/50">{suggestion.description}</div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </GlassCard>
        </div>
      )}

      {/* Syntax help panel */}
      {showHelp && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50" data-testid="search-help-panel">
          <GlassCard className="p-4">
            <h4 className="text-white font-medium mb-3">Операторы поиска</h4>
            <div className="space-y-2">
              {SEARCH_OPERATORS.map((op, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <div>
                    <code className="text-kupibilet-primary bg-black/20 px-1 rounded">{op.syntax}</code>
                    <span className="text-white/70 ml-2">{op.description}</span>
                  </div>
                  <code className="text-white/50 text-xs">{op.example}</code>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-white/10">
              <h5 className="text-white/80 text-sm font-medium mb-2">Доступные поля:</h5>
              <div className="flex flex-wrap gap-1">
                {SEARCH_FIELDS.map(field => (
                  <button
                    key={field.field}
                    onClick={() => {
                      const newValue = value + (value.endsWith(' ') ? '' : ' ') + field.field + ':'
                      onChange(newValue)
                      setShowHelp(false)
                      inputRef.current?.focus()
                    }}
                    className="px-2 py-1 bg-kupibilet-primary/20 text-kupibilet-primary text-xs rounded hover:bg-kupibilet-primary/30 transition-colors"
                  >
                    {field.field}
                  </button>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  )
}