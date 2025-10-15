import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { SubscriptionService } from '@/services/subscription/subscription.service';

const subscriptionService = new SubscriptionService();

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
      return {
        success: true,
        data: {
          tier: subscription.tier,
          limits,
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
});