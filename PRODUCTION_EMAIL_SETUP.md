# CryptoSentiment Production Email Setup Guide

## Current Status (October 15, 2025)
✅ **Database**: Fully migrated and working (5 migrations deployed)  
✅ **Application**: Running successfully on Railway  
✅ **Google OAuth**: Working in production with real credentials
❌ **Email Authentication**: Disabled due to NextAuth SMTP configuration issues  
⚠️  **Email Service**: Resend API configured but not integrated with NextAuth  

## Issue Summary

**Problem**: NextAuth.js email provider consistently defaults to `localhost:587` despite proper environment variable configuration, causing email authentication to fail in production.

**Current Workaround**: Email authentication disabled, users can only sign up via Google OAuth.

**Root Cause**: NextAuth SMTP configuration appears to have internal overrides that ignore custom SMTP settings.  

## Quick Fix: Email Authentication

### Option 1: Resend (Recommended)
1. **Sign up for Resend**: https://resend.com (Free tier: 100 emails/day)
2. **Get API Key**: Create API key in Resend dashboard
3. **Add to Railway**:
   ```bash
   railway variables --set RESEND_API_KEY=re_your_actual_api_key
   ```
4. **Verify Domain** (Optional): Add your domain in Resend for better deliverability

### Option 2: Gmail SMTP (Free Alternative)
1. **Enable App Passwords**: In Gmail → Security → 2-Step Verification → App Passwords
2. **Create App Password**: Generate password for "Mail" app
3. **Add to Railway**:
   ```bash
   railway variables --set EMAIL_SERVER_HOST=smtp.gmail.com
   railway variables --set EMAIL_SERVER_PORT=587
   railway variables --set EMAIL_SERVER_USER=your-gmail@gmail.com
   railway variables --set EMAIL_SERVER_PASSWORD=your-app-password
   railway variables --set EMAIL_FROM=your-gmail@gmail.com
   ```

### Option 3: Disable Email Auth (Temporary)
Remove email provider entirely and use only Google OAuth:

```typescript
// In src/lib/auth/nextauth.ts
providers: [
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  }),
  // Email provider removed
],
```

## Quick Fix: Google OAuth

### Setup Google OAuth
1. **Go to Google Cloud Console**: https://console.cloud.google.com
2. **Create/Select Project**: "CryptoSentiment" 
3. **Enable Google+ API**: APIs & Services → Enable APIs
4. **Create OAuth Credentials**:
   - Credentials → Create Credentials → OAuth 2.0 Client IDs
   - Application type: Web application
   - Authorized redirect URIs: `https://lavish-patience-production-f0a0.up.railway.app/api/auth/callback/google`
5. **Add to Railway**:
   ```bash
   railway variables --set GOOGLE_CLIENT_ID=your-actual-client-id
   railway variables --set GOOGLE_CLIENT_SECRET=your-actual-client-secret
   ```

## Current Environment Variables Status

### ✅ Working in Production
- `DATABASE_URL` - ✅ Connected to Railway PostgreSQL
- `NEXTAUTH_SECRET` - ✅ Configured with production secret
- `NEXTAUTH_URL` - ✅ Set to https://lavish-patience-production-f0a0.up.railway.app
- `GOOGLE_CLIENT_ID` - ✅ Real Google OAuth credentials
- `GOOGLE_CLIENT_SECRET` - ✅ Real Google OAuth credentials  
- `OPENROUTER_API_KEY` - ✅ AI sentiment analysis working
- `RESEND_API_KEY` - ✅ Email service API configured (not used by NextAuth)

### ❌ Known Issues
- **NextAuth Email Provider**: Disabled due to persistent `localhost:587` connection errors
- **Email Sign-up**: Users cannot register via email (Google OAuth only)
- **Email Verification**: No email verification flow currently available

## Testing Current Setup

### ✅ Test Google OAuth (Working)
1. Go to: https://lavish-patience-production-f0a0.up.railway.app/auth/signin
2. Click "Sign in with Google"
3. Complete OAuth flow → Successfully creates user session
4. Access dashboard and add cryptocurrencies to watchlist

### ❌ Email Authentication (Currently Disabled)
Email sign-up is not available due to NextAuth configuration issues. Users must use Google OAuth.

## Deployment Commands

After updating environment variables:
```bash
# Redeploy to pick up new variables
railway redeploy

# Check logs for any issues
railway logs --tail 50
```

## Troubleshooting

### Email Issues
- **"Failed to send verification email"**: Check RESEND_API_KEY or SMTP credentials
- **Email not received**: Check spam folder, verify domain configuration
- **SMTP errors**: Verify host, port, and authentication settings

### Google OAuth Issues  
- **"Invalid client"**: Verify GOOGLE_CLIENT_ID and redirect URIs
- **"Unauthorized"**: Check GOOGLE_CLIENT_SECRET
- **Redirect errors**: Ensure redirect URI matches exactly in Google Console

### Database Issues
```bash
# Check migration status
DATABASE_URL="your-production-url" npx prisma migrate status

# Deploy pending migrations  
DATABASE_URL="your-production-url" npx prisma migrate deploy
```

## Next Steps for Email Authentication

### Potential Solutions to Try

#### Option 1: Custom Email Service (Recommended)
Bypass NextAuth email provider entirely and implement custom email authentication:
1. **Custom API route** for email verification
2. **Direct Resend integration** for sending verification emails  
3. **Manual session creation** after email verification
4. **Database-based verification tokens**

#### Option 2: Alternative Auth Provider
Consider switching to alternative authentication solutions:
- **Clerk**: Modern auth with email/SMS/OAuth
- **Auth0**: Enterprise-grade authentication
- **Supabase Auth**: Built-in email authentication

#### Option 3: Debug NextAuth Configuration
Deep dive into NextAuth email provider configuration:
1. **Custom SMTP transport** configuration
2. **Environment variable debugging** in production
3. **NextAuth source code investigation** for localhost override

## Production-Ready Checklist

### ✅ Currently Working
- [x] Google OAuth authentication flow
- [x] User session management and persistence
- [x] Database user storage and relationships
- [x] Protected route middleware
- [x] Production deployment on Railway

### ❌ Still Needed
- [ ] Email authentication working
- [ ] Email verification flow
- [ ] Password reset functionality  
- [ ] User registration via email
- [ ] Welcome email sequences
- [ ] Production email monitoring

---

**Status**: Google OAuth fully functional, email authentication blocked by NextAuth configuration issues  
**Priority**: HIGH - Email authentication is critical for user onboarding options  
**Last Updated**: October 15, 2025