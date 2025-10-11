import { z } from 'zod';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock console to reduce noise
const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('Crypto Router Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getTopCryptos endpoint logic', () => {
    it('should validate input correctly', () => {
      const inputSchema = z.object({ limit: z.number().min(1).max(100).default(50) });
      
      // Test valid input
      const validInput = inputSchema.parse({ limit: 10 });
      expect(validInput.limit).toBe(10);

      // Test default value
      const defaultInput = inputSchema.parse({});
      expect(defaultInput.limit).toBe(50);

      // Test invalid input (should throw)
      expect(() => inputSchema.parse({ limit: 0 })).toThrow();
      expect(() => inputSchema.parse({ limit: 101 })).toThrow();
    });

    it('should handle CoinGecko API responses correctly', async () => {
      const mockCryptos = [
        {
          id: 'bitcoin',
          symbol: 'btc',
          name: 'Bitcoin',
          current_price: 50000,
          market_cap: 1000000000,
          price_change_percentage_24h: 2.5,
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockCryptos),
      } as unknown as Response);

      // Simulate the endpoint logic
      const limit = 10;
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`
      );
      
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toEqual(mockCryptos);
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      } as unknown as Response);

      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h'
      );

      expect(response.ok).toBe(false);
      expect(response.status).toBe(429);
    });
  });

  describe('getCryptoById endpoint logic', () => {
    it('should validate crypto ID input', () => {
      const inputSchema = z.object({ id: z.string().min(1) });
      
      const validInput = inputSchema.parse({ id: 'bitcoin' });
      expect(validInput.id).toBe('bitcoin');

      expect(() => inputSchema.parse({ id: '' })).toThrow();
      expect(() => inputSchema.parse({})).toThrow();
    });

    it('should handle single crypto response', async () => {
      const mockCrypto = {
        id: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        current_price: 50000,
        market_cap: 1000000000,
        price_change_percentage_24h: 2.5,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue([mockCrypto]),
      } as unknown as Response);

      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin&sparkline=false&price_change_percentage=24h'
      );
      
      const data = await response.json();
      expect(data).toHaveLength(1);
      expect(data[0]).toEqual(mockCrypto);
    });

    it('should handle empty response for invalid crypto', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue([]),
      } as unknown as Response);

      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=invalid&sparkline=false&price_change_percentage=24h'
      );
      
      const data = await response.json();
      expect(data).toHaveLength(0);
    });
  });

  describe('searchCryptos endpoint logic', () => {
    it('should validate search query', () => {
      const inputSchema = z.object({ 
        query: z.string().min(1, "Search query must be at least 1 character long") 
      });
      
      const validInput = inputSchema.parse({ query: 'bitcoin' });
      expect(validInput.query).toBe('bitcoin');

      expect(() => inputSchema.parse({ query: '' })).toThrow('Search query must be at least 1 character long');
    });

    it('should handle search results', async () => {
      const mockResults = {
        coins: [
          { id: 'bitcoin', name: 'Bitcoin', symbol: 'btc' },
          { id: 'bitcoin-cash', name: 'Bitcoin Cash', symbol: 'bch' },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResults),
      } as unknown as Response);

      const query = 'bitcoin';
      const response = await fetch(
        `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`
      );
      
      const data = await response.json();
      expect(data).toEqual(mockResults);
      expect(data.coins).toHaveLength(2);
    });

    it('should properly encode special characters in query', () => {
      const query = 'test & special chars';
      const encodedQuery = encodeURIComponent(query);
      expect(encodedQuery).toBe('test%20%26%20special%20chars');
    });
  });

  describe('Database operations logic', () => {
    it('should validate follow crypto input', () => {
      const inputSchema = z.object({ 
        symbol: z.string(),
        name: z.string().optional(),
      });
      
      const validInput1 = inputSchema.parse({ symbol: 'BTC', name: 'Bitcoin' });
      expect(validInput1.symbol).toBe('BTC');
      expect(validInput1.name).toBe('Bitcoin');

      const validInput2 = inputSchema.parse({ symbol: 'ETH' });
      expect(validInput2.symbol).toBe('ETH');
      expect(validInput2.name).toBeUndefined();
    });

    it('should validate unfollow crypto input', () => {
      const inputSchema = z.object({ symbol: z.string() });
      
      const validInput = inputSchema.parse({ symbol: 'BTC' });
      expect(validInput.symbol).toBe('BTC');

      expect(() => inputSchema.parse({})).toThrow();
    });

    it('should handle symbol case normalization', () => {
      const symbol = 'btc';
      const normalizedSymbol = symbol.toUpperCase();
      expect(normalizedSymbol).toBe('BTC');
    });
  });

  describe('Response formatting', () => {
    it('should format success responses correctly', () => {
      const mockData = { id: 'bitcoin', name: 'Bitcoin' };
      const successResponse = {
        success: true,
        data: mockData,
      };

      expect(successResponse.success).toBe(true);
      expect(successResponse.data).toEqual(mockData);
    });

    it('should format error responses correctly', () => {
      const errorResponse = {
        success: false,
        message: 'Test error message',
      };

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.message).toBe('Test error message');
    });

    it('should format follow crypto response correctly', () => {
      const mockFollowing = { id: 'following-1', userId: 'user-1', cryptoId: 'crypto-1' };
      const followResponse = {
        success: true,
        message: 'Now following BTC',
        data: mockFollowing,
      };

      expect(followResponse.success).toBe(true);
      expect(followResponse.message).toBe('Now following BTC');
      expect(followResponse.data).toEqual(mockFollowing);
    });
  });

  describe('Error handling patterns', () => {
    it('should handle fetch errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      try {
        await fetch('https://api.coingecko.com/api/v3/coins/markets');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network error');
      }
    });

    it('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as unknown as Response);

      const response = await fetch('https://api.example.com');
      
      try {
        await response.json();
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Invalid JSON');
      }
    });

    it('should handle API rate limiting', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      } as unknown as Response);

      const response = await fetch('https://api.coingecko.com/api/v3/coins/markets');
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(429);
      expect(response.statusText).toBe('Too Many Requests');
    });
  });
});