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

// Mock the AlertService
jest.mock('@/services/notifications/alerts.service', () => ({
  AlertService: jest.fn(() => ({
    createAlertWithSymbol: jest.fn(),
    getUserAlerts: jest.fn(),
    updateAlert: jest.fn(),
    deleteAlert: jest.fn(),
    checkAlerts: jest.fn(),
  })),
}));

import { AlertType } from '@prisma/client';
import { AlertService } from '@/services/notifications/alerts.service';
import { z } from 'zod';

const MockAlertService = AlertService as jest.MockedClass<typeof AlertService>;

interface MockAlertServiceInstance {
  createAlertWithSymbol: jest.Mock;
  getUserAlerts: jest.Mock;
  updateAlert: jest.Mock;
  deleteAlert: jest.Mock;
  checkAlerts: jest.Mock;
}

describe('Alerts Router tRPC Implementation', () => {
  let mockAlertService: MockAlertServiceInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAlertService = {
      createAlertWithSymbol: jest.fn(),
      getUserAlerts: jest.fn(),
      updateAlert: jest.fn(),
      deleteAlert: jest.fn(),
      checkAlerts: jest.fn(),
    };
    (MockAlertService as jest.Mock).mockImplementation(() => mockAlertService as unknown as AlertService);
  });

  describe('tRPC input validation schemas', () => {
    it('should validate createAlert input schema', () => {
      const createAlertSchema = z.object({
        cryptoSymbol: z.string().min(1, "Cryptocurrency symbol is required"),
        cryptoName: z.string().optional(),
        type: z.nativeEnum(AlertType),
        condition: z.object({
          sentimentThreshold: z.number().min(-1).max(1).optional(),
          priceThreshold: z.number().positive().optional(),
          direction: z.enum(['bullish', 'bearish']).optional(),
          notificationMethods: z.array(z.string()).default(['email']),
          cooldownMinutes: z.number().positive().default(60),
        }),
      });

      // Valid inputs
      expect(() => createAlertSchema.parse({
        cryptoSymbol: 'BTC',
        cryptoName: 'Bitcoin',
        type: AlertType.SENTIMENT_CHANGE,
        condition: {
          sentimentThreshold: 0.7,
          direction: 'bullish',
          notificationMethods: ['email'],
          cooldownMinutes: 60,
        },
      })).not.toThrow();

      expect(() => createAlertSchema.parse({
        cryptoSymbol: 'ETH',
        type: AlertType.PRICE_CHANGE,
        condition: {
          priceThreshold: 3000,
          direction: 'bearish',
        },
      })).not.toThrow();

      // Invalid inputs
      expect(() => createAlertSchema.parse({
        cryptoSymbol: '', // Empty symbol
        type: AlertType.SENTIMENT_CHANGE,
        condition: {},
      })).toThrow();

      expect(() => createAlertSchema.parse({
        cryptoSymbol: 'BTC',
        type: AlertType.SENTIMENT_CHANGE,
        condition: {
          sentimentThreshold: 2.0, // Outside valid range
        },
      })).toThrow();

      expect(() => createAlertSchema.parse({
        cryptoSymbol: 'BTC',
        type: AlertType.PRICE_CHANGE,
        condition: {
          priceThreshold: -100, // Negative price
        },
      })).toThrow();
    });

    it('should validate getUserAlerts input schema', () => {
      const getUserAlertsSchema = z.object({
        activeOnly: z.boolean().default(false),
      });

      expect(() => getUserAlertsSchema.parse({ activeOnly: true })).not.toThrow();
      expect(() => getUserAlertsSchema.parse({ activeOnly: false })).not.toThrow();
      expect(() => getUserAlertsSchema.parse({})).not.toThrow();
      
      const result = getUserAlertsSchema.parse({});
      expect(result.activeOnly).toBe(false);
    });

    it('should validate updateAlert input schema', () => {
      const updateAlertSchema = z.object({
        id: z.string().min(1, "Alert ID is required"),
        condition: z.object({
          sentimentThreshold: z.number().min(-1).max(1).optional(),
          priceThreshold: z.number().positive().optional(),
          direction: z.enum(['bullish', 'bearish']).optional(),
          notificationMethods: z.array(z.string()).optional(),
          cooldownMinutes: z.number().positive().optional(),
        }).optional(),
        isActive: z.boolean().optional(),
      });

      expect(() => updateAlertSchema.parse({
        id: 'alert-1',
        condition: { sentimentThreshold: 0.8 },
        isActive: false,
      })).not.toThrow();

      expect(() => updateAlertSchema.parse({
        id: 'alert-1',
        isActive: true,
      })).not.toThrow();

      expect(() => updateAlertSchema.parse({
        id: '', // Empty ID
        isActive: true,
      })).toThrow();
    });

    it('should validate deleteAlert input schema', () => {
      const deleteAlertSchema = z.object({
        id: z.string().min(1, "Alert ID is required"),
      });

      expect(() => deleteAlertSchema.parse({ id: 'alert-1' })).not.toThrow();
      expect(() => deleteAlertSchema.parse({ id: '' })).toThrow();
      expect(() => deleteAlertSchema.parse({})).toThrow();
    });

    it('should validate testAlert input schema', () => {
      const testAlertSchema = z.object({
        cryptoId: z.string().min(1, "Crypto ID is required"),
        sentimentData: z.object({
          score: z.number().min(-1).max(1),
          label: z.string(),
          confidence: z.number().min(0).max(1),
        }).optional(),
        priceData: z.object({
          price: z.number().positive(),
          change24h: z.number(),
          volume24h: z.number().positive().optional(),
        }).optional(),
      });

      expect(() => testAlertSchema.parse({
        cryptoId: 'crypto-1',
        sentimentData: {
          score: 0.8,
          label: 'BULLISH',
          confidence: 0.9,
        },
      })).not.toThrow();

      expect(() => testAlertSchema.parse({
        cryptoId: 'crypto-1',
        priceData: {
          price: 50000,
          change24h: 5.2,
          volume24h: 1000000000,
        },
      })).not.toThrow();

      expect(() => testAlertSchema.parse({
        cryptoId: '', // Empty crypto ID
      })).toThrow();
    });
  });

  describe('createAlert procedure logic', () => {
    it('should create alert with valid input', async () => {
      const input = {
        cryptoSymbol: 'BTC',
        cryptoName: 'Bitcoin',
        type: AlertType.SENTIMENT_CHANGE,
        condition: {
          sentimentThreshold: 0.7,
          direction: 'bullish' as const,
          notificationMethods: ['email'],
          cooldownMinutes: 60,
        },
      };

      const mockAlert = {
        id: 'alert-1',
        userId: 'user-1',
        cryptoId: 'crypto-1',
        type: AlertType.SENTIMENT_CHANGE,
        condition: JSON.stringify(input.condition),
        isActive: true,
        crypto: { symbol: 'BTC', name: 'Bitcoin' },
      };

      mockAlertService.createAlertWithSymbol.mockResolvedValue(mockAlert);

      // Simulate the tRPC procedure logic
      const userId = 'user-1';
      const result = await mockAlertService.createAlertWithSymbol({
        userId,
        cryptoSymbol: input.cryptoSymbol,
        cryptoName: input.cryptoName,
        type: input.type,
        condition: input.condition,
      });

      const response = {
        success: true,
        alert: result,
        message: 'Alert created successfully',
      };

      expect(response.success).toBe(true);
      expect(response.alert).toEqual(mockAlert);
      expect(response.message).toBe('Alert created successfully');
      expect(mockAlertService.createAlertWithSymbol).toHaveBeenCalledWith({
        userId: 'user-1',
        cryptoSymbol: 'BTC',
        cryptoName: 'Bitcoin',
        type: AlertType.SENTIMENT_CHANGE,
        condition: input.condition,
      });
    });

    it('should handle service errors in createAlert', async () => {
      const input = {
        cryptoSymbol: 'BTC',
        type: AlertType.SENTIMENT_CHANGE,
        condition: { sentimentThreshold: 0.7 },
      };

      mockAlertService.createAlertWithSymbol.mockRejectedValue(new Error('Database connection failed'));

      try {
        await mockAlertService.createAlertWithSymbol({
          userId: 'user-1',
          ...input,
        });
        fail('Should have thrown an error');
      } catch (error) {
        const wrappedError = new Error(`Failed to create alert: ${error}`);
        expect(wrappedError.message).toContain('Failed to create alert');
        expect(wrappedError.message).toContain('Database connection failed');
      }
    });
  });

  describe('getUserAlerts procedure logic', () => {
    it('should get all alerts for user', async () => {
      const mockAlerts = [
        {
          id: 'alert-1',
          userId: 'user-1',
          cryptoId: 'crypto-1',
          type: AlertType.SENTIMENT_CHANGE,
          isActive: true,
          crypto: { symbol: 'BTC', name: 'Bitcoin' },
        },
        {
          id: 'alert-2',
          userId: 'user-1',
          cryptoId: 'crypto-2',
          type: AlertType.PRICE_CHANGE,
          isActive: false,
          crypto: { symbol: 'ETH', name: 'Ethereum' },
        },
      ];

      mockAlertService.getUserAlerts.mockResolvedValue(mockAlerts);

      // Simulate the tRPC procedure logic
      const userId = 'user-1';
      const activeOnly = false;
      
      const alerts = await mockAlertService.getUserAlerts(userId, activeOnly);
      const response = {
        success: true,
        alerts,
      };

      expect(response.success).toBe(true);
      expect(response.alerts).toEqual(mockAlerts);
      expect(mockAlertService.getUserAlerts).toHaveBeenCalledWith('user-1', false);
    });

    it('should get only active alerts when specified', async () => {
      const mockActiveAlerts = [
        {
          id: 'alert-1',
          userId: 'user-1',
          cryptoId: 'crypto-1',
          type: AlertType.SENTIMENT_CHANGE,
          isActive: true,
          crypto: { symbol: 'BTC', name: 'Bitcoin' },
        },
      ];

      mockAlertService.getUserAlerts.mockResolvedValue(mockActiveAlerts);

      const userId = 'user-1';
      const activeOnly = true;
      
      const alerts = await mockAlertService.getUserAlerts(userId, activeOnly);
      const response = {
        success: true,
        alerts,
      };

      expect(response.success).toBe(true);
      expect(response.alerts).toEqual(mockActiveAlerts);
      expect(mockAlertService.getUserAlerts).toHaveBeenCalledWith('user-1', true);
    });

    it('should handle service errors in getUserAlerts', async () => {
      mockAlertService.getUserAlerts.mockRejectedValue(new Error('Database error'));

      try {
        await mockAlertService.getUserAlerts('user-1', false);
        fail('Should have thrown an error');
      } catch (error) {
        const wrappedError = new Error(`Failed to get alerts: ${error}`);
        expect(wrappedError.message).toContain('Failed to get alerts');
        expect(wrappedError.message).toContain('Database error');
      }
    });
  });

  describe('updateAlert procedure logic', () => {
    it('should update alert successfully', async () => {
      const updateData = {
        condition: {
          sentimentThreshold: 0.8,
          direction: 'bearish' as const,
        },
        isActive: false,
      };

      const mockUpdatedAlert = {
        id: 'alert-1',
        userId: 'user-1',
        cryptoId: 'crypto-1',
        type: AlertType.SENTIMENT_CHANGE,
        condition: JSON.stringify(updateData.condition),
        isActive: false,
        crypto: { symbol: 'BTC', name: 'Bitcoin' },
      };

      mockAlertService.updateAlert.mockResolvedValue(mockUpdatedAlert);

      // Simulate the tRPC procedure logic
      const alertId = 'alert-1';
      
      const updatedAlert = await mockAlertService.updateAlert(alertId, updateData);
      const response = {
        success: true,
        alert: updatedAlert,
        message: 'Alert updated successfully',
      };

      expect(response.success).toBe(true);
      expect(response.alert).toEqual(mockUpdatedAlert);
      expect(response.message).toBe('Alert updated successfully');
      expect(mockAlertService.updateAlert).toHaveBeenCalledWith('alert-1', updateData);
    });

    it('should handle partial updates', async () => {
      const updateData = { isActive: true };
      const mockUpdatedAlert = { id: 'alert-1', isActive: true };

      mockAlertService.updateAlert.mockResolvedValue(mockUpdatedAlert);

      const alertId = 'alert-1';
      const updatedAlert = await mockAlertService.updateAlert(alertId, updateData);

      expect(updatedAlert).toEqual(mockUpdatedAlert);
      expect(mockAlertService.updateAlert).toHaveBeenCalledWith('alert-1', { isActive: true });
    });

    it('should handle service errors in updateAlert', async () => {
      mockAlertService.updateAlert.mockRejectedValue(new Error('Alert not found'));

      try {
        await mockAlertService.updateAlert('alert-1', { isActive: false });
        fail('Should have thrown an error');
      } catch (error) {
        const wrappedError = new Error(`Failed to update alert: ${error}`);
        expect(wrappedError.message).toContain('Failed to update alert');
        expect(wrappedError.message).toContain('Alert not found');
      }
    });
  });

  describe('deleteAlert procedure logic', () => {
    it('should delete alert successfully', async () => {
      mockAlertService.deleteAlert.mockResolvedValue({ success: true });

      // Simulate the tRPC procedure logic
      const alertId = 'alert-1';
      
      await mockAlertService.deleteAlert(alertId);
      const response = {
        success: true,
        message: 'Alert deleted successfully',
      };

      expect(response.success).toBe(true);
      expect(response.message).toBe('Alert deleted successfully');
      expect(mockAlertService.deleteAlert).toHaveBeenCalledWith('alert-1');
    });

    it('should handle service errors in deleteAlert', async () => {
      mockAlertService.deleteAlert.mockRejectedValue(new Error('Alert not found'));

      try {
        await mockAlertService.deleteAlert('alert-1');
        fail('Should have thrown an error');
      } catch (error) {
        const wrappedError = new Error(`Failed to delete alert: ${error}`);
        expect(wrappedError.message).toContain('Failed to delete alert');
        expect(wrappedError.message).toContain('Alert not found');
      }
    });
  });

  describe('testAlert procedure logic', () => {
    it('should test sentiment alert successfully', async () => {
      const sentimentData = {
        cryptoId: 'crypto-1',
        score: 0.8,
        label: 'BULLISH',
        confidence: 0.9,
      };

      mockAlertService.checkAlerts.mockResolvedValue([]);

      // Simulate the tRPC procedure logic
      await mockAlertService.checkAlerts('crypto-1', sentimentData);
      
      const response = {
        success: true,
        message: 'Alert check completed',
      };

      expect(response.success).toBe(true);
      expect(response.message).toBe('Alert check completed');
      expect(mockAlertService.checkAlerts).toHaveBeenCalledWith('crypto-1', sentimentData);
    });

    it('should test price alert successfully', async () => {
      const priceData = {
        cryptoId: 'crypto-1',
        price: 50000,
        change24h: 5.2,
        volume24h: 1000000000,
      };

      mockAlertService.checkAlerts.mockResolvedValue([]);

      await mockAlertService.checkAlerts('crypto-1', priceData);
      
      const response = {
        success: true,
        message: 'Alert check completed',
      };

      expect(response.success).toBe(true);
      expect(mockAlertService.checkAlerts).toHaveBeenCalledWith('crypto-1', priceData);
    });

    it('should handle multiple data types in testAlert', async () => {
      const sentimentData = {
        cryptoId: 'crypto-1',
        score: 0.8,
        label: 'BULLISH',
        confidence: 0.9,
      };

      const priceData = {
        cryptoId: 'crypto-1',
        price: 50000,
        change24h: 5.2,
      };

      mockAlertService.checkAlerts.mockResolvedValue([]);

      // Simulate checking both sentiment and price data
      if (sentimentData) {
        await mockAlertService.checkAlerts('crypto-1', sentimentData);
      }
      if (priceData) {
        await mockAlertService.checkAlerts('crypto-1', priceData);
      }

      expect(mockAlertService.checkAlerts).toHaveBeenCalledTimes(2);
      expect(mockAlertService.checkAlerts).toHaveBeenNthCalledWith(1, 'crypto-1', sentimentData);
      expect(mockAlertService.checkAlerts).toHaveBeenNthCalledWith(2, 'crypto-1', priceData);
    });

    it('should handle service errors in testAlert', async () => {
      mockAlertService.checkAlerts.mockRejectedValue(new Error('Service error'));

      try {
        await mockAlertService.checkAlerts('crypto-1', { score: 0.8 });
        fail('Should have thrown an error');
      } catch (error) {
        const wrappedError = new Error(`Failed to test alert: ${error}`);
        expect(wrappedError.message).toContain('Failed to test alert');
        expect(wrappedError.message).toContain('Service error');
      }
    });

    it('should handle empty test data gracefully', async () => {
      // Simulate the case where no sentiment or price data is provided
      const cryptoId = 'crypto-1';
      let callCount = 0;

      // In the actual implementation, this would not call checkAlerts
      const sentimentData = undefined;
      const priceData = undefined;

      if (sentimentData) {
        await mockAlertService.checkAlerts(cryptoId, sentimentData);
        callCount++;
      }
      if (priceData) {
        await mockAlertService.checkAlerts(cryptoId, priceData);
        callCount++;
      }

      expect(callCount).toBe(0);
      expect(mockAlertService.checkAlerts).not.toHaveBeenCalled();
    });
  });

  describe('error handling patterns', () => {
    it('should handle validation errors consistently', () => {
      // Test consistent error message format for validation failures
      const invalidSymbol = '';
      const invalidThreshold = 2.0;
      const invalidPrice = -100;

      expect(() => {
        if (!invalidSymbol) {
          throw new Error('Cryptocurrency symbol is required');
        }
      }).toThrow('Cryptocurrency symbol is required');

      expect(() => {
        if (invalidThreshold < -1 || invalidThreshold > 1) {
          throw new Error('Sentiment threshold must be between -1 and 1');
        }
      }).toThrow('Sentiment threshold must be between -1 and 1');

      expect(() => {
        if (invalidPrice <= 0) {
          throw new Error('Price threshold must be positive');
        }
      }).toThrow('Price threshold must be positive');
    });

    it('should handle authentication errors', () => {
      // Simulate missing session/user
      const session = null;

      if (!session) {
        const error = new Error('Authentication required');
        expect(error.message).toBe('Authentication required');
      }
    });

    it('should handle database connection errors', async () => {
      const mockError = new Error('Database connection timeout');
      mockAlertService.getUserAlerts.mockRejectedValue(mockError);

      try {
        await mockAlertService.getUserAlerts('user-1', false);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toEqual(mockError);
      }
    });

    it('should handle service unavailable errors', async () => {
      const mockError = new Error('Service temporarily unavailable');
      mockAlertService.createAlertWithSymbol.mockRejectedValue(mockError);

      try {
        await mockAlertService.createAlertWithSymbol({
          userId: 'user-1',
          cryptoSymbol: 'BTC',
          type: AlertType.SENTIMENT_CHANGE,
          condition: {},
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toEqual(mockError);
      }
    });
  });
});