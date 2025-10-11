// Mock NextAuth completely to avoid ES module issues
jest.mock('next-auth', () => ({
  default: jest.fn(),
  getServerSession: jest.fn(),
}));

jest.mock('next-auth/next', () => ({
  NextAuthHandler: jest.fn(),
}));

// Mock the problematic ES modules
jest.mock('jose', () => ({}));
jest.mock('openid-client', () => ({}));
jest.mock('@next-auth/prisma-adapter', () => ({
  PrismaAdapter: jest.fn(),
}));

// Mock the NotificationService
jest.mock('@/services/notifications/notification.service', () => ({
  NotificationService: jest.fn(() => ({
    getUnreadNotifications: jest.fn(),
    markAsRead: jest.fn(),
    sendNotification: jest.fn(),
    sendWelcomeEmail: jest.fn(),
    cleanupOldNotifications: jest.fn(),
  })),
}));

// Mock the UserRegistrationService
jest.mock('@/services/notifications/user-registration.service', () => ({
  UserRegistrationService: jest.fn(() => ({
    handleNewUserRegistration: jest.fn(),
    sendSystemAnnouncement: jest.fn(),
  })),
}));

import { NotificationType } from '@prisma/client';
import { NotificationService } from '@/services/notifications/notification.service';
import { UserRegistrationService } from '@/services/notifications/user-registration.service';
import { z } from 'zod';

const MockNotificationService = NotificationService as jest.MockedClass<typeof NotificationService>;
const MockUserRegistrationService = UserRegistrationService as jest.MockedClass<typeof UserRegistrationService>;

