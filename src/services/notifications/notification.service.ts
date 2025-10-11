import { prisma as db } from '@/lib/db/prisma';
import { NotificationType, AlertType } from '@prisma/client';
import { EmailService, AlertEmailData } from '@/services/email/email.service';

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

export class NotificationService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
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
      const notification = await this.createNotification(data);

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
            // Try to send specialized alert email
            try {
              await this.sendAlertEmail(data, user);
            } catch (alertEmailError) {
              console.error('Failed to send alert email, falling back to generic email:', alertEmailError);
              // Fallback to generic email if alert-specific email fails
              await this.sendGenericEmail(data, user);
            }
          } else {
            // Send generic notification email
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
   * Send specialized alert email
   */
  private async sendAlertEmail(data: NotificationData, user: any) {
    if (!data.alertId || !data.cryptoId || !data.alertType) {
      throw new Error('Missing alert context for alert email');
    }

    // Get alert and crypto details
    const alert = await db.alert.findUnique({
      where: { id: data.alertId },
      include: { crypto: true },
    });

    if (!alert || !alert.crypto) {
      throw new Error('Alert or crypto not found for email');
    }

    const alertEmailData: AlertEmailData = {
      userEmail: user.email,
      userName: user.name || undefined,
      cryptoName: alert.crypto.name,
      cryptoSymbol: alert.crypto.symbol,
      alertType: data.alertType,
      alertDetails: {
        title: data.title,
        message: data.content,
        timestamp: new Date(),
        triggerCount: alert.triggerCount + 1, // Include the current trigger
      },
      dashboardUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard`,
    };

    return await this.emailService.sendAlertEmail(alertEmailData);
  }

  /**
   * Send generic notification email
   */
  private async sendGenericEmail(data: NotificationData, user: any) {
    const subject = `CryptoSentiment: ${data.title}`;
    const html = this.generateGenericEmailHTML(data, user);

    return await this.emailService.sendEmail({
      to: user.email,
      subject,
      html,
    });
  }

  /**
   * Generate HTML for generic notification emails
   */
  private generateGenericEmailHTML(data: NotificationData, user: any): string {
    const dashboardLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard`;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CryptoSentiment Notification</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e2e8f0;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .notification-content {
            background: #f1f5f9;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .cta-button {
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            font-size: 12px;
            color: #64748b;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">📊 CryptoSentiment</div>
        </div>

        ${user.name ? `<p>Hi ${user.name},</p>` : '<p>Hello,</p>'}

        <h2>${data.title}</h2>

        <div class="notification-content">
            <p>${data.content}</p>
        </div>

        <div style="text-align: center;">
            <a href="${dashboardLink}" class="cta-button">View Dashboard</a>
        </div>

        <div class="footer">
            <p>You're receiving this email because you have notifications enabled.<br>
            <a href="${dashboardLink}/profile">Manage notification preferences</a></p>
            
            <p>CryptoSentiment - AI-Powered Cryptocurrency Sentiment Analysis<br>
            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}">cryptosentiment.com</a></p>
        </div>
    </div>
</body>
</html>
    `;
  }

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(userEmail: string, userName?: string): Promise<boolean> {
    return await this.emailService.sendWelcomeEmail(userEmail, userName);
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