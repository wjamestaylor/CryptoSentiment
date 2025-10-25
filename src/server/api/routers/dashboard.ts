/**
 * Dashboard API Router
 * 
 * Unified endpoint for dashboard data using the new Portfolio Service
 * to ensure consistent calculations across all dashboard components.
 */

import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { portfolioService } from '@/services/portfolio/portfolio.service';

export const dashboardRouter = createTRPCRouter({
  /**
   * Get unified dashboard data with consistent portfolio calculations
   */
  getDashboardData: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Get all crypto tracking data
        const trackingEntries = await ctx.prisma.cryptoTracking.findMany({
          where: { userId },
          include: { crypto: true },
          orderBy: [
            { holdingAmount: { sort: 'desc', nulls: 'last' } }, // Holdings first
            { lastViewedAt: 'desc' }, // Then by recent activity
          ],
        });

        // Separate into categories
        const watchingOnly = trackingEntries.filter(entry => !entry.holdingAmount);
        const holdings = trackingEntries.filter(entry => entry.holdingAmount);

        // Convert holdings to Portfolio Service format
        const portfolioHoldings = holdings.map(entry => ({
          id: entry.id,
          cryptoSymbol: entry.crypto.symbol,
          cryptoName: entry.crypto.name,
          coinGeckoId: entry.crypto.coinGeckoId,
          holdingAmount: entry.holdingAmount!,
          averagePurchasePrice: entry.averagePurchasePrice || 0,
          totalInvested: entry.totalInvested || 0,
          firstPurchaseDate: entry.firstPurchaseDate || entry.addedAt,
          notes: entry.notes || undefined,
          tags: entry.tags,
        }));

        // Calculate portfolio analytics using unified service
        let portfolioAnalytics = null;
        if (portfolioHoldings.length > 0) {
          try {
            portfolioAnalytics = await portfolioService.calculatePortfolioAnalytics(portfolioHoldings);
          } catch (portfolioErr) {
            console.warn('Portfolio analytics failed:', portfolioErr);
            // Throw error instead of continuing with null data
            // This prevents dashboard from showing $0 values when API fails
            throw new Error('Failed to fetch portfolio data. Please try again.');
          }
        }

        // Get watchlist data (cryptos being watched without holdings)
        const watchlist = watchingOnly.map(entry => ({
          id: entry.crypto.id || entry.crypto.coinGeckoId || entry.crypto.symbol,
          symbol: entry.crypto.symbol,
          name: entry.crypto.name,
          coinGeckoId: entry.crypto.coinGeckoId,
          addedAt: entry.addedAt,
          lastViewedAt: entry.lastViewedAt,
        }));

        // Get current prices for watchlist items with error recovery
        let watchlistWithPrices: Array<{
          id: string;
          symbol: string;
          name: string;
          coinGeckoId: string | null;
          addedAt: Date;
          lastViewedAt: Date;
          currentPrice?: number;
          priceChangePercentage24h?: number;
          priceChange24h?: number;
          marketCap?: number;
          volume24h?: number;
        }> = [];
        
        if (watchlist.length > 0) {
          try {
            const coinGeckoIds = watchlist
              .map(item => item.coinGeckoId)
              .filter((id): id is string => id !== null);
            
            if (coinGeckoIds.length > 0) {
              const priceData = await portfolioService['priceService'].getCurrentPrices(coinGeckoIds);
              
              watchlistWithPrices = watchlist.map(item => {
                const price = priceData.find(p => p.id === item.coinGeckoId);
                return {
                  ...item,
                  currentPrice: price?.current_price,
                  priceChangePercentage24h: price?.price_change_percentage_24h,
                  priceChange24h: price?.price_change_24h,
                  marketCap: price?.market_cap,
                  volume24h: price?.total_volume,
                };
              });
            } else {
              // No coinGeckoIds, return watchlist without prices
              watchlistWithPrices = watchlist.map(item => ({
                ...item,
                currentPrice: undefined,
                priceChangePercentage24h: undefined,
                priceChange24h: undefined,
                marketCap: undefined,
                volume24h: undefined,
              }));
            }
          } catch (error) {
            console.warn('Failed to fetch watchlist prices:', error);
            // For watchlist, we can continue with undefined prices
            // since it's less critical than portfolio values
            watchlistWithPrices = watchlist.map(item => ({
              ...item,
              currentPrice: undefined,
              priceChangePercentage24h: undefined,
              priceChange24h: undefined,
              marketCap: undefined,
              volume24h: undefined,
            }));
          }
        }

        // Calculate summary statistics
        const summary = {
          totalTracked: trackingEntries.length,
          totalWatching: watchingOnly.length,
          totalHoldings: holdings.length,
          portfolioValue: portfolioAnalytics?.summary.totalValue || 0,
          portfolioGainLoss: portfolioAnalytics?.summary.totalGainLoss || 0,
          portfolioGainLossPercentage: portfolioAnalytics?.summary.totalGainLossPercentage || 0,
          lastUpdated: new Date(),
        };

        return {
          success: true,
          data: {
            summary,
            portfolioAnalytics,
            watchlist: watchlistWithPrices,
            holdings: portfolioAnalytics?.holdings || [],
            topPerformer: portfolioAnalytics?.topPerformer,
            worstPerformer: portfolioAnalytics?.worstPerformer,
          },
        };

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        throw new Error(`Failed to fetch dashboard data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  /**
   * Get portfolio summary only (faster for quick updates)
   */
  getPortfolioSummary: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Get holdings only
        const holdings = await ctx.prisma.cryptoTracking.findMany({
          where: { 
            userId,
            holdingAmount: { not: null },
          },
          include: { crypto: true },
        });

        if (holdings.length === 0) {
          return {
            success: true,
            data: {
              totalValue: 0,
              totalInvested: 0,
              totalGainLoss: 0,
              totalGainLossPercentage: 0,
              holdingsCount: 0,
              lastUpdated: new Date(),
            },
          };
        }

        // Convert to Portfolio Service format
        const portfolioHoldings = holdings.map(entry => ({
          id: entry.id,
          cryptoSymbol: entry.crypto.symbol,
          cryptoName: entry.crypto.name,
          coinGeckoId: entry.crypto.coinGeckoId,
          holdingAmount: entry.holdingAmount!,
          averagePurchasePrice: entry.averagePurchasePrice || 0,
          totalInvested: entry.totalInvested || 0,
          firstPurchaseDate: entry.firstPurchaseDate || entry.addedAt,
          notes: entry.notes || undefined,
          tags: entry.tags,
        }));

        // Get fast summary with error recovery
        let summary;
        try {
          summary = await portfolioService.getPortfolioSummary(portfolioHoldings);
        } catch (error) {
          console.warn('Portfolio summary failed, using fallback:', error);
          // Return basic summary if price fetching fails
          const totalInvested = portfolioHoldings.reduce((sum, h) => sum + h.totalInvested, 0);
          summary = {
            totalValue: 0,
            totalInvested,
            totalGainLoss: -totalInvested,
            totalGainLossPercentage: totalInvested > 0 ? -100 : 0,
            holdingsCount: portfolioHoldings.length,
            lastUpdated: new Date(),
          };
        }

        return {
          success: true,
          data: summary,
        };

      } catch (error) {
        console.error('Failed to fetch portfolio summary:', error);
        throw new Error(`Failed to fetch portfolio summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  /**
   * Get 24h portfolio change
   */
  getPortfolio24hChange: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Get holdings only
        const holdings = await ctx.prisma.cryptoTracking.findMany({
          where: { 
            userId,
            holdingAmount: { not: null },
          },
          include: { crypto: true },
        });

        if (holdings.length === 0) {
          return {
            success: true,
            data: { change: 0, percentage: 0 },
          };
        }

        // Convert to Portfolio Service format
        const portfolioHoldings = holdings.map(entry => ({
          id: entry.id,
          cryptoSymbol: entry.crypto.symbol,
          cryptoName: entry.crypto.name,
          coinGeckoId: entry.crypto.coinGeckoId,
          holdingAmount: entry.holdingAmount!,
          averagePurchasePrice: entry.averagePurchasePrice || 0,
          totalInvested: entry.totalInvested || 0,
          firstPurchaseDate: entry.firstPurchaseDate || entry.addedAt,
          notes: entry.notes || undefined,
          tags: entry.tags,
        }));

        // Calculate 24h change with error recovery
        let change;
        try {
          change = await portfolioService.calculate24hChange(portfolioHoldings);
        } catch (error) {
          console.warn('24h change calculation failed:', error);
          change = { change: 0, percentage: 0 };
        }

        return {
          success: true,
          data: change,
        };

      } catch (error) {
        console.error('Failed to calculate 24h change:', error);
        return {
          success: true,
          data: { change: 0, percentage: 0 },
        };
      }
    }),
});