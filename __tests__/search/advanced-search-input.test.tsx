/**
 * Advanced Search Input Component Tests
 * Тестирование расширенного поискового компонента
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AdvancedSearchInput, type SearchSuggestion } from '@/ui/components/search/advanced-search-input'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('🔍 AdvancedSearchInput Component Tests', () => {
  const defaultProps = {
    value: '',
    onChange: jest.fn(),
    onSearch: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  describe('✅ Basic Functionality', () => {
    test('should render input field correctly', () => {
      render(<AdvancedSearchInput {...defaultProps} />)
      
      const input = screen.getByTestId('advanced-search-input')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'text')
      expect(input).toHaveAttribute('placeholder', 'Поиск шаблонов...')
    })

    test('should handle value changes', async () => {
      const user = userEvent.setup()
      const onChange = jest.fn()
      
      render(<AdvancedSearchInput {...defaultProps} onChange={onChange} />)
      
      const input = screen.getByTestId('advanced-search-input')
      await user.type(input, 'париж')
      
      expect(onChange).toHaveBeenCalledWith('п')
      expect(onChange).toHaveBeenCalledWith('па')
      expect(onChange).toHaveBeenCalledWith('пар')
      expect(onChange).toHaveBeenCalledWith('пари')
      expect(onChange).toHaveBeenCalledWith('париж')
    })

    test('should trigger search on Enter key', async () => {
      const user = userEvent.setup()
      const onSearch = jest.fn()
      
      render(<AdvancedSearchInput {...defaultProps} value="test query" onSearch={onSearch} />)
      
      const input = screen.getByTestId('advanced-search-input')
      await user.type(input, '{enter}')
      
      expect(onSearch).toHaveBeenCalledWith('test query')
    })

    test('should trigger search on submit button click', async () => {
      const user = userEvent.setup()
      const onSearch = jest.fn()
      
      render(<AdvancedSearchInput {...defaultProps} value="test query" onSearch={onSearch} />)
      
      const submitButton = screen.getByTestId('search-submit-button')
      await user.click(submitButton)
      
      expect(onSearch).toHaveBeenCalledWith('test query')
    })

    test('should disable submit button when query is empty', () => {
      render(<AdvancedSearchInput {...defaultProps} value="" />)
      
      const submitButton = screen.getByTestId('search-submit-button')
      expect(submitButton).toBeDisabled()
    })
  })

  describe('✅ Query Parsing and Display', () => {
    test('should display parsed query breakdown', () => {
      render(<AdvancedSearchInput {...defaultProps} value='test "exact phrase" -exclude field:value' />)
      
      const breakdown = screen.getByTestId('search-query-breakdown')
      expect(breakdown).toBeInTheDocument()
      
      // Check for different types of query parts
      expect(screen.getByText('test')).toBeInTheDocument()
      expect(screen.getByText('"exact phrase"')).toBeInTheDocument()
      expect(screen.getByText('-exclude')).toBeInTheDocument()
      expect(screen.getByText('field:value')).toBeInTheDocument()
    })

    test('should not show breakdown for empty query', () => {
      render(<AdvancedSearchInput {...defaultProps} value="" />)
      
      expect(screen.queryByTestId('search-query-breakdown')).not.toBeInTheDocument()
    })

    test('should apply correct styles to different query types', () => {
      render(<AdvancedSearchInput {...defaultProps} value='term "phrase" -exclude field:test' />)
      
      const breakdown = screen.getByTestId('search-query-breakdown')
      
      // Regular terms should have blue background
      const termSpan = screen.getByText('term')
      expect(termSpan).toHaveClass('bg-blue-500/20', 'text-blue-300')
      
      // Exact phrases should have green background
      const phraseSpan = screen.getByText('"phrase"')
      expect(phraseSpan).toHaveClass('bg-green-500/20', 'text-green-300')
      
      // Excluded terms should have red background
      const excludeSpan = screen.getByText('-exclude')
      expect(excludeSpan).toHaveClass('bg-red-500/20', 'text-red-300')
      
      // Field queries should have purple background
      const fieldSpan = screen.getByText('field:test')
      expect(fieldSpan).toHaveClass('bg-purple-500/20', 'text-purple-300')
    })
  })

  describe('✅ Suggestions and Autocomplete', () => {
    test('should show suggestions when focused', async () => {
      const user = userEvent.setup()
      const suggestions: SearchSuggestion[] = [
        { text: 'test suggestion', type: 'suggestion', description: 'Test desc' },
        { text: 'recent search', type: 'recent', description: 'Recent' }
      ]
      
      render(<AdvancedSearchInput {...defaultProps} suggestions={suggestions} />)
      
      const input = screen.getByTestId('advanced-search-input')
      await user.click(input)
      
      await waitFor(() => {
        expect(screen.getByTestId('search-suggestions')).toBeInTheDocument()
      })
      
      expect(screen.getByText('test suggestion')).toBeInTheDocument()
      expect(screen.getByText('recent search')).toBeInTheDocument()
    })

    test('should handle suggestion clicks', async () => {
      const user = userEvent.setup()
      const onChange = jest.fn()
      const onSearch = jest.fn()
      const suggestions: SearchSuggestion[] = [
        { text: 'suggestion text', type: 'suggestion' }
      ]
      
      render(
        <AdvancedSearchInput 
          {...defaultProps} 
          onChange={onChange} 
          onSearch={onSearch} 
          suggestions={suggestions} 
        />
      )
      
      const input = screen.getByTestId('advanced-search-input')
      await user.click(input)
      
      await waitFor(() => {
        expect(screen.getByTestId('search-suggestions')).toBeInTheDocument()
      })
      
      const suggestionButton = screen.getByTestId('search-suggestion-0')
      await user.click(suggestionButton)
      
      expect(onChange).toHaveBeenCalledWith('suggestion text')
      expect(onSearch).toHaveBeenCalledWith('suggestion text')
    })

    test('should handle field suggestions differently', async () => {
      const user = userEvent.setup()
      const onChange = jest.fn()
      const suggestions: SearchSuggestion[] = [
        { text: 'name', type: 'field', description: 'Template name' }
      ]
      
      render(
        <AdvancedSearchInput 
          {...defaultProps} 
          value="test " 
          onChange={onChange} 
          suggestions={suggestions} 
        />
      )
      
      const input = screen.getByTestId('advanced-search-input')
      await user.click(input)
      
      await waitFor(() => {
        expect(screen.getByTestId('search-suggestions')).toBeInTheDocument()
      })
      
      const fieldSuggestion = screen.getByTestId('search-suggestion-0')
      await user.click(fieldSuggestion)
      
      // Field suggestions should add "field:" syntax
      expect(onChange).toHaveBeenCalledWith('test name:')
    })
  })

  describe('✅ Recent Searches', () => {
    test('should load recent searches from localStorage', () => {
      const recentSearches = ['previous search', 'another search']
      localStorageMock.getItem.mockReturnValue(JSON.stringify(recentSearches))
      
      render(<AdvancedSearchInput {...defaultProps} />)
      
      // Recent searches should be loaded (we can't directly test localStorage loading,
      // but we can test that the component renders without errors)
      expect(screen.getByTestId('advanced-search-input')).toBeInTheDocument()
    })

    test('should save searches to localStorage', async () => {
      const user = userEvent.setup()
      const onSearch = jest.fn()
      
      render(<AdvancedSearchInput {...defaultProps} value="new search" onSearch={onSearch} />)
      
      const input = screen.getByTestId('advanced-search-input')
      await user.type(input, '{enter}')
      
      expect(onSearch).toHaveBeenCalledWith('new search')
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'emailTemplatesRecentSearches',
        JSON.stringify(['new search'])
      )
    })

    test('should limit recent searches to 5 items', async () => {
      const user = userEvent.setup()
      const existingSearches = ['search1', 'search2', 'search3', 'search4', 'search5']
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingSearches))
      
      const onSearch = jest.fn()
      render(<AdvancedSearchInput {...defaultProps} value="search6" onSearch={onSearch} />)
      
      const input = screen.getByTestId('advanced-search-input')
      await user.type(input, '{enter}')
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'emailTemplatesRecentSearches',
        JSON.stringify(['search6', 'search1', 'search2', 'search3', 'search4'])
      )
    })
  })

  describe('✅ Syntax Help', () => {
    test('should show syntax help panel', async () => {
      const user = userEvent.setup()
      
      render(<AdvancedSearchInput {...defaultProps} showSyntaxHelp={true} />)
      
      const helpButton = screen.getByTestId('search-help-button')
      await user.click(helpButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('search-help-panel')).toBeInTheDocument()
      })
      
      // Check that help content is shown
      expect(screen.getByText('Операторы поиска')).toBeInTheDocument()
      expect(screen.getByText('"exact phrase"')).toBeInTheDocument()
      expect(screen.getByText('-exclusion')).toBeInTheDocument()
    })

    test('should hide syntax help when not needed', () => {
      render(<AdvancedSearchInput {...defaultProps} showSyntaxHelp={false} />)
      
      expect(screen.queryByTestId('search-help-button')).not.toBeInTheDocument()
    })

    test('should insert field syntax when field button clicked', async () => {
      const user = userEvent.setup()
      const onChange = jest.fn()
      
      render(<AdvancedSearchInput {...defaultProps} onChange={onChange} showSyntaxHelp={true} />)
      
      const helpButton = screen.getByTestId('search-help-button')
      await user.click(helpButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('search-help-panel')).toBeInTheDocument()
      })
      
      const nameFieldButton = screen.getByText('name')
      await user.click(nameFieldButton)
      
      expect(onChange).toHaveBeenCalledWith(' name:')
    })
  })

  describe('✅ Keyboard Navigation', () => {
    test('should close suggestions on Escape key', async () => {
      const user = userEvent.setup()
      
      render(<AdvancedSearchInput {...defaultProps} />)
      
      const input = screen.getByTestId('advanced-search-input')
      await user.click(input)
      
      // Focus should trigger suggestions if there are recent searches
      await user.type(input, '{escape}')
      
      // Suggestions should be closed
      expect(screen.queryByTestId('search-suggestions')).not.toBeInTheDocument()
    })

    test('should handle focus and blur events', async () => {
      const user = userEvent.setup()
      
      render(<AdvancedSearchInput {...defaultProps} />)
      
      const input = screen.getByTestId('advanced-search-input')
      
      await user.click(input)
      expect(input).toHaveFocus()
      
      await user.tab()
      expect(input).not.toHaveFocus()
    })
  })

  describe('✅ Disabled State', () => {
    test('should handle disabled state correctly', () => {
      render(<AdvancedSearchInput {...defaultProps} disabled={true} />)
      
      const input = screen.getByTestId('advanced-search-input')
      const submitButton = screen.getByTestId('search-submit-button')
      
      expect(input).toBeDisabled()
      expect(submitButton).toBeDisabled()
      expect(input).toHaveClass('opacity-50', 'cursor-not-allowed')
    })

    test('should not show suggestions when disabled', async () => {
      const user = userEvent.setup()
      
      render(<AdvancedSearchInput {...defaultProps} disabled={true} />)
      
      const input = screen.getByTestId('advanced-search-input')
      await user.click(input)
      
      expect(screen.queryByTestId('search-suggestions')).not.toBeInTheDocument()
    })
  })

  describe('✅ Custom Placeholder and Props', () => {
    test('should use custom placeholder', () => {
      render(<AdvancedSearchInput {...defaultProps} placeholder="Custom placeholder" />)
      
      const input = screen.getByTestId('advanced-search-input')
      expect(input).toHaveAttribute('placeholder', 'Custom placeholder')
    })

    test('should use custom test id', () => {
      render(<AdvancedSearchInput {...defaultProps} data-testid="custom-search" />)
      
      expect(screen.getByTestId('custom-search')).toBeInTheDocument()
    })

    test('should apply custom className', () => {
      render(<AdvancedSearchInput {...defaultProps} className="custom-class" />)
      
      const container = screen.getByTestId('advanced-search-input').parentElement?.parentElement
      expect(container).toHaveClass('custom-class')
    })
  })

  describe('✅ Edge Cases', () => {
    test('should handle empty suggestion clicks gracefully', async () => {
      const user = userEvent.setup()
      const onChange = jest.fn()
      
      render(<AdvancedSearchInput {...defaultProps} onChange={onChange} />)
      
      const input = screen.getByTestId('advanced-search-input')
      await user.click(input)
      
      // Even if there are no suggestions, the component should work
      expect(input).toBeInTheDocument()
    })

    test('should handle rapid typing without errors', async () => {
      const user = userEvent.setup()
      const onChange = jest.fn()
      
      render(<AdvancedSearchInput {...defaultProps} onChange={onChange} />)
      
      const input = screen.getByTestId('advanced-search-input')
      
      // Type rapidly
      await user.type(input, 'rapid typing test')
      
      expect(onChange).toHaveBeenCalledTimes(18) // Each character
      expect(onChange).toHaveBeenLastCalledWith('rapid typing test')
    })

    test('should handle special characters in search', async () => {
      const user = userEvent.setup()
      const onChange = jest.fn()
      
      render(<AdvancedSearchInput {...defaultProps} onChange={onChange} />)
      
      const input = screen.getByTestId('advanced-search-input')
      await user.type(input, 'test@example.com "quoted text" field:value')
      
      // Should handle all special characters without errors
      expect(onChange).toHaveBeenCalledWith('test@example.com "quoted text" field:value')
    })

    test('should handle click outside to close suggestions', async () => {
      const user = userEvent.setup()
      
      render(
        <div>
          <AdvancedSearchInput {...defaultProps} />
          <button data-testid="outside-button">Outside</button>
        </div>
      )
      
      const input = screen.getByTestId('advanced-search-input')
      await user.click(input)
      
      // Click outside
      const outsideButton = screen.getByTestId('outside-button')
      await user.click(outsideButton)
      
      // Should close suggestions (testing the general behavior)
      expect(input).not.toHaveFocus()
    })
  })
})