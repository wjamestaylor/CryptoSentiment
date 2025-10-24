# AI Analysis Page to Email Notification Service - Migration Plan

**Status:** 🟡 Discussion Phase - Awaiting Stakeholder Feedback  
**Created:** October 2025  
**Issue:** [Discussion] Replace AI Analysis page with email notification service

---

## Executive Summary

This document outlines the proposed migration from the current real-time, user-triggered AI Analysis page to an automated email notification service that sends daily/weekly AI sentiment alerts to users about their holdings and watched coins.

**Current State:**
- Users manually trigger AI sentiment analysis via `/sentiment` page
- Real-time analysis requires users to visit the page and click "Analyze"
- Feature-gated by subscription tier (Free: 10/month, Pro: 100/month, Business: 500/month)
- API endpoint: `/api/sentiment/analyze`

**Proposed State:**
- Automated daily/weekly AI sentiment digests sent via email
- Analysis triggered on schedule for all user's watched coins and holdings
- No manual user interaction required
- Same subscription-based feature gating applied to email frequency/coins covered

---

## 1. Current Implementation Analysis

### 1.1 Existing Components

**Frontend:**
- **Page:** `/src/app/sentiment/page.tsx` - Main AI Analysis page with form and results display
- **Navigation:** `/src/components/ui/navbar.tsx` - "AI Analysis" link (line 17)
- **Mobile Navigation:** Same navbar component with mobile menu

**Backend:**
- **API Route:** `/src/app/api/sentiment/analyze/route.ts` - Processes sentiment analysis requests
- **tRPC Router:** `/src/server/api/routers/sentiment.ts` - Type-safe sentiment analysis endpoints
- **Service Layer:** OpenRouter AI service integration

**Database:**
- **UsageLog Model:** Tracks AI_ANALYSIS usage type
- **UserPreferences Model:** Contains `emailNotifications` flag
- **CryptoTracking Model:** Tracks user's watched coins and holdings

**Tests:**
- `src/__tests__/app/sentiment/page.test.tsx` - UI component tests
- `src/__tests__/api/sentiment/analyze.test.ts` - API endpoint tests
- `src/__tests__/api/sentiment/analyze-feature-gating.test.ts` - Feature gating tests
- `src/__tests__/server/api/routers/sentiment-coverage.test.ts` - tRPC router tests

### 1.2 Feature Gating & Limits

Current usage limits per subscription tier:
```typescript
FREE: {
  AI_ANALYSIS: 10 per month
}
PRO: {
  AI_ANALYSIS: 100 per month
}
BUSINESS: {
  AI_ANALYSIS: 500 per month
}
```

### 1.3 Email Infrastructure

**Existing Email Service:** `/src/services/email/email.service.ts`

Capabilities:
- ✅ Professional HTML email templates
- ✅ Alert notification emails (currently used for price/volume alerts)
- ✅ Welcome emails
- ✅ Resend API integration
- ✅ Plain text fallbacks
- ❌ Sentiment digest emails (NOT YET IMPLEMENTED)

---

## 2. Pros & Cons Analysis

### 2.1 Pros of Migration

**User Experience:**
- ✅ **Proactive notifications** - Users don't need to remember to check
- ✅ **Time-saving** - No manual analysis triggering required
- ✅ **Better engagement** - Regular touchpoints via email increase platform value
- ✅ **Mobile-friendly** - Email is more accessible than web interface
- ✅ **Consolidated insights** - See all watched coins in one digest

**Technical:**
- ✅ **Reduced server load** - Batch processing vs real-time requests
- ✅ **Better resource utilization** - Schedule during off-peak hours
- ✅ **Simpler architecture** - Remove UI page and manual trigger logic
- ✅ **Consistent quality** - Automated analysis ensures regular coverage

**Business:**
- ✅ **Higher perceived value** - Email digests feel premium
- ✅ **Better retention** - Regular emails keep users engaged
- ✅ **Upgrade incentive** - More coins/frequency in higher tiers

### 2.2 Cons of Migration

**User Experience:**
- ❌ **Loss of on-demand analysis** - Can't trigger immediate analysis
- ❌ **Less control** - Users can't choose when to analyze
- ❌ **Email fatigue** - Some users prefer web-only interaction
- ❌ **Delayed insights** - Must wait for next scheduled digest
- ❌ **No real-time feedback** - Can't see results immediately

