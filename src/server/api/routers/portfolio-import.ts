/**
 * Portfolio Import API Router
 * 
 * Handles CSV and exchange API imports for portfolio holdings
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { TRPCError } from '@trpc/server';
import { csvImportService } from '@/services/portfolio/csv-import.service';
import { coinbaseImportService } from '@/services/portfolio/coinbase-import.service';
import { binanceImportService } from '@/services/portfolio/binance-import.service';
import { getCoinGeckoId } from '@/lib/crypto-mappings';

export const portfolioImportRouter = createTRPCRouter({
  /**
   * Parse and validate CSV content
   */
  parseCSV: protectedProcedure
    .input(z.object({ 
      csvContent: z.string().min(1, 'CSV content cannot be empty'),
    }))
    .mutation(async ({ input }) => {
      try {
        const result = csvImportService.parseCSV(input.csvContent);
        
        return {
          success: result.success,
          data: result.data,
          errors: result.errors,
          warnings: result.warnings,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }),

  /**
   * Get CSV template
   */
  getCSVTemplate: protectedProcedure
    .query(() => {
      return {
        success: true,
        template: csvImportService.generateTemplate(),
      };
    }),

  /**
   * Verify exchange credentials
   */
  verifyExchangeCredentials: protectedProcedure
    .input(z.object({
      exchange: z.enum(['coinbase', 'binance']),
      apiKey: z.string().min(1, 'API key is required'),
      apiSecret: z.string().min(1, 'API secret is required'),
      apiPassphrase: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const service = input.exchange === 'coinbase' 
          ? coinbaseImportService 
          : binanceImportService;

        const isValid = await service.verifyCredentials({
          apiKey: input.apiKey,
          apiSecret: input.apiSecret,
          apiPassphrase: input.apiPassphrase,
        });

        return {
          success: isValid,
          message: isValid 
            ? `Successfully connected to ${service.getExchangeName()}` 
            : `Failed to verify ${service.getExchangeName()} credentials`,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to verify credentials: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }),

  /**
   * Fetch holdings from exchange
   */
  fetchExchangeHoldings: protectedProcedure
    .input(z.object({
      exchange: z.enum(['coinbase', 'binance']),
      apiKey: z.string().min(1, 'API key is required'),
      apiSecret: z.string().min(1, 'API secret is required'),
      apiPassphrase: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const service = input.exchange === 'coinbase' 
          ? coinbaseImportService 
          : binanceImportService;

        const result = await service.fetchHoldings({
          apiKey: input.apiKey,
          apiSecret: input.apiSecret,
          apiPassphrase: input.apiPassphrase,
        });

        return {
          success: result.success,
          holdings: result.holdings,
          errors: result.errors,
          warnings: result.warnings,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch holdings: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }),

  /**
   * Import holdings to portfolio (from CSV or exchange)
   */
  importHoldings: protectedProcedure
    .input(z.object({
      holdings: z.array(z.object({
        symbol: z.string(),
        amount: z.number().positive(),
        purchasePrice: z.number().positive().optional(),
        purchaseDate: z.date().optional(),
        notes: z.string().optional(),
      })),
      overwriteExisting: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const errors: string[] = [];
      const imported: string[] = [];
      const skipped: string[] = [];

      try {
        for (const holding of input.holdings) {
          // Get or create cryptocurrency record
          const coinGeckoId = getCoinGeckoId(holding.symbol);
          
          let crypto = await ctx.prisma.cryptocurrency.findUnique({
            where: { symbol: holding.symbol },
          });

          if (!crypto) {
            crypto = await ctx.prisma.cryptocurrency.create({
              data: {
                symbol: holding.symbol,
                name: holding.symbol,
                coinGeckoId,
              },
            });
          }

          // Check if user already has this crypto tracked
          const existing = await ctx.prisma.cryptoTracking.findUnique({
            where: {
              userId_cryptoId: {
                userId,
                cryptoId: crypto.id,
              },
            },
          });

          if (existing && !input.overwriteExisting) {
            skipped.push(holding.symbol);
            continue;
          }

          // Calculate total invested if purchase price is provided
          const totalInvested = holding.purchasePrice 
            ? holding.amount * holding.purchasePrice 
            : undefined;

          // Create or update tracking entry
          await ctx.prisma.cryptoTracking.upsert({
            where: {
              userId_cryptoId: {
                userId,
                cryptoId: crypto.id,
              },
            },
            create: {
              userId,
              cryptoId: crypto.id,
              holdingAmount: holding.amount,
              averagePurchasePrice: holding.purchasePrice,
              totalInvested,
              firstPurchaseDate: holding.purchaseDate,
              notes: holding.notes,
              tags: ['imported'],
            },
            update: {
              holdingAmount: holding.amount,
              averagePurchasePrice: holding.purchasePrice,
              totalInvested,
              firstPurchaseDate: holding.purchaseDate,
              notes: holding.notes,
              tags: existing?.tags.includes('imported') 
                ? existing.tags 
                : [...(existing?.tags || []), 'imported'],
            },
          });

          imported.push(holding.symbol);
        }

        return {
          success: true,
          imported,
          skipped,
          errors,
          message: `Successfully imported ${imported.length} holdings${skipped.length > 0 ? `, skipped ${skipped.length} existing` : ''}`,
        };

      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to import holdings: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }),
});
