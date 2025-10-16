import { prisma } from '@/lib/db/prisma';
import { SubscriptionService } from '@/services/subscription/subscription.service';
import { UsageType } from '@prisma/client';

export interface UsageCheck {
  allowed: boolean;
  currentUsage: number;
  limit: number;
  remaining: number;
  resetDate?: Date;
}

export interface FeatureAccess {
  allowed: boolean;
  reason?: string;
  upgradeRequired?: boolean;
}

export class FeatureGateService {
  private subscriptionService: SubscriptionService;

  constructor() {
    this.subscriptionService = new SubscriptionService();
  }

  /**
   * Check if user can perform a specific action based on their subscription limits
   */
  async checkUsageLimit(userId: string, usageType: UsageType): Promise<UsageCheck> {
    try {
      const subscription = await this.subscriptionService.getUserSubscription(userId);
      const limits = this.subscriptionService.getSubscriptionLimits(subscription.tier);
      
      // Get current usage for this month (UTC)
      const startOfMonth = new Date();
      startOfMonth.setUTCDate(1);
      startOfMonth.setUTCHours(0, 0, 0, 0);
      
      const currentUsage = await prisma.usageLog.count({
        where: {
          userId,
          type: usageType,
          createdAt: {
            gte: startOfMonth,
          },
        },
      });

      const limit = this.getUsageLimit(limits, usageType);
      const remaining = limit === -1 ? -1 : Math.max(0, limit - currentUsage);
      const allowed = limit === -1 || currentUsage < limit;

      // Calculate reset date (end of current month in UTC)
      const resetDate = new Date();
      resetDate.setUTCMonth(resetDate.getUTCMonth() + 1);
      resetDate.setUTCDate(1);
      resetDate.setUTCHours(0, 0, 0, 0);

      return {
        allowed,
        currentUsage,
        limit,
        remaining,
        resetDate,
      };
    } catch (error) {
      console.error('Error checking usage limit:', error);
      // Return conservative response on error
      return {
        allowed: false,
        currentUsage: 0,
        limit: 0,
        remaining: 0,
      };
    }
  }

  /**
   * Check if user has access to a specific feature
   */
  async checkFeatureAccess(userId: string, feature: string): Promise<FeatureAccess> {
    try {
      const hasAccess = await this.subscriptionService.hasFeatureAccess(userId, feature);
      
      if (!hasAccess) {
        return {
          allowed: false,
          reason: `Feature '${feature}' requires a higher subscription tier`,
          upgradeRequired: true,
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error checking feature access:', error);
      return {
        allowed: false,
        reason: 'Error checking feature access',
      };
    }
  }

  /**
   * Track usage of a feature
   */
  async trackUsage(userId: string, usageType: UsageType, metadata?: Record<string, unknown>): Promise<void> {
    try {
      await prisma.usageLog.create({
        data: {
          userId,
          type: usageType,
          resource: this.getResourceName(usageType),
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      });

      console.log(`Usage tracked for user ${userId}: ${usageType}`);
    } catch (error) {
      console.error('Error tracking usage:', error);
      // Don't throw here to avoid breaking the main functionality
    }
  }

  /**
   * Check if user can create an alert
   */
  async canCreateAlert(userId: string): Promise<UsageCheck> {
    return this.checkUsageLimit(userId, UsageType.ALERT_CREATION);
  }

  /**
   * Check if user can perform AI analysis
   */
  async canPerformAIAnalysis(userId: string): Promise<UsageCheck> {
    return this.checkUsageLimit(userId, UsageType.AI_ANALYSIS);
  }

  /**
   * Check if user can add to watchlist
   */
  async canAddToWatchlist(userId: string): Promise<UsageCheck> {
    return this.checkUsageLimit(userId, UsageType.WATCHLIST_ADD);
  }

  /**
   * Check if user can use bot notifications
   */
  async canUseBotNotification(userId: string): Promise<UsageCheck> {
    return this.checkUsageLimit(userId, UsageType.BOT_NOTIFICATION);
  }

  /**
   * Get current usage statistics for a user
   */
  async getUserUsageStats(userId: string): Promise<Record<string, UsageCheck>> {
    const [alerts, aiAnalysis, watchlist, botNotifications] = await Promise.all([
      this.canCreateAlert(userId),
      this.canPerformAIAnalysis(userId),
      this.canAddToWatchlist(userId),
      this.canUseBotNotification(userId),
    ]);

    return {
      alerts,
      aiAnalysis,
      watchlist,
      botNotifications,
    };
  }

  /**
   * Get usage limit for a specific usage type based on subscription limits
   */
  private getUsageLimit(limits: Record<string, number>, usageType: UsageType): number {
    switch (usageType) {
      case UsageType.ALERT_CREATION:
        return limits.alerts || 0;
      case UsageType.AI_ANALYSIS:
        return limits.aiAnalysisPerMonth || 0;
      case UsageType.WATCHLIST_ADD:
        return limits.watchlist || 0;
      case UsageType.BOT_NOTIFICATION:
        return limits.botNotifications || 0;
      default:
        return 0;
    }
  }

  /**
   * Get resource name for usage type
   */
  private getResourceName(usageType: UsageType): string {
    switch (usageType) {
      case UsageType.ALERT_CREATION:
        return 'alert';
      case UsageType.AI_ANALYSIS:
        return 'ai_analysis';
      case UsageType.WATCHLIST_ADD:
        return 'watchlist';
      case UsageType.BOT_NOTIFICATION:
        return 'bot_notification';
      default:
        return 'unknown';
    }
  }

  /**
   * Reset monthly usage for a user (called by scheduled job)
   */
  async resetMonthlyUsage(userId: string): Promise<void> {
    try {
      // Delete usage logs older than current month (UTC)
      const startOfMonth = new Date();
      startOfMonth.setUTCDate(1);
      startOfMonth.setUTCHours(0, 0, 0, 0);

      await prisma.usageLog.deleteMany({
        where: {
          userId,
          createdAt: {
            lt: startOfMonth,
          },
        },
      });

      console.log(`Monthly usage reset for user ${userId}`);
    } catch (error) {
      console.error('Error resetting monthly usage:', error);
      throw new Error(`Failed to reset usage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}