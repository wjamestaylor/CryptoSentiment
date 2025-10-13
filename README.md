# CryptoSentiment 🚀

A comprehensive cryptocurrency sentiment analysis platform that leverages AI-powered analysis, real-time data, and intelligent notifications to help traders and enthusiasts make informed decisions.

## 📸 Platform Preview

| Dashboard | Watchlist | AI Analysis |
|-----------|-----------|-------------|
| ![Dashboard](public/CryptoSentiment.png) | Real-time crypto tracking | AI-powered sentiment analysis |

## 🌟 Features

### Core Features
- **AI-Powered Sentiment Analysis**: Real-time sentiment scoring using OpenRouter's advanced LLM models with comprehensive market data analysis
- **Smart Watchlist Management**: Follow cryptocurrencies with one-click AI analysis, visual indicators, and real-time sync
- **Live Market Data**: Real-time cryptocurrency prices, market caps, and 24h changes from CoinGecko
- **Intelligent Dashboard**: Personalized overview of followed cryptocurrencies with instant access to analysis
- **Secure Authentication**: Email-based login with NextAuth.js and database session management
- **Type-Safe API**: Full-stack TypeScript with tRPC for guaranteed type safety across all endpoints

### Advanced Analytics
- **Multi-Source Analysis**: Combines price data, market trends, and sentiment indicators
- **Historical Tracking**: Monitor sentiment trends and price correlations over time
- **Source Attribution**: All analysis includes verifiable data sources and timestamps
- **Real-Time Processing**: Live data updates with no cached or stale information

### Alert & Notification System
- **Custom Alert Creation**: Set personalized thresholds for price, sentiment, and volume changes
- **Multi-Channel Notifications**: Email, push notifications, Discord, and Telegram integration
- **Whale Activity Monitoring**: Track large transactions and their potential market impact
- **News Impact Analysis**: Real-time correlation between news sentiment and price movements

### Data Integration
- **CoinGecko API**: Live cryptocurrency market data and pricing information
- **OpenRouter AI**: Advanced language models for sentiment analysis and market insights
- **WhaleAlert**: Large transaction monitoring for market movement prediction
- **NewsData.io**: Real-time cryptocurrency news aggregation and sentiment scoring

### User Management
- **Secure Authentication**: NextAuth.js with email provider
- **Session Management**: Database-backed sessions with proper security
- **User Preferences**: Customizable notification settings and thresholds
- **Portfolio Tracking**: Follow and monitor your favorite cryptocurrencies

### 📋 Implementation Progress

*For detailed implementation progress, see [Implementation Checklist](docs/IMPLEMENTATION_CHECKLIST.md)*alysis platform that leverages AI-powered analysis, real-time data, and intelligent notifications to help traders and enthusiasts make informed decisions.

## 🔒 Data Integrity

**CryptoSentiment NEVER uses sample data.** All displayed information comes from live, verified sources:
- **Live Cryptocurrency Data**: Real-time prices from CoinGecko API
- **Authentic AI Analysis**: Live sentiment analysis from OpenRouter
- **Real User Data**: Genuine user preferences and watchlists
- **No Fallbacks**: Services fail gracefully without fake data

See our [No Sample Data Policy](docs/NO_SAMPLE_DATA_POLICY.md) for complete details.

## 🛠 Tech Stack

### Frontend Architecture
- **Next.js 15** with App Router for modern React development
- **TypeScript** with strict type checking for reliability
- **Tailwind CSS** for responsive, utility-first styling
- **shadcn/ui** for consistent, accessible UI components
- **React Query** for efficient data fetching and caching
- **Zustand** for lightweight state management

### Backend Infrastructure
- **tRPC** for end-to-end type safety between client and server
- **Prisma ORM** with PostgreSQL for robust data management
- **NextAuth.js** for secure authentication and session handling
- **Zod** for runtime data validation and schema enforcement

### External Integrations
- **OpenRouter API** for advanced AI language model access
- **CoinGecko API** for comprehensive cryptocurrency market data
- **WhaleAlert API** for large transaction monitoring
- **NewsData.io API** for real-time cryptocurrency news aggregation