**Technical:**
- ❌ **Additional complexity** - Need scheduled job infrastructure
- ❌ **Email deliverability** - Spam filters, inbox placement issues
- ❌ **Batch processing overhead** - All users analyzed at once
- ❌ **Rate limiting** - OpenRouter API limits may be exceeded

**Business:**
- ❌ **Feature removal** - Existing users may complain
- ❌ **Competitive disadvantage** - Other platforms may offer real-time analysis
- ❌ **Migration risk** - Potential user churn during transition

### 2.3 Recommendation: Hybrid Approach

**Consider keeping BOTH features:**

1. **Keep AI Analysis page** for on-demand analysis (reduced limits)
2. **Add Email Digest service** for scheduled analysis (new feature)

**Adjusted Limits:**
```
FREE:
  - On-demand AI Analysis: 5/month (reduced from 10)
  - Email Digests: Weekly (1 coin)

PRO:
  - On-demand AI Analysis: 50/month (reduced from 100)
  - Email Digests: Daily (up to 10 coins)

BUSINESS:
  - On-demand AI Analysis: 200/month (reduced from 500)
  - Email Digests: Daily + Weekly (up to 50 coins)
```

This provides the best of both worlds while adding value to subscriptions.

---

## 3. Email Notification Service Design

### 3.1 Digest Types

**Daily Digest** (PRO, BUSINESS)
- Sent every morning at 8 AM user's timezone
- Covers top performing/trending coins in watchlist
- Sentiment changes since yesterday
- Key market events

**Weekly Digest** (FREE, PRO, BUSINESS)
- Sent every Monday at 8 AM
- Comprehensive analysis of all watched coins
- Weekly sentiment trends
- Portfolio performance summary

### 3.2 Email Template Structure

```
Subject: 📊 Your Daily Crypto Sentiment Digest - [Date]

Content:
1. Personal Greeting
2. Market Overview (1-2 sentences)
3. Top Sentiment Changes
   - Coin 1: [Sentiment Score] | [Change] | [AI Summary]
   - Coin 2: [Sentiment Score] | [Change] | [AI Summary]
   - ...
4. Holdings Performance (if applicable)
   - Total Portfolio Value
   - Top Gainer/Loser
5. Call-to-Action
   - View Full Dashboard
   - Manage Watchlist
   - Upgrade Subscription
6. Footer
   - Unsubscribe link
   - Preferences link
```

### 3.3 Database Schema Changes

**New Model: SentimentDigest**
```prisma
model SentimentDigest {
  id        String   @id @default(cuid())
  userId    String
  frequency DigestFrequency // DAILY, WEEKLY
  
  // Digest content (cached)
  sentimentData  Json    // Array of coin analyses
  generatedAt    DateTime
  emailSentAt    DateTime?
  emailStatus    EmailStatus // PENDING, SENT, FAILED
  
  // Metadata
  coinsAnalyzed  Int
  usageConsumed  Int     // Number of AI analysis calls used
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("sentiment_digests")
}

enum DigestFrequency {
  DAILY
  WEEKLY
}

enum EmailStatus {
  PENDING
  SENT
  FAILED
}
```

**Update UserPreferences:**
```prisma
model UserPreferences {
  // ... existing fields ...
  
  // Digest preferences
  sentimentDigestEnabled Boolean @default(true)
  sentimentDigestFrequency DigestFrequency @default(WEEKLY)
  sentimentDigestTime String @default("08:00") // HH:MM format
  sentimentDigestTimezone String @default("UTC")
}
```

### 3.4 Scheduled Job Architecture

**Option 1: Vercel Cron (Recommended for Railway)**
```typescript
// /src/app/api/cron/sentiment-digest/route.ts
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Run digest generation
  await generateSentimentDigests();
  
  return Response.json({ success: true });
}
```

**Option 2: Node-cron (Alternative)**
```typescript
// /src/server/jobs/sentiment-digest.job.ts
import cron from 'node-cron';

export function startSentimentDigestJob() {
  // Run every day at 8 AM UTC
  cron.schedule('0 8 * * *', async () => {
    await generateSentimentDigests();
  });
  
  // Run every Monday at 8 AM UTC for weekly
  cron.schedule('0 8 * * 1', async () => {
    await generateWeeklyDigests();
  });
}
```

