# Watchlist & Portfolio Integration Plan

## Overview
This document outlines the plan to combine the watchlist and portfolio functionality into a unified, logical crypto management system that provides users with a seamless experience for tracking both their investments and cryptocurrencies of interest.

## Current State Analysis

### Existing Components
- **Watchlist (`/watchlist`)**: Track cryptocurrencies of interest without owning them
- **Portfolio (`/portfolio`)**: Manage actual cryptocurrency holdings with purchase data
- **Dashboard (`/dashboard`)**: Shows overview of both watchlist and portfolio

### Current Database Models
- `FollowedCoin`: Tracks which cryptos users are watching
- `PortfolioHolding`: Tracks actual owned cryptocurrency amounts with purchase details
- `Cryptocurrency`: Master table for all crypto data

### Current Issues
1. **Duplicate Functionality**: Both watchlist and portfolio track similar cryptocurrencies
2. **UX Confusion**: Users don't understand the difference between "following" and "holding"
3. **Data Isolation**: No clear path from watchlist → portfolio or vice versa
4. **Dashboard Complexity**: Shows both concepts separately, creating cognitive load

## Proposed Solution: Unified Crypto Manager

### Core Concept
Create a single "Crypto Manager" that handles both tracking (watchlist) and holding (portfolio) in one unified interface, where users can:

1. **Add cryptos to track** (watchlist behavior)
2. **Convert tracked cryptos to holdings** (add purchase details)
3. **Track performance** of both watched and owned cryptos
4. **Manage everything in one place** with clear visual distinctions

### User Mental Model
```
📊 My Cryptos
├── 🔍 Watching Only (no holdings)
│   ├── Bitcoin (BTC) - Track price movements
│   └── Ethereum (ETH) - Researching for purchase
├── 💰 Owned Holdings (with purchase data)
│   ├── Solana (SOL) - 10.5 SOL @ $95 avg
│   └── Cardano (ADA) - 1,000 ADA @ $0.45 avg
└── 📈 All Combined - Portfolio + Watchlist insights
```

## Implementation Plan

### Phase 1: Data Model Enhancement (Week 1)

#### 1.1 Database Schema Updates
**File**: `/prisma/schema.prisma`

**Changes**:
- Enhance `FollowedCoin` model to include portfolio-like fields (optional)
- Add migration to combine existing data
- Create views for backward compatibility

```prisma
model CryptoTracking {
  id       String @id @default(cuid())
  userId   String
  cryptoId String

  // Tracking settings
  isWatching Boolean @default(true)  // Always true - everyone tracks
  
  // Portfolio holdings (optional - null means watching only)
  holdingAmount    Float?    // Amount owned (null = watching only)
  averagePurchasePrice Float? // Average cost basis
  totalInvested    Float?    // Total USD invested
  firstPurchaseDate DateTime? // When first purchased
  
  // Tracking metadata
  addedAt     DateTime @default(now())
  notes       String?
  tags        String[] // ["DeFi", "Research", "Long-term"]
  
  // Performance tracking
  lastViewedAt DateTime @default(now())
  priceAlerts  Json[]   // Alert configurations
  
  user   User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  crypto Cryptocurrency @relation(fields: [cryptoId], references: [id], onDelete: Cascade)

  @@unique([userId, cryptoId])
  @@map("crypto_tracking")
}

// Keep old models for migration period
model FollowedCoin {
  // ... existing fields
  migratedToCryptoTracking Boolean @default(false)
}

model PortfolioHolding {
  // ... existing fields  
  migratedToCryptoTracking Boolean @default(false)
}
```

#### 1.2 Migration Strategy
**File**: `/prisma/migrations/xxx_create_crypto_tracking.sql`

**Steps**:
1. Create new `CryptoTracking` table
2. Migrate `FollowedCoin` data (watching only)
3. Migrate `PortfolioHolding` data (with holdings)
4. Handle duplicates (user following + holding same crypto)
5. Mark old records as migrated
6. Create database views for backward compatibility

### Phase 2: API Enhancement (Week 2)

#### 2.1 New tRPC Endpoints
**File**: `/src/server/api/routers/crypto.ts`

**New Endpoints**:
```typescript
// Unified crypto management
addCryptoToTracking: protectedProcedure
  .input(z.object({
    cryptoSymbol: z.string(),
    trackingType: z.enum(['WATCH_ONLY', 'ADD_HOLDING']),
    // Optional holding data
    holdingAmount: z.number().positive().optional(),
    purchasePrice: z.number().positive().optional(),
    purchaseDate: z.date().optional(),
    notes: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }))

updateCryptoTracking: protectedProcedure
  .input(z.object({
    id: z.string(),
    // Can convert from watching to holding or vice versa
    trackingType: z.enum(['WATCH_ONLY', 'ADD_HOLDING', 'REMOVE_HOLDING']),
    // Holdings data
    holdingAmount: z.number().positive().optional(),
    purchasePrice: z.number().positive().optional(),
    notes: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }))

getUserCryptoTracking: protectedProcedure
  .input(z.object({
    filter: z.enum(['ALL', 'WATCHING_ONLY', 'HOLDINGS_ONLY']).default('ALL'),
    includePerformance: z.boolean().default(true),
  }))

// Backward compatibility
getFollowedCryptos: protectedProcedure // Returns all tracked (for old components)
getPortfolioHoldings: protectedProcedure // Returns only holdings (for old components)
```

