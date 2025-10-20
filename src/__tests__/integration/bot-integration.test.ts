/**
 * Bot Integration Testing Suite
 * Tests end-to-end bot functionality including:
 * - Alert delivery to Discord and Telegram
 * - User verification flow
 * - Cross-platform notification delivery
 * - Error handling and fallback mechanisms
 */

import { DiscordService } from '@/services/bots/discord.service';
import { TelegramService } from '@/services/bots/telegram.service';
import { NotificationService } from '@/services/notifications/notification.service';
import { AlertService } from '@/services/notifications/alerts.service';
import { AlertType, NotificationType } from '@prisma/client';

// Create mock functions for Prisma
const mockPrismaUser = {
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  update: jest.fn(),
};

const mockPrismaAlert = {
  findUnique: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
};

const mockPrismaCrypto = {
  upsert: jest.fn(),
};

const mockPrismaNotification = {
  create: jest.fn(),
};

// Mock external dependencies
jest.mock('discord.js', () => ({
  Client: jest.fn().mockImplementation(() => ({
    once: jest.fn(),
    on: jest.fn(),
    login: jest.fn().mockResolvedValue(undefined),
    destroy: jest.fn(),
    users: {
      fetch: jest.fn(),
      cache: new Map(),
    },
    user: {
      setPresence: jest.fn(),
      tag: 'TestBot#1234',
    },
    application: {
      commands: {
        set: jest.fn().mockResolvedValue([]),
      },
    },
  })),
  GatewayIntentBits: {
    Guilds: 1,
    GuildMessages: 2,
    DirectMessages: 4,
    MessageContent: 8,
  },
  EmbedBuilder: jest.fn().mockImplementation(() => ({
    setTitle: jest.fn().mockReturnThis(),
    setDescription: jest.fn().mockReturnThis(),
    setColor: jest.fn().mockReturnThis(),
    setTimestamp: jest.fn().mockReturnThis(),
    setFooter: jest.fn().mockReturnThis(),
    addFields: jest.fn().mockReturnThis(),
  })),
  SlashCommandBuilder: jest.fn().mockImplementation(() => ({
    setName: jest.fn().mockReturnThis(),
    setDescription: jest.fn().mockReturnThis(),
  })),
  ActivityType: {
    Watching: 3,
  },
}));

jest.mock('node-telegram-bot-api', () => {
  return jest.fn().mockImplementation(() => ({
    setMyCommands: jest.fn().mockResolvedValue(true),
    sendMessage: jest.fn().mockResolvedValue({ message_id: 123 }),
    on: jest.fn(),
    stopPolling: jest.fn().mockResolvedValue(undefined),
  }));
});

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: mockPrismaUser,
    alert: mockPrismaAlert,
    cryptocurrency: mockPrismaCrypto,
    notification: mockPrismaNotification,
  },
}));

jest.mock('@/services/email/resend.service');
jest.mock('@/services/feature-gating/feature-gate.service');

