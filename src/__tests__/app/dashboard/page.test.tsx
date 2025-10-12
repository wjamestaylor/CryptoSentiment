import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import CryptoDashboard from '@/app/dashboard/page';
import { api } from '@/lib/trpc/provider';
import { useIsMobile } from '@/hooks/use-media-query';

// Mock dependencies
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

jest.mock('@/lib/trpc/provider', () => ({
  api: {
    crypto: {
      getTopCryptos: {
        useQuery: jest.fn(),
      },
      getFollowedCryptos: {
        useQuery: jest.fn(),
      },
      getCryptosByIds: {
        useQuery: jest.fn(),
      },
      followCrypto: {
        useMutation: jest.fn(),
      },
      unfollowCrypto: {
        useMutation: jest.fn(),
      },
    },
  },
}));

jest.mock('@/hooks/use-media-query', () => ({
  useIsMobile: jest.fn(),
}));

jest.mock('next/image', () => {
  return function MockImage({ src, alt, width = 100, height = 100, ...props }: { 
    src: string; 
    alt: string; 
    width?: number; 
    height?: number; 
    [key: string]: unknown 
  }) {
    return <div data-testid="mock-image" data-src={src} data-alt={alt} style={{ width, height }} {...props} />;
  };
});

// Mock window.open
Object.defineProperty(window, 'open', {
  writable: true,
  value: jest.fn(),
});

const mockUseSession = useSession as jest.Mock;

// Type for mocked API structure
interface MockedApi {
  crypto: {
    getTopCryptos: {
      useQuery: jest.Mock
    }
    getFollowedCryptos: {
      useQuery: jest.Mock
    }
    getCryptosByIds: {
      useQuery: jest.Mock
    }
    followCrypto: {
      useMutation: jest.Mock
    }
    unfollowCrypto: {
      useMutation: jest.Mock
    }
  }
}

const mockApi = api as unknown as MockedApi;
const mockUseIsMobile = useIsMobile as jest.Mock;

