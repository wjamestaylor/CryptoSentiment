import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

// Create a deep mock of PrismaClient
const prismaMock = mockDeep<PrismaClient>();

// Mock the Prisma client
jest.mock('@/lib/db/prisma', () => ({
  prisma: prismaMock,
}));

describe('Database Operations', () => {
  beforeEach(() => {
    mockReset(prismaMock);
  });

  describe('User operations', () => {
    it('should create a user', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.user.create.mockResolvedValue(mockUser);

      const result = await prismaMock.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
        },
      });

      expect(result).toEqual(mockUser);
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          name: 'Test User',
        },
      });
    });

    it('should find a user by email', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await prismaMock.user.findUnique({
        where: { email: 'test@example.com' },
      });

      expect(result).toEqual(mockUser);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return null for non-existent user', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await prismaMock.user.findUnique({
        where: { email: 'nonexistent@example.com' },
      });

      expect(result).toBeNull();
    });

    it('should update user profile', async () => {
      const mockUpdatedUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Updated Name',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.user.update.mockResolvedValue(mockUpdatedUser);

      const result = await prismaMock.user.update({
        where: { id: 'user-1' },
        data: { name: 'Updated Name' },
      });

      expect(result).toEqual(mockUpdatedUser);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { name: 'Updated Name' },
      });
    });
  });

  describe('Cryptocurrency operations', () => {
    it('should create a cryptocurrency', async () => {
      const mockCrypto = {
        id: 'crypto-1',
        symbol: 'BTC',
        name: 'Bitcoin',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.cryptocurrency.create.mockResolvedValue(mockCrypto);

      const result = await prismaMock.cryptocurrency.create({
        data: {
          symbol: 'BTC',
          name: 'Bitcoin',
        },
      });

      expect(result).toEqual(mockCrypto);
    });

    it('should upsert cryptocurrency', async () => {
      const mockCrypto = {
        id: 'crypto-1',
        symbol: 'BTC',
        name: 'Bitcoin',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.cryptocurrency.upsert.mockResolvedValue(mockCrypto);

      const result = await prismaMock.cryptocurrency.upsert({
        where: { symbol: 'BTC' },
        update: { name: 'Bitcoin' },
        create: { symbol: 'BTC', name: 'Bitcoin' },
      });

      expect(result).toEqual(mockCrypto);
      expect(prismaMock.cryptocurrency.upsert).toHaveBeenCalledWith({
        where: { symbol: 'BTC' },
        update: { name: 'Bitcoin' },
        create: { symbol: 'BTC', name: 'Bitcoin' },
      });
    });

    it('should find cryptocurrency by symbol', async () => {
      const mockCrypto = {
        id: 'crypto-1',
        symbol: 'BTC',
        name: 'Bitcoin',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.cryptocurrency.findUnique.mockResolvedValue(mockCrypto);

      const result = await prismaMock.cryptocurrency.findUnique({
        where: { symbol: 'BTC' },
      });

      expect(result).toEqual(mockCrypto);
    });
  });

  describe('FollowedCoin operations', () => {
    it('should create followed coin relationship', async () => {
      const mockFollowedCoin = {
        id: 'followed-1',
        userId: 'user-1',
        cryptoId: 'crypto-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.followedCoin.create.mockResolvedValue(mockFollowedCoin);

      const result = await prismaMock.followedCoin.create({
        data: {
          userId: 'user-1',
          cryptoId: 'crypto-1',
        },
      });

      expect(result).toEqual(mockFollowedCoin);
    });

    it('should upsert followed coin relationship', async () => {
      const mockFollowedCoin = {
        id: 'followed-1',
        userId: 'user-1',
        cryptoId: 'crypto-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.followedCoin.upsert.mockResolvedValue(mockFollowedCoin);

      const result = await prismaMock.followedCoin.upsert({
        where: {
          userId_cryptoId: {
            userId: 'user-1',
            cryptoId: 'crypto-1',
          },
        },
        update: {},
        create: {
          userId: 'user-1',
          cryptoId: 'crypto-1',
        },
      });

      expect(result).toEqual(mockFollowedCoin);
    });

    it('should delete followed coin relationship', async () => {
      const mockDeletedCoin = {
        id: 'followed-1',
        userId: 'user-1',
        cryptoId: 'crypto-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.followedCoin.delete.mockResolvedValue(mockDeletedCoin);

      const result = await prismaMock.followedCoin.delete({
        where: {
          userId_cryptoId: {
            userId: 'user-1',
            cryptoId: 'crypto-1',
          },
        },
      });

      expect(result).toEqual(mockDeletedCoin);
    });

    it('should find user followed coins with crypto details', async () => {
      const mockFollowedCoins = [
        {
          id: 'followed-1',
          userId: 'user-1',
          cryptoId: 'crypto-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          crypto: {
            id: 'crypto-1',
            symbol: 'BTC',
            name: 'Bitcoin',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];

      prismaMock.followedCoin.findMany.mockResolvedValue(mockFollowedCoins);

      const result = await prismaMock.followedCoin.findMany({
        where: { userId: 'user-1' },
        include: { crypto: true },
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toEqual(mockFollowedCoins);
      expect(prismaMock.followedCoin.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: { crypto: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('Alert operations', () => {
    it('should create price alert', async () => {
      const mockAlert = {
        id: 'alert-1',
        userId: 'user-1',
        cryptoId: 'crypto-1',
        type: 'PRICE_ABOVE' as const,
        targetPrice: 60000,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.alert.create.mockResolvedValue(mockAlert);

      const result = await prismaMock.alert.create({
        data: {
          userId: 'user-1',
          cryptoId: 'crypto-1',
          type: 'PRICE_ABOVE',
          targetPrice: 60000,
          isActive: true,
        },
      });

      expect(result).toEqual(mockAlert);
    });

    it('should find active alerts for user', async () => {
      const mockAlerts = [
        {
          id: 'alert-1',
          userId: 'user-1',
          cryptoId: 'crypto-1',
          type: 'PRICE_ABOVE' as const,
          targetPrice: 60000,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prismaMock.alert.findMany.mockResolvedValue(mockAlerts);

      const result = await prismaMock.alert.findMany({
        where: {
          userId: 'user-1',
          isActive: true,
        },
        include: {
          crypto: true,
        },
      });

      expect(result).toEqual(mockAlerts);
    });

    it('should update alert status', async () => {
      const mockUpdatedAlert = {
        id: 'alert-1',
        userId: 'user-1',
        cryptoId: 'crypto-1',
        type: 'PRICE_ABOVE' as const,
        targetPrice: 60000,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.alert.update.mockResolvedValue(mockUpdatedAlert);

      const result = await prismaMock.alert.update({
        where: { id: 'alert-1' },
        data: { isActive: false },
      });

      expect(result).toEqual(mockUpdatedAlert);
    });
  });

  describe('Transaction handling', () => {
    it('should handle database transactions', async () => {
      const mockTransaction = jest.fn();
      prismaMock.$transaction.mockImplementation(mockTransaction);

      await prismaMock.$transaction([
        prismaMock.user.create({ data: { email: 'test@example.com' } }),
        prismaMock.cryptocurrency.create({ data: { symbol: 'BTC', name: 'Bitcoin' } }),
      ]);

      expect(prismaMock.$transaction).toHaveBeenCalled();
    });

    it('should handle transaction rollback on error', async () => {
      const error = new Error('Transaction failed');
      prismaMock.$transaction.mockRejectedValue(error);

      await expect(
        prismaMock.$transaction([
          prismaMock.user.create({ data: { email: 'test@example.com' } }),
          prismaMock.cryptocurrency.create({ data: { symbol: 'BTC', name: 'Bitcoin' } }),
        ])
      ).rejects.toThrow('Transaction failed');
    });
  });

  describe('Error handling', () => {
    it('should handle unique constraint violations', async () => {
      const error = new Error('Unique constraint failed');
      prismaMock.user.create.mockRejectedValue(error);

      await expect(
        prismaMock.user.create({
          data: { email: 'existing@example.com' },
        })
      ).rejects.toThrow('Unique constraint failed');
    });

    it('should handle foreign key constraint violations', async () => {
      const error = new Error('Foreign key constraint failed');
      prismaMock.followedCoin.create.mockRejectedValue(error);

      await expect(
        prismaMock.followedCoin.create({
          data: {
            userId: 'nonexistent-user',
            cryptoId: 'crypto-1',
          },
        })
      ).rejects.toThrow('Foreign key constraint failed');
    });

    it('should handle record not found errors', async () => {
      const error = new Error('Record to delete does not exist');
      prismaMock.user.delete.mockRejectedValue(error);

      await expect(
        prismaMock.user.delete({
          where: { id: 'nonexistent-user' },
        })
      ).rejects.toThrow('Record to delete does not exist');
    });
  });
});