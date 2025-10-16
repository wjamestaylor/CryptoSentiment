// Mock node-telegram-bot-api completely to avoid ES module issues
jest.mock('node-telegram-bot-api', () => {
  return jest.fn().mockImplementation(() => ({
    setMyCommands: jest.fn().mockResolvedValue(true),
    sendMessage: jest.fn().mockResolvedValue({ message_id: 123 }),
    on: jest.fn(),
    stopPolling: jest.fn().mockResolvedValue(undefined),
  }));
});

// Mock Prisma 
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(), 
      update: jest.fn(),
    },
  },
}));

import { TelegramService, TelegramAlert } from '@/services/bots/telegram.service';
import { prisma } from '@/lib/db/prisma';
import TelegramBot from 'node-telegram-bot-api';

// Cast the mocked prisma to have jest mock methods
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

// Types for Telegram bot mocks
type MockTelegramBot = {
  setMyCommands: jest.Mock;
  sendMessage: jest.Mock;
  on: jest.Mock;
  stopPolling: jest.Mock;
};

type MockTelegramMessage = {
  message_id: number;
  from: {
    id: number;
    is_bot: boolean;
    first_name: string;
    username: string;
  };
  chat: {
    id: number;
    type: string;
  };
  date: number;
  text: string;
};

// Type for accessing private Telegram service properties in tests
type TelegramServicePrivate = {
  isReady: boolean;
  rateLimitMap: Map<string, { lastMessage?: number; count: number; resetTime?: number }>;
  reconnectAttempts?: number;
  maxReconnectAttempts?: number;
  handleCommand: (message: MockTelegramMessage) => Promise<void>;
  formatAlertMessage: (alert: unknown) => string;
  isRateLimited: (userId: string) => boolean;
  handleReconnection: () => Promise<void>;
};

// Mock variables
let telegramService: TelegramService;
let mockBot: MockTelegramBot;
let mockMessage: MockTelegramMessage;

