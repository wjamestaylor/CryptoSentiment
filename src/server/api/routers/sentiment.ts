import { z } from 'zod'
import { createTRPCRouter, publicProcedure, protectedProcedure } from '@/server/api/trpc'

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
    // Get sentiment for user's followed cryptocurrencies
    const followedCryptos = await ctx.prisma.followedCoin.findMany({
      where: { userId: ctx.session.user.id },
      select: { cryptoId: true },
    })

    if (followedCryptos.length === 0) {
      return []
    }

    return ctx.prisma.sentimentAnalysis.findMany({
      where: {
        cryptoId: {
          in: followedCryptos.map(fc => fc.cryptoId),
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
})