### 3.5 Digest Generation Logic

```typescript
// /src/services/sentiment/digest.service.ts
export class SentimentDigestService {
  async generateDailyDigests() {
    // 1. Find users with daily digests enabled
    const users = await prisma.user.findMany({
      where: {
        preferences: {
          sentimentDigestEnabled: true,
          sentimentDigestFrequency: 'DAILY',
        },
        subscription: {
          tier: { in: ['PRO', 'BUSINESS'] }
        }
      },
      include: {
        cryptoTracking: true,
        subscription: true,
      }
    });
    
    // 2. For each user, analyze their coins
    for (const user of users) {
      await this.generateDigestForUser(user, 'DAILY');
    }
  }
  
  async generateDigestForUser(user, frequency) {
    // Check usage limits
    const usageAllowed = await featureGateService.checkUsage(
      user.id,
      UsageType.AI_ANALYSIS
    );
    
    if (!usageAllowed) {
      // User has exceeded limits, skip or send upgrade prompt
      return;
    }
    
    // Analyze top coins based on subscription tier
    const coinLimit = this.getCoinLimitForTier(user.subscription.tier);
    const coinsToAnalyze = user.cryptoTracking.slice(0, coinLimit);
    
    // Generate AI sentiment for each coin
    const analyses = await Promise.all(
      coinsToAnalyze.map(coin => 
        this.analyzeCoinSentiment(coin.crypto.coinGeckoId)
      )
    );
    
    // Create digest record
    const digest = await prisma.sentimentDigest.create({
      data: {
        userId: user.id,
        frequency,
        sentimentData: analyses,
        generatedAt: new Date(),
        coinsAnalyzed: analyses.length,
        usageConsumed: analyses.length,
      }
    });
    
    // Log usage
    await prisma.usageLog.createMany({
      data: analyses.map(() => ({
        userId: user.id,
        type: UsageType.AI_ANALYSIS,
        resource: 'sentiment_digest',
      }))
    });
    
    // Send email
    await this.sendDigestEmail(user, digest);
  }
  
  async sendDigestEmail(user, digest) {
    const emailService = new EmailService();
    
    const html = this.generateDigestEmailHTML(user, digest);
    const subject = this.getDigestSubject(digest.frequency);
    
    await emailService.sendEmail({
      to: user.email,
      subject,
      html,
    });
    
    // Update digest status
    await prisma.sentimentDigest.update({
      where: { id: digest.id },
      data: {
        emailSentAt: new Date(),
        emailStatus: 'SENT',
      }
    });
  }
}
```

---

## 4. Migration Implementation Plan

### Phase 1: Infrastructure Setup (Week 1)

**Tasks:**
1. ✅ Add database models (SentimentDigest, update UserPreferences)
2. ✅ Create Prisma migration
3. ✅ Add cron job endpoint `/api/cron/sentiment-digest`
4. ✅ Implement SentimentDigestService
5. ✅ Add email template for sentiment digests
6. ✅ Configure Railway/Vercel cron trigger
7. ✅ Add environment variables

**Testing:**
- Manual trigger of digest generation
- Test email delivery
- Verify usage tracking

### Phase 2: User Preferences UI (Week 2)

**Tasks:**
1. ✅ Add digest settings to `/profile` page
2. ✅ Create digest preference form
3. ✅ Add timezone selection
4. ✅ Add frequency selection (Daily/Weekly)
5. ✅ Add preview/test digest button
6. ✅ Update user preferences API

**Testing:**
- User can enable/disable digests
- User can change frequency
- User can set preferred time

### Phase 3: Testing & Rollout (Week 3)

**Tasks:**
1. ✅ Test with small user group (beta)
2. ✅ Monitor email deliverability
3. ✅ Collect user feedback
4. ✅ Adjust digest content based on feedback
5. ✅ Gradual rollout to all users

### Phase 4: AI Analysis Page Decision (Week 4)

**Option A: Remove AI Analysis Page**
1. ❌ Remove `/src/app/sentiment` page
2. ❌ Remove navigation link
3. ❌ Remove API endpoint
4. ❌ Archive tests
5. ❌ Update documentation

**Option B: Keep AI Analysis Page (Recommended)**
1. ✅ Reduce usage limits (see Section 2.3)
2. ✅ Update pricing page
3. ✅ Add banner promoting email digests
4. ✅ Keep both features active

