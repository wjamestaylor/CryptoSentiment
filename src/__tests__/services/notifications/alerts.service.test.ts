import { AlertService } from '@/services/notifications/alerts.service';
import { AlertType, SentimentLabel } from '@prisma/client';

// Mock the database
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    alert: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    cryptocurrency: {
      upsert: jest.fn(),
    },
  },
}));

// Mock the notification service
jest.mock('@/services/notifications/notification.service', () => ({
  NotificationService: jest.fn(() => ({
    sendNotification: jest.fn(),
  })),
}));

// Import the mocked database after mocking
import { prisma } from '@/lib/db/prisma';

// Type assertion for the mocked database
const mockDb = prisma as jest.Mocked<typeof prisma>;

describe('AlertService', () => {
  let alertService: AlertService;

  beforeEach(() => {
    jest.clearAllMocks();
    alertService = new AlertService();
  });

  describe('createAlertWithSymbol', () => {
    it('should create alert with symbol successfully', async () => {
      const mockCreateAlertData = {
        userId: 'user-1',
        cryptoSymbol: 'BTC',
        cryptoName: 'Bitcoin',
        type: AlertType.PRICE_CHANGE,
        condition: {
          priceThreshold: 50000,
          direction: 'above' as const,
        },
      };

      const mockCrypto = {
        id: 'crypto-1',
        symbol: 'BTC',
        name: 'Bitcoin',
      };

      const mockAlert = {
        id: 'alert-1',
        userId: 'user-1',
        cryptoId: 'crypto-1',
        type: AlertType.PRICE_CHANGE,
        condition: JSON.stringify(mockCreateAlertData.condition),
        isActive: true,
        crypto: mockCrypto,
        user: { id: 'user-1', email: 'user@example.com' },
      };

      (mockDb.cryptocurrency.upsert as jest.Mock).mockResolvedValue(mockCrypto);
      (mockDb.alert.create as jest.Mock).mockResolvedValue(mockAlert);

      const result = await alertService.createAlertWithSymbol(mockCreateAlertData);

      expect(result).toEqual(mockAlert);
      expect(mockDb.cryptocurrency.upsert).toHaveBeenCalledWith({
        where: { symbol: 'BTC' },
        update: { name: 'Bitcoin' },
        create: { symbol: 'BTC', name: 'Bitcoin' },
      });
    });

    it('should handle database error', async () => {
      const mockCreateAlertData = {
        userId: 'user-1',
        cryptoSymbol: 'BTC',
        type: AlertType.PRICE_CHANGE,
        condition: { priceThreshold: 50000 },
      };

      (mockDb.cryptocurrency.upsert as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(alertService.createAlertWithSymbol(mockCreateAlertData)).rejects.toThrow('Failed to create alert: Database error');
    });
  });

  describe('getUserAlerts', () => {
    it('should get all alerts for a user', async () => {
      const mockAlerts = [
        {
          id: 'alert-1',
          userId: 'user-1',
          cryptoId: 'crypto-1',
          type: AlertType.SENTIMENT_CHANGE,
          condition: '{"sentimentThreshold": 0.7}',
          isActive: true,
          crypto: { id: 'crypto-1', symbol: 'BTC', name: 'Bitcoin' },
        },
      ];

      (mockDb.alert.findMany as jest.Mock).mockResolvedValue(mockAlerts);

      const result = await alertService.getUserAlerts('user-1');

      expect(result).toEqual(mockAlerts);
      expect(mockDb.alert.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: { crypto: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should get only active alerts when specified', async () => {
      const mockAlerts = [
        {
          id: 'alert-1',
          userId: 'user-1',
          isActive: true,
          crypto: { symbol: 'BTC' },
        },
      ];

      (mockDb.alert.findMany as jest.Mock).mockResolvedValue(mockAlerts);

      const result = await alertService.getUserAlerts('user-1', true);

      expect(result).toEqual(mockAlerts);
      expect(mockDb.alert.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isActive: true },
        include: { crypto: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('deleteAlert', () => {
    it('should delete alert successfully', async () => {
      (mockDb.alert.delete as jest.Mock).mockResolvedValue({});

      const result = await alertService.deleteAlert('alert-1');

      expect(result).toEqual({ success: true });
      expect(mockDb.alert.delete).toHaveBeenCalledWith({
        where: { id: 'alert-1' },
      });
    });

    it('should handle database error when deleting alert', async () => {
      (mockDb.alert.delete as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(alertService.deleteAlert('alert-1')).rejects.toThrow('Failed to delete alert: Database error');
    });
  });

  describe('checkAlerts', () => {
    it('should process alerts without errors', async () => {
      const sentimentData = {
        cryptoId: 'crypto-1',
        score: 0.8,
        label: SentimentLabel.BULLISH,
        confidence: 0.9,
      };

      const mockAlerts = [
        {
          id: 'alert-1',
          userId: 'user-1',
          cryptoId: 'crypto-1',
          type: AlertType.SENTIMENT_CHANGE,
          condition: '{"sentimentThreshold": 0.7, "direction": "bullish"}',
          isActive: true,
          triggerCount: 0,
          lastTriggered: null,
          crypto: { id: 'crypto-1', symbol: 'BTC', name: 'Bitcoin' },
          user: { id: 'user-1', email: 'user@example.com', name: 'Test User' },
        },
      ];

      (mockDb.alert.findMany as jest.Mock).mockResolvedValue(mockAlerts);
      (mockDb.alert.update as jest.Mock).mockResolvedValue({});

      // The method might not return anything, so just check it doesn't throw
      await expect(alertService.checkAlerts('crypto-1', sentimentData)).resolves.not.toThrow();
      
      expect(mockDb.alert.findMany).toHaveBeenCalledWith({
        where: { cryptoId: 'crypto-1', isActive: true },
        include: { crypto: true, user: true },
      });
    });

    it('should handle database errors by throwing', async () => {
      const sentimentData = {
        cryptoId: 'crypto-1',
        score: 0.8,
        label: SentimentLabel.BULLISH,
        confidence: 0.9,
      };

      (mockDb.alert.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Should throw an error when database fails
      await expect(alertService.checkAlerts('crypto-1', sentimentData)).rejects.toThrow('Failed to check alerts: Database error');
    });
  });
});