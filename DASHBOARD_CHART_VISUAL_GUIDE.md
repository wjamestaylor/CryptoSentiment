# Dashboard Price Chart - Visual Guide

## UI Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Dashboard                                                       │
│ Track your cryptocurrency portfolio and market insights        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ [Portfolio Stats Cards - 4 cards in a row]                     │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ My Cryptocurrencies | Quick Actions                            │
│ [List of coins]     | [Action buttons]                         │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Price Chart                                                     │
│ Switch between watched and held coins                          │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ ┌─────────────┬─────────────┐        [30D ▼] [🔄]        ││
│ │ │  👁 Watched(2) │ 💼 Held(1)  │                           ││
│ │ └─────────────┴─────────────┘                              ││
│ │                                                             ││
│ │ ┌──────────┬──────────┬──────────┬──────────┐            ││
│ │ │   BTC    │   ETH    │          │          │            ││
│ │ │ Bitcoin  │ Ethereum │          │          │            ││
│ │ │ $45,000  │  $3,000  │          │          │            ││
│ │ │ +3.5% 🟢 │ -1.2% 🔴 │          │          │            ││
│ │ └──────────┴──────────┴──────────┴──────────┘            ││
│ │                                                             ││
│ │ Current Price: $45,000    30D Change: +4.44%              ││
│ │ High/Low: $47,000 / $45,000   Avg Volume: $50.0M          ││
│ │                                                             ││
│ │ Price Trend                                                ││
│ │ ┌─────────────────────────────────────────────────────────┐││
│ │ │         /‾‾\                                            │││
│ │ │        /    \    /‾\                                   │││
│ │ │       /      \__/   \                                  │││
│ │ └─────────────────────────────────────────────────────────┘││
│ │                                                             ││
│ │ Volume Trend                                               ││
│ │ ┌─────────────────────────────────────────────────────────┐││
│ │ │ ||||  ||  ||||  |||  |||||                             │││
│ │ └─────────────────────────────────────────────────────────┘││
│ │                                                             ││
│ │ Showing 30 data points over 30 days                        ││
│ └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## User Interactions

### 1. Default View (Watched Coins)
```
User lands on dashboard
  ↓
Chart shows "Watched (2)" tab active
  ↓
Grid displays all watched coins with live prices
  ↓
First watched coin (BTC) chart is displayed by default
```

### 2. Switching to Held Coins
```
User clicks "Held (1)" tab
  ↓
Grid updates to show only held coins
  ↓
First held coin chart is displayed
  ↓
Price data updates automatically
```

### 3. Selecting a Different Coin
```
User clicks on ETH in the coin grid
  ↓
ETH coin card highlights with blue border
  ↓
Chart updates to show ETH price history
  ↓
Statistics update (price, change %, high/low, volume)
  ↓
Price and volume charts redraw for ETH
```

### 4. Changing Timeframe
```
User clicks timeframe dropdown
  ↓
Selects "7D" from options (1D, 7D, 30D, 90D, 1Y)
  ↓
Chart fetches new data for 7-day period
  ↓
Statistics recalculate for 7-day window
  ↓
Chart redraws with new data points
```

## Component Hierarchy

```
Dashboard Page
├── Portfolio Stats Cards
├── My Cryptocurrencies List
├── Quick Actions Sidebar
└── Price Chart (enableMultiView={true})
    ├── Card Header
    │   ├── Title & Description
    │   └── Controls (Timeframe Select, Refresh Button)
    ├── Card Content
    │   ├── Tabs (if enableMultiView)
    │   │   ├── Watched Tab
    │   │   │   └── CoinSelector (watched coins)
    │   │   └── Held Tab
    │   │       └── CoinSelector (held coins)
    │   ├── Price Statistics Grid (4 stats)
    │   ├── SimplePriceChart (SVG line chart)
    │   ├── SimpleVolumeChart (SVG bar chart)
    │   └── Data Points Info
    └── Error Boundary
```

## Data Flow Diagram

```
┌─────────────┐
│  Dashboard  │
│    Page     │
└──────┬──────┘
       │
       ├──────────────────────────────────────┐
       │                                      │
       ▼                                      ▼
┌──────────────┐                    ┌──────────────┐
│  PriceChart  │                    │   Dashboard  │
│  Component   │                    │    Router    │
└──────┬───────┘                    └──────┬───────┘
       │                                   │
       ├──────────┬────────────────────────┤
       │          │                        │
       ▼          ▼                        ▼
  ┌────────┐ ┌─────────┐           ┌──────────────┐
  │ Watched│ │  Held   │           │   Top        │
  │ Coins  │ │ Coins   │           │ Performer    │
  │ Query  │ │ Query   │           │   Data       │
  └───┬────┘ └────┬────┘           └──────┬───────┘
      │           │                       │
      ▼           ▼                       ▼
  ┌─────────────────────────────────────────────┐
  │         Crypto Router (tRPC)                │
  │  - getWatchedCoins                          │
  │  - getHeldCoins                             │
  └────────────────┬────────────────────────────┘
                   │
                   ▼
  ┌─────────────────────────────────────────────┐
  │         Database (Prisma)                   │
  │  - cryptoTracking table                     │
  │  - crypto table                             │
  └────────────────┬────────────────────────────┘
                   │
                   │ (coinGeckoIds)
                   ▼
  ┌─────────────────────────────────────────────┐
  │       CoinGecko API                         │
  │  - /coins/markets (current prices)          │
  │  - /coins/{id}/market_chart (history)       │
  └─────────────────────────────────────────────┘
```

## Color Coding

- **Green (+3.5%)**: Positive price change
- **Red (-1.2%)**: Negative price change  
- **Blue Border**: Selected coin in grid
- **Gray Border**: Unselected coins
- **Primary Color**: Active tab
- **Muted**: Inactive tab

## Responsive Behavior

- **Desktop (>1024px)**: 4 coins per row in grid
- **Tablet (768-1024px)**: 3 coins per row in grid  
- **Mobile (<768px)**: 2 coins per row in grid
- All elements stack vertically on mobile
- Chart height adjusts for smaller screens
