# Onboarding Flow Documentation

## Overview

The CryptoSentiment onboarding flow is a comprehensive, 4-step wizard designed to guide new users through their first interaction with the platform. The flow ensures users understand key features and helps them get started quickly with crypto tracking and alerts.

## Features

### 1. Database-Tracked Progress
- Onboarding state is stored in the database, not localStorage
- Progress persists across devices and sessions
- Users can resume onboarding where they left off

### 2. Multi-Step Wizard
The onboarding consists of 4 carefully designed steps:

#### Step 1: Welcome & Introduction
- Overview of platform features
- Highlights key benefits:
  - AI-powered sentiment analysis
  - Smart price alerts
  - Portfolio tracking with analytics

#### Step 2: Crypto Selection
- Interactive cryptocurrency browser
- Search functionality to find specific coins
- Select up to 5 cryptocurrencies to track
- Real-time price data displayed
- 24h price change indicators

#### Step 3: Alert Configuration
- Optional alert setup for first tracked crypto
- Configurable price change threshold
- Percentage-based alerts
- Email notification preference

#### Step 4: Feature Tour
- Quick overview of platform sections:
  - Dashboard
  - AI Sentiment Analysis
  - Alerts
  - Analytics
- Pro tips for getting started

### 3. User Flow Options
- **Complete**: User goes through all steps and saves preferences
- **Skip**: User can skip onboarding at any time
- **Resume**: User can return to incomplete onboarding later

### 4. Accessibility
- Full keyboard navigation support
- ARIA labels for screen readers
- Responsive design (mobile, tablet, desktop)
- Clear visual progress indicators

## Technical Implementation

### Database Schema

```prisma
model User {
  // ... other fields
  onboardingCompleted Boolean @default(false)
  onboardingStep      Int     @default(0)
  onboardingCompletedAt DateTime?
}
```

### tRPC API Endpoints

Located in: `src/server/api/routers/onboarding.ts`

#### `getStatus`
Get the current onboarding status for authenticated user.

**Returns:**
```typescript
{
  completed: boolean;
  currentStep: number;
  completedAt: Date | null;
  shouldShowOnboarding: boolean;
}
```

#### `updateStep`
Update the current step number.

**Input:**
```typescript
{
  step: number; // 0-10
}
```

#### `complete`
Mark onboarding as completed.

**Returns:**
```typescript
{
  completed: true;
  completedAt: Date;
}
```

#### `skip`
Skip onboarding (marks as completed with step -1).

**Returns:**
```typescript
{
  completed: true;
}
```

#### `reset`
Reset onboarding status (useful for testing or re-onboarding).

**Returns:**
```typescript
{
  completed: false;
  currentStep: 0;
}
```

### Component Usage

The `OnboardingWizard` component is automatically rendered in the main app layout (`src/app/layout.tsx`):

```tsx
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <TRPCProvider>
              <OnboardingWizard />
              {children}
            </TRPCProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

The component automatically:
- Checks if user needs onboarding
- Shows modal when appropriate
- Handles all user interactions
- Saves progress to database

### Integration with Other Features

#### Crypto Tracking
Selected cryptocurrencies are added using the `addCryptoToTracking` mutation:

```typescript
await addCryptoMutation.mutateAsync({
  cryptoSymbol: crypto.symbol,
  cryptoName: crypto.name,
  trackingType: 'WATCH_ONLY',
  notes: 'Added during onboarding',
});
```

#### Alerts
Optional alert created using the `createAlert` mutation:

```typescript
await createAlertMutation.mutateAsync({
  cryptoSymbol: firstCrypto.symbol,
  cryptoName: firstCrypto.name,
  type: 'PRICE_CHANGE',
  condition: {
    priceThreshold: parseFloat(alertThreshold),
    percentage: true,
    direction: 'above',
  },
});
```

## Testing

### Unit Tests
Located in: `src/__tests__/components/onboarding/OnboardingWizard.test.tsx`

Tests cover:
- Initial render with correct step
- Progress indicator functionality
- Step navigation (next/previous)
- Skip functionality
- Accessibility (ARIA labels, keyboard navigation)
- Responsive design classes

### Router Tests
Located in: `src/__tests__/server/routers/onboarding.test.ts`

Tests cover:
- Getting onboarding status
- Updating step progress
- Completing onboarding
- Skipping onboarding
- Resetting onboarding

### Running Tests
```bash
# Run all onboarding tests
npm test -- --testPathPatterns=onboarding

# Run with coverage
npm test -- --testPathPatterns=onboarding --coverage
```

## Analytics & Metrics

### Tracked Events
The onboarding flow can track the following metrics (to be implemented):

1. **Onboarding Started**: When user first sees wizard
2. **Step Completed**: Each step completion with timestamp
3. **Onboarding Completed**: Full completion with:
   - Number of cryptos selected
   - Alert configured (yes/no)
   - Time spent on onboarding
4. **Onboarding Skipped**: When user skips, and at which step
5. **Crypto Selected**: Each cryptocurrency added during onboarding
6. **Alert Created**: Alert configuration during onboarding

### Usage Logs
Integration with existing `UsageLog` system:

```typescript
// Example usage tracking
trackUsage(UsageType.WATCHLIST_ADD, {
  action: 'onboarding',
  cryptoSymbol: crypto.symbol,
  source: 'onboarding-wizard',
});
```

## Future Enhancements

### Planned Features
1. **Personalized Recommendations**: Suggest cryptocurrencies based on user preferences
2. **Video Tutorials**: Embedded video guides for each step
3. **Interactive Tooltips**: In-app tooltips that highlight features
4. **Progress Saving**: Auto-save progress every 30 seconds
5. **Email Follow-up**: Send onboarding completion email with tips
6. **A/B Testing**: Test different onboarding flows for optimization

### Metrics to Track
1. **Conversion Rate**: % of users who complete onboarding
2. **Drop-off Points**: Which step users abandon most
3. **Time to Complete**: Average time spent on onboarding
4. **Feature Adoption**: % of users who use features introduced in onboarding
5. **Retention**: Compare retention of users who completed vs. skipped onboarding

## Troubleshooting

### Common Issues

#### Onboarding doesn't show up
- Check if user's `onboardingCompleted` is false in database
- Verify authentication status
- Check browser console for errors

#### Steps not saving
- Verify database connection
- Check tRPC router is properly configured
- Ensure mutations are being called correctly

#### Cryptos not being added
- Verify `addCryptoToTracking` mutation is working
- Check user has permissions to add cryptos
- Review feature gating limits

### Debug Mode

To reset onboarding for a user (useful for testing):

```typescript
// In browser console or via tRPC client
await api.onboarding.reset.mutate();
```

Or directly in database:
```sql
UPDATE users 
SET onboarding_completed = false, 
    onboarding_step = 0, 
    onboarding_completed_at = NULL 
WHERE id = 'user-id';
```

## Best Practices

### When to Show Onboarding
- Show immediately on first login
- Don't show again after completion
- Allow users to manually trigger from settings
- Consider showing abbreviated version for returning users

### Step Design
- Keep steps focused and simple
- Limit choices to prevent decision fatigue
- Provide clear value proposition at each step
- Allow users to skip if they want

### Performance
- Lazy load cryptocurrency list
- Cache frequently accessed data
- Minimize API calls during navigation
- Optimize images and animations

## Maintenance

### Updating Steps
To add or modify steps:

1. Update `TOTAL_STEPS` constant in `OnboardingWizard.tsx`
2. Add new step content in `renderStep()` switch statement
3. Update tests to reflect new step
4. Update this documentation

### Database Migrations
When updating schema:

```bash
# Create migration
npx prisma migrate dev --name update_onboarding

# Apply to production
npx prisma migrate deploy
```

## Support

For questions or issues:
- Check existing tests for usage examples
- Review component implementation
- Consult tRPC router documentation
- Create an issue in the repository

---

**Last Updated**: October 25, 2025
**Version**: 1.0.0
**Maintainer**: CryptoSentiment Team
