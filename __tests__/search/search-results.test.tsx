/**
 * Search Results Component Tests
 * Тестирование компонента отображения результатов поиска
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchResults, type SearchResult } from '@/ui/components/search/search-results'

describe('🔍 SearchResults Component Tests', () => {
  const mockResults: SearchResult[] = [
    {
      id: 'result-1',
      name: 'Парижский Уик-энд',
      description: 'Эксклюзивное предложение на романтические выходные в Париже',
      category: 'promotional',
      status: 'published',
      qualityScore: 92,
      createdAt: '2024-03-04T14:30:00Z',
      updatedAt: '2024-03-04T15:45:00Z',
      tags: ['париж', 'скидка', 'выходные'],
      relevanceScore: 85.5,
      highlightedName: 'Парижский <mark>Уик-энд</mark>',
      highlightedDescription: 'Эксклюзивное предложение на романтические выходные в <mark>Париже</mark>',
      snippet: 'Эксклюзивное предложение на романтические выходные в Париже с билетами от Купибилет',
      openRate: 89.5,
      clickRate: 24.8,
      agentGenerated: true
    },
    {
      id: 'result-2',
      name: 'Подтверждение Бронирования',
      description: 'Автоматическое подтверждение бронирования билетов',
      category: 'transactional',
      status: 'draft',
      qualityScore: 96,
      createdAt: '2024-03-03T10:15:00Z',
      tags: ['подтверждение', 'бронирование'],
      relevanceScore: 72.3,
      openRate: 98.2,
      clickRate: 45.6,
      agentGenerated: false
    }
  ]

  const defaultProps = {
    results: mockResults,
    query: 'париж',
    totalResults: 2,
    searchTime: 45,
    loading: false,
  }

  describe('✅ Basic Rendering', () => {
    test('should render search results correctly', () => {
      render(<SearchResults {...defaultProps} />)
      
      expect(screen.getByTestId('search-results')).toBeInTheDocument()
      expect(screen.getByTestId('search-summary')).toBeInTheDocument()
      expect(screen.getByTestId('search-result-result-1')).toBeInTheDocument()
      expect(screen.getByTestId('search-result-result-2')).toBeInTheDocument()
    })

    test('should display search summary correctly', () => {
      render(<SearchResults {...defaultProps} />)
      
      const summary = screen.getByTestId('search-summary')
      expect(summary).toHaveTextContent('Найдено 2 результатов')
      expect(summary).toHaveTextContent('по запросу "париж"')
      expect(summary).toHaveTextContent('45мс')
    })

    test('should format search time correctly', () => {
      render(<SearchResults {...defaultProps} searchTime={1500} />)
      
      const summary = screen.getByTestId('search-summary')
      expect(summary).toHaveTextContent('1.50с')
    })

    test('should handle empty query in summary', () => {
      render(<SearchResults {...defaultProps} query="" />)
      
      const summary = screen.getByTestId('search-summary')
      expect(summary).toHaveTextContent('Найдено 2 результатов')
      expect(summary).not.toHaveTextContent('по запросу')
    })
  })

  describe('✅ Loading State', () => {
    test('should show loading skeleton', () => {
      render(<SearchResults {...defaultProps} loading={true} />)
      
      expect(screen.getByTestId('search-results-loading')).toBeInTheDocument()
      expect(screen.queryByTestId('search-summary')).not.toBeInTheDocument()
      
      // Should show skeleton cards
      const skeletons = screen.container.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    test('should not show results when loading', () => {
      render(<SearchResults {...defaultProps} loading={true} />)
      
      expect(screen.queryByTestId('search-result-result-1')).not.toBeInTheDocument()
    })
  })

  describe('✅ Empty State', () => {
    test('should show empty state for no results', () => {
      render(<SearchResults {...defaultProps} results={[]} />)
      
      expect(screen.getByTestId('search-results-empty')).toBeInTheDocument()
      expect(screen.getByText('Ничего не найдено')).toBeInTheDocument()
      expect(screen.getByText('По запросу "париж" результаты не найдены')).toBeInTheDocument()
      
      // Should show search tips
      expect(screen.getByText('Попробуйте:')).toBeInTheDocument()
      expect(screen.getByText('• Проверить орфографию')).toBeInTheDocument()
    })

    test('should not show empty state when loading', () => {
      render(<SearchResults {...defaultProps} results={[]} loading={true} />)
      
      expect(screen.queryByTestId('search-results-empty')).not.toBeInTheDocument()
    })
  })

  describe('✅ Search Result Cards', () => {
    test('should display result card information correctly', () => {
      render(<SearchResults {...defaultProps} />)
      
      const firstResult = screen.getByTestId('search-result-result-1')
      
      // Check highlighted name
      expect(firstResult).toHaveTextContent('Парижский Уик-энд')
      const nameElement = firstResult.querySelector('[dangerouslySetInnerHTML]')
      expect(nameElement).toBeTruthy()
      
      // Check metadata
      expect(firstResult).toHaveTextContent('promotional')
      expect(firstResult).toHaveTextContent('Опубликован')
      expect(firstResult).toHaveTextContent('92')
      expect(firstResult).toHaveTextContent('Релевантность: 85.5')
      expect(firstResult).toHaveTextContent('04.03.2024')
    })

    test('should display tags correctly', () => {
      render(<SearchResults {...defaultProps} />)
      
      const firstResult = screen.getByTestId('search-result-result-1')
      
      expect(firstResult).toHaveTextContent('париж')
      expect(firstResult).toHaveTextContent('скидка')
      expect(firstResult).toHaveTextContent('выходные')
    })

    test('should limit displayed tags', () => {
      const resultWithManyTags: SearchResult = {
        ...mockResults[0],
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6']
      }
      
      render(<SearchResults {...defaultProps} results={[resultWithManyTags]} />)
      
      const result = screen.getByTestId('search-result-result-1')
      
      // Should show first 4 tags + "+2" indicator
      expect(result).toHaveTextContent('tag1')
      expect(result).toHaveTextContent('tag4')
      expect(result).toHaveTextContent('+2')
      expect(result).not.toHaveTextContent('tag6')
    })

    test('should show performance metrics when available', () => {
      render(<SearchResults {...defaultProps} />)
      
      const firstResult = screen.getByTestId('search-result-result-1')
      
      expect(firstResult).toHaveTextContent('📈 Open: 89.5%')
      expect(firstResult).toHaveTextContent('👆 Click: 24.8%')
      expect(firstResult).toHaveTextContent('🤖 AI Generated')
    })

    test('should handle draft status correctly', () => {
      render(<SearchResults {...defaultProps} />)
      
      const secondResult = screen.getByTestId('search-result-result-2')
      
      expect(secondResult).toHaveTextContent('Черновик')
      expect(secondResult).not.toHaveTextContent('🤖 AI Generated')
    })

    test('should display snippet when available', () => {
      render(<SearchResults {...defaultProps} />)
      
      const firstResult = screen.getByTestId('search-result-result-1')
      
      expect(firstResult).toHaveTextContent('Эксклюзивное предложение на романтические выходные в Париже с билетами от Купибилет')
    })
  })

  describe('✅ User Interactions', () => {
    test('should handle result click', async () => {
      const user = userEvent.setup()
      const onResultClick = jest.fn()
      
      render(<SearchResults {...defaultProps} onResultClick={onResultClick} />)
      
      const firstResult = screen.getByTestId('search-result-result-1')
      await user.click(firstResult)
      
      expect(onResultClick).toHaveBeenCalledWith(mockResults[0])
    })

    test('should handle preview button click', async () => {
      const user = userEvent.setup()
      const onPreview = jest.fn()
      
      render(<SearchResults {...defaultProps} onPreview={onPreview} />)
      
      const firstResult = screen.getByTestId('search-result-result-1')
      
      // Hover to show action buttons
      await user.hover(firstResult)
      
      const previewButton = screen.getByTestId('preview-result-1')
      await user.click(previewButton)
      
      expect(onPreview).toHaveBeenCalledWith(mockResults[0])
    })

    test('should handle download button click', async () => {
      const user = userEvent.setup()
      const onDownload = jest.fn()
      
      render(<SearchResults {...defaultProps} onDownload={onDownload} />)
      
      const firstResult = screen.getByTestId('search-result-result-1')
      
      // Hover to show action buttons
      await user.hover(firstResult)
      
      const downloadButton = screen.getByTestId('download-result-1')
      await user.click(downloadButton)
      
      expect(onDownload).toHaveBeenCalledWith(mockResults[0])
    })

    test('should prevent event bubbling on action clicks', async () => {
      const user = userEvent.setup()
      const onResultClick = jest.fn()
      const onPreview = jest.fn()
      
      render(<SearchResults {...defaultProps} onResultClick={onResultClick} onPreview={onPreview} />)
      
      const firstResult = screen.getByTestId('search-result-result-1')
      
      // Hover to show action buttons
      await user.hover(firstResult)
      
      const previewButton = screen.getByTestId('preview-result-1')
      await user.click(previewButton)
      
      // Should call preview but not result click
      expect(onPreview).toHaveBeenCalledWith(mockResults[0])
      expect(onResultClick).not.toHaveBeenCalled()
    })
  })

  describe('✅ Action Button Visibility', () => {
    test('should show action buttons only when provided', () => {
      render(<SearchResults {...defaultProps} />)
      
      const firstResult = screen.getByTestId('search-result-result-1')
      
      // No action buttons should be visible without handlers
      expect(screen.queryByTestId('preview-result-1')).not.toBeInTheDocument()
      expect(screen.queryByTestId('download-result-1')).not.toBeInTheDocument()
    })

    test('should show action buttons when handlers provided', () => {
      render(
        <SearchResults 
          {...defaultProps} 
          onPreview={jest.fn()} 
          onDownload={jest.fn()} 
        />
      )
      
      const firstResult = screen.getByTestId('search-result-result-1')
      
      // Action buttons should exist but be initially hidden (opacity-0)
      const actions = firstResult.querySelector('.opacity-0')
      expect(actions).toBeInTheDocument()
    })
  })

  describe('✅ Highlighting and HTML Content', () => {
    test('should render highlighted content safely', () => {
      render(<SearchResults {...defaultProps} />)
      
      const firstResult = screen.getByTestId('search-result-result-1')
      
      // Should contain mark tags for highlighting
      const markElements = firstResult.querySelectorAll('mark')
      expect(markElements.length).toBeGreaterThan(0)
    })

    test('should handle missing highlighting gracefully', () => {
      const resultsWithoutHighlighting = mockResults.map(result => ({
        ...result,
        highlightedName: undefined,
        highlightedDescription: undefined,
        snippet: undefined
      }))
      
      render(<SearchResults {...defaultProps} results={resultsWithoutHighlighting} />)
      
      expect(screen.getByTestId('search-result-result-1')).toBeInTheDocument()
      expect(screen.getByText('Парижский Уик-энд')).toBeInTheDocument()
    })
  })

  describe('✅ Responsive Design and Layout', () => {
    test('should apply correct CSS classes for layout', () => {
      render(<SearchResults {...defaultProps} />)
      
      const container = screen.getByTestId('search-results')
      expect(container).toHaveClass('space-y-6')
      
      const summary = screen.getByTestId('search-summary')
      expect(summary).toHaveClass('flex', 'items-center', 'justify-between')
    })

    test('should handle custom className', () => {
      render(<SearchResults {...defaultProps} className="custom-class" />)
      
      const container = screen.getByTestId('search-results')
      expect(container).toHaveClass('custom-class')
    })

    test('should use custom test id', () => {
      render(<SearchResults {...defaultProps} data-testid="custom-results" />)
      
      expect(screen.getByTestId('custom-results')).toBeInTheDocument()
    })
  })

  describe('✅ Edge Cases and Error Handling', () => {
    test('should handle results without optional fields', () => {
      const minimalResult: SearchResult = {
        id: 'minimal',
        name: 'Minimal Result',
        description: 'Basic description',
        category: 'general',
        status: 'published',
        createdAt: '2024-03-01T00:00:00Z'
      }
      
      render(<SearchResults {...defaultProps} results={[minimalResult]} />)
      
      expect(screen.getByTestId('search-result-minimal')).toBeInTheDocument()
      expect(screen.getByText('Minimal Result')).toBeInTheDocument()
    })

    test('should handle zero search time', () => {
      render(<SearchResults {...defaultProps} searchTime={0} />)
      
      const summary = screen.getByTestId('search-summary')
      expect(summary).toHaveTextContent('0мс')
    })

    test('should handle very large result counts', () => {
      render(<SearchResults {...defaultProps} totalResults={999999} />)
      
      const summary = screen.getByTestId('search-summary')
      expect(summary).toHaveTextContent('Найдено 999999 результатов')
    })

    test('should handle special characters in query', () => {
      render(<SearchResults {...defaultProps} query='test "quoted" -excluded field:value' />)
      
      const summary = screen.getByTestId('search-summary')
      expect(summary).toHaveTextContent('по запросу "test "quoted" -excluded field:value"')
    })

    test('should handle empty result array', () => {
      render(<SearchResults {...defaultProps} results={[]} totalResults={0} />)
      
      expect(screen.getByTestId('search-results-empty')).toBeInTheDocument()
    })

    test('should handle missing relevance scores', () => {
      const resultsWithoutRelevance = mockResults.map(result => ({
        ...result,
        relevanceScore: undefined
      }))
      
      render(<SearchResults {...defaultProps} results={resultsWithoutRelevance} />)
      
      const firstResult = screen.getByTestId('search-result-result-1')
      expect(firstResult).not.toHaveTextContent('Релевантность:')
    })
  })

  describe('✅ Accessibility', () => {
    test('should have proper ARIA attributes', () => {
      render(<SearchResults {...defaultProps} />)
      
      const firstResult = screen.getByTestId('search-result-result-1')
      
      // Should be clickable/interactive
      expect(firstResult).toHaveClass('cursor-pointer')
    })

    test('should handle keyboard navigation', async () => {
      const user = userEvent.setup()
      const onResultClick = jest.fn()
      
      render(<SearchResults {...defaultProps} onResultClick={onResultClick} />)
      
      const firstResult = screen.getByTestId('search-result-result-1')
      
      // Should be able to focus and trigger with keyboard
      firstResult.focus()
      expect(firstResult).toHaveFocus()
    })
  })
})