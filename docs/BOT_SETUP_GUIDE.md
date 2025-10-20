# Bot Integration Setup Guide

This guide will help you set up Discord and Telegram bot integration for CryptoSentiment alerts.

## 🤖 Discord Bot Setup

### 1. Create Discord Application
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Name it "CryptoSentiment" and click "Create"

### 2. Create Bot User
1. Go to the "Bot" section in your application
2. Click "Add Bot"
3. Copy the bot token and save it securely
4. Enable the following bot permissions:
   - Send Messages
   - Use Slash Commands
   - Read Message History
   - Add Reactions

### 3. Enable Developer Mode in Discord
1. Open Discord → User Settings (gear icon)
2. Go to Advanced → Enable Developer Mode
3. This allows you to copy user IDs for testing

### 4. Get Your Discord User ID
1. Right-click on your username in Discord
2. Click "Copy User ID"
3. Save this ID for testing

### 5. Invite Bot to Server (Optional for DMs)
1. Go to OAuth2 → URL Generator in Developer Portal
2. Select "bot" and "applications.commands" scopes
3. Select required permissions
4. Use generated URL to invite bot to a test server

## 📱 Telegram Bot Setup

### 1. Create Telegram Bot
1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` command
3. Follow prompts to name your bot (e.g., "CryptoSentiment Bot")
4. Choose a username ending in "bot" (e.g., "cryptosentiment_alerts_bot")
5. Copy the bot token provided by BotFather

### 2. Get Your Telegram User ID
1. Search for [@userinfobot](https://t.me/userinfobot) in Telegram
2. Send `/start` command
3. Copy your user ID from the response

### 3. Configure Bot Settings
1. Send `/setdescription` to BotFather
2. Set description: "Get real-time cryptocurrency alerts and sentiment analysis"
3. Send `/setabouttext` to BotFather  
4. Set about text: "CryptoSentiment notification bot for crypto alerts"

## 🔧 Environment Configuration

Add these environment variables to your `.env.local` file:

```bash
# Discord Bot Configuration
DISCORD_BOT_TOKEN=your_discord_bot_token_here

# Telegram Bot Configuration  
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
```

**⚠️ Important:** Never commit bot tokens to version control. Keep them secure!

## 🧪 Testing Your Setup

### 1. Run Bot Status Check
```bash
npm run test:bots:status
```

### 2. Test Alert Delivery
```bash
# Test Discord alerts
npm run test:bots:alert your-user-id discord

# Test Telegram alerts  
npm run test:bots:alert your-user-id telegram

# Test both platforms
npm run test:bots:alert your-user-id both
```

### 3. Test User Verification
```bash
npm run test:bots:verify your-discord-id your-telegram-id
```

### 4. Run Comprehensive Test
```bash
npm run test:bots:comprehensive your-user-id your-discord-id your-telegram-id
```

## 📋 Bot Commands

### Discord Commands
- `/register` - Link your CryptoSentiment account
- `/alerts` - View your active alerts
- `/help` - Show available commands

### Telegram Commands
- `/start` - Welcome message and getting started
- `/register` - Link your CryptoSentiment account  
- `/alerts` - Check your alert status
- `/help` - Show available commands

## 🔗 User Account Linking

### Web Interface Method (Recommended)
1. Log into CryptoSentiment web app
2. Go to Profile → Bot Settings
3. Click "Link Discord Account" or "Link Telegram Account"
4. Follow verification instructions

### Manual Method
1. Use bot commands (`/register`) to get linking instructions
2. Copy your Discord/Telegram user ID from the bot response
3. Enter it in the web interface bot settings

## 📊 Monitoring & Troubleshooting

### Check Bot Status
```bash
npm run test:bots:status
```

### Common Issues

#### Discord Bot Not Responding
- ✅ Check bot token is correct
- ✅ Ensure bot has required permissions
- ✅ Verify bot is online in Discord
- ✅ Check Discord API status

#### Telegram Bot Not Responding  
- ✅ Check bot token is correct
- ✅ Ensure you've started the bot (`/start`)
- ✅ Verify bot username is correct
- ✅ Check Telegram API status

#### Rate Limiting
- Discord: Max 10 messages per minute per user
- Telegram: Max 30 messages per second per bot
- Both platforms automatically handle rate limiting

#### User Not Found
- ✅ Verify user ID is correct
- ✅ Ensure user has linked their account
- ✅ Check user exists in database

### Debug Logs
Enable debug logging by setting:
```bash
NODE_ENV=development
```

## 🚀 Production Deployment

### Environment Variables
Ensure these are set in your production environment:
```bash
DISCORD_BOT_TOKEN=your_production_discord_token
TELEGRAM_BOT_TOKEN=your_production_telegram_token
```

### Bot Registration
For production, register slash commands:
```bash
npm run bots:register-commands
```

### Monitoring
- Monitor bot uptime and response rates
- Set up alerts for bot failures
- Monitor rate limiting and user feedback

## 📚 Additional Resources

- [Discord.js Documentation](https://discord.js.org/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Discord Developer Portal](https://discord.com/developers/docs)
- [Telegram BotFather](https://core.telegram.org/bots#6-botfather)

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Run the comprehensive test suite
3. Check bot service logs
4. Verify environment configuration
5. Test with a minimal example

For additional help, check the main project documentation or create an issue with:
- Bot platform (Discord/Telegram)
- Error messages or logs
- Steps to reproduce the issue
- Your environment setup