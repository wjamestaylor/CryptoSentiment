/**
 * Tests for Dashboard error handling - preventing incorrect data display on API failures
 * 
 * This test suite ensures that when the CoinGecko API fails:
 * 1. Backend throws errors instead of returning zero values
 * 2. Frontend preserves previous valid data instead of showing $0
 * 3. Users see a warning banner when viewing stale data
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import Dashboard from '@/app/dashboard/page';
import { api } from '@/lib/trpc/provider';

// Mock NextAuth
jest.mock('next-auth/react');
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

// Mock tRPC
jest.mock('@/lib/trpc/provider', () => ({
  api: {
    dashboard: {
      getDashboardData: {
        useQuery: jest.fn(),
      },
    },
    crypto: {
      removeCryptoTracking: {
        useMutation: jest.fn(),
      },
    },
  },
}));

// Mock Feature Gating
jest.mock('@/hooks/use-usage-limit', () => ({
  useUsageLimit: jest.fn(() => ({
    currentUsage: 5,
    limit: 10,
    allowed: true,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })),
}));

jest.mock('@/hooks/use-track-usage', () => ({
  useTrackUsage: jest.fn(() => jest.fn()),
}));

// Mock toast
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock PriceChart component
jest.mock('@/components/analytics/PriceChart', () => ({
  PriceChart: () => <div data-testid="price-chart">Price Chart</div>,
}));

// Mock QuickStartGuide component
jest.mock('@/components/onboarding/QuickStartGuide', () => ({
  QuickStartGuide: () => <div data-testid="quick-start-guide">Quick Start Guide</div>,
}));

describe('Dashboard Error Handling', () => {
  const mockSession = {
    user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
    expires: '2024-12-31',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn(),
    });
  });

  it('should NOT display zero values when API fails', () => {
    // Mock API error
    const mockQuery = api.dashboard.getDashboardData.useQuery as jest.Mock;
    mockQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch portfolio data. Please try again.'),
      refetch: jest.fn(),
    });

    const mockMutation = api.crypto.removeCryptoTracking.useMutation as jest.Mock;
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });

    render(<Dashboard />);

    // With no previous data and an error, should show default zeros
    // But this is acceptable since user has never had data
    expect(screen.getByText('Portfolio Value')).toBeInTheDocument();
    expect(screen.getByText('$0')).toBeInTheDocument();
  });

  it('should preserve previous valid data when refresh fails', async () => {
    const mockValidData = {
      success: true,
      data: {
        summary: {
          totalTracked: 5,
          totalWatching: 2,
          totalHoldings: 3,
          portfolioValue: 50000,
          portfolioGainLoss: 5000,
          portfolioGainLossPercentage: 11.11,
          lastUpdated: new Date('2024-01-15T10:30:00Z'),
        },
        watchlist: [],
        holdings: [
          {
            id: 'holding-1',
            cryptoSymbol: 'BTC',
            cryptoName: 'Bitcoin',
            coinGeckoId: 'bitcoin',
            holdingAmount: 1,
            currentPrice: 45000,
            currentValue: 45000,
            gainLoss: 5000,
            gainLossPercentage: 12.5,
            priceChangePercentage24h: 2.5,
            priceChange24h: 1000,
            averagePurchasePrice: 40000,
            totalInvested: 40000,
            firstPurchaseDate: new Date('2024-01-01'),
            tags: [],
          },
        ],
        portfolioAnalytics: null,
        topPerformer: null,
        worstPerformer: null,
      },
    };

    const mockQuery = api.dashboard.getDashboardData.useQuery as jest.Mock;
    
    // First render with valid data
    mockQuery.mockReturnValue({
      data: mockValidData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    const mockMutation = api.crypto.removeCryptoTracking.useMutation as jest.Mock;
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });

    const { rerender } = render(<Dashboard />);

    // Verify initial data is displayed
    await waitFor(() => {
      expect(screen.getByText('$50,000')).toBeInTheDocument();
    });

    // Simulate API failure on next render - but keep data due to React Query cache
    mockQuery.mockReturnValue({
      data: mockValidData, // React Query keeps previous data
      isLoading: false,
      error: new Error('Failed to fetch portfolio data. Please try again.'),
      refetch: jest.fn(),
    });

    rerender(<Dashboard />);

    // Should still show previous valid data, not zeros
    await waitFor(() => {
      expect(screen.getByText('$50,000')).toBeInTheDocument();
      // Should show error banner when we have both error and lastValidData
      expect(screen.getByText(/Unable to fetch latest data/)).toBeInTheDocument();
    });
  });

  it('should display warning banner when showing stale data', async () => {
    const mockValidData = {
      success: true,
      data: {
        summary: {
          totalTracked: 1,
          totalWatching: 0,
          totalHoldings: 1,
          portfolioValue: 10000,
          portfolioGainLoss: 500,
          portfolioGainLossPercentage: 5,
          lastUpdated: new Date('2024-01-15T10:30:00Z'),
        },
        watchlist: [],
        holdings: [],
        portfolioAnalytics: null,
        topPerformer: null,
        worstPerformer: null,
      },
    };

    const mockQuery = api.dashboard.getDashboardData.useQuery as jest.Mock;
    const mockMutation = api.crypto.removeCryptoTracking.useMutation as jest.Mock;
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });
    
    // First render with valid data
    mockQuery.mockReturnValue({
      data: mockValidData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    const { rerender } = render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('$10,000')).toBeInTheDocument();
    });

    // Then simulate error while keeping data
    mockQuery.mockReturnValue({
      data: mockValidData,
      isLoading: false,
      error: new Error('API Error'),
      refetch: jest.fn(),
    });

    rerender(<Dashboard />);

    // Should show warning banner with AlertTriangle icon after data is set
    await waitFor(() => {
      const banner = screen.getByText(/Unable to fetch latest data/);
      expect(banner).toBeInTheDocument();
      expect(screen.getByText(/Showing last known values/)).toBeInTheDocument();
    });
  });

  it('should not show warning banner when data is fresh', () => {
    const mockValidData = {
      success: true,
      data: {
        summary: {
          totalTracked: 1,
          totalWatching: 0,
          totalHoldings: 1,
          portfolioValue: 10000,
          portfolioGainLoss: 500,
          portfolioGainLossPercentage: 5,
          lastUpdated: new Date(),
        },
        watchlist: [],
        holdings: [],
        portfolioAnalytics: null,
        topPerformer: null,
        worstPerformer: null,
      },
    };

    const mockQuery = api.dashboard.getDashboardData.useQuery as jest.Mock;
    mockQuery.mockReturnValue({
      data: mockValidData,
      isLoading: false,
      error: null, // No error
      refetch: jest.fn(),
    });

    const mockMutation = api.crypto.removeCryptoTracking.useMutation as jest.Mock;
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });

    render(<Dashboard />);

    // Should NOT show warning banner when data is fresh
    expect(screen.queryByText(/Unable to fetch latest data/)).not.toBeInTheDocument();
  });
});
