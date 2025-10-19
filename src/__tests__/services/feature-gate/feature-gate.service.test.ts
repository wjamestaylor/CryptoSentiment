/**
 * Tests for Feature Gate Service
 * Tests usage tracking, limits, and subscription-based access control
 */

import { FeatureGateService } from '@/services/feature-gate/feature-gate.service';
import { UsageType } from '@prisma/client';

// Mock Prisma
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    usageLog: {
      count: jest.fn(),
      create: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/db/prisma';

describe('FeatureGateService', () => {
  let featureGateService: FeatureGateService;
  let mockPrisma: any;

  beforeEach(() => {
    featureGateService = new FeatureGateService();
    mockPrisma = prisma as any;
    jest.clearAllMocks();
  });

  describe('getUserUsage', () => {
    it('should get usage info for FREE tier user', async () => {
      const mockUser = {
        id: 'user-123',
        subscription: { tier: 'FREE' },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.usageLog.count.mockResolvedValue(3);

      const result = await featureGateService.getUserUsage('user-123', UsageType.AI_ANALYSIS);

      expect(result).toEqual({
        currentUsage: 3,
        limit: 5, // FREE tier AI_ANALYSIS limit
        resetDate: expect.any(Date),
      });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        include: { subscription: true },
      });
    });

    it('should get usage info for PRO tier user', async () => {
      const mockUser = {
        id: 'user-123',
        subscription: { tier: 'PRO' },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.usageLog.count.mockResolvedValue(25);

      const result = await featureGateService.getUserUsage('user-123', UsageType.AI_ANALYSIS);

      expect(result).toEqual({
        currentUsage: 25,
        limit: 100,
        resetDate: expect.any(Date),
      });
    });

    it('should get usage info for BUSINESS tier user', async () => {
      const mockUser = {
        id: 'user-123',
        subscription: { tier: 'BUSINESS' },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.usageLog.count.mockResolvedValue(500);

      const result = await featureGateService.getUserUsage('user-123', UsageType.AI_ANALYSIS);

      expect(result).toEqual({
        currentUsage: 500,
        limit: 1000,
        resetDate: expect.any(Date),
      });
    });

    it('should handle user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(featureGateService.getUserUsage('user-123', UsageType.AI_ANALYSIS))
        .rejects.toThrow('User not found');
    });

    it('should query usage for current month only', async () => {
      const mockUser = {
        id: 'user-123',
        subscription: { tier: 'FREE' },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.usageLog.count.mockResolvedValue(3);

      await featureGateService.getUserUsage('user-123', UsageType.AI_ANALYSIS);

      const countCall = mockPrisma.usageLog.count.mock.calls[0][0];
      expect(countCall.where.type).toBe(UsageType.AI_ANALYSIS);
      expect(countCall.where.userId).toBe('user-123');
      expect(countCall.where.createdAt.gte).toBeInstanceOf(Date);
      expect(countCall.where.createdAt.lte).toBeInstanceOf(Date);
    });
  });

  describe('canPerformAIAnalysis', () => {
    it('should allow AI analysis when under limit', async () => {
      const mockUser = {
        id: 'user-123',
        subscription: { tier: 'FREE' },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.usageLog.count.mockResolvedValue(3); // Under limit of 5

      const result = await featureGateService.canPerformAIAnalysis('user-123');

      expect(result).toBe(true);
    });

    it('should deny AI analysis when at limit', async () => {
      const mockUser = {
        id: 'user-123',
        subscription: { tier: 'FREE' },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.usageLog.count.mockResolvedValue(5); // At limit

      const result = await featureGateService.canPerformAIAnalysis('user-123');

      expect(result).toBe(false);
    });

    it('should deny AI analysis when over limit', async () => {
      const mockUser = {
        id: 'user-123',
        subscription: { tier: 'FREE' },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.usageLog.count.mockResolvedValue(7); // Over limit

      const result = await featureGateService.canPerformAIAnalysis('user-123');

      expect(result).toBe(false);
    });

    it('should fail open on errors', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      const result = await featureGateService.canPerformAIAnalysis('user-123');

      expect(result).toBe(true); // Fail open
    });
  });

  describe('trackUsage', () => {
    it('should track usage successfully', async () => {
      mockPrisma.usageLog.create.mockResolvedValue({
        id: 'log-123',
        userId: 'user-123',
        type: UsageType.AI_ANALYSIS,
      });

      await featureGateService.trackUsage('user-123', UsageType.AI_ANALYSIS, 'BTC', { symbol: 'BTC' });

      expect(mockPrisma.usageLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          type: UsageType.AI_ANALYSIS,
          resource: 'BTC',
          metadata: '{"symbol":"BTC"}',
        },
      });
    });

    it('should track usage without metadata', async () => {
      mockPrisma.usageLog.create.mockResolvedValue({
        id: 'log-123',
        userId: 'user-123',
        type: UsageType.ALERT_CREATION,
      });

      await featureGateService.trackUsage('user-123', UsageType.ALERT_CREATION, 'ALERT_1');

      expect(mockPrisma.usageLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          type: UsageType.ALERT_CREATION,
          resource: 'ALERT_1',
          metadata: null,
        },
      });
    });

    it('should not throw on database errors', async () => {
      mockPrisma.usageLog.create.mockRejectedValue(new Error('Database error'));

      // Should not throw
      await expect(
        featureGateService.trackUsage('user-123', UsageType.AI_ANALYSIS, 'BTC')
      ).resolves.not.toThrow();
    });
  });

  describe('canCreateAlert', () => {
    it('should allow alert creation when under limit', async () => {
      const mockUser = {
        id: 'user-123',
        subscription: { tier: 'PRO' },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.usageLog.count.mockResolvedValue(100); // Under limit of 500

      const result = await featureGateService.canCreateAlert('user-123');

      expect(result).toBe(true);
    });

    it('should deny alert creation when at limit', async () => {
      const mockUser = {
        id: 'user-123',
        subscription: { tier: 'FREE' },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.usageLog.count.mockResolvedValue(10); // At limit

      const result = await featureGateService.canCreateAlert('user-123');

      expect(result).toBe(false);
    });
  });

  describe('canAddToWatchlist', () => {
    it('should allow watchlist addition when under limit', async () => {
      const mockUser = {
        id: 'user-123',
        subscription: { tier: 'BUSINESS' },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.usageLog.count.mockResolvedValue(500); // Under limit of 10000

      const result = await featureGateService.canAddToWatchlist('user-123');

      expect(result).toBe(true);
    });

    it('should deny watchlist addition when at limit', async () => {
      const mockUser = {
        id: 'user-123',
        subscription: { tier: 'FREE' },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.usageLog.count.mockResolvedValue(50); // At limit

      const result = await featureGateService.canAddToWatchlist('user-123');

      expect(result).toBe(false);
    });
  });

  describe('canReceiveBotNotification', () => {
    it('should allow bot notification when under limit', async () => {
      const mockUser = {
        id: 'user-123',
        subscription: { tier: 'PRO' },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.usageLog.count.mockResolvedValue(100); // Under limit of 500

      const result = await featureGateService.canReceiveBotNotification('user-123');

      expect(result).toBe(true);
    });

    it('should deny bot notification when at limit', async () => {
      const mockUser = {
        id: 'user-123',
        subscription: { tier: 'FREE' },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.usageLog.count.mockResolvedValue(10); // At limit

      const result = await featureGateService.canReceiveBotNotification('user-123');

      expect(result).toBe(false);
    });
  });

  describe('getUserUsageStats', () => {
    it('should get usage stats for all usage types', async () => {
      const mockUser = {
        id: 'user-123',
        subscription: { tier: 'PRO' },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      
      // Mock different usage counts for different types (in enum order: ALERT_CREATION, AI_ANALYSIS, WATCHLIST_ADD, BOT_NOTIFICATION)
      mockPrisma.usageLog.count
        .mockResolvedValueOnce(100) // ALERT_CREATION
        .mockResolvedValueOnce(25) // AI_ANALYSIS
        .mockResolvedValueOnce(300) // WATCHLIST_ADD
        .mockResolvedValueOnce(50); // BOT_NOTIFICATION

      const result = await featureGateService.getUserUsageStats('user-123');

      expect(result).toEqual({
        [UsageType.ALERT_CREATION]: {
          currentUsage: 100,
          limit: 500,
          resetDate: expect.any(Date),
        },
        [UsageType.AI_ANALYSIS]: {
          currentUsage: 25,
          limit: 100,
          resetDate: expect.any(Date),
        },
        [UsageType.WATCHLIST_ADD]: {
          currentUsage: 300,
          limit: 1000,
          resetDate: expect.any(Date),
        },
        [UsageType.BOT_NOTIFICATION]: {
          currentUsage: 50,
          limit: 500,
          resetDate: expect.any(Date),
        },
      });
    });

    it('should handle errors gracefully in stats collection', async () => {
      // Set up user lookup to succeed for first 3 calls, fail on 4th (ALERT_CREATION)
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: 'user-123', subscription: { tier: 'PRO' } }) // ALERT_CREATION - will fail below
        .mockResolvedValueOnce({ id: 'user-123', subscription: { tier: 'PRO' } }) // AI_ANALYSIS - success
        .mockResolvedValueOnce({ id: 'user-123', subscription: { tier: 'PRO' } }) // WATCHLIST_ADD - success
        .mockResolvedValueOnce({ id: 'user-123', subscription: { tier: 'PRO' } }); // BOT_NOTIFICATION - success

      // Set up usage count to fail for first call (ALERT_CREATION), succeed for others
      mockPrisma.usageLog.count
        .mockRejectedValueOnce(new Error('Database error')) // ALERT_CREATION - fail
        .mockResolvedValueOnce(25) // AI_ANALYSIS - success
        .mockResolvedValueOnce(100) // WATCHLIST_ADD - success
        .mockResolvedValueOnce(50); // BOT_NOTIFICATION - success

      const result = await featureGateService.getUserUsageStats('user-123');

      // Should have default values for the failed usage type (ALERT_CREATION)
      expect(result[UsageType.ALERT_CREATION]).toEqual({
        currentUsage: 0,
        limit: 0,
        resetDate: expect.any(Date),
      });

      // Other types should have real values
      expect(result[UsageType.AI_ANALYSIS]).toEqual({
        currentUsage: 25,
        limit: 100,
        resetDate: expect.any(Date),
      });

      expect(result[UsageType.WATCHLIST_ADD]).toEqual({
        currentUsage: 100,
        limit: 1000,
        resetDate: expect.any(Date),
      });

      expect(result[UsageType.BOT_NOTIFICATION]).toEqual({
        currentUsage: 50,
        limit: 500,
        resetDate: expect.any(Date),
      });
    });
  });

  describe('Service instantiation', () => {
    it('should create a feature gate service instance', () => {
      expect(featureGateService).toBeInstanceOf(FeatureGateService);
    });

    it('should have required methods', () => {
      expect(typeof featureGateService.getUserUsage).toBe('function');
      expect(typeof featureGateService.canPerformAIAnalysis).toBe('function');
      expect(typeof featureGateService.trackUsage).toBe('function');
      expect(typeof featureGateService.canCreateAlert).toBe('function');
      expect(typeof featureGateService.canAddToWatchlist).toBe('function');
      expect(typeof featureGateService.canReceiveBotNotification).toBe('function');
      expect(typeof featureGateService.getUserUsageStats).toBe('function');
    });
  });

  describe('Usage limits by tier', () => {
    it('should have correct FREE tier limits', async () => {
      const mockUser = {
        id: 'user-123',
        subscription: { tier: 'FREE' },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.usageLog.count.mockResolvedValue(0);

      const aiResult = await featureGateService.getUserUsage('user-123', UsageType.AI_ANALYSIS);
      expect(aiResult.limit).toBe(5);

      const alertResult = await featureGateService.getUserUsage('user-123', UsageType.ALERT_CREATION);
      expect(alertResult.limit).toBe(10);

      const watchlistResult = await featureGateService.getUserUsage('user-123', UsageType.WATCHLIST_ADD);
      expect(watchlistResult.limit).toBe(50);

      const botResult = await featureGateService.getUserUsage('user-123', UsageType.BOT_NOTIFICATION);
      expect(botResult.limit).toBe(10);
    });

    it('should have correct PRO tier limits', async () => {
      const mockUser = {
        id: 'user-123',
        subscription: { tier: 'PRO' },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.usageLog.count.mockResolvedValue(0);

      const aiResult = await featureGateService.getUserUsage('user-123', UsageType.AI_ANALYSIS);
      expect(aiResult.limit).toBe(100);

      const alertResult = await featureGateService.getUserUsage('user-123', UsageType.ALERT_CREATION);
      expect(alertResult.limit).toBe(500);

      const watchlistResult = await featureGateService.getUserUsage('user-123', UsageType.WATCHLIST_ADD);
      expect(watchlistResult.limit).toBe(1000);

      const botResult = await featureGateService.getUserUsage('user-123', UsageType.BOT_NOTIFICATION);
      expect(botResult.limit).toBe(500);
    });

    it('should have correct BUSINESS tier limits', async () => {
      const mockUser = {
        id: 'user-123',
        subscription: { tier: 'BUSINESS' },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.usageLog.count.mockResolvedValue(0);

      const aiResult = await featureGateService.getUserUsage('user-123', UsageType.AI_ANALYSIS);
      expect(aiResult.limit).toBe(1000);

      const alertResult = await featureGateService.getUserUsage('user-123', UsageType.ALERT_CREATION);
      expect(alertResult.limit).toBe(5000);

      const watchlistResult = await featureGateService.getUserUsage('user-123', UsageType.WATCHLIST_ADD);
      expect(watchlistResult.limit).toBe(10000);

      const botResult = await featureGateService.getUserUsage('user-123', UsageType.BOT_NOTIFICATION);
      expect(botResult.limit).toBe(5000);
    });
  });
});