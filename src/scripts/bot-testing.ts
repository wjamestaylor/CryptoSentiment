/**
 * Bot Testing Utilities
 * Manual testing tools for Discord and Telegram bot functionality
 */

import { DiscordService } from '@/services/bots/discord.service';
import { TelegramService } from '@/services/bots/telegram.service';
import { NotificationService } from '@/services/notifications/notification.service';
import { AlertService } from '@/services/notifications/alerts.service';
import { AlertType, NotificationType } from '@prisma/client';

// Environment setup helper
export function setupTestEnvironment() {
  const requiredEnvVars = {
    DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    DATABASE_URL: process.env.DATABASE_URL,
  };

  const missing = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    return false;
  }

  console.log('✅ All required environment variables are set');
  return true;
}

// Bot service status checker
export async function checkBotStatus() {
  console.log('🔍 Checking bot service status...\n');

  try {
    const discordService = new DiscordService();
    const telegramService = new TelegramService();

    // Wait a moment for services to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));

    const discordStatus = discordService.getStatus();
    const telegramStatus = telegramService.getStatus();

    console.log('Discord Bot Status:');
    console.log(`  Ready: ${discordStatus.isReady ? '✅' : '❌'}`);
    console.log(`  Reconnect Attempts: ${discordStatus.reconnectAttempts}`);
    console.log(`  Cached Users: ${discordStatus.userCount || 0}`);

    console.log('\nTelegram Bot Status:');
    console.log(`  Ready: ${telegramStatus.isReady ? '✅' : '❌'}`);
    console.log(`  Reconnect Attempts: ${telegramStatus.reconnectAttempts}`);
    console.log(`  Rate Limited Users: ${telegramStatus.rateLimitedUsers}`);

    // Cleanup
    await discordService.shutdown();
    await telegramService.shutdown();

    return {
      discord: discordStatus,
      telegram: telegramStatus,
    };
  } catch (error) {
    console.error('❌ Error checking bot status:', error);
    return null;
  }
}

// Test alert delivery to specific user
export async function testAlertDelivery(userId: string, botType: 'discord' | 'telegram' | 'both' = 'both') {
  console.log(`🚨 Testing alert delivery to user ${userId} via ${botType}...\n`);

  try {
    const discordService = new DiscordService();
    const telegramService = new TelegramService();
    
    // Wait for services to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));

    const testAlert = {
      type: 'PRICE_CHANGE' as const,
      cryptocurrency: 'BTC',
      message: '🧪 This is a test alert from CryptoSentiment bot integration testing!',
      currentValue: 50000,
      threshold: 45000,
      changePercentage: 11.1,
      timestamp: new Date(),
    };

    const results: Record<string, boolean> = {};

    if (botType === 'discord' || botType === 'both') {
      console.log('📤 Sending Discord test alert...');
      results.discord = await discordService.sendAlert(userId, testAlert);
      console.log(`Discord result: ${results.discord ? '✅ Success' : '❌ Failed'}`);
    }

    if (botType === 'telegram' || botType === 'both') {
      console.log('📤 Sending Telegram test alert...');
      const telegramAlert = {
        type: 'PRICE_CHANGE' as const,
        cryptocurrency: 'BTC',
        message: '🧪 This is a test alert from CryptoSentiment bot integration testing!',
        price: 50000,
        change: 11.1,
        timestamp: new Date(),
      };
      results.telegram = await telegramService.sendAlert(userId, telegramAlert);
      console.log(`Telegram result: ${results.telegram ? '✅ Success' : '❌ Failed'}`);
    }

    // Cleanup
    await discordService.shutdown();
    await telegramService.shutdown();

    return results;
  } catch (error) {
    console.error('❌ Error testing alert delivery:', error);
    return null;
  }
}

// Test user verification flow
export async function testUserVerification(discordUserId?: string, telegramUserId?: string) {
  console.log('🔗 Testing user verification flow...\n');

  try {
    const discordService = new DiscordService();
    const telegramService = new TelegramService();
    
    // Wait for services to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));

    const results: Record<string, boolean> = {};

    if (discordUserId) {
      console.log(`📤 Testing Discord user verification for ${discordUserId}...`);
      results.discord = await discordService.registerUser(discordUserId, 'test-crypto-user-id');
      console.log(`Discord verification result: ${results.discord ? '✅ Success' : '❌ Failed'}`);
    }

    if (telegramUserId) {
      console.log(`📤 Testing Telegram user verification for ${telegramUserId}...`);
      results.telegram = await telegramService.registerUser(telegramUserId);
      console.log(`Telegram verification result: ${results.telegram ? '✅ Success' : '❌ Failed'}`);
    }

    // Cleanup
    await discordService.shutdown();
    await telegramService.shutdown();

    return results;
  } catch (error) {
    console.error('❌ Error testing user verification:', error);
    return null;
  }
}

// Test notification service integration
export async function testNotificationIntegration(userId: string) {
  console.log(`📬 Testing notification service integration for user ${userId}...\n`);

  try {
    const notificationService = new NotificationService();

    const testNotification = {
      userId,
      type: NotificationType.ALERT_TRIGGERED,
      title: '🧪 Test Notification',
      content: 'This is a test notification from the bot integration testing suite.',
      alertId: 'test-alert-id',
      cryptoId: 'test-crypto-id',
      alertType: AlertType.PRICE_CHANGE,
    };

    console.log('📤 Sending test notification...');
    const result = await notificationService.sendNotification(testNotification);
    
    console.log(`Notification result: ${result ? '✅ Success' : '❌ Failed'}`);

    return result;
  } catch (error) {
    console.error('❌ Error testing notification integration:', error);
    return false;
  }
}

