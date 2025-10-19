import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/api/trpc';
import { PortfolioAnalyticsService } from '@/services/analytics/portfolio-analytics.service';
import { prisma } from '@/lib/db/prisma';

const portfolioAnalyticsService = new PortfolioAnalyticsService(prisma);

export const analyticsRouter = createTRPCRouter({
  // Get comprehensive analytics data for authenticated user
  getAnalyticsData: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const userId = ctx.session.user.id;
        const analyticsData = await portfolioAnalyticsService.getAnalyticsData(userId);
        
        return {
          success: true,
          data: analyticsData,
        };
      } catch (error) {
        console.error('Failed to fetch analytics data:', error);
        throw new Error(`Failed to fetch analytics data: ${error}`);
      }
    }),

  // Get portfolio metrics only
  getPortfolioMetrics: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const userId = ctx.session.user.id;
        const portfolioMetrics = await portfolioAnalyticsService.getPortfolioMetrics(userId);
        
        return {
          success: true,
          data: portfolioMetrics,
        };
      } catch (error) {
        console.error('Failed to fetch portfolio metrics:', error);
        throw new Error(`Failed to fetch portfolio metrics: ${error}`);
      }
    }),

  // Get market overview (public endpoint)
  getMarketOverview: publicProcedure
    .query(async () => {
      try {
        const marketOverview = await portfolioAnalyticsService.getMarketOverview();
        
        return {
          success: true,
          data: marketOverview,
        };
      } catch (error) {
        console.error('Failed to fetch market overview:', error);
        throw new Error(`Failed to fetch market overview: ${error}`);
      }
    }),

  // Get performance metrics for different timeframes
  getPerformanceMetrics: protectedProcedure
    .input(z.object({
      timeframe: z.enum(['24h', '7d', '30d', '1y']).default('30d'),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const userId = ctx.session.user.id;
        const performanceMetrics = await portfolioAnalyticsService.getPerformanceMetrics(userId, input.timeframe);
        
        return {
          success: true,
          data: performanceMetrics,
        };
      } catch (error) {
        console.error('Failed to fetch performance metrics:', error);
        throw new Error(`Failed to fetch performance metrics: ${error}`);
      }
    }),

  // Get price history for a specific cryptocurrency
  getPriceHistory: publicProcedure
    .input(z.object({
      cryptoId: z.string(),
      days: z.number().min(1).max(365).default(30),
    }))
    .query(async ({ input }) => {
      try {
        const priceHistory = await portfolioAnalyticsService.getPriceHistory(input.cryptoId, input.days);
        
        return {
          success: true,
          data: priceHistory,
        };
      } catch (error) {
        console.error('Failed to fetch price history:', error);
        throw new Error(`Failed to fetch price history: ${error}`);
      }
    }),

  // Get sentiment analytics for user's portfolio
  getSentimentAnalytics: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const userId = ctx.session.user.id;
        const sentimentAnalytics = await portfolioAnalyticsService.getSentimentAnalytics(userId);
        
        return {
          success: true,
          data: sentimentAnalytics,
        };
      } catch (error) {
        console.error('Failed to fetch sentiment analytics:', error);
        throw new Error(`Failed to fetch sentiment analytics: ${error}`);
      }
    }),

  // Get alert analytics for user
  getAlertAnalytics: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const userId = ctx.session.user.id;
        const alertAnalytics = await portfolioAnalyticsService.getAlertAnalytics(userId);
        
        return {
          success: true,
          data: alertAnalytics,
        };
      } catch (error) {
        console.error('Failed to fetch alert analytics:', error);
        throw new Error(`Failed to fetch alert analytics: ${error}`);
      }
    }),

  // Get watchlist performance summary
  getWatchlistSummary: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const userId = ctx.session.user.id;
        
        // Get followed coins count
        const followedCoinsCount = await ctx.prisma.followedCoin.count({
          where: { userId },
        });

        // Get followed coins with basic stats
        const followedCoins = await ctx.prisma.followedCoin.findMany({
          where: { userId },
          include: { crypto: true },
          orderBy: { createdAt: 'desc' },
          take: 10, // Limit for performance
        });

        // Get portfolio metrics for quick summary
        const portfolioMetrics = await portfolioAnalyticsService.getPortfolioMetrics(userId);

        const summary = {
          totalFollowedCoins: followedCoinsCount,
          recentlyAdded: followedCoins.slice(0, 5).map(coin => ({
            symbol: coin.crypto.symbol,
            name: coin.crypto.name,
            addedAt: coin.createdAt.toISOString(),
          })),
          portfolioValue: portfolioMetrics.totalValue,
          portfolioGainLoss: portfolioMetrics.totalGainLoss,
          portfolioGainLossPercentage: portfolioMetrics.gainLossPercentage,
          topPerformer: portfolioMetrics.topPerformer,
          worstPerformer: portfolioMetrics.worstPerformer,
        };
        
        return {
          success: true,
          data: summary,
        };
      } catch (error) {
        console.error('Failed to fetch watchlist summary:', error);
        throw new Error(`Failed to fetch watchlist summary: ${error}`);
      }
    }),

  // Get usage analytics
  getUsageAnalytics: protectedProcedure
    .input(z.object({
      days: z.number().min(1).max(90).default(30),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const userId = ctx.session.user.id;
        const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);

        // Get usage logs for the specified period
        const usageLogs = await ctx.prisma.usageLog.findMany({
          where: {
            userId,
            createdAt: { gte: since },
          },
          orderBy: { createdAt: 'desc' },
        });

        // Group by usage type
        const usageByType = usageLogs.reduce((acc, log) => {
          const type = log.type;
          if (!acc[type]) {
            acc[type] = [];
          }
          acc[type].push({
            resource: log.resource,
            createdAt: log.createdAt.toISOString(),
            metadata: log.metadata ? JSON.parse(log.metadata) : null,
          });
          return acc;
        }, {} as Record<string, Array<{
          resource: string;
          createdAt: string;
          metadata: Record<string, unknown>;
        }>>);

        // Calculate daily usage trends
        const dailyUsage = usageLogs.reduce((acc, log) => {
          const date = log.createdAt.toISOString().split('T')[0];
          if (!acc[date]) {
            acc[date] = {};
          }
          if (!acc[date][log.type]) {
            acc[date][log.type] = 0;
          }
          acc[date][log.type]++;
          return acc;
        }, {} as Record<string, Record<string, number>>);

        return {
          success: true,
          data: {
            totalUsage: usageLogs.length,
            usageByType,
            dailyUsage,
            timeframe: input.days,
          },
        };
      } catch (error) {
        console.error('Failed to fetch usage analytics:', error);
        throw new Error(`Failed to fetch usage analytics: ${error}`);
      }
    }),
});