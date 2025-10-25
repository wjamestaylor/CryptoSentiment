# Admin Analytics Dashboard Setup Guide

## Overview

The Admin Analytics Dashboard provides comprehensive usage metrics and insights for data-driven optimization of the CryptoSentiment platform. This dashboard is restricted to users with the `ADMIN` role.

## Features

### Dashboard Metrics

#### Overview Stats
- **Total Users**: All registered users on the platform
- **Active Users (30d)**: Users with recent session activity
- **Active Subscriptions**: Count of paid subscriptions
- **Total Alerts**: Active alert configurations
- **Subscription Breakdown**: Distribution across FREE, PRO, and BUSINESS tiers

#### Activation Funnel
Tracks user progression through key activation steps:
1. Signed Up
2. Completed Onboarding
3. Added Crypto
4. Created Alert
5. Subscribed

#### Conversion Metrics
- Total users vs. paid users
- Overall conversion rate (%)
- Tier distribution (PRO vs. BUSINESS)
- Conversion percentage by tier

#### Retention Analysis
Cohort-based retention tracking:
- Day 7 retention
- Day 14 retention
- Day 30 retention

#### Feature Usage
- Usage count by feature type (ALERT_CREATION, AI_ANALYSIS, WATCHLIST_ADD, BOT_NOTIFICATION)
- Unique users per feature
- Daily usage trends

### Time Range Selection
All metrics can be viewed across different timeframes:
- Last 7 days
- Last 30 days
- Last 60 days
- Last 90 days

## Setup Instructions

### 1. Database Migration

After pulling the latest code, run the database migration to add the `role` field to the User model:

```bash
# Generate Prisma client
npm run db:generate

# Apply migration to database
npm run db:migrate
```

The migration adds:
- `UserRole` enum with `USER` and `ADMIN` values
- `role` field to `User` model (defaults to `USER`)

### 2. Creating Admin Users

#### Option A: Via Database (Recommended)

Connect to your PostgreSQL database and update a user's role:

```sql
-- Update a specific user to admin by email
UPDATE users 
SET role = 'ADMIN' 
WHERE email = 'admin@example.com';

-- Verify the update
SELECT id, email, role 
FROM users 
WHERE role = 'ADMIN';
```

#### Option B: Via Prisma Studio

1. Open Prisma Studio:
   ```bash
   npm run db:studio
   ```

2. Navigate to the `users` table
3. Find the user you want to make an admin
4. Edit the `role` field and change it to `ADMIN`
5. Save the changes

### 3. Accessing the Dashboard

1. Log in with an admin user account
2. Navigate to `/admin/analytics`
3. If you're not an admin, you'll see an "Access Denied" message

## API Endpoints

All admin endpoints are protected by the `adminProcedure` middleware which validates the user's role.

### Available tRPC Endpoints

```typescript
// Get overview statistics
api.admin.getOverviewStats.useQuery()

// Get activation funnel metrics
api.admin.getUserActivationFunnel.useQuery({ days: 30 })

// Get conversion rates
api.admin.getConversionRates.useQuery({ days: 30 })

// Get retention metrics
api.admin.getRetentionMetrics.useQuery({ cohortDays: 30 })

// Get feature usage analytics
api.admin.getFeatureUsage.useQuery({ days: 30 })

// Get user growth trends
api.admin.getUserGrowth.useQuery({ days: 90 })

// Get recent user activity
api.admin.getRecentActivity.useQuery({ limit: 20 })
```

### Input Validation

All endpoints use Zod validation:
- `days`: Number between 1-90 (some endpoints allow up to 365)
- `cohortDays`: Number between 7-90
- `limit`: Number between 1-100

## Security

### Role-Based Access Control

The admin dashboard implements multiple layers of security:

1. **Database-level**: Role stored in the User table
2. **API-level**: `adminProcedure` middleware validates role from database
3. **Frontend-level**: Page component checks session role
4. **Session-level**: Role included in NextAuth session object

### Access Control Flow

```
User Request → NextAuth Session → Page Role Check → Component Render
                                       ↓
                                   UNAUTHORIZED → Access Denied Message
                                       ↓
                                    ADMIN → Load Dashboard → API Calls
                                                                ↓
                                                     adminProcedure Check
                                                                ↓
                                                    FORBIDDEN → Error Message
                                                                ↓
                                                    ADMIN → Return Data
```

