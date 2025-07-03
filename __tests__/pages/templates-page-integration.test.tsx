/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TemplatesPage } from '@/ui/components/pages/templates-page';

// Mock fetch globally
global.fetch = jest.fn();

// Mock Next.js components
jest.mock('next/link', () => {
  return function MockLink({ children, href }: any) {
    return <a href={href}>{children}</a>;
  };
});

const mockTemplatesResponse = {
  success: true,
  data: {
    templates: [
      {
        id: 'tpl_1709567890123',
        name: 'Парижский Уик-энд: Скидка 30%',
        category: 'promotional',
        description: 'Эксклюзивное предложение на романтические выходные в Париже с билетами от Купибилет',
        thumbnail: '/api/placeholder/400/300',
        createdAt: '2024-03-04T14:30:00Z',
        updatedAt: '2024-03-04T15:45:00Z',
        tags: ['париж', 'скидка', 'выходные', 'романтика'],
        status: 'published',
        openRate: 89.5,
        clickRate: 24.8,
        qualityScore: 92,
        agentGenerated: true,
        subjectLine: '🇫🇷 Париж ждет вас! Скидка 30% на романтические выходные',
        previewText: 'Откройте для себя магию Парижа с эксклюзивными предложениями от Купибилет',
        userId: 'user_123'
      },
      {
        id: 'tpl_1709567890124',
        name: 'Подтверждение Бронирования Москва-СПб',
        category: 'transactional',
        description: 'Автоматическое подтверждение бронирования билетов по маршруту Москва-Санкт-Петербург',
        thumbnail: '/api/placeholder/400/300',
        createdAt: '2024-03-03T10:15:00Z',
        tags: ['подтверждение', 'бронирование', 'москва', 'спб'],
        status: 'published',
        openRate: 98.2,
        clickRate: 45.6,
        qualityScore: 96,
        agentGenerated: true,
        userId: 'user_123'
      }
    ],
    pagination: {
      total: 6,
      page: 1,
      limit: 12,
      totalPages: 1,
      hasNext: false,
      hasPrev: false
    },
    filters: {
      categories: [
        { value: 'all', label: 'All Templates', count: 6 },
        { value: 'promotional', label: 'Promotional', count: 2 },
        { value: 'transactional', label: 'Transactional', count: 2 },
        { value: 'welcome', label: 'Welcome', count: 1 },
        { value: 'newsletter', label: 'Newsletter', count: 1 }
      ],
      tags: ['париж', 'скидка', 'выходные', 'романтика', 'подтверждение', 'бронирование']
    }
  },
  metadata: {
    query_time: 45,
    cache_status: 'miss'
  }
};

