/**
 * @jest-environment node
 * 
 * Integration test to verify that held coins are treated as watched coins
 * for watch counts and related features.
 */

import { FeatureGateService } from '@/services/feature-gating/feature-gate.service';
import { SubscriptionService } from '@/services/subscription/subscription.service';
import { prisma } from '@/lib/db/prisma';

// Mock dependencies
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    cryptoTracking: {
      count: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    usageLog: {
      count: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('@/services/subscription/subscription.service');

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const MockedSubscriptionService = SubscriptionService as jest.MockedClass<typeof SubscriptionService>;

describe('Integration: Held Coins as Watched Coins', () => {
  let featureGateService: FeatureGateService;
  let mockSubscriptionService: jest.Mocked<SubscriptionService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSubscriptionService = new MockedSubscriptionService() as jest.Mocked<SubscriptionService>;
    featureGateService = new FeatureGateService();
    (featureGateService as unknown as { subscriptionService: typeof mockSubscriptionService }).subscriptionService = mockSubscriptionService;
  });

  describe('Watchlist limit counting', () => {
    it('should count both watched-only and held coins towards watchlist limit', async () => {
      const userId = 'test-user-1';

      // Setup: FREE tier with 10 watchlist limit
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
        aiAnalysisPerMonth: 5,
        botNotifications: 0,
      });

      // Scenario: User has 3 watched-only coins and 5 held coins
      // Total = 8 tracked coins (should be counted together)
      (mockPrisma.cryptoTracking.count as jest.Mock).mockResolvedValue(8);

      const result = await featureGateService.canAddToWatchlist(userId);

      expect(result.currentUsage).toBe(8);
      expect(result.limit).toBe(10);
      expect(result.remaining).toBe(2);
      expect(result.allowed).toBe(true);

      // Verify it queries ALL cryptoTracking entries (not filtering by holdingAmount)
      expect(mockPrisma.cryptoTracking.count).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should prevent adding new coins when limit is reached (including held coins)', async () => {
      const userId = 'test-user-2';

      // Setup: FREE tier with 10 watchlist limit
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
        aiAnalysisPerMonth: 5,
        botNotifications: 0,
      });

      // Scenario: User has 10 total coins (mix of watched and held)
      (mockPrisma.cryptoTracking.count as jest.Mock).mockResolvedValue(10);

      const result = await featureGateService.canAddToWatchlist(userId);

      expect(result.currentUsage).toBe(10);
      expect(result.limit).toBe(10);
      expect(result.remaining).toBe(0);
      expect(result.allowed).toBe(false);
    });

    it('should treat held coins as watched coins in the count', async () => {
      const userId = 'test-user-3';

      // Setup: FREE tier
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
        aiAnalysisPerMonth: 5,
        botNotifications: 0,
      });

      // Scenario: User has ONLY held coins (no watched-only)
      // This tests that holdings alone count towards the limit
      (mockPrisma.cryptoTracking.count as jest.Mock).mockResolvedValue(7);

      const result = await featureGateService.canAddToWatchlist(userId);

      expect(result.currentUsage).toBe(7);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(3);

      // Critical: The query doesn't filter by holdingAmount
      // so it counts ALL entries (including holdings)
      expect(mockPrisma.cryptoTracking.count).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should work correctly with PRO tier limits', async () => {
      const userId = 'test-user-4';

      // Setup: PRO tier with 100 watchlist limit
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
        aiAnalysisPerMonth: 100,
        botNotifications: 50,
      });

      // User has 50 tracked coins (watched + held)
      (mockPrisma.cryptoTracking.count as jest.Mock).mockResolvedValue(50);

      const result = await featureGateService.canAddToWatchlist(userId);

      expect(result.currentUsage).toBe(50);
      expect(result.limit).toBe(100);
      expect(result.remaining).toBe(50);
      expect(result.allowed).toBe(true);
    });

    it('should allow unlimited for BUSINESS tier', async () => {
      const userId = 'test-user-5';

      // Setup: BUSINESS tier with unlimited (-1)
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

      // User has 200 tracked coins (way over FREE and PRO limits)
      (mockPrisma.cryptoTracking.count as jest.Mock).mockResolvedValue(200);

      const result = await featureGateService.canAddToWatchlist(userId);

      expect(result.currentUsage).toBe(200);
      expect(result.limit).toBe(-1);
      expect(result.remaining).toBe(-1);
      expect(result.allowed).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      const userId = 'test-user-error';

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
        aiAnalysisPerMonth: 5,
        botNotifications: 0,
      });

      // Simulate database error
      (mockPrisma.cryptoTracking.count as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const result = await featureGateService.canAddToWatchlist(userId);

      // Should return conservative response
      expect(result.allowed).toBe(false);
      expect(result.currentUsage).toBe(0);
      expect(result.limit).toBe(0);
      expect(result.remaining).toBe(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle user with zero tracked coins', async () => {
      const userId = 'test-user-empty';

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
        aiAnalysisPerMonth: 5,
        botNotifications: 0,
      });

      (mockPrisma.cryptoTracking.count as jest.Mock).mockResolvedValue(0);

      const result = await featureGateService.canAddToWatchlist(userId);

      expect(result.currentUsage).toBe(0);
      expect(result.limit).toBe(10);
      expect(result.remaining).toBe(10);
      expect(result.allowed).toBe(true);
    });

    it('should handle exactly at limit', async () => {
      const userId = 'test-user-exact';

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
        aiAnalysisPerMonth: 5,
        botNotifications: 0,
      });

      // Exactly at limit
      (mockPrisma.cryptoTracking.count as jest.Mock).mockResolvedValue(10);

      const result = await featureGateService.canAddToWatchlist(userId);

      expect(result.currentUsage).toBe(10);
      expect(result.limit).toBe(10);
      expect(result.remaining).toBe(0);
      expect(result.allowed).toBe(false); // Not allowed when at limit
    });
  });
});
