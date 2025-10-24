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

  getUserStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Get counts for user statistics
    // Count ALL tracked coins (both watched-only and held coins)
    // Held coins are treated as watched coins for the purpose of counts
    const [trackedCoinsCount, activeAlertsCount] = await Promise.all([
      ctx.prisma.cryptoTracking.count({
        where: { userId },
      }),
      ctx.prisma.alert.count({
        where: { 
          userId,
          isActive: true,
        },
      }),
    ]);

    // Fallback to old model for backward compatibility during migration
    let followedCoinsCount = trackedCoinsCount;
    if (trackedCoinsCount === 0) {
      const [oldFollowedCoins, oldPortfolioHoldings] = await Promise.all([
        ctx.prisma.followedCoin.count({
          where: { userId },
        }),
        ctx.prisma.portfolioHolding.count({
          where: { userId },
        }),
      ]);
      // Sum both: held coins count as watched coins
      followedCoinsCount = oldFollowedCoins + oldPortfolioHoldings;
    }

    return {
      followedCoins: followedCoinsCount,
      activeAlerts: activeAlertsCount,
    };
  }),

  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    let preferences = await ctx.prisma.userPreferences.findUnique({
      where: { userId },
    });

    // Create default preferences if they don't exist
    if (!preferences) {
      preferences = await ctx.prisma.userPreferences.create({
        data: { userId },
      });
    }

    return preferences;
  }),

  updatePreferences: protectedProcedure
    .input(
      z.object({
        emailNotifications: z.boolean().optional(),
        pushNotifications: z.boolean().optional(),
        discordNotifications: z.boolean().optional(),
        telegramNotifications: z.boolean().optional(),
        sentimentThreshold: z.number().min(0).max(1).optional(),
        priceChangeThreshold: z.number().min(0).max(1).optional(),
        volumeThreshold: z.number().min(0).max(1).optional(),
        theme: z.enum(["light", "dark"]).optional(),
        currency: z.string().optional(),
        timezone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      return ctx.prisma.userPreferences.upsert({
        where: { userId },
        update: input,
        create: {
          userId,
          ...input,
        },
      });
    }),
})