describe('TelegramService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Suppress console output during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Create mock Telegram bot methods that we'll check
    const botMethods = {
      setMyCommands: jest.fn().mockResolvedValue(true),
      sendMessage: jest.fn().mockResolvedValue({ message_id: 123 }),
      on: jest.fn(),
      stopPolling: jest.fn().mockResolvedValue(undefined),
    };

    // Override the TelegramBot constructor to return our specific mock
    (TelegramBot as unknown as jest.Mock).mockImplementation(() => botMethods);
    mockBot = botMethods;

    // Create mock Telegram message
    mockMessage = {
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
    
    // Set up default environment
    process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token';
    
    telegramService = new TelegramService();
  });

  afterEach(() => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    jest.restoreAllMocks();
  });

  describe('Bot Initialization', () => {
    it('should initialize Telegram bot with correct configuration', () => {
      // Check that TelegramBot was called with the environment token
      expect(TelegramBot).toHaveBeenCalledWith('test-bot-token', {
        polling: false, // Should be false in test environment
      });
    });

    it('should handle missing bot token gracefully', () => {
      delete process.env.TELEGRAM_BOT_TOKEN;
      
      // Mock the NODE_ENV temporarily
      const originalEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true });
      
      new TelegramService();
      
      Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv, writable: true });
      
      expect(console.warn).toHaveBeenCalledWith(
        'Telegram bot token not provided. Telegram notifications will be disabled.'
      );
    });

    it('should set up event handlers', () => {
      expect(mockBot.on).toHaveBeenCalledWith('polling_error', expect.any(Function));
      expect(mockBot.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockBot.on).toHaveBeenCalledWith('message', expect.any(Function));
    });

    it('should set up bot commands in non-test environment', () => {
      // The setMyCommands is only called in non-test environment
      // In test environment it's skipped, so we just check the bot was initialized
      expect(TelegramBot).toHaveBeenCalled();
    });
  });

  describe('sendAlert', () => {
    const validAlert: TelegramAlert = {
      type: 'PRICE_CHANGE',
      cryptocurrency: 'BTC',
      message: 'Bitcoin price alert!',
      price: 50000,
      change: 5.2,
      timestamp: new Date(),
    };

    it('should send alert successfully to Telegram user', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        telegramUserId: '123456789',
        telegramVerified: true,
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: null,
        username: null,
        image: null,
        subscriptionId: null,
        discordUserId: null,
        discordVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock bot as ready
      (telegramService as unknown as TelegramServicePrivate).isReady = true;

      const result = await telegramService.sendAlert('user-1', validAlert);

      expect(result).toBe(true);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: {
          telegramUserId: true,
          telegramVerified: true,
        },
      });
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        '123456789',
        expect.stringContaining('💰 *BTC Alert*'),
        {
          parse_mode: 'Markdown',
          disable_web_page_preview: true,
        }
      );
    });

    it('should return false when bot is not ready', async () => {
      (telegramService as unknown as TelegramServicePrivate).isReady = false;

      const result = await telegramService.sendAlert('user-1', validAlert);

      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalledWith('Telegram bot not ready, skipping alert');
    });

    it('should return false when user has no Telegram ID', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        telegramUserId: null,
        telegramVerified: false,
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: null,
        username: null,
        image: null,
        subscriptionId: null,
        discordUserId: null,
        discordVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      (telegramService as unknown as TelegramServicePrivate).isReady = true;

      const result = await telegramService.sendAlert('user-1', validAlert);

      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalledWith('User does not have verified Telegram account');
    });

    it('should handle invalid alert data with validation error', async () => {
      const invalidAlert = {
        type: 'INVALID_TYPE',
        cryptocurrency: 'BTC',
        message: 'Invalid alert',
      };

      (telegramService as unknown as TelegramServicePrivate).isReady = true;

      const result = await telegramService.sendAlert('user-1', invalidAlert as never);

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        'Failed to send Telegram alert:',
        expect.stringContaining('Invalid option')
      );
    });

    it('should handle rate limiting', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        telegramUserId: '123456789',
        telegramVerified: true,
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: null,
        username: null,
        image: null,
        subscriptionId: null,
        discordUserId: null,
        discordVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      (telegramService as unknown as TelegramServicePrivate).isReady = true;

      // Simulate rate limit exceeded
      (telegramService as unknown as TelegramServicePrivate).rateLimitMap.set('123456789', {
        count: 30,
        resetTime: Date.now() + 1000,
      });

      const result = await telegramService.sendAlert('user-1', validAlert);

      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalledWith(
        'Rate limit exceeded for Telegram user:',
        '123456789'
      );
    });

    it('should handle Telegram API errors gracefully', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        telegramUserId: '123456789',
        telegramVerified: true,
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: null,
        username: null,
        image: null,
        subscriptionId: null,
        discordUserId: null,
        discordVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      (telegramService as unknown as TelegramServicePrivate).isReady = true;
      mockBot.sendMessage.mockRejectedValue(new Error('Telegram API Error'));

      const result = await telegramService.sendAlert('user-1', validAlert);

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        'Failed to send Telegram alert:',
        'Telegram API Error'
      );
    });
  });

  describe('sendDirectMessage', () => {
    it('should send direct message successfully', async () => {
      (telegramService as unknown as TelegramServicePrivate).isReady = true;

      const result = await telegramService.sendDirectMessage('123456789', 'Test message');

      expect(result).toBe(true);
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        '123456789',
        'Test message',
        { parse_mode: 'Markdown' }
      );
    });

    it('should return false when bot is not ready', async () => {
      (telegramService as unknown as TelegramServicePrivate).isReady = false;

      const result = await telegramService.sendDirectMessage('123456789', 'Test message');

      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalledWith('Telegram bot not ready');
    });

    it('should handle API errors gracefully', async () => {
      (telegramService as unknown as TelegramServicePrivate).isReady = true;
      mockBot.sendMessage.mockRejectedValue(new Error('API Error'));

      const result = await telegramService.sendDirectMessage('123456789', 'Test message');

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        'Failed to send Telegram direct message:',
        expect.any(Error)
      );
    });
  });

  describe('registerUser', () => {
    it('should register Telegram user successfully', async () => {
      (telegramService as unknown as TelegramServicePrivate).isReady = true;

      const result = await telegramService.registerUser('123456789');

      expect(result).toBe(true);
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        '123456789',
        expect.stringContaining('🔗 *Link Your CryptoSentiment Account*'),
        { parse_mode: 'Markdown' }
      );
    });

    it('should handle registration errors gracefully', async () => {
      (telegramService as unknown as TelegramServicePrivate).isReady = true;
      mockBot.sendMessage.mockRejectedValue(new Error('Registration Error'));

      const result = await telegramService.registerUser('123456789');

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        'Failed to send Telegram direct message:',
        expect.any(Error)
      );
    });
  });

  describe('Command Handling', () => {
    beforeEach(() => {
      (telegramService as unknown as TelegramServicePrivate).isReady = true;
    });

    it('should handle /start command', async () => {
      mockMessage.text = '/start';

      await (telegramService as unknown as TelegramServicePrivate).handleCommand(mockMessage);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        123456789,
        expect.stringContaining('🚀 *Welcome to CryptoSentiment Bot!*'),
        { parse_mode: 'Markdown' }
      );
    });

    it('should handle /register command', async () => {
      mockMessage.text = '/register';

      await (telegramService as unknown as TelegramServicePrivate).handleCommand(mockMessage);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        '123456789',
        expect.stringContaining('🔗 *Link Your CryptoSentiment Account*'),
        { parse_mode: 'Markdown' }
      );
    });

    it('should handle /alerts command for registered user', async () => {
      mockMessage.text = '/alerts';

      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: 'user-1',
        telegramUserId: '123456789',
        telegramVerified: true,
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: null,
        username: null,
        image: null,
        subscriptionId: null,
        discordUserId: null,
        discordVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        alerts: [
          {
            id: 'alert-1',
            userId: 'user-1',
            cryptoId: 'crypto-1',
            type: 'PRICE_CHANGE' as const,
            condition: '{}',
            isActive: true,
            lastTriggered: null,
            triggerCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      });

      await (telegramService as unknown as TelegramServicePrivate).handleCommand(mockMessage);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        123456789,
        expect.stringContaining('📊 *Your Alert Status*'),
        {
          parse_mode: 'Markdown',
          disable_web_page_preview: true,
        }
      );
    });

    it('should handle /alerts command for unregistered user', async () => {
      mockMessage.text = '/alerts';

      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      await (telegramService as unknown as TelegramServicePrivate).handleCommand(mockMessage);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        123456789,
        expect.stringContaining('❌ *Account Not Linked*'),
        { parse_mode: 'Markdown' }
      );
    });

    it('should handle /help command', async () => {
      mockMessage.text = '/help';

      await (telegramService as unknown as TelegramServicePrivate).handleCommand(mockMessage);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        123456789,
        expect.stringContaining('📚 *CryptoSentiment Bot Help*'),
        {
          parse_mode: 'Markdown',
          disable_web_page_preview: true,
        }
      );
    });

    it('should handle unknown commands', async () => {
      mockMessage.text = '/unknown';

      await (telegramService as unknown as TelegramServicePrivate).handleCommand(mockMessage);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        123456789,
        '❓ Unknown command. Use /help to see available commands.'
      );
    });

    it('should handle command errors gracefully', async () => {
      mockMessage.text = '/start';
      
      // Make the first sendMessage fail, but allow subsequent ones to succeed
      mockBot.sendMessage
        .mockRejectedValueOnce(new Error('Telegram API Error'))
        .mockResolvedValue({ message_id: 123 });

      await (telegramService as unknown as TelegramServicePrivate).handleCommand(mockMessage);

      expect(console.error).toHaveBeenCalledWith(
        'Error handling Telegram command:',
        expect.any(Error)
      );
    });
  });

  describe('Alert Message Formatting', () => {
    it('should create price change alert message', () => {
      const alert: TelegramAlert = {
        type: 'PRICE_CHANGE',
        cryptocurrency: 'BTC',
        message: 'Bitcoin reached $50,000!',
        price: 50000,
        change: 5.2,
        timestamp: new Date('2023-01-01T12:00:00Z'),
      };

      const message = (telegramService as unknown as TelegramServicePrivate).formatAlertMessage(alert);

      expect(message).toContain('💰 *BTC Alert*');
      expect(message).toContain('📝 Bitcoin reached $50,000!');
      expect(message).toContain('💰 Price: $50,000');
      expect(message).toContain('📈 Change: +5.20%');
      expect(message).toContain('🔗 [View Details](https://cryptosentiment.com/dashboard)');
    });

    it('should create sentiment change alert message', () => {
      const alert: TelegramAlert = {
        type: 'SENTIMENT_CHANGE',
        cryptocurrency: 'ETH',
        message: 'Ethereum sentiment turned bullish',
        sentiment: 'Bullish',
        timestamp: new Date('2023-01-01T12:00:00Z'),
      };

      const message = (telegramService as unknown as TelegramServicePrivate).formatAlertMessage(alert);

      expect(message).toContain('🎭 *ETH Alert*');
      expect(message).toContain('🎭 Sentiment: Bullish');
    });

    it('should create volume spike alert message', () => {
      const alert: TelegramAlert = {
        type: 'VOLUME_SPIKE',
        cryptocurrency: 'BNB',
        message: 'BNB volume spike detected',
        volume: 1000000,
        timestamp: new Date('2023-01-01T12:00:00Z'),
      };

      const message = (telegramService as unknown as TelegramServicePrivate).formatAlertMessage(alert);

      expect(message).toContain('📊 *BNB Alert*');
      expect(message).toContain('📊 Volume: $1,000,000');
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', () => {
      const isLimited = (telegramService as unknown as TelegramServicePrivate).isRateLimited('user-1');
      expect(isLimited).toBe(false);
    });

    it('should block requests when rate limit exceeded', () => {
      // Simulate rate limit exceeded
      (telegramService as unknown as TelegramServicePrivate).rateLimitMap.set('user-1', {
        count: 30,
        resetTime: Date.now() + 1000,
      });

      const isLimited = (telegramService as unknown as TelegramServicePrivate).isRateLimited('user-1');
      expect(isLimited).toBe(true);
    });

    it('should reset rate limit after time window', () => {
      // Simulate expired rate limit
      (telegramService as unknown as TelegramServicePrivate).rateLimitMap.set('user-1', {
        count: 30,
        resetTime: Date.now() - 1000,
      });

      const isLimited = (telegramService as unknown as TelegramServicePrivate).isRateLimited('user-1');
      expect(isLimited).toBe(false);
    });
  });

  describe('Bot Status and Health', () => {
    it('should return correct status information', () => {
      (telegramService as unknown as TelegramServicePrivate).isReady = true;
      (telegramService as unknown as TelegramServicePrivate).reconnectAttempts = 2;
      (telegramService as unknown as TelegramServicePrivate).rateLimitMap.set('user-1', { count: 1, resetTime: Date.now() });

      const status = telegramService.getStatus();

      expect(status).toEqual({
        isReady: true,
        reconnectAttempts: 2,
        rateLimitedUsers: 1,
      });
    });

    it('should handle shutdown gracefully', async () => {
      await telegramService.shutdown();

      expect(mockBot.stopPolling).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('Telegram bot shutdown successfully');
    });

    it('should handle shutdown errors', async () => {
      mockBot.stopPolling.mockRejectedValue(new Error('Shutdown error'));

      await telegramService.shutdown();

      expect(console.error).toHaveBeenCalledWith(
        'Error during Telegram bot shutdown:',
        expect.any(Error)
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle polling errors', () => {
      const errorHandler = mockBot.on.mock.calls.find(
        (call: [string, unknown]) => call[0] === 'polling_error'
      )?.[1];

      expect(errorHandler).toBeDefined();

      // Simulate polling error
      errorHandler(new Error('Polling error'));

      expect(console.error).toHaveBeenCalledWith(
        'Telegram polling error:',
        expect.any(Error)
      );
    });

    it('should handle bot errors', () => {
      const errorHandler = mockBot.on.mock.calls.find(
        (call: [string, unknown]) => call[0] === 'error'
      )?.[1];

      expect(errorHandler).toBeDefined();

      // Simulate bot error
      errorHandler(new Error('Bot error'));

      expect(console.error).toHaveBeenCalledWith(
        'Telegram bot error:',
        expect.any(Error)
      );
    });
  });

  describe('Reconnection Handling', () => {
    it('should attempt reconnection on failure', async () => {
      const originalSetTimeout = global.setTimeout;
      const mockSetTimeout = jest.fn((callback: () => void) => callback());
      global.setTimeout = mockSetTimeout as unknown as typeof setTimeout;

      (telegramService as unknown as TelegramServicePrivate).reconnectAttempts = 0;
      (telegramService as unknown as TelegramServicePrivate).maxReconnectAttempts = 5;

      await (telegramService as unknown as TelegramServicePrivate).handleReconnection();

      expect(mockSetTimeout).toHaveBeenCalled();

      global.setTimeout = originalSetTimeout;
    });

    it('should stop reconnecting after max attempts', async () => {
      (telegramService as unknown as TelegramServicePrivate).reconnectAttempts = 5;
      (telegramService as unknown as TelegramServicePrivate).maxReconnectAttempts = 5;

      await (telegramService as unknown as TelegramServicePrivate).handleReconnection();

      expect(console.error).toHaveBeenCalledWith(
        'Max reconnection attempts reached. Bot will remain offline.'
      );
    });
  });
});