import { createMockContext } from '../../../utils/trpc-test-helpers';

// Mock the tRPC dependencies to avoid NextAuth circular dependency
jest.mock('@/server/api/trpc', () => ({
  createTRPCRouter: jest.fn().mockImplementation((routers) => ({
    createCaller: jest.fn().mockImplementation((ctx) => {
      const caller = {};
      Object.keys(routers).forEach(key => {
        if (typeof routers[key].query === 'function') {
          caller[key] = routers[key].query;
        } else if (typeof routers[key].mutation === 'function') {
          caller[key] = routers[key].mutation;
        }
      });
      return caller;
    })
  })),
  protectedProcedure: {
    input: jest.fn().mockReturnThis(),
    query: jest.fn().mockImplementation((handler) => ({ query: handler })),
    mutation: jest.fn().mockImplementation((handler) => ({ mutation: handler })),
  },
}));

// Import after mocking
import { botsRouter } from '@/server/api/routers/bots';

describe('Bots Router', () => {
  const mockSession = {
    user: { id: 'user123', email: 'test@example.com' },
    expires: '2025-01-01',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset console.log/error mocks
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getConnectionStatus', () => {
    it('should return bot connection status for authenticated user', async () => {
      const mockUser = {
        discordUserId: 'discord123',
        discordVerified: true,
        telegramUserId: null,
        telegramVerified: false,
        preferences: {
          discordNotifications: true,
          telegramNotifications: false,
        },
      };

      const ctx = createMockContext({ session: mockSession });
      ctx.prisma.user.findUnique.mockResolvedValue(mockUser as any);
      
      const caller = botsRouter.createCaller(ctx);

      const result = await caller.getConnectionStatus();

      expect(ctx.prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user123' },
        select: {
          discordUserId: true,
          discordVerified: true,
          telegramUserId: true,
          telegramVerified: true,
          preferences: {
            select: {
              discordNotifications: true,
              telegramNotifications: true,
            },
          },
        },
      });

      expect(result).toEqual({
        discord: {
          connected: true,
          userId: 'discord123',
          notificationsEnabled: true,
        },
        telegram: {
          connected: false,
          userId: null,
          notificationsEnabled: false,
        },
      });
    });

    it('should handle user with no preferences', async () => {
      const mockUser = {
        discordUserId: 'discord123',
        discordVerified: true,
        telegramUserId: 'telegram456',
        telegramVerified: true,
        preferences: null,
      };

      const ctx = createMockContext({ session: mockSession });
      ctx.prisma.user.findUnique.mockResolvedValue(mockUser as any);
      
      const caller = botsRouter.createCaller(ctx);

      const result = await caller.getConnectionStatus();

      expect(result).toEqual({
        discord: {
          connected: true,
          userId: 'discord123',
          notificationsEnabled: false,
        },
        telegram: {
          connected: true,
          userId: 'telegram456',
          notificationsEnabled: false,
        },
      });
    });

    it('should throw error if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const ctx = createMockContext({ session: mockSession });
      const caller = botsRouter.createCaller(ctx);

      await expect(caller.getConnectionStatus()).rejects.toThrow('User not found');
    });
  });

  describe('generateVerificationCode', () => {
    it('should generate verification code for Discord', async () => {
      const ctx = createMockContext({ session: mockSession });
      const caller = botsRouter.createCaller(ctx);

      const result = await caller.generateVerificationCode({ botType: 'discord' });

      expect(result.verificationCode).toMatch(/^[A-F0-9]{8}$/);
      expect(result.instructions).toContain('/verify');
      expect(result.instructions).toContain('Discord');
      expect(result.expiresIn).toBe(300);
    });

    it('should generate verification code for Telegram', async () => {
      const ctx = createMockContext({ session: mockSession });
      const caller = botsRouter.createCaller(ctx);

      const result = await caller.generateVerificationCode({ botType: 'telegram' });

      expect(result.verificationCode).toMatch(/^[A-F0-9]{8}$/);
      expect(result.instructions).toContain('/verify');
      expect(result.instructions).toContain('Telegram');
      expect(result.expiresIn).toBe(300);
    });

    it('should log verification code for development', async () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      const ctx = createMockContext({ session: mockSession });
      const caller = botsRouter.createCaller(ctx);

      const result = await caller.generateVerificationCode({ botType: 'discord' });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Generated verification code for user user123 (discord): ${result.verificationCode}`)
      );
    });
  });

  describe('verifyBotLinking', () => {
    it('should link Discord account successfully', async () => {
      mockPrisma.user.update.mockResolvedValue({} as any);
      mockPrisma.userPreferences.upsert.mockResolvedValue({} as any);

      const ctx = createMockContext({ session: mockSession });
      const caller = botsRouter.createCaller(ctx);

      const result = await caller.verifyBotLinking({
        verificationCode: 'ABC12345',
        botType: 'discord',
        botUserId: 'discord123',
        botUsername: 'testuser',
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user123' },
        data: {
          discordUserId: 'discord123',
          discordVerified: true,
        },
      });

      expect(mockPrisma.userPreferences.upsert).toHaveBeenCalledWith({
        where: { userId: 'user123' },
        create: {
          userId: 'user123',
          discordNotifications: true,
          telegramNotifications: false,
        },
        update: {
          discordNotifications: true,
          telegramNotifications: undefined,
        },
      });

      expect(result).toEqual({
        success: true,
        message: 'discord account successfully linked!',
      });
    });

    it('should link Telegram account successfully', async () => {
      mockPrisma.user.update.mockResolvedValue({} as any);
      mockPrisma.userPreferences.upsert.mockResolvedValue({} as any);

      const ctx = createMockContext({ session: mockSession });
      const caller = botsRouter.createCaller(ctx);

      const result = await caller.verifyBotLinking({
        verificationCode: 'XYZ98765',
        botType: 'telegram',
        botUserId: 'telegram456',
        botUsername: 'testuser_tg',
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user123' },
        data: {
          telegramUserId: 'telegram456',
          telegramVerified: true,
        },
      });

      expect(mockPrisma.userPreferences.upsert).toHaveBeenCalledWith({
        where: { userId: 'user123' },
        create: {
          userId: 'user123',
          discordNotifications: false,
          telegramNotifications: true,
        },
        update: {
          discordNotifications: undefined,
          telegramNotifications: true,
        },
      });

      expect(result).toEqual({
        success: true,
        message: 'telegram account successfully linked!',
      });
    });

    it('should log bot linking verification', async () => {
      const consoleSpy = jest.spyOn(console, 'log');
      mockPrisma.user.update.mockResolvedValue({} as any);
      mockPrisma.userPreferences.upsert.mockResolvedValue({} as any);

      const ctx = createMockContext({ session: mockSession });
      const caller = botsRouter.createCaller(ctx);

      await caller.verifyBotLinking({
        verificationCode: 'ABC12345',
        botType: 'discord',
        botUserId: 'discord123',
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Verifying bot linking for user user123: discord - discord123'
      );
    });
  });

  describe('unlinkBot', () => {
    it('should unlink Discord account successfully', async () => {
      mockPrisma.user.update.mockResolvedValue({} as any);
      mockPrisma.userPreferences.upsert.mockResolvedValue({} as any);

      const ctx = createMockContext({ session: mockSession });
      const caller = botsRouter.createCaller(ctx);

      const result = await caller.unlinkBot({ botType: 'discord' });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user123' },
        data: {
          discordUserId: null,
          discordVerified: false,
        },
      });

      expect(mockPrisma.userPreferences.upsert).toHaveBeenCalledWith({
        where: { userId: 'user123' },
        create: {
          userId: 'user123',
          discordNotifications: false,
          telegramNotifications: true,
        },
        update: {
          discordNotifications: false,
          telegramNotifications: undefined,
        },
      });

      expect(result).toEqual({
        success: true,
        message: 'discord account successfully unlinked!',
      });
    });

    it('should unlink Telegram account successfully', async () => {
      mockPrisma.user.update.mockResolvedValue({} as any);
      mockPrisma.userPreferences.upsert.mockResolvedValue({} as any);

      const ctx = createMockContext({ session: mockSession });
      const caller = botsRouter.createCaller(ctx);

      const result = await caller.unlinkBot({ botType: 'telegram' });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user123' },
        data: {
          telegramUserId: null,
          telegramVerified: false,
        },
      });

      expect(mockPrisma.userPreferences.upsert).toHaveBeenCalledWith({
        where: { userId: 'user123' },
        create: {
          userId: 'user123',
          discordNotifications: true,
          telegramNotifications: false,
        },
        update: {
          discordNotifications: undefined,
          telegramNotifications: false,
        },
      });

      expect(result).toEqual({
        success: true,
        message: 'telegram account successfully unlinked!',
      });
    });
  });

  describe('toggleNotifications', () => {
    it('should enable Discord notifications', async () => {
      mockPrisma.userPreferences.upsert.mockResolvedValue({} as any);

      const ctx = createMockContext({ session: mockSession });
      const caller = botsRouter.createCaller(ctx);

      const result = await caller.toggleNotifications({
        botType: 'discord',
        enabled: true,
      });

      expect(mockPrisma.userPreferences.upsert).toHaveBeenCalledWith({
        where: { userId: 'user123' },
        create: {
          userId: 'user123',
          discordNotifications: true,
          telegramNotifications: false,
        },
        update: {
          discordNotifications: true,
          telegramNotifications: undefined,
        },
      });

      expect(result).toEqual({
        success: true,
        message: 'discord notifications enabled!',
      });
    });

    it('should disable Telegram notifications', async () => {
      mockPrisma.userPreferences.upsert.mockResolvedValue({} as any);

      const ctx = createMockContext({ session: mockSession });
      const caller = botsRouter.createCaller(ctx);

      const result = await caller.toggleNotifications({
        botType: 'telegram',
        enabled: false,
      });

      expect(mockPrisma.userPreferences.upsert).toHaveBeenCalledWith({
        where: { userId: 'user123' },
        create: {
          userId: 'user123',
          discordNotifications: false,
          telegramNotifications: false,
        },
        update: {
          discordNotifications: undefined,
          telegramNotifications: false,
        },
      });

      expect(result).toEqual({
        success: true,
        message: 'telegram notifications disabled!',
      });
    });
  });

  describe('testBotConnection', () => {
    it('should test Discord bot connection successfully', async () => {
      const mockUser = {
        discordUserId: 'discord123',
        discordVerified: true,
        telegramUserId: null,
        telegramVerified: false,
        email: 'test@example.com',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

      const ctx = createMockContext({ session: mockSession });
      const caller = botsRouter.createCaller(ctx);

      const result = await caller.testBotConnection({ botType: 'discord' });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user123' },
        select: {
          discordUserId: true,
          discordVerified: true,
          telegramUserId: true,
          telegramVerified: true,
          email: true,
        },
      });

      expect(result).toEqual({
        success: true,
        message: 'Test message sent to your discord account!',
      });
    });

    it('should test Telegram bot connection successfully', async () => {
      const mockUser = {
        discordUserId: null,
        discordVerified: false,
        telegramUserId: 'telegram456',
        telegramVerified: true,
        email: 'test@example.com',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

      const ctx = createMockContext({ session: mockSession });
      const caller = botsRouter.createCaller(ctx);

      const result = await caller.testBotConnection({ botType: 'telegram' });

      expect(result).toEqual({
        success: true,
        message: 'Test message sent to your telegram account!',
      });
    });

    it('should throw error for disconnected Discord bot', async () => {
      const mockUser = {
        discordUserId: null,
        discordVerified: false,
        telegramUserId: null,
        telegramVerified: false,
        email: 'test@example.com',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

      const ctx = createMockContext({ session: mockSession });
      const caller = botsRouter.createCaller(ctx);

      await expect(
        caller.testBotConnection({ botType: 'discord' })
      ).rejects.toThrow('discord account is not connected');
    });

    it('should throw error for disconnected Telegram bot', async () => {
      const mockUser = {
        discordUserId: null,
        discordVerified: false,
        telegramUserId: null,
        telegramVerified: false,
        email: 'test@example.com',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

      const ctx = createMockContext({ session: mockSession });
      const caller = botsRouter.createCaller(ctx);

      await expect(
        caller.testBotConnection({ botType: 'telegram' })
      ).rejects.toThrow('telegram account is not connected');
    });

    it('should throw error if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const ctx = createMockContext({ session: mockSession });
      const caller = botsRouter.createCaller(ctx);

      await expect(
        caller.testBotConnection({ botType: 'discord' })
      ).rejects.toThrow('User not found');
    });

    it('should log test message for development', async () => {
      const consoleSpy = jest.spyOn(console, 'log');
      const mockUser = {
        discordUserId: 'discord123',
        discordVerified: true,
        telegramUserId: null,
        telegramVerified: false,
        email: 'test@example.com',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

      const ctx = createMockContext({ session: mockSession });
      const caller = botsRouter.createCaller(ctx);

      await caller.testBotConnection({ botType: 'discord' });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Test message sent to discord user: discord123'
      );
    });
  });
});