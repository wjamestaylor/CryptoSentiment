# Subscription Tier Limits

This document defines the feature limits for each subscription tier. These limits are enforced throughout the application.

## Limit Sources

The canonical source of truth for subscription limits is:
- **Primary**: `src/services/subscription/subscription.service.ts` - `getSubscriptionLimits()` method
- **Backup**: `src/services/feature-gate/feature-gate.service.ts` - Hardcoded limits (should match primary)

## Current Limits

### FREE Tier

| Feature | Limit | Notes |
|---------|-------|-------|
| Watchlist | 10 coins | Total tracked cryptocurrencies |
| Alerts | 5 alerts | Price and sentiment alerts |
| AI Analysis | 5 per month | Sentiment analysis requests |
| Bot Notifications | 0 | No Discord/Telegram notifications |

### PRO Tier

| Feature | Limit | Notes |
|---------|-------|-------|
| Watchlist | 100 coins | Total tracked cryptocurrencies |
| Alerts | 50 alerts | All alert types |
| AI Analysis | 100 per month | Priority queue |
| Bot Notifications | 50 per month | Discord OR Telegram |

### BUSINESS Tier

| Feature | Limit | Notes |
|---------|-------|-------|
| Watchlist | Unlimited (-1) | No restrictions |
| Alerts | Unlimited (-1) | No restrictions |
| AI Analysis | 1000 per month | Large quota |
| Bot Notifications | Unlimited (-1) | Discord AND Telegram |

## Implementation Details

### Watchlist Counting

The watchlist limit counts **all CryptoTracking entries**, including:
- Watch-only coins (isWatching = true, holdingAmount = null)
- Portfolio holdings (holdingAmount > 0)

This is implemented in `FeatureGateService.canAddToWatchlist()` which counts `CryptoTracking` table rows, not `UsageLog` entries.

### Alert Counting

Alert limits count active alerts per user. Deleted/expired alerts don't count toward the limit.

### AI Analysis Counting

AI analysis uses `UsageLog` entries with `type = AI_ANALYSIS` to track monthly usage. Resets on the 1st of each month.

### Bot Notification Counting

Bot notifications use `UsageLog` entries with `type = BOT_NOTIFICATION` to track monthly usage. FREE tier has 0 limit (no bot access).

## Unlimited Tier Handling

Unlimited tiers are represented by `-1` in the database. All limit checking functions must handle this:

```typescript
// Correct unlimited handling
const allowed = limit === -1 || currentUsage < limit;
```

## UI Display

Limits are displayed in the UI using the format `{currentUsage}/{limit}`:
- FREE tier: "5/10 coins"
- PRO tier: "25/100 coins"
- BUSINESS tier: "∞" (unlimited)

## Testing

All limit-related tests are in:
- `src/__tests__/services/feature-gate/feature-gate.service.test.ts`
- `src/__tests__/services/feature-gating/feature-gate.service.test.ts`
- `src/__tests__/app/api/usage/limit/route.test.ts`

## Recent Changes

**2025-01-XX**: Fixed bug where FREE tier watchlist showed 50 instead of 10
- Updated API route to use correct FeatureGateService
- Aligned hardcoded limits with SubscriptionService
- Updated pricing page to show accurate limits
