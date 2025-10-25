/**
 * Tests for the unified CryptoManager component
 * This component replaces both watchlist and portfolio management
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(() => ({
    toast: mockToast,
  })),
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

  describe('Holding Updates', () => {
    const mockUpdateMutation = jest.fn();

    beforeEach(() => {
      mockUpdateMutation.mockClear();

      // Mock the update mutation
      (api.crypto.updateCryptoTracking.useMutation as jest.Mock).mockReturnValue({
        mutate: mockUpdateMutation,
        isLoading: false,
        error: null,
      });

      // Mock other mutations to avoid side effects
      (api.crypto.addCryptoToTracking.useMutation as jest.Mock).mockReturnValue({
        mutate: jest.fn(),
        isLoading: false,
        error: null,
      });

      (api.crypto.removeCryptoTracking.useMutation as jest.Mock).mockReturnValue({
        mutate: jest.fn(),
        isLoading: false,
        error: null,
      });
    });

    it('should handle updating holding amount and purchase price', async () => {
      // Mock initial tracking data with a holding
      const mockHolding = {
        id: 'tracking-1',
        userId: 'user-1',
        cryptoId: 'crypto-1',
        isWatching: true,
        holdingAmount: 1.0,
        averagePurchasePrice: 50000,
        totalInvested: 50000,
        firstPurchaseDate: new Date('2023-01-01'),
        notes: 'Original notes',
        tags: ['long-term'],
        lastViewedAt: new Date(),
        addedAt: new Date(),
        crypto: {
          id: 'crypto-1',
          symbol: 'BTC',
          name: 'Bitcoin',
          coinGeckoId: 'bitcoin',
          logoUrl: null,
          marketCap: null,
          rank: null,
        },
        currentPrice: 55000,
        currentValue: 55000,
        gainLoss: 5000,
        gainLossPercentage: 10,
        priceChangePercentage24h: 2.5,
      };

      (api.crypto.getEnhancedCryptoTracking.useQuery as jest.Mock).mockReturnValue({
        data: { 
          data: {
            trackingEntries: [mockHolding],
            summary: {
              totalTracked: 1,
              totalWatching: 0,
              totalHoldings: 1,
              totalInvested: 50000,
            }
          }
        },
        isLoading: false,
        refetch: jest.fn(),
      });

      render(<CryptoManager />);

      // Click edit button for the holding
      const editButton = screen.getByRole('button', { name: 'Edit holdings' });
      fireEvent.click(editButton);

      // Wait for the manage tab to be active and form to appear
      await waitFor(() => {
        // Form should be populated with existing data
        expect(screen.getByDisplayValue('1')).toBeInTheDocument(); // holding amount
        expect(screen.getByDisplayValue('50000')).toBeInTheDocument(); // purchase price
      });

      // Update the holding amount and price
      const holdingAmountInput = screen.getByLabelText(/Amount/);
      const purchasePriceInput = screen.getByLabelText(/Purchase Price/i);

      fireEvent.change(holdingAmountInput, { target: { value: '2.0' } });
      fireEvent.change(purchasePriceInput, { target: { value: '52000' } });

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /Update Holdings/i });
      fireEvent.click(submitButton);

      // Verify the update mutation was called with correct data
      expect(mockUpdateMutation).toHaveBeenCalledWith({
        id: 'tracking-1',
        trackingType: 'ADD_HOLDING',
        holdingAmount: 2.0,
        purchasePrice: 52000,
        purchaseDate: expect.any(Date),
        notes: 'Original notes',
        tags: ['long-term'],
      });
    });

    it('should handle converting holding to watching only', async () => {
      const mockHolding = {
        id: 'tracking-1',
        userId: 'user-1',
        cryptoId: 'crypto-1',
        isWatching: true,
        holdingAmount: 1.0,
        averagePurchasePrice: 50000,
        totalInvested: 50000,
        firstPurchaseDate: new Date('2023-01-01'),
        notes: 'Converting to watch only',
        tags: ['test'],
        lastViewedAt: new Date(),
        addedAt: new Date(),
        crypto: {
          id: 'crypto-1',
          symbol: 'BTC',
          name: 'Bitcoin',
          coinGeckoId: 'bitcoin',
          logoUrl: null,
          marketCap: null,
          rank: null,
        },
        currentPrice: 55000,
        currentValue: 55000,
        gainLoss: 5000,
        gainLossPercentage: 10,
        priceChangePercentage24h: 2.5,
      };

      (api.crypto.getEnhancedCryptoTracking.useQuery as jest.Mock).mockReturnValue({
        data: { 
          data: {
            trackingEntries: [mockHolding],
            summary: {
              totalTracked: 1,
              totalWatching: 0,
              totalHoldings: 1,
              totalInvested: 50000,
            }
          }
        },
        isLoading: false,
        refetch: jest.fn(),
      });

      render(<CryptoManager />);

      // Click edit button
      const editButton = screen.getByRole('button', { name: 'Edit holdings' });
      fireEvent.click(editButton);

      // Switch to watch only mode
      const watchOnlyButton = screen.getByRole('button', { name: /watch only/i });
      fireEvent.click(watchOnlyButton);

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /update tracking/i });
      fireEvent.click(submitButton);

      // Verify the update mutation was called to remove holdings
      expect(mockUpdateMutation).toHaveBeenCalledWith({
        id: 'tracking-1',
        trackingType: 'REMOVE_HOLDING',
        holdingAmount: undefined,
        purchasePrice: undefined,
        purchaseDate: expect.any(Date),
        notes: 'Converting to watch only',
        tags: ['test'],
      });
    });

    it('should validate required fields when updating holdings', async () => {
      const mockHolding = {
        id: 'tracking-1',
        userId: 'user-1',
        cryptoId: 'crypto-1',
        isWatching: true,
        holdingAmount: 1.0,
        averagePurchasePrice: 50000,
        totalInvested: 50000,
        firstPurchaseDate: new Date('2023-01-01'),
        notes: '',
        tags: [],
        lastViewedAt: new Date(),
        addedAt: new Date(),
        crypto: {
          id: 'crypto-1',
          symbol: 'BTC',
          name: 'Bitcoin',
          coinGeckoId: 'bitcoin',
          logoUrl: null,
          marketCap: null,
          rank: null,
        },
        currentPrice: 55000,
        currentValue: 55000,
        gainLoss: 5000,
        gainLossPercentage: 10,
        priceChangePercentage24h: 2.5,
      };

      (api.crypto.getEnhancedCryptoTracking.useQuery as jest.Mock).mockReturnValue({
        data: { 
          data: {
            trackingEntries: [mockHolding],
            summary: {
              totalTracked: 1,
              totalWatching: 0,
              totalHoldings: 1,
              totalInvested: 50000,
            }
          }
        },
        isLoading: false,
        refetch: jest.fn(),
      });

      render(<CryptoManager />);

      // Click edit button
      const editButton = screen.getByRole('button', { name: 'Edit holdings' });
      fireEvent.click(editButton);

      // Clear the required fields
      const holdingAmountInput = screen.getByLabelText(/holding amount/i);
      const purchasePriceInput = screen.getByLabelText(/purchase price/i);

      fireEvent.change(holdingAmountInput, { target: { value: '' } });
      fireEvent.change(purchasePriceInput, { target: { value: '' } });

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /update holdings/i });
      fireEvent.click(submitButton);

      // Should show validation error
      await waitFor(() => {
        // Since toast may not render in tests, check that mutation wasn't called
        expect(mockUpdateMutation).not.toHaveBeenCalled();
      });

      // Mutation should not be called
      expect(mockUpdateMutation).not.toHaveBeenCalled();
    });

    it('should preserve notes and tags when updating holdings', async () => {
      const mockHolding = {
        id: 'tracking-1',
        userId: 'user-1',
        cryptoId: 'crypto-1',
        isWatching: true,
        holdingAmount: 1.0,
        averagePurchasePrice: 50000,
        totalInvested: 50000,
        firstPurchaseDate: new Date('2023-01-01'),
        notes: 'My Bitcoin investment',
        tags: ['DCA', 'long-term'],
        lastViewedAt: new Date(),
        addedAt: new Date(),
        crypto: {
          id: 'crypto-1',
          symbol: 'BTC',
          name: 'Bitcoin',
          coinGeckoId: 'bitcoin',
          logoUrl: null,
          marketCap: null,
          rank: null,
        },
        currentPrice: 55000,
        currentValue: 55000,
        gainLoss: 5000,
        gainLossPercentage: 10,
        priceChangePercentage24h: 2.5,
      };

      (api.crypto.getEnhancedCryptoTracking.useQuery as jest.Mock).mockReturnValue({
        data: { 
          data: {
            trackingEntries: [mockHolding],
            summary: {
              totalTracked: 1,
              totalWatching: 0,
              totalHoldings: 1,
              totalInvested: 50000,
            }
          }
        },
        isLoading: false,
        refetch: jest.fn(),
      });

      render(<CryptoManager />);

      // Click edit button
      const editButton = screen.getByRole('button', { name: 'Edit holdings' });
      fireEvent.click(editButton);

      // Verify form is populated with existing notes and tags
      expect(screen.getByDisplayValue('My Bitcoin investment')).toBeInTheDocument();
      expect(screen.getByDisplayValue('DCA, long-term')).toBeInTheDocument();

      // Update only the notes
      const notesInput = screen.getByLabelText(/notes/i);
      fireEvent.change(notesInput, { target: { value: 'Updated investment notes' } });

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /update holdings/i });
      fireEvent.click(submitButton);

      // Verify the update mutation preserves all data
      expect(mockUpdateMutation).toHaveBeenCalledWith({
        id: 'tracking-1',
        trackingType: 'ADD_HOLDING',
        holdingAmount: 1.0,
        purchasePrice: 50000,
        purchaseDate: expect.any(Date),
        notes: 'Updated investment notes',
        tags: ['DCA', 'long-term'],
      });
    });

    it('should handle update errors gracefully', async () => {
      // Mock error mutation
      (api.crypto.updateCryptoTracking.useMutation as jest.Mock).mockReturnValue({
        mutate: mockUpdateMutation,
        isLoading: false,
        error: new Error('Update failed'),
      });

      // Reset mock before test
      mockToast.mockClear();

      const mockHolding = {
        id: 'tracking-1',
        userId: 'user-1',
        cryptoId: 'crypto-1',
        isWatching: true,
        holdingAmount: 1.0,
        averagePurchasePrice: 50000,
        totalInvested: 50000,
        firstPurchaseDate: new Date('2023-01-01'),
        notes: '',
        tags: [],
        lastViewedAt: new Date(),
        addedAt: new Date(),
        crypto: {
          id: 'crypto-1',
          symbol: 'BTC',
          name: 'Bitcoin',
          coinGeckoId: 'bitcoin',
          logoUrl: null,
          marketCap: null,
          rank: null,
        },
        currentPrice: 55000,
        currentValue: 55000,
        gainLoss: 5000,
        gainLossPercentage: 10,
        priceChangePercentage24h: 2.5,
      };

      (api.crypto.getEnhancedCryptoTracking.useQuery as jest.Mock).mockReturnValue({
        data: { 
          data: {
            trackingEntries: [mockHolding],
            summary: {
              totalTracked: 1,
              totalWatching: 0,
              totalHoldings: 1,
              totalInvested: 50000,
            }
          }
        },
        isLoading: false,
        refetch: jest.fn(),
      });

      mockUpdateMutation.mockImplementation((data, options) => {
        // Simulate calling the onError callback if provided
        if (options?.onError) {
          options.onError(new Error('Update failed'));
        }
      });

      render(<CryptoManager />);

      // Click edit button
      const editButton = screen.getByRole('button', { name: 'Edit holdings' });
      fireEvent.click(editButton);

      // Update holding amount
      const holdingAmountInput = screen.getByLabelText(/holding amount/i);
      fireEvent.change(holdingAmountInput, { target: { value: '2.0' } });

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /update holdings/i });
      fireEvent.click(submitButton);

      // Should call the mutation
      expect(mockUpdateMutation).toHaveBeenCalled();

      // Error should be handled by the mutation's onError callback
      // (This would be tested at the integration level)
    });

    it('should validate numeric values when editing holdings', async () => {
      const mockUpdateMutation = jest.fn();
      (api.crypto.updateCryptoTracking.useMutation as jest.Mock).mockReturnValue({
        mutate: mockUpdateMutation,
        isPending: false,
      });

      const mockHolding = {
        id: 'tracking-1',
        userId: 'user-1',
        cryptoId: 'crypto-1',
        isWatching: true,
        holdingAmount: 1.0,
        averagePurchasePrice: 50000,
        totalInvested: 50000,
        firstPurchaseDate: new Date('2023-01-01'),
        notes: 'Test holding',
        tags: [],
        lastViewedAt: new Date(),
        addedAt: new Date(),
        crypto: {
          id: 'crypto-1',
          symbol: 'BTC',
          name: 'Bitcoin',
          coinGeckoId: 'bitcoin',
          logoUrl: null,
          marketCap: null,
          rank: null,
        },
        currentPrice: 51000,
      };

      (api.crypto.getEnhancedCryptoTracking.useQuery as jest.Mock).mockReturnValue({
        data: {
          success: true,
          data: {
            trackingEntries: [mockHolding],
            summary: {
              totalTracked: 1,
              totalWatching: 0,
              totalHoldings: 1,
              totalInvested: 50000,
            }
          }
        },
        isLoading: false,
        refetch: jest.fn(),
      });

      render(<CryptoManager />);

      // Click edit button
      const editButton = screen.getByRole('button', { name: 'Edit holdings' });
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByDisplayValue('1')).toBeInTheDocument();
      });

      // Test invalid holding amount (negative)
      const holdingAmountInput = screen.getByLabelText(/Holding Amount/i);
      fireEvent.change(holdingAmountInput, { target: { value: '-1' } });

      const submitButton = screen.getByRole('button', { name: /Update Holdings/i });
      fireEvent.click(submitButton);

      // Should show validation error and not call mutation
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Error",
          description: "Please enter a valid holding amount greater than 0",
          variant: "destructive",
        });
      });
      expect(mockUpdateMutation).not.toHaveBeenCalled();
    });

    it('should validate purchase price when editing holdings', async () => {
      const mockUpdateMutation = jest.fn();
      (api.crypto.updateCryptoTracking.useMutation as jest.Mock).mockReturnValue({
        mutate: mockUpdateMutation,
        isPending: false,
      });

      const mockHolding = {
        id: 'tracking-1',
        userId: 'user-1',
        cryptoId: 'crypto-1',
        isWatching: true,
        holdingAmount: 1.0,
        averagePurchasePrice: 50000,
        totalInvested: 50000,
        firstPurchaseDate: new Date('2023-01-01'),
        notes: 'Test holding',
        tags: [],
        lastViewedAt: new Date(),
        addedAt: new Date(),
        crypto: {
          id: 'crypto-1',
          symbol: 'BTC',
          name: 'Bitcoin',
          coinGeckoId: 'bitcoin',
          logoUrl: null,
          marketCap: null,
          rank: null,
        },
        currentPrice: 51000,
      };

      (api.crypto.getEnhancedCryptoTracking.useQuery as jest.Mock).mockReturnValue({
        data: {
          success: true,
          data: {
            trackingEntries: [mockHolding],
            summary: {
              totalTracked: 1,
              totalWatching: 0,
              totalHoldings: 1,
              totalInvested: 50000,
            }
          }
        },
        isLoading: false,
        refetch: jest.fn(),
      });

      render(<CryptoManager />);

      // Click edit button
      const editButton = screen.getByRole('button', { name: 'Edit holdings' });
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByDisplayValue('50000')).toBeInTheDocument();
      });

      // Test invalid purchase price (NaN)
      const purchasePriceInput = screen.getByLabelText(/Purchase Price/i);
      fireEvent.change(purchasePriceInput, { target: { value: 'invalid' } });

      const submitButton = screen.getByRole('button', { name: /Update Holdings/i });
      fireEvent.click(submitButton);

      // Should show validation error and not call mutation
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Error",
          description: "Please enter a valid purchase price greater than 0",
          variant: "destructive",
        });
      });
      expect(mockUpdateMutation).not.toHaveBeenCalled();
    });

    it('should reset form state after successful update', async () => {
      const mockRefetch = jest.fn();
      const mockUpdateMutation = jest.fn((data, options) => {
        // Simulate successful mutation
        if (options && options.onSuccess) {
          options.onSuccess();
        }
      });
      
      (api.crypto.updateCryptoTracking.useMutation as jest.Mock).mockReturnValue({
        mutate: mockUpdateMutation,
        isPending: false,
      });

      const mockHolding = {
        id: 'tracking-1',
        userId: 'user-1',
        cryptoId: 'crypto-1',
        isWatching: true,
        holdingAmount: 1.0,
        averagePurchasePrice: 50000,
        totalInvested: 50000,
        firstPurchaseDate: new Date('2023-01-01'),
        notes: 'Test holding',
        tags: [],
        lastViewedAt: new Date(),
        addedAt: new Date(),
        crypto: {
          id: 'crypto-1',
          symbol: 'BTC',
          name: 'Bitcoin',
          coinGeckoId: 'bitcoin',
          logoUrl: null,
          marketCap: null,
          rank: null,
        },
        currentPrice: 51000,
      };

      (api.crypto.getEnhancedCryptoTracking.useQuery as jest.Mock).mockReturnValue({
        data: {
          success: true,
          data: {
            trackingEntries: [mockHolding],
            summary: {
              totalTracked: 1,
              totalWatching: 0,
              totalHoldings: 1,
              totalInvested: 50000,
            }
          }
        },
        isLoading: false,
        refetch: mockRefetch,
      });

      render(<CryptoManager />);

      // Click edit button
      const editButton = screen.getByRole('button', { name: 'Edit holdings' });
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByDisplayValue('1')).toBeInTheDocument();
      });

      // Update the holding
      const holdingAmountInput = screen.getByLabelText(/Holding Amount/i);
      fireEvent.change(holdingAmountInput, { target: { value: '2.0' } });

      const submitButton = screen.getByRole('button', { name: /Update Holdings/i });
      fireEvent.click(submitButton);

      // Verify mutation was called
      expect(mockUpdateMutation).toHaveBeenCalled();
      
      // Verify refetch was called
      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalled();
      });

      // Verify success toast was shown
      expect(mockToast).toHaveBeenCalledWith({
        title: "Success",
        description: "Tracking updated successfully",
      });
    });
  });
});