#### 2.2 Legacy API Compatibility
**Approach**: Keep old endpoints working during transition
- `getFollowedCryptos` → filters `CryptoTracking` where `isWatching = true`
- `getPortfolioHoldings` → filters `CryptoTracking` where `holdingAmount IS NOT NULL`
- Old mutations → internal calls to new unified endpoints

### Phase 3: Component Architecture (Week 3)

#### 3.1 New Unified Component
**File**: `/src/components/crypto/CryptoManager.tsx`

**Features**:
```tsx
interface CryptoManagerProps {
  defaultView?: 'all' | 'watching' | 'holdings'
  allowToggleView?: boolean
  showPerformance?: boolean
}

// Sections:
// 1. Filter/View Controls (All | Watching | Holdings)
// 2. Add Crypto (with immediate choice: Watch or Buy)
// 3. Crypto List (unified view with different card types)
// 4. Bulk Actions (Convert to holdings, Set alerts, etc.)
```

#### 3.2 Card Types
**Watching Card**:
```tsx
CryptoWatchingCard:
- Crypto info + current price
- Performance indicators  
- Quick actions: [Buy] [Set Alert] [Remove]
- Convert to holding with "Record Purchase" button
```

**Holdings Card**:
```tsx
CryptoHoldingCard:
- Crypto info + current price
- Holdings: "10.5 SOL @ $95 avg ($1,000 total)"
- Performance: Current value, P&L, % change
- Quick actions: [Add More] [Sell Some] [Set Alert] [Remove All]
- Convert to watching with "Sell All" → "Keep Watching"
```

#### 3.3 Migration Components
**Files**: 
- `/src/components/crypto/MigrationNotice.tsx` - One-time user notification
- `/src/components/crypto/DataMigrationHelper.tsx` - Bulk migration tool

### Phase 4: Page Restructuring (Week 4)

#### 4.1 New Page Structure
```
/crypto -> Main unified crypto management
/watchlist -> Redirect to /crypto?view=watching (with notice)
/portfolio -> Redirect to /crypto?view=holdings (with notice)  
/dashboard -> Updated to use unified data
```

#### 4.2 URL Strategy
**Primary URL**: `/crypto`
**Query Parameters**:
- `?view=all|watching|holdings` - Filter view
- `?add=SYMBOL` - Deep link to add specific crypto
- `?mode=portfolio` - Emphasize holdings view

**Legacy URLs** (Phase out over 3 months):
- `/watchlist` → `/crypto?view=watching`
- `/portfolio` → `/crypto?view=holdings`

#### 4.3 Navigation Updates
**File**: `/src/components/ui/navbar.tsx`

**Changes**:
```tsx
// Replace separate Watchlist + Portfolio links
<NavLink href="/crypto">
  My Cryptos
  <Badge>{totalTrackedCount}</Badge>
</NavLink>

// Sub-navigation in dropdown or tabs
- All Cryptos (watching + holdings)
- Watching ({watchingCount})
- Holdings ({holdingsCount})
```

### Phase 5: Dashboard Integration (Week 5)

#### 5.1 Unified Dashboard Data
**File**: `/src/app/dashboard/page.tsx`

**Enhancements**:
```tsx
// Single data source for all crypto-related info
const { data: cryptoTracking } = api.crypto.getUserCryptoTracking.useQuery({
  filter: 'ALL',
  includePerformance: true
})

// Separate into holdings vs watching for display
const holdings = cryptoTracking?.filter(c => c.holdingAmount)
const watching = cryptoTracking?.filter(c => !c.holdingAmount)
```

#### 5.2 Dashboard Layout
**Sections**:
1. **Portfolio Summary** (if holdings exist)
   - Total value, P&L, top performers
2. **Market Overview** (watching + holdings combined)
   - Price movements, alerts, opportunities
3. **Quick Actions**
   - Add crypto, set alerts, view analysis
4. **Recent Activity**
   - New additions, recent price movements, triggered alerts

#### 5.3 Empty State Strategy
**Progressive Disclosure**:
1. **New User**: "Add your first crypto" → choice of Watch or Buy
2. **Watching Only**: Encourage first purchase with education
3. **Holdings Only**: Suggest watching related cryptos
4. **Advanced User**: Power features (bulk actions, analytics)

