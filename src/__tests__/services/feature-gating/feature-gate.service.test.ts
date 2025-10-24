/**
 * @jest-environment node
 */

import { FeatureGateService } from '@/services/feature-gating/feature-gate.service';
import { SubscriptionService } from '@/services/subscription/subscription.service';
import { prisma } from '@/lib/db/prisma';
import { UsageType } from '@prisma/client';

// Mock dependencies
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    usageLog: {
      count: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    cryptoTracking: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/services/subscription/subscription.service');

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const MockedSubscriptionService = SubscriptionService as jest.MockedClass<typeof SubscriptionService>;

describe('FeatureGateService', () => {
  let featureGateService: FeatureGateService;
  let mockSubscriptionService: jest.Mocked<SubscriptionService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a mock instance of SubscriptionService
    mockSubscriptionService = new MockedSubscriptionService() as jest.Mocked<SubscriptionService>;
    
    // Override the constructor to use our mock
    featureGateService = new FeatureGateService();
    (featureGateService as unknown as { subscriptionService: typeof mockSubscriptionService }).subscriptionService = mockSubscriptionService;
  });

  describe('checkUsageLimit', () => {
    const userId = 'user-123';
    const currentDate = new Date('2024-11-15T10:00:00Z');

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(currentDate);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return allowed when usage is under limit', async () => {
      // Mock subscription data
      mockSubscriptionService.getUserSubscription.mockResolvedValue({
        tier: 'PRO',
        status: 'active',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        trialEnd: null,
      });

      mockSubscriptionService.getSubscriptionLimits.mockReturnValue({
        alerts: 50,
        watchlist: 100,
        aiAnalysisPerMonth: 200,
        botNotifications: 25,
      });

      // Mock current usage
      (mockPrisma.usageLog.count as jest.Mock).mockResolvedValue(25);

      const result = await featureGateService.checkUsageLimit(userId, UsageType.ALERT_CREATION);

      expect(result).toEqual({
        allowed: true,
        currentUsage: 25,
        limit: 50,
        remaining: 25,
        resetDate: new Date('2024-12-01T00:00:00.000Z'),
      });

      expect(mockPrisma.usageLog.count).toHaveBeenCalledWith({
        where: {
          userId,
          type: UsageType.ALERT_CREATION,
          createdAt: {
            gte: new Date('2024-11-01T00:00:00.000Z'),
          },
        },
      });
    });

    it('should return not allowed when usage limit is reached', async () => {
      mockSubscriptionService.getUserSubscription.mockResolvedValue({
        tier: 'FREE',
        status: 'active',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        trialEnd: null,
      });

      mockSubscriptionService.getSubscriptionLimits.mockReturnValue({
        alerts: 5,
        watchlist: 10,
        aiAnalysisPerMonth: 10,
        botNotifications: 0,
      });

      (mockPrisma.usageLog.count as jest.Mock).mockResolvedValue(5);

      const result = await featureGateService.checkUsageLimit(userId, UsageType.ALERT_CREATION);

      expect(result).toEqual({
        allowed: false,
        currentUsage: 5,
        limit: 5,
        remaining: 0,
        resetDate: new Date('2024-12-01T00:00:00.000Z'),
      });
    });

    it('should handle unlimited limits (-1)', async () => {
      mockSubscriptionService.getUserSubscription.mockResolvedValue({
        tier: 'BUSINESS',
        status: 'active',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        trialEnd: null,
      });

      mockSubscriptionService.getSubscriptionLimits.mockReturnValue({
        alerts: -1, // unlimited
        watchlist: -1,
        aiAnalysisPerMonth: 1000,
        botNotifications: -1,
      });

      (mockPrisma.usageLog.count as jest.Mock).mockResolvedValue(100);

      const result = await featureGateService.checkUsageLimit(userId, UsageType.ALERT_CREATION);

      expect(result).toEqual({
        allowed: true,
        currentUsage: 100,
        limit: -1,
        remaining: -1,
        resetDate: new Date('2024-12-01T00:00:00.000Z'),
      });
    });

    it('should handle errors gracefully', async () => {
      mockSubscriptionService.getUserSubscription.mockRejectedValue(new Error('Database error'));

      const result = await featureGateService.checkUsageLimit(userId, UsageType.ALERT_CREATION);

      expect(result).toEqual({
        allowed: false,
        currentUsage: 0,
        limit: 0,
        remaining: 0,
      });
    });
  });

  describe('checkFeatureAccess', () => {
    const userId = 'user-123';

    it('should return allowed when user has feature access', async () => {
      mockSubscriptionService.hasFeatureAccess.mockResolvedValue(true);

      const result = await featureGateService.checkFeatureAccess(userId, 'advanced_alerts');

      expect(result).toEqual({
        allowed: true,
      });

      expect(mockSubscriptionService.hasFeatureAccess).toHaveBeenCalledWith(userId, 'advanced_alerts');
    });

    it('should return not allowed when user lacks feature access', async () => {
      mockSubscriptionService.hasFeatureAccess.mockResolvedValue(false);

      const result = await featureGateService.checkFeatureAccess(userId, 'advanced_alerts');

      expect(result).toEqual({
        allowed: false,
        reason: "Feature 'advanced_alerts' requires a higher subscription tier",
        upgradeRequired: true,
      });
    });

    it('should handle errors gracefully', async () => {
      mockSubscriptionService.hasFeatureAccess.mockRejectedValue(new Error('API error'));

      const result = await featureGateService.checkFeatureAccess(userId, 'advanced_alerts');

      expect(result).toEqual({
        allowed: false,
        reason: 'Error checking feature access',
      });
    });
  });

  describe('trackUsage', () => {
    const userId = 'user-123';

    it('should create usage log entry', async () => {
      const metadata = { cryptoSymbol: 'BTC', alertType: 'PRICE_CHANGE' };

      await featureGateService.trackUsage(userId, UsageType.ALERT_CREATION, metadata);

      expect(mockPrisma.usageLog.create).toHaveBeenCalledWith({
        data: {
          userId,
          type: UsageType.ALERT_CREATION,
          resource: 'alert',
          metadata: JSON.stringify(metadata),
        },
      });
    });

    it('should handle missing metadata', async () => {
      await featureGateService.trackUsage(userId, UsageType.AI_ANALYSIS);

      expect(mockPrisma.usageLog.create).toHaveBeenCalledWith({
        data: {
          userId,
          type: UsageType.AI_ANALYSIS,
          resource: 'ai_analysis',
          metadata: null,
        },
      });
    });

    it('should not throw on database errors', async () => {
      (mockPrisma.usageLog.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Should not throw
      await expect(featureGateService.trackUsage(userId, UsageType.WATCHLIST_ADD)).resolves.toBeUndefined();
    });
  });

  describe('convenience methods', () => {
    const userId = 'user-123';

    beforeEach(() => {
      jest.spyOn(featureGateService, 'checkUsageLimit');
    });

    it('should check alert creation limit', async () => {
      const mockUsageCheck = {
        allowed: true,
        currentUsage: 2,
        limit: 5,
        remaining: 3,
      };

      (featureGateService.checkUsageLimit as jest.Mock).mockResolvedValue(mockUsageCheck);

      const result = await featureGateService.canCreateAlert(userId);

      expect(featureGateService.checkUsageLimit).toHaveBeenCalledWith(userId, UsageType.ALERT_CREATION);
      expect(result).toBe(mockUsageCheck);
    });

    it('should check AI analysis limit', async () => {
      const mockUsageCheck = {
        allowed: false,
        currentUsage: 10,
        limit: 10,
        remaining: 0,
      };

      (featureGateService.checkUsageLimit as jest.Mock).mockResolvedValue(mockUsageCheck);

      const result = await featureGateService.canPerformAIAnalysis(userId);

      expect(featureGateService.checkUsageLimit).toHaveBeenCalledWith(userId, UsageType.AI_ANALYSIS);
      expect(result).toBe(mockUsageCheck);
    });

    it('should check watchlist limit by counting CryptoTracking entries', async () => {
      const userId = 'user-123';
      const currentDate = new Date('2024-11-15T10:00:00Z');

      jest.useFakeTimers();
      jest.setSystemTime(currentDate);

      // Mock subscription data
      mockSubscriptionService.getUserSubscription.mockResolvedValue({
        tier: 'FREE',
        status: 'active',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        trialEnd: null,
      });

      mockSubscriptionService.getSubscriptionLimits.mockReturnValue({
        alerts: 5,
        watchlist: 10,
        aiAnalysisPerMonth: 10,
        botNotifications: 0,
      });

      // Mock 5 tracked coins (both watched and held)
      (mockPrisma.cryptoTracking.count as jest.Mock).mockResolvedValue(5);

      const result = await featureGateService.canAddToWatchlist(userId);

      expect(result).toEqual({
        allowed: true,
        currentUsage: 5,
        limit: 10,
        remaining: 5,
        resetDate: new Date('2024-12-01T00:00:00.000Z'),
      });

      expect(mockPrisma.cryptoTracking.count).toHaveBeenCalledWith({
        where: { userId },
      });

      jest.useRealTimers();
    });

    it('should count held coins towards watchlist limit', async () => {
      const userId = 'user-456';
      const currentDate = new Date('2024-11-15T10:00:00Z');

      jest.useFakeTimers();
      jest.setSystemTime(currentDate);

      // Mock subscription data (FREE tier with 10 watchlist limit)
      mockSubscriptionService.getUserSubscription.mockResolvedValue({
        tier: 'FREE',
        status: 'active',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        trialEnd: null,
      });

      mockSubscriptionService.getSubscriptionLimits.mockReturnValue({
        alerts: 5,
        watchlist: 10,
        aiAnalysisPerMonth: 10,
        botNotifications: 0,
      });

      // Mock 10 tracked coins (mix of watched and held - all count the same)
      (mockPrisma.cryptoTracking.count as jest.Mock).mockResolvedValue(10);

      const result = await featureGateService.canAddToWatchlist(userId);

      expect(result).toEqual({
        allowed: false, // limit reached
        currentUsage: 10,
        limit: 10,
        remaining: 0,
        resetDate: new Date('2024-12-01T00:00:00.000Z'),
      });

      expect(mockPrisma.cryptoTracking.count).toHaveBeenCalledWith({
        where: { userId },
      });

      jest.useRealTimers();
    });

    it('should allow unlimited tracking for BUSINESS tier', async () => {
      const userId = 'user-business';
      const currentDate = new Date('2024-11-15T10:00:00Z');

      jest.useFakeTimers();
      jest.setSystemTime(currentDate);

      // Mock subscription data (BUSINESS tier with unlimited watchlist)
      mockSubscriptionService.getUserSubscription.mockResolvedValue({
        tier: 'BUSINESS',
        status: 'active',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        trialEnd: null,
      });

      mockSubscriptionService.getSubscriptionLimits.mockReturnValue({
        alerts: -1,
        watchlist: -1, // unlimited
        aiAnalysisPerMonth: 1000,
        botNotifications: -1,
      });

      // Mock 100 tracked coins
      (mockPrisma.cryptoTracking.count as jest.Mock).mockResolvedValue(100);

      const result = await featureGateService.canAddToWatchlist(userId);

      expect(result).toEqual({
        allowed: true, // always allowed for unlimited
        currentUsage: 100,
        limit: -1,
        remaining: -1,
        resetDate: new Date('2024-12-01T00:00:00.000Z'),
      });

      jest.useRealTimers();
    });
  });

  describe('getUserUsageStats', () => {
    const userId = 'user-123';

    it('should return all usage statistics', async () => {
      const mockUsageChecks = {
        alerts: { allowed: true, currentUsage: 2, limit: 5, remaining: 3 },
        aiAnalysis: { allowed: true, currentUsage: 5, limit: 10, remaining: 5 },
        watchlist: { allowed: false, currentUsage: 10, limit: 10, remaining: 0 },
        botNotifications: { allowed: true, currentUsage: 0, limit: 5, remaining: 5 },
      };

      jest.spyOn(featureGateService, 'canCreateAlert').mockResolvedValue(mockUsageChecks.alerts);
      jest.spyOn(featureGateService, 'canPerformAIAnalysis').mockResolvedValue(mockUsageChecks.aiAnalysis);
      jest.spyOn(featureGateService, 'canAddToWatchlist').mockResolvedValue(mockUsageChecks.watchlist);
      jest.spyOn(featureGateService, 'canUseBotNotification').mockResolvedValue(mockUsageChecks.botNotifications);

      const result = await featureGateService.getUserUsageStats(userId);

      expect(result).toEqual(mockUsageChecks);
    });
  });

  describe('resetMonthlyUsage', () => {
    const userId = 'user-123';
    const currentDate = new Date('2024-11-15T10:00:00Z');

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(currentDate);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should delete old usage logs', async () => {
      await featureGateService.resetMonthlyUsage(userId);

      expect(mockPrisma.usageLog.deleteMany).toHaveBeenCalledWith({
        where: {
          userId,
          createdAt: {
            lt: new Date('2024-11-01T00:00:00.000Z'),
          },
        },
      });
    });

    it('should handle database errors', async () => {
      (mockPrisma.usageLog.deleteMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(featureGateService.resetMonthlyUsage(userId)).rejects.toThrow('Failed to reset usage: Database error');
    });
  });

  describe('getUsageLimit', () => {
    it('should return correct limits for different usage types', () => {
      const limits = {
        alerts: 50,
        watchlist: 100,
        aiAnalysisPerMonth: 200,
        botNotifications: 25,
      };

      // Use type assertion to access private method for testing
      const service = featureGateService as unknown as { 
        getUsageLimit: (limits: Record<string, number>, usageType: UsageType) => number;
      };

      expect(service.getUsageLimit(limits, UsageType.ALERT_CREATION)).toBe(50);
      expect(service.getUsageLimit(limits, UsageType.WATCHLIST_ADD)).toBe(100);
      expect(service.getUsageLimit(limits, UsageType.AI_ANALYSIS)).toBe(200);
      expect(service.getUsageLimit(limits, UsageType.BOT_NOTIFICATION)).toBe(25);
    });
  });

  describe('getResourceName', () => {
    it('should return correct resource names for usage types', () => {
      // Use type assertion to access private method for testing
      const service = featureGateService as unknown as { 
        getResourceName: (usageType: UsageType) => string;
      };

      expect(service.getResourceName(UsageType.ALERT_CREATION)).toBe('alert');
      expect(service.getResourceName(UsageType.AI_ANALYSIS)).toBe('ai_analysis');
      expect(service.getResourceName(UsageType.WATCHLIST_ADD)).toBe('watchlist');
      expect(service.getResourceName(UsageType.BOT_NOTIFICATION)).toBe('bot_notification');
    });
  });
});