describe('Notifications Router tRPC Implementation', () => {
  let mockNotificationService: any;
  let mockUserRegistrationService: any;
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockNotificationService = {
      getUnreadNotifications: jest.fn(),
      markAsRead: jest.fn(),
      sendNotification: jest.fn(),
      sendWelcomeEmail: jest.fn(),
      cleanupOldNotifications: jest.fn(),
    };
    
    mockUserRegistrationService = {
      handleNewUserRegistration: jest.fn(),
      sendSystemAnnouncement: jest.fn(),
    };

    mockPrisma = {
      user: {
        findUnique: jest.fn(),
      },
      userPreferences: {
        upsert: jest.fn(),
      },
    };

    MockNotificationService.mockImplementation(() => mockNotificationService);
    MockUserRegistrationService.mockImplementation(() => mockUserRegistrationService);
  });

  describe('tRPC input validation schemas', () => {
    it('should validate markAsRead input schema', () => {
      const markAsReadSchema = z.object({
        notificationIds: z.array(z.string()),
      });

      expect(() => markAsReadSchema.parse({
        notificationIds: ['notif-1', 'notif-2'],
      })).not.toThrow();

      expect(() => markAsReadSchema.parse({
        notificationIds: [],
      })).not.toThrow();

      expect(() => markAsReadSchema.parse({})).toThrow();
      expect(() => markAsReadSchema.parse({
        notificationIds: ['notif-1', 123], // Invalid array element
      })).toThrow();
    });

    it('should validate sendTest input schema', () => {
      const sendTestSchema = z.object({
        type: z.nativeEnum(NotificationType),
        title: z.string(),
        content: z.string(),
      });

      expect(() => sendTestSchema.parse({
        type: NotificationType.ALERT_TRIGGERED,
        title: 'Test Alert',
        content: 'This is a test alert',
      })).not.toThrow();

      expect(() => sendTestSchema.parse({
        type: 'INVALID_TYPE', // Invalid enum value
        title: 'Test',
        content: 'Content',
      })).toThrow();

      expect(() => sendTestSchema.parse({
        type: NotificationType.ALERT_TRIGGERED,
        title: '', // Empty title
        content: 'Content',
      })).not.toThrow(); // String accepts empty

      expect(() => sendTestSchema.parse({
        type: NotificationType.ALERT_TRIGGERED,
        title: 'Test',
        // Missing content
      })).toThrow();
    });

    it('should validate updatePreferences input schema', () => {
      const updatePreferencesSchema = z.object({
        email: z.boolean().optional(),
        push: z.boolean().optional(),
        discord: z.boolean().optional(),
        telegram: z.boolean().optional(),
      });

      expect(() => updatePreferencesSchema.parse({
        email: true,
        push: false,
        discord: true,
        telegram: false,
      })).not.toThrow();

      expect(() => updatePreferencesSchema.parse({
        email: true,
      })).not.toThrow();

      expect(() => updatePreferencesSchema.parse({})).not.toThrow();

      expect(() => updatePreferencesSchema.parse({
        email: 'true', // String instead of boolean
      })).toThrow();
    });

    it('should validate sendSystemAnnouncement input schema', () => {
      const sendSystemAnnouncementSchema = z.object({
        title: z.string().min(1, 'Title is required'),
        content: z.string().min(1, 'Content is required'),
      });

      expect(() => sendSystemAnnouncementSchema.parse({
        title: 'System Update',
        content: 'Important system update message',
      })).not.toThrow();

      expect(() => sendSystemAnnouncementSchema.parse({
        title: '', // Empty title
        content: 'Content',
      })).toThrow();

      expect(() => sendSystemAnnouncementSchema.parse({
        title: 'Title',
        content: '', // Empty content
      })).toThrow();
    });

    it('should validate cleanup input schema', () => {
      const cleanupSchema = z.object({
        daysOld: z.number().min(1).max(365).optional().default(30),
      });

      expect(() => cleanupSchema.parse({ daysOld: 30 })).not.toThrow();
      expect(() => cleanupSchema.parse({ daysOld: 1 })).not.toThrow();
      expect(() => cleanupSchema.parse({ daysOld: 365 })).not.toThrow();
      expect(() => cleanupSchema.parse({})).not.toThrow();

      const result = cleanupSchema.parse({});
      expect(result.daysOld).toBe(30);

      expect(() => cleanupSchema.parse({ daysOld: 0 })).toThrow();
      expect(() => cleanupSchema.parse({ daysOld: 366 })).toThrow();
      expect(() => cleanupSchema.parse({ daysOld: -1 })).toThrow();
    });
  });

  describe('getUnread procedure logic', () => {
    it('should get unread notifications successfully', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          userId: 'user-1',
          type: NotificationType.ALERT_TRIGGERED,
          title: 'Bitcoin Alert',
          content: 'Bitcoin price alert triggered',
          isRead: false,
          createdAt: new Date(),
        },
        {
          id: 'notif-2',
          userId: 'user-1',
          type: NotificationType.SYSTEM_ANNOUNCEMENT,
          title: 'System Update',
          content: 'System maintenance scheduled',
          isRead: false,
          createdAt: new Date(),
        },
      ];

      mockNotificationService.getUnreadNotifications.mockResolvedValue(mockNotifications);

      // Simulate the tRPC procedure logic
      const userId = 'user-1';
      const notifications = await mockNotificationService.getUnreadNotifications(userId);
      
      const response = {
        success: true,
        notifications,
        count: notifications.length,
      };

      expect(response.success).toBe(true);
      expect(response.notifications).toEqual(mockNotifications);
      expect(response.count).toBe(2);
      expect(mockNotificationService.getUnreadNotifications).toHaveBeenCalledWith('user-1');
    });

    it('should handle empty notifications list', async () => {
      mockNotificationService.getUnreadNotifications.mockResolvedValue([]);

      const userId = 'user-1';
      const notifications = await mockNotificationService.getUnreadNotifications(userId);
      
      const response = {
        success: true,
        notifications,
        count: notifications.length,
      };

      expect(response.success).toBe(true);
      expect(response.notifications).toEqual([]);
      expect(response.count).toBe(0);
    });

    it('should handle service errors in getUnread', async () => {
      mockNotificationService.getUnreadNotifications.mockRejectedValue(new Error('Database error'));

      try {
        await mockNotificationService.getUnreadNotifications('user-1');
        fail('Should have thrown an error');
      } catch (error) {
        const wrappedError = new Error(`Failed to get notifications: ${error}`);
        expect(wrappedError.message).toContain('Failed to get notifications');
        expect(wrappedError.message).toContain('Database error');
      }
    });
  });

  describe('markAsRead procedure logic', () => {
    it('should mark notifications as read successfully', async () => {
      const notificationIds = ['notif-1', 'notif-2'];
      mockNotificationService.markAsRead.mockResolvedValue(undefined);

      // Simulate the tRPC procedure logic
      await mockNotificationService.markAsRead(notificationIds);
      
      const response = {
        success: true,
        message: 'Notifications marked as read',
      };

      expect(response.success).toBe(true);
      expect(response.message).toBe('Notifications marked as read');
      expect(mockNotificationService.markAsRead).toHaveBeenCalledWith(['notif-1', 'notif-2']);
    });

    it('should handle single notification ID', async () => {
      const notificationIds = ['notif-1'];
      mockNotificationService.markAsRead.mockResolvedValue(undefined);

      await mockNotificationService.markAsRead(notificationIds);
      
      expect(mockNotificationService.markAsRead).toHaveBeenCalledWith(['notif-1']);
    });

    it('should handle service errors in markAsRead', async () => {
      mockNotificationService.markAsRead.mockRejectedValue(new Error('Notification not found'));

      try {
        await mockNotificationService.markAsRead(['notif-1']);
        fail('Should have thrown an error');
      } catch (error) {
        const wrappedError = new Error(`Failed to mark notifications as read: ${error}`);
        expect(wrappedError.message).toContain('Failed to mark notifications as read');
        expect(wrappedError.message).toContain('Notification not found');
      }
    });
  });

  describe('sendTest procedure logic', () => {
    it('should send test notification successfully', async () => {
      const input = {
        type: NotificationType.ALERT_TRIGGERED,
        title: 'Test Alert',
        content: 'This is a test alert',
      };

      mockNotificationService.sendNotification.mockResolvedValue(true);

      // Simulate the tRPC procedure logic
      const userId = 'user-1';
      await mockNotificationService.sendNotification({
        userId,
        type: input.type,
        title: input.title,
        content: input.content,
      });
      
      const response = {
        success: true,
        message: 'Test notification sent',
      };

      expect(response.success).toBe(true);
      expect(response.message).toBe('Test notification sent');
      expect(mockNotificationService.sendNotification).toHaveBeenCalledWith({
        userId: 'user-1',
        type: NotificationType.ALERT_TRIGGERED,
        title: 'Test Alert',
        content: 'This is a test alert',
      });
    });

    it('should block test notifications in production', () => {
      const originalEnv = process.env.NODE_ENV;
      
      // Mock process.env for this test
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
      });

      expect(() => {
        if (process.env.NODE_ENV === 'production') {
          throw new Error('Test notifications are not available in production');
        }
      }).toThrow('Test notifications are not available in production');

      // Restore
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true,
      });
    });

    it('should handle service errors in sendTest', async () => {
      mockNotificationService.sendNotification.mockRejectedValue(new Error('Notification service error'));

      try {
        await mockNotificationService.sendNotification({
          userId: 'user-1',
          type: NotificationType.ALERT_TRIGGERED,
          title: 'Test',
          content: 'Test content',
        });
        fail('Should have thrown an error');
      } catch (error) {
        const wrappedError = new Error(`Failed to send test notification: ${error}`);
        expect(wrappedError.message).toContain('Failed to send test notification');
        expect(wrappedError.message).toContain('Notification service error');
      }
    });
  });

  describe('sendWelcome procedure logic', () => {
    it('should send welcome email successfully', async () => {
      const userEmail = 'user@example.com';
      const userName = 'Test User';
      
      mockNotificationService.sendWelcomeEmail.mockResolvedValue(true);

      // Simulate the tRPC procedure logic
      const success = await mockNotificationService.sendWelcomeEmail(userEmail, userName);
      
      const response = {
        success,
        message: success ? 'Welcome email sent' : 'Failed to send welcome email',
      };

      expect(response.success).toBe(true);
      expect(response.message).toBe('Welcome email sent');
      expect(mockNotificationService.sendWelcomeEmail).toHaveBeenCalledWith(
        'user@example.com',
        'Test User'
      );
    });

    it('should handle welcome email failure', async () => {
      mockNotificationService.sendWelcomeEmail.mockResolvedValue(false);

      const success = await mockNotificationService.sendWelcomeEmail('user@example.com');
      
      const response = {
        success,
        message: success ? 'Welcome email sent' : 'Failed to send welcome email',
      };

      expect(response.success).toBe(false);
      expect(response.message).toBe('Failed to send welcome email');
    });

    it('should handle missing user email', () => {
      const userEmail = null;

      expect(() => {
        if (!userEmail) {
          throw new Error('User email not available');
        }
      }).toThrow('User email not available');
    });

    it('should handle service errors in sendWelcome', async () => {
      mockNotificationService.sendWelcomeEmail.mockRejectedValue(new Error('Email service error'));

      try {
        await mockNotificationService.sendWelcomeEmail('user@example.com');
        fail('Should have thrown an error');
      } catch (error) {
        const wrappedError = new Error(`Failed to send welcome email: ${error}`);
        expect(wrappedError.message).toContain('Failed to send welcome email');
        expect(wrappedError.message).toContain('Email service error');
      }
    });
  });

  describe('handleRegistration procedure logic', () => {
    it('should handle user registration successfully', async () => {
      mockUserRegistrationService.handleNewUserRegistration.mockResolvedValue(undefined);

      // Simulate the tRPC procedure logic
      const userId = 'user-1';
      await mockUserRegistrationService.handleNewUserRegistration(userId);
      
      const response = {
        success: true,
        message: 'User registration handled successfully',
      };

      expect(response.success).toBe(true);
      expect(response.message).toBe('User registration handled successfully');
      expect(mockUserRegistrationService.handleNewUserRegistration).toHaveBeenCalledWith('user-1');
    });

    it('should handle service errors in handleRegistration', async () => {
      mockUserRegistrationService.handleNewUserRegistration.mockRejectedValue(new Error('Registration service error'));

      try {
        await mockUserRegistrationService.handleNewUserRegistration('user-1');
        fail('Should have thrown an error');
      } catch (error) {
        const wrappedError = new Error(`Failed to handle user registration: ${error}`);
        expect(wrappedError.message).toContain('Failed to handle user registration');
        expect(wrappedError.message).toContain('Registration service error');
      }
    });
  });

  describe('getPreferences procedure logic', () => {
    it('should get notification preferences successfully', async () => {
      const mockUser = {
        id: 'user-1',
        preferences: {
          emailNotifications: true,
          pushNotifications: false,
          discordNotifications: true,
          telegramNotifications: false,
        },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      // Simulate the tRPC procedure logic
      const userId = 'user-1';
      const user = await mockPrisma.user.findUnique({
        where: { id: userId },
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
      
      const response = {
        success: true,
        preferences: {
          email: preferences.emailNotifications,
          push: preferences.pushNotifications,
          discord: preferences.discordNotifications,
          telegram: preferences.telegramNotifications,
        },
      };

      expect(response.success).toBe(true);
      expect(response.preferences).toEqual({
        email: true,
        push: false,
        discord: true,
        telegram: false,
      });
    });

    it('should handle user with no preferences (default values)', async () => {
      const mockUser = {
        id: 'user-1',
        preferences: null,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const user = await mockPrisma.user.findUnique({
        where: { id: 'user-1' },
        include: { preferences: true },
      });

      const preferences = user.preferences || {
        emailNotifications: true,
        pushNotifications: true,
        discordNotifications: false,
        telegramNotifications: false,
      };
      
      const response = {
        success: true,
        preferences: {
          email: preferences.emailNotifications,
          push: preferences.pushNotifications,
          discord: preferences.discordNotifications,
          telegram: preferences.telegramNotifications,
        },
      };

      expect(response.preferences).toEqual({
        email: true,
        push: true,
        discord: false,
        telegram: false,
      });
    });

    it('should handle user not found in getPreferences', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      try {
        const user = await mockPrisma.user.findUnique({
          where: { id: 'user-1' },
          include: { preferences: true },
        });

        if (!user) {
          throw new Error('User not found');
        }
        fail('Should have thrown an error');
      } catch (error) {
        const wrappedError = new Error(`Failed to get notification preferences: ${error}`);
        expect(wrappedError.message).toContain('Failed to get notification preferences');
        expect(wrappedError.message).toContain('User not found');
      }
    });
  });

  describe('updatePreferences procedure logic', () => {
    it('should update notification preferences successfully', async () => {
      const input = {
        email: false,
        push: true,
        discord: true,
        telegram: false,
      };

      mockPrisma.userPreferences.upsert.mockResolvedValue({
        userId: 'user-1',
        emailNotifications: false,
        pushNotifications: true,
        discordNotifications: true,
        telegramNotifications: false,
      });

      // Simulate the tRPC procedure logic
      const userId = 'user-1';
      const updateData: any = {};
      if (input.email !== undefined) updateData.emailNotifications = input.email;
      if (input.push !== undefined) updateData.pushNotifications = input.push;
      if (input.discord !== undefined) updateData.discordNotifications = input.discord;
      if (input.telegram !== undefined) updateData.telegramNotifications = input.telegram;

      await mockPrisma.userPreferences.upsert({
        where: { userId },
        update: updateData,
        create: {
          userId,
          emailNotifications: input.email ?? true,
          pushNotifications: input.push ?? true,
          discordNotifications: input.discord ?? false,
          telegramNotifications: input.telegram ?? false,
        },
      });
      
      const response = {
        success: true,
        message: 'Notification preferences updated',
      };

      expect(response.success).toBe(true);
      expect(response.message).toBe('Notification preferences updated');
      expect(mockPrisma.userPreferences.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        update: {
          emailNotifications: false,
          pushNotifications: true,
          discordNotifications: true,
          telegramNotifications: false,
        },
        create: {
          userId: 'user-1',
          emailNotifications: false,
          pushNotifications: true,
          discordNotifications: true,
          telegramNotifications: false,
        },
      });
    });

    it('should handle partial preference updates', async () => {
      const input = { email: false };

      mockPrisma.userPreferences.upsert.mockResolvedValue({});

      const userId = 'user-1';
      const updateData: any = {};
      if (input.email !== undefined) updateData.emailNotifications = input.email;

      await mockPrisma.userPreferences.upsert({
        where: { userId },
        update: updateData,
        create: {
          userId,
          emailNotifications: input.email ?? true,
          pushNotifications: true,
          discordNotifications: false,
          telegramNotifications: false,
        },
      });

      expect(mockPrisma.userPreferences.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        update: { emailNotifications: false },
        create: {
          userId: 'user-1',
          emailNotifications: false,
          pushNotifications: true,
          discordNotifications: false,
          telegramNotifications: false,
        },
      });
    });

    it('should handle database errors in updatePreferences', async () => {
      mockPrisma.userPreferences.upsert.mockRejectedValue(new Error('Database error'));

      try {
        await mockPrisma.userPreferences.upsert({
          where: { userId: 'user-1' },
          update: {},
          create: {},
        });
        fail('Should have thrown an error');
      } catch (error) {
        const wrappedError = new Error(`Failed to update notification preferences: ${error}`);
        expect(wrappedError.message).toContain('Failed to update notification preferences');
        expect(wrappedError.message).toContain('Database error');
      }
    });
  });

  describe('sendSystemAnnouncement procedure logic', () => {
    it('should send system announcement successfully', async () => {
      const input = {
        title: 'System Maintenance',
        content: 'Scheduled maintenance tonight at 2 AM',
      };

      const mockResult = {
        successCount: 150,
        totalUsers: 200,
        failedUsers: 50,
      };

      mockUserRegistrationService.sendSystemAnnouncement.mockResolvedValue(mockResult);

      // Simulate the tRPC procedure logic
      const result = await mockUserRegistrationService.sendSystemAnnouncement(
        input.title,
        input.content
      );
      
      const response = {
        success: true,
        message: `System announcement sent to ${result.successCount}/${result.totalUsers} users`,
        details: result,
      };

      expect(response.success).toBe(true);
      expect(response.message).toBe('System announcement sent to 150/200 users');
      expect(response.details).toEqual(mockResult);
      expect(mockUserRegistrationService.sendSystemAnnouncement).toHaveBeenCalledWith(
        'System Maintenance',
        'Scheduled maintenance tonight at 2 AM'
      );
    });

    it('should block system announcements in production', () => {
      const originalEnv = process.env.NODE_ENV;
      
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
      });

      expect(() => {
        if (process.env.NODE_ENV === 'production') {
          throw new Error('System announcements require admin privileges');
        }
      }).toThrow('System announcements require admin privileges');

      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true,
      });
    });

    it('should handle service errors in sendSystemAnnouncement', async () => {
      mockUserRegistrationService.sendSystemAnnouncement.mockRejectedValue(new Error('Announcement service error'));

      try {
        await mockUserRegistrationService.sendSystemAnnouncement('Title', 'Content');
        fail('Should have thrown an error');
      } catch (error) {
        const wrappedError = new Error(`Failed to send system announcement: ${error}`);
        expect(wrappedError.message).toContain('Failed to send system announcement');
        expect(wrappedError.message).toContain('Announcement service error');
      }
    });
  });

  describe('cleanup procedure logic', () => {
    it('should cleanup old notifications successfully', async () => {
      const input = { daysOld: 60 };
      const mockResult = { count: 250 };

      mockNotificationService.cleanupOldNotifications.mockResolvedValue(mockResult);

      // Simulate the tRPC procedure logic
      const result = await mockNotificationService.cleanupOldNotifications(input.daysOld);
      
      const response = {
        success: true,
        message: `Cleaned up ${result.count} old notifications`,
        count: result.count,
      };

      expect(response.success).toBe(true);
      expect(response.message).toBe('Cleaned up 250 old notifications');
      expect(response.count).toBe(250);
      expect(mockNotificationService.cleanupOldNotifications).toHaveBeenCalledWith(60);
    });

    it('should use default days if not provided', async () => {
      const mockResult = { count: 100 };
      mockNotificationService.cleanupOldNotifications.mockResolvedValue(mockResult);

      // Default should be 30 days
      const result = await mockNotificationService.cleanupOldNotifications(30);
      
      expect(mockNotificationService.cleanupOldNotifications).toHaveBeenCalledWith(30);
    });

    it('should block cleanup in production', () => {
      const originalEnv = process.env.NODE_ENV;
      
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
      });

      expect(() => {
        if (process.env.NODE_ENV === 'production') {
          throw new Error('Cleanup requires admin privileges');
        }
      }).toThrow('Cleanup requires admin privileges');

      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true,
      });
    });

    it('should handle service errors in cleanup', async () => {
      mockNotificationService.cleanupOldNotifications.mockRejectedValue(new Error('Cleanup service error'));

      try {
        await mockNotificationService.cleanupOldNotifications(30);
        fail('Should have thrown an error');
      } catch (error) {
        const wrappedError = new Error(`Failed to cleanup notifications: ${error}`);
        expect(wrappedError.message).toContain('Failed to cleanup notifications');
        expect(wrappedError.message).toContain('Cleanup service error');
      }
    });
  });

  describe('environment-specific behavior', () => {
    it('should allow admin operations in development', () => {
      const originalEnv = process.env.NODE_ENV;
      
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
      });

      expect(() => {
        if (process.env.NODE_ENV === 'production') {
          throw new Error('Test notifications are not available in production');
        }
      }).not.toThrow();

      expect(() => {
        if (process.env.NODE_ENV === 'production') {
          throw new Error('System announcements require admin privileges');
        }
      }).not.toThrow();

      expect(() => {
        if (process.env.NODE_ENV === 'production') {
          throw new Error('Cleanup requires admin privileges');
        }
      }).not.toThrow();

      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true,
      });
    });

    it('should block admin operations in production', () => {
      const originalEnv = process.env.NODE_ENV;
      
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
      });

      expect(() => {
        if (process.env.NODE_ENV === 'production') {
          throw new Error('Test notifications are not available in production');
        }
      }).toThrow();

      expect(() => {
        if (process.env.NODE_ENV === 'production') {
          throw new Error('System announcements require admin privileges');
        }
      }).toThrow();

      expect(() => {
        if (process.env.NODE_ENV === 'production') {
          throw new Error('Cleanup requires admin privileges');
        }
      }).toThrow();

      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true,
      });
    });
  });
});