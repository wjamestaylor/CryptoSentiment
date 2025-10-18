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

// Mock tRPC
jest.mock('@/lib/trpc/provider', () => ({
  api: {
    crypto: {
      getUserCryptoTracking: {
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
  return function MockImage({ src, alt, ...props }: any) {
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
    } as any);

    // Default mock returns
    (api.crypto.getUserCryptoTracking.useQuery as jest.Mock).mockReturnValue({
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
      (api.crypto.getUserCryptoTracking.useQuery as jest.Mock).mockReturnValue({
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

      (api.crypto.getUserCryptoTracking.useQuery as jest.Mock).mockReturnValue({
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
});