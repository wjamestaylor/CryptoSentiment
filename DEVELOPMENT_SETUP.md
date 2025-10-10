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
# Run development server
npm run dev

# Run tests (optional)
npm test

# Check coverage (optional)
npm test -- --coverage
```

### 4. Verify Setup
- Open [http://localhost:3000](http://localhost:3000)
- Check that cryptocurrency data loads
- Verify no console errors

## 🔧 Environment Variables

### Required (.env.local)
```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/cryptosentiment"

# Authentication
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# APIs (for full functionality)
COINGECKO_API_KEY="your-coingecko-key"  # Optional for free tier
OPENROUTER_API_KEY="your-openrouter-key"
```

### Optional
```bash
# Additional APIs
WHALEALERT_API_KEY="your-whalealert-key"
NEWSDATA_API_KEY="your-newsdata-key"

# Payments
STRIPE_SECRET_KEY="your-stripe-key"

# Notifications
DISCORD_BOT_TOKEN="your-discord-token"
TELEGRAM_BOT_TOKEN="your-telegram-token"
```

## 📊 Development Status

### ✅ Working Features
- **Live Cryptocurrency Data**: Real-time prices via CoinGecko API
- **tRPC API**: All 15+ endpoints functional
- **Database**: PostgreSQL with Prisma ORM
- **UI Components**: Complete shadcn/ui component library
- **Testing**: 45.38% coverage, 117 tests passing

### 🔄 In Development
- **AI Sentiment Analysis**: Service ready, needs API key
- **User Authentication**: Backend ready, UI in progress
- **Alert System**: Database ready, UI needed

## 🛠 Common Development Tasks

### Database
```bash
# Reset database
npx prisma migrate reset

# View database
npx prisma studio

# Generate types after schema changes
npx prisma generate
```

### Testing
```bash
# Run specific test
npm test -- coingecko

# Watch mode
npm test -- --watch

# Coverage for specific file
npm test -- --coverage services/
```

### Code Quality
```bash
# Type check
npm run type-check

# Lint
npm run lint

# Format
npm run format
```

## 🔍 Troubleshooting

### Common Issues

**Database connection error:**
```bash
# Check PostgreSQL is running
pg_isready

# Verify connection string in .env.local
echo $DATABASE_URL
```

**tRPC errors:**
```bash
# Regenerate tRPC types
npm run dev  # This regenerates types automatically
```

**Test failures:**
```bash
# Clear Jest cache
npm test -- --clearCache

# Run specific failing test
npm test -- --testNamePattern="specific test name"
```

### Development URLs
- **Main App**: http://localhost:3000
- **Database Studio**: http://localhost:5555 (after `npx prisma studio`)
- **API Docs**: http://localhost:3000/api (when implemented)

## 📈 Performance Tips

### Development
- Use `npm run dev` for hot reloading
- Keep Prisma Studio open for database inspection
- Use `npm test -- --watch` for continuous testing

### Production
- All environment variables configured
- Database migrations applied
- Build successful: `npm run build`

## 🆘 Getting Help

### Resources
- **Documentation**: `/docs` folder
- **Implementation Guide**: `docs/IMPLEMENTATION_CHECKLIST.md`
- **Test Coverage**: `docs/TEST_COVERAGE_REPORT.md`
- **Security**: `SECURITY.md`

### Issues
- Check existing GitHub issues
- Review error logs in development console
- Verify environment variables are set correctly

---

**Last Updated**: October 10, 2025  
**Current Status**: ✅ Ready for development with 45.38% test coverage