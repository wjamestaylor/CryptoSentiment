# CryptoSentiment - GitHub Copilot Instructions

## 📋 Project Overview
Production-ready cryptocurrency sentiment analysis platform with AI insights, real-time market data, and portfolio management. Built with type safety and production reliability as core principles.

**Live**: https://lavish-patience-production-f0a0.up.railway.app | **Status**: ✅ 936+ tests passing

### Core Principles
1. **Live Data Only** - NEVER use sample/fake data; always use live APIs (CoinGecko, OpenRouter)
2. **Type Safety First** - Full TypeScript strict mode, Zod validation for all inputs
3. **Test Coverage** - Maintain 80%+ coverage; write tests for all new features
4. **Production Ready** - Proper error handling in all code

## 🛠️ Tech Stack
**Frontend**: Next.js 15.5.4, React 19, TypeScript 5, Tailwind CSS 3.4.18, shadcn/ui, Zustand 5.0.8  
**Backend**: tRPC 11.6.0, Prisma 6.17.0, PostgreSQL, NextAuth.js 4.24.11 (Google OAuth only)  
**External**: CoinGecko API, OpenRouter API, Discord.js 14.23.2, Telegram bots  
**Dev Tools**: Jest 30.2.0, ESLint 9, Prettier 3.6.2, Turbopack

## 📁 Key Structure
```
/src/app          # Next.js pages
/src/components   # React components + /ui (shadcn)
/src/server/api   # tRPC routers
/src/services     # External API integrations
/src/lib          # Utilities, database, auth
/src/__tests__    # Test files
```

**Critical Files**: `src/lib/crypto-mappings.ts` (symbol conversions), `src/server/api/root.ts` (main router), `src/lib/db.ts` (Prisma client)

## 🏗️ Architecture Patterns

### Service Layer (MANDATORY)
All external API calls use service classes. Reference: `/src/services/crypto/price.service.ts`

```typescript
export class CoinGeckoService {
  private async request<T>(endpoint: string): Promise<T> {
    // Centralized error handling, optional API keys, rate limiting
  }
}
```

### tRPC Integration (REQUIRED)
Reference: `/src/server/api/routers/crypto.ts`

```typescript
export const cryptoRouter = createTRPCRouter({
  getTopCryptos: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50) }))
    .query(async ({ input }) => {
      return { success: true, data: results };
    }),
});
```

**Rules**:
- Always use Zod schemas for input validation
- `publicProcedure` for data, `protectedProcedure` for user actions
- Consistent `{ success: boolean, data: T }` response format
- Let tRPC handle errors with proper formatting

### Database (Prisma)
**Always include relations** to avoid N+1 queries:

```typescript
const followedCryptos = await ctx.prisma.followedCoin.findMany({
  where: { userId },
  include: { crypto: true }, // Include relations
});
```

## 🧪 Testing
**Status**: 936+ tests, 56 suites, 100% passing, 80%+ coverage

```typescript
// Service tests - Mock global fetch
describe('CoinGeckoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });
  
  it('should fetch price', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ bitcoin: { usd: 50000 } }),
    });
    // ... assertions
  });
});

// Component tests - Testing Library
describe('CryptoCard', () => {
  it('should display data', () => {
    render(<CryptoCard name="Bitcoin" symbol="BTC" price={50000} />);
    expect(screen.getByText('Bitcoin')).toBeInTheDocument();
  });
});
```

**Requirements**: All new features must include tests for success AND error scenarios.

## 🔧 Essential Commands
```bash
npm run dev              # Dev server with Turbopack
npm test                 # Run all tests
npm run test:watch       # TDD watch mode
npm run lint             # ESLint with auto-fix
npm run type-check       # TypeScript validation
npm run db:generate      # Generate Prisma client
npm run db:studio        # Visual database admin
npm run build            # Production build
```

## 📐 Naming Conventions
- **Files**: kebab-case (`crypto-service.ts`)
- **Components**: PascalCase (`CryptoCard`)
- **Functions**: camelCase (`getCryptoPrice`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Interfaces**: PascalCase (`CryptoCurrency`)

## ✅ Do This

### API Integration
```typescript
// ✅ Good - Use service classes
const service = new CoinGeckoService();
const price = await service.getPrice('bitcoin');

// ❌ Bad - Direct fetch in components
const response = await fetch('https://api.coingecko.com/...');
```

### Crypto Symbols
```typescript
// ✅ Good - Always convert symbols to CoinGecko IDs
import { getCoinGeckoId } from '@/lib/crypto-mappings';
const coinId = getCoinGeckoId('BTC'); // Returns 'bitcoin'
```

### Database Queries
```typescript
// ✅ Good - Include relations
const coins = await prisma.followedCoin.findMany({
  where: { userId },
  include: { crypto: true },
});

// ❌ Bad - Missing relations (causes N+1)
const coins = await prisma.followedCoin.findMany({ where: { userId } });
```

### Component Props
```typescript
// ✅ Good - TypeScript interfaces
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

### UI Components
```typescript
// ✅ Good - Use shadcn/ui components
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';

// ✅ Good - Use cn() utility for conditional classes
import { cn } from '@/lib/utils';
<div className={cn("base", condition && "conditional")} />
```

## ❌ Never Do This

- **NEVER use sample/fake data** - Strict project policy, always use live APIs
- **NEVER skip error handling** in service classes
- **NEVER use direct fetch** in components - Use service layer
- **NEVER query database directly** from components - Use tRPC
- **NEVER commit API keys** to version control
- **NEVER use `any` type** - Use `unknown` if type is truly unknown
- **NEVER skip input validation** on tRPC endpoints
- **NEVER skip tests** for new features
- **NEVER test only the happy path** - Test errors too

## 🔐 Security
- **Auth**: Google OAuth only via NextAuth.js (`protectedProcedure` for auth routes)
- **Validation**: Always use Zod schemas, validate on client AND server
- **Headers**: CSP, X-Frame-Options, X-Content-Type-Options configured in `next.config.ts`
- **API Keys**: Store in env variables, never commit, support optional keys for free tiers

## 📚 Documentation
- [Implementation Checklist](docs/IMPLEMENTATION_CHECKLIST.md) - Development progress
- [Test Coverage](docs/TEST_COVERAGE_REPORT.md) - Testing patterns
- [Development Setup](DEVELOPMENT_SETUP.md) - Environment setup
- [Security Setup](SECURITY-SETUP.md) - Security config

## 💡 Quick Tips
1. Run `npm test` first to understand expected behavior
2. Always convert crypto symbols using `crypto-mappings.ts`
3. Follow tRPC patterns from existing routers
4. Use TypeScript strict mode, avoid `any`
5. Check `/docs` for detailed implementation guides
