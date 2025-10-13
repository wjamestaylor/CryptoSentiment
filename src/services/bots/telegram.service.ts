import TelegramBot from 'node-telegram-bot-api';
import { prisma } from '@/lib/db/prisma';
import { Cryptocurrency, User } from '@prisma/client';
import { z } from 'zod';

// Telegram bot token will be read when needed

// Telegram-specific errors
export class TelegramError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TelegramError';
  }
}

// Telegram alert data schema (similar to Discord)
export const TelegramAlertSchema = z.object({
  type: z.enum(['PRICE_CHANGE', 'SENTIMENT_CHANGE', 'VOLUME_SPIKE']),
  cryptocurrency: z.string(),
  message: z.string(),
  price: z.number().optional(),
  change: z.number().optional(),
  volume: z.number().optional(),
  sentiment: z.string().optional(),
  timestamp: z.date().optional(),
});

export type TelegramAlert = z.infer<typeof TelegramAlertSchema>;

// Rate limiting configuration
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * Telegram Bot Service for CryptoSentiment
 * Handles user notifications, commands, and bot management
 */
export class TelegramService {
  private bot: TelegramBot | null = null;
  private isReady = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private rateLimitMap = new Map<string, RateLimitEntry>();
  private readonly rateLimit = {
    maxRequests: 30, // Telegram allows 30 messages per second per bot
    windowMs: 1000,
  };

  constructor() {
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    
    // Check for token availability first
    if (!telegramBotToken && process.env.NODE_ENV !== 'test') {
      console.warn('Telegram bot token not provided. Telegram notifications will be disabled.');
      return;
    }
    
    // Initialize if we have a token or we're in test environment
    if (telegramBotToken || process.env.NODE_ENV === 'test') {
      this.initializeBot();
    }
  }

  /**
   * Initialize Telegram bot with proper configuration and error handling
   */
  private async initializeBot(): Promise<void> {
    try {
      const token = process.env.TELEGRAM_BOT_TOKEN || 'test-token';
      this.bot = new TelegramBot(token, {
        polling: process.env.NODE_ENV !== 'test', // Only enable polling in non-test environments
      });

      this.setupEventHandlers();
      this.setupCommands();
      
      if (process.env.NODE_ENV !== 'test') {
        console.log('Telegram bot initialized successfully');
        this.isReady = true;
      } else {
        // In test environment, mark as ready immediately
        this.isReady = true;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Telegram bot initialization failed:', message);
      throw new TelegramError(`Bot initialization failed: ${message}`);
    }
  }

  /**
   * Set up Telegram bot event handlers
   */
  private setupEventHandlers(): void {
    if (!this.bot) return;

    this.bot.on('polling_error', (error) => {
      console.error('Telegram polling error:', error);
      this.isReady = false;
      this.handleReconnection();
    });

    this.bot.on('error', (error) => {
      console.error('Telegram bot error:', error);
      this.isReady = false;
    });

    // Handle text messages for commands
    this.bot.on('message', async (msg) => {
      if (msg.text?.startsWith('/')) {
        await this.handleCommand(msg);
      }
    });
  }

  /**
   * Set up bot commands
   */
  private setupCommands(): void {
    if (!this.bot) return;

    // Set bot commands for the Telegram UI
    const commands = [
      { command: 'start', description: 'Start the bot and get welcome message' },
      { command: 'register', description: 'Link your CryptoSentiment account' },
      { command: 'alerts', description: 'Check your alert status' },
      { command: 'help', description: 'Get help and available commands' },
    ];

    if (process.env.NODE_ENV !== 'test') {
      this.bot.setMyCommands(commands).catch((error) => {
        console.error('Failed to set Telegram commands:', error);
      });
    }
  }

  /**
   * Handle reconnection attempts
   */
  private async handleReconnection(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached. Bot will remain offline.');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`Attempting to reconnect Telegram bot (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`);
    
    setTimeout(async () => {
      try {
        await this.initializeBot();
        this.reconnectAttempts = 0;
        console.log('Telegram bot reconnected successfully');
      } catch (error) {
        console.error('Reconnection failed:', error);
        await this.handleReconnection();
      }
    }, delay);
  }

  /**
   * Check rate limiting for a user
   */
  private isRateLimited(userId: string): boolean {
    const now = Date.now();
    const userLimit = this.rateLimitMap.get(userId);

    if (!userLimit || now >= userLimit.resetTime) {
      this.rateLimitMap.set(userId, {
        count: 1,
        resetTime: now + this.rateLimit.windowMs,
      });
      return false;
    }

    if (userLimit.count >= this.rateLimit.maxRequests) {
      return true;
    }

    userLimit.count++;
    return false;
  }

  /**
   * Send alert notification to Telegram user
   */
  async sendAlert(userId: string, alert: TelegramAlert): Promise<boolean> {
    try {
      if (!this.isReady || !this.bot) {
        console.warn('Telegram bot not ready, skipping alert');
        return false;
      }

      // Validate alert data
      const validatedAlert = TelegramAlertSchema.parse(alert);

      // Get user's Telegram information
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          telegramUserId: true,
          telegramVerified: true,
        },
      });

