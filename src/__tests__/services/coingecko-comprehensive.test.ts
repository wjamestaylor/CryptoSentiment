import { CoinGeckoService } from '@/services/crypto/price.service';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('CoinGeckoService', () => {
  let service: CoinGeckoService;

  beforeEach(() => {
    service = new CoinGeckoService();
    jest.clearAllMocks();
  });

  describe('getTopCryptos', () => {
    it('should fetch top cryptocurrencies successfully', async () => {
      const mockData = [
        {
          id: 'bitcoin',
          symbol: 'btc',
          name: 'Bitcoin',
          current_price: 50000,
          market_cap: 1000000000,
          market_cap_rank: 1,
          price_change_percentage_24h: 2.5,
          total_volume: 30000000,
          image: 'https://example.com/bitcoin.png'
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      const result = await service.getTopCryptos();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/coins/markets'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/json'
          }),
          cache: 'no-store'
        })
      );
      expect(result).toEqual(mockData);
    });

    it('should handle custom limit parameter', async () => {
      const mockData = Array(20).fill(null).map((_, i) => ({
        id: `crypto-${i}`,
        symbol: `sym${i}`,
        name: `Crypto ${i}`,
        current_price: 1000 + i,
        market_cap: 1000000 + i,
        market_cap_rank: i + 1,
        price_change_percentage_24h: i % 5,
        total_volume: 10000 + i,
        image: `https://example.com/crypto-${i}.png`
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      const result = await service.getTopCryptos(20);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('per_page=20'),
        expect.any(Object)
      );
      expect(result).toEqual(mockData);
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      });

      await expect(service.getTopCryptos()).rejects.toThrow('CoinGecko API error: Too Many Requests');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(service.getTopCryptos()).rejects.toThrow('Network error');
    });
  });

  describe('getCryptoById', () => {
    it('should fetch cryptocurrency by ID successfully', async () => {
      const mockData = [
        {
          id: 'bitcoin',
          symbol: 'btc',
          name: 'Bitcoin',
          current_price: 50000,
          market_cap: 1000000000,
          market_cap_rank: 1,
          price_change_percentage_24h: 2.5,
          total_volume: 30000000,
          image: 'https://example.com/bitcoin.png'
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      const result = await service.getCryptoById('bitcoin');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('ids=bitcoin'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/json'
          })
        })
      );
      expect(result).toEqual(mockData[0]);
    });

    it('should handle cryptocurrency not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      });

      await expect(service.getCryptoById('nonexistent'))
        .rejects.toThrow('Cryptocurrency not found: nonexistent');
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(service.getCryptoById('bitcoin'))
        .rejects.toThrow('CoinGecko API error: Not Found');
    });
  });

  describe('searchCryptos', () => {
    it('should search cryptocurrencies successfully', async () => {
      const mockData = {
        coins: [
          {
            id: 'bitcoin',
            name: 'Bitcoin',
            symbol: 'BTC',
            thumb: 'https://example.com/bitcoin-thumb.png'
          }
        ],
        exchanges: [],
        categories: []
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      const result = await service.searchCryptos('bitcoin');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/search?query=bitcoin'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/json'
          })
        })
      );
      expect(result).toEqual(mockData);
    });

    it('should handle empty search results', async () => {
      const mockData = {
        coins: [],
        exchanges: [],
        categories: []
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      const result = await service.searchCryptos('nonexistent');
      expect(result).toEqual(mockData);
    });

    it('should handle special characters in search query', async () => {
      const mockData = { coins: [], exchanges: [], categories: [] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      await service.searchCryptos('bitcoin & ethereum');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('query=bitcoin%20%26%20ethereum'),
        expect.any(Object)
      );
    });
  });

  describe('constructor', () => {
    it('should create service without API key', () => {
      const serviceWithoutKey = new CoinGeckoService();
      expect(serviceWithoutKey).toBeInstanceOf(CoinGeckoService);
    });

    it('should create service with API key', () => {
      const serviceWithKey = new CoinGeckoService('test-api-key');
      expect(serviceWithKey).toBeInstanceOf(CoinGeckoService);
    });

    it('should include API key in headers when provided', async () => {
      const serviceWithKey = new CoinGeckoService('test-api-key');
      const mockData: unknown[] = [];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      await serviceWithKey.getTopCryptos();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-cg-demo-api-key': 'test-api-key'
          })
        })
      );
    });
  });

  describe('error handling', () => {
    it('should log errors with URL and status', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      await expect(service.getTopCryptos()).rejects.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        'CoinGecko API error: 500 Internal Server Error'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('URL: https://api.coingecko.com/api/v3/')
      );

      consoleSpy.mockRestore();
    });

    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      await expect(service.getTopCryptos()).rejects.toThrow('Invalid JSON');
    });

    it('should handle fetch failures', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Fetch failed'));

      await expect(service.getTopCryptos()).rejects.toThrow('Fetch failed');
    });
  });
});