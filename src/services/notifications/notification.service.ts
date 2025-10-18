import { prisma as db } from '@/lib/db/prisma';
import { NotificationType, AlertType } from '@prisma/client';
import { ResendEmailService } from '@/services/email/resend.service';

export interface NotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  alertId?: string;
  // Additional context for email notifications
  cryptoId?: string;
  alertType?: AlertType;
}

export interface AlertEmailContext {
  cryptoName: string;
  cryptoSymbol: string;
  alertType: AlertType;
  alertDetails: {
    title: string;
    message: string;
    timestamp: Date;
    triggerCount: number;
  };
}

// User type for notification methods
interface NotificationUser {
  email: string | null;
  name: string | null;
  preferences?: {
    emailNotifications?: boolean;
  } | null;
}

export class NotificationService {
  private emailService: ResendEmailService;

  constructor() {
    this.emailService = new ResendEmailService();
  }
  /**
   * Create a notification in the database
   */
  async createNotification(data: NotificationData) {
    try {
      const notification = await db.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          content: data.content,
          alertId: data.alertId,
          isRead: false,
        },
      });

      return notification;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create notification: ${message}`);
    }
  }

  /**
   * Send notification via multiple channels
   */
  async sendNotification(data: NotificationData) {
    try {
      // Create the notification record
      await this.createNotification(data);

      // Get user preferences for notification channels
      const user = await db.user.findUnique({
        where: { id: data.userId },
        include: { 
          preferences: true 
        },
      });

      if (!user) {
        console.error(`User not found for notification: ${data.userId}`);
        return false;
      }

      // Send email notification if enabled and email exists
      if (user.email && user.preferences?.emailNotifications !== false) {
        try {
          if (data.type === NotificationType.ALERT_TRIGGERED && data.alertId && data.cryptoId && data.alertType) {
            // Try to send specialized alert email using ResendEmailService
            try {
              await this.sendAlertEmail(data, user);
            } catch (alertEmailError) {
              console.error('Failed to send alert email, falling back to generic email:', alertEmailError);
              // Fallback to generic email if alert-specific email fails
              await this.sendGenericEmail(data, user);
            }
          } else {
            // Send generic notification email using ResendEmailService
            await this.sendGenericEmail(data, user);
          }
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
          // Continue with other notification methods even if email fails
        }
      }

      // TODO: Implement other notification channels
      // - Push notifications (if user.preferences?.pushNotifications)
      // - Discord notifications (if user.preferences?.discordNotifications)
      // - Telegram notifications (if user.preferences?.telegramNotifications)
      
      console.log(`Notification sent to user ${data.userId}: ${data.title}`);
      
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to send notification:', message);
      return false;
    }
  }

  /**
   * Send specialized alert email using ResendEmailService
   */
  private async sendAlertEmail(data: NotificationData, user: NotificationUser) {
    if (!data.alertId || !data.cryptoId || !data.alertType) {
      throw new Error('Missing alert context for alert email');
    }

    if (!user.email) {
      throw new Error('User email is required for alert email');
    }

    // Get alert and crypto details
    const alert = await db.alert.findUnique({
      where: { id: data.alertId },
      include: { crypto: true },
    });

    if (!alert || !alert.crypto) {
      throw new Error('Alert or crypto not found for email');
    }

    const alertContext: AlertEmailContext = {
      cryptoName: alert.crypto.name,
      cryptoSymbol: alert.crypto.symbol,
      alertType: data.alertType,
      alertDetails: {
        title: data.title,
        message: data.content,
        timestamp: new Date(),
        triggerCount: alert.triggerCount + 1,
      },
    };

    await this.emailService.sendAlertTriggeredEmail(
      user.email,
      user.name || undefined,
      alertContext
    );
  }

  /**
   * Send generic notification email using ResendEmailService
   */
  private async sendGenericEmail(data: NotificationData, user: NotificationUser) {
    if (!user.email) {
      throw new Error('User email is required for notification email');
    }

    await this.emailService.sendNotificationEmail(
      user.email,
      user.name || undefined,
      data.title,
      data.content
    );
  }

  /**
   * Send welcome email to new users using ResendEmailService
   */
  async sendWelcomeEmail(userEmail: string, userName?: string): Promise<boolean> {
    try {
      await this.emailService.sendWelcomeEmail(userEmail, userName);
      return true;
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return false;
    }
  }

  /**
   * Get unread notifications for a user
   */
  async getUnreadNotifications(userId: string) {
    try {
      return await db.notification.findMany({
        where: {
          userId,
          isRead: false,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get notifications: ${message}`);
    }
  }

  /**
   * Mark notifications as read
   */
  async markAsRead(notificationIds: string[]) {
    try {
      await db.notification.updateMany({
        where: {
          id: { in: notificationIds },
        },
        data: {
          isRead: true,
        },
      });

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to mark notifications as read: ${message}`);
    }
  }

  /**
   * Delete old notifications (cleanup)
   */
  async cleanupOldNotifications(daysOld: number = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await db.notification.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
          isRead: true,
        },
      });

      console.log(`Cleaned up ${result.count} old notifications`);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to cleanup notifications: ${message}`);
    }
  }
}