describe('Templates Page Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockTemplatesResponse,
      headers: new Map([
        ['X-Total-Count', '6'],
        ['X-Page', '1'],
        ['X-Per-Page', '12']
      ])
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial Load', () => {
    test('should display loading state initially', async () => {
      render(<TemplatesPage />);
      
      expect(screen.getByText('Loading templates...')).toBeInTheDocument();
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    test('should fetch templates on mount', async () => {
      render(<TemplatesPage />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/templates'),
          expect.objectContaining({
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          })
        );
      });
    });

    test('should display templates after successful fetch', async () => {
      render(<TemplatesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Парижский Уик-энд: Скидка 30%')).toBeInTheDocument();
        expect(screen.getByText('Подтверждение Бронирования Москва-СПб')).toBeInTheDocument();
      });
    });

    test('should display correct template details', async () => {
      render(<TemplatesPage />);
      
      await waitFor(() => {
        // Check template card details
        expect(screen.getByText('Quality: 92%')).toBeInTheDocument();
        expect(screen.getByText('Quality: 96%')).toBeInTheDocument();
        expect(screen.getAllByText('🤖 AI Generated')).toHaveLength(2);
        expect(screen.getByText('published')).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    test('should trigger search API call when typing in search box', async () => {
      render(<TemplatesPage />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search templates...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search templates...');
      
      act(() => {
        fireEvent.change(searchInput, { target: { value: 'париж' } });
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('search=париж'),
          expect.any(Object)
        );
      }, { timeout: 1000 });
    });

    test('should debounce search input', async () => {
      jest.useFakeTimers();
      render(<TemplatesPage />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search templates...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search templates...');
      
      // Type multiple characters quickly
      act(() => {
        fireEvent.change(searchInput, { target: { value: 'п' } });
        fireEvent.change(searchInput, { target: { value: 'па' } });
        fireEvent.change(searchInput, { target: { value: 'пар' } });
        fireEvent.change(searchInput, { target: { value: 'пари' } });
        fireEvent.change(searchInput, { target: { value: 'париж' } });
      });

      // Fast forward debounce timer
      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        // Should only make one API call after debounce
        const fetchCalls = (global.fetch as jest.Mock).mock.calls;
        const searchCalls = fetchCalls.filter(call => call[0].includes('search='));
        expect(searchCalls.length).toBe(1);
        expect(searchCalls[0][0]).toContain('search=париж');
      });

      jest.useRealTimers();
    });

    test('should reset to page 1 when searching', async () => {
      // Mock paginated response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockTemplatesResponse,
          data: {
            ...mockTemplatesResponse.data,
            pagination: { ...mockTemplatesResponse.data.pagination, page: 2 }
          }
        })
      });

      render(<TemplatesPage />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search templates...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search templates...');
      
      act(() => {
        fireEvent.change(searchInput, { target: { value: 'test' } });
      });

      await waitFor(() => {
        const lastCall = (global.fetch as jest.Mock).mock.calls.slice(-1)[0];
        expect(lastCall[0]).toContain('page=1');
      });
    });
  });

  describe('Category Filtering', () => {
    test('should display category filter buttons', async () => {
      render(<TemplatesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('All Templates')).toBeInTheDocument();
        expect(screen.getByText('Promotional')).toBeInTheDocument();
        expect(screen.getByText('Transactional')).toBeInTheDocument();
      });
    });

    test('should trigger API call when category filter is selected', async () => {
      render(<TemplatesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Promotional')).toBeInTheDocument();
      });

      const promotionalButton = screen.getByText('Promotional');
      
      act(() => {
        fireEvent.click(promotionalButton);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('category=promotional'),
          expect.any(Object)
        );
      });
    });

    test('should highlight selected category', async () => {
      render(<TemplatesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Promotional')).toBeInTheDocument();
      });

      const promotionalButton = screen.getByText('Promotional');
      
      act(() => {
        fireEvent.click(promotionalButton);
      });

      await waitFor(() => {
        // Selected category should have primary variant class
        expect(promotionalButton.closest('button')).toHaveClass('bg-kupibilet-primary', 'text-white');
      });
    });
  });

  describe('View Mode Toggle', () => {
    test('should toggle between grid and list view', async () => {
      render(<TemplatesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Парижский Уик-энд: Скидка 30%')).toBeInTheDocument();
      });

      // Find view toggle button
      const viewToggleButton = screen.getByRole('button', { name: /grid|list/i });
      
      act(() => {
        fireEvent.click(viewToggleButton);
      });

      // Grid should switch to list view (different layout structure)
      await waitFor(() => {
        // In list view, templates should be in a different container structure
        expect(screen.getByText('Парижский Уик-энд: Скидка 30%')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('should display error state when API fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      render(<TemplatesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to Load Templates')).toBeInTheDocument();
        expect(screen.getByText('Network error')).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    test('should retry API call when retry button is clicked', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      render(<TemplatesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      // Reset mock to return successful response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTemplatesResponse
      });

      const retryButton = screen.getByText('Retry');
      
      act(() => {
        fireEvent.click(retryButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Парижский Уик-энд: Скидка 30%')).toBeInTheDocument();
      });
    });

    test('should handle API error with error response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({
          success: false,
          message: 'Database connection failed'
        })
      });
      
      render(<TemplatesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to Load Templates')).toBeInTheDocument();
        expect(screen.getByText('Database connection failed')).toBeInTheDocument();
      });
    });
  });

  describe('Empty States', () => {
    test('should display empty state when no templates exist', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockTemplatesResponse,
          data: {
            ...mockTemplatesResponse.data,
            templates: [],
            pagination: {
              ...mockTemplatesResponse.data.pagination,
              total: 0
            }
          }
        })
      });
      
      render(<TemplatesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('No Templates Found')).toBeInTheDocument();
        expect(screen.getByText('You haven\'t created any email templates yet. Start by creating your first template.')).toBeInTheDocument();
        expect(screen.getByText('Create Your First Template')).toBeInTheDocument();
      });
    });

    test('should display no search results state', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockTemplatesResponse,
          data: {
            ...mockTemplatesResponse.data,
            templates: []
          }
        })
      });
      
      render(<TemplatesPage />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search templates...')).toBeInTheDocument();
      });

      // Perform search
      const searchInput = screen.getByPlaceholderText('Search templates...');
      
      act(() => {
        fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
      });

      await waitFor(() => {
        expect(screen.getByText('No templates found')).toBeInTheDocument();
        expect(screen.getByText('Try adjusting your search terms or filters')).toBeInTheDocument();
      });
    });
  });

  describe('Template Display', () => {
    test('should display template cards with correct information', async () => {
      render(<TemplatesPage />);
      
      await waitFor(() => {
        // Check template names
        expect(screen.getByText('Парижский Уик-энд: Скидка 30%')).toBeInTheDocument();
        expect(screen.getByText('Подтверждение Бронирования Москва-СПб')).toBeInTheDocument();
        
        // Check descriptions
        expect(screen.getByText('Эксклюзивное предложение на романтические выходные в Париже с билетами от Купибилет')).toBeInTheDocument();
        
        // Check tags
        expect(screen.getByText('париж')).toBeInTheDocument();
        expect(screen.getByText('скидка')).toBeInTheDocument();
        expect(screen.getByText('подтверждение')).toBeInTheDocument();
        
        // Check status badges
        expect(screen.getAllByText('published')).toHaveLength(2);
        
        // Check AI generation badges
        expect(screen.getAllByText('🤖 AI Generated')).toHaveLength(2);
        
        // Check quality scores
        expect(screen.getByText('Quality: 92%')).toBeInTheDocument();
        expect(screen.getByText('Quality: 96%')).toBeInTheDocument();
      });
    });

    test('should display action buttons for each template', async () => {
      render(<TemplatesPage />);
      
      await waitFor(() => {
        // Each template should have view, edit, and download buttons
        const viewButtons = screen.getAllByRole('button', { name: '' }); // Icons don't have text
        expect(viewButtons.length).toBeGreaterThanOrEqual(6); // 3 buttons × 2 templates
      });
    });

    test('should format dates correctly', async () => {
      render(<TemplatesPage />);
      
      await waitFor(() => {
        // Dates should be formatted in Russian locale
        expect(screen.getByText('04.03.2024')).toBeInTheDocument();
        expect(screen.getByText('03.03.2024')).toBeInTheDocument();
      });
    });
  });

  describe('Quality Score Display', () => {
    test('should display quality scores with correct colors', async () => {
      render(<TemplatesPage />);
      
      await waitFor(() => {
        const qualityScore92 = screen.getByText('92%');
        const qualityScore96 = screen.getByText('96%');
        
        // High scores (90+) should be green
        expect(qualityScore92).toHaveClass('text-green-400');
        expect(qualityScore96).toHaveClass('text-green-400');
      });
    });

    test('should handle different quality score ranges', async () => {
      const mockResponseWithVariedScores = {
        ...mockTemplatesResponse,
        data: {
          ...mockTemplatesResponse.data,
          templates: [
            { ...mockTemplatesResponse.data.templates[0], qualityScore: 95 }, // Green
            { ...mockTemplatesResponse.data.templates[1], qualityScore: 85 }, // Yellow
            { ...mockTemplatesResponse.data.templates[0], id: 'test3', qualityScore: 75 } // Red
          ]
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponseWithVariedScores
      });
      
      render(<TemplatesPage />);
      
      await waitFor(() => {
        const score95 = screen.getByText('95%');
        const score85 = screen.getByText('85%');
        const score75 = screen.getByText('75%');
        
        expect(score95).toHaveClass('text-green-400');
        expect(score85).toHaveClass('text-yellow-400');
        expect(score75).toHaveClass('text-red-400');
      });
    });
  });

  describe('Performance', () => {
    test('should not make unnecessary API calls', async () => {
      render(<TemplatesPage />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Парижский Уик-энд: Скидка 30%')).toBeInTheDocument();
      });

      // Clear mock call history
      (global.fetch as jest.Mock).mockClear();

      // Interact with UI without changing filters
      const viewToggleButton = screen.getByRole('button', { name: /grid|list/i });
      
      act(() => {
        fireEvent.click(viewToggleButton);
      });

      // Should not trigger additional API calls
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('should handle rapid filter changes efficiently', async () => {
      jest.useFakeTimers();
      render(<TemplatesPage />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search templates...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search templates...');
      
      // Rapid changes
      act(() => {
        fireEvent.change(searchInput, { target: { value: 'a' } });
        fireEvent.change(searchInput, { target: { value: 'ab' } });
        fireEvent.change(searchInput, { target: { value: 'abc' } });
      });

      // Fast forward less than debounce time
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Should not have made search API calls yet
      const searchCalls = (global.fetch as jest.Mock).mock.calls.filter(call => 
        call[0].includes('search=')
      );
      expect(searchCalls.length).toBe(0);

      jest.useRealTimers();
    });
  });
});