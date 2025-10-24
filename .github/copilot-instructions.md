# CryptoSentiment - GitHub Copilot Instructions

## 📋 Project Overview
**CryptoSentiment** is a production-ready cryptocurrency sentiment analysis platform that provides AI-powered insights, real-time market data, and portfolio management. The platform is built with type safety and production reliability as core principles.

**Live URL**: https://lavish-patience-production-f0a0.up.railway.app  
**Deployment**: Railway with Docker support  
**Status**: ✅ Production (Google OAuth), 936+ tests passing, CI/CD active

### Core Principles
1. **Live Data Only** - NEVER use sample/fake data; all information must come from live APIs (CoinGecko, OpenRouter)
2. **Type Safety First** - Full TypeScript coverage with strict mode, Zod validation for all inputs
3. **Test Coverage** - Maintain 80%+ coverage; write tests for all new features
4. **Production Ready** - All code must be production-grade with proper error handling

## 🛠️ Tech Stack and Dependencies

### Frontend
- **Framework**: Next.js 15.5.4 (App Router)
- **Language**: TypeScript 5.x (strict mode)
- **UI Library**: React 19.1.0
- **Styling**: Tailwind CSS 3.4.18 + shadcn/ui components
- **State**: Zustand 5.0.8 for client state
- **Forms**: React Hook Form 7.64.0 + Zod 4.1.12 validation

### Backend
- **API**: tRPC 11.6.0 (type-safe RPC)
- **Database**: PostgreSQL with Prisma 6.17.0 ORM
- **Auth**: NextAuth.js 4.24.11 (Google OAuth only)
- **Email**: Resend 6.2.0 for transactional emails
- **Payments**: Stripe 19.1.0 with subscription management

### External Services
- **Crypto Data**: CoinGecko API (free tier supported)
- **AI Analysis**: OpenRouter API (multiple LLM providers)
- **Bots**: Discord.js 14.23.2, node-telegram-bot-api 0.66.0

### Development Tools
- **Build**: Next.js with Turbopack (faster builds)
- **Testing**: Jest 30.2.0 + Testing Library 16.3.0
- **Linting**: ESLint 9 + Prettier 3.6.2
- **Package Manager**: npm 8.0.0+
- **Node Version**: 18.0.0+

## 📁 Project Structure

### Directory Organization
```
/src
├── /app                    # Next.js App Router pages (dashboard, pricing, alerts)
├── /components            # React components
│   ├── /ui               # shadcn/ui components (Button, Dialog, etc.)
│   └── /...              # Feature components (CryptoCard, PortfolioChart)
├── /server/api
│   ├── /routers          # tRPC routers (crypto, auth, alerts, sentiment)
│   └── trpc.ts           # tRPC configuration
├── /services             # External API integrations
│   ├── /crypto           # CoinGecko, price services
│   ├── /ai               # OpenRouter, sentiment analysis
│   ├── /bots             # Discord, Telegram integrations
│   └── /email            # ResendEmailService
├── /lib                  # Utilities, database, auth helpers
├── /hooks                # React hooks (useAuth, useCrypto)
└── /__tests__            # Test files mirroring src structure

/prisma                   # Database schema and migrations
/public                   # Static assets
/docs                     # Implementation guides and reports
```

### Key Files
- `src/lib/crypto-mappings.ts` - Symbol ↔ CoinGecko ID conversions (ALWAYS use this)
- `src/server/api/root.ts` - Main tRPC router
- `src/lib/db.ts` - Prisma client singleton
- `prisma/schema.prisma` - Database schema

## 🏗️ Coding Guidelines & Architecture

### Service Layer Pattern (MANDATORY)
**Reference**: `/src/services/crypto/price.service.ts` - Use as template for ALL external API integrations
```typescript
export class CoinGeckoService {
  private async request<T>(endpoint: string): Promise<T> {
    // Standard error handling, optional API keys, rate limiting
  }
}
```
- Private `request()` method for centralized error handling and logging
- Support optional API keys (free tier friendly)
- TypeScript generics for return types
- Rate limiting consideration for free APIs

