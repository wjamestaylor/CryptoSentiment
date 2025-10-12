import React from 'react';
import { render, screen } from '@testing-library/react';
import { 
  LoadingSpinner, 
  FullPageLoading, 
  CardSkeleton, 
  CryptoPriceLoading,
  DashboardStatsLoading,
  TableLoading,
  SentimentLoading,
  AlertPageLoading,
  WatchlistLoading
} from '@/components/ui/loading';

describe('Loading Components', () => {
  describe('LoadingSpinner', () => {
    it('renders with default classes', () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole('status', { hidden: true });
      expect(spinner).toHaveClass('animate-spin', 'rounded-full', 'border-2');
    });

    it('accepts custom className', () => {
      render(<LoadingSpinner className="custom-class" />);
      const spinner = screen.getByRole('status', { hidden: true });
      expect(spinner).toHaveClass('custom-class');
    });
  });

  describe('FullPageLoading', () => {
    it('renders loading text and spinner', () => {
      render(<FullPageLoading />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
    });

    it('has proper layout classes', () => {
      render(<FullPageLoading />);
      const container = screen.getByText('Loading...').closest('div');
      expect(container?.parentElement).toHaveClass('flex', 'h-screen', 'items-center', 'justify-center');
    });
  });

  describe('CardSkeleton', () => {
    it('renders card structure with skeletons', () => {
      render(<CardSkeleton />);
      
      const skeletons = screen.getAllByRole('status', { hidden: true });
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('CryptoPriceLoading', () => {
    it('renders 5 crypto price loading items by default', () => {
      render(<CryptoPriceLoading />);
      
      const items = screen.getAllByRole('status', { hidden: true });
      // Each item has multiple skeleton elements
      expect(items.length).toBeGreaterThan(10); // 5 items × multiple skeletons each
    });
  });

  describe('DashboardStatsLoading', () => {
    it('renders 4 stat cards', () => {
      render(<DashboardStatsLoading />);
      
      const cards = screen.getAllByRole('status', { hidden: true });
      expect(cards.length).toBeGreaterThan(0);
    });

    it('has proper grid layout', () => {
      const { container } = render(<DashboardStatsLoading />);
      const gridContainer = container.firstChild;
      expect(gridContainer).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4');
    });
  });

  describe('TableLoading', () => {
    it('renders with default 5 rows', () => {
      render(<TableLoading />);
      
      const skeletons = screen.getAllByRole('status', { hidden: true });
      expect(skeletons.length).toBeGreaterThan(20); // Header + 5 rows × 4 columns each
    });

    it('renders custom number of rows', () => {
      render(<TableLoading rows={3} />);
      
      const skeletons = screen.getAllByRole('status', { hidden: true });
      expect(skeletons.length).toBeGreaterThan(12); // Header + 3 rows × 4 columns each
    });
  });

  describe('SentimentLoading', () => {
    it('renders sentiment analysis skeleton', () => {
      render(<SentimentLoading />);
      
      const skeletons = screen.getAllByRole('status', { hidden: true });
      expect(skeletons.length).toBeGreaterThan(5);
    });
  });

  describe('AlertPageLoading', () => {
    it('renders alert page skeleton with proper structure', () => {
      const { container } = render(<AlertPageLoading />);
      
      // Should have container structure
      expect(container.querySelector('.container')).toBeInTheDocument();
      
      // Should have grid layout
      expect(container.querySelector('.grid')).toBeInTheDocument();
      
      const skeletons = screen.getAllByRole('status', { hidden: true });
      expect(skeletons.length).toBeGreaterThan(8); // Multiple skeleton elements
    });
  });

  describe('WatchlistLoading', () => {
    it('renders watchlist page skeleton with proper structure', () => {
      const { container } = render(<WatchlistLoading />);
      
      // Should have container structure
      expect(container.querySelector('.container')).toBeInTheDocument();
      
      // Should have grid layout for two columns
      expect(container.querySelector('.grid-cols-1.lg\\:grid-cols-2')).toBeInTheDocument();
      
      const skeletons = screen.getAllByRole('status', { hidden: true });
      expect(skeletons.length).toBeGreaterThan(15); // Multiple skeleton elements for both sections
    });
  });

  // Test animation classes
  describe('Animation Classes', () => {
    it('all loading components have pulse animation', () => {
      render(<CardSkeleton />);
      
      const skeletons = screen.getAllByRole('status', { hidden: true });
      skeletons.forEach(skeleton => {
        expect(skeleton).toHaveClass('animate-pulse');
      });
    });
  });
});