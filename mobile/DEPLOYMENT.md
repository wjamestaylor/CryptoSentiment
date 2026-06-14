# Mobile App Deployment Guide

This guide covers deploying the CryptoSentiment mobile app to Apple App Store and Google Play Store.

## Prerequisites

### General
- Expo account (https://expo.dev)
- EAS CLI installed: `npm install -g eas-cli`
- Configured `eas.json` in the mobile directory
- Updated `app.json` with proper bundle identifiers and app metadata

### iOS App Store
- Apple Developer Account ($99/year)
- App Store Connect access
- Valid iOS distribution certificate
- Valid provisioning profile

### Google Play Store
- Google Play Developer Account ($25 one-time fee)
- Google Play Console access
- App signing key
- Service account for automated submissions

## Initial Setup

### 1. Configure Expo Project

```bash
cd mobile
eas login
eas build:configure
```

This will:
- Create `eas.json` if it doesn't exist
- Link your project to EAS
- Generate a project ID

### 2. Update app.json

Ensure these fields are properly configured:

```json
{
  "expo": {
    "name": "CryptoSentiment",
    "slug": "cryptosentiment",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.cryptosentiment.app"
    },
    "android": {
      "package": "com.cryptosentiment.app"
    },
    "extra": {
      "eas": {
        "projectId": "your-project-id-here"
      }
    }
  }
}
```

## iOS Deployment

### Step 1: App Store Connect Setup

1. **Create App in App Store Connect**:
   - Go to https://appstoreconnect.apple.com
   - Click "My Apps" → "+" → "New App"
   - Fill in app information:
     - Platform: iOS
     - Name: CryptoSentiment
     - Bundle ID: com.cryptosentiment.app
     - SKU: cryptosentiment-ios
     - User Access: Full Access

2. **Configure App Information**:
   - App category: Finance
   - Content rating: 4+
   - Privacy policy URL
   - Support URL
   - Marketing URL (optional)

3. **Prepare App Store Listing**:
   - App screenshots (required sizes):
     - 6.5" Display: 1284x2778 pixels
     - 5.5" Display: 1242x2208 pixels
   - App preview video (optional)
   - Description (4000 characters max)
   - Keywords (100 characters max)
   - What's New in This Version

### Step 2: Build for iOS

```bash
# Production build
eas build --platform ios --profile production

# This will:
# - Generate iOS build on EAS servers
# - Handle code signing automatically
# - Provide download link when complete
```

### Step 3: Submit to App Store

**Option A: Automatic Submission via EAS**

Update `eas.json` with your Apple credentials:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABC123XYZ"
      }
    }
  }
}
```

Then submit:

```bash
eas submit --platform ios --latest
```

**Option B: Manual Upload via Xcode**

1. Download the `.ipa` file from EAS build
2. Open Xcode → Window → Transporter
3. Sign in with Apple ID
4. Drag and drop the `.ipa` file
5. Click "Deliver"

### Step 4: Complete App Store Review

1. Go to App Store Connect
2. Select your app
3. Go to "App Store" tab
4. Fill in all required information
5. Add screenshots and description
6. Click "Submit for Review"

**Review Checklist**:
- [ ] All app information complete
- [ ] Screenshots uploaded for all required device sizes
- [ ] App description and keywords set
- [ ] Privacy policy URL provided
- [ ] Content rating completed
- [ ] Export compliance information provided
- [ ] Test account credentials provided (if needed)

## Android Deployment

### Step 1: Google Play Console Setup

1. **Create App in Play Console**:
   - Go to https://play.google.com/console
   - Click "Create app"
   - Fill in app details:
     - App name: CryptoSentiment
     - Default language: English (United States)
     - App or game: App
     - Free or paid: Free

2. **Complete Store Listing**:
   - App details:
     - Short description (80 characters)
     - Full description (4000 characters)
     - App screenshots (required):
       - Phone: 1080x1920 pixels (minimum 2)
       - 7-inch tablet: 1200x1920 pixels
       - 10-inch tablet: 1600x2560 pixels
     - Feature graphic: 1024x500 pixels
     - App icon: 512x512 pixels

3. **Content Rating**:
   - Complete questionnaire
   - Obtain rating certificate

4. **Pricing & Distribution**:
   - Select countries/regions
   - Set pricing (Free)
   - Confirm content guidelines

### Step 2: App Signing

**Option A: Let Google Play Manage Signing (Recommended)**

This is automatically configured when using EAS Build.

**Option B: Manual Signing**

Generate signing key:

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore cryptosentiment.keystore \
  -alias cryptosentiment -keyalg RSA -keysize 2048 -validity 10000
```

