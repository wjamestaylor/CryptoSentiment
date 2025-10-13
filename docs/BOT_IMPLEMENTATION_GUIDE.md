# 🤖 Bot Implementation Guide

*CryptoSentiment Bot Integration Roadmap*  
**Created:** October 13, 2025  
**Status:** Planning Phase

---

## 📋 Overview

This document outlines the implementation plan for Discord and Telegram bots to enhance CryptoSentiment's notification system with real-time bot alerts and interactive commands.

## 🎯 Current Infrastructure Status

### ✅ **Already Implemented**
- **Database Schema**: User preferences include `discordNotifications` and `telegramNotifications`
- **Environment Variables**: `DISCORD_BOT_TOKEN` and `TELEGRAM_BOT_TOKEN` defined
- **Notification Service**: Multi-channel notification infrastructure ready
- **User Preferences**: tRPC endpoints for managing bot notification settings
- **Alert System**: Complete alert creation and processing with email delivery
- **Testing Infrastructure**: 95%+ coverage patterns established

### ❌ **Not Implemented**
- Discord bot service and commands
- Telegram bot service and commands
- Bot registration/authentication flow
- Interactive bot commands
- Webhook handlers for bot interactions

---

## 🚀 Implementation Phases

## **Phase 1: Discord Bot Implementation** 🔵

### 1.1 Core Discord Service
**File:** `/src/services/bots/discord.service.ts`

**Features:**
- Bot initialization and authentication
- Channel message sending
- User DM capabilities
- Error handling and rate limiting
- Integration with existing NotificationService

**Dependencies:**
```bash
npm install discord.js @types/discord.js
```

**Key Methods:**
```typescript
class DiscordService {
  async sendAlert(userId: string, alert: AlertData): Promise<boolean>
  async sendDirectMessage(userId: string, message: string): Promise<boolean>
  async registerUser(discordUserId: string, cryptoUserId: string): Promise<boolean>
  async handleCommand(interaction: CommandInteraction): Promise<void>
}
```

### 1.2 Discord Bot Commands
**Interactive Commands:**
- `/register` - Link Discord account to CryptoSentiment
- `/alerts` - View active alerts
- `/watch <crypto>` - Add crypto to watchlist
- `/unwatch <crypto>` - Remove from watchlist
- `/sentiment <crypto>` - Get AI sentiment analysis
- `/help` - Bot command help

### 1.3 Discord Integration Tests
**File:** `/src/__tests__/services/bots/discord.service.test.ts`

**Test Coverage:**
- Message sending (success/failure)
- Command handling
- User registration flow
- Rate limiting
- Error scenarios
- Webhook processing

---

## **Phase 2: Telegram Bot Implementation** 📱

### 2.1 Core Telegram Service
**File:** `/src/services/bots/telegram.service.ts`

**Features:**
- Bot initialization with webhooks
- Message sending and formatting
- Inline keyboards for interactions
- User registration flow
- Integration with NotificationService

**Dependencies:**
```bash
npm install node-telegram-bot-api @types/node-telegram-bot-api
```

**Key Methods:**
```typescript
class TelegramService {
  async sendAlert(userId: string, alert: AlertData): Promise<boolean>
  async sendMessage(chatId: string, message: string): Promise<boolean>
  async registerUser(telegramUserId: string, cryptoUserId: string): Promise<boolean>
  async handleCallback(callbackQuery: CallbackQuery): Promise<void>
}
```

### 2.2 Telegram Bot Commands
**Interactive Commands:**
- `/start` - Welcome and registration
- `/register` - Link Telegram to CryptoSentiment
- `/alerts` - View active alerts with inline buttons
- `/watch <crypto>` - Add to watchlist
- `/unwatch <crypto>` - Remove from watchlist
- `/sentiment <crypto>` - Get AI analysis
- `/settings` - Notification preferences

### 2.3 Telegram Integration Tests
**File:** `/src/__tests__/services/bots/telegram.service.test.ts`

**Test Coverage:**
- Message sending and formatting
- Webhook handling
- Inline keyboard interactions
- User registration
- Error handling
- Rate limiting

---

## **Phase 3: Enhanced Integration** 🔗

### 3.1 Bot Registration System
**Files:**
- `/src/app/api/bots/discord/register/route.ts`
- `/src/app/api/bots/telegram/register/route.ts`

**Features:**
- OAuth-like flow for Discord
- Verification codes for Telegram
- Database linking (User ↔ Discord/Telegram IDs)
- Security validation

### 3.2 Enhanced Notification Service
**File:** `/src/services/notifications/notification.service.ts` (Enhanced)

**New Methods:**
```typescript
async sendDiscordAlert(userId: string, alert: AlertData): Promise<boolean>
async sendTelegramAlert(userId: string, alert: AlertData): Promise<boolean>
async sendMultiChannelAlert(userId: string, alert: AlertData): Promise<NotificationResult>
```

### 3.3 Bot Management UI
**Files:**
- `/src/components/settings/BotSettings.tsx`
- `/src/app/profile/bots/page.tsx`

**Features:**
- Bot connection status
- Registration flows
- Test message functionality
- Bot-specific preferences

---

## **Phase 4: Advanced Features** ⚡

### 4.1 Interactive Bot Features
**Discord Features:**
- Slash command autocomplete
- Embedded rich alerts with charts
- Server-wide crypto channels
- Role-based alert permissions

**Telegram Features:**
- Inline query support (`@cryptobot bitcoin`)
- Custom keyboards for quick actions
- Group chat integrations
- Price/sentiment charts as images

### 4.2 Webhook Handlers
**Files:**
- `/src/app/api/webhooks/discord/route.ts`
- `/src/app/api/webhooks/telegram/route.ts`

