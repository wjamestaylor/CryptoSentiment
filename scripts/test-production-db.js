// Test production database schema
import { PrismaClient } from '@prisma/client';

async function testDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing production database schema...');
    
    // Test if subscription table exists
    try {
      const subscriptionCount = await prisma.subscription.count();
      console.log('✅ Subscription table exists with', subscriptionCount, 'records');
    } catch (error) {
      console.log('❌ Subscription table error:', error.message);
    }
    
    // Test if users table has subscription fields
    try {
      const usersWithSub = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          subscriptionId: true,
          discordUserId: true,
          telegramUserId: true
        },
        take: 1
      });
      console.log('✅ User table has subscription fields');
      console.log('Sample user data:', usersWithSub[0] || 'No users found');
    } catch (error) {
      console.log('❌ User table subscription fields error:', error.message);
    }
    
    // Test Stripe subscription fields in subscription table
    try {
      const subscriptions = await prisma.subscription.findMany({
        select: {
          id: true,
          tier: true,
          status: true,
          stripeSubscriptionId: true,
          stripeCustomerId: true,
          currentPeriodStart: true,
          currentPeriodEnd: true
        },
        take: 1
      });
      console.log('✅ Subscription table has Stripe fields');
      console.log('Sample subscription:', subscriptions[0] || 'No subscriptions found');
    } catch (error) {
      console.log('❌ Subscription Stripe fields error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase().catch(console.error);