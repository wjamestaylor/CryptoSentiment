# CryptoSentiment AI Development Assistant

## Project Context & Identity
**CryptoSentiment** is a production-ready cryptocurrency sentiment analysis platform deployed on Railway with Google OAuth authentication. The platform prioritizes **live data accuracy**, **type safety**, and **production reliability**.

**Current Status**: ✅ Google OAuth working, ❌ Email auth disabled (NextAuth issues), 606+ tests passing  
**Live URL**: https://lavish-patience-production-f0a0.up.railway.app  
**Tech Stack**: Next.js 15 + App Router, TypeScript, Prisma, PostgreSQL, tRPC, Tailwind CSS + shadcn/ui, Jest, Turbopack  
**Core Principle**: NEVER use sample/fake data - all information must come from live APIs

## 🏗️ Architecture Rules

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

### Testing Strategy (MANDATORY)
**Reference**: `/src/__tests__/services/coingecko.test.ts` - Follow these exact patterns:
```typescript
global.fetch = jest.fn(); // Global mock setup

beforeEach(() => {
  jest.clearAllMocks();
});

(fetch as jest.Mock).mockResolvedValueOnce({
  ok: true,
  json: async () => mockResponse,
});
```
- Global fetch mocking pattern for all service tests
- Test both success AND error scenarios
- Use `jest-mock-extended` for Prisma mocking
- Current status: 606+ tests, 42 suites, 100% passing

## 🚀 Development Workflow

### Essential Commands
```bash
npm run dev          # Start with Turbopack (faster dev builds)
npm test             # Run all 606+ tests
npm run test:watch   # Watch mode for TDD
npm run db:studio    # Visual database admin
npm run lint         # ESLint with auto-fix
```

### Build Process
- **Turbopack**: Used for both dev (`--turbopack`) and build for speed
- **Production**: Uses `output: 'standalone'` for Docker compatibility
- **Image optimization**: Disabled in production to avoid cache permission issues

### Component Development
- **UI Library**: shadcn/ui components in `/src/components/ui/`
- **Pattern**: TypeScript interfaces for all props
- **Styling**: Tailwind CSS with `cn()` utility for conditional classes

## 🔐 Environment & Security

### Required Environment Variables
```bash
DATABASE_URL="postgresql://..."           # Required
NEXTAUTH_SECRET="your-secret"            # Required  
GOOGLE_CLIENT_ID="google-oauth-id"       # Required (email auth disabled)
GOOGLE_CLIENT_SECRET="google-secret"     # Required
OPENROUTER_API_KEY="sk-or-..."          # AI analysis
COINGECKO_API_KEY="CG-..."              # Crypto data (optional)
```

### Security Headers
Configured in `next.config.ts` with CSP, frame options, and content-type protection.

## 🗺️ Project Structure Deep Dive

### Key Directories
- `/src/services/`: External API integrations (crypto, ai, bots, email, notifications)
- `/src/server/api/routers/`: tRPC endpoints (crypto, auth, alerts, sentiment)
- `/src/lib/`: Utilities, database, auth, and shared logic
- `/src/app/`: Next.js App Router pages (dashboard, pricing, alerts, etc.)
- `/docs/`: Implementation progress and guides

### Data Flow Pattern
1. **Frontend** → tRPC client → **Router** → Service class → External API
2. **Database** operations always through Prisma in routers
3. **Crypto mappings**: Use `/src/lib/crypto-mappings.ts` for symbol ↔ CoinGecko ID conversion

### Special Patterns
- **Crypto data**: Always convert symbols to CoinGecko IDs using `getCoinGeckoId()`
- **Authentication**: NextAuth with Google OAuth only (email auth disabled)
- **Subscriptions**: Stripe integration with feature gating in progress

## ✅ Do This / ❌ Avoid This

**✅ Follow Patterns:**
- Use service classes for external APIs (not direct fetch in components)
- Follow tRPC router patterns from `/src/server/api/routers/crypto.ts`
- Test patterns from `/src/__tests__/services/coingecko.test.ts`
- Always include Prisma relations to avoid N+1 queries
- Use TypeScript interfaces for all component props

**❌ Never Do:**
- Use sample/fake data (strict project policy - always live APIs)
- Skip error handling in service classes
- Direct database queries in components (use tRPC)
- Direct fetch calls (use service layer pattern)
- Commit API keys to version control

## 📚 Implementation Status & References

**Current Phase**: Feature gating and usage tracking (Phase 4)  
**Previous**: Stripe frontend integration complete

Key Documents:
- **[Implementation Checklist](docs/IMPLEMENTATION_CHECKLIST.md)**: Development progress and current priorities
- **[Development Setup](DEVELOPMENT_SETUP.md)**: Environment setup and troubleshooting  
- **[Test Coverage Report](docs/TEST_COVERAGE_REPORT.md)**: Quality metrics and testing patterns
- **[Security Setup](SECURITY-SETUP.md)**: Security configuration and best practices