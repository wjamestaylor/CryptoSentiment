import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { NotificationService } from '@/services/notifications/notification.service';
import { UserRegistrationService } from '@/services/notifications/user-registration.service';
import { NotificationType } from '@prisma/client';

const notificationService = new NotificationService();
const userRegistrationService = new UserRegistrationService();

// Interface for notification preference updates
interface NotificationPreferenceUpdate {
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  discordNotifications?: boolean;
  telegramNotifications?: boolean;
}

export const notificationsRouter = createTRPCRouter({
  /**
   * Get unread notifications for the current user
   */
  getUnread: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const notifications = await notificationService.getUnreadNotifications(ctx.session.user.id);
        
        return {
          success: true,
          notifications,
          count: notifications.length,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to get notifications: ${message}`);
      }
    }),

  /**
   * Mark notifications as read
   */
  markAsRead: protectedProcedure
    .input(z.object({
      notificationIds: z.array(z.string()),
    }))
    .mutation(async ({ input }) => {
      try {
        await notificationService.markAsRead(input.notificationIds);
        
        return {
          success: true,
          message: 'Notifications marked as read',
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to mark notifications as read: ${message}`);
      }
    }),

  /**
   * Send a test notification (development only)
   */
  sendTest: protectedProcedure
    .input(z.object({
      type: z.nativeEnum(NotificationType),
      title: z.string(),
      content: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Test notifications are not available in production');
      }

      try {
        await notificationService.sendNotification({
          userId: ctx.session.user.id,
          type: input.type,
          title: input.title,
          content: input.content,
        });
        
        return {
          success: true,
          message: 'Test notification sent',
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to send test notification: ${message}`);
      }
    }),

  /**
   * Send welcome email to current user (development/testing)
   */
  sendWelcome: protectedProcedure
    .mutation(async ({ ctx }) => {
      try {
        if (!ctx.session.user.email) {
          throw new Error('User email not available');
        }

        const success = await notificationService.sendWelcomeEmail(
          ctx.session.user.email,
          ctx.session.user.name || undefined
        );
        
        return {
          success,
          message: success ? 'Welcome email sent' : 'Failed to send welcome email',
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to send welcome email: ${message}`);
      }
    }),

  /**
   * Handle user registration (called automatically or manually)
   */
  handleRegistration: protectedProcedure
    .mutation(async ({ ctx }) => {
      try {
        await userRegistrationService.handleNewUserRegistration(ctx.session.user.id);
        
        return {
          success: true,
          message: 'User registration handled successfully',
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to handle user registration: ${message}`);
      }
    }),

  /**
   * Get notification preferences for current user
   */
  getPreferences: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const user = await ctx.prisma.user.findUnique({
          where: { id: ctx.session.user.id },
          include: { preferences: true },
        });

        if (!user) {
          throw new Error('User not found');
        }

        const preferences = user.preferences || {
          emailNotifications: true,
          pushNotifications: true,
          discordNotifications: false,
          telegramNotifications: false,
        };
        
        return {
          success: true,
          preferences: {
            email: preferences.emailNotifications,
            push: preferences.pushNotifications,
            discord: preferences.discordNotifications,
            telegram: preferences.telegramNotifications,
          },
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to get notification preferences: ${message}`);
      }
    }),

  /**
   * Update notification preferences
   */
  updatePreferences: protectedProcedure
    .input(z.object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
      discord: z.boolean().optional(),
      telegram: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Prepare update data
        const updateData: NotificationPreferenceUpdate = {};
        if (input.email !== undefined) updateData.emailNotifications = input.email;
        if (input.push !== undefined) updateData.pushNotifications = input.push;
        if (input.discord !== undefined) updateData.discordNotifications = input.discord;
        if (input.telegram !== undefined) updateData.telegramNotifications = input.telegram;

        // Update or create preferences
        await ctx.prisma.userPreferences.upsert({
          where: { userId: ctx.session.user.id },
          update: updateData,
          create: {
            userId: ctx.session.user.id,
            emailNotifications: input.email ?? true,
            pushNotifications: input.push ?? true,
            discordNotifications: input.discord ?? false,
            telegramNotifications: input.telegram ?? false,
          },
        });
        
        return {
          success: true,
          message: 'Notification preferences updated',
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to update notification preferences: ${message}`);
      }
    }),

  /**
   * Send system announcement to all users (admin only)
   */
  sendSystemAnnouncement: protectedProcedure
    .input(z.object({
      title: z.string().min(1, 'Title is required'),
      content: z.string().min(1, 'Content is required'),
    }))
    .mutation(async ({ input }) => {
      // TODO: Add admin role check when role system is implemented
      // For now, allow in development only
      if (process.env.NODE_ENV === 'production') {
        throw new Error('System announcements require admin privileges');
      }

      try {
        const result = await userRegistrationService.sendSystemAnnouncement(
          input.title,
          input.content
        );
        
        return {
          success: true,
          message: `System announcement sent to ${result.successCount}/${result.totalUsers} users`,
          details: result,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to send system announcement: ${message}`);
      }
    }),

  /**
   * Clean up old notifications
   */
  cleanup: protectedProcedure
    .input(z.object({
      daysOld: z.number().min(1).max(365).optional().default(30),
    }))
    .mutation(async ({ input }) => {
      // TODO: Add admin role check when role system is implemented
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Cleanup requires admin privileges');
      }

      try {
        const result = await notificationService.cleanupOldNotifications(input.daysOld);
        
        return {
          success: true,
          message: `Cleaned up ${result.count} old notifications`,
          count: result.count,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to cleanup notifications: ${message}`);
      }
    }),
});