Update `eas.json`:

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk",
        "credentialsSource": "local"
      }
    }
  }
}
```

### Step 3: Build for Android

```bash
# Production build (AAB format - required for Play Store)
eas build --platform android --profile production

# APK build (for testing)
eas build --platform android --profile preview
```

### Step 4: Submit to Google Play

**Option A: Automatic Submission via EAS**

1. Create service account in Google Cloud Console
2. Download JSON key file
3. Save as `google-play-service-account.json` in mobile directory
4. Update `eas.json`:

```json
{
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

5. Submit:

```bash
eas submit --platform android --latest
```

**Option B: Manual Upload**

1. Download the `.aab` file from EAS build
2. Go to Google Play Console
3. Select your app
4. Go to "Release" → "Production"
5. Click "Create new release"
6. Upload the `.aab` file
7. Add release notes
8. Review and roll out

### Step 5: Testing Tracks

Before production, test your app:

```bash
# Submit to internal testing
eas submit --platform android --track internal

# Submit to closed testing
eas submit --platform android --track alpha

# Submit to open testing
eas submit --platform android --track beta
```

## Environment Variables

### Production Environment

Update `eas.json` with production environment:

```json
{
  "build": {
    "production": {
      "env": {
        "API_URL": "https://lavish-patience-production-f0a0.up.railway.app",
        "GOOGLE_CLIENT_ID": "your-google-client-id"
      }
    }
  }
}
```

### Secrets Management

For sensitive values, use EAS Secrets:

```bash
# Add secret
eas secret:create --scope project --name GOOGLE_CLIENT_ID --value "your-value"

# List secrets
eas secret:list

# Delete secret
eas secret:delete --name GOOGLE_CLIENT_ID
```

Reference in `eas.json`:

```json
{
  "build": {
    "production": {
      "env": {
        "GOOGLE_CLIENT_ID": "@GOOGLE_CLIENT_ID"
      }
    }
  }
}
```

## Post-Deployment

### Monitoring

1. **App Store**:
   - Monitor reviews in App Store Connect
   - Check crash reports
   - Track downloads and revenue

2. **Google Play**:
   - Monitor reviews in Play Console
   - Check crash reports and ANRs
   - Track install metrics

### Updates

To release an update:

1. Update version in `app.json`:
   ```json
   {
     "expo": {
       "version": "1.0.1",
       "ios": {
         "buildNumber": "2"
       },
       "android": {
         "versionCode": 2
       }
     }
   }
   ```

2. Build and submit:
   ```bash
   eas build --platform all --profile production
   eas submit --platform ios --latest
   eas submit --platform android --latest
   ```

### Over-the-Air Updates

For small JavaScript changes, use Expo Updates:

```bash
# Install expo-updates
npm install expo-updates

# Publish update
eas update --branch production --message "Bug fixes"
```

## Troubleshooting

### iOS Build Fails

**Issue**: Code signing error

**Solution**:
- Verify Apple Developer account is active
- Check bundle identifier matches App Store Connect
- Ensure provisioning profiles are valid

### Android Build Fails

**Issue**: Gradle build error

**Solution**:
- Check Java version (Java 17 required)
- Verify Android SDK is installed
- Clear Gradle cache: `cd android && ./gradlew clean`

### App Rejected

**Common Reasons**:
- Missing privacy policy
- Incomplete app information
- Crashes on launch
- Violates app store guidelines

**Solution**:
- Review rejection reason in console
- Address specific issues
- Resubmit for review

## Resources

- [Expo Application Services (EAS)](https://docs.expo.dev/eas/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [EAS Submit](https://docs.expo.dev/submit/introduction/)
- [App Store Connect Help](https://developer.apple.com/app-store-connect/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)
- [React Native Deployment](https://reactnative.dev/docs/publishing-to-app-store)
