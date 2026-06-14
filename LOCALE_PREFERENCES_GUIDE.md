# Currency and Timezone Preferences Usage Guide

This document explains how to use the new currency and timezone preference features in the CryptoSentiment application.

## Backend Updates

### 1. User Preferences Model
The `UserPreferences` model already includes `currency` and `timezone` fields:
```typescript
// In prisma/schema.prisma
model UserPreferences {
  currency  String  @default("USD")
  timezone  String  @default("UTC")
  // ... other fields
}
```

### 2. tRPC Router
The `auth` router includes endpoints to get and update preferences:
```typescript
// Get preferences
const { data: preferences } = api.auth.getPreferences.useQuery();

// Update preferences
const updateMutation = api.auth.updatePreferences.useMutation({
  onSuccess: () => {
    // Handle success
  }
});

updateMutation.mutate({ 
  currency: 'EUR', 
  timezone: 'Europe/London' 
});
```

### 3. CoinGecko API Integration
The crypto router endpoints now accept an optional currency parameter:
```typescript
// In your components using tRPC
const { data: cryptos } = api.crypto.getTopCryptos.useQuery({ 
  limit: 50, 
  currency: 'EUR' 
});

const { data: crypto } = api.crypto.getCryptoById.useQuery({ 
  id: 'bitcoin', 
  currency: 'GBP' 
});
```

## Frontend Usage

### 1. Settings Component
Users can configure their preferences from `/settings`:
- Navigate to Settings page
- Find "Currency & Timezone" section
- Click "Configure" button
- Select preferred currency and timezone
- Click "Save Changes"

### 2. Using Preferences in Components
Use the `useUserPreferences` hook to access user preferences:

```typescript
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { formatCurrency, formatDate } from '@/lib/utils';

function MyComponent() {
  const { currency, timezone } = useUserPreferences();
  
  const price = 50000;
  const date = new Date();
  
  return (
    <div>
      <p>Price: {formatCurrency(price, currency)}</p>
      <p>Updated: {formatDate(date, timezone)}</p>
    </div>
  );
}
```

### 3. Formatting Utilities

#### Currency Formatting
```typescript
import { formatCurrency } from '@/lib/utils';

// With user's preferred currency
const { currency } = useUserPreferences();
formatCurrency(1234.56, currency); // "€1,234.56" if currency is EUR

// With specific currency
formatCurrency(1234.56, 'USD'); // "$1,234.56"
formatCurrency(1234.56, 'GBP'); // "£1,234.56"
formatCurrency(1234.56, 'JPY'); // "¥1,235"
```

#### Date Formatting
```typescript
import { formatDate } from '@/lib/utils';

const { timezone } = useUserPreferences();
const date = new Date('2024-01-15T12:30:00Z');

// With user's timezone
formatDate(date, timezone); // "Jan 15, 2024, 12:30 PM" (in user's timezone)

// With specific timezone
formatDate(date, 'America/New_York'); // Eastern Time
formatDate(date, 'Asia/Tokyo'); // Tokyo Time

// Custom format options
formatDate(date, timezone, {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}); // "January 15, 2024"
```

## Supported Currencies

- USD - US Dollar ($)
- EUR - Euro (€)
- GBP - British Pound (£)
- JPY - Japanese Yen (¥)
- CNY - Chinese Yuan (¥)
- AUD - Australian Dollar (A$)
- CAD - Canadian Dollar (C$)
- CHF - Swiss Franc (Fr)
- INR - Indian Rupee (₹)
- KRW - South Korean Won (₩)
- BRL - Brazilian Real (R$)
- RUB - Russian Ruble (₽)
- SGD - Singapore Dollar (S$)
- HKD - Hong Kong Dollar (HK$)

## Supported Timezones

- UTC - Coordinated Universal Time
- America/New_York - Eastern Time
- America/Chicago - Central Time
- America/Denver - Mountain Time
- America/Los_Angeles - Pacific Time
- Europe/London - GMT
- Europe/Paris - Central European Time
- Europe/Moscow - Moscow Time
- Asia/Dubai - Dubai
- Asia/Kolkata - India
- Asia/Shanghai - China
- Asia/Tokyo - Japan
- Asia/Seoul - Korea
- Asia/Singapore - Singapore
- Asia/Hong_Kong - Hong Kong
- Australia/Sydney - Australia
- Pacific/Auckland - New Zealand

## API Endpoint Updates

Public crypto endpoints now support currency parameter:

```typescript
// Get top cryptocurrencies in EUR
api.crypto.getTopCryptos.useQuery({ 
  limit: 50, 
  currency: 'EUR' 
});

// Get specific crypto in GBP
api.crypto.getCryptoById.useQuery({ 
  id: 'bitcoin', 
  currency: 'GBP' 
});
```

## Best Practices

1. **Always use formatting utilities**: Don't hardcode currency symbols or date formats
2. **Use the hook for consistency**: Use `useUserPreferences()` to get current user settings
3. **Provide defaults**: The hook provides 'USD' and 'UTC' as defaults for unauthenticated users
4. **Test with different locales**: Ensure your components work with various currencies and timezones

## Testing

Tests are included for:
- LocalePreferences component (9 tests)
- formatCurrency with multiple currencies
- formatDate with different timezones
- useUserPreferences hook behavior

Run tests with:
```bash
npm test -- LocalePreferences
npm test -- utils.test
```
