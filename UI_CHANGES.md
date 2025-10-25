# UI Changes Documentation

## Settings Page Updates

### Before
The Settings page (`/settings`) had the following sections:
1. Account Information
2. Subscription Status
3. Preferences (with Theme, Email Notifications, and Alert Frequency)

### After
The Settings page now includes an additional preference option:

```
┌─────────────────────────────────────────────────────────────┐
│ Preferences                                                  │
│ Customize your CryptoSentiment experience                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Theme                                                        │
│ Choose your preferred color theme                           │
│                                           [Theme Toggle]     │
│                                                              │
│ Email Notifications                                          │
│ Receive email alerts for price changes                      │
│                                           [Configure]        │
│                                                              │
│ Alert Frequency                                              │
│ How often you want to receive notifications                 │
│                                           [Configure]        │
│                                                              │
│ ✨ Currency & Timezone                        NEW!          │
│ Set your preferred currency and timezone                    │
│                                           [Configure]        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## LocalePreferences Dialog

When users click the "Configure" button in the Currency & Timezone section, a dialog opens:

```
┌─────────────────────────────────────────────────────────────┐
│ Locale Preferences                               [X]         │
├─────────────────────────────────────────────────────────────┤
│ Set your preferred currency and timezone for displaying     │
│ data.                                                        │
│                                                              │
│ Currency                                                     │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ $ USD - US Dollar                              [v]     │  │
│ └────────────────────────────────────────────────────────┘  │
│ All prices will be displayed in this currency               │
│                                                              │
│ Timezone                                                     │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ UTC (Coordinated Universal Time)               [v]     │  │
│ └────────────────────────────────────────────────────────┘  │
│ Timestamps will be displayed in this timezone               │
│                                                              │
│                                                              │
│                                 [Cancel]  [Save Changes]    │
└─────────────────────────────────────────────────────────────┘
```

### Currency Dropdown Options
When clicking the currency dropdown, users see:
```
┌────────────────────────────────────────────┐
│ $ USD - US Dollar                          │
│ € EUR - Euro                               │
│ £ GBP - British Pound                      │
│ ¥ JPY - Japanese Yen                       │
│ ¥ CNY - Chinese Yuan                       │
│ A$ AUD - Australian Dollar                 │
│ C$ CAD - Canadian Dollar                   │
│ Fr CHF - Swiss Franc                       │
│ ₹ INR - Indian Rupee                       │
│ ₩ KRW - South Korean Won                   │
│ R$ BRL - Brazilian Real                    │
│ ₽ RUB - Russian Ruble                      │
│ S$ SGD - Singapore Dollar                  │
│ HK$ HKD - Hong Kong Dollar                 │
└────────────────────────────────────────────┘
```

### Timezone Dropdown Options
When clicking the timezone dropdown, users see:
```
┌────────────────────────────────────────────────────┐
│ UTC (Coordinated Universal Time)                   │
│ Eastern Time (US & Canada)                         │
│ Central Time (US & Canada)                         │
│ Mountain Time (US & Canada)                        │
│ Pacific Time (US & Canada)                         │
│ London (GMT)                                       │
│ Paris, Berlin, Rome                                │
│ Moscow                                             │
│ Dubai                                              │
│ Mumbai, Kolkata, New Delhi                         │
│ Beijing, Shanghai                                  │
│ Tokyo, Osaka                                       │
│ Seoul                                              │
│ Singapore                                          │
│ Hong Kong                                          │
│ Sydney, Melbourne                                  │
│ Auckland                                           │
└────────────────────────────────────────────────────┘
```

## User Flow

### Step-by-Step User Experience

1. **Navigate to Settings**
   - User clicks profile menu or navigates to `/settings`
   - Page loads with all user preferences

2. **Open Currency & Timezone Settings**
   - User scrolls to "Preferences" section
   - Locates "Currency & Timezone" row
   - Clicks "Configure" button
   - Dialog opens with current settings pre-selected

3. **Select Currency**
   - User clicks the Currency dropdown
   - Scrolls through 14 currency options
   - Selects preferred currency (e.g., EUR)
   - Dropdown closes showing selected currency

4. **Select Timezone**
   - User clicks the Timezone dropdown
   - Scrolls through 17 timezone options
   - Selects preferred timezone (e.g., Europe/Paris)
   - Dropdown closes showing selected timezone

5. **Save Changes**
   - User clicks "Save Changes" button
   - Button shows "Saving..." state with spinner
   - Success toast notification appears: "Preferences updated"
   - Page reloads automatically to apply changes

6. **View Updated Data**
   - All cryptocurrency prices now display in EUR
   - All timestamps now display in Paris timezone
   - User can navigate throughout the app
   - Settings persist across sessions

## Visual Examples

### Price Display Changes

**Before (USD)**
```
Bitcoin (BTC)
$42,500.00
+2.45%
```

**After (EUR)**
```
Bitcoin (BTC)
€39,123.45
+2.45%
```

**After (JPY)**
```
Bitcoin (BTC)
¥6,375,000
+2.45%
```

### Timestamp Display Changes

**Before (UTC)**
```
Last updated: Jan 15, 2024, 12:30 PM
```

**After (America/New_York)**
```
Last updated: Jan 15, 2024, 07:30 AM
```

**After (Asia/Tokyo)**
```
Last updated: Jan 15, 2024, 09:30 PM
```

## Loading States

### Initial Load
While preferences are loading, the dialog shows skeleton loaders:
```
┌─────────────────────────────────────────────────────────────┐
│ Locale Preferences                               [X]         │
├─────────────────────────────────────────────────────────────┤
│ Set your preferred currency and timezone for displaying     │
│ data.                                                        │
│                                                              │
│ ┌────────────────────────────────────┐  [Loading...]        │
│ │ ████████████████████               │                      │
│ │ ██████████                         │                      │
│ │ ████████████████                   │                      │
│ └────────────────────────────────────┘                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Saving State
While saving, the Save button is disabled:
```
│                                 [Cancel]  [Saving...] ⏳    │
                                            (disabled)
```

## Error Handling

### Failed to Load Preferences
If preferences fail to load, defaults are used (USD, UTC) and user can still make changes.

### Failed to Save
If save fails, an error toast appears:
```
┌─────────────────────────────────────────┐
│ ⚠️ Error                                │
│ Failed to update preferences:           │
│ [error message]                         │
└─────────────────────────────────────────┘
```

## Responsive Design

### Desktop (> 640px)
- Full-width dialog (max 425px)
- Side-by-side layout for labels and controls
- Comfortable spacing

### Mobile (< 640px)
- Full-screen dialog on small devices
- Stacked layout for labels and controls
- Touch-friendly tap targets
- Scrollable content if needed

## Accessibility Features

1. **Keyboard Navigation**
   - Tab to navigate between dropdowns
   - Enter to open dropdowns
   - Arrow keys to navigate options
   - Enter to select
   - Escape to close dialog

2. **Screen Reader Support**
   - Proper labels for all controls
   - ARIA attributes for dropdowns
   - Descriptive help text
   - Status announcements for loading/saving

3. **Visual Indicators**
   - Clear focus states
   - Loading spinners
   - Success/error feedback
   - Disabled state styling

## Implementation Notes

- Dialog uses Radix UI components (accessible, tested)
- Follows existing design patterns in the app
- Consistent with other preference dialogs
- Smooth animations and transitions
- Optimistic UI updates where appropriate
