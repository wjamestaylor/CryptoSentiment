# CryptoSentiment Development Instructions

## Project Overview
CryptoSentiment is a comprehensive cryptocurrency sentiment analysis platform built with Next.js 14, TypeScript, and modern web technologies. The platform provides AI-powered sentiment analysis, real-time price tracking, and notification services for cryptocurrency enthusiasts and traders.

## 🎯 Core Mission
Build a production-ready, monetizable platform that provides accurate, real-time cryptocurrency sentiment analysis by combining:
- AI-powered analysis (OpenRouter)
- Whale transaction monitoring (WhaleAlert)
- News sentiment analysis (NewsData.io)
- Real-time price data (CoinGecko/CoinMarketCap)
- Multi-channel notifications (Email, Discord, Telegram)

## 🛠 Development Guidelines

### Code Style and Standards
- **TypeScript First**: Use strict TypeScript for all code with comprehensive type checking
- **Functional Programming**: Prefer functional components with React hooks over class components
- **Error Boundaries**: Implement proper error boundaries and loading states throughout the app
- **Validation**: Use Zod for runtime type validation on all API boundaries
- **Testing**: Write tests for all business logic with >80% code coverage
- **Comments**: Document complex business logic and API integrations

### Architecture Patterns

#### 🏗 Layered Architecture
```
Presentation Layer → Business Logic Layer → Data Access Layer → External APIs
```

#### 🔄 Service Layer Pattern
- **API Services**: External API integrations (OpenRouter, WhaleAlert, NewsData.io)
- **Business Services**: Core business logic (sentiment analysis, alert processing)
- **Data Services**: Database operations and caching
- **Notification Services**: Email, push, Discord, Telegram notifications

#### 📊 Event-Driven Architecture
- Use event emitters for real-time updates
- Implement pub/sub pattern for notifications
- Queue system for background processing

#### 🏷 Repository Pattern
- Abstract data access through repository interfaces
- Separate concerns between UI, business logic, and data access
- Enable easy testing with mock implementations

