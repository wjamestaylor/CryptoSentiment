import { z } from 'zod';
import { createTRPCRouter, adminProcedure } from '@/server/api/trpc';
import { SubscriptionTier, UsageType } from '@prisma/client';

export const adminRouter = createTRPCRouter({
  // Get overall platform statistics
  getOverviewStats: adminProcedure.query(async ({ ctx }) => {
    try {
      const [totalUsers, activeUsers, totalSubscriptions, totalAlerts, totalUsageLogs] = await Promise.all([
        ctx.prisma.user.count(),
        ctx.prisma.user.count({
          where: {
            sessions: {
              some: {
                expires: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Active in last 30 days
                },
              },
            },
          },
        }),
        ctx.prisma.subscription.count({
          where: {
            status: 'ACTIVE',
          },
        }),
        ctx.prisma.alert.count(),
        ctx.prisma.usageLog.count(),
      ]);

      // Get subscription breakdown
      const subscriptionBreakdown = await ctx.prisma.subscription.groupBy({
        by: ['tier'],
        _count: true,
        where: {
          status: 'ACTIVE',
        },
      });

      return {
        success: true,
        data: {
          totalUsers,
          activeUsers,
          totalSubscriptions,
          totalAlerts,
          totalUsageLogs,
          subscriptionBreakdown: subscriptionBreakdown.reduce(
            (acc, item) => {
              acc[item.tier] = item._count;
              return acc;
            },
            {} as Record<string, number>
          ),
        },
      };
    } catch (error) {
      console.error('Failed to fetch overview stats:', error);
      throw new Error(`Failed to fetch overview stats: ${error}`);
    }
  }),

  // Get user activation funnel metrics
  getUserActivationFunnel: adminProcedure
    .input(
      z.object({
        days: z.number().min(1).max(90).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);

        // Users who signed up in the period
        const signedUpUsers = await ctx.prisma.user.count({
          where: { createdAt: { gte: since } },
        });

        // Users who completed onboarding
        const completedOnboarding = await ctx.prisma.user.count({
          where: {
            createdAt: { gte: since },
            onboardingCompleted: true,
          },
        });

        // Users who added at least one crypto to track
        const addedCrypto = await ctx.prisma.user.count({
          where: {
            createdAt: { gte: since },
            cryptoTracking: {
              some: {},
            },
          },
        });

        // Users who created at least one alert
        const createdAlert = await ctx.prisma.user.count({
          where: {
            createdAt: { gte: since },
            alerts: {
              some: {},
            },
          },
        });

        // Users who subscribed
        const subscribed = await ctx.prisma.user.count({
          where: {
            createdAt: { gte: since },
            subscription: {
              tier: {
                not: SubscriptionTier.FREE,
              },
            },
          },
        });

        return {
          success: true,
          data: {
            timeframeDays: input.days,
            funnel: [
              { step: 'Signed Up', count: signedUpUsers, percentage: 100 },
              {
                step: 'Completed Onboarding',
                count: completedOnboarding,
                percentage: signedUpUsers > 0 ? (completedOnboarding / signedUpUsers) * 100 : 0,
              },
              {
                step: 'Added Crypto',
                count: addedCrypto,
                percentage: signedUpUsers > 0 ? (addedCrypto / signedUpUsers) * 100 : 0,
              },
              {
                step: 'Created Alert',
                count: createdAlert,
                percentage: signedUpUsers > 0 ? (createdAlert / signedUpUsers) * 100 : 0,
              },
              {
                step: 'Subscribed',
                count: subscribed,
                percentage: signedUpUsers > 0 ? (subscribed / signedUpUsers) * 100 : 0,
              },
            ],
          },
        };
      } catch (error) {
        console.error('Failed to fetch activation funnel:', error);
        throw new Error(`Failed to fetch activation funnel: ${error}`);
      }
    }),

  // Get conversion rates (free to paid)
  getConversionRates: adminProcedure
    .input(
      z.object({
        days: z.number().min(1).max(90).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);

        const totalUsers = await ctx.prisma.user.count({
          where: { createdAt: { gte: since } },
        });

        const paidUsers = await ctx.prisma.user.count({
          where: {
            createdAt: { gte: since },
            subscription: {
              tier: {
                not: SubscriptionTier.FREE,
              },
              status: 'ACTIVE',
            },
          },
        });

        // Get breakdown by tier
        const tierBreakdown = await ctx.prisma.subscription.groupBy({
          by: ['tier'],
          _count: true,
          where: {
            status: 'ACTIVE',
            user: {
              createdAt: { gte: since },
            },
          },
        });

        return {
          success: true,
          data: {
            timeframeDays: input.days,
            totalUsers,
            paidUsers,
            conversionRate: totalUsers > 0 ? (paidUsers / totalUsers) * 100 : 0,
            tierBreakdown: tierBreakdown.map((item) => ({
              tier: item.tier,
              count: item._count,
              percentage: totalUsers > 0 ? (item._count / totalUsers) * 100 : 0,
            })),
          },
        };
      } catch (error) {
        console.error('Failed to fetch conversion rates:', error);
        throw new Error(`Failed to fetch conversion rates: ${error}`);
      }
    }),

  // Get retention metrics (cohort analysis)
  getRetentionMetrics: adminProcedure
    .input(
      z.object({
        cohortDays: z.number().min(7).max(90).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const cohortStart = new Date(Date.now() - input.cohortDays * 24 * 60 * 60 * 1000);

        // Users in cohort
        const cohortUsers = await ctx.prisma.user.findMany({
          where: { createdAt: { gte: cohortStart } },
          select: { id: true, createdAt: true },
        });

        // Calculate retention for different periods (7, 14, 30 days)
        const retentionPeriods = [7, 14, 30];
        const retentionData = await Promise.all(
          retentionPeriods.map(async (days) => {
            const checkDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
            const eligibleUsers = cohortUsers.filter(
              (u) => u.createdAt <= checkDate
            );

            if (eligibleUsers.length === 0) {
              return {
                days,
                retainedCount: 0,
                totalCount: 0,
                retentionRate: 0,
              };
            }

            // Users who had a session in the last 7 days
            const retainedCount = await ctx.prisma.user.count({
              where: {
                id: { in: eligibleUsers.map((u) => u.id) },
                sessions: {
                  some: {
                    expires: {
                      gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    },
                  },
                },
              },
            });

            return {
              days,
              retainedCount,
              totalCount: eligibleUsers.length,
              retentionRate: (retainedCount / eligibleUsers.length) * 100,
            };
          })
        );

        return {
          success: true,
          data: {
            cohortDays: input.cohortDays,
            cohortSize: cohortUsers.length,
            retentionData,
          },
        };
      } catch (error) {
        console.error('Failed to fetch retention metrics:', error);
        throw new Error(`Failed to fetch retention metrics: ${error}`);
      }
    }),

  // Get feature usage analytics
  getFeatureUsage: adminProcedure
    .input(
      z.object({
        days: z.number().min(1).max(90).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);

        // Get usage logs grouped by type
        const usageByType = await ctx.prisma.usageLog.groupBy({
          by: ['type'],
          _count: true,
          where: {
            createdAt: { gte: since },
          },
        });

        // Get unique users per feature
        const uniqueUsersPerFeature = await Promise.all(
          Object.values(UsageType).map(async (type) => {
            const uniqueUsers = await ctx.prisma.usageLog.findMany({
              where: {
                type,
                createdAt: { gte: since },
              },
              distinct: ['userId'],
              select: { userId: true },
            });

            return {
              feature: type,
              uniqueUsers: uniqueUsers.length,
            };
          })
        );

        // Get daily usage trends
        const dailyUsage = await ctx.prisma.usageLog.findMany({
          where: {
            createdAt: { gte: since },
          },
          select: {
            type: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        });

        // Group by date
        const dailyTrends = dailyUsage.reduce(
          (acc, log) => {
            const date = log.createdAt.toISOString().split('T')[0];
            if (!acc[date]) {
              acc[date] = {};
            }
            if (!acc[date][log.type]) {
              acc[date][log.type] = 0;
            }
            acc[date][log.type]++;
            return acc;
          },
          {} as Record<string, Record<string, number>>
        );

        return {
          success: true,
          data: {
            timeframeDays: input.days,
            usageByType: usageByType.map((item) => ({
              feature: item.type,
              count: item._count,
            })),
            uniqueUsersPerFeature,
            dailyTrends,
          },
        };
      } catch (error) {
        console.error('Failed to fetch feature usage:', error);
        throw new Error(`Failed to fetch feature usage: ${error}`);
      }
    }),

  // Get user growth over time
  getUserGrowth: adminProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365).default(90),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);

        const users = await ctx.prisma.user.findMany({
          where: {
            createdAt: { gte: since },
          },
          select: {
            createdAt: true,
            subscription: {
              select: {
                tier: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        });

        // Group by date
        const growthData = users.reduce(
          (acc, user) => {
            const date = user.createdAt.toISOString().split('T')[0];
            if (!acc[date]) {
              acc[date] = { total: 0, free: 0, pro: 0, business: 0 };
            }
            acc[date].total++;
            
            const tier = user.subscription?.tier || SubscriptionTier.FREE;
            if (tier === SubscriptionTier.FREE) {
              acc[date].free++;
            } else if (tier === SubscriptionTier.PRO) {
              acc[date].pro++;
            } else if (tier === SubscriptionTier.BUSINESS) {
              acc[date].business++;
            }
            
            return acc;
          },
          {} as Record<string, { total: number; free: number; pro: number; business: number }>
        );

        return {
          success: true,
          data: {
            timeframeDays: input.days,
            growthData,
          },
        };
      } catch (error) {
        console.error('Failed to fetch user growth:', error);
        throw new Error(`Failed to fetch user growth: ${error}`);
      }
    }),

  // Get recent user activity
  getRecentActivity: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const recentUsers = await ctx.prisma.user.findMany({
          take: input.limit,
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
            onboardingCompleted: true,
            subscription: {
              select: {
                tier: true,
                status: true,
              },
            },
            _count: {
              select: {
                cryptoTracking: true,
                alerts: true,
                usageLogs: true,
              },
            },
          },
        });

        return {
          success: true,
          data: recentUsers,
        };
      } catch (error) {
        console.error('Failed to fetch recent activity:', error);
        throw new Error(`Failed to fetch recent activity: ${error}`);
      }
    }),
});
