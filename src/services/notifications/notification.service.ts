import { prisma as db } from '@/lib/db/prisma';
import { NotificationType } from '@prisma/client';

export interface NotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  alertId?: string;
}

export class NotificationService {
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
      const notification = await this.createNotification(data);

      // TODO: Implement actual notification sending
      // - Email notifications
      // - Push notifications  
      // - Discord/Telegram webhooks
      
      console.log(`Notification sent to user ${data.userId}: ${data.title}`);
      
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to send notification:', message);
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