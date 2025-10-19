import { z } from 'zod'
import { createTRPCRouter, publicProcedure, protectedProcedure } from '@/server/api/trpc'
import { FeatureGateService } from '@/services/feature-gating/feature-gate.service'
import { UsageType } from '@prisma/client'
import { TRPCError } from '@trpc/server'

const featureGateService = new FeatureGateService()

export const sentimentRouter = createTRPCRouter({
  getSentimentByCrypto: publicProcedure
    .input(z.object({ cryptoId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.sentimentAnalysis.findMany({
        where: { cryptoId: input.cryptoId },
        include: {
          sources: true,
          whaleActivity: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })
    }),

  getLatestSentiment: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(10) }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.sentimentAnalysis.findMany({
        include: {
          crypto: true,
          sources: true,
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
      })
    }),

  getUserSentimentFeed: protectedProcedure.query(async ({ ctx }) => {
    // Get sentiment for user's tracked cryptocurrencies (unified tracking system)
    const trackedCryptos = await ctx.prisma.cryptoTracking.findMany({
      where: { userId: ctx.session.user.id },
      select: { cryptoId: true },
    })

    if (trackedCryptos.length === 0) {
      return []
    }

    return ctx.prisma.sentimentAnalysis.findMany({
      where: {
        cryptoId: {
          in: trackedCryptos.map(tc => tc.cryptoId),
        },
      },
      include: {
        crypto: true,
        sources: true,
        whaleActivity: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
  }),

  /**
   * Analyze cryptocurrency sentiment using AI (feature-gated)
   */
  analyzeWithAI: protectedProcedure
    .input(z.object({ 
      cryptoSymbol: z.string().min(1),
      includeHistorical: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if user can perform AI analysis
        const usageCheck = await featureGateService.canPerformAIAnalysis(ctx.session.user.id);
        
        if (!usageCheck.allowed) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: `AI analysis limit reached (${usageCheck.currentUsage}/${usageCheck.limit}). Upgrade your subscription for more AI analyses.`,
          });
        }

        // Track usage before performing analysis
        await featureGateService.trackUsage(ctx.session.user.id, UsageType.AI_ANALYSIS, {
          cryptoSymbol: input.cryptoSymbol,
          includeHistorical: input.includeHistorical,
        });

        // Perform AI analysis (this would integrate with your existing AI service)
        // For now, return a placeholder response
        return {
          success: true,
          data: {
            symbol: input.cryptoSymbol,
            score: Math.random() * 2 - 1, // -1 to 1
            label: 'NEUTRAL', // This would be calculated by AI
            confidence: Math.random(),
            summary: `AI analysis for ${input.cryptoSymbol} completed successfully.`,
            usageRemaining: usageCheck.remaining,
          },
          message: 'AI analysis completed successfully',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Error performing AI analysis:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to perform AI analysis',
        });
      }
    }),
})