### Development & Testing
- **Jest** with comprehensive test coverage (606+ tests, 100% passing)
- **42 test suites** covering hooks, services, components, and utilities
- **Complete tRPC router coverage** with all integration tests passing
- **ESLint** and **Prettier** for code quality and consistency
- **Turbopack** for fast development builds
## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** and npm/yarn/pnpm
- **PostgreSQL database** (local or hosted)
- **API keys** for external services (CoinGecko, OpenRouter)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/wjamestaylor/cryptosentiment.git
   cd cryptosentiment
   ```

2. **Install dependencies**
   ```bash
   npm install
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your API keys and database URLs in `.env.local`

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages and layouts
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard pages
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/            # Reusable UI components
│   ├── ui/               # Basic UI components (shadcn/ui)
│   ├── auth/             # Authentication components
│   ├── crypto/           # Cryptocurrency-related components
│   └── dashboard/        # Dashboard-specific components
├── lib/                  # Utility functions and configurations
│   ├── api/              # API client configurations
│   ├── auth/             # Authentication configuration
│   ├── db/               # Database connection and utilities
│   └── utils/            # General utility functions
├── services/             # Business logic and external API integrations
│   ├── ai/               # OpenRouter AI service
│   ├── crypto/           # Cryptocurrency data services
│   ├── notifications/    # Notification services
│   └── webhooks/         # Webhook handlers
├── types/                # TypeScript type definitions
├── hooks/                # Custom React hooks
├── stores/               # State management (Zustand)
└── middleware/           # Next.js middleware
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `REDIS_URL` | Redis connection string | ✅ |
| `NEXTAUTH_SECRET` | NextAuth.js secret | ✅ |
| `OPENROUTER_API_KEY` | OpenRouter API key | ✅ |
| `WHALEALERT_API_KEY` | WhaleAlert API key | ✅ |
| `NEWSDATA_API_KEY` | NewsData.io API key | ✅ |
| `STRIPE_SECRET_KEY` | Stripe secret key | ✅ |
| `DISCORD_BOT_TOKEN` | Discord bot token | ⚠️ |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token | ⚠️ |

### Subscription Tiers

| Tier | Features | Price |
|------|----------|-------|
| **Free** | 2 watchlist items, 1 sentiment checks, no notifications | $0/month |
| **Basic** | 5 watchlist items,  | $9/month |
| **Pro** | Unlimited alerts, advanced analytics | $29/month |
| **Enterprise** | Custom limits, API access | Custom |

## 🤖 Bot Integration

### Discord Bot
Set up a Discord application and bot to receive sentiment alerts in your Discord servers.

### Telegram Bot
Create a Telegram bot using BotFather to get real-time notifications on Telegram.

## 📊 API Documentation

The platform provides a RESTful API for enterprise users:

- `GET /api/sentiment/{crypto}` - Get sentiment analysis
- `GET /api/prices/{crypto}` - Get price data
- `POST /api/alerts` - Create new alert
- `GET /api/user/portfolio` - Get user's portfolio

Full API documentation available at `/docs` when running the application.

## 🔒 Security

- **Rate Limiting**: Protects against abuse
- **Input Validation**: All inputs validated with Zod
- **CSRF Protection**: Built-in CSRF protection
- **Secure Headers**: Content Security Policy and other security headers
- **Data Encryption**: Sensitive data encrypted at rest

## 🚀 Deployment

### Railway (Recommended)

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on git push

### Docker

```bash
docker build -t cryptosentiment .
docker run -p 3000:3000 cryptosentiment
```

## 🧪 Quality & Testing

CryptoSentiment is built with comprehensive testing to ensure reliability and data accuracy.

### Test Commands
```bash
# Run all tests
npm run test

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode during development
npm run test:watch
```

### Quality Metrics
- **606+ automated tests** across 42 test suites covering all core functionality
- **100% test pass rate** with comprehensive router integration testing
- **Comprehensive service testing** for all external API integrations (95%+ average)
- **UI component testing** with React Testing Library (85%+ coverage)
- **Type safety** enforced with strict TypeScript configuration
- **Code quality** maintained with ESLint and Prettier

## � Security & Privacy

- **Secure Authentication**: Industry-standard session management with NextAuth.js
- **Data Protection**: No sample data - all information is live and verified
- **API Security**: Rate limiting and input validation on all endpoints
- **Privacy Compliant**: GDPR-ready user data handling
- **Environment Security**: Secure API key management and environment isolation

## 📚 Documentation

- **[Implementation Checklist](docs/IMPLEMENTATION_CHECKLIST.md)**: Development progress and roadmap
- **[No Sample Data Policy](docs/NO_SAMPLE_DATA_POLICY.md)**: Data integrity guidelines
- **[Development Setup](DEVELOPMENT_SETUP.md)**: Detailed setup instructions
- **[Security Setup](SECURITY-SETUP.md)**: Security configuration guide
- **[Test Coverage Report](docs/TEST_COVERAGE_REPORT.md)**: Comprehensive testing overview

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

Please read our [Implementation Checklist](docs/IMPLEMENTATION_CHECKLIST.md) to understand the current development status and priorities.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenRouter** for AI/LLM services
- **CoinGecko** for comprehensive cryptocurrency data
- **WhaleAlert** for whale transaction monitoring
- **NewsData.io** for news aggregation
- **Vercel** and **Railway** for deployment platforms
- **The open-source community** for amazing tools and libraries

## 📞 Support & Community

- **Documentation**: Browse the `/docs` folder for detailed guides
- **Issues**: Report bugs or request features via GitHub Issues
- **Discussions**: Join conversations in GitHub Discussions
- **Development**: See [Implementation Checklist](docs/IMPLEMENTATION_CHECKLIST.md) for contributing

---

**CryptoSentiment** - AI-Powered Cryptocurrency Sentiment Analysis Platform# Updated at Tue 14 Oct 2025 08:39:29 AM NZDT