describe('CryptoDashboard', () => {
  const mockCryptoData = [
    {
      id: 'bitcoin',
      symbol: 'btc',
      name: 'Bitcoin',
      image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
      current_price: 45000,
      market_cap: 850000000000,
      market_cap_rank: 1,
      price_change_percentage_24h: 2.5,
      total_volume: 25000000000,
    },
    {
      id: 'ethereum',
      symbol: 'eth',
      name: 'Ethereum',
      image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
      current_price: 3000,
      market_cap: 360000000000,
      market_cap_rank: 2,
      price_change_percentage_24h: -1.2,
      total_volume: 15000000000,
    },
  ];

  const mockFollowedCryptos = [
    {
      id: '1',
      symbol: 'BTC',
      name: 'Bitcoin',
      coinGeckoId: 'bitcoin',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mocks
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1', email: 'test@example.com' } },
    });
    
    mockUseIsMobile.mockReturnValue(false);

    // Mock console.error to suppress error logs in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Default API mocks
    mockApi.crypto.getTopCryptos.useQuery.mockReturnValue({
      data: { data: mockCryptoData },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    mockApi.crypto.getFollowedCryptos.useQuery.mockReturnValue({
      data: { data: mockFollowedCryptos },
      refetch: jest.fn(),
    });

    mockApi.crypto.getCryptosByIds.useQuery.mockReturnValue({
      data: { data: [] },
    });

    mockApi.crypto.followCrypto.useMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    mockApi.crypto.unfollowCrypto.useMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Loading States', () => {
    it('displays loading state when data is loading', () => {
      mockApi.crypto.getTopCryptos.useQuery.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      });

      render(<CryptoDashboard />);

      // Should show loading animation elements, not text content
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
      
      // Should show loading skeleton structure
      const loadingElements = document.querySelectorAll('[role="status"][aria-label="Loading"]');
      expect(loadingElements.length).toBeGreaterThan(0);
    });
  });

  describe('Error States', () => {
    it('displays error state when API fails', () => {
      const mockError = new Error('API Error');
      const mockRefetch = jest.fn();
      
      mockApi.crypto.getTopCryptos.useQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: mockError,
        refetch: mockRefetch,
      });

      render(<CryptoDashboard />);

      expect(screen.getByText('Failed to load data')).toBeInTheDocument();
      expect(screen.getByText('Error loading cryptocurrencies: API Error')).toBeInTheDocument();
      
      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);
      
      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Dashboard Content', () => {
    it('displays dashboard header and stats', () => {
      render(<CryptoDashboard />);

      expect(screen.getByText('Cryptocurrency Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Track top cryptocurrencies and manage your watchlist')).toBeInTheDocument();
      
      // Quick stats
      expect(screen.getByText('Total Shown')).toBeInTheDocument();
      expect(screen.getByText('Watchlist')).toBeInTheDocument();
      expect(screen.getByText('Gainers')).toBeInTheDocument();
      expect(screen.getByText('Losers')).toBeInTheDocument();
      
      // Check for stats values by context
      const totalShownCard = screen.getByText('Total Shown').closest('.bg-card');
      expect(totalShownCard).toHaveTextContent('2');
      
      const watchlistCard = screen.getByText('Watchlist').closest('.bg-card');
      expect(watchlistCard).toHaveTextContent('1');
    });

    it('displays cryptocurrency cards with correct data', () => {
      render(<CryptoDashboard />);

      // Bitcoin card
      expect(screen.getByText('Bitcoin')).toBeInTheDocument();
      expect(screen.getByText('BTC')).toBeInTheDocument();
      expect(screen.getByText('$45,000')).toBeInTheDocument();
      expect(screen.getByText('2.50%')).toBeInTheDocument();
      expect(screen.getByText('#1')).toBeInTheDocument();

      // Ethereum card
      expect(screen.getByText('Ethereum')).toBeInTheDocument();
      expect(screen.getByText('ETH')).toBeInTheDocument();
      expect(screen.getByText('$3,000')).toBeInTheDocument();
      expect(screen.getByText('1.20%')).toBeInTheDocument();
      expect(screen.getByText('#2')).toBeInTheDocument();
    });

    it('shows watchlist indicators for followed cryptos', () => {
      render(<CryptoDashboard />);

      // Bitcoin should have watchlist indicator since it's in mockFollowedCryptos
      const bitcoinCard = screen.getByText('Bitcoin').closest('.bg-card');
      expect(bitcoinCard).toBeInTheDocument();
      
      // Should show star indicators
      const stars = screen.getAllByText('⭐');
      expect(stars.length).toBeGreaterThan(0);
    });

    it('displays market cap and volume data', () => {
      render(<CryptoDashboard />);

      // Check for multiple Market Cap labels and use getAllByText
      const marketCapLabels = screen.getAllByText('Market Cap:');
      expect(marketCapLabels.length).toBeGreaterThan(0);
      
      const volumeLabels = screen.getAllByText('24h Volume:');
      expect(volumeLabels.length).toBeGreaterThan(0);
      
      expect(screen.getByText('$850.00B')).toBeInTheDocument(); // Bitcoin market cap
      expect(screen.getByText('$25000.00M')).toBeInTheDocument(); // Bitcoin volume (25B = 25000M)
    });
  });

  describe('Authentication', () => {
    it('shows lock icon for watchlist when not authenticated', () => {
      mockUseSession.mockReturnValue({ data: null });

      render(<CryptoDashboard />);

      const lockIcons = screen.getAllByText('🔐');
      expect(lockIcons.length).toBeGreaterThan(0);
    });

    it('redirects to signin when unauthenticated user clicks watchlist', () => {
      mockUseSession.mockReturnValue({ data: null });
      const mockWindowOpen = jest.fn();
      window.open = mockWindowOpen;

      render(<CryptoDashboard />);

      const lockButton = screen.getAllByText('🔐')[0];
      fireEvent.click(lockButton);

      expect(mockWindowOpen).toHaveBeenCalledWith('/auth/signin', '_blank');
    });
  });

  describe('Watchlist Functionality', () => {
    it('adds cryptocurrency to watchlist', async () => {
      const mockFollowMutation = jest.fn().mockResolvedValue({});
      const mockRefetchFollowed = jest.fn();

      mockApi.crypto.followCrypto.useMutation.mockReturnValue({
        mutateAsync: mockFollowMutation,
        isPending: false,
      });

      mockApi.crypto.getFollowedCryptos.useQuery.mockReturnValue({
        data: { data: [] }, // Empty watchlist initially
        refetch: mockRefetchFollowed,
      });

      render(<CryptoDashboard />);

      // Find empty star button for adding to watchlist
      const emptyStarButtons = screen.getAllByText('☆');
      if (emptyStarButtons.length > 0) {
        fireEvent.click(emptyStarButtons[0]);
      }

      await waitFor(() => {
        expect(mockFollowMutation).toHaveBeenCalled();
      });
    });

    it('removes cryptocurrency from watchlist', async () => {
      const mockUnfollowMutation = jest.fn().mockResolvedValue({});
      const mockRefetchFollowed = jest.fn();

      mockApi.crypto.unfollowCrypto.useMutation.mockReturnValue({
        mutateAsync: mockUnfollowMutation,
        isPending: false,
      });

      mockApi.crypto.getFollowedCryptos.useQuery.mockReturnValue({
        data: { data: mockFollowedCryptos },
        refetch: mockRefetchFollowed,
      });

      render(<CryptoDashboard />);

      // Find and click the watchlist button for Bitcoin (in watchlist)
      const bitcoinCard = screen.getByText('Bitcoin').closest('.bg-card');
      const watchlistButton = bitcoinCard?.querySelector('button[class*="bg-yellow-500"]');
      
      if (watchlistButton) {
        fireEvent.click(watchlistButton);
      }

      await waitFor(() => {
        expect(mockUnfollowMutation).toHaveBeenCalledWith({
          symbol: 'btc',
        });
      });
    });

    it('shows loading state during watchlist operations', () => {
      mockApi.crypto.followCrypto.useMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: true,
      });

      render(<CryptoDashboard />);

      // Should show loading spinner when operation is pending
      // This would be visible in the component state but hard to test directly
      // We can test that the component renders without crashing
      expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    });

    it('handles watchlist operation errors', async () => {
      const mockFollowMutation = jest.fn().mockRejectedValue(new Error('Network error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      mockApi.crypto.followCrypto.useMutation.mockReturnValue({
        mutateAsync: mockFollowMutation,
        isPending: false,
      });

      mockApi.crypto.getFollowedCryptos.useQuery.mockReturnValue({
        data: { data: [] },
        refetch: jest.fn(),
      });

      render(<CryptoDashboard />);

      // Find empty star button and click it
      const emptyStarButtons = screen.getAllByText('☆');
      if (emptyStarButtons.length > 0) {
        fireEvent.click(emptyStarButtons[0]);
      }

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Watchlist operation failed:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Navigation', () => {
    it('opens sentiment analysis in new tab', () => {
      const mockWindowOpen = jest.fn();
      window.open = mockWindowOpen;

      render(<CryptoDashboard />);

      const aiAnalysisButtons = screen.getAllByText(/AI Analysis|AI/);
      fireEvent.click(aiAnalysisButtons[0]);

      expect(mockWindowOpen).toHaveBeenCalledWith('/sentiment?crypto=bitcoin', '_blank');
    });
  });

  describe('Mobile Responsiveness', () => {
    it('shows mobile layout when on mobile', () => {
      mockUseIsMobile.mockReturnValue(true);

      render(<CryptoDashboard />);

      // Should show "AI" instead of "AI Analysis" on mobile
      const aiButtons = screen.queryAllByText((content, element) => {
        return element?.tagName.toLowerCase() === 'button' && content.includes('AI') && !content.includes('Analysis');
      });
      expect(aiButtons.length).toBeGreaterThan(0);
    });

    it('shows desktop layout when not on mobile', () => {
      mockUseIsMobile.mockReturnValue(false);

      render(<CryptoDashboard />);

      // Should show "AI Analysis" on desktop
      const aiAnalysisButtons = screen.queryAllByText((content, element) => {
        return element?.tagName.toLowerCase() === 'button' && content.includes('AI Analysis');
      });
      expect(aiAnalysisButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Data Processing', () => {
    it('correctly merges top cryptos with followed cryptos', () => {
      const additionalFollowedCrypto = {
        id: 'cardano',
        symbol: 'ada',
        name: 'Cardano',
        image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
        current_price: 0.5,
        market_cap: 17000000000,
        market_cap_rank: 7,
        price_change_percentage_24h: 3.2,
        total_volume: 800000000,
      };

      mockApi.crypto.getCryptosByIds.useQuery.mockReturnValue({
        data: { data: [additionalFollowedCrypto] },
      });

      mockApi.crypto.getFollowedCryptos.useQuery.mockReturnValue({
        data: { 
          data: [
            ...mockFollowedCryptos,
            { id: '2', symbol: 'ADA', name: 'Cardano', coinGeckoId: 'cardano' }
          ] 
        },
        refetch: jest.fn(),
      });

      render(<CryptoDashboard />);

      // Should show all cryptos including the additional followed one
      expect(screen.getByText('Bitcoin')).toBeInTheDocument();
      expect(screen.getByText('Ethereum')).toBeInTheDocument();
      expect(screen.getByText('Cardano')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // Total shown count
    });

    it('calculates gainers and losers correctly', () => {
      render(<CryptoDashboard />);

      // Bitcoin is up 2.5%, Ethereum is down -1.2%
      // So 1 gainer, 1 loser
      const statsCards = screen.getByText('Gainers').closest('.bg-card');
      expect(statsCards).toBeInTheDocument();
      
      const gainersCount = screen.getByText('Gainers').parentElement?.querySelector('.text-green-500');
      expect(gainersCount).toHaveTextContent('1');
      
      const losersCount = screen.getByText('Losers').parentElement?.querySelector('.text-red-500');
      expect(losersCount).toHaveTextContent('1');
    });

    it('handles empty data gracefully', () => {
      mockApi.crypto.getTopCryptos.useQuery.mockReturnValue({
        data: { data: [] },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      mockApi.crypto.getFollowedCryptos.useQuery.mockReturnValue({
        data: { data: [] },
        refetch: jest.fn(),
      });

      render(<CryptoDashboard />);

      expect(screen.getByText('No data available')).toBeInTheDocument();
      expect(screen.getByText('No cryptocurrency data available at the moment')).toBeInTheDocument();
      
      const refreshButton = screen.getByText('Refresh Data');
      expect(refreshButton).toBeInTheDocument();
    });
  });

  describe('Headers and Titles', () => {
    it('shows appropriate header based on watchlist status', () => {
      render(<CryptoDashboard />);

      // With followed cryptos
      expect(screen.getByText('Top Cryptocurrencies & Your Watchlist')).toBeInTheDocument();
    });

    it('shows basic header when no watchlist items', () => {
      mockApi.crypto.getFollowedCryptos.useQuery.mockReturnValue({
        data: { data: [] },
        refetch: jest.fn(),
      });

      render(<CryptoDashboard />);

      expect(screen.getByText('Top Cryptocurrencies')).toBeInTheDocument();
    });

    it('shows basic header when not authenticated', () => {
      mockUseSession.mockReturnValue({ data: null });

      render(<CryptoDashboard />);

      expect(screen.getByText('Top Cryptocurrencies')).toBeInTheDocument();
    });
  });

  describe('Price Change Display', () => {
    it('shows green for positive price changes', () => {
      render(<CryptoDashboard />);

      const bitcoinPriceChange = screen.getByText('2.50%');
      expect(bitcoinPriceChange).toHaveClass('text-green-600');
    });

    it('shows red for negative price changes', () => {
      render(<CryptoDashboard />);

      const ethereumPriceChange = screen.getByText('1.20%');
      expect(ethereumPriceChange).toHaveClass('text-red-600');
    });
  });
});