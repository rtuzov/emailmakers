import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TemplatesPage } from '@/ui/components/pages/templates-page';

// Mock fetch globally
global.fetch = jest.fn();

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/',
}));

// Mock Link component
jest.mock('next/link', () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>;
});

const mockTemplatesResponse = {
  success: true,
  data: {
    templates: [
      {
        id: '1',
        name: 'AI Newsletter Template',
        category: 'newsletter',
        description: 'AI-generated newsletter template',
        status: 'published',
        qualityScore: 95,
        agentGenerated: true,
        tags: ['newsletter', 'ai', 'modern'],
        createdAt: '2024-03-01T10:00:00Z',
        openRate: 85,
        clickRate: 12,
      },
      {
        id: '2',
        name: 'Manual Promo Template',
        category: 'promotional',
        description: 'Manually created promotional template',
        status: 'draft',
        qualityScore: 78,
        agentGenerated: false,
        tags: ['promo', 'sales'],
        createdAt: '2024-02-15T14:30:00Z',
        openRate: 72,
        clickRate: 8,
      },
    ],
    pagination: {
      total: 2,
      page: 1,
      limit: 12,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    },
    filters: {
      categories: [
        { value: 'newsletter', label: 'Newsletter', count: 1 },
        { value: 'promotional', label: 'Promotional', count: 1 },
      ],
      tags: ['newsletter', 'ai', 'modern', 'promo', 'sales'],
    },
  },
  metadata: {
    query_time: 45,
    cache_status: 'database',
  },
};

