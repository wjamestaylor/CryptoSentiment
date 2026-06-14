# CryptoSentiment Mobile App

React Native mobile application for CryptoSentiment, built with Expo.

## Features

- 🔐 **Secure Authentication** - Google OAuth integration
- 📊 **Live Market Data** - Real-time cryptocurrency prices
- 💹 **Portfolio Management** - Track your crypto holdings
- 🎯 **Sentiment Analysis** - AI-powered market insights
- 🚨 **Push Notifications** - Alert notifications for price changes
- 📱 **Cross-Platform** - iOS and Android support

## Prerequisites

- Node.js 18+ and npm
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI for builds (`npm install -g eas-cli`)
- Xcode (for iOS development - macOS only)
- Android Studio (for Android development)

## Installation

1. Install dependencies:
```bash
cd mobile
npm install
```

2. Configure environment variables in `app.json`:
   - Update `extra.apiUrl` to point to your backend API
   - Add your `extra.googleClientId` for OAuth
   - Set your `extra.eas.projectId` from EAS

3. Start the development server:
```bash
npm start
```

## Development

### Running on Devices

**iOS Simulator** (macOS only):
```bash
npm run ios
```

**Android Emulator**:
```bash
npm run android
```

**Web Browser** (for testing):
```bash
npm run web
```

**Physical Device**:
1. Install Expo Go app on your device
2. Scan the QR code from `npm start`

### Project Structure

```
mobile/
├── src/
│   ├── components/      # Reusable UI components
│   ├── screens/         # Screen components
│   │   ├── auth/        # Authentication screens
│   │   ├── dashboard/   # Dashboard screens
│   │   ├── portfolio/   # Portfolio screens
│   │   ├── sentiment/   # Sentiment analysis screens
│   │   ├── alerts/      # Alerts management screens
│   │   └── profile/     # User profile screens
│   ├── navigation/      # Navigation configuration
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API and external services
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript type definitions
│   └── config/          # App configuration
├── assets/              # Images, fonts, icons
├── App.tsx             # Main app component
└── app.json            # Expo configuration
```

## Building for Production

### Prerequisites

1. Create an Expo account at https://expo.dev
2. Install EAS CLI: `npm install -g eas-cli`
3. Login: `eas login`
4. Configure your project: `eas build:configure`

### Build Commands

**Development Build**:
```bash
eas build --profile development --platform ios
eas build --profile development --platform android
```

**Production Build**:
```bash
npm run build:ios      # Build for iOS
npm run build:android  # Build for Android
npm run build:all      # Build for both platforms
```

## App Store Deployment

### iOS App Store

1. **Prepare App Store Connect**:
   - Create app in App Store Connect
   - Configure app metadata, screenshots, and privacy details
   - Set up app review information

2. **Build and Submit**:
```bash
npm run build:ios
npm run submit:ios
```

3. **Update eas.json** with your Apple credentials:
   - appleId: Your Apple ID email
   - ascAppId: App Store Connect App ID
   - appleTeamId: Your Apple Developer Team ID

### Google Play Store

1. **Prepare Google Play Console**:
   - Create app in Google Play Console
   - Configure store listing, content rating, pricing
   - Set up app signing

2. **Generate Service Account Key**:
   - Create service account in Google Cloud Console
   - Download JSON key file
   - Save as `google-play-service-account.json`

3. **Build and Submit**:
```bash
npm run build:android
npm run submit:android
```

## Push Notifications

### Setup

1. **Configure EAS Project ID**:
   - Update `extra.eas.projectId` in `app.json`
   - Get your project ID from https://expo.dev

2. **Register Device Token**:
   - The app automatically requests notification permissions on startup
   - Device tokens are registered with the backend API

3. **Testing Notifications**:
   - Use the Expo push notification tool: https://expo.dev/notifications
   - Or send via backend API using Expo's push notification service

### Backend Integration

The mobile app expects the backend to have these endpoints:

- `POST /api/notifications/register-device` - Register push token
- `POST /api/notifications/send` - Send push notification
- `GET /api/notifications/history` - Get notification history

## Authentication

### Google OAuth Setup

1. **Configure OAuth Credentials**:
   - Create OAuth credentials in Google Cloud Console
   - Add redirect URI: `cryptosentiment://` (custom scheme)
   - Update `extra.googleClientId` in `app.json`

2. **Backend Integration**:
   - The app sends auth code to backend
   - Backend exchanges code for tokens
   - Backend returns user data and session token

## Testing

```bash
npm test              # Run unit tests
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

## Environment Configuration

Key configuration in `app.json`:

```json
{
  "extra": {
    "apiUrl": "https://your-api-url.com",
    "googleClientId": "your-google-client-id",
    "eas": {
      "projectId": "your-eas-project-id"
    }
  }
}
```

## Troubleshooting

### Common Issues

**Metro bundler issues**:
```bash
expo start --clear
```

**Dependency conflicts**:
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

**iOS build fails**:
- Ensure Xcode is up to date
- Check CocoaPods: `cd ios && pod install`

**Android build fails**:
- Check Java version (Java 17 required)
- Verify Android SDK installation

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [Expo Push Notifications](https://docs.expo.dev/push-notifications/overview/)
- [CryptoSentiment Web App](https://github.com/wjamestaylor/cryptosentiment)

## License

MIT - See LICENSE file in root directory
