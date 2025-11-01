# Hidden Features - Internal Documentation

This document describes hidden features and easter eggs in the CryptoSentiment mobile app that are intended for power users, administrators, and internal testing.

## Developer/Debug Menu

### Access Method
**Secret Tap Pattern**: Tap the "Top Cryptocurrencies" title on the Dashboard screen **7 times quickly** (within 2 seconds).

### What It Does
- Opens a hidden Developer Menu dialog
- Displays app version, API URL, and build information
- Provides access to:
  - App Version info
  - API configuration details
  - Build type (Release/Debug)
  - Log viewer (placeholder for future implementation)

### Implementation Details
- Location: `/mobile/src/screens/dashboard/DashboardScreen.tsx`
- Reset timeout: 2 seconds between taps
- Tap counter resets after inactivity
- Uses `TouchableOpacity` with `activeOpacity={1}` to avoid visual feedback

### Use Cases
1. **QA Testing**: Quickly verify app version and configuration
2. **Customer Support**: Help users identify their app version
3. **Debug Sessions**: Access diagnostic information without recompiling
4. **Power Users**: Allow technical users to access advanced features

### Future Enhancements
Consider adding:
- Network request log viewer
- Cache clearing options
- API endpoint switcher (Dev/Staging/Prod)
- Feature flag toggles
- Performance metrics
- Console log export

## Security Considerations

⚠️ **Important**: This feature should NOT expose:
- User credentials or tokens
- API keys or secrets
- Sensitive user data
- Database connection strings

The current implementation only shows safe, read-only information suitable for customer support scenarios.

## Adding New Hidden Features

To add new hidden features:

1. Choose an appropriate trigger (gesture, tap pattern, shake, etc.)
2. Implement with a timeout/reset mechanism
3. Document it in this file
4. Keep security in mind - never expose sensitive data
5. Make it useful for support/debugging without being intrusive

## Common Tap Patterns in Mobile Apps

- **3 taps**: Quick debug toggle
- **5 taps**: Common easter egg trigger
- **7 taps**: Developer menu (our implementation)
- **10 taps**: Advanced/dangerous features
- **Triple-tap title + shake**: Alternative pattern

## Testing

To test the hidden menu:
1. Launch the mobile app
2. Navigate to the Dashboard (should be the default screen)
3. Tap the "Top Cryptocurrencies" title 7 times quickly
4. Verify the Developer Menu dialog appears
5. Test the "View Logs" button functionality

---

**Last Updated**: 2025-11-01  
**Maintainer**: Development Team
