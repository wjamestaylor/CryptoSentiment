/**
 * Tests for Subscription Service
 * Focus on core functionality and subscription limits
 */

import { SubscriptionService } from '@/services/subscription/subscription.service';

describe('SubscriptionService', () => {
  let subscriptionService: SubscriptionService;

  beforeEach(() => {
    subscriptionService = new SubscriptionService();
  });

  describe('getSubscriptionLimits', () => {
    it('should return correct limits for FREE tier', () => {
      const limits = subscriptionService.getSubscriptionLimits('FREE');

      expect(limits.alerts).toBe(5);
      expect(limits.watchlist).toBe(10);
      expect(limits.aiAnalysisPerMonth).toBe(10);
      expect(limits.botNotifications).toBe(0);
    });

    it('should return correct limits for PRO tier', () => {
      const limits = subscriptionService.getSubscriptionLimits('PRO');

      expect(limits.alerts).toBe(50);
      expect(limits.watchlist).toBe(100);
      expect(limits.aiAnalysisPerMonth).toBe(100);
      expect(limits.botNotifications).toBe(50);
    });

    it('should return correct limits for BUSINESS tier', () => {
      const limits = subscriptionService.getSubscriptionLimits('BUSINESS');

      expect(limits.alerts).toBe(-1); // unlimited
      expect(limits.watchlist).toBe(-1); // unlimited
      expect(limits.aiAnalysisPerMonth).toBe(1000);
      expect(limits.botNotifications).toBe(-1); // unlimited
    });

    it('should return FREE tier limits for unknown tier', () => {
      const limits = subscriptionService.getSubscriptionLimits('UNKNOWN');

      expect(limits.alerts).toBe(5);
      expect(limits.watchlist).toBe(10);
      expect(limits.aiAnalysisPerMonth).toBe(10);
      expect(limits.botNotifications).toBe(0);
    });
  });

  describe('Service instantiation', () => {
    it('should create a subscription service instance', () => {
      expect(subscriptionService).toBeInstanceOf(SubscriptionService);
    });

    it('should have required methods', () => {
      expect(typeof subscriptionService.getSubscriptionLimits).toBe('function');
      expect(typeof subscriptionService.hasFeatureAccess).toBe('function');
      expect(typeof subscriptionService.getUserSubscription).toBe('function');
      expect(typeof subscriptionService.createCheckoutSession).toBe('function');
      expect(typeof subscriptionService.createPortalSession).toBe('function');
    });
  });
});