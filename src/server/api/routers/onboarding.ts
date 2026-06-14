import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { TRPCError } from '@trpc/server';

export const onboardingRouter = createTRPCRouter({
  // Get onboarding status for the current user
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        onboardingCompleted: true,
        onboardingStep: true,
        onboardingCompletedAt: true,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    return {
      success: true,
      data: {
        completed: user.onboardingCompleted,
        currentStep: user.onboardingStep,
        completedAt: user.onboardingCompletedAt,
        shouldShowOnboarding: !user.onboardingCompleted,
      },
    };
  }),

  // Update onboarding step progress
  updateStep: protectedProcedure
    .input(
      z.object({
        step: z.number().min(0).max(10),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: {
          onboardingStep: input.step,
        },
        select: {
          onboardingStep: true,
        },
      });

      return {
        success: true,
        data: {
          currentStep: updated.onboardingStep,
        },
      };
    }),

  // Complete onboarding
  complete: protectedProcedure.mutation(async ({ ctx }) => {
    const updated = await ctx.prisma.user.update({
      where: { id: ctx.session.user.id },
      data: {
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
      },
      select: {
        onboardingCompleted: true,
        onboardingCompletedAt: true,
      },
    });

    return {
      success: true,
      data: {
        completed: updated.onboardingCompleted,
        completedAt: updated.onboardingCompletedAt,
      },
    };
  }),

  // Skip onboarding (mark as completed without going through steps)
  skip: protectedProcedure.mutation(async ({ ctx }) => {
    const updated = await ctx.prisma.user.update({
      where: { id: ctx.session.user.id },
      data: {
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
        onboardingStep: -1, // -1 indicates skipped
      },
    });

    return {
      success: true,
      data: {
        completed: updated.onboardingCompleted,
      },
    };
  }),

  // Reset onboarding (for testing or if user wants to see it again)
  reset: protectedProcedure.mutation(async ({ ctx }) => {
    const updated = await ctx.prisma.user.update({
      where: { id: ctx.session.user.id },
      data: {
        onboardingCompleted: false,
        onboardingStep: 0,
        onboardingCompletedAt: null,
      },
    });

    return {
      success: true,
      data: {
        completed: updated.onboardingCompleted,
        currentStep: updated.onboardingStep,
      },
    };
  }),
});