**Option C: Hybrid with Paywall**
1. ✅ Make AI Analysis page PRO+ only
2. ✅ FREE users get email digests only
3. ✅ PRO/BUSINESS users get both

---

## 5. Subscription & Pricing Implications

### 5.1 Current Pricing

| Tier | Price | AI Analyses/Month |
|------|-------|-------------------|
| FREE | $0 | 10 |
| PRO | $9 | 100 |
| BUSINESS | $29 | 500 |

### 5.2 Proposed Pricing (Option A: Remove Page)

| Tier | Price | Email Digests | Coins Covered |
|------|-------|---------------|---------------|
| FREE | $0 | Weekly | 1 coin |
| PRO | $9 | Daily | 10 coins |
| BUSINESS | $29 | Daily + Weekly | 50 coins |

### 5.3 Proposed Pricing (Option B: Keep Both - Recommended)

| Tier | Price | On-Demand | Email Digests | Coins in Digest |
|------|-------|-----------|---------------|-----------------|
| FREE | $0 | 5/month | Weekly | 1 coin |
| PRO | $9 | 50/month | Daily | 10 coins |
| BUSINESS | $29 | 200/month | Daily + Weekly | 50 coins |

### 5.4 Feature Gating Strategy

**New Usage Types:**
```typescript
enum UsageType {
  ALERT_CREATION
  AI_ANALYSIS          // Existing - on-demand analysis
  AI_DIGEST_DAILY      // New - daily digest generation
  AI_DIGEST_WEEKLY     // New - weekly digest generation
  WATCHLIST_ADD
  BOT_NOTIFICATION
}
```

**Limits:**
```typescript
FREE: {
  AI_ANALYSIS: 5,
  AI_DIGEST_DAILY: 0,      // Not allowed
  AI_DIGEST_WEEKLY: 1,     // Weekly digest allowed
}
PRO: {
  AI_ANALYSIS: 50,
  AI_DIGEST_DAILY: 1,      // Daily digest allowed
  AI_DIGEST_WEEKLY: 1,     // Weekly digest allowed
}
BUSINESS: {
  AI_ANALYSIS: 200,
  AI_DIGEST_DAILY: 1,
  AI_DIGEST_WEEKLY: 1,
}
```

---

## 6. Technical Requirements

### 6.1 New Services

**SentimentDigestService**
- Location: `/src/services/sentiment/digest.service.ts`
- Responsibilities:
  - Generate digests for users
  - Batch analyze coins
  - Send digest emails
  - Track usage

**DigestTemplateService**
- Location: `/src/services/email/templates/digest.template.ts`
- Responsibilities:
  - Generate HTML email templates
  - Format sentiment data
  - Create personalized content

### 6.2 API Endpoints

**New Endpoints:**
```
GET  /api/cron/sentiment-digest          - Trigger daily digests
GET  /api/cron/sentiment-digest/weekly   - Trigger weekly digests
POST /api/user/digest/preview            - Preview user's digest
GET  /api/user/digest/history            - View past digests
```

**tRPC Procedures:**
```typescript
// In userRouter
updateDigestPreferences: protectedProcedure
  .input(digestPreferencesSchema)
  .mutation(...)

getDigestPreferences: protectedProcedure
  .query(...)

previewDigest: protectedProcedure
  .query(...)
```

### 6.3 Environment Variables

```bash
# Existing
OPENROUTER_API_KEY=sk-or-...
RESEND_API_KEY=re_...

# New
CRON_SECRET=randomly-generated-secret
DIGEST_ENABLED=true
DIGEST_BATCH_SIZE=50                # Process users in batches
DIGEST_MAX_COINS_FREE=1
DIGEST_MAX_COINS_PRO=10
DIGEST_MAX_COINS_BUSINESS=50
```

### 6.4 Cron Configuration

