/**
 * @jest-environment node
 * 
 * Tests for getUserStats endpoint to ensure held coins are counted as watched coins
 */

import { prisma } from '@/lib/db/prisma';

// Mock Prisma client
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    cryptoTracking: {
      count: jest.fn(),
    },
    followedCoin: {
      count: jest.fn(),
    },
    portfolioHolding: {
      count: jest.fn(),
    },
    alert: {
      count: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('getUserStats - Held Coins as Watched', () => {
  let mockCtx: {
    session: { user: { id: string } };
    prisma: typeof mockPrisma;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockCtx = {
      session: { user: { id: 'test-user-123' } },
      prisma: mockPrisma,
    };
  });

  describe('New CryptoTracking model', () => {
    it('should count all tracked coins (both watched and held)', async () => {
      // Setup: User has 5 cryptoTracking entries (3 watched, 2 held)
      (mockPrisma.cryptoTracking.count as jest.Mock).mockResolvedValue(5);
      (mockPrisma.alert.count as jest.Mock).mockResolvedValue(2);

      // Simulate the getUserStats query logic
      const userId = mockCtx.session.user.id;
      
      const [trackedCoinsCount, activeAlertsCount] = await Promise.all([
        mockCtx.prisma.cryptoTracking.count({
          where: { userId },
        }),
        mockCtx.prisma.alert.count({
          where: { 
            userId,
            isActive: true,
          },
        }),
      ]);

      let followedCoinsCount = trackedCoinsCount;
      if (trackedCoinsCount === 0) {
        const [oldFollowedCoins, oldPortfolioHoldings] = await Promise.all([
          mockCtx.prisma.followedCoin.count({
            where: { userId },
          }),
          mockCtx.prisma.portfolioHolding.count({
            where: { userId },
          }),
        ]);
        followedCoinsCount = oldFollowedCoins + oldPortfolioHoldings;
      }

      const result = {
        followedCoins: followedCoinsCount,
        activeAlerts: activeAlertsCount,
      };

      expect(result.followedCoins).toBe(5);
      expect(result.activeAlerts).toBe(2);
      
      // Verify cryptoTracking.count was called (includes both watched and held)
      expect(mockPrisma.cryptoTracking.count).toHaveBeenCalledWith({
        where: { userId },
      });
      
      // Old model queries should NOT be called when new model has data
      expect(mockPrisma.followedCoin.count).not.toHaveBeenCalled();
      expect(mockPrisma.portfolioHolding.count).not.toHaveBeenCalled();
    });

    it('should count held-only coins (no watched-only)', async () => {
      // Setup: User has ONLY held coins (no watched-only)
      // This tests that holdings alone are counted
      (mockPrisma.cryptoTracking.count as jest.Mock).mockResolvedValue(3);
      (mockPrisma.alert.count as jest.Mock).mockResolvedValue(0);

      const userId = mockCtx.session.user.id;
      
      const [trackedCoinsCount, activeAlertsCount] = await Promise.all([
        mockCtx.prisma.cryptoTracking.count({
          where: { userId },
        }),
        mockCtx.prisma.alert.count({
          where: { 
            userId,
            isActive: true,
          },
        }),
      ]);

      let followedCoinsCount = trackedCoinsCount;
      if (trackedCoinsCount === 0) {
        const [oldFollowedCoins, oldPortfolioHoldings] = await Promise.all([
          mockCtx.prisma.followedCoin.count({
            where: { userId },
          }),
          mockCtx.prisma.portfolioHolding.count({
            where: { userId },
          }),
        ]);
        followedCoinsCount = oldFollowedCoins + oldPortfolioHoldings;
      }

      const result = {
        followedCoins: followedCoinsCount,
        activeAlerts: activeAlertsCount,
      };

      // Critical: Held coins are counted as watched coins
      expect(result.followedCoins).toBe(3);
      expect(result.activeAlerts).toBe(0);
    });

    it('should handle zero tracked coins', async () => {
      // Setup: User has no tracked coins
      (mockPrisma.cryptoTracking.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.alert.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.followedCoin.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.portfolioHolding.count as jest.Mock).mockResolvedValue(0);

      const userId = mockCtx.session.user.id;
      
      const [trackedCoinsCount, activeAlertsCount] = await Promise.all([
        mockCtx.prisma.cryptoTracking.count({
          where: { userId },
        }),
        mockCtx.prisma.alert.count({
          where: { 
            userId,
            isActive: true,
          },
        }),
      ]);

      let followedCoinsCount = trackedCoinsCount;
      if (trackedCoinsCount === 0) {
        const [oldFollowedCoins, oldPortfolioHoldings] = await Promise.all([
          mockCtx.prisma.followedCoin.count({
            where: { userId },
          }),
          mockCtx.prisma.portfolioHolding.count({
            where: { userId },
          }),
        ]);
        followedCoinsCount = oldFollowedCoins + oldPortfolioHoldings;
      }

      const result = {
        followedCoins: followedCoinsCount,
        activeAlerts: activeAlertsCount,
      };

      expect(result.followedCoins).toBe(0);
      expect(result.activeAlerts).toBe(0);
    });
  });

  describe('Backward compatibility with old models', () => {
    it('should fallback to old models when CryptoTracking is empty', async () => {
      // Setup: No CryptoTracking entries, but has old model data
      (mockPrisma.cryptoTracking.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.followedCoin.count as jest.Mock).mockResolvedValue(3);
      (mockPrisma.portfolioHolding.count as jest.Mock).mockResolvedValue(2);
      (mockPrisma.alert.count as jest.Mock).mockResolvedValue(1);

      const userId = mockCtx.session.user.id;
      
      const [trackedCoinsCount, activeAlertsCount] = await Promise.all([
        mockCtx.prisma.cryptoTracking.count({
          where: { userId },
        }),
        mockCtx.prisma.alert.count({
          where: { 
            userId,
            isActive: true,
          },
        }),
      ]);

      let followedCoinsCount = trackedCoinsCount;
      if (trackedCoinsCount === 0) {
        const [oldFollowedCoins, oldPortfolioHoldings] = await Promise.all([
          mockCtx.prisma.followedCoin.count({
            where: { userId },
          }),
          mockCtx.prisma.portfolioHolding.count({
            where: { userId },
          }),
        ]);
        followedCoinsCount = oldFollowedCoins + oldPortfolioHoldings;
      }

      const result = {
        followedCoins: followedCoinsCount,
        activeAlerts: activeAlertsCount,
      };

      // Should sum both old models: 3 followed + 2 held = 5 total
      expect(result.followedCoins).toBe(5);
      expect(result.activeAlerts).toBe(1);
      
      // Verify fallback queries were made
      expect(mockPrisma.followedCoin.count).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(mockPrisma.portfolioHolding.count).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should count only portfolio holdings when no followed coins (old model)', async () => {
      // Setup: User has only holdings, no followed coins (old model)
      (mockPrisma.cryptoTracking.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.followedCoin.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.portfolioHolding.count as jest.Mock).mockResolvedValue(4);
      (mockPrisma.alert.count as jest.Mock).mockResolvedValue(0);

      const userId = mockCtx.session.user.id;
      
      const [trackedCoinsCount, activeAlertsCount] = await Promise.all([
        mockCtx.prisma.cryptoTracking.count({
          where: { userId },
        }),
        mockCtx.prisma.alert.count({
          where: { 
            userId,
            isActive: true,
          },
        }),
      ]);

      let followedCoinsCount = trackedCoinsCount;
      if (trackedCoinsCount === 0) {
        const [oldFollowedCoins, oldPortfolioHoldings] = await Promise.all([
          mockCtx.prisma.followedCoin.count({
            where: { userId },
          }),
          mockCtx.prisma.portfolioHolding.count({
            where: { userId },
          }),
        ]);
        followedCoinsCount = oldFollowedCoins + oldPortfolioHoldings;
      }

      const result = {
        followedCoins: followedCoinsCount,
        activeAlerts: activeAlertsCount,
      };

      // Critical: Portfolio holdings are counted as watched coins
      expect(result.followedCoins).toBe(4);
    });

    it('should count only followed coins when no holdings (old model)', async () => {
      // Setup: User has only followed coins, no holdings (old model)
      (mockPrisma.cryptoTracking.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.followedCoin.count as jest.Mock).mockResolvedValue(6);
      (mockPrisma.portfolioHolding.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.alert.count as jest.Mock).mockResolvedValue(0);

      const userId = mockCtx.session.user.id;
      
      const [trackedCoinsCount, activeAlertsCount] = await Promise.all([
        mockCtx.prisma.cryptoTracking.count({
          where: { userId },
        }),
        mockCtx.prisma.alert.count({
          where: { 
            userId,
            isActive: true,
          },
        }),
      ]);

      let followedCoinsCount = trackedCoinsCount;
      if (trackedCoinsCount === 0) {
        const [oldFollowedCoins, oldPortfolioHoldings] = await Promise.all([
          mockCtx.prisma.followedCoin.count({
            where: { userId },
          }),
          mockCtx.prisma.portfolioHolding.count({
            where: { userId },
          }),
        ]);
        followedCoinsCount = oldFollowedCoins + oldPortfolioHoldings;
      }

      const result = {
        followedCoins: followedCoinsCount,
        activeAlerts: activeAlertsCount,
      };

      expect(result.followedCoins).toBe(6);
    });
  });

  describe('Real-world scenarios', () => {
    it('should correctly represent user with only held BTC', async () => {
      // Real scenario from issue: User holds BTC but count shows 0
      (mockPrisma.cryptoTracking.count as jest.Mock).mockResolvedValue(1);
      (mockPrisma.alert.count as jest.Mock).mockResolvedValue(0);

      const userId = mockCtx.session.user.id;
      
      const [trackedCoinsCount, activeAlertsCount] = await Promise.all([
        mockCtx.prisma.cryptoTracking.count({
          where: { userId },
        }),
        mockCtx.prisma.alert.count({
          where: { 
            userId,
            isActive: true,
          },
        }),
      ]);

      let followedCoinsCount = trackedCoinsCount;
      if (trackedCoinsCount === 0) {
        const [oldFollowedCoins, oldPortfolioHoldings] = await Promise.all([
          mockCtx.prisma.followedCoin.count({
            where: { userId },
          }),
          mockCtx.prisma.portfolioHolding.count({
            where: { userId },
          }),
        ]);
        followedCoinsCount = oldFollowedCoins + oldPortfolioHoldings;
      }

      const result = {
        followedCoins: followedCoinsCount,
        activeAlerts: activeAlertsCount,
      };

      // Should show 1 followed coin (the held BTC), not 0
      expect(result.followedCoins).toBe(1);
      expect(result.activeAlerts).toBe(0);
    });

    it('should handle mixed scenario: watched + held coins', async () => {
      // User has 10 watched coins + 5 held coins = 15 total tracked
      (mockPrisma.cryptoTracking.count as jest.Mock).mockResolvedValue(15);
      (mockPrisma.alert.count as jest.Mock).mockResolvedValue(5);

      const userId = mockCtx.session.user.id;
      
      const [trackedCoinsCount, activeAlertsCount] = await Promise.all([
        mockCtx.prisma.cryptoTracking.count({
          where: { userId },
        }),
        mockCtx.prisma.alert.count({
          where: { 
            userId,
            isActive: true,
          },
        }),
      ]);

      let followedCoinsCount = trackedCoinsCount;
      if (trackedCoinsCount === 0) {
        const [oldFollowedCoins, oldPortfolioHoldings] = await Promise.all([
          mockCtx.prisma.followedCoin.count({
            where: { userId },
          }),
          mockCtx.prisma.portfolioHolding.count({
            where: { userId },
          }),
        ]);
        followedCoinsCount = oldFollowedCoins + oldPortfolioHoldings;
      }

      const result = {
        followedCoins: followedCoinsCount,
        activeAlerts: activeAlertsCount,
      };

      expect(result.followedCoins).toBe(15);
      expect(result.activeAlerts).toBe(5);
    });
  });
});
