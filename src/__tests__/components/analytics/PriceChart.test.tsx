/**
 * Tests for PriceChart component with multi-view support
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PriceChart } from '@/components/analytics/PriceChart';
import { api } from '@/lib/trpc/provider';

// Mock tRPC
jest.mock('@/lib/trpc/provider', () => ({
  api: {
    crypto: {
      getWatchedCoins: {
        useQuery: jest.fn(),
      },
      getHeldCoins: {
        useQuery: jest.fn(),
      },
    },
    analytics: {
      getPriceHistory: {
        useQuery: jest.fn(),
      },
    },
  },
}));

// Mock ErrorBoundary
jest.mock('@/components/ui/error-boundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('PriceChart Component', () => {
  const mockPriceHistory = {
    data: {
      success: true,
      data: [
        { timestamp: '2024-01-01', price: 45000, marketCap: 1000000000, volume: 50000000 },
        { timestamp: '2024-01-02', price: 46000, marketCap: 1100000000, volume: 52000000 },
        { timestamp: '2024-01-03', price: 47000, marketCap: 1200000000, volume: 54000000 },
      ],
    },
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  };

  const mockWatchedCoins = {
    data: {
      success: true,
      data: [
        {
          coinGeckoId: 'bitcoin',
          symbol: 'BTC',
          name: 'Bitcoin',
          currentPrice: 45000,
          priceChangePercentage24h: 3.5,
        },
        {
          coinGeckoId: 'ethereum',
          symbol: 'ETH',
          name: 'Ethereum',
          currentPrice: 3000,
          priceChangePercentage24h: -1.2,
        },
      ],
    },
    isLoading: false,
  };

  const mockHeldCoins = {
    data: {
      success: true,
      data: [
        {
          coinGeckoId: 'bitcoin',
          symbol: 'BTC',
          name: 'Bitcoin',
          currentPrice: 45000,
          priceChangePercentage24h: 3.5,
        },
      ],
    },
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mocks
    (api.analytics.getPriceHistory.useQuery as jest.Mock).mockReturnValue(mockPriceHistory);
    (api.crypto.getWatchedCoins.useQuery as jest.Mock).mockReturnValue(mockWatchedCoins);
    (api.crypto.getHeldCoins.useQuery as jest.Mock).mockReturnValue(mockHeldCoins);
  });

  describe('Single Crypto Mode', () => {
    it('renders price chart for a single crypto without multi-view', () => {
      render(
        <PriceChart 
          cryptoId="bitcoin"
          cryptoName="Bitcoin"
          cryptoSymbol="BTC"
          enableMultiView={false}
        />
      );

      expect(screen.getByText('Bitcoin')).toBeInTheDocument();
      expect(screen.getByText('BTC')).toBeInTheDocument();
      expect(screen.getByText('Price history and market data analysis')).toBeInTheDocument();
    });

    it('displays price statistics correctly', () => {
      render(
        <PriceChart 
          cryptoId="bitcoin"
          cryptoName="Bitcoin"
          cryptoSymbol="BTC"
          enableMultiView={false}
        />
      );

      expect(screen.getByText('Current Price')).toBeInTheDocument();
      expect(screen.getByText('30D Change')).toBeInTheDocument();
      expect(screen.getByText('High / Low')).toBeInTheDocument();
      expect(screen.getByText('Avg Volume')).toBeInTheDocument();
    });

    it('allows timeframe selection', async () => {
      render(
        <PriceChart 
          cryptoId="bitcoin"
          cryptoName="Bitcoin"
          cryptoSymbol="BTC"
          enableMultiView={false}
        />
      );

      const selectTrigger = screen.getAllByRole('combobox')[0];
      expect(selectTrigger).toBeInTheDocument();
    });
  });

  describe('Multi-View Mode', () => {
    it('renders tabs for watched and held coins when multi-view is enabled', () => {
      render(
        <PriceChart 
          cryptoId="bitcoin"
          cryptoName="Bitcoin"
          cryptoSymbol="BTC"
          enableMultiView={true}
        />
      );

      expect(screen.getByText(/Watched \(2\)/)).toBeInTheDocument();
      expect(screen.getByText(/Held \(1\)/)).toBeInTheDocument();
    });

    it('displays watched coins by default', () => {
      render(
        <PriceChart 
          cryptoId="bitcoin"
          cryptoName="Bitcoin"
          cryptoSymbol="BTC"
          enableMultiView={true}
        />
      );

      // Should show watched coins selector - Bitcoin appears in header AND coin selector
      const bitcoinElements = screen.getAllByText('Bitcoin');
      expect(bitcoinElements.length).toBeGreaterThan(0);
      expect(screen.getByText('Ethereum')).toBeInTheDocument();
    });

    it('switches to held coins when held tab is clicked', async () => {
      render(
        <PriceChart 
          cryptoId="bitcoin"
          cryptoName="Bitcoin"
          cryptoSymbol="BTC"
          enableMultiView={true}
        />
      );

      const heldTab = screen.getByText(/Held \(1\)/);
      fireEvent.click(heldTab);

      await waitFor(() => {
        // Should still show Bitcoin since it's in both lists
        const bitcoinElements = screen.getAllByText('Bitcoin');
        expect(bitcoinElements.length).toBeGreaterThan(0);
      });
    });

    it('shows empty state when no watched coins exist', () => {
      (api.crypto.getWatchedCoins.useQuery as jest.Mock).mockReturnValue({
        data: { success: true, data: [] },
        isLoading: false,
      });

      render(
        <PriceChart 
          cryptoId="bitcoin"
          cryptoName="Bitcoin"
          cryptoSymbol="BTC"
          enableMultiView={true}
        />
      );

      expect(screen.getByText(/No watched coins yet/)).toBeInTheDocument();
    });

    it('shows empty state when no held coins exist', async () => {
      (api.crypto.getHeldCoins.useQuery as jest.Mock).mockReturnValue({
        data: { success: true, data: [] },
        isLoading: false,
      });

      render(
        <PriceChart 
          cryptoId="bitcoin"
          cryptoName="Bitcoin"
          cryptoSymbol="BTC"
          enableMultiView={true}
        />
      );

      const heldTab = screen.getByText(/Held \(0\)/);
      fireEvent.click(heldTab);

      // Wait for the empty state to appear - query all to debug
      await waitFor(() => {
        const emptyStateText = screen.queryByText(/No held coins yet/);
        const alternativeText = screen.queryByText(/Add holdings to your portfolio/);
        expect(emptyStateText || alternativeText).toBeInTheDocument();
      });
    });

    it('displays coin selector with price data in watched mode', () => {
      render(
        <PriceChart 
          cryptoId="bitcoin"
          cryptoName="Bitcoin"
          cryptoSymbol="BTC"
          enableMultiView={true}
        />
      );

      // Check for coin selector with multiple coins
      const btcElements = screen.getAllByText('BTC');
      expect(btcElements.length).toBeGreaterThan(0);
      expect(screen.getByText(/\+3.5%/)).toBeInTheDocument();

      // Check for Ethereum  
      expect(screen.getByText('ETH')).toBeInTheDocument();
      expect(screen.getByText(/-1.2%/)).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('shows loading skeleton when price data is loading', () => {
      (api.analytics.getPriceHistory.useQuery as jest.Mock).mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      });

      render(
        <PriceChart 
          cryptoId="bitcoin"
          cryptoName="Bitcoin"
          cryptoSymbol="BTC"
          enableMultiView={false}
        />
      );

      // Skeletons should be present (they have role="status")
      const skeletons = document.querySelectorAll('[role="status"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('shows loading state when watched coins are loading', () => {
      (api.crypto.getWatchedCoins.useQuery as jest.Mock).mockReturnValue({
        data: null,
        isLoading: true,
      });

      render(
        <PriceChart 
          cryptoId="bitcoin"
          cryptoName="Bitcoin"
          cryptoSymbol="BTC"
          enableMultiView={true}
        />
      );

      // Component should still render
      expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error message when price history fetch fails', () => {
      (api.analytics.getPriceHistory.useQuery as jest.Mock).mockReturnValue({
        data: null,
        isLoading: false,
        error: { message: 'Failed to fetch price history' },
        refetch: jest.fn(),
      });

      render(
        <PriceChart 
          cryptoId="bitcoin"
          cryptoName="Bitcoin"
          cryptoSymbol="BTC"
          enableMultiView={false}
        />
      );

      expect(screen.getByText('Chart Error')).toBeInTheDocument();
      expect(screen.getByText(/Failed to load price data/)).toBeInTheDocument();
    });

    it('allows retry when error occurs', () => {
      const mockRefetch = jest.fn();
      (api.analytics.getPriceHistory.useQuery as jest.Mock).mockReturnValue({
        data: null,
        isLoading: false,
        error: { message: 'Network error' },
        refetch: mockRefetch,
      });

      render(
        <PriceChart 
          cryptoId="bitcoin"
          cryptoName="Bitcoin"
          cryptoSymbol="BTC"
          enableMultiView={false}
        />
      );

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe('Price Data Rendering', () => {
    it('shows no data message when price history is empty', () => {
      (api.analytics.getPriceHistory.useQuery as jest.Mock).mockReturnValue({
        data: { success: true, data: [] },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(
        <PriceChart 
          cryptoId="bitcoin"
          cryptoName="Bitcoin"
          cryptoSymbol="BTC"
          enableMultiView={false}
        />
      );

      expect(screen.getByText('No Chart Data')).toBeInTheDocument();
      expect(screen.getByText(/Price history data is not available/)).toBeInTheDocument();
    });

    it('calculates and displays price statistics correctly', () => {
      render(
        <PriceChart 
          cryptoId="bitcoin"
          cryptoName="Bitcoin"
          cryptoSymbol="BTC"
          enableMultiView={false}
        />
      );

      // Should calculate percentage change from first to last price
      // First price: 45000, Last price: 47000
      // Change: +4.44%
      expect(screen.getByText(/\+4.44%/)).toBeInTheDocument();
    });
  });

  describe('API Integration', () => {
    it('fetches price history with correct parameters', () => {
      render(
        <PriceChart 
          cryptoId="bitcoin"
          cryptoName="Bitcoin"
          cryptoSymbol="BTC"
          enableMultiView={false}
        />
      );

      expect(api.analytics.getPriceHistory.useQuery).toHaveBeenCalledWith({
        cryptoId: 'bitcoin',
        days: 30,
      });
    });

    it('does not fetch watched/held coins when multi-view is disabled', () => {
      render(
        <PriceChart 
          cryptoId="bitcoin"
          cryptoName="Bitcoin"
          cryptoSymbol="BTC"
          enableMultiView={false}
        />
      );

      expect(api.crypto.getWatchedCoins.useQuery).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({ enabled: false })
      );
      expect(api.crypto.getHeldCoins.useQuery).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({ enabled: false })
      );
    });

    it('fetches watched and held coins when multi-view is enabled', () => {
      render(
        <PriceChart 
          cryptoId="bitcoin"
          cryptoName="Bitcoin"
          cryptoSymbol="BTC"
          enableMultiView={true}
        />
      );

      expect(api.crypto.getWatchedCoins.useQuery).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({ enabled: true })
      );
      expect(api.crypto.getHeldCoins.useQuery).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({ enabled: true })
      );
    });
  });

  describe('Chart Visual Styling', () => {
    it('renders smooth curve chart without circle markers', () => {
      const { container } = render(
        <PriceChart 
          cryptoId="bitcoin"
          cryptoName="Bitcoin"
          cryptoSymbol="BTC"
          enableMultiView={false}
        />
      );

      // Check that SVG chart is rendered
      const svgElements = container.querySelectorAll('svg');
      expect(svgElements.length).toBeGreaterThan(0);

      // Check that smooth paths exist (using Q for quadratic bezier curves)
      const paths = container.querySelectorAll('path');
      expect(paths.length).toBeGreaterThan(0);

      // Check that NO circle elements exist (markers removed)
      const circles = container.querySelectorAll('circle');
      expect(circles.length).toBe(0);

      // Check that interactive hover areas exist (rect elements)
      const rects = container.querySelectorAll('rect');
      expect(rects.length).toBeGreaterThan(0);
    });

    it('renders gradient backgrounds for better aesthetics', () => {
      const { container } = render(
        <PriceChart 
          cryptoId="bitcoin"
          cryptoName="Bitcoin"
          cryptoSymbol="BTC"
          enableMultiView={false}
        />
      );

      // Check for gradient definitions in SVG
      const gradients = container.querySelectorAll('linearGradient');
      expect(gradients.length).toBeGreaterThan(0);

      // Check for gradient backgrounds on chart containers
      const chartContainers = container.querySelectorAll('.bg-gradient-to-br');
      expect(chartContainers.length).toBeGreaterThan(0);
    });

    it('renders horizontal grid lines for reference', () => {
      const { container } = render(
        <PriceChart 
          cryptoId="bitcoin"
          cryptoName="Bitcoin"
          cryptoSymbol="BTC"
          enableMultiView={false}
        />
      );

      // Check for grid lines (line elements in SVG)
      const lines = container.querySelectorAll('line');
      expect(lines.length).toBeGreaterThan(0);
    });

    it('renders improved price labels with backdrop blur', () => {
      render(
        <PriceChart 
          cryptoId="bitcoin"
          cryptoName="Bitcoin"
          cryptoSymbol="BTC"
          enableMultiView={false}
        />
      );

      // Price labels should have backdrop blur styling
      const labels = document.querySelectorAll('.backdrop-blur-sm');
      expect(labels.length).toBeGreaterThan(0);
    });
  });
});
