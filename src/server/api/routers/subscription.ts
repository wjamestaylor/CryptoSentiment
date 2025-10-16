import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { SubscriptionService } from '@/services/subscription/subscription.service';
import { FeatureGateService } from '@/services/feature-gating/feature-gate.service';
import { UsageType } from '@prisma/client';

const subscriptionService = new SubscriptionService();
const featureGateService = new FeatureGateService();

export const subscriptionRouter = createTRPCRouter({
  /**
   * Get current user subscription information
   */
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    try {
      const subscription = await subscriptionService.getUserSubscription(ctx.session.user.id);
      return {
        success: true,
        data: subscription,
      };
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch subscription',
        data: null,
      };
    }
  }),

  /**
   * Check if user has access to a specific feature
   */
  checkFeatureAccess: protectedProcedure
    .input(z.object({ feature: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const hasAccess = await subscriptionService.hasFeatureAccess(
          ctx.session.user.id,
          input.feature
        );
        return {
          success: true,
          hasAccess,
        };
      } catch (error) {
        console.error('Error checking feature access:', error);
        return {
          success: false,
          hasAccess: false,
          error: error instanceof Error ? error.message : 'Failed to check feature access',
        };
      }
    }),

  /**
   * Get subscription limits for current user's tier
   */
  getLimits: protectedProcedure.query(async ({ ctx }) => {
    try {
      const subscription = await subscriptionService.getUserSubscription(ctx.session.user.id);
      const limits = subscriptionService.getSubscriptionLimits(subscription.tier);
      
      // Get current usage stats
      const usageStats = await featureGateService.getUserUsageStats(ctx.session.user.id);
      
      return {
        success: true,
        data: {
          tier: subscription.tier,
          limits,
          usage: {
            aiAnalysisUsed: usageStats.aiAnalysis.currentUsage,
            aiAnalysisLimit: usageStats.aiAnalysis.limit,
            alertsUsed: usageStats.alerts.currentUsage,
            alertsLimit: usageStats.alerts.limit,
            watchlistUsed: usageStats.watchlist.currentUsage,
            watchlistLimit: usageStats.watchlist.limit,
            botNotificationsUsed: usageStats.botNotifications.currentUsage,
            botNotificationsLimit: usageStats.botNotifications.limit,
          },
        },
      };
    } catch (error) {
      console.error('Error fetching subscription limits:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch subscription limits',
        data: null,
      };
    }
  }),

  /**
   * Check if user can perform a specific action
   */
  checkUsageLimit: protectedProcedure
    .input(z.object({ 
      usageType: z.nativeEnum(UsageType)
    }))
    .query(async ({ ctx, input }) => {
      try {
        const usageCheck = await featureGateService.checkUsageLimit(ctx.session.user.id, input.usageType);
        return {
          success: true,
          data: usageCheck,
        };
      } catch (error) {
        console.error('Error checking usage limit:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to check usage limit',
          data: null,
        };
      }
    }),

  /**
   * Track usage of a feature
   */
  trackUsage: protectedProcedure
    .input(z.object({ 
      usageType: z.nativeEnum(UsageType),
      metadata: z.record(z.string(), z.any()).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        await featureGateService.trackUsage(ctx.session.user.id, input.usageType, input.metadata);
        return {
          success: true,
        };
      } catch (error) {
        console.error('Error tracking usage:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to track usage',
        };
      }
    }),
});