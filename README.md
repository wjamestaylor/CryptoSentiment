# CryptoSentiment 🚀

> AI-powered cryptocurrency sentiment analysis platform with unified crypto management and real-time data

![Dashboard Preview](public/CryptoSentiment.png)

**Live Demo:** [https://lavish-patience-production-f0a0.up.railway.app](https://lavish-patience-production-f0a0.up.railway.app)

## ✨ Features

- 🤖 **AI Sentiment Analysis** - Real-time sentiment scoring with OpenRouter LLMs
- 📊 **Live Market Data** - Real-time prices and market data from CoinGecko
- 🎯 **Unified Crypto Management** - Single interface for both watching and holdings cryptocurrency
- 📈 **Portfolio Analytics** - Comprehensive performance tracking and insights
- 💹 **Price Visualization** - SVG-based charts for price trends and volume
- 🔄 **Seamless Conversion** - Easy switching between watch-only and holdings modes
- 🔐 **Secure Authentication** - Google OAuth + Email auth with magic links via ResendEmailService
- 📱 **Responsive Design** - Mobile-first with shadcn/ui components
- 🚨 **Smart Alert System** - Custom notifications with email delivery and feature gating
- 📈 **Type-Safe API** - Full-stack TypeScript with tRPC
- 💳 **Subscription Management** - Stripe integration with usage tracking and feature restrictions
- 🤖 **Bot Integration** - Discord and Telegram bots with comprehensive testing

*View [Implementation Checklist](docs/IMPLEMENTATION_CHECKLIST.md) for detailed capabilities and development status.*

## 🔧 Tech Stack

**Frontend:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui  
**Backend:** tRPC, Prisma, PostgreSQL, NextAuth.js  
**AI/Data:** OpenRouter, CoinGecko API integration  
**Analytics:** Portfolio tracking, performance metrics, SVG visualization  
**Payments:** Stripe subscription management with feature gating  
**Email:** ResendEmailService with professional templates  
**Bots:** Discord.js, node-telegram-bot-api with comprehensive testing  
**Testing:** Jest (936+ tests, 100% pass rate)  
**Deployment:** Railway, Docker

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- API keys: [CoinGecko](https://coingecko.com/api), [OpenRouter](https://openrouter.ai)

### Installation

```bash
# Clone and install
git clone https://github.com/wjamestaylor/cryptosentiment.git
cd cryptosentiment
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your API keys and database URL

# Setup database
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

*For detailed setup instructions, see [Development Setup](DEVELOPMENT_SETUP.md).*

## 📱 Usage

## 📱 Usage

### Unified Crypto Management
1. **Add Crypto**: Search and select any cryptocurrency
2. **Choose Mode**: Watch-only tracking or holdings with purchase details
3. **Switch Modes**: Seamlessly convert between watching and holdings
4. **AI Analysis**: Get real-time sentiment scores and market insights
5. **Portfolio View**: Track performance with visual charts and metrics

### Key Workflows
- **Dashboard**: Overview of all tracked cryptos with quick actions
- **Analytics**: Deep dive into portfolio performance and trends
- **Sentiment**: AI-powered analysis of market sentiment
- **Alerts**: Custom notifications with email delivery and feature gating
- **Profile**: Manage preferences and view usage statistics

## 🎯 Current Status (October 2025)

**✅ PRODUCTION READY - All Core Systems Complete:**

### **✅ Email Authentication System**
- ResendEmailService with professional HTML templates
- Custom authentication APIs bypassing NextAuth email issues  
- Email verification flow with 24-hour secure tokens
- Magic link authentication for passwordless sign-in
- Comprehensive testing with 936+ tests passing

### **✅ Subscription Feature Gating**
- FeatureGateService with tier-based usage restrictions
- Real-time usage tracking with monthly limits
- Feature restrictions on AI analysis, alerts, and portfolio items
- Usage dashboard with upgrade prompts and progress visualization
- Active enforcement in sentiment analysis and alerts

### **✅ Analytics Dashboard Enhancement**
- Enhanced portfolio performance tracking with comprehensive metrics
- PortfolioPerformanceChart, ComparativeAnalysis, and AdvancedAnalyticsDashboard
- Market benchmarking with outperformance rating system
- Auto-refresh functionality with live data integration
- SVG-based visualization without external dependencies

### **✅ Alert Management Interface**
- Complete CRUD operations for alert management
- Alert templates for quick setup of common alert types
- Real-time monitoring controls with start/stop functionality
- Professional email notifications via ResendEmailService
- Feature gating with subscription-based restrictions

### **✅ Bot Integration Testing**
- Comprehensive Discord and Telegram bot testing (12 test suites)
- Manual testing utilities with CLI interface
- Complete bot setup documentation and configuration guide
- NPM scripts for streamlined bot verification workflows
- Production-ready bot services with error handling and reconnection logic

**🎨 NEXT PRIORITY:** UI Color System Fix - standardizing branding colors across the application

## 🧪 Testing

Comprehensive test suite with 936+ tests covering all major functionality:

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode for development
npm run test:coverage # Generate coverage report
npm run test:bots     # Test bot integration
```

**Current Coverage:**
- **936+ tests** across all systems
- **100% pass rate** with comprehensive mocking
- **Service layer testing** for all external APIs
- **Component testing** with React Testing Library
- **Bot integration testing** with automated and manual suites
- **Email authentication testing** with ResendEmailService

*See [TEST_COVERAGE_REPORT.md](docs/TEST_COVERAGE_REPORT.md) for detailed metrics.*

## 🏗️ Architecture

### Service Layer Pattern
All external API integrations follow a centralized service pattern for consistency and reliability:

```typescript
// Example: /src/services/crypto/price.service.ts
export class CoinGeckoService {
  private async request<T>(endpoint: string): Promise<T> {
    // Centralized error handling, optional API keys, rate limiting
  }
}
```

### Data Management
- **Unified Crypto System**: Single `CryptoTracking` model supporting both watching and holdings modes
- **tRPC Integration**: Type-safe API endpoints with Zod validation
- **Prisma ORM**: PostgreSQL with automated migrations and type generation
- **Real-time Updates**: Live market data with optimistic updates

### Authentication & Security
- **Dual Authentication**: Google OAuth + Email authentication with magic links
- **Protected Routes**: Middleware-based route protection
- **CSRF Protection**: Built-in security headers and validation
- **Database Security**: Parameterized queries and user data isolation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- API keys: [CoinGecko](https://coingecko.com/api), [OpenRouter](https://openrouter.ai)

### Installationurrency sentiment analysis platform with unified crypto management and real-time data

![Dashboard Preview](public/CryptoSentiment.png)

**Live Demo:** [https://lavish-patience-production-f0a0.up.railway.app](https://lavish-patience-production-f0a0.up.railway.app)

## ✨ Features

- 🤖 **AI Sentiment Analysis** - Real-time sentiment scoring with OpenRouter LLMs
- 📊 **Live Market Data** - Real-time prices and market data from CoinGecko
- 🎯 **Unified Crypto Management** - Single interface for both watching and holdings cryptocurrency
- 📈 **Portfolio Analytics** - Comprehensive performance tracking and insights
- 💹 **Price Visualization** - SVG-based charts for price trends and volume
- � **Seamless Conversion** - Easy switching between watch-only and holdings modes
- 🔐 **Secure Authentication** - Google OAuth + Magic Link email auth with NextAuth.js
- 📱 **Responsive Design** - Mobile-first with shadcn/ui components
- 🚨 **Alert System** - Custom notifications across multiple channels
- 📈 **Type-Safe API** - Full-stack TypeScript with tRPC
- 💳 **Subscription Management** - Stripe integration with feature gating

*View [full feature list](docs/IMPLEMENTATION_CHECKLIST.md) for detailed capabilities and roadmap.*

## 🔧 Tech Stack

**Frontend:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui  
**Backend:** tRPC, Prisma, PostgreSQL, NextAuth.js  
**AI/Data:** OpenRouter, CoinGecko, WhaleAlert, NewsData.io  
**Analytics:** Portfolio tracking, performance metrics, SVG visualization  
**Payments:** Stripe subscription management with feature gating  
**Testing:** Jest (754 tests, 56 suites, 100% pass rate)  
**Deployment:** Railway, Docker

## � Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm
- PostgreSQL database
- API keys: [CoinGecko](https://coingecko.com/api), [OpenRouter](https://openrouter.ai)

### Installation

```bash
# Clone and install
git clone https://github.com/wjamestaylor/cryptosentiment.git
cd cryptosentiment
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your API keys and database URL

# Setup database
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

*For detailed setup instructions, see [Development Setup](DEVELOPMENT_SETUP.md).*

## � Tech Stack

**Frontend:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui  
**Backend:** tRPC, Prisma, PostgreSQL, NextAuth.js  
**AI/Data:** OpenRouter, CoinGecko, WhaleAlert, NewsData.io  
**Testing:** Jest (606+ tests, 42 suites, 100% pass rate)  
**Deployment:** Railway, Docker

*View [Test Coverage Report](docs/TEST_COVERAGE_REPORT.md) for quality metrics.*

## ⚙️ Configuration

### Environment Variables

Core requirements for `.env.local`:

```bash
# Database
DATABASE_URL="postgresql://..."

# Authentication  
NEXTAUTH_SECRET="your-secret-key"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# APIs
OPENROUTER_API_KEY="sk-or-..."  # AI analysis
COINGECKO_API_KEY="CG-..."     # Crypto data (optional)
```

*See [Security Setup](SECURITY-SETUP.md) for complete configuration guide.*

### Development Commands

```bash
npm run dev          # Start development server  
npm run build        # Build for production
npm run test         # Run test suite
npm run db:studio    # Database admin interface
npm run lint         # ESLint with auto-fix
```

## 📚 Documentation

- **[Implementation Checklist](docs/IMPLEMENTATION_CHECKLIST.md)** - Development progress and feature roadmap
- **[Development Setup](DEVELOPMENT_SETUP.md)** - Environment configuration and troubleshooting
- **[Unified Crypto System](docs/UNIFIED_CRYPTO_MANAGEMENT_SYSTEM.md)** - Technical architecture and implementation
- **[Security Setup](SECURITY-SETUP.md)** - Security configuration and best practices
- **[Test Coverage](docs/TEST_COVERAGE_REPORT.md)** - Quality metrics and testing patterns

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following our coding standards
4. Add tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Submit a pull request

### Development Standards
- **TypeScript**: Strict mode with comprehensive type definitions
- **Testing**: Required for all new features and bug fixes
- **Code Style**: ESLint + Prettier with automated formatting
- **API Design**: Follow tRPC patterns with Zod validation
- **Components**: Use shadcn/ui patterns with proper TypeScript interfaces

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **CoinGecko** for comprehensive cryptocurrency data
- **OpenRouter** for AI/LLM sentiment analysis capabilities
- **Vercel** for Next.js framework and deployment platform
- **shadcn/ui** for beautiful, accessible component library
- **Railway** for reliable production hosting

---

*Built with ❤️ by the CryptoSentiment team*
## ⚙️ Configuration

### Environment Variables

Core requirements for `.env.local`:

```bash
# Database
DATABASE_URL="postgresql://..."

# Authentication  
NEXTAUTH_SECRET="your-secret-key"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# APIs
OPENROUTER_API_KEY="sk-or-..."  # AI analysis
COINGECKO_API_KEY="CG-..."     # Crypto data (optional)

# Email Service
RESEND_API_KEY="re_..."        # Email authentication and notifications

# Bot Integration (Optional)
DISCORD_BOT_TOKEN="your-discord-bot-token"
TELEGRAM_BOT_TOKEN="your-telegram-bot-token"

# Stripe (Optional)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

*See [Security Setup](SECURITY-SETUP.md) for complete configuration guide.*

### Development Commands

```bash
npm run dev          # Start development server  
npm run build        # Build for production
npm run test         # Run test suite
npm run test:bots    # Test bot integration
npm run db:studio    # Database admin interface
npm run lint         # ESLint with auto-fix
```

## 🚀 Deployment

### Railway (Production)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway link
railway up
```

### Docker
```bash
docker build -t cryptosentiment .
docker run -p 3000:3000 cryptosentiment
```

*For production deployment guide, see [Railway Deployment](RAILWAY_DEPLOYMENT.md).*

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Implementation Checklist](docs/IMPLEMENTATION_CHECKLIST.md) | Complete development progress and roadmap |
| [Development Setup](DEVELOPMENT_SETUP.md) | Detailed setup and installation guide |
| [Bot Setup Guide](docs/BOT_SETUP_GUIDE.md) | Discord and Telegram bot configuration |
| [Security Setup](SECURITY-SETUP.md) | Security configuration and best practices |
| [Test Coverage](docs/TEST_COVERAGE_REPORT.md) | Quality metrics and testing patterns |

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following our coding standards
4. Add tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Submit a pull request

### Development Standards
- **TypeScript**: Strict mode with comprehensive type definitions
- **Testing**: Required for all new features and bug fixes (936+ tests)
- **Code Style**: ESLint + Prettier with automated formatting
- **API Design**: Follow tRPC patterns with Zod validation
- **Components**: Use shadcn/ui patterns with proper TypeScript interfaces

Read the [Implementation Checklist](docs/IMPLEMENTATION_CHECKLIST.md) for current priorities and development status.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **CoinGecko** for comprehensive cryptocurrency data
- **OpenRouter** for AI/LLM sentiment analysis capabilities
- **Resend** for reliable email delivery service
- **Railway** for seamless production hosting
- **shadcn/ui** for beautiful, accessible component library

---

*Built with ❤️ for the crypto community - **CryptoSentiment: Real-time crypto sentiment analysis powered by AI***