### Phase 6: Advanced Features (Week 6+)

#### 6.1 Smart Suggestions
- **"Watching → Buying"**: Suggest purchase when watching crypto performs well
- **"Similar Cryptos"**: Recommend related cryptos based on holdings
- **"Diversification"**: Suggest balance improvements

#### 6.2 Bulk Operations
- **Migrate Data**: One-click conversion from old structure
- **Set Alerts**: Bulk alert creation for all holdings/watching
- **Export Data**: Portfolio reports, tax documents

#### 6.3 Enhanced Analytics
- **Combined Performance**: How watching list correlates with holdings
- **Opportunity Scoring**: Which watched cryptos to consider buying
- **Risk Analysis**: Portfolio concentration and suggestions

## Migration Strategy

### User Communication Plan

#### 6.1 Migration Notice
**Timeline**: Week 1 (with database changes)
```tsx
<MigrationNotice>
  🎉 We've improved crypto management! 
  Your watchlist and portfolio are now combined in one place.
  [See What's New] [Continue to My Cryptos]
</MigrationNotice>
```

#### 6.2 Feature Education
**Progressive disclosure during first visits**:
1. **Tour**: "Now you can watch AND own cryptos in one place"
2. **Quick Actions**: Highlight convert buttons and new features
3. **Help Center**: Updated documentation and videos

#### 6.3 Legacy Support
**Graceful Degradation**:
- Old URLs redirect with explanatory messages
- Old bookmarks work but show migration notice
- API backward compatibility for 3 months minimum

### Technical Migration Steps

#### Week 1: Database + API
1. ✅ Create new schema
2. ✅ Write migration scripts
3. ✅ Deploy new API endpoints
4. ✅ Test data migration in staging
5. 🔄 Deploy to production with feature flag

#### Week 2: Components
1. ✅ Build CryptoManager component
2. ✅ Create card components
3. ✅ Add migration notices
4. ✅ Test integration with existing data

#### Week 3: Pages
1. ✅ Create new /crypto page
2. ✅ Set up redirects from old pages
3. ✅ Update navigation
4. ✅ Deploy with gradual rollout

#### Week 4: Dashboard
1. ✅ Update dashboard to use unified data
2. ✅ Enhance user experience
3. ✅ Add advanced features
4. ✅ Complete rollout

#### Week 5: Cleanup
1. ✅ Remove old components (gradual)
2. ✅ Clean up API endpoints
3. ✅ Update documentation
4. ✅ Plan database cleanup (3 months later)

## Success Metrics

### User Experience
- **Reduced Confusion**: Survey showing understanding of watch vs own
- **Increased Engagement**: More crypto additions, more feature usage
- **Conversion Rate**: Watching → Holdings conversion increases

### Technical
- **Performance**: Page load times maintain or improve
- **Data Integrity**: Zero data loss during migration
- **API Usage**: Successful transition to new endpoints

### Business
- **Feature Adoption**: Higher usage of portfolio features
- **User Retention**: Users stay engaged with combined experience
- **Support Tickets**: Reduced confusion-related support requests

## Risk Mitigation

### Data Migration Risks
- **Backup Strategy**: Full database backup before migration
- **Rollback Plan**: Ability to revert to old schema if needed
- **Testing**: Extensive testing with production data copies

### User Experience Risks
- **Progressive Rollout**: Gradual migration with user feedback
- **Legacy Support**: Keep old endpoints working during transition
- **Clear Communication**: User education and migration assistance

### Technical Risks
- **API Compatibility**: Maintain backward compatibility
- **Performance**: Monitor and optimize new queries
- **Feature Parity**: Ensure no functionality is lost

## Timeline Summary

| Week | Focus | Deliverables |
|------|-------|--------------|
| 1 | Database & API | New schema, migrations, unified endpoints |
| 2 | Core Components | CryptoManager, card components, migration helpers |
| 3 | Page Integration | New /crypto page, redirects, navigation updates |
| 4 | Dashboard Enhancement | Unified dashboard, improved UX |
| 5 | Advanced Features | Smart suggestions, bulk operations |
| 6+ | Optimization | Performance, analytics, user feedback incorporation |

## Next Steps

### Immediate Actions (This Week)
1. **Review and Approve Plan**: Get stakeholder sign-off
2. **Create Feature Branch**: `feature/unified-crypto-management`
3. **Database Design**: Finalize schema and migration strategy
4. **Component Mockups**: Design unified interface mockups

### Following Week
1. **Begin Implementation**: Start with database migration
2. **User Research**: Test concepts with existing users
3. **Technical Setup**: API endpoints and initial components

This plan provides a comprehensive approach to combining watchlist and portfolio functionality while maintaining data integrity and providing users with a superior experience for managing their cryptocurrency interests and investments.