import { CoinGeckoService } from '@/services/crypto/price.service';

// Mock fetch for testing
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
          total_volume: 50000000,
          image: 'https://example.com/bitcoin.png'
        }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await coinGeckoService.getTopCryptos(10);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/coins/markets'),
        expect.objectContaining({
          headers: { 'Accept': 'application/json' }
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      // Mock first call that fails with 429
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({
          error: 'Too Many Requests'
        })
      });
      
      // Mock retry call that also fails
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({
          error: 'Too Many Requests'
        })
      });

      const service = new CoinGeckoService();
      await expect(service.getTopCryptos(10)).rejects.toThrow('Too Many Requests');
    }, 10000);

    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(coinGeckoService.getTopCryptos(10))
        .rejects.toThrow('Network error');
    });
  });

  describe('getCryptoById', () => {
    it('should fetch specific cryptocurrency successfully', async () => {
      const mockResponse = [
        {
          id: 'bitcoin',
          symbol: 'btc',
          name: 'Bitcoin',
          current_price: 50000,
          market_cap: 1000000000,
          market_cap_rank: 1,
          price_change_percentage_24h: 5.5,
          total_volume: 50000000,
          image: 'https://example.com/bitcoin.png'
        }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await coinGeckoService.getCryptoById('bitcoin');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/coins/markets?vs_currency=usd&ids=bitcoin'),
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse[0]);
    });

    it('should throw error when cryptocurrency not found', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await expect(coinGeckoService.getCryptoById('nonexistent'))
        .rejects.toThrow('Cryptocurrency not found: nonexistent');
    });
  });

  describe('searchCryptos', () => {
    it('should search for cryptocurrencies successfully', async () => {
      const mockResponse = {
        coins: [
          { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', thumb: 'https://example.com/thumb.png' }
        ],
        exchanges: [],
        categories: []
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await coinGeckoService.searchCryptos('bitcoin');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/search?query=bitcoin'),
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });
  });
});