### tRPC Integration (REQUIRED)
**Reference**: `/src/server/api/routers/crypto.ts` - Follow this exact pattern:
```typescript
export const cryptoRouter = createTRPCRouter({
  getTopCryptos: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50) }))
    .query(async ({ input }) => {
      // Direct fetch for simple cases, service classes for complex APIs
      return { success: true, data: results };
    }),
});
```
- **Input validation**: Always use Zod schemas with proper constraints
- **Procedure types**: `publicProcedure` for data, `protectedProcedure` for user actions
- **Response format**: Consistent `{ success: boolean, data: T }` structure
- **Error handling**: Let tRPC handle errors with proper error formatting in `trpc.ts`

### Database Integration (PRISMA)
**Key Pattern**: Always include related data in queries to avoid N+1 problems
```typescript
const followedCryptos = await ctx.prisma.followedCoin.findMany({
  where: { userId },
  include: { crypto: true }, // Always include relations
});
```
- Use `upsert` for create-or-update patterns
- Leverage Prisma's type safety with proper includes

## 🧪 Testing Guidelines

### Testing Strategy
**Current Status**: 936+ tests, 56 suites, 100% passing, 80%+ coverage

### Test Structure
```typescript
// Service Tests - Mock global fetch
describe('CoinGeckoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('should fetch crypto price', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ bitcoin: { usd: 50000 } }),
    });

    const service = new CoinGeckoService();
    const result = await service.getPrice('bitcoin');
    
    expect(result).toEqual({ bitcoin: { usd: 50000 } });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/simple/price'),
      expect.any(Object)
    );
  });
});

// Component Tests - Use Testing Library
describe('CryptoCard', () => {
  it('should display crypto data', () => {
    render(<CryptoCard name="Bitcoin" symbol="BTC" price={50000} />);
    expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    expect(screen.getByText('$50,000')).toBeInTheDocument();
  });
});

// tRPC Tests - Mock Prisma with jest-mock-extended
const mockPrisma = mockDeep<PrismaClient>();
```

### Testing Requirements
- **All new features** must include tests
- **Services**: Test success AND error scenarios
- **Components**: Test rendering and user interactions
- **tRPC routers**: Mock Prisma, test validation
- **Utilities**: 100% coverage for utility functions

### Test Commands
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode for TDD
npm run test:coverage # Generate coverage report
```

## 🔧 Build, Development & Deployment

### Essential Commands
```bash
# Development
npm run dev              # Start dev server with Turbopack (faster)
npm run lint             # Run ESLint with auto-fix
npm run type-check       # TypeScript type checking

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema changes (dev)
npm run db:migrate       # Create migration (dev)
npm run db:studio        # Visual database admin

# Testing
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report

# Production
npm run build            # Production build with Turbopack
npm start                # Start production server
npm run prod:setup       # Production setup (Railway)
```

### Build Process
- **Development**: Uses Turbopack for faster hot reload
- **Production**: Standalone output for Docker compatibility
- **Image Optimization**: Disabled to avoid Railway permission issues
- **Build Time**: ~2-3 minutes (Turbopack optimization)

### Deployment (Railway)
1. Push to main branch triggers auto-deployment
2. Railway runs: `npm ci && npm run db:generate && npm run db:migrate:deploy && npm run build`
3. Health check on port 3000
4. Zero-downtime deployment

### Environment Variables (Required)
```bash
DATABASE_URL="postgresql://..."           # Required
NEXTAUTH_SECRET="your-secret"            # Required  
NEXTAUTH_URL="https://your-domain.com"   # Required for production
GOOGLE_CLIENT_ID="google-oauth-id"       # Required
GOOGLE_CLIENT_SECRET="google-secret"     # Required
OPENROUTER_API_KEY="sk-or-..."          # AI analysis
COINGECKO_API_KEY="CG-..."              # Optional (free tier works)
STRIPE_SECRET_KEY="sk_..."              # Required for payments
```

### Data Flow Pattern
```typescript
// Correct Flow:
User Action → tRPC Client → Router (validation) → Service Class → External API
                                    ↓
                              Prisma (database)

