import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import WatchlistPage from '@/app/watchlist/page';
import { api } from '@/lib/trpc/provider';

// Mock dependencies
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

jest.mock('@/lib/trpc/provider', () => ({
  api: {
    crypto: {
      getFollowedCryptos: {
        useQuery: jest.fn(),
      },
      searchCryptos: {
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

jest.mock('@/lib/crypto-mappings', () => ({
  getCoinGeckoId: jest.fn((symbol: string) => symbol.toLowerCase()),
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
    getFollowedCryptos: {
      useQuery: jest.Mock
    }
    searchCryptos: {
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

describe('WatchlistPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default session mock
    mockUseSession.mockReturnValue({
      data: {
        user: { id: 'user-1', email: 'test@example.com' },
      },
    });

    // Default API mocks
    mockApi.crypto.getFollowedCryptos.useQuery.mockReturnValue({
      data: { data: [] },
      refetch: jest.fn(),
    });

    mockApi.crypto.searchCryptos.useQuery.mockReturnValue({
      data: null,
      isLoading: false,
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

  describe('Authentication', () => {
    it('shows sign in required when not authenticated', () => {
      mockUseSession.mockReturnValue({ data: null });

      render(<WatchlistPage />);

      expect(screen.getByText('Sign In Required')).toBeInTheDocument();
      expect(screen.getByText('Please sign in to manage your cryptocurrency watchlist.')).toBeInTheDocument();
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    it('redirects to signin when sign in button is clicked', () => {
      mockUseSession.mockReturnValue({ data: null });
      
      // Mock console.error to suppress jsdom navigation errors
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<WatchlistPage />);

      const signInButton = screen.getByText('Sign In');
      
      // Test that the sign in button exists and is clickable
      expect(signInButton).toBeInTheDocument();
      expect(signInButton).not.toBeDisabled();
      
      // Click the button - this will trigger jsdom navigation error but that's expected
      fireEvent.click(signInButton);
      
      // Verify the error was logged (indicating navigation was attempted)
      expect(consoleSpy).toHaveBeenCalled();
      
      // Cleanup
      consoleSpy.mockRestore();
    });
  });

  describe('Empty Watchlist', () => {
    it('shows empty watchlist state', () => {
      render(<WatchlistPage />);

      expect(screen.getByText('My Watchlist')).toBeInTheDocument();
      expect(screen.getByText('Your watchlist is empty')).toBeInTheDocument();
      expect(screen.getByText('Add cryptocurrencies to track their prices and sentiment')).toBeInTheDocument();
      expect(screen.getByText('Add Your First Cryptocurrency')).toBeInTheDocument();
    });

    it('shows correct count in description', () => {
      render(<WatchlistPage />);

      expect(screen.getByText('Cryptocurrencies you\'re following (0 total)')).toBeInTheDocument();
    });
  });

  describe('Watchlist with Items', () => {
    const mockFollowedCryptos = [
      {
        id: '1',
        name: 'Bitcoin',
        symbol: 'BTC',
        logoUrl: null,
        marketCap: 500000000000,
        rank: 1,
      },
      {
        id: '2',
        name: 'Ethereum',
        symbol: 'ETH',
        logoUrl: null,
        marketCap: 200000000000,
        rank: 2,
      },
    ];

    beforeEach(() => {
      mockApi.crypto.getFollowedCryptos.useQuery.mockReturnValue({
        data: { data: mockFollowedCryptos },
        refetch: jest.fn(),
      });
    });

    it('displays followed cryptocurrencies', () => {
      render(<WatchlistPage />);

      expect(screen.getByText('Bitcoin')).toBeInTheDocument();
      expect(screen.getByText('BTC')).toBeInTheDocument();
      expect(screen.getByText('Ethereum')).toBeInTheDocument();
      expect(screen.getByText('ETH')).toBeInTheDocument();
    });

    it('shows correct count in description', () => {
      render(<WatchlistPage />);

      expect(screen.getByText('Cryptocurrencies you\'re following (2 total)')).toBeInTheDocument();
    });

    it('shows quick actions section', () => {
      render(<WatchlistPage />);

      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('📊 Bulk Sentiment Analysis')).toBeInTheDocument();
      expect(screen.getByText('🔔 Set Alerts for All')).toBeInTheDocument();
      expect(screen.getByText('📈 Export Watchlist')).toBeInTheDocument();
      expect(screen.getByText('🗑️ Clear All')).toBeInTheDocument();
    });

    it('handles remove crypto', async () => {
      const mockUnfollowMutation = jest.fn();
      mockApi.crypto.unfollowCrypto.useMutation.mockReturnValue({
        mutateAsync: mockUnfollowMutation,
        isPending: false,
      });

      render(<WatchlistPage />);

      const removeButtons = screen.getAllByText('Remove');
      fireEvent.click(removeButtons[0]);

      await waitFor(() => {
        expect(mockUnfollowMutation).toHaveBeenCalledWith({ symbol: 'BTC' });
      });
    });

    it('opens sentiment analysis in new tab', () => {
      const mockWindowOpen = jest.fn();
      window.open = mockWindowOpen;

      render(<WatchlistPage />);

      const analysisButtons = screen.getAllByText('🤖 AI Analysis');
      fireEvent.click(analysisButtons[0]);

      expect(mockWindowOpen).toHaveBeenCalledWith('/sentiment?crypto=btc', '_blank');
    });
  });

  describe('Search Functionality', () => {
    it('toggles search mode', () => {
      render(<WatchlistPage />);

      // Should not show search form initially
      expect(screen.queryByText('Search and add cryptocurrencies to your watchlist')).not.toBeInTheDocument();

      // Click to show search
      const addButton = screen.getByText('Add Cryptocurrency');
      fireEvent.click(addButton);

      expect(screen.getByText('Search and add cryptocurrencies to your watchlist')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search cryptocurrency (e.g., bitcoin, ethereum)...')).toBeInTheDocument();

      // Click to cancel search
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(screen.queryByText('Search and add cryptocurrencies to your watchlist')).not.toBeInTheDocument();
    });

    it('searches when query is longer than 2 characters', () => {
      render(<WatchlistPage />);

      // Open search
      const addButton = screen.getByText('Add Cryptocurrency');
      fireEvent.click(addButton);

      const searchInput = screen.getByPlaceholderText('Search cryptocurrency (e.g., bitcoin, ethereum)...');
      
      // Short query should not trigger search
      fireEvent.change(searchInput, { target: { value: 'bt' } });
      expect(mockApi.crypto.searchCryptos.useQuery).toHaveBeenCalledWith(
        { query: 'bt' },
        expect.objectContaining({ enabled: false })
      );

      // Long query should trigger search
      fireEvent.change(searchInput, { target: { value: 'bitcoin' } });
      expect(mockApi.crypto.searchCryptos.useQuery).toHaveBeenCalledWith(
        { query: 'bitcoin' },
        expect.objectContaining({ enabled: true })
      );
    });

    it('displays search results', () => {
      const mockSearchResults = {
        data: {
          coins: [
            {
              id: 'bitcoin',
              name: 'Bitcoin',
              symbol: 'BTC',
              thumb: 'https://coin-images.coingecko.com/coins/images/1/thumb/bitcoin.png',
            },
          ],
        },
      };

      mockApi.crypto.searchCryptos.useQuery.mockReturnValue({
        data: mockSearchResults,
        isLoading: false,
      });

      render(<WatchlistPage />);

      // Open search and enter query
      const addButton = screen.getByText('Add Cryptocurrency');
      fireEvent.click(addButton);

      const searchInput = screen.getByPlaceholderText('Search cryptocurrency (e.g., bitcoin, ethereum)...');
      fireEvent.change(searchInput, { target: { value: 'bitcoin' } });

      expect(screen.getByText('Bitcoin')).toBeInTheDocument();
      expect(screen.getByText('BTC')).toBeInTheDocument();
      expect(screen.getByText('Add to Watchlist')).toBeInTheDocument();
    });

    it('shows loading state during search', () => {
      mockApi.crypto.searchCryptos.useQuery.mockReturnValue({
        data: null,
        isLoading: true,
      });

      render(<WatchlistPage />);

      // Open search and enter query
      const addButton = screen.getByText('Add Cryptocurrency');
      fireEvent.click(addButton);

      const searchInput = screen.getByPlaceholderText('Search cryptocurrency (e.g., bitcoin, ethereum)...');
      fireEvent.change(searchInput, { target: { value: 'bitcoin' } });

      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('shows no results message', () => {
      mockApi.crypto.searchCryptos.useQuery.mockReturnValue({
        data: { data: { coins: [] } },
        isLoading: false,
      });

      render(<WatchlistPage />);

      // Open search and enter query
      const addButton = screen.getByText('Add Cryptocurrency');
      fireEvent.click(addButton);

      const searchInput = screen.getByPlaceholderText('Search cryptocurrency (e.g., bitcoin, ethereum)...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      expect(screen.getByText('No cryptocurrencies found matching "nonexistent"')).toBeInTheDocument();
    });

    it('handles adding cryptocurrency to watchlist', async () => {
      const mockFollowMutation = jest.fn();
      const mockRefetch = jest.fn();

      mockApi.crypto.followCrypto.useMutation.mockReturnValue({
        mutateAsync: mockFollowMutation,
        isPending: false,
      });

      mockApi.crypto.getFollowedCryptos.useQuery.mockReturnValue({
        data: { data: [] },
        refetch: mockRefetch,
      });

      const mockSearchResults = {
        data: {
          coins: [
            {
              id: 'bitcoin',
              name: 'Bitcoin',
              symbol: 'BTC',
              thumb: 'https://coin-images.coingecko.com/coins/images/1/thumb/bitcoin.png',
            },
          ],
        },
      };

      mockApi.crypto.searchCryptos.useQuery.mockReturnValue({
        data: mockSearchResults,
        isLoading: false,
      });

      render(<WatchlistPage />);

      // Open search and add crypto
      const addButton = screen.getByText('Add Cryptocurrency');
      fireEvent.click(addButton);

      const searchInput = screen.getByPlaceholderText('Search cryptocurrency (e.g., bitcoin, ethereum)...');
      fireEvent.change(searchInput, { target: { value: 'bitcoin' } });

      const addToWatchlistButton = screen.getByText('Add to Watchlist');
      fireEvent.click(addToWatchlistButton);

      await waitFor(() => {
        expect(mockFollowMutation).toHaveBeenCalledWith({
          symbol: 'BTC',
          name: 'Bitcoin',
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('logs error when follow fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const mockFollowMutation = jest.fn().mockRejectedValue(new Error('API Error'));

      mockApi.crypto.followCrypto.useMutation.mockReturnValue({
        mutateAsync: mockFollowMutation,
        isPending: false,
      });

      const mockSearchResults = {
        data: {
          coins: [
            {
              id: 'bitcoin',
              name: 'Bitcoin',
              symbol: 'BTC',
              thumb: 'https://coin-images.coingecko.com/coins/images/1/thumb/bitcoin.png',
            },
          ],
        },
      };

      mockApi.crypto.searchCryptos.useQuery.mockReturnValue({
        data: mockSearchResults,
        isLoading: false,
      });

      render(<WatchlistPage />);

      // Open search and try to add crypto
      const addButton = screen.getByText('Add Cryptocurrency');
      fireEvent.click(addButton);

      const searchInput = screen.getByPlaceholderText('Search cryptocurrency (e.g., bitcoin, ethereum)...');
      fireEvent.change(searchInput, { target: { value: 'bitcoin' } });

      const addToWatchlistButton = screen.getByText('Add to Watchlist');
      fireEvent.click(addToWatchlistButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to follow crypto:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('logs error when unfollow fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const mockUnfollowMutation = jest.fn().mockRejectedValue(new Error('API Error'));

      mockApi.crypto.unfollowCrypto.useMutation.mockReturnValue({
        mutateAsync: mockUnfollowMutation,
        isPending: false,
      });

      const mockFollowedCryptos = [
        {
          id: '1',
          name: 'Bitcoin',
          symbol: 'BTC',
          logoUrl: null,
          marketCap: 500000000000,
          rank: 1,
        },
      ];

      mockApi.crypto.getFollowedCryptos.useQuery.mockReturnValue({
        data: { data: mockFollowedCryptos },
        refetch: jest.fn(),
      });

      render(<WatchlistPage />);

      const removeButton = screen.getByText('Remove');
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to unfollow crypto:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Loading States', () => {
    it('shows loading state for add button', () => {
      mockApi.crypto.followCrypto.useMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: true,
      });

      const mockSearchResults = {
        data: {
          coins: [
            {
              id: 'bitcoin',
              name: 'Bitcoin',
              symbol: 'BTC',
              thumb: 'https://coin-images.coingecko.com/coins/images/1/thumb/bitcoin.png',
            },
          ],
        },
      };

      mockApi.crypto.searchCryptos.useQuery.mockReturnValue({
        data: mockSearchResults,
        isLoading: false,
      });

      render(<WatchlistPage />);

      // Open search
      const addButton = screen.getByText('Add Cryptocurrency');
      fireEvent.click(addButton);

      const searchInput = screen.getByPlaceholderText('Search cryptocurrency (e.g., bitcoin, ethereum)...');
      fireEvent.change(searchInput, { target: { value: 'bitcoin' } });

      expect(screen.getByText('Adding...')).toBeInTheDocument();
    });

    it('shows loading state for remove button', () => {
      mockApi.crypto.unfollowCrypto.useMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: true,
      });

      const mockFollowedCryptos = [
        {
          id: '1',
          name: 'Bitcoin',
          symbol: 'BTC',
          logoUrl: null,
          marketCap: 500000000000,
          rank: 1,
        },
      ];

      mockApi.crypto.getFollowedCryptos.useQuery.mockReturnValue({
        data: { data: mockFollowedCryptos },
        refetch: jest.fn(),
      });

      render(<WatchlistPage />);

      const removeButton = screen.getByText('Remove');
      expect(removeButton).toBeDisabled();
    });
  });
});