**Railway/Vercel:**
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/sentiment-digest",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/cron/sentiment-digest/weekly",
      "schedule": "0 8 * * 1"
    }
  ]
}
```

---

## 7. Testing Strategy

### 7.1 Unit Tests

**New Test Files:**
```
src/__tests__/services/sentiment/digest.service.test.ts
src/__tests__/services/email/templates/digest.template.test.ts
src/__tests__/api/cron/sentiment-digest.test.ts
src/__tests__/server/api/routers/digest.test.ts
```

**Test Coverage:**
- ✅ Digest generation for all subscription tiers
- ✅ Usage limit enforcement
- ✅ Email template rendering
- ✅ Cron job authentication
- ✅ Error handling (API failures, email failures)
- ✅ User preference updates

### 7.2 Integration Tests

**Scenarios:**
1. Free user receives weekly digest
2. Pro user receives daily digest
3. User exceeds usage limit (no digest sent)
4. User disables digests (no email sent)
5. Digest generation during API outage
6. Email delivery failure retry logic

### 7.3 Manual Testing Checklist

- [ ] Trigger digest manually via API
- [ ] Verify email delivery to test inbox
- [ ] Check spam score of digest emails
- [ ] Test unsubscribe flow
- [ ] Verify timezone handling
- [ ] Test with multiple users simultaneously
- [ ] Monitor OpenRouter API usage
- [ ] Check database performance under load

---

## 8. Rollout Strategy

### 8.1 Beta Phase (Week 1-2)

**Participants:**
- Internal team members
- 10-20 volunteer beta testers
- Users who opted into beta features

**Goals:**
- Validate email deliverability
- Test digest quality/usefulness
- Identify bugs and edge cases
- Gather feedback on content and format

### 8.2 Gradual Rollout (Week 3-4)

**Schedule:**
- Day 1: 10% of PRO users
- Day 3: 25% of PRO users
- Day 5: 50% of PRO users
- Day 7: 100% of PRO users
- Day 10: All BUSINESS users
- Day 14: All FREE users (weekly only)

**Monitoring:**
- Email bounce rates
- Unsubscribe rates
- User engagement (dashboard visits)
- Support ticket volume
- API usage patterns

### 8.3 Success Metrics

**Email Metrics:**
- Open Rate > 25%
- Click-through Rate > 10%
- Unsubscribe Rate < 2%
- Bounce Rate < 5%

**Engagement Metrics:**
- Dashboard visits increase by 15%+
- Time on platform increase by 10%+
- Feature usage increase by 20%+

**Business Metrics:**
- FREE to PRO upgrade rate increase by 10%+
- User retention increase by 5%+
- Churn rate decrease by 3%+

---

## 9. Documentation Updates

### 9.1 User-Facing Documentation

**Update Files:**
- `README.md` - Add email digest feature
- `docs/IMPLEMENTATION_CHECKLIST.md` - Add digest implementation status
- `docs/PRICING_STRATEGY.md` - Update tier features

**Create Files:**
- `docs/EMAIL_DIGEST_USER_GUIDE.md` - How to configure digests
- `docs/EMAIL_DIGEST_FAQ.md` - Common questions

### 9.2 Developer Documentation

**Update Files:**
- `.env.example` - Add new environment variables
- `docs/DEVELOPMENT_SETUP.md` - Add cron setup instructions

**Create Files:**
- `docs/EMAIL_DIGEST_TECHNICAL_GUIDE.md` - Architecture and implementation
- `docs/CRON_JOB_SETUP.md` - Scheduling configuration

### 9.3 Migration Guide (If Removing AI Analysis Page)

**Create File:** `docs/AI_ANALYSIS_PAGE_REMOVAL_GUIDE.md`

Contents:
- Timeline for deprecation
- Feature comparison (old vs new)
- User action required
- FAQ
- Support contact

---

## 10. Risk Assessment & Mitigation

### 10.1 Technical Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Email deliverability issues | High | Medium | Use reputable ESP (Resend), warm up domain, monitor bounce rates |
| OpenRouter API rate limits | High | High | Implement queuing, batch processing, retry logic |
| Database performance issues | Medium | Low | Index digest tables, archive old digests, optimize queries |
| Cron job failures | Medium | Medium | Add monitoring, alerts, manual trigger fallback |

### 10.2 Business Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| User churn from feature removal | High | Medium | Keep both features (hybrid approach) |
| Negative user feedback | Medium | Medium | Beta test first, gather feedback, iterate |
| Increased support load | Low | Medium | Comprehensive FAQ, clear documentation |
| Competitor advantage | Medium | Low | Differentiate with better content, personalization |

### 10.3 Compliance Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| GDPR/CAN-SPAM violations | High | Low | Easy unsubscribe, clear opt-in, respect preferences |
| Email content regulations | Medium | Low | No financial advice disclaimers, educational content only |
| Data retention issues | Low | Low | Auto-delete old digests, GDPR-compliant retention |

---

## 11. Open Questions for Stakeholders

### 11.1 Product Questions

1. **Should we remove the AI Analysis page entirely or keep both features?**
   - Recommendation: Keep both (hybrid approach)
   - Rationale: Provides flexibility, increases perceived value

2. **What should the default digest frequency be for existing users?**
   - Recommendation: Weekly for all, opt-in for daily
   - Rationale: Avoid overwhelming users, respect inbox

3. **Should we offer digest customization (which coins to include)?**
   - Recommendation: Auto-select based on portfolio value/activity
   - Rationale: Simplicity over complexity for v1

4. **How should we handle users with 50+ watched coins?**
   - Recommendation: Prioritize by portfolio value, recent activity, sentiment changes
   - Rationale: Keep emails concise and valuable

### 11.2 Technical Questions

1. **Which scheduling system should we use?**
   - Options: Vercel Cron, Node-cron, Railway scheduled tasks
   - Recommendation: Railway/Vercel native cron
   - Rationale: Simplicity, no additional infrastructure

2. **Should digests be generated in real-time or pre-cached?**
   - Recommendation: Pre-cache overnight, send in batches
   - Rationale: Better performance, easier to debug

3. **How long should we retain digest history?**
   - Recommendation: 90 days, then auto-delete
   - Rationale: Compliance, storage costs

### 11.3 Business Questions

1. **Should email digests be a separate feature or part of existing AI analysis quota?**
   - Recommendation: Separate usage types, separate limits
   - Rationale: Clearer value proposition, easier to monetize

2. **Should we charge extra for premium digest features?**
   - Options: More coins, higher frequency, custom scheduling
   - Recommendation: Include in existing tiers for v1
   - Rationale: Simplicity, competitive advantage

3. **How should we communicate this change to existing users?**
   - Recommendation: Email announcement, in-app banner, blog post
   - Rationale: Transparency, manage expectations

---

## 12. Next Steps & Action Items

### 12.1 Immediate Actions (This Week)

1. **Gather Stakeholder Feedback**
   - [ ] Share this document with product team
   - [ ] Review with engineering team
   - [ ] Present to executive stakeholders
   - [ ] Collect user feedback (survey to active users)

2. **Make Go/No-Go Decision**
   - [ ] Option A: Remove AI Analysis page
   - [ ] Option B: Keep both features (Recommended)
   - [ ] Option C: Defer to later date

3. **Finalize Scope**
   - [ ] Confirm subscription tier features
   - [ ] Approve digest template designs
   - [ ] Define success metrics
   - [ ] Set timeline and milestones

### 12.2 If Approved: Implementation Actions

**Week 1: Foundation**
- [ ] Database schema changes and migration
- [ ] SentimentDigestService implementation
- [ ] Email template development
- [ ] Unit tests for new services

**Week 2: Integration**
- [ ] Cron job endpoint and scheduling
- [ ] User preferences UI
- [ ] tRPC procedures
- [ ] Integration tests

**Week 3: Testing**
- [ ] Internal beta testing
- [ ] External beta with volunteers
- [ ] Load testing
- [ ] Security review

**Week 4: Launch**
- [ ] Gradual rollout
- [ ] Monitor metrics
- [ ] Gather feedback
- [ ] Iterate on content

---

## 13. Conclusion

The proposed migration from AI Analysis page to email notification service represents a significant product shift with both opportunities and risks. The **recommended approach** is a **hybrid model** that:

1. **Keeps the AI Analysis page** for on-demand analysis (reduced limits)
2. **Adds email digests** as a new premium feature
3. **Provides both options** to users based on their subscription tier

This approach:
- ✅ Reduces risk of user churn
- ✅ Increases perceived value of subscriptions
- ✅ Provides flexibility for different user preferences
- ✅ Creates upsell opportunities (FREE users see value in PRO daily digests)
- ✅ Maintains competitive advantage

**Next Step:** Await stakeholder feedback and decision on which approach to pursue.

---

**Document Version:** 1.0  
**Last Updated:** October 2025  
**Author:** CryptoSentiment Development Team  
**Status:** Awaiting Review
