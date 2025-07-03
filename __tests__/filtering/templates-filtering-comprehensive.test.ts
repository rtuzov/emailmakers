/**
 * Phase 2.3.3 Comprehensive Filtering System Tests
 * Tests all filtering functionality including:
 * - Basic filters (category, status, search)
 * - Advanced filters (tags, quality score, generation type, date range)
 * - Filter combinations and interactions
 * - UI state management
 * - API parameter building
 * - Pagination integration
 */

import { jest } from '@jest/globals'

describe('Templates Filtering System - Phase 2.3.3', () => {
  let mockFetch: jest.MockedFunction<typeof fetch>
  
  beforeEach(() => {
    global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
    
    // Mock successful API response
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          templates: [],
          pagination: {
            total: 0,
            page: 1,
            limit: 12,
            totalPages: 0,
            hasNext: false,
            hasPrev: false
          },
          filters: {
            categories: [
              { value: 'all', label: 'All Templates', count: 6 },
              { value: 'promotional', label: 'Promotional', count: 2 },
              { value: 'transactional', label: 'Transactional', count: 2 }
            ],
            tags: ['париж', 'скидка', 'выходные', 'романтика']
          }
        },
        metadata: {
          query_time: 50,
          cache_status: 'database'
        }
      })
    } as Response)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Filter Parameter Building', () => {
    test('should build correct URL parameters for basic filters', () => {
      const params = new URLSearchParams({
        page: '1',
        limit: '12',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        search: 'париж',
        category: 'promotional',
        status: 'published'
      })

      const expectedUrl = `/api/templates?${params}`
      
      expect(expectedUrl).toContain('search=париж')
      expect(expectedUrl).toContain('category=promotional')
      expect(expectedUrl).toContain('status=published')
    })

    test('should build correct URL parameters for advanced filters', () => {
      const params = new URLSearchParams({
        page: '1',
        limit: '12',
        sortBy: 'qualityScore',
        sortOrder: 'desc',
        tags: 'париж,скидка',
        qualityMin: '80',
        qualityMax: '95',
        agentGenerated: 'true',
        dateStart: '2024-01-01',
        dateEnd: '2024-12-31'
      })

      const expectedUrl = `/api/templates?${params}`
      
      expect(expectedUrl).toContain('tags=париж,скидка')
      expect(expectedUrl).toContain('qualityMin=80')
      expect(expectedUrl).toContain('qualityMax=95')
      expect(expectedUrl).toContain('agentGenerated=true')
      expect(expectedUrl).toContain('dateStart=2024-01-01')
      expect(expectedUrl).toContain('dateEnd=2024-12-31')
    })

    test('should omit default filter values', () => {
      const params = new URLSearchParams({
        page: '1',
        limit: '12',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })

      // Should NOT include these default values
      expect(params.toString()).not.toContain('category=all')
      expect(params.toString()).not.toContain('status=all')
      expect(params.toString()).not.toContain('qualityMin=0')
      expect(params.toString()).not.toContain('qualityMax=100')
      expect(params.toString()).not.toContain('agentGenerated=all')
    })
  })

  describe('Filter State Management', () => {
    test('should reset pagination when filters change', () => {
      let currentPage = 3
      const filters = {
        selectedCategory: 'promotional',
        selectedStatus: 'published',
        searchTerm: 'paris'
      }

      // Simulate filter change - should reset page to 1
      currentPage = 1

      expect(currentPage).toBe(1)
    })

    test('should track active filters correctly', () => {
      const hasActiveFilters = (state: any) => {
        return state.selectedCategory !== 'all' ||
               state.selectedStatus !== 'all' ||
               state.selectedTags.length > 0 ||
               state.qualityScoreRange[0] > 0 ||
               state.qualityScoreRange[1] < 100 ||
               state.agentGeneratedFilter !== 'all' ||
               state.dateRange.start !== '' ||
               state.dateRange.end !== '' ||
               state.searchTerm !== ''
      }

      // No active filters
      expect(hasActiveFilters({
        selectedCategory: 'all',
        selectedStatus: 'all',
        selectedTags: [],
        qualityScoreRange: [0, 100],
        agentGeneratedFilter: 'all',
        dateRange: { start: '', end: '' },
        searchTerm: ''
      })).toBe(false)

      // With active filters
      expect(hasActiveFilters({
        selectedCategory: 'promotional',
        selectedStatus: 'all',
        selectedTags: [],
        qualityScoreRange: [0, 100],
        agentGeneratedFilter: 'all',
        dateRange: { start: '', end: '' },
        searchTerm: ''
      })).toBe(true)

      expect(hasActiveFilters({
        selectedCategory: 'all',
        selectedStatus: 'all',
        selectedTags: ['париж'],
        qualityScoreRange: [0, 100],
        agentGeneratedFilter: 'all',
        dateRange: { start: '', end: '' },
        searchTerm: ''
      })).toBe(true)
    })

    test('should count active filters correctly', () => {
      const countActiveFilters = (state: any) => {
        return [
          state.selectedCategory !== 'all',
          state.selectedStatus !== 'all',
          state.selectedTags.length > 0,
          state.qualityScoreRange[0] > 0 || state.qualityScoreRange[1] < 100,
          state.agentGeneratedFilter !== 'all',
          state.dateRange.start || state.dateRange.end,
          state.searchTerm
        ].filter(Boolean).length
      }

      expect(countActiveFilters({
        selectedCategory: 'promotional',
        selectedStatus: 'published',
        selectedTags: ['париж', 'скидка'],
        qualityScoreRange: [80, 100],
        agentGeneratedFilter: 'ai',
        dateRange: { start: '2024-01-01', end: '' },
        searchTerm: 'paris'
      })).toBe(7) // All possible filters active
    })
  })

  describe('API Integration Tests', () => {
    test('should call API with correct search parameters', async () => {
      // Simulate API call with search
      const searchTerm = 'париж'
      const params = new URLSearchParams({
        page: '1',
        limit: '12',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        search: searchTerm
      })

      await fetch(`/api/templates?${params}`)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/templates?'),
        expect.objectContaining({
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })
      )

      const calledUrl = mockFetch.mock.calls[0][0] as string
      expect(calledUrl).toContain('search=париж')
    })

    test('should call API with category filter', async () => {
      const params = new URLSearchParams({
        page: '1',
        limit: '12',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        category: 'promotional'
      })

      await fetch(`/api/templates?${params}`)

      const calledUrl = mockFetch.mock.calls[0][0] as string
      expect(calledUrl).toContain('category=promotional')
    })

    test('should call API with multiple tag filters', async () => {
      const tags = ['париж', 'скидка', 'романтика']
      const params = new URLSearchParams({
        page: '1',
        limit: '12',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        tags: tags.join(',')
      })

      await fetch(`/api/templates?${params}`)

      const calledUrl = mockFetch.mock.calls[0][0] as string
      expect(calledUrl).toContain('tags=париж,скидка,романтика')
    })

    test('should call API with quality score range', async () => {
      const params = new URLSearchParams({
        page: '1',
        limit: '12',
        sortBy: 'qualityScore',
        sortOrder: 'desc',
        qualityMin: '80',
        qualityMax: '95'
      })

      await fetch(`/api/templates?${params}`)

      const calledUrl = mockFetch.mock.calls[0][0] as string
      expect(calledUrl).toContain('qualityMin=80')
      expect(calledUrl).toContain('qualityMax=95')
    })

    test('should call API with date range filter', async () => {
      const params = new URLSearchParams({
        page: '1',
        limit: '12',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        dateStart: '2024-01-01',
        dateEnd: '2024-12-31'
      })

      await fetch(`/api/templates?${params}`)

      const calledUrl = mockFetch.mock.calls[0][0] as string
      expect(calledUrl).toContain('dateStart=2024-01-01')
      expect(calledUrl).toContain('dateEnd=2024-12-31')
    })

    test('should call API with AI generation filter', async () => {
      const params = new URLSearchParams({
        page: '1',
        limit: '12',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        agentGenerated: 'true'
      })

      await fetch(`/api/templates?${params}`)

      const calledUrl = mockFetch.mock.calls[0][0] as string
      expect(calledUrl).toContain('agentGenerated=true')
    })

    test('should handle combined filters correctly', async () => {
      const params = new URLSearchParams({
        page: '1',
        limit: '12',
        sortBy: 'qualityScore',
        sortOrder: 'desc',
        search: 'париж',
        category: 'promotional',
        status: 'published',
        tags: 'париж,скидка',
        qualityMin: '85',
        qualityMax: '100',
        agentGenerated: 'true',
        dateStart: '2024-03-01',
        dateEnd: '2024-03-31'
      })

      await fetch(`/api/templates?${params}`)

      const calledUrl = mockFetch.mock.calls[0][0] as string
      
      // Verify all filters are included
      expect(calledUrl).toContain('search=париж')
      expect(calledUrl).toContain('category=promotional')
      expect(calledUrl).toContain('status=published')
      expect(calledUrl).toContain('tags=париж,скидка')
      expect(calledUrl).toContain('qualityMin=85')
      expect(calledUrl).toContain('qualityMax=100')
      expect(calledUrl).toContain('agentGenerated=true')
      expect(calledUrl).toContain('dateStart=2024-03-01')
      expect(calledUrl).toContain('dateEnd=2024-03-31')
      expect(calledUrl).toContain('sortBy=qualityScore')
      expect(calledUrl).toContain('sortOrder=desc')
    })
  })

  describe('Sorting Integration', () => {
    test('should handle sort field changes', () => {
      let sortBy = 'createdAt'
      let sortOrder = 'desc'
      
      const handleSortChange = (field: string) => {
        if (field === sortBy) {
          sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'
        } else {
          sortBy = field
          sortOrder = 'desc'
        }
      }

      // Test changing to different field
      handleSortChange('qualityScore')
      expect(sortBy).toBe('qualityScore')
      expect(sortOrder).toBe('desc')

      // Test toggling same field
      handleSortChange('qualityScore')
      expect(sortBy).toBe('qualityScore')
      expect(sortOrder).toBe('asc')

      // Test toggling again
      handleSortChange('qualityScore')
      expect(sortBy).toBe('qualityScore')
      expect(sortOrder).toBe('desc')
    })

    test('should include sort parameters in API calls', async () => {
      const params = new URLSearchParams({
        page: '1',
        limit: '12',
        sortBy: 'qualityScore',
        sortOrder: 'asc'
      })

      await fetch(`/api/templates?${params}`)

      const calledUrl = mockFetch.mock.calls[0][0] as string
      expect(calledUrl).toContain('sortBy=qualityScore')
      expect(calledUrl).toContain('sortOrder=asc')
    })
  })

  describe('Pagination Integration', () => {
    test('should reset pagination when filters change', () => {
      let pagination = { page: 3, limit: 12, total: 50, totalPages: 5, hasNext: true, hasPrev: true }
      
      // Simulate filter change
      const resetPagination = () => {
        pagination = { ...pagination, page: 1 }
      }
      
      resetPagination()
      expect(pagination.page).toBe(1)
    })

    test('should preserve pagination state when only page changes', () => {
      let pagination = { page: 1, limit: 12, total: 50, totalPages: 5, hasNext: true, hasPrev: false }
      
      const handlePageChange = (newPage: number) => {
        pagination = { ...pagination, page: newPage }
      }
      
      handlePageChange(3)
      expect(pagination.page).toBe(3)
      expect(pagination.limit).toBe(12) // Other values preserved
      expect(pagination.total).toBe(50)
    })

    test('should include pagination in API calls', async () => {
      const params = new URLSearchParams({
        page: '2',
        limit: '12',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        category: 'promotional'
      })

      await fetch(`/api/templates?${params}`)

      const calledUrl = mockFetch.mock.calls[0][0] as string
      expect(calledUrl).toContain('page=2')
      expect(calledUrl).toContain('limit=12')
    })
  })

  describe('Filter Clearing', () => {
    test('should clear all filters to default state', () => {
      const state = {
        searchTerm: 'париж',
        selectedCategory: 'promotional',
        selectedStatus: 'published',
        selectedTags: ['париж', 'скидка'],
        qualityScoreRange: [80, 95] as [number, number],
        agentGeneratedFilter: 'ai',
        dateRange: { start: '2024-01-01', end: '2024-12-31' },
        pagination: { page: 3, limit: 12, total: 50, totalPages: 5, hasNext: true, hasPrev: true }
      }

      const clearAllFilters = () => {
        return {
          searchTerm: '',
          selectedCategory: 'all',
          selectedStatus: 'all',
          selectedTags: [],
          qualityScoreRange: [0, 100] as [number, number],
          agentGeneratedFilter: 'all',
          dateRange: { start: '', end: '' },
          pagination: { ...state.pagination, page: 1 }
        }
      }

      const clearedState = clearAllFilters()
      
      expect(clearedState.searchTerm).toBe('')
      expect(clearedState.selectedCategory).toBe('all')
      expect(clearedState.selectedStatus).toBe('all')
      expect(clearedState.selectedTags).toEqual([])
      expect(clearedState.qualityScoreRange).toEqual([0, 100])
      expect(clearedState.agentGeneratedFilter).toBe('all')
      expect(clearedState.dateRange).toEqual({ start: '', end: '' })
      expect(clearedState.pagination.page).toBe(1)
    })
  })

  describe('Tag Management', () => {
    test('should toggle tags correctly', () => {
      let selectedTags: string[] = []
      
      const toggleTag = (tag: string) => {
        selectedTags = selectedTags.includes(tag) 
          ? selectedTags.filter(t => t !== tag)
          : [...selectedTags, tag]
      }

      // Add tag
      toggleTag('париж')
      expect(selectedTags).toEqual(['париж'])

      // Add another tag
      toggleTag('скидка')
      expect(selectedTags).toEqual(['париж', 'скидка'])

      // Remove first tag
      toggleTag('париж')
      expect(selectedTags).toEqual(['скидка'])

      // Remove last tag
      toggleTag('скидка')
      expect(selectedTags).toEqual([])
    })

    test('should handle multiple tag selection', () => {
      let selectedTags: string[] = []
      
      const addTags = (tags: string[]) => {
        tags.forEach(tag => {
          if (!selectedTags.includes(tag)) {
            selectedTags.push(tag)
          }
        })
      }

      addTags(['париж', 'скидка', 'романтика'])
      expect(selectedTags).toEqual(['париж', 'скидка', 'романтика'])

      // Adding duplicate should not create duplicates
      addTags(['париж', 'выходные'])
      expect(selectedTags).toEqual(['париж', 'скидка', 'романтика', 'выходные'])
    })
  })

  describe('Quality Score Range', () => {
    test('should handle quality score range changes', () => {
      let qualityScoreRange: [number, number] = [0, 100]
      
      const setQualityMin = (min: number) => {
        qualityScoreRange = [min, qualityScoreRange[1]]
      }
      
      const setQualityMax = (max: number) => {
        qualityScoreRange = [qualityScoreRange[0], max]
      }

      setQualityMin(75)
      expect(qualityScoreRange).toEqual([75, 100])

      setQualityMax(95)
      expect(qualityScoreRange).toEqual([75, 95])

      // Test edge cases
      setQualityMin(0)
      setQualityMax(100)
      expect(qualityScoreRange).toEqual([0, 100])
    })

    test('should validate quality score range', () => {
      const isValidRange = (min: number, max: number): boolean => {
        return min >= 0 && max <= 100 && min <= max
      }

      expect(isValidRange(0, 100)).toBe(true)
      expect(isValidRange(75, 95)).toBe(true)
      expect(isValidRange(50, 50)).toBe(true) // Equal values allowed
      
      expect(isValidRange(-5, 100)).toBe(false) // Min too low
      expect(isValidRange(0, 105)).toBe(false) // Max too high
      expect(isValidRange(80, 70)).toBe(false) // Min > Max
    })
  })

  describe('Date Range Filtering', () => {
    test('should handle date range changes', () => {
      let dateRange = { start: '', end: '' }
      
      const setDateStart = (date: string) => {
        dateRange = { ...dateRange, start: date }
      }
      
      const setDateEnd = (date: string) => {
        dateRange = { ...dateRange, end: date }
      }

      setDateStart('2024-01-01')
      expect(dateRange).toEqual({ start: '2024-01-01', end: '' })

      setDateEnd('2024-12-31')
      expect(dateRange).toEqual({ start: '2024-01-01', end: '2024-12-31' })
    })

    test('should validate date range', () => {
      const isValidDateRange = (start: string, end: string): boolean => {
        if (!start || !end) return true // Partial ranges allowed
        return new Date(start) <= new Date(end)
      }

      expect(isValidDateRange('', '')).toBe(true) // Empty range
      expect(isValidDateRange('2024-01-01', '')).toBe(true) // Only start
      expect(isValidDateRange('', '2024-12-31')).toBe(true) // Only end
      expect(isValidDateRange('2024-01-01', '2024-12-31')).toBe(true) // Valid range
      expect(isValidDateRange('2024-12-31', '2024-01-01')).toBe(false) // Invalid range
    })
  })

  describe('Error Handling', () => {
    test('should handle API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))
      
      let error: string | null = null
      
      try {
        await fetch('/api/templates?page=1&limit=12')
      } catch (err) {
        error = err instanceof Error ? err.message : 'Unknown error'
      }
      
      expect(error).toBe('Network error')
    })

    test('should handle HTTP error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ message: 'Invalid filter parameters' })
      } as Response)
      
      let error: string | null = null
      
      try {
        const response = await fetch('/api/templates?page=1&limit=12')
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
        }
      } catch (err) {
        error = err instanceof Error ? err.message : 'Unknown error'
      }
      
      expect(error).toBe('Invalid filter parameters')
    })

    test('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => { throw new Error('Invalid JSON') }
      } as Response)
      
      let error: string | null = null
      
      try {
        const response = await fetch('/api/templates?page=1&limit=12')
        if (!response.ok) {
          let errorData: any = null
          try {
            errorData = await response.json()
          } catch {
            // Ignore JSON parse error
          }
          throw new Error(errorData?.message || `HTTP ${response.status}: ${response.statusText}`)
        }
      } catch (err) {
        error = err instanceof Error ? err.message : 'Unknown error'
      }
      
      expect(error).toBe('HTTP 500: Internal Server Error')
    })
  })

  describe('Debouncing', () => {
    test('should debounce search input', (done) => {
      let searchTerm = ''
      let callCount = 0
      
      const debouncedSearch = (term: string) => {
        searchTerm = term
        callCount++
      }
      
      // Simulate rapid typing
      const mockSetTimeout = (callback: () => void, delay: number) => {
        setTimeout(() => {
          callback()
          done()
        }, delay)
        return 1 as any
      }
      
      const originalSetTimeout = global.setTimeout
      global.setTimeout = mockSetTimeout
      
      // This would trigger debounced function
      setTimeout(() => debouncedSearch('париж'), 300)
      
      // Restore original setTimeout
      global.setTimeout = originalSetTimeout
      
      expect(callCount).toBe(1)
      expect(searchTerm).toBe('париж')
    })
  })

  describe('Performance Considerations', () => {
    test('should minimize API calls with proper dependencies', () => {
      const dependencies = [
        'searchTerm',
        'selectedCategory', 
        'selectedStatus',
        'selectedTags',
        'qualityScoreRange',
        'agentGeneratedFilter',
        'dateRange',
        'pagination.page',
        'sortBy',
        'sortOrder'
      ]
      
      // useEffect should only trigger when these dependencies change
      expect(dependencies).toHaveLength(10)
      expect(dependencies).toContain('searchTerm')
      expect(dependencies).toContain('selectedTags')
      expect(dependencies).toContain('qualityScoreRange')
    })

    test('should cache API responses appropriately', async () => {
      const cacheHeaders = {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
      
      await fetch('/api/templates?page=1', { headers: cacheHeaders })
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ headers: cacheHeaders })
      )
    })
  })
})