### File Organization & Structure
```
src/
├── app/                    # Next.js App Router pages and layouts
│   ├── (auth)/            # Authentication pages (login, register, verify)
│   ├── (dashboard)/       # Dashboard pages (overview, portfolio, alerts)
│   ├── (marketing)/       # Marketing pages (landing, pricing, about)
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── crypto/        # Cryptocurrency data endpoints
│   │   ├── sentiment/     # Sentiment analysis endpoints
│   │   ├── alerts/        # Alert management endpoints
│   │   ├── webhooks/      # External webhook handlers
│   │   └── trpc/          # tRPC router
│   ├── globals.css        # Global styles and Tailwind imports
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Landing page
├── components/            # Reusable UI components
│   ├── ui/               # Basic UI components (shadcn/ui based)
│   │   ├── button.tsx    # Button component with variants
│   │   ├── input.tsx     # Form input components
│   │   ├── card.tsx      # Card layout component
│   │   └── ...           # Other shadcn/ui components
│   ├── auth/             # Authentication-specific components
│   │   ├── login-form.tsx
│   │   ├── register-form.tsx
│   │   └── auth-guard.tsx
│   ├── crypto/           # Cryptocurrency-related components
│   │   ├── coin-card.tsx
│   │   ├── price-chart.tsx
│   │   ├── sentiment-meter.tsx
│   │   └── whale-activity.tsx
│   ├── dashboard/        # Dashboard-specific components
│   │   ├── dashboard-nav.tsx
│   │   ├── stats-overview.tsx
│   │   ├── recent-alerts.tsx
│   │   └── portfolio-summary.tsx
│   ├── forms/            # Form components
│   ├── charts/           # Chart and data visualization components
│   └── layout/           # Layout components (header, footer, sidebar)
├── lib/                  # Utility functions and configurations
│   ├── api/              # API client configurations and helpers
│   │   ├── coingecko.ts  # CoinGecko API client
│   │   ├── openrouter.ts # OpenRouter AI client
│   │   ├── whalealert.ts # WhaleAlert API client
│   │   └── newsdata.ts   # NewsData.io API client
│   ├── auth/             # Authentication configuration
│   │   ├── nextauth.ts   # NextAuth.js configuration
│   │   └── permissions.ts # Role-based access control
│   ├── db/               # Database connection and utilities
│   │   ├── prisma.ts     # Prisma client configuration
│   │   └── migrations/   # Custom migration utilities
│   ├── utils/            # General utility functions
│   │   ├── index.ts      # Core utilities (cn, formatters, etc.)
│   │   ├── crypto.ts     # Crypto-specific utilities
│   │   ├── date.ts       # Date formatting utilities
│   │   └── validation.ts # Zod validation schemas
│   ├── trpc/             # tRPC setup and configuration
│   └── stripe/           # Stripe payment utilities
├── services/             # Business logic and external API integrations
│   ├── ai/               # AI and sentiment analysis services
│   │   ├── openrouter.service.ts    # OpenRouter integration
│   │   ├── sentiment.service.ts     # Sentiment analysis logic
│   │   └── prompt.service.ts        # AI prompt management
│   ├── crypto/           # Cryptocurrency data services
│   │   ├── price.service.ts         # Price data aggregation
│   │   ├── market.service.ts        # Market data processing
│   │   └── portfolio.service.ts     # User portfolio management
│   ├── notifications/    # Notification services
│   │   ├── email.service.ts         # Email notifications
│   │   ├── push.service.ts          # Push notifications
│   │   ├── discord.service.ts       # Discord bot integration
│   │   └── telegram.service.ts      # Telegram bot integration
│   ├── webhooks/         # Webhook handlers
│   │   ├── stripe.service.ts        # Stripe webhook handling
│   │   ├── whalealert.service.ts    # WhaleAlert webhook handling
│   │   └── webhook.service.ts       # Generic webhook utilities
│   ├── alerts/           # Alert system services
│   │   ├── alert.service.ts         # Alert processing logic
│   │   ├── trigger.service.ts       # Alert trigger evaluation
│   │   └── queue.service.ts         # Alert queue management
│   └── subscription/     # Subscription and billing services
│       ├── stripe.service.ts        # Stripe subscription management
│       └── billing.service.ts       # Billing logic
├── types/                # TypeScript type definitions
│   ├── index.ts          # Core type definitions
│   ├── api.ts            # API response types
│   ├── database.ts       # Database model types
│   └── external.ts       # External API types
├── hooks/                # Custom React hooks
│   ├── use-auth.ts       # Authentication hooks
│   ├── use-crypto.ts     # Cryptocurrency data hooks
│   ├── use-sentiment.ts  # Sentiment analysis hooks
│   ├── use-alerts.ts     # Alert management hooks
│   └── use-subscription.ts # Subscription hooks
├── stores/               # State management (Zustand)
│   ├── auth.store.ts     # Authentication state
│   ├── crypto.store.ts   # Cryptocurrency data state
│   ├── ui.store.ts       # UI state (theme, modals, etc.)
│   └── notification.store.ts # Notification state
├── middleware/           # Next.js middleware
│   ├── auth.ts           # Authentication middleware
│   ├── rate-limit.ts     # Rate limiting middleware
│   └── cors.ts           # CORS configuration
└── styles/               # Global styles and Tailwind configs
    ├── globals.css       # Global CSS imports
    └── components.css    # Component-specific styles
```

### API Integration Guidelines

#### 🔑 Environment Variables & Security
- **Never commit API keys**: Use environment variables for all secrets
- **Validate environment**: Implement runtime environment validation
- **Key rotation**: Plan for API key rotation and updates
- **Rate limiting**: Implement both client-side and server-side rate limiting

#### 🔄 Error Handling & Resilience
- **Exponential backoff**: Implement retry logic with exponential backoff
- **Circuit breaker**: Prevent cascading failures with circuit breaker pattern
- **Graceful degradation**: Fallback to cached data when APIs are unavailable
- **Error categorization**: Distinguish between retryable and non-retryable errors

#### 📊 Caching Strategy
- **Redis caching**: Cache API responses with appropriate TTL
- **Cache invalidation**: Implement smart cache invalidation strategies
- **Background refresh**: Update cached data in background for seamless UX
- **Cache hierarchies**: Multiple cache layers (memory, Redis, CDN)

#### 📝 Logging & Monitoring
- **Structured logging**: Use structured logs for all API interactions
- **Request tracking**: Track request/response times and success rates
- **Error tracking**: Integrate with Sentry for error monitoring
- **Performance monitoring**: Monitor API performance and bottlenecks

### Database Best Practices

#### 🗄 Prisma & PostgreSQL
- **Type safety**: Leverage Prisma's type generation for full type safety
- **Query optimization**: Use Prisma's query optimization features
- **Connection pooling**: Implement connection pooling for production
- **Migration strategy**: Use Prisma migrations for schema changes

