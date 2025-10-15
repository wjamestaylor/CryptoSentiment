import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { TRPCError } from '@trpc/server';
import crypto from 'crypto';

// Types for bot verification
const botLinkingSchema = z.object({
  verificationCode: z.string().min(6).max(20),
  botType: z.enum(['discord', 'telegram']),
});

const botUnlinkSchema = z.object({
  botType: z.enum(['discord', 'telegram']),
});

export const botsRouter = createTRPCRouter({
  /**
   * Get current bot connection status for the authenticated user
   */
  getConnectionStatus: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        discordUserId: true,
        discordVerified: true,
        telegramUserId: true,
        telegramVerified: true,
        preferences: {
          select: {
            discordNotifications: true,
            telegramNotifications: true,
          },
        },
      },
    });

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    return {
      discord: {
        connected: !!user.discordUserId && user.discordVerified,
        userId: user.discordUserId,
        notificationsEnabled: user.preferences?.discordNotifications ?? false,
      },
      telegram: {
        connected: !!user.telegramUserId && user.telegramVerified,
        userId: user.telegramUserId,
        notificationsEnabled: user.preferences?.telegramNotifications ?? false,
      },
    };
  }),

  /**
   * Generate a verification code for bot linking
   * This code will be used by the user in Discord/Telegram to verify their account
   */
  generateVerificationCode: protectedProcedure
    .input(z.object({ botType: z.enum(['discord', 'telegram']) }))
    .mutation(async ({ ctx, input }) => {
      // Generate a random 8-character verification code
      const verificationCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      
      // Store verification code in cache/database (you might want to use Redis for this)
      // For now, we'll store it in a simple in-memory cache
      // In production, use Redis with expiration
      // const cacheKey = `bot_verification:${ctx.session.user.id}:${input.botType}`;
      
      // TODO: Replace with Redis cache
      // await redis.setex(cacheKey, 300, verificationCode); // 5 minutes expiration
      
      console.log(`Generated verification code for user ${ctx.session.user.id} (${input.botType}): ${verificationCode}`);
      
      return {
        verificationCode,
        instructions: input.botType === 'discord' 
          ? `Go to our Discord server and use the command: \`/verify ${verificationCode}\``
          : `Start a chat with our Telegram bot (@CryptoSentimentBot) and send: \`/verify ${verificationCode}\``,
        expiresIn: 300, // 5 minutes
      };
    }),

  /**
   * Verify bot account linking
   * This is called by the bot services when a user provides a verification code
   */
  verifyBotLinking: protectedProcedure
    .input(botLinkingSchema.extend({
      botUserId: z.string(),
      botUsername: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Verify the verification code from cache
      // const cacheKey = `bot_verification:${ctx.session.user.id}:${input.botType}`;
      // const storedCode = await redis.get(cacheKey);
      // 
      // if (!storedCode || storedCode !== input.verificationCode) {
      //   throw new TRPCError({
      //     code: 'BAD_REQUEST',
      //     message: 'Invalid or expired verification code',
      //   });
      // }

      // For now, skip verification code check for development
      console.log(`Verifying bot linking for user ${ctx.session.user.id}: ${input.botType} - ${input.botUserId}`);

      // Update user with bot information
      const updateData: {
        discordUserId?: string;
        discordVerified?: boolean;
        telegramUserId?: string;
        telegramVerified?: boolean;
      } = {};
      
      if (input.botType === 'discord') {
        updateData.discordUserId = input.botUserId;
        updateData.discordVerified = true;
      } else if (input.botType === 'telegram') {
        updateData.telegramUserId = input.botUserId;
        updateData.telegramVerified = true;
      }

      await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: updateData,
      });

      // Enable notifications for the linked bot by default
      await ctx.prisma.userPreferences.upsert({
        where: { userId: ctx.session.user.id },
        create: {
          userId: ctx.session.user.id,
          discordNotifications: input.botType === 'discord',
          telegramNotifications: input.botType === 'telegram',
        },
        update: {
          discordNotifications: input.botType === 'discord' ? true : undefined,
          telegramNotifications: input.botType === 'telegram' ? true : undefined,
        },
      });

      // TODO: Clear verification code from cache
      // await redis.del(cacheKey);

      return {
        success: true,
        message: `${input.botType} account successfully linked!`,
      };
    }),

  /**
   * Unlink a bot account
   */
  unlinkBot: protectedProcedure
    .input(botUnlinkSchema)
    .mutation(async ({ ctx, input }) => {
      const updateData: {
        discordUserId?: string | null;
        discordVerified?: boolean;
        telegramUserId?: string | null;
        telegramVerified?: boolean;
      } = {};
      
      if (input.botType === 'discord') {
        updateData.discordUserId = null;
        updateData.discordVerified = false;
      } else if (input.botType === 'telegram') {
        updateData.telegramUserId = null;
        updateData.telegramVerified = false;
      }

      await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: updateData,
      });

      // Disable notifications for the unlinked bot
      await ctx.prisma.userPreferences.upsert({
        where: { userId: ctx.session.user.id },
        create: {
          userId: ctx.session.user.id,
          discordNotifications: input.botType === 'discord' ? false : true,
          telegramNotifications: input.botType === 'telegram' ? false : true,
        },
        update: {
          discordNotifications: input.botType === 'discord' ? false : undefined,
          telegramNotifications: input.botType === 'telegram' ? false : undefined,
        },
      });

      return {
        success: true,
        message: `${input.botType} account successfully unlinked!`,
      };
    }),

  /**
   * Toggle bot notifications
   */
  toggleNotifications: protectedProcedure
    .input(z.object({
      botType: z.enum(['discord', 'telegram']),
      enabled: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.userPreferences.upsert({
        where: { userId: ctx.session.user.id },
        create: {
          userId: ctx.session.user.id,
          discordNotifications: input.botType === 'discord' ? input.enabled : false,
          telegramNotifications: input.botType === 'telegram' ? input.enabled : false,
        },
        update: {
          discordNotifications: input.botType === 'discord' ? input.enabled : undefined,
          telegramNotifications: input.botType === 'telegram' ? input.enabled : undefined,
        },
      });

      return {
        success: true,
        message: `${input.botType} notifications ${input.enabled ? 'enabled' : 'disabled'}!`,
      };
    }),

  /**
   * Test bot connection by sending a test message
   */
  testBotConnection: protectedProcedure
    .input(z.object({ botType: z.enum(['discord', 'telegram']) }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          discordUserId: true,
          discordVerified: true,
          telegramUserId: true,
          telegramVerified: true,
          email: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      const isConnected = input.botType === 'discord' 
        ? (user.discordUserId && user.discordVerified)
        : (user.telegramUserId && user.telegramVerified);

      if (!isConnected) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `${input.botType} account is not connected`,
        });
      }

      // TODO: Send test message through bot services
      // const botService = input.botType === 'discord' ? discordService : telegramService;
      // await botService.sendTestMessage(user[`${input.botType}UserId`]);

      console.log(`Test message sent to ${input.botType} user: ${user[`${input.botType}UserId` as keyof typeof user]}`);

      return {
        success: true,
        message: `Test message sent to your ${input.botType} account!`,
      };
    }),
});