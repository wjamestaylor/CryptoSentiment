# 🛠️ CryptoSentiment Subscription System - Technical Implementation Plan

*Last Updated: October 15, 2025*  
**Status: Phase 2 Complete - Backend Infrastructure Ready for Frontend Integration**

## 🎉 **Current Progress Summary**

### ✅ **Phases 1 & 2 Complete** 
**✅ Pricing Strategy**: 3-tier model (Free/Pro/Business) with comprehensive feature differentiation  
**✅ Pricing Page**: Fully implemented with billing toggles, feature comparison, and responsive design  
**✅ Stripe Backend**: Complete subscription infrastructure with checkout, portal, and webhook APIs  
**✅ Database Schema**: Extended Prisma models with all Stripe subscription fields  
**✅ Service Layer**: Comprehensive `SubscriptionService` with lifecycle management  
**✅ Build Status**: Successfully compiling with 669/672 tests passing

### 🎯 **Phase 3 Next**: Frontend Integration
**Primary Goal**: Connect the existing pricing page to the Stripe checkout API  
**Key Tasks**: Subscription management UI, upgrade flows, billing interface  
**Timeline**: Ready to start immediately - all backend infrastructure is in place

---

## 📋 **Implementation Overview**

This document outlines the technical implementation of the CryptoSentiment subscription system based on the pricing strategy defined in `/docs/PRICING_STRATEGY.md`.

**Pricing Tiers:**
- **Free**: $0 - 10 AI analyses, 10 watchlist, 3 alerts
- **Pro**: $9/month - 100 AI analyses, 50 watchlist, 15 alerts, 1 bot
- **Business**: $29/month - 500 AI analyses, unlimited watchlist, 50 alerts, both bots

---

## 🏗️ **Technical Architecture**

### **Database Schema Updates**

#### **Subscription Table (New)**
```sql
-- Add to prisma/schema.prisma
model Subscription {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  tier              SubscriptionTier   @default(FREE)
  status            SubscriptionStatus @default(ACTIVE)
  stripeCustomerId  String?
  stripeSubscriptionId String?
  
  // Usage tracking
  aiAnalysesUsed    Int @default(0)
  aiAnalysesLimit   Int @default(10)
  watchlistUsed     Int @default(0)
  watchlistLimit    Int @default(10)
  alertsUsed        Int @default(0)
  alertsLimit       Int @default(3)
  
  // Bot permissions
  discordEnabled    Boolean @default(false)
  telegramEnabled   Boolean @default(false)
  
  // Billing
  currentPeriodStart DateTime?
  currentPeriodEnd   DateTime?
  cancelAtPeriodEnd  Boolean @default(false)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("subscriptions")
}

enum SubscriptionTier {
  FREE
  PRO
  BUSINESS
}

enum SubscriptionStatus {
  ACTIVE
  CANCELED
  PAST_DUE
  UNPAID
  TRIALING
}
```

#### **User Table Updates**
```sql
-- Update existing User model
model User {
  // ... existing fields
  subscription Subscription?
  // ... rest of fields
}
```

#### **Usage Tracking Table (New)**
```sql
model UsageLog {
  id     String @id @default(cuid())
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  type      UsageType
  resource  String    // e.g., "ai_analysis", "alert_creation"
  metadata  Json?     // Additional data (crypto symbol, analysis type, etc.)
  
  createdAt DateTime @default(now())
  
  @@map("usage_logs")
}

enum UsageType {
  AI_ANALYSIS
  ALERT_CREATION
  WATCHLIST_ADD
  BOT_NOTIFICATION
}
```

### **Service Layer Architecture**

#### **Subscription Service**
```typescript
// /src/services/subscription/subscription.service.ts
export class SubscriptionService {
  // Subscription management
  async createSubscription(userId: string, tier: SubscriptionTier): Promise<Subscription>
  async updateSubscription(userId: string, updates: Partial<Subscription>): Promise<Subscription>
  async cancelSubscription(userId: string): Promise<void>
  
  // Usage tracking
  async trackUsage(userId: string, type: UsageType, metadata?: any): Promise<void>
  async checkUsageLimit(userId: string, type: UsageType): Promise<boolean>
  async getUserUsage(userId: string): Promise<UsageStats>
  async resetMonthlyUsage(userId: string): Promise<void>
  
  // Tier management
  async getUserTier(userId: string): Promise<SubscriptionTier>
  async upgradeTier(userId: string, newTier: SubscriptionTier): Promise<void>
  async getTierLimits(tier: SubscriptionTier): Promise<TierLimits>
}
```