describe('Bot Integration Testing', () => {
  let discordService: DiscordService;
  let telegramService: TelegramService;
  let notificationService: NotificationService;
  let alertService: AlertService;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    discordUserId: 'discord-123',
    discordVerified: true,
    telegramUserId: 'telegram-123',
    telegramVerified: true,
    preferences: {
      emailNotifications: true,
      discordNotifications: true,
      telegramNotifications: true,
    },
  };

  const mockCrypto = {
    id: 'crypto-btc',
    symbol: 'BTC',
    name: 'Bitcoin',
    coinGeckoId: 'bitcoin',
  };

  const mockAlert = {
    id: 'alert-123',
    userId: 'user-123',
    cryptoId: 'crypto-btc',
    type: AlertType.PRICE_CHANGE,
    condition: JSON.stringify({
      priceThreshold: 50000,
      direction: 'above',
    }),
    isActive: true,
    triggerCount: 0,
    crypto: mockCrypto,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Suppress console output during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Set up environment
    process.env.DISCORD_BOT_TOKEN = 'test-discord-token';
    process.env.TELEGRAM_BOT_TOKEN = 'test-telegram-token';

    // Initialize services
    discordService = new DiscordService();
    telegramService = new TelegramService();
    notificationService = new NotificationService();
    alertService = new AlertService();

    // Mock services as ready
    (discordService as any).isReady = true;
    (telegramService as any).isReady = true;
  });

  afterEach(() => {
    delete process.env.DISCORD_BOT_TOKEN;
    delete process.env.TELEGRAM_BOT_TOKEN;
    jest.restoreAllMocks();
  });

  describe('Bot Service Initialization', () => {
    it('should initialize Discord service correctly', () => {
      expect(discordService).toBeDefined();
      expect((discordService as any).client).toBeDefined();
    });

    it('should initialize Telegram service correctly', () => {
      expect(telegramService).toBeDefined();
      expect((telegramService as any).bot).toBeDefined();
    });

    it('should handle missing environment tokens gracefully', () => {
      delete process.env.DISCORD_BOT_TOKEN;
      delete process.env.TELEGRAM_BOT_TOKEN;
      
      // Mock NODE_ENV to production
      const originalEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        configurable: true
      });
      
      new DiscordService();
      new TelegramService();
      
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        configurable: true
      });
      
      expect(console.warn).toHaveBeenCalledWith(
        'Discord bot token not provided. Discord notifications will be disabled.'
      );
      expect(console.warn).toHaveBeenCalledWith(
        'Telegram bot token not provided. Telegram notifications will be disabled.'
      );
    });
  });

  describe('Alert Delivery Testing', () => {
    it('should successfully send Discord alerts', async () => {
      // Mock database responses
      mockPrismaUser.findUnique.mockResolvedValue(mockUser);

      // Mock Discord user fetch and send
      const mockDiscordUser = {
        id: 'discord-123',
        send: jest.fn().mockResolvedValue(undefined),
      };
      (discordService as any).client = {
        users: {
          fetch: jest.fn().mockResolvedValue(mockDiscordUser),
        },
      };

      const result = await discordService.sendAlert(mockUser.id, {
        type: 'PRICE_CHANGE',
        cryptocurrency: 'BTC',
        message: 'Bitcoin has reached $50,000!',
        currentValue: 50000,
        threshold: 50000,
        timestamp: new Date(),
      });

      expect(result).toBe(true);
      expect(mockDiscordUser.send).toHaveBeenCalledWith({
        embeds: [expect.any(Object)],
      });
    });

    it('should successfully send Telegram alerts', async () => {
      // Mock database responses
      mockPrismaUser.findUnique.mockResolvedValue(mockUser);

      // Mock Telegram bot
      const mockTelegramBot = {
        sendMessage: jest.fn().mockResolvedValue({ message_id: 123 }),
      };
      (telegramService as any).bot = mockTelegramBot;

      const result = await telegramService.sendAlert(mockUser.id, {
        type: 'PRICE_CHANGE',
        cryptocurrency: 'BTC',
        message: 'Bitcoin has reached $50,000!',
        price: 50000,
        timestamp: new Date(),
      });

      expect(result).toBe(true);
      expect(mockTelegramBot.sendMessage).toHaveBeenCalledWith(
        mockUser.telegramUserId,
        expect.stringContaining('💰 *BTC Alert*'),
        {
          parse_mode: 'Markdown',
          disable_web_page_preview: true,
        }
      );
    });

    it('should handle bot service failures gracefully', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(mockUser);

      // Mock Discord API failure
      const discordError = new Error('Discord API Error');
      (discordService as any).client = {
        users: {
          fetch: jest.fn().mockRejectedValue(discordError),
        },
      };

      // Mock Telegram API failure
      const telegramBot = {
        sendMessage: jest.fn().mockRejectedValue(new Error('Telegram API Error')),
      };
      (telegramService as any).bot = telegramBot;

      // Test Discord failure handling
      const discordResult = await discordService.sendAlert(mockUser.id, {
        type: 'PRICE_CHANGE',
        cryptocurrency: 'BTC',
        message: 'Test alert',
        timestamp: new Date(),
      });

      expect(discordResult).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send Discord alert'),
        expect.any(String)
      );

      // Test Telegram failure handling
      const telegramResult = await telegramService.sendAlert(mockUser.id, {
        type: 'PRICE_CHANGE',
        cryptocurrency: 'BTC',
        message: 'Test alert',
        timestamp: new Date(),
      });

      expect(telegramResult).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        'Failed to send Telegram alert:',
        'Telegram API Error'
      );
    });

    it('should handle unverified bot accounts', async () => {
      // Mock user with unverified bot accounts
      const unverifiedUser = {
        ...mockUser,
        discordUserId: null,
        discordVerified: false,
        telegramUserId: null,
        telegramVerified: false,
      };

      mockPrismaUser.findUnique.mockResolvedValue(unverifiedUser);

      const discordResult = await discordService.sendAlert(unverifiedUser.id, {
        type: 'PRICE_CHANGE',
        cryptocurrency: 'BTC',
        message: 'Test alert',
        timestamp: new Date(),
      });

      const telegramResult = await telegramService.sendAlert(unverifiedUser.id, {
        type: 'PRICE_CHANGE',
        cryptocurrency: 'BTC',
        message: 'Test alert',
        timestamp: new Date(),
      });

      expect(discordResult).toBe(false);
      expect(telegramResult).toBe(false);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('No Discord ID found')
      );
      expect(console.warn).toHaveBeenCalledWith(
        'User does not have verified Telegram account'
      );
    });
  });

  describe('User Verification Flow', () => {
    it('should complete Discord user verification', async () => {
      const discordUserId = 'new-discord-user';
      const cryptoUserId = 'crypto-user-456';

      // Mock database operations
      mockPrismaUser.update.mockResolvedValue({
        id: cryptoUserId,
        discordUserId,
        discordVerified: true,
      });

      // Mock sendDirectMessage
      jest.spyOn(discordService, 'sendDirectMessage').mockResolvedValue(true);

      const result = await discordService.registerUser(discordUserId, cryptoUserId);

      expect(result).toBe(true);
      expect(mockPrismaUser.update).toHaveBeenCalledWith({
        where: { id: cryptoUserId },
        data: {
          discordUserId,
          discordVerified: true,
        },
      });
      expect(discordService.sendDirectMessage).toHaveBeenCalledWith(
        cryptoUserId,
        expect.stringContaining('Welcome to CryptoSentiment!')
      );
    });

    it('should complete Telegram user verification', async () => {
      const telegramUserId = 'new-telegram-user';

      // Mock Telegram bot
      const mockBot = {
        sendMessage: jest.fn().mockResolvedValue({ message_id: 123 }),
      };
      (telegramService as any).bot = mockBot;

      const result = await telegramService.registerUser(telegramUserId);

      expect(result).toBe(true);
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        telegramUserId,
        expect.stringContaining('🔗 *Link Your CryptoSentiment Account*'),
        { parse_mode: 'Markdown' }
      );
    });

    it('should handle verification failures', async () => {
      const discordUserId = 'failing-discord-user';
      const cryptoUserId = 'crypto-user-789';

      // Mock database failure
      mockPrismaUser.update.mockRejectedValue(new Error('Database connection failed'));

      const result = await discordService.registerUser(discordUserId, cryptoUserId);

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to register Discord user'),
        expect.any(String)
      );
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce Discord rate limiting', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(mockUser);

      // Set up rate limiting for Discord
      const discordRateLimit = new Map();
      discordRateLimit.set(mockUser.discordUserId, Array(10).fill(Date.now()));
      (discordService as any).rateLimitMap = discordRateLimit;

      const result = await discordService.sendAlert(mockUser.id, {
        type: 'PRICE_CHANGE',
        cryptocurrency: 'BTC',
        message: 'Test alert',
        timestamp: new Date(),
      });

      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalledWith(
        'Rate limit exceeded for Discord user discord-123'
      );
    });

    it('should enforce Telegram rate limiting', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(mockUser);

      // Set up rate limiting for Telegram
      const telegramRateLimit = new Map();
      telegramRateLimit.set(mockUser.telegramUserId, {
        count: 30,
        resetTime: Date.now() + 1000,
      });
      (telegramService as any).rateLimitMap = telegramRateLimit;

      const result = await telegramService.sendAlert(mockUser.id, {
        type: 'PRICE_CHANGE',
        cryptocurrency: 'BTC',
        message: 'Test alert',
        timestamp: new Date(),
      });

      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalledWith(
        'Rate limit exceeded for Telegram user:',
        'telegram-123'
      );
    });
  });

  describe('Bot Commands', () => {
    it('should handle Discord slash commands', async () => {
      const mockInteraction = {
        commandName: 'register',
        user: { id: 'discord-user-123' },
        reply: jest.fn().mockResolvedValue(undefined),
        replied: false,
      };

      await (discordService as any).handleSlashCommand(mockInteraction);

      expect(mockInteraction.reply).toHaveBeenCalledWith({
        embeds: [expect.any(Object)],
        ephemeral: true,
      });
    });

    it('should handle Telegram commands', async () => {
      const mockMessage = {
        message_id: 123,
        from: {
          id: 123456789,
          is_bot: false,
          first_name: 'Test',
          username: 'testuser',
        },
        chat: {
          id: 123456789,
          type: 'private',
        },
        date: Math.floor(Date.now() / 1000),
        text: '/start',
      };

      const mockBot = {
        sendMessage: jest.fn().mockResolvedValue({ message_id: 124 }),
      };
      (telegramService as any).bot = mockBot;

      await (telegramService as any).handleCommand(mockMessage);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        123456789,
        expect.stringContaining('🚀 *Welcome to CryptoSentiment Bot!*'),
        { parse_mode: 'Markdown' }
      );
    });
  });

  describe('Status and Health Monitoring', () => {
    it('should report Discord bot status', () => {
      (discordService as any).isReady = true;
      (discordService as any).reconnectAttempts = 2;
      (discordService as any).client = {
        users: { cache: new Map([['user1', {}], ['user2', {}]]) },
      };

      const status = discordService.getStatus();
      expect(status).toEqual({
        isReady: true,
        reconnectAttempts: 2,
        userCount: 2,
      });
    });

    it('should report Telegram bot status', () => {
      (telegramService as any).isReady = true;
      (telegramService as any).reconnectAttempts = 1;
      (telegramService as any).rateLimitMap = new Map([
        ['user1', { count: 5 }],
        ['user2', { count: 10 }],
      ]);

      const status = telegramService.getStatus();
      expect(status).toEqual({
        isReady: true,
        reconnectAttempts: 1,
        rateLimitedUsers: 2,
      });
    });

    it('should handle graceful shutdown', async () => {
      // Mock client methods
      const mockDiscordClient = { destroy: jest.fn() };
      const mockTelegramBot = { stopPolling: jest.fn().mockResolvedValue(undefined) };

      (discordService as any).client = mockDiscordClient;
      (telegramService as any).bot = mockTelegramBot;

      // Test shutdown
      await Promise.all([
        discordService.shutdown(),
        telegramService.shutdown(),
      ]);

      expect(mockDiscordClient.destroy).toHaveBeenCalled();
      expect(mockTelegramBot.stopPolling).toHaveBeenCalled();
      expect((discordService as any).isReady).toBe(false);
      expect((telegramService as any).isReady).toBe(false);
    });
  });

  describe('Integration with Notification Service', () => {
    it('should integrate with notification service for alert delivery', async () => {
      // Mock database responses
      mockPrismaUser.findUnique.mockResolvedValue(mockUser);
      mockPrismaAlert.findUnique.mockResolvedValue(mockAlert);
      mockPrismaNotification.create.mockResolvedValue({
        id: 'notification-123',
        userId: mockAlert.userId,
        type: NotificationType.ALERT_TRIGGERED,
        title: 'Bitcoin Price Alert',
        content: 'Bitcoin has reached $50,000!',
        alertId: mockAlert.id,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create alert data
      const alertData = {
        userId: mockUser.id,
        type: NotificationType.ALERT_TRIGGERED,
        title: 'Bitcoin Price Alert',
        content: 'Bitcoin has reached $50,000!',
        alertId: mockAlert.id,
        cryptoId: mockCrypto.id,
        alertType: AlertType.PRICE_CHANGE,
      };

      // Test notification service delivery
      const result = await notificationService.sendNotification(alertData);

      expect(result).toBe(true);
      expect(mockPrismaNotification.create).toHaveBeenCalledWith({
        data: {
          userId: alertData.userId,
          type: alertData.type,
          title: alertData.title,
          content: alertData.content,
          alertId: alertData.alertId,
          isRead: false,
        },
      });
    });
  });

  describe('Alert System Integration', () => {
    it('should create alerts through alert service', async () => {
      // Mock alert creation
      mockPrismaCrypto.upsert.mockResolvedValue(mockCrypto);
      mockPrismaAlert.create.mockResolvedValue(mockAlert);

      // Create alert through alert service
      const createdAlert = await alertService.createAlertWithSymbol({
        userId: mockUser.id,
        cryptoSymbol: 'BTC',
        cryptoName: 'Bitcoin',
        type: AlertType.PRICE_CHANGE,
        condition: {
          priceThreshold: 50000,
          direction: 'above',
        },
      });

      expect(createdAlert).toBeDefined();
      expect(mockPrismaCrypto.upsert).toHaveBeenCalled();
      expect(mockPrismaAlert.create).toHaveBeenCalled();
    });

    it('should handle different alert types', async () => {
      const alertTypes = [
        {
          type: AlertType.PRICE_CHANGE,
          condition: { priceThreshold: 50000, direction: 'above' as const },
        },
        {
          type: AlertType.SENTIMENT_CHANGE,
          condition: { sentimentThreshold: 0.8, direction: 'bullish' as const },
        },
        {
          type: AlertType.VOLUME_SPIKE,
          condition: { volumeThreshold: 1000000000 },
        },
      ];

      for (const alertType of alertTypes) {
        mockPrismaCrypto.upsert.mockResolvedValue(mockCrypto);
        mockPrismaAlert.create.mockResolvedValue({
          ...mockAlert,
          type: alertType.type,
          condition: JSON.stringify(alertType.condition),
        });

        const createdAlert = await alertService.createAlertWithSymbol({
          userId: mockUser.id,
          cryptoSymbol: 'BTC',
          cryptoName: 'Bitcoin',
          type: alertType.type,
          condition: alertType.condition,
        });

        expect(createdAlert).toBeDefined();
        expect(createdAlert.type).toBe(alertType.type);
      }
    });
  });
});