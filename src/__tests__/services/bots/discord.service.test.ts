// Mock Discord.js completely to avoid ES module issues
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

import { DiscordService, DiscordAlert } from '@/services/bots/discord.service';
import { prisma } from '@/lib/db/prisma';
import { Client } from 'discord.js';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

// Store the original console methods
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

describe('DiscordService', () => {
  let discordService: DiscordService;
  let mockClient: any;
  let mockUser: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Suppress console output during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Create mock Discord user
    mockUser = {
      id: 'discord-user-123',
      send: jest.fn().mockResolvedValue(undefined),
    };

    // Create mock Discord client methods that we'll check
    const clientMethods = {
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
    };

    // Override the Client constructor to return our specific mock
    (Client as unknown as jest.Mock).mockImplementation(() => clientMethods);
    mockClient = clientMethods;
    
    // Set up default environment
    process.env.DISCORD_BOT_TOKEN = 'test-bot-token';
    
    discordService = new DiscordService();
  });

  afterEach(() => {
    // Restore console methods
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    console.log = originalConsoleLog;

    delete process.env.DISCORD_BOT_TOKEN;
  });

  describe('Bot Initialization', () => {
    it('should initialize Discord client with correct intents', () => {
      // The mocked Client constructor should be called during service initialization
      expect(Client).toHaveBeenCalledWith({
        intents: [1, 2, 4, 8], // Mocked GatewayIntentBits values
      });
    });

    it('should handle missing bot token gracefully', () => {
      delete process.env.DISCORD_BOT_TOKEN;
      
      // Mock the NODE_ENV temporarily
      const originalEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true });
      
      new DiscordService();
      
      Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv, writable: true });
      
      expect(console.warn).toHaveBeenCalledWith(
        'Discord bot token not provided. Discord notifications will be disabled.'
      );
    });

    it('should set up event handlers', () => {
      expect(mockClient.once).toHaveBeenCalledWith('ready', expect.any(Function));
      expect(mockClient.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockClient.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockClient.on).toHaveBeenCalledWith('interactionCreate', expect.any(Function));
    });
  });

  describe('sendAlert', () => {
    const validAlert: DiscordAlert = {
      type: 'PRICE_CHANGE',
      cryptocurrency: 'BTC',
      message: 'Bitcoin price alert!',
      threshold: 50000,
      currentValue: 52000,
      changePercentage: 4.0,
      timestamp: new Date(),
    };

    it('should send alert successfully to Discord user', async () => {
      // Mock database response
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'crypto-user-123',
        discordUserId: 'discord-user-123',
        email: 'test@example.com',
      } as any);

      // Mock Discord user fetch
      mockClient.users.fetch.mockResolvedValue(mockUser);

      // Simulate bot ready state
      (discordService as any).isReady = true;
      (discordService as any).client = mockClient;

      const result = await discordService.sendAlert('crypto-user-123', validAlert);

      expect(result).toBe(true);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'crypto-user-123' },
        select: { discordUserId: true, email: true },
      });
      expect(mockClient.users.fetch).toHaveBeenCalledWith('discord-user-123');
      expect(mockUser.send).toHaveBeenCalledWith({
        embeds: [expect.any(Object)],
      });
    });

    it('should return false when bot is not ready', async () => {
      (discordService as any).isReady = false;

      const result = await discordService.sendAlert('crypto-user-123', validAlert);

      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalledWith('Discord bot not ready. Alert not sent.');
    });

    it('should return false when user has no Discord ID', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'crypto-user-123',
        discordUserId: null,
        email: 'test@example.com',
      } as any);

      (discordService as any).isReady = true;
      (discordService as any).client = mockClient;

      const result = await discordService.sendAlert('crypto-user-123', validAlert);

      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalledWith('No Discord ID found for user crypto-user-123');
    });

    it('should handle invalid alert data with validation error', async () => {
      const invalidAlert = {
        type: 'INVALID_TYPE',
        cryptocurrency: 'BTC',
        message: 'Test alert',
      } as any;

      (discordService as any).isReady = true;
      (discordService as any).client = mockClient;

      const result = await discordService.sendAlert('crypto-user-123', invalidAlert);

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send Discord alert to user crypto-user-123:'),
        expect.any(String)
      );
    });

    it('should handle rate limiting', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'crypto-user-123',
        discordUserId: 'discord-user-123',
        email: 'test@example.com',
      } as any);

      (discordService as any).isReady = true;
      (discordService as any).client = mockClient;

      // Simulate rate limit exceeded by calling multiple times quickly
      const rateLimitMap = new Map();
      const now = Date.now();
      rateLimitMap.set('discord-user-123', Array(10).fill(now));
      (discordService as any).rateLimitMap = rateLimitMap;

      const result = await discordService.sendAlert('crypto-user-123', validAlert);

      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalledWith(
        'Rate limit exceeded for Discord user discord-user-123'
      );
    });

    it('should handle Discord API errors gracefully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'crypto-user-123',
        discordUserId: 'discord-user-123',
        email: 'test@example.com',
      } as any);

      mockClient.users.fetch.mockRejectedValue(new Error('Discord API Error'));

      (discordService as any).isReady = true;
      (discordService as any).client = mockClient;

      const result = await discordService.sendAlert('crypto-user-123', validAlert);

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send Discord alert to user crypto-user-123:'),
        expect.any(String)
      );
    });
  });

  describe('sendDirectMessage', () => {
    it('should send direct message successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'crypto-user-123',
        discordUserId: 'discord-user-123',
      } as any);

      mockClient.users.fetch.mockResolvedValue(mockUser);

      (discordService as any).isReady = true;
      (discordService as any).client = mockClient;

      const result = await discordService.sendDirectMessage('crypto-user-123', 'Test message');

      expect(result).toBe(true);
      expect(mockUser.send).toHaveBeenCalledWith('Test message');
    });

    it('should return false when bot is not ready', async () => {
      (discordService as any).isReady = false;

      const result = await discordService.sendDirectMessage('crypto-user-123', 'Test message');

      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalledWith('Discord bot not ready. Message not sent.');
    });

    it('should handle missing Discord user ID', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'crypto-user-123',
        discordUserId: null,
      } as any);

      (discordService as any).isReady = true;
      (discordService as any).client = mockClient;

      const result = await discordService.sendDirectMessage('crypto-user-123', 'Test message');

      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalledWith('No Discord ID found for user crypto-user-123');
    });
  });

  describe('registerUser', () => {
    it('should register Discord user successfully', async () => {
      mockPrisma.user.update.mockResolvedValue({
        id: 'crypto-user-123',
        discordUserId: 'discord-user-123',
        discordVerified: true,
      } as any);

      // Mock sendDirectMessage
      const sendDirectMessageSpy = jest.spyOn(discordService, 'sendDirectMessage');
      sendDirectMessageSpy.mockResolvedValue(true);

      const result = await discordService.registerUser('discord-user-123', 'crypto-user-123');

      expect(result).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'crypto-user-123' },
        data: {
          discordUserId: 'discord-user-123',
          discordVerified: true,
        },
      });
      expect(sendDirectMessageSpy).toHaveBeenCalledWith(
        'crypto-user-123',
        expect.stringContaining('Welcome to CryptoSentiment!')
      );

      sendDirectMessageSpy.mockRestore();
    });

    it('should handle database errors during registration', async () => {
      mockPrisma.user.update.mockRejectedValue(new Error('Database error'));

      const result = await discordService.registerUser('discord-user-123', 'crypto-user-123');

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to register Discord user discord-user-123:'),
        expect.any(String)
      );
    });

    it('should handle invalid user data', async () => {
      const result = await discordService.registerUser('', 'crypto-user-123');

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to register Discord user'),
        expect.any(String)
      );
    });
  });

  describe('Slash Commands', () => {
    let mockInteraction: any;

    beforeEach(() => {
      mockInteraction = {
        commandName: 'test',
        user: { id: 'discord-user-123' },
        reply: jest.fn().mockResolvedValue(undefined),
        replied: false,
      };
    });

    it('should handle register command', async () => {
      mockInteraction.commandName = 'register';

      await (discordService as any).handleSlashCommand(mockInteraction);

      expect(mockInteraction.reply).toHaveBeenCalledWith({
        embeds: [expect.any(Object)],
        ephemeral: true,
      });
    });

    it('should handle alerts command for registered user', async () => {
      mockInteraction.commandName = 'alerts';

      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'crypto-user-123',
        discordUserId: 'discord-user-123',
        alerts: [
          {
            id: 'alert-1',
            cryptoSymbol: 'BTC',
            type: 'PRICE_CHANGE',
            threshold: 50000,
          },
        ],
      } as any);

      await (discordService as any).handleSlashCommand(mockInteraction);

      expect(mockInteraction.reply).toHaveBeenCalledWith({
        embeds: [expect.any(Object)],
        ephemeral: true,
      });
    });

    it('should handle alerts command for unregistered user', async () => {
      mockInteraction.commandName = 'alerts';

      mockPrisma.user.findFirst.mockResolvedValue(null);

      await (discordService as any).handleSlashCommand(mockInteraction);

      expect(mockInteraction.reply).toHaveBeenCalledWith({
        content: '❌ Account not linked. Use `/register` to link your CryptoSentiment account.',
        ephemeral: true,
      });
    });

    it('should handle help command', async () => {
      mockInteraction.commandName = 'help';

      await (discordService as any).handleSlashCommand(mockInteraction);

      expect(mockInteraction.reply).toHaveBeenCalledWith({
        embeds: [expect.any(Object)],
        ephemeral: true,
      });
    });

    it('should handle unknown commands', async () => {
      mockInteraction.commandName = 'unknown';

      await (discordService as any).handleSlashCommand(mockInteraction);

      expect(mockInteraction.reply).toHaveBeenCalledWith({
        content: 'Unknown command!',
        ephemeral: true,
      });
    });

    it('should handle command errors gracefully', async () => {
      mockInteraction.commandName = 'register';
      
      // Make the first reply fail, but allow subsequent ones to succeed
      mockInteraction.reply
        .mockRejectedValueOnce(new Error('Discord API Error'))
        .mockResolvedValue(undefined);

      await (discordService as any).handleSlashCommand(mockInteraction);

      expect(console.error).toHaveBeenCalledWith(
        'Error handling slash command:',
        expect.any(Error)
      );
    });
  });

  describe('Alert Embed Creation', () => {
    it('should create price change alert embed', () => {
      const alert: DiscordAlert = {
        type: 'PRICE_CHANGE',
        cryptocurrency: 'BTC',
        message: 'Bitcoin price changed!',
        currentValue: 52000,
        changePercentage: 4.0,
        threshold: 50000,
        timestamp: new Date(),
      };

      const embed = (discordService as any).createAlertEmbed(alert);

      expect(embed.setTitle).toHaveBeenCalledWith('🚨 PRICE CHANGE Alert');
      expect(embed.setDescription).toHaveBeenCalledWith('Bitcoin price changed!');
      expect(embed.setColor).toHaveBeenCalledWith(0x00ff00); // Green for price change
      expect(embed.addFields).toHaveBeenCalledTimes(3); // Current value, change, threshold
    });

    it('should create sentiment change alert embed', () => {
      const alert: DiscordAlert = {
        type: 'SENTIMENT_CHANGE',
        cryptocurrency: 'ETH',
        message: 'Ethereum sentiment changed!',
        currentValue: 3000,
        changePercentage: -2.5,
        timestamp: new Date(),
      };

      const embed = (discordService as any).createAlertEmbed(alert);

      expect(embed.setColor).toHaveBeenCalledWith(0xffff00); // Yellow for sentiment
    });

    it('should create volume spike alert embed', () => {
      const alert: DiscordAlert = {
        type: 'VOLUME_SPIKE',
        cryptocurrency: 'ADA',
        message: 'Cardano volume spike detected!',
        timestamp: new Date(),
      };

      const embed = (discordService as any).createAlertEmbed(alert);

      expect(embed.setColor).toHaveBeenCalledWith(0xff0000); // Red for volume spike
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', () => {
      const userId = 'test-user';
      
      // First few requests should be allowed
      for (let i = 0; i < 5; i++) {
        const allowed = (discordService as any).checkRateLimit(userId);
        expect(allowed).toBe(true);
      }
    });

    it('should block requests when rate limit exceeded', () => {
      const userId = 'test-user';
      
      // Fill up the rate limit
      for (let i = 0; i < 10; i++) {
        (discordService as any).checkRateLimit(userId);
      }
      
      // Next request should be blocked
      const blocked = (discordService as any).checkRateLimit(userId);
      expect(blocked).toBe(false);
    });

    it('should reset rate limit after time window', () => {
      const userId = 'test-user';
      const now = Date.now();
      
      // Manually set old timestamps (older than 1 minute)
      const oldTimestamps = Array(10).fill(now - 70000); // 70 seconds ago
      (discordService as any).rateLimitMap.set(userId, oldTimestamps);
      
      // Should allow new request after time window
      const allowed = (discordService as any).checkRateLimit(userId);
      expect(allowed).toBe(true);
    });
  });

  describe('Bot Status and Health', () => {
    it('should return correct status information', () => {
      (discordService as any).isReady = true;
      (discordService as any).reconnectAttempts = 2;
      (discordService as any).client = mockClient;

      const status = discordService.getStatus();

      expect(status).toEqual({
        isReady: true,
        reconnectAttempts: 2,
        userCount: 0, // Empty cache
      });
    });

    it('should handle shutdown gracefully', async () => {
      (discordService as any).client = mockClient;

      await discordService.shutdown();

      expect(mockClient.destroy).toHaveBeenCalled();
      expect((discordService as any).isReady).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle client errors', () => {
      const errorHandler = mockClient.on.mock.calls.find(
        (call: any) => call[0] === 'error'
      )?.[1];

      expect(errorHandler).toBeDefined();

      // Simulate error
      errorHandler(new Error('Test error'));

      expect((discordService as any).isReady).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Discord client error:', expect.any(Error));
    });

    it('should handle disconnection', () => {
      const disconnectHandler = mockClient.on.mock.calls.find(
        (call: any) => call[0] === 'disconnect'
      )?.[1];

      expect(disconnectHandler).toBeDefined();

      // Simulate disconnect
      disconnectHandler();

      expect((discordService as any).isReady).toBe(false);
      expect(console.warn).toHaveBeenCalledWith('Discord bot disconnected');
    });
  });

  describe('Slash Command Registration', () => {
    it('should register slash commands successfully', async () => {
      (discordService as any).isReady = true;
      (discordService as any).client = mockClient;

      await discordService.registerSlashCommands();

      expect(mockClient.application.commands.set).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.any(Object), // register command
          expect.any(Object), // alerts command
          expect.any(Object), // help command
        ])
      );
    });

    it('should handle registration errors', async () => {
      (discordService as any).isReady = true;
      (discordService as any).client = mockClient;

      mockClient.application.commands.set.mockRejectedValue(new Error('Registration failed'));

      await expect(discordService.registerSlashCommands()).rejects.toThrow(
        'Failed to register slash commands'
      );
    });

    it('should throw error when bot not ready', async () => {
      (discordService as any).isReady = false;

      await expect(discordService.registerSlashCommands()).rejects.toThrow(
        'Discord bot not ready'
      );
    });
  });
});