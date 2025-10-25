import { POST, DELETE } from '@/app/api/notifications/register-device/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    pushNotificationDevice: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

describe('Push Notification Device Registration API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST - Register Device', () => {
    it('should register a new device successfully', async () => {
      (prisma.pushNotificationDevice.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.pushNotificationDevice.create as jest.Mock).mockResolvedValue({
        id: 'device123',
        userId: 'user123',
        pushToken: 'ExponentPushToken[xxx]',
        platform: 'ios',
      });

      const request = new NextRequest('http://localhost:3000/api/notifications/register-device', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user123',
          pushToken: 'ExponentPushToken[xxx]',
          platform: 'ios',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Device registered successfully');
      expect(prisma.pushNotificationDevice.create).toHaveBeenCalledWith({
        data: {
          userId: 'user123',
          pushToken: 'ExponentPushToken[xxx]',
          platform: 'ios',
          lastActiveAt: expect.any(Date),
        },
      });
    });

    it('should update existing device registration', async () => {
      (prisma.pushNotificationDevice.findFirst as jest.Mock).mockResolvedValue({
        id: 'device123',
        userId: 'user123',
        pushToken: 'ExponentPushToken[xxx]',
        platform: 'ios',
      });
      (prisma.pushNotificationDevice.update as jest.Mock).mockResolvedValue({
        id: 'device123',
        userId: 'user123',
        pushToken: 'ExponentPushToken[xxx]',
        platform: 'android',
      });

      const request = new NextRequest('http://localhost:3000/api/notifications/register-device', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user123',
          pushToken: 'ExponentPushToken[xxx]',
          platform: 'android',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Device updated successfully');
      expect(prisma.pushNotificationDevice.update).toHaveBeenCalled();
    });

    it('should return error if userId is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/notifications/register-device', {
        method: 'POST',
        body: JSON.stringify({
          pushToken: 'ExponentPushToken[xxx]',
          platform: 'ios',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('userId and pushToken are required');
    });

    it('should return error if pushToken is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/notifications/register-device', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user123',
          platform: 'ios',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('userId and pushToken are required');
    });

    it('should return error if platform is invalid', async () => {
      const request = new NextRequest('http://localhost:3000/api/notifications/register-device', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user123',
          pushToken: 'ExponentPushToken[xxx]',
          platform: 'windows',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Valid platform (ios/android) is required');
    });

    it('should handle database errors', async () => {
      (prisma.pushNotificationDevice.findFirst as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost:3000/api/notifications/register-device', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user123',
          pushToken: 'ExponentPushToken[xxx]',
          platform: 'ios',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to register device');
    });
  });

  describe('DELETE - Unregister Device', () => {
    it('should unregister device successfully', async () => {
      (prisma.pushNotificationDevice.deleteMany as jest.Mock).mockResolvedValue({
        count: 1,
      });

      const request = new NextRequest('http://localhost:3000/api/notifications/register-device', {
        method: 'DELETE',
        body: JSON.stringify({
          userId: 'user123',
          pushToken: 'ExponentPushToken[xxx]',
        }),
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Device unregistered successfully');
      expect(prisma.pushNotificationDevice.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: 'user123',
          pushToken: 'ExponentPushToken[xxx]',
        },
      });
    });

    it('should return error if userId is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/notifications/register-device', {
        method: 'DELETE',
        body: JSON.stringify({
          pushToken: 'ExponentPushToken[xxx]',
        }),
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('userId and pushToken are required');
    });

    it('should handle database errors', async () => {
      (prisma.pushNotificationDevice.deleteMany as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost:3000/api/notifications/register-device', {
        method: 'DELETE',
        body: JSON.stringify({
          userId: 'user123',
          pushToken: 'ExponentPushToken[xxx]',
        }),
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to unregister device');
    });
  });
});