#### 📈 Performance Optimization
- **Indexing strategy**: Index frequently queried fields and foreign keys
- **Query optimization**: Avoid N+1 queries, use includes and selects wisely
- **Pagination**: Implement cursor-based pagination for large datasets
- **Database monitoring**: Monitor query performance and slow queries

#### 🔒 Data Security & Compliance
- **Soft deletes**: Implement soft deletes for user data (GDPR compliance)
- **Data encryption**: Encrypt sensitive data at rest
- **Audit logging**: Track data changes for compliance
- **Backup strategy**: Implement automated database backups

### Security Requirements

#### 🛡 Authentication & Authorization
- **Multi-factor authentication**: Support 2FA for enhanced security
- **Session management**: Secure session handling with proper expiration
- **Role-based access**: Implement granular permission system
- **API key management**: Secure API key generation and management

#### 🔐 Input Validation & Sanitization
- **Zod validation**: Validate all inputs with Zod schemas
- **SQL injection prevention**: Use parameterized queries (Prisma handles this)
- **XSS prevention**: Sanitize user-generated content
- **CSRF protection**: Implement CSRF tokens for state-changing operations

#### 🌐 Network Security
- **HTTPS enforcement**: Force HTTPS in production
- **Content Security Policy**: Implement strict CSP headers
- **CORS configuration**: Properly configure CORS policies
- **Rate limiting**: Implement rate limiting per user and IP

### Performance Optimization

#### ⚡ Frontend Performance
- **Next.js optimizations**: Leverage Next.js built-in optimizations
- **Image optimization**: Use Next.js Image component for optimal loading
- **Code splitting**: Implement route-based and component-based code splitting
- **Bundle analysis**: Regular bundle size analysis and optimization

#### 🚀 Backend Performance
- **API response times**: Target <200ms for API responses
- **Database query optimization**: Optimize slow queries and reduce load
- **Caching layers**: Multi-level caching (memory, Redis, CDN)
- **Background processing**: Move heavy operations to background jobs

#### 📱 User Experience
- **Loading states**: Implement meaningful loading states and skeletons
- **Error states**: Provide clear error messages and recovery options
- **Responsive design**: Ensure excellent mobile experience
- **Accessibility**: Follow WCAG guidelines for accessibility

### Testing Requirements

#### 🧪 Testing Strategy
- **Unit tests**: Test all business logic and utility functions
- **Integration tests**: Test API endpoints and database operations
- **Component tests**: Test React components with React Testing Library
- **E2E tests**: Test critical user flows with Cypress or Playwright

#### 📊 Coverage Requirements
- **Code coverage**: Maintain >80% code coverage
- **Critical path coverage**: 100% coverage for payment and security code
- **API testing**: Test all API endpoints with various scenarios
- **Performance testing**: Regular load testing for scalability

#### 🔍 Quality Assurance
- **Code reviews**: Mandatory code reviews for all changes
- **Automated testing**: Run tests on every commit and deployment
- **Security scanning**: Regular security vulnerability scans
- **Performance monitoring**: Continuous performance monitoring

### Real-Time Features & WebSockets

#### 🔄 Real-Time Data
- **WebSocket connections**: For real-time price updates and alerts
- **Server-Sent Events**: For one-way real-time updates
- **Optimistic updates**: Update UI immediately, sync with server
- **Connection resilience**: Handle connection drops and reconnections

#### 📢 Notification System
- **Multi-channel**: Email, push, Discord, Telegram notifications
- **User preferences**: Granular notification preference controls
- **Delivery tracking**: Track notification delivery and engagement
- **Rate limiting**: Prevent notification spam

### Monitoring and Logging

#### 📊 Application Monitoring
- **Error tracking**: Comprehensive error tracking with Sentry
- **Performance monitoring**: Application performance monitoring (APM)
- **User analytics**: Privacy-compliant user behavior tracking
- **Health checks**: Automated health check endpoints

#### 📝 Logging Strategy
- **Structured logging**: JSON-formatted logs for easy parsing
- **Log levels**: Appropriate log levels (error, warn, info, debug)
- **Sensitive data**: Never log sensitive information (API keys, passwords)
- **Log aggregation**: Centralized log collection and analysis

### Development Workflow