// Example: Getting crypto price
// 1. Frontend calls tRPC
const { data } = trpc.crypto.getPrice.useQuery({ symbol: 'BTC' });

// 2. Router validates and delegates
export const cryptoRouter = createTRPCRouter({
  getPrice: publicProcedure
    .input(z.object({ symbol: z.string() }))
    .query(async ({ input }) => {
      const coinGeckoId = getCoinGeckoId(input.symbol); // Convert symbol
      const price = await coinGeckoService.getPrice(coinGeckoId);
      return { success: true, data: price };
    }),
});

// 3. Service handles API call
class CoinGeckoService {
  async getPrice(id: string) {
    return this.request<PriceData>(`/simple/price?ids=${id}`);
  }
}
```

### Naming Conventions
- **Files**: kebab-case (`crypto-service.ts`, `price-chart.tsx`)
- **Components**: PascalCase (`CryptoCard`, `PriceChart`)
- **Functions/Variables**: camelCase (`getCryptoPrice`, `userPortfolio`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`, `MAX_RETRIES`)
- **Interfaces**: PascalCase with descriptive names (`CryptoCurrency`, `UserPortfolio`)

### TypeScript Guidelines
- Use explicit return types for all functions
- Prefer interfaces over types for object shapes
- Use Zod schemas for runtime validation
- Never use `any` - use `unknown` if type is truly unknown
- Leverage discriminated unions for complex state

## ✅ Best Practices - Do This

### API Integration
✅ **USE service classes** for all external API calls
```typescript
// Good
const service = new CoinGeckoService();
const price = await service.getPrice('bitcoin');

// Bad - Don't use fetch directly in components
const response = await fetch('https://api.coingecko.com/...');
```

✅ **ALWAYS convert crypto symbols** to CoinGecko IDs
```typescript
import { getCoinGeckoId } from '@/lib/crypto-mappings';

const coinId = getCoinGeckoId('BTC'); // Returns 'bitcoin'
const price = await service.getPrice(coinId);
```

✅ **USE tRPC for all client-server communication**
```typescript
// Frontend
const { data } = trpc.crypto.getTopCryptos.useQuery({ limit: 50 });

// Don't use REST endpoints or direct database access
```

✅ **INCLUDE Prisma relations** to avoid N+1 queries
```typescript
const followedCryptos = await ctx.prisma.followedCoin.findMany({
  where: { userId },
  include: { crypto: true }, // Include related data
});
```

✅ **USE Zod for input validation**
```typescript
.input(z.object({
  symbol: z.string().min(1).max(10).toUpperCase(),
  limit: z.number().min(1).max(100).default(50),
}))
```

### Component Development
✅ **USE TypeScript interfaces** for all component props
```typescript
interface CryptoCardProps {
  name: string;
  symbol: string;
  price: number;
  change24h?: number;
}

export function CryptoCard({ name, symbol, price, change24h }: CryptoCardProps) {
  // Component code
}
```

✅ **USE shadcn/ui components** from `/src/components/ui/`
```typescript
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
```

✅ **USE the cn() utility** for conditional classes
```typescript
import { cn } from '@/lib/utils';

<div className={cn(
  "base-class",
  condition && "conditional-class",
  anotherCondition ? "true-class" : "false-class"
)} />
```

### Error Handling
✅ **HANDLE errors in service classes**
```typescript
private async request<T>(endpoint: string): Promise<T> {
  try {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}
```

## ❌ Avoid These Common Mistakes

### Data & APIs
❌ **NEVER use sample/fake data** (strict project policy)
```typescript
// Bad - Don't hardcode data
const cryptos = [{ name: 'Bitcoin', price: 50000 }];

// Good - Always fetch from live APIs
const cryptos = await coinGeckoService.getTopCryptos();
```

❌ **NEVER skip error handling** in service classes
❌ **NEVER use direct fetch** in components (use service layer)
❌ **NEVER query database directly** from components (use tRPC)
❌ **NEVER commit API keys** to version control
❌ **NEVER use `any` type** without a very good reason

