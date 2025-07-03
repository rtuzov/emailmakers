/**
 * Phase 2.3.3 UI Filtering System Tests
 * Tests the UI components and user interactions for the filtering system
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { jest } from '@jest/globals'
import { TemplatesPage } from '@/ui/components/pages/templates-page'

// Mock the fetch function
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>

const mockSuccessResponse = {
  success: true,
  data: {
    templates: [
      {
        id: 'test-1',
        name: 'Test Template 1',
        category: 'promotional',
        description: 'Test description',
        createdAt: '2024-03-01T10:00:00Z',
        status: 'published',
        qualityScore: 85,
        agentGenerated: true,
        tags: ['париж', 'скидка']
      },
      {
        id: 'test-2',
        name: 'Test Template 2',
        category: 'transactional',
        description: 'Another test description',
        createdAt: '2024-03-02T10:00:00Z',
        status: 'draft',
        qualityScore: 92,
        agentGenerated: false,
        tags: ['подтверждение']
      }
    ],
    pagination: {
      total: 2,
      page: 1,
      limit: 12,
      totalPages: 1,
      hasNext: false,
      hasPrev: false
    },
    filters: {
      categories: [
        { value: 'all', label: 'All Templates', count: 2 },
        { value: 'promotional', label: 'Promotional', count: 1 },
        { value: 'transactional', label: 'Transactional', count: 1 }
      ],
      tags: ['париж', 'скидка', 'подтверждение']
    }
  },
  metadata: {
    query_time: 45,
    cache_status: 'database'
  }
}

describe('Templates Filtering UI - Phase 2.3.3', () => {
  beforeEach(() => {
    ;(global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      json: async () => mockSuccessResponse
    } as Response)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Search Input', () => {
    test('should render search input with correct placeholder', async () => {
      render(<TemplatesPage />)
      
      await waitFor(() => {
        const searchInput = screen.getByTestId('search-input')
        expect(searchInput).toBeInTheDocument()
        expect(searchInput).toHaveAttribute('placeholder', 'Search templates...')
      })
    })

    test('should update search term when typing', async () => {
      const user = userEvent.setup()
      render(<TemplatesPage />)
      
      await waitFor(() => {
        const searchInput = screen.getByTestId('search-input')
        expect(searchInput).toBeInTheDocument()
      })

      const searchInput = screen.getByTestId('search-input')
      await user.type(searchInput, 'париж')
      
      expect(searchInput).toHaveValue('париж')
    })

    test('should trigger API call with search parameter', async () => {
      const user = userEvent.setup()
      render(<TemplatesPage />)
      
      await waitFor(() => {
        const searchInput = screen.getByTestId('search-input')
        expect(searchInput).toBeInTheDocument()
      })

      const searchInput = screen.getByTestId('search-input')
      await user.type(searchInput, 'париж')
      
      // Wait for debounced search
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('search=париж'),
          expect.any(Object)
        )
      }, { timeout: 1000 })
    })
  })

  describe('Category Filters', () => {
    test('should render category filter buttons', async () => {
      render(<TemplatesPage />)
      
      await waitFor(() => {
        expect(screen.getByTestId('category-filter-all')).toBeInTheDocument()
        expect(screen.getByTestId('category-filter-promotional')).toBeInTheDocument()
        expect(screen.getByTestId('category-filter-transactional')).toBeInTheDocument()
      })
    })

    test('should show active category filter', async () => {
      const user = userEvent.setup()
      render(<TemplatesPage />)
      
      await waitFor(() => {
        expect(screen.getByTestId('category-filter-promotional')).toBeInTheDocument()
      })

      const promotionalFilter = screen.getByTestId('category-filter-promotional')
      await user.click(promotionalFilter)
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('category=promotional'),
          expect.any(Object)
        )
      })
    })

    test('should display category counts', async () => {
      render(<TemplatesPage />)
      
      await waitFor(() => {
        const promotionalFilter = screen.getByTestId('category-filter-promotional')
        expect(promotionalFilter).toHaveTextContent('(1)')
      })
    })
  })

  describe('Advanced Filters Toggle', () => {
    test('should render advanced filters toggle button', async () => {
      render(<TemplatesPage />)
      
      await waitFor(() => {
        expect(screen.getByTestId('advanced-filters-toggle')).toBeInTheDocument()
      })
    })

    test('should show/hide advanced filters panel', async () => {
      const user = userEvent.setup()
      render(<TemplatesPage />)
      
      await waitFor(() => {
        expect(screen.getByTestId('advanced-filters-toggle')).toBeInTheDocument()
      })

      // Initially hidden
      expect(screen.queryByTestId('advanced-filters-panel')).not.toBeInTheDocument()
      
      // Click to show
      const toggleButton = screen.getByTestId('advanced-filters-toggle')
      await user.click(toggleButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('advanced-filters-panel')).toBeInTheDocument()
      })
    })

    test('should show filter count badge when filters are active', async () => {
      const user = userEvent.setup()
      render(<TemplatesPage />)
      
      await waitFor(() => {
        const searchInput = screen.getByTestId('search-input')
        expect(searchInput).toBeInTheDocument()
      })

      // Apply a search filter
      const searchInput = screen.getByTestId('search-input')
      await user.type(searchInput, 'test')
      
      await waitFor(() => {
        const toggleButton = screen.getByTestId('advanced-filters-toggle')
        expect(toggleButton).toHaveTextContent('1') // Filter count badge
      })
    })
  })

  describe('Advanced Filters Panel', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      render(<TemplatesPage />)
      
      await waitFor(() => {
        expect(screen.getByTestId('advanced-filters-toggle')).toBeInTheDocument()
      })

      // Open advanced filters
      const toggleButton = screen.getByTestId('advanced-filters-toggle')
      await user.click(toggleButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('advanced-filters-panel')).toBeInTheDocument()
      })
    })

    test('should render status filter buttons', async () => {
      expect(screen.getByTestId('status-filter-all')).toBeInTheDocument()
      expect(screen.getByTestId('status-filter-published')).toBeInTheDocument()
      expect(screen.getByTestId('status-filter-draft')).toBeInTheDocument()
    })

    test('should render tag filter buttons', async () => {
      await waitFor(() => {
        expect(screen.getByTestId('tag-filter-париж')).toBeInTheDocument()
        expect(screen.getByTestId('tag-filter-скидка')).toBeInTheDocument()
        expect(screen.getByTestId('tag-filter-подтверждение')).toBeInTheDocument()
      })
    })

    test('should render quality score range sliders', async () => {
      expect(screen.getByTestId('quality-min-range')).toBeInTheDocument()
      expect(screen.getByTestId('quality-max-range')).toBeInTheDocument()
    })

    test('should render generation type filters', async () => {
      expect(screen.getByTestId('generation-filter-all')).toBeInTheDocument()
      expect(screen.getByTestId('generation-filter-ai')).toBeInTheDocument()
      expect(screen.getByTestId('generation-filter-manual')).toBeInTheDocument()
    })

    test('should render date range inputs', async () => {
      expect(screen.getByTestId('date-start-input')).toBeInTheDocument()
      expect(screen.getByTestId('date-end-input')).toBeInTheDocument()
    })
  })

  describe('Filter Interactions', () => {
    test('should handle status filter selection', async () => {
      const user = userEvent.setup()
      render(<TemplatesPage />)
      
      // Open advanced filters
      await waitFor(() => {
        expect(screen.getByTestId('advanced-filters-toggle')).toBeInTheDocument()
      })
      const toggleButton = screen.getByTestId('advanced-filters-toggle')
      await user.click(toggleButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('status-filter-published')).toBeInTheDocument()
      })

      const publishedFilter = screen.getByTestId('status-filter-published')
      await user.click(publishedFilter)
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('status=published'),
          expect.any(Object)
        )
      })
    })

    test('should handle tag filter selection', async () => {
      const user = userEvent.setup()
      render(<TemplatesPage />)
      
      // Open advanced filters
      await waitFor(() => {
        expect(screen.getByTestId('advanced-filters-toggle')).toBeInTheDocument()
      })
      const toggleButton = screen.getByTestId('advanced-filters-toggle')
      await user.click(toggleButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('tag-filter-париж')).toBeInTheDocument()
      })

      const tagFilter = screen.getByTestId('tag-filter-париж')
      await user.click(tagFilter)
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('tags=париж'),
          expect.any(Object)
        )
      })
    })

    test('should handle multiple tag selection', async () => {
      const user = userEvent.setup()
      render(<TemplatesPage />)
      
      // Open advanced filters
      await waitFor(() => {
        expect(screen.getByTestId('advanced-filters-toggle')).toBeInTheDocument()
      })
      const toggleButton = screen.getByTestId('advanced-filters-toggle')
      await user.click(toggleButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('tag-filter-париж')).toBeInTheDocument()
        expect(screen.getByTestId('tag-filter-скидка')).toBeInTheDocument()
      })

      // Select first tag
      const firstTag = screen.getByTestId('tag-filter-париж')
      await user.click(firstTag)
      
      // Select second tag
      const secondTag = screen.getByTestId('tag-filter-скидка')
      await user.click(secondTag)
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenLastCalledWith(
          expect.stringContaining('tags=париж,скидка'),
          expect.any(Object)
        )
      })
    })

    test('should handle quality score range changes', async () => {
      const user = userEvent.setup()
      render(<TemplatesPage />)
      
      // Open advanced filters
      await waitFor(() => {
        expect(screen.getByTestId('advanced-filters-toggle')).toBeInTheDocument()
      })
      const toggleButton = screen.getByTestId('advanced-filters-toggle')
      await user.click(toggleButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('quality-min-range')).toBeInTheDocument()
      })

      const minSlider = screen.getByTestId('quality-min-range')
      fireEvent.change(minSlider, { target: { value: '80' } })
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('qualityMin=80'),
          expect.any(Object)
        )
      })
    })

    test('should handle generation type filter', async () => {
      const user = userEvent.setup()
      render(<TemplatesPage />)
      
      // Open advanced filters
      await waitFor(() => {
        expect(screen.getByTestId('advanced-filters-toggle')).toBeInTheDocument()
      })
      const toggleButton = screen.getByTestId('advanced-filters-toggle')
      await user.click(toggleButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('generation-filter-ai')).toBeInTheDocument()
      })

      const aiFilter = screen.getByTestId('generation-filter-ai')
      await user.click(aiFilter)
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('agentGenerated=true'),
          expect.any(Object)
        )
      })
    })

    test('should handle date range inputs', async () => {
      const user = userEvent.setup()
      render(<TemplatesPage />)
      
      // Open advanced filters
      await waitFor(() => {
        expect(screen.getByTestId('advanced-filters-toggle')).toBeInTheDocument()
      })
      const toggleButton = screen.getByTestId('advanced-filters-toggle')
      await user.click(toggleButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('date-start-input')).toBeInTheDocument()
      })

      const startDateInput = screen.getByTestId('date-start-input')
      await user.type(startDateInput, '2024-01-01')
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('dateStart=2024-01-01'),
          expect.any(Object)
        )
      })
    })
  })

  describe('Clear Filters', () => {
    test('should show clear filters button when filters are active', async () => {
      const user = userEvent.setup()
      render(<TemplatesPage />)
      
      await waitFor(() => {
        const searchInput = screen.getByTestId('search-input')
        expect(searchInput).toBeInTheDocument()
      })

      // Apply a filter
      const searchInput = screen.getByTestId('search-input')
      await user.type(searchInput, 'test')
      
      await waitFor(() => {
        expect(screen.getByTestId('clear-filters')).toBeInTheDocument()
      })
    })

    test('should clear all filters when clicked', async () => {
      const user = userEvent.setup()
      render(<TemplatesPage />)
      
      // Apply multiple filters
      await waitFor(() => {
        const searchInput = screen.getByTestId('search-input')
        expect(searchInput).toBeInTheDocument()
      })

      const searchInput = screen.getByTestId('search-input')
      await user.type(searchInput, 'test')
      
      const promotionalFilter = screen.getByTestId('category-filter-promotional')
      await user.click(promotionalFilter)
      
      await waitFor(() => {
        expect(screen.getByTestId('clear-filters')).toBeInTheDocument()
      })

      // Clear filters
      const clearButton = screen.getByTestId('clear-filters')
      await user.click(clearButton)
      
      // Check that filters are cleared
      expect(searchInput).toHaveValue('')
      
      // Should make API call without filters
      await waitFor(() => {
        const lastCall = (global.fetch as jest.MockedFunction<typeof fetch>).mock.calls.slice(-1)[0]
        const url = lastCall[0] as string
        expect(url).not.toContain('search=')
        expect(url).not.toContain('category=promotional')
      })
    })
  })

  describe('Filter Count Badge', () => {
    test('should show correct filter count in badge', async () => {
      const user = userEvent.setup()
      render(<TemplatesPage />)
      
      await waitFor(() => {
        const searchInput = screen.getByTestId('search-input')
        expect(searchInput).toBeInTheDocument()
      })

      // Apply search filter
      const searchInput = screen.getByTestId('search-input')
      await user.type(searchInput, 'test')
      
      // Apply category filter
      const promotionalFilter = screen.getByTestId('category-filter-promotional')
      await user.click(promotionalFilter)
      
      await waitFor(() => {
        const toggleButton = screen.getByTestId('advanced-filters-toggle')
        expect(toggleButton).toHaveTextContent('2') // Should show count of 2
      })
    })

    test('should hide badge when no filters are active', async () => {
      render(<TemplatesPage />)
      
      await waitFor(() => {
        const toggleButton = screen.getByTestId('advanced-filters-toggle')
        expect(toggleButton).not.toHaveTextContent(/\d/) // No numbers in badge
      })
    })
  })

  describe('Loading States', () => {
    test('should show loading spinner while fetching', async () => {
      // Mock a delayed response
      ;(global.fetch as jest.MockedFunction<typeof fetch>).mockImplementation(
        () => new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: async () => mockSuccessResponse
          } as Response), 100)
        )
      )

      render(<TemplatesPage />)
      
      // Should show loading initially
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
      expect(screen.getByText('Loading templates...')).toBeInTheDocument()
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
      }, { timeout: 1000 })
    })
  })

  describe('Error States', () => {
    test('should show error message when API fails', async () => {
      ;(global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(
        new Error('Network error')
      )

      render(<TemplatesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Failed to Load Templates')).toBeInTheDocument()
        expect(screen.getByText('Network error')).toBeInTheDocument()
        expect(screen.getByText('Retry')).toBeInTheDocument()
      })
    })

    test('should retry when retry button is clicked', async () => {
      const user = userEvent.setup()
      
      // First call fails
      ;(global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error('Network error')
      )
      
      // Second call succeeds
      ;(global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: async () => mockSuccessResponse
      } as Response)

      render(<TemplatesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument()
      })

      const retryButton = screen.getByText('Retry')
      await user.click(retryButton)
      
      await waitFor(() => {
        expect(screen.queryByText('Failed to Load Templates')).not.toBeInTheDocument()
        expect(screen.getByText('Test Template 1')).toBeInTheDocument()
      })
    })
  })

  describe('Empty States', () => {
    test('should show empty state when no templates found', async () => {
      ;(global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: async () => ({
          ...mockSuccessResponse,
          data: {
            ...mockSuccessResponse.data,
            templates: [],
            pagination: {
              ...mockSuccessResponse.data.pagination,
              total: 0
            }
          }
        })
      } as Response)

      render(<TemplatesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('No Templates Found')).toBeInTheDocument()
        expect(screen.getByText('Create Your First Template')).toBeInTheDocument()
      })
    })

    test('should show search empty state when search yields no results', async () => {
      const user = userEvent.setup()
      
      // First load with results
      render(<TemplatesPage />)
      
      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument()
      })

      // Mock empty results for search
      ;(global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: async () => ({
          ...mockSuccessResponse,
          data: {
            ...mockSuccessResponse.data,
            templates: []
          }
        })
      } as Response)

      // Perform search
      const searchInput = screen.getByTestId('search-input')
      await user.type(searchInput, 'nonexistent')
      
      await waitFor(() => {
        expect(screen.getByText('No templates found')).toBeInTheDocument()
        expect(screen.getByText('Try adjusting your search terms or filters')).toBeInTheDocument()
      })
    })
  })
})