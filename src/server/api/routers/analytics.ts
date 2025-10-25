import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/api/trpc';
import { PortfolioAnalyticsService } from '@/services/analytics/portfolio-analytics.service';
import { HistoricalPriceService } from '@/services/crypto/historical-price.service';
import { prisma } from '@/lib/db/prisma';

const portfolioAnalyticsService = new PortfolioAnalyticsService(prisma);
const historicalPriceService = new HistoricalPriceService(prisma);

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
  // Free tier: limited to 7 days, Pro/Business: up to 365 days
  getPriceHistory: publicProcedure
    .input(z.object({
      cryptoId: z.string(),
      days: z.number().min(1).max(365).default(30),
    }))
    .query(async ({ input, ctx }) => {
      try {
        let maxDays = input.days;
        
        // Apply tier-based restrictions if user is authenticated
        if (ctx.session?.user) {
          const user = await ctx.prisma.user.findUnique({
            where: { id: ctx.session.user.id },
            include: { subscription: true },
          });
          
          // Free tier users are limited to 7 days of historical data
          if (!user?.subscription || user.subscription.tier === 'FREE') {
            maxDays = Math.min(input.days, 7);
          }
          // Pro and Business tiers can access full historical data
        } else {
          // Unauthenticated users are limited to 7 days
          maxDays = Math.min(input.days, 7);
        }
        
        const priceHistory = await portfolioAnalyticsService.getPriceHistory(input.cryptoId, maxDays);
        
        return {
          success: true,
          data: priceHistory,
          meta: {
            requestedDays: input.days,
            returnedDays: maxDays,
            limitedByTier: maxDays < input.days,
          },
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
        
        // Get ALL tracked coins count (both watched and held)
        // Held coins are treated as watched coins
        const trackedCoinsCount = await ctx.prisma.cryptoTracking.count({
          where: { userId },
        });

        // Get recently added tracked coins with basic stats
        const trackedCoins = await ctx.prisma.cryptoTracking.findMany({
          where: { userId },
          include: { crypto: true },
          orderBy: { addedAt: 'desc' },
          take: 10, // Limit for performance
        });

        // Fallback to old model for backward compatibility during migration
        if (trackedCoinsCount === 0) {
          const followedCoinsCount = await ctx.prisma.followedCoin.count({
            where: { userId },
          });

          const followedCoins = await ctx.prisma.followedCoin.findMany({
            where: { userId },
            include: { crypto: true },
            orderBy: { createdAt: 'desc' },
            take: 10,
          });

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
        }

        // Get portfolio metrics for quick summary
        const portfolioMetrics = await portfolioAnalyticsService.getPortfolioMetrics(userId);

        const summary = {
          totalFollowedCoins: trackedCoinsCount, // This now includes both watched and held coins
          recentlyAdded: trackedCoins.slice(0, 5).map(coin => ({
            symbol: coin.crypto.symbol,
            name: coin.crypto.name,
            addedAt: coin.addedAt.toISOString(),
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

  // Get historical price data from database
  getStoredPriceHistory: publicProcedure
    .input(z.object({
      cryptoId: z.string(),
      days: z.number().min(1).max(365).default(30),
    }))
    .query(async ({ input }) => {
      try {
        const priceHistory = await historicalPriceService.getHistoricalData(input.cryptoId, input.days);
        
        return {
          success: true,
          data: priceHistory,
        };
      } catch (error) {
        console.error('Failed to fetch stored price history:', error);
        throw new Error(`Failed to fetch stored price history: ${error}`);
      }
    }),

  // Populate historical data for tracked cryptocurrencies (admin/maintenance)
  populateHistoricalData: protectedProcedure
    .input(z.object({
      days: z.number().min(1).max(365).default(30),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = ctx.session.user.id;
        
        // Get tracked cryptocurrencies for this user
        const trackedCryptos = await ctx.prisma.cryptoTracking.findMany({
          where: { userId },
          include: { crypto: true },
        });

        const coinGeckoIds = trackedCryptos
          .map(t => t.crypto.coinGeckoId)
          .filter((id): id is string => id !== null);

        if (coinGeckoIds.length === 0) {
          return {
            success: true,
            message: 'No tracked cryptocurrencies found',
            count: 0,
          };
        }

        await historicalPriceService.bulkFetchAndStore(coinGeckoIds, input.days);
        
        return {
          success: true,
          message: `Successfully populated historical data for ${coinGeckoIds.length} cryptocurrencies`,
          count: coinGeckoIds.length,
        };
      } catch (error) {
        console.error('Failed to populate historical data:', error);
        throw new Error(`Failed to populate historical data: ${error}`);
      }
    }),
});