import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/api/trpc';
import { getCoinGeckoId } from '@/lib/crypto-mappings';

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

  // Protected endpoint to follow a cryptocurrency
  followCrypto: protectedProcedure
    .input(z.object({ 
      symbol: z.string(),
      name: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      try {
        // Get the CoinGecko ID for this symbol
        const coinGeckoId = getCoinGeckoId(input.symbol);
        
        // First ensure the cryptocurrency exists in our database
        const crypto = await ctx.prisma.cryptocurrency.upsert({
          where: { symbol: input.symbol.toUpperCase() },
          update: {
            name: input.name || input.symbol,
            coinGeckoId: coinGeckoId,
          },
          create: {
            symbol: input.symbol.toUpperCase(),
            name: input.name || input.symbol,
            coinGeckoId: coinGeckoId,
          },
        });

        // Create or update the following relationship
        const following = await ctx.prisma.followedCoin.upsert({
          where: {
            userId_cryptoId: {
              userId,
              cryptoId: crypto.id,
            },
          },
          update: {},
          create: {
            userId,
            cryptoId: crypto.id,
          },
        });

        return {
          success: true,
          message: `Now following ${input.symbol.toUpperCase()}`,
          data: following,
        };
      } catch (error) {
        throw new Error(`Failed to follow cryptocurrency: ${error}`);
      }
    }),

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
  getFollowedCryptos: protectedProcedure
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
          data: followedCryptos.map((following) => following.crypto),
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
});