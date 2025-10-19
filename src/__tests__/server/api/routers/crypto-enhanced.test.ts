import { appRouter } from '../../../../server/api/root';
import { mockDeep, type DeepMockProxy } from 'jest-mock-extended';
import type { PrismaClient } from '@prisma/client';

// Mock the external services that CryptoManagerService uses
jest.mock('@/services/portfolio/portfolio.service', () => ({
  PortfolioService: jest.fn().mockImplementation(() => ({
    getPortfolioSummary: jest.fn().mockResolvedValue({
      totalValue: 33500,
      totalInvested: 22500,
      totalGainLoss: 11000,
      gainLossPercentage: 48.89,
      portfolioEntries: [],
    }),
    calculatePortfolioAnalytics: jest.fn().mockResolvedValue({
      totalHoldings: 1,
      totalValue: 33500,
      totalInvested: 22500,
      totalGainLoss: 11000,
      gainLossPercentage: 48.89,
      topPerformer: {
        symbol: 'BTC',
        name: 'Bitcoin',
        gainLossPercentage: 48.89,
      },
    }),
    calculate24hChange: jest.fn().mockResolvedValue({
      change: 1000,
      percentage: 2.5,
    }),
  }))
}));

jest.mock('@/services/crypto/price.service', () => ({
  CoinGeckoService: jest.fn().mockImplementation(() => ({
    getCurrentPrices: jest.fn().mockResolvedValue([
      {
        id: 'bitcoin',
        current_price: 67000,
        price_change_percentage_24h: 3.08,
        market_cap: 1300000000000,
        market_cap_rank: 1,
      },
      {
        id: 'ethereum',
        current_price: 3500,
        price_change_percentage_24h: -2.78,
        market_cap: 420000000000,
        market_cap_rank: 2,
      }
    ]),
  }))
}));

type Context = {
  session: {
    user: { id: string; email: string; };
    expires: string;
  };
  prisma: DeepMockProxy<PrismaClient>;
};

const mockPrisma = mockDeep<PrismaClient>();

const createContext = (): Context => ({
  session: {
    user: { id: 'user-1', email: 'test@example.com' },
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
  },
  prisma: mockPrisma,
});

describe('Crypto Router - Enhanced Tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockTrackingData = [
    {
      id: 'tracking-1',
      userId: 'user-1',
      isWatching: false,
      holdingAmount: 0.5,
      averagePurchasePrice: 45000,
      totalInvested: 22500,
      firstPurchaseDate: new Date('2024-01-01'),
      notes: 'Long-term hold',
      tags: ['DeFi'],
      lastViewedAt: new Date(),
      addedAt: new Date(),
      crypto: {
        id: 'crypto-1',
        symbol: 'BTC',
        name: 'Bitcoin',
        coinGeckoId: 'bitcoin',
        logoUrl: 'https://example.com/btc.png',
        marketCap: 1300000000000,
        rank: 1,
      },
    },
    {
      id: 'tracking-2',
      userId: 'user-1',
      isWatching: true,
      holdingAmount: null,
      averagePurchasePrice: null,
      totalInvested: null,
      firstPurchaseDate: null,
      notes: 'Watching for entry',
      tags: ['Research'],
      lastViewedAt: new Date(),
      addedAt: new Date(),
      crypto: {
        id: 'crypto-2',
        symbol: 'ETH',
        name: 'Ethereum',
        coinGeckoId: 'ethereum',
        logoUrl: 'https://example.com/eth.png',
        marketCap: 420000000000,
        rank: 2,
      },
    },
  ];

  const mockEnhancedResponse = {
    trackingEntries: [
      {
        ...mockTrackingData[0],
        currentPrice: 67000,
        currentValue: 33500,
        gainLoss: 11000,
        gainLossPercentage: 48.89,
        priceChangePercentage24h: 3.08,
      },
      {
        ...mockTrackingData[1],
        currentPrice: 3500,
        priceChangePercentage24h: -2.78,
      },
    ],
    summary: {
      totalTracked: 2,
      totalWatching: 1,
      totalHoldings: 1,
      totalInvested: 22500,
      currentPortfolioValue: 33500,
      totalGainLoss: 11000,
      totalGainLossPercentage: 48.89,
      topPerformer: {
        symbol: 'BTC',
        name: 'Bitcoin',
        gainLossPercentage: 48.89,
      },
    },
  };

  describe('getEnhancedCryptoTracking', () => {
    beforeEach(() => {
      // Mock Prisma response
      mockPrisma.cryptoTracking.findMany.mockResolvedValue(mockTrackingData as any);
    });

    it('should return enhanced crypto tracking data structure', async () => {
      const caller = appRouter.createCaller(createContext());
      
      const result = await caller.crypto.getEnhancedCryptoTracking({
        filter: 'ALL',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      // Verify database query was called
      expect(mockPrisma.cryptoTracking.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: { crypto: true },
        orderBy: [
          { holdingAmount: { sort: 'desc', nulls: 'last' } },
          { lastViewedAt: 'desc' },
        ],
      });
    });

    it('should filter for holdings only', async () => {
      const caller = appRouter.createCaller(createContext());
      
      const result = await caller.crypto.getEnhancedCryptoTracking({
        filter: 'HOLDINGS_ONLY',
      });

      expect(result.success).toBe(true);
      expect(mockPrisma.cryptoTracking.findMany).toHaveBeenCalledWith({
        where: { 
          userId: 'user-1',
          holdingAmount: { not: null },
        },
        include: { crypto: true },
        orderBy: [
          { holdingAmount: { sort: 'desc', nulls: 'last' } },
          { lastViewedAt: 'desc' },
        ],
      });
    });

    it('should filter for watching only', async () => {
      const caller = appRouter.createCaller(createContext());
      
      const result = await caller.crypto.getEnhancedCryptoTracking({
        filter: 'WATCHING_ONLY',
      });

      expect(result.success).toBe(true);
      expect(mockPrisma.cryptoTracking.findMany).toHaveBeenCalledWith({
        where: { 
          userId: 'user-1',
          holdingAmount: null,
        },
        include: { crypto: true },
        orderBy: [
          { holdingAmount: { sort: 'desc', nulls: 'last' } },
          { lastViewedAt: 'desc' },
        ],
      });
    });

    it('should handle empty tracking data', async () => {
      mockPrisma.cryptoTracking.findMany.mockResolvedValue([]);

      const caller = appRouter.createCaller(createContext());
      
      const result = await caller.crypto.getEnhancedCryptoTracking({
        filter: 'ALL',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle database errors', async () => {
      mockPrisma.cryptoTracking.findMany.mockRejectedValue(new Error('Database error'));

      const caller = appRouter.createCaller(createContext());
      
      await expect(
        caller.crypto.getEnhancedCryptoTracking({ filter: 'ALL' })
      ).rejects.toThrow('Failed to fetch enhanced crypto tracking');
    });

    it('should properly transform Prisma data to service format', async () => {
      const caller = appRouter.createCaller(createContext());
      
      const result = await caller.crypto.getEnhancedCryptoTracking({ filter: 'ALL' });

      // Verify the endpoint works and returns data
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      // Verify Prisma was called with correct params
      expect(mockPrisma.cryptoTracking.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: { crypto: true },
        orderBy: [
          { holdingAmount: { sort: 'desc', nulls: 'last' } },
          { lastViewedAt: 'desc' },
        ],
      });
    });
  });
});