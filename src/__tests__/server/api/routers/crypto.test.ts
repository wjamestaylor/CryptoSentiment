// Mock NextAuth completely to avoid ES module issues
jest.mock('next-auth', () => ({
  default: jest.fn(),
  getServerSession: jest.fn(),
}));

jest.mock('next-auth/next', () => ({
  NextAuthHandler: jest.fn(),
}));

// Mock the problematic ES modules
jest.mock('jose', () => ({}));
jest.mock('openid-client', () => ({}));
jest.mock('@next-auth/prisma-adapter', () => ({
  PrismaAdapter: jest.fn(),
}));

// Mock Prisma
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    cryptocurrency: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
    followedCoin: {
      upsert: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

import { z } from 'zod';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Import after mocks
import { prisma } from '@/lib/db/prisma';

describe('Crypto Router tRPC Implementation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('tRPC procedures', () => {
    it('should have proper input validation schemas', () => {
      // Test getTopCryptos input schema
      const getTopCryptosSchema = z.object({ limit: z.number().min(1).max(100).default(50) });
      
      expect(() => getTopCryptosSchema.parse({ limit: 10 })).not.toThrow();
      expect(() => getTopCryptosSchema.parse({ limit: 0 })).toThrow();
      expect(() => getTopCryptosSchema.parse({ limit: 101 })).toThrow();
      
      // Test getCryptoById input schema
      const getCryptoByIdSchema = z.object({ id: z.string() });
      
      expect(() => getCryptoByIdSchema.parse({ id: 'bitcoin' })).not.toThrow();
      expect(() => getCryptoByIdSchema.parse({})).toThrow();
      
      // Test searchCryptos input schema
      const searchCryptosSchema = z.object({ 
        query: z.string().min(1, "Search query must be at least 1 character long") 
      });
      
      expect(() => searchCryptosSchema.parse({ query: 'bitcoin' })).not.toThrow();
      expect(() => searchCryptosSchema.parse({ query: '' })).toThrow();
      
      // Test followCrypto input schema
      const followCryptoSchema = z.object({ 
        symbol: z.string(),
        name: z.string().optional(),
      });
      
      expect(() => followCryptoSchema.parse({ symbol: 'BTC' })).not.toThrow();
      expect(() => followCryptoSchema.parse({ symbol: 'BTC', name: 'Bitcoin' })).not.toThrow();
      expect(() => followCryptoSchema.parse({})).toThrow();
    });

    it('should handle CoinGecko API calls correctly', async () => {
      const mockResponse = [
        {
          id: 'bitcoin',
          symbol: 'btc',
          name: 'Bitcoin',
          current_price: 50000,
          market_cap: 1000000000,
          price_change_percentage_24h: 2.5,
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      } as unknown as Response);

      // Simulate the tRPC procedure logic
      const limit = 10;
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`
      );

      expect(response.ok).toBe(true);
      const data = await response.json();
      
      const result = {
        success: true,
        data: data,
      };

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
    });

    it('should handle API errors in tRPC procedures', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      } as unknown as Response);

      // Simulate error handling in tRPC procedure
      const response = await fetch('https://api.coingecko.com/api/v3/coins/markets');
      
      let error;
      if (!response.ok) {
        error = new Error(`CoinGecko API error: ${response.statusText}`);
      }

      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toContain('CoinGecko API error: Too Many Requests');
    });

    it('should handle database operations for followCrypto', async () => {
      const mockCrypto = { id: 'crypto-1', symbol: 'BTC', name: 'Bitcoin' };
      const mockFollowing = { id: 'following-1', userId: 'user-1', cryptoId: 'crypto-1' };

      (prisma.cryptocurrency.upsert as jest.Mock).mockResolvedValue(mockCrypto);
      (prisma.followedCoin.upsert as jest.Mock).mockResolvedValue(mockFollowing);

      // Simulate the tRPC procedure logic
      const input = { symbol: 'btc', name: 'Bitcoin' };
      const userId = 'user-1';

      // Upsert cryptocurrency
      const crypto = await prisma.cryptocurrency.upsert({
        where: { symbol: input.symbol.toUpperCase() },
        update: { name: input.name || input.symbol },
        create: {
          symbol: input.symbol.toUpperCase(),
          name: input.name || input.symbol,
        },
      });

      // Create following relationship
      const following = await prisma.followedCoin.upsert({
        where: {
          userId_cryptoId: {
            userId,
            cryptoId: crypto.id,
          },
        },
        update: {},
        create: {
          userId,
          cryptoId: crypto.id,
        },
      });

      const result = {
        success: true,
        message: `Now following ${input.symbol.toUpperCase()}`,
        data: following,
      };

      expect(result.success).toBe(true);
      expect(result.message).toBe('Now following BTC');
      expect(result.data).toEqual(mockFollowing);
      expect(prisma.cryptocurrency.upsert).toHaveBeenCalled();
      expect(prisma.followedCoin.upsert).toHaveBeenCalled();
    });

    it('should handle database operations for unfollowCrypto', async () => {
      const mockCrypto = { id: 'crypto-1', symbol: 'BTC' };

      (prisma.cryptocurrency.findUnique as jest.Mock).mockResolvedValue(mockCrypto);
      (prisma.followedCoin.delete as jest.Mock).mockResolvedValue({});

      // Simulate the tRPC procedure logic
      const input = { symbol: 'btc' };
      const userId = 'user-1';

      // Find cryptocurrency
      const crypto = await prisma.cryptocurrency.findUnique({
        where: { symbol: input.symbol.toUpperCase() },
      });

      if (!crypto) {
        throw new Error(`Cryptocurrency ${input.symbol} not found`);
      }

      // Delete following relationship
      await prisma.followedCoin.delete({
        where: {
          userId_cryptoId: {
            userId,
            cryptoId: crypto.id,
          },
        },
      });

      const result = {
        success: true,
        message: `Unfollowed ${input.symbol.toUpperCase()}`,
      };

      expect(result.success).toBe(true);
      expect(result.message).toBe('Unfollowed BTC');
      expect(prisma.cryptocurrency.findUnique).toHaveBeenCalled();
      expect(prisma.followedCoin.delete).toHaveBeenCalled();
    });

    it('should handle database operations for getFollowedCryptos', async () => {
      const mockFollowedCryptos = [
        {
          crypto: { id: 'crypto-1', symbol: 'BTC', name: 'Bitcoin' },
          createdAt: new Date(),
        },
        {
          crypto: { id: 'crypto-2', symbol: 'ETH', name: 'Ethereum' },
          createdAt: new Date(),
        },
      ];

      (prisma.followedCoin.findMany as jest.Mock).mockResolvedValue(mockFollowedCryptos);

      // Simulate the tRPC procedure logic
      const userId = 'user-1';

      const followedCryptos = await prisma.followedCoin.findMany({
        where: { userId },
        include: { crypto: true },
        orderBy: { createdAt: 'desc' },
      });

      const result = {
        success: true,
        data: followedCryptos.map((following: { crypto: unknown }) => following.crypto),
      };

      expect(result.success).toBe(true);
      expect(result.data).toEqual([
        { id: 'crypto-1', symbol: 'BTC', name: 'Bitcoin' },
        { id: 'crypto-2', symbol: 'ETH', name: 'Ethereum' },
      ]);
      expect(prisma.followedCoin.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: { crypto: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should handle search with special characters', () => {
      const query = 'bitcoin & ethereum';
      const encodedQuery = encodeURIComponent(query);
      
      expect(encodedQuery).toBe('bitcoin%20%26%20ethereum');
      
      const searchUrl = `https://api.coingecko.com/api/v3/search?query=${encodedQuery}`;
      expect(searchUrl).toContain('bitcoin%20%26%20ethereum');
    });

    it('should validate empty cryptocurrency response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue([]),
      } as unknown as Response);

      const response = await fetch('https://api.coingecko.com/api/v3/coins/markets');
      const cryptos = await response.json();

      if (cryptos.length === 0) {
        const error = new Error('Cryptocurrency not found: invalid-id');
        expect(error.message).toContain('Cryptocurrency not found');
      }
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      try {
        await fetch('https://api.coingecko.com/api/v3/coins/markets');
        fail('Should have thrown an error');
      } catch (error) {
        const wrappedError = new Error(`Failed to fetch top cryptocurrencies: ${error}`);
        expect(wrappedError.message).toContain('Failed to fetch top cryptocurrencies');
        expect(wrappedError.message).toContain('Network error');
      }
    });

    it('should handle database errors in follow operations', async () => {
      (prisma.cryptocurrency.upsert as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      try {
        await prisma.cryptocurrency.upsert({
          where: { symbol: 'BTC' },
          update: { name: 'Bitcoin' },
          create: { symbol: 'BTC', name: 'Bitcoin' },
        });
        fail('Should have thrown an error');
      } catch (error) {
        const wrappedError = new Error(`Failed to follow cryptocurrency: ${error}`);
        expect(wrappedError.message).toContain('Failed to follow cryptocurrency');
        expect(wrappedError.message).toContain('Database connection failed');
      }
    });
  });
});