#### 🔄 Git Workflow
- **Feature branches**: Use feature branches for all development
- **Conventional commits**: Follow conventional commit message format
- **Pull requests**: Mandatory code reviews through PRs
- **Automated checks**: Run tests, linting, and security checks on PRs

#### 🚀 Deployment Strategy
- **Railway deployment**: Use Railway for hosting and deployment
- **Environment segregation**: Separate dev, staging, and production environments
- **Database migrations**: Safe database migration strategy
- **Rollback capability**: Quick rollback procedures for emergencies

#### 📦 Dependency Management
- **Security updates**: Regular dependency security updates
- **Version pinning**: Pin dependency versions for reproducible builds
- **Audit regularly**: Regular security audits of dependencies
- **Update strategy**: Systematic approach to dependency updates

## 🎯 AI Integration Best Practices

### OpenRouter Integration
- **Prompt engineering**: Optimize prompts for crypto sentiment analysis
- **Response validation**: Validate AI responses with Zod schemas
- **Fallback strategies**: Handle AI service outages gracefully
- **Cost optimization**: Monitor and optimize AI API usage costs

### Sentiment Analysis
- **Multi-source analysis**: Combine news, social media, and whale data
- **Confidence scoring**: Provide confidence levels for all analysis
- **Historical tracking**: Track sentiment trends over time
- **Source attribution**: Always provide sources for sentiment scores

## 🔧 External API Integration Patterns

### CoinGecko/CoinMarketCap
- **Data normalization**: Normalize data from different price APIs
- **Redundancy**: Use multiple price sources for reliability
- **Real-time updates**: WebSocket connections for real-time prices
- **Historical data**: Efficient storage and retrieval of historical prices

### WhaleAlert Integration
- **Webhook handling**: Process whale alert webhooks in real-time
- **Data validation**: Validate whale transaction data
- **Impact analysis**: Analyze whale activity impact on sentiment
- **Alert triggers**: Trigger user alerts based on whale activity

### NewsData.io Integration
- **Content filtering**: Filter crypto-relevant news content
- **Duplicate detection**: Detect and handle duplicate news articles
- **Relevance scoring**: Score news relevance to specific cryptocurrencies
- **Real-time processing**: Process news articles as they arrive

## 🎨 UI/UX Guidelines

### Design System
- **Consistent components**: Use shadcn/ui as base component library
- **Crypto-themed design**: Design elements that resonate with crypto users
- **Dark mode**: Default to dark mode with light mode option
- **Responsive design**: Mobile-first responsive design approach

### User Experience
- **Onboarding flow**: Smooth user onboarding and setup
- **Progressive disclosure**: Reveal features progressively based on user needs
- **Data visualization**: Clear charts and graphs for crypto data
- **Performance feedback**: Real-time feedback on user actions

## 📱 Mobile & PWA Features

### Progressive Web App
- **PWA setup**: Configure service worker and manifest
- **Offline functionality**: Basic offline functionality for critical features
- **Push notifications**: Web push notifications for alerts
- **Install prompt**: Encourage users to install the PWA

### Mobile Optimization
- **Touch-friendly**: Large touch targets and mobile-optimized interactions
- **Performance**: Optimize for mobile network conditions
- **Battery usage**: Minimize battery drain from real-time features
- **Native feel**: App-like experience on mobile devices

## 🔄 Continuous Improvement

### User Feedback
- **Feedback collection**: Built-in feedback collection mechanisms
- **User analytics**: Track feature usage and user behavior
- **A/B testing**: Test new features and improvements
- **Community engagement**: Build and engage with user community

### Performance Optimization
- **Regular audits**: Regular performance and security audits
- **Monitoring**: Continuous monitoring of key metrics
- **Optimization cycles**: Regular optimization cycles based on data
- **Scaling planning**: Plan for horizontal and vertical scaling

## Progress Tracking

- [x] ✅ Verify copilot-instructions.md file creation
- [x] ✅ Project requirements clarified
- [x] ✅ Project scaffolded with Next.js
- [x] ✅ Customize project structure
- [x] ✅ Create comprehensive documentation
- [ ] ⏳ Install required dependencies
- [ ] ⏳ Set up development environment
- [ ] ⏳ Implement authentication system
- [ ] ⏳ Build core UI components
- [ ] ⏳ Integrate external APIs
- [ ] ⏳ Implement sentiment analysis engine
- [ ] ⏳ Build notification system
- [ ] ⏳ Implement subscription and billing
- [ ] ⏳ Deploy to Railway