#### **Stripe Integration Service**
```typescript
// /src/services/payments/stripe.service.ts
export class StripeService {
  // Customer management
  async createCustomer(user: User): Promise<Stripe.Customer>
  async updateCustomer(customerId: string, data: any): Promise<Stripe.Customer>
  
  // Subscription management
  async createSubscription(customerId: string, priceId: string): Promise<Stripe.Subscription>
  async updateSubscription(subscriptionId: string, updates: any): Promise<Stripe.Subscription>
  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription>
  
  // Webhook handling
  async handleWebhook(event: Stripe.Event): Promise<void>
}
```

#### **Feature Gate Service**
```typescript
// /src/services/gating/feature-gate.service.ts
export class FeatureGateService {
  // Permission checks
  async canCreateAlert(userId: string): Promise<boolean>
  async canAnalyzeCrypto(userId: string): Promise<boolean>
  async canAddToWatchlist(userId: string): Promise<boolean>
  async canUseBot(userId: string, platform: 'discord' | 'telegram'): Promise<boolean>
  
  // Usage enforcement
  async enforceAIAnalysisLimit(userId: string): Promise<void>
  async enforceWatchlistLimit(userId: string): Promise<void>
  async enforceAlertLimit(userId: string): Promise<void>
}
```

---

## 📄 **Frontend Implementation**

### **Pricing Page Component**
```typescript
// /src/app/pricing/page.tsx
interface PricingTier {
  name: string
  price: number
  interval: 'month' | 'year'
  features: string[]
  limits: {
    aiAnalyses: number | 'unlimited'
    watchlist: number | 'unlimited'
    alerts: number
    bots: string[]
  }
  stripePriceId: string
  popular?: boolean
}

export default function PricingPage() {
  // Pricing tiers configuration
  // Stripe checkout integration
  // Feature comparison table
  // FAQ section
}
```

### **Subscription Management Component**
```typescript
// /src/components/subscription/SubscriptionManager.tsx
export function SubscriptionManager() {
  // Current subscription display
  // Usage statistics
  // Upgrade/downgrade options
  // Billing history
  // Cancel subscription
}
```

### **Usage Dashboard Component**
```typescript
// /src/components/usage/UsageDashboard.tsx
export function UsageDashboard() {
  // AI analyses used/remaining
  // Watchlist usage
  // Alert usage
  // Progress bars and warnings
  // Upgrade prompts when near limits
}
```

### **Feature Gate HOCs**
```typescript
// /src/components/gates/FeatureGate.tsx
interface FeatureGateProps {
  feature: 'ai_analysis' | 'watchlist' | 'alerts' | 'bots'
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function FeatureGate({ feature, fallback, children }: FeatureGateProps) {
  // Check user permissions
  // Show upgrade prompt if restricted
  // Track attempted usage for analytics
}
```

---

## 🔌 **API Integration**

### **Stripe Configuration**
```typescript
// /src/lib/stripe/config.ts
export const STRIPE_CONFIG = {
  prices: {
    PRO_MONTHLY: 'price_pro_monthly_id',
    PRO_YEARLY: 'price_pro_yearly_id',
    BUSINESS_MONTHLY: 'price_business_monthly_id',
    BUSINESS_YEARLY: 'price_business_yearly_id',
  },
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
}
```

