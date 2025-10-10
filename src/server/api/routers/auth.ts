import { z } from 'zod'
import { createTRPCRouter, publicProcedure, protectedProcedure } from '@/server/api/trpc'

export const authRouter = createTRPCRouter({
  getSession: publicProcedure.query(({ ctx }) => {
    return ctx.session
  }),

  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      include: {
        preferences: true,
        subscription: true,
      },
    })
    return user
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        username: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: input,
      })
    }),
})