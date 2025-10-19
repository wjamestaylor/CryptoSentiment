/**
 * Tests for Crypto Price Service
 * Tests price fetching and data processing functionality
 */

import { CoinGeckoService } from '@/services/crypto/price.service';

// Mock global fetch
global.fetch = jest.fn();

describe('CoinGeckoService', () => {
  let coinGeckoService: CoinGeckoService;

  beforeEach(() => {
    coinGeckoService = new CoinGeckoService();
    jest.clearAllMocks();
  });

  describe('getTopCryptos', () => {
    it('should fetch top cryptocurrencies successfully', async () => {
      const mockResponse = [
        {
          id: 'bitcoin',
          symbol: 'btc',
          name: 'Bitcoin',
          current_price: 50000,
          market_cap: 1000000000,
          market_cap_rank: 1,
          price_change_percentage_24h: 5.5,
          price_change_24h: 2500,
          total_volume: 30000000000,
          image: 'https://example.com/bitcoin.png',
        },
        {
          id: 'ethereum',
          symbol: 'eth',
          name: 'Ethereum',
          current_price: 3000,
          market_cap: 500000000,
          market_cap_rank: 2,
          price_change_percentage_24h: -2.1,
          price_change_24h: -65,
          total_volume: 15000000000,
          image: 'https://example.com/ethereum.png',
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await coinGeckoService.getTopCryptos(10);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/json',
          }),
          cache: 'no-store',
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors gracefully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(coinGeckoService.getTopCryptos(10)).rejects.toThrow('CoinGecko API error: Internal Server Error');
    });

    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(coinGeckoService.getTopCryptos(10)).rejects.toThrow('Network error');
    });

    it('should use default limit when none provided', async () => {
      const mockResponse: any[] = [];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await coinGeckoService.getTopCryptos();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('per_page=10'),
        expect.any(Object)
      );
    });
  });

  describe('getCryptoById', () => {
    it('should fetch specific crypto successfully', async () => {
      const mockResponse = [
        {
          id: 'bitcoin',
          symbol: 'btc',
          name: 'Bitcoin',
          current_price: 50000,
          market_cap: 1000000000,
          market_cap_rank: 1,
          price_change_percentage_24h: 5.5,
          price_change_24h: 2500,
          total_volume: 30000000000,
          image: 'https://example.com/bitcoin.png',
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await coinGeckoService.getCryptoById('bitcoin');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin&sparkline=false',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/json',
          }),
        })
      );

      expect(result).toEqual(mockResponse[0]);
    });

    it('should handle crypto not found', async () => {
      const mockResponse: any[] = [];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await expect(coinGeckoService.getCryptoById('invalid-coin')).rejects.toThrow('Cryptocurrency not found: invalid-coin');
    });
  });

  describe('searchCryptos', () => {
    it('should search cryptocurrencies successfully', async () => {
      const mockResponse = {
        coins: [
          {
            id: 'bitcoin',
            name: 'Bitcoin',
            symbol: 'btc',
            thumb: 'https://example.com/bitcoin-thumb.png',
          },
        ],
        exchanges: [],
        categories: [],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await coinGeckoService.searchCryptos('bitcoin');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.coingecko.com/api/v3/search?query=bitcoin',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/json',
          }),
        })
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('getCurrentPrices', () => {
    it('should fetch current prices for multiple cryptos', async () => {
      const mockResponse = [
        {
          id: 'bitcoin',
          symbol: 'btc',
          name: 'Bitcoin',
          current_price: 50000,
          market_cap: 1000000000,
          market_cap_rank: 1,
          price_change_percentage_24h: 5.5,
          price_change_24h: 2500,
          total_volume: 30000000000,
          image: 'https://example.com/bitcoin.png',
        },
        {
          id: 'ethereum',
          symbol: 'eth',
          name: 'Ethereum',
          current_price: 3000,
          market_cap: 500000000,
          market_cap_rank: 2,
          price_change_percentage_24h: -2.1,
          price_change_24h: -65,
          total_volume: 15000000000,
          image: 'https://example.com/ethereum.png',
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await coinGeckoService.getCurrentPrices(['bitcoin', 'ethereum']);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('ids=bitcoin,ethereum'),
        expect.any(Object)
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        current_price: 50000,
        price_change_24h: 2500,
        price_change_percentage_24h: 5.5,
      });
    });

    it('should return empty array for empty input', async () => {
      const result = await coinGeckoService.getCurrentPrices([]);

      expect(result).toEqual([]);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should handle chunking for large requests', async () => {
      // Create array with more than 250 items to test chunking
      const manyIds = Array.from({ length: 300 }, (_, i) => `coin-${i}`);
      
      const mockResponse: any[] = [];
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await coinGeckoService.getCurrentPrices(manyIds);

      // Should make 2 requests (250 + 50)
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Service instantiation', () => {
    it('should create a CoinGecko service instance', () => {
      expect(coinGeckoService).toBeInstanceOf(CoinGeckoService);
    });

    it('should have required methods', () => {
      expect(typeof coinGeckoService.getTopCryptos).toBe('function');
      expect(typeof coinGeckoService.getCryptoById).toBe('function');
      expect(typeof coinGeckoService.searchCryptos).toBe('function');
      expect(typeof coinGeckoService.getCurrentPrices).toBe('function');
    });
  });

  describe('Rate limiting', () => {
    beforeEach(() => {
      // Mock setTimeout to avoid actual delays in tests
      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback();
        return 1 as any;
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should handle rate limiting with retry', async () => {
      // First request fails with 429
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
        })
        // Second request succeeds
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

      const result = await coinGeckoService.getTopCryptos(10);

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual([]);
    });

    it('should fail after retry if still rate limited', async () => {
      // Both requests fail with 429
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
        });

      await expect(coinGeckoService.getTopCryptos(10)).rejects.toThrow('CoinGecko API error: Too Many Requests');

      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('API key handling', () => {
    beforeEach(() => {
      // Mock setTimeout to avoid delays
      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback();
        return 1 as any;
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should include API key in headers when provided', async () => {
      const serviceWithKey = new CoinGeckoService('test-api-key');

      const mockResponse: any[] = [];
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await serviceWithKey.getTopCryptos(10);

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-cg-demo-api-key': 'test-api-key',
          }),
        })
      );
    });

    it('should not include API key for placeholder values', async () => {
      const serviceWithPlaceholder = new CoinGeckoService('your-coingecko-api-key');

      const mockResponse: any[] = [];
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await serviceWithPlaceholder.getTopCryptos(10);

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'x-cg-demo-api-key': expect.anything(),
          }),
        })
      );
    });
  });

  describe('Caching', () => {
    it('should use cached response for repeated requests', async () => {
      const mockResponse: any[] = [];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // First request
      await coinGeckoService.getTopCryptos(10);
      
      // Second request (should use cache)
      await coinGeckoService.getTopCryptos(10);

      // Should only make one actual fetch call
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });
});