### **tRPC Router Updates**
```typescript
// /src/server/api/routers/subscription.ts
export const subscriptionRouter = createTRPCRouter({
  // Get current subscription
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    // Return user's subscription details
  }),
  
  // Create checkout session
  createCheckout: protectedProcedure
    .input(z.object({ tier: z.enum(['PRO', 'BUSINESS']), interval: z.enum(['month', 'year']) }))
    .mutation(async ({ input, ctx }) => {
      // Create Stripe checkout session
    }),
  
  // Cancel subscription
  cancel: protectedProcedure.mutation(async ({ ctx }) => {
    // Cancel user's subscription
  }),
  
  // Get usage statistics
  getUsage: protectedProcedure.query(async ({ ctx }) => {
    // Return current usage stats
  }),
})
```

### **Webhook Endpoints**
```typescript
// /src/app/api/webhooks/stripe/route.ts
export async function POST(request: Request) {
  // Verify webhook signature
  // Handle subscription events:
  // - customer.subscription.created
  // - customer.subscription.updated
  // - customer.subscription.deleted
  // - invoice.payment_succeeded
  // - invoice.payment_failed
}
```

---

## 🔒 **Feature Gating Implementation**

### **AI Analysis Gating**
```typescript
// /src/services/openrouter/gated-analysis.service.ts
export class GatedAnalysisService extends OpenRouterService {
  async analyzeSentiment(data: any, userId: string) {
    // Check if user can perform analysis
    const canAnalyze = await this.featureGate.canAnalyzeCrypto(userId)
    if (!canAnalyze) {
      throw new Error('Analysis limit reached. Upgrade to continue.')
    }
    
    // Track usage
    await this.subscriptionService.trackUsage(userId, UsageType.AI_ANALYSIS, { 
      crypto: data.cryptocurrency 
    })
    
    // Perform analysis
    return super.analyzeSentiment(data)
  }
}
```

### **Watchlist Gating**
```typescript
// /src/server/api/routers/crypto.ts (updated)
export const cryptoRouter = createTRPCRouter({
  follow: protectedProcedure
    .input(z.object({ symbol: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Check watchlist limit
      const canAdd = await featureGate.canAddToWatchlist(ctx.session.user.id)
      if (!canAdd) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Watchlist limit reached. Upgrade to add more coins.'
        })
      }
      
      // Track usage and add to watchlist
      await subscriptionService.trackUsage(ctx.session.user.id, UsageType.WATCHLIST_ADD)
      // ... rest of implementation
    }),
})
```

### **Alert Gating**
```typescript
// /src/server/api/routers/alerts.ts (updated)
export const alertsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createAlertSchema)
    .mutation(async ({ input, ctx }) => {
      // Check alert limit
      const canCreate = await featureGate.canCreateAlert(ctx.session.user.id)
      if (!canCreate) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Alert limit reached. Upgrade to create more alerts.'
        })
      }
      
      // Track usage and create alert
      await subscriptionService.trackUsage(ctx.session.user.id, UsageType.ALERT_CREATION)
      // ... rest of implementation
    }),
})
```

### **Bot Integration Gating**
```typescript
// /src/services/notifications/gated-notification.service.ts
export class GatedNotificationService extends NotificationService {
  async sendNotification(data: NotificationData) {
    // Check bot permissions based on subscription
    const subscription = await this.subscriptionService.getUserSubscription(data.userId)
    
    // Filter notification channels based on tier
    const allowedChannels = this.getAllowedChannels(subscription.tier)
    data.channels = data.channels.filter(channel => allowedChannels.includes(channel))
    
    // Send notification through allowed channels only
    return super.sendNotification(data)
  }
  
  private getAllowedChannels(tier: SubscriptionTier): string[] {
    switch (tier) {
      case 'FREE': return ['email']
      case 'PRO': return ['email', 'discord'] // or telegram, user choice
      case 'BUSINESS': return ['email', 'discord', 'telegram']
    }
  }
}
```

---

## 📊 **Usage Tracking & Analytics**

### **Usage Middleware**
```typescript
// /src/middleware/usage-tracking.ts
export function createUsageTracker(type: UsageType) {
  return async (req: any, res: any, next: any) => {
    // Track usage before proceeding
    if (req.user?.id) {
      await subscriptionService.trackUsage(req.user.id, type, req.body)
    }
    next()
  }
}
```

