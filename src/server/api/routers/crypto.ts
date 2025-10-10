import { z } from 'zod'
import { createTRPCRouter, publicProcedure, protectedProcedure } from '@/server/api/trpc'

export const cryptoRouter = createTRPCRouter({
  getTopCryptos: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(10) }))
    .query(async () => {
      // TODO: Implement CoinGecko API integration
      return {
        cryptos: [],
        total: 0,
      }
    }),

  getCryptoById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async () => {
      // TODO: Implement cryptocurrency fetching
      return null
    }),

  followCrypto: protectedProcedure
    .input(z.object({ cryptoId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.followedCoin.create({
        data: {
          userId: ctx.session.user.id,
          cryptoId: input.cryptoId,
        },
      })
    }),

  unfollowCrypto: protectedProcedure
    .input(z.object({ cryptoId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.followedCoin.delete({
        where: {
          userId_cryptoId: {
            userId: ctx.session.user.id,
            cryptoId: input.cryptoId,
          },
        },
      })
    }),

  getFollowedCryptos: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.followedCoin.findMany({
      where: { userId: ctx.session.user.id },
      include: { crypto: true },
    })
  }),
})