// Test alert system integration
export async function testAlertSystemIntegration(userId: string) {
  console.log(`⚡ Testing alert system integration for user ${userId}...\n`);

  try {
    const alertService = new AlertService();

    console.log('📤 Creating test alert...');
    const testAlert = await alertService.createAlertWithSymbol({
      userId,
      cryptoSymbol: 'BTC',
      cryptoName: 'Bitcoin',
      type: AlertType.PRICE_CHANGE,
      condition: {
        priceThreshold: 50000,
        direction: 'above',
      },
    });

    console.log(`Alert creation result: ${testAlert ? '✅ Success' : '❌ Failed'}`);

    if (testAlert) {
      console.log(`Created alert ID: ${testAlert.id}`);
      
      // Test alert triggering simulation
      console.log('🧪 Simulating alert trigger...');
      await alertService.checkAlerts('test-crypto-id', {
        cryptoId: 'test-crypto-id',
        price: 52000,
        change24h: 4.0,
      });
      
      console.log('✅ Alert trigger simulation completed');
    }

    return testAlert;
  } catch (error) {
    console.error('❌ Error testing alert system integration:', error);
    return null;
  }
}

// Comprehensive bot integration test
export async function runComprehensiveTest(testConfig: {
  userId: string;
  discordUserId?: string;
  telegramUserId?: string;
  skipAlert?: boolean;
}) {
  console.log('🎯 Running comprehensive bot integration test...\n');
  console.log('=' .repeat(60));

  const results = {
    environment: false,
    botStatus: null as any,
    userVerification: null as any,
    alertDelivery: null as any,
    notificationIntegration: false,
    alertSystemIntegration: null as any,
  };

  try {
    // 1. Check environment
    console.log('\n1️⃣ Environment Check');
    console.log('-'.repeat(30));
    results.environment = setupTestEnvironment();

    if (!results.environment) {
      console.log('❌ Environment check failed. Stopping test.');
      return results;
    }

    // 2. Check bot status
    console.log('\n2️⃣ Bot Status Check');
    console.log('-'.repeat(30));
    results.botStatus = await checkBotStatus();

    // 3. Test user verification
    if (testConfig.discordUserId || testConfig.telegramUserId) {
      console.log('\n3️⃣ User Verification Test');
      console.log('-'.repeat(30));
      results.userVerification = await testUserVerification(
        testConfig.discordUserId,
        testConfig.telegramUserId
      );
    }

    // 4. Test alert delivery
    if (!testConfig.skipAlert) {
      console.log('\n4️⃣ Alert Delivery Test');
      console.log('-'.repeat(30));
      results.alertDelivery = await testAlertDelivery(testConfig.userId);
    }

    // 5. Test notification integration
    console.log('\n5️⃣ Notification Integration Test');
    console.log('-'.repeat(30));
    results.notificationIntegration = await testNotificationIntegration(testConfig.userId);

    // 6. Test alert system integration
    console.log('\n6️⃣ Alert System Integration Test');
    console.log('-'.repeat(30));
    results.alertSystemIntegration = await testAlertSystemIntegration(testConfig.userId);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`Environment Setup: ${results.environment ? '✅' : '❌'}`);
    console.log(`Bot Status: ${results.botStatus ? '✅' : '❌'}`);
    console.log(`User Verification: ${results.userVerification ? '✅' : '❌'}`);
    console.log(`Alert Delivery: ${results.alertDelivery ? '✅' : '❌'}`);
    console.log(`Notification Integration: ${results.notificationIntegration ? '✅' : '❌'}`);
    console.log(`Alert System Integration: ${results.alertSystemIntegration ? '✅' : '❌'}`);

    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All tests passed! Bot integration is working correctly.');
    } else {
      console.log('⚠️ Some tests failed. Check the logs above for details.');
    }

  } catch (error) {
    console.error('❌ Error during comprehensive test:', error);
  }

  console.log('\n' + '='.repeat(60));
  return results;
}

// Export for CLI usage
if (require.main === module) {
  // CLI interface for manual testing
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'status':
      checkBotStatus();
      break;
    case 'alert':
      if (args[1]) {
        testAlertDelivery(args[1], args[2] as any);
      } else {
        console.error('Usage: node bot-testing.js alert <userId> [botType]');
      }
      break;
    case 'verify':
      testUserVerification(args[1], args[2]);
      break;
    case 'notification':
      if (args[1]) {
        testNotificationIntegration(args[1]);
      } else {
        console.error('Usage: node bot-testing.js notification <userId>');
      }
      break;
    case 'comprehensive':
      if (args[1]) {
        runComprehensiveTest({
          userId: args[1],
          discordUserId: args[2],
          telegramUserId: args[3],
        });
      } else {
        console.error('Usage: node bot-testing.js comprehensive <userId> [discordUserId] [telegramUserId]');
      }
      break;
    default:
      console.log(`
🤖 CryptoSentiment Bot Testing Utilities

Usage: node bot-testing.js <command> [args]

Commands:
  status                                    - Check bot service status
  alert <userId> [botType]                 - Test alert delivery
  verify [discordUserId] [telegramUserId]  - Test user verification  
  notification <userId>                    - Test notification integration
  comprehensive <userId> [discord] [tg]    - Run all tests

Examples:
  node bot-testing.js status
  node bot-testing.js alert user-123 discord
  node bot-testing.js comprehensive user-123 discord-456 telegram-789
      `);
  }
}