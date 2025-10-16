# 🚀 Development Setup Guide

## Quick Start (5 minutes)

### 1. Environment Setup
```bash
# Clone and install
git clone https://github.com/wjamestaylor/CryptoSentiment.git
cd CryptoSentiment
npm install

# Setup environment
cp .env.example .env.local
# Add your API keys to .env.local
```

### 2. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Setup database (if using local PostgreSQL)
npx prisma db push

# Or migrate (for existing database)
npx prisma migrate deploy
```

### 3. Start Development
```bash
# Run development server with Turbopack
npm run dev

# Run tests (optional)
npm test

# Check coverage (optional)
npm run test:coverage
```

### 4. Verify Setup
- Open [http://localhost:3000](http://localhost:3000)
- Sign in with Google OAuth (working in production)
- Add cryptocurrencies to watchlist
- Test AI sentiment analysis
- Verify no console errors

## 🔧 Environment Variables

### Required (.env.local)
```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/cryptosentiment"

# Authentication (NextAuth.js)
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (required for authentication)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# APIs (required for full functionality)
OPENROUTER_API_KEY="sk-or-..."  # AI sentiment analysis
COINGECKO_API_KEY="CG-..."      # Crypto data (optional - free tier available)
```

### Optional
```bash
# Additional APIs (future features)
WHALEALERT_API_KEY="your-whalealert-key"
NEWSDATA_API_KEY="your-newsdata-key"

# Payments (subscription system)
STRIPE_SECRET_KEY="your-stripe-key"
STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"

# Bot notifications (future features)
DISCORD_BOT_TOKEN="your-discord-token"
TELEGRAM_BOT_TOKEN="your-telegram-token"

# Email service (currently disabled due to NextAuth issues)
EMAIL_FROM="noreply@cryptosentiment.com"
RESEND_API_KEY="re_..."
```

## 📊 Development Status

### ✅ Production Ready Features
- **Live Cryptocurrency Data**: Real-time prices via CoinGecko API
- **AI Sentiment Analysis**: OpenRouter integration working
- **Google OAuth Authentication**: Full user authentication flow
- **Smart Watchlist**: Add/remove cryptocurrencies with AI analysis
- **Responsive Dashboard**: Mobile-first design with shadcn/ui
- **Database**: PostgreSQL with 11 Prisma models, 5 migrations deployed
- **tRPC API**: Type-safe API with all endpoints functional
- **Testing**: 606+ tests across 42 suites (100% pass rate)

### 🔄 In Development (High Priority)
- **Pricing/Subscription System**: Stripe integration needed
- **Email Authentication**: NextAuth email provider working with SMTP configuration
- **Bot Integrations**: Discord and Telegram notification setup
- **Alert System**: Email and multi-channel notifications
- **UI Polish**: Color consistency fixes across app sections

### 📈 Current Metrics
- **Test Coverage**: 606+ automated tests, 42 test suites
- **Database**: 11 models, 5 successful migrations
- **API Coverage**: 100% tRPC router coverage
- **Production Status**: Deployed on Railway with Google OAuth working

## 🛠 Common Development Tasks

### Database Operations
```bash
# Reset database (careful - deletes all data)
npx prisma migrate reset

# View database in browser
npx prisma studio

# Generate types after schema changes
npx prisma generate

# Push schema changes (development)
npx prisma db push

# Create new migration (production)
npx prisma migrate dev --name migration_name
```

### Testing & Quality
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch

# Run specific test file
npm test services/crypto/coinGecko.service.test.ts

# Type checking
npm run type-check

# Linting with auto-fix
npm run lint
```

### Development Server
```bash
# Start with Turbopack (fast)
npm run dev

# Build for production testing
npm run build
npm run start

# Database admin interface
npx prisma studio  # Opens http://localhost:5555
```

## 🔍 Troubleshooting

### Common Issues

**Google OAuth not working:**
```bash
# Ensure environment variables are set
echo $GOOGLE_CLIENT_ID
echo $GOOGLE_CLIENT_SECRET

# Check NextAuth configuration in src/lib/auth/nextauth.ts
# Verify redirect URIs in Google Cloud Console
```

**Database connection errors:**
```bash
# Check PostgreSQL is running
pg_isready

# Verify connection string in .env.local
echo $DATABASE_URL

# Test database connection
npx prisma db push
```

**AI Analysis not working:**
```bash
# Verify OpenRouter API key
echo $OPENROUTER_API_KEY

# Check service in src/services/ai/openrouter.service.ts
# Look for API errors in browser console
```

**Test failures:**
```bash
# Clear Jest cache
npm test -- --clearCache

# Run tests in sequence (avoid parallel issues)
npm test -- --runInBand

# Check specific test output
npm test -- --verbose services/crypto/coinGecko.service.test.ts
```

### Development URLs
- **Main App**: http://localhost:3000
- **Database Studio**: http://localhost:5555 (after `npx prisma studio`)
- **Production App**: https://lavish-patience-production-f0a0.up.railway.app

### Performance & Debugging
- Use React DevTools for component debugging
- Check Network tab for API call issues
- Monitor Console for tRPC errors
- Use Prisma Studio for database inspection

## 🆘 Getting Help

### Documentation Resources
- **[Implementation Checklist](docs/IMPLEMENTATION_CHECKLIST.md)**: Current development status and priorities
- **[Test Coverage Report](docs/TEST_COVERAGE_REPORT.md)**: Quality metrics and testing details
- **[Security Setup](SECURITY-SETUP.md)**: Security configuration and best practices
- **[Production Email Setup](PRODUCTION_EMAIL_SETUP.md)**: Email service configuration (currently disabled)

### Issue Resolution
1. **Check Console Errors**: Browser DevTools → Console tab
2. **Verify Environment**: Ensure all required `.env.local` variables are set
3. **Database Issues**: Use `npx prisma studio` to inspect data
4. **API Problems**: Check Network tab for failed requests
5. **Test Failures**: Run `npm test -- --verbose` for detailed output

### Development Workflow
1. **Start Development**: `npm run dev` (with Turbopack for speed)
2. **Database Changes**: Use `npx prisma db push` for schema updates
3. **Test Changes**: Run `npm test` before committing
4. **Type Safety**: Use `npm run type-check` for TypeScript validation

---

**Last Updated**: October 15, 2025  
**Current Status**: ✅ Production-ready with Google OAuth authentication  
**Live Demo**: https://lavish-patience-production-f0a0.up.railway.app