### Database
❌ **NEVER forget to include relations** (causes N+1 queries)
```typescript
// Bad
const coins = await prisma.followedCoin.findMany({ where: { userId } });
// Then: coins.map(coin => fetch coin.crypto separately) // N+1!

// Good
const coins = await prisma.followedCoin.findMany({
  where: { userId },
  include: { crypto: true }, // Fetch in one query
});
```

❌ **NEVER skip input validation** on tRPC endpoints
❌ **NEVER use raw SQL** unless absolutely necessary (use Prisma)

### Testing
❌ **NEVER skip tests** for new features
❌ **NEVER test only the happy path** (test errors too)
❌ **NEVER modify tests** to make them pass (fix the code)

## 🔐 Security Guidelines

### Authentication
- **Google OAuth ONLY** - Email auth is disabled due to NextAuth issues
- **Protected routes** use `protectedProcedure` in tRPC
- **Session validation** handled by NextAuth middleware

### Security Headers
Configured in `next.config.ts`:
- Content Security Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

### API Key Management
- Store in environment variables
- Never commit to git
- Use optional API keys for free tier support
- Rotate keys regularly

### Data Validation
- Always use Zod schemas for input validation
- Sanitize user inputs
- Validate on both client and server
- Use TypeScript for compile-time safety

## 📚 Additional Resources & Documentation

### Implementation Documentation
- **[Implementation Checklist](docs/IMPLEMENTATION_CHECKLIST.md)** - Development progress, current priorities, and feature status
- **[Development Setup](DEVELOPMENT_SETUP.md)** - Environment setup, troubleshooting, and local development
- **[Test Coverage Report](docs/TEST_COVERAGE_REPORT.md)** - Quality metrics, testing patterns, and coverage goals
- **[Security Setup](SECURITY-SETUP.md)** - Security configuration, best practices, and compliance

### Feature-Specific Guides
- **[Bot Implementation Guide](docs/BOT_IMPLEMENTATION_GUIDE.md)** - Discord and Telegram bot setup
- **[Subscription Implementation](docs/SUBSCRIPTION_IMPLEMENTATION.md)** - Stripe integration and feature gating
- **[Alert System Enhancement](docs/ALERT_SYSTEM_ENHANCEMENT_SUMMARY.md)** - Alert management and email delivery
- **[Unified Crypto Management](docs/UNIFIED_CRYPTO_MANAGEMENT_SYSTEM.md)** - Portfolio and watchlist integration

### External Documentation
- [Next.js 15 Docs](https://nextjs.org/docs) - App Router, Server Components
- [tRPC Documentation](https://trpc.io/docs) - Type-safe API development
- [Prisma Docs](https://www.prisma.io/docs) - Database ORM and migrations
- [shadcn/ui](https://ui.shadcn.com/) - UI component library
- [CoinGecko API](https://www.coingecko.com/en/api/documentation) - Crypto data endpoints
- [OpenRouter API](https://openrouter.ai/docs) - AI/LLM integration

## 🎯 Current Development Focus

**Phase**: Core Systems Complete - UI Polish & Feature Enhancement  
**Last Updated**: October 2025

### Recently Completed ✅
- Email Authentication System with ResendEmailService
- Subscription Feature Gating with usage tracking
- Analytics Dashboard Enhancement
- Alert Management Interface
- Bot Integration Testing (Discord & Telegram)

### Active Development 🚧
- UI consistency improvements
- Mobile responsiveness enhancements
- Performance optimization
- User experience refinements

### Next Priorities 📋
- Advanced analytics features
- Enhanced portfolio management
- Real-time notifications
- Mobile app considerations

---

## 💡 Tips for Working with This Codebase

1. **Start with the tests** - Run `npm test` to understand expected behavior
2. **Use the service layer** - Never skip the service abstraction
3. **Check crypto-mappings.ts** - Always convert symbols to CoinGecko IDs
4. **Follow tRPC patterns** - Look at existing routers for examples
5. **Maintain test coverage** - Write tests alongside features
6. **Use TypeScript strictly** - Enable strict mode, avoid `any`
7. **Check implementation docs** - Refer to `/docs` for detailed guides
8. **Test locally first** - Verify changes work before pushing
9. **Use Turbopack** - Faster builds during development
10. **Monitor production** - Check Railway logs for deployment issues