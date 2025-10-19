import { PortfolioAnalyticsService } from '@/services/analytics/portfolio-analytics.service';
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset } from 'jest-mock-extended';

// Mock fetch globally
global.fetch = jest.fn();

const mockPrisma = mockDeep<PrismaClient>();

describe('PortfolioAnalyticsService', () => {
  let service: PortfolioAnalyticsService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReset(mockPrisma);
    service = new PortfolioAnalyticsService(mockPrisma);
  });

  describe('getPortfolioMetrics', () => {
    it('should return default metrics for user with no tracked cryptocurrencies', async () => {
      mockPrisma.cryptoTracking.findMany.mockResolvedValue([]);

      const result = await service.getPortfolioMetrics('user-1');

      expect(result).toEqual({
        totalValue: 0,
        totalGainLoss: 0,
        gainLossPercentage: 0,
        topPerformer: null,
        worstPerformer: null,
        portfolioDistribution: [],
      });
    });

    it('should calculate portfolio metrics correctly', async () => {
      const mockTrackedCryptos = [
        {
          crypto: {
            id: 'crypto-1',
            symbol: 'BTC',
            name: 'Bitcoin',
            coinGeckoId: 'bitcoin',
          },
        },
        {
          crypto: {
            id: 'crypto-2',
            symbol: 'ETH',
            name: 'Ethereum',
            coinGeckoId: 'ethereum',
          },
        },
      ];

      const mockPriceData = [
        {
          id: 'bitcoin',
          symbol: 'btc',
          name: 'Bitcoin',
          current_price: 50000,
          price_change_percentage_24h: 5.0,
          market_cap: 1000000000000,
          total_volume: 50000000000,
        },
        {
          id: 'ethereum',
          symbol: 'eth',
          name: 'Ethereum',
          current_price: 3000,
          price_change_percentage_24h: -2.0,
          market_cap: 360000000000,
          total_volume: 20000000000,
        },
      ];

      mockPrisma.cryptoTracking.findMany.mockResolvedValue(mockTrackedCryptos as any);

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPriceData,
      });

      const result = await service.getPortfolioMetrics('user-1');

      expect(result.portfolioDistribution).toHaveLength(2);
      expect(result.topPerformer?.symbol).toBe('BTC');
      expect(result.worstPerformer?.symbol).toBe('ETH');
      expect(result.totalValue).toBeGreaterThan(0);
    });

    it('should handle API errors gracefully', async () => {
      const mockTrackedCryptos = [
        {
          crypto: {
            id: 'crypto-1',
            symbol: 'BTC',
            name: 'Bitcoin',
            coinGeckoId: 'bitcoin',
          },
        },
      ];

      mockPrisma.cryptoTracking.findMany.mockResolvedValue(mockTrackedCryptos as any);

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const result = await service.getPortfolioMetrics('user-1');

      expect(result.portfolioDistribution).toHaveLength(0);
      expect(result.totalValue).toBe(0);
    });
  });

  describe('getMarketOverview', () => {
    it('should fetch market overview data successfully', async () => {
      const mockGlobalData = {
        data: {
          total_market_cap: { usd: 2000000000000 },
          market_cap_change_percentage_24h_usd: 1.5,
          total_volume: { usd: 100000000000 },
          market_cap_percentage: { btc: 45.0 },
        },
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGlobalData,
      });

      const result = await service.getMarketOverview();

      expect(result.totalMarketCap).toBe(2000000000000);
      expect(result.totalMarketCapChange24h).toBe(1.5);
      expect(result.totalVolume24h).toBe(100000000000);
      expect(result.btcDominance).toBe(45.0);
    });

    it('should handle API errors gracefully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await service.getMarketOverview();

      expect(result).toEqual({
        totalMarketCap: 0,
        totalMarketCapChange24h: 0,
        totalVolume24h: 0,
        btcDominance: 0,
      });
    });
  });

  describe('getSentimentAnalytics', () => {
    it('should calculate sentiment analytics for user portfolio', async () => {
      const mockTrackedCryptos = [
        {
          crypto: {
            id: 'crypto-1',
            symbol: 'BTC',
            name: 'Bitcoin',
          },
        },
      ];

      mockPrisma.cryptoTracking.findMany.mockResolvedValue(mockTrackedCryptos as any);
      mockPrisma.usageLog.count.mockResolvedValue(15);

      const result = await service.getSentimentAnalytics('user-1');

      expect(result.recentAnalyses).toBe(15);
      expect(result.topSentimentCoins).toHaveLength(1);
      expect(result.sentimentTrend).toMatch(/BULLISH|BEARISH|NEUTRAL/);
      expect(result.averageSentiment).toBeGreaterThanOrEqual(-1);
      expect(result.averageSentiment).toBeLessThanOrEqual(1);
    });
  });

  describe('getAlertAnalytics', () => {
    it('should calculate alert analytics for user', async () => {
      const mockAlerts = [
        {
          id: 'alert-1',
          type: 'PRICE_CHANGE',
          triggerCount: 2,
          updatedAt: new Date(),
          crypto: {
            symbol: 'BTC',
          },
        },
      ];

      mockPrisma.alert.count.mockResolvedValue(5);
      mockPrisma.alert.findMany.mockResolvedValue(mockAlerts as any);
      mockPrisma.alert.groupBy.mockResolvedValue([
        { type: 'PRICE_CHANGE', _count: { type: 3 } },
        { type: 'SENTIMENT_CHANGE', _count: { type: 2 } },
      ] as any);

      const result = await service.getAlertAnalytics('user-1');

      expect(result.totalAlerts).toBe(5);
      expect(result.alertsByType).toEqual({
        PRICE_CHANGE: 3,
        SENTIMENT_CHANGE: 2,
      });
      expect(result.recentTriggers).toHaveLength(1);
    });
  });

  describe('getPerformanceMetrics', () => {
    it('should calculate performance metrics for different timeframes', async () => {
      const result = await service.getPerformanceMetrics('user-1', '30d');

      expect(result.timeframe).toBe('30d');
      expect(result.returns).toBeDefined();
      expect(result.volatility).toBeDefined();
      expect(result.sharpeRatio).toBeDefined();
      expect(result.maxDrawdown).toBeDefined();
      expect(result.winRate).toBeDefined();
      expect(result.bestDay).toBeDefined();
      expect(result.worstDay).toBeDefined();
    });

    it('should handle different timeframes', async () => {
      const timeframes: Array<'24h' | '7d' | '30d' | '1y'> = ['24h', '7d', '30d', '1y'];

      for (const timeframe of timeframes) {
        const result = await service.getPerformanceMetrics('user-1', timeframe);
        expect(result.timeframe).toBe(timeframe);
      }
    });
  });

  describe('getPriceHistory', () => {
    it('should fetch price history successfully', async () => {
      const mockPriceData = {
        prices: [
          [1640995200000, 47000],
          [1641081600000, 48000],
          [1641168000000, 49000],
        ],
        market_caps: [
          [1640995200000, 890000000000],
          [1641081600000, 910000000000],
          [1641168000000, 930000000000],
        ],
        total_volumes: [
          [1640995200000, 25000000000],
          [1641081600000, 27000000000],
          [1641168000000, 29000000000],
        ],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPriceData,
      });

      const result = await service.getPriceHistory('bitcoin', 7);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        timestamp: new Date(1640995200000).toISOString(),
        price: 47000,
        marketCap: 890000000000,
        volume: 25000000000,
      });
    });

    it('should handle API errors gracefully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await service.getPriceHistory('invalid-crypto', 7);

      expect(result).toEqual([]);
    });
  });

  describe('getAnalyticsData', () => {
    it('should return comprehensive analytics data', async () => {
      // Mock all dependencies
      mockPrisma.cryptoTracking.findMany.mockResolvedValue([]);
      mockPrisma.usageLog.count.mockResolvedValue(0);
      mockPrisma.alert.count.mockResolvedValue(0);
      mockPrisma.alert.findMany.mockResolvedValue([]);
      mockPrisma.alert.groupBy.mockResolvedValue([]);

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            total_market_cap: { usd: 2000000000000 },
            market_cap_change_percentage_24h_usd: 1.5,
            total_volume: { usd: 100000000000 },
            market_cap_percentage: { btc: 45.0 },
          },
        }),
      });

      const result = await service.getAnalyticsData('user-1');

      expect(result).toHaveProperty('portfolioMetrics');
      expect(result).toHaveProperty('marketOverview');
      expect(result).toHaveProperty('sentimentAnalytics');
      expect(result).toHaveProperty('alertAnalytics');
    });
  });
});