      if (!user || !user.telegramUserId || !user.telegramVerified) {
        console.warn('User does not have verified Telegram account');
        return false;
      }

      // Check rate limiting
      if (this.isRateLimited(user.telegramUserId)) {
        console.warn('Rate limit exceeded for Telegram user:', user.telegramUserId);
        return false;
      }

      // Format message
      const message = this.formatAlertMessage(validatedAlert);

      // Send message
      await this.bot.sendMessage(user.telegramUserId, message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      });

      console.log(`Telegram alert sent to user ${userId}: ${validatedAlert.cryptocurrency} ${validatedAlert.type}`);
      return true;

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to send Telegram alert:', message);
      return false;
    }
  }

  /**
   * Format alert message for Telegram
   */
  private formatAlertMessage(alert: TelegramAlert): string {
    const emoji = this.getAlertEmoji(alert.type);
    const timestamp = alert.timestamp ? new Date(alert.timestamp).toLocaleString() : new Date().toLocaleString();

    let message = `${emoji} *${alert.cryptocurrency} Alert*\n\n`;
    message += `📝 ${alert.message}\n`;

    if (alert.price) {
      message += `💰 Price: $${alert.price.toLocaleString()}\n`;
    }

    if (alert.change) {
      const changeEmoji = alert.change > 0 ? '📈' : '📉';
      message += `${changeEmoji} Change: ${alert.change > 0 ? '+' : ''}${alert.change.toFixed(2)}%\n`;
    }

    if (alert.volume) {
      message += `📊 Volume: $${alert.volume.toLocaleString()}\n`;
    }

    if (alert.sentiment) {
      message += `🎭 Sentiment: ${alert.sentiment}\n`;
    }

    message += `\n⏰ Time: ${timestamp}`;
    message += `\n\n🔗 [View Details](https://cryptosentiment.com/dashboard)`;

    return message;
  }

  /**
   * Get emoji for alert type
   */
  private getAlertEmoji(type: string): string {
    switch (type) {
      case 'PRICE_CHANGE':
        return '💰';
      case 'SENTIMENT_CHANGE':
        return '🎭';
      case 'VOLUME_SPIKE':
        return '📊';
      default:
        return '⚡';
    }
  }

  /**
   * Send direct message to Telegram user
   */
  async sendDirectMessage(telegramUserId: string, message: string): Promise<boolean> {
    try {
      if (!this.isReady || !this.bot) {
        console.warn('Telegram bot not ready');
        return false;
      }

      await this.bot.sendMessage(telegramUserId, message, {
        parse_mode: 'Markdown',
      });

      return true;
    } catch (error) {
      console.error('Failed to send Telegram direct message:', error);
      return false;
    }
  }

  /**
   * Register Telegram user with CryptoSentiment account
   */
  async registerUser(telegramUserId: string, telegramUsername?: string): Promise<boolean> {
    try {
      // This is a placeholder - in reality, users would link accounts through the web interface
      // For now, we'll just store the Telegram user ID if a user exists
      const message = `🔗 *Link Your CryptoSentiment Account*\n\n` +
        `To receive crypto alerts on Telegram, you need to link your accounts.\n\n` +
        `*Steps:*\n` +
        `1. Visit [CryptoSentiment.com](https://cryptosentiment.com)\n` +
        `2. Go to Profile → Bot Settings\n` +
        `3. Click "Link Telegram Account"\n` +
        `4. Use this Telegram ID: \`${telegramUserId}\`\n\n` +
        `Once linked, you'll receive real-time crypto alerts here! 🚀`;

      const result = await this.sendDirectMessage(telegramUserId, message);
      return result;
    } catch (error) {
      console.error('Failed to register Telegram user:', error);
      return false;
    }
  }

  /**
   * Handle Telegram commands
   */
  private async handleCommand(msg: TelegramBot.Message): Promise<void> {
    try {
      if (!msg.text || !msg.from) return;

      const command = msg.text.split(' ')[0];
      const chatId = msg.chat.id;
      const userId = msg.from.id.toString();

      switch (command) {
        case '/start':
          await this.handleStartCommand(chatId);
          break;
        case '/register':
          await this.handleRegisterCommand(chatId, userId, msg.from.username);
          break;
        case '/alerts':
          await this.handleAlertsCommand(chatId, userId);
          break;
        case '/help':
          await this.handleHelpCommand(chatId);
          break;
        default:
          await this.handleUnknownCommand(chatId);
      }
    } catch (error) {
      console.error('Error handling Telegram command:', error);
    }
  }

  /**
   * Handle /start command
   */
  private async handleStartCommand(chatId: number): Promise<void> {
    const message = `🚀 *Welcome to CryptoSentiment Bot!*\n\n` +
      `I'll help you stay updated with real-time cryptocurrency alerts and sentiment analysis.\n\n` +
      `*Available Commands:*\n` +
      `/register - Link your CryptoSentiment account\n` +
      `/alerts - Check your alert status\n` +
      `/help - Get help and information\n\n` +
      `Get started by linking your account with /register`;

    await this.bot?.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  }

  /**
   * Handle /register command
   */
  private async handleRegisterCommand(chatId: number, userId: string, username?: string): Promise<void> {
    await this.registerUser(userId, username);
  }

  /**
   * Handle /alerts command
   */
  private async handleAlertsCommand(chatId: number, userId: string): Promise<void> {
    try {
      // Check if user is registered in our database
      const user = await prisma.user.findFirst({
        where: { telegramUserId: userId },
        include: {
          alerts: {
            where: { isActive: true },
            include: { crypto: true },
          },
        },
      });

      if (!user) {
        const message = `❌ *Account Not Linked*\n\n` +
          `You haven't linked your Telegram account yet.\n` +
          `Use /register to get started!`;
        
        await this.bot?.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        return;
      }

      const activeAlerts = user.alerts.length;
      const message = `📊 *Your Alert Status*\n\n` +
        `✅ Account: Linked\n` +
        `🔔 Active Alerts: ${activeAlerts}\n\n` +
        `Manage your alerts at [CryptoSentiment.com](https://cryptosentiment.com/alerts)`;

      await this.bot?.sendMessage(chatId, message, { 
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      });

    } catch (error) {
      console.error('Error handling alerts command:', error);
      await this.bot?.sendMessage(chatId, '❌ Sorry, there was an error checking your alerts.');
    }
  }

  /**
   * Handle /help command
   */
  private async handleHelpCommand(chatId: number): Promise<void> {
    const message = `📚 *CryptoSentiment Bot Help*\n\n` +
      `*Available Commands:*\n` +
      `/start - Welcome message and getting started\n` +
      `/register - Link your CryptoSentiment account\n` +
      `/alerts - Check your alert status and count\n` +
      `/help - Show this help message\n\n` +
      `*Features:*\n` +
      `• Real-time price alerts 💰\n` +
      `• Sentiment analysis updates 🎭\n` +
      `• Volume spike notifications 📊\n` +
      `• Customizable alert conditions ⚙️\n\n` +
      `*Need Support?*\n` +
      `Visit [CryptoSentiment.com](https://cryptosentiment.com/support) for help`;

    await this.bot?.sendMessage(chatId, message, { 
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    });
  }

  /**
   * Handle unknown commands
   */
  private async handleUnknownCommand(chatId: number): Promise<void> {
    const message = `❓ Unknown command. Use /help to see available commands.`;
    await this.bot?.sendMessage(chatId, message);
  }

  /**
   * Get bot status and health information
   */
  getStatus(): {
    isReady: boolean;
    reconnectAttempts: number;
    rateLimitedUsers: number;
  } {
    return {
      isReady: this.isReady,
      reconnectAttempts: this.reconnectAttempts,
      rateLimitedUsers: this.rateLimitMap.size,
    };
  }

  /**
   * Gracefully shutdown the bot
   */
  async shutdown(): Promise<void> {
    try {
      if (this.bot) {
        await this.bot.stopPolling();
        console.log('Telegram bot shutdown successfully');
      }
      this.isReady = false;
    } catch (error) {
      console.error('Error during Telegram bot shutdown:', error);
    }
  }
}

// Export singleton instance
export const telegramService = new TelegramService();