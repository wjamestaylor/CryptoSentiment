import { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, CommandInteraction, ActivityType } from 'discord.js';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import type { Alert } from '@prisma/client';

// Environment variables
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

// Validation schemas
const DiscordAlertSchema = z.object({
  type: z.enum(['PRICE_CHANGE', 'SENTIMENT_CHANGE', 'VOLUME_SPIKE']),
  cryptocurrency: z.string(),
  message: z.string(),
  threshold: z.number().optional(),
  currentValue: z.number().optional(),
  changePercentage: z.number().optional(),
  timestamp: z.date().default(() => new Date()),
});

const DiscordUserSchema = z.object({
  discordUserId: z.string(),
  cryptoUserId: z.string(),
  username: z.string().optional(),
});

export type DiscordAlert = z.infer<typeof DiscordAlertSchema>;
export type DiscordUser = z.infer<typeof DiscordUserSchema>;

// Custom error class for Discord operations
class DiscordError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'DiscordError';
  }
}

/**
 * Discord Bot Service for CryptoSentiment
 * Handles bot initialization, message sending, and user interactions
 * Follows the established service pattern with comprehensive error handling
 */
export class DiscordService {
  private client: Client | null = null;
  private isReady = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private rateLimitMap = new Map<string, number[]>();

  constructor() {
    // Check for token availability first
    if (!DISCORD_BOT_TOKEN && process.env.NODE_ENV !== 'test') {
      console.warn('Discord bot token not provided. Discord notifications will be disabled.');
      return;
    }
    
    // Initialize if we have a token or we're in test environment
    if (DISCORD_BOT_TOKEN || process.env.NODE_ENV === 'test') {
      this.initializeBot();
    }
  }

