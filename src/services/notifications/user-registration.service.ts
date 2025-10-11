import { NotificationService } from '@/services/notifications/notification.service';
import { prisma as db } from '@/lib/db/prisma';

export class UserRegistrationService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Handle new user registration - send welcome email and set up default preferences
   */
  async handleNewUserRegistration(userId: string) {
    try {
      // Get user details
      const user = await db.user.findUnique({
        where: { id: userId },
        include: { preferences: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Create default user preferences if they don't exist
      if (!user.preferences) {
        await db.userPreferences.create({
          data: {
            userId: user.id,
            emailNotifications: true,
            pushNotifications: true,
            discordNotifications: false,
            telegramNotifications: false,
            sentimentThreshold: 0.7,
            priceChangeThreshold: 0.1,
            volumeThreshold: 0.5,
            theme: 'dark',
            currency: 'USD',
            timezone: 'UTC',
          },
        });
      }

      // Send welcome email
      if (user.email) {
        await this.notificationService.sendWelcomeEmail(user.email, user.name || undefined);
        console.log(`Welcome email sent to new user: ${user.email}`);
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to handle new user registration:', message);
      throw new Error(`Failed to handle new user registration: ${message}`);
    }
  }

  /**
   * Send system announcement to all users with email notifications enabled
   */
  async sendSystemAnnouncement(title: string, content: string) {
    try {
      // Get all users with email notifications enabled
      const users = await db.user.findMany({
        where: {
          preferences: {
            emailNotifications: true,
          },
        },
        include: { preferences: true },
      });

      // Filter users with valid emails
      const usersWithEmail = users.filter(user => user.email);

      const results = [];
      
      for (const user of usersWithEmail) {
        try {
          await this.notificationService.sendNotification({
            userId: user.id,
            type: 'SYSTEM_ANNOUNCEMENT',
            title,
            content,
          });

          results.push({ userId: user.id, success: true });
        } catch (error) {
          console.error(`Failed to send announcement to user ${user.id}:`, error);
          results.push({ userId: user.id, success: false });
        }
      }

      const successCount = results.filter(r => r.success).length;
      console.log(`System announcement sent to ${successCount}/${usersWithEmail.length} users`);

      return {
        totalUsers: usersWithEmail.length,
        successCount,
        failureCount: usersWithEmail.length - successCount,
        results,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to send system announcement:', message);
      throw new Error(`Failed to send system announcement: ${message}`);
    }
  }

  /**
   * Send security notice to a specific user
   */
  async sendSecurityNotice(userId: string, title: string, content: string) {
    try {
      await this.notificationService.sendNotification({
        userId,
        type: 'SECURITY_NOTICE',
        title,
        content,
      });

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to send security notice:', message);
      throw new Error(`Failed to send security notice: ${message}`);
    }
  }

  /**
   * Send subscription update notification
   */
  async sendSubscriptionUpdate(userId: string, subscriptionDetails: any) {
    try {
      const title = 'Subscription Updated';
      const content = `Your subscription has been updated to ${subscriptionDetails.tier} tier. Your new features are now active!`;

      await this.notificationService.sendNotification({
        userId,
        type: 'SUBSCRIPTION_UPDATE',
        title,
        content,
      });

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to send subscription update:', message);
      throw new Error(`Failed to send subscription update: ${message}`);
    }
  }
}