**Features:**
- Real-time command processing
- Interaction handling
- Security validation
- Rate limiting

### 4.3 Advanced Analytics
**Features:**
- Bot usage analytics
- Command performance metrics
- User engagement tracking
- Alert delivery success rates

---

## 🛠 Technical Implementation Details

### Database Schema Extensions
```sql
-- Add bot-specific user data
ALTER TABLE users ADD COLUMN discord_user_id VARCHAR(255);
ALTER TABLE users ADD COLUMN telegram_user_id VARCHAR(255);
ALTER TABLE users ADD COLUMN discord_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN telegram_verified BOOLEAN DEFAULT FALSE;

-- Bot interaction tracking
CREATE TABLE bot_interactions (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id),
  bot_type VARCHAR(50) NOT NULL, -- 'discord' | 'telegram'
  command VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Environment Variables
```bash
# Discord Bot Configuration
DISCORD_BOT_TOKEN="your_discord_bot_token"
DISCORD_CLIENT_ID="your_discord_client_id"
DISCORD_PUBLIC_KEY="your_discord_public_key"

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN="your_telegram_bot_token"
TELEGRAM_WEBHOOK_URL="https://your-domain.com/api/webhooks/telegram"

# Bot Settings
BOT_RATE_LIMIT_WINDOW=60000
BOT_RATE_LIMIT_MAX=30
```

### Service Integration Pattern
```typescript
// Follow existing service patterns
export class BotService {
  private async request<T>(endpoint: string, options: RequestOptions): Promise<T> {
    // Standard error handling and logging
    // Rate limiting implementation
    // Response validation with Zod
  }

  async sendNotification(userId: string, data: NotificationData): Promise<boolean> {
    // Integrate with existing NotificationService patterns
  }
}
```

---

## 📋 Implementation Checklist

### Phase 1: Discord Bot ✅ **READY TO START**
- [ ] Install Discord.js dependencies
- [ ] Create `DiscordService` class with core methods
- [ ] Implement bot initialization and authentication
- [ ] Create slash commands (`/register`, `/alerts`, `/watch`, etc.)
- [ ] Add message sending and DM capabilities
- [ ] Implement user registration flow
- [ ] Create comprehensive test suite (95%+ coverage)
- [ ] Add rate limiting and error handling
- [ ] Integrate with existing `NotificationService`
- [ ] Create Discord webhook handler

### Phase 2: Telegram Bot
- [ ] Install Telegram bot dependencies
- [ ] Create `TelegramService` class
- [ ] Implement webhook-based bot architecture
- [ ] Create interactive commands with inline keyboards
- [ ] Add message formatting and rich content
- [ ] Implement user registration with verification codes
- [ ] Create comprehensive test suite
- [ ] Add rate limiting and security measures
- [ ] Integrate with `NotificationService`
- [ ] Create Telegram webhook handler

### Phase 3: Enhanced Integration
- [ ] Create bot registration API endpoints
- [ ] Add database schema for bot user linking
- [ ] Create bot management UI components
- [ ] Enhance `NotificationService` for multi-channel delivery
- [ ] Add bot status monitoring
- [ ] Create bot testing utilities

### Phase 4: Advanced Features
- [ ] Implement rich embed alerts (Discord)
- [ ] Add inline query support (Telegram)
- [ ] Create bot analytics dashboard
- [ ] Add group chat features
- [ ] Implement custom bot commands
- [ ] Add chart/image generation for price alerts

---

## 🧪 Testing Strategy

### Test Coverage Goals
- **Bot Services**: 95%+ coverage (following existing service patterns)
- **Webhook Handlers**: 100% coverage for security
- **Integration Tests**: All notification channels
- **Error Scenarios**: Network failures, rate limits, invalid tokens

### Mock Strategy
```typescript
// Global mocking for bot APIs (similar to existing fetch mocking)
jest.mock('discord.js');
jest.mock('node-telegram-bot-api');

// Test patterns following existing service tests
describe('DiscordService', () => {
  beforeEach(() => jest.clearAllMocks());
  
  it('should send alert successfully', async () => {
    // Test success scenario
  });
  
  it('should handle rate limiting gracefully', async () => {
    // Test error scenario
  });
});
```

---

## 🚀 Getting Started

### Immediate Next Steps
1. **Start with Phase 1 (Discord Bot)**
2. **Set up Discord Application** in Discord Developer Portal
3. **Install dependencies** and create basic service structure
4. **Implement core message sending** functionality
5. **Create comprehensive tests** following project patterns
6. **Integrate with existing notification system**

### Success Metrics
- ✅ Bot services integrate seamlessly with existing `NotificationService`
- ✅ 95%+ test coverage maintained across all bot implementations
- ✅ Real-time alerts delivered to Discord/Telegram within 5 seconds
- ✅ User registration flow has <2% failure rate
- ✅ All bot commands respond within 2 seconds
- ✅ Rate limiting prevents abuse while maintaining responsiveness

---

## 💡 Architecture Principles

### Following Existing Patterns
- **Service Layer**: All bot logic in dedicated service classes
- **Error Handling**: Comprehensive logging and graceful degradation
- **Type Safety**: Full TypeScript with Zod validation
- **Testing**: Jest with extensive mocking and edge case coverage
- **Integration**: Seamless integration with existing tRPC and notification systems

### Security Considerations
- **Token Security**: Secure bot token storage and rotation
- **User Verification**: Robust user linking with verification codes
- **Rate Limiting**: Prevent abuse and API quota exhaustion
- **Input Validation**: All user inputs validated and sanitized
- **Webhook Security**: Signature verification for all incoming webhooks

---

*This implementation will transform CryptoSentiment into a comprehensive multi-channel notification platform, providing users with real-time crypto alerts directly in their preferred messaging platforms.*