  /**
   * Initialize Discord bot client with proper intents and error handling
   */
  private async initializeBot(): Promise<void> {
    try {
      this.client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.DirectMessages,
          GatewayIntentBits.MessageContent,
        ],
      });

      this.setupEventHandlers();
      
      // Only login if we have a real token (not in tests)
      if (DISCORD_BOT_TOKEN && process.env.NODE_ENV !== 'test') {
        await this.client.login(DISCORD_BOT_TOKEN);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Discord bot initialization failed:', message);
      throw new DiscordError(`Bot initialization failed: ${message}`);
    }
  }

  /**
   * Set up Discord client event handlers
   */
  private setupEventHandlers(): void {
    if (!this.client) return;

    this.client.once('ready', () => {
      console.log(`Discord bot logged in as ${this.client?.user?.tag}`);
      this.isReady = true;
      this.reconnectAttempts = 0;
      
      // Set bot presence
      this.client?.user?.setPresence({
        activities: [{ name: 'crypto markets 📈', type: ActivityType.Watching }],
        status: 'online',
      });
    });

    this.client.on('error', (error) => {
      console.error('Discord client error:', error);
      this.isReady = false;
    });

    this.client.on('disconnect', () => {
      console.warn('Discord bot disconnected');
      this.isReady = false;
      this.handleReconnection();
    });

    this.client.on('interactionCreate', async (interaction) => {
      if (interaction.isCommand()) {
        await this.handleSlashCommand(interaction);
      }
    });
  }

  /**
   * Handle Discord reconnection with exponential backoff
   */
  private async handleReconnection(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached. Discord bot disabled.');
      return;
    }

    const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
    this.reconnectAttempts++;

    console.log(`Attempting Discord reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    setTimeout(async () => {
      try {
        await this.initializeBot();
      } catch (error) {
        console.error('Discord reconnection failed:', error);
      }
    }, delay);
  }

  /**
   * Check rate limiting for user to prevent spam
   */
  private checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const userRequests = this.rateLimitMap.get(userId) || [];
    
    // Remove requests older than 1 minute
    const recentRequests = userRequests.filter(timestamp => now - timestamp < 60000);
    
    // Allow max 10 requests per minute per user
    if (recentRequests.length >= 10) {
      return false;
    }

    recentRequests.push(now);
    this.rateLimitMap.set(userId, recentRequests);
    return true;
  }

  /**
   * Send alert notification to Discord user
   */
  async sendAlert(userId: string, alertData: DiscordAlert): Promise<boolean> {
    try {
      if (!this.isReady || !this.client) {
        console.warn('Discord bot not ready. Alert not sent.');
        return false;
      }

      // Validate input
      const validatedAlert = DiscordAlertSchema.parse(alertData);

      // Get user's Discord ID from database
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { discordUserId: true, email: true },
      });

      if (!user?.discordUserId) {
        console.warn(`No Discord ID found for user ${userId}`);
        return false;
      }

      // Check rate limiting
      if (!this.checkRateLimit(user.discordUserId)) {
        console.warn(`Rate limit exceeded for Discord user ${user.discordUserId}`);
        return false;
      }

      // Find Discord user
      const discordUser = await this.client.users.fetch(user.discordUserId);
      if (!discordUser) {
        console.error(`Discord user not found: ${user.discordUserId}`);
        return false;
      }

      // Create rich embed for alert
      const embed = this.createAlertEmbed(validatedAlert);

      // Send direct message
      await discordUser.send({ embeds: [embed] });

      console.log(`Discord alert sent successfully to user ${userId}`);
      return true;

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to send Discord alert to user ${userId}:`, message);
      return false;
    }
  }

  /**
   * Create rich embed for crypto alerts
   */
  private createAlertEmbed(alert: DiscordAlert): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setTitle(`🚨 ${alert.type.replace('_', ' ')} Alert`)
      .setDescription(alert.message)
      .setColor(this.getAlertColor(alert.type))
      .setTimestamp(alert.timestamp)
      .setFooter({ text: 'CryptoSentiment Alert System' });

    // Add fields based on alert type
    if (alert.currentValue) {
      embed.addFields({
        name: 'Current Value',
        value: `$${alert.currentValue.toLocaleString()}`,
        inline: true,
      });
    }

    if (alert.changePercentage) {
      const emoji = alert.changePercentage > 0 ? '📈' : '📉';
      embed.addFields({
        name: 'Change',
        value: `${emoji} ${alert.changePercentage.toFixed(2)}%`,
        inline: true,
      });
    }

    if (alert.threshold) {
      embed.addFields({
        name: 'Threshold',
        value: `$${alert.threshold.toLocaleString()}`,
        inline: true,
      });
    }

    return embed;
  }

  /**
   * Get color for alert embed based on type
   */
  private getAlertColor(type: string): number {
    switch (type) {
      case 'PRICE_CHANGE':
        return 0x00ff00; // Green
      case 'SENTIMENT_CHANGE':
        return 0xffff00; // Yellow
      case 'VOLUME_SPIKE':
        return 0xff0000; // Red
      default:
        return 0x0099ff; // Blue
    }
  }

  /**
   * Send direct message to Discord user
   */
  async sendDirectMessage(userId: string, message: string): Promise<boolean> {
    try {
      if (!this.isReady || !this.client) {
        console.warn('Discord bot not ready. Message not sent.');
        return false;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { discordUserId: true },
      });

      if (!user?.discordUserId) {
        console.warn(`No Discord ID found for user ${userId}`);
        return false;
      }

      const discordUser = await this.client.users.fetch(user.discordUserId);
      if (!discordUser) {
        console.error(`Discord user not found: ${user.discordUserId}`);
        return false;
      }

      await discordUser.send(message);
      console.log(`Discord DM sent successfully to user ${userId}`);
      return true;

    } catch (error) {
      const message_error = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to send Discord DM to user ${userId}:`, message_error);
      return false;
    }
  }

  /**
   * Register Discord user with CryptoSentiment account
   */
  async registerUser(discordUserId: string, cryptoUserId: string): Promise<boolean> {
    try {
      const userData = DiscordUserSchema.parse({
        discordUserId,
        cryptoUserId,
      });

      // Update user record with Discord ID
      await prisma.user.update({
        where: { id: userData.cryptoUserId },
        data: {
          discordUserId: userData.discordUserId,
          discordVerified: true,
        },
      });

      // Send welcome message
      await this.sendDirectMessage(cryptoUserId, 
        '🎉 **Welcome to CryptoSentiment!**\n\n' +
        'Your Discord account has been successfully linked!\n' +
        'You will now receive crypto alerts directly in Discord.\n\n' +
        'Use `/alerts` to view your active alerts.\n' +
        'Use `/help` to see all available commands.'
      );

      console.log(`Discord user ${discordUserId} registered successfully with crypto user ${cryptoUserId}`);
      return true;

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to register Discord user ${discordUserId}:`, message);
      return false;
    }
  }

  /**
   * Handle slash commands
   */
  private async handleSlashCommand(interaction: CommandInteraction): Promise<void> {
    try {
      const { commandName } = interaction;

      switch (commandName) {
        case 'register':
          await this.handleRegisterCommand(interaction);
          break;
        case 'alerts':
          await this.handleAlertsCommand(interaction);
          break;
        case 'help':
          await this.handleHelpCommand(interaction);
          break;
        default:
          await interaction.reply({ content: 'Unknown command!', ephemeral: true });
      }
    } catch (error) {
      console.error('Error handling slash command:', error);
      if (!interaction.replied) {
        await interaction.reply({ 
          content: 'An error occurred while processing your command.', 
          ephemeral: true 
        });
      }
    }
  }

  /**
   * Handle /register command
   */
  private async handleRegisterCommand(interaction: CommandInteraction): Promise<void> {
    const embed = new EmbedBuilder()
      .setTitle('🔗 Link Your CryptoSentiment Account')
      .setDescription(
        'To receive crypto alerts on Discord, you need to link your accounts.\n\n' +
        '**Steps:**\n' +
        '1. Visit [CryptoSentiment.com](https://cryptosentiment.com)\n' +
        '2. Go to Profile → Bot Settings\n' +
        '3. Click "Link Discord Account"\n' +
        '4. Use this Discord ID: `' + interaction.user.id + '`\n\n' +
        'Once linked, you\'ll receive real-time crypto alerts here!'
      )
      .setColor(0x0099ff)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  /**
   * Handle /alerts command
   */
  private async handleAlertsCommand(interaction: CommandInteraction): Promise<void> {
    // Find user by Discord ID
    const user = await prisma.user.findFirst({
      where: { discordUserId: interaction.user.id },
      include: { alerts: true },
    });

    if (!user) {
      await interaction.reply({ 
        content: '❌ Account not linked. Use `/register` to link your CryptoSentiment account.', 
        ephemeral: true 
      });
      return;
    }

    if (user.alerts.length === 0) {
      await interaction.reply({ 
        content: '📭 You have no active alerts. Create some at [CryptoSentiment.com](https://cryptosentiment.com)', 
        ephemeral: true 
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('🚨 Your Active Alerts')
      .setDescription(`You have ${user.alerts.length} active alert(s)`)
      .setColor(0x00ff00);

    user.alerts.slice(0, 10).forEach((alert: Alert, index: number) => {
      embed.addFields({
        name: `Alert ${index + 1}`,
        value: `**${alert.cryptoId}** - ${alert.type}\nThreshold: ${alert.condition || 'N/A'}`,
        inline: true,
      });
    });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  /**
   * Handle /help command
   */
  private async handleHelpCommand(interaction: CommandInteraction): Promise<void> {
    const embed = new EmbedBuilder()
      .setTitle('🤖 CryptoSentiment Bot Commands')
      .setDescription('Available commands for the CryptoSentiment Discord bot')
      .addFields(
        { name: '/register', value: 'Link your Discord account to CryptoSentiment', inline: false },
        { name: '/alerts', value: 'View your active crypto alerts', inline: false },
        { name: '/help', value: 'Show this help message', inline: false }
      )
      .setColor(0x0099ff)
      .setFooter({ text: 'Visit cryptosentiment.com for more features!' });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  /**
   * Register slash commands with Discord
   */
  async registerSlashCommands(): Promise<void> {
    if (!this.client || !this.isReady) {
      throw new DiscordError('Discord bot not ready');
    }

    const commands = [
      new SlashCommandBuilder()
        .setName('register')
        .setDescription('Link your Discord account to CryptoSentiment'),
      
      new SlashCommandBuilder()
        .setName('alerts')
        .setDescription('View your active crypto alerts'),
      
      new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show available bot commands'),
    ];

    try {
      await this.client.application?.commands.set(commands);
      console.log('Discord slash commands registered successfully');
    } catch (error) {
      console.error('Failed to register slash commands:', error);
      throw new DiscordError('Failed to register slash commands');
    }
  }

  /**
   * Get bot status and health information
   */
  getStatus(): { isReady: boolean; reconnectAttempts: number; userCount?: number } {
    return {
      isReady: this.isReady,
      reconnectAttempts: this.reconnectAttempts,
      userCount: this.client?.users.cache.size,
    };
  }

  /**
   * Gracefully shutdown the bot
   */
  async shutdown(): Promise<void> {
    if (this.client) {
      console.log('Shutting down Discord bot...');
      this.client.destroy();
      this.isReady = false;
    }
  }
}

// Export singleton instance
export const discordService = new DiscordService();