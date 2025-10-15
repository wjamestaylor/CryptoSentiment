import Stripe from 'stripe';

// Lazy-initialized Stripe instance
let stripeInstance: Stripe | null = null;

export const getStripe = (): Stripe => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
  }
  
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover',
      typescript: true,
    });
  }
  
  return stripeInstance;
};

// Export stripe using a getter function to avoid build-time evaluation
export const stripe = process.env.STRIPE_SECRET_KEY ? (() => {
  try {
    return getStripe();
  } catch {
    return null;
  }
})() : null;

// Stripe product and price IDs (will be configured in Stripe Dashboard)
export const STRIPE_CONFIG = {
  products: {
    pro: {
      id: process.env.STRIPE_PRO_PRODUCT_ID || '',
      priceIds: {
        monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || '',
        yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || '',
      },
    },
    business: {
      id: process.env.STRIPE_BUSINESS_PRODUCT_ID || '',
      priceIds: {
        monthly: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID || '',
        yearly: process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID || '',
      },
    },
  },
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
} as const;

export const SUBSCRIPTION_TIERS = {
  FREE: 'FREE',
  PRO: 'PRO',
  BUSINESS: 'BUSINESS',
} as const;

export type SubscriptionTier = typeof SUBSCRIPTION_TIERS[keyof typeof SUBSCRIPTION_TIERS];