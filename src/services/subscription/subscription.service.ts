import { stripe, STRIPE_CONFIG, SUBSCRIPTION_TIERS } from '@/lib/stripe';
import { prisma } from '@/lib/db/prisma';
import { SubscriptionStatus, SubscriptionTier } from '@prisma/client';
import type Stripe from 'stripe';

export interface CreateCheckoutSessionParams {
  userId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface SubscriptionInfo {
  tier: string;
  status: string;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  trialEnd: Date | null;
}

export class SubscriptionService {
  /**
   * Create a Stripe checkout session for subscription
   */
  async createCheckoutSession({
    userId,
    priceId,
    successUrl,
    cancelUrl,
  }: CreateCheckoutSessionParams): Promise<Stripe.Checkout.Session> {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    try {
      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        customer_email: user.email || undefined,
        client_reference_id: userId,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId,
          priceId,
        },
      });

      return session;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw new Error(`Failed to create checkout session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create Stripe customer portal session
   */
  async createPortalSession(userId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session> {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    try {
      // Get user's subscription with Stripe customer ID
      const subscription = await prisma.subscription.findUnique({
        where: { userId },
      });

      if (!subscription?.stripeCustomerId) {
        throw new Error('No Stripe customer found for this user');
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: subscription.stripeCustomerId,
        return_url: returnUrl,
      });

      return session;
    } catch (error) {
      console.error('Error creating portal session:', error);
      throw new Error(`Failed to create portal session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user subscription information
   */
  async getUserSubscription(userId: string): Promise<SubscriptionInfo> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          subscription: true,
        },
      });

      if (!user || !user.subscription) {
        return {
          tier: SUBSCRIPTION_TIERS.FREE,
          status: 'free',
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          trialEnd: null,
        };
      }

      const subscription = user.subscription;
      
      return {
        tier: subscription.tier,
        status: subscription.status.toLowerCase(),
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        trialEnd: subscription.trialEnd,
      };
    } catch (error) {
      console.error('Error getting user subscription:', error);
      throw new Error(`Failed to get subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Map Stripe status to Prisma status
   */
  private mapStripeStatusToPrisma(stripeStatus: string): SubscriptionStatus {
    const statusMap: Record<string, SubscriptionStatus> = {
      active: SubscriptionStatus.ACTIVE,
      trialing: SubscriptionStatus.TRIALING,
      past_due: SubscriptionStatus.PAST_DUE,
      canceled: SubscriptionStatus.CANCELED,
      unpaid: SubscriptionStatus.UNPAID,
      incomplete: SubscriptionStatus.CANCELED,
      incomplete_expired: SubscriptionStatus.CANCELED,
    };

    return statusMap[stripeStatus] || SubscriptionStatus.CANCELED;
  }

  /**
   * Map Stripe price ID to subscription tier
   */
  private mapPriceIdToTier(priceId: string): SubscriptionTier {
    if (Object.values(STRIPE_CONFIG.products.pro.priceIds).includes(priceId)) {
      return SubscriptionTier.PRO;
    } else if (Object.values(STRIPE_CONFIG.products.business.priceIds).includes(priceId)) {
      return SubscriptionTier.BUSINESS;
    }
    return SubscriptionTier.FREE;
  }

  /**
   * Handle successful subscription creation
   */
  async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    try {
      const customerId = subscription.customer as string;
      const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
      
      if (!customer.metadata?.userId) {
        console.error('No userId found in customer metadata');
        return;
      }

      const userId = customer.metadata.userId;
      const priceId = subscription.items.data[0]?.price.id;
      
      if (!priceId) {
        console.error('No price ID found in subscription');
        return;
      }

      const tier = this.mapPriceIdToTier(priceId);
      const status = this.mapStripeStatusToPrisma(subscription.status);

      // Type assertion for Stripe subscription properties
      const stripeSubscription = subscription as Stripe.Subscription & {
        current_period_start: number;
        current_period_end: number;
        cancel_at_period_end: boolean;
        trial_end?: number;
      };

      // Create or update subscription in database
      await prisma.subscription.upsert({
        where: {
          userId: userId,
        },
        update: {
          status,
          tier,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: customerId,
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
          trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null,
        },
        create: {
          userId,
          status,
          tier,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: customerId,
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
          trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null,
        },
      });

      console.log(`Subscription created for user ${userId}: ${subscription.id}`);
    } catch (error) {
      console.error('Error handling subscription creation:', error);
      throw new Error(`Failed to handle subscription creation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Handle subscription updates
   */
  async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    try {
      // Type assertion for Stripe subscription properties
      const stripeSubscription = subscription as Stripe.Subscription & {
        current_period_start: number;
        current_period_end: number;
        cancel_at_period_end: boolean;
        trial_end?: number;
      };

      await prisma.subscription.update({
        where: {
          stripeSubscriptionId: subscription.id,
        },
        data: {
          status: this.mapStripeStatusToPrisma(subscription.status),
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
          trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null,
        },
      });

      console.log(`Subscription updated: ${subscription.id}`);
    } catch (error) {
      console.error('Error handling subscription update:', error);
      throw new Error(`Failed to handle subscription update: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Handle subscription deletion/cancellation
   */
  async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    try {
      await prisma.subscription.update({
        where: {
          stripeSubscriptionId: subscription.id,
        },
        data: {
          status: SubscriptionStatus.CANCELED,
          cancelAtPeriodEnd: true,
        },
      });

      console.log(`Subscription canceled: ${subscription.id}`);
    } catch (error) {
      console.error('Error handling subscription deletion:', error);
      throw new Error(`Failed to handle subscription deletion: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if user has access to a specific feature based on their subscription tier
   */
  async hasFeatureAccess(userId: string, feature: string): Promise<boolean> {
    try {
      const subscription = await this.getUserSubscription(userId);
      
      // Define feature access based on tiers
      const featureAccess: Record<string, string[]> = {
        [SUBSCRIPTION_TIERS.FREE]: [
          'basic_alerts', 
          'basic_dashboard', 
          'limited_watchlist',
          'limited_ai_analysis'
        ],
        [SUBSCRIPTION_TIERS.PRO]: [
          'basic_alerts', 
          'basic_dashboard', 
          'advanced_alerts', 
          'historical_data', 
          'api_access',
          'unlimited_watchlist',
          'enhanced_ai_analysis',
          'discord_notifications',
          'telegram_notifications'
        ],
        [SUBSCRIPTION_TIERS.BUSINESS]: [
          'basic_alerts', 
          'basic_dashboard', 
          'advanced_alerts', 
          'historical_data', 
          'api_access', 
          'priority_support', 
          'custom_integrations',
          'unlimited_watchlist',
          'unlimited_ai_analysis',
          'discord_notifications',
          'telegram_notifications',
          'webhook_integrations',
          'advanced_analytics'
        ],
      };

      const userTier = subscription.tier;
      const allowedFeatures = featureAccess[userTier] || [];

      return allowedFeatures.includes(feature);
    } catch (error) {
      console.error('Error checking feature access:', error);
      return false; // Default to no access on error
    }
  }

  /**
   * Get subscription limits based on tier
   */
  getSubscriptionLimits(tier: string): Record<string, number> {
    const limits: Record<string, Record<string, number>> = {
      [SUBSCRIPTION_TIERS.FREE]: {
        alerts: 5,
        watchlist: 10,
        aiAnalysisPerMonth: 5,
        botNotifications: 0, // No bot notifications for free tier
      },
      [SUBSCRIPTION_TIERS.PRO]: {
        alerts: 50,
        watchlist: 100,
        aiAnalysisPerMonth: 100,
        botNotifications: 50,
      },
      [SUBSCRIPTION_TIERS.BUSINESS]: {
        alerts: -1, // unlimited
        watchlist: -1, // unlimited
        aiAnalysisPerMonth: 1000,
        botNotifications: -1, // unlimited
      },
    };

    return limits[tier] || limits[SUBSCRIPTION_TIERS.FREE];
  }
}