describe('Templates Filtering System', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTemplatesResponse),
    });
  });

  describe('Basic Filtering Interface', () => {
    test('should render search input with correct placeholder', async () => {
      render(<TemplatesPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });
      
      expect(screen.getByPlaceholderText('Search templates...')).toBeInTheDocument();
    });

    test('should render advanced filters toggle button', async () => {
      render(<TemplatesPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('advanced-filters-toggle')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Filters')).toBeInTheDocument();
    });

    test('should show filter count when filters are active', async () => {
      render(<TemplatesPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('category-filter-newsletter')).toBeInTheDocument();
      });
      
      // Click on newsletter category
      fireEvent.click(screen.getByTestId('category-filter-newsletter'));
      
      // Should show filter count
      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument(); // Filter count badge
      });
    });

    test('should show clear all button when filters are active', async () => {
      render(<TemplatesPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('category-filter-newsletter')).toBeInTheDocument();
      });
      
      // Apply a filter
      fireEvent.click(screen.getByTestId('category-filter-newsletter'));
      
      // Should show clear all button
      await waitFor(() => {
        expect(screen.getByTestId('clear-filters')).toBeInTheDocument();
      });
    });
  });

  describe('Advanced Filters Panel', () => {
    test('should toggle advanced filters panel', async () => {
      render(<TemplatesPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('advanced-filters-toggle')).toBeInTheDocument();
      });
      
      // Panel should not be visible initially
      expect(screen.queryByTestId('advanced-filters-panel')).not.toBeInTheDocument();
      
      // Click toggle button
      fireEvent.click(screen.getByTestId('advanced-filters-toggle'));
      
      // Panel should be visible
      await waitFor(() => {
        expect(screen.getByTestId('advanced-filters-panel')).toBeInTheDocument();
      });
    });

    test('should render all advanced filter controls', async () => {
      render(<TemplatesPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('advanced-filters-toggle')).toBeInTheDocument();
      });
      
      // Open advanced filters
      fireEvent.click(screen.getByTestId('advanced-filters-toggle'));
      
      await waitFor(() => {
        // Status filters
        expect(screen.getByTestId('status-filter-all')).toBeInTheDocument();
        expect(screen.getByTestId('status-filter-published')).toBeInTheDocument();
        expect(screen.getByTestId('status-filter-draft')).toBeInTheDocument();
        
        // Generation type filters
        expect(screen.getByTestId('generation-filter-all')).toBeInTheDocument();
        expect(screen.getByTestId('generation-filter-ai')).toBeInTheDocument();
        expect(screen.getByTestId('generation-filter-manual')).toBeInTheDocument();
        
        // Quality score ranges
        expect(screen.getByTestId('quality-min-range')).toBeInTheDocument();
        expect(screen.getByTestId('quality-max-range')).toBeInTheDocument();
        
        // Date range inputs
        expect(screen.getByTestId('date-start-input')).toBeInTheDocument();
        expect(screen.getByTestId('date-end-input')).toBeInTheDocument();
      });
    });

    test('should render tag filters when available', async () => {
      render(<TemplatesPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('advanced-filters-toggle')).toBeInTheDocument();
      });
      
      // Open advanced filters
      fireEvent.click(screen.getByTestId('advanced-filters-toggle'));
      
      await waitFor(() => {
        // Tag filters should be present
        expect(screen.getByTestId('tag-filter-newsletter')).toBeInTheDocument();
        expect(screen.getByTestId('tag-filter-ai')).toBeInTheDocument();
        expect(screen.getByTestId('tag-filter-modern')).toBeInTheDocument();
        expect(screen.getByTestId('tag-filter-promo')).toBeInTheDocument();
        expect(screen.getByTestId('tag-filter-sales')).toBeInTheDocument();
      });
    });
  });

  describe('Filter Functionality', () => {
    test('should apply search filter', async () => {
      render(<TemplatesPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });
      
      // Type in search input
      fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'newsletter' } });
      
      // Should make API call with search parameter
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('search=newsletter'),
          expect.any(Object)
        );
      });
    });

    test('should apply category filter', async () => {
      render(<TemplatesPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('category-filter-newsletter')).toBeInTheDocument();
      });
      
      // Click newsletter category
      fireEvent.click(screen.getByTestId('category-filter-newsletter'));
      
      // Should make API call with category parameter
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('category=newsletter'),
          expect.any(Object)
        );
      });
    });

    test('should apply status filter', async () => {
      render(<TemplatesPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('advanced-filters-toggle')).toBeInTheDocument();
      });
      
      // Open advanced filters
      fireEvent.click(screen.getByTestId('advanced-filters-toggle'));
      
      await waitFor(() => {
        expect(screen.getByTestId('status-filter-published')).toBeInTheDocument();
      });
      
      // Click published status
      fireEvent.click(screen.getByTestId('status-filter-published'));
      
      // Should make API call with status parameter
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('status=published'),
          expect.any(Object)
        );
      });
    });

    test('should apply tag filters', async () => {
      render(<TemplatesPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('advanced-filters-toggle')).toBeInTheDocument();
      });
      
      // Open advanced filters
      fireEvent.click(screen.getByTestId('advanced-filters-toggle'));
      
      await waitFor(() => {
        expect(screen.getByTestId('tag-filter-ai')).toBeInTheDocument();
      });
      
      // Click AI tag
      fireEvent.click(screen.getByTestId('tag-filter-ai'));
      
      // Should make API call with tags parameter
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('tags=ai'),
          expect.any(Object)
        );
      });
    });

    test('should apply multiple tag filters', async () => {
      render(<TemplatesPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('advanced-filters-toggle')).toBeInTheDocument();
      });
      
      // Open advanced filters
      fireEvent.click(screen.getByTestId('advanced-filters-toggle'));
      
      await waitFor(() => {
        expect(screen.getByTestId('tag-filter-ai')).toBeInTheDocument();
        expect(screen.getByTestId('tag-filter-modern')).toBeInTheDocument();
      });
      
      // Click multiple tags
      fireEvent.click(screen.getByTestId('tag-filter-ai'));
      fireEvent.click(screen.getByTestId('tag-filter-modern'));
      
      // Should make API call with multiple tags
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('tags=ai,modern'),
          expect.any(Object)
        );
      });
    });

    test('should apply agent generation filter', async () => {
      render(<TemplatesPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('advanced-filters-toggle')).toBeInTheDocument();
      });
      
      // Open advanced filters
      fireEvent.click(screen.getByTestId('advanced-filters-toggle'));
      
      await waitFor(() => {
        expect(screen.getByTestId('generation-filter-ai')).toBeInTheDocument();
      });
      
      // Click AI generation filter
      fireEvent.click(screen.getByTestId('generation-filter-ai'));
      
      // Should make API call with agentGenerated parameter
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('agentGenerated=true'),
          expect.any(Object)
        );
      });
    });

    test('should apply quality score range filter', async () => {
      render(<TemplatesPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('advanced-filters-toggle')).toBeInTheDocument();
      });
      
      // Open advanced filters
      fireEvent.click(screen.getByTestId('advanced-filters-toggle'));
      
      await waitFor(() => {
        expect(screen.getByTestId('quality-min-range')).toBeInTheDocument();
      });
      
      // Change quality score range
      fireEvent.change(screen.getByTestId('quality-min-range'), { target: { value: '80' } });
      
      // Should make API call with quality range parameters
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('qualityMin=80'),
          expect.any(Object)
        );
      });
    });

    test('should apply date range filter', async () => {
      render(<TemplatesPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('advanced-filters-toggle')).toBeInTheDocument();
      });
      
      // Open advanced filters
      fireEvent.click(screen.getByTestId('advanced-filters-toggle'));
      
      await waitFor(() => {
        expect(screen.getByTestId('date-start-input')).toBeInTheDocument();
      });
      
      // Set start date
      fireEvent.change(screen.getByTestId('date-start-input'), { 
        target: { value: '2024-03-01' } 
      });
      
      // Should make API call with date parameter
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('dateStart=2024-03-01'),
          expect.any(Object)
        );
      });
    });
  });

  describe('Filter Combinations', () => {
    test('should apply multiple filters simultaneously', async () => {
      render(<TemplatesPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
        expect(screen.getByTestId('category-filter-newsletter')).toBeInTheDocument();
        expect(screen.getByTestId('advanced-filters-toggle')).toBeInTheDocument();
      });
      
      // Apply search
      fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'AI' } });
      
      // Apply category
      fireEvent.click(screen.getByTestId('category-filter-newsletter'));
      
      // Open advanced filters and apply status
      fireEvent.click(screen.getByTestId('advanced-filters-toggle'));
      
      await waitFor(() => {
        expect(screen.getByTestId('status-filter-published')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('status-filter-published'));
      
      // Should make API call with all parameters
      await waitFor(() => {
        const lastCall = (fetch as jest.Mock).mock.calls.slice(-1)[0];
        const url = lastCall[0];
        expect(url).toContain('search=AI');
        expect(url).toContain('category=newsletter');
        expect(url).toContain('status=published');
      });
    });

    test('should reset pagination when filters change', async () => {
      render(<TemplatesPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('category-filter-newsletter')).toBeInTheDocument();
      });
      
      // Apply filter
      fireEvent.click(screen.getByTestId('category-filter-newsletter'));
      
      // Should reset to page 1
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('page=1'),
          expect.any(Object)
        );
      });
    });
  });

  describe('Clear Filters', () => {
    test('should clear all filters when clear button is clicked', async () => {
      render(<TemplatesPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
        expect(screen.getByTestId('category-filter-newsletter')).toBeInTheDocument();
      });
      
      // Apply some filters
      fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'test' } });
      fireEvent.click(screen.getByTestId('category-filter-newsletter'));
      
      // Clear all filters button should appear
      await waitFor(() => {
        expect(screen.getByTestId('clear-filters')).toBeInTheDocument();
      });
      
      // Click clear filters
      fireEvent.click(screen.getByTestId('clear-filters'));
      
      // Should reset all filters
      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toHaveValue('');
        expect(screen.getByTestId('category-filter-all')).toHaveClass('glass-button-primary'); // Selected state
      });
    });

    test('should clear individual tag filters', async () => {
      render(<TemplatesPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('advanced-filters-toggle')).toBeInTheDocument();
      });
      
      // Open advanced filters
      fireEvent.click(screen.getByTestId('advanced-filters-toggle'));
      
      await waitFor(() => {
        expect(screen.getByTestId('tag-filter-ai')).toBeInTheDocument();
      });
      
      // Select a tag
      fireEvent.click(screen.getByTestId('tag-filter-ai'));
      
      // Click same tag again to deselect
      fireEvent.click(screen.getByTestId('tag-filter-ai'));
      
      // Should make API call without the tag
      await waitFor(() => {
        const lastCall = (fetch as jest.Mock).mock.calls.slice(-1)[0];
        const url = lastCall[0];
        expect(url).not.toContain('tags=');
      });
    });
  });

  describe('Filter State Persistence', () => {
    test('should maintain filter state during component updates', async () => {
      const { rerender } = render(<TemplatesPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });
      
      // Apply a filter
      fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'test search' } });
      
      // Rerender component
      rerender(<TemplatesPage />);
      
      // Filter should still be applied
      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toHaveValue('test search');
      });
    });
  });

  describe('Filter Visual Feedback', () => {
    test('should show active state for selected filters', async () => {
      render(<TemplatesPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('category-filter-newsletter')).toBeInTheDocument();
      });
      
      // Click newsletter category
      fireEvent.click(screen.getByTestId('category-filter-newsletter'));
      
      // Should have active/primary styling
      await waitFor(() => {
        expect(screen.getByTestId('category-filter-newsletter')).toHaveClass('glass-button-primary');
      });
    });

    test('should display filter counts in category buttons', async () => {
      render(<TemplatesPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('category-filter-newsletter')).toBeInTheDocument();
      });
      
      // Should show count next to category name
      expect(screen.getByText('Newsletter')).toBeInTheDocument();
      expect(screen.getByText('(1)')).toBeInTheDocument(); // Count badge
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors gracefully during filtering', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));
      
      render(<TemplatesPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });
      
      // Apply a filter that triggers API call
      fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'test' } });
      
      // Should show error state (not crash)
      await waitFor(() => {
        expect(screen.getByText(/Failed to Load Templates/i)).toBeInTheDocument();
      });
    });
  });
});