### **Usage Reset Job**
```typescript
// /src/jobs/reset-monthly-usage.ts
export async function resetMonthlyUsage() {
  // Run monthly to reset usage counters
  const subscriptions = await db.subscription.findMany({
    where: {
      status: 'ACTIVE',
      currentPeriodEnd: {
        lte: new Date()
      }
    }
  })
  
  for (const subscription of subscriptions) {
    await subscriptionService.resetMonthlyUsage(subscription.userId)
  }
}
```

---

## 🧪 **Testing Strategy**

### **Unit Tests**
```typescript
// /src/__tests__/services/subscription.test.ts
describe('SubscriptionService', () => {
  describe('trackUsage', () => {
    it('should track AI analysis usage', async () => {
      // Test usage tracking
    })
    
    it('should prevent usage when limit exceeded', async () => {
      // Test limit enforcement
    })
  })
  
  describe('checkUsageLimit', () => {
    it('should return true when under limit', async () => {
      // Test limit checking
    })
  })
})
```

### **Integration Tests**
```typescript
// /src/__tests__/api/subscription.test.ts
describe('/api/subscription', () => {
  describe('POST /checkout', () => {
    it('should create Stripe checkout session', async () => {
      // Test Stripe integration
    })
  })
  
  describe('POST /webhooks/stripe', () => {
    it('should handle subscription created webhook', async () => {
      // Test webhook handling
    })
  })
})
```

### **Feature Gate Tests**
```typescript
// /src/__tests__/gating/feature-gate.test.ts
describe('FeatureGateService', () => {
  it('should allow AI analysis for Pro users', async () => {
    // Test feature gating logic
  })
  
  it('should block bot access for Free users', async () => {
    // Test restriction enforcement
  })
})
```

---

## 🚀 **Deployment Checklist**

### **Environment Variables**
```bash
# Stripe
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Pricing IDs
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_YEARLY_PRICE_ID=price_...
STRIPE_BUSINESS_MONTHLY_PRICE_ID=price_...
STRIPE_BUSINESS_YEARLY_PRICE_ID=price_...
```

### **Database Migration**
```bash
# Run new migrations
npm run db:migrate:deploy

# Seed initial subscription data for existing users
npm run db:seed:subscriptions
```

### **Stripe Product Setup**
1. Create products in Stripe Dashboard
2. Set up price objects with correct IDs
3. Configure webhook endpoints
4. Test webhook delivery

### **Monitoring & Alerts**
1. Set up usage monitoring dashboards
2. Configure alerts for high usage/costs
3. Monitor subscription conversion rates
4. Track failed payments and dunning

---

## 📋 **Implementation Phases**

### **Phase 1: Core Infrastructure** ✅ **COMPLETE**
- [x] Database schema updates and migrations
- [x] Basic subscription service implementation  
- [x] Stripe integration setup
- [x] Pricing page creation

### **Phase 2: Backend API Infrastructure** ✅ **COMPLETE**
- [x] Stripe checkout session API (`/api/stripe/checkout`)
- [x] Customer portal API (`/api/stripe/portal`) 
- [x] Webhook handling API (`/api/stripe/webhook`)
- [x] Service layer with subscription management
- [x] TypeScript integration and error handling
- [x] Authentication and input validation

### **Phase 3: Frontend Integration** 🎯 **CURRENT FOCUS**
- [ ] Connect pricing page to checkout API
- [ ] Subscription management UI in user dashboard
- [ ] Upgrade/downgrade flows
- [ ] Billing management interface

### **Phase 4: Feature Gating** 📋 **NEXT**
- [ ] Usage tracking implementation
- [ ] AI analysis limits enforcement
- [ ] Watchlist restrictions
- [ ] Alert creation limits
- [ ] Bot integration gating

### **Phase 5: User Experience** 📋 **FUTURE**
- [ ] Usage dashboard
- [ ] Usage limit notifications
- [ ] Analytics and monitoring
- [ ] A/B testing setup
- [ ] Performance optimization

**Current Status**: Backend subscription infrastructure complete. Ready for frontend integration!

---

**This technical plan provides a complete roadmap for implementing the subscription system. Ready to start with Phase 1!** 🛠️