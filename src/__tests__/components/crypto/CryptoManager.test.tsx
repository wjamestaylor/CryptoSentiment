/**
 * Tests for the unified CryptoManager component
 * This component replaces both watchlist and portfolio management
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { CryptoManager } from '@/components/crypto/CryptoManager';
import { api } from '@/lib/trpc/provider';

// Mock NextAuth
jest.mock('next-auth/react');
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

// Mock Feature Gating
jest.mock('@/components/feature-gating/FeatureGate', () => {
  return {
    FeatureGate: ({ children }: { children: React.ReactNode }) => <div data-testid="feature-gate">{children}</div>
  };
});

jest.mock('@/hooks/use-usage-limit', () => ({
  useUsageLimit: jest.fn(() => ({
    isWithinLimit: true,
    usageCount: 0,
    usageLimit: 10,
    isLoading: false
  }))
}));

jest.mock('@/hooks/use-track-usage', () => ({
  useTrackUsage: jest.fn(() => jest.fn())
}));

// Mock tRPC
jest.mock('@/lib/trpc/provider', () => ({
  api: {
    crypto: {
      getEnhancedCryptoTracking: {
        useQuery: jest.fn(),
      },
      searchCryptos: {
        useQuery: jest.fn(),
      },
      addCryptoToTracking: {
        useMutation: jest.fn(),
      },
      updateCryptoTracking: {
        useMutation: jest.fn(),
      },
      removeCryptoTracking: {
        useMutation: jest.fn(),
      },
    },
    alerts: {
      getUserAlerts: {
        useQuery: jest.fn(),
      },
      createAlert: {
        useMutation: jest.fn(),
      },
    },
  },
}));

// Mock useToast
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock Next.js components
jest.mock('next/image', () => {
  return function MockImage({ 
    src, 
    alt, 
    ...props 
  }: { 
    src: string; 
    alt: string; 
    [key: string]: unknown;
  }) {
    return <img src={src} alt={alt} {...props} />;
  };
});

describe('CryptoManager Component', () => {
  const mockSession = {
    user: {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
    },
    expires: '2024-12-31',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSession.mockReturnValue({ 
      data: mockSession, 
      status: 'authenticated',
      update: jest.fn(),
    });

    // Default mock returns
    (api.crypto.getEnhancedCryptoTracking.useQuery as jest.Mock).mockReturnValue({
      data: { 
        data: { 
          trackingEntries: [],
          summary: {
            totalTracked: 0,
            totalWatching: 0,
            totalHoldings: 0,
            totalInvested: 0,
          }
        }
      },
      isLoading: false,
      refetch: jest.fn(),
    });

    (api.crypto.searchCryptos.useQuery as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
    });

    (api.crypto.addCryptoToTracking.useMutation as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });

    (api.crypto.updateCryptoTracking.useMutation as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });

    (api.crypto.removeCryptoTracking.useMutation as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });

    // Alerts mock
    (api.alerts.getUserAlerts.useQuery as jest.Mock).mockReturnValue({
      data: { 
        success: true,
        alerts: [] 
      },
      isLoading: false,
      refetch: jest.fn(),
    });

    (api.alerts.createAlert.useMutation as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });
  });

  describe('Component Architecture', () => {
    it('renders unified crypto management component successfully', () => {
      render(<CryptoManager />);

      expect(screen.getByText('Crypto Manager')).toBeInTheDocument();
      expect(screen.getByText('Unified tracking for all your cryptocurrency interests')).toBeInTheDocument();
    });

    it('displays tracking counters for watching and holdings', () => {
      render(<CryptoManager />);
      
      // Use more specific selectors to target the header counters specifically
      const holdingsCounter = screen.getByText((content, element) => {
        return content === 'Holdings' && element?.tagName === 'P' && element?.className.includes('text-sm');
      });
      
      expect(screen.getByText('Watching')).toBeInTheDocument();
      expect(holdingsCounter).toBeInTheDocument();
    });

    it('has proper tab structure for overview and management', () => {
      render(<CryptoManager />);
      
      expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /manage/i })).toBeInTheDocument();
      
      // Overview tab should be active by default
      expect(screen.getByRole('tab', { name: /overview/i })).toHaveAttribute('data-state', 'active');
    });

    it('displays empty state when no cryptocurrencies are tracked', () => {
      render(<CryptoManager />);

      expect(screen.getByText('No tracked cryptocurrencies')).toBeInTheDocument();
      expect(screen.getByText('Start tracking cryptocurrencies to monitor prices and manage your portfolio')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Start Tracking' })).toBeInTheDocument();
    });

    it('shows loading state correctly', () => {
      (api.crypto.getEnhancedCryptoTracking.useQuery as jest.Mock).mockReturnValue({
        data: null,
        isLoading: true,
        refetch: jest.fn(),
      });

      render(<CryptoManager />);

      expect(screen.getByText('Crypto Manager')).toBeInTheDocument();
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('Unified Tracking Features', () => {
    it('demonstrates unified watchlist and portfolio management', () => {
      const mockTrackingData = [
        {
          id: 'tracking-1',
          isWatching: true,
          holdingAmount: null, // Watch only
          averagePurchasePrice: null,
          totalInvested: null,
          firstPurchaseDate: null,
          notes: null,
          tags: [],
          lastViewedAt: new Date(),
          addedAt: new Date(),
          crypto: {
            id: 'bitcoin',
            symbol: 'BTC',
            name: 'Bitcoin',
            coinGeckoId: 'bitcoin',
            logoUrl: null,
            marketCap: null,
            rank: null,
          },
        },
        {
          id: 'tracking-2',
          isWatching: true,
          holdingAmount: 1.5, // Has holdings
          averagePurchasePrice: 50000,
          totalInvested: 75000,
          firstPurchaseDate: new Date('2023-01-01'),
          notes: 'Long term hold',
          tags: ['DCA'],
          lastViewedAt: new Date(),
          addedAt: new Date(),
          crypto: {
            id: 'ethereum',
            symbol: 'ETH',
            name: 'Ethereum',
            coinGeckoId: 'ethereum',
            logoUrl: null,
            marketCap: null,
            rank: null,
          },
        },
      ];

      (api.crypto.getEnhancedCryptoTracking.useQuery as jest.Mock).mockReturnValue({
        data: { 
          data: { 
            trackingEntries: mockTrackingData,
            summary: {
              totalTracked: 2,
              totalWatching: 1,
              totalHoldings: 1,
              totalInvested: 75000,
            }
          }
        },
        isLoading: false,
        refetch: jest.fn(),
      });

      render(<CryptoManager />);

      // Should show both tracking types
      expect(screen.getByText('BTC')).toBeInTheDocument();
      expect(screen.getByText('Bitcoin')).toBeInTheDocument();
      expect(screen.getByText('ETH')).toBeInTheDocument();
      expect(screen.getByText('Ethereum')).toBeInTheDocument();

      // Should show holdings details for Ethereum
      expect(screen.getByText('1.5 coins')).toBeInTheDocument();
      expect(screen.getByText('Avg: $50,000')).toBeInTheDocument();
    });

    it('provides filter controls for different tracking types', () => {
      render(<CryptoManager />);

      expect(screen.getByRole('button', { name: /all tracked/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /watch only/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /holdings/i })).toBeInTheDocument();
    });
  });

  describe('Integration Architecture', () => {
    it('validates the unified component replaces separate watchlist and portfolio components', () => {
      render(<CryptoManager />);

      // Verify unified structure exists
      expect(screen.getByText('Crypto Manager')).toBeInTheDocument();
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getAllByRole('tab')).toHaveLength(2);
      
      // Verify it handles both watch-only and holdings scenarios
      expect(screen.getByText('Watching')).toBeInTheDocument();
      // Use more specific selector for Holdings counter text (not the button)
      const holdingsCounter = screen.getByText((content, element) => {
        return content === 'Holdings' && element?.tagName === 'P' && element?.className.includes('text-sm');
      });
      expect(holdingsCounter).toBeInTheDocument();
      
      // Verify management capabilities
      expect(screen.getByRole('tab', { name: /manage/i })).toBeInTheDocument();
    });
  });

  describe('Alert Integration Features', () => {
    it('displays alert indicators for cryptocurrencies with active alerts', () => {
      // Mock alerts for Bitcoin
      (api.alerts.getUserAlerts.useQuery as jest.Mock).mockReturnValue({
        data: { 
          success: true,
          alerts: [
            { 
              id: '1', 
              crypto: { symbol: 'BTC', name: 'Bitcoin' },
              name: 'BTC above $100,000',
              type: 'PRICE_CHANGE',
              isActive: true
            }
          ] 
        },
        isLoading: false,
        refetch: jest.fn(),
      });

      // Mock tracking data with Bitcoin
      (api.crypto.getEnhancedCryptoTracking.useQuery as jest.Mock).mockReturnValue({
        data: { 
          data: { 
            trackingEntries: [{
              id: '1',
              crypto: { symbol: 'BTC', name: 'Bitcoin' },
              currentPrice: 95000,
              priceChangePercentage24h: 5.2,
              holdingAmount: null,
            }],
            summary: {
              totalTracked: 1,
              totalWatching: 1,
              totalHoldings: 0,
              totalInvested: 0,
            }
          }
        },
        isLoading: false,
        refetch: jest.fn(),
      });

      render(<CryptoManager />);

      // Should display alert indicator badge
      expect(screen.getByText('1 alert')).toBeInTheDocument();
      expect(screen.getByText('PRICE_CHANGE Alert - BTC')).toBeInTheDocument();
    });

    it('shows quick alert creation buttons for tracked cryptocurrencies', () => {
      // Mock tracking data with current price
      (api.crypto.getEnhancedCryptoTracking.useQuery as jest.Mock).mockReturnValue({
        data: { 
          success: true,
          data: { 
            trackingEntries: [{
              id: '1',
              crypto: { symbol: 'BTC', name: 'Bitcoin' },
              currentPrice: 95000,
              priceChangePercentage24h: 5.2,
              holdingAmount: null,
            }],
            summary: {
              totalTracked: 1,
              totalWatching: 1,
              totalHoldings: 0,
              totalInvested: 0,
            }
          }
        },
        isLoading: false,
        refetch: jest.fn(),
      });

      render(<CryptoManager />);

      // Should show quick alert buttons (above and below current price)
      const alertButtons = screen.getAllByTitle(/create alert/i);
      expect(alertButtons).toHaveLength(2);
      expect(screen.getByTitle('Create alert above current price')).toBeInTheDocument();
      expect(screen.getByTitle('Create alert below current price')).toBeInTheDocument();
    });

    it('displays active alert details in crypto tracking items', () => {
      // Mock multiple alerts for Bitcoin
      (api.alerts.getUserAlerts.useQuery as jest.Mock).mockReturnValue({
        data: { 
          success: true,
          alerts: [
            { 
              id: '1', 
              crypto: { symbol: 'BTC', name: 'Bitcoin' },
              name: 'BTC above $100,000',
              type: 'PRICE_CHANGE',
              isActive: true
            },
            { 
              id: '2', 
              crypto: { symbol: 'BTC', name: 'Bitcoin' },
              name: 'BTC below $90,000',
              type: 'PRICE_CHANGE',
              isActive: true
            },
            { 
              id: '3', 
              crypto: { symbol: 'BTC', name: 'Bitcoin' },
              name: 'BTC momentum alert',
              type: 'VOLUME_SPIKE',
              isActive: true
            }
          ] 
        },
        isLoading: false,
        refetch: jest.fn(),
      });

      // Mock tracking data with Bitcoin
      (api.crypto.getEnhancedCryptoTracking.useQuery as jest.Mock).mockReturnValue({
        data: { 
          success: true,
          data: { 
            trackingEntries: [{
              id: '1',
              crypto: { symbol: 'BTC', name: 'Bitcoin' },
              currentPrice: 95000,
              priceChangePercentage24h: 5.2,
              holdingAmount: null,
            }],
            summary: {
              totalTracked: 1,
              totalWatching: 1,
              totalHoldings: 0,
              totalInvested: 0,
            }
          }
        },
        isLoading: false,
        refetch: jest.fn(),
      });

      render(<CryptoManager />);

      // Should show alert count badge
      expect(screen.getByText('3 alerts')).toBeInTheDocument();
      
      // Should show first 2 alerts inline (both happen to be PRICE_CHANGE in this test)
      const priceAlerts = screen.getAllByText('PRICE_CHANGE Alert - BTC');
      expect(priceAlerts).toHaveLength(2);
      
      // Should show "+1 more alerts" for the third alert
      expect(screen.getByText('+1 more alerts')).toBeInTheDocument();
    });
  });
});