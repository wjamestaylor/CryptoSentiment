import { prisma } from '@/lib/db/prisma';
import { UsageType } from '@prisma/client';

export interface UsageInfo {
  currentUsage: number;
  limit: number;
  resetDate: Date;
}

export class FeatureGateService {
  // Usage limits for different subscription tiers
  private static readonly USAGE_LIMITS = {
    FREE: {
      [UsageType.AI_ANALYSIS]: 5,
      [UsageType.ALERT_CREATION]: 10,
      [UsageType.WATCHLIST_ADD]: 50,
      [UsageType.BOT_NOTIFICATION]: 10,
    },
    PRO: {
      [UsageType.AI_ANALYSIS]: 100,
      [UsageType.ALERT_CREATION]: 500,
      [UsageType.WATCHLIST_ADD]: 1000,
      [UsageType.BOT_NOTIFICATION]: 500,
    },
    BUSINESS: {
      [UsageType.AI_ANALYSIS]: 1000,
      [UsageType.ALERT_CREATION]: 5000,
      [UsageType.WATCHLIST_ADD]: 10000,
      [UsageType.BOT_NOTIFICATION]: 5000,
    },
  };

  /**
   * Check if a user can perform an AI analysis based on their subscription and usage
   */
  async canPerformAIAnalysis(userId: string): Promise<boolean> {
    try {
      const usageInfo = await this.getUserUsage(userId, UsageType.AI_ANALYSIS);
      return usageInfo.currentUsage < usageInfo.limit;
    } catch (error) {
      console.error('Error checking AI analysis permission:', error);
      // Fail open - allow the action if we can't check limits
      return true;
    }
  }

  /**
   * Get current usage information for a user and usage type
   */
  async getUserUsage(userId: string, usageType: UsageType): Promise<UsageInfo> {
    try {
      // Get user with subscription info
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          subscription: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Determine subscription tier (default to FREE)
      const subscriptionTier = user.subscription?.tier || 'FREE';
      const limit = FeatureGateService.USAGE_LIMITS[subscriptionTier as keyof typeof FeatureGateService.USAGE_LIMITS]?.[usageType] || 0;

      // Get current month's usage
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      const currentUsage = await prisma.usageLog.count({
        where: {
          userId,
          type: usageType,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      });

      // Reset date is first day of next month
      const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      return {
        currentUsage,
        limit,
        resetDate,
      };
    } catch (error) {
      console.error('Error getting user usage:', error);
      throw error;
    }
  }

  /**
   * Track usage for a user and usage type
   */
  async trackUsage(userId: string, usageType: UsageType, resource: string, metadata?: Record<string, any>): Promise<void> {
    try {
      await prisma.usageLog.create({
        data: {
          userId,
          type: usageType,
          resource,
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      });
    } catch (error) {
      console.error('Error tracking usage:', error);
      // Don't throw - usage tracking shouldn't break the main functionality
    }
  }

  /**
   * Check if user can create alerts
   */
  async canCreateAlert(userId: string): Promise<boolean> {
    try {
      const usageInfo = await this.getUserUsage(userId, UsageType.ALERT_CREATION);
      return usageInfo.currentUsage < usageInfo.limit;
    } catch (error) {
      console.error('Error checking alert creation permission:', error);
      return true;
    }
  }

  /**
   * Check if user can add to watchlist
   */
  async canAddToWatchlist(userId: string): Promise<boolean> {
    try {
      const usageInfo = await this.getUserUsage(userId, UsageType.WATCHLIST_ADD);
      return usageInfo.currentUsage < usageInfo.limit;
    } catch (error) {
      console.error('Error checking watchlist add permission:', error);
      return true;
    }
  }

  /**
   * Check if user can receive bot notifications
   */
  async canReceiveBotNotification(userId: string): Promise<boolean> {
    try {
      const usageInfo = await this.getUserUsage(userId, UsageType.BOT_NOTIFICATION);
      return usageInfo.currentUsage < usageInfo.limit;
    } catch (error) {
      console.error('Error checking bot notification permission:', error);
      return true;
    }
  }

  /**
   * Get usage statistics for all features for a user
   */
  async getUserUsageStats(userId: string): Promise<Record<UsageType, UsageInfo>> {
    const stats = {} as Record<UsageType, UsageInfo>;

    for (const usageType of Object.values(UsageType)) {
      try {
        stats[usageType] = await this.getUserUsage(userId, usageType);
      } catch (error) {
        console.error(`Error getting usage stats for ${usageType}:`, error);
        // Provide default values if we can't get stats
        stats[usageType] = {
          currentUsage: 0,
          limit: 0,
          resetDate: new Date(),
        };
      }
    }

    return stats;
  }
}