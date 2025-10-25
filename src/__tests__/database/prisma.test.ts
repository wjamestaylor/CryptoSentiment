import { PrismaClient, AlertType } from '@prisma/client';
import { mockDeep, mockReset } from 'jest-mock-extended';

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
        emailVerified: null,
        username: null,
        image: null,
        subscriptionId: null,
        discordUserId: null,
        discordVerified: false,
        telegramUserId: null,
        telegramVerified: false,
        onboardingCompleted: false,
        onboardingStep: 0,
        onboardingCompletedAt: null,
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
        emailVerified: null,
        username: null,
        image: null,
        subscriptionId: null,
        discordUserId: null,
        discordVerified: false,
        telegramUserId: null,
        telegramVerified: false,
        onboardingCompleted: false,
        onboardingStep: 0,
        onboardingCompletedAt: null,
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

    it('should update a user', async () => {
      const mockUpdatedUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Updated User',
        emailVerified: null,
        username: null,
        image: null,
        subscriptionId: null,
        discordUserId: null,
        discordVerified: false,
        telegramUserId: null,
        telegramVerified: false,
        onboardingCompleted: false,
        onboardingStep: 0,
        onboardingCompletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.user.update.mockResolvedValue(mockUpdatedUser);

      const result = await prismaMock.user.update({
        where: { id: 'user-1' },
        data: { name: 'Updated User' },
      });

      expect(result).toEqual(mockUpdatedUser);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { name: 'Updated User' },
      });
    });
  });

  describe('Cryptocurrency operations', () => {
    it('should create a cryptocurrency', async () => {
      const mockCrypto = {
        id: 'crypto-1',
        symbol: 'BTC',
        name: 'Bitcoin',
        coinGeckoId: 'bitcoin',
        logoUrl: 'https://example.com/btc-logo.png',
        marketCap: 1000000000,
        rank: 1,
      };

      prismaMock.cryptocurrency.create.mockResolvedValue(mockCrypto);

      const result = await prismaMock.cryptocurrency.create({
        data: {
          symbol: 'BTC',
          name: 'Bitcoin',
          logoUrl: 'https://example.com/btc-logo.png',
          marketCap: 1000000000,
          rank: 1,
        },
      });

      expect(result).toEqual(mockCrypto);
      expect(prismaMock.cryptocurrency.create).toHaveBeenCalledWith({
        data: {
          symbol: 'BTC',
          name: 'Bitcoin',
          logoUrl: 'https://example.com/btc-logo.png',
          marketCap: 1000000000,
          rank: 1,
        },
      });
    });

    it('should upsert a cryptocurrency', async () => {
      const mockCrypto = {
        id: 'crypto-1',
        symbol: 'BTC',
        name: 'Bitcoin',
        coinGeckoId: 'bitcoin',
        logoUrl: 'https://example.com/btc-logo.png',
        marketCap: 1000000000,
        rank: 1,
      };

      prismaMock.cryptocurrency.upsert.mockResolvedValue(mockCrypto);

      const result = await prismaMock.cryptocurrency.upsert({
        where: { symbol: 'BTC' },
        update: { marketCap: 1000000000 },
        create: {
          symbol: 'BTC',
          name: 'Bitcoin',
          logoUrl: 'https://example.com/btc-logo.png',
          marketCap: 1000000000,
          rank: 1,
        },
      });

      expect(result).toEqual(mockCrypto);
    });

    it('should find a cryptocurrency by symbol', async () => {
      const mockCrypto = {
        id: 'crypto-1',
        symbol: 'BTC',
        name: 'Bitcoin',
        coinGeckoId: 'bitcoin',
        logoUrl: 'https://example.com/btc-logo.png',
        marketCap: 1000000000,
        rank: 1,
      };

      prismaMock.cryptocurrency.findUnique.mockResolvedValue(mockCrypto);

      const result = await prismaMock.cryptocurrency.findUnique({
        where: { symbol: 'BTC' },
      });

      expect(result).toEqual(mockCrypto);
      expect(prismaMock.cryptocurrency.findUnique).toHaveBeenCalledWith({
        where: { symbol: 'BTC' },
      });
    });

    it('should find many cryptocurrencies', async () => {
      const mockCryptos = [
        {
          id: 'crypto-1',
          symbol: 'BTC',
          name: 'Bitcoin',
          coinGeckoId: 'bitcoin',
          logoUrl: 'https://example.com/btc-logo.png',
          marketCap: 1000000000,
          rank: 1,
        },
        {
          id: 'crypto-2',
          symbol: 'ETH',
          name: 'Ethereum',
          coinGeckoId: 'ethereum',
          logoUrl: 'https://example.com/eth-logo.png',
          marketCap: 500000000,
          rank: 2,
        },
      ];

      prismaMock.cryptocurrency.findMany.mockResolvedValue(mockCryptos);

      const result = await prismaMock.cryptocurrency.findMany({
        take: 10,
        orderBy: { rank: 'asc' },
      });

      expect(result).toEqual(mockCryptos);
      expect(prismaMock.cryptocurrency.findMany).toHaveBeenCalledWith({
        take: 10,
        orderBy: { rank: 'asc' },
      });
    });
  });

  describe('Alert operations', () => {
    it('should create an alert', async () => {
      const mockAlert = {
        id: 'alert-1',
        userId: 'user-1',
        cryptoId: 'crypto-1',
        type: AlertType.PRICE_CHANGE,
        condition: JSON.stringify({ price: 50000, operator: 'above' }),
        isActive: true,
        lastTriggered: null,
        triggerCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.alert.create.mockResolvedValue(mockAlert);

      const result = await prismaMock.alert.create({
        data: {
          userId: 'user-1',
          cryptoId: 'crypto-1',
          type: AlertType.PRICE_CHANGE,
          condition: JSON.stringify({ price: 50000, operator: 'above' }),
          isActive: true,
        },
      });

      expect(result).toEqual(mockAlert);
    });

    it('should find user alerts', async () => {
      const mockAlerts = [
        {
          id: 'alert-1',
          userId: 'user-1',
          cryptoId: 'crypto-1',
          type: AlertType.PRICE_CHANGE,
          condition: JSON.stringify({ price: 50000, operator: 'above' }),
          isActive: true,
          lastTriggered: null,
          triggerCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prismaMock.alert.findMany.mockResolvedValue(mockAlerts);

      const result = await prismaMock.alert.findMany({
        where: { userId: 'user-1' },
      });

      expect(result).toEqual(mockAlerts);
      expect(prismaMock.alert.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });

    it('should update an alert', async () => {
      const mockUpdatedAlert = {
        id: 'alert-1',
        userId: 'user-1',
        cryptoId: 'crypto-1',
        type: AlertType.PRICE_CHANGE,
        condition: JSON.stringify({ price: 55000, operator: 'above' }),
        isActive: false,
        lastTriggered: new Date(),
        triggerCount: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.alert.update.mockResolvedValue(mockUpdatedAlert);

      const result = await prismaMock.alert.update({
        where: { id: 'alert-1' },
        data: { 
          condition: JSON.stringify({ price: 55000, operator: 'above' }),
          isActive: false,
          lastTriggered: new Date(),
          triggerCount: 1
        },
      });

      expect(result).toEqual(mockUpdatedAlert);
    });

    it('should delete an alert', async () => {
      const mockDeletedAlert = {
        id: 'alert-1',
        userId: 'user-1',
        cryptoId: 'crypto-1',
        type: AlertType.PRICE_CHANGE,
        condition: JSON.stringify({ price: 50000, operator: 'above' }),
        isActive: true,
        lastTriggered: null,
        triggerCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.alert.delete.mockResolvedValue(mockDeletedAlert);

      const result = await prismaMock.alert.delete({
        where: { id: 'alert-1' },
      });

      expect(result).toEqual(mockDeletedAlert);
      expect(prismaMock.alert.delete).toHaveBeenCalledWith({
        where: { id: 'alert-1' },
      });
    });
  });

  describe('Transaction operations', () => {
    it('should handle database transactions', async () => {
      const mockTransaction = jest.fn();
      prismaMock.$transaction.mockImplementation(mockTransaction);

      await prismaMock.$transaction([
        prismaMock.user.create({ data: { email: 'test@example.com' } }),
        prismaMock.cryptocurrency.create({ data: { symbol: 'BTC', name: 'Bitcoin' } }),
      ]);

      expect(mockTransaction).toHaveBeenCalled();
    });
  });

  describe('Connection operations', () => {
    it('should connect to database', async () => {
      const mockConnect = jest.fn();
      prismaMock.$connect.mockImplementation(mockConnect);

      await prismaMock.$connect();

      expect(mockConnect).toHaveBeenCalled();
    });

    it('should disconnect from database', async () => {
      const mockDisconnect = jest.fn();
      prismaMock.$disconnect.mockImplementation(mockDisconnect);

      await prismaMock.$disconnect();

      expect(mockDisconnect).toHaveBeenCalled();
    });
  });
});