import { NotificationService, NotificationData } from '@/services/notifications/notification.service';
import { ResendEmailService } from '@/services/email/resend.service';
import { AlertType, NotificationType } from '@prisma/client';

// Mock ResendEmailService
jest.mock('@/services/email/resend.service');

// Mock the database
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    alert: {
      findUnique: jest.fn(),
    },
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockDb = require('@/lib/db/prisma').prisma;

const MockedResendEmailService = ResendEmailService as jest.MockedClass<typeof ResendEmailService>;

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let mockEmailService: jest.Mocked<ResendEmailService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock email service instance
    mockEmailService = new ResendEmailService() as jest.Mocked<ResendEmailService>;
    jest.spyOn(mockEmailService, 'sendAlertTriggeredEmail').mockImplementation(jest.fn());
    jest.spyOn(mockEmailService, 'sendNotificationEmail').mockImplementation(jest.fn());
    jest.spyOn(mockEmailService, 'sendWelcomeEmail').mockImplementation(jest.fn());
    
    MockedResendEmailService.mockImplementation(() => mockEmailService);
    
    notificationService = new NotificationService();
  });

  describe('createNotification', () => {
    it('should create notification in database', async () => {
      const mockNotification = {
        id: 'notification-1',
        userId: 'user-1',
        type: NotificationType.ALERT_TRIGGERED,
        title: 'Test Alert',
        content: 'Test content',
        isRead: false,
        createdAt: new Date(),
      };

      mockDb.notification.create.mockResolvedValue(mockNotification);

      const notificationData: NotificationData = {
        userId: 'user-1',
        type: NotificationType.ALERT_TRIGGERED,
        title: 'Test Alert',
        content: 'Test content',
        alertId: 'alert-1',
      };

      const result = await notificationService.createNotification(notificationData);

      expect(result).toEqual(mockNotification);
      expect(mockDb.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          type: NotificationType.ALERT_TRIGGERED,
          title: 'Test Alert',
          content: 'Test content',
          alertId: 'alert-1',
          isRead: false,
        },
      });
    });

    it('should handle database error', async () => {
      mockDb.notification.create.mockRejectedValue(new Error('Database error'));

      const notificationData: NotificationData = {
        userId: 'user-1',
        type: NotificationType.ALERT_TRIGGERED,
        title: 'Test Alert',
        content: 'Test content',
      };

      await expect(notificationService.createNotification(notificationData)).rejects.toThrow(
        'Failed to create notification: Database error'
      );
    });
  });

  describe('sendNotification', () => {
    const mockUser = {
      id: 'user-1',
      email: 'user@example.com',
      name: 'John Doe',
      preferences: {
        emailNotifications: true,
      },
    };

    const mockNotification = {
      id: 'notification-1',
      userId: 'user-1',
      type: NotificationType.ALERT_TRIGGERED,
      title: 'Test Alert',
      content: 'Test content',
      isRead: false,
      createdAt: new Date(),
    };

    beforeEach(() => {
      mockDb.notification.create.mockResolvedValue(mockNotification);
      mockDb.user.findUnique.mockResolvedValue(mockUser);
    });

    it('should send alert email when notification is alert triggered', async () => {
      const mockAlert = {
        id: 'alert-1',
        crypto: {
          name: 'Bitcoin',
          symbol: 'BTC',
        },
        triggerCount: 5,
      };

      mockDb.alert.findUnique.mockResolvedValue(mockAlert);
      mockEmailService.sendAlertTriggeredEmail.mockResolvedValue();

      const notificationData: NotificationData = {
        userId: 'user-1',
        type: NotificationType.ALERT_TRIGGERED,
        title: 'Bitcoin Alert',
        content: 'Bitcoin sentiment changed',
        alertId: 'alert-1',
        cryptoId: 'crypto-1',
        alertType: AlertType.SENTIMENT_CHANGE,
      };

      const result = await notificationService.sendNotification(notificationData);

      expect(result).toBe(true);
      expect(mockEmailService.sendAlertTriggeredEmail).toHaveBeenCalledWith(
        'user@example.com',
        'John Doe',
        {
          cryptoName: 'Bitcoin',
          cryptoSymbol: 'BTC',
          alertType: AlertType.SENTIMENT_CHANGE,
          alertDetails: {
            title: 'Bitcoin Alert',
            message: 'Bitcoin sentiment changed',
            timestamp: expect.any(Date),
            triggerCount: 6, // triggerCount + 1
          },
        }
      );
    });

    it('should send generic email for non-alert notifications', async () => {
      mockEmailService.sendNotificationEmail.mockResolvedValue();

      const notificationData: NotificationData = {
        userId: 'user-1',
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'System Update',
        content: 'System will be updated tonight',
      };

      const result = await notificationService.sendNotification(notificationData);

      expect(result).toBe(true);
      expect(mockEmailService.sendNotificationEmail).toHaveBeenCalledWith(
        'user@example.com',
        'John Doe',
        'System Update',
        'System will be updated tonight'
      );
    });

    it('should not send email when user has email notifications disabled', async () => {
      const userWithoutEmailNotifications = {
        ...mockUser,
        preferences: {
          emailNotifications: false,
        },
      };

      mockDb.user.findUnique.mockResolvedValue(userWithoutEmailNotifications);

      const notificationData: NotificationData = {
        userId: 'user-1',
        type: NotificationType.ALERT_TRIGGERED,
        title: 'Test Alert',
        content: 'Test content',
      };

      const result = await notificationService.sendNotification(notificationData);

      expect(result).toBe(true);
      expect(mockEmailService.sendAlertTriggeredEmail).not.toHaveBeenCalled();
      expect(mockEmailService.sendNotificationEmail).not.toHaveBeenCalled();
    });

    it('should not send email when user has no email address', async () => {
      const userWithoutEmail = {
        ...mockUser,
        email: null,
      };

      mockDb.user.findUnique.mockResolvedValue(userWithoutEmail);

      const notificationData: NotificationData = {
        userId: 'user-1',
        type: NotificationType.ALERT_TRIGGERED,
        title: 'Test Alert',
        content: 'Test content',
      };

      const result = await notificationService.sendNotification(notificationData);

      expect(result).toBe(true);
      expect(mockEmailService.sendAlertTriggeredEmail).not.toHaveBeenCalled();
      expect(mockEmailService.sendNotificationEmail).not.toHaveBeenCalled();
    });

    it('should continue if email sending fails', async () => {
      mockEmailService.sendNotificationEmail.mockRejectedValue(new Error('Email failed'));

      const notificationData: NotificationData = {
        userId: 'user-1',
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'System Update',
        content: 'System will be updated tonight',
      };

      const result = await notificationService.sendNotification(notificationData);

      expect(result).toBe(true); // Should still return true as notification was created
    });

    it('should handle user not found', async () => {
      mockDb.user.findUnique.mockResolvedValue(null);

      const notificationData: NotificationData = {
        userId: 'nonexistent-user',
        type: NotificationType.ALERT_TRIGGERED,
        title: 'Test Alert',
        content: 'Test content',
      };

      const result = await notificationService.sendNotification(notificationData);

      expect(result).toBe(false);
    });

    it('should handle missing alert context for alert emails', async () => {
      const notificationData: NotificationData = {
        userId: 'user-1',
        type: NotificationType.ALERT_TRIGGERED,
        title: 'Bitcoin Alert',
        content: 'Bitcoin sentiment changed',
        alertId: 'alert-1',
        // Missing cryptoId and alertType
      };

      const result = await notificationService.sendNotification(notificationData);

      expect(result).toBe(true);
      expect(mockEmailService.sendNotificationEmail).toHaveBeenCalled(); // Should fall back to generic email
      expect(mockEmailService.sendAlertTriggeredEmail).not.toHaveBeenCalled();
    });

    it('should handle alert not found for alert emails', async () => {
      mockDb.alert.findUnique.mockResolvedValue(null);

      const notificationData: NotificationData = {
        userId: 'user-1',
        type: NotificationType.ALERT_TRIGGERED,
        title: 'Bitcoin Alert',
        content: 'Bitcoin sentiment changed',
        alertId: 'nonexistent-alert',
        cryptoId: 'crypto-1',
        alertType: AlertType.SENTIMENT_CHANGE,
      };

      const result = await notificationService.sendNotification(notificationData);

      expect(result).toBe(true);
      expect(mockEmailService.sendNotificationEmail).toHaveBeenCalled(); // Should fall back to generic email
      expect(mockEmailService.sendAlertTriggeredEmail).not.toHaveBeenCalled();
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should delegate to email service', async () => {
      mockEmailService.sendWelcomeEmail.mockResolvedValue();

      const result = await notificationService.sendWelcomeEmail('user@example.com', 'John Doe');

      expect(result).toBe(true);
      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith('user@example.com', 'John Doe');
    });

    it('should handle email service failure', async () => {
      mockEmailService.sendWelcomeEmail.mockRejectedValue(new Error('Email failed'));

      const result = await notificationService.sendWelcomeEmail('user@example.com');

      expect(result).toBe(false);
    });
  });

  describe('getUnreadNotifications', () => {
    it('should get unread notifications for user', async () => {
      const mockNotifications = [
        {
          id: 'notification-1',
          userId: 'user-1',
          type: NotificationType.ALERT_TRIGGERED,
          title: 'Alert 1',
          content: 'Content 1',
          isRead: false,
          createdAt: new Date(),
        },
        {
          id: 'notification-2',
          userId: 'user-1',
          type: NotificationType.SYSTEM_ANNOUNCEMENT,
          title: 'Alert 2',
          content: 'Content 2',
          isRead: false,
          createdAt: new Date(),
        },
      ];

      mockDb.notification.findMany.mockResolvedValue(mockNotifications);

      const result = await notificationService.getUnreadNotifications('user-1');

      expect(result).toEqual(mockNotifications);
      expect(mockDb.notification.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          isRead: false,
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should handle database error', async () => {
      mockDb.notification.findMany.mockRejectedValue(new Error('Database error'));

      await expect(notificationService.getUnreadNotifications('user-1')).rejects.toThrow(
        'Failed to get notifications: Database error'
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark notifications as read', async () => {
      mockDb.notification.updateMany.mockResolvedValue({ count: 2 });

      const result = await notificationService.markAsRead(['notification-1', 'notification-2']);

      expect(result).toEqual({ success: true });
      expect(mockDb.notification.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['notification-1', 'notification-2'] },
        },
        data: {
          isRead: true,
        },
      });
    });

    it('should handle database error', async () => {
      mockDb.notification.updateMany.mockRejectedValue(new Error('Database error'));

      await expect(notificationService.markAsRead(['notification-1'])).rejects.toThrow(
        'Failed to mark notifications as read: Database error'
      );
    });
  });

  describe('cleanupOldNotifications', () => {
    it('should delete old read notifications', async () => {
      const mockResult = { count: 5 };
      mockDb.notification.deleteMany.mockResolvedValue(mockResult);

      const result = await notificationService.cleanupOldNotifications(30);

      expect(result).toEqual(mockResult);
      expect(mockDb.notification.deleteMany).toHaveBeenCalledWith({
        where: {
          createdAt: { lt: expect.any(Date) },
          isRead: true,
        },
      });
    });

    it('should use default days when not specified', async () => {
      const mockResult = { count: 3 };
      mockDb.notification.deleteMany.mockResolvedValue(mockResult);

      await notificationService.cleanupOldNotifications();

      expect(mockDb.notification.deleteMany).toHaveBeenCalledWith({
        where: {
          createdAt: { lt: expect.any(Date) },
          isRead: true,
        },
      });
    });

    it('should handle database error', async () => {
      mockDb.notification.deleteMany.mockRejectedValue(new Error('Database error'));

      await expect(notificationService.cleanupOldNotifications()).rejects.toThrow(
        'Failed to cleanup notifications: Database error'
      );
    });
  });
});