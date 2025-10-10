import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { AlertType } from '@prisma/client'

export const alertsRouter = createTRPCRouter({
  createAlert: protectedProcedure
    .input(
      z.object({
        cryptoId: z.string(),
        type: z.nativeEnum(AlertType),
        condition: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.alert.create({
        data: {
          userId: ctx.session.user.id,
          cryptoId: input.cryptoId,
          type: input.type,
          condition: input.condition,
        },
      })
    }),

  getUserAlerts: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.alert.findMany({
      where: { userId: ctx.session.user.id },
      include: { crypto: true },
      orderBy: { createdAt: 'desc' },
    })
  }),

  updateAlert: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        isActive: z.boolean().optional(),
        condition: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input
      return ctx.prisma.alert.update({
        where: { id, userId: ctx.session.user.id },
        data: updateData,
      })
    }),

  deleteAlert: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.alert.delete({
        where: { id: input.id, userId: ctx.session.user.id },
      })
    }),
})