### Unauthorized Access Handling

- Non-admin users see a user-friendly "Access Denied" message
- API endpoints return a FORBIDDEN error (403)
- No sensitive data is exposed to non-admin users

## Monitoring & Metrics

### Key Performance Indicators

Track these metrics to assess platform health:

1. **User Activation Rate**: Percentage of users completing onboarding
2. **Conversion Rate**: Free-to-paid conversion percentage
3. **Retention Rate**: Users active at Day 7, 14, and 30
4. **Feature Adoption**: Most and least used features
5. **Growth Rate**: Daily new user signups

### Using the Dashboard for Optimization

#### Identify Activation Bottlenecks
Look at the activation funnel to see where users drop off:
- Low "Completed Onboarding" %? → Improve onboarding UX
- Low "Added Crypto" %? → Simplify crypto addition flow
- Low "Created Alert" %? → Better alert feature discovery

#### Improve Conversion
Analyze conversion metrics to increase revenue:
- Compare tier distribution to understand preferences
- Track conversion rate trends over time
- Identify features that drive conversion

#### Boost Retention
Use cohort analysis to improve user retention:
- Compare retention across different cohorts
- Identify when users typically churn
- Correlate retention with feature usage

#### Optimize Features
Feature usage data helps prioritize development:
- Focus on high-usage features for improvement
- Consider deprecating low-usage features
- Identify features that drive engagement

## Troubleshooting

### Issue: "Access Denied" for Admin User

**Solution**:
1. Verify the user's role in the database:
   ```sql
   SELECT email, role FROM users WHERE email = 'your-admin-email@example.com';
   ```
2. Ensure the role is set to `ADMIN` (case-sensitive)
3. Clear browser cookies and log in again
4. Check browser console for any session errors

### Issue: Dashboard Shows "Loading" Indefinitely

**Solution**:
1. Check browser console for API errors
2. Verify database connection is working
3. Ensure Prisma client is generated: `npm run db:generate`
4. Check that admin router is registered in `src/server/api/root.ts`

### Issue: Empty or Missing Data

**Solution**:
1. Verify there is data in the database (users, subscriptions, etc.)
2. Check the selected timeframe - try a longer range
3. Review database indexes for performance issues
4. Check server logs for query errors

## Development

### Adding New Metrics

To add a new admin metric:

1. **Create the endpoint** in `src/server/api/routers/admin.ts`:
   ```typescript
   getNewMetric: adminProcedure
     .input(z.object({ days: z.number().min(1).max(90).default(30) }))
     .query(async ({ ctx, input }) => {
       // Query database
       // Return formatted data
     })
   ```

2. **Add to frontend** in `src/components/admin/AdminDashboard.tsx`:
   ```typescript
   const newMetricQuery = api.admin.getNewMetric.useQuery({ days: timeframe });
   ```

3. **Create visualization** component as needed

4. **Add tests** in `src/__tests__/server/api/routers/admin.test.ts`:
   ```typescript
   it('should validate getNewMetric input', () => {
     const schema = z.object({ days: z.number().min(1).max(90) });
     expect(schema.parse({ days: 30 })).toEqual({ days: 30 });
   });
   ```

### Testing

Run admin-specific tests:
```bash
# Backend tests
npm test -- src/__tests__/server/api/routers/admin.test.ts

# Frontend tests
npm test -- src/__tests__/components/admin/AdminDashboard.test.tsx

# All tests
npm test
```

## Best Practices

1. **Data Privacy**: Never expose individual user PII in admin dashboard
2. **Performance**: Use database indexes for frequently queried fields
3. **Caching**: Consider caching expensive queries for better performance
4. **Monitoring**: Set up alerts for anomalous metrics (sudden drops/spikes)
5. **Regular Review**: Check dashboard metrics weekly for insights

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the implementation in the codebase
3. Open a GitHub issue with details about the problem

## References

- tRPC Documentation: https://trpc.io/
- Prisma Schema: `/prisma/schema.prisma`
- Admin Router: `/src/server/api/routers/admin.ts`
- Admin Middleware: `/src/server/api/trpc.ts`
- Dashboard Component: `/src/components/admin/AdminDashboard.tsx`
- Admin Page: `/src/app/admin/analytics/page.tsx`
