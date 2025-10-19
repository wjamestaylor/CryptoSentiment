import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/api/trpc';
import { getCoinGeckoId } from '@/lib/crypto-mappings';
import { FeatureGateService } from '@/services/feature-gating/feature-gate.service';
import { CryptoManagerService } from '@/services/crypto/manager.service';
import { UsageType } from '@prisma/client';
import { TRPCError } from '@trpc/server';

const featureGateService = new FeatureGateService();
const cryptoManagerService = new CryptoManagerService();

export const cryptoRouter = createTRPCRouter({
  // Public endpoint to get top cryptocurrencies
  getTopCryptos: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50) }))
    .query(async ({ input }) => {
      try {
        // Use public CoinGecko API that doesn't require authentication
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${input.limit}&page=1&sparkline=false&price_change_percentage=24h`
        );
        
        if (!response.ok) {
          console.error(`CoinGecko API error: ${response.status} ${response.statusText}`);
          throw new Error(`CoinGecko API error: ${response.statusText}`);
        }
        
        const cryptos = await response.json();
        
        return {
          success: true,
          data: cryptos,
        };
      } catch (error) {
        console.error('Failed to fetch top cryptocurrencies:', error);
        throw new Error(`Failed to fetch top cryptocurrencies: ${error}`);
      }
    }),

  // Public endpoint to get specific cryptocurrency
  getCryptoById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        // Use public CoinGecko API
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${input.id}&sparkline=false&price_change_percentage=24h`
        );
        
        if (!response.ok) {
          console.error(`CoinGecko API error: ${response.status} ${response.statusText}`);
          throw new Error(`CoinGecko API error: ${response.statusText}`);
        }
        
        const cryptos = await response.json();
        
        if (cryptos.length === 0) {
          throw new Error(`Cryptocurrency not found: ${input.id}`);
        }
        
        return {
          success: true,
          data: cryptos[0],
        };
      } catch (error) {
        console.error(`Failed to fetch cryptocurrency ${input.id}:`, error);
        throw new Error(`Failed to fetch cryptocurrency ${input.id}: ${error}`);
      }
    }),

  // Public endpoint to search cryptocurrencies
  searchCryptos: publicProcedure
    .input(z.object({ query: z.string().min(1, "Search query must be at least 1 character long") }))
    .query(async ({ input }) => {
      try {
        // Validate the query is not empty or just whitespace
        if (!input.query || input.query.trim().length === 0) {
          throw new Error("Search query cannot be empty");
        }

        // Use public CoinGecko API
        const response = await fetch(
          `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(input.query)}`
        );
        
        if (!response.ok) {
          console.error(`CoinGecko API error: ${response.status} ${response.statusText}`);
          throw new Error(`CoinGecko API error: ${response.statusText}`);
        }
        
        const results = await response.json();
        
        return {
          success: true,
          data: results,
        };
      } catch (error) {
        console.error('Failed to search cryptocurrencies:', error);
        throw new Error(`Failed to search cryptocurrencies: ${error}`);
      }
    }),

  // ===== NEW UNIFIED CRYPTO TRACKING ENDPOINTS =====

  // Protected endpoint to unfollow a cryptocurrency
  unfollowCrypto: protectedProcedure
    .input(z.object({ symbol: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Find the cryptocurrency
        const crypto = await ctx.prisma.cryptocurrency.findUnique({
          where: { symbol: input.symbol.toUpperCase() },
        });

        if (!crypto) {
          throw new Error(`Cryptocurrency ${input.symbol} not found`);
        }

        // Remove the following relationship
        await ctx.prisma.followedCoin.delete({
          where: {
            userId_cryptoId: {
              userId,
              cryptoId: crypto.id,
            },
          },
        });

        return {
          success: true,
          message: `Unfollowed ${input.symbol.toUpperCase()}`,
        };
      } catch (error) {
        throw new Error(`Failed to unfollow cryptocurrency: ${error}`);
      }
    }),

  // Protected endpoint to get user's followed cryptocurrencies
  // UPDATED: Now uses unified CryptoTracking model for backward compatibility
  getFollowedCryptos: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      
      try {
        // First try the new unified model
        const trackingEntries = await ctx.prisma.cryptoTracking.findMany({
          where: { userId },
          include: { crypto: true },
          orderBy: { addedAt: 'desc' },
        });

        if (trackingEntries.length > 0) {
          // Return in the same format as the old FollowedCoin query
          return {
            success: true,
            data: trackingEntries.map((tracking) => ({
              ...tracking.crypto,
              // Add tracking metadata for compatibility
              followedAt: tracking.addedAt,
              hasHoldings: tracking.holdingAmount !== null,
            })),
          };
        }

        // Fallback to old model for backward compatibility during migration
        const followedCryptos = await ctx.prisma.followedCoin.findMany({
          where: { userId },
          include: {
            crypto: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        return {
          success: true,
          data: followedCryptos.map((following) => ({
            ...following.crypto,
            followedAt: following.createdAt,
            hasHoldings: false,
          })),
        };
      } catch (error) {
        throw new Error(`Failed to fetch followed cryptocurrencies: ${error}`);
      }
    }),

  // Public endpoint to get current prices for multiple cryptocurrencies by their IDs
  getCryptosByIds: publicProcedure
    .input(z.object({ 
      ids: z.array(z.string()).min(1).max(100) // Support up to 100 IDs
    }))
    .query(async ({ input }) => {
      try {
        if (input.ids.length === 0) {
          return {
            success: true,
            data: [],
          };
        }

        // Join the IDs with commas for the CoinGecko API
        const idsParam = input.ids.join(',');
        
        // Use public CoinGecko API
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${idsParam}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`
        );
        
        if (!response.ok) {
          console.error(`CoinGecko API error: ${response.status} ${response.statusText}`);
          throw new Error(`CoinGecko API error: ${response.statusText}`);
        }
        
        const cryptos = await response.json();
        
        return {
          success: true,
          data: cryptos,
        };
      } catch (error) {
        console.error('Failed to fetch cryptocurrencies by IDs:', error);
        throw new Error(`Failed to fetch cryptocurrencies by IDs: ${error}`);
      }
    }),

  // Admin endpoint to update existing cryptocurrencies with CoinGecko IDs
  updateCoinGeckoIds: publicProcedure
    .mutation(async ({ ctx }) => {
      try {
        // Get all cryptocurrencies without CoinGecko IDs
        const cryptosWithoutIds = await ctx.prisma.cryptocurrency.findMany({
          where: {
            OR: [
              { coinGeckoId: null },
              { coinGeckoId: '' }
            ]
          }
        });

        const updates = [];
        
        for (const crypto of cryptosWithoutIds) {
          const coinGeckoId = getCoinGeckoId(crypto.symbol);
          if (coinGeckoId) {
            updates.push(
              ctx.prisma.cryptocurrency.update({
                where: { id: crypto.id },
                data: { coinGeckoId }
              })
            );
          }
        }

        await Promise.all(updates);

        return {
          success: true,
          message: `Updated ${updates.length} cryptocurrencies with CoinGecko IDs`,
          data: { updatedCount: updates.length }
        };
      } catch (error) {
        console.error('Failed to update CoinGecko IDs:', error);
        throw new Error(`Failed to update CoinGecko IDs: ${error}`);
      }
    }),

  // Debug endpoint to check followed cryptocurrencies data
  debugFollowedCryptos: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      
      try {
        const followedCryptos = await ctx.prisma.followedCoin.findMany({
          where: { userId },
          include: {
            crypto: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        return {
          success: true,
          data: followedCryptos.map((following) => ({
            ...following.crypto,
            followedAt: following.createdAt,
            hasValidCoinGeckoId: !!following.crypto.coinGeckoId
          })),
        };
      } catch (error) {
        throw new Error(`Failed to fetch debug data: ${error}`);
      }
    }),

  // Portfolio management endpoints
  addPortfolioHolding: protectedProcedure
    .input(z.object({
      cryptoSymbol: z.string(),
      amount: z.number().positive(),
      purchasePrice: z.number().positive(),
      purchaseDate: z.date(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Find the cryptocurrency
        const crypto = await ctx.prisma.cryptocurrency.findUnique({
          where: { symbol: input.cryptoSymbol.toUpperCase() },
        });

        if (!crypto) {
          throw new Error(`Cryptocurrency ${input.cryptoSymbol} not found`);
        }

        // Create portfolio holding
        const holding = await ctx.prisma.portfolioHolding.create({
          data: {
            userId,
            cryptoId: crypto.id,
            amount: input.amount,
            purchasePrice: input.purchasePrice,
            purchaseDate: input.purchaseDate,
            notes: input.notes,
          },
          include: {
            crypto: true,
          },
        });

        return {
          success: true,
          message: `Added ${input.amount} ${input.cryptoSymbol.toUpperCase()} to portfolio`,
          data: holding,
        };
      } catch (error) {
        throw new Error(`Failed to add portfolio holding: ${error}`);
      }
    }),

  getPortfolioHoldings: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      
      try {
        // First try the new unified model
        const trackingEntries = await ctx.prisma.cryptoTracking.findMany({
          where: { 
            userId,
            holdingAmount: { not: null },
          },
          include: { crypto: true },
          orderBy: { firstPurchaseDate: 'desc' },
        });

        if (trackingEntries.length > 0) {
          // Return in the same format as the old PortfolioHolding query
          return {
            success: true,
            data: trackingEntries.map((tracking) => ({
              id: tracking.id,
              amount: tracking.holdingAmount!,
              purchasePrice: tracking.averagePurchasePrice,
              purchaseDate: tracking.firstPurchaseDate,
              notes: tracking.notes,
              createdAt: tracking.addedAt,
              updatedAt: tracking.updatedAt,
              crypto: tracking.crypto,
            })),
          };
        }

        // Fallback to old model for backward compatibility during migration
        const holdings = await ctx.prisma.portfolioHolding.findMany({
          where: { userId },
          include: {
            crypto: true,
          },
          orderBy: {
            purchaseDate: 'desc',
          },
        });

        return {
          success: true,
          data: holdings,
        };
      } catch (error) {
        throw new Error(`Failed to fetch portfolio holdings: ${error}`);
      }
    }),

  updatePortfolioHolding: protectedProcedure
    .input(z.object({
      id: z.string(),
      amount: z.number().positive().optional(),
      purchasePrice: z.number().positive().optional(),
      purchaseDate: z.date().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { id, ...updateData } = input;
      
      try {
        // Verify ownership
        const holding = await ctx.prisma.portfolioHolding.findFirst({
          where: { id, userId },
        });

        if (!holding) {
          throw new Error('Portfolio holding not found or access denied');
        }

        // Update holding
        const updatedHolding = await ctx.prisma.portfolioHolding.update({
          where: { id },
          data: updateData,
          include: {
            crypto: true,
          },
        });

        return {
          success: true,
          message: 'Portfolio holding updated',
          data: updatedHolding,
        };
      } catch (error) {
        throw new Error(`Failed to update portfolio holding: ${error}`);
      }
    }),

  deletePortfolioHolding: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Verify ownership
        const holding = await ctx.prisma.portfolioHolding.findFirst({
          where: { id: input.id, userId },
          include: { crypto: true },
        });

        if (!holding) {
          throw new Error('Portfolio holding not found or access denied');
        }

        // Delete holding
        await ctx.prisma.portfolioHolding.delete({
          where: { id: input.id },
        });

        return {
          success: true,
          message: `Removed ${holding.crypto.symbol} from portfolio`,
        };
      } catch (error) {
        throw new Error(`Failed to delete portfolio holding: ${error}`);
      }
    }),

  // ===== NEW UNIFIED CRYPTO TRACKING ENDPOINTS =====
  
  // Add crypto to unified tracking (replaces both followCrypto and addPortfolioHolding)
  addCryptoToTracking: protectedProcedure
    .input(z.object({
      cryptoSymbol: z.string(),
      cryptoName: z.string().optional(),
      trackingType: z.enum(['WATCH_ONLY', 'ADD_HOLDING']),
      // Optional holding data (required when trackingType = 'ADD_HOLDING')
      holdingAmount: z.number().positive().optional(),
      purchasePrice: z.number().positive().optional(),
      purchaseDate: z.date().optional(),
      notes: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Validate holding data if adding holding
        if (input.trackingType === 'ADD_HOLDING') {
          if (!input.holdingAmount || !input.purchasePrice) {
            throw new Error('Amount and purchase price are required when adding holdings');
          }
        }

        // Check usage limits for watchlist additions
        if (input.trackingType === 'WATCH_ONLY') {
          const usageCheck = await featureGateService.canAddToWatchlist(userId);
          if (!usageCheck.allowed) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: `Watchlist limit reached (${usageCheck.currentUsage}/${usageCheck.limit}). Upgrade your subscription to follow more cryptocurrencies.`,
            });
          }
        }

        // Get the CoinGecko ID for this symbol
        const coinGeckoId = getCoinGeckoId(input.cryptoSymbol);
        
        // Ensure the cryptocurrency exists in our database
        const crypto = await ctx.prisma.cryptocurrency.upsert({
          where: { symbol: input.cryptoSymbol.toUpperCase() },
          update: {
            name: input.cryptoName || input.cryptoSymbol,
            coinGeckoId: coinGeckoId,
          },
          create: {
            symbol: input.cryptoSymbol.toUpperCase(),
            name: input.cryptoName || input.cryptoSymbol,
            coinGeckoId: coinGeckoId,
          },
        });

        // Check if tracking already exists
        const existingTracking = await ctx.prisma.cryptoTracking.findUnique({
          where: {
            userId_cryptoId: {
              userId,
              cryptoId: crypto.id,
            },
          },
        });

        let result;
        
        if (existingTracking) {
          // Update existing tracking
          if (input.trackingType === 'ADD_HOLDING') {
            // Convert from watching to holding or update existing holding
            result = await ctx.prisma.cryptoTracking.update({
              where: { id: existingTracking.id },
              data: {
                holdingAmount: input.holdingAmount,
                averagePurchasePrice: input.purchasePrice,
                totalInvested: input.holdingAmount && input.purchasePrice 
                  ? input.holdingAmount * input.purchasePrice 
                  : null,
                firstPurchaseDate: input.purchaseDate || new Date(),
                notes: input.notes || existingTracking.notes,
                tags: input.tags || existingTracking.tags,
                lastViewedAt: new Date(),
              },
              include: { crypto: true },
            });
          } else {
            // Just update last viewed for watching
            result = await ctx.prisma.cryptoTracking.update({
              where: { id: existingTracking.id },
              data: {
                lastViewedAt: new Date(),
                notes: input.notes || existingTracking.notes,
                tags: input.tags || existingTracking.tags,
              },
              include: { crypto: true },
            });
          }
        } else {
          // Create new tracking entry
          result = await ctx.prisma.cryptoTracking.create({
            data: {
              userId,
              cryptoId: crypto.id,
              isWatching: true,
              // Portfolio fields
              holdingAmount: input.trackingType === 'ADD_HOLDING' ? input.holdingAmount : null,
              averagePurchasePrice: input.trackingType === 'ADD_HOLDING' ? input.purchasePrice : null,
              totalInvested: input.trackingType === 'ADD_HOLDING' && input.holdingAmount && input.purchasePrice
                ? input.holdingAmount * input.purchasePrice 
                : null,
              firstPurchaseDate: input.trackingType === 'ADD_HOLDING' ? (input.purchaseDate || new Date()) : null,
              // Metadata
              addedAt: new Date(),
              notes: input.notes,
              tags: input.tags || [],
              lastViewedAt: new Date(),
              priceAlerts: [],
              // Migration tracking
              migratedFromFollowed: false,
              migratedFromHolding: false,
            },
            include: { crypto: true },
          });
        }

        // Track usage for watchlist additions
        if (input.trackingType === 'WATCH_ONLY' || !existingTracking) {
          await featureGateService.trackUsage(userId, UsageType.WATCHLIST_ADD, {
            cryptoSymbol: input.cryptoSymbol,
            cryptoName: input.cryptoName,
            trackingType: input.trackingType,
          });
        }

        const actionText = input.trackingType === 'ADD_HOLDING' 
          ? `Added ${input.holdingAmount} ${input.cryptoSymbol.toUpperCase()} to portfolio`
          : `Added ${input.cryptoSymbol.toUpperCase()} to watchlist`;

        return {
          success: true,
          message: actionText,
          data: result,
        };
      } catch (error) {
        throw new Error(`Failed to add crypto tracking: ${error}`);
      }
    }),

  // Update existing crypto tracking
  updateCryptoTracking: protectedProcedure
    .input(z.object({
      id: z.string(),
      trackingType: z.enum(['WATCH_ONLY', 'ADD_HOLDING', 'REMOVE_HOLDING']).optional(),
      // Holdings data
      holdingAmount: z.number().positive().optional(),
      purchasePrice: z.number().positive().optional(),
      purchaseDate: z.date().optional(),
      notes: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { id, trackingType, ...updateData } = input;
      
      try {
        // Verify ownership
        const tracking = await ctx.prisma.cryptoTracking.findFirst({
          where: { id, userId },
          include: { crypto: true },
        });

        if (!tracking) {
          throw new Error('Crypto tracking entry not found or access denied');
        }

        // Prepare update data based on tracking type
        let finalUpdateData: {
          [key: string]: unknown;
          holdingAmount?: number | null;
          averagePurchasePrice?: number | null;
          totalInvested?: number | null;
          firstPurchaseDate?: Date | null;
        } = { ...updateData };

        if (trackingType === 'REMOVE_HOLDING') {
          // Convert from holding back to watching only
          finalUpdateData = {
            ...finalUpdateData,
            holdingAmount: null,
            averagePurchasePrice: null,
            totalInvested: null,
            firstPurchaseDate: null,
          };
        } else if (trackingType === 'ADD_HOLDING' && updateData.holdingAmount && updateData.purchasePrice) {
          // Add or update holding
          finalUpdateData = {
            ...finalUpdateData,
            totalInvested: updateData.holdingAmount * updateData.purchasePrice,
            firstPurchaseDate: updateData.purchaseDate || tracking.firstPurchaseDate || new Date(),
          };
        }

        // Always update last viewed
        finalUpdateData.lastViewedAt = new Date();

        // Update tracking
        const updatedTracking = await ctx.prisma.cryptoTracking.update({
          where: { id },
          data: finalUpdateData,
          include: { crypto: true },
        });

        let message = 'Crypto tracking updated';
        if (trackingType === 'REMOVE_HOLDING') {
          message = `Removed holdings for ${tracking.crypto.symbol}, now watching only`;
        } else if (trackingType === 'ADD_HOLDING') {
          message = `Updated holdings for ${tracking.crypto.symbol}`;
        }

        return {
          success: true,
          message,
          data: updatedTracking,
        };
      } catch (error) {
        throw new Error(`Failed to update crypto tracking: ${error}`);
      }
    }),

  // Get user's unified crypto tracking (replaces both getFollowedCryptos and getPortfolioHoldings)
  getUserCryptoTracking: protectedProcedure
    .input(z.object({
      filter: z.enum(['ALL', 'WATCHING_ONLY', 'HOLDINGS_ONLY']).default('ALL'),
      includePerformance: z.boolean().default(true),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Build where clause based on filter
        const whereClause: { 
          userId: string; 
          holdingAmount?: { not: null } | null; 
        } = { userId };
        
        if (input.filter === 'WATCHING_ONLY') {
          whereClause.holdingAmount = null;
        } else if (input.filter === 'HOLDINGS_ONLY') {
          whereClause.holdingAmount = { not: null };
        }

        const trackingEntries = await ctx.prisma.cryptoTracking.findMany({
          where: whereClause,
          include: {
            crypto: true,
          },
          orderBy: [
            { holdingAmount: { sort: 'desc', nulls: 'last' } }, // Holdings first
            { lastViewedAt: 'desc' }, // Then by recent activity
          ],
        });

        // Separate into categories for easier frontend handling
        const watchingOnly = trackingEntries.filter(entry => !entry.holdingAmount);
        const holdings = trackingEntries.filter(entry => entry.holdingAmount);

        // Calculate summary metrics
        const totalTracked = trackingEntries.length;
        const totalWatching = watchingOnly.length;
        const totalHoldings = holdings.length;
        
        const totalInvested = holdings.reduce((sum, entry) => 
          sum + (entry.totalInvested || 0), 0
        );

        return {
          success: true,
          data: {
            // All entries
            trackingEntries,
            // Categorized
            watchingOnly,
            holdings,
            // Summary
            summary: {
              totalTracked,
              totalWatching,
              totalHoldings,
              totalInvested,
            },
          },
        };
      } catch (error) {
        throw new Error(`Failed to fetch crypto tracking: ${error}`);
      }
    }),

  // Remove crypto from tracking (replaces both unfollowCrypto and deletePortfolioHolding)
  removeCryptoTracking: protectedProcedure
    .input(z.object({ 
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Verify ownership and get crypto info
        const tracking = await ctx.prisma.cryptoTracking.findFirst({
          where: { id: input.id, userId },
          include: { crypto: true },
        });

        if (!tracking) {
          throw new Error('Crypto tracking entry not found or access denied');
        }

        // Delete tracking entry
        await ctx.prisma.cryptoTracking.delete({
          where: { id: input.id },
        });

        const hadHoldings = tracking.holdingAmount !== null;
        const message = hadHoldings 
          ? `Removed ${tracking.crypto.symbol} from portfolio and watchlist`
          : `Removed ${tracking.crypto.symbol} from watchlist`;

        return {
          success: true,
          message,
          data: { crypto: tracking.crypto, hadHoldings },
        };
      } catch (error) {
        throw new Error(`Failed to remove crypto tracking: ${error}`);
      }
    }),

  // Enhanced crypto tracking with live prices and performance metrics
  getEnhancedCryptoTracking: protectedProcedure
    .input(z.object({
      filter: z.enum(['ALL', 'WATCHING_ONLY', 'HOLDINGS_ONLY']).default('ALL'),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Get raw tracking data from database
        const whereClause: { 
          userId: string; 
          holdingAmount?: { not: null } | null; 
        } = { userId };
        
        if (input.filter === 'WATCHING_ONLY') {
          whereClause.holdingAmount = null;
        } else if (input.filter === 'HOLDINGS_ONLY') {
          whereClause.holdingAmount = { not: null };
        }

        const trackingEntries = await ctx.prisma.cryptoTracking.findMany({
          where: whereClause,
          include: {
            crypto: true,
          },
          orderBy: [
            { holdingAmount: { sort: 'desc', nulls: 'last' } }, // Holdings first
            { lastViewedAt: 'desc' }, // Then by recent activity
          ],
        });

        // Convert Prisma data to CryptoManagerService format
        const serviceTrackingEntries = trackingEntries.map(entry => ({
          id: entry.id,
          isWatching: !entry.holdingAmount,
          holdingAmount: entry.holdingAmount,
          averagePurchasePrice: entry.averagePurchasePrice,
          totalInvested: entry.totalInvested,
          firstPurchaseDate: entry.firstPurchaseDate,
          notes: entry.notes,
          tags: entry.tags,
          lastViewedAt: entry.lastViewedAt,
          addedAt: entry.addedAt,
          crypto: {
            id: entry.crypto.id,
            symbol: entry.crypto.symbol,
            name: entry.crypto.name,
            coinGeckoId: entry.crypto.coinGeckoId,
            logoUrl: entry.crypto.logoUrl,
            marketCap: entry.crypto.marketCap,
            rank: entry.crypto.rank,
          },
        }));

        // Use CryptoManagerService to enhance with live prices
        const enhancedData = await cryptoManagerService.getEnhancedCryptoTracking(
          serviceTrackingEntries, 
          input.filter
        );

        return {
          success: true,
          data: enhancedData,
        };
      } catch (error) {
        console.error('Failed to fetch enhanced crypto tracking:', error);
        throw new Error(`Failed to fetch enhanced crypto tracking: ${error}`);
      }
    }),
});