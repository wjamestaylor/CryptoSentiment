# CryptoSentiment Production Email Setup Guide

## Current Status
✅ **Database**: Fully migrated and working  
✅ **Application**: Running successfully on Railway  
❌ **Email Authentication**: Requires proper email service configuration  
⚠️  **Google OAuth**: Requires proper Google OAuth credentials  

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

### ✅ Working
- `DATABASE_URL` - ✅ Connected to PostgreSQL
- `NEXTAUTH_SECRET` - ✅ Configured
- `NEXTAUTH_URL` - ✅ Set to production URL
- `FROM_EMAIL` - ✅ Set to noreply@cryptosentiment.com

### ❌ Missing/Placeholder
- `RESEND_API_KEY` - ❌ Placeholder value
- `GOOGLE_CLIENT_ID` - ❌ Placeholder value  
- `GOOGLE_CLIENT_SECRET` - ❌ Placeholder value

## Testing After Setup

### Test Email Authentication
1. Go to: https://lavish-patience-production-f0a0.up.railway.app/auth/signin
2. Enter your email address
3. Check for verification email
4. Click verification link

### Test Google OAuth  
1. Go to: https://lavish-patience-production-f0a0.up.railway.app/auth/signin
2. Click "Sign in with Google"
3. Complete OAuth flow

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

## Next Steps

1. **Choose Email Provider**: Resend (recommended) or Gmail SMTP
2. **Configure Google OAuth**: Set up proper credentials  
3. **Update Railway Variables**: Add real API keys
4. **Test Authentication**: Verify both email and Google sign-in work
5. **Monitor Logs**: Check for any authentication errors

## Production-Ready Checklist

- [ ] Real Resend API key configured
- [ ] Google OAuth credentials set up
- [ ] Domain verification completed (Resend)
- [ ] Email templates tested
- [ ] Authentication flows tested
- [ ] Error handling verified
- [ ] Monitoring and logging set up