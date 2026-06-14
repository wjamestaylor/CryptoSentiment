/**
 * Tests for Historical Price Service
 * Tests historical price data fetching, storing, and retrieval functionality
 */

import { HistoricalPriceService } from '@/services/crypto/historical-price.service';
import { PrismaClient } from '@prisma/client';
import { CoinGeckoService } from '@/services/crypto/price.service';

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    cryptocurrency: {
      findUnique: jest.fn(),
    },
    priceData: {
      upsert: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    cryptoTracking: {
      findMany: jest.fn(),
    },
  };
  
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

// Mock CoinGeckoService
jest.mock('@/services/crypto/price.service', () => {
  return {
    CoinGeckoService: jest.fn().mockImplementation(() => ({
      request: jest.fn(),
    })),
  };
});

describe('HistoricalPriceService', () => {
  let service: HistoricalPriceService;
  let mockPrisma: any;
  let mockCoinGeckoService: any;

  beforeEach(() => {
    mockPrisma = new PrismaClient();
    service = new HistoricalPriceService(mockPrisma);
    mockCoinGeckoService = (service as any).priceService;
    jest.clearAllMocks();
  });

  describe('fetchAndStoreHistory', () => {
    it('should fetch and store historical price data', async () => {
      const mockCrypto = {
        id: 'crypto-id-1',
        coinGeckoId: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
      };

      const mockApiResponse = {
        prices: [
          [1640000000000, 50000],
          [1640086400000, 51000],
        ],
        market_caps: [
          [1640000000000, 1000000000000],
          [1640086400000, 1020000000000],
        ],
        total_volumes: [
          [1640000000000, 30000000000],
          [1640086400000, 31000000000],
        ],
      };

      mockPrisma.cryptocurrency.findUnique.mockResolvedValue(mockCrypto);
      mockCoinGeckoService.request.mockResolvedValue(mockApiResponse);
      mockPrisma.priceData.upsert.mockResolvedValue({});

      await service.fetchAndStoreHistory('bitcoin', 30);

      expect(mockPrisma.cryptocurrency.findUnique).toHaveBeenCalledWith({
        where: { coinGeckoId: 'bitcoin' },
      });
      
      expect(mockCoinGeckoService.request).toHaveBeenCalledWith(
        '/coins/bitcoin/market_chart?vs_currency=usd&days=30&interval=daily'
      );

      expect(mockPrisma.priceData.upsert).toHaveBeenCalledTimes(2);
    });

    it('should throw error if cryptocurrency not found', async () => {
      mockPrisma.cryptocurrency.findUnique.mockResolvedValue(null);

      await expect(service.fetchAndStoreHistory('invalid-coin', 30)).rejects.toThrow(
        'Cryptocurrency not found: invalid-coin'
      );
    });

    it('should handle API errors gracefully', async () => {
      const mockCrypto = {
        id: 'crypto-id-1',
        coinGeckoId: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
      };

      mockPrisma.cryptocurrency.findUnique.mockResolvedValue(mockCrypto);
      mockCoinGeckoService.request.mockRejectedValue(new Error('API error'));

      await expect(service.fetchAndStoreHistory('bitcoin', 30)).rejects.toThrow('API error');
    });
  });

  describe('getHistoricalData', () => {
    it('should retrieve historical price data from database', async () => {
      const mockCrypto = {
        id: 'crypto-id-1',
        coinGeckoId: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
      };

      const mockPriceData = [
        {
          id: 'price-1',
          cryptoId: 'crypto-id-1',
          price: 50000,
          volume24h: 30000000000,
          marketCap: 1000000000000,
          change24h: 0,
          timestamp: new Date('2024-01-01'),
        },
        {
          id: 'price-2',
          cryptoId: 'crypto-id-1',
          price: 51000,
          volume24h: 31000000000,
          marketCap: 1020000000000,
          change24h: 0,
          timestamp: new Date('2024-01-02'),
        },
      ];

      mockPrisma.cryptocurrency.findUnique.mockResolvedValue(mockCrypto);
      mockPrisma.priceData.findMany.mockResolvedValue(mockPriceData);

      const result = await service.getHistoricalData('bitcoin', 30);

      expect(mockPrisma.cryptocurrency.findUnique).toHaveBeenCalledWith({
        where: { coinGeckoId: 'bitcoin' },
      });

      expect(mockPrisma.priceData.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        price: 50000,
        volume24h: 30000000000,
        marketCap: 1000000000000,
      });
    });

    it('should throw error if cryptocurrency not found', async () => {
      mockPrisma.cryptocurrency.findUnique.mockResolvedValue(null);

      await expect(service.getHistoricalData('invalid-coin', 30)).rejects.toThrow(
        'Cryptocurrency not found: invalid-coin'
      );
    });
  });

  describe('getPriceAtTime', () => {
    it('should get price at specific timestamp', async () => {
      const mockCrypto = {
        id: 'crypto-id-1',
        coinGeckoId: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
      };

      const mockPricePoint = {
        id: 'price-1',
        cryptoId: 'crypto-id-1',
        price: 50000,
        volume24h: 30000000000,
        marketCap: 1000000000000,
        change24h: 0,
        timestamp: new Date('2024-01-01'),
      };

      mockPrisma.cryptocurrency.findUnique.mockResolvedValue(mockCrypto);
      mockPrisma.priceData.findFirst.mockResolvedValue(mockPricePoint);

      const targetDate = new Date('2024-01-01');
      const result = await service.getPriceAtTime('bitcoin', targetDate);

      expect(result).toBe(50000);
      expect(mockPrisma.priceData.findFirst).toHaveBeenCalledWith({
        where: {
          cryptoId: 'crypto-id-1',
          timestamp: { lte: targetDate },
        },
        orderBy: { timestamp: 'desc' },
      });
    });

    it('should return null if no price data found', async () => {
      const mockCrypto = {
        id: 'crypto-id-1',
        coinGeckoId: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
      };

      mockPrisma.cryptocurrency.findUnique.mockResolvedValue(mockCrypto);
      mockPrisma.priceData.findFirst.mockResolvedValue(null);

      const result = await service.getPriceAtTime('bitcoin', new Date());

      expect(result).toBeNull();
    });

    it('should return null if cryptocurrency not found', async () => {
      mockPrisma.cryptocurrency.findUnique.mockResolvedValue(null);

      const result = await service.getPriceAtTime('invalid-coin', new Date());

      expect(result).toBeNull();
    });
  });

  describe('calculatePriceChange', () => {
    it('should calculate price change over period', async () => {
      const mockCrypto = {
        id: 'crypto-id-1',
        coinGeckoId: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
      };

      const currentPricePoint = {
        id: 'price-current',
        cryptoId: 'crypto-id-1',
        price: 52000,
        volume24h: 32000000000,
        marketCap: 1040000000000,
        change24h: 0,
        timestamp: new Date(),
      };

      const pastPricePoint = {
        id: 'price-past',
        cryptoId: 'crypto-id-1',
        price: 50000,
        volume24h: 30000000000,
        marketCap: 1000000000000,
        change24h: 0,
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      };

      mockPrisma.cryptocurrency.findUnique.mockResolvedValue(mockCrypto);
      mockPrisma.priceData.findFirst
        .mockResolvedValueOnce(currentPricePoint)
        .mockResolvedValueOnce(pastPricePoint);

      const result = await service.calculatePriceChange('bitcoin', 7);

      expect(result.change).toBe(2000);
      expect(result.changePercentage).toBe(4);
    });

    it('should return zero if no price data available', async () => {
      const mockCrypto = {
        id: 'crypto-id-1',
        coinGeckoId: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
      };

      mockPrisma.cryptocurrency.findUnique.mockResolvedValue(mockCrypto);
      mockPrisma.priceData.findFirst.mockResolvedValue(null);

      const result = await service.calculatePriceChange('bitcoin', 7);

      expect(result.change).toBe(0);
      expect(result.changePercentage).toBe(0);
    });
  });

  describe('getTrackedCryptocurrencies', () => {
    it('should get list of tracked cryptocurrency IDs', async () => {
      const mockTracked = [
        {
          id: 'tracking-1',
          userId: 'user-1',
          cryptoId: 'crypto-1',
          crypto: {
            id: 'crypto-1',
            coinGeckoId: 'bitcoin',
            symbol: 'BTC',
            name: 'Bitcoin',
          },
        },
        {
          id: 'tracking-2',
          userId: 'user-2',
          cryptoId: 'crypto-2',
          crypto: {
            id: 'crypto-2',
            coinGeckoId: 'ethereum',
            symbol: 'ETH',
            name: 'Ethereum',
          },
        },
      ];

      mockPrisma.cryptoTracking.findMany.mockResolvedValue(mockTracked);

      const result = await service.getTrackedCryptocurrencies();

      expect(result).toEqual(['bitcoin', 'ethereum']);
    });

    it('should filter out null coinGeckoIds', async () => {
      const mockTracked = [
        {
          id: 'tracking-1',
          userId: 'user-1',
          cryptoId: 'crypto-1',
          crypto: {
            id: 'crypto-1',
            coinGeckoId: 'bitcoin',
            symbol: 'BTC',
            name: 'Bitcoin',
          },
        },
        {
          id: 'tracking-2',
          userId: 'user-2',
          cryptoId: 'crypto-2',
          crypto: {
            id: 'crypto-2',
            coinGeckoId: null,
            symbol: 'UNKNOWN',
            name: 'Unknown',
          },
        },
      ];

      mockPrisma.cryptoTracking.findMany.mockResolvedValue(mockTracked);

      const result = await service.getTrackedCryptocurrencies();

      expect(result).toEqual(['bitcoin']);
    });
  });

  describe('hasRecentData', () => {
    it('should return true if recent data exists', async () => {
      const mockCrypto = {
        id: 'crypto-id-1',
        coinGeckoId: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
      };

      const mockRecentData = {
        id: 'price-1',
        cryptoId: 'crypto-id-1',
        price: 50000,
        volume24h: 30000000000,
        marketCap: 1000000000000,
        change24h: 0,
        timestamp: new Date(),
      };

      mockPrisma.cryptocurrency.findUnique.mockResolvedValue(mockCrypto);
      mockPrisma.priceData.findFirst.mockResolvedValue(mockRecentData);

      const result = await service.hasRecentData('bitcoin', 24);

      expect(result).toBe(true);
    });

    it('should return false if no recent data exists', async () => {
      const mockCrypto = {
        id: 'crypto-id-1',
        coinGeckoId: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
      };

      mockPrisma.cryptocurrency.findUnique.mockResolvedValue(mockCrypto);
      mockPrisma.priceData.findFirst.mockResolvedValue(null);

      const result = await service.hasRecentData('bitcoin', 24);

      expect(result).toBe(false);
    });

    it('should return false if cryptocurrency not found', async () => {
      mockPrisma.cryptocurrency.findUnique.mockResolvedValue(null);

      const result = await service.hasRecentData('invalid-coin', 24);

      expect(result).toBe(false);
    });
  });

  describe('bulkFetchAndStore', () => {
    it('should fetch and store data for multiple cryptocurrencies', async () => {
      const mockCrypto = {
        id: 'crypto-id-1',
        coinGeckoId: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
      };

      const mockApiResponse = {
        prices: [[1640000000000, 50000]],
        market_caps: [[1640000000000, 1000000000000]],
        total_volumes: [[1640000000000, 30000000000]],
      };

      mockPrisma.cryptocurrency.findUnique.mockResolvedValue(mockCrypto);
      mockCoinGeckoService.request.mockResolvedValue(mockApiResponse);
      mockPrisma.priceData.upsert.mockResolvedValue({});

      await service.bulkFetchAndStore(['bitcoin', 'ethereum'], 7);

      // Should be called once for each coin
      expect(mockCoinGeckoService.request).toHaveBeenCalledTimes(2);
    });

    it('should handle errors for individual cryptocurrencies', async () => {
      mockPrisma.cryptocurrency.findUnique
        .mockResolvedValueOnce({ id: 'crypto-1', coinGeckoId: 'bitcoin' })
        .mockResolvedValueOnce(null);

      const mockApiResponse = {
        prices: [[1640000000000, 50000]],
        market_caps: [[1640000000000, 1000000000000]],
        total_volumes: [[1640000000000, 30000000000]],
      };

      mockCoinGeckoService.request.mockResolvedValue(mockApiResponse);
      mockPrisma.priceData.upsert.mockResolvedValue({});

      // Should not throw even if one coin fails
      await expect(service.bulkFetchAndStore(['bitcoin', 'invalid-coin'], 7)).resolves.not.toThrow();
    });
  });
});
