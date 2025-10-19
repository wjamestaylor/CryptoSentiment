/**
 * Tests for User Registration Service
 * Tests user registration handling, default preferences setup, and welcome emails
 */

import { UserRegistrationService } from '@/services/notifications/user-registration.service';

// Mock the NotificationService
const mockNotificationService = {
  sendWelcomeEmail: jest.fn(),
  sendNotification: jest.fn(),
};

jest.mock('@/services/notifications/notification.service', () => ({
  NotificationService: jest.fn(() => mockNotificationService),
}));

// Mock Prisma
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    userPreferences: {
      create: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/db/prisma';
import { NotificationService } from '@/services/notifications/notification.service';

describe('UserRegistrationService', () => {
  let userRegistrationService: UserRegistrationService;
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks first
    userRegistrationService = new UserRegistrationService(); // Then create service
    mockPrisma = prisma as any;
  });

  describe('handleNewUserRegistration', () => {
    it('should handle new user registration successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        preferences: null,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.userPreferences.create.mockResolvedValue({
        id: 'pref-123',
        userId: 'user-123',
        emailNotifications: true,
        pushNotifications: true,
      });
      mockNotificationService.sendWelcomeEmail.mockResolvedValue(undefined);

      const result = await userRegistrationService.handleNewUserRegistration('user-123');

      expect(result).toEqual({ success: true });
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        include: { preferences: true },
      });
      expect(mockPrisma.userPreferences.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
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
      expect(mockNotificationService.sendWelcomeEmail).toHaveBeenCalledWith('test@example.com', 'Test User');
    });

    it('should handle user registration with existing preferences', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        preferences: {
          id: 'existing-pref',
          emailNotifications: false,
        },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockNotificationService.sendWelcomeEmail.mockResolvedValue(undefined);

      const result = await userRegistrationService.handleNewUserRegistration('user-123');

      expect(result).toEqual({ success: true });
      expect(mockPrisma.userPreferences.create).not.toHaveBeenCalled();
      expect(mockNotificationService.sendWelcomeEmail).toHaveBeenCalledWith('test@example.com', 'Test User');
    });

    it('should handle user registration without name', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: null,
        preferences: null,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.userPreferences.create.mockResolvedValue({});
      mockNotificationService.sendWelcomeEmail.mockResolvedValue(undefined);

      const result = await userRegistrationService.handleNewUserRegistration('user-123');

      expect(result).toEqual({ success: true });
      expect(mockNotificationService.sendWelcomeEmail).toHaveBeenCalledWith('test@example.com', undefined);
    });

    it('should handle user registration without email', async () => {
      const mockUser = {
        id: 'user-123',
        email: null,
        name: 'Test User',
        preferences: null,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.userPreferences.create.mockResolvedValue({});

      const result = await userRegistrationService.handleNewUserRegistration('user-123');

      expect(result).toEqual({ success: true });
      expect(mockNotificationService.sendWelcomeEmail).not.toHaveBeenCalled();
    });

    it('should throw error when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        userRegistrationService.handleNewUserRegistration('user-123')
      ).rejects.toThrow('Failed to handle new user registration: User not found');
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

      await expect(
        userRegistrationService.handleNewUserRegistration('user-123')
      ).rejects.toThrow('Failed to handle new user registration: Database connection failed');
    });

    it('should handle email sending errors gracefully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        preferences: {
          id: 'existing-pref',
        },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockNotificationService.sendWelcomeEmail.mockRejectedValue(new Error('Email service unavailable'));

      await expect(
        userRegistrationService.handleNewUserRegistration('user-123')
      ).rejects.toThrow('Failed to handle new user registration: Email service unavailable');
    });
  });

  describe('sendSystemAnnouncement', () => {
    it('should send system announcement to all users with email notifications enabled', async () => {
      const mockUsers = [
        { id: 'user-1', email: 'user1@example.com', name: 'User 1', preferences: { emailNotifications: true } },
        { id: 'user-2', email: 'user2@example.com', name: 'User 2', preferences: { emailNotifications: true } },
      ];

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);
      mockNotificationService.sendNotification.mockResolvedValue(undefined);

      const result = await userRegistrationService.sendSystemAnnouncement(
        'System Update',
        'New features are now available!'
      );

      expect(result.totalUsers).toBe(2);
      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(0);
      expect(mockNotificationService.sendNotification).toHaveBeenCalledTimes(2);
      expect(mockNotificationService.sendNotification).toHaveBeenCalledWith({
        userId: 'user-1',
        type: 'SYSTEM_ANNOUNCEMENT',
        title: 'System Update',
        content: 'New features are now available!',
      });
    });

    it('should handle partial failures in system announcement', async () => {
      const mockUsers = [
        { id: 'user-1', email: 'user1@example.com', name: 'User 1', preferences: { emailNotifications: true } },
        { id: 'user-2', email: 'user2@example.com', name: 'User 2', preferences: { emailNotifications: true } },
      ];

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);
      mockNotificationService.sendNotification
        .mockResolvedValueOnce(undefined) // First user succeeds
        .mockRejectedValueOnce(new Error('Notification failed')); // Second user fails

      const result = await userRegistrationService.sendSystemAnnouncement(
        'System Update',
        'New features are now available!'
      );

      expect(result.totalUsers).toBe(2);
      expect(result.successCount).toBe(1);
      expect(result.failureCount).toBe(1);
      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toEqual({ userId: 'user-1', success: true });
      expect(result.results[1]).toEqual({ userId: 'user-2', success: false });
    });

    it('should filter out users without email addresses', async () => {
      const mockUsers = [
        { id: 'user-1', email: 'user1@example.com', name: 'User 1', preferences: { emailNotifications: true } },
        { id: 'user-2', email: null, name: 'User 2', preferences: { emailNotifications: true } },
      ];

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);
      mockNotificationService.sendNotification.mockResolvedValue(undefined);

      const result = await userRegistrationService.sendSystemAnnouncement(
        'System Update',
        'New features are now available!'
      );

      expect(result.totalUsers).toBe(1);
      expect(result.successCount).toBe(1);
      expect(mockNotificationService.sendNotification).toHaveBeenCalledTimes(1);
    });

    it('should handle errors in system announcement', async () => {
      mockPrisma.user.findMany.mockRejectedValue(new Error('Database error'));

      await expect(
        userRegistrationService.sendSystemAnnouncement('Title', 'Content')
      ).rejects.toThrow('Failed to send system announcement: Database error');
    });
  });

  describe('sendSecurityNotice', () => {
    it('should send security notice to specific user', async () => {
      mockNotificationService.sendNotification.mockResolvedValue(undefined);

      const result = await userRegistrationService.sendSecurityNotice(
        'user-123',
        'Security Alert',
        'Suspicious login detected'
      );

      expect(result).toEqual({ success: true });
      expect(mockNotificationService.sendNotification).toHaveBeenCalledWith({
        userId: 'user-123',
        type: 'SECURITY_NOTICE',
        title: 'Security Alert',
        content: 'Suspicious login detected',
      });
    });

    it('should handle errors in security notice', async () => {
      mockNotificationService.sendNotification.mockRejectedValue(new Error('Notification service error'));

      await expect(
        userRegistrationService.sendSecurityNotice('user-123', 'Title', 'Content')
      ).rejects.toThrow('Failed to send security notice: Notification service error');
    });
  });

  describe('sendSubscriptionUpdate', () => {
    it('should send subscription update notification', async () => {
      const subscriptionDetails = {
        tier: 'PRO',
        status: 'active',
        billingCycle: 'monthly',
        nextBillingDate: '2024-01-01',
      };

      mockNotificationService.sendNotification.mockResolvedValue(undefined);

      const result = await userRegistrationService.sendSubscriptionUpdate(
        'user-123',
        subscriptionDetails
      );

      expect(result).toEqual({ success: true });
      expect(mockNotificationService.sendNotification).toHaveBeenCalledWith({
        userId: 'user-123',
        type: 'SUBSCRIPTION_UPDATE',
        title: 'Subscription Updated',
        content: 'Your subscription has been updated to PRO tier. Your new features are now active!',
      });
    });

    it('should handle errors in subscription update', async () => {
      const subscriptionDetails = {
        tier: 'PRO',
        status: 'active',
        billingCycle: 'monthly',
        nextBillingDate: '2024-01-01',
      };

      mockNotificationService.sendNotification.mockRejectedValue(new Error('Notification service error'));

      await expect(
        userRegistrationService.sendSubscriptionUpdate('user-123', subscriptionDetails)
      ).rejects.toThrow('Failed to send subscription update: Notification service error');
    });
  });

  describe('Service instantiation', () => {
    it('should create a user registration service instance', () => {
      expect(userRegistrationService).toBeInstanceOf(UserRegistrationService);
    });

    it('should have required methods', () => {
      expect(typeof userRegistrationService.handleNewUserRegistration).toBe('function');
      expect(typeof userRegistrationService.sendSystemAnnouncement).toBe('function');
      expect(typeof userRegistrationService.sendSecurityNotice).toBe('function');
      expect(typeof userRegistrationService.sendSubscriptionUpdate).toBe('function');
    });

    it('should initialize with NotificationService instance', () => {
      // NotificationService constructor should have been called when creating the service
      expect(NotificationService).toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should wrap unknown errors with descriptive messages', async () => {
      mockPrisma.user.findUnique.mockRejectedValue('String error instead of Error object');

      await expect(
        userRegistrationService.handleNewUserRegistration('user-123')
      ).rejects.toThrow('Failed to handle new user registration: Unknown error');
    });

    it('should handle undefined errors', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(undefined);

      await expect(
        userRegistrationService.handleNewUserRegistration('user-123')
      ).rejects.toThrow('Failed to